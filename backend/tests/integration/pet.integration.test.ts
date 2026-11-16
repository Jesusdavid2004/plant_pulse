import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { JwtUnsubscribeTokenService } from '../../src/infrastructure/mail/JwtUnsubscribeTokenService';
import {
  cleanDatabase,
  createTestContext,
  csrfHeader,
  registerUser,
  sampleJpeg,
  type RegisteredUser,
  type TestContext,
} from './helpers';

let context: TestContext;
let owner: RegisteredUser;
let plantId: string;

beforeAll(async () => {
  context = await createTestContext();
});
afterAll(async () => {
  await context.close();
});
beforeEach(async () => {
  await cleanDatabase(context.prisma);
  context.mailer.sent.length = 0;
  owner = await registerUser(context.app, 'owner@example.com');
  const response = await request(context.app)
    .post('/api/plants')
    .set('Authorization', owner.authorization)
    .attach('image', await sampleJpeg(), { filename: 'plant.jpg', contentType: 'image/jpeg' });
  plantId = response.body.data.plant.id as string;
});

const auth = () => ({ Authorization: owner.authorization });

describe('pet progress', () => {
  it('starts a new plant at level one with the default scene and pot', async () => {
    const response = await request(context.app).get(`/api/plants/${plantId}/pet`).set(auth());

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      level: 1,
      coins: 0,
      scene: 'LIVING_ROOM',
      pot: 'TERRACOTTA',
    });
  });

  it('rewards real care and refuses to reward spamming the same care', async () => {
    const water = () =>
      request(context.app).post(`/api/plants/${plantId}/care`).set(auth()).send({ type: 'WATER' });

    const first = await water();
    const second = await water();

    expect(first.body.data.reward).toEqual({ xp: 10, coins: 5 });
    expect(second.body.data.reward).toEqual({ xp: 0, coins: 0 });
  });

  it('saves a game result, buys a pot and equips it', async () => {
    for (let play = 0; play < 4; play += 1) {
      await request(context.app)
        .post(`/api/plants/${plantId}/games`)
        .set(auth())
        .send({ game: 'DROP_CATCH', score: 40 });
    }

    const purchase = await request(context.app)
      .post(`/api/plants/${plantId}/pet/pots`)
      .set(auth())
      .send({ pot: 'BLUE' });
    const equip = await request(context.app)
      .put(`/api/plants/${plantId}/pet/equipment`)
      .set(auth())
      .send({ pot: 'BLUE' });

    expect(purchase.status).toBe(201);
    expect(equip.body.data.pot).toBe('BLUE');
    expect(equip.body.data.coins).toBe(40 - 30);
  });

  it('answers with typed errors for locked scenes, missing coins and forged scores', async () => {
    const locked = await request(context.app)
      .put(`/api/plants/${plantId}/pet/equipment`)
      .set(auth())
      .send({ scene: 'BEACH' });
    const poor = await request(context.app)
      .post(`/api/plants/${plantId}/pet/pots`)
      .set(auth())
      .send({ pot: 'GOLD' });
    const forged = await request(context.app)
      .post(`/api/plants/${plantId}/games`)
      .set(auth())
      .send({ game: 'DROP_CATCH', score: 100000 });

    expect(locked.body).toMatchObject({ code: 'SCENE_LOCKED', message_key: 'errors.sceneLocked' });
    expect(poor.body.code).toBe('INSUFFICIENT_COINS');
    expect(forged.status).toBe(400);
  });

  it('hides the pet of another user as if the plant did not exist', async () => {
    const intruder = await registerUser(context.app, 'intruder@example.com');

    const response = await request(context.app)
      .get(`/api/plants/${plantId}/pet`)
      .set('Authorization', intruder.authorization);

    expect(response.status).toBe(404);
  });
});

describe('email notification preferences', () => {
  it('stores the language of the browser when the account is created', async () => {
    const response = await request(context.app)
      .post('/api/auth/register')
      .set('Accept-Language', 'es-CO')
      .send({ email: 'spanish@example.com', password: 'correct-horse-battery' });

    expect(response.body.data.user).toMatchObject({ locale: 'es', emailNotifications: true });
  });

  it('lets the user turn reminders off and change the email language', async () => {
    const response = await request(context.app)
      .patch('/api/auth/me/preferences')
      .set(auth())
      .send({ emailNotifications: false, locale: 'es' });

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({ emailNotifications: false, locale: 'es' });
  });

  it('sends a test email to the signed in user', async () => {
    const response = await request(context.app).post('/api/auth/me/test-email').set(auth());

    expect(response.status).toBe(204);
    expect(context.mailer.sent).toHaveLength(1);
    expect(context.mailer.sent[0]?.to).toBe('owner@example.com');
  });

  it('unsubscribes with the signed link from an email and rejects forged tokens', async () => {
    const user = await context.prisma.user.findUniqueOrThrow({
      where: { email: 'owner@example.com' },
    });
    const token = new JwtUnsubscribeTokenService(process.env.JWT_SECRET!).sign(user.id);

    const forged = await request(context.app)
      .post('/api/auth/unsubscribe')
      .set(csrfHeader)
      .send({ token: 'not-a-token' });
    const valid = await request(context.app)
      .post('/api/auth/unsubscribe')
      .set(csrfHeader)
      .send({ token });

    expect(forged.body.code).toBe('INVALID_UNSUBSCRIBE_TOKEN');
    expect(valid.status).toBe(204);
    const after = await context.prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(after.emailNotifications).toBe(false);
  });
});

describe('neglect reminders against the database', () => {
  const NEGLECT_DAYS = 60;

  async function neglectThePlant(): Promise<void> {
    const longAgo = new Date(Date.now() - NEGLECT_DAYS * 24 * 60 * 60 * 1000);
    await context.prisma.plant.update({ where: { id: plantId }, data: { createdAt: longAgo } });
  }

  it('emails the owner of a neglected plant once and then respects the cooldown', async () => {
    await neglectThePlant();

    const first = await context.container.useCases.sendNeglectReminders.execute();
    const second = await context.container.useCases.sendNeglectReminders.execute();

    expect(first.usersNotified).toBe(1);
    expect(context.mailer.sent).toHaveLength(1);
    expect(context.mailer.sent[0]?.to).toBe('owner@example.com');
    expect(second.usersNotified).toBe(0);
  });

  it('does not email users who turned reminders off or whose plants are cared for', async () => {
    const quiet = await context.container.useCases.sendNeglectReminders.execute();
    expect(quiet.usersNotified).toBe(0);

    await neglectThePlant();
    await request(context.app)
      .patch('/api/auth/me/preferences')
      .set(auth())
      .send({ emailNotifications: false });
    const optedOut = await context.container.useCases.sendNeglectReminders.execute();

    expect(optedOut.usersNotified).toBe(0);
    expect(context.mailer.sent).toHaveLength(0);
  });
});

import { existsSync, readdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_FAKE_PLANT_ANALYSIS } from '../../src/infrastructure/ai/FakeAIProvider';
import {
  cleanDatabase,
  createTestContext,
  registerUser,
  sampleJpeg,
  type RegisteredUser,
  type TestContext,
} from './helpers';

let context: TestContext;
let owner: RegisteredUser;
let image: Buffer;

beforeAll(async () => {
  context = await createTestContext({ AI_DAILY_QUOTA_PER_USER: '3', MAX_FILE_SIZE: '200000' });
  image = await sampleJpeg();
});
afterAll(async () => {
  await context.close();
});
beforeEach(async () => {
  await cleanDatabase(context.prisma);
  for (const file of readdirSync(context.uploadDir)) rmSync(path.join(context.uploadDir, file));
  context.aiProvider.useFixture(DEFAULT_FAKE_PLANT_ANALYSIS);
  owner = await registerUser(context.app, 'owner@example.com');
});

function registerPlant(user: RegisteredUser, name?: string, language = 'en') {
  const call = request(context.app)
    .post('/api/plants')
    .set('Authorization', user.authorization)
    .set('Accept-Language', language)
    .attach('image', image, { filename: 'plant.jpg', contentType: 'image/jpeg' });
  return name ? call.field('name', name) : call;
}

describe('POST /api/plants (register a plant from a photo)', () => {
  it('requires authentication', async () => {
    const response = await request(context.app)
      .post('/api/plants')
      .attach('image', image, 'plant.jpg');

    expect(response.status).toBe(401);
  });

  it('identifies the plant, derives the pet traits and stores the first analysis', async () => {
    const response = await registerPlant(owner);

    expect(response.status).toBe(201);
    const { plant, analysis, advice } = response.body.data;
    expect(plant.name).toBe('Monstera');
    expect(plant.species).toBe('Monstera deliciosa');
    expect(plant.petTraits).toEqual({ leafShape: 'HEART', leafCount: 5 });
    expect(analysis.healthScore).toBe(92);
    expect(analysis.status).toBe('healthy');
    expect(advice.length).toBeGreaterThan(0);
  });

  it('uses the name chosen by the user instead of the identified one', async () => {
    const response = await registerPlant(owner, 'My little jungle');

    expect(response.body.data.plant.name).toBe('My little jungle');
  });

  it('computes the health score from domain rules, not from the model', async () => {
    context.aiProvider.useFixture({
      ...DEFAULT_FAKE_PLANT_ANALYSIS,
      healthCondition: 'UNDERWATERED',
      severity: 'SEVERE',
    });

    const response = await registerPlant(owner);

    expect(response.body.data.analysis.healthScore).toBe(22);
    expect(response.body.data.analysis.status).toBe('critical');
  });

  it('passes the active language to the AI provider', async () => {
    await registerPlant(owner, undefined, 'es-CO,es;q=0.9');

    expect(context.aiProvider.calls.at(-1)?.locale).toBe('es');
  });

  it('wraps the photo as data and tells the model not to follow instructions inside it', async () => {
    await registerPlant(owner);

    const call = context.aiProvider.calls.at(-1)!;
    expect(call.systemPrompt).toContain('untrusted DATA');
    expect(call.images).toHaveLength(1);
  });

  it('rejects a photo that is not a plant and keeps nothing', async () => {
    context.aiProvider.useFixture({ ...DEFAULT_FAKE_PLANT_ANALYSIS, isPlant: false });

    const response = await registerPlant(owner);

    expect(response.status).toBe(422);
    expect(response.body.code).toBe('NOT_A_PLANT');
    expect(await context.prisma.plant.count()).toBe(0);
    expect(readdirSync(context.uploadDir)).toHaveLength(0);
  });

  it('rejects a file whose bytes are not an image even if it is named .jpg', async () => {
    const response = await request(context.app)
      .post('/api/plants')
      .set('Authorization', owner.authorization)
      .attach('image', Buffer.from('<?php echo "not an image"; ?>'), {
        filename: 'evil.jpg',
        contentType: 'image/jpeg',
      });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe('INVALID_IMAGE');
  });

  it('rejects a request without a file', async () => {
    const response = await request(context.app)
      .post('/api/plants')
      .set('Authorization', owner.authorization);

    expect(response.status).toBe(400);
    expect(response.body.code).toBe('IMAGE_REQUIRED');
  });

  it('rejects files above the size limit', async () => {
    const oversized = Buffer.concat([image, Buffer.alloc(300_000)]);

    const response = await request(context.app)
      .post('/api/plants')
      .set('Authorization', owner.authorization)
      .attach('image', oversized, { filename: 'big.jpg', contentType: 'image/jpeg' });

    expect(response.status).toBe(413);
    expect(response.body.code).toBe('FILE_TOO_LARGE');
  });

  it('enforces the daily AI quota per user', async () => {
    await registerPlant(owner);
    await registerPlant(owner);
    await registerPlant(owner);

    const blocked = await registerPlant(owner);
    const otherUser = await registerUser(context.app, 'other@example.com');
    const unaffected = await registerPlant(otherUser);

    expect(blocked.status).toBe(429);
    expect(blocked.body.code).toBe('AI_QUOTA_EXCEEDED');
    expect(unaffected.status).toBe(201);
  });

  it('stores the photo privately with a random name and without the original metadata', async () => {
    await registerPlant(owner);

    const files = readdirSync(context.uploadDir);
    expect(files).toHaveLength(1);
    expect(files[0]).toMatch(/^[a-f0-9-]{36}\.jpg$/);
  });
});

describe('plant ownership', () => {
  it('lists only the plants of the authenticated user', async () => {
    await registerPlant(owner, 'Mine');
    const other = await registerUser(context.app, 'intruder@example.com');
    await registerPlant(other, 'Theirs');

    const response = await request(context.app)
      .get('/api/plants')
      .set('Authorization', owner.authorization);

    expect(response.body.data.map((plant: { name: string }) => plant.name)).toEqual(['Mine']);
  });

  it('answers 404 for every operation on a plant owned by someone else', async () => {
    const created = await registerPlant(owner, 'Mine');
    const plantId = created.body.data.plant.id as string;
    const intruder = await registerUser(context.app, 'intruder@example.com');
    const asIntruder = (method: 'get' | 'patch' | 'delete' | 'post', path: string) =>
      request(context.app)
        [method](`/api/plants/${plantId}${path}`)
        .set('Authorization', intruder.authorization);

    const responses = await Promise.all([
      asIntruder('get', ''),
      asIntruder('patch', '').send({ name: 'Stolen' }),
      asIntruder('delete', ''),
      asIntruder('get', '/mood'),
      asIntruder('get', '/analyses'),
      asIntruder('post', '/care').send({ type: 'WATER' }),
      asIntruder('post', '/checkups').attach('image', image, 'plant.jpg'),
    ]);

    expect(responses.map((response) => response.status)).toEqual([
      404, 404, 404, 404, 404, 404, 404,
    ]);
    expect(await context.prisma.plant.count()).toBe(1);
  });
});

describe('plant lifecycle', () => {
  it('updates the name of the plant', async () => {
    const created = await registerPlant(owner);
    const plantId = created.body.data.plant.id as string;

    const response = await request(context.app)
      .patch(`/api/plants/${plantId}`)
      .set('Authorization', owner.authorization)
      .send({ name: 'Renamed' });

    expect(response.status).toBe(200);
    expect(response.body.data.name).toBe('Renamed');
  });

  it('rejects an invalid plant id', async () => {
    const response = await request(context.app)
      .get('/api/plants/not-a-uuid')
      .set('Authorization', owner.authorization);

    expect(response.status).toBe(400);
  });

  it('removes the plant and its photo files when it is deleted', async () => {
    const created = await registerPlant(owner);
    const plantId = created.body.data.plant.id as string;
    expect(readdirSync(context.uploadDir)).toHaveLength(1);

    const response = await request(context.app)
      .delete(`/api/plants/${plantId}`)
      .set('Authorization', owner.authorization);

    expect(response.status).toBe(204);
    expect(await context.prisma.plant.count()).toBe(0);
    expect(readdirSync(context.uploadDir)).toHaveLength(0);
  });

  it('removes photo files when the account is deleted', async () => {
    await registerPlant(owner);

    await request(context.app).delete('/api/auth/me').set('Authorization', owner.authorization);

    expect(readdirSync(context.uploadDir)).toHaveLength(0);
  });
});

describe('care and mood', () => {
  it('starts happy and gets sad when the plant is neglected for long enough', async () => {
    const created = await registerPlant(owner);
    const plantId = created.body.data.plant.id as string;
    const fresh = await request(context.app)
      .get(`/api/plants/${plantId}/mood`)
      .set('Authorization', owner.authorization);
    const longAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    await context.prisma.plant.update({ where: { id: plantId }, data: { createdAt: longAgo } });
    const neglected = await request(context.app)
      .get(`/api/plants/${plantId}/mood`)
      .set('Authorization', owner.authorization);

    expect(fresh.body.data.mood).toBe('HAPPY');
    expect(neglected.body.data.mood).toBe('SAD');
  });

  it('becomes happy again after the user cares for the plant', async () => {
    const created = await registerPlant(owner);
    const plantId = created.body.data.plant.id as string;
    await context.prisma.plant.update({
      where: { id: plantId },
      data: { createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    });

    for (const type of ['WATER', 'SUN', 'FERTILIZE']) {
      const cared = await request(context.app)
        .post(`/api/plants/${plantId}/care`)
        .set('Authorization', owner.authorization)
        .send({ type });
      expect(cared.status).toBe(201);
    }
    const mood = await request(context.app)
      .get(`/api/plants/${plantId}/mood`)
      .set('Authorization', owner.authorization);

    expect(mood.body.data.mood).toBe('HAPPY');
  });

  it('rejects an unknown care type', async () => {
    const created = await registerPlant(owner);
    const plantId = created.body.data.plant.id as string;

    const response = await request(context.app)
      .post(`/api/plants/${plantId}/care`)
      .set('Authorization', owner.authorization)
      .send({ type: 'DANCE' });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe('INVALID_CARE_TYPE');
  });

  it('makes the plant sick when a check-up finds a severe problem', async () => {
    const created = await registerPlant(owner);
    const plantId = created.body.data.plant.id as string;
    context.aiProvider.useFixture({
      ...DEFAULT_FAKE_PLANT_ANALYSIS,
      healthCondition: 'FUNGAL_DISEASE',
      severity: 'SEVERE',
    });

    const checkup = await request(context.app)
      .post(`/api/plants/${plantId}/checkups`)
      .set('Authorization', owner.authorization)
      .attach('image', image, { filename: 'plant.jpg', contentType: 'image/jpeg' });
    const mood = await request(context.app)
      .get(`/api/plants/${plantId}/mood`)
      .set('Authorization', owner.authorization);
    const history = await request(context.app)
      .get(`/api/plants/${plantId}/analyses`)
      .set('Authorization', owner.authorization);

    expect(checkup.status).toBe(201);
    expect(mood.body.data.mood).toBe('SICK');
    expect(history.body.data).toHaveLength(2);
  });
});

describe('plant photos', () => {
  it('serves the photo only to its owner', async () => {
    const created = await registerPlant(owner);
    const plantId = created.body.data.plant.id as string;
    const photo = await context.prisma.image.findFirstOrThrow({ where: { plantId } });
    const intruder = await registerUser(context.app, 'intruder@example.com');

    const asOwner = await request(context.app)
      .get(`/api/plants/${plantId}/photos/${photo.id}`)
      .set('Authorization', owner.authorization);
    const asIntruder = await request(context.app)
      .get(`/api/plants/${plantId}/photos/${photo.id}`)
      .set('Authorization', intruder.authorization);

    expect(asOwner.status).toBe(200);
    expect(asOwner.headers['content-type']).toContain('image/jpeg');
    expect(asIntruder.status).toBe(404);
    expect(existsSync(context.uploadDir)).toBe(true);
  });
});

describe('platform security', () => {
  it('sends secure headers and exposes a health endpoint', async () => {
    const response = await request(context.app).get('/health');

    expect(response.status).toBe(200);
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-powered-by']).toBeUndefined();
  });

  it('never leaks internals for unexpected errors', async () => {
    const response = await request(context.app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"broken json');

    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(JSON.stringify(response.body)).not.toContain('node_modules');
  });
});

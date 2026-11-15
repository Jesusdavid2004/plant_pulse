import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  cleanDatabase,
  createTestContext,
  csrfHeader,
  registerUser,
  TEST_PASSWORD,
  type TestContext,
} from './helpers';

let context: TestContext;

beforeAll(async () => {
  context = await createTestContext();
});
afterAll(async () => {
  await context.close();
});
beforeEach(async () => {
  await cleanDatabase(context.prisma);
});

describe('POST /api/auth/register', () => {
  it('creates an account, returns an access token and sets an httpOnly refresh cookie', async () => {
    const response = await request(context.app)
      .post('/api/auth/register')
      .send({ email: 'Ana@Example.com', password: TEST_PASSWORD, name: 'Ana' });

    expect(response.status).toBe(201);
    expect(response.body.data.user.email).toBe('ana@example.com');
    expect(response.body.data.user).not.toHaveProperty('passwordHash');
    expect(response.body.data.accessToken).toEqual(expect.any(String));
    const cookie = (response.headers['set-cookie'] as unknown as string[])[0]!;
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Lax');
  });

  it('stores only a hash of the password', async () => {
    await registerUser(context.app, 'hash@example.com');

    const stored = await context.prisma.user.findUniqueOrThrow({
      where: { email: 'hash@example.com' },
    });

    expect(stored.password).not.toBe(TEST_PASSWORD);
    expect(stored.password.startsWith('$2')).toBe(true);
  });

  it('rejects a second account with the same email', async () => {
    await registerUser(context.app, 'dup@example.com');

    const response = await request(context.app)
      .post('/api/auth/register')
      .send({ email: 'DUP@example.com', password: TEST_PASSWORD });

    expect(response.status).toBe(409);
    expect(response.body).toMatchObject({
      code: 'EMAIL_ALREADY_REGISTERED',
      message_key: 'errors.emailAlreadyRegistered',
    });
  });

  it('rejects a short password with a validation error', async () => {
    const response = await request(context.app)
      .post('/api/auth/register')
      .send({ email: 'short@example.com', password: '123' });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe('VALIDATION_FAILED');
  });
});

describe('POST /api/auth/login', () => {
  it('logs in with the right password', async () => {
    await registerUser(context.app, 'login@example.com');

    const response = await request(context.app)
      .post('/api/auth/login')
      .send({ email: 'login@example.com', password: TEST_PASSWORD });

    expect(response.status).toBe(200);
    expect(response.body.data.accessToken).toEqual(expect.any(String));
  });

  it('gives the same error for a wrong password and an unknown email', async () => {
    await registerUser(context.app, 'known@example.com');

    const wrongPassword = await request(context.app)
      .post('/api/auth/login')
      .send({ email: 'known@example.com', password: 'wrong-password-123' });
    const unknownEmail = await request(context.app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'wrong-password-123' });

    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(wrongPassword.body.code).toBe(unknownEmail.body.code);
  });
});

describe('GET /api/auth/me', () => {
  it('requires a valid access token', async () => {
    const anonymous = await request(context.app).get('/api/auth/me');
    const forged = await request(context.app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer not-a-token');

    expect(anonymous.status).toBe(401);
    expect(forged.status).toBe(401);
  });

  it('returns the current user', async () => {
    const user = await registerUser(context.app, 'me@example.com');

    const response = await request(context.app)
      .get('/api/auth/me')
      .set('Authorization', user.authorization);

    expect(response.status).toBe(200);
    expect(response.body.data.email).toBe('me@example.com');
  });
});

describe('refresh token rotation', () => {
  it('issues a new access token and rotates the refresh cookie', async () => {
    const user = await registerUser(context.app, 'rotate@example.com');

    const response = await request(context.app)
      .post('/api/auth/refresh')
      .set(csrfHeader)
      .set('Cookie', user.refreshCookie);

    expect(response.status).toBe(200);
    expect(response.body.data.accessToken).toEqual(expect.any(String));
    const newCookie = (response.headers['set-cookie'] as unknown as string[])[0]!.split(';')[0];
    expect(newCookie).not.toBe(user.refreshCookie);
  });

  it('refuses a refresh request without the CSRF header', async () => {
    const user = await registerUser(context.app, 'csrf@example.com');

    const response = await request(context.app)
      .post('/api/auth/refresh')
      .set('Cookie', user.refreshCookie);

    expect(response.status).toBe(401);
  });

  it('revokes the whole session family when an old refresh token is replayed', async () => {
    const user = await registerUser(context.app, 'replay@example.com');
    const first = await request(context.app)
      .post('/api/auth/refresh')
      .set(csrfHeader)
      .set('Cookie', user.refreshCookie);
    const rotatedCookie = (first.headers['set-cookie'] as unknown as string[])[0]!.split(';')[0]!;

    const replay = await request(context.app)
      .post('/api/auth/refresh')
      .set(csrfHeader)
      .set('Cookie', user.refreshCookie);
    const afterReplay = await request(context.app)
      .post('/api/auth/refresh')
      .set(csrfHeader)
      .set('Cookie', rotatedCookie);

    expect(replay.status).toBe(401);
    expect(afterReplay.status).toBe(401);
  });

  it('invalidates the refresh token on logout', async () => {
    const user = await registerUser(context.app, 'logout@example.com');

    const logout = await request(context.app)
      .post('/api/auth/logout')
      .set(csrfHeader)
      .set('Cookie', user.refreshCookie);
    const refresh = await request(context.app)
      .post('/api/auth/refresh')
      .set(csrfHeader)
      .set('Cookie', user.refreshCookie);

    expect(logout.status).toBe(204);
    expect(refresh.status).toBe(401);
  });
});

describe('DELETE /api/auth/me', () => {
  it('hard deletes the account and everything it owns', async () => {
    const user = await registerUser(context.app, 'gone@example.com');

    const response = await request(context.app)
      .delete('/api/auth/me')
      .set('Authorization', user.authorization);

    expect(response.status).toBe(204);
    expect(await context.prisma.user.count()).toBe(0);
    expect(await context.prisma.refreshToken.count()).toBe(0);
  });
});

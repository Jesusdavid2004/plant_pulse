import { Router, type Request, type RequestHandler, type Response } from 'express';
import { z } from 'zod';
import type { Container } from '../../container';
import type { AppConfig } from '../../shared/config';
import { HTTP_STATUS, MILLISECONDS_PER_DAY, REFRESH_COOKIE_NAME } from '../../shared/constants';
import { requireAuth, requireCsrfHeader } from './middlewares';
import { currentUserId, parseOrThrow, sendData } from './support';

const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 72;
const MAX_NAME_LENGTH = 100;
const REFRESH_COOKIE_PATH = '/api/auth';

const registerSchema = z.object({
  email: z.email().max(254),
  password: z.string().min(MIN_PASSWORD_LENGTH).max(MAX_PASSWORD_LENGTH),
  name: z.string().trim().min(1).max(MAX_NAME_LENGTH).optional(),
});
const loginSchema = z.object({
  email: z.email().max(254),
  password: z.string().min(1).max(MAX_PASSWORD_LENGTH),
});

export function createAuthRouter(
  container: Container,
  config: AppConfig,
  authLimiter: RequestHandler,
): Router {
  const router = Router();
  const { useCases } = container;
  const requireUser = requireAuth(container.accessTokens);

  const cookieOptions = {
    httpOnly: true,
    secure: config.auth.cookieSecure,
    sameSite: config.auth.cookieSameSite,
    path: REFRESH_COOKIE_PATH,
  } as const;

  const setRefreshCookie = (res: Response, token: string): void => {
    res.cookie(REFRESH_COOKIE_NAME, token, {
      ...cookieOptions,
      maxAge: config.auth.refreshTokenDays * MILLISECONDS_PER_DAY,
    });
  };
  const refreshTokenFrom = (req: Request): string | undefined =>
    (req.cookies as Record<string, string | undefined>)[REFRESH_COOKIE_NAME];

  router.post('/register', authLimiter, async (req, res) => {
    const input = parseOrThrow(registerSchema, req.body);
    const session = await useCases.registerUser.execute({ ...input, name: input.name ?? null });
    setRefreshCookie(res, session.refreshToken);
    sendData(res, { user: session.user, accessToken: session.accessToken }, HTTP_STATUS.CREATED);
  });

  router.post('/login', authLimiter, async (req, res) => {
    const session = await useCases.loginUser.execute(parseOrThrow(loginSchema, req.body));
    setRefreshCookie(res, session.refreshToken);
    sendData(res, { user: session.user, accessToken: session.accessToken });
  });

  router.post('/refresh', authLimiter, requireCsrfHeader, async (req, res) => {
    const session = await useCases.refreshSession.execute({
      refreshToken: refreshTokenFrom(req) ?? '',
    });
    setRefreshCookie(res, session.refreshToken);
    sendData(res, { user: session.user, accessToken: session.accessToken });
  });

  router.post('/logout', requireCsrfHeader, async (req, res) => {
    await useCases.logoutUser.execute({ refreshToken: refreshTokenFrom(req) });
    res.clearCookie(REFRESH_COOKIE_NAME, cookieOptions);
    res.status(HTTP_STATUS.NO_CONTENT).end();
  });

  router.get('/me', requireUser, async (_req, res) => {
    sendData(res, await useCases.getCurrentUser.execute({ userId: currentUserId(res) }));
  });

  router.delete('/me', requireUser, async (_req, res) => {
    await useCases.deleteAccount.execute({ userId: currentUserId(res) });
    res.clearCookie(REFRESH_COOKIE_NAME, cookieOptions);
    res.status(HTTP_STATUS.NO_CONTENT).end();
  });

  return router;
}

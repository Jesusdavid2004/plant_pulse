import type { NextFunction, Request, RequestHandler, Response } from 'express';
import multer from 'multer';
import { ipKeyGenerator, rateLimit } from 'express-rate-limit';
import type { AccessTokenService } from '../../domain/auth/repositories';
import {
  DomainError,
  FileTooLargeError,
  ImageRequiredError,
  RateLimitedError,
  UnauthorizedError,
} from '../../domain/errors';
import {
  CSRF_HEADER_NAME,
  CSRF_HEADER_VALUE,
  HTTP_STATUS,
  MILLISECONDS_PER_SECOND,
  SECONDS_PER_MINUTE,
} from '../../shared/constants';
import { logger } from '../../shared/logger';

const BEARER_PREFIX = 'Bearer ';
const AUTH_WINDOW_MS = 15 * SECONDS_PER_MINUTE * MILLISECONDS_PER_SECOND;
const MINUTE_WINDOW_MS = SECONDS_PER_MINUTE * MILLISECONDS_PER_SECOND;

export function requireAuth(accessTokens: AccessTokenService): RequestHandler {
  return (req, res, next) => {
    const header = req.headers.authorization ?? '';
    const payload = header.startsWith(BEARER_PREFIX)
      ? accessTokens.verify(header.slice(BEARER_PREFIX.length))
      : null;
    if (!payload) {
      next(new UnauthorizedError());
      return;
    }
    res.locals.userId = payload.userId;
    next();
  };
}

export function requireCsrfHeader(req: Request, _res: Response, next: NextFunction): void {
  if (req.headers[CSRF_HEADER_NAME] !== CSRF_HEADER_VALUE) {
    next(new UnauthorizedError());
    return;
  }
  next();
}

function limiter(windowMs: number, limit: number, keyByUser: boolean): RequestHandler {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    keyGenerator: (req, res) =>
      keyByUser && res.locals.userId
        ? `user:${res.locals.userId as string}`
        : ipKeyGenerator(req.ip ?? ''),
    handler: (_req, _res, next) => next(new RateLimitedError()),
  });
}

export function createRateLimiters(limits: {
  authPer15Min: number;
  aiPerMinute: number;
  generalPerMinute: number;
}) {
  return {
    general: limiter(MINUTE_WINDOW_MS, limits.generalPerMinute, false),
    auth: limiter(AUTH_WINDOW_MS, limits.authPer15Min, false),
    ai: limiter(MINUTE_WINDOW_MS, limits.aiPerMinute, true),
  };
}

export function createImageUpload(maxFileSize: number): RequestHandler {
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: maxFileSize, files: 1 },
  }).single('image');

  return (req, res, next) => {
    upload(req, res, (error: unknown) => {
      if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
        next(new FileTooLargeError());
        return;
      }
      next(error);
    });
  };
}

export function requireUploadedImage(req: Request): Buffer {
  if (!req.file) throw new ImageRequiredError();
  return req.file.buffer;
}

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (error instanceof DomainError) {
    res.status(error.httpStatus).json({
      success: false,
      code: error.code,
      message_key: error.messageKey,
      error: error.message,
      ...(error.details !== undefined && { details: error.details }),
    });
    return;
  }

  logger.error({ err: error }, 'Unhandled error');
  res.status(HTTP_STATUS.INTERNAL_ERROR).json({
    success: false,
    code: 'INTERNAL_ERROR',
    message_key: 'errors.internal',
    error: 'Internal server error',
  });
}

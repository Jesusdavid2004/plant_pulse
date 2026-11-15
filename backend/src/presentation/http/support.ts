import type { Request, Response } from 'express';
import type { ZodType } from 'zod';
import { z } from 'zod';
import { ValidationFailedError } from '../../domain/errors';
import { DEFAULT_LOCALE, HTTP_STATUS, LOCALES, type Locale } from '../../shared/constants';

export const uuidSchema = z.uuid();

export function parseOrThrow<T>(schema: ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new ValidationFailedError(
      result.error.issues.map((issue) => ({ path: issue.path.join('.'), code: issue.code })),
    );
  }
  return result.data;
}

export function resolveLocale(acceptLanguage: string | undefined): Locale {
  const preferred = (acceptLanguage ?? '').split(',')[0]?.trim().toLowerCase() ?? '';
  return LOCALES.find((locale) => preferred.startsWith(locale)) ?? DEFAULT_LOCALE;
}

export function requestLocale(req: Request): Locale {
  return resolveLocale(req.headers['accept-language']);
}

export function currentUserId(res: Response): string {
  return res.locals.userId as string;
}

export function paramId(req: Request, name = 'id'): string {
  return parseOrThrow(uuidSchema, req.params[name]);
}

export function sendData(res: Response, data: unknown, status: number = HTTP_STATUS.OK): void {
  res.status(status).json({ success: true, data });
}

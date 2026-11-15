import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const DEFAULT_PORT = 3000;
const DEFAULT_ACCESS_TOKEN_MINUTES = 15;
const DEFAULT_REFRESH_TOKEN_DAYS = 30;
const DEFAULT_MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const DEFAULT_AI_MAX_OUTPUT_TOKENS = 1200;
const DEFAULT_AI_TIMEOUT_MS = 30_000;
const DEFAULT_AI_DAILY_QUOTA = 20;
const DEFAULT_AUTH_RATE_LIMIT = 20;
const DEFAULT_AI_RATE_LIMIT = 10;
const DEFAULT_GENERAL_RATE_LIMIT = 300;
const MIN_JWT_SECRET_LENGTH = 32;

const booleanFromString = z.enum(['true', 'false']).transform((value) => value === 'true');

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(DEFAULT_PORT),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  DATABASE_URL: z.string().min(1),
  CORS_ORIGIN: z.string().min(1).default('http://localhost:5173'),
  JWT_SECRET: z.string().min(MIN_JWT_SECRET_LENGTH),
  ACCESS_TOKEN_MINUTES: z.coerce.number().int().positive().default(DEFAULT_ACCESS_TOKEN_MINUTES),
  REFRESH_TOKEN_DAYS: z.coerce.number().int().positive().default(DEFAULT_REFRESH_TOKEN_DAYS),
  COOKIE_SAME_SITE: z.enum(['lax', 'strict', 'none']).default('lax'),
  COOKIE_SECURE: booleanFromString.optional(),
  MAX_FILE_SIZE: z.coerce.number().int().positive().default(DEFAULT_MAX_UPLOAD_BYTES),
  UPLOAD_DIR: z.string().default('./uploads'),
  AI_SERVICE_URL: z.string().default('http://localhost:8000'),
  AI_PROVIDER: z.enum(['gemini', 'groq', 'fake']).default('fake'),
  AI_FALLBACK_PROVIDER: z.enum(['gemini', 'groq', 'none']).default('none'),
  GEMINI_API_KEY: z.string().default(''),
  GEMINI_MODEL: z.string().default('gemini-3.5-flash'),
  GROQ_API_KEY: z.string().default(''),
  GROQ_MODEL: z.string().default('meta-llama/llama-4-scout-17b-16e-instruct'),
  AI_MAX_OUTPUT_TOKENS: z.coerce.number().int().positive().default(DEFAULT_AI_MAX_OUTPUT_TOKENS),
  AI_TIMEOUT_MS: z.coerce.number().int().positive().default(DEFAULT_AI_TIMEOUT_MS),
  AI_DAILY_QUOTA_PER_USER: z.coerce.number().int().positive().default(DEFAULT_AI_DAILY_QUOTA),
  RATE_LIMIT_AUTH_PER_15_MIN: z.coerce.number().int().positive().default(DEFAULT_AUTH_RATE_LIMIT),
  RATE_LIMIT_AI_PER_MIN: z.coerce.number().int().positive().default(DEFAULT_AI_RATE_LIMIT),
  RATE_LIMIT_GENERAL_PER_MIN: z.coerce
    .number()
    .int()
    .positive()
    .default(DEFAULT_GENERAL_RATE_LIMIT),
});

export type AppConfig = ReturnType<typeof buildConfig>;

export function buildConfig(source: NodeJS.ProcessEnv) {
  const env = envSchema.parse(source);
  const isProduction = env.NODE_ENV === 'production';
  return {
    env: env.NODE_ENV,
    isProduction,
    port: env.PORT,
    logLevel: env.LOG_LEVEL,
    databaseUrl: env.DATABASE_URL,
    corsOrigin: env.CORS_ORIGIN,
    auth: {
      jwtSecret: env.JWT_SECRET,
      accessTokenMinutes: env.ACCESS_TOKEN_MINUTES,
      refreshTokenDays: env.REFRESH_TOKEN_DAYS,
      cookieSameSite: env.COOKIE_SAME_SITE,
      cookieSecure: env.COOKIE_SECURE ?? (isProduction || env.COOKIE_SAME_SITE === 'none'),
    },
    upload: { maxFileSize: env.MAX_FILE_SIZE, dir: env.UPLOAD_DIR },
    aiServiceUrl: env.AI_SERVICE_URL,
    ai: {
      provider: env.AI_PROVIDER,
      fallbackProvider: env.AI_FALLBACK_PROVIDER,
      geminiApiKey: env.GEMINI_API_KEY,
      geminiModel: env.GEMINI_MODEL,
      groqApiKey: env.GROQ_API_KEY,
      groqModel: env.GROQ_MODEL,
      maxOutputTokens: env.AI_MAX_OUTPUT_TOKENS,
      timeoutMs: env.AI_TIMEOUT_MS,
      dailyQuotaPerUser: env.AI_DAILY_QUOTA_PER_USER,
    },
    rateLimit: {
      authPer15Min: env.RATE_LIMIT_AUTH_PER_15_MIN,
      aiPerMinute: env.RATE_LIMIT_AI_PER_MIN,
      generalPerMinute: env.RATE_LIMIT_GENERAL_PER_MIN,
    },
  } as const;
}

export const config = buildConfig(process.env);

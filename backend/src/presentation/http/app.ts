import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import type { Container } from '../../container';
import type { AppConfig } from '../../shared/config';
import { logger } from '../../shared/logger';
import { createAuthRouter } from './authRoutes';
import { createImageUpload, createRateLimiters, errorHandler } from './middlewares';
import { createPlantRouter } from './plantRoutes';

const JSON_BODY_LIMIT = '100kb';

export function createApp(container: Container, config: AppConfig): Express {
  const app = express();
  const limiters = createRateLimiters(config.rateLimit);

  app.set('trust proxy', config.isProduction ? 1 : false);
  app.use(helmet());
  app.use(cors({ origin: config.corsOrigin, credentials: true }));
  app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => req.url === '/health' } }));
  app.use(express.json({ limit: JSON_BODY_LIMIT }));
  app.use(cookieParser());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use('/api', limiters.general);
  app.use('/api/auth', createAuthRouter(container, config, limiters.auth));
  app.use(
    '/api/plants',
    createPlantRouter({
      container,
      imageUpload: createImageUpload(config.upload.maxFileSize),
      aiLimiter: limiters.ai,
    }),
  );

  app.use(errorHandler);
  return app;
}

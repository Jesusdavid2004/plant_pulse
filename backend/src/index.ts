import { PrismaClient } from './generated/prisma/client.js';
import { buildContainer } from './container';
import { IntervalJob } from './infrastructure/scheduling/IntervalJob';
import { createApp } from './presentation/http/app';
import { config } from './shared/config';
import { logger } from './shared/logger';

async function main(): Promise<void> {
  const prisma = new PrismaClient();
  const container = await buildContainer(prisma, config);
  const app = createApp(container, config);

  const server = app.listen(config.port, () => {
    logger.info({ port: config.port, env: config.env }, 'PlantPulse API listening');
  });

  const reminderJob = new IntervalJob('neglect-reminders', config.reminders.intervalMinutes, () =>
    container.useCases.sendNeglectReminders.execute(),
  );
  if (config.reminders.enabled) reminderJob.start();

  const shutdown = (): void => {
    reminderJob.stop();
    server.close(() => {
      void prisma.$disconnect().finally(() => process.exit(0));
    });
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

main().catch((error: unknown) => {
  logger.fatal({ err: error }, 'Failed to start the API');
  process.exit(1);
});

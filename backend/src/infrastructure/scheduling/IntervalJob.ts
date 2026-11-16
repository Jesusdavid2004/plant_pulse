import { logger } from '../../shared/logger';

const MILLISECONDS_PER_MINUTE = 60_000;

export class IntervalJob {
  private timer: NodeJS.Timeout | null = null;
  private running = false;

  constructor(
    private readonly name: string,
    private readonly intervalMinutes: number,
    private readonly task: () => Promise<unknown>,
  ) {}

  start(): void {
    if (this.timer) return;
    this.timer = setInterval(
      () => void this.tick(),
      this.intervalMinutes * MILLISECONDS_PER_MINUTE,
    );
    this.timer.unref();
    logger.info({ job: this.name, everyMinutes: this.intervalMinutes }, 'Scheduled job started');
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  async tick(): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      const result = await this.task();
      logger.info({ job: this.name, result }, 'Scheduled job finished');
    } catch (error) {
      logger.error({ job: this.name, err: error }, 'Scheduled job failed');
    } finally {
      this.running = false;
    }
  }
}

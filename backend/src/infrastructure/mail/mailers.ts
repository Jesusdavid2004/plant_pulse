import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import nodemailer, { type Transporter } from 'nodemailer';
import type { MailMessage, Mailer } from '../../domain/notifications/ports';
import type { AppConfig } from '../../shared/config';
import { logger } from '../../shared/logger';

export class SmtpMailer implements Mailer {
  private readonly transporter: Transporter;

  constructor(
    options: AppConfig['mail']['smtp'],
    private readonly from: string,
  ) {
    this.transporter = nodemailer.createTransport({
      host: options.host,
      port: options.port,
      secure: options.secure,
      ...(options.user && { auth: { user: options.user, pass: options.password } }),
    });
  }

  async send(message: MailMessage): Promise<void> {
    await this.transporter.sendMail({ from: this.from, ...message });
    logger.info('Reminder email sent through SMTP');
  }
}

export class FileMailer implements Mailer {
  constructor(private readonly directory: string) {}

  async send(message: MailMessage): Promise<void> {
    await mkdir(this.directory, { recursive: true });
    const fileName = `${Date.now()}-${randomUUID().slice(0, 8)}.html`;
    const header = `<!-- to: ${message.to} | subject: ${message.subject} -->\n`;
    await writeFile(path.join(this.directory, fileName), header + message.html, 'utf8');
    logger.info({ fileName }, 'Reminder email written to the preview folder');
  }
}

export class DisabledMailer implements Mailer {
  async send(): Promise<void> {
    logger.warn('Email delivery is disabled (MAIL_TRANSPORT=none)');
  }
}

export function createMailer(config: AppConfig): Mailer {
  switch (config.mail.transport) {
    case 'smtp':
      return new SmtpMailer(config.mail.smtp, config.mail.from);
    case 'file':
      return new FileMailer(config.mail.previewDir);
    default:
      return new DisabledMailer();
  }
}

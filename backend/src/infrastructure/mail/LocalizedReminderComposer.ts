import type { NeglectedPlant } from '../../domain/notifications/NeglectReminder';
import type {
  MailContent,
  ReminderComposer,
  ReminderRecipient,
} from '../../domain/notifications/ports';
import { REMINDER_MESSAGES, type ReminderMessages } from './reminderMessages';

const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => HTML_ESCAPES[character] ?? character);
}

function describeNeed(plant: NeglectedPlant, messages: ReminderMessages): string {
  if (plant.sick) return messages.sick;
  return plant.urgentNeed ? messages.needs[plant.urgentNeed] : messages.needs.GENERIC;
}

interface LayoutInput {
  messages: ReminderMessages;
  recipient: ReminderRecipient;
  bodyHtml: string;
  appUrl: string;
  unsubscribeUrl: string;
}

function renderLayout({ messages, recipient, bodyHtml, appUrl, unsubscribeUrl }: LayoutInput) {
  return `<!doctype html>
<html lang="${recipient.locale}">
<body style="margin:0;background:#faf9f6;font-family:Segoe UI,Arial,sans-serif;color:#2b2b2b;">
  <div style="max-width:520px;margin:0 auto;padding:32px 24px;">
    <h1 style="font-size:20px;color:#3e7a52;margin:0 0 16px;">PlantPulse</h1>
    <p>${escapeHtml(messages.greeting(recipient.name))}</p>
    ${bodyHtml}
    <p style="margin:28px 0;"><a href="${escapeHtml(appUrl)}" style="background:#3e7a52;color:#ffffff;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:600;">${escapeHtml(messages.button)}</a></p>
    <p style="font-size:12px;color:#6b6b6b;">${escapeHtml(messages.footer)}<br><a href="${escapeHtml(unsubscribeUrl)}" style="color:#6b6b6b;">${escapeHtml(messages.unsubscribe)}</a></p>
  </div>
</body>
</html>`;
}

export class LocalizedReminderComposer implements ReminderComposer {
  composeReminder(input: {
    recipient: ReminderRecipient;
    plants: NeglectedPlant[];
    appUrl: string;
    unsubscribeUrl: string;
  }): MailContent {
    const messages = REMINDER_MESSAGES[input.recipient.locale];
    const [first] = input.plants;
    const subject =
      input.plants.length === 1 && first
        ? messages.subjectSingle(first.name)
        : messages.subjectMultiple(input.plants.length);

    const lines = input.plants.map((plant) => `${plant.name} ${describeNeed(plant, messages)}`);
    const text = [
      messages.greeting(input.recipient.name),
      '',
      messages.intro,
      ...lines.map((line) => `- ${line}`),
      '',
      `${messages.button}: ${input.appUrl}`,
      '',
      `${messages.unsubscribe}: ${input.unsubscribeUrl}`,
    ].join('\n');

    const listHtml = input.plants
      .map(
        (plant) =>
          `<li style="margin:6px 0;"><strong>${escapeHtml(plant.name)}</strong> ${escapeHtml(describeNeed(plant, messages))}</li>`,
      )
      .join('');
    const html = renderLayout({
      messages,
      recipient: input.recipient,
      bodyHtml: `<p>${escapeHtml(messages.intro)}</p><ul style="padding-left:20px;">${listHtml}</ul>`,
      appUrl: input.appUrl,
      unsubscribeUrl: input.unsubscribeUrl,
    });
    return { subject, text, html };
  }

  composeTest(input: {
    recipient: ReminderRecipient;
    appUrl: string;
    unsubscribeUrl: string;
  }): MailContent {
    const messages = REMINDER_MESSAGES[input.recipient.locale];
    const text = [
      messages.greeting(input.recipient.name),
      '',
      messages.testBody,
      '',
      `${messages.button}: ${input.appUrl}`,
      `${messages.unsubscribe}: ${input.unsubscribeUrl}`,
    ].join('\n');
    const html = renderLayout({
      messages,
      recipient: input.recipient,
      bodyHtml: `<p>${escapeHtml(messages.testBody)}</p>`,
      appUrl: input.appUrl,
      unsubscribeUrl: input.unsubscribeUrl,
    });
    return { subject: messages.testSubject, text, html };
  }
}

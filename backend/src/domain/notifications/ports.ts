import type { CareProfile } from '../care/CareProfile';
import type { CareType } from '../care/CareType';
import type { Locale } from '../../shared/constants';
import type { NeglectedPlant } from './NeglectReminder';

export interface ReminderRecipient {
  id: string;
  email: string;
  name: string | null;
  locale: Locale;
}

export interface RecipientPlant {
  name: string;
  createdAt: Date;
  careProfile: CareProfile;
  latestHealthScore: number | null;
  lastCareAt: Partial<Record<CareType, Date>>;
}

export interface ReminderAudienceMember {
  recipient: ReminderRecipient;
  plants: RecipientPlant[];
}

export interface ReminderAudienceRepository {
  findCandidates(reminderCutoff: Date, limit: number): Promise<ReminderAudienceMember[]>;
  markReminded(userId: string, at: Date): Promise<void>;
}

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export interface Mailer {
  send(message: MailMessage): Promise<void>;
}

export type MailContent = Omit<MailMessage, 'to'>;

export interface ReminderComposer {
  composeReminder(input: {
    recipient: ReminderRecipient;
    plants: NeglectedPlant[];
    appUrl: string;
    unsubscribeUrl: string;
  }): MailContent;
  composeTest(input: {
    recipient: ReminderRecipient;
    appUrl: string;
    unsubscribeUrl: string;
  }): MailContent;
}

export interface UnsubscribeTokenService {
  sign(userId: string): string;
  verify(token: string): { userId: string } | null;
}

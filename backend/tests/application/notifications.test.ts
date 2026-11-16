import { describe, expect, it } from 'vitest';
import { SendNeglectRemindersUseCase } from '../../src/application/notifications/SendNeglectRemindersUseCase';
import { CareProfile } from '../../src/domain/care/CareProfile';
import { CareType } from '../../src/domain/care/CareType';
import type {
  ReminderAudienceMember,
  ReminderAudienceRepository,
  UnsubscribeTokenService,
} from '../../src/domain/notifications/ports';
import { LocalizedReminderComposer } from '../../src/infrastructure/mail/LocalizedReminderComposer';
import { FakeMailer, FixedClock } from '../fakes/fakes';

const NOW = new Date('2026-11-16T12:00:00Z');
const LONG_AGO = new Date('2026-09-01T00:00:00Z');
const RECENT = new Date('2026-11-16T08:00:00Z');

class InMemoryAudience implements ReminderAudienceRepository {
  readonly reminded: string[] = [];
  constructor(private readonly members: ReminderAudienceMember[]) {}

  async findCandidates(): Promise<ReminderAudienceMember[]> {
    return this.members;
  }

  async markReminded(userId: string): Promise<void> {
    this.reminded.push(userId);
  }
}

const tokens: UnsubscribeTokenService = {
  sign: (userId) => `token-${userId}`,
  verify: () => null,
};

function member(
  id: string,
  plantName: string,
  lastCare: Date,
  locale: 'en' | 'es' = 'en',
): ReminderAudienceMember {
  return {
    recipient: { id, email: `${id}@example.com`, name: 'Ana', locale },
    plants: [
      {
        name: plantName,
        createdAt: LONG_AGO,
        careProfile: CareProfile.default(),
        latestHealthScore: 90,
        lastCareAt: { WATER: lastCare, SUN: lastCare, FERTILIZE: lastCare },
      },
    ],
  };
}

function setup(members: ReminderAudienceMember[]) {
  const audience = new InMemoryAudience(members);
  const mailer = new FakeMailer();
  const useCase = new SendNeglectRemindersUseCase(
    audience,
    mailer,
    new LocalizedReminderComposer(),
    tokens,
    new FixedClock(NOW),
    'https://app.example.com',
  );
  return { audience, mailer, useCase };
}

describe('SendNeglectRemindersUseCase', () => {
  it('emails the owner of a neglected plant in their language and records the reminder', async () => {
    const { useCase, mailer, audience } = setup([member('u1', 'Fernie', LONG_AGO, 'es')]);

    const summary = await useCase.execute();

    expect(summary).toEqual({ usersNotified: 1, plantsMentioned: 1, failures: 0 });
    expect(mailer.sent[0]?.subject).toBe('Fernie te extraña');
    expect(mailer.sent[0]?.text).toContain('/es/unsubscribe?token=token-u1');
    expect(audience.reminded).toEqual(['u1']);
  });

  it('stays quiet when the plants are well cared for', async () => {
    const { useCase, mailer } = setup([member('u1', 'Fernie', RECENT)]);

    const summary = await useCase.execute();

    expect(summary.usersNotified).toBe(0);
    expect(mailer.sent).toHaveLength(0);
  });

  it('sends one digest per user and keeps going when one delivery fails', async () => {
    const { useCase, mailer, audience } = setup([
      member('u1', 'Fernie', LONG_AGO),
      member('u2', 'Monty', LONG_AGO),
    ]);
    mailer.failFor = 'u1@example.com';

    const summary = await useCase.execute();

    expect(summary).toMatchObject({ usersNotified: 1, failures: 1 });
    expect(audience.reminded).toEqual(['u2']);
  });
});

describe('LocalizedReminderComposer', () => {
  it('escapes plant names so a malicious name cannot inject markup into the email', () => {
    const content = new LocalizedReminderComposer().composeReminder({
      recipient: { id: 'u1', email: 'a@example.com', name: '<b>Ana</b>', locale: 'en' },
      plants: [{ name: '<script>alert(1)</script>', sick: false, urgentNeed: CareType.WATER }],
      appUrl: 'https://app.example.com',
      unsubscribeUrl: 'https://app.example.com/en/unsubscribe?token=t',
    });

    expect(content.html).not.toContain('<script>');
    expect(content.html).toContain('&lt;script&gt;');
    expect(content.html).not.toContain('<b>Ana');
  });

  it('summarizes several plants in the subject', () => {
    const content = new LocalizedReminderComposer().composeReminder({
      recipient: { id: 'u1', email: 'a@example.com', name: null, locale: 'en' },
      plants: [
        { name: 'A', sick: false, urgentNeed: CareType.WATER },
        { name: 'B', sick: true, urgentNeed: null },
      ],
      appUrl: 'https://app.example.com',
      unsubscribeUrl: 'https://app.example.com/en/unsubscribe?token=t',
    });

    expect(content.subject).toBe('2 of your plants need some care');
  });
});

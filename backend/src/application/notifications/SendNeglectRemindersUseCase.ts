import { computePlantMood } from '../../domain/care/PlantMood';
import type { Clock } from '../../domain/care/repositories';
import {
  isNeglected,
  MAX_PLANTS_PER_REMINDER,
  REMINDER_COOLDOWN_MS,
  type NeglectedPlant,
} from '../../domain/notifications/NeglectReminder';
import type {
  Mailer,
  ReminderAudienceMember,
  ReminderAudienceRepository,
  ReminderComposer,
  UnsubscribeTokenService,
} from '../../domain/notifications/ports';
import { buildUnsubscribeUrl } from './unsubscribeUrl';

const AUDIENCE_BATCH_SIZE = 200;

export interface SendNeglectRemindersOutput {
  usersNotified: number;
  plantsMentioned: number;
  failures: number;
}

export class SendNeglectRemindersUseCase {
  constructor(
    private readonly audience: ReminderAudienceRepository,
    private readonly mailer: Mailer,
    private readonly composer: ReminderComposer,
    private readonly tokens: UnsubscribeTokenService,
    private readonly clock: Clock,
    private readonly appUrl: string,
  ) {}

  async execute(): Promise<SendNeglectRemindersOutput> {
    const now = this.clock.now();
    const cutoff = new Date(now.getTime() - REMINDER_COOLDOWN_MS);
    const candidates = await this.audience.findCandidates(cutoff, AUDIENCE_BATCH_SIZE);
    const summary: SendNeglectRemindersOutput = {
      usersNotified: 0,
      plantsMentioned: 0,
      failures: 0,
    };

    for (const member of candidates) {
      const neglected = this.findNeglectedPlants(member, now);
      if (neglected.length === 0) continue;

      try {
        await this.notify(member, neglected, now);
        summary.usersNotified += 1;
        summary.plantsMentioned += neglected.length;
      } catch {
        summary.failures += 1;
      }
    }
    return summary;
  }

  private findNeglectedPlants(member: ReminderAudienceMember, now: Date): NeglectedPlant[] {
    return member.plants
      .map((plant) => ({
        plant,
        snapshot: computePlantMood({
          profile: plant.careProfile,
          lastCareAt: plant.lastCareAt,
          plantCreatedAt: plant.createdAt,
          healthScore: plant.latestHealthScore,
          now,
        }),
      }))
      .filter(({ snapshot }) => isNeglected(snapshot.mood))
      .slice(0, MAX_PLANTS_PER_REMINDER)
      .map(({ plant, snapshot }) => ({
        name: plant.name,
        sick: snapshot.mood === 'SICK',
        urgentNeed: snapshot.mostUrgentNeed,
      }));
  }

  private async notify(
    member: ReminderAudienceMember,
    plants: NeglectedPlant[],
    now: Date,
  ): Promise<void> {
    const { recipient } = member;
    const content = this.composer.composeReminder({
      recipient,
      plants,
      appUrl: this.appUrl,
      unsubscribeUrl: buildUnsubscribeUrl(
        this.appUrl,
        recipient.locale,
        this.tokens.sign(recipient.id),
      ),
    });
    await this.mailer.send({ to: recipient.email, ...content });
    await this.audience.markReminded(recipient.id, now);
  }
}

import type { PrismaClient } from '../../generated/prisma/client.js';
import { careProfileForCategory } from '../../domain/care/CareCatalog';
import { isCareType, type CareType } from '../../domain/care/CareType';
import type {
  ReminderAudienceMember,
  ReminderAudienceRepository,
} from '../../domain/notifications/ports';
import { DEFAULT_LOCALE, LOCALES } from '../../shared/constants';

export class PrismaReminderAudienceRepository implements ReminderAudienceRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findCandidates(reminderCutoff: Date, limit: number): Promise<ReminderAudienceMember[]> {
    const users = await this.prisma.user.findMany({
      where: {
        emailNotifications: true,
        plants: { some: {} },
        OR: [{ lastReminderAt: null }, { lastReminderAt: { lte: reminderCutoff } }],
      },
      orderBy: { lastReminderAt: { sort: 'asc', nulls: 'first' } },
      take: limit,
      select: {
        id: true,
        email: true,
        name: true,
        locale: true,
        plants: {
          select: {
            name: true,
            createdAt: true,
            careCategory: true,
            analyses: { select: { healthScore: true }, orderBy: { createdAt: 'desc' }, take: 1 },
            careEvents: {
              select: { type: true, occurredAt: true },
              orderBy: { occurredAt: 'desc' },
              distinct: ['type'],
            },
          },
        },
      },
    });

    return users.map((user) => ({
      recipient: {
        id: user.id,
        email: user.email,
        name: user.name,
        locale: LOCALES.find((locale) => locale === user.locale) ?? DEFAULT_LOCALE,
      },
      plants: user.plants.map((plant) => ({
        name: plant.name,
        createdAt: plant.createdAt,
        careProfile: careProfileForCategory(plant.careCategory),
        latestHealthScore: plant.analyses[0]?.healthScore ?? null,
        lastCareAt: Object.fromEntries(
          plant.careEvents
            .filter((event) => isCareType(event.type))
            .map((event): [CareType, Date] => [event.type as CareType, event.occurredAt]),
        ),
      })),
    }));
  }

  async markReminded(userId: string, at: Date): Promise<void> {
    await this.prisma.user.update({ where: { id: userId }, data: { lastReminderAt: at } });
  }
}

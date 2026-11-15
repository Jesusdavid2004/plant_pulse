import { describe, expect, it } from 'vitest';
import { CareProfile } from '../../src/domain/care/CareProfile';
import { CareType } from '../../src/domain/care/CareType';
import { computePlantMood, Mood, NeedLevel } from '../../src/domain/care/PlantMood';

const NOW = new Date('2026-11-15T12:00:00Z');
const DAY_MS = 24 * 60 * 60 * 1000;

function daysAgo(days: number): Date {
  return new Date(NOW.getTime() - days * DAY_MS);
}

function justCared(): Record<CareType, Date> {
  return {
    [CareType.WATER]: daysAgo(1),
    [CareType.SUN]: daysAgo(1),
    [CareType.FERTILIZE]: daysAgo(1),
  };
}

function mood(overrides: Partial<Parameters<typeof computePlantMood>[0]> = {}) {
  return computePlantMood({
    profile: CareProfile.default(),
    lastCareAt: justCared(),
    plantCreatedAt: daysAgo(60),
    healthScore: null,
    now: NOW,
    ...overrides,
  });
}

describe('computePlantMood', () => {
  it('is happy when every need was met recently', () => {
    const snapshot = mood();

    expect(snapshot.mood).toBe(Mood.HAPPY);
    expect(snapshot.mostUrgentNeed).toBeNull();
  });

  it('is concerned when a need has just passed its interval', () => {
    const snapshot = mood({ lastCareAt: { ...justCared(), [CareType.WATER]: daysAgo(8) } });

    expect(snapshot.mood).toBe(Mood.CONCERNED);
    expect(snapshot.mostUrgentNeed).toBe(CareType.WATER);
  });

  it('is sad when a need is overdue by one and a half intervals', () => {
    const snapshot = mood({ lastCareAt: { ...justCared(), [CareType.WATER]: daysAgo(11) } });

    expect(snapshot.mood).toBe(Mood.SAD);
    expect(snapshot.needs.find((need) => need.type === CareType.WATER)?.level).toBe(
      NeedLevel.CRITICAL,
    );
  });

  it('reports the most severe need as the most urgent one', () => {
    const snapshot = mood({
      lastCareAt: {
        [CareType.WATER]: daysAgo(8),
        [CareType.SUN]: daysAgo(10),
        [CareType.FERTILIZE]: daysAgo(1),
      },
    });

    expect(snapshot.mostUrgentNeed).toBe(CareType.SUN);
  });

  it('counts days since planting when a need was never attended', () => {
    const snapshot = mood({ lastCareAt: {}, plantCreatedAt: daysAgo(2) });

    expect(snapshot.mood).toBe(Mood.HAPPY);
  });

  it('is sad for a plant never watered after its interval has long passed', () => {
    const snapshot = mood({ lastCareAt: justCared(), plantCreatedAt: daysAgo(60) });
    const neverCared = mood({ lastCareAt: {}, plantCreatedAt: daysAgo(60) });

    expect(snapshot.mood).toBe(Mood.HAPPY);
    expect(neverCared.mood).toBe(Mood.SAD);
  });

  it('is sick when the latest health score is below the threshold, even if cared for', () => {
    const snapshot = mood({ healthScore: 25 });

    expect(snapshot.mood).toBe(Mood.SICK);
  });

  it('ignores a healthy score when judging mood', () => {
    expect(mood({ healthScore: 90 }).mood).toBe(Mood.HAPPY);
  });

  it('never reports negative days when the care date is in the future', () => {
    const snapshot = mood({ lastCareAt: { ...justCared(), [CareType.WATER]: daysAgo(-3) } });

    expect(snapshot.needs.find((need) => need.type === CareType.WATER)?.daysSinceLastCare).toBe(0);
  });
});

describe('CareProfile', () => {
  it('rejects non-positive intervals', () => {
    expect(() =>
      CareProfile.create({
        [CareType.WATER]: 0,
        [CareType.SUN]: 3,
        [CareType.FERTILIZE]: 30,
      }),
    ).toThrow();
  });
});

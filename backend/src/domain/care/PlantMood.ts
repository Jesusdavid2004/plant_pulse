import { CareProfile } from './CareProfile';
import { CARE_TYPES, CareType } from './CareType';

export enum NeedLevel {
  SATISFIED = 'SATISFIED',
  LOW = 'LOW',
  CRITICAL = 'CRITICAL',
}

export enum Mood {
  HAPPY = 'HAPPY',
  CONCERNED = 'CONCERNED',
  SAD = 'SAD',
  SICK = 'SICK',
}

export const LOW_NEED_RATIO = 1;
export const CRITICAL_NEED_RATIO = 1.5;
export const SICK_HEALTH_SCORE_THRESHOLD = 40;
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

export interface NeedStatus {
  type: CareType;
  level: NeedLevel;
  daysSinceLastCare: number;
}

export interface MoodInput {
  profile: CareProfile;
  lastCareAt: Partial<Record<CareType, Date>>;
  plantCreatedAt: Date;
  healthScore: number | null;
  now: Date;
}

export interface PlantMoodSnapshot {
  mood: Mood;
  needs: NeedStatus[];
  mostUrgentNeed: CareType | null;
}

const LEVEL_SEVERITY: Record<NeedLevel, number> = {
  [NeedLevel.SATISFIED]: 0,
  [NeedLevel.LOW]: 1,
  [NeedLevel.CRITICAL]: 2,
};

function daysBetween(from: Date, to: Date): number {
  const elapsed = Math.max(0, to.getTime() - from.getTime());
  return Math.floor(elapsed / MILLISECONDS_PER_DAY);
}

function levelFor(daysSince: number, intervalDays: number): NeedLevel {
  const ratio = daysSince / intervalDays;
  if (ratio >= CRITICAL_NEED_RATIO) return NeedLevel.CRITICAL;
  if (ratio >= LOW_NEED_RATIO) return NeedLevel.LOW;
  return NeedLevel.SATISFIED;
}

function evaluateNeed(type: CareType, input: MoodInput): NeedStatus {
  const reference = input.lastCareAt[type] ?? input.plantCreatedAt;
  const daysSinceLastCare = daysBetween(reference, input.now);
  const level = levelFor(daysSinceLastCare, input.profile.intervalFor(type));
  return { type, level, daysSinceLastCare };
}

function pickMostUrgent(needs: NeedStatus[]): NeedStatus | null {
  const unmet = needs.filter((need) => need.level !== NeedLevel.SATISFIED);
  if (unmet.length === 0) return null;
  return unmet.reduce((worst, need) =>
    LEVEL_SEVERITY[need.level] > LEVEL_SEVERITY[worst.level] ? need : worst,
  );
}

function resolveMood(needs: NeedStatus[], healthScore: number | null): Mood {
  if (healthScore !== null && healthScore < SICK_HEALTH_SCORE_THRESHOLD) return Mood.SICK;
  if (needs.some((need) => need.level === NeedLevel.CRITICAL)) return Mood.SAD;
  if (needs.some((need) => need.level === NeedLevel.LOW)) return Mood.CONCERNED;
  return Mood.HAPPY;
}

export function computePlantMood(input: MoodInput): PlantMoodSnapshot {
  const needs = CARE_TYPES.map((type) => evaluateNeed(type, input));
  return {
    mood: resolveMood(needs, input.healthScore),
    needs,
    mostUrgentNeed: pickMostUrgent(needs)?.type ?? null,
  };
}

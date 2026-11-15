import { CareProfile } from './CareProfile';
import { CareType } from './CareType';

export const CARE_CATEGORIES = [
  'SUCCULENT',
  'TROPICAL',
  'FERN',
  'HERB',
  'FLOWERING',
  'TREE_SHRUB',
  'UNKNOWN',
] as const;

export type CareCategory = (typeof CARE_CATEGORIES)[number];

interface CareIntervals {
  waterDays: number;
  sunDays: number;
  fertilizeDays: number;
}

const INTERVALS_BY_CATEGORY: Record<CareCategory, CareIntervals> = {
  SUCCULENT: { waterDays: 14, sunDays: 2, fertilizeDays: 60 },
  TROPICAL: { waterDays: 5, sunDays: 3, fertilizeDays: 30 },
  FERN: { waterDays: 3, sunDays: 3, fertilizeDays: 30 },
  HERB: { waterDays: 2, sunDays: 2, fertilizeDays: 21 },
  FLOWERING: { waterDays: 4, sunDays: 2, fertilizeDays: 14 },
  TREE_SHRUB: { waterDays: 7, sunDays: 4, fertilizeDays: 45 },
  UNKNOWN: { waterDays: 7, sunDays: 3, fertilizeDays: 30 },
};

export function isCareCategory(value: unknown): value is CareCategory {
  return CARE_CATEGORIES.includes(value as CareCategory);
}

export function careProfileForCategory(category: string | null): CareProfile {
  const intervals = INTERVALS_BY_CATEGORY[isCareCategory(category) ? category : 'UNKNOWN'];
  return CareProfile.create({
    [CareType.WATER]: intervals.waterDays,
    [CareType.SUN]: intervals.sunDays,
    [CareType.FERTILIZE]: intervals.fertilizeDays,
  });
}

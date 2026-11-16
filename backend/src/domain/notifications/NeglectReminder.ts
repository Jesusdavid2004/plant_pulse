import { Mood } from '../care/PlantMood';
import type { CareType } from '../care/CareType';
import { MILLISECONDS_PER_DAY } from '../../shared/constants';

export const REMINDER_COOLDOWN_MS = MILLISECONDS_PER_DAY;
export const MAX_PLANTS_PER_REMINDER = 5;

export interface NeglectedPlant {
  name: string;
  sick: boolean;
  urgentNeed: CareType | null;
}

export function isNeglected(mood: Mood): boolean {
  return mood === Mood.SAD || mood === Mood.SICK;
}

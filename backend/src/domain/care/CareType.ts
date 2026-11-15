export enum CareType {
  WATER = 'WATER',
  SUN = 'SUN',
  FERTILIZE = 'FERTILIZE',
}

export const CARE_TYPES: readonly CareType[] = Object.values(CareType);

export function isCareType(value: unknown): value is CareType {
  return CARE_TYPES.includes(value as CareType);
}

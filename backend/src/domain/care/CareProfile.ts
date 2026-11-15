import { CareType } from './CareType';

export const DEFAULT_WATER_INTERVAL_DAYS = 7;
export const DEFAULT_SUN_INTERVAL_DAYS = 3;
export const DEFAULT_FERTILIZE_INTERVAL_DAYS = 30;

export class CareProfile {
  private constructor(private readonly intervalsInDays: Readonly<Record<CareType, number>>) {}

  static create(intervals: Record<CareType, number>): CareProfile {
    for (const interval of Object.values(intervals)) {
      if (!Number.isFinite(interval) || interval <= 0) {
        throw new InvalidCareProfileError();
      }
    }
    return new CareProfile({ ...intervals });
  }

  static default(): CareProfile {
    return CareProfile.create({
      [CareType.WATER]: DEFAULT_WATER_INTERVAL_DAYS,
      [CareType.SUN]: DEFAULT_SUN_INTERVAL_DAYS,
      [CareType.FERTILIZE]: DEFAULT_FERTILIZE_INTERVAL_DAYS,
    });
  }

  intervalFor(type: CareType): number {
    return this.intervalsInDays[type];
  }
}

export class InvalidCareProfileError extends Error {
  constructor() {
    super('Care intervals must be positive numbers');
    this.name = 'InvalidCareProfileError';
  }
}

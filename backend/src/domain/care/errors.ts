export abstract class DomainError extends Error {
  abstract readonly code: string;
  abstract readonly messageKey: string;
  abstract readonly httpStatus: number;
}

export class PlantNotFoundError extends DomainError {
  readonly code = 'PLANT_NOT_FOUND';
  readonly messageKey = 'errors.plantNotFound';
  readonly httpStatus = 404;

  constructor() {
    super('Plant not found');
    this.name = 'PlantNotFoundError';
  }
}

export class InvalidCareTypeError extends DomainError {
  readonly code = 'INVALID_CARE_TYPE';
  readonly messageKey = 'errors.invalidCareType';
  readonly httpStatus = 400;

  constructor() {
    super('Invalid care type');
    this.name = 'InvalidCareTypeError';
  }
}

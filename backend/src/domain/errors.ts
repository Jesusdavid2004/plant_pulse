import { HTTP_STATUS } from '../shared/constants';

export abstract class DomainError extends Error {
  abstract readonly code: string;
  abstract readonly messageKey: string;
  abstract readonly httpStatus: number;
  readonly details?: unknown;

  constructor(message: string, details?: unknown) {
    super(message);
    this.name = new.target.name;
    this.details = details;
  }
}

export class ValidationFailedError extends DomainError {
  readonly code = 'VALIDATION_FAILED';
  readonly messageKey = 'errors.validationFailed';
  readonly httpStatus = HTTP_STATUS.BAD_REQUEST;

  constructor(details?: unknown) {
    super('Request validation failed', details);
  }
}

export class PlantNotFoundError extends DomainError {
  readonly code = 'PLANT_NOT_FOUND';
  readonly messageKey = 'errors.plantNotFound';
  readonly httpStatus = HTTP_STATUS.NOT_FOUND;

  constructor() {
    super('Plant not found');
  }
}

export class InvalidCareTypeError extends DomainError {
  readonly code = 'INVALID_CARE_TYPE';
  readonly messageKey = 'errors.invalidCareType';
  readonly httpStatus = HTTP_STATUS.BAD_REQUEST;

  constructor() {
    super('Invalid care type');
  }
}

export class EmailAlreadyRegisteredError extends DomainError {
  readonly code = 'EMAIL_ALREADY_REGISTERED';
  readonly messageKey = 'errors.emailAlreadyRegistered';
  readonly httpStatus = HTTP_STATUS.CONFLICT;

  constructor() {
    super('Email is already registered');
  }
}

export class InvalidCredentialsError extends DomainError {
  readonly code = 'INVALID_CREDENTIALS';
  readonly messageKey = 'errors.invalidCredentials';
  readonly httpStatus = HTTP_STATUS.UNAUTHORIZED;

  constructor() {
    super('Invalid email or password');
  }
}

export class UnauthorizedError extends DomainError {
  readonly code = 'UNAUTHORIZED';
  readonly messageKey = 'errors.unauthorized';
  readonly httpStatus = HTTP_STATUS.UNAUTHORIZED;

  constructor() {
    super('Authentication required');
  }
}

export class InvalidRefreshTokenError extends DomainError {
  readonly code = 'INVALID_REFRESH_TOKEN';
  readonly messageKey = 'errors.invalidRefreshToken';
  readonly httpStatus = HTTP_STATUS.UNAUTHORIZED;

  constructor() {
    super('Refresh token is invalid or expired');
  }
}

export class InvalidImageError extends DomainError {
  readonly code = 'INVALID_IMAGE';
  readonly messageKey = 'errors.invalidImage';
  readonly httpStatus = HTTP_STATUS.BAD_REQUEST;

  constructor() {
    super('Uploaded file is not a valid image');
  }
}

export class NotAPlantError extends DomainError {
  readonly code = 'NOT_A_PLANT';
  readonly messageKey = 'errors.notAPlant';
  readonly httpStatus = HTTP_STATUS.UNPROCESSABLE;

  constructor() {
    super('The photo does not appear to show a plant');
  }
}

export class AIResponseInvalidError extends DomainError {
  readonly code = 'AI_RESPONSE_INVALID';
  readonly messageKey = 'errors.aiResponseInvalid';
  readonly httpStatus = HTTP_STATUS.BAD_GATEWAY;

  constructor() {
    super('AI provider returned an invalid response');
  }
}

export class AIProviderUnavailableError extends DomainError {
  readonly code = 'AI_PROVIDER_UNAVAILABLE';
  readonly messageKey = 'errors.aiProviderUnavailable';
  readonly httpStatus = HTTP_STATUS.BAD_GATEWAY;

  constructor() {
    super('AI provider is unavailable');
  }
}

export class AIQuotaExceededError extends DomainError {
  readonly code = 'AI_QUOTA_EXCEEDED';
  readonly messageKey = 'errors.aiQuotaExceeded';
  readonly httpStatus = HTTP_STATUS.TOO_MANY_REQUESTS;

  constructor() {
    super('Daily AI quota exceeded');
  }
}

export class ImageRequiredError extends DomainError {
  readonly code = 'IMAGE_REQUIRED';
  readonly messageKey = 'errors.imageRequired';
  readonly httpStatus = HTTP_STATUS.BAD_REQUEST;

  constructor() {
    super('An image file is required');
  }
}

export class FileTooLargeError extends DomainError {
  readonly code = 'FILE_TOO_LARGE';
  readonly messageKey = 'errors.fileTooLarge';
  readonly httpStatus = HTTP_STATUS.PAYLOAD_TOO_LARGE;

  constructor() {
    super('Uploaded file exceeds the size limit');
  }
}

export class RateLimitedError extends DomainError {
  readonly code = 'RATE_LIMITED';
  readonly messageKey = 'errors.rateLimited';
  readonly httpStatus = HTTP_STATUS.TOO_MANY_REQUESTS;

  constructor() {
    super('Too many requests');
  }
}

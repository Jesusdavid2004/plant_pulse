import { Clock } from '../../domain/care/repositories';

export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
}

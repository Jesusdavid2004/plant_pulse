import type { Clock } from '../../domain/care/repositories';
import type { PasswordHasher, UserRepository } from '../../domain/auth/repositories';
import type { AuthSession } from '../../domain/auth/types';
import { EmailAlreadyRegisteredError } from '../../domain/errors';
import type { SessionIssuer } from './SessionIssuer';

export interface RegisterUserInput {
  email: string;
  password: string;
  name: string | null;
}

export class RegisterUserUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly hasher: PasswordHasher,
    private readonly sessions: SessionIssuer,
    private readonly clock: Clock,
  ) {}

  async execute(input: RegisterUserInput): Promise<AuthSession> {
    const email = input.email.trim().toLowerCase();
    if (await this.users.findByEmail(email)) throw new EmailAlreadyRegisteredError();

    const passwordHash = await this.hasher.hash(input.password);
    const user = await this.users.create(email, passwordHash, input.name);
    return this.sessions.issue(user, this.clock.now());
  }
}

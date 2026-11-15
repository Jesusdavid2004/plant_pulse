import type { Clock } from '../../domain/care/repositories';
import type { PasswordHasher, UserRepository } from '../../domain/auth/repositories';
import type { AuthSession } from '../../domain/auth/types';
import { InvalidCredentialsError } from '../../domain/errors';
import type { SessionIssuer } from './SessionIssuer';

export interface LoginUserInput {
  email: string;
  password: string;
}

export class LoginUserUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly hasher: PasswordHasher,
    private readonly sessions: SessionIssuer,
    private readonly clock: Clock,
    private readonly timingEqualizerHash: string,
  ) {}

  async execute(input: LoginUserInput): Promise<AuthSession> {
    const user = await this.users.findByEmail(input.email.trim().toLowerCase());
    const hashToCheck = user?.passwordHash ?? this.timingEqualizerHash;
    const passwordMatches = await this.hasher.verify(input.password, hashToCheck);
    if (!user || !passwordMatches) throw new InvalidCredentialsError();

    return this.sessions.issue(user, this.clock.now());
  }
}

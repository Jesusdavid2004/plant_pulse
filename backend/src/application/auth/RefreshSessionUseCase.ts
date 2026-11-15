import type { Clock } from '../../domain/care/repositories';
import type {
  RefreshTokenFactory,
  RefreshTokenRepository,
  UserRepository,
} from '../../domain/auth/repositories';
import type { AuthSession } from '../../domain/auth/types';
import { InvalidRefreshTokenError } from '../../domain/errors';
import type { SessionIssuer } from './SessionIssuer';

export interface RefreshSessionInput {
  refreshToken: string;
}

export class RefreshSessionUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly refreshTokens: RefreshTokenRepository,
    private readonly refreshFactory: RefreshTokenFactory,
    private readonly sessions: SessionIssuer,
    private readonly clock: Clock,
  ) {}

  async execute(input: RefreshSessionInput): Promise<AuthSession> {
    const now = this.clock.now();
    const stored = await this.refreshTokens.findByHash(
      this.refreshFactory.hash(input.refreshToken),
    );
    if (!stored) throw new InvalidRefreshTokenError();

    if (stored.revokedAt) {
      await this.refreshTokens.revokeAllForUser(stored.userId, now);
      throw new InvalidRefreshTokenError();
    }
    if (stored.expiresAt <= now) throw new InvalidRefreshTokenError();

    const user = await this.users.findById(stored.userId);
    if (!user) throw new InvalidRefreshTokenError();

    await this.refreshTokens.revoke(stored.id, now);
    return this.sessions.issue(user, now);
  }
}

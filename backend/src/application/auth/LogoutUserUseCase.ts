import type { Clock } from '../../domain/care/repositories';
import type { RefreshTokenFactory, RefreshTokenRepository } from '../../domain/auth/repositories';

export interface LogoutUserInput {
  refreshToken: string | undefined;
}

export class LogoutUserUseCase {
  constructor(
    private readonly refreshTokens: RefreshTokenRepository,
    private readonly refreshFactory: RefreshTokenFactory,
    private readonly clock: Clock,
  ) {}

  async execute(input: LogoutUserInput): Promise<void> {
    if (!input.refreshToken) return;
    const stored = await this.refreshTokens.findByHash(
      this.refreshFactory.hash(input.refreshToken),
    );
    if (!stored || stored.revokedAt) return;
    await this.refreshTokens.revoke(stored.id, this.clock.now());
  }
}

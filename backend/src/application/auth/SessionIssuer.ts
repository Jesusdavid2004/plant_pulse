import type {
  AccessTokenService,
  RefreshTokenFactory,
  RefreshTokenRepository,
} from '../../domain/auth/repositories';
import { toPublicUser, type AuthSession, type UserRecord } from '../../domain/auth/types';

export class SessionIssuer {
  constructor(
    private readonly accessTokens: AccessTokenService,
    private readonly refreshFactory: RefreshTokenFactory,
    private readonly refreshTokens: RefreshTokenRepository,
  ) {}

  async issue(user: UserRecord, now: Date): Promise<AuthSession> {
    const refresh = this.refreshFactory.generate();
    await this.refreshTokens.create(user.id, refresh.hash, this.refreshFactory.expiresAt(now));
    return {
      user: toPublicUser(user),
      accessToken: this.accessTokens.sign(user.id),
      refreshToken: refresh.token,
    };
  }
}

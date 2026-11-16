import jwt from 'jsonwebtoken';
import type { UnsubscribeTokenService } from '../../domain/notifications/ports';

const UNSUBSCRIBE_PURPOSE = 'unsubscribe';
const TOKEN_LIFETIME = '180d';

export class JwtUnsubscribeTokenService implements UnsubscribeTokenService {
  private readonly secret: string;

  constructor(baseSecret: string) {
    this.secret = `${baseSecret}:${UNSUBSCRIBE_PURPOSE}`;
  }

  sign(userId: string): string {
    return jwt.sign({ sub: userId, purpose: UNSUBSCRIBE_PURPOSE }, this.secret, {
      expiresIn: TOKEN_LIFETIME,
    });
  }

  verify(token: string): { userId: string } | null {
    try {
      const payload = jwt.verify(token, this.secret);
      if (typeof payload === 'string' || payload.purpose !== UNSUBSCRIBE_PURPOSE) return null;
      return typeof payload.sub === 'string' ? { userId: payload.sub } : null;
    } catch {
      return null;
    }
  }
}

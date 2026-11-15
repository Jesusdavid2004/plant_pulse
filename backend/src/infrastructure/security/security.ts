import { createHash, randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type {
  AccessTokenService,
  PasswordHasher,
  RefreshTokenFactory,
} from '../../domain/auth/repositories';
import { MILLISECONDS_PER_DAY, SECONDS_PER_MINUTE } from '../../shared/constants';

const BCRYPT_COST = 12;
const REFRESH_TOKEN_BYTES = 48;
const TOKEN_ALGORITHM = 'HS256';

export class BcryptPasswordHasher implements PasswordHasher {
  constructor(private readonly cost: number = BCRYPT_COST) {}

  hash(plainText: string): Promise<string> {
    return bcrypt.hash(plainText, this.cost);
  }

  verify(plainText: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plainText, hash);
  }
}

export class JwtAccessTokenService implements AccessTokenService {
  constructor(
    private readonly secret: string,
    private readonly lifetimeMinutes: number,
  ) {}

  sign(userId: string): string {
    return jwt.sign({}, this.secret, {
      subject: userId,
      algorithm: TOKEN_ALGORITHM,
      expiresIn: this.lifetimeMinutes * SECONDS_PER_MINUTE,
    });
  }

  verify(token: string): { userId: string } | null {
    try {
      const payload = jwt.verify(token, this.secret, { algorithms: [TOKEN_ALGORITHM] });
      if (typeof payload === 'string' || !payload.sub) return null;
      return { userId: payload.sub };
    } catch {
      return null;
    }
  }
}

export class CryptoRefreshTokenFactory implements RefreshTokenFactory {
  constructor(private readonly lifetimeDays: number) {}

  generate(): { token: string; hash: string } {
    const token = randomBytes(REFRESH_TOKEN_BYTES).toString('base64url');
    return { token, hash: this.hash(token) };
  }

  hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  expiresAt(from: Date): Date {
    return new Date(from.getTime() + this.lifetimeDays * MILLISECONDS_PER_DAY);
  }
}

import type { Locale } from '../../shared/constants';
import type { UserRecord } from './types';

export interface UserPreferencesChange {
  emailNotifications?: boolean;
  locale?: Locale;
}

export interface UserRepository {
  create(
    email: string,
    passwordHash: string,
    name: string | null,
    locale: Locale,
  ): Promise<UserRecord>;
  updatePreferences(userId: string, changes: UserPreferencesChange): Promise<UserRecord>;
  findByEmail(email: string): Promise<UserRecord | null>;
  findById(userId: string): Promise<UserRecord | null>;
  delete(userId: string): Promise<void>;
}

export interface StoredRefreshToken {
  id: string;
  userId: string;
  expiresAt: Date;
  revokedAt: Date | null;
}

export interface RefreshTokenRepository {
  create(userId: string, tokenHash: string, expiresAt: Date): Promise<void>;
  findByHash(tokenHash: string): Promise<StoredRefreshToken | null>;
  revoke(tokenId: string, revokedAt: Date): Promise<void>;
  revokeAllForUser(userId: string, revokedAt: Date): Promise<void>;
}

export interface PasswordHasher {
  hash(plainText: string): Promise<string>;
  verify(plainText: string, hash: string): Promise<boolean>;
}

export interface AccessTokenService {
  sign(userId: string): string;
  verify(token: string): { userId: string } | null;
}

export interface RefreshTokenFactory {
  generate(): { token: string; hash: string };
  hash(token: string): string;
  expiresAt(from: Date): Date;
}

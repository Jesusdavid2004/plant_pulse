import type { PrismaClient } from '../../generated/prisma/client.js';
import type { RefreshTokenRepository, StoredRefreshToken } from '../../domain/auth/repositories';

export class PrismaRefreshTokenRepository implements RefreshTokenRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(userId: string, tokenHash: string, expiresAt: Date): Promise<void> {
    await this.prisma.refreshToken.create({ data: { userId, tokenHash, expiresAt } });
  }

  async findByHash(tokenHash: string): Promise<StoredRefreshToken | null> {
    const row = await this.prisma.refreshToken.findUnique({ where: { tokenHash } });
    if (!row) return null;
    return {
      id: row.id,
      userId: row.userId,
      expiresAt: row.expiresAt,
      revokedAt: row.revokedAt,
    };
  }

  async revoke(tokenId: string, revokedAt: Date): Promise<void> {
    await this.prisma.refreshToken.update({ where: { id: tokenId }, data: { revokedAt } });
  }

  async revokeAllForUser(userId: string, revokedAt: Date): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt },
    });
  }
}

import type { PrismaClient } from '../../generated/prisma/client.js';
import type { UserRepository } from '../../domain/auth/repositories';
import type { UserRecord } from '../../domain/auth/types';

function toRecord(row: {
  id: string;
  email: string;
  name: string | null;
  password: string;
}): UserRecord {
  return { id: row.id, email: row.email, name: row.name, passwordHash: row.password };
}

export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(email: string, passwordHash: string, name: string | null): Promise<UserRecord> {
    const row = await this.prisma.user.create({ data: { email, password: passwordHash, name } });
    return toRecord(row);
  }

  async findByEmail(email: string): Promise<UserRecord | null> {
    const row = await this.prisma.user.findUnique({ where: { email } });
    return row ? toRecord(row) : null;
  }

  async findById(userId: string): Promise<UserRecord | null> {
    const row = await this.prisma.user.findUnique({ where: { id: userId } });
    return row ? toRecord(row) : null;
  }

  async delete(userId: string): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.plant.deleteMany({ where: { userId } }),
      this.prisma.user.delete({ where: { id: userId } }),
    ]);
  }
}

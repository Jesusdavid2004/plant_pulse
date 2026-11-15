import type { UserRepository } from '../../domain/auth/repositories';
import { toPublicUser, type PublicUser } from '../../domain/auth/types';
import { UnauthorizedError } from '../../domain/errors';

export interface GetCurrentUserInput {
  userId: string;
}

export class GetCurrentUserUseCase {
  constructor(private readonly users: UserRepository) {}

  async execute(input: GetCurrentUserInput): Promise<PublicUser> {
    const user = await this.users.findById(input.userId);
    if (!user) throw new UnauthorizedError();
    return toPublicUser(user);
  }
}

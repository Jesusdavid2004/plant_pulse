import type { UserRepository } from '../../domain/auth/repositories';
import type { ImageStorage } from '../../domain/ai/repositories';
import type { PhotoRepository } from '../../domain/plants/repositories';

export interface DeleteAccountInput {
  userId: string;
}

export class DeleteAccountUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly photos: PhotoRepository,
    private readonly storage: ImageStorage,
  ) {}

  async execute(input: DeleteAccountInput): Promise<void> {
    const storageKeys = await this.photos.listStorageKeysByOwner(input.userId);
    await this.users.delete(input.userId);
    await Promise.all(storageKeys.map((key) => this.storage.remove(key)));
  }
}

import type { Clock } from '../../domain/care/repositories';
import { PlantNotFoundError } from '../../domain/errors';
import type { GameResultRepository, PetProgressRepository } from '../../domain/pet/repositories';
import { buildPetProfile, coinsEarnedInLastDay, type PetProfile } from './PetProfile';

export interface GetPetProfileInput {
  plantId: string;
  ownerId: string;
}

export class GetPetProfileUseCase {
  constructor(
    private readonly progress: PetProgressRepository,
    private readonly games: GameResultRepository,
    private readonly clock: Clock,
  ) {}

  async execute(input: GetPetProfileInput): Promise<PetProfile> {
    const current = await this.progress.findForOwner(input.plantId, input.ownerId);
    if (!current) throw new PlantNotFoundError();
    const earned = await coinsEarnedInLastDay(this.games, input.plantId, this.clock.now());
    return buildPetProfile(input.plantId, current, earned);
  }
}

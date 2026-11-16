import type { Clock } from '../../domain/care/repositories';
import { PlantNotFoundError, UnknownCatalogItemError } from '../../domain/errors';
import { isPotKey, isSceneKey } from '../../domain/pet/Catalog';
import type { PetProgress } from '../../domain/pet/PetProgress';
import type { GameResultRepository, PetProgressRepository } from '../../domain/pet/repositories';
import { buildPetProfile, coinsEarnedInLastDay, type PetProfile } from './PetProfile';

export interface CustomizePetInput {
  plantId: string;
  ownerId: string;
}

abstract class CustomizePetUseCase<TInput extends CustomizePetInput> {
  constructor(
    private readonly progress: PetProgressRepository,
    private readonly games: GameResultRepository,
    private readonly clock: Clock,
  ) {}

  protected abstract apply(current: PetProgress, input: TInput): PetProgress;

  async execute(input: TInput): Promise<PetProfile> {
    const previous = await this.progress.findForOwner(input.plantId, input.ownerId);
    if (!previous) throw new PlantNotFoundError();

    const next = this.apply(previous, input);
    await this.progress.save(input.plantId, previous, next);
    const earned = await coinsEarnedInLastDay(this.games, input.plantId, this.clock.now());
    return buildPetProfile(input.plantId, next, earned);
  }
}

export interface PurchasePotInput extends CustomizePetInput {
  pot: string;
}

export class PurchasePotUseCase extends CustomizePetUseCase<PurchasePotInput> {
  protected apply(current: PetProgress, input: PurchasePotInput): PetProgress {
    if (!isPotKey(input.pot)) throw new UnknownCatalogItemError();
    return current.buyPot(input.pot);
  }
}

export interface EquipCosmeticsInput extends CustomizePetInput {
  scene?: string;
  pot?: string;
}

export class EquipCosmeticsUseCase extends CustomizePetUseCase<EquipCosmeticsInput> {
  protected apply(current: PetProgress, input: EquipCosmeticsInput): PetProgress {
    let next = current;
    if (input.scene !== undefined) {
      if (!isSceneKey(input.scene)) throw new UnknownCatalogItemError();
      next = next.equipScene(input.scene);
    }
    if (input.pot !== undefined) {
      if (!isPotKey(input.pot)) throw new UnknownCatalogItemError();
      next = next.equipPot(input.pot);
    }
    return next;
  }
}

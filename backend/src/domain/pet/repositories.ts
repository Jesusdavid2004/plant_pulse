import type { PetProgress } from './PetProgress';
import type { GameType, Reward } from './Rewards';

export interface PetProgressRepository {
  findForOwner(plantId: string, ownerId: string): Promise<PetProgress | null>;
  save(plantId: string, previous: PetProgress, next: PetProgress): Promise<void>;
}

export interface GameResultRepository {
  coinsEarnedSince(plantId: string, since: Date): Promise<number>;
  record(plantId: string, game: GameType, score: number, reward: Reward, at: Date): Promise<void>;
}

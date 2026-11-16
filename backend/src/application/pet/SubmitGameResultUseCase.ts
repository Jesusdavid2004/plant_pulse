import type { Clock } from '../../domain/care/repositories';
import { InvalidGameError, PlantNotFoundError } from '../../domain/errors';
import type { GameResultRepository, PetProgressRepository } from '../../domain/pet/repositories';
import { gameReward, isGameType, type Reward } from '../../domain/pet/Rewards';
import { buildPetProfile, coinsEarnedInLastDay, type PetProfile } from './PetProfile';

export interface SubmitGameResultInput {
  plantId: string;
  ownerId: string;
  game: string;
  score: number;
}

export interface SubmitGameResultOutput {
  reward: Reward;
  leveledUp: boolean;
  profile: PetProfile;
}

export class SubmitGameResultUseCase {
  constructor(
    private readonly progress: PetProgressRepository,
    private readonly games: GameResultRepository,
    private readonly clock: Clock,
  ) {}

  async execute(input: SubmitGameResultInput): Promise<SubmitGameResultOutput> {
    if (!isGameType(input.game)) throw new InvalidGameError();

    const previous = await this.progress.findForOwner(input.plantId, input.ownerId);
    if (!previous) throw new PlantNotFoundError();

    const now = this.clock.now();
    const earnedToday = await coinsEarnedInLastDay(this.games, input.plantId, now);
    const reward = gameReward(input.score, earnedToday);
    const next = previous.earn(reward);

    await this.progress.save(input.plantId, previous, next);
    await this.games.record(input.plantId, input.game, input.score, reward, now);

    return {
      reward,
      leveledUp: next.level > previous.level,
      profile: buildPetProfile(input.plantId, next, earnedToday + reward.coins),
    };
  }
}

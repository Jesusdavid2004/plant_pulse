import { MILLISECONDS_PER_DAY } from '../../shared/constants';
import {
  POT_KEYS,
  POT_PRICES,
  SCENE_KEYS,
  SCENE_UNLOCK_LEVELS,
  type PotKey,
  type SceneKey,
} from '../../domain/pet/Catalog';
import type { PetProgress } from '../../domain/pet/PetProgress';
import { DAILY_GAME_COIN_CAP } from '../../domain/pet/Rewards';
import type { GameResultRepository } from '../../domain/pet/repositories';

export interface PetProfile {
  plantId: string;
  level: number;
  xp: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  coins: number;
  scene: SceneKey;
  pot: PotKey;
  dailyCoinsRemaining: number;
  scenes: { key: SceneKey; unlockLevel: number; unlocked: boolean }[];
  pots: { key: PotKey; price: number; owned: boolean }[];
}

export function buildPetProfile(
  plantId: string,
  progress: PetProgress,
  coinsEarnedToday: number,
): PetProfile {
  return {
    plantId,
    level: progress.level,
    xp: progress.xp,
    xpIntoLevel: progress.xpIntoLevel,
    xpForNextLevel: progress.xpForNextLevel,
    coins: progress.coins,
    scene: progress.scene,
    pot: progress.pot,
    dailyCoinsRemaining: Math.max(0, DAILY_GAME_COIN_CAP - coinsEarnedToday),
    scenes: SCENE_KEYS.map((key) => ({
      key,
      unlockLevel: SCENE_UNLOCK_LEVELS[key],
      unlocked: progress.isSceneUnlocked(key),
    })),
    pots: POT_KEYS.map((key) => ({ key, price: POT_PRICES[key], owned: progress.owns(key) })),
  };
}

export async function coinsEarnedInLastDay(
  games: GameResultRepository,
  plantId: string,
  now: Date,
): Promise<number> {
  return games.coinsEarnedSince(plantId, new Date(now.getTime() - MILLISECONDS_PER_DAY));
}

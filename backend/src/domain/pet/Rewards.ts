import { CareType } from '../care/CareType';
import { MILLISECONDS_PER_DAY } from '../../shared/constants';

export const GAME_TYPES = ['DROP_CATCH', 'MEMORY_MATCH'] as const;
export type GameType = (typeof GAME_TYPES)[number];

export interface Reward {
  xp: number;
  coins: number;
}

export const NO_REWARD: Reward = { xp: 0, coins: 0 };

export const CARE_REWARDS: Record<CareType, Reward> = {
  [CareType.WATER]: { xp: 10, coins: 5 },
  [CareType.SUN]: { xp: 8, coins: 4 },
  [CareType.FERTILIZE]: { xp: 12, coins: 6 },
};
export const CARE_REWARD_COOLDOWN_MS = MILLISECONDS_PER_DAY / 4;

export const MAX_GAME_SCORE = 40;
const SCORE_PER_COIN = 4;
const SCORE_PER_XP = 2;
export const DAILY_GAME_COIN_CAP = 60;

export function isGameType(value: unknown): value is GameType {
  return GAME_TYPES.includes(value as GameType);
}

export function careReward(type: CareType, lastCareAt: Date | undefined, now: Date): Reward {
  const onCooldown =
    lastCareAt !== undefined && now.getTime() - lastCareAt.getTime() < CARE_REWARD_COOLDOWN_MS;
  return onCooldown ? NO_REWARD : CARE_REWARDS[type];
}

export function gameReward(score: number, coinsEarnedToday: number): Reward {
  const clamped = Math.max(0, Math.min(MAX_GAME_SCORE, Math.floor(score)));
  const coinsLeft = Math.max(0, DAILY_GAME_COIN_CAP - coinsEarnedToday);
  return {
    xp: Math.floor(clamped / SCORE_PER_XP),
    coins: Math.min(Math.floor(clamped / SCORE_PER_COIN), coinsLeft),
  };
}

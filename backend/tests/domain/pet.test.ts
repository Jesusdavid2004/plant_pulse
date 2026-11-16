import { describe, expect, it } from 'vitest';
import { CareType } from '../../src/domain/care/CareType';
import {
  InsufficientCoinsError,
  ItemAlreadyOwnedError,
  ItemNotOwnedError,
  SceneLockedError,
} from '../../src/domain/errors';
import { PetProgress, levelForXp, xpRequiredForLevel } from '../../src/domain/pet/PetProgress';
import {
  CARE_REWARD_COOLDOWN_MS,
  DAILY_GAME_COIN_CAP,
  MAX_GAME_SCORE,
  careReward,
  gameReward,
} from '../../src/domain/pet/Rewards';

const NOW = new Date('2026-11-16T12:00:00Z');

describe('levels', () => {
  it('starts at level one and needs more experience for each next level', () => {
    expect(levelForXp(0)).toBe(1);
    expect(levelForXp(xpRequiredForLevel(2))).toBe(2);
    expect(levelForXp(xpRequiredForLevel(2) - 1)).toBe(1);
    expect(xpRequiredForLevel(4) - xpRequiredForLevel(3)).toBeGreaterThan(
      xpRequiredForLevel(3) - xpRequiredForLevel(2),
    );
  });

  it('reports progress inside the current level', () => {
    const progress = PetProgress.initial().earn({ xp: xpRequiredForLevel(2) + 5, coins: 0 });

    expect(progress.level).toBe(2);
    expect(progress.xpIntoLevel).toBe(5);
    expect(progress.xpForNextLevel).toBe(xpRequiredForLevel(3) - xpRequiredForLevel(2));
  });
});

describe('rewards', () => {
  it('rewards care only once per cooldown window', () => {
    const justNow = new Date(NOW.getTime() - 1000);
    const longAgo = new Date(NOW.getTime() - CARE_REWARD_COOLDOWN_MS - 1);

    expect(careReward(CareType.WATER, undefined, NOW).xp).toBeGreaterThan(0);
    expect(careReward(CareType.WATER, justNow, NOW)).toEqual({ xp: 0, coins: 0 });
    expect(careReward(CareType.WATER, longAgo, NOW).xp).toBeGreaterThan(0);
  });

  it('clamps game scores so a forged score cannot farm rewards', () => {
    expect(gameReward(9999, 0)).toEqual(gameReward(MAX_GAME_SCORE, 0));
    expect(gameReward(-5, 0)).toEqual({ xp: 0, coins: 0 });
  });

  it('stops giving coins once the daily cap is reached but still gives experience', () => {
    const reward = gameReward(MAX_GAME_SCORE, DAILY_GAME_COIN_CAP);

    expect(reward.coins).toBe(0);
    expect(reward.xp).toBeGreaterThan(0);
  });
});

describe('PetProgress', () => {
  it('locks scenes until the plant reaches the required level', () => {
    const fresh = PetProgress.initial();

    expect(() => fresh.equipScene('BEACH')).toThrow(SceneLockedError);
    const leveled = fresh.earn({ xp: xpRequiredForLevel(5), coins: 0 });
    expect(leveled.equipScene('BEACH').scene).toBe('BEACH');
  });

  it('buys a pot with coins and lets the owner equip it', () => {
    const rich = PetProgress.initial().earn({ xp: 0, coins: 40 });

    const bought = rich.buyPot('BLUE');

    expect(bought.coins).toBe(10);
    expect(bought.equipPot('BLUE').pot).toBe('BLUE');
  });

  it('refuses to buy without enough coins or to buy twice', () => {
    const rich = PetProgress.initial().earn({ xp: 0, coins: 40 });

    expect(() => PetProgress.initial().buyPot('BLUE')).toThrow(InsufficientCoinsError);
    expect(() => rich.buyPot('BLUE').buyPot('BLUE')).toThrow(ItemAlreadyOwnedError);
  });

  it('refuses to equip a pot that was never bought', () => {
    expect(() => PetProgress.initial().equipPot('GOLD')).toThrow(ItemNotOwnedError);
  });
});

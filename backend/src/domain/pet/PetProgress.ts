import {
  InsufficientCoinsError,
  ItemAlreadyOwnedError,
  ItemNotOwnedError,
  SceneLockedError,
} from '../errors';
import {
  DEFAULT_POT,
  DEFAULT_SCENE,
  POT_PRICES,
  SCENE_UNLOCK_LEVELS,
  type PotKey,
  type SceneKey,
} from './Catalog';
import type { Reward } from './Rewards';

const XP_CURVE_FACTOR = 40;

export function levelForXp(xp: number): number {
  return Math.floor(Math.sqrt(Math.max(0, xp) / XP_CURVE_FACTOR)) + 1;
}

export function xpRequiredForLevel(level: number): number {
  return XP_CURVE_FACTOR * (level - 1) ** 2;
}

export interface PetProgressState {
  xp: number;
  coins: number;
  scene: SceneKey;
  pot: PotKey;
  unlockedPots: readonly PotKey[];
}

export class PetProgress {
  readonly xp: number;
  readonly coins: number;
  readonly scene: SceneKey;
  readonly pot: PotKey;
  readonly unlockedPots: readonly PotKey[];

  constructor(state: PetProgressState) {
    this.xp = state.xp;
    this.coins = state.coins;
    this.scene = state.scene;
    this.pot = state.pot;
    this.unlockedPots = state.unlockedPots;
  }

  static initial(): PetProgress {
    return new PetProgress({
      xp: 0,
      coins: 0,
      scene: DEFAULT_SCENE,
      pot: DEFAULT_POT,
      unlockedPots: [DEFAULT_POT],
    });
  }

  get level(): number {
    return levelForXp(this.xp);
  }

  get xpIntoLevel(): number {
    return this.xp - xpRequiredForLevel(this.level);
  }

  get xpForNextLevel(): number {
    return xpRequiredForLevel(this.level + 1) - xpRequiredForLevel(this.level);
  }

  isSceneUnlocked(scene: SceneKey): boolean {
    return this.level >= SCENE_UNLOCK_LEVELS[scene];
  }

  owns(pot: PotKey): boolean {
    return this.unlockedPots.includes(pot);
  }

  earn(reward: Reward): PetProgress {
    return this.with({ xp: this.xp + reward.xp, coins: this.coins + reward.coins });
  }

  equipScene(scene: SceneKey): PetProgress {
    if (!this.isSceneUnlocked(scene)) throw new SceneLockedError();
    return this.with({ scene });
  }

  buyPot(pot: PotKey): PetProgress {
    if (this.owns(pot)) throw new ItemAlreadyOwnedError();
    if (this.coins < POT_PRICES[pot]) throw new InsufficientCoinsError();
    return this.with({
      coins: this.coins - POT_PRICES[pot],
      unlockedPots: [...this.unlockedPots, pot],
    });
  }

  equipPot(pot: PotKey): PetProgress {
    if (!this.owns(pot)) throw new ItemNotOwnedError();
    return this.with({ pot });
  }

  private with(changes: Partial<PetProgressState>): PetProgress {
    return new PetProgress({
      xp: this.xp,
      coins: this.coins,
      scene: this.scene,
      pot: this.pot,
      unlockedPots: this.unlockedPots,
      ...changes,
    });
  }
}

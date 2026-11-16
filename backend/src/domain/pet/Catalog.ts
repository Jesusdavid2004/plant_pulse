export const SCENE_KEYS = ['LIVING_ROOM', 'GARDEN', 'NIGHT_SKY', 'BEACH', 'GREENHOUSE'] as const;
export const POT_KEYS = ['TERRACOTTA', 'BLUE', 'WHITE', 'PINK', 'GOLD'] as const;

export type SceneKey = (typeof SCENE_KEYS)[number];
export type PotKey = (typeof POT_KEYS)[number];

export const DEFAULT_SCENE: SceneKey = 'LIVING_ROOM';
export const DEFAULT_POT: PotKey = 'TERRACOTTA';

export const SCENE_UNLOCK_LEVELS: Record<SceneKey, number> = {
  LIVING_ROOM: 1,
  GARDEN: 2,
  NIGHT_SKY: 3,
  BEACH: 5,
  GREENHOUSE: 8,
};

export const POT_PRICES: Record<PotKey, number> = {
  TERRACOTTA: 0,
  BLUE: 30,
  WHITE: 30,
  PINK: 50,
  GOLD: 150,
};

export function isSceneKey(value: unknown): value is SceneKey {
  return SCENE_KEYS.includes(value as SceneKey);
}

export function isPotKey(value: unknown): value is PotKey {
  return POT_KEYS.includes(value as PotKey);
}

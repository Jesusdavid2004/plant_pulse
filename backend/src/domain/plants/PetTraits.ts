export const LEAF_SHAPES = [
  'ROUND',
  'POINTED',
  'LONG',
  'SPIKY',
  'HEART',
  'GRASS',
  'BROAD',
] as const;
export const LEAF_COLORS = [
  'GREEN',
  'DARK_GREEN',
  'LIGHT_GREEN',
  'BLUE_GREEN',
  'PURPLE',
  'RED',
] as const;
export const BLOOM_SHAPES = ['NONE', 'SPIKE', 'FLOWER'] as const;
export const BLOOM_COLORS = ['PINK', 'RED', 'ORANGE', 'YELLOW', 'PURPLE', 'WHITE', 'BLUE'] as const;

export type LeafShape = (typeof LEAF_SHAPES)[number];
export type LeafColor = (typeof LEAF_COLORS)[number];
export type BloomShape = (typeof BLOOM_SHAPES)[number];
export type BloomColor = (typeof BLOOM_COLORS)[number];

export interface PetTraits {
  leafShape: LeafShape;
  leafCount: number;
  leafColor: LeafColor;
  bloomShape: BloomShape;
  bloomColor: BloomColor;
}

export const MIN_LEAF_COUNT = 3;
export const MAX_LEAF_COUNT = 9;
export const DEFAULT_PET_TRAITS: PetTraits = {
  leafShape: 'POINTED',
  leafCount: MIN_LEAF_COUNT,
  leafColor: 'GREEN',
  bloomShape: 'NONE',
  bloomColor: 'PINK',
};

function isOneOf<T extends string>(options: readonly T[], value: unknown): value is T {
  return options.includes(value as T);
}

export function isLeafShape(value: unknown): value is LeafShape {
  return isOneOf(LEAF_SHAPES, value);
}

export function buildPetTraits(input: PetTraits): PetTraits {
  const rounded = Math.round(input.leafCount);
  return {
    ...input,
    leafCount: Math.max(MIN_LEAF_COUNT, Math.min(MAX_LEAF_COUNT, rounded)),
  };
}

export function parsePetTraits(value: unknown): PetTraits {
  if (typeof value !== 'object' || value === null) return DEFAULT_PET_TRAITS;
  const stored = value as Record<string, unknown>;
  if (!isLeafShape(stored.leafShape) || typeof stored.leafCount !== 'number') {
    return DEFAULT_PET_TRAITS;
  }
  return buildPetTraits({
    leafShape: stored.leafShape,
    leafCount: stored.leafCount,
    leafColor: isOneOf(LEAF_COLORS, stored.leafColor)
      ? stored.leafColor
      : DEFAULT_PET_TRAITS.leafColor,
    bloomShape: isOneOf(BLOOM_SHAPES, stored.bloomShape)
      ? stored.bloomShape
      : DEFAULT_PET_TRAITS.bloomShape,
    bloomColor: isOneOf(BLOOM_COLORS, stored.bloomColor)
      ? stored.bloomColor
      : DEFAULT_PET_TRAITS.bloomColor,
  });
}

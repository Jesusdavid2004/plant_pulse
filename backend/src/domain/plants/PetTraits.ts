export const LEAF_SHAPES = [
  'ROUND',
  'POINTED',
  'LONG',
  'SPIKY',
  'HEART',
  'GRASS',
  'BROAD',
  'SWORD',
  'FROND',
] as const;
export const GROWTH_FORMS = [
  'ROSETTE',
  'UPRIGHT',
  'STALKED',
  'BUSHY',
  'PALM',
  'TREE',
  'CACTUS',
  'TRAILING',
] as const;
export const LEAF_PATTERNS = ['PLAIN', 'STRIPED', 'VEINED'] as const;
export const LEAF_COLORS = [
  'GREEN',
  'DARK_GREEN',
  'LIGHT_GREEN',
  'BLUE_GREEN',
  'PURPLE',
  'RED',
] as const;
export const BLOOM_SHAPES = ['NONE', 'SPIKE', 'FLOWER', 'SPATHE'] as const;
export const BLOOM_COLORS = ['PINK', 'RED', 'ORANGE', 'YELLOW', 'PURPLE', 'WHITE', 'BLUE'] as const;

export type LeafShape = (typeof LEAF_SHAPES)[number];
export type GrowthForm = (typeof GROWTH_FORMS)[number];
export type LeafPattern = (typeof LEAF_PATTERNS)[number];
export type LeafColor = (typeof LEAF_COLORS)[number];
export type BloomShape = (typeof BLOOM_SHAPES)[number];
export type BloomColor = (typeof BLOOM_COLORS)[number];

export interface PetTraits {
  growthForm: GrowthForm;
  leafShape: LeafShape;
  leafCount: number;
  leafColor: LeafColor;
  leafPattern: LeafPattern;
  bloomShape: BloomShape;
  bloomColor: BloomColor;
}

export const MIN_LEAF_COUNT = 3;
export const MAX_LEAF_COUNT = 12;
export const DEFAULT_PET_TRAITS: PetTraits = {
  growthForm: 'ROSETTE',
  leafShape: 'POINTED',
  leafCount: MIN_LEAF_COUNT,
  leafColor: 'GREEN',
  leafPattern: 'PLAIN',
  bloomShape: 'NONE',
  bloomColor: 'PINK',
};

function isOneOf<T extends string>(options: readonly T[], value: unknown): value is T {
  return options.includes(value as T);
}

function pickOneOf<T extends string>(options: readonly T[], value: unknown, fallback: T): T {
  return isOneOf(options, value) ? value : fallback;
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
  if (!isOneOf(LEAF_SHAPES, stored.leafShape) || typeof stored.leafCount !== 'number') {
    return DEFAULT_PET_TRAITS;
  }
  return buildPetTraits({
    growthForm: pickOneOf(GROWTH_FORMS, stored.growthForm, DEFAULT_PET_TRAITS.growthForm),
    leafShape: stored.leafShape,
    leafCount: stored.leafCount,
    leafColor: pickOneOf(LEAF_COLORS, stored.leafColor, DEFAULT_PET_TRAITS.leafColor),
    leafPattern: pickOneOf(LEAF_PATTERNS, stored.leafPattern, DEFAULT_PET_TRAITS.leafPattern),
    bloomShape: pickOneOf(BLOOM_SHAPES, stored.bloomShape, DEFAULT_PET_TRAITS.bloomShape),
    bloomColor: pickOneOf(BLOOM_COLORS, stored.bloomColor, DEFAULT_PET_TRAITS.bloomColor),
  });
}

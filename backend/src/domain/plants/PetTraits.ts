export const LEAF_SHAPES = ['ROUND', 'POINTED', 'LONG', 'SPIKY', 'HEART'] as const;

export type LeafShape = (typeof LEAF_SHAPES)[number];

export interface PetTraits {
  leafShape: LeafShape;
  leafCount: number;
}

export const MIN_LEAF_COUNT = 3;
export const MAX_LEAF_COUNT = 7;
export const DEFAULT_PET_TRAITS: PetTraits = { leafShape: 'POINTED', leafCount: MIN_LEAF_COUNT };

export function isLeafShape(value: unknown): value is LeafShape {
  return LEAF_SHAPES.includes(value as LeafShape);
}

export function buildPetTraits(leafShape: LeafShape, leafCount: number): PetTraits {
  const rounded = Math.round(leafCount);
  return {
    leafShape,
    leafCount: Math.max(MIN_LEAF_COUNT, Math.min(MAX_LEAF_COUNT, rounded)),
  };
}

export function parsePetTraits(value: unknown): PetTraits {
  if (typeof value !== 'object' || value === null) return DEFAULT_PET_TRAITS;
  const { leafShape, leafCount } = value as Record<string, unknown>;
  if (!isLeafShape(leafShape) || typeof leafCount !== 'number') return DEFAULT_PET_TRAITS;
  return buildPetTraits(leafShape, leafCount);
}

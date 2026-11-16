import { describe, expect, it } from 'vitest';
import { careProfileForCategory } from '../../src/domain/care/CareCatalog';
import { CareType } from '../../src/domain/care/CareType';
import { assessHealth, statusForScore } from '../../src/domain/plants/HealthAssessment';
import {
  buildPetTraits,
  DEFAULT_PET_TRAITS,
  MAX_LEAF_COUNT,
  MIN_LEAF_COUNT,
  parsePetTraits,
} from '../../src/domain/plants/PetTraits';

describe('careProfileForCategory', () => {
  it('asks a succulent to be watered less often than a fern', () => {
    const succulent = careProfileForCategory('SUCCULENT');
    const fern = careProfileForCategory('FERN');

    expect(succulent.intervalFor(CareType.WATER)).toBeGreaterThan(fern.intervalFor(CareType.WATER));
  });

  it('falls back to the default profile for unknown or missing categories', () => {
    const fallback = careProfileForCategory('UNKNOWN');

    expect(careProfileForCategory(null).intervalFor(CareType.WATER)).toBe(
      fallback.intervalFor(CareType.WATER),
    );
    expect(careProfileForCategory('MADE_UP').intervalFor(CareType.SUN)).toBe(
      fallback.intervalFor(CareType.SUN),
    );
  });
});

describe('assessHealth', () => {
  it('scores a healthy plant high and healthy', () => {
    expect(assessHealth('HEALTHY', 'NONE')).toEqual({ score: 92, status: 'healthy' });
  });

  it('lowers the score as the severity of a problem grows', () => {
    const mild = assessHealth('PESTS', 'MILD');
    const moderate = assessHealth('PESTS', 'MODERATE');
    const severe = assessHealth('PESTS', 'SEVERE');

    expect(mild.score).toBeGreaterThan(moderate.score);
    expect(moderate.score).toBeGreaterThan(severe.score);
    expect([mild.status, moderate.status, severe.status]).toEqual([
      'healthy',
      'warning',
      'critical',
    ]);
  });

  it('ignores a severity reported for a healthy plant', () => {
    expect(assessHealth('HEALTHY', 'SEVERE').score).toBe(92);
  });

  it('never leaves the 0 to 100 range', () => {
    expect(assessHealth('UNKNOWN', 'SEVERE').score).toBeGreaterThanOrEqual(0);
    expect(assessHealth('HEALTHY', 'NONE').score).toBeLessThanOrEqual(100);
  });

  it('maps score boundaries to statuses', () => {
    expect(statusForScore(70)).toBe('healthy');
    expect(statusForScore(69)).toBe('warning');
    expect(statusForScore(40)).toBe('warning');
    expect(statusForScore(39)).toBe('critical');
  });
});

describe('PetTraits', () => {
  const roundTraits = { ...DEFAULT_PET_TRAITS, leafShape: 'ROUND' } as const;

  it('clamps the number of leaves to what the character can draw', () => {
    expect(buildPetTraits({ ...roundTraits, leafCount: 1 }).leafCount).toBe(MIN_LEAF_COUNT);
    expect(buildPetTraits({ ...roundTraits, leafCount: 30 }).leafCount).toBe(MAX_LEAF_COUNT);
    expect(buildPetTraits({ ...roundTraits, leafCount: 4.6 }).leafCount).toBe(5);
  });

  it('falls back to default traits for corrupted stored data', () => {
    expect(parsePetTraits(null)).toEqual(DEFAULT_PET_TRAITS);
    expect(parsePetTraits({ leafShape: 'TRIANGLE', leafCount: 4 })).toEqual(DEFAULT_PET_TRAITS);
    expect(parsePetTraits({ leafShape: 'SPIKY', leafCount: 'many' })).toEqual(DEFAULT_PET_TRAITS);
  });

  it('keeps valid stored traits including color and bloom', () => {
    const stored = {
      growthForm: 'UPRIGHT',
      leafShape: 'SWORD',
      leafCount: 6,
      leafColor: 'DARK_GREEN',
      leafPattern: 'STRIPED',
      bloomShape: 'SPATHE',
      bloomColor: 'WHITE',
    };
    expect(parsePetTraits(stored)).toEqual(stored);
  });

  it('keeps the default silhouette for plants stored before growth forms existed', () => {
    const parsed = parsePetTraits({ leafShape: 'GRASS', leafCount: 6, leafColor: 'GREEN' });

    expect(parsed.growthForm).toBe(DEFAULT_PET_TRAITS.growthForm);
    expect(parsed.leafPattern).toBe(DEFAULT_PET_TRAITS.leafPattern);
  });

  it('upgrades traits stored before color and bloom existed', () => {
    expect(parsePetTraits({ leafShape: 'SPIKY', leafCount: 6 })).toEqual({
      ...DEFAULT_PET_TRAITS,
      leafShape: 'SPIKY',
      leafCount: 6,
    });
  });
});

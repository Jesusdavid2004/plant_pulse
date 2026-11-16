import { describe, expect, it } from 'vitest';
import { GetPlantMoodUseCase } from '../../src/application/care/GetPlantMoodUseCase';
import { LogCareEventUseCase } from '../../src/application/care/LogCareEventUseCase';
import { CareType } from '../../src/domain/care/CareType';
import { InvalidCareTypeError, PlantNotFoundError } from '../../src/domain/errors';
import { Mood } from '../../src/domain/care/PlantMood';
import {
  buildPlant,
  FixedClock,
  InMemoryCareEventRepository,
  InMemoryPetProgressRepository,
  InMemoryPlantReader,
  OWNER_ID,
} from '../fakes/fakes';

const NOW = new Date('2026-11-15T12:00:00Z');

function setup(healthScore: number | null = null) {
  const plants = new InMemoryPlantReader([buildPlant({ latestHealthScore: healthScore })]);
  const careEvents = new InMemoryCareEventRepository();
  const clock = new FixedClock(NOW);
  const progress = new InMemoryPetProgressRepository();
  return {
    careEvents,
    progress,
    logCare: new LogCareEventUseCase(plants, careEvents, progress, clock),
    getMood: new GetPlantMoodUseCase(plants, careEvents, clock),
  };
}

describe('LogCareEventUseCase', () => {
  it('records a watering at the current time', async () => {
    const { logCare, careEvents } = setup();

    const result = await logCare.execute({ plantId: 'plant-1', ownerId: OWNER_ID, type: 'WATER' });

    expect(result.occurredAt).toEqual(NOW);
    expect(careEvents.events).toEqual([
      { plantId: 'plant-1', type: CareType.WATER, occurredAt: NOW },
    ]);
  });

  it('rejects an unknown care type', async () => {
    const { logCare } = setup();

    await expect(
      logCare.execute({ plantId: 'plant-1', ownerId: OWNER_ID, type: 'DANCE' }),
    ).rejects.toBeInstanceOf(InvalidCareTypeError);
  });

  it('rejects care for a plant that does not exist', async () => {
    const { logCare, careEvents } = setup();

    await expect(
      logCare.execute({ plantId: 'missing', ownerId: OWNER_ID, type: 'WATER' }),
    ).rejects.toBeInstanceOf(PlantNotFoundError);
    expect(careEvents.events).toHaveLength(0);
  });
});

describe('care rewards', () => {
  it('rewards real care with experience and coins', async () => {
    const { logCare, progress } = setup();

    const result = await logCare.execute({ plantId: 'plant-1', ownerId: OWNER_ID, type: 'WATER' });

    expect(result.reward).toEqual({ xp: 10, coins: 5 });
    expect(progress.current().coins).toBe(5);
  });

  it('does not reward repeating the same care again right away', async () => {
    const { logCare, progress } = setup();

    await logCare.execute({ plantId: 'plant-1', ownerId: OWNER_ID, type: 'WATER' });
    const second = await logCare.execute({ plantId: 'plant-1', ownerId: OWNER_ID, type: 'WATER' });

    expect(second.reward).toEqual({ xp: 0, coins: 0 });
    expect(progress.current().coins).toBe(5);
  });

  it('still rewards a different kind of care', async () => {
    const { logCare } = setup();

    await logCare.execute({ plantId: 'plant-1', ownerId: OWNER_ID, type: 'WATER' });
    const sun = await logCare.execute({ plantId: 'plant-1', ownerId: OWNER_ID, type: 'SUN' });

    expect(sun.reward.xp).toBeGreaterThan(0);
  });
});

describe('plant ownership', () => {
  it('does not let another user log care or read the mood of a plant', async () => {
    const { logCare, getMood, careEvents } = setup();

    await expect(
      logCare.execute({ plantId: 'plant-1', ownerId: 'intruder', type: 'WATER' }),
    ).rejects.toBeInstanceOf(PlantNotFoundError);
    await expect(
      getMood.execute({ plantId: 'plant-1', ownerId: 'intruder' }),
    ).rejects.toBeInstanceOf(PlantNotFoundError);
    expect(careEvents.events).toHaveLength(0);
  });
});

describe('GetPlantMoodUseCase', () => {
  it('turns a neglected plant sad and makes it happy again after care is logged', async () => {
    const { getMood, logCare } = setup();

    const neglected = await getMood.execute({ plantId: 'plant-1', ownerId: OWNER_ID });
    expect(neglected.mood).toBe(Mood.SAD);

    await logCare.execute({ plantId: 'plant-1', ownerId: OWNER_ID, type: 'WATER' });
    await logCare.execute({ plantId: 'plant-1', ownerId: OWNER_ID, type: 'SUN' });
    await logCare.execute({ plantId: 'plant-1', ownerId: OWNER_ID, type: 'FERTILIZE' });

    const cared = await getMood.execute({ plantId: 'plant-1', ownerId: OWNER_ID });
    expect(cared.mood).toBe(Mood.HAPPY);
  });

  it('reports a sick plant when the latest analysis score is low', async () => {
    const { getMood, logCare } = setup(20);
    await logCare.execute({ plantId: 'plant-1', ownerId: OWNER_ID, type: 'WATER' });
    await logCare.execute({ plantId: 'plant-1', ownerId: OWNER_ID, type: 'SUN' });
    await logCare.execute({ plantId: 'plant-1', ownerId: OWNER_ID, type: 'FERTILIZE' });

    const result = await getMood.execute({ plantId: 'plant-1', ownerId: OWNER_ID });

    expect(result.mood).toBe(Mood.SICK);
  });

  it('rejects a plant that does not exist', async () => {
    const { getMood } = setup();

    await expect(getMood.execute({ plantId: 'missing', ownerId: OWNER_ID })).rejects.toBeInstanceOf(
      PlantNotFoundError,
    );
  });
});

import { describe, expect, it } from 'vitest';
import { GetPlantMoodUseCase } from '../../src/application/care/GetPlantMoodUseCase';
import { LogCareEventUseCase } from '../../src/application/care/LogCareEventUseCase';
import { CareType } from '../../src/domain/care/CareType';
import { InvalidCareTypeError, PlantNotFoundError } from '../../src/domain/care/errors';
import { Mood } from '../../src/domain/care/PlantMood';
import {
  buildPlant,
  FixedClock,
  InMemoryCareEventRepository,
  InMemoryPlantReader,
} from '../fakes/fakes';

const NOW = new Date('2026-11-15T12:00:00Z');

function setup(healthScore: number | null = null) {
  const plants = new InMemoryPlantReader([buildPlant({ latestHealthScore: healthScore })]);
  const careEvents = new InMemoryCareEventRepository();
  const clock = new FixedClock(NOW);
  return {
    careEvents,
    logCare: new LogCareEventUseCase(plants, careEvents, clock),
    getMood: new GetPlantMoodUseCase(plants, careEvents, clock),
  };
}

describe('LogCareEventUseCase', () => {
  it('records a watering at the current time', async () => {
    const { logCare, careEvents } = setup();

    const result = await logCare.execute({ plantId: 'plant-1', type: 'WATER' });

    expect(result.occurredAt).toEqual(NOW);
    expect(careEvents.events).toEqual([
      { plantId: 'plant-1', type: CareType.WATER, occurredAt: NOW },
    ]);
  });

  it('rejects an unknown care type', async () => {
    const { logCare } = setup();

    await expect(logCare.execute({ plantId: 'plant-1', type: 'DANCE' })).rejects.toBeInstanceOf(
      InvalidCareTypeError,
    );
  });

  it('rejects care for a plant that does not exist', async () => {
    const { logCare, careEvents } = setup();

    await expect(logCare.execute({ plantId: 'missing', type: 'WATER' })).rejects.toBeInstanceOf(
      PlantNotFoundError,
    );
    expect(careEvents.events).toHaveLength(0);
  });
});

describe('GetPlantMoodUseCase', () => {
  it('turns a neglected plant sad and makes it happy again after care is logged', async () => {
    const { getMood, logCare } = setup();

    const neglected = await getMood.execute({ plantId: 'plant-1' });
    expect(neglected.mood).toBe(Mood.SAD);

    await logCare.execute({ plantId: 'plant-1', type: 'WATER' });
    await logCare.execute({ plantId: 'plant-1', type: 'SUN' });
    await logCare.execute({ plantId: 'plant-1', type: 'FERTILIZE' });

    const cared = await getMood.execute({ plantId: 'plant-1' });
    expect(cared.mood).toBe(Mood.HAPPY);
  });

  it('reports a sick plant when the latest analysis score is low', async () => {
    const { getMood, logCare } = setup(20);
    await logCare.execute({ plantId: 'plant-1', type: 'WATER' });
    await logCare.execute({ plantId: 'plant-1', type: 'SUN' });
    await logCare.execute({ plantId: 'plant-1', type: 'FERTILIZE' });

    const result = await getMood.execute({ plantId: 'plant-1' });

    expect(result.mood).toBe(Mood.SICK);
  });

  it('rejects a plant that does not exist', async () => {
    const { getMood } = setup();

    await expect(getMood.execute({ plantId: 'missing' })).rejects.toBeInstanceOf(
      PlantNotFoundError,
    );
  });
});

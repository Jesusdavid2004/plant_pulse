import { describe, expect, it } from 'vitest';
import {
  EquipCosmeticsUseCase,
  PurchasePotUseCase,
} from '../../src/application/pet/CustomizePetUseCases';
import { GetPetProfileUseCase } from '../../src/application/pet/GetPetProfileUseCase';
import { SubmitGameResultUseCase } from '../../src/application/pet/SubmitGameResultUseCase';
import {
  InsufficientCoinsError,
  InvalidGameError,
  PlantNotFoundError,
  UnknownCatalogItemError,
} from '../../src/domain/errors';
import { DAILY_GAME_COIN_CAP, MAX_GAME_SCORE } from '../../src/domain/pet/Rewards';
import {
  FixedClock,
  InMemoryGameResultRepository,
  InMemoryPetProgressRepository,
  OWNER_ID,
} from '../fakes/fakes';

const NOW = new Date('2026-11-16T12:00:00Z');

function setup() {
  const progress = new InMemoryPetProgressRepository();
  const games = new InMemoryGameResultRepository();
  const clock = new FixedClock(NOW);
  return {
    progress,
    games,
    submit: new SubmitGameResultUseCase(progress, games, clock),
    profile: new GetPetProfileUseCase(progress, games, clock),
    purchase: new PurchasePotUseCase(progress, games, clock),
    equip: new EquipCosmeticsUseCase(progress, games, clock),
  };
}

const ids = { plantId: 'plant-1', ownerId: OWNER_ID };

describe('SubmitGameResultUseCase', () => {
  it('turns a good score into experience and coins and stores the result', async () => {
    const { submit, games, progress } = setup();

    const result = await submit.execute({ ...ids, game: 'DROP_CATCH', score: MAX_GAME_SCORE });

    expect(result.reward.coins).toBeGreaterThan(0);
    expect(progress.current().coins).toBe(result.reward.coins);
    expect(games.results).toHaveLength(1);
  });

  it('caps the coins a plant can earn from games in one day', async () => {
    const { submit, progress } = setup();

    for (let play = 0; play < 12; play += 1) {
      await submit.execute({ ...ids, game: 'MEMORY_MATCH', score: MAX_GAME_SCORE });
    }

    expect(progress.current().coins).toBe(DAILY_GAME_COIN_CAP);
  });

  it('rejects an unknown game and a plant that belongs to someone else', async () => {
    const { submit } = setup();

    await expect(submit.execute({ ...ids, game: 'POKER', score: 1 })).rejects.toBeInstanceOf(
      InvalidGameError,
    );
    await expect(
      submit.execute({ plantId: 'plant-1', ownerId: 'intruder', game: 'DROP_CATCH', score: 1 }),
    ).rejects.toBeInstanceOf(PlantNotFoundError);
  });
});

describe('customizing the pet', () => {
  it('lists scenes and pots with their lock state', async () => {
    const { profile } = setup();

    const result = await profile.execute(ids);

    expect(result.level).toBe(1);
    expect(result.scenes.find((scene) => scene.key === 'GARDEN')?.unlocked).toBe(false);
    expect(result.pots.find((pot) => pot.key === 'TERRACOTTA')?.owned).toBe(true);
  });

  it('refuses to buy a pot the plant cannot afford', async () => {
    const { purchase } = setup();

    await expect(purchase.execute({ ...ids, pot: 'GOLD' })).rejects.toBeInstanceOf(
      InsufficientCoinsError,
    );
  });

  it('buys and equips a pot after earning coins', async () => {
    const { submit, purchase, equip } = setup();
    for (let play = 0; play < 4; play += 1) {
      await submit.execute({ ...ids, game: 'DROP_CATCH', score: MAX_GAME_SCORE });
    }

    await purchase.execute({ ...ids, pot: 'BLUE' });
    const profile = await equip.execute({ ...ids, pot: 'BLUE' });

    expect(profile.pot).toBe('BLUE');
  });

  it('rejects names that are not in the catalog', async () => {
    const { equip, purchase } = setup();

    await expect(equip.execute({ ...ids, scene: 'MOON' })).rejects.toBeInstanceOf(
      UnknownCatalogItemError,
    );
    await expect(purchase.execute({ ...ids, pot: 'DIAMOND' })).rejects.toBeInstanceOf(
      UnknownCatalogItemError,
    );
  });
});

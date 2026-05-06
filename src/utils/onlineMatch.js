import { ARMY_SETS } from '../data';
import { pickBattlefieldsWithShuffle } from '../game/fieldLogic';
import { countArmies } from './cardUtils';
import { mulberry32, shuffleArraySeeded } from './seededRandom';
import { resolveDeckCardsForArmy } from './deckResolve';

/**
 * Costruisce lo stato iniziale identico su host (prospettiva host: player = host).
 */
export function buildOnlineMatchPayload(hostArmy, hostDeckKey, guestArmy, guestDeckKey, mode, seed, allBattlefields) {
  const rng = mulberry32(seed);
  const hostFullDeck = resolveDeckCardsForArmy(hostArmy, hostDeckKey);
  const guestFullDeck = resolveDeckCardsForArmy(guestArmy, guestDeckKey);
  if (!hostFullDeck.length || !guestFullDeck.length) {
    throw new Error('Uno dei mazzi è vuoto o non valido');
  }

  const hostShuffled = shuffleArraySeeded(hostFullDeck, rng);
  const guestShuffled = shuffleArraySeeded(guestFullDeck, rng);
  const hostPlayerHand = hostShuffled.slice(0, 5).map((c) => ({ ...c, army: c.army || hostArmy }));
  const guestAsEnemyHand = guestShuffled.slice(0, 5).map((c) => ({ ...c, army: c.army || guestArmy }));

  const battlefields = pickBattlefieldsWithShuffle(mode, allBattlefields, (arr) =>
    shuffleArraySeeded(arr, rng)
  );

  const playerLeague = hostPlayerHand.reduce((s, c) => s + c.league, 0);
  const enemyLeague = guestAsEnemyHand.reduce((s, c) => s + c.league, 0);
  const hostIsPlayerFirst =
    playerLeague < enemyLeague ? true : playerLeague > enemyLeague ? false : rng() < 0.5;

  return {
    seed,
    mode,
    battlefields,
    hostPlayerHand,
    hostEnemyHand: guestAsEnemyHand,
    hostIsPlayerFirst,
    hostPlayerArmy: hostArmy,
    hostEnemyArmy: guestArmy,
  };
}

export function calcInitialBonuses(hand) {
  const counts = countArmies(hand);
  const bonuses = {};
  Object.keys(counts).forEach((army) => {
    if (army === 'Patto degli Indocili') {
      bonuses[army] = counts[army] >= 1;
      return;
    }
    bonuses[army] = counts[army] >= 2;
  });
  return bonuses;
}

/** Serializza le carte per il relay (solo id + dati necessari al guest) */
export function serializeHandForRelay(hand) {
  return hand.map((c) => ({
    id: c.id,
    army: c.army,
  }));
}

/**
 * Ricostruisce le carte complete a partire da id salvati nel payload di rete.
 */
export function hydrateHandFromRelay(minimalList) {
  const armyNames = Object.keys(ARMY_SETS);
  return minimalList
    .map(({ id, army }) => {
      for (const a of armyNames) {
        const card = ARMY_SETS[a].find((c) => c.id === id);
        if (card) return { ...card, army: army || card.army || a };
      }
      return null;
    })
    .filter(Boolean);
}

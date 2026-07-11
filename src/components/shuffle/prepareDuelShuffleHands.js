import { ARMY_DECKS, ARMY_SETS } from '../../data';
import { calcInitialBonuses } from '../../utils/onlineMatch';
import { pickDistinctCardBackPair } from '../../utils/cardBackPicker';
import { shuffleArray } from '../../utils/shuffle';
import { getDealtHandIndices } from './cardShuffleDealLayout';

function buildFinalOrderFromHand(deckSize, handDeckIndices) {
  const handSet = new Set(handDeckIndices);
  const rest = [];
  for (let i = 0; i < deckSize; i++) {
    if (!handSet.has(i)) rest.push(i);
  }
  return [...handDeckIndices, ...rest];
}

/**
 * Calcola ordine shuffle, mani e bonus a partire dai mazzi da 10 carte.
 * @param {object[]} playerSet
 * @param {object[]} enemySet
 * @param {string} playerArmy
 * @param {string} enemyArmy
 * @param {{ playerHand?: object[], enemyHand?: object[] }|null} [fixedHands]
 */
export function computeShuffleDealFromSets(playerSet, enemySet, playerArmy, enemyArmy, fixedHands = null) {
  const useFixed =
    fixedHands?.playerHand?.length === 5 && fixedHands?.enemyHand?.length === 5;

  let playerFinalOrder;
  let enemyFinalOrder;
  let playerHand;
  let enemyHand;

  if (useFixed) {
    const playerHandIndices = playerSet.map((card, i) => i).filter((i) =>
      fixedHands.playerHand.some((c) => c.id === playerSet[i].id)
    );
    const enemyHandIndices = enemySet.map((card, i) => i).filter((i) =>
      fixedHands.enemyHand.some((c) => c.id === enemySet[i].id)
    );
    playerFinalOrder = buildFinalOrderFromHand(playerSet.length, playerHandIndices);
    enemyFinalOrder = buildFinalOrderFromHand(enemySet.length, enemyHandIndices);
    playerHand = fixedHands.playerHand.map((card) => ({ ...card, army: card.army || playerArmy }));
    enemyHand = fixedHands.enemyHand.map((card) => ({ ...card, army: card.army || enemyArmy }));
  } else {
    playerFinalOrder = shuffleArray(playerSet.map((_, i) => i));
    enemyFinalOrder = shuffleArray(enemySet.map((_, i) => i));
    playerHand = getDealtHandIndices(playerFinalOrder).map((i) => ({
      ...playerSet[i],
      army: playerSet[i].army || playerArmy,
    }));
    enemyHand = getDealtHandIndices(enemyFinalOrder).map((i) => ({
      ...enemySet[i],
      army: enemySet[i].army || enemyArmy,
    }));
  }

  return {
    playerSet,
    enemySet,
    playerFinalOrder,
    enemyFinalOrder,
    playerHand,
    enemyHand,
    playerBonuses: calcInitialBonuses(playerHand),
    enemyBonuses: calcInitialBonuses(enemyHand),
  };
}

function resolveCardIds(cardIds, fallbackArmy) {
  const armyNames = Object.keys(ARMY_SETS);
  return cardIds
    .map((cardId) => {
      for (const army of armyNames) {
        const card = ARMY_SETS[army].find((c) => c.id === cardId);
        if (card) return { ...card, army: card.army || army };
      }
      return null;
    })
    .filter(Boolean)
    .map((card) => ({ ...card, army: card.army || fallbackArmy }));
}

/**
 * Prepara mazzi e ordini shuffle come in useGameFlow.startGame.
 * @param {{ playerArmy?: string|null, playerDeckKey?: string|null, enemyArmy?: string|null, enemyDeckKey?: string|null }} [config]
 */
export function prepareDuelShuffleHands(config = {}) {
  const armyNames = Object.keys(ARMY_SETS);

  let playerArmy = config.playerArmy;
  if (!playerArmy) {
    playerArmy = armyNames[Math.floor(Math.random() * armyNames.length)];
  }

  let playerDeckKey = config.playerDeckKey;
  if (!playerDeckKey) {
    const playerDeckKeys = Object.keys(ARMY_DECKS[playerArmy] ?? {});
    playerDeckKey = playerDeckKeys[Math.floor(Math.random() * playerDeckKeys.length)];
  }

  let enemyArmySelected = config.enemyArmy;
  if (!enemyArmySelected) {
    const available = armyNames.filter((a) => a !== playerArmy);
    enemyArmySelected = available[Math.floor(Math.random() * available.length)];
  }

  const playerDeck = ARMY_DECKS[playerArmy]?.[playerDeckKey];
  if (!playerDeck) {
    throw new Error(`Deck giocatore non trovato: ${playerArmy} / ${playerDeckKey}`);
  }

  let enemyDeckSelectedKey = config.enemyDeckKey;
  if (!enemyDeckSelectedKey) {
    const keys = Object.keys(ARMY_DECKS[enemyArmySelected] ?? {});
    enemyDeckSelectedKey = keys[Math.floor(Math.random() * keys.length)];
  }

  const enemyDeck = ARMY_DECKS[enemyArmySelected]?.[enemyDeckSelectedKey];
  if (!enemyDeck) {
    throw new Error(`Deck avversario non trovato: ${enemyArmySelected} / ${enemyDeckSelectedKey}`);
  }

  const playerSet = resolveCardIds(playerDeck.cards, playerArmy);
  const enemySet = resolveCardIds(enemyDeck.cards, enemyArmySelected);
  const deal = computeShuffleDealFromSets(playerSet, enemySet, playerArmy, enemyArmySelected);
  const { playerCardBack, enemyCardBack } = pickDistinctCardBackPair();

  return {
    playerArmy,
    playerDeckKey,
    playerDeckName: playerDeck.name,
    enemyArmy: enemyArmySelected,
    enemyDeckKey: enemyDeckSelectedKey,
    enemyDeckName: enemyDeck.name,
    playerCardBack,
    enemyCardBack,
    ...deal,
  };
}

/** Duello casuale: armata + mazzo random per entrambi i giocatori. */
export function prepareRandomDuelShuffleHands() {
  return prepareDuelShuffleHands();
}

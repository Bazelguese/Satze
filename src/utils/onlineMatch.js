import { ARMY_SETS } from '../data';
import { selectBattlefields } from '../game/fieldLogic';
import { countArmies } from './cardUtils';
import { pickDistinctCardBackPairSeeded } from './cardBackPicker';
import { mulberry32, shuffleArraySeeded } from './seededRandom';
import { resolveDeckCardsForArmy } from './deckResolve';
import { resolveShuffleKindsForDuel } from './shuffleStylePreference';
import { attachShuffleDealVisuals } from './deckManager';
import { ARMY_COLORS } from '../data/armies.js';

/**
 * Ricostruisce i campi di battaglia dal payload di rete usando i dati canonici locali.
 * Garantisce che host e guest vedano gli stessi campi (stesso id, effetti, nomi).
 */
export function hydrateBattlefieldsFromPayload(rawFields, allBattlefields) {
  if (!Array.isArray(rawFields) || !rawFields.length) return [];
  return rawFields
    .map((bf) => {
      if (bf == null) return null;
      const id = typeof bf === 'number' || typeof bf === 'string' ? bf : bf.id;
      const canonical = allBattlefields.find((f) => f.id === id);
      if (canonical) return { ...canonical };
      return typeof bf === 'object' ? { ...bf } : null;
    })
    .filter(Boolean);
}

/**
 * Normalizza il payload match_start prima di avviare la partita online.
 */
export function normalizeOnlineMatchPayload(payload, allBattlefields) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Payload partita online non valido');
  }

  const battlefields = hydrateBattlefieldsFromPayload(payload.battlefields, allBattlefields);
  if (battlefields.length !== 5) {
    throw new Error('Payload partita online: campi di battaglia mancanti o incompleti');
  }

  const hydrateHand = (hand) => {
    if (!Array.isArray(hand) || !hand.length) return [];
    return hand
      .map((card) => {
        if (!card?.id) return null;
        const hydrated = hydrateHandFromRelay([{ id: card.id, army: card.army }]);
        return hydrated[0] || (card.power != null ? card : null);
      })
      .filter(Boolean);
  };

  const hostPlayerHand = hydrateHand(payload.hostPlayerHand);
  const hostEnemyHand = hydrateHand(payload.hostEnemyHand);
  if (hostPlayerHand.length !== 5 || hostEnemyHand.length !== 5) {
    throw new Error('Payload partita online: mani incomplete');
  }

  const hydrateSet = (minimalList, army) => {
    if (!Array.isArray(minimalList) || !minimalList.length) return [];
    return hydrateHandFromRelay(minimalList).map((card) => ({
      ...card,
      army: card.army || army,
    }));
  };

  const hostPlayerSet = hydrateSet(payload.hostPlayerSet, payload.hostPlayerArmy);
  const hostEnemySet = hydrateSet(payload.hostEnemySet, payload.hostEnemyArmy);

  return {
    ...payload,
    battlefields,
    hostPlayerHand,
    hostEnemyHand,
    hostPlayerSet,
    hostEnemySet,
  };
}

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

  const hostPlayerFinalOrder = shuffleArraySeeded(
    hostFullDeck.map((_, i) => i),
    rng
  );
  const hostEnemyFinalOrder = shuffleArraySeeded(
    guestFullDeck.map((_, i) => i),
    rng
  );
  const hostPlayerHand = hostPlayerFinalOrder.slice(0, 5).map((i) => ({
    ...hostFullDeck[i],
    army: hostFullDeck[i].army || hostArmy,
  }));
  const guestAsEnemyHand = hostEnemyFinalOrder.slice(0, 5).map((i) => ({
    ...guestFullDeck[i],
    army: guestFullDeck[i].army || guestArmy,
  }));

  const battlefields = selectBattlefields(mode, allBattlefields, { rng });

  const playerLeague = hostPlayerHand.reduce((s, c) => s + c.league, 0);
  const enemyLeague = guestAsEnemyHand.reduce((s, c) => s + c.league, 0);
  const hostIsPlayerFirst =
    playerLeague < enemyLeague ? true : playerLeague > enemyLeague ? false : rng() < 0.5;

  const { playerCardBack, enemyCardBack } = pickDistinctCardBackPairSeeded(rng);

  return {
    seed,
    mode,
    battlefields,
    hostPlayerHand,
    hostEnemyHand: guestAsEnemyHand,
    hostIsPlayerFirst,
    hostPlayerArmy: hostArmy,
    hostEnemyArmy: guestArmy,
    hostPlayerSet: serializeHandForRelay(hostFullDeck),
    hostEnemySet: serializeHandForRelay(guestFullDeck),
    hostPlayerFinalOrder,
    hostEnemyFinalOrder,
    playerCardBack,
    enemyCardBack,
  };
}

export function calcInitialBonuses(hand) {
  const counts = countArmies(hand);
  const bonuses = {};
  Object.keys(counts).forEach((army) => {
    bonuses[army] = counts[army] >= 2;
  });
  return bonuses;
}

/**
 * Costruisce lo setup animazione shuffle & deal dalla prospettiva locale (host o guest).
 * @param {'host'|'guest'} perspective
 * @param {ReturnType<typeof normalizeOnlineMatchPayload>} payload
 * @returns {object|null}
 */
export function buildShuffleDealSetupFromMatch(perspective, payload) {
  const {
    hostPlayerSet,
    hostEnemySet,
    hostPlayerFinalOrder,
    hostEnemyFinalOrder,
    hostPlayerHand,
    hostEnemyHand,
    hostPlayerArmy,
    hostEnemyArmy,
    playerCardBack,
    enemyCardBack,
  } = payload;

  if (
    !Array.isArray(hostPlayerFinalOrder) ||
    !hostPlayerFinalOrder.length ||
    !Array.isArray(hostEnemyFinalOrder) ||
    !hostEnemyFinalOrder.length ||
    hostPlayerSet.length !== 10 ||
    hostEnemySet.length !== 10
  ) {
    return null;
  }

  const hostPlayerBonuses = calcInitialBonuses(hostPlayerHand);
  const hostEnemyBonuses = calcInitialBonuses(hostEnemyHand);
  const { playerShuffleKind, enemyShuffleKind } = resolveShuffleKindsForDuel();

  if (perspective === 'host') {
    return attachShuffleDealVisuals({
      playerSet: hostPlayerSet,
      enemySet: hostEnemySet,
      playerFinalOrder: hostPlayerFinalOrder,
      enemyFinalOrder: hostEnemyFinalOrder,
      playerHand: hostPlayerHand,
      enemyHand: hostEnemyHand,
      playerBonuses: hostPlayerBonuses,
      enemyBonuses: hostEnemyBonuses,
      playerArmy: hostPlayerArmy,
      enemyArmy: hostEnemyArmy,
      playerCardBack,
      enemyCardBack,
      playerShuffleKind,
      enemyShuffleKind,
    }, ARMY_COLORS);
  }

  return attachShuffleDealVisuals({
    playerSet: hostEnemySet,
    enemySet: hostPlayerSet,
    playerFinalOrder: hostEnemyFinalOrder,
    enemyFinalOrder: hostPlayerFinalOrder,
    playerHand: hostEnemyHand,
    enemyHand: hostPlayerHand,
    playerBonuses: hostEnemyBonuses,
    enemyBonuses: hostPlayerBonuses,
    playerArmy: hostEnemyArmy,
    enemyArmy: hostPlayerArmy,
    playerCardBack: enemyCardBack,
    enemyCardBack: playerCardBack,
    playerShuffleKind,
    enemyShuffleKind,
  }, ARMY_COLORS);
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

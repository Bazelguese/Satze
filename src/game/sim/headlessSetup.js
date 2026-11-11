// ============================================
// Setup delle partite senza interfaccia (mazzi, mani, Campi, apertura)
// ============================================
//
// Separato da headlessMatch.js perché importa i dati di gioco.

import { ARMY_DECKS, ARMY_SETS, ALL_BATTLEFIELDS } from '../../data/index.js';
import { selectBattlefields } from '../fieldLogic.js';
import { calcInitialBonuses } from '../../utils/onlineMatch.js';
import { mulberry32, shuffleArraySeeded } from '../../utils/seededRandom.js';
import {
  HEADLESS_HAND_SIZE,
  HEADLESS_START_FOCUS,
  HEADLESS_START_HP,
} from './headlessMatch.js';

/** Come resolveCardIdsAcrossArmies di useGameFlow / deckResolve. */
function resolveCardIds(cardIds, fallbackArmy) {
  const armies = Object.keys(ARMY_SETS);
  return cardIds
    .map((cardId) => {
      for (const army of armies) {
        const card = ARMY_SETS[army].find((c) => c.id === cardId);
        if (card) return { ...card, army: card.army || army };
      }
      return null;
    })
    .filter(Boolean)
    .map((card) => ({ ...card, army: card.army || fallbackArmy }));
}

/**
 * Mazzo da 10 carte: { army, deckKey } di un mazzo precostruito oppure { army, cards: [id…] }.
 */
export function resolveHeadlessDeck(deck) {
  if (Array.isArray(deck?.cards)) return resolveCardIds(deck.cards, deck.army);
  const preset = ARMY_DECKS[deck?.army]?.[deck?.deckKey];
  if (!preset) throw new Error(`Mazzo sconosciuto: ${deck?.army} / ${deck?.deckKey}`);
  return resolveCardIds(preset.cards, deck.army);
}

/** Tutti i mazzi precostruiti come { army, deckKey }. */
export function listPresetDecks() {
  const out = [];
  for (const army of Object.keys(ARMY_DECKS)) {
    for (const deckKey of Object.keys(ARMY_DECKS[army])) out.push({ army, deckKey });
  }
  return out;
}

function sumLeague(hand) {
  return hand.reduce((sum, card) => sum + (card.league || 0), 0);
}

function handFromDeck(set, rng) {
  const order = shuffleArraySeeded(set.map((_, i) => i), rng);
  return order.slice(0, HEADLESS_HAND_SIZE).map((i) => ({ ...set[i] }));
}

/**
 * Stato iniziale con gli stessi nomi di campo dello stato React (useGameState),
 * così buildAIInformationSet lo legge direttamente.
 *
 * @param {{
 *   seed: number,
 *   mode?: 'classic'|'bareHands',
 *   player: object, enemy: object,
 *   allBattlefields?: object[],
 *   playerHand?: object[], enemyHand?: object[], battlefields?: object[],
 *   openingPlayerFirst?: boolean,
 * }} options
 */
export function createHeadlessMatch(options) {
  const { seed, mode = 'classic', allBattlefields = ALL_BATTLEFIELDS } = options;
  const rng = mulberry32(seed >>> 0);

  const playerHand = options.playerHand || handFromDeck(resolveHeadlessDeck(options.player), rng);
  const enemyHand = options.enemyHand || handFromDeck(resolveHeadlessDeck(options.enemy), rng);
  const battlefields = options.battlefields || selectBattlefields(mode, allBattlefields, { rng });

  const playerLeague = sumLeague(playerHand);
  const enemyLeague = sumLeague(enemyHand);
  const openingPlayerFirst =
    typeof options.openingPlayerFirst === 'boolean'
      ? options.openingPlayerFirst
      : playerLeague < enemyLeague
        ? true
        : playerLeague > enemyLeague
          ? false
          : rng() < 0.5;

  return {
    seed,
    gameMode: mode,
    battlefields,
    conqueredFields: {},
    revealedFields:
      mode === 'bareHands' ? battlefields.length : Math.min(3, battlefields.length),
    currentFieldIndex: null,

    playerHand,
    enemyHand,
    playerArmyBonuses: calcInitialBonuses(playerHand),
    enemyArmyBonuses: calcInitialBonuses(enemyHand),
    playerHP: HEADLESS_START_HP,
    enemyHP: HEADLESS_START_HP,
    playerFocus: HEADLESS_START_FOCUS,
    enemyFocus: HEADLESS_START_FOCUS,
    playerUsedCards: [],
    enemyUsedCards: [],
    playerToxin: null,
    enemyToxin: null,

    roundNumber: 1,
    lastWinner: null,
    openingPlayerFirst,
    isPlayerFirst: openingPlayerFirst,

    // Agente già schierato e visibile da chi risponde (solo durante il turno).
    selectedAgent: null,
    enemyAgent: null,

    campaignDuelMod: null,
    eminenceState: null,
    leagueSums: { player: playerLeague, enemy: enemyLeague },
  };
}


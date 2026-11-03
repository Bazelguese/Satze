// ============================================================
// Nucleo condiviso delle modalità a più posti (2v2, Re della collina)
// ============================================================
// Logica pura: nessuna dipendenza da React. Ogni scontro resta un duello 1v1 risolto da
// `computeDuelResolution`; qui si costruisce il suo ingresso dalla prospettiva dei due posti
// che si affrontano e si leggono i risultati per posto.
// ============================================================

import { computeDuelResolution } from '../duelResolve.js';
import { calcInitialBonuses } from '../../utils/onlineMatch.js';
import { mulberry32, shuffleArraySeeded } from '../../utils/seededRandom.js';
import {
  computeLegalMaxFocus,
  countAvailableAgents,
  getReservedFocus,
  MIN_FOCUS_INVESTMENT,
} from '../legalFocusSpend.js';

/** Somma Lega di una mano. */
export function handLeagueSum(hand) {
  return (hand || []).reduce((sum, card) => sum + (Number(card?.league) || 0), 0);
}

/**
 * Crea un posto a partire da una mano già servita.
 * @param {{ id: string, name: string, isHuman?: boolean, army: string, hand: object[],
 *   focus: number, team?: string|null, aiProfile?: string|null, deckKey?: string|null,
 *   deckCards?: object[] }} p
 */
export function createSeat({
  id,
  name,
  isHuman = false,
  army,
  hand,
  focus,
  team = null,
  aiProfile = null,
  deckKey = null,
  deckCards = null,
  hp = null,
  maxHp = null,
}) {
  const normalizedHand = (hand || []).map((card) => ({ ...card, army: card.army || army }));
  return {
    id,
    name,
    isHuman,
    army,
    team,
    aiProfile,
    deckKey,
    deckCards: deckCards || normalizedHand,
    hand: normalizedHand,
    usedCardIds: [],
    focus,
    hp,
    maxHp,
    previousResult: null,
    armyBonuses: calcInitialBonuses(normalizedHand),
    toxin: null,
    conquests: 0,
    eliminated: false,
  };
}

/**
 * Serve 5 carte da un mazzo da 10 con un generatore riproducibile.
 * @param {object[]} deckCards
 * @param {() => number} rng
 * @param {number} [handSize=5]
 */
export function dealHand(deckCards, rng, handSize = 5) {
  return shuffleArraySeeded(deckCards, rng).slice(0, handSize);
}

export function createRng(seed) {
  const s = Number.isFinite(seed) ? seed : Math.floor(Math.random() * 2 ** 31);
  return { seed: s, rng: mulberry32(s) };
}

export function availableCards(seat) {
  const used = new Set(seat.usedCardIds || []);
  return (seat.hand || []).filter((card) => !used.has(card.id));
}

/**
 * Range legale dell'investimento del posto: almeno 1, al massimo la riserva meno 1 FC per
 * ogni Agente che resterà da giocare (riserva minima del gioco base).
 */
export function legalFocusRange(seat) {
  const available = countAvailableAgents(seat.hand, seat.usedCardIds);
  const max = computeLegalMaxFocus(seat.focus, getReservedFocus(available));
  return { min: max >= MIN_FOCUS_INVESTMENT ? MIN_FOCUS_INVESTMENT : 0, max };
}

export function isLegalInvestment(seat, value) {
  if (!Number.isInteger(value)) return false;
  const { min, max } = legalFocusRange(seat);
  return value >= min && value <= max && value >= MIN_FOCUS_INVESTMENT;
}

/**
 * Campi conquistati riportati alla prospettiva di uno scontro: `player` per chi è del lato
 * del posto player, `enemy` per il lato del posto enemy, nessuno per gli altri.
 * @param {Record<number, { owner: string|null, army?: string|null, destroyed?: boolean }>} conquered
 * @param {(owner: string) => 'player'|'enemy'|null} sideOfOwner
 */
export function conqueredFieldsForPerspective(conquered, sideOfOwner) {
  const out = {};
  for (const [index, entry] of Object.entries(conquered || {})) {
    if (!entry || entry.destroyed || entry.owner == null) {
      out[index] = { winner: null, destroyed: true };
      continue;
    }
    out[index] = { winner: sideOfOwner(entry.owner), army: entry.army ?? null };
  }
  return out;
}

export function countOwnedFields(conquered, owner) {
  return Object.values(conquered || {}).filter((entry) => entry && entry.owner === owner).length;
}

/**
 * Risolve uno scontro fra due posti con il motore base.
 *
 * @param {object} p
 * @param {object} p.field
 * @param {object} p.firstSeat - posto sul lato player
 * @param {object} p.secondSeat - posto sul lato enemy
 * @param {boolean} [p.playerHasInitiative=true] - il lato player ha schierato per primo
 * @param {object} p.firstCard
 * @param {object} p.secondCard
 * @param {number} p.firstFocus
 * @param {number} p.secondFocus
 * @param {number} p.firstHP - PV letti dal lato player (squadra o personali)
 * @param {number} p.secondHP
 * @param {number} p.firstMaxHP
 * @param {number} p.secondMaxHP
 * @param {object} p.conqueredFields - già nella prospettiva player/enemy
 * @param {number} p.roundNumber
 * @param {number} p.fieldIndex
 * @param {boolean} [p.conquestTriggerSuppressed=false]
 * @param {boolean} [p.firstFocusPrepaid=false]
 * @param {boolean} [p.secondFocusPrepaid=false]
 */
export function resolveSeatDuel({
  field,
  firstSeat,
  secondSeat,
  firstCard,
  secondCard,
  firstFocus,
  secondFocus,
  firstHP,
  secondHP,
  firstMaxHP,
  secondMaxHP,
  conqueredFields,
  roundNumber,
  fieldIndex,
  conquestTriggerSuppressed = false,
  firstFocusPrepaid = false,
  secondFocusPrepaid = false,
  playerHasInitiative = true,
}) {
  const { battleResult } = computeDuelResolution({
    field,
    selectedAgent: firstCard,
    enemyAgent: secondCard,
    selectedFocus: firstFocus,
    enemySelectedFocus: secondFocus,
    playerHP: firstHP,
    enemyHP: secondHP,
    playerFocus: firstSeat.focus,
    enemyFocus: secondSeat.focus,
    playerUsedCards: firstSeat.usedCardIds,
    enemyUsedCards: secondSeat.usedCardIds,
    isPlayerFirst: playerHasInitiative,
    lastWinner: null,
    playerArmyBonuses: firstSeat.armyBonuses || {},
    enemyArmyBonuses: secondSeat.armyBonuses || {},
    playerToxin: firstSeat.toxin,
    enemyToxin: secondSeat.toxin,
    roundNumber,
    conqueredFields,
    playerHand: firstSeat.hand,
    enemyHand: secondSeat.hand,
    currentFieldIndex: fieldIndex,
    playerMaxHP: firstMaxHP,
    enemyMaxHP: secondMaxHP,
    playerPreviousResult: firstSeat.previousResult ?? null,
    enemyPreviousResult: secondSeat.previousResult ?? null,
    conquestTriggerSuppressed,
    // Investimento già pagato: VA e Overdrive leggono l'investimento, la riserva (già
    // scalata al primo scontro) non viene sottratta di nuovo.
    playerFocusPrepaid: firstFocusPrepaid,
    enemyFocusPrepaid: secondFocusPrepaid,
  });
  return battleResult;
}

/** Riserva FC finale del posto sul lato indicato. */
export function finalSeatFocus(battleResult, side) {
  return Math.max(0, side === 'player' ? battleResult.finalPlayerFC : battleResult.finalEnemyFC);
}

/**
 * Applica le Tossine di un insieme di posti a una riserva di PV, una dopo l'altra.
 * @param {number} hp
 * @param {Array<{ seatId: string, toxin: { value: number, minHealth: number, source?: string } }>} entries
 * @param {number} [minHealthFactor=1] - moltiplicatore della soglia (2 nel 2v2 con 50 PV)
 * @returns {{ hp: number, toxins: Record<string, object|null>, events: object[] }}
 */
export function applyToxinsToPool(hp, entries, minHealthFactor = 1) {
  let current = hp;
  const toxins = {};
  const events = [];
  for (const { seatId, toxin } of entries) {
    if (!toxin) {
      toxins[seatId] = null;
      continue;
    }
    const threshold = (toxin.minHealth || 1) * minHealthFactor;
    if (current > threshold) {
      const before = current;
      current = Math.max(threshold, current - toxin.value);
      events.push({ kind: 'toxin', seatId, source: toxin.source || 'Tossina', before, after: current });
      toxins[seatId] = current <= threshold ? null : toxin;
    } else {
      toxins[seatId] = null;
    }
  }
  return { hp: current, toxins, events };
}

// ============================================
// Re della collina: IA a simulazione
// ============================================
//
// Ogni contesa i giocatori posano in ordine: chi apre sceglie Campo, Agente e FC, gli altri
// vedono gli Agenti già posati (non i FC) e posano Agente e FC. Poi la catena di scontri contro
// chi tiene la collina (src/game/kingOfHill/kingOfHill.js).
//
// Per un posto IA: si provano le mosse (Campo × Agente × FC per chi apre, Agente × FC per gli
// altri) giocando molte volte il resto della contesa e della partita con una politica veloce;
// stessi semi per tutti, eliminazione progressiva, rumore nella scelta finale.
// I FC di chi ha già posato non si leggono mai: si estraggono in ogni simulazione.

import { mulberry32 } from '../../../utils/seededRandom.js';
import {
  KOTH_PHASES,
  advanceAfterContest,
  contestOrder,
  currentCommitter,
  getSeat,
  legalFieldIndexes,
  openerSeatId,
  resolveClaim,
  seatFieldCount,
  submitCommit,
} from '../../kingOfHill/kingOfHill.js';
import { availableCards } from '../../multiSeat/multiSeatCore.js';
import { getMcTrait } from '../mc/mcTraits.js';
import { cardStrength, clampSeatFocus, seatFair } from '../mcTeam/teamPolicy.js';
import { pickFinal, successiveHalving, traitContext } from '../mcTeam/teamSearch.js';

const JITTER = [-1, 0, 0, 1, 2];

function nowMs() {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

function pick(list, rng) {
  return list[Math.floor(rng() * list.length)];
}

function committedCard(match, seatId) {
  const seat = getSeat(match, seatId);
  return seat?.hand.find((c) => c.id === match.commits?.[seatId]?.cardId) || null;
}

/** VA stimato più alto fra gli Agenti già posati (chi sfiderò probabilmente). */
function strongestEarlierAssault(match, seatId) {
  let best = 0;
  for (const id of contestOrder(match)) {
    if (id === seatId || !match.commits?.[id]) continue;
    const card = committedCard(match, id);
    best = Math.max(best, (card?.power || 0) * seatFair(getSeat(match, id)));
  }
  return best;
}

/** Politica veloce per una posa. */
export function policyCommit(match, seatId, rng, quality = 0.7) {
  const seat = getSeat(match, seatId);
  const cards = availableCards(seat);
  const opener = seatId === openerSeatId(match);
  const fieldIndex = opener ? pick(legalFieldIndexes(match), rng) : null;
  if (!opener && rng() < quality) {
    const target = strongestEarlierAssault(match, seatId);
    const { max } = { max: clampSeatFocus(seat, 99) };
    let best = null;
    for (const card of cards) {
      const need = Math.floor(target / Math.max(1, card.power || 1)) + 1;
      if (need > Math.min(max, seatFair(seat) + 3)) continue;
      const cost = need + cardStrength(card) * 0.15;
      if (!best || cost < best.cost) best = { card, focus: need, cost };
    }
    if (best) return { cardId: best.card.id, investment: clampSeatFocus(seat, best.focus), fieldIndex };
    const weakest = [...cards].sort((a, b) => cardStrength(a) - cardStrength(b))[0];
    return { cardId: weakest.id, investment: 1, fieldIndex };
  }
  const card =
    rng() < quality * 0.6 ? [...cards].sort((a, b) => cardStrength(b) - cardStrength(a))[0] : pick(cards, rng);
  return {
    cardId: card.id,
    investment: clampSeatFocus(seat, seatFair(seat) + pick(JITTER, rng)),
    fieldIndex,
  };
}

/** Investimenti di chi ha già posato: ignoti, si estraggono intorno alla quota equa. */
function withHiddenInvestments(match, seatId, rng) {
  const commits = {};
  for (const [id, c] of Object.entries(match.commits || {})) {
    if (id === seatId) continue;
    commits[id] = { ...c, investment: clampSeatFocus(getSeat(match, id), seatFair(getSeat(match, id)) + pick(JITTER, rng)) };
  }
  return { ...match, commits };
}

/** Gioca fino alla fine; la prima posa di `seatId` è `choice`. */
export function playOutKoth(match, seatId, choice, rng, quality = 0.7) {
  let m = withHiddenInvestments(match, seatId, rng);
  let used = false;
  for (let guard = 0; guard < 40; guard += 1) {
    if (m.phase === KOTH_PHASES.COMMITS) {
      const who = currentCommitter(m);
      const forced = !used && who === seatId ? choice : null;
      if (forced) used = true;
      m = submitCommit(m, who, forced || policyCommit(m, who, rng, quality));
    } else if (m.phase === KOTH_PHASES.RESOLVED) {
      m = advanceAfterContest(m);
    } else if (m.phase === KOTH_PHASES.CLAIM) {
      m = resolveClaim(m, 'claim');
    } else {
      return m;
    }
  }
  return m;
}

/**
 * Valore di una partita finita per `seatId`: vittoria 1 (condivisa 1/n), altrimenti 0, più un
 * piccolo peso sui PV rispetto alla media degli altri e l'obiettivo del tratto.
 */
function kothOutcome(end, seatId, trait) {
  const winners = end.result?.winners || [];
  let value = winners.includes(seatId) ? 1 / winners.length : 0;
  const own = getSeat(end, seatId).hp;
  const others = end.seats.filter((s) => s.id !== seatId);
  const avgOther = others.reduce((sum, s) => sum + s.hp, 0) / Math.max(1, others.length);
  value += (own - avgOther) * 0.002;
  if (trait?.objective) {
    const conqueredFields = {};
    for (const [index, entry] of Object.entries(end.conqueredFields || {})) {
      conqueredFields[index] = { winner: entry?.owner === seatId ? 'enemy' : entry?.owner ? 'player' : null };
    }
    value += trait.objective(
      { winner: winners.includes(seatId) ? 'enemy' : 'player', reason: end.result?.reason },
      { enemyHP: own, playerHP: avgOther, conqueredFields, playerHand: [], enemyHand: [] }
    );
  }
  return value;
}

/**
 * Posa del posto IA `seatId` (deve essere il suo turno di posa).
 * @param {object} match
 * @param {string} seatId
 * @param {{ rollouts: number, noise?: number, quality?: number, maxMs?: number, trait?: string }} params
 * @param {() => number} rng
 * @returns {{ choice: { cardId, investment, fieldIndex }, stats: object }}
 */
export function chooseKothCommit(match, seatId, params, rng) {
  const started = nowMs();
  const deadline = params.maxMs ? started + params.maxMs : null;
  const quality = params.quality ?? 0.7;
  const traitDef = getMcTrait(params.trait);
  const trait = traitDef.id === 'neutral' ? null : traitDef;
  const seat = getSeat(match, seatId);
  const opener = seatId === openerSeatId(match);
  const fields = opener ? legalFieldIndexes(match) : [null];
  const target = opener ? 0 : strongestEarlierAssault(match, seatId);
  const ctx = trait?.bias ? traitContext(match, seat) : null;

  const candidates = [];
  for (const fieldIndex of fields) {
    for (const card of availableCards(seat)) {
      const need = Math.floor(target / Math.max(1, card.power || 1)) + 1;
      const fair = seatFair(seat);
      const focuses = new Set(
        [1, fair - 1, fair, fair + 1, fair + 3, ...(opener ? [] : [need, need + 1])].map((f) => clampSeatFocus(seat, f))
      );
      for (const investment of focuses) {
        candidates.push({
          choice: { cardId: card.id, investment, fieldIndex },
          bias: ctx ? trait.bias(null, card, investment, ctx) : 0,
        });
      }
    }
  }
  const simulate = (candidate, seed) =>
    kothOutcome(playOutKoth(match, seatId, candidate.choice, mulberry32(seed), quality), seatId, trait);
  const res = successiveHalving(candidates, Math.max(40, Number(params.rollouts) || 0), simulate, rng, deadline);
  const chosen = pickFinal(res.ranked, params.noise, rng) || candidates[0];
  return {
    choice: chosen.choice,
    stats: { rollouts: res.spent, ms: nowMs() - started, estimate: chosen.mean, fields: seatFieldCount(match, seatId) },
  };
}

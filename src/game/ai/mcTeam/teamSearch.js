// ============================================
// 2v2: scelte delle IA con il motore a simulazione
// ============================================
//
// Le combinazioni dei due posti sono troppe da provare tutte: si sceglie in due fasi.
// 1. Ogni posto IA prova le sue mosse da solo (il compagno lo gioca la politica veloce);
//    restano le migliori `topPerSeat`.
// 2. Si provano insieme le combinazioni rimaste (e, in risposta, le due disposizioni).
// Ogni candidato si valuta giocando la partita fino alla fine (teamPolicy.js), con gli stessi
// semi per tutti i candidati ed eliminazione progressiva dei peggiori.
//
// Informazione nascosta: in risposta i FC dell'apertura avversaria non si leggono mai dalla
// partita, si estraggono in ogni simulazione intorno alla loro quota equa.

import { mulberry32 } from '../../../utils/seededRandom.js';
import {
  PAIRINGS,
  TEAM_DUEL_PHASES,
  buildFronts,
  getSeat,
  legalFieldIndexes,
  otherTeam,
  respondingTeam,
  teamSeats,
} from '../../teamDuel/teamDuel.js';
import { availableCards } from '../../multiSeat/multiSeatCore.js';
import { getMcTrait } from '../mc/mcTraits.js';
import {
  cardStrength,
  clampSeatFocus,
  deployedCard,
  playOutTeamMatch,
  sampleHiddenFocus,
  seatFair,
} from './teamPolicy.js';

function nowMs() {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

// ------------------------------------------------------------------
// Tratti (stesse personalità dell'1v1, adattate alla squadra)
// ------------------------------------------------------------------

function seatTrait(params, seatId) {
  const trait = getMcTrait(params.traits?.[seatId]);
  return trait.id === 'neutral' ? null : trait;
}

/** Contesto per le preferenze del tratto, come nell'1v1 (quota equa, turno, carte rimaste). */
function traitContext(match, seat) {
  const cards = availableCards(seat);
  const ranked = [...cards].sort((a, b) => cardStrength(b) - cardStrength(a));
  return {
    fair: seatFair(seat),
    round: match.roundNumber,
    remaining: cards.length,
    rankOf: (card) => ranked.findIndex((c) => c.id === card.id),
  };
}

function seatBias(match, params, seatId, cardId, focus) {
  const trait = seatTrait(params, seatId);
  if (!trait?.bias) return 0;
  const seat = getSeat(match, seatId);
  const card = seat.hand.find((c) => c.id === cardId);
  return card ? trait.bias(null, card, focus, traitContext(match, seat)) : 0;
}

/**
 * Valore di una partita finita per la squadra `teamId`: vittoria 1, pareggio ½, sconfitta 0,
 * più un piccolo peso sui PV e gli obiettivi dei tratti dei posti che decidono.
 * Gli obiettivi dei tratti sono scritti per l'1v1 (PV 25): qui i PV si riportano a quella scala.
 */
function teamOutcome(end, teamId, aiSeatIds, params) {
  const result = end.result || {};
  const opp = otherTeam(teamId);
  const own = end.teams[teamId].hp;
  const other = end.teams[opp].hp;
  let value = result.winner === 'draw' ? 0.5 : result.winner === teamId ? 1 : 0;
  value += (own - other) * 0.001;
  const traits = aiSeatIds.map((id) => seatTrait(params, id)).filter((t) => t?.objective);
  if (traits.length) {
    const scale = 25 / Math.max(1, end.config?.maxHp || 50);
    const conqueredFields = {};
    for (const [index, entry] of Object.entries(end.conqueredFields || {})) {
      conqueredFields[index] = { winner: entry?.owner === teamId ? 'enemy' : entry?.owner ? 'player' : null };
    }
    const pseudoEnd = {
      winner: result.winner === 'draw' ? 'draw' : result.winner === teamId ? 'enemy' : 'player',
      reason: result.reason,
    };
    const pseudoState = {
      enemyHP: own * scale,
      playerHP: other * scale,
      conqueredFields,
      playerHand: [],
      enemyHand: [],
    };
    value += traits.reduce((sum, t) => sum + t.objective(pseudoEnd, pseudoState), 0) / traits.length;
  }
  return value;
}

// ------------------------------------------------------------------
// Valutazione con eliminazione progressiva
// ------------------------------------------------------------------

/**
 * @param {object[]} candidates - con `fixed` (scelte per playOutTeamMatch) e `bias`
 * @param {number} budget
 * @param {(candidate, seed) => number} simulate
 */
function successiveHalving(candidates, budget, simulate, rng, deadline) {
  for (const c of candidates) Object.assign(c, { total: 0, n: 0, mean: 0, score: c.bias || 0 });
  if (candidates.length <= 1) return { ranked: candidates, spent: 0, timedOut: false };
  const phases = Math.max(1, Math.ceil(Math.log2(candidates.length)));
  const seeds = [];
  let alive = candidates;
  let spent = 0;
  let timedOut = false;
  for (let phase = 0; phase < phases && alive.length > 1 && !timedOut; phase += 1) {
    const per = Math.max(1, Math.floor(budget / (phases * alive.length)));
    for (const c of alive) {
      const target = c.n + per;
      while (c.n < target) {
        while (seeds.length <= c.n) seeds.push((rng() * 2 ** 32) >>> 0);
        c.total += simulate(c, seeds[c.n]);
        c.n += 1;
        spent += 1;
        if (deadline && (spent & 7) === 0 && nowMs() > deadline) {
          timedOut = true;
          break;
        }
      }
      c.mean = c.total / c.n;
      c.score = c.mean + (c.bias || 0);
      if (timedOut) break;
    }
    const measured = alive.filter((c) => c.n > 0).sort((a, b) => b.score - a.score);
    alive = measured.slice(0, Math.max(1, Math.ceil(measured.length / 2)));
  }
  const ranked = candidates.filter((c) => c.n > 0).sort((a, b) => b.score - a.score || b.n - a.n);
  return { ranked, spent, timedOut };
}

function pickFinal(ranked, noise, rng) {
  if (!ranked.length) return null;
  const maxN = ranked.reduce((m, c) => Math.max(m, c.n), 0);
  const reliable = ranked.filter((c) => c.n >= maxN * 0.6);
  if (!noise) return reliable[0];
  const best = ranked[0].score;
  const weights = ranked.map((c) => Math.exp((c.score - best) / noise));
  let roll = rng() * weights.reduce((s, w) => s + w, 0);
  for (let i = 0; i < ranked.length; i += 1) {
    roll -= weights[i];
    if (roll <= 0) return ranked[i];
  }
  return ranked[0];
}

function focusOptions(seat, extra = []) {
  const fair = seatFair(seat);
  return [...new Set([1, fair - 1, fair, fair + 1, fair + 3, ...extra].map((f) => clampSeatFocus(seat, f)))];
}

function stageBudgets(params) {
  const total = Math.max(40, Number(params.rollouts) || 0);
  return { first: Math.floor(total * 0.6), second: Math.floor(total * 0.4) };
}

/** Partita senza i FC dell'apertura avversaria (mai letti da chi risponde). */
function hideOpeningInvestments(match) {
  if (match.phase !== TEAM_DUEL_PHASES.RESPONSE_DEPLOY) return match;
  const plans = { ...match.plans };
  const opening = plans[match.openingTeam];
  if (opening) plans[match.openingTeam] = { ...opening, investments: {} };
  return { ...match, plans };
}

// ------------------------------------------------------------------
// Apertura
// ------------------------------------------------------------------

/**
 * Scelte d'apertura dei posti IA di una squadra.
 * @param {object} match - fase di apertura, squadra `teamId` in apertura
 * @param {{ rollouts: number, noise?: number, quality?: number, maxMs?: number, topPerSeat?: number,
 *   traits?: Record<string, string> }} params
 * @param {() => number} rng
 * @param {{ aiSeatIds: string[], fixedSeats?: Record<string, { cardId, fieldIndex, focus }> }} opts
 * @returns {{ choices: Record<string, { cardId, fieldIndex, focus }>, stats: object }}
 */
export function chooseTeamOpening(match, teamId, params, rng, { aiSeatIds, fixedSeats = {} }) {
  const started = nowMs();
  const deadline = params.maxMs ? started + params.maxMs : null;
  const quality = params.quality ?? 0.7;
  const budgets = stageBudgets(params);
  const takenByFixed = Object.values(fixedSeats).map((c) => c.fieldIndex);
  const fields = legalFieldIndexes(match).filter((i) => !takenByFixed.includes(i));
  const simulate = (candidate, seed) => {
    const end = playOutTeamMatch(match, { opening: { ...fixedSeats, ...candidate.fixed } }, mulberry32(seed), { quality });
    return teamOutcome(end, teamId, aiSeatIds, params);
  };

  // Fase 1: ogni posto da solo.
  const perSeat = {};
  let spent = 0;
  for (const seatId of aiSeatIds) {
    const seat = getSeat(match, seatId);
    const candidates = [];
    for (const fieldIndex of fields) {
      for (const card of availableCards(seat)) {
        for (const focus of focusOptions(seat)) {
          candidates.push({
            seatId,
            choice: { cardId: card.id, fieldIndex, focus },
            fixed: { [seatId]: { cardId: card.id, fieldIndex, focus } },
            bias: seatBias(match, params, seatId, card.id, focus),
          });
        }
      }
    }
    const res = successiveHalving(candidates, budgets.first / aiSeatIds.length, simulate, rng, deadline);
    spent += res.spent;
    perSeat[seatId] = res.ranked;
  }

  // Mosse di riserva per posto (es. il compagno umano prende lo stesso Campo).
  const alternatives = Object.fromEntries(
    aiSeatIds.map((id) => [id, perSeat[id].slice(0, 6).map((c) => c.choice)])
  );

  if (aiSeatIds.length === 1) {
    const chosen = pickFinal(perSeat[aiSeatIds[0]], params.noise, rng);
    return {
      choices: { [aiSeatIds[0]]: chosen.choice },
      alternatives,
      stats: { rollouts: spent, ms: nowMs() - started, estimate: chosen.mean },
    };
  }

  // Fase 2: combinazioni dei migliori, su Campi diversi.
  const top = params.topPerSeat ?? 3;
  const [s1, s2] = aiSeatIds;
  const combos = [];
  for (const a of perSeat[s1].slice(0, top)) {
    for (const b of perSeat[s2].slice(0, top)) {
      if (a.choice.fieldIndex === b.choice.fieldIndex) continue;
      combos.push({ choices: { [s1]: a.choice, [s2]: b.choice }, fixed: { [s1]: a.choice, [s2]: b.choice }, bias: a.bias + b.bias });
    }
  }
  if (!combos.length) {
    // Tutti sullo stesso Campo: il secondo posto prende il suo miglior Campo diverso.
    const a = perSeat[s1][0];
    const b = perSeat[s2].find((c) => c.choice.fieldIndex !== a.choice.fieldIndex);
    combos.push({ choices: { [s1]: a.choice, [s2]: b.choice }, fixed: { [s1]: a.choice, [s2]: b.choice }, bias: 0 });
  }
  const res = successiveHalving(combos, budgets.second, simulate, rng, deadline);
  const chosen = pickFinal(res.ranked, params.noise, rng) || combos[0];
  return {
    choices: chosen.choices,
    alternatives,
    stats: { rollouts: spent + res.spent, ms: nowMs() - started, estimate: chosen.mean },
  };
}

// ------------------------------------------------------------------
// Risposta
// ------------------------------------------------------------------

/**
 * Risposta dei posti IA: Agente e FC per posto e disposizione (se non fissata).
 * @param {object} match - fase di risposta, squadra `teamId` in risposta
 * @param {object} params - come chooseTeamOpening
 * @param {() => number} rng
 * @param {{ aiSeatIds: string[], fixedSeats?: Record<string, { cardId, focus }>, fixedPairing?: string|null }} opts
 * @returns {{ deployments: Record<string, { cardId, focus }>, pairing: string, stats: object }}
 */
export function chooseTeamResponse(match, teamId, params, rng, { aiSeatIds, fixedSeats = {}, fixedPairing = null }) {
  const started = nowMs();
  const deadline = params.maxMs ? started + params.maxMs : null;
  const quality = params.quality ?? 0.7;
  const budgets = stageBudgets(params);
  const visible = hideOpeningInvestments(match);
  const openers = teamSeats(visible, visible.openingTeam);
  const simulate = (candidate, seed) => {
    const r = mulberry32(seed);
    const hiddenFocus = Object.fromEntries(openers.map((s) => [s.id, sampleHiddenFocus(s, r)]));
    const end = playOutTeamMatch(
      visible,
      { hiddenFocus, response: { deployments: { ...fixedSeats, ...candidate.fixed }, pairing: candidate.pairing } },
      r,
      { quality }
    );
    return teamOutcome(end, teamId, aiSeatIds, params);
  };

  const pairings = fixedPairing ? [fixedPairing] : [PAIRINGS.DIRECT, PAIRINGS.CROSSED];
  const combos = [];
  // Miglior mossa di ogni posto per ciascuna disposizione (se il giocatore la cambia).
  const byPairing = {};
  let spent = 0;
  for (const pairing of pairings) {
    const fronts = buildFronts(visible, pairing);
    const perSeat = {};
    for (const seatId of aiSeatIds) {
      const seat = getSeat(visible, seatId);
      const front = fronts.find((f) => f.secondSeatId === seatId);
      const opener = getSeat(visible, front.firstSeatId);
      const openerCard = deployedCard(visible, opener.id);
      const assault = (openerCard?.power || 0) * seatFair(opener);
      const candidates = [];
      for (const card of availableCards(seat)) {
        const need = Math.floor(assault / Math.max(1, card.power || 1)) + 1;
        for (const focus of focusOptions(seat, [need, need + 1])) {
          candidates.push({
            seatId,
            pairing,
            choice: { cardId: card.id, focus },
            fixed: { [seatId]: { cardId: card.id, focus } },
            bias: seatBias(visible, params, seatId, card.id, focus),
          });
        }
      }
      const res = successiveHalving(candidates, budgets.first / (aiSeatIds.length * pairings.length), simulate, rng, deadline);
      spent += res.spent;
      perSeat[seatId] = res.ranked;
    }
    byPairing[pairing] = Object.fromEntries(aiSeatIds.map((id) => [id, perSeat[id][0]?.choice ?? null]));
    const top = params.topPerSeat ?? 3;
    if (aiSeatIds.length === 1) {
      for (const a of perSeat[aiSeatIds[0]].slice(0, top)) {
        combos.push({ pairing, deployments: { [aiSeatIds[0]]: a.choice }, fixed: a.fixed, bias: a.bias });
      }
    } else {
      const [s1, s2] = aiSeatIds;
      for (const a of perSeat[s1].slice(0, top)) {
        for (const b of perSeat[s2].slice(0, top)) {
          combos.push({
            pairing,
            deployments: { [s1]: a.choice, [s2]: b.choice },
            fixed: { [s1]: a.choice, [s2]: b.choice },
            bias: a.bias + b.bias,
          });
        }
      }
    }
  }
  const res = successiveHalving(combos, budgets.second, simulate, rng, deadline);
  const chosen = pickFinal(res.ranked, params.noise, rng) || combos[0];
  return {
    deployments: chosen.deployments,
    pairing: chosen.pairing,
    byPairing,
    stats: { rollouts: spent + res.spent, ms: nowMs() - started, estimate: chosen.mean },
  };
}

/** Squadra che deve decidere adesso e se apre o risponde. */
export function teamToMove(match) {
  if (match.phase === TEAM_DUEL_PHASES.OPENING_DEPLOY) return { teamId: match.openingTeam, role: 'opening' };
  if (match.phase === TEAM_DUEL_PHASES.RESPONSE_DEPLOY) return { teamId: respondingTeam(match), role: 'response' };
  return null;
}

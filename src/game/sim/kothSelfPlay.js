// ============================================
// Banco di prova Re della collina: partite intere fra IA
// ============================================
//
// Setup come useMultiSeatDuel (armate diverse, mani da 5, 5 Campi, 25 PV a testa), semi fissi.
// L'agente in esame occupa a turno ogni posto, gli altri posti li gioca l'avversario:
// il suo punteggio (vittoria 1, condivisa 1/n) si confronta con la quota "alla pari" 1/giocatori.
//
// Agenti: 'old-easy|old-medium|old-hard' (IA precedente, kingOfHillAI.js con il profilo della
// difficoltà) e 'mc-easy|mc-medium|mc-hard' [@chiave=valore;…] (IA a simulazione).

import { ALL_BATTLEFIELDS } from '../../data/index.js';
import { selectBattlefields } from '../fieldLogic.js';
import { createSeat } from '../multiSeat/multiSeatCore.js';
import { pickAiArmyDeck } from '../multiSeat/seatSetup.js';
import { profileForDifficulty } from '../multiSeat/seatAI.js';
import {
  KOTH_CONFIG,
  KOTH_PHASES,
  advanceAfterContest,
  createKothMatch,
  currentCommitter,
  resolveClaim,
  submitCommit,
} from '../kingOfHill/kingOfHill.js';
import { aiCommit } from '../kingOfHill/kingOfHillAI.js';
import { chooseKothCommit } from '../ai/mcKoth/kothSearch.js';
import { getKothMcProfile } from '../ai/mcKoth/kothProfiles.js';
import { mulberry32 } from '../../utils/seededRandom.js';
import { parseAgentSpec } from './simAgents.js';

export function createKothMatchForSeed(seed, players = 3, mode = 'classic') {
  const rng = mulberry32((seed * 2246822519) >>> 0);
  const taken = [];
  const seats = [];
  for (let i = 1; i <= players; i += 1) {
    const pick = pickAiArmyDeck(taken, rng);
    taken.push(pick.army);
    seats.push(createSeat({ id: `P${i}`, name: `P${i}`, army: pick.army, hand: pick.hand, focus: KOTH_CONFIG.startFocus, deckKey: pick.deckKey }));
  }
  const battlefields = selectBattlefields(mode, ALL_BATTLEFIELDS, { rng });
  return createKothMatch({ seats, battlefields, rng, seed, mode });
}

function now() {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

/** Agente per un posto: commit(match, seatId) → { cardId, investment, fieldIndex }. */
export function createKothAgent(spec, { seed = 1 } = {}) {
  const rng = mulberry32(seed >>> 0);
  const { base, overrides } = parseAgentSpec(spec);
  const old = /^old-(easy|medium|hard)$/.exec(base);
  if (old) {
    return { id: spec, profileFor: profileForDifficulty(old[1]), commit: (match, seatId) => aiCommit(match, seatId, rng) };
  }
  const mc = /^mc-(easy|medium|hard)$/.exec(base);
  if (mc) {
    const params = { ...getKothMcProfile(mc[1]), ...(overrides || {}) };
    return { id: spec, commit: (match, seatId) => chooseKothCommit(match, seatId, params, rng).choice };
  }
  throw new Error(`Agente Re della collina sconosciuto: ${spec}`);
}

/** @param {Record<string, object>} agentsBySeat */
export function playKothMatch(match, agentsBySeat) {
  let m = {
    ...match,
    seats: match.seats.map((s) => ({ ...s, aiProfile: agentsBySeat[s.id].profileFor ?? null })),
  };
  const timings = {};
  for (let guard = 0; guard < 60; guard += 1) {
    if (m.phase === KOTH_PHASES.COMMITS) {
      const who = currentCommitter(m);
      const t0 = now();
      const choice = agentsBySeat[who].commit(m, who);
      (timings[who] ||= []).push(now() - t0);
      m = submitCommit(m, who, choice);
    } else if (m.phase === KOTH_PHASES.RESOLVED) {
      m = advanceAfterContest(m);
    } else if (m.phase === KOTH_PHASES.CLAIM) {
      m = resolveClaim(m, 'claim');
    } else {
      return { match: m, timings };
    }
  }
  throw new Error('Re della collina: partita oltre il limite');
}

/**
 * `a` occupa a turno ogni posto; gli altri posti li gioca `b`.
 * @returns {object[]} un record per partita con lo score di `a`
 */
export function runKothPairing({ a, b, players = 3, mode = 'classic', seeds, onMatch }) {
  const out = [];
  for (const seed of seeds) {
    const base = createKothMatchForSeed(seed, players, mode);
    for (const focal of base.seats.map((s) => s.id)) {
      const agents = Object.fromEntries(
        base.seats.map((s, i) => [s.id, createKothAgent(s.id === focal ? a : b, { seed: (seed * 7919 + i + 1) >>> 0 })])
      );
      const { match, timings } = playKothMatch(base, agents);
      const winners = match.result?.winners || [];
      const record = {
        seed,
        players,
        focal,
        score: winners.includes(focal) ? 1 / winners.length : 0,
        reason: match.result?.reason,
        rounds: match.roundNumber,
        msA: timings[focal] || [],
      };
      out.push(record);
      onMatch?.(record);
    }
  }
  return out;
}

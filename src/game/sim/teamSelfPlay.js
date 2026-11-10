// ============================================
// Banco di prova 2v2: partite intere fra squadre IA
// ============================================
//
// Setup come useMultiSeatDuel (quattro armate diverse, mani da 5, 10 Campi, 50 PV di squadra),
// ma con semi fissi. Ogni seme si gioca due volte con le squadre scambiate.
//
// Agenti di squadra (spec):
// - 'old-easy' | 'old-medium' | 'old-hard': IA precedente (teamDuelAI.js) con il profilo che il
//   gioco associa a quella difficoltà (profileForDifficulty);
// - 'mc-easy' | 'mc-medium' | 'mc-hard' [@chiave=valore;…]: IA a simulazione (mcTeam);
//   tratto per entrambi i posti con 'trait=…'.

import { ALL_BATTLEFIELDS } from '../../data/index.js';
import { selectBattlefields } from '../fieldLogic.js';
import { createSeat } from '../multiSeat/multiSeatCore.js';
import { pickAiArmyDeck } from '../multiSeat/seatSetup.js';
import { profileForDifficulty } from '../multiSeat/seatAI.js';
import {
  TEAM_DUEL_CONFIG,
  TEAM_DUEL_PHASES,
  advanceAfterRound,
  createTeamDuelMatch,
  respondingTeam,
  resolveClaim,
  submitOpeningDeploy,
  submitResponseDeploy,
  teamSeats,
} from '../teamDuel/teamDuel.js';
import { aiOpeningDeploy, aiResponsePlan } from '../teamDuel/teamDuelAI.js';
import { chooseTeamOpening, chooseTeamResponse } from '../ai/mcTeam/teamSearch.js';
import { getTeamMcProfile } from '../ai/mcTeam/teamProfiles.js';
import { mulberry32 } from '../../utils/seededRandom.js';
import { parseAgentSpec } from './simAgents.js';

/**
 * Partita 2v2 da un seme. Le mani restano quelle del seme qualunque agente giochi.
 * @param {number} seed
 * @param {'classic'|'bareHands'} [mode]
 */
export function createTeamMatchForSeed(seed, mode = 'classic') {
  const rng = mulberry32((seed * 2654435761) >>> 0);
  const taken = [];
  const picks = [];
  for (let i = 0; i < 4; i += 1) {
    const pick = pickAiArmyDeck(taken, rng);
    taken.push(pick.army);
    picks.push(pick);
  }
  const ids = ['A1', 'A2', 'B1', 'B2'];
  const seats = picks.map((pick, i) =>
    createSeat({
      id: ids[i],
      name: ids[i],
      team: ids[i][0],
      army: pick.army,
      hand: pick.hand,
      focus: TEAM_DUEL_CONFIG.startFocus,
      deckKey: pick.deckKey,
    })
  );
  const battlefields = selectBattlefields(mode, ALL_BATTLEFIELDS, {
    rng,
    fieldCount: TEAM_DUEL_CONFIG.fieldCount,
    selectionConfig: { REVEAL_START: TEAM_DUEL_CONFIG.revealStart },
  });
  return createTeamDuelMatch({ seats, battlefields, rng, seed, mode });
}

function now() {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

/**
 * @param {string} spec
 * @param {{ seed?: number }} [options]
 * @returns {{ id: string, profileFor?: string, opening(match, teamId), response(match, teamId) }}
 */
export function createTeamAgent(spec, { seed = 1 } = {}) {
  const rng = mulberry32(seed >>> 0);
  const { base, overrides } = parseAgentSpec(spec);
  const old = /^old-(easy|medium|hard)$/.exec(base);
  if (old) {
    return {
      id: spec,
      profileFor: profileForDifficulty(old[1]),
      opening(match, teamId) {
        const [s1, s2] = teamSeats(match, teamId);
        const d1 = aiOpeningDeploy(match, s1.id, rng);
        const d2 = aiOpeningDeploy(match, s2.id, rng, [d1.fieldIndex]);
        return { [s1.id]: d1, [s2.id]: d2 };
      },
      response(match, teamId) {
        return aiResponsePlan(match, teamId, rng);
      },
    };
  }
  const mc = /^mc-(easy|medium|hard)$/.exec(base);
  if (mc) {
    const { trait, ...rest } = overrides || {};
    const params = { ...getTeamMcProfile(mc[1]), ...rest };
    const traitsFor = (match, teamId) =>
      trait ? Object.fromEntries(teamSeats(match, teamId).map((s) => [s.id, trait])) : {};
    return {
      id: spec,
      opening(match, teamId) {
        const aiSeatIds = teamSeats(match, teamId).map((s) => s.id);
        return chooseTeamOpening(match, teamId, { ...params, traits: traitsFor(match, teamId) }, rng, { aiSeatIds }).choices;
      },
      response(match, teamId) {
        const aiSeatIds = teamSeats(match, teamId).map((s) => s.id);
        const res = chooseTeamResponse(match, teamId, { ...params, traits: traitsFor(match, teamId) }, rng, { aiSeatIds });
        return { deployments: res.deployments, pairing: res.pairing };
      },
    };
  }
  throw new Error(`Agente 2v2 sconosciuto: ${spec}`);
}

/**
 * Gioca una partita 2v2 fra due agenti di squadra.
 * @param {object} match
 * @param {{ A: object, B: object }} agents
 */
export function playTeamMatch(match, agents) {
  // Profili delle IA precedenti sui posti (servono a teamDuelAI).
  let m = {
    ...match,
    seats: match.seats.map((s) => ({ ...s, aiProfile: agents[s.team].profileFor ?? null })),
  };
  const timings = { A: [], B: [] };
  for (let guard = 0; guard < 20; guard += 1) {
    if (m.phase === TEAM_DUEL_PHASES.OPENING_DEPLOY) {
      const t0 = now();
      const choices = agents[m.openingTeam].opening(m, m.openingTeam);
      timings[m.openingTeam].push(now() - t0);
      m = submitOpeningDeploy(m, choices);
    } else if (m.phase === TEAM_DUEL_PHASES.RESPONSE_DEPLOY) {
      const team = respondingTeam(m);
      const t0 = now();
      const plan = agents[team].response(m, team);
      timings[team].push(now() - t0);
      m = submitResponseDeploy(m, plan.deployments, plan.pairing);
    } else if (m.phase === TEAM_DUEL_PHASES.RESOLVED) {
      m = advanceAfterRound(m);
    } else if (m.phase === TEAM_DUEL_PHASES.CLAIM) {
      m = resolveClaim(m, 'claim');
    } else {
      return { match: m, timings };
    }
  }
  throw new Error('2v2: partita oltre il limite di turni');
}

/**
 * Coppia di agenti su più semi; ogni seme due volte con le squadre scambiate.
 * @returns {object[]} risultati dal punto di vista di `a`
 */
export function runTeamPairing({ a, b, mode = 'classic', seeds, onMatch }) {
  const out = [];
  for (const seed of seeds) {
    const base = createTeamMatchForSeed(seed, mode);
    for (const aTeam of ['A', 'B']) {
      const bTeam = aTeam === 'A' ? 'B' : 'A';
      const agents = {
        [aTeam]: createTeamAgent(a, { seed: (seed * 7919 + 1) >>> 0 }),
        [bTeam]: createTeamAgent(b, { seed: (seed * 7919 + 2) >>> 0 }),
      };
      const { match, timings } = playTeamMatch(base, agents);
      const winner = match.result?.winner;
      const record = {
        seed,
        mode,
        a,
        b,
        aTeam,
        outcome: winner === 'draw' ? 'draw' : winner === aTeam ? 'win' : 'loss',
        reason: match.result?.reason,
        rounds: match.roundNumber,
        hp: { a: match.teams[aTeam].hp, b: match.teams[bTeam].hp },
        msA: timings[aTeam],
        msB: timings[bTeam],
      };
      out.push(record);
      onMatch?.(record);
    }
  }
  return out;
}

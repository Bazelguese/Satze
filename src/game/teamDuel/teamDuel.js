// ============================================================
// 2v2 ad abbinamenti segreti — orchestratore puro
// ============================================================
// Specifica: Documentazione/SATZE_2V2_ABBINAMENTI_SEGRETI_v0.2.md
//
// Ogni funzione riceve uno stato e restituisce un nuovo stato (nessuna mutazione).
// Ogni scontro è un duello 1v1 completo risolto dal motore base: l'Agente dell'apertura è il
// lato `player` (iniziativa), quello della risposta il lato `enemy`.
// ============================================================

import {
  conqueredFieldsForPerspective,
  countOwnedFields,
  finalSeatFocus,
  handLeagueSum,
  isLegalInvestment,
  applyToxinsToPool,
  resolveSeatDuel,
} from '../multiSeat/multiSeatCore.js';

export const TEAM_DUEL_CONFIG = {
  maxHp: 50,
  startFocus: 18,
  handSize: 5,
  fieldCount: 10,
  revealStart: 6,
  revealPerRound: 2,
  conquestThreshold: 5,
  lastTerritorialRound: 4,
  claimRounds: [3, 4],
  rounds: 5,
  toxinMinHealthFactor: 2,
};

export const TEAM_DUEL_PHASES = {
  OPENING_DEPLOY: 'openingDeploy',
  RESPONSE_DEPLOY: 'responseDeploy',
  PLANNING: 'planning',
  RESOLVED: 'resolved',
  CLAIM: 'claim',
  GAME_OVER: 'gameOver',
};

export const PAIRINGS = {
  DIRECT: 'direct',
  CROSSED: 'crossed',
};

export const TEAM_IDS = ['A', 'B'];

export function otherTeam(teamId) {
  return teamId === 'A' ? 'B' : 'A';
}

export function teamSeats(match, teamId) {
  return match.seats.filter((seat) => seat.team === teamId);
}

export function getSeat(match, seatId) {
  return match.seats.find((seat) => seat.id === seatId) || null;
}

function updateSeat(seats, seatId, updater) {
  return seats.map((seat) => (seat.id === seatId ? updater(seat) : seat));
}

/**
 * Crea la partita.
 * @param {object} p
 * @param {object[]} p.seats - quattro posti creati con `createSeat` (team 'A' o 'B', due per squadra, in ordine di posto)
 * @param {object[]} p.battlefields - 10 Campi
 * @param {() => number} p.rng
 * @param {number} [p.seed]
 * @param {string} [p.mode='classic']
 * @param {object} [p.config]
 */
export function createTeamDuelMatch({ seats, battlefields, rng, seed = null, mode = 'classic', config = {} }) {
  const cfg = { ...TEAM_DUEL_CONFIG, ...config };
  if (!Array.isArray(seats) || seats.length !== 4) throw new Error('2v2: servono quattro posti');
  for (const team of TEAM_IDS) {
    if (seats.filter((s) => s.team === team).length !== 2) throw new Error(`2v2: la squadra ${team} deve avere due posti`);
  }
  if (!Array.isArray(battlefields) || battlefields.length < cfg.fieldCount) {
    throw new Error(`2v2: servono ${cfg.fieldCount} Campi`);
  }

  // Apre la squadra con la somma Lega più bassa delle due mani (§3.1); parità: sorteggio.
  const leagueA = seats.filter((s) => s.team === 'A').reduce((sum, s) => sum + handLeagueSum(s.hand), 0);
  const leagueB = seats.filter((s) => s.team === 'B').reduce((sum, s) => sum + handLeagueSum(s.hand), 0);
  let firstOpeningTeam;
  let openingTieBreak = false;
  if (leagueA < leagueB) firstOpeningTeam = 'A';
  else if (leagueB < leagueA) firstOpeningTeam = 'B';
  else {
    firstOpeningTeam = rng() < 0.5 ? 'A' : 'B';
    openingTieBreak = true;
  }

  return {
    mode: 'teamDuel',
    fieldMode: mode,
    config: cfg,
    seed,
    seats: seats.map((seat) => ({ ...seat, focus: seat.focus ?? cfg.startFocus })),
    teams: {
      A: { id: 'A', hp: cfg.maxHp, maxHp: cfg.maxHp },
      B: { id: 'B', hp: cfg.maxHp, maxHp: cfg.maxHp },
    },
    battlefields: battlefields.slice(0, cfg.fieldCount),
    revealedFields: mode === 'bareHands' ? cfg.fieldCount : Math.min(cfg.revealStart, cfg.fieldCount),
    conqueredFields: {},
    roundNumber: 1,
    firstOpeningTeam,
    openingTieBreak,
    leagueSums: { A: leagueA, B: leagueB },
    openingTeam: firstOpeningTeam,
    phase: TEAM_DUEL_PHASES.OPENING_DEPLOY,
    deployments: {},
    plans: {},
    roundResult: null,
    history: [],
    continueAfterClaim: false,
    claim: null,
    result: null,
  };
}

export function respondingTeam(match) {
  return otherTeam(match.openingTeam);
}

/** Campi rivelati e non ancora consumati. */
export function legalFieldIndexes(match) {
  const out = [];
  for (let i = 0; i < match.battlefields.length; i += 1) {
    if (i >= match.revealedFields) continue;
    if (i in match.conqueredFields) continue;
    out.push(i);
  }
  return out;
}

function assertPhase(match, phase) {
  if (match.phase !== phase) throw new Error(`2v2: fase ${match.phase}, attesa ${phase}`);
}

function assertCardPlayable(seat, cardId) {
  const card = seat.hand.find((c) => c.id === cardId);
  if (!card) throw new Error(`2v2: ${seat.name} non ha la carta ${cardId}`);
  if (seat.usedCardIds.includes(cardId)) throw new Error(`2v2: ${seat.name} ha già giocato ${card.name}`);
  return card;
}

/**
 * Schieramento dell'apertura: ciascun posto sceglie Agente e Campo (§4 Fase 2).
 * @param {object} match
 * @param {Record<string, { cardId: string|number, fieldIndex: number }>} deployments
 */
export function submitOpeningDeploy(match, deployments) {
  assertPhase(match, TEAM_DUEL_PHASES.OPENING_DEPLOY);
  const seats = teamSeats(match, match.openingTeam);
  const legal = legalFieldIndexes(match);
  const used = new Set();
  const next = {};
  for (const seat of seats) {
    const choice = deployments?.[seat.id];
    if (!choice) throw new Error(`2v2: manca lo schieramento di ${seat.name}`);
    assertCardPlayable(seat, choice.cardId);
    if (!legal.includes(choice.fieldIndex)) throw new Error('2v2: Campo non disponibile');
    if (used.has(choice.fieldIndex)) throw new Error('2v2: i due compagni devono scegliere Campi diversi');
    used.add(choice.fieldIndex);
    next[seat.id] = { cardId: choice.cardId, fieldIndex: choice.fieldIndex };
  }
  return { ...match, deployments: next, phase: TEAM_DUEL_PHASES.RESPONSE_DEPLOY };
}

/** Schieramento della risposta: due Agenti, senza ancora il fronte (§4 Fase 3). */
export function submitResponseDeploy(match, deployments) {
  assertPhase(match, TEAM_DUEL_PHASES.RESPONSE_DEPLOY);
  const seats = teamSeats(match, respondingTeam(match));
  const next = { ...match.deployments };
  for (const seat of seats) {
    const choice = deployments?.[seat.id];
    if (!choice) throw new Error(`2v2: manca lo schieramento di ${seat.name}`);
    assertCardPlayable(seat, choice.cardId);
    next[seat.id] = { cardId: choice.cardId, fieldIndex: null };
  }
  return { ...match, deployments: next, phase: TEAM_DUEL_PHASES.PLANNING, plans: {} };
}

/**
 * Fronti dati dalla disposizione. Il fronte i è quello dell'i-esimo posto dell'apertura.
 * Diretta: X1–Y1, X2–Y2; incrociata: X1–Y2, X2–Y1.
 */
export function buildFronts(match, pairing) {
  const opening = teamSeats(match, match.openingTeam);
  const responding = teamSeats(match, respondingTeam(match));
  const order = pairing === PAIRINGS.CROSSED ? [responding[1], responding[0]] : [responding[0], responding[1]];
  return opening.map((seat, i) => ({
    index: i,
    fieldIndex: match.deployments[seat.id]?.fieldIndex,
    firstSeatId: seat.id,
    secondSeatId: order[i].id,
  }));
}

/**
 * Piano segreto di una squadra: investimenti dei due posti e, solo per la risposta, la
 * disposizione. Quando entrambe le squadre hanno bloccato il piano il turno si risolve.
 * @param {object} match
 * @param {'A'|'B'} teamId
 * @param {{ investments: Record<string, number>, pairing?: 'direct'|'crossed' }} plan
 */
export function submitTeamPlan(match, teamId, plan) {
  assertPhase(match, TEAM_DUEL_PHASES.PLANNING);
  if (match.plans[teamId]) throw new Error(`2v2: il piano della squadra ${teamId} è già bloccato`);
  const seats = teamSeats(match, teamId);
  const investments = {};
  for (const seat of seats) {
    const value = plan?.investments?.[seat.id];
    if (!isLegalInvestment(seat, value)) throw new Error(`2v2: investimento non valido per ${seat.name}`);
    investments[seat.id] = value;
  }
  const isResponse = teamId === respondingTeam(match);
  let pairing = null;
  if (isResponse) {
    if (plan?.pairing !== PAIRINGS.DIRECT && plan?.pairing !== PAIRINGS.CROSSED) {
      throw new Error('2v2: la risposta deve scegliere la disposizione');
    }
    pairing = plan.pairing;
  } else if (plan?.pairing != null) {
    throw new Error('2v2: solo la risposta sceglie la disposizione');
  }
  const plans = { ...match.plans, [teamId]: { investments, pairing } };
  const next = { ...match, plans };
  if (plans.A && plans.B) return resolveRound(next);
  return next;
}

function resolveRound(match) {
  const cfg = match.config;
  const responding = respondingTeam(match);
  const pairing = match.plans[responding].pairing;
  const investments = { ...match.plans.A.investments, ...match.plans.B.investments };
  const fronts = buildFronts(match, pairing);
  const hpBefore = { A: match.teams.A.hp, B: match.teams.B.hp };

  const hpDelta = { A: 0, B: 0 };
  let seats = match.seats;
  const conquered = { ...match.conqueredFields };
  const resolvedFronts = [];

  // I due fronti leggono lo stesso stato di inizio turno (Vita simultanea, §7.1).
  for (const front of fronts) {
    const first = getSeat(match, front.firstSeatId);
    const second = getSeat(match, front.secondSeatId);
    const firstCard = first.hand.find((c) => c.id === match.deployments[first.id].cardId);
    const secondCard = second.hand.find((c) => c.id === match.deployments[second.id].cardId);
    const field = match.battlefields[front.fieldIndex];
    const battleResult = resolveSeatDuel({
      field,
      firstSeat: first,
      secondSeat: second,
      firstCard,
      secondCard,
      firstFocus: investments[first.id],
      secondFocus: investments[second.id],
      firstHP: hpBefore[first.team],
      secondHP: hpBefore[second.team],
      // Il massimo si applica alla somma finale del turno, non dentro il singolo fronte.
      firstMaxHP: Number.POSITIVE_INFINITY,
      secondMaxHP: Number.POSITIVE_INFINITY,
      conqueredFields: conqueredFieldsForPerspective(
        match.conqueredFields,
        (owner) => (owner === first.team ? 'player' : 'enemy')
      ),
      roundNumber: match.roundNumber,
      fieldIndex: front.fieldIndex,
    });

    const firstWon = battleResult.winner === 'player';
    const winner = firstWon ? first : second;
    const loser = firstWon ? second : first;
    hpDelta[first.team] += battleResult.finalPlayerHP - hpBefore[first.team];
    hpDelta[second.team] += battleResult.finalEnemyHP - hpBefore[second.team];

    const conquest = !(battleResult.fieldDestroyed || battleResult.skipConquest);
    conquered[front.fieldIndex] = conquest
      ? { owner: winner.team, seatId: winner.id, army: battleResult.winnerArmy ?? (firstWon ? firstCard.army : secondCard.army) }
      : { owner: null, destroyed: true };

    seats = updateSeat(seats, first.id, (s) => ({
      ...s,
      focus: finalSeatFocus(battleResult, 'player'),
      usedCardIds: [...s.usedCardIds, firstCard.id],
      previousResult: firstWon ? 'won' : 'lost',
      toxin: battleResult.playerToxinActivated ?? s.toxin,
    }));
    seats = updateSeat(seats, second.id, (s) => ({
      ...s,
      focus: finalSeatFocus(battleResult, 'enemy'),
      usedCardIds: [...s.usedCardIds, secondCard.id],
      previousResult: firstWon ? 'lost' : 'won',
      toxin: battleResult.enemyToxinActivated ?? s.toxin,
    }));

    resolvedFronts.push({
      ...front,
      firstFocus: investments[first.id],
      secondFocus: investments[second.id],
      firstCardId: firstCard.id,
      secondCardId: secondCard.id,
      battleResult,
      winnerSeatId: winner.id,
      loserSeatId: loser.id,
      winnerTeam: winner.team,
      conquered: conquest,
    });
  }

  const hpAfterBattles = {};
  for (const team of TEAM_IDS) {
    hpAfterBattles[team] = Math.min(match.teams[team].maxHp, Math.max(0, hpBefore[team] + hpDelta[team]));
  }

  // Tossine a fine turno sulla Vita di squadra, soglia raddoppiata (§6.2 [P]).
  const hpFinal = { ...hpAfterBattles };
  const toxinEvents = [];
  for (const team of TEAM_IDS) {
    const entries = seats.filter((s) => s.team === team).map((s) => ({ seatId: s.id, toxin: s.toxin }));
    const applied = applyToxinsToPool(hpFinal[team], entries, cfg.toxinMinHealthFactor);
    hpFinal[team] = applied.hp;
    toxinEvents.push(...applied.events.map((e) => ({ ...e, team })));
    seats = seats.map((s) => (s.team === team ? { ...s, toxin: applied.toxins[s.id] ?? null } : s));
  }

  const roundResult = {
    roundNumber: match.roundNumber,
    openingTeam: match.openingTeam,
    respondingTeam: responding,
    pairing,
    investments,
    fronts: resolvedFronts,
    hpBefore,
    hpDelta,
    hpAfterBattles,
    toxinEvents,
    hpAfter: hpFinal,
  };

  return {
    ...match,
    seats,
    teams: {
      A: { ...match.teams.A, hp: hpFinal.A },
      B: { ...match.teams.B, hp: hpFinal.B },
    },
    conqueredFields: conquered,
    roundResult,
    history: [...match.history, roundResult],
    phase: TEAM_DUEL_PHASES.RESOLVED,
  };
}

export function teamFieldCount(match, teamId) {
  return countOwnedFields(match.conqueredFields, teamId);
}

function finish(match, winner, reason) {
  return {
    ...match,
    phase: TEAM_DUEL_PHASES.GAME_OVER,
    claim: null,
    result: {
      winner,
      reason,
      hp: { A: match.teams.A.hp, B: match.teams.B.hp },
      fields: { A: teamFieldCount(match, 'A'), B: teamFieldCount(match, 'B') },
    },
  };
}

function startNextRound(match) {
  const cfg = match.config;
  const revealed = Math.min(match.battlefields.length, match.revealedFields + cfg.revealPerRound);
  return {
    ...match,
    roundNumber: match.roundNumber + 1,
    openingTeam: otherTeam(match.openingTeam),
    revealedFields: match.fieldMode === 'bareHands' ? match.battlefields.length : revealed,
    deployments: {},
    plans: {},
    roundResult: null,
    claim: null,
    phase: TEAM_DUEL_PHASES.OPENING_DEPLOY,
  };
}

/**
 * Dopo la presentazione del turno: condizioni di vittoria come nell'1v1 (§9), poi il turno
 * successivo con apertura invertita e 2 Campi rivelati.
 */
export function advanceAfterRound(match) {
  assertPhase(match, TEAM_DUEL_PHASES.RESOLVED);
  const cfg = match.config;
  const hpA = match.teams.A.hp;
  const hpB = match.teams.B.hp;

  if (hpA <= 0 && hpB <= 0) return finish(match, 'draw', 'hp');
  if (hpA <= 0) return finish(match, 'B', 'hp');
  if (hpB <= 0) return finish(match, 'A', 'hp');

  const round = match.roundNumber;
  if (round <= cfg.lastTerritorialRound && !match.continueAfterClaim) {
    const reached = TEAM_IDS.filter((t) => teamFieldCount(match, t) >= cfg.conquestThreshold);
    if (reached.length > 1) throw new Error('2v2: stato non valido, due squadre oltre la soglia');
    if (reached.length === 1) {
      if (cfg.claimRounds.includes(round)) {
        return { ...match, phase: TEAM_DUEL_PHASES.CLAIM, claim: { team: reached[0] } };
      }
      return finish(match, reached[0], 'fields');
    }
  }
  const cleared = { ...match, continueAfterClaim: false };

  if (round >= cfg.rounds) {
    if (hpA !== hpB) return finish(cleared, hpA > hpB ? 'A' : 'B', 'hp');
    // Come nell'1v1: a parità di PV decidono i Campi conquistati.
    const fA = teamFieldCount(match, 'A');
    const fB = teamFieldCount(match, 'B');
    if (fA !== fB) return finish(cleared, fA > fB ? 'A' : 'B', 'fields');
    return finish(cleared, 'draw', 'draw');
  }
  return startNextRound(cleared);
}

/** Reclamo della vittoria ai turni 3–4: 'claim' chiude la partita, 'continue' prosegue. */
export function resolveClaim(match, decision) {
  assertPhase(match, TEAM_DUEL_PHASES.CLAIM);
  const team = match.claim.team;
  if (decision === 'claim') return finish(match, team, 'fields');
  if (decision !== 'continue') throw new Error('2v2: decisione di reclamo non valida');
  const continued = { ...match, phase: TEAM_DUEL_PHASES.RESOLVED, continueAfterClaim: true, claim: null };
  return advanceAfterRound(continued);
}

// ============================================================
// Tutti contro tutti — Re della collina: orchestratore puro
// ============================================================
// Specifica: Documentazione/SATZE_FFA_RE_DELLA_COLLINA_v0.2.md
//
// Una contesa per Campo: pose in sequenza, rivelazione comune degli investimenti, poi la
// catena di scontri. Ogni scontro è un duello 1v1 completo del motore base: l'occupante è il
// lato `player` (ha schierato prima), lo sfidante il lato `enemy`.
// ============================================================

import {
  conqueredFieldsForPerspective,
  countOwnedFields,
  finalSeatFocus,
  isLegalInvestment,
  applyToxinsToPool,
  resolveSeatDuel,
} from '../multiSeat/multiSeatCore.js';
import { applyFocusSpendWithGuarantee, countAgentsRemainingAfterPlay } from '../legalFocusSpend.js';
import { shuffleArraySeeded } from '../../utils/seededRandom.js';

export const KOTH_CONFIG = {
  maxHp: 25,
  startFocus: 18,
  handSize: 5,
  fieldCount: 5,
  revealStart: 3,
  revealPerContest: 1,
  conquestThreshold: 3,
  lastTerritorialRound: 4,
  claimRounds: [3, 4],
  contests: 5,
};

export const KOTH_PHASES = {
  COMMITS: 'commits',
  RESOLVED: 'resolved',
  CLAIM: 'claim',
  GAME_OVER: 'gameOver',
};

export function getSeat(match, seatId) {
  return match.seats.find((seat) => seat.id === seatId) || null;
}

function updateSeat(seats, seatId, updater) {
  return seats.map((seat) => (seat.id === seatId ? updater(seat) : seat));
}

export function aliveSeatIds(match) {
  return match.initialOrder.filter((id) => !getSeat(match, id)?.eliminated);
}

/**
 * Crea la partita.
 * @param {object} p
 * @param {object[]} p.seats - 3 o 4 posti creati con `createSeat`
 * @param {object[]} p.battlefields - 5 Campi
 * @param {() => number} p.rng
 * @param {string[]} [p.initialOrder] - ordine iniziale; se assente è sorteggiato (§4.1 [P])
 */
export function createKothMatch({ seats, battlefields, rng, seed = null, mode = 'classic', config = {}, initialOrder = null, perspectiveSeatId = null }) {
  const cfg = { ...KOTH_CONFIG, ...config };
  if (!Array.isArray(seats) || seats.length < 3 || seats.length > 4) {
    throw new Error('Re della collina: servono 3 o 4 giocatori');
  }
  if (!Array.isArray(battlefields) || battlefields.length < cfg.fieldCount) {
    throw new Error(`Re della collina: servono ${cfg.fieldCount} Campi`);
  }
  const order = initialOrder || shuffleArraySeeded(seats.map((s) => s.id), rng);
  return {
    mode: 'kingOfHill',
    fieldMode: mode,
    // Posto mostrato sul lato `player` dei risultati quando combatte (il giocatore umano).
    perspectiveSeatId,
    config: cfg,
    seed,
    seats: seats.map((seat) => ({
      ...seat,
      hp: seat.hp ?? cfg.maxHp,
      maxHp: seat.maxHp ?? cfg.maxHp,
      focus: seat.focus ?? cfg.startFocus,
    })),
    initialOrder: order,
    openingCursor: 0,
    battlefields: battlefields.slice(0, cfg.fieldCount),
    revealedFields: mode === 'bareHands' ? cfg.fieldCount : Math.min(cfg.revealStart, cfg.fieldCount),
    conqueredFields: {},
    roundNumber: 1,
    phase: KOTH_PHASES.COMMITS,
    commits: {},
    contestFieldIndex: null,
    contestResult: null,
    history: [],
    continueAfterClaim: false,
    claim: null,
    result: null,
  };
}

/** Ordine della contesa corrente: dall'apertura, in senso circolare fra i vivi. */
export function contestOrder(match) {
  const alive = aliveSeatIds(match);
  if (alive.length === 0) return [];
  const opener = match.initialOrder[match.openingCursor];
  const start = Math.max(0, alive.indexOf(opener));
  return [...alive.slice(start), ...alive.slice(0, start)];
}

export function openerSeatId(match) {
  return contestOrder(match)[0] ?? null;
}

/** Prossimo giocatore che deve posare, o null se hanno posato tutti. */
export function currentCommitter(match) {
  if (match.phase !== KOTH_PHASES.COMMITS) return null;
  return contestOrder(match).find((id) => !match.commits[id]) ?? null;
}

export function legalFieldIndexes(match) {
  const out = [];
  for (let i = 0; i < match.battlefields.length; i += 1) {
    if (i >= match.revealedFields) continue;
    if (i in match.conqueredFields) continue;
    out.push(i);
  }
  return out;
}

/**
 * Posa di un giocatore (§4.2): Agente e investimento; l'apertura sceglie anche il Campo.
 * Quando hanno posato tutti, gli investimenti si rivelano e la catena si risolve.
 */
export function submitCommit(match, seatId, { cardId, investment, fieldIndex = null }) {
  if (match.phase !== KOTH_PHASES.COMMITS) throw new Error(`Re della collina: fase ${match.phase}`);
  const expected = currentCommitter(match);
  if (seatId !== expected) throw new Error('Re della collina: non è il turno di posa di questo giocatore');
  const seat = getSeat(match, seatId);
  const card = seat.hand.find((c) => c.id === cardId);
  if (!card || seat.usedCardIds.includes(cardId)) throw new Error('Re della collina: carta non disponibile');
  if (!isLegalInvestment(seat, investment)) throw new Error('Re della collina: investimento non valido');

  let contestFieldIndex = match.contestFieldIndex;
  if (seatId === openerSeatId(match)) {
    if (!legalFieldIndexes(match).includes(fieldIndex)) throw new Error('Re della collina: Campo non disponibile');
    contestFieldIndex = fieldIndex;
  } else if (fieldIndex != null && fieldIndex !== contestFieldIndex) {
    throw new Error('Re della collina: solo l’apertura sceglie il Campo');
  }

  const next = {
    ...match,
    contestFieldIndex,
    commits: { ...match.commits, [seatId]: { cardId, investment } },
  };
  if (currentCommitter(next) == null) return resolveContest(next);
  return next;
}

function resolveContest(match) {
  const order = contestOrder(match);
  const fieldIndex = match.contestFieldIndex;
  const field = match.battlefields[fieldIndex];

  // Rivelazione: ogni investimento si paga una volta sola, subito (§4.3).
  let seats = match.seats;
  for (const id of order) {
    const { cardId, investment } = match.commits[id];
    seats = updateSeat(seats, id, (s) => ({
      ...s,
      focus: applyFocusSpendWithGuarantee(s.focus, investment, countAgentsRemainingAfterPlay(s.hand, s.usedCardIds, cardId)),
    }));
  }

  const view = () => ({ ...match, seats });
  const fights = [];
  const vacancies = [];
  let occupantId = order[0];
  let lastFightWinnerId = null;
  let lastFight = null;
  const queue = order.slice(1);

  for (let q = 0; q < queue.length; q += 1) {
    const challengerId = queue[q];
    if (occupantId == null) {
      // Posto vuoto: il prossimo vivo subentra senza scontro (§9.2).
      if (!getSeat(view(), challengerId).eliminated) {
        occupantId = challengerId;
        vacancies.push({ seatId: challengerId, afterFight: fights.length });
      }
      continue;
    }
    const occupant = getSeat(view(), occupantId);
    const challenger = getSeat(view(), challengerId);
    const isFinal = q === queue.length - 1;
    const occCommit = match.commits[occupantId];
    const chlCommit = match.commits[challengerId];
    const occCard = occupant.hand.find((c) => c.id === occCommit.cardId);
    const chlCard = challenger.hand.find((c) => c.id === chlCommit.cardId);
    const hpBefore = { [occupantId]: occupant.hp, [challengerId]: challenger.hp };

    // Lato player: l'occupante, salvo che lo sfidante sia il posto della prospettiva.
    const swap = match.perspectiveSeatId != null && challengerId === match.perspectiveSeatId;
    const pId = swap ? challengerId : occupantId;
    const eId = swap ? occupantId : challengerId;
    const pSeat = swap ? challenger : occupant;
    const eSeat = swap ? occupant : challenger;
    const pCommit = match.commits[pId];
    const eCommit = match.commits[eId];
    const battleResult = resolveSeatDuel({
      field,
      firstSeat: pSeat,
      secondSeat: eSeat,
      firstCard: swap ? chlCard : occCard,
      secondCard: swap ? occCard : chlCard,
      firstFocus: pCommit.investment,
      secondFocus: eCommit.investment,
      firstHP: pSeat.hp,
      secondHP: eSeat.hp,
      firstMaxHP: pSeat.maxHp,
      secondMaxHP: eSeat.maxHp,
      conqueredFields: conqueredFieldsForPerspective(
        match.conqueredFields,
        (owner) => (owner === pId ? 'player' : owner === eId ? 'enemy' : null)
      ),
      roundNumber: match.roundNumber,
      fieldIndex,
      // Conquista solo alla conquista finale del Campo (§7.1).
      conquestTriggerSuppressed: !isFinal,
      firstFocusPrepaid: true,
      secondFocusPrepaid: true,
      // L'occupante ha sempre schierato prima dello sfidante.
      playerHasInitiative: !swap,
    });

    const playerWon = battleResult.winner === 'player';
    const winnerId = playerWon ? pId : eId;
    const loserId = playerWon ? eId : pId;
    seats = updateSeat(seats, pId, (s) => ({
      ...s,
      hp: Math.max(0, battleResult.finalPlayerHP),
      focus: finalSeatFocus(battleResult, 'player'),
      previousResult: playerWon ? 'won' : 'lost',
      toxin: battleResult.playerToxinActivated ?? s.toxin,
    }));
    seats = updateSeat(seats, eId, (s) => ({
      ...s,
      hp: Math.max(0, battleResult.finalEnemyHP),
      focus: finalSeatFocus(battleResult, 'enemy'),
      previousResult: playerWon ? 'lost' : 'won',
      toxin: battleResult.enemyToxinActivated ?? s.toxin,
    }));
    // Eliminazioni subito dopo lo scontro (§9.1).
    const eliminatedNow = [];
    for (const id of [occupantId, challengerId]) {
      if (getSeat(view(), id).hp <= 0) {
        seats = updateSeat(seats, id, (s) => ({ ...s, eliminated: true }));
        eliminatedNow.push(id);
      }
    }
    const fight = {
      fightIndex: fights.length,
      playerSeatId: pId,
      enemySeatId: eId,
      firstSeatId: occupantId,
      secondSeatId: challengerId,
      firstCardId: occCard.id,
      secondCardId: chlCard.id,
      firstFocus: occCommit.investment,
      secondFocus: chlCommit.investment,
      isFinal,
      battleResult,
      winnerSeatId: winnerId,
      loserSeatId: loserId,
      hpBefore,
      hpAfter: { [occupantId]: getSeat(view(), occupantId).hp, [challengerId]: getSeat(view(), challengerId).hp },
      eliminated: eliminatedNow,
    };
    fights.push(fight);
    lastFight = fight;
    lastFightWinnerId = winnerId;
    // Un vincitore a 0 PV non resta sulla collina e lo sconfitto non viene promosso.
    occupantId = getSeat(view(), winnerId).eliminated ? null : winnerId;
  }

  let conquerorId = null;
  const conquered = { ...match.conqueredFields };
  const finalBlocked = lastFight && occupantId === lastFightWinnerId
    && (lastFight.battleResult.fieldDestroyed || lastFight.battleResult.skipConquest);
  if (occupantId != null && !getSeat(view(), occupantId).eliminated && !finalBlocked) {
    conquerorId = occupantId;
    const commit = match.commits[occupantId];
    const army = getSeat(view(), occupantId).hand.find((c) => c.id === commit.cardId)?.army ?? null;
    conquered[fieldIndex] = { owner: occupantId, army };
    seats = updateSeat(seats, occupantId, (s) => ({ ...s, conquests: s.conquests + 1 }));
  } else {
    conquered[fieldIndex] = { owner: null, destroyed: true };
  }

  // Carte consumate e Tossine a fine contesa.
  const toxinEvents = [];
  seats = seats.map((s) => {
    if (!match.commits[s.id]) return s;
    let next = { ...s, usedCardIds: [...s.usedCardIds, match.commits[s.id].cardId] };
    if (!next.eliminated && next.toxin) {
      const applied = applyToxinsToPool(next.hp, [{ seatId: s.id, toxin: next.toxin }], 1);
      toxinEvents.push(...applied.events);
      next = { ...next, hp: applied.hp, toxin: applied.toxins[s.id] ?? null };
    }
    return next;
  });

  const contestResult = {
    roundNumber: match.roundNumber,
    fieldIndex,
    order,
    commits: match.commits,
    fights,
    vacancies,
    conquerorSeatId: conquerorId,
    toxinEvents,
  };
  return {
    ...match,
    seats,
    conqueredFields: conquered,
    contestResult,
    history: [...match.history, contestResult],
    phase: KOTH_PHASES.RESOLVED,
  };
}

export function seatFieldCount(match, seatId) {
  return countOwnedFields(match.conqueredFields, seatId);
}

function finish(match, winners, reason) {
  return {
    ...match,
    phase: KOTH_PHASES.GAME_OVER,
    claim: null,
    result: {
      winners,
      draw: winners.length === 0,
      shared: winners.length > 1,
      reason,
      hp: Object.fromEntries(match.seats.map((s) => [s.id, s.hp])),
      fields: Object.fromEntries(match.seats.map((s) => [s.id, seatFieldCount(match, s.id)])),
    },
  };
}

function nextOpeningCursor(match) {
  const n = match.initialOrder.length;
  for (let step = 1; step <= n; step += 1) {
    const idx = (match.openingCursor + step) % n;
    if (!getSeat(match, match.initialOrder[idx]).eliminated) return idx;
  }
  return match.openingCursor;
}

/** Dopo la presentazione della contesa: condizioni di vittoria come nell'1v1 (§9.3). */
export function advanceAfterContest(match) {
  if (match.phase !== KOTH_PHASES.RESOLVED) throw new Error(`Re della collina: fase ${match.phase}`);
  const cfg = match.config;
  const alive = aliveSeatIds(match);
  if (alive.length === 0) return finish(match, [], 'hp');
  if (alive.length === 1) return finish(match, alive, 'hp');

  const round = match.roundNumber;
  if (round <= cfg.lastTerritorialRound && !match.continueAfterClaim) {
    const reached = alive.filter((id) => seatFieldCount(match, id) >= cfg.conquestThreshold);
    if (reached.length > 1) throw new Error('Re della collina: stato non valido, due giocatori oltre la soglia');
    if (reached.length === 1) {
      if (cfg.claimRounds.includes(round)) return { ...match, phase: KOTH_PHASES.CLAIM, claim: { seatId: reached[0] } };
      return finish(match, reached, 'fields');
    }
  }
  const cleared = { ...match, continueAfterClaim: false };

  if (round >= cfg.contests) {
    // Supremazia fra i vivi; a parità di PV i Campi, poi vittoria condivisa [P].
    const bestHp = Math.max(...alive.map((id) => getSeat(match, id).hp));
    let leaders = alive.filter((id) => getSeat(match, id).hp === bestHp);
    if (leaders.length === 1) return finish(cleared, leaders, 'hp');
    const bestFields = Math.max(...leaders.map((id) => seatFieldCount(match, id)));
    leaders = leaders.filter((id) => seatFieldCount(match, id) === bestFields);
    return finish(cleared, leaders, leaders.length === 1 ? 'fields' : 'shared');
  }

  return {
    ...cleared,
    roundNumber: round + 1,
    openingCursor: nextOpeningCursor(match),
    revealedFields: match.fieldMode === 'bareHands'
      ? match.battlefields.length
      : Math.min(match.battlefields.length, match.revealedFields + cfg.revealPerContest),
    commits: {},
    contestFieldIndex: null,
    contestResult: null,
    claim: null,
    phase: KOTH_PHASES.COMMITS,
  };
}

export function resolveClaim(match, decision) {
  if (match.phase !== KOTH_PHASES.CLAIM) throw new Error(`Re della collina: fase ${match.phase}`);
  if (decision === 'claim') return finish(match, [match.claim.seatId], 'fields');
  if (decision !== 'continue') throw new Error('Re della collina: decisione di reclamo non valida');
  return advanceAfterContest({ ...match, phase: KOTH_PHASES.RESOLVED, continueAfterClaim: true, claim: null });
}

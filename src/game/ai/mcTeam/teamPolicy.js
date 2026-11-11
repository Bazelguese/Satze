// ============================================
// 2v2: politica veloce e partita simulata fino alla fine
// ============================================
//
// Usa le regole vere del 2v2 (src/game/teamDuel/teamDuel.js): ogni turno apre una squadra
// (Campo, Agente e FC per posto), l'altra risponde vedendo gli Agenti (non i FC) e sceglie
// Agenti, FC e disposizione. La politica veloce gioca le scelte non fissate.
// VA = POT × FC + modificatori: per battere un Agente visibile servono circa
// floor(VA stimato / POT) + 1 FC.

import {
  PAIRINGS,
  TEAM_DUEL_PHASES,
  advanceAfterRound,
  buildFronts,
  legalFieldIndexes,
  respondingTeam,
  resolveClaim,
  submitOpeningDeploy,
  submitResponseDeploy,
  teamSeats,
} from '../../teamDuel/teamDuel.js';
import { availableCards, legalFocusRange } from '../../multiSeat/multiSeatCore.js';

const JITTER = [-1, 0, 0, 1, 2];

export function seatFair(seat) {
  const n = Math.max(1, availableCards(seat).length);
  return Math.max(1, Math.round(seat.focus / n));
}

export function clampSeatFocus(seat, focus) {
  const { max } = legalFocusRange(seat);
  return Math.max(1, Math.min(Math.max(1, max), Math.round(focus)));
}

export function cardStrength(card) {
  return (card?.power || 0) * 1.2 + (card?.damage || 0);
}

function pickIndex(n, rng) {
  return Math.floor(rng() * n);
}

/** Scelta d'apertura per un posto: Campo libero, carta forte o a caso, FC intorno alla quota. */
export function policyOpening(match, seat, takenFields, rng, quality = 0.6) {
  const fields = legalFieldIndexes(match).filter((i) => !takenFields.includes(i));
  const cards = availableCards(seat);
  const card =
    rng() < quality
      ? [...cards].sort((a, b) => cardStrength(b) - cardStrength(a))[0]
      : cards[pickIndex(cards.length, rng)];
  const focus = clampSeatFocus(seat, seatFair(seat) + JITTER[pickIndex(JITTER.length, rng)]);
  return { cardId: card.id, fieldIndex: fields[pickIndex(fields.length, rng)], focus };
}

/** Agente schierato da un posto dell'apertura (visibile alla risposta). */
export function deployedCard(match, seatId) {
  const seat = match.seats.find((s) => s.id === seatId);
  return seat?.hand.find((c) => c.id === match.deployments?.[seatId]?.cardId) || null;
}

/** Risposta più economica che batte l'Agente visibile, oppure sacrificio. */
export function cheapestAnswer(seat, opposingSeat, opposingCard) {
  const cards = availableCards(seat);
  const { max } = legalFocusRange(seat);
  const fair = seatFair(seat);
  const assault = (opposingCard?.power || 0) * seatFair(opposingSeat);
  let best = null;
  for (const card of cards) {
    const need = Math.floor(assault / Math.max(1, card.power || 1)) + 1;
    if (need > Math.min(Math.max(1, max), fair + 3)) continue;
    const cost = need + cardStrength(card) * 0.15;
    if (!best || cost < best.cost) best = { card, focus: need, cost };
  }
  if (best) return { cardId: best.card.id, focus: clampSeatFocus(seat, best.focus), wins: true };
  const weakest = [...cards].sort((a, b) => cardStrength(a) - cardStrength(b))[0];
  return { cardId: weakest.id, focus: 1, wins: false };
}

/**
 * Risposta della squadra: per ogni disposizione ogni posto cerca la risposta più economica al
 * suo avversario; vince la disposizione con più fronti vinti (a parità, meno FC).
 */
export function policyResponse(match, teamId, rng, quality = 0.7, forcedPairing = null) {
  const seats = teamSeats(match, teamId);
  if (rng() >= quality) {
    const pairing = forcedPairing || (rng() < 0.5 ? PAIRINGS.DIRECT : PAIRINGS.CROSSED);
    const deployments = {};
    for (const seat of seats) {
      const cards = availableCards(seat);
      deployments[seat.id] = {
        cardId: cards[pickIndex(cards.length, rng)].id,
        focus: clampSeatFocus(seat, seatFair(seat) + JITTER[pickIndex(JITTER.length, rng)]),
      };
    }
    return { deployments, pairing };
  }
  let best = null;
  for (const pairing of forcedPairing ? [forcedPairing] : [PAIRINGS.DIRECT, PAIRINGS.CROSSED]) {
    const fronts = buildFronts(match, pairing);
    const deployments = {};
    let wins = 0;
    let spent = 0;
    for (const front of fronts) {
      const seat = seats.find((s) => s.id === front.secondSeatId);
      const opener = match.seats.find((s) => s.id === front.firstSeatId);
      const answer = cheapestAnswer(seat, opener, deployedCard(match, opener.id));
      deployments[seat.id] = { cardId: answer.cardId, focus: answer.focus };
      wins += answer.wins ? 1 : 0;
      spent += answer.focus;
    }
    const score = wins * 100 - spent + rng();
    if (!best || score > best.score) best = { deployments, pairing, score };
  }
  return { deployments: best.deployments, pairing: best.pairing };
}

/** FC nascosti di un posto che ha già aperto: stima intorno alla quota equa. */
export function sampleHiddenFocus(seat, rng) {
  return clampSeatFocus(seat, seatFair(seat) + JITTER[pickIndex(JITTER.length, rng)]);
}

/**
 * Gioca la partita fino alla fine.
 * @param {object} match - in fase di apertura o di risposta
 * @param {{
 *   opening?: Record<string, { cardId, fieldIndex, focus }>, scelte fissate dell'apertura (primo turno)
 *   response?: { deployments: Record<string, { cardId, focus }>, pairing?: string }, risposta fissata
 *   hiddenFocus?: Record<string, number>, FC dell'apertura già schierata ma ignoti (risposta)
 * }} fixed
 * @param {() => number} rng
 * @param {{ quality?: number }} [options]
 * @returns {object} partita finita (phase GAME_OVER, result)
 */
export function playOutTeamMatch(match, fixed, rng, { quality = 0.7 } = {}) {
  let m = match;
  let firstRound = true;
  for (let guard = 0; guard < 12; guard += 1) {
    if (m.phase === TEAM_DUEL_PHASES.OPENING_DEPLOY) {
      const deployments = {};
      const taken = [];
      for (const seat of teamSeats(m, m.openingTeam)) {
        const forced = firstRound ? fixed.opening?.[seat.id] : null;
        const choice = forced || policyOpening(m, seat, taken, rng, quality * 0.85);
        deployments[seat.id] = choice;
        taken.push(choice.fieldIndex);
      }
      // Campi uguali (scelta fissata + politica): si sposta la scelta della politica.
      const seats = teamSeats(m, m.openingTeam);
      if (deployments[seats[0].id].fieldIndex === deployments[seats[1].id].fieldIndex) {
        const free = legalFieldIndexes(m).filter((i) => i !== deployments[seats[0].id].fieldIndex);
        const mover = fixed.opening?.[seats[1].id] && firstRound ? seats[0] : seats[1];
        deployments[mover.id] = { ...deployments[mover.id], fieldIndex: free[pickIndex(free.length, rng)] };
      }
      m = submitOpeningDeploy(m, deployments);
    } else if (m.phase === TEAM_DUEL_PHASES.RESPONSE_DEPLOY) {
      if (firstRound && fixed.hiddenFocus) {
        // FC dell'apertura già schierata: ignoti, si estraggono in ogni simulazione.
        const plans = m.plans[m.openingTeam];
        m = {
          ...m,
          plans: {
            ...m.plans,
            [m.openingTeam]: { ...plans, investments: { ...plans.investments, ...fixed.hiddenFocus } },
          },
        };
      }
      const team = respondingTeam(m);
      const forced = firstRound ? fixed.response : null;
      const policy = policyResponse(m, team, rng, quality, forced?.pairing || null);
      const deployments = { ...policy.deployments, ...(forced?.deployments || {}) };
      const pairing = forced?.pairing || policy.pairing;
      m = submitResponseDeploy(m, deployments, pairing);
      firstRound = false;
    } else if (m.phase === TEAM_DUEL_PHASES.RESOLVED) {
      m = advanceAfterRound(m);
    } else if (m.phase === TEAM_DUEL_PHASES.CLAIM) {
      m = resolveClaim(m, 'claim');
    } else {
      return m;
    }
  }
  return m;
}

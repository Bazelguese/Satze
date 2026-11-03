// ============================================================
// IA dei posti nel 2v2
// ============================================================

import { getSeatAIProfile, chooseCard, chooseInvestment, estimateInvestment } from '../multiSeat/seatAI.js';
import { conqueredFieldsForPerspective, resolveSeatDuel } from '../multiSeat/multiSeatCore.js';
import {
  PAIRINGS,
  buildFronts,
  getSeat,
  legalFieldIndexes,
  respondingTeam,
  teamSeats,
} from './teamDuel.js';

function timing(match) {
  return { round: match.roundNumber, totalRounds: match.config.rounds };
}

/**
 * Schieramento IA per un posto dell'apertura (Agente + Campo).
 * @param {object} match
 * @param {string} seatId
 * @param {() => number} rng
 * @param {number[]} [takenFieldIndexes] - Campi già scelti dal compagno
 */
export function aiOpeningDeploy(match, seatId, rng, takenFieldIndexes = []) {
  const seat = getSeat(match, seatId);
  const profile = getSeatAIProfile(seat.aiProfile);
  const card = chooseCard(seat, profile, timing(match), rng);
  const legal = legalFieldIndexes(match).filter((i) => !takenFieldIndexes.includes(i));
  const fieldIndex = legal[Math.floor(rng() * legal.length)];
  return { cardId: card.id, fieldIndex };
}

/** Schieramento IA per un posto della risposta. */
export function aiResponseDeploy(match, seatId, rng) {
  const seat = getSeat(match, seatId);
  const profile = getSeatAIProfile(seat.aiProfile);
  const card = chooseCard(seat, profile, timing(match), rng);
  return { cardId: card.id };
}

function deployedCard(match, seatId) {
  const seat = getSeat(match, seatId);
  return seat.hand.find((c) => c.id === match.deployments[seatId]?.cardId) || null;
}

function estimatedVA(match, seatId) {
  const seat = getSeat(match, seatId);
  const card = deployedCard(match, seatId);
  return (Number(card?.power) || 0) * estimateInvestment(seat);
}

/**
 * Valuta una disposizione simulando i due fronti con il motore: investimenti propri noti,
 * avversari stimati. Punteggio: danni inflitti − danni subiti, più 4 per Campo.
 */
export function scorePairing(match, teamId, pairing, ownInvestments) {
  const fronts = buildFronts(match, pairing);
  let score = 0;
  for (const front of fronts) {
    const first = getSeat(match, front.firstSeatId);
    const second = getSeat(match, front.secondSeatId);
    const focusOf = (seat) => (seat.team === teamId ? ownInvestments[seat.id] : estimateInvestment(seat));
    const result = resolveSeatDuel({
      field: match.battlefields[front.fieldIndex],
      firstSeat: first,
      secondSeat: second,
      firstCard: deployedCard(match, first.id),
      secondCard: deployedCard(match, second.id),
      firstFocus: focusOf(first),
      secondFocus: focusOf(second),
      firstHP: match.teams[first.team].hp,
      secondHP: match.teams[second.team].hp,
      firstMaxHP: Number.POSITIVE_INFINITY,
      secondMaxHP: Number.POSITIVE_INFINITY,
      conqueredFields: conqueredFieldsForPerspective(match.conqueredFields, (o) => (o === first.team ? 'player' : 'enemy')),
      roundNumber: match.roundNumber,
      fieldIndex: front.fieldIndex,
    });
    const ownSide = first.team === teamId ? 'player' : 'enemy';
    const won = result.winner === ownSide;
    const dealt = ownSide === 'player' ? match.teams[second.team].hp - result.finalEnemyHP : match.teams[first.team].hp - result.finalPlayerHP;
    const taken = ownSide === 'player' ? match.teams[first.team].hp - result.finalPlayerHP : match.teams[second.team].hp - result.finalEnemyHP;
    score += dealt - taken + (won ? 4 : -4);
  }
  return score;
}

/**
 * Investimento IA di un posto. Il Calcolatore della risposta conosce la disposizione che
 * sceglierà la propria squadra e mira all'avversario abbinato.
 */
export function aiInvestment(match, seatId, rng, { opponentSeatId = null } = {}) {
  const seat = getSeat(match, seatId);
  const profile = getSeatAIProfile(seat.aiProfile);
  const card = deployedCard(match, seatId);
  const hint = opponentSeatId ? { opponentEstimatedVA: estimatedVA(match, opponentSeatId) } : {};
  return chooseInvestment(seat, card, profile, rng, hint);
}

/**
 * Piano completo di una squadra IA (o della parte IA di una squadra mista).
 * @param {object} match
 * @param {'A'|'B'} teamId
 * @param {() => number} rng
 * @param {{ fixedInvestments?: Record<string, number>, fixedPairing?: string|null }} [fixed]
 *   valori già scelti dal giocatore umano della squadra
 */
export function aiTeamPlan(match, teamId, rng, fixed = {}) {
  const seats = teamSeats(match, teamId);
  const isResponse = teamId === respondingTeam(match);
  const fixedInvestments = fixed.fixedInvestments || {};

  const investFor = (pairing) => {
    const fronts = pairing ? buildFronts(match, pairing) : [];
    const opponentOf = (seatId) => {
      const f = fronts.find((x) => x.firstSeatId === seatId || x.secondSeatId === seatId);
      if (!f) return null;
      return f.firstSeatId === seatId ? f.secondSeatId : f.firstSeatId;
    };
    const out = {};
    for (const seat of seats) {
      out[seat.id] = fixedInvestments[seat.id] ?? aiInvestment(match, seat.id, rng, { opponentSeatId: opponentOf(seat.id) });
    }
    return out;
  };

  if (!isResponse) return { investments: investFor(null) };

  if (fixed.fixedPairing) return { investments: investFor(fixed.fixedPairing), pairing: fixed.fixedPairing };

  const leaderProfile = getSeatAIProfile(seats.find((s) => !s.isHuman)?.aiProfile);
  if (leaderProfile.cardPlan === 'random') {
    const pairing = rng() < 0.5 ? PAIRINGS.DIRECT : PAIRINGS.CROSSED;
    return { investments: investFor(pairing), pairing };
  }
  const options = [PAIRINGS.DIRECT, PAIRINGS.CROSSED].map((pairing) => {
    const investments = investFor(pairing);
    return { pairing, investments, score: scorePairing(match, teamId, pairing, investments) };
  });
  options.sort((a, b) => b.score - a.score);
  return { investments: options[0].investments, pairing: options[0].pairing };
}

/** Disposizione consigliata dal compagno IA al giocatore umano. */
export function suggestPairing(match, teamId, investments) {
  const direct = scorePairing(match, teamId, PAIRINGS.DIRECT, investments);
  const crossed = scorePairing(match, teamId, PAIRINGS.CROSSED, investments);
  return direct >= crossed ? PAIRINGS.DIRECT : PAIRINGS.CROSSED;
}

// ============================================================
// IA dei posti nel Re della collina
// ============================================================

import { getSeatAIProfile, chooseCard, chooseInvestment, estimateInvestment } from '../multiSeat/seatAI.js';
import { contestOrder, getSeat, legalFieldIndexes, openerSeatId } from './kingOfHill.js';

/**
 * Posa IA: carta, investimento e (per l'apertura) Campo. Vede solo le carte già posate,
 * non gli investimenti altrui.
 */
export function aiCommit(match, seatId, rng) {
  const seat = getSeat(match, seatId);
  const profile = getSeatAIProfile(seat.aiProfile);
  const card = chooseCard(seat, profile, { round: match.roundNumber, totalRounds: match.config.contests }, rng);

  const isOpener = seatId === openerSeatId(match);
  let fieldIndex = null;
  if (isOpener) {
    const legal = legalFieldIndexes(match);
    fieldIndex = legal[Math.floor(rng() * legal.length)];
  }

  // Lo sfidante affronterà l'occupante: stima il VA più alto fra le carte già posate.
  const earlier = contestOrder(match).filter((id) => id !== seatId && match.commits[id]);
  let opponentEstimatedVA = null;
  if (earlier.length > 0) {
    opponentEstimatedVA = Math.max(...earlier.map((id) => {
      const other = getSeat(match, id);
      const otherCard = other.hand.find((c) => c.id === match.commits[id].cardId);
      return (Number(otherCard?.power) || 0) * estimateInvestment(other);
    }));
  }
  // L'apertura deve reggere più scontri con lo stesso investimento: spinge un po' di più.
  const opener = isOpener && contestOrder(match).length > 2 ? { ...profile, spendBias: profile.spendBias * 1.2 } : profile;
  const investment = chooseInvestment(seat, card, opener, rng, { opponentEstimatedVA });
  return { cardId: card.id, investment, fieldIndex };
}

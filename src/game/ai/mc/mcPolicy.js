// ============================================
// Politica veloce per le simulazioni (motore a simulazione)
// ============================================
//
// Usata per giocare il resto della partita nelle simulazioni e per le scelte
// dell'avversario. Deve essere rapida: niente ricerca, solo stime su POT, DAN e FC.
// Lo stato è sempre dal punto di vista di chi decide (lato `enemy`, come gli agenti
// del motore di partita senza interfaccia).
//
// VA = POT × FC + modificatori (Documentazione/GLOSSARIO.md): per battere un Agente
// visibile servono circa floor(VA stimato / POT) + 1 FC.

import { availableCards, legalFieldIndexes, legalFocusRange } from '../../sim/headlessMatch.js';

export function clampFocusFor(view, side, focus) {
  const { maxFocus } = legalFocusRange(view, side);
  return Math.max(1, Math.min(Math.max(1, maxFocus), Math.round(focus)));
}

/** Quota equa di FC per carta rimasta. */
export function fairShareFor(view, side) {
  const { pool, cardsRemaining } = legalFocusRange(view, side);
  return Math.max(1, Math.round(pool / Math.max(1, cardsRemaining)));
}

export function cardStrength(card) {
  return (card?.power || 0) * 1.2 + (card?.damage || 0);
}

/** VA stimato di un Agente avversario visibile, con la sua quota equa di FC. */
export function estimateVisibleAssault(view) {
  const card = view.selectedAgent;
  if (!card) return 0;
  return (card.power || 0) * fairShareFor(view, 'player');
}

/** FC minimi perché `card` superi un VA stimato. */
export function focusNeededToBeat(card, assault) {
  return Math.floor(assault / Math.max(1, card.power || 1)) + 1;
}

const JITTER = [-1, 0, 0, 1, 2];

function leadChoice(view, rng, quality) {
  const cards = availableCards(view, 'enemy');
  const card =
    rng() < quality
      ? [...cards].sort((a, b) => cardStrength(b) - cardStrength(a))[0]
      : cards[Math.floor(rng() * cards.length)];
  const focus = clampFocusFor(
    view,
    'enemy',
    fairShareFor(view, 'enemy') + JITTER[Math.floor(rng() * JITTER.length)]
  );
  return { card, focus };
}

/**
 * Risposta a un Agente visibile: con probabilità `quality` sceglie la carta più economica
 * che lo batte con pochi FC; se nessuna può, sacrifica la più debole con 1 FC.
 */
function respondChoice(view, rng, quality) {
  if (rng() >= quality) return leadChoice(view, rng, 0);
  const cards = availableCards(view, 'enemy');
  const { maxFocus } = legalFocusRange(view, 'enemy');
  const fair = fairShareFor(view, 'enemy');
  const assault = estimateVisibleAssault(view);
  let best = null;
  for (const card of cards) {
    const need = focusNeededToBeat(card, assault);
    if (need > Math.min(Math.max(1, maxFocus), fair + 3)) continue;
    const cost = need + cardStrength(card) * 0.15;
    if (!best || cost < best.cost) best = { card, focus: need, cost };
  }
  if (best) {
    const extra = rng() < 0.3 ? 1 : 0;
    return { card: best.card, focus: clampFocusFor(view, 'enemy', best.focus + extra) };
  }
  const weakest = [...cards].sort((a, b) => cardStrength(a) - cardStrength(b))[0];
  return { card: weakest, focus: 1 };
}

/**
 * Agente veloce per le simulazioni.
 * @param {() => number} rng
 * @param {{ quality?: number }} [options] - 0 = quasi casuale, 1 = sempre la scelta euristica
 */
export function createFastPolicyAgent(rng, { quality = 0.7 } = {}) {
  return {
    lead(view) {
      const fields = legalFieldIndexes(view);
      const { card, focus } = leadChoice(view, rng, quality * 0.6);
      return { fieldIndex: fields[Math.floor(rng() * fields.length)], cardId: card.id, focus };
    },
    respond(view) {
      const { card, focus } = respondChoice(view, rng, quality);
      return { cardId: card.id, focus };
    },
  };
}

/** FC nascosti dell'avversario che ha già schierato: stima intorno alla sua quota equa. */
export function sampleOpponentFocus(view, rng) {
  return clampFocusFor(
    view,
    'player',
    fairShareFor(view, 'player') + JITTER[Math.floor(rng() * JITTER.length)]
  );
}

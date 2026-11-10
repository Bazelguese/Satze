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

import {
  availableCards,
  legalFieldIndexes,
  legalFocusRange,
  resolveHeadlessDuel,
} from '../../sim/headlessMatch.js';
import { buildFeatureContext, dot, moveFeatures } from './mcFeatures.js';

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
 * Risposta calcolata: per ogni carta e alcuni valori di FC risolve davvero il duello
 * (Poteri, Bonus e Campo compresi) contro l'Agente visibile, con i suoi FC stimati
 * alla quota equa, e sceglie il modo più economico di vincere.
 */
function simulatedRespondChoice(view, rng, quality) {
  if (rng() >= quality) return leadChoice(view, rng, 0);
  const opponent = { card: view.selectedAgent, focus: fairShareFor(view, 'player') };
  const assault = estimateVisibleAssault(view);
  const { maxFocus } = legalFocusRange(view, 'enemy');
  const fair = fairShareFor(view, 'enemy');
  let best = null;
  for (const card of availableCards(view, 'enemy')) {
    const need = focusNeededToBeat(card, assault);
    const options = new Set(
      [1, need - 1, need, need + 1, need + 2]
        .filter((f) => f <= fair + 4)
        .map((f) => clampFocusFor(view, 'enemy', f))
    );
    for (const focus of options) {
      if (focus > Math.max(1, maxFocus)) continue;
      const result = resolveHeadlessDuel(view, view.currentFieldIndex, opponent, { card, focus });
      const score =
        (result.winner === 'enemy' ? 1000 : 0) +
        (result.finalEnemyHP - result.finalPlayerHP) * 15 -
        focus * 25 -
        cardStrength(card) * 3;
      if (!best || score > best.score) best = { card, focus, score };
    }
  }
  return best ? { card: best.card, focus: best.focus } : respondChoice(view, rng, quality);
}

/** Valori di FC da considerare per una carta (comuni a motore e politica addestrata). */
export function focusOptionsFor(view, card) {
  const fair = fairShareFor(view, 'enemy');
  const values = [1, fair - 1, fair, fair + 1, fair + 3];
  if (view.selectedAgent) {
    const need = focusNeededToBeat(card, estimateVisibleAssault(view));
    values.push(need, need + 1);
  }
  return [...new Set(values.map((v) => clampFocusFor(view, 'enemy', v)))];
}

/**
 * Politica addestrata: punteggio lineare sulle caratteristiche di ogni mossa
 * (Agente × FC), scelta con softmax. Il Campo, con l'iniziativa, resta a caso.
 */
function learnedChoice(view, rng, weights) {
  const ctx = buildFeatureContext(view);
  const moves = [];
  let best = -Infinity;
  for (const card of ctx.cards) {
    for (const focus of focusOptionsFor(view, card)) {
      const logit = dot(weights, moveFeatures(view, card, focus, ctx));
      moves.push({ card, focus, logit });
      if (logit > best) best = logit;
    }
  }
  let total = 0;
  for (const m of moves) {
    m.w = Math.exp(m.logit - best);
    total += m.w;
  }
  let roll = rng() * total;
  for (const m of moves) {
    roll -= m.w;
    if (roll <= 0) return m;
  }
  return moves[moves.length - 1];
}

/**
 * Agente veloce per le simulazioni.
 * @param {() => number} rng
 * @param {{ quality?: number, responder?: 'heuristic'|'simulate', learnedWeights?: number[] }} [options]
 *   quality: 0 = quasi casuale, 1 = sempre la scelta euristica;
 *   responder: come risponde a un Agente visibile (stima POT × FC o duello calcolato);
 *   learnedWeights: se presenti, Agente e FC li sceglie la politica addestrata
 */
export function createFastPolicyAgent(
  rng,
  { quality = 0.7, responder = 'heuristic', learnedWeights = null } = {}
) {
  if (learnedWeights) {
    return {
      lead(view) {
        const fields = legalFieldIndexes(view);
        const { card, focus } = learnedChoice(view, rng, learnedWeights);
        return { fieldIndex: fields[Math.floor(rng() * fields.length)], cardId: card.id, focus };
      },
      respond(view) {
        const { card, focus } = learnedChoice(view, rng, learnedWeights);
        return { cardId: card.id, focus };
      },
    };
  }
  const respondWith = responder === 'simulate' ? simulatedRespondChoice : respondChoice;
  return {
    lead(view) {
      const fields = legalFieldIndexes(view);
      const { card, focus } = leadChoice(view, rng, quality * 0.6);
      return { fieldIndex: fields[Math.floor(rng() * fields.length)], cardId: card.id, focus };
    },
    respond(view) {
      const { card, focus } = respondWith(view, rng, quality);
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

// ============================================
// Prototipo sperimentale: IA a simulazione (Monte Carlo)
// ============================================
//
// Solo banco di prova, non collegato al gioco. Serve a capire se una valutazione per
// simulazione batte il motore attuale. Per ogni azione candidata gioca molte volte il resto
// della partita con una politica veloce e sceglie l'azione con il punteggio medio migliore.
// Le mani sono visibili: l'unica incognita simulata sono le scelte dell'avversario (FC).

import { mulberry32 } from '../../utils/seededRandom.js';
import {
  availableCards,
  legalFieldIndexes,
  legalFocusRange,
  playHeadlessRound,
  resolveMatchEnd,
} from './headlessMatch.js';
import { resolveRoundInitiative } from '../duel/resolveRoundInitiative.js';

function clampFocus(view, side, focus) {
  const { maxFocus } = legalFocusRange(view, side);
  return Math.max(1, Math.min(Math.max(1, maxFocus), Math.round(focus)));
}

function fairShare(view, side) {
  const { pool, cardsRemaining } = legalFocusRange(view, side);
  return Math.max(1, Math.round(pool / Math.max(1, cardsRemaining)));
}

function cardStrength(card) {
  return (card.power || 0) * 1.2 + (card.damage || 0);
}

/** Politica veloce e un po' casuale, usata per l'avversario e per il resto della partita. */
function rolloutChoice(view, side, rng) {
  const cards = availableCards(view, side);
  let card;
  if (rng() < 0.5) {
    card = [...cards].sort((a, b) => cardStrength(b) - cardStrength(a))[0];
  } else {
    card = cards[Math.floor(rng() * cards.length)];
  }
  const jitter = [-1, 0, 0, 1, 2][Math.floor(rng() * 5)];
  return { cardId: card.id, focus: clampFocus(view, side, fairShare(view, side) + jitter) };
}

/** Agente per la simulazione. Come ogni agente riceve la propria vista: decide sempre da `enemy`. */
function rolloutAgent(rng) {
  return {
    lead(state) {
      const fields = legalFieldIndexes(state);
      return { fieldIndex: fields[Math.floor(rng() * fields.length)], ...rolloutChoice(state, 'enemy', rng) };
    },
    respond(state) {
      return rolloutChoice(state, 'enemy', rng);
    },
  };
}

/** Prima decisione fissata, poi la politica veloce. */
function fixedFirst(first, fallback) {
  let used = false;
  return {
    lead(state) {
      if (!used) {
        used = true;
        return first;
      }
      return fallback.lead(state);
    },
    respond(state) {
      if (!used) {
        used = true;
        return first;
      }
      return fallback.respond(state);
    },
  };
}

/** Gioca il resto della partita da `state` (inizio turno). */
function playOut(state, agents, maxRounds = 12) {
  let current = state;
  for (let guard = 0; guard < maxRounds; guard += 1) {
    const { state: after } = playHeadlessRound(current, agents);
    const end = resolveMatchEnd(after, current.roundNumber);
    if (end) return { end, state: after };
    const nextRound = current.roundNumber + 1;
    current = {
      ...after,
      roundNumber: nextRound,
      isPlayerFirst: resolveRoundInitiative({
        roundNumber: nextRound,
        openingPlayerFirst: after.openingPlayerFirst,
        initiativeProfile: null,
      }),
      currentFieldIndex: null,
      selectedAgent: null,
      enemyAgent: null,
    };
  }
  return { end: { winner: 'draw', reason: 'guard' }, state: current };
}

function outcomeValue(end, finalState, me) {
  const base = end.winner === 'draw' ? 0.5 : end.winner === me ? 1 : 0;
  const hpDiff =
    me === 'enemy'
      ? finalState.enemyHP - finalState.playerHP
      : finalState.playerHP - finalState.enemyHP;
  return base + hpDiff * 0.002;
}

function focusOptions(view) {
  const fair = fairShare(view, 'enemy');
  const values = [1, fair - 1, fair, fair + 1, fair + 3].map((v) => clampFocus(view, 'enemy', v));
  return [...new Set(values)];
}

/**
 * @param {{ seed?: number, rollouts?: number, label?: string }} [options]
 */
export function createMonteCarloAgent({ seed = 1, rollouts = 40, label = 'mc' } = {}) {
  const rng = mulberry32(seed >>> 0);

  // La vista ha sempre l'agente sul lato `enemy`.
  const evaluate = (view, candidates, leaderIsMe) => {
    let best = null;
    for (const candidate of candidates) {
      let total = 0;
      for (let i = 0; i < rollouts; i += 1) {
        const r = mulberry32((rng() * 2 ** 32) >>> 0);
        const opponent = rolloutAgent(r);
        const opponentFirst = leaderIsMe
          ? opponent
          : // Risposta: l'avversario ha già schierato la carta visibile; i suoi FC sono ignoti.
            fixedFirst(
              {
                fieldIndex: view.currentFieldIndex,
                cardId: view.selectedAgent.id,
                focus: rolloutChoice(view, 'player', r).focus,
              },
              opponent
            );
        const agents = {
          enemy: fixedFirst(candidate, rolloutAgent(r)),
          player: opponentFirst,
        };
        const start = { ...view, selectedAgent: null, enemyAgent: null };
        const { end, state } = playOut(start, agents);
        total += outcomeValue(end, state, 'enemy');
      }
      const score = total / rollouts;
      if (!best || score > best.score) best = { ...candidate, score };
    }
    return best;
  };

  return {
    id: label,
    kind: 'montecarlo',
    lead(view) {
      const candidates = [];
      for (const fieldIndex of legalFieldIndexes(view)) {
        for (const card of availableCards(view, 'enemy')) {
          for (const focus of focusOptions(view)) candidates.push({ fieldIndex, cardId: card.id, focus });
        }
      }
      return evaluate(view, candidates, true);
    },
    respond(view) {
      const candidates = [];
      for (const card of availableCards(view, 'enemy')) {
        for (const focus of focusOptions(view)) {
          candidates.push({ fieldIndex: view.currentFieldIndex, cardId: card.id, focus });
        }
      }
      return evaluate(view, candidates, false);
    },
  };
}


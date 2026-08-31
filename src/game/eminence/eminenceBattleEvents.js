// ============================================
// EMINENZE — Eventi di battaglia
// Fonte normativa: SATZE_EMINENZE_SPEC_UNIFICATA_v2.2.md §11.5
// ============================================

import {
  BATTLE_PHASES,
  BATTLE_REVEAL_AT,
  BATTLE_STATS,
  makeAgentTarget,
  makePlayerTarget,
  makeSource,
} from '../duel/battleEventTypes.js';
import { emitResourceChange, emitStatChange } from '../duel/battleEventEmit.js';
import { SIDES } from './eminenceConstants.js';

const STAT_LABELS = {
  power: BATTLE_STATS.POT,
  damage: BATTLE_STATS.DAN,
  assaultValue: BATTLE_STATS.VA,
};

function eminenceSource(ownerSide, abilityId = null) {
  return makeSource({ kind: 'eminence', id: abilityId, ownerSide });
}

/**
 * Emette gli eventi degli effetti Eminenza che atterrano allo schieramento.
 *
 * Sono classificati nella fase `deploy` e non fra gli effetti: l'Eminenza si è rivelata
 * prima del Duello, quindi l'Agente scende in campo già modificato e il log non deve
 * suggerire che a cambiarlo sia stato un Potere o il Campo.
 */
export function emitEminenceDeployEvents(channel, bundle, {
  playerHPBefore,
  enemyHPBefore,
  playerHPAfter,
  enemyHPAfter,
  pAgent,
  eAgent,
  statDeltas,
}) {
  if (!bundle || !channel) return;

  const hpBySide = {
    [SIDES.PLAYER]: { before: playerHPBefore, after: playerHPAfter },
    [SIDES.ENEMY]: { before: enemyHPBefore, after: enemyHPAfter },
  };
  const agentBySide = { [SIDES.PLAYER]: pAgent, [SIDES.ENEMY]: eAgent };

  for (const side of [SIDES.PLAYER, SIDES.ENEMY]) {
    const { before, after } = hpBySide[side];
    if (before === after) continue;

    // La causa precisa vive nelle voci del bundle; l'evento porta la prima che riguarda
    // questo lato, che è quella che il giocatore sta vedendo risolversi.
    const cause = (bundle.hpDeltas || []).find((entry) => entry.side === side);
    emitResourceChange(channel, {
      phase: BATTLE_PHASES.deploy,
      revealAt: BATTLE_REVEAL_AT.deploy,
      source: eminenceSource(side, cause?.source ?? null),
      target: makePlayerTarget(side),
      stat: BATTLE_STATS.PV,
      before,
      after,
    });
  }

  for (const side of [SIDES.PLAYER, SIDES.ENEMY]) {
    const deltas = statDeltas?.[side];
    const agent = agentBySide[side];
    if (!deltas || !agent) continue;

    for (const [key, label] of Object.entries(STAT_LABELS)) {
      const delta = deltas[key] || 0;
      if (!delta) continue;

      const before = key === 'assaultValue' ? 0 : agent[key === 'power' ? 'power' : 'damage'];
      emitStatChange(channel, {
        phase: BATTLE_PHASES.deploy,
        revealAt: BATTLE_REVEAL_AT.deploy,
        source: eminenceSource(side),
        target: makeAgentTarget(side, agent),
        stat: label,
        before,
        after: before + delta,
      });
    }
  }
}

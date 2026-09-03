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
import { emitFieldRule, emitInfo, emitResourceChange, emitStatChange } from '../duel/battleEventEmit.js';
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
 * Dichiara nel log quali lati non subiscono la parte per-Agente del Campo.
 *
 * Il setup del Campo scrive comunque le proprie righe («−2 DAN a entrambi») perché agisce su
 * tutti e viene poi ripristinato sul lato velato. Senza questa dichiarazione il registro
 * annuncerebbe effetti che uno dei due non ha mai subito.
 */
export function emitFieldVeilEvents(channel, veiledSides, { field, pAgent, eAgent }) {
  if (!channel || !veiledSides?.length || !field) return;

  const agentBySide = { [SIDES.PLAYER]: pAgent, [SIDES.ENEMY]: eAgent };

  for (const side of veiledSides) {
    const agent = agentBySide[side];
    if (!agent) continue;

    emitFieldRule(channel, {
      phase: BATTLE_PHASES.deploy,
      revealAt: BATTLE_REVEAL_AT.deploy,
      source: eminenceSource(side),
      target: makeAgentTarget(side, agent),
      ruleCode: 'fieldIgnoredByAgent',
      // Le regole strutturali restano: il log lo dice, così la differenza è leggibile
      // quando il Campo decide comunque il vincitore.
      params: { fieldId: field.id, fieldName: field.name, structuralRulesStillApply: true },
    });
  }
}

function grantTemporaryFocusSource(bundle) {
  return (bundle?.logs || []).find((entry) => entry.primitive === 'GRANT_TEMPORARY_FOCUS')?.source ?? null;
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
  focusInvestedBySide = null,
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

  const grantSource = grantTemporaryFocusSource(bundle);
  for (const side of [SIDES.PLAYER, SIDES.ENEMY]) {
    const temporary = Math.max(0, bundle.temporaryFocus?.[side] || 0);
    if (!temporary) continue;

    const agent = agentBySide[side];
    if (!agent) continue;

    const invested = Math.max(0, focusInvestedBySide?.[side] ?? 0);
    emitInfo(channel, {
      phase: BATTLE_PHASES.deploy,
      revealAt: BATTLE_REVEAL_AT.deploy,
      infoCode: 'temporaryFocus',
      source: eminenceSource(side, grantSource),
      target: makeAgentTarget(side, agent),
      data: {
        invested,
        temporary,
        effective: invested + temporary,
      },
    });
  }
}

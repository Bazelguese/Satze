// ============================================
// EMINENZE — Registro delle primitive
// Fonte normativa: SATZE_EMINENZE_SPEC_UNIFICATA_v2.2.md §4.4, §7, §16
// ============================================
//
// Vincolo architetturale: questo file è indicizzato per **primitiva**, mai per Eminenza.
// Se per far funzionare una nuova Eminenza servisse un ramo con il suo nome, allora manca
// una primitiva e va aggiunta qui in forma generica. Il test di acceptance verifica
// meccanicamente che nessun identificatore di Eminenza compaia nei moduli del motore.

import {
  EMINENCE_PRIMITIVES as P,
  PRIMITIVE_TARGETS as T,
  SIDES,
  OPPOSITE_SIDE,
  HP_LOSS_CAUSES,
} from './eminenceConstants.js';
import { createTriggerRules, applyPrimitiveToTriggerRules } from './triggerRulesOverlay.js';

/** Accumulatore degli effetti Eminenza di un checkpoint. */
export function createEffectBundle() {
  return {
    statDeltas: {
      [SIDES.PLAYER]: { power: 0, damage: 0, assaultValue: 0, league: 0 },
      [SIDES.ENEMY]: { power: 0, damage: 0, assaultValue: 0, league: 0 },
    },
    hpDeltas: [],
    temporaryFocus: { [SIDES.PLAYER]: 0, [SIDES.ENEMY]: 0 },
    presenceChanges: [],
    ignoreFieldSides: [],
    triggerRules: createTriggerRules(),
    armyBonusState: {},
    fieldOperations: [],
    marks: [],
    endMatchDebts: [],
    blockedEminences: [],
    toxinApplications: [],
    slotModifiers: [],
    logs: [],
  };
}

/**
 * Risolve il bersaglio di un segmento in una lista di lati.
 * `CHOSEN` legge il lato dai parametri scelti dal giocatore, non da una regola fissa.
 */
export function resolveTargetSides(target, ownerSide, params = null) {
  const other = OPPOSITE_SIDE[ownerSide];
  switch (target) {
    case T.SELF:
    case T.OWN_AGENT:
      return [ownerSide];
    case T.OPPONENT:
    case T.ENEMY_AGENT:
      return [other];
    case T.BOTH:
    case T.GLOBAL:
      return [ownerSide, other];
    case T.CHOSEN:
      return params?.targetSide ? [params.targetSide] : [];
    default:
      return [ownerSide];
  }
}

const handlers = {
  [P.MODIFY_STAT]: (bundle, segment, ctx) => {
    for (const side of resolveTargetSides(segment.target, ctx.ownerSide, ctx.params)) {
      const stat = segment.stat;
      if (!(stat in bundle.statDeltas[side])) {
        throw new Error(`Statistica non gestita da MODIFY_STAT: ${stat}`);
      }
      bundle.statDeltas[side][stat] += segment.delta || 0;
    }
  },

  [P.MODIFY_LEAGUE]: (bundle, segment, ctx) => {
    for (const side of resolveTargetSides(segment.target, ctx.ownerSide, ctx.params)) {
      bundle.statDeltas[side].league += segment.delta || 0;
    }
  },

  [P.LOSE_HP]: (bundle, segment, ctx) => {
    for (const side of resolveTargetSides(segment.target, ctx.ownerSide, ctx.params)) {
      bundle.hpDeltas.push({
        side,
        amount: -Math.abs(segment.amount || 0),
        cause: segment.cause || HP_LOSS_CAUSES.OTHER,
        source: ctx.source,
      });
    }
  },

  [P.HEAL_HP]: (bundle, segment, ctx) => {
    for (const side of resolveTargetSides(segment.target, ctx.ownerSide, ctx.params)) {
      bundle.hpDeltas.push({
        side,
        amount: Math.abs(segment.amount || 0),
        cause: segment.cause || HP_LOSS_CAUSES.OTHER,
        source: ctx.source,
      });
    }
  },

  [P.CHANGE_PRESENCE]: (bundle, segment, ctx) => {
    for (const side of resolveTargetSides(segment.target, ctx.ownerSide, ctx.params)) {
      bundle.presenceChanges.push({
        side,
        delta: segment.delta || 0,
        // Un guadagno o una perdita da effetto non sono una spesa: non alimentano
        // Manifestazione né Fervore.
        countsAsSpend: false,
        source: ctx.source,
      });
    }
  },

  [P.GRANT_TEMPORARY_FOCUS]: (bundle, segment, ctx) => {
    for (const side of resolveTargetSides(segment.target, ctx.ownerSide, ctx.params)) {
      bundle.temporaryFocus[side] += Math.max(0, segment.amount || 0);
    }
  },

  [P.IGNORE_FIELD]: (bundle, segment, ctx) => {
    for (const side of resolveTargetSides(segment.target, ctx.ownerSide, ctx.params)) {
      if (!bundle.ignoreFieldSides.includes(side)) bundle.ignoreFieldSides.push(side);
    }
  },

  [P.SET_ARMY_BONUS_STATE]: (bundle, segment, ctx) => {
    for (const side of resolveTargetSides(segment.target, ctx.ownerSide, ctx.params)) {
      bundle.armyBonusState[side] = {
        ...(bundle.armyBonusState[side] || {}),
        suppressed: segment.suppressed ?? bundle.armyBonusState[side]?.suppressed ?? false,
        forcedActive: segment.forcedActive ?? bundle.armyBonusState[side]?.forcedActive ?? false,
        unblockable: segment.unblockable ?? bundle.armyBonusState[side]?.unblockable ?? false,
      };
    }
  },

  [P.APPLY_TOXIN]: (bundle, segment, ctx) => {
    for (const side of resolveTargetSides(segment.target, ctx.ownerSide, ctx.params)) {
      bundle.toxinApplications.push({
        side,
        value: segment.value || 0,
        minHealth: segment.minHealth ?? 0,
        source: ctx.source,
      });
    }
  },

  [P.APPLY_SLOT_MODIFIER]: (bundle, segment, ctx) => {
    bundle.slotModifiers.push({
      slot: ctx.params?.slot ?? segment.slot ?? null,
      side: segment.side ?? ctx.ownerSide,
      deltas: { ...(segment.deltas || {}) },
      leagueScaled: Boolean(segment.leagueScaled),
      source: ctx.source,
    });
  },

  [P.REPLACE_FIELD]: (bundle, segment, ctx) => {
    // Due criteri alternativi: una carta precisa oppure un tema da cui pescare. Quale dei due
    // usare è una scelta di design e vive nel catalogo, non qui.
    bundle.fieldOperations.push({
      operation: 'REPLACE',
      fieldId: segment.fieldId ?? null,
      fieldArmy: segment.fieldArmy ?? null,
      source: ctx.source,
    });
  },

  [P.DESTROY_FIELD]: (bundle, segment, ctx) => {
    bundle.fieldOperations.push({ operation: 'DESTROY', source: ctx.source });
  },

  [P.MARK_CARD]: (bundle, segment, ctx) => {
    bundle.marks.push({
      mark: segment.mark,
      cardIds: [...(ctx.params?.cardIds || segment.cardIds || [])],
      persistent: Boolean(segment.persistent),
      source: ctx.source,
    });
  },

  [P.REGISTER_END_MATCH_DEBT]: (bundle, segment, ctx) => {
    bundle.endMatchDebts.push({
      side: ctx.params?.targetSide ?? ctx.ownerSide,
      basis: segment.basis ?? null,
      cardId: ctx.params?.cardId ?? null,
      source: ctx.source,
    });
  },

  [P.BLOCK_EMINENCE]: (bundle, segment, ctx) => {
    for (const side of resolveTargetSides(segment.target, ctx.ownerSide, ctx.params)) {
      bundle.blockedEminences.push({ side, scope: segment.duration ?? 'NEXT_ROUND', source: ctx.source });
    }
  },
};

/** Primitive che agiscono sull'overlay dei trigger e non sull'accumulatore. */
const TRIGGER_PRIMITIVES = new Set([
  P.FORCE_TRIGGER,
  P.FORBID_TRIGGER,
  P.SUPPRESS_CONQUEST,
  P.UNBLOCKABLE_POWER,
  P.REPLACE_TRIGGER,
  P.ALIAS_TRIGGER,
]);

/**
 * Applica una coda di segmenti già ordinata per iniziativa.
 *
 * Non filtra per checkpoint: il chiamante passa i soli segmenti del checkpoint corrente,
 * perché è lui a conoscere il punto della pipeline in cui si trova.
 *
 * @param {object[]} queue voci prodotte da `completeGate` o dai pendingEffects
 * @param {object} [bundle] accumulatore su cui comporre; ne viene creato uno se assente
 */
export function applyEminenceSegments(queue, bundle = null) {
  const target = bundle || createEffectBundle();

  for (const entry of queue || []) {
    const segment = entry.segment;
    if (!segment?.primitive) continue;

    const ctx = {
      ownerSide: entry.ownerSide,
      params: entry.params ?? null,
      source: entry.abilityId ?? entry.sourceEminenceId ?? null,
    };

    if (TRIGGER_PRIMITIVES.has(segment.primitive)) {
      target.triggerRules = applyPrimitiveToTriggerRules(target.triggerRules, segment, {
        ownerSide: ctx.ownerSide,
        source: ctx.source,
      });
      target.logs.push({ primitive: segment.primitive, source: ctx.source, ownerSide: ctx.ownerSide });
      continue;
    }

    const handler = handlers[segment.primitive];
    if (!handler) {
      // Fallire rumorosamente: una primitiva senza handler che non facesse nulla
      // produrrebbe un'Eminenza silenziosamente inerte.
      throw new Error(`Primitiva senza handler: ${segment.primitive}`);
    }

    handler(target, segment, ctx);
    target.logs.push({ primitive: segment.primitive, source: ctx.source, ownerSide: ctx.ownerSide });
  }

  return target;
}

/** Primitive attualmente eseguibili. Utile ai test di copertura del catalogo. */
export function getSupportedPrimitives() {
  return [...Object.keys(handlers), ...TRIGGER_PRIMITIVES].sort();
}

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
  TRIGGER_SCOPES,
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
    abilityOverlays: {},
    endMatchDebts: [],
    blockedEminences: [],
    toxinApplications: [],
    slotModifiers: [],
    anchoredThresholdChanges: [],
    statConverts: [],
    conquestOverrides: [],
    abilityCostChanges: [],
    leagueByCardId: {},
    leagueChanges: [],
    vaTieWinnerSides: [],
    grantedPowers: {},
    logs: [],
    poolFocus: { [SIDES.PLAYER]: 0, [SIDES.ENEMY]: 0 },
    immuneSides: [],
    toxinRemovals: [],
    abilityEscalations: [],
    markGains: [],
    deals: [],
  };
}

/**
 * Risolve il bersaglio di un segmento in una lista di lati.
 * `CHOSEN` legge il lato dai parametri scelti dal giocatore, non da una regola fissa.
 */
export function inferTargetSide(params, agentIdBySide = {}) {
  if (params?.targetSide) return params.targetSide;
  const cardId = params?.cardId;
  if (cardId == null || !agentIdBySide) return null;
  if (agentIdBySide[SIDES.PLAYER] === cardId) return SIDES.PLAYER;
  if (agentIdBySide[SIDES.ENEMY] === cardId) return SIDES.ENEMY;
  return null;
}

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
    case T.CHOSEN: {
      const side = inferTargetSide(params);
      return side ? [side] : [];
    }
    default:
      return [ownerSide];
  }
}

function resolveMarkCardIds(segment, ctx) {
  if (segment.target === T.OWN_AGENT) {
    const id = ctx.agentIdBySide?.[ctx.ownerSide];
    return id == null ? [] : [id];
  }
  if (segment.target === T.ENEMY_AGENT) {
    const id = ctx.agentIdBySide?.[OPPOSITE_SIDE[ctx.ownerSide]];
    return id == null ? [] : [id];
  }

  if (Array.isArray(ctx.params?.cardIds)) return [...ctx.params.cardIds];
  if (Array.isArray(ctx.params?.fragmentCardIds)) return [...ctx.params.fragmentCardIds];
  if (ctx.params?.fragmentCardId != null) return [ctx.params.fragmentCardId];
  if (ctx.params?.preyCardId != null) return [ctx.params.preyCardId];
  if (ctx.params?.cardId != null) return [ctx.params.cardId];
  const named = [ctx.params?.triggerFragmentId, ctx.params?.effectFragmentId].filter((id) => id != null);
  if (named.length) return [...new Set(named)];
  return [...(segment.cardIds || [])];
}

function overlayAbilityFields(ability) {
  if (!ability || typeof ability !== 'object') return {};
  const overlay = {};
  for (const key of ['effect', 'value', 'minPower', 'minDamage', 'minAssault', 'minHealth', 'stat']) {
    if (Object.prototype.hasOwnProperty.call(ability, key)) overlay[key] = ability[key];
  }
  return overlay;
}

const handlers = {
  [P.MODIFY_STAT]: (bundle, segment, ctx) => {
    for (const side of resolveTargetSides(segment.target, ctx.ownerSide, ctx.params)) {
      const stat = segment.stat;
      if (!(stat in bundle.statDeltas[side])) {
        throw new Error(`Statistica non gestita da MODIFY_STAT: ${stat}`);
      }
      bundle.statDeltas[side][stat] += segment.delta || 0;
      if (Number.isFinite(segment.minimum)) {
        bundle.statMinimums ||= {};
        bundle.statMinimums[side] ||= {};
        bundle.statMinimums[side][stat] = Math.max(bundle.statMinimums[side][stat] ?? -Infinity, segment.minimum);
      }
    }
  },

  [P.MODIFY_LEAGUE]: (bundle, segment, ctx) => {
    const cardId = ctx.params?.cardId;
    const persistOnCard = segment.persistOnCard || (segment.target === T.CHOSEN && cardId != null);
    if (persistOnCard && cardId != null) {
      const delta = Number(ctx.params?.leagueDelta ?? segment.delta ?? 0);
      if (!delta) return;
      bundle.leagueByCardId = { ...(bundle.leagueByCardId || {}) };
      bundle.leagueByCardId[cardId] = (bundle.leagueByCardId[cardId] || 0) + delta;
      bundle.leagueChanges = [...(bundle.leagueChanges || []), {
        cardId,
        delta,
        ownerSide: ctx.ownerSide,
        source: ctx.source,
      }];
      return;
    }
    const delta = Number(segment.delta ?? ctx.params?.leagueDelta ?? 0);
    for (const side of resolveTargetSides(segment.target, ctx.ownerSide, ctx.params)) {
      bundle.statDeltas[side].league += delta;
    }
  },

  [P.LOSE_HP]: (bundle, segment, ctx) => {
    for (const side of resolveTargetSides(segment.target, ctx.ownerSide, ctx.params)) {
      let amount = Math.abs(segment.amount || 0);
      if (segment.escalationKey) {
        const uses = Number(ctx.persistent?.abilityEscalation?.[segment.escalationKey] || 0);
        amount = Math.abs(segment.amountBase ?? segment.amount ?? 0)
          + uses * Math.abs(segment.amountPerUse ?? 1);
      }
      bundle.hpDeltas.push({
        side,
        amount: -amount,
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

  [P.MODIFY_ANCHORED_THRESHOLD]: (bundle, segment, ctx) => {
    for (const side of resolveTargetSides(segment.target, ctx.ownerSide, ctx.params)) {
      bundle.anchoredThresholdChanges.push({
        side,
        delta: segment.delta || 0,
        source: ctx.source,
      });
    }
  },

  [P.CHANGE_PRESENCE]: (bundle, segment, ctx) => {
    for (const side of resolveTargetSides(segment.target, ctx.ownerSide, ctx.params)) {
      let delta = segment.delta || 0;
      if (segment.escalationKey) {
        const uses = Number(ctx.persistent?.abilityEscalation?.[segment.escalationKey] || 0);
        delta = (segment.deltaBase ?? segment.delta ?? 0)
          + uses * (segment.deltaPerUse ?? 1);
      }
      bundle.presenceChanges.push({
        side,
        delta,
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
        override: segment.override ?? bundle.armyBonusState[side]?.override ?? null,
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
      deltas: { ...(segment.deltas || {}) },
      leagueScaled: Boolean(segment.leagueScaled),
      persistent: segment.persistent !== false,
      source: ctx.source,
      ownerSide: ctx.ownerSide,
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
    const cardIds = resolveMarkCardIds(segment, ctx);
    if (!cardIds.length) return;
    const markEntry = {
      mark: segment.mark,
      cardIds,
      persistent: Boolean(segment.persistent),
      consume: Boolean(segment.consume),
      side: ctx.ownerSide,
      source: ctx.source,
    };
    bundle.marks.push(markEntry);
    if (!segment.consume && segment.mark) {
      bundle.markGains.push({
        mark: segment.mark,
        cardIds: [...cardIds],
        side: ctx.ownerSide,
        source: ctx.source,
      });
    }
  },

  [P.REGISTER_END_MATCH_DEBT]: (bundle, segment, ctx) => {
    const side = inferTargetSide(ctx.params, ctx.agentIdBySide);
    if (!side) return;
    bundle.endMatchDebts.push({
      side,
      basis: segment.basis ?? 'FINAL_POWER',
      cardId: ctx.params?.cardId ?? null,
      amount: segment.amount ?? null,
      source: ctx.source,
      ownerSide: ctx.ownerSide,
    });
  },

  [P.BLOCK_EMINENCE]: (bundle, segment, ctx) => {
    for (const side of resolveTargetSides(segment.target, ctx.ownerSide, ctx.params)) {
      bundle.blockedEminences.push({ side, scope: segment.duration ?? 'NEXT_ROUND', source: ctx.source });
    }
  },

  [P.ADJUST_ABILITY_COST]: (bundle, segment, ctx) => {
    const abilityId = segment.abilityId || ctx.source;
    if (!abilityId) return;
    bundle.abilityCostChanges.push({
      side: ctx.ownerSide,
      abilityId,
      delta: segment.delta || 0,
      min: segment.min,
      source: ctx.source,
    });
  },

  [P.CONVERT_STAT]: (bundle, segment, ctx) => {
    for (const side of resolveTargetSides(segment.target, ctx.ownerSide, ctx.params)) {
      bundle.statConverts.push({
        side,
        stat: segment.stat || 'damage',
        factor: segment.factor ?? 0.5,
        round: segment.round || 'ceil',
        dest: segment.dest || 'DIRECT_DAMAGE',
        zeroStat: segment.zeroStat !== false,
        source: ctx.source,
      });
    }
  },

  [P.ARM_CONQUEST_OVERRIDE]: (bundle, segment, ctx) => {
    bundle.conquestOverrides.push({
      ownerSide: ctx.ownerSide,
      when: segment.when || 'LOSS',
      destroyField: Boolean(segment.destroyField),
      suppressConquest: Boolean(segment.suppressConquest),
      source: ctx.source,
    });
  },

  [P.ARM_VA_TIE_WIN]: (bundle, segment, ctx) => {
    bundle.vaTieWinnerSides = [...(bundle.vaTieWinnerSides || []), ctx.ownerSide];
  },

  [P.COMPOSE_ABILITY]: (bundle, segment, ctx) => {
    const cardIds = resolveMarkCardIds({ ...segment, target: segment.target || T.OWN_AGENT }, ctx);
    const cardId = cardIds[0];
    if (cardId == null) return;

    const overlay = { ...((bundle.abilityOverlays ||= {})[cardId] || {}) };
    const params = ctx.params || {};

    if (Object.prototype.hasOwnProperty.call(params, 'composedTrigger')) {
      overlay.trigger = params.composedTrigger;
      bundle.triggerRules = applyPrimitiveToTriggerRules(bundle.triggerRules, {
        primitive: P.REPLACE_TRIGGER,
        cardIds: [cardId],
        trigger: params.composedTrigger,
      }, { ownerSide: ctx.ownerSide, source: ctx.source, params });
    }

    if (params.composedAbility) {
      Object.assign(overlay, overlayAbilityFields(params.composedAbility));
    }

    if (Object.keys(overlay).length) {
      bundle.abilityOverlays[cardId] = overlay;
    }
  },

  [P.GRANT_POWER]: (bundle, segment, ctx) => {
    const effects = Array.isArray(segment.effects) && segment.effects.length
      ? segment.effects.map((entry) => ({ ...entry }))
      : (segment.effect ? [{ effect: segment.effect, value: segment.value }] : []);
    if (!effects.length) return;
    for (const side of resolveTargetSides(segment.target, ctx.ownerSide, ctx.params)) {
      bundle.grantedPowers[side] = {
        trigger: Object.prototype.hasOwnProperty.call(segment, 'trigger') ? segment.trigger : null,
        effects,
        source: ctx.source,
      };
    }
  },

  [P.GRANT_IMMUNE]: (bundle, segment, ctx) => {
    for (const side of resolveTargetSides(segment.target, ctx.ownerSide, ctx.params)) {
      if (!bundle.immuneSides.includes(side)) bundle.immuneSides.push(side);
    }
  },

  [P.GRANT_POOL_FOCUS]: (bundle, segment, ctx) => {
    for (const side of resolveTargetSides(segment.target, ctx.ownerSide, ctx.params)) {
      bundle.poolFocus[side] += Math.max(0, segment.amount || 0);
    }
  },

  [P.REMOVE_TOXIN]: (bundle, segment, ctx) => {
    for (const side of resolveTargetSides(segment.target, ctx.ownerSide, ctx.params)) {
      const removedValue = Number(
        ctx.params?.removedToxinValue
        ?? ctx.params?.toxinValueBySide?.[side]
        ?? segment.removedValue
        ?? 0,
      );
      bundle.toxinRemovals.push({
        side,
        removedValue: Math.max(0, removedValue),
        source: ctx.source,
      });
      if (segment.bonusOverrideFactor != null) {
        const value = Math.max(0, removedValue) * Number(segment.bonusOverrideFactor);
        bundle.armyBonusState[ctx.ownerSide] = {
          ...(bundle.armyBonusState[ctx.ownerSide] || {}),
          override: {
            effect: segment.bonusOverrideEffect || 'directDamage',
            value,
            trigger: null,
          },
          forcedActive: true,
        };
      }
    }
  },

  [P.ESCALATE_ABILITY]: (bundle, segment, ctx) => {
    const key = segment.escalationKey || ctx.source;
    if (!key) return;
    bundle.abilityEscalations.push({
      side: ctx.ownerSide,
      key,
      delta: segment.delta ?? 1,
      source: ctx.source,
    });
  },

  [P.PROPOSE_DEAL]: (bundle, segment, ctx) => {
    const mode = segment.mode || 'ACCEPT_OR_SELF';
    const params = ctx.params || {};

    const remapTarget = (target, subjectSide) => {
      const subjectIsOwner = subjectSide === ctx.ownerSide;
      if (subjectIsOwner) return target || T.SELF;
      // Subject is the opponent: SELF/OWN from the deal's POV → OPPONENT/ENEMY from owner POV.
      if (target === T.SELF || target === T.OWN_AGENT || target == null) {
        return target === T.OWN_AGENT ? T.ENEMY_AGENT : T.OPPONENT;
      }
      if (target === T.OPPONENT || target === T.ENEMY_AGENT) {
        return target === T.ENEMY_AGENT ? T.OWN_AGENT : T.SELF;
      }
      return target;
    };

    const applyDealEffects = (effects, subjectSide) => {
      for (const effect of effects || []) {
        const handler = handlers[effect.primitive];
        if (!handler) throw new Error(`PROPOSE_DEAL: primitiva sconosciuta ${effect.primitive}`);
        handler(bundle, {
          ...effect,
          target: remapTarget(effect.target, subjectSide),
        }, ctx);
      }
    };

    if (mode === 'CHOOSE_ONE') {
      const deals = segment.deals || [];
      let choice = params.dealChoice ?? params.dealId ?? null;
      if (choice == null) {
        const opponentPresence = params.opponentPresence
          ?? Infinity;
        const legal = deals.filter((deal) => {
          if (deal.minPresence != null) return opponentPresence >= Math.abs(deal.minPresence);
          return true;
        });
        choice = (legal[0] || deals[0])?.id ?? null;
      }
      const selected = deals.find((deal) => deal.id === choice) || deals[0];
      if (selected) applyDealEffects(selected.effects, OPPOSITE_SIDE[ctx.ownerSide]);
      bundle.deals.push({
        mode,
        choice,
        ownerSide: ctx.ownerSide,
        source: ctx.source,
      });
      return;
    }

    const accepted = params.dealAccepted !== false
      && params.dealResponse !== 'refuse'
      && params.dealResponse !== false;
    const subjectSide = accepted ? OPPOSITE_SIDE[ctx.ownerSide] : ctx.ownerSide;
    applyDealEffects(segment.deal?.effects || segment.effects || [], subjectSide);
    bundle.deals.push({
      mode,
      accepted,
      subjectSide,
      ownerSide: ctx.ownerSide,
      source: ctx.source,
    });
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
  P.SYNC_TRIGGERS_ON_XOR,
  P.SATISFY_TRIGGER_ON_EQUAL_LEAGUE,
  P.SWAP_POWER_BONUS_TRIGGERS,
  P.MIRROR_UNSATISFIED_POWER,
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
export function applyEminenceSegments(queue, bundle = null, applyContext = {}) {
  const target = bundle || createEffectBundle();

  for (const entry of queue || []) {
    const segment = entry.segment;
    if (!segment?.primitive) continue;

    const agentIdBySide = entry.agentIdBySide || applyContext.agentIdBySide || {};
    const params = { ...(entry.params || {}) };
    const inferredSide = inferTargetSide(params, agentIdBySide);
    if (inferredSide && !params.targetSide) params.targetSide = inferredSide;

    // REPLACE_TRIGGER GLOBAL: entrambi gli Agenti schierati, senza params.cardId.
    if (
      segment.primitive === P.REPLACE_TRIGGER
      && segment.scope === TRIGGER_SCOPES.GLOBAL
      && !params.cardId
      && !params.cardIds
      && !segment.cardIds?.length
    ) {
      params.cardIds = [agentIdBySide[SIDES.PLAYER], agentIdBySide[SIDES.ENEMY]].filter((id) => id != null);
    }

    const ownerPersistent = applyContext.persistentBySide?.[entry.ownerSide]
      || entry.persistent
      || null;

    const ctx = {
      ownerSide: entry.ownerSide,
      params,
      source: entry.abilityId ?? entry.sourceEminenceId ?? null,
      agentIdBySide,
      persistent: ownerPersistent,
      persistentBySide: applyContext.persistentBySide || null,
    };

    if (TRIGGER_PRIMITIVES.has(segment.primitive)) {
      target.triggerRules = applyPrimitiveToTriggerRules(target.triggerRules, segment, {
        ownerSide: ctx.ownerSide,
        source: ctx.source,
        params: ctx.params,
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

import { TRIGGER_NAMES } from '../../data/triggers.js';
import { countAttritionPriorCards } from './duelHelpers.js';
import {
  applyCopiedBonusEffectsIfReady,
  registerCopiedBonus,
} from './duelCopyBonus.js';
import { getEffectiveMinFloor } from '../battlefieldEffects.js';
import {
  BATTLE_STATS,
  emitBlock,
  emitCopy,
  emitFieldRule,
  emitInfo,
  emitResourceChange,
  emitStatChange,
  makeAgentTarget,
  makePlayerTarget,
  makeSource,
  toBattleSide,
} from './battleEventEmit.js';

function pushLog(log, message) {
  if (log && typeof log.push === 'function') log.push(message);
}

function hasEmitter(log) {
  return log && typeof log.emit === 'function';
}

function resolveOwnerSide(target, options) {
  if (options?.ownerSide) return options.ownerSide;
  return target;
}

function srcOf(source, target, options) {
  const kind =
    options?.sourceKind === 'bonus'
      ? 'bonus'
      : options?.sourceKind === 'field'
        ? 'field'
        : 'ability';
  const owner = toBattleSide(resolveOwnerSide(target, options));
  return makeSource({
    kind,
    id: options?.sourceId ?? (typeof source === 'string' ? source : source?.id ?? source),
    name: typeof source === 'string' ? source : source?.name ?? String(source),
    ownerSide: kind === 'field' ? null : owner,
  });
}

function agentTarget(engineSide, ctx) {
  const agent = engineSide === 'player' ? ctx?.pAgent : ctx?.eAgent;
  return makeAgentTarget(engineSide, agent);
}

function enemyEngineSide(target) {
  return target === 'player' ? 'enemy' : 'player';
}

function emitSelfStat(log, source, target, options, ctx, stat, before, after) {
  if (!hasEmitter(log) || before === after) return;
  emitStatChange(log, {
    source: srcOf(source, target, options),
    target: agentTarget(target, ctx),
    stat,
    before,
    after,
  });
}

function emitEnemyStat(log, source, target, options, ctx, stat, before, after) {
  if (!hasEmitter(log) || before === after) return;
  emitStatChange(log, {
    source: srcOf(source, target, options),
    target: agentTarget(enemyEngineSide(target), ctx),
    stat,
    before,
    after,
  });
}

function emitImmuneBlock(log, source, target, options, ctx, effectType) {
  if (!hasEmitter(log)) return;
  const enemy = enemyEngineSide(target);
  emitBlock(log, {
    source: makeSource({
      kind: 'ability',
      id: `${enemy}:immune`,
      name: agentTarget(enemy, ctx).name || 'Immune',
      ownerSide: toBattleSide(enemy),
    }),
    target: agentTarget(target, ctx),
    blockedEffect: {
      kind: 'ability',
      sourceId: options?.sourceId ?? source,
      effectType,
    },
    blockedBy: 'immune',
  });
}

export function applyDuelPowerEffect(effect, value, target, source, log, options = {}, state, ctx) {
  const {
    minDamage,
    minPower,
    minAssault,
    copyDisabled = false,
    modifiersDisabled: modDisabled = false,
    directDamageDisabled = false,
    directDamageBonus = 0,
    minFloorReduction = 0,
  } = options;

  const targetName = target === 'player' ? 'TU' : 'IA';
  const enemyName = target === 'player' ? 'IA' : 'TU';

  if (
    modDisabled &&
    [
      'power',
      'damage',
      'enemyPower',
      'enemyDamage',
      'enemyPowerAndDamage',
      'powerAndDamage',
      'imponiPower',
      'imponiDamage',
    ].includes(effect)
  ) {
    pushLog(log, `${source}: BLOCCATO da Radura dell'Anima`);
    if (hasEmitter(log)) {
      emitBlock(log, {
        source: makeSource({ kind: 'field', id: 'radura_anima', name: "Radura dell'Anima", ownerSide: null }),
        target: agentTarget(target, ctx),
        blockedEffect: { kind: 'ability', sourceId: source, effectType: effect },
        blockedBy: 'modifiersDisabled',
      });
    }
    return;
  }

  switch (effect) {
    case 'power': {
      if (target === 'player') {
        const before = state.pPower;
        state.pPower += value;
        pushLog(log, `${source}: ${targetName} +${value} POT → ${state.pPower}`);
        emitSelfStat(log, source, target, options, ctx, BATTLE_STATS.POT, before, state.pPower);
      } else {
        const before = state.ePower;
        state.ePower += value;
        pushLog(log, `${source}: ${targetName} +${value} POT → ${state.ePower}`);
        emitSelfStat(log, source, target, options, ctx, BATTLE_STATS.POT, before, state.ePower);
      }
      break;
    }
    case 'damage': {
      if (target === 'player') {
        const before = state.pDamage;
        state.pDamage += value;
        pushLog(log, `${source}: ${targetName} +${value} DAN → ${state.pDamage}`);
        emitSelfStat(log, source, target, options, ctx, BATTLE_STATS.DAN, before, state.pDamage);
      } else {
        const before = state.eDamage;
        state.eDamage += value;
        pushLog(log, `${source}: ${targetName} +${value} DAN → ${state.eDamage}`);
        emitSelfStat(log, source, target, options, ctx, BATTLE_STATS.DAN, before, state.eDamage);
      }
      break;
    }
    case 'assaultValue': {
      if (target === 'player') {
        const before = state.pAssaultMod;
        state.pAssaultMod += value;
        pushLog(log, `${source}: ${targetName} +${value} VA`);
        emitSelfStat(log, source, target, options, ctx, BATTLE_STATS.VA, before, state.pAssaultMod);
      } else {
        const before = state.eAssaultMod;
        state.eAssaultMod += value;
        pushLog(log, `${source}: ${targetName} +${value} VA`);
        emitSelfStat(log, source, target, options, ctx, BATTLE_STATS.VA, before, state.eAssaultMod);
      }
      break;
    }
    case 'enemyPower': {
      const minPow = getEffectiveMinFloor(minPower, minFloorReduction, 1);
      if (target === 'player') {
        if (!state.eImmune) {
          const powerReduction = Math.abs(value);
          const minPowerValue = minPow !== undefined ? minPow : 1;
          if (state.eModifierInversion && value < 0) {
            const before = state.ePower;
            state.ePower += powerReduction;
            pushLog(log, `${source}: Inversione — ${enemyName} +${powerReduction} POT → ${state.ePower}`);
            emitEnemyStat(log, source, target, options, ctx, BATTLE_STATS.POT, before, state.ePower);
          } else if (state.ePower <= minPowerValue) {
            pushLog(log, `${source}: ${value} POT nem. già al minimo ${minPowerValue} (nessun effetto)`);
          } else {
            const before = state.ePower;
            state.ePower = Math.max(minPowerValue, state.ePower - powerReduction);
            pushLog(log, `${source}: ${enemyName} ${value} POT → ${state.ePower}${state.ePower === minPowerValue ? ' (min)' : ''}`);
            emitEnemyStat(log, source, target, options, ctx, BATTLE_STATS.POT, before, state.ePower);
          }
        } else {
          pushLog(log, `${source}: ${value} POT nem. BLOCCATO (Immune)`);
          emitImmuneBlock(log, source, target, options, ctx, 'enemyPower');
        }
      } else if (!state.pImmune) {
        const powerReduction = Math.abs(value);
        const minPowerValue = minPow !== undefined ? minPow : 1;
        if (state.pModifierInversion && value < 0) {
          const before = state.pPower;
          state.pPower += powerReduction;
          pushLog(log, `${source}: Inversione — ${enemyName} +${powerReduction} POT → ${state.pPower}`);
          emitEnemyStat(log, source, target, options, ctx, BATTLE_STATS.POT, before, state.pPower);
        } else if (state.pPower <= minPowerValue) {
          pushLog(log, `${source}: ${value} POT nem. già al minimo ${minPowerValue} (nessun effetto)`);
        } else {
          const before = state.pPower;
          state.pPower = Math.max(minPowerValue, state.pPower - powerReduction);
          pushLog(log, `${source}: ${enemyName} ${value} POT → ${state.pPower}${state.pPower === minPowerValue ? ' (min)' : ''}`);
          emitEnemyStat(log, source, target, options, ctx, BATTLE_STATS.POT, before, state.pPower);
        }
      } else {
        pushLog(log, `${source}: ${value} POT nem. BLOCCATO (Immune)`);
        emitImmuneBlock(log, source, target, options, ctx, 'enemyPower');
      }
      break;
    }
    case 'enemyDamage': {
      const minDmg = minDamage != null ? getEffectiveMinFloor(minDamage, minFloorReduction, 0) : 0;
      if (target === 'player') {
        if (state.eImmune) {
          pushLog(log, `${source}: ${value} DAN nem. BLOCCATO (Immune)`);
          emitImmuneBlock(log, source, target, options, ctx, 'enemyDamage');
        } else if (state.eModifierInversion && value < 0) {
          const before = state.eDamage;
          state.eDamage = Math.max(minDmg, state.eDamage - value);
          pushLog(log, `${source}: Inversione — ${enemyName} DAN ${before} → ${state.eDamage}`);
          emitEnemyStat(log, source, target, options, ctx, BATTLE_STATS.DAN, before, state.eDamage);
        } else if (state.eDamage <= minDmg) {
          pushLog(log, `${source}: ${value} DAN nem. BLOCCATO (già al minimo ${minDmg})`);
        } else {
          const before = state.eDamage;
          state.eDamage = Math.max(minDmg, state.eDamage + value);
          pushLog(log, `${source}: ${enemyName} ${value} DAN → ${before} → ${state.eDamage}${minDmg > 0 ? ` (min ${minDmg})` : ''}`);
          emitEnemyStat(log, source, target, options, ctx, BATTLE_STATS.DAN, before, state.eDamage);
        }
      } else if (state.pImmune) {
        pushLog(log, `${source}: ${value} DAN nem. BLOCCATO (Immune)`);
        emitImmuneBlock(log, source, target, options, ctx, 'enemyDamage');
      } else if (state.pModifierInversion && value < 0) {
        const before = state.pDamage;
        state.pDamage = Math.max(minDmg, state.pDamage - value);
        pushLog(log, `${source}: Inversione — ${enemyName} DAN ${before} → ${state.pDamage}`);
        emitEnemyStat(log, source, target, options, ctx, BATTLE_STATS.DAN, before, state.pDamage);
      } else if (state.pDamage <= minDmg) {
        pushLog(log, `${source}: ${value} DAN nem. BLOCCATO (già al minimo ${minDmg})`);
      } else {
        const before = state.pDamage;
        state.pDamage = Math.max(minDmg, state.pDamage + value);
        pushLog(log, `${source}: ${enemyName} ${value} DAN → ${before} → ${state.pDamage}${minDmg > 0 ? ` (min ${minDmg})` : ''}`);
        emitEnemyStat(log, source, target, options, ctx, BATTLE_STATS.DAN, before, state.pDamage);
      }
      break;
    }
    case 'enemyPowerAndDamage':
      applyDuelPowerEffect('enemyPower', value, target, source, log, { ...options, minPower, minFloorReduction }, state, ctx);
      applyDuelPowerEffect('enemyDamage', value, target, source, log, { ...options, minDamage, minFloorReduction }, state, ctx);
      break;
    case 'imponiPower': {
      if (target === 'player') {
        if (state.eImmune) {
          pushLog(log, `${source}: Imponi POT BLOCCATO (Immune)`);
          emitImmuneBlock(log, source, target, options, ctx, 'imponiPower');
        } else {
          const before = state.ePower;
          state.ePower = state.pPower;
          pushLog(log, `${source}: Imponi POT nem. ${before} → ${state.ePower}`);
          emitEnemyStat(log, source, target, options, ctx, BATTLE_STATS.POT, before, state.ePower);
        }
      } else if (state.pImmune) {
        pushLog(log, `${source}: Imponi POT BLOCCATO (Immune)`);
        emitImmuneBlock(log, source, target, options, ctx, 'imponiPower');
      } else {
        const before = state.pPower;
        state.pPower = state.ePower;
        pushLog(log, `${source}: Imponi POT nem. ${before} → ${state.pPower}`);
        emitEnemyStat(log, source, target, options, ctx, BATTLE_STATS.POT, before, state.pPower);
      }
      break;
    }
    case 'imponiDamage': {
      if (target === 'player') {
        if (state.eImmune) {
          pushLog(log, `${source}: Imponi DAN BLOCCATO (Immune)`);
          emitImmuneBlock(log, source, target, options, ctx, 'imponiDamage');
        } else {
          const before = state.eDamage;
          state.eDamage = state.pDamage;
          pushLog(log, `${source}: Imponi DAN nem. ${before} → ${state.eDamage}`);
          emitEnemyStat(log, source, target, options, ctx, BATTLE_STATS.DAN, before, state.eDamage);
        }
      } else if (state.pImmune) {
        pushLog(log, `${source}: Imponi DAN BLOCCATO (Immune)`);
        emitImmuneBlock(log, source, target, options, ctx, 'imponiDamage');
      } else {
        const before = state.pDamage;
        state.pDamage = state.eDamage;
        pushLog(log, `${source}: Imponi DAN nem. ${before} → ${state.pDamage}`);
        emitEnemyStat(log, source, target, options, ctx, BATTLE_STATS.DAN, before, state.pDamage);
      }
      break;
    }
    case 'enemyAssault': {
      const minAssaultFloor = getEffectiveMinFloor(options.minAssault, minFloorReduction, undefined);
      const invertAssaultPlayer = target === 'player' && state.eModifierInversion && value < 0;
      const invertAssaultEnemy = target === 'enemy' && state.pModifierInversion && value < 0;
      if (minAssaultFloor !== undefined && !invertAssaultPlayer && !invertAssaultEnemy) {
        if (target === 'player') {
          const currentAssaultRaw = state.ePower * state.eFocusUsed + state.eAssaultMod;
          if (currentAssaultRaw < minAssaultFloor) {
            pushLog(log, `${source}: ${value} VA nem. BLOCCATO (VA già ${currentAssaultRaw} < minimo ${minAssaultFloor})`);
            break;
          }
          if (state.eMinAssault === null) state.eMinAssault = minAssaultFloor;
          else state.eMinAssault = Math.min(state.eMinAssault, minAssaultFloor);
        } else {
          const currentAssaultRaw = state.pPower * state.pFocusUsed + state.pAssaultMod;
          if (currentAssaultRaw < minAssaultFloor) {
            pushLog(log, `${source}: ${value} VA nem. BLOCCATO (VA già ${currentAssaultRaw} < minimo ${minAssaultFloor})`);
            break;
          }
          if (state.pMinAssault === null) state.pMinAssault = minAssaultFloor;
          else state.pMinAssault = Math.min(state.pMinAssault, minAssaultFloor);
        }
      }
      if (target === 'player') {
        if (!state.eImmune) {
          const before = state.eAssaultMod;
          const v = invertAssaultPlayer ? -value : value;
          state.eAssaultMod += v;
          pushLog(log, invertAssaultPlayer ? `${source}: Inversione — ${enemyName} +${-value} VA` : `${source}: ${enemyName} ${value} VA`);
          emitEnemyStat(log, source, target, options, ctx, BATTLE_STATS.VA, before, state.eAssaultMod);
        } else {
          pushLog(log, `${source}: ${value} VA nem. BLOCCATO (Immune)`);
          emitImmuneBlock(log, source, target, options, ctx, 'enemyAssault');
        }
      } else if (!state.pImmune) {
        const before = state.pAssaultMod;
        const v = invertAssaultEnemy ? -value : value;
        state.pAssaultMod += v;
        pushLog(log, invertAssaultEnemy ? `${source}: Inversione — ${enemyName} +${-value} VA` : `${source}: ${enemyName} ${value} VA`);
        emitEnemyStat(log, source, target, options, ctx, BATTLE_STATS.VA, before, state.pAssaultMod);
      } else {
        pushLog(log, `${source}: ${value} VA nem. BLOCCATO (Immune)`);
        emitImmuneBlock(log, source, target, options, ctx, 'enemyAssault');
      }
      break;
    }
    case 'copyPower': {
      if (copyDisabled) {
        pushLog(log, `Fossa dei Traditori: Copia POT BLOCCATA`);
        if (hasEmitter(log)) {
          emitBlock(log, {
            source: makeSource({ kind: 'field', id: 27, name: 'Fossa dei Traditori', ownerSide: null }),
            target: agentTarget(target, ctx),
            blockedEffect: { kind: 'ability', sourceId: source, effectType: 'copyPower' },
            blockedBy: 'copyDisabled',
          });
        }
        break;
      }
      if (target === 'player') {
        const before = state.pPower;
        const newVal = state.ePower;
        state.pPower = newVal;
        pushLog(log, `${source}: ${targetName} copia POT nem. → ${newVal}`);
        if (hasEmitter(log)) {
          emitCopy(log, {
            source: srcOf(source, target, options),
            target: agentTarget(target, ctx),
            copied: { kind: 'POT', value: newVal, fromId: ctx?.eAgent?.id ?? null },
          });
          emitSelfStat(log, source, target, options, ctx, BATTLE_STATS.POT, before, state.pPower);
        }
      } else {
        const before = state.ePower;
        const newVal = state.pPower;
        state.ePower = newVal;
        pushLog(log, `${source}: ${targetName} copia POT nem. → ${newVal}`);
        if (hasEmitter(log)) {
          emitCopy(log, {
            source: srcOf(source, target, options),
            target: agentTarget(target, ctx),
            copied: { kind: 'POT', value: newVal, fromId: ctx?.pAgent?.id ?? null },
          });
          emitSelfStat(log, source, target, options, ctx, BATTLE_STATS.POT, before, state.ePower);
        }
      }
      break;
    }
    case 'copyDamage': {
      if (copyDisabled) {
        pushLog(log, `Fossa dei Traditori: Copia DAN BLOCCATA`);
        if (hasEmitter(log)) {
          emitBlock(log, {
            source: makeSource({ kind: 'field', id: 27, name: 'Fossa dei Traditori', ownerSide: null }),
            target: agentTarget(target, ctx),
            blockedEffect: { kind: 'ability', sourceId: source, effectType: 'copyDamage' },
            blockedBy: 'copyDisabled',
          });
        }
        break;
      }
      if (target === 'player') {
        const before = state.pDamage;
        const newVal = state.eDamage;
        state.pDamage = newVal;
        pushLog(log, `${source}: ${targetName} copia DAN nem. → ${newVal}`);
        if (hasEmitter(log)) {
          emitCopy(log, {
            source: srcOf(source, target, options),
            target: agentTarget(target, ctx),
            copied: { kind: 'DAN', value: newVal, fromId: ctx?.eAgent?.id ?? null },
          });
          emitSelfStat(log, source, target, options, ctx, BATTLE_STATS.DAN, before, state.pDamage);
        }
      } else {
        const before = state.eDamage;
        const newVal = state.pDamage;
        state.eDamage = newVal;
        pushLog(log, `${source}: ${targetName} copia DAN nem. → ${newVal}`);
        if (hasEmitter(log)) {
          emitCopy(log, {
            source: srcOf(source, target, options),
            target: agentTarget(target, ctx),
            copied: { kind: 'DAN', value: newVal, fromId: ctx?.pAgent?.id ?? null },
          });
          emitSelfStat(log, source, target, options, ctx, BATTLE_STATS.DAN, before, state.eDamage);
        }
      }
      break;
    }
    case 'copyAbility': {
      if (copyDisabled) {
        pushLog(log, `Fossa dei Traditori: Copia Potere BLOCCATA`);
        if (hasEmitter(log)) {
          emitBlock(log, {
            source: makeSource({ kind: 'field', id: 27, name: 'Fossa dei Traditori', ownerSide: null }),
            target: agentTarget(target, ctx),
            blockedEffect: { kind: 'ability', sourceId: source, effectType: 'copyAbility' },
            blockedBy: 'copyDisabled',
          });
        }
        break;
      }
      const sourceAgent = target === 'player' ? ctx.eAgent : ctx.pAgent;
      if (sourceAgent?.ability?.effect) {
        const copiedAbilityTrigger = sourceAgent.ability.trigger;
        const copyContext = target === 'player' ? ctx.playerContext : ctx.enemyContext;
        const abilityTriggerSatisfied = copiedAbilityTrigger
          ? ctx.checkTrigger(copiedAbilityTrigger, copyContext)
          : true;

        pushLog(log, `${source}: ${targetName} copia Potere di ${sourceAgent.name}`);
        if (hasEmitter(log)) {
          emitCopy(log, {
            source: srcOf(source, target, options),
            target: agentTarget(target, ctx),
            copied: { kind: 'ability', value: sourceAgent.ability?.effect, fromId: sourceAgent.id },
          });
        }
        if (target === 'player') {
          state.pAbilityCopied = sourceAgent.ability;
          state.pCopiedAbilityNotTriggered = !abilityTriggerSatisfied;
        } else {
          state.eAbilityCopied = sourceAgent.ability;
          state.eCopiedAbilityNotTriggered = !abilityTriggerSatisfied;
        }

        if (abilityTriggerSatisfied) {
          if (sourceAgent.ability.effect !== 'copyAbility') {
            applyDuelPowerEffect(
              sourceAgent.ability.effect,
              sourceAgent.ability.value,
              target,
              `${source} (copiato)`,
              log,
              {
                ...options,
                minDamage: sourceAgent.ability.minDamage,
                minPower: sourceAgent.ability.minPower,
                minAssault: sourceAgent.ability.minAssault,
                minHealth: sourceAgent.ability.minHealth,
                stat: sourceAgent.ability.stat,
                minFloorReduction,
              },
              state,
              ctx
            );
          }
        } else {
          const triggerName = TRIGGER_NAMES[copiedAbilityTrigger] || copiedAbilityTrigger;
          pushLog(log, `${source}: Potere copiato (${triggerName} non attivo, effetto non applicato)`);
          if (hasEmitter(log)) {
            emitInfo(log, {
              infoCode: 'copiedTriggerInactive',
              source: srcOf(source, target, options),
              target: agentTarget(target, ctx),
              data: { trigger: copiedAbilityTrigger },
            });
          }
        }
      }
      break;
    }
    case 'copyBonus': {
      if (copyDisabled) {
        pushLog(log, `Fossa dei Traditori: Copia Bonus BLOCCATA`);
        if (hasEmitter(log)) {
          emitBlock(log, {
            source: makeSource({ kind: 'field', id: 27, name: 'Fossa dei Traditori', ownerSide: null }),
            target: agentTarget(target, ctx),
            blockedEffect: { kind: 'bonus', sourceId: source, effectType: 'copyBonus' },
            blockedBy: 'copyDisabled',
          });
        }
        break;
      }
      {
        const enemyBonusToCopy = target === 'player' ? ctx.eArmyBonus : ctx.pArmyBonus;
        const enemyHasBonusActive = target === 'player' ? ctx.eHasBonus : ctx.pHasBonus;
        const copyContext = target === 'player' ? ctx.playerContext : ctx.enemyContext;
        if (enemyHasBonusActive && enemyBonusToCopy?.effects) {
          pushLog(log, `${source}: ${targetName} copia Bonus nem. (${enemyBonusToCopy.description})`);
          if (hasEmitter(log)) {
            emitCopy(log, {
              source: srcOf(source, target, options),
              target: agentTarget(target, ctx),
              copied: { kind: 'bonus', value: enemyBonusToCopy.description, fromId: enemyBonusToCopy.id ?? null },
            });
          }
          registerCopiedBonus(state, target, enemyBonusToCopy, {
            context: copyContext,
            fieldOptions: {
              copyDisabled,
              modifiersDisabled: modDisabled,
              directDamageDisabled,
              directDamageBonus,
              minFloorReduction,
            },
            checkTriggerFn: ctx.checkTrigger,
          });
          applyCopiedBonusEffectsIfReady(
            enemyBonusToCopy,
            target,
            copyContext,
            source,
            log,
            (eff, val, tgt, src, lg, opt) =>
              applyDuelPowerEffect(eff, val, tgt, src, lg, opt, state, ctx),
            {
              copyDisabled,
              modifiersDisabled: modDisabled,
              directDamageDisabled,
              directDamageBonus,
              minFloorReduction,
            },
            ctx.checkTrigger
          );
        } else {
          pushLog(log, `${source}: Copia Bonus (nessun bonus attivo)`);
        }
      }
      break;
    }
    case 'blockAbility':
      if (target === 'player') state.eAbilityBlocked = true;
      else state.pAbilityBlocked = true;
      pushLog(log, `${source}: Blocca Potere nemico`);
      if (hasEmitter(log)) {
        emitBlock(log, {
          source: srcOf(source, target, options),
          target: agentTarget(enemyEngineSide(target), ctx),
          blockedEffect: { kind: 'ability', sourceId: null, effectType: null },
          blockedBy: 'blockAbility',
        });
      }
      break;
    case 'blockBonus':
      if (target === 'player') state.eBonusBlocked = true;
      else state.pBonusBlocked = true;
      pushLog(log, `${source}: Blocca Bonus nemico`);
      if (hasEmitter(log)) {
        emitBlock(log, {
          source: srcOf(source, target, options),
          target: agentTarget(enemyEngineSide(target), ctx),
          blockedEffect: { kind: 'bonus', sourceId: null, effectType: null },
          blockedBy: 'blockBonus',
        });
      }
      break;
    case 'immune':
      if (target === 'player') state.pImmune = true;
      else state.eImmune = true;
      // No preventive "Immune attivo" log/event.
      break;
    case 'focusCoin': {
      if (target === 'player') {
        const before = state.pFCCurrent;
        state.pFCCurrent += value;
        pushLog(log, `${source}: +${value} FC (${before} → ${state.pFCCurrent})`);
        if (hasEmitter(log)) {
          emitResourceChange(log, {
            source: srcOf(source, target, options),
            target: makePlayerTarget('player'),
            stat: BATTLE_STATS.FC,
            before,
            after: state.pFCCurrent,
          });
        }
      } else {
        const before = state.eFCCurrent;
        state.eFCCurrent += value;
        pushLog(log, `${source}: IA +${value} FC (${before} → ${state.eFCCurrent})`);
        if (hasEmitter(log)) {
          emitResourceChange(log, {
            source: srcOf(source, target, options),
            target: makePlayerTarget('enemy'),
            stat: BATTLE_STATS.FC,
            before,
            after: state.eFCCurrent,
          });
        }
      }
      break;
    }
    case 'heal': {
      if (target === 'player') {
        const before = state.pHPCurrent;
        state.pHPCurrent = Math.min(25, state.pHPCurrent + value);
        pushLog(log, `${source}: +${value} PV (${before} → ${state.pHPCurrent})`);
        if (hasEmitter(log)) {
          emitResourceChange(log, {
            source: srcOf(source, target, options),
            target: makePlayerTarget('player'),
            stat: BATTLE_STATS.PV,
            before,
            after: state.pHPCurrent,
          });
        }
      } else {
        const before = state.eHPCurrent;
        state.eHPCurrent = Math.min(25, state.eHPCurrent + value);
        pushLog(log, `${source}: IA +${value} PV (${before} → ${state.eHPCurrent})`);
        if (hasEmitter(log)) {
          emitResourceChange(log, {
            source: srcOf(source, target, options),
            target: makePlayerTarget('enemy'),
            stat: BATTLE_STATS.PV,
            before,
            after: state.eHPCurrent,
          });
        }
      }
      break;
    }
    case 'directDamage': {
      if (directDamageDisabled) {
        pushLog(log, `Firewall Centrale: Danni dir. annullato`);
        if (hasEmitter(log)) {
          emitBlock(log, {
            source: makeSource({ kind: 'field', id: 43, name: 'Firewall Centrale', ownerSide: null }),
            target: agentTarget(target, ctx),
            blockedEffect: { kind: 'ability', sourceId: source, effectType: 'directDamage' },
            blockedBy: 'directDamageDisabled',
          });
        }
        break;
      }
      const ddValue = value + directDamageBonus;
      if (directDamageBonus > 0) {
        pushLog(log, `Nido della Regina: Danni dir. +${directDamageBonus}`);
        if (hasEmitter(log)) {
          emitFieldRule(log, {
            source: makeSource({ kind: 'field', id: 'nido_regina', name: 'Nido della Regina', ownerSide: null }),
            ruleCode: 'directDamageBonus',
            params: { bonus: directDamageBonus },
          });
        }
      }
      if (target === 'player') {
        const before = state.eHPCurrent;
        state.eHPCurrent = Math.max(0, state.eHPCurrent - ddValue);
        pushLog(log, `${source}: ${ddValue} Danni dir. all'IA (${before} → ${state.eHPCurrent} PV)`);
        if (hasEmitter(log)) {
          emitResourceChange(log, {
            source: srcOf(source, target, options),
            target: makePlayerTarget('enemy'),
            stat: BATTLE_STATS.PV,
            before,
            after: state.eHPCurrent,
          });
        }
      } else {
        const before = state.pHPCurrent;
        state.pHPCurrent = Math.max(0, state.pHPCurrent - ddValue);
        pushLog(log, `${source}: ${ddValue} Danni dir. a TE (${before} → ${state.pHPCurrent} PV)`);
        if (hasEmitter(log)) {
          emitResourceChange(log, {
            source: srcOf(source, target, options),
            target: makePlayerTarget('player'),
            stat: BATTLE_STATS.PV,
            before,
            after: state.pHPCurrent,
          });
        }
      }
      break;
    }
    case 'selfDamage': {
      if (target === 'player') {
        const before = state.pHPCurrent;
        state.pHPCurrent = Math.max(0, state.pHPCurrent - value);
        pushLog(log, `${source}: -${value} PV a TE (${before} → ${state.pHPCurrent} PV)`);
        if (hasEmitter(log)) {
          emitResourceChange(log, {
            source: srcOf(source, target, options),
            target: makePlayerTarget('player'),
            stat: BATTLE_STATS.PV,
            before,
            after: state.pHPCurrent,
          });
        }
      } else {
        const before = state.eHPCurrent;
        state.eHPCurrent = Math.max(0, state.eHPCurrent - value);
        pushLog(log, `${source}: -${value} PV all'IA (${before} → ${state.eHPCurrent} PV)`);
        if (hasEmitter(log)) {
          emitResourceChange(log, {
            source: srcOf(source, target, options),
            target: makePlayerTarget('enemy'),
            stat: BATTLE_STATS.PV,
            before,
            after: state.eHPCurrent,
          });
        }
      }
      break;
    }
    case 'powerAndDamage': {
      if (target === 'player') {
        const beforeP = state.pPower;
        const beforeD = state.pDamage;
        state.pPower += value;
        state.pDamage += value;
        pushLog(log, `${source}: TU +${value} POT → ${state.pPower}, +${value} DAN → ${state.pDamage}`);
        emitSelfStat(log, source, target, options, ctx, BATTLE_STATS.POT, beforeP, state.pPower);
        emitSelfStat(log, source, target, options, ctx, BATTLE_STATS.DAN, beforeD, state.pDamage);
      } else {
        const beforeP = state.ePower;
        const beforeD = state.eDamage;
        state.ePower += value;
        state.eDamage += value;
        pushLog(log, `${source}: IA +${value} POT → ${state.ePower}, +${value} DAN → ${state.eDamage}`);
        emitSelfStat(log, source, target, options, ctx, BATTLE_STATS.POT, beforeP, state.ePower);
        emitSelfStat(log, source, target, options, ctx, BATTLE_STATS.DAN, beforeD, state.eDamage);
      }
      break;
    }
    case 'attrition': {
      const attritionStat = options.stat || 'power';
      const usedCards = target === 'player' ? (ctx.playerUsedCards || []) : (ctx.enemyUsedCards || []);
      const currentAgentId = target === 'player' ? ctx.pAgent?.id : ctx.eAgent?.id;
      const attritionCards = countAttritionPriorCards(usedCards, currentAgentId);
      const attritionBonus = value * attritionCards;
      if (attritionBonus > 0) {
        if (attritionStat === 'power') {
          applyDuelPowerEffect('power', attritionBonus, target, source, log, options, state, ctx);
        } else if (attritionStat === 'powerAndDamage') {
          applyDuelPowerEffect('powerAndDamage', attritionBonus, target, source, log, options, state, ctx);
        } else if (attritionStat === 'directDamage') {
          applyDuelPowerEffect('directDamage', attritionBonus, target, source, log, options, state, ctx);
        } else {
          applyDuelPowerEffect('damage', attritionBonus, target, source, log, options, state, ctx);
        }
      }
      break;
    }
    case 'escalation': {
      const escalationStat = options.stat || 'power';
      const escalationFields = target === 'player' ? ctx.playerFieldsConquered : ctx.enemyFieldsConquered;
      const escalationBonus = value * escalationFields;
      if (escalationBonus > 0) {
        if (escalationStat === 'power') {
          applyDuelPowerEffect('power', escalationBonus, target, source, log, options, state, ctx);
        } else if (escalationStat === 'powerAndDamage') {
          applyDuelPowerEffect('powerAndDamage', escalationBonus, target, source, log, options, state, ctx);
        } else if (escalationStat === 'assaultValue') {
          applyDuelPowerEffect('assaultValue', escalationBonus, target, source, log, options, state, ctx);
        } else {
          applyDuelPowerEffect('damage', escalationBonus, target, source, log, options, state, ctx);
        }
      }
      break;
    }
    case 'toxin': {
      const minHealthToxin = options?.minHealth || 1;
      if (target === 'player') {
        if (!ctx.enemyToxin) {
          state.enemyToxinActivated = { value, minHealth: minHealthToxin, source };
          pushLog(log, `${source}: Tossina ${value} attiva sull'IA (min ${minHealthToxin} PV)`);
        } else {
          state.enemyToxinActivated = {
            value: ctx.enemyToxin.value + 1,
            minHealth: Math.min(ctx.enemyToxin.minHealth, minHealthToxin),
            source,
          };
          pushLog(log, `${source}: Tossina stacka! Ora ${state.enemyToxinActivated.value} (min ${state.enemyToxinActivated.minHealth} PV)`);
        }
        if (hasEmitter(log)) {
          emitInfo(log, {
            infoCode: 'toxinApplied',
            source: srcOf(source, target, options),
            target: makePlayerTarget('enemy'),
            data: { value: state.enemyToxinActivated.value, minHealth: state.enemyToxinActivated.minHealth },
          });
        }
      } else if (!ctx.playerToxin) {
        state.playerToxinActivated = { value, minHealth: minHealthToxin, source };
        pushLog(log, `${source}: Tossina ${value} attiva su TE (min ${minHealthToxin} PV)`);
        if (hasEmitter(log)) {
          emitInfo(log, {
            infoCode: 'toxinApplied',
            source: srcOf(source, target, options),
            target: makePlayerTarget('player'),
            data: { value, minHealth: minHealthToxin },
          });
        }
      } else {
        state.playerToxinActivated = {
          value: ctx.playerToxin.value + 1,
          minHealth: Math.min(ctx.playerToxin.minHealth, minHealthToxin),
          source,
        };
        pushLog(log, `${source}: Tossina stacka! Ora ${state.playerToxinActivated.value} (min ${state.playerToxinActivated.minHealth} PV)`);
        if (hasEmitter(log)) {
          emitInfo(log, {
            infoCode: 'toxinApplied',
            source: srcOf(source, target, options),
            target: makePlayerTarget('player'),
            data: {
              value: state.playerToxinActivated.value,
              minHealth: state.playerToxinActivated.minHealth,
            },
          });
        }
      }
      break;
    }
    default:
      break;
  }
}

// ============================================
// Risoluzione duello (logica pura, nessun React)
// Fonte di verità per VA, poteri, bonus e esito scontro (locale e UI).
// ============================================

import { checkTrigger as baseCheckTrigger } from './triggerLogic.js';
import {
  bindCheckTriggerToOverlay,
  readTemporaryFocus,
} from './eminence/eminenceDuelBinding.js';
import { countConqueredFields, checkImmunity, countInitialLeagueCards } from './duel/duelHelpers.js';
import {
  createDuelCanTriggerAbility,
  resolveFieldArmyBonuses,
  applyFieldOverdriveBonuses,
  applyDuelFieldLateEffects,
} from './battlefieldDeepEffects.js';
import { applyDuelFieldSetup } from './duel/duelFieldSetup.js';
import { applyDuelPowerEffect } from './duel/duelApplyEffect.js';
import { createApplyBonusEffects } from './duel/duelBonusEffects.js';
import { createDuelCombatState, pickPostBattleFields } from './duel/duelCombatState.js';
import { createDuelEffectContext } from './duel/duelEffectContext.js';
import { applyDuelBlockPrescan } from './duel/duelBlockPrescan.js';
import { applyDuelMainAbilities } from './duel/duelMainAbilities.js';
import { applyDuelArmyBonusPhases } from './duel/duelArmyBonusPhases.js';
import { runDuelAssaultCalculation } from './duel/duelAssaultPhase.js';
import { resolveDuelWinnerByAssault } from './duel/duelWinnerResolve.js';
import { computeDuelTriggerUiFlags } from './duel/duelTriggerUiFlags.js';
import { applyDuelPostBattleEffects } from './duel/duelPostBattle.js';
import { runDuelDamageAftermathAndFcAdjust, buildDuelBattleResult } from './duel/duelResolutionFinish.js';
import { countAgentsRemainingAfterPlay } from './legalFocusSpend.js';
import { ARMY_BONUSES } from '../data/index.js';
import { attachFieldModifiersToContexts } from './battlefieldEffects.js';
import { buildDuelTurnContexts } from './duel/duelTurnContexts.js';
import { createDuelVisualRecorder } from './duel/duelVisualSteps.js';
import { createBattleEventEmitter } from './duel/battleEventTypes.js';
import {
  createBattleLogChannel,
  emitOutcome,
  emitPerfectFocus,
  emitRoundHeader,
  toBattleSide,
} from './duel/battleEventEmit.js';
import {
  emitAftermathResourceEvents,
  emitDuelFieldSetupEvents,
  snapshotDuelFieldStats,
} from './duel/battleFieldEventDiff.js';

function combatStartDiffersFromDeploy(pAgent, eAgent, state) {
  return (
    state.pPower !== pAgent.power ||
    state.ePower !== eAgent.power ||
    state.pDamage !== pAgent.damage ||
    state.eDamage !== eAgent.damage ||
    (state.pAssaultMod ?? 0) !== 0 ||
    (state.eAssaultMod ?? 0) !== 0
  );
}

/**
 * Calcola l'esito completo di un duello (stesso comportamento dell'ex useBattle inline).
 */
export function computeDuelResolution({
  field,
  selectedAgent: pAgent,
  enemyAgent: eAgent,
  selectedFocus,
  enemySelectedFocus,
  playerHP,
  enemyHP,
  playerFocus,
  enemyFocus,
  playerUsedCards,
  enemyUsedCards,
  isPlayerFirst,
  lastWinner,
  playerArmyBonuses,
  enemyArmyBonuses,
  playerToxin,
  enemyToxin,
  roundNumber,
  conqueredFields,
  playerHand,
  enemyHand,
  currentFieldIndex,

  // Eminenze. Assenti nei chiamanti che non attivano il sottosistema: senza di essi la
  // risoluzione percorre esattamente il codice di prima.
  eminenceBundle = null,
  presenceSnapshot = null,
  playerHasEminence = false,
  enemyHasEminence = false,
}) {
    // L'overlay entra qui una volta sola: tutti i sotto-moduli ricevono `checkTrigger` per
    // iniezione e continuano a ignorare l'esistenza delle Eminenze.
    const checkTrigger = bindCheckTriggerToOverlay(eminenceBundle?.triggerRules, baseCheckTrigger);

    const playerInitialLeagueCount = countInitialLeagueCards(playerUsedCards, playerHand, pAgent);
    const enemyInitialLeagueCount = countInitialLeagueCards(enemyUsedCards, enemyHand, eAgent);

    const { playerFieldsConquered, enemyFieldsConquered } = countConqueredFields(
      conqueredFields,
      playerHand,
      enemyHand
    );

    const { playerContext, enemyContext } = buildDuelTurnContexts({
      isPlayerFirst,
      lastWinner,
      selectedFocus,
      enemySelectedFocus,
      playerUsedCards,
      enemyUsedCards,
      playerHP,
      enemyHP,
      pAgent,
      eAgent,
      playerFieldsConquered,
      enemyFieldsConquered,
      roundNumber,
      playerInitialLeagueCount,
      enemyInitialLeagueCount,
      playerTemporaryFocus: readTemporaryFocus(eminenceBundle, 'player'),
      enemyTemporaryFocus: readTemporaryFocus(eminenceBundle, 'enemy'),
      presenceSnapshot,
      playerHasEminence,
      enemyHasEminence,
    });

    attachFieldModifiersToContexts(field, playerContext, enemyContext);

    const pHasBonusRaw = playerArmyBonuses[pAgent.army] || false;
    const eHasBonusRaw = enemyArmyBonuses[eAgent.army] || false;
    const pArmyBonusRaw = ARMY_BONUSES[pAgent.army];
    const eArmyBonusRaw = ARMY_BONUSES[eAgent.army];
    const resolvedBonuses = resolveFieldArmyBonuses(
      field,
      pHasBonusRaw,
      eHasBonusRaw,
      pArmyBonusRaw,
      eArmyBonusRaw
    );
    const pHasBonus = resolvedBonuses.pHasBonus;
    const eHasBonus = resolvedBonuses.eHasBonus;
    const pArmyBonus = resolvedBonuses.pArmyBonus;
    const eArmyBonus = resolvedBonuses.eArmyBonus;

    const duelCanTriggerAbility = createDuelCanTriggerAbility(checkTrigger, field);

    const duel = {
      pPower: pAgent.power,
      ePower: eAgent.power,
      pDamage: pAgent.damage,
      eDamage: eAgent.damage,
      pFocusUsed: selectedFocus,
      eFocusUsed: enemySelectedFocus,
      pAssaultMod: 0,
      eAssaultMod: 0,
      pHPCurrent: playerHP,
      eHPCurrent: enemyHP,
      pFCCurrent: playerFocus,
      eFCCurrent: enemyFocus,
      pAbilityBlocked: false,
      eAbilityBlocked: false,
      pBonusBlocked: false,
      eBonusBlocked: false,
      pImmune: false,
      eImmune: false,
    };
    duel.pImmune = checkImmunity(pAgent, pHasBonus, pArmyBonus, playerContext);
    duel.eImmune = checkImmunity(eAgent, eHasBonus, eArmyBonus, enemyContext);

    const eventEmitter = createBattleEventEmitter(roundNumber);
    const battleLog = createBattleLogChannel(eventEmitter, { dualStrings: false });
    battleLog.setContext('effects', 'abilityFx');

    emitRoundHeader(battleLog, {
      field: { id: field.id, name: field.name },
      localAgent: { id: pAgent.id, name: pAgent.name },
      opponentAgent: { id: eAgent.id, name: eAgent.name },
      initiativeSide: toBattleSide(isPlayerFirst ? 'player' : 'enemy'),
    });
    battleLog.push(`Campo: ${field.name}`);
    battleLog.push(`Tu: ${pAgent.name} (${duel.pPower}P, ${duel.pDamage}D) + ${duel.pFocusUsed} FC`);
    battleLog.push(`IA: ${eAgent.name} (${duel.ePower}P, ${duel.eDamage}D) + ${duel.eFocusUsed} FC`);
    // Immune preventivo: non emesso (block solo al blocco reale).

    const fieldStatsBefore = snapshotDuelFieldStats(duel);
        const fieldFlags = applyDuelFieldSetup(duel, field, battleLog, pAgent, eAgent, playerContext, enemyContext);
    const {
      blockDisabled,
      copyDisabled,
      directDamageDisabled,
      modifiersDisabled,
      maxDamage,
      maxFC,
      directDamageBonus,
      overdriveThreshold,
      triggersIgnored,
      minFloorReduction,
    } = fieldFlags;
    emitDuelFieldSetupEvents(
      battleLog,
      field,
      pAgent,
      eAgent,
      fieldStatsBefore,
      snapshotDuelFieldStats(duel),
      fieldFlags
    );

    const state = createDuelCombatState(duel);
    const visualRecorder = createDuelVisualRecorder(pAgent, eAgent);
    visualRecorder.syncDeployAssaultMods(state);
    if (combatStartDiffersFromDeploy(pAgent, eAgent, state)) {
      visualRecorder.pushFieldSetup(state);
    }

    const ctx = createDuelEffectContext({
      checkTrigger,
      playerContext,
      enemyContext,
      pAgent,
      eAgent,
      pArmyBonus,
      eArmyBonus,
      pHasBonus,
      eHasBonus,
      playerToxin,
      enemyToxin,
      playerUsedCards,
      enemyUsedCards,
      playerFieldsConquered,
      enemyFieldsConquered,
    });

    const applyEffect = (effect, value, target, source, log, options = {}) =>
      applyDuelPowerEffect(effect, value, target, source, log, options, state, ctx);

    const fieldOptions = {
      copyDisabled,
      modifiersDisabled,
      positivePowerModifiersDisabled: fieldFlags.positivePowerModifiersDisabled === true,
      positiveDamageModifiersDisabled: fieldFlags.positiveDamageModifiersDisabled === true,
      toxinDisabled: fieldFlags.toxinDisabled === true,
      swapCopyImponi: fieldFlags.swapCopyImponi === true,
      directDamageDisabled,
      directDamageBonus,
      minFloorReduction: minFloorReduction || 0,
      conquestDouble: fieldFlags.conquestDouble === true,
      lastWishDouble: fieldFlags.lastWishDouble === true,
      conquestDisabled: fieldFlags.conquestDisabled === true,
      triggersIgnored: triggersIgnored === true,
    };

    const applyBonusEffects = createApplyBonusEffects({
      applyEffect,
      fieldOptions,
      checkTrigger,
      copyDisabled,
      state,
      pArmyBonus,
      eArmyBonus,
      pHasBonus,
      eHasBonus,
      visualRecorder,
    });

    applyDuelBlockPrescan({
      blockDisabled,
      fieldName: field.name,
      pAgent,
      eAgent,
      state,
      battleLog,
      playerContext,
      enemyContext,
      triggersIgnored,
      duelCanTriggerAbility,
      isPlayerFirst,
      visualRecorder,
    });

    applyDuelMainAbilities({
      state,
      pAgent,
      eAgent,
      applyEffect,
      battleLog,
      playerContext,
      enemyContext,
      triggersIgnored,
      duelCanTriggerAbility,
      fieldOptions,
      isPlayerFirst,
      visualRecorder,
    });

    const {
      pBonusTriggerSatisfied,
      eBonusTriggerSatisfied,
      pAbilityTriggerSatisfied,
      eAbilityTriggerSatisfied,
      pAbilityNotTriggered,
      eAbilityNotTriggered,
      pBonusNotTriggered,
      eBonusNotTriggered,
    } = computeDuelTriggerUiFlags({
      state,
      pAgent,
      eAgent,
      pHasBonus,
      eHasBonus,
      pArmyBonus,
      eArmyBonus,
      playerContext,
      enemyContext,
      triggersIgnored,
      duelCanTriggerAbility,
      checkTrigger,
    });

    applyDuelArmyBonusPhases({
      state,
      pHasBonus,
      eHasBonus,
      pArmyBonus,
      eArmyBonus,
      pAgent,
      eAgent,
      playerContext,
      enemyContext,
      battleLog,
      applyBonusEffects,
      checkTrigger,
      triggersIgnored,
      isPlayerFirst,
      visualRecorder,
    });

    let pPower = state.pPower;
    let ePower = state.ePower;
    let pDamage = state.pDamage;
    let eDamage = state.eDamage;
    let pFocusUsed = state.pFocusUsed;
    let eFocusUsed = state.eFocusUsed;
    let pAssaultMod = state.pAssaultMod;
    let eAssaultMod = state.eAssaultMod;
    let pHPCurrent = state.pHPCurrent;
    let eHPCurrent = state.eHPCurrent;
    let pFCCurrent = state.pFCCurrent;
    let eFCCurrent = state.eFCCurrent;
    let pAbilityBlocked = state.pAbilityBlocked;
    let eAbilityBlocked = state.eAbilityBlocked;
    let pBonusBlocked = state.pBonusBlocked;
    let eBonusBlocked = state.eBonusBlocked;
    let pImmune = state.pImmune;
    let eImmune = state.eImmune;
    let pMinAssault = state.pMinAssault;
    let eMinAssault = state.eMinAssault;
    let pAbilityCopied = state.pAbilityCopied;
    let eAbilityCopied = state.eAbilityCopied;
    let pCopiedAbilityNotTriggered = state.pCopiedAbilityNotTriggered;
    let eCopiedAbilityNotTriggered = state.eCopiedAbilityNotTriggered;
    let pBonusCopied = state.pBonusCopied;
    let eBonusCopied = state.eBonusCopied;
    let pCopiedBonusNotTriggered = state.pCopiedBonusNotTriggered;
    let eCopiedBonusNotTriggered = state.eCopiedBonusNotTriggered;
    let playerToxinActivated = state.playerToxinActivated;
    let enemyToxinActivated = state.enemyToxinActivated;

    const statsBeforeField = visualRecorder.readStats(state);
    const overdriveBefore = snapshotDuelFieldStats(state);
    applyFieldOverdriveBonuses(field, state, overdriveThreshold, battleLog);
    applyDuelFieldLateEffects(field, state, pAgent, eAgent, battleLog);
    emitDuelFieldSetupEvents(
      battleLog,
      field,
      pAgent,
      eAgent,
      overdriveBefore,
      snapshotDuelFieldStats(state),
      {}
    );
    const statsAfterField = visualRecorder.readStats(state);
    if (
      statsBeforeField.playerPower !== statsAfterField.playerPower ||
      statsBeforeField.enemyPower !== statsAfterField.enemyPower ||
      statsBeforeField.playerDamage !== statsAfterField.playerDamage ||
      statsBeforeField.enemyDamage !== statsAfterField.enemyDamage
    ) {
      visualRecorder.pushField(state);
    }
    visualRecorder.pushPreVa(state);
    pPower = state.pPower;
    ePower = state.ePower;
    pDamage = state.pDamage;
    eDamage = state.eDamage;
    pAssaultMod = state.pAssaultMod;
    eAssaultMod = state.eAssaultMod;

    const focusForVa = (fc) => {
      let n = fieldFlags.focusHalvedInVa ? Math.ceil(fc / 2) : fc;
      if (fieldFlags.maxFocusCountedInVa != null) n = Math.min(n, fieldFlags.maxFocusCountedInVa);
      return n;
    };
    const assault = runDuelAssaultCalculation(battleLog, {
      pAgent,
      eAgent,
      pPower,
      ePower,
      pFocusUsed: focusForVa(pFocusUsed),
      eFocusUsed: focusForVa(eFocusUsed),
      pAssaultMod,
      eAssaultMod,
      pMinAssault,
      eMinAssault,
    });
    const {
      pAssault,
      eAssault,
      pAssaultBase,
      eAssaultBase,
      pPowerAfterEffects,
      ePowerAfterEffects,
      pAssaultAfterFocus,
      eAssaultAfterFocus,
    } = assault;

    let winner;
    if (fieldFlags.winnerByFocusNotVa) {
      if (pFocusUsed > eFocusUsed) {
        battleLog.push(`${field.name}: più FC investiti → Vittoria Tu`);
        winner = 'player';
        emitOutcome(battleLog, {
          winnerSide: 'local',
          localVA: pAssault,
          opponentVA: eAssault,
          tieBreakCode: 'focusInvested',
          tieBreakData: { localFocus: pFocusUsed, opponentFocus: eFocusUsed },
        });
      } else if (eFocusUsed > pFocusUsed) {
        battleLog.push(`${field.name}: più FC investiti → Vittoria IA`);
        winner = 'enemy';
        emitOutcome(battleLog, {
          winnerSide: 'opponent',
          localVA: pAssault,
          opponentVA: eAssault,
          tieBreakCode: 'focusInvested',
          tieBreakData: { localFocus: pFocusUsed, opponentFocus: eFocusUsed },
        });
      } else {
        winner = resolveDuelWinnerByAssault({
          pAssault,
          eAssault,
          pAgent,
          eAgent,
          pPower,
          ePower,
          isPlayerFirst,
          battleLog,
        });
      }
    } else if (fieldFlags.winnerByFinalPowerThenVa) {
      if (pPower > ePower) {
        battleLog.push(`${field.name}: POT finale più alta → Vittoria Tu`);
        winner = 'player';
        emitOutcome(battleLog, {
          winnerSide: 'local',
          localVA: pAssault,
          opponentVA: eAssault,
          tieBreakCode: 'finalPower',
          tieBreakData: { localPower: pPower, opponentPower: ePower },
        });
      } else if (ePower > pPower) {
        battleLog.push(`${field.name}: POT finale più alta → Vittoria IA`);
        winner = 'enemy';
        emitOutcome(battleLog, {
          winnerSide: 'opponent',
          localVA: pAssault,
          opponentVA: eAssault,
          tieBreakCode: 'finalPower',
          tieBreakData: { localPower: pPower, opponentPower: ePower },
        });
      } else if (pAssault > eAssault) {
        battleLog.push(`${field.name}: parità POT · VA più alto → Vittoria Tu`);
        winner = 'player';
        emitOutcome(battleLog, {
          winnerSide: 'local',
          localVA: pAssault,
          opponentVA: eAssault,
          tieBreakCode: 'vaAfterPowerTie',
          tieBreakData: null,
        });
      } else if (eAssault > pAssault) {
        battleLog.push(`${field.name}: parità POT · VA più alto → Vittoria IA`);
        winner = 'enemy';
        emitOutcome(battleLog, {
          winnerSide: 'opponent',
          localVA: pAssault,
          opponentVA: eAssault,
          tieBreakCode: 'vaAfterPowerTie',
          tieBreakData: null,
        });
      } else {
        winner = resolveDuelWinnerByAssault({
          pAssault,
          eAssault,
          pAgent,
          eAgent,
          pPower,
          ePower,
          isPlayerFirst,
          battleLog,
        });
      }
    } else if (fieldFlags.winnerByFinalDamageThenVa) {
      if (pDamage > eDamage) {
        battleLog.push(`${field.name}: DAN finale più alta → Vittoria Tu`);
        winner = 'player';
        emitOutcome(battleLog, {
          winnerSide: 'local',
          localVA: pAssault,
          opponentVA: eAssault,
          tieBreakCode: 'finalDamage',
          tieBreakData: { localDamage: pDamage, opponentDamage: eDamage },
        });
      } else if (eDamage > pDamage) {
        battleLog.push(`${field.name}: DAN finale più alta → Vittoria IA`);
        winner = 'enemy';
        emitOutcome(battleLog, {
          winnerSide: 'opponent',
          localVA: pAssault,
          opponentVA: eAssault,
          tieBreakCode: 'finalDamage',
          tieBreakData: { localDamage: pDamage, opponentDamage: eDamage },
        });
      } else if (pAssault > eAssault) {
        battleLog.push(`${field.name}: parità DAN · VA più alto → Vittoria Tu`);
        winner = 'player';
        emitOutcome(battleLog, {
          winnerSide: 'local',
          localVA: pAssault,
          opponentVA: eAssault,
          tieBreakCode: 'vaAfterDamageTie',
          tieBreakData: null,
        });
      } else if (eAssault > pAssault) {
        battleLog.push(`${field.name}: parità DAN · VA più alto → Vittoria IA`);
        winner = 'enemy';
        emitOutcome(battleLog, {
          winnerSide: 'opponent',
          localVA: pAssault,
          opponentVA: eAssault,
          tieBreakCode: 'vaAfterDamageTie',
          tieBreakData: null,
        });
      } else {
        winner = resolveDuelWinnerByAssault({
          pAssault,
          eAssault,
          pAgent,
          eAgent,
          pPower,
          ePower,
          isPlayerFirst,
          battleLog,
        });
      }
    } else {
      winner = resolveDuelWinnerByAssault({
        pAssault,
        eAssault,
        pAgent,
        eAgent,
        pPower,
        ePower,
        isPlayerFirst,
        battleLog,
      });
    }

    const playerWon = winner === 'player';
    const playerContextPost = { ...playerContext, won: playerWon, lost: !playerWon };
    const enemyContextPost = { ...enemyContext, won: !playerWon, lost: playerWon };

    battleLog.setContext('post', 'postFx');
    const {
      pPostAbilityTriggered,
      ePostAbilityTriggered,
      pPostBonusTriggered,
      ePostBonusTriggered,
    } = applyDuelPostBattleEffects({
      pAbilityBlocked,
      eAbilityBlocked,
      pBonusBlocked,
      eBonusBlocked,
      pHasBonus,
      eHasBonus,
      pArmyBonus,
      eArmyBonus,
      pAgent,
      eAgent,
      applyEffect,
      applyBonusEffects,
      checkTrigger,
      fieldOptions,
      triggersIgnored,
      playerContextPost,
      enemyContextPost,
      battleLog,
      state,
      isPlayerFirst,
      visualRecorder,
    });

    const pb = pickPostBattleFields(state);
    pPower = pb.pPower;
    ePower = pb.ePower;
    pDamage = pb.pDamage;
    eDamage = pb.eDamage;
    pFocusUsed = pb.pFocusUsed;
    eFocusUsed = pb.eFocusUsed;
    pAssaultMod = pb.pAssaultMod;
    eAssaultMod = pb.eAssaultMod;
    pHPCurrent = pb.pHPCurrent;
    eHPCurrent = pb.eHPCurrent;
    pFCCurrent = pb.pFCCurrent;
    eFCCurrent = pb.eFCCurrent;
    pImmune = pb.pImmune;
    eImmune = pb.eImmune;
    pAbilityCopied = pb.pAbilityCopied;
    eAbilityCopied = pb.eAbilityCopied;
    pCopiedAbilityNotTriggered = pb.pCopiedAbilityNotTriggered;
    eCopiedAbilityNotTriggered = pb.eCopiedAbilityNotTriggered;
    pBonusCopied = pb.pBonusCopied;
    eBonusCopied = pb.eBonusCopied;
    pCopiedBonusNotTriggered = pb.pCopiedBonusNotTriggered;
    eCopiedBonusNotTriggered = pb.eCopiedBonusNotTriggered;
    playerToxinActivated = pb.playerToxinActivated;
    enemyToxinActivated = pb.enemyToxinActivated;

    // Aggiorna gli stati dei trigger per includere quelli post-battaglia
    const finalPAbilityTriggered = pAbilityTriggerSatisfied || pPostAbilityTriggered;
    const finalEAbilityTriggered = eAbilityTriggerSatisfied || ePostAbilityTriggered;
    const finalPHasBonus = pBonusTriggerSatisfied || pPostBonusTriggered;
    const finalEHasBonus = eBonusTriggerSatisfied || ePostBonusTriggered;

    const outcome = runDuelDamageAftermathAndFcAdjust({
      battleLog,
      field,
      winner,
      maxDamage,
      overdriveThreshold,
      pFocusUsed,
      eFocusUsed,
      pDamage,
      eDamage,
      pHPCurrent,
      eHPCurrent,
      pFCCurrent,
      eFCCurrent,
      selectedFocus,
      enemySelectedFocus,
      playerAgentsRemainingAfter: countAgentsRemainingAfterPlay(
        playerHand,
        playerUsedCards,
        pAgent?.id
      ),
      enemyAgentsRemainingAfter: countAgentsRemainingAfterPlay(
        enemyHand,
        enemyUsedCards,
        eAgent?.id
      ),
    });

    // phaseLogs rimosso: UI e sync usano battleResult.events + revealAt.
    const phaseLogs = null;

    const battleResult = buildDuelBattleResult({
      winner,
      pAgent,
      eAgent,
      assault,
      pAssaultMod,
      eAssaultMod,
      pPower,
      ePower,
      pDamage: outcome.pDamage,
      eDamage: outcome.eDamage,
      pFocusUsed,
      eFocusUsed,
      pArmyBonusActive: pHasBonus,
      eArmyBonusActive: eHasBonus,
      finalPHasBonus,
      finalEHasBonus,
      finalPAbilityTriggered,
      finalEAbilityTriggered,
      pAbilityBlocked,
      eAbilityBlocked,
      pBonusBlocked,
      eBonusBlocked,
      pAbilityCopied,
      eAbilityCopied,
      pCopiedAbilityNotTriggered,
      eCopiedAbilityNotTriggered,
      pBonusCopied,
      eBonusCopied,
      pCopiedBonusNotTriggered,
      eCopiedBonusNotTriggered,
      pAbilityNotTriggered,
      eAbilityNotTriggered,
      pBonusNotTriggered,
      eBonusNotTriggered,
      damageDealt: outcome.damageDealt,
      finalPlayerHP: outcome.finalPlayerHP,
      finalEnemyHP: outcome.finalEnemyHP,
      finalPlayerFC: outcome.finalPlayerFC,
      finalEnemyFC: outcome.finalEnemyFC,
      battleLog: Array.isArray(battleLog) ? battleLog : battleLog.strings,
      phaseLogs,
      field,
      currentFieldIndex,
      playerToxinActivated,
      enemyToxinActivated,
      visualSteps: visualRecorder.steps,
      isPlayerFirst,
      events: eventEmitter.events,
    });

    if (battleResult.perfectFocusSide) {
      const perfectSide = battleResult.perfectFocusSide;
      const perfectAgent = perfectSide === 'player' ? pAgent : eAgent;
      const perfectFocus =
        perfectSide === 'player' ? pFocusUsed : eFocusUsed;
      emitPerfectFocus(battleLog, {
        engineSide: perfectSide,
        agent: perfectAgent,
        focusUsed: perfectFocus,
      });
      if (battleLog && typeof battleLog.push === 'function') {
        battleLog.push(
          `PERFECT! ${perfectAgent?.name || (perfectSide === 'player' ? 'Tu' : 'IA')} — scommessa FC esatta (${perfectFocus})`
        );
      }
    }

    return { battleResult };

}

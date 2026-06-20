// ============================================
// Risoluzione duello (logica pura, nessun React)
// Fonte di verità per VA, poteri, bonus e esito scontro (locale e UI).
// ============================================

import { checkTrigger } from './triggerLogic.js';
import { buildDuelPhaseLogs } from './duelPhaseLogs.js';
import { countConqueredFields, checkImmunity } from './duel/duelHelpers.js';
import {
  createDuelCanTriggerAbility,
  resolveFieldArmyBonuses,
  applyFieldOverdriveBonuses,
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
import { ARMY_BONUSES } from '../data/index.js';
import { buildDuelTurnContexts } from './duel/duelTurnContexts.js';

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
}) {
    const countInitialLeagueCards = (usedCards, currentHand, selectedAgent) => {
      const byId = new Map();
      [...(usedCards || []), ...(currentHand || []), selectedAgent]
        .filter(Boolean)
        .forEach((card) => byId.set(card.id, card));
      let count = 0;
      byId.forEach((card) => {
        if (card.league === selectedAgent.league) count += 1;
      });
      return count;
    };

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
    });

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

    const battleLog = [];
    battleLog.push(`🔍 Campo: ${field.name}`);
    battleLog.push(`🎮 Tu: ${pAgent.name} (${duel.pPower}P, ${duel.pDamage}D) + ${duel.pFocusUsed} FC`);
    battleLog.push(`🤖 IA: ${eAgent.name} (${duel.ePower}P, ${duel.eDamage}D) + ${duel.eFocusUsed} FC`);

    if (duel.pImmune) battleLog.push(`🐛¡️ ${pAgent.name}: Immune attivo`);
    if (duel.eImmune) battleLog.push(`🐛¡️ ${eAgent.name}: Immune attivo`);

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
    } = fieldFlags;

    const state = createDuelCombatState(duel);

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
      directDamageDisabled,
      directDamageBonus,
      conquestDouble: fieldFlags.conquestDouble === true,
      lastWishDouble: fieldFlags.lastWishDouble === true,
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
      copyDisabled,
      modifiersDisabled,
      directDamageDisabled,
      directDamageBonus,
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
    let pBonusCopied = state.pBonusCopied;
    let eBonusCopied = state.eBonusCopied;
    let playerToxinActivated = state.playerToxinActivated;
    let enemyToxinActivated = state.enemyToxinActivated;

    applyFieldOverdriveBonuses(field, state, overdriveThreshold, battleLog);
    pPower = state.pPower;
    ePower = state.ePower;
    pDamage = state.pDamage;
    eDamage = state.eDamage;

    const assault = runDuelAssaultCalculation(battleLog, {
      pAgent,
      eAgent,
      pPower,
      ePower,
      pFocusUsed: fieldFlags.focusHalvedInVa ? Math.ceil(pFocusUsed / 2) : pFocusUsed,
      eFocusUsed: fieldFlags.focusHalvedInVa ? Math.ceil(eFocusUsed / 2) : eFocusUsed,
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
        battleLog.push(`⚔️ ${field.name}: più FC investiti → Vittoria Tu`);
        winner = 'player';
      } else if (eFocusUsed > pFocusUsed) {
        battleLog.push(`⚔️ ${field.name}: più FC investiti → Vittoria IA`);
        winner = 'enemy';
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
      playerContextPost,
      enemyContextPost,
      battleLog,
      state,
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
    pBonusCopied = pb.pBonusCopied;
    eBonusCopied = pb.eBonusCopied;
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
    });

    const phaseLogs = buildDuelPhaseLogs({
      battleLog,
      field,
      pAgent,
      eAgent,
      isPlayerFirst,
      playerHP,
      enemyHP,
      playerFocus,
      enemyFocus,
      selectedFocus,
      enemySelectedFocus,
      pFocusUsed,
      eFocusUsed,
      pPower,
      ePower,
      pAssaultMod,
      eAssaultMod,
      pAssault,
      eAssault,
      winner,
    });

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
      pBonusCopied,
      eBonusCopied,
      pAbilityNotTriggered,
      eAbilityNotTriggered,
      pBonusNotTriggered,
      eBonusNotTriggered,
      damageDealt: outcome.damageDealt,
      finalPlayerHP: outcome.finalPlayerHP,
      finalEnemyHP: outcome.finalEnemyHP,
      finalPlayerFC: outcome.finalPlayerFC,
      finalEnemyFC: outcome.finalEnemyFC,
      battleLog,
      phaseLogs,
      field,
      currentFieldIndex,
      playerToxinActivated,
      enemyToxinActivated,
    });
    return { battleResult };

}

// ============================================
// HOOK: useAI
// Gestisce la logica dell'IA per selezionare agenti e focus coin
// ============================================

import { useCallback } from 'react';
import { checkTrigger } from '../game/triggerLogic';
import { getFieldModifiers } from '../game/fieldLogic';

/**
 * Hook per gestire la logica dell'IA
 * @param {Object} gameState - Stato del gioco da useGameState
 * @returns {Object} Funzioni per gestire l'IA
 */
export function useAI(gameState) {
  const {
    enemyHand,
    enemyUsedCards,
    enemyFocus,
    selectedAgent,
    selectedFocus,
    playerHP,
    enemyHP,
    playerUsedCards,
    isPlayerFirst,
    lastWinner,
    roundNumber,
    battlefields,
    currentFieldIndex,
    conqueredFields,
    setEnemyAgent,
    setEnemySelectedFocus,
    setLogs,
    aiDifficulty = 'medium', // default a medium se non specificato
  } = gameState;

  const aiIsFirst = !isPlayerFirst;

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  const countFields = useCallback(() => {
    let playerFieldsConquered = 0;
    let enemyFieldsConquered = 0;
    Object.values(conqueredFields || {}).forEach((entry) => {
      if (entry?.winner === 'player') playerFieldsConquered += 1;
      if (entry?.winner === 'enemy') enemyFieldsConquered += 1;
    });
    return { playerFieldsConquered, enemyFieldsConquered };
  }, [conqueredFields]);

  const getActiveFieldModifiers = useCallback(() => {
    const field = Array.isArray(battlefields) ? battlefields[currentFieldIndex] : null;
    return getFieldModifiers(field);
  }, [battlefields, currentFieldIndex]);

  const countInitialLeagueCards = useCallback((card) => {
    if (!card) return 0;
    const all = [...(enemyUsedCards || []), ...(enemyHand || []), card].filter(Boolean);
    const byId = new Map();
    all.forEach((c) => byId.set(c.id, c));
    let count = 0;
    byId.forEach((c) => {
      if (c.league === card.league) count += 1;
    });
    return count;
  }, [enemyUsedCards, enemyHand]);

  const buildEnemyTriggerContext = useCallback((card, projectedFocus) => {
    const { playerFieldsConquered, enemyFieldsConquered } = countFields();
    const fieldModifiers = getActiveFieldModifiers();
    const enemyLeague = selectedAgent?.league ?? card?.league ?? 0;
    return {
      isFirst: aiIsFirst,
      wonPrevious: lastWinner === 'enemy',
      lostPrevious: lastWinner === 'player',
      focusCoins: projectedFocus,
      enemyFocusCoins: selectedFocus || 0,
      cardsPlayed: (enemyUsedCards?.length || 0) + 1,
      enemyCardsPlayed: (playerUsedCards?.length || 0) + 1,
      playerHP: enemyHP,
      enemyHP: playerHP,
      playerLeague: card?.league ?? 0,
      enemyLeague,
      playerFieldsConquered: enemyFieldsConquered,
      enemyFieldsConquered: playerFieldsConquered,
      roundNumber: roundNumber || 1,
      playerInitialLeagueCount: countInitialLeagueCards(card),
      fieldModifiers,
    };
  }, [
    countFields,
    getActiveFieldModifiers,
    selectedAgent,
    lastWinner,
    selectedFocus,
    enemyUsedCards,
    playerUsedCards,
    enemyHP,
    playerHP,
    roundNumber,
    countInitialLeagueCards,
    aiIsFirst,
  ]);

  const estimateAbilityValue = useCallback((card, projectedFocus) => {
    if (!card?.ability?.effect) return 0;
    const ability = card.ability;
    const trigger = ability.trigger;
    const effect = ability.effect;
    const value = ability.value ?? 0;
    const context = buildEnemyTriggerContext(card, projectedFocus);
    const fieldModifiers = context.fieldModifiers || {};
    const triggerForcedActive = fieldModifiers.allTriggersAlwaysActive === true;
    const postBattleTrigger = trigger === 'conquest' || trigger === 'lastWish';
    const unresolvedPreChoiceTrigger =
      !selectedAgent && (trigger === 'opportunista' || trigger === 'sfida' || trigger === 'sopraffare');
    const triggerActive = triggerForcedActive || checkTrigger(trigger, context);

    if (!postBattleTrigger && !triggerActive && !unresolvedPreChoiceTrigger) return -3;

    // Trigger post-duello: modifiche stat del duello appena finito sono valore morto.
    const deadPostBattleEffects = new Set([
      'power', 'damage', 'assaultValue', 'enemyPower', 'enemyDamage', 'enemyAssault',
      'enemyPowerAndDamage', 'powerAndDamage', 'imponiPower', 'imponiDamage',
      'copyPower', 'copyDamage', 'copyAbility', 'copyBonus', 'blockAbility', 'blockBonus', 'immune',
    ]);
    if (postBattleTrigger && deadPostBattleEffects.has(effect)) return -8;

    // Con 5 round, economia all'ultima chance tende a non essere spendibile.
    if (trigger === 'ultimaChance' && (roundNumber || 1) >= 5 && effect === 'focusCoin') return -6;

    switch (effect) {
      case 'directDamage':
        return (postBattleTrigger ? 0.6 : 1) * (5 + value);
      case 'heal':
        return (postBattleTrigger ? 0.6 : 1) * (3 + value);
      case 'power':
      case 'damage':
      case 'powerAndDamage':
      case 'enemyPower':
      case 'enemyDamage':
      case 'enemyAssault':
      case 'enemyPowerAndDamage':
        return (postBattleTrigger ? 0.4 : 1) * (2 + Math.abs(value));
      case 'focusCoin':
        return (postBattleTrigger ? 0.5 : 1) * ((roundNumber || 1) >= 5 ? 0.5 : 2 + value * 0.5);
      case 'blockAbility':
      case 'blockBonus':
      case 'immune':
      case 'inversion':
        return (postBattleTrigger ? 0.4 : 1) * 2.5;
      case 'copyPower':
      case 'copyDamage':
      case 'copyAbility':
      case 'copyBonus':
        return (postBattleTrigger ? 0.4 : 1) * 2;
      case 'attrition':
      case 'escalation':
      case 'toxin':
        return 2.5;
      case 'selfDamage':
        return -2 - value;
      default:
        return 1;
    }
  }, [buildEnemyTriggerContext, roundNumber]);

  const evaluateCardScore = useCallback((card) => {
    if (!card) return -Infinity;

    const available = enemyHand.filter(c => !enemyUsedCards.includes(c.id));
    const reserved = Math.max(0, available.length - 1);
    const maxSpendable = Math.max(1, enemyFocus - reserved);
    const projectedFocus = Math.max(1, Math.min(card.league, maxSpendable));

    const baseAssault = card.power * projectedFocus;
    const baseDamage = card.damage * 1.4;
    const abilityScore = estimateAbilityValue(card, projectedFocus) * 1.3;

    let matchupScore = 0;
    if (selectedAgent) {
      matchupScore += (card.power - selectedAgent.power) * 0.9;
      matchupScore += (card.damage - selectedAgent.damage) * 0.6;
      matchupScore += (card.league - selectedAgent.league) * 0.2;
    }

    const tiebreakerNoise = Math.random() * 0.5;
    return baseAssault + baseDamage + abilityScore + matchupScore + tiebreakerNoise;
  }, [enemyHand, enemyUsedCards, enemyFocus, selectedAgent, estimateAbilityValue]);

  /**
   * Seleziona un agente per l'IA
   * Strategia varia in base alla difficoltà
   * @returns {Object|null} Agente selezionato o null
   */
  const selectEnemyAgent = useCallback(() => {
    const available = enemyHand.filter(c => !enemyUsedCards.includes(c.id));
    if (available.length === 0) return null;

    const scored = available
      .map((card) => ({ card, score: evaluateCardScore(card) }))
      .sort((a, b) => b.score - a.score);

    if (aiDifficulty === 'easy') {
      // Facile: casuale ma evita più spesso le carte peggiori.
      const half = Math.max(1, Math.ceil(scored.length / 2));
      const pool = scored.slice(0, half);
      return pool[Math.floor(Math.random() * pool.length)].card;
    } else if (aiDifficulty === 'hard') {
      // Difficile: quasi sempre la migliore, ma con minima varianza.
      if (scored.length > 1 && Math.random() < 0.15) return scored[1].card;
      return scored[0].card;
    } else if (aiDifficulty === 'chaos') {
      // Il folle (chaos): comportamento completamente imprevedibile
      const random = Math.random();
      if (random < 0.33) {
        return scored[scored.length - 1].card;
      } else if (random < 0.66) {
        return available[Math.floor(Math.random() * available.length)];
      } else {
        return scored[0].card;
      }
    } else {
      // Medio: sceglie fra top 3 pesando anche trigger/effetto.
      const topCards = scored.slice(0, Math.min(3, scored.length));
      const weighted = [];
      topCards.forEach((item, index) => {
        const weight = Math.max(1, 4 - index);
        for (let i = 0; i < weight; i += 1) weighted.push(item.card);
      });
      return weighted[Math.floor(Math.random() * weighted.length)];
    }
  }, [enemyHand, enemyUsedCards, aiDifficulty, evaluateCardScore]);

  /**
   * Calcola i focus coin da usare per l'IA
   * Strategia varia in base alla difficoltà
   * @param {Object} agent - Agente selezionato
   * @returns {number} Numero di focus coin da usare
   */
  const calculateEnemyFocus = useCallback((agent) => {
    const available = enemyHand.filter(c => !enemyUsedCards.includes(c.id));
    const reserved = Math.max(0, available.length - 1);
    const maxSpendable = Math.max(1, enemyFocus - reserved);
    const fieldMods = getActiveFieldModifiers();
    const overdriveThreshold = fieldMods.overdriveThreshold || 5;

    const playerAssaultEstimate = selectedAgent && selectedFocus
      ? selectedAgent.power * selectedFocus
      : null;

    const ability = agent?.ability || {};
    const contextMidFocus = buildEnemyTriggerContext(agent, Math.min(maxSpendable, Math.max(1, agent.league)));
    const triggerActiveAtMid = checkTrigger(ability.trigger, contextMidFocus);

    const estimatePowerDelta = () => {
      if (!triggerActiveAtMid) return 0;
      if (ability.effect === 'power' || ability.effect === 'powerAndDamage') return ability.value || 0;
      if (ability.effect === 'enemyPower' || ability.effect === 'enemyPowerAndDamage') return Math.abs(ability.value || 0);
      return 0;
    };

    const estimatedPower = Math.max(1, agent.power + estimatePowerDelta());
    let targetFocus;

    if (aiDifficulty === 'easy') {
      targetFocus = Math.ceil(agent.league * 0.9) + Math.floor(Math.random() * 2) - 1;
    } else if (aiDifficulty === 'hard') {
      targetFocus = Math.ceil(agent.league * 1.25) + Math.floor(Math.random() * 2);
    } else if (aiDifficulty === 'chaos') {
      const random = Math.random();
      if (random < 0.33) {
        return 1;
      } else if (random < 0.66) {
        return Math.floor(Math.random() * maxSpendable) + 1;
      } else {
        return maxSpendable;
      }
    } else {
      targetFocus = Math.ceil(agent.league * 1.1) + Math.floor(Math.random() * 3) - 1;
    }

    if (playerAssaultEstimate !== null) {
      const requiredToContest = Math.ceil((playerAssaultEstimate + 1) / estimatedPower);
      const buffer = aiDifficulty === 'hard' ? 1 : aiDifficulty === 'easy' ? -1 : 0;
      targetFocus = Math.max(targetFocus, requiredToContest + buffer);
    }

    if (ability.trigger === 'overdrive') {
      targetFocus = Math.max(targetFocus, overdriveThreshold);
    }

    if (ability.trigger === 'ultimaChance' && (roundNumber || 1) >= 5 && ability.effect === 'focusCoin') {
      targetFocus = Math.min(targetFocus, Math.ceil(agent.league));
    }

    return clamp(targetFocus, 1, maxSpendable);
  }, [
    enemyHand,
    enemyUsedCards,
    enemyFocus,
    aiDifficulty,
    getActiveFieldModifiers,
    selectedAgent,
    selectedFocus,
    buildEnemyTriggerContext,
    roundNumber,
  ]);

  /**
   * Seleziona agente e focus coin per l'IA
   * @param {boolean} logSelection - Se loggare la selezione (default: true)
   * @returns {Object|null} { agent, focus } o null se nessun agente disponibile
   */
  const selectEnemyAgentAndFocus = useCallback((logSelection = true) => {
    const agent = selectEnemyAgent();
    if (!agent) return null;
    
    const focus = calculateEnemyFocus(agent);
    
    setEnemyAgent(agent);
    setEnemySelectedFocus(focus);
    
    if (logSelection) {
      setLogs(prev => [...prev.slice(-20), `[R${roundNumber}] 🤖 L'IA schiera: ${agent.name}`]);
    }
    
    return { agent, focus };
  }, [selectEnemyAgent, calculateEnemyFocus, setEnemyAgent, setEnemySelectedFocus, setLogs, roundNumber]);

  /**
   * Strategia avanzata per l'IA (futuro)
   * Può essere estesa per strategie più sofisticate
   */
  const selectEnemyAgentAdvanced = useCallback((context = {}) => {
    // Per ora usa la strategia base
    // In futuro può considerare:
    // - HP del giocatore vs IA
    // - Carte già usate
    // - Campo di battaglia attivo
    // - Trigger disponibili
    return selectEnemyAgentAndFocus();
  }, [selectEnemyAgentAndFocus]);

  /**
   * Tempo di "pensiero" dell'IA in ms - variabile a discrezione (giocate veloci o lente)
   * @returns {number} Delay in millisecondi
   */
  const getThinkingTime = useCallback(() => {
    const r = Math.random();
    if (aiDifficulty === 'easy') {
      // Facile: spesso veloce (0.8-2.2s), a volte lento
      return r < 0.5 ? 800 + Math.random() * 900 : 1800 + Math.random() * 1200;
    } else if (aiDifficulty === 'hard') {
      // Difficile: tende a pensare di più (2-4s), occasionalmente rapido
      return r < 0.2 ? 1200 + Math.random() * 800 : 2000 + Math.random() * 2000;
    } else if (aiDifficulty === 'chaos') {
      // Chaos: imprevedibile (0.5-4s)
      return 500 + Math.random() * 3500;
    } else {
      // Medio: bilanciato (1.2-3.2s)
      return 1200 + Math.random() * 2000;
    }
  }, [aiDifficulty]);

  return {
    selectEnemyAgent,
    calculateEnemyFocus,
    selectEnemyAgentAndFocus,
    selectEnemyAgentAdvanced,
    getThinkingTime,
  };
}

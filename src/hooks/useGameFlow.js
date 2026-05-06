// ============================================
// HOOK: useGameFlow
// Gestisce il flusso del gioco (start, next round, etc.)
// ============================================

import { useCallback } from 'react';
import { ARMY_SETS, ARMY_DECKS } from '../data';
import { selectBattlefields } from '../game/fieldLogic';
import { DIFFICULTY_NAMES, shuffleArray } from '../utils';
import { loadCustomDeck } from '../utils/deckManager';
import { calcInitialBonuses } from '../utils/onlineMatch';

/**
 * Hook per gestire il flusso del gioco
 * @param {Object} gameState - Stato del gioco da useGameState
 * @param {Object} animations - Stato delle animazioni da useAnimations (opzionale)
 * @returns {Object} Funzioni per gestire il flusso del gioco
 */
export function useGameFlow(gameState, animations = null) {
  const {
    setGameMode,
    setPlayerHand,
    setEnemyHand,
    setBattlefields,
    setConqueredFields,
    setPlayerHP,
    setEnemyHP,
    setPlayerFocus,
    setEnemyFocus,
    setPlayerUsedCards,
    setEnemyUsedCards,
    setCardBattleOutcomes,
    setRoundNumber,
    setLastWinner,
    setRevealedFields,
    setGamePhase,
    setCurrentFieldIndex,
    setSelectedAgent,
    setSelectedFocus,
    setEnemyAgent,
    setEnemySelectedFocus,
    setBattleResult,
    setPlayerArmyBonuses,
    setEnemyArmyBonuses,
    setPlayerToxin,
    setEnemyToxin,
    setGameResult,
    setShowClaimVictoryChoice,
    setAiDifficulty,
    setIsPlayerFirst,
    setLogs,
    setCampaignDuelMod,
  } = gameState;

  const resolveCardIdsAcrossArmies = useCallback((cardIds, fallbackArmy = null) => {
    if (!Array.isArray(cardIds)) return [];
    const armyNames = Object.keys(ARMY_SETS);
    return cardIds
      .map((cardId) => {
        for (const army of armyNames) {
          const card = ARMY_SETS[army].find((c) => c.id === cardId);
          if (card) return { ...card, army: card.army || army };
        }
        return null;
      })
      .filter(Boolean)
      .map((card) => ({ ...card, army: card.army || fallbackArmy }));
  }, []);

  /**
   * Inizia una nuova partita
   * @param {string} selectedPlayerArmy - Armata del giocatore
   * @param {string|Array} selectedDeckKey - Chiave del deck o array di card IDs (mazzo prefatto)
   * @param {string} mode - Modalità di gioco
   * @param {string} difficulty - Difficoltà IA
   * @param {Array} allBattlefields - Tutti i campi di battaglia disponibili
   * @param {string} [enemyArmy] - Armata nemica (opzionale, per campagna)
   * @param {string} [enemyDeckKey] - Deck nemico (opzionale, per campagna)
   * @param {{ initiativeProfile?: 'assault'|'defense'|null, winCondition?: string }|null} [campaignDuelMod] - campagna
   */
  const startGame = useCallback((selectedPlayerArmy, selectedDeckKey, mode = 'classic', difficulty = 'medium', allBattlefields, enemyArmy = null, enemyDeckKey = null, campaignDuelMod = null) => {
    setShowClaimVictoryChoice(null);
    setCampaignDuelMod(campaignDuelMod || null);
    setGameMode(mode);
    // Imposta la difficoltà dell'IA
    setAiDifficulty(difficulty);
    
    // Seleziona le armate
    const armyNames = Object.keys(ARMY_SETS);
    const playerArmy = selectedPlayerArmy;
    
    // L'IA sceglie un'armata diversa casualmente (o usa quella specificata per campagna)
    let enemyArmySelected = enemyArmy;
    if (!enemyArmySelected) {
      const availableForEnemy = armyNames.filter(a => a !== playerArmy);
      enemyArmySelected = availableForEnemy[Math.floor(Math.random() * availableForEnemy.length)];
    }
    
    // Prendi le carte del deck selezionato per il giocatore
    let playerSet;
    if (Array.isArray(selectedDeckKey)) {
      // Mazzo prefatto: array di card IDs
      playerSet = resolveCardIdsAcrossArmies(selectedDeckKey, playerArmy);
    } else if (typeof selectedDeckKey === 'string' && selectedDeckKey.startsWith('custom_')) {
      // Mazzo personalizzato (supporta multi-armata: cerca le carte in tutte le armate)
      const customDeckId = selectedDeckKey.replace('custom_', '');
      const customDeck = loadCustomDeck(customDeckId);
      if (customDeck && customDeck.cards && customDeck.cards.length > 0) {
        playerSet = resolveCardIdsAcrossArmies(customDeck.cards, playerArmy);
        if (playerSet.length !== customDeck.cards.length) {
          console.warn('Alcune carte del mazzo non trovate');
        }
      }
      if (!playerSet || playerSet.length === 0) {
        console.error('Mazzo personalizzato non trovato o invalido');
        return;
      }
    } else {
      // Deck precostruito normale (A, B, etc.)
      const playerDeck = ARMY_DECKS[playerArmy][selectedDeckKey];
      const playerCardIds = playerDeck.cards;
      playerSet = resolveCardIdsAcrossArmies(playerCardIds, playerArmy);
    }
    
    // L'IA sceglie un deck random (o usa quello specificato per campagna)
    let enemyDeckSelectedKey = enemyDeckKey;
    if (!enemyDeckSelectedKey) {
      const enemyDeckKeys = Object.keys(ARMY_DECKS[enemyArmySelected]);
      enemyDeckSelectedKey = enemyDeckKeys[Math.floor(Math.random() * enemyDeckKeys.length)];
    }
    const enemyDeck = ARMY_DECKS[enemyArmySelected][enemyDeckSelectedKey];
    const enemyCardIds = enemyDeck.cards;
    const enemySet = resolveCardIdsAcrossArmies(enemyCardIds, enemyArmySelected);
    
    // Estrae 5 carte random dal deck di 10 (preserva army per mazzi multi-armata)
    const pHand = shuffleArray(playerSet).slice(0, 5).map((card) => ({ ...card, army: card.army || playerArmy }));
    const eHand = shuffleArray(enemySet).slice(0, 5).map((card) => ({ ...card, army: card.army || enemyArmySelected }));
    
    const pBonuses = calcInitialBonuses(pHand);
    const eBonuses = calcInitialBonuses(eHand);
    
    setPlayerArmyBonuses(pBonuses);
    setEnemyArmyBonuses(eBonuses);
    
    setPlayerHand(pHand);
    setEnemyHand(eHand);
    
    const fields = selectBattlefields(mode, allBattlefields);
    setBattlefields(fields);
    setConqueredFields({});
    
    setPlayerHP(25);
    setEnemyHP(25);
    setPlayerFocus(18);
    setEnemyFocus(18);
    
    setPlayerUsedCards([]);
    setEnemyUsedCards([]);
    setCardBattleOutcomes({});
    setGameResult(null);
    
    // Reset animazioni se disponibili
    if (animations && animations.resetAnimations) {
      animations.resetAnimations();
    } else if (animations) {
      // Fallback: reset manuale se resetAnimations non è disponibile
      animations.setShowFinalRoundAnimation(false);
      animations.setDuelPhase(0);
      animations.setShowClashAnimation(false);
      animations.setPlayerCardGlow(0);
      animations.setEnemyCardGlow(0);
      animations.setPlayerFocusCoinsShown(0);
      animations.setEnemyFocusCoinsShown(0);
      animations.setCardGlowIntensity(0);
    }
    
    setRoundNumber(1);
    setLastWinner(null);
    setPlayerToxin(null);
    setEnemyToxin(null);
    
    // In Bare Hands tutti i campi sono visibili fin da subito
    setRevealedFields(mode === 'bareHands' ? 5 : 3);
    
    setSelectedAgent(null);
    setEnemyAgent(null);
    setCurrentFieldIndex(null);
    setBattleResult(null);
    setSelectedFocus(1);
    
    // Log iniziali
    setLogs([
      `⚔️ La battaglia ha inizio!`,
      `🎖️ Tu comandi: ${playerArmy}`,
      `🎖️ IA comanda: ${enemyArmySelected}`,
      `🎯 Difficoltà IA: ${DIFFICULTY_NAMES[difficulty] || DIFFICULTY_NAMES['medium']}`,
      mode === 'bareHands' ? `🤜 Modalità: Bare Hands (senza effetti campo)` : ``
    ].filter(Boolean));
    
    // Determina chi inizia (Lega più bassa della mano)
    const playerLeague = pHand.reduce((sum, c) => sum + c.league, 0);
    const enemyLeague = eHand.reduce((sum, c) => sum + c.league, 0);
    
    let playerFirst =
      playerLeague < enemyLeague
        ? true
        : playerLeague > enemyLeague
          ? false
          : Math.random() < 0.5;
    if (campaignDuelMod?.initiativeProfile === 'assault') {
      playerFirst = true;
    } else if (campaignDuelMod?.initiativeProfile === 'defense') {
      playerFirst = false;
    }
    setIsPlayerFirst(playerFirst);
    
    // Aggiungi log per chi inizia (usa roundNumber = 1 per il formato)
    const startLog = playerFirst 
      ? `Lega ${playerLeague} vs ${enemyLeague}: Inizi tu!` 
      : `Lega ${playerLeague} vs ${enemyLeague}: Inizia l'IA!`;
    
    setLogs(prev => [...prev, `[R1] ${startLog}`]);
    
    setGamePhase('selectField');
  }, [
    setGameMode,
    setPlayerHand,
    setEnemyHand,
    setBattlefields,
    setConqueredFields,
    setPlayerHP,
    setEnemyHP,
    setPlayerFocus,
    setEnemyFocus,
    setPlayerUsedCards,
    setEnemyUsedCards,
    setCardBattleOutcomes,
    setRoundNumber,
    setLastWinner,
    setRevealedFields,
    setGamePhase,
    setCurrentFieldIndex,
    setSelectedAgent,
    setSelectedFocus,
    setEnemyAgent,
    setEnemySelectedFocus,
    setBattleResult,
    setPlayerArmyBonuses,
    setEnemyArmyBonuses,
    setPlayerToxin,
    setEnemyToxin,
    setGameResult,
    setAiDifficulty,
    setIsPlayerFirst,
    setLogs,
    setCampaignDuelMod,
    animations,
    resolveCardIdsAcrossArmies,
  ]);

  /**
   * Avvia partita online (stesso stato per host e guest; perspective = 'host' | 'guest').
   * @param {string} perspective
   * @param {Object} payload - output di buildOnlineMatchPayload
   */
  const startOnlineMatch = useCallback(
    (perspective, payload) => {
      const {
        mode,
        battlefields,
        hostPlayerHand,
        hostEnemyHand,
        hostIsPlayerFirst,
        hostPlayerArmy,
        hostEnemyArmy,
      } = payload;

      const playerHand = perspective === 'host' ? hostPlayerHand : hostEnemyHand;
      const enemyHand = perspective === 'host' ? hostEnemyHand : hostPlayerHand;
      const playerArmy = perspective === 'host' ? hostPlayerArmy : hostEnemyArmy;
      const enemyArmy = perspective === 'host' ? hostEnemyArmy : hostPlayerArmy;
      const isPlayerFirst = perspective === 'host' ? hostIsPlayerFirst : !hostIsPlayerFirst;

      setShowClaimVictoryChoice(null);
      setCampaignDuelMod(null);
      setGameMode(mode);
      setAiDifficulty('multiplayer');

      const pBonuses = calcInitialBonuses(playerHand);
      const eBonuses = calcInitialBonuses(enemyHand);

      setPlayerArmyBonuses(pBonuses);
      setEnemyArmyBonuses(eBonuses);

      setPlayerHand(playerHand);
      setEnemyHand(enemyHand);

      setBattlefields(battlefields);
      setConqueredFields({});

      setPlayerHP(25);
      setEnemyHP(25);
      setPlayerFocus(18);
      setEnemyFocus(18);

      setPlayerUsedCards([]);
      setEnemyUsedCards([]);
      setCardBattleOutcomes({});
      setGameResult(null);

      if (animations && animations.resetAnimations) {
        animations.resetAnimations();
      } else if (animations) {
        animations.setShowFinalRoundAnimation(false);
        animations.setDuelPhase(0);
        animations.setShowClashAnimation(false);
        animations.setPlayerCardGlow(0);
        animations.setEnemyCardGlow(0);
        animations.setPlayerFocusCoinsShown(0);
        animations.setEnemyFocusCoinsShown(0);
        animations.setCardGlowIntensity(0);
      }

      setRoundNumber(1);
      setLastWinner(null);
      setPlayerToxin(null);
      setEnemyToxin(null);

      setRevealedFields(mode === 'bareHands' ? 5 : 3);

      setSelectedAgent(null);
      setEnemyAgent(null);
      setCurrentFieldIndex(null);
      setBattleResult(null);
      setSelectedFocus(1);

      const playerLeague = playerHand.reduce((sum, c) => sum + c.league, 0);
      const enemyLeague = enemyHand.reduce((sum, c) => sum + c.league, 0);

      setLogs([
        `⚔️ Partita online iniziata!`,
        `🎖️ Tu comandi: ${playerArmy}`,
        `🎖️ Avversario: ${enemyArmy}`,
        mode === 'bareHands' ? `🤜 Modalità: Bare Hands (senza effetti campo)` : '',
      ].filter(Boolean));

      const startLog = isPlayerFirst
        ? `Lega ${playerLeague} vs ${enemyLeague}: Inizi tu!`
        : `Lega ${playerLeague} vs ${enemyLeague}: Inizia l'avversario!`;

      setLogs((prev) => [...prev, `[R1] ${startLog}`]);

      setIsPlayerFirst(isPlayerFirst);
      setGamePhase('selectField');
    },
    [
      setShowClaimVictoryChoice,
      setGameMode,
      setAiDifficulty,
      setPlayerArmyBonuses,
      setEnemyArmyBonuses,
      setPlayerHand,
      setEnemyHand,
      setBattlefields,
      setConqueredFields,
      setPlayerHP,
      setEnemyHP,
      setPlayerFocus,
      setEnemyFocus,
      setPlayerUsedCards,
      setEnemyUsedCards,
      setCardBattleOutcomes,
      setGameResult,
      animations,
      setRoundNumber,
      setLastWinner,
      setPlayerToxin,
      setEnemyToxin,
      setRevealedFields,
      setSelectedAgent,
      setEnemyAgent,
      setCurrentFieldIndex,
      setBattleResult,
      setSelectedFocus,
      setLogs,
      setIsPlayerFirst,
      setGamePhase,
      setCampaignDuelMod,
    ]
  );

  /**
   * Resetta il gioco al menu
   */
  const resetToMenu = useCallback(() => {
    setGamePhase('menu');
    setGameResult(null);
    setBattleResult(null);
    setCampaignDuelMod(null);
  }, [setGamePhase, setGameResult, setBattleResult, setCampaignDuelMod]);

  return {
    startGame,
    startOnlineMatch,
    resetToMenu,
    selectBattlefields,
    shuffleArray,
  };
}

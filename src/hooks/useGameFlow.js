// ============================================
// HOOK: useGameFlow
// Gestisce il flusso del gioco (start, next round, etc.)
// ============================================

import { useCallback } from 'react';
import { ARMY_SETS, ARMY_DECKS, ARMY_COLORS, ALL_BATTLEFIELDS } from '../data';
import { selectBattlefields } from '../game/fieldLogic';
import { DIFFICULTY_NAMES, shuffleArray } from '../utils';
import { loadCustomDeck, attachShuffleDealVisuals, buildDeckVisualIdentity } from '../utils/deckManager';
import { calcInitialBonuses, normalizeOnlineMatchPayload, buildShuffleDealSetupFromMatch } from '../utils/onlineMatch';
import { resolveShuffleKindsForDuel } from '../utils/shuffleStylePreference';
import { computeShuffleDealFromSets } from '../components/shuffle/prepareDuelShuffleHands';
import { pickDistinctCardBackPair } from '../utils/cardBackPicker';
import { preloadBattlefieldImages } from '../utils/preloadAssets';
import { createMatchEminenceState, resolveEminenceFormat } from '../game/eminence/eminenceSetup';
import { EMINENCE_FORMAT } from '../game/eminence/eminenceConstants.js';

/**
 * Hook per gestire il flusso del gioco
 * @param {Object} gameState - Stato del gioco da useGameState
 * @param {Object} animations - Stato delle animazioni da useAnimations (opzionale)
 * @param {(() => void)|null} clearAiPendingDecision - cleanup cache decisioni IA tra partite/round
 * @returns {Object} Funzioni per gestire il flusso del gioco
 */
export function useGameFlow(gameState, animations = null, clearAiPendingDecision = null) {
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
    setOpeningPlayerFirst,
    setLogs,
    setBattleEvents,
    setCampaignDuelMod,
    setShuffleDealSetup,
    setPlayerDeckVisual,
    setEnemyDeckVisual,
    setEminenceMatchState,
  } = gameState;

  /**
   * Installa il sottosistema Eminenze per il nuovo Scontro.
   * Fuori dai formati che lo richiedono resta disattivato.
   */
  const initEminences = useCallback((playerSet, enemySet, startOptions) => {
    const format = resolveEminenceFormat(startOptions);
    const { matchState, playerResolution, enemyResolution } = createMatchEminenceState({
      format,
      playerDeck: playerSet,
      enemyDeck: enemySet,
      playerEminenceId: startOptions?.playerEminenceId ?? null,
      enemyEminenceId: startOptions?.enemyEminenceId ?? null,
    });

    for (const [label, resolution] of [['giocatore', playerResolution], ['avversario', enemyResolution]]) {
      if (resolution.reason) {
        console.warn(`Eminenza ${label} non valida per il mazzo: ${resolution.reason}`);
      } else if (resolution.ambiguous) {
        console.warn(
          `Eminenza ${label} dedotta dal mazzo fra ${resolution.candidates.length} eleggibili: `
          + 'la scelta spetta al deckbuilding.'
        );
      }
    }

    setEminenceMatchState(matchState);
  }, [setEminenceMatchState]);

  const resolveCardIdsAcrossArmies = useCallback((cardIds, fallbackArmy = null) => {
    if (!Array.isArray(cardIds)) return [];
    const armyNames = Object.keys(ARMY_SETS);
    return cardIds
      .map((cardId) => {
        // Estensione campagna: carte già assemblate (es. il Nascente, id 9001,
        // che non esiste in cards.js) passano come oggetti carta completi.
        if (cardId && typeof cardId === 'object') {
          return { ...cardId, army: cardId.army || fallbackArmy };
        }
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
   * @param {{ initiativeProfile?: 'assault'|'defense'|null, winCondition?: string, fields?: number, playerLife?: number, enemyLife?: number }|null} [campaignDuelMod] - campagna
   */
  const startGame = useCallback((selectedPlayerArmy, selectedDeckKey, mode = 'classic', difficulty = 'medium', allBattlefields, enemyArmy = null, enemyDeckKey = null, campaignDuelMod = null, startOptions = null) => {
    const skipShuffleDeal = startOptions?.skipShuffleDeal === true;
    const fixedHands = startOptions?.fixedHands ?? null;
    clearAiPendingDecision?.();
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
    
    // L'IA sceglie un deck random (o usa quello specificato per campagna:
    // chiave di ARMY_DECKS oppure array di card IDs per missione)
    let enemySet;
    if (Array.isArray(enemyDeckKey)) {
      enemySet = resolveCardIdsAcrossArmies(enemyDeckKey, enemyArmySelected);
    } else {
      let enemyDeckSelectedKey = enemyDeckKey;
      if (!enemyDeckSelectedKey) {
        const enemyDeckKeys = Object.keys(ARMY_DECKS[enemyArmySelected]);
        enemyDeckSelectedKey = enemyDeckKeys[Math.floor(Math.random() * enemyDeckKeys.length)];
      }
      const enemyDeck = ARMY_DECKS[enemyArmySelected][enemyDeckSelectedKey];
      enemySet = resolveCardIdsAcrossArmies(enemyDeck.cards, enemyArmySelected);
    }
    
    const deal = computeShuffleDealFromSets(
      playerSet,
      enemySet,
      playerArmy,
      enemyArmySelected,
      fixedHands
    );
    const { playerCardBack, enemyCardBack } = pickDistinctCardBackPair();
    const pHand = deal.playerHand;
    const eHand = deal.enemyHand;
    const pBonuses = deal.playerBonuses;
    const eBonuses = deal.enemyBonuses;

    setPlayerDeckVisual(buildDeckVisualIdentity(deal.playerSet, {
      fallbackArmy: deal.playerSet?.[0]?.army ?? playerArmy,
      armyColors: ARMY_COLORS,
    }));
    setEnemyDeckVisual(buildDeckVisualIdentity(deal.enemySet, {
      fallbackArmy: deal.enemySet?.[0]?.army ?? enemyArmySelected,
      armyColors: ARMY_COLORS,
    }));

    // L'eleggibilità si misura sul mazzo da 10, non sulla mano servita.
    initEminences(deal.playerSet, deal.enemySet, {
      ...startOptions,
      eminenceFormat: startOptions?.eminenceFormat ?? EMINENCE_FORMAT.REQUIRED,
    });

    if (!skipShuffleDeal) {
      const { playerShuffleKind, enemyShuffleKind } = resolveShuffleKindsForDuel();
      setShuffleDealSetup(attachShuffleDealVisuals({
        playerSet: deal.playerSet,
        enemySet: deal.enemySet,
        playerFinalOrder: deal.playerFinalOrder,
        enemyFinalOrder: deal.enemyFinalOrder,
        playerHand: pHand,
        enemyHand: eHand,
        playerBonuses: pBonuses,
        enemyBonuses: eBonuses,
        playerArmy,
        enemyArmy: enemyArmySelected,
        playerCardBack,
        enemyCardBack,
        playerShuffleKind,
        enemyShuffleKind,
      }, ARMY_COLORS));
      setPlayerArmyBonuses({});
      setEnemyArmyBonuses({});
      setPlayerHand([]);
      setEnemyHand([]);
    } else {
      setShuffleDealSetup(null);
      setPlayerArmyBonuses(pBonuses);
      setEnemyArmyBonuses(eBonuses);
      setPlayerHand(pHand);
      setEnemyHand(eHand);
    }
    
    // Estensioni campagna: numero Campi e PV per missione (default 5 / 25)
    const fields = selectBattlefields(mode, allBattlefields, {
      fieldCount: campaignDuelMod?.fields ?? undefined,
    });
    setBattlefields(fields);
    preloadBattlefieldImages(fields);
    setConqueredFields({});
    
    setPlayerHP(campaignDuelMod?.playerLife ?? 25);
    setEnemyHP(campaignDuelMod?.enemyLife ?? 25);
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
    setRevealedFields(mode === 'bareHands' ? fields.length : Math.min(3, fields.length));
    
    setSelectedAgent(null);
    setEnemyAgent(null);
    setEnemySelectedFocus(1);
    setCurrentFieldIndex(null);
    setBattleResult(null);
    setSelectedFocus(1);
    
    // Log iniziali (stringhe legacy + eventi strutturati usati dal LogPanel)
    setBattleEvents([]);
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
    setOpeningPlayerFirst(playerFirst);
    setIsPlayerFirst(playerFirst);
    
    // Aggiungi log per chi inizia (usa roundNumber = 1 per il formato)
    const startLog = playerFirst 
      ? `Lega ${playerLeague} vs ${enemyLeague}: Inizi tu!` 
      : `Lega ${playerLeague} vs ${enemyLeague}: Inizia l'IA!`;
    
    setLogs(prev => [...prev, `[R1] ${startLog}`]);
    
    setGamePhase(skipShuffleDeal ? 'selectField' : 'shuffleDeal');
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
    setOpeningPlayerFirst,
    setLogs,
    setBattleEvents,
    setCampaignDuelMod,
    setShuffleDealSetup,
    setPlayerDeckVisual,
    setEnemyDeckVisual,
    setShowClaimVictoryChoice,
    animations,
    clearAiPendingDecision,
    resolveCardIdsAcrossArmies,
    initEminences,
  ]);

  /**
   * Avvia partita online (stesso stato per host e guest; perspective = 'host' | 'guest').
   * @param {string} perspective
   * @param {Object} payload - output di buildOnlineMatchPayload
   */
  const startOnlineMatch = useCallback(
    (perspective, rawPayload) => {
      const payload = normalizeOnlineMatchPayload(rawPayload, ALL_BATTLEFIELDS);
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

      clearAiPendingDecision?.();
      setShowClaimVictoryChoice(null);
      setCampaignDuelMod(null);
      setGameMode(mode);
      setAiDifficulty('multiplayer');

      const shuffleSetup = buildShuffleDealSetupFromMatch(perspective, payload);
      const localPlayerSet = perspective === 'host' ? payload.hostPlayerSet : payload.hostEnemySet;
      const localEnemySet = perspective === 'host' ? payload.hostEnemySet : payload.hostPlayerSet;

      // Le Eminenze arrivano dal payload concordato: i due client devono partire dallo
      // stesso stato, quindi qui non si deduce nulla localmente.
      const onlineEminence = rawPayload?.eminence ?? payload.eminence ?? null;
      initEminences(localPlayerSet, localEnemySet, {
        eminenceFormat: onlineEminence?.format ?? null,
        playerEminenceId:
          perspective === 'host' ? onlineEminence?.hostEminenceId : onlineEminence?.guestEminenceId,
        enemyEminenceId:
          perspective === 'host' ? onlineEminence?.guestEminenceId : onlineEminence?.hostEminenceId,
      });

      if (shuffleSetup) {
        const enriched = attachShuffleDealVisuals(shuffleSetup, ARMY_COLORS);
        setShuffleDealSetup(enriched);
        setPlayerDeckVisual(enriched.playerDeckVisual);
        setEnemyDeckVisual(enriched.enemyDeckVisual);
        setPlayerArmyBonuses({});
        setEnemyArmyBonuses({});
        setPlayerHand([]);
        setEnemyHand([]);
      } else {
        setShuffleDealSetup(null);
        setPlayerDeckVisual(buildDeckVisualIdentity(localPlayerSet, {
          fallbackArmy: localPlayerSet?.[0]?.army ?? playerArmy,
          armyColors: ARMY_COLORS,
        }));
        setEnemyDeckVisual(buildDeckVisualIdentity(localEnemySet, {
          fallbackArmy: localEnemySet?.[0]?.army ?? enemyArmy,
          armyColors: ARMY_COLORS,
        }));
        const pBonuses = calcInitialBonuses(playerHand);
        const eBonuses = calcInitialBonuses(enemyHand);
        setPlayerArmyBonuses(pBonuses);
        setEnemyArmyBonuses(eBonuses);
        setPlayerHand(playerHand);
        setEnemyHand(enemyHand);
      }

      setBattlefields(battlefields);
      preloadBattlefieldImages(battlefields);
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
      setEnemySelectedFocus(1);
      setCurrentFieldIndex(null);
      setBattleResult(null);
      setSelectedFocus(1);

      const playerLeague = playerHand.reduce((sum, c) => sum + c.league, 0);
      const enemyLeague = enemyHand.reduce((sum, c) => sum + c.league, 0);

      setBattleEvents([]);
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

      setOpeningPlayerFirst(isPlayerFirst);
      setIsPlayerFirst(isPlayerFirst);
      setGamePhase(shuffleSetup ? 'shuffleDeal' : 'selectField');
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
      clearAiPendingDecision,
      setRoundNumber,
      setLastWinner,
      setPlayerToxin,
      setEnemyToxin,
      setRevealedFields,
      setSelectedAgent,
      setEnemyAgent,
      setEnemySelectedFocus,
      setCurrentFieldIndex,
      setBattleResult,
      setSelectedFocus,
      setLogs,
      setBattleEvents,
      setIsPlayerFirst,
      setOpeningPlayerFirst,
      setGamePhase,
      setCampaignDuelMod,
      setShuffleDealSetup,
      initEminences,
    ]
  );

  /**
   * Resetta il gioco al menu (pulisce anche agenti/risultati residui della partita abbandonata)
   */
  const resetToMenu = useCallback(() => {
    clearAiPendingDecision?.();
    setSelectedAgent(null);
    setEnemyAgent(null);
    setEnemySelectedFocus(1);
    setSelectedFocus(1);
    setCurrentFieldIndex(null);
    setBattleResult(null);
    setGameResult(null);
    setShowClaimVictoryChoice(null);
    setCampaignDuelMod(null);
    setShuffleDealSetup(null);
    setPlayerDeckVisual(null);
    setEnemyDeckVisual(null);
    setEminenceMatchState(null);
    setBattleEvents([]);
    setLogs([]);
    setGamePhase('menu');
  }, [
    clearAiPendingDecision,
    setSelectedAgent,
    setEnemyAgent,
    setEnemySelectedFocus,
    setSelectedFocus,
    setCurrentFieldIndex,
    setBattleResult,
    setGameResult,
    setShowClaimVictoryChoice,
    setCampaignDuelMod,
    setShuffleDealSetup,
    setPlayerDeckVisual,
    setEnemyDeckVisual,
    setEminenceMatchState,
    setBattleEvents,
    setLogs,
    setGamePhase,
  ]);

  return {
    startGame,
    startOnlineMatch,
    resetToMenu,
    selectBattlefields,
    shuffleArray,
  };
}

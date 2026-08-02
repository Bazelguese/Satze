import { useCallback, useState } from 'react';
import { calcInitialBonuses } from '../utils/onlineMatch';
import { preloadBattlefieldImages } from '../utils/preloadAssets';
import {
  GUIDED_ADVANCED_ROUNDS,
  GUIDED_DECKS,
  GUIDED_HANDS,
  GUIDED_INTRO_ROUNDS,
  ADV_STAGE_GOAL,
} from '../data/tutorialGuidedContent';
import {
  assertGuidedHandInDeck,
  buildGuidedHands,
  getTutorialBattlefields,
} from '../utils/guidedTutorialValidation';

export function useTutorialOrchestrator({
  tutorial,
  gameFlow,
  allAgents,
  allBattlefields,
  tutorialStepsByMode,
  tutorialDefaultMode,
  tutorialStepsFallback,
  setShowClaimVictoryChoice,
  setCampaignLevel,
  setCampaignDuelMod,
  setIsMultiplayer,
  setSelectedMode,
  setGameMode,
  setAiDifficulty,
  setPlayerHand,
  setEnemyHand,
  setPlayerArmyBonuses,
  setEnemyArmyBonuses,
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
  setRoundNumber,
  setLastWinner,
  setRevealedFields,
  setSelectedAgent,
  setEnemyAgent,
  setSelectedFocus,
  setEnemySelectedFocus,
  setCurrentFieldIndex,
  setBattleResult,
  setPlayerToxin,
  setEnemyToxin,
  setIsPlayerFirst,
  setOpeningPlayerFirst,
  setLogs,
  setBattleEvents,
  setGamePhase,
  setPlayerConfirmedAwaitingAI,
  resetAiSelectionRef,
}) {
  const [isTutorialSelectorOpen, setIsTutorialSelectorOpen] = useState(false);
  const [activeTutorialSteps, setActiveTutorialSteps] = useState(
    tutorialStepsByMode[tutorialDefaultMode] || tutorialStepsFallback
  );
  const [guidedMatch, setGuidedMatch] = useState({
    active: false,
    trackId: null,
    rounds: [],
    freePlay: false,
  });
  const [guidedHint, setGuidedHint] = useState('');
  const [guidedIntroStage, setGuidedIntroStage] = useState(0);
  const [guidedPause, setGuidedPause] = useState(null);

  const resetGuidedTutorial = useCallback(() => {
    setGuidedMatch({ active: false, trackId: null, rounds: [], freePlay: false });
    setGuidedHint('');
    setGuidedIntroStage(0);
    setGuidedPause(null);
  }, []);

  const openTutorialSelector = useCallback(() => {
    setIsTutorialSelectorOpen(true);
  }, []);

  const closeTutorialSelector = useCallback(() => {
    setIsTutorialSelectorOpen(false);
  }, []);

  const startGuidedMatch = useCallback((trackId) => {
    const handIds = GUIDED_HANDS[trackId];
    if (!handIds) {
      setLogs((prev) => [
        ...prev.slice(-50),
        `[GUIDA] Percorso "${trackId}" non supportato.`,
      ]);
      return;
    }

    let playerGuidedHand;
    let enemyGuidedHand;
    try {
      ({ player: playerGuidedHand, enemy: enemyGuidedHand } = buildGuidedHands(allAgents, handIds));
      const deckMeta = GUIDED_DECKS[trackId];
      assertGuidedHandInDeck(handIds.player, deckMeta.player);
      assertGuidedHandInDeck(handIds.enemy, deckMeta.enemy);
    } catch (err) {
      setLogs((prev) => [
        ...prev.slice(-50),
        `[GUIDA] ${err.message}`,
      ]);
      return;
    }

    const guidedFields = getTutorialBattlefields(allBattlefields);
    const rounds = trackId === 'advanced' ? GUIDED_ADVANCED_ROUNDS : GUIDED_INTRO_ROUNDS;

    if (playerGuidedHand.length < 3 || enemyGuidedHand.length < 3 || guidedFields.length < 3) {
      setLogs((prev) => [
        ...prev.slice(-50),
        '[GUIDA] Impossibile avviare la partita guidata: dati insufficienti.',
      ]);
      return;
    }

    setGuidedMatch({ active: true, trackId, rounds, freePlay: false });
    setGuidedHint('');
    setGuidedIntroStage(trackId === 'intro' ? 0 : ADV_STAGE_GOAL);
    setIsTutorialSelectorOpen(false);
    tutorial.closeTutorial();

    setShowClaimVictoryChoice(null);
    setCampaignLevel(null);
    setCampaignDuelMod(null);
    setIsMultiplayer(false);
    setSelectedMode('classic');
    setGameMode('classic');
    setAiDifficulty('medium');
    setPlayerHand(playerGuidedHand);
    setEnemyHand(enemyGuidedHand);
    setPlayerArmyBonuses(calcInitialBonuses(playerGuidedHand));
    setEnemyArmyBonuses(calcInitialBonuses(enemyGuidedHand));
    setBattlefields(guidedFields);
    preloadBattlefieldImages(guidedFields);
    setConqueredFields({});
    setPlayerHP(25);
    setEnemyHP(25);
    setPlayerFocus(18);
    setEnemyFocus(18);
    setPlayerUsedCards([]);
    setEnemyUsedCards([]);
    setCardBattleOutcomes({});
    setGameResult(null);
    setRoundNumber(1);
    setLastWinner(null);
    setRevealedFields(3);
    setSelectedAgent(null);
    setEnemyAgent(null);
    setSelectedFocus(1);
    setEnemySelectedFocus(1);
    setCurrentFieldIndex(null);
    setBattleResult(null);
    setPlayerToxin(null);
    setEnemyToxin(null);
    setOpeningPlayerFirst?.(true);
    setIsPlayerFirst(true);
    resetAiSelectionRef?.();
    setPlayerConfirmedAwaitingAI(false);
    setBattleEvents?.([]);
    setLogs([
      '🎯 Partita guidata avviata',
      `📘 Percorso: ${trackId === 'advanced' ? 'Avanzato' : 'Introduttivo'}`,
      `🛡️ Tu: ${GUIDED_DECKS[trackId].player.army} — "${GUIDED_DECKS[trackId].player.name}"`,
      `⚔️ Nemico: ${GUIDED_DECKS[trackId].enemy.army} — "${GUIDED_DECKS[trackId].enemy.name}"`,
      '[R1] Segui le istruzioni in alto: ogni scelta viene validata.',
      trackId === 'intro'
        ? '[R1] Intro completa: PV, FC, agenti, campi, iniziativa e duello passo-passo.'
        : '[R1] Avanzato: timing, spendibilità valore e gestione risorse.',
    ]);
    setGamePhase('selectField');
  }, [
    allAgents,
    allBattlefields,
    tutorial,
    setLogs,
    setBattleEvents,
    setShowClaimVictoryChoice,
    setCampaignLevel,
    setCampaignDuelMod,
    setIsMultiplayer,
    setSelectedMode,
    setGameMode,
    setAiDifficulty,
    setPlayerHand,
    setEnemyHand,
    setPlayerArmyBonuses,
    setEnemyArmyBonuses,
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
    setRoundNumber,
    setLastWinner,
    setRevealedFields,
    setSelectedAgent,
    setEnemyAgent,
    setSelectedFocus,
    setEnemySelectedFocus,
    setCurrentFieldIndex,
    setBattleResult,
    setPlayerToxin,
    setEnemyToxin,
    setIsPlayerFirst,
    setOpeningPlayerFirst,
    setPlayerConfirmedAwaitingAI,
    setGamePhase,
    resetAiSelectionRef,
  ]);

  const handleTutorialTrackSelect = useCallback((mode) => {
    if (mode === 'intro' || mode === 'advanced') {
      startGuidedMatch(mode);
      return;
    }
    const steps = tutorialStepsByMode[mode] || tutorialStepsFallback;
    resetGuidedTutorial();
    setActiveTutorialSteps(steps);
    setIsTutorialSelectorOpen(false);
    tutorial.startTutorial();
  }, [startGuidedMatch, tutorialStepsByMode, tutorialStepsFallback, resetGuidedTutorial, tutorial]);

  const startStandardGame = useCallback((...args) => {
    resetGuidedTutorial();
    tutorial.closeTutorial();
    setIsTutorialSelectorOpen(false);
    gameFlow.startGame(...args);
  }, [resetGuidedTutorial, tutorial, gameFlow]);

  const enableGuidedFreePlay = useCallback(() => {
    setGuidedMatch((prev) => ({ ...prev, freePlay: true }));
    setGuidedIntroStage(9);
    setGuidedHint('');
    setLogs((prev) => [
      ...prev.slice(-80),
      '[GUIDA] Round 4–5 liberi: nessuna validazione, vittoria attiva.',
    ]);
  }, [setLogs]);

  const finishGuidedTutorial = useCallback((trackId) => {
    tutorial.completeTutorial(trackId);
    resetGuidedTutorial();
    setGamePhase('menu');
  }, [tutorial, resetGuidedTutorial, setGamePhase]);

  return {
    isTutorialSelectorOpen,
    activeTutorialSteps,
    guidedMatch,
    guidedHint,
    guidedIntroStage,
    guidedPause,
    setGuidedHint,
    setGuidedIntroStage,
    setGuidedPause,
    setGuidedMatch,
    openTutorialSelector,
    closeTutorialSelector,
    handleTutorialTrackSelect,
    startStandardGame,
    resetGuidedTutorial,
    enableGuidedFreePlay,
    finishGuidedTutorial,
  };
}

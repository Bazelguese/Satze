import { useCallback, useState } from 'react';
import { calcInitialBonuses } from '../utils/onlineMatch';
import { preloadBattlefieldImages } from '../utils/preloadAssets';

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
  setLogs,
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
  });
  const [guidedHint, setGuidedHint] = useState('');
  const [guidedIntroStage, setGuidedIntroStage] = useState(0);

  const resetGuidedTutorial = useCallback(() => {
    setGuidedMatch({ active: false, trackId: null, rounds: [] });
    setGuidedHint('');
    setGuidedIntroStage(0);
  }, []);

  const openTutorialSelector = useCallback(() => {
    setIsTutorialSelectorOpen(true);
  }, []);

  const closeTutorialSelector = useCallback(() => {
    setIsTutorialSelectorOpen(false);
  }, []);

  const startGuidedMatch = useCallback((trackId) => {
    const orderedAgents = [...allAgents]
      .filter((agent) => agent && typeof agent.id === 'number')
      .sort((a, b) => a.id - b.id);
    const playerGuidedHand = orderedAgents.slice(0, 5).map((card) => ({ ...card }));
    const enemyGuidedHand = orderedAgents.slice(5, 10).map((card) => ({ ...card }));
    const guidedFields = [...allBattlefields].slice(0, 5);

    if (playerGuidedHand.length < 3 || enemyGuidedHand.length < 3 || guidedFields.length < 3) {
      setLogs((prev) => [
        ...prev.slice(-50),
        '[GUIDA] Impossibile avviare la partita guidata: dati insufficienti.',
      ]);
      return;
    }

    const rounds = trackId === 'advanced'
      ? [
          { round: 1, fieldIndex: 1, playerAgentId: playerGuidedHand[1].id, focus: 2, enemyAgentId: enemyGuidedHand[1].id, enemyFocus: 3 },
          { round: 2, fieldIndex: 2, playerAgentId: playerGuidedHand[2].id, focus: 2, enemyAgentId: enemyGuidedHand[2].id, enemyFocus: 1 },
        ]
      : [
          { round: 1, fieldIndex: 0, playerAgentId: playerGuidedHand[0].id, focus: 3, enemyAgentId: enemyGuidedHand[0].id, enemyFocus: 2 },
          { round: 2, fieldIndex: 1, playerAgentId: playerGuidedHand[1].id, focus: 2, enemyAgentId: enemyGuidedHand[1].id, enemyFocus: 3 },
          { round: 3, fieldIndex: 2, playerAgentId: playerGuidedHand[2].id, focus: 4, enemyAgentId: enemyGuidedHand[2].id, enemyFocus: 2 },
        ];

    setGuidedMatch({ active: true, trackId, rounds });
    setGuidedHint('');
    setGuidedIntroStage(trackId === 'intro' ? 0 : 3);
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
    setIsPlayerFirst(true);
    resetAiSelectionRef?.();
    setPlayerConfirmedAwaitingAI(false);
    setLogs([
      '🎯 Partita guidata avviata',
      `📘 Percorso: ${trackId === 'advanced' ? 'Avanzato' : 'Introduttivo'}`,
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

  return {
    isTutorialSelectorOpen,
    activeTutorialSteps,
    guidedMatch,
    guidedHint,
    guidedIntroStage,
    setGuidedHint,
    setGuidedIntroStage,
    setGuidedMatch,
    openTutorialSelector,
    closeTutorialSelector,
    handleTutorialTrackSelect,
    startStandardGame,
    resetGuidedTutorial,
  };
}

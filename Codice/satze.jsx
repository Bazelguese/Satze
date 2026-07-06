import React, { useState, useEffect, useCallback, useMemo, useRef, startTransition } from 'react';
import { createPortal } from 'react-dom';
import { formatAbilityHelper, generateFieldParticles, FIELD_STYLES } from '../src/utils';
import { FocusCoinSelector, LogPanel, StatsPanel, Icon } from '../src/components/ui';
import { CardReworkP4AsHtml, CardImage, Hand, GameCard } from '../src/components/cards';
import { CardTagsRow } from '../src/components/cards/CardTagBadges';
import { getCardTags } from '../src/data/cardTags';
import { MiniBattlefield, BattlefieldBackground, BattlefieldPanel } from '../src/components/battle';
import { DuelResultEnemyResultBody, DuelResultPlayerResultBody } from '../src/components/battle/DuelResultDuelBodies';
import { DuelClashAuroraSequence } from '../src/components/battle/DuelClashAuroraSequence';
import { ARMY_COLORS, ARMY_BONUSES, TRIGGER_NAMES, TRIGGER_DESCRIPTIONS, getAbilityExplanation, ARMY_SETS, ARMY_DECKS, ALL_AGENTS, ALL_BATTLEFIELDS, CARD_IMAGES, AGENT_IMAGES, getBattlefieldAnimationType, markCampaignMissionStarted } from '../src/data';
import { loadCampaignProgress } from '../src/data/campaign';
import { totalLeagueForCampaignDeck } from '../src/game/campaign/campaignDeckLogic.js';
import { applyToxin } from '../src/game/toxinLogic';
import { checkTrigger } from '../src/game/triggerLogic';
import { countAttritionPriorCards, countInitialLeagueCards } from '../src/game/duel/duelHelpers.js';
import { useGameState, useAnimations, useBattle, useDragAndDrop, useGameFlow, useAI, useTutorial, useCampaignGameOutcome, useGuidedTutorialFlow, useTutorialOrchestrator } from '../src/hooks';
import {
  Tutorial,
  TutorialSelector,
  GuidedTutorialOverlay,
  TUTORIAL_STEPS,
  TUTORIAL_STEPS_BY_MODE,
  TUTORIAL_STEPS_DEFAULT_MODE,
  TUTORIAL_TRACKS,
} from '../src/components/tutorial';
import { Glossary } from '../src/components/Glossary';
import { getAllDifficulties, DIFFICULTY_NAMES } from '../src/utils';
import { CampaignWarHub } from '../src/components/campaign/CampaignWarHub';
import { CampaignSaveSlots } from '../src/components/campaign/CampaignSaveSlots';
import { buildCampaignDuelLaunchConfig } from '../src/game/campaign/campaignDuelAdapter.js';
import { MultiplayerLobby } from '../src/components/multiplayer/MultiplayerLobby';
import { SatzeMenuPrototype, MenuScreenLayout, MenuCard, MenuBackButton, PALETTE, MENU_ACCENTS, HUD_ORATORIO_FONT_UI } from '../src/components/menu';
import { useTransitionedSetGamePhase } from '../src/components/cosmic/ScreenTransition';
import DeckSelectCosmic from '../src/components/cosmic/DeckSelectCosmic.jsx';
import DeckPreviewCosmic from '../src/components/cosmic/DeckPreviewCosmic.jsx';
import { DECK_SUMMARY_BG_POSITION } from '../src/data/deckSummaryCropConfig';
import { CosmicScreenLayout } from '../src/components/menu/cosmic/CosmicScreenLayout';
import ArmySelectCinematic from '../src/components/menu/cosmic/ArmySelectCinematic.jsx';
import { CosmicDeckCarousel } from '../src/components/menu/cosmic/CosmicDeckCarousel';
import { CosmicBannerButton } from '../src/components/menu/cosmic/CosmicBannerButton';
import { CosmicDeckManagerList } from '../src/components/menu/cosmic/CosmicDeckManagerList';
import { CosmicDeckBuilderWrapper } from '../src/components/menu/cosmic/CosmicDeckBuilderWrapper';
import { BattlefieldGallery } from '../src/components/gallery/BattlefieldGallery';
import { BattlefieldReveal } from '../src/components/gallery/BattlefieldRevealAnimations';
import { PlaytestHistoryScreen } from '../src/components/playtest/PlaytestHistoryScreen';
import { GAME_MODES } from '../src/data/gameModes';
import { loadCustomDecks, isMixedDeck, resolveDeckCards, getHandAccentColor } from '../src/utils/deckManager';
import { appendPlaytestRecord } from '../src/utils/playtestHistory';
import { getMultiplayerManager } from '../src/utils/multiplayer';
import { clearMpSession, persistMpSession, reconnectToRoom } from '../src/utils/multiplayerReconnect';
import { buildOnlineMatchPayload } from '../src/utils/onlineMatch';
import { resolveDeckCardsForArmy } from '../src/utils/deckResolve';
import { getDuelVisualConfig } from '../src/config/duelVisualConfigStore.js';
import { DUEL_VFX_CHANGED_EVENT } from '../src/config/duelVisualConfig.js';
import { buildPhaseAdvanceDelaysMs, countDuelPhase3SubSteps } from '../src/config/duelVisualTimeline.js';
import { countDuelEffectSteps, countDuelPostEffectSteps } from '../src/game/duel/duelVisualSteps.js';
import { DUEL_VISUAL_DEFAULTS } from '../src/config/duelVisualConfig.js';
import { useSafeDuelEffectStep } from '../src/components/battle/useSafeDuelEffectStep.js';
import { getFocusCoinGlowColor as computeFocusCoinGlowColor } from '../src/utils/focusCoinGlow.js';

// ============================================
// SATZE - Componente principale del gioco
// Grafica cosmica, menu prototipo, layout 1920x1080
// ============================================


// ============================================
// COMPONENTI UI
// ============================================
// Componenti Card, HandCard, MiniBattlefield - Importati da src/components
// ============================================
// LOGICA DI GIOCO
// ============================================

// ============================================
// COMPONENTE PRINCIPALE
// ============================================

export default function SatzeGame() {
  // Usa gli hooks personalizzati per gestire stato e animazioni
  const gameState = useGameState();
  const animations = useAnimations();
  
  // Estrai gli stati dal gameState per compatibilità con il codice esistente
  const {
    gamePhase, setGamePhase: setGamePhaseRaw,
    gameMode, setGameMode,
    playerHand, setPlayerHand,
    enemyHand, setEnemyHand,
    battlefields, setBattlefields,
    conqueredFields, setConqueredFields,
    playerHP, setPlayerHP,
    enemyHP, setEnemyHP,
    playerFocus, setPlayerFocus,
    enemyFocus, setEnemyFocus,
    currentFieldIndex, setCurrentFieldIndex,
    selectedAgent, setSelectedAgent,
    selectedFocus, setSelectedFocus,
    enemyAgent, setEnemyAgent,
    enemySelectedFocus, setEnemySelectedFocus,
    playerUsedCards, setPlayerUsedCards,
    enemyUsedCards, setEnemyUsedCards,
    cardBattleOutcomes, setCardBattleOutcomes,
    isPlayerFirst, setIsPlayerFirst,
    battleResult, setBattleResult,
    logs, setLogs,
    roundNumber, setRoundNumber,
    lastWinner, setLastWinner,
    revealedFields, setRevealedFields,
    gameResult, setGameResult,
    playerArmyBonuses, setPlayerArmyBonuses,
    enemyArmyBonuses, setEnemyArmyBonuses,
    playerToxin, setPlayerToxin,
    enemyToxin, setEnemyToxin,
    hoveredCard, setHoveredCard,
    hoveredField, setHoveredField,
    showGlossary, setShowGlossary,
    galleryTab, setGalleryTab,
    selectedArmyFilter, setSelectedArmyFilter,
    galleryCardLayout, setGalleryCardLayout,
    draggingCard, setDraggingCard,
    selectedMode, setSelectedMode,
    selectedArmy, setSelectedArmy,
    dragPosition, setDragPosition,
    isOverDropZone, setIsOverDropZone,
    selectedDeckKey, setSelectedDeckKey,
    aiDifficulty, setAiDifficulty,
    isMultiplayer, setIsMultiplayer,
    multiplayerSession, setMultiplayerSession,
    campaignLevel, setCampaignLevel,
    campaignSaveSlot,
    setCampaignSaveSlot,
    showDeckManager, setShowDeckManager,
    deckManagerView, setDeckManagerView,
    deckManagerSource, setDeckManagerSource,
    editingDeckId, setEditingDeckId,
    showClaimVictoryChoice, setShowClaimVictoryChoice,
    campaignDuelMod,
    setCampaignDuelMod,
  } = gameState;

  useCampaignGameOutcome({ gamePhase, campaignLevel, gameResult, campaignSaveSlot });

  const setGamePhaseAnimated = useTransitionedSetGamePhase(setGamePhaseRaw, gamePhase);
  const setGamePhaseFromMainMenu = useCallback((nextPhase) => {
    if (typeof nextPhase !== 'string') {
      setGamePhaseRaw(nextPhase);
      return;
    }
    // Regola richiesta: animazione quando clicchi i bottoni del menu principale.
    setGamePhaseAnimated(nextPhase);
  }, [setGamePhaseAnimated, setGamePhaseRaw]);
  const setGamePhase = useCallback((nextPhase) => {
    if (typeof nextPhase !== 'string') {
      setGamePhaseRaw(nextPhase);
      return;
    }
    // Regola richiesta: animazione quando si torna al menu principale.
    if (nextPhase === 'menu' && gamePhase !== 'menu') {
      setGamePhaseAnimated(nextPhase);
      return;
    }
    setGamePhaseRaw(nextPhase);
  }, [gamePhase, setGamePhaseAnimated, setGamePhaseRaw]);

  // Helper: valore attuale per Attrizione/Escalation (solo carte del proprietario per Attrizione)
  const getAbilityCurrentValue = useCallback((agent, isPlayer) => {
    if (!agent?.ability) return null;
    const ab = agent.ability;
    if (ab.effect === 'attrition' && ab.value) {
      const used = isPlayer ? (playerUsedCards || []) : (enemyUsedCards || []);
      const alreadyPlayed = countAttritionPriorCards(used, agent.id);
      return ab.value * alreadyPlayed;
    }
    if (ab.effect === 'escalation' && ab.value) {
      const fields = Object.values(conqueredFields || {}).filter(f =>
        typeof f === 'object' && f?.winner === (isPlayer ? 'player' : 'enemy')
      ).length;
      return ab.value * fields;
    }
    return null;
  }, [playerUsedCards.length, enemyUsedCards.length, conqueredFields]);

  // Galleria: differisci il rendering pesante di un frame per mantenere l'UI reattiva
  useEffect(() => {
    if (gamePhase === 'gallery') {
      const id = requestAnimationFrame(() => {
        requestAnimationFrame(() => setGalleryContentReady(true));
      });
      return () => cancelAnimationFrame(id);
    } else {
      setGalleryContentReady(false);
      setAgentsTabReady(false);
    }
  }, [gamePhase]);

  // Tab Agenti: differisci la griglia pesante quando si passa da Campi ad Agenti
  useEffect(() => {
    if (gamePhase === 'gallery' && galleryTab === 'agents') {
      setAgentsTabReady(false);
      const id = requestAnimationFrame(() => {
        requestAnimationFrame(() => setAgentsTabReady(true));
      });
      return () => cancelAnimationFrame(id);
    } else if (galleryTab === 'battlefields') {
      setAgentsTabReady(false);
    }
  }, [gamePhase, galleryTab]);
  
  // Galleria: contenuto pesante renderizzato dopo un frame per evitare freeze
  const [galleryContentReady, setGalleryContentReady] = useState(false);
  // Tab Agenti: griglia di 100+ carte molto pesante, differita al cambio tab
  const [agentsTabReady, setAgentsTabReady] = useState(false);
  // Ultima carta mostrata nell'anteprima (rimane visibile quando il mouse esce)
  const [lastPreviewCard, setLastPreviewCard] = useState(null);
  // Tilt Tabellone: una volta che il cursore ci passa sopra, si ferma e non riparte
  const [tabelloneTiltDismissed, setTabelloneTiltDismissed] = useState(false);
  
  // Stato per modal carta ingrandita nella galleria
  const [selectedCardForModal, setSelectedCardForModal] = useState(null);
  const [previewDeckData, setPreviewDeckData] = useState(null);

  // Galleria: numero di carte renderizzate (incrementale, evita 200+ carte nel DOM)
  const GALLERY_PAGE_SIZE = 48;
  const [galleryVisibleCount, setGalleryVisibleCount] = useState(GALLERY_PAGE_SIZE);
  useEffect(() => {
    setGalleryVisibleCount(GALLERY_PAGE_SIZE);
  }, [selectedArmyFilter, galleryTab, gamePhase]);
  
  // Gestione chiusura modal con ESC
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && selectedCardForModal) {
        setSelectedCardForModal(null);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [selectedCardForModal]);
  
  // Estrai gli stati delle animazioni
  const {
    playerFocusCoinsShown, setPlayerFocusCoinsShown,
    enemyFocusCoinsShown, setEnemyFocusCoinsShown,
    cardGlowIntensity, setCardGlowIntensity,
    playerCardGlow, setPlayerCardGlow,
    enemyCardGlow, setEnemyCardGlow,
    duelPhase, setDuelPhase,
    duelEffectStep, setDuelEffectStep,
    isZoomed, setIsZoomed,
    showFinalRoundAnimation, setShowFinalRoundAnimation,
    showClashAnimation, setShowClashAnimation,
    rainbowTime, setRainbowTime,
  } = animations;

  const [duelVfxRev, setDuelVfxRev] = useState(0);
  useEffect(() => {
    const on = () => setDuelVfxRev((r) => r + 1);
    window.addEventListener(DUEL_VFX_CHANGED_EVENT, on);
    return () => window.removeEventListener(DUEL_VFX_CHANGED_EVENT, on);
  }, []);
  const duelVfx = useMemo(() => getDuelVisualConfig(), [duelVfxRev]);

  const { visualEffectStep, advanceEffectStep } = useSafeDuelEffectStep(
    duelPhase,
    duelEffectStep,
    setDuelEffectStep
  );

  // Hook per la logica di battaglia
  const { resolveBattle } = useBattle(gameState, animations);
  
  // Hook per il flusso del gioco
  const gameFlow = useGameFlow(gameState, animations);
  const { startOnlineMatch } = gameFlow;

  const isOnlinePvP = aiDifficulty === 'multiplayer';

  const [onlineLocalReady, setOnlineLocalReady] = useState(false);
  const [onlinePeerDeck, setOnlinePeerDeck] = useState(null);
  const [pendingGuestMatch, setPendingGuestMatch] = useState(null);
  /** Coda relay peer_move: un solo messaggio non può essere sovrascritto (field poi agent). */
  const [incomingPeerMoveQueue, setIncomingPeerMoveQueue] = useState([]);
  const [onlineOpponentLeft, setOnlineOpponentLeft] = useState(false);
  /** Connessione WebSocket persa (rete / refresh): mostra pulsante Riconnetti */
  const [mpConnectionLost, setMpConnectionLost] = useState(false);
  /** L'avversario è temporaneamente offline ma può tornare */
  const [mpOpponentAway, setMpOpponentAway] = useState(false);
  const [mpReconnecting, setMpReconnecting] = useState(false);
  const [mpReconnectError, setMpReconnectError] = useState('');
  const onlineMatchStartedRef = useRef(false);
  const playtestAutoSavedRef = useRef(false);
  const multiplayerSessionRef = useRef(multiplayerSession);
  useEffect(() => {
    multiplayerSessionRef.current = multiplayerSession;
  }, [multiplayerSession]);

  const goAfterDeckSelection = useCallback(() => {
    if (isMultiplayer && selectedMode === 'multiplayer') {
      setOnlineLocalReady(false);
      setOnlinePeerDeck(null);
      onlineMatchStartedRef.current = false;
      setPendingGuestMatch(null);
      setIncomingPeerMoveQueue([]);
      setGamePhase('onlineDeckReady');
    } else {
      setGamePhase('selectDifficulty');
    }
  }, [isMultiplayer, selectedMode, setGamePhase]);

  /** Campagna Figli: dopo armata si salta la selezione deck se il mazzo hub è valido. */
  const selectArmyAndContinue = useCallback(
    (army) => {
      setSelectedArmy(army);
      if (
        selectedMode === 'campaign' &&
        campaignLevel?.playerArmy === "Figli dell'Orizzonte" &&
        army === "Figli dell'Orizzonte"
      ) {
        const prog = loadCampaignProgress(campaignSaveSlot);
        const ids = prog.meta?.activeDeckCardIds;
        const ok =
          Array.isArray(ids) &&
          ids.length >= 3 &&
          ids.length <= 10 &&
          totalLeagueForCampaignDeck(ids, "Figli dell'Orizzonte") <= 30;
        if (ok) {
          setSelectedDeckKey(ids);
          setGamePhase('selectDifficulty');
          return;
        }
      }
      setGamePhase('selectDeck');
    },
    [selectedMode, campaignLevel, campaignSaveSlot, setSelectedArmy, setSelectedDeckKey, setGamePhase]
  );

  useEffect(() => {
    if (!multiplayerSession?.roomCode) return;
    const mgr = getMultiplayerManager();
    return mgr.onMessage((msg) => {
      if (msg.type === 'peer_left') {
        clearMpSession();
        setMpOpponentAway(false);
        setMpConnectionLost(false);
        setOnlineOpponentLeft(true);
        setLogs((prev) => [...prev.slice(-200), "[!] L'avversario ha lasciato la stanza (tempo scaduto o uscita)."]);
        return;
      }
      if (msg.type === 'peer_disconnected') {
        setMpOpponentAway(true);
        setLogs((prev) => [...prev.slice(-200), '[…] Connessione avversaria interrotta: in attesa di riconnessione.']);
        return;
      }
      if (msg.type === 'peer_rejoined') {
        setMpOpponentAway(false);
        setLogs((prev) => [...prev.slice(-200), "[+] L'avversario si è riconnesso."]);
        return;
      }
      if (msg.type === 'reconnected') {
        setMpConnectionLost(false);
        setMpReconnectError('');
        setLogs((prev) => [...prev.slice(-200), '[+] Riconnesso al server multiplayer.']);
        return;
      }
      if (msg.type === 'disconnected' && !msg.intentional) {
        const s = multiplayerSessionRef.current;
        if (s?.reconnectSecret && s?.roomCode) {
          setMpConnectionLost(true);
          setLogs((prev) => [...prev.slice(-200), '[!] Connessione al server persa. Puoi riconnetterti.']);
        }
        return;
      }
      if (msg.type !== 'relay' || !msg.payload) return;
      const p = msg.payload;
      if (p.type === 'deck_ready') {
        setOnlinePeerDeck({
          army: p.army,
          deckKey: p.deckKey,
          ...(Array.isArray(p.deckCardIds) && p.deckCardIds.length ? { deckCardIds: p.deckCardIds } : {}),
        });
      }
      if (p.type === 'match_start' && p.match) {
        setPendingGuestMatch(p.match);
      }
      if (p.type === 'peer_move') {
        setIncomingPeerMoveQueue((prev) => [...prev.slice(-49), p]);
      }
    });
  }, [multiplayerSession?.roomCode]);

  useEffect(() => {
    if (multiplayerSession?.roomCode && multiplayerSession?.reconnectSecret) {
      persistMpSession(multiplayerSession);
    }
  }, [multiplayerSession]);

  const attemptMpSelfReconnect = useCallback(async () => {
    const s = multiplayerSessionRef.current;
    if (!s?.reconnectSecret || !s?.roomCode) return;
    setMpReconnecting(true);
    setMpReconnectError('');
    try {
      await reconnectToRoom(s);
      setMpConnectionLost(false);
      persistMpSession(s);
    } catch (e) {
      const msgText = e?.message || 'Errore di riconnessione';
      setMpReconnectError(msgText);
      if (/non trovata|non valida|Riconnessione non valida|Timeout/i.test(msgText)) {
        clearMpSession();
      }
    } finally {
      setMpReconnecting(false);
    }
  }, []);

  const abandonMultiplayerSession = useCallback(() => {
    setMpConnectionLost(false);
    setMpOpponentAway(false);
    setMpReconnectError('');
    setOnlineOpponentLeft(false);
    onlineMatchStartedRef.current = false;
    setPendingGuestMatch(null);
    setIncomingPeerMoveQueue([]);
    setMultiplayerSession(null);
    setIsMultiplayer(false);
    clearMpSession();
    getMultiplayerManager().disconnect({ intentional: true });
    setGamePhase('menu');
  }, [setMultiplayerSession, setIsMultiplayer, setGamePhase]);

  useEffect(() => {
    if (!pendingGuestMatch || multiplayerSession?.role !== 'guest') return;
    if (gamePhase !== 'onlineDeckReady') return;
    startOnlineMatch('guest', pendingGuestMatch);
    setPendingGuestMatch(null);
    setGamePhase('selectField');
  }, [pendingGuestMatch, gamePhase, multiplayerSession?.role, startOnlineMatch, setGamePhase]);

  useEffect(() => {
    if (gamePhase !== 'onlineDeckReady' || multiplayerSession?.role !== 'host') return;
    if (!onlineLocalReady || !onlinePeerDeck) return;
    if (onlineMatchStartedRef.current) return;
    if (!getMultiplayerManager().isConnected()) {
      alert('Connessione al server multiplayer assente. Usa «Riconnetti» se compare, altrimenti torna al menu e rientra in stanza.');
      return;
    }
    onlineMatchStartedRef.current = true;
    try {
      const seed = (Date.now() ^ (Math.random() * 0x7fffffff)) >>> 0;
      const guestDeckSource =
        Array.isArray(onlinePeerDeck.deckCardIds) && onlinePeerDeck.deckCardIds.length
          ? onlinePeerDeck.deckCardIds
          : onlinePeerDeck.deckKey;
      const match = buildOnlineMatchPayload(
        selectedArmy,
        selectedDeckKey,
        onlinePeerDeck.army,
        guestDeckSource,
        selectedMode,
        seed,
        ALL_BATTLEFIELDS
      );
      startOnlineMatch('host', match);
      getMultiplayerManager().sendRelay(multiplayerSession.roomCode, { type: 'match_start', match });
      setGamePhase('selectField');
    } catch (e) {
      console.error('[multiplayer] avvio partita host:', e);
      onlineMatchStartedRef.current = false;
      alert(
        `Errore avvio partita: ${e?.message || e}\n\nSe usate eserciti personalizzati, aggiorna entrambi i client: l'host deve ricevere l'elenco carte dall'ospite.`
      );
    }
  }, [
    gamePhase,
    multiplayerSession,
    onlineLocalReady,
    onlinePeerDeck,
    selectedArmy,
    selectedDeckKey,
    selectedMode,
    startOnlineMatch,
    setGamePhase,
  ]);
  
  // Hook per l'IA
  const ai = useAI(gameState);
  
  // Hook per il tutorial
  const tutorial = useTutorial();
  const [playerConfirmedAwaitingAI, setPlayerConfirmedAwaitingAI] = useState(false);
  
  // Ref per tracciare se l'IA ha già selezionato l'agente in questo round
  const aiHasSelectedAgent = useRef(false);
  const fcPanelRef = useRef(null);
  const playerCardZoneRef = useRef(null);
  const selectedCardInHandRef = useRef(null);
  const glossaryButtonRef = useRef(null);
  const {
    isTutorialSelectorOpen,
    activeTutorialSteps,
    guidedMatch,
    guidedHint,
    guidedIntroStage,
    setGuidedHint,
    setGuidedIntroStage,
    openTutorialSelector,
    closeTutorialSelector,
    handleTutorialTrackSelect,
    startStandardGame,
    resetGuidedTutorial,
  } = useTutorialOrchestrator({
    tutorial,
    gameFlow,
    allAgents: ALL_AGENTS,
    allBattlefields: ALL_BATTLEFIELDS,
    tutorialStepsByMode: TUTORIAL_STEPS_BY_MODE,
    tutorialDefaultMode: TUTORIAL_STEPS_DEFAULT_MODE,
    tutorialStepsFallback: TUTORIAL_STEPS,
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
    resetAiSelectionRef: () => {
      aiHasSelectedAgent.current = false;
    },
  });

  const {
    currentGuidedRound,
    isGuidedIntroWelcomePhase,
    isGuidedIntroHandsPhase,
    isGuidedIntroCardPickPhase,
    isGuidedIntroPreviewPhase,
    isGuidedIntroGlossaryPromptPhase,
    isGuidedIntroGlossaryOpenPhase,
    isGuidedIntroBattlefieldsPhase,
    shouldHideHandsForGuidedSetup,
    guidedIntroTargetCardId,
    guidedIntroTargetCardName,
    showGuidedTrianglesHighlight,
    guidedInstruction,
    guidedCallouts,
    handleGuidedIntroContinue,
  } = useGuidedTutorialFlow({
    guidedMatch,
    guidedIntroStage,
    setGuidedIntroStage,
    setGuidedHint,
    gamePhase,
    roundNumber,
    battlefields,
    playerHand,
    enemyHand,
    selectedAgent,
    selectedFocus,
    battleResult,
  });

  // Preview solo al click (toggle: stesso click = nascondi)
  const handleCardPreviewClick = useCallback((data) => {
    if (
      guidedMatch.active &&
      guidedMatch.trackId === 'intro' &&
      gamePhase === 'selectField' &&
      guidedIntroStage === 2 &&
      data?.isPlayer
    ) {
      if (data?.agent?.id === guidedIntroTargetCardId) {
        setGuidedIntroStage(3);
        setGuidedHint('');
      } else {
        setGuidedHint(`Per questo step clicca "${guidedIntroTargetCardName}".`);
      }
    }
    setHoveredCard((prev) => {
      if (data && prev?.agent?.id === data.agent?.id) return null;
      return data;
    });
    setLastPreviewCard((prev) => {
      if (data && prev?.agent?.id === data.agent?.id) return null;
      return data;
    });
  }, [
    guidedMatch.active,
    guidedMatch.trackId,
    gamePhase,
    guidedIntroStage,
    guidedIntroTargetCardId,
    guidedIntroTargetCardName,
    setGuidedIntroStage,
    setGuidedHint,
  ]);

  const handleGlossaryButtonClick = useCallback(() => {
    if (guidedMatch.active && guidedMatch.trackId === 'intro' && gamePhase === 'selectField') {
      if (guidedIntroStage < 4) {
        setGuidedHint('Prima completa i passaggi precedenti.');
        return;
      }
      if (guidedIntroStage === 4) {
        setShowGlossary(true);
        setGuidedIntroStage(5);
        setGuidedHint('');
        return;
      }
      if (guidedIntroStage === 5) {
        return;
      }
    }
    setShowGlossary((prev) => !prev);
  }, [guidedMatch.active, guidedMatch.trackId, gamePhase, guidedIntroStage, setGuidedHint, setGuidedIntroStage, setShowGlossary]);

  const handleGlossaryClose = useCallback(() => {
    setShowGlossary(false);
    if (guidedMatch.active && guidedMatch.trackId === 'intro' && gamePhase === 'selectField' && guidedIntroStage === 5) {
      setGuidedIntroStage(6);
      setGuidedHint('');
    }
  }, [setShowGlossary, guidedMatch.active, guidedMatch.trackId, gamePhase, guidedIntroStage, setGuidedIntroStage, setGuidedHint]);

  // Auto-save singolo per ogni fine partita.
  useEffect(() => {
    if (gamePhase !== 'gameOver') {
      playtestAutoSavedRef.current = false;
      return;
    }
    if (playtestAutoSavedRef.current || !gameResult) return;

    const playerDeckLabel = Array.isArray(selectedDeckKey)
      ? 'campaign_inline'
      : (selectedDeckKey || 'unknown');
    const enemyArmy = enemyHand?.[0]?.army || null;

    appendPlaytestRecord({
      mode: selectedMode || gameMode || 'classic',
      difficulty: aiDifficulty || null,
      playerArmy: selectedArmy || playerHand?.[0]?.army || null,
      playerDeck: playerDeckLabel,
      enemyArmy,
      enemyDeck: null,
      winner: gameResult.winner || null,
      reason: gameResult.reason || null,
      playerHP,
      enemyHP,
      playerFields: gameResult.playerFields ?? null,
      enemyFields: gameResult.enemyFields ?? null,
      roundsPlayed: roundNumber ?? null,
      notes: '',
    });

    playtestAutoSavedRef.current = true;
  }, [
    gamePhase,
    gameResult,
    selectedMode,
    gameMode,
    aiDifficulty,
    selectedArmy,
    selectedDeckKey,
    playerHand,
    enemyHand,
    playerHP,
    enemyHP,
    roundNumber,
  ]);

  // Rotella mouse sui FC - funziona su panel, sulla carta posizionata e sulla carta in mano
  useEffect(() => {
    if (gamePhase !== 'selectAgent' || !selectedAgent) return;
    const reserved = Math.max(0, playerHand.filter(c => !playerUsedCards.includes(c.id)).length - 1);
    const effectiveMax = Math.max(1, playerFocus - reserved);
    const onWheel = (e) => {
      e.preventDefault();
      if (effectiveMax < 1) return;
      const delta = e.deltaY > 0 ? -1 : 1;
      setSelectedFocus((prev) => Math.max(1, Math.min(effectiveMax, prev + delta)));
    };
    const els = [fcPanelRef.current, playerCardZoneRef.current, selectedCardInHandRef.current].filter(Boolean);
    els.forEach((el) => el.addEventListener('wheel', onWheel, { passive: false }));
    return () => els.forEach((el) => el.removeEventListener('wheel', onWheel));
  }, [gamePhase, selectedAgent, playerFocus, playerHand, playerUsedCards, setSelectedFocus]);

  // Hook per drag and drop
  const handleAgentSelect = useCallback((agent) => {
    if (guidedMatch.active && currentGuidedRound?.playerAgentId && agent?.id !== currentGuidedRound.playerAgentId) {
      const expectedName = playerHand.find((c) => c.id === currentGuidedRound.playerAgentId)?.name || 'la carta indicata';
      setGuidedHint(`Per questo step devi schierare: ${expectedName}.`);
      return;
    }
    setGuidedHint('');
    setSelectedAgent((prev) => (prev?.id === agent?.id ? null : agent));
  }, [guidedMatch.active, currentGuidedRound, playerHand, setSelectedAgent]);

  const dragAndDrop = useDragAndDrop({
    gamePhase,
    isPlayerFirst,
    enemyAgent,
    playerUsedCards,
    onAgentSelect: handleAgentSelect,
    selectedAgent,
    gameState,
  });
  
  const { handleDragStart, dropZoneRef } = dragAndDrop;
  
  // Ref per auto-scroll log - Gestito internamente da LogPanel

  // Imposta sfondo scuro su body per evitare barre bianche
  useEffect(() => {
    document.body.style.backgroundColor = '#020617'; // slate-950
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.documentElement.style.backgroundColor = '#020617';
    return () => {
      document.body.style.backgroundColor = '';
      document.documentElement.style.backgroundColor = '';
    };
  }, []);

  // Cursore durante drag agente: grabbing, copy quando sopra area agente
  useEffect(() => {
    if (draggingCard) {
      document.body.style.cursor = isOverDropZone ? 'copy' : 'grabbing';
      return () => { document.body.style.cursor = ''; };
    }
  }, [draggingCard, isOverDropZone]);

  const addLog = (message) => {
    setLogs(prev => [...prev.slice(-200), `[R${roundNumber}] ${message}`]);
  };
  
  // Helper per calcolare se il bonus armata sarà attivo (per preview durante selectAgent)
  const isBonusTriggerSatisfied = useCallback((army, isPlayer, agent = null) => {
    const bonus = ARMY_BONUSES[army];
    if (!bonus || !bonus.trigger) return true; // Nessun trigger = sempre attivo

    const sideAgent = agent ?? (isPlayer ? selectedAgent : enemyAgent);
    const otherAgent = isPlayer ? enemyAgent : selectedAgent;
    const sideUsed = isPlayer ? playerUsedCards : enemyUsedCards;
    const otherUsed = isPlayer ? enemyUsedCards : playerUsedCards;
    const sideHand = isPlayer ? playerHand : enemyHand;

    const context = {
      isFirst: isPlayer ? isPlayerFirst : !isPlayerFirst,
      wonPrevious: isPlayer ? (lastWinner === 'player') : (lastWinner === 'enemy'),
      lostPrevious: isPlayer ? (lastWinner === 'enemy') : (lastWinner === 'player'),
      focusCoins: isPlayer ? (selectedFocus || 1) : (enemySelectedFocus || 1),
      enemyFocusCoins: isPlayer ? (enemySelectedFocus || 0) : (selectedFocus || 0),
      playerHP: isPlayer ? playerHP : enemyHP,
      enemyHP: isPlayer ? enemyHP : playerHP,
      cardsPlayed: sideUsed.length + (sideAgent ? 1 : 0),
      enemyCardsPlayed: otherUsed.length + (otherAgent ? 1 : 0),
      roundNumber: roundNumber || 1,
      playerInitialLeagueCount: sideAgent
        ? countInitialLeagueCards(sideUsed, sideHand, sideAgent)
        : 0,
    };

    return checkTrigger(bonus.trigger, context);
  }, [
    isPlayerFirst,
    lastWinner,
    selectedFocus,
    enemySelectedFocus,
    playerHP,
    enemyHP,
    playerUsedCards,
    enemyUsedCards,
    playerHand,
    enemyHand,
    selectedAgent,
    enemyAgent,
    roundNumber,
  ]);
  
  // Auto-scroll del log
  useEffect(() => {
    // Auto-scroll gestito internamente da LogPanel
  }, [logs]);

  // Suggerisci il tutorial ai nuovi giocatori
  useEffect(() => {
    if (gamePhase === 'menu' && !tutorial.wasCompleted() && !tutorial.isActive) {
      // Mostra un suggerimento dopo un breve delay
      const timer = setTimeout(() => {
        // Il suggerimento può essere mostrato tramite un tooltip o banner
        // Per ora non facciamo nulla automaticamente, ma il pulsante è visibile
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [gamePhase, tutorial]);

  // startGame è ora gestita da useGameFlow

  // IA helper functions (usate in confirmPlayerChoice quando il giocatore inizia)

  // Gestione turno IA - selezione campo (tempo pensiero variabile)
  useEffect(() => {
    if (isOnlinePvP) return;
    if (gamePhase === 'selectField' && !isPlayerFirst && battlefields.length > 0) {
      const delay = ai.getThinkingTime?.() ?? 2000;
      const timer = setTimeout(() => {
        const available = battlefields.filter((_, i) => !(i in conqueredFields) && i < revealedFields);
        if (available.length > 0) {
          const fieldIdx = battlefields.indexOf(available[Math.floor(Math.random() * available.length)]);
          setCurrentFieldIndex(fieldIdx);
          setLogs(prev => [...prev.slice(-20), `[R${roundNumber}] L'IA sceglie: ${battlefields[fieldIdx].name}`]);
          setGamePhase('selectAgent');
        }
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [gamePhase, isPlayerFirst, battlefields, conqueredFields, revealedFields, roundNumber, ai.getThinkingTime, isOnlinePvP]);

  // Reset tilt Tabellone quando si esce da selectField (per il prossimo round)
  useEffect(() => {
    if (gamePhase !== 'selectField') setTabelloneTiltDismissed(false);
  }, [gamePhase]);

  // Reset ref quando si passa a selectAgent (nuovo round/giro)
  useEffect(() => {
    if (gamePhase === 'selectAgent') {
      // Se non c'è ancora un agente selezionato, reset del ref
      if (!enemyAgent) {
        aiHasSelectedAgent.current = false;
      }
    }
  }, [gamePhase, enemyAgent]);
  
  // Gestione turno IA - selezione agente (tempo pensiero variabile a discrezione IA)
  // IMPORTANTE: Usa un ref per evitare selezioni multiple
  useEffect(() => {
    if (isOnlinePvP) return;
    if (gamePhase === 'selectAgent' && !isPlayerFirst && enemyHand.length > 0 && !aiHasSelectedAgent.current) {
      aiHasSelectedAgent.current = true;
      const delay = ai.getThinkingTime?.() ?? 2000;
      const timer = setTimeout(() => {
        if (!enemyAgent) {
          ai.selectEnemyAgentAndFocus();
        }
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [gamePhase, isPlayerFirst, enemyHand.length, enemyAgent, ai.selectEnemyAgentAndFocus, ai.getThinkingTime, isOnlinePvP]);

  useEffect(() => {
    if (!guidedMatch.active || !currentGuidedRound) return;
    if (gamePhase !== 'selectAgent') return;
    if (enemyAgent) return;
    const scriptedEnemy = enemyHand.find((c) => c.id === currentGuidedRound.enemyAgentId) || enemyHand[0];
    if (!scriptedEnemy) return;
    setEnemyAgent(scriptedEnemy);
    setEnemySelectedFocus(currentGuidedRound.enemyFocus);
    setLogs((prev) => [
      ...prev.slice(-80),
      `[R${roundNumber}] Guida: il nemico schiera ${scriptedEnemy.name} (${currentGuidedRound.enemyFocus} FC).`,
    ]);
  }, [
    guidedMatch.active,
    currentGuidedRound,
    gamePhase,
    enemyAgent,
    enemyHand,
    roundNumber,
    setEnemyAgent,
    setEnemySelectedFocus,
    setLogs,
  ]);

  // Selezione campo giocatore
  const handleFieldSelect = (field) => {
    if (isGuidedIntroWelcomePhase || isGuidedIntroHandsPhase || isGuidedIntroPreviewPhase) {
      setGuidedHint('Premi OK per continuare.');
      return;
    }
    if (isGuidedIntroCardPickPhase) {
      setGuidedHint(`Clicca prima "${guidedIntroTargetCardName}".`);
      return;
    }
    if (isGuidedIntroGlossaryPromptPhase) {
      setGuidedHint('Clicca il Glossario per continuare.');
      return;
    }
    if (isGuidedIntroGlossaryOpenPhase) {
      setGuidedHint('ora chiudilo per continuare, avrai modo di leggerlo con calma dopo!');
      return;
    }
    const idx = battlefields.indexOf(field);
    if (guidedMatch.active && currentGuidedRound && idx !== currentGuidedRound.fieldIndex) {
      const expectedField = battlefields[currentGuidedRound.fieldIndex]?.name || `Campo ${currentGuidedRound.fieldIndex + 1}`;
      setGuidedHint(`Step guidato: seleziona "${expectedField}".`);
      return;
    }
    setGuidedHint('');
    // Se stiamo cambiando campo (non è la prima selezione), logga il cambio
    if (currentFieldIndex !== null && currentFieldIndex !== idx) {
      addLog(`Hai cambiato campo: ${field.name}`);
    } else if (currentFieldIndex === null) {
      addLog(`Hai scelto: ${field.name}`);
    }
    setCurrentFieldIndex(idx);
    // Passa alla fase selectAgent solo se non siamo già lì
    if (gamePhase === 'selectField') {
      if (isOnlinePvP && multiplayerSession?.roomCode && isPlayerFirst) {
        getMultiplayerManager().sendRelay(multiplayerSession.roomCode, {
          type: 'peer_move',
          roundNumber,
          phase: 'field',
          fieldIndex: idx,
        });
      }
      setGamePhase('selectAgent');
    }
  };

  const handleFocusChange = useCallback((focusValue) => {
    setSelectedFocus(focusValue);
    if (guidedMatch.active && currentGuidedRound && focusValue !== currentGuidedRound.focus) {
      setGuidedHint(`Step guidato: imposta ${currentGuidedRound.focus} FC.`);
    } else {
      setGuidedHint('');
    }
  }, [guidedMatch.active, currentGuidedRound, setSelectedFocus]);

  useEffect(() => {
    if (!isOnlinePvP || incomingPeerMoveQueue.length === 0) return;

    const p = incomingPeerMoveQueue[0];

    if (typeof p.roundNumber !== 'number') {
      setIncomingPeerMoveQueue((q) => q.slice(1));
      return;
    }

    if (p.roundNumber < roundNumber) {
      setIncomingPeerMoveQueue((q) => q.slice(1));
      return;
    }

    if (p.roundNumber !== roundNumber) {
      return;
    }

    if (p.phase === 'field' && gamePhase === 'selectField' && !isPlayerFirst) {
      setCurrentFieldIndex(p.fieldIndex);
      setLogs((prev) => [
        ...prev.slice(-20),
        `[R${roundNumber}] L'avversario sceglie: ${battlefields[p.fieldIndex]?.name}`,
      ]);
      setGamePhase('selectAgent');
      setIncomingPeerMoveQueue((q) => q.slice(1));
      return;
    }

    if (p.phase === 'agent' && gamePhase === 'selectAgent') {
      const agent = enemyHand.find((c) => c.id === p.agentId);
      if (!agent) {
        setIncomingPeerMoveQueue((q) => q.slice(1));
        return;
      }
      setEnemyAgent(agent);
      setEnemySelectedFocus(p.focus);
      setIncomingPeerMoveQueue((q) => q.slice(1));
    }
  }, [
    isOnlinePvP,
    incomingPeerMoveQueue,
    roundNumber,
    gamePhase,
    isPlayerFirst,
    battlefields,
    enemyHand,
    setCurrentFieldIndex,
    setLogs,
    setGamePhase,
    setEnemyAgent,
    setEnemySelectedFocus,
  ]);

  // Conferma scelta giocatore
  const confirmPlayerChoice = () => {
    if (guidedMatch.active && currentGuidedRound) {
      const expectedFieldName = battlefields[currentGuidedRound.fieldIndex]?.name || `Campo ${currentGuidedRound.fieldIndex + 1}`;
      const expectedAgentName = playerHand.find((c) => c.id === currentGuidedRound.playerAgentId)?.name || 'agente richiesto';
      if (currentFieldIndex !== currentGuidedRound.fieldIndex) {
        setGuidedHint(`Prima scegli il campo corretto: "${expectedFieldName}".`);
        return;
      }
      if (!selectedAgent || selectedAgent.id !== currentGuidedRound.playerAgentId) {
        setGuidedHint(`Per questo step devi schierare "${expectedAgentName}".`);
        return;
      }
      if (selectedFocus !== currentGuidedRound.focus) {
        setGuidedHint(`Per questo step devi investire ${currentGuidedRound.focus} FC.`);
        return;
      }
      setGuidedHint('');
    }

    if (!selectedAgent || selectedFocus < 1) return;

    if (isOnlinePvP && multiplayerSession?.roomCode) {
      if (enemyAgent) {
        getMultiplayerManager().sendRelay(multiplayerSession.roomCode, {
          type: 'peer_move',
          roundNumber,
          phase: 'agent',
          agentId: selectedAgent.id,
          focus: selectedFocus,
        });
        setGamePhase('battle');
        return;
      }
      if (isPlayerFirst) {
        setPlayerConfirmedAwaitingAI(true);
        aiHasSelectedAgent.current = true;
        getMultiplayerManager().sendRelay(multiplayerSession.roomCode, {
          type: 'peer_move',
          roundNumber,
          phase: 'agent',
          agentId: selectedAgent.id,
          focus: selectedFocus,
        });
        return;
      }
      return;
    }

    // Se l'IA ha già scelto (IA inizia), passa subito al duello
    if (enemyAgent) {
      setGamePhase('battle');
      return;
    }

    // Se il giocatore inizia: resta in selectAgent, mostra "L'IA sta pensando...", poi passa a battle quando l'IA ha scelto
    if (!aiHasSelectedAgent.current) {
      setPlayerConfirmedAwaitingAI(true);
      aiHasSelectedAgent.current = true;
      const delay = ai.getThinkingTime?.() ?? 2000;
      setTimeout(() => {
        ai.selectEnemyAgentAndFocus(false);
      }, delay);
    }
  };

  // Quando l'IA ha scelto dopo che il giocatore (primo) ha confermato: passa a battle
  useEffect(() => {
    if (gamePhase === 'selectAgent' && selectedAgent && enemyAgent && isPlayerFirst && playerConfirmedAwaitingAI) {
      setPlayerConfirmedAwaitingAI(false);
      setGamePhase('battle');
    }
  }, [gamePhase, selectedAgent, enemyAgent, isPlayerFirst, playerConfirmedAwaitingAI]);

  // Trigger risoluzione battaglia (deve rieseguire quando enemyAgent viene impostato dopo il delay)
  useEffect(() => {
    if (gamePhase === 'battle' && selectedAgent && enemyAgent) {
      resolveBattle();
    }
  }, [gamePhase, selectedAgent, enemyAgent, resolveBattle]);

  // Fasi: 0=Schieramento, 1=Poteri/bonus (sub-step), 2=Focus+POT×FC, 3=Mod/min VA, 4=Scontro, 5=Risultato, 6=Pulsante
  useEffect(() => {
    if (gamePhase === 'result' && battleResult) {
      if (duelPhase <= 4 && battleResult.phaseLogs) {
        const phaseKey = `phase${duelPhase}`;
        const phaseLogs = battleResult.phaseLogs[phaseKey] || [];
        phaseLogs.forEach(log => {
          addLog(log);
        });
      }

      const effectCount = countDuelEffectSteps(battleResult.visualSteps);
      const phase3SubCount = countDuelPhase3SubSteps(battleResult);
      const postCount = countDuelPostEffectSteps(battleResult.visualSteps);
      const stepMs = duelVfx.effectStepMs ?? DUEL_VISUAL_DEFAULTS.effectStepMs;
      const bufferMs = duelVfx.effectPhaseBufferMs ?? DUEL_VISUAL_DEFAULTS.effectPhaseBufferMs;

      if (duelPhase === 1 && effectCount > 0) {
        if (visualEffectStep < effectCount) {
          const timer = setTimeout(() => advanceEffectStep(), stepMs);
          return () => clearTimeout(timer);
        }
        const timer = setTimeout(() => setDuelPhase(2), bufferMs);
        return () => clearTimeout(timer);
      }

      if (duelPhase === 3 && phase3SubCount > 1) {
        if (visualEffectStep < phase3SubCount) {
          const timer = setTimeout(() => advanceEffectStep(), stepMs);
          return () => clearTimeout(timer);
        }
        const timer = setTimeout(() => setDuelPhase(4), bufferMs);
        return () => clearTimeout(timer);
      }

      if (duelPhase === 5 && postCount > 0) {
        if (visualEffectStep < postCount) {
          const timer = setTimeout(() => advanceEffectStep(), stepMs);
          return () => clearTimeout(timer);
        }
        const timer = setTimeout(() => setDuelPhase(6), bufferMs);
        return () => clearTimeout(timer);
      }

      const delays = buildPhaseAdvanceDelaysMs(
        duelVfx,
        battleResult.playerFocusUsed,
        battleResult.enemyFocusUsed,
        battleResult
      );
      if (duelPhase === 1 && effectCount === 0) {
        const timer = setTimeout(() => setDuelPhase(2), delays[1]);
        return () => clearTimeout(timer);
      }
      if (duelPhase !== 1 && duelPhase < delays.length - 1) {
        const timer = setTimeout(() => {
          setDuelPhase(prev => prev + 1);
        }, delays[duelPhase]);
        return () => clearTimeout(timer);
      }
    }
  }, [gamePhase, duelPhase, visualEffectStep, battleResult, duelVfx, advanceEffectStep]);
  
  const getFocusCoinGlowColor = (focusCount, intensity) =>
    computeFocusCoinGlowColor(focusCount, intensity, rainbowTime, {
      rainbowHueMul12: duelVfx.rainbowHueMul12,
      rainbowHueMul13: duelVfx.rainbowHueMul13,
      rainbowHueMul14: duelVfx.rainbowHueMul14,
    });

  
  // Animazione focus coin sequenziali (fase 2)
  useEffect(() => {
    if (gamePhase === 'result' && battleResult && duelPhase === 2) {
      // Reset quando entra nella fase 2
      setPlayerFocusCoinsShown(0);
      setEnemyFocusCoinsShown(0);
      setCardGlowIntensity(0);
      setPlayerCardGlow(0);
      setEnemyCardGlow(0);
      
      const playerTotal = battleResult.playerFocusUsed;
      const enemyTotal = battleResult.enemyFocusUsed;
      const maxTotal = Math.max(playerTotal, enemyTotal);
      
      // Anima l'apparizione sequenziale
      for (let i = 0; i < maxTotal; i++) {
        setTimeout(() => {
          if (i < playerTotal) {
            setPlayerFocusCoinsShown(prev => prev + 1);
            // Aumenta il glow del bordo della carta del player progressivamente
            const playerIntensity = (i + 1) / playerTotal;
            setPlayerCardGlow(playerIntensity);
          }
          if (i < enemyTotal) {
            setEnemyFocusCoinsShown(prev => prev + 1);
            // Aumenta il glow del bordo della carta dell'IA progressivamente
            const enemyIntensity = (i + 1) / enemyTotal;
            setEnemyCardGlow(enemyIntensity);
          }
          // Aumenta l'intensità del glow generale progressivamente
          const intensity = (i + 1) / maxTotal;
          setCardGlowIntensity(intensity);
        }, i * duelVfx.focusCoinStepMs);
      }
    }
    // Non resettare quando si esce dalla fase 2 - i focus coin devono rimanere visibili
  }, [gamePhase, duelPhase, battleResult, duelVfx.focusCoinStepMs]);
  
  // Aggiorna continuamente i colori arcobaleno e diamante (per animazione).
  // I colori speciali esistono solo da 12 FC in su: sotto quella soglia
  // l'interval non parte, evitando ~20 re-render/s inutili.
  useEffect(() => {
    const needsRainbow =
      battleResult &&
      Math.max(battleResult.playerFocusUsed || 0, battleResult.enemyFocusUsed || 0) >= 12;
    if (gamePhase === 'result' && needsRainbow && duelPhase >= 2) {
      const interval = setInterval(() => {
        setRainbowTime((prev) => prev + duelVfx.rainbowStep);
      }, duelVfx.rainbowIntervalMs);
      return () => clearInterval(interval);
    } else {
      setRainbowTime(0);
    }
  }, [gamePhase, duelPhase, battleResult, duelVfx.rainbowIntervalMs, duelVfx.rainbowStep]);

  // Risoluzione battaglia

  // Prossimo round
  const nextRound = () => {
    // Se siamo in fase risultato e c'è un battleResult, attiva l'animazione clash delle carte
    if (gamePhase === 'result' && battleResult && duelPhase >= 4) {
      setShowClashAnimation(true);
      
      // Dopo l'animazione (1 secondo), procedi con il reset
      setTimeout(() => {
        setShowClashAnimation(false);
        proceedToNextRound();
      }, getDuelVisualConfig().nextRoundClashHoldMs);
      return;
    }
    
    // Se non siamo in fase risultato, procedi normalmente
    proceedToNextRound();
  };
  
  const proceedToNextRound = () => {
    // Reset zoom
    setIsZoomed(false);
    
    // Applica i danni HP ORA (dopo che l'utente ha cliccato CONTINUA)
    let currentPlayerHP = playerHP;
    let currentEnemyHP = enemyHP;
    
    // Determina le tossine attive da usare per l'applicazione
    // Usa le tossine attivate in questa battaglia se presenti, altrimenti quelle già attive
    let currentPlayerToxin = playerToxin;
    let currentEnemyToxin = enemyToxin;
    
    if (battleResult) {
      currentPlayerHP = battleResult.finalPlayerHP;
      currentEnemyHP = battleResult.finalEnemyHP;
      
      // Aggiorna le tossine se vengono attivate durante questa battaglia
      // IMPORTANTE: usa i valori aggiornati per l'applicazione, non gli stati asincroni
      if (battleResult.playerToxinActivated) {
        currentPlayerToxin = battleResult.playerToxinActivated;
        setPlayerToxin(battleResult.playerToxinActivated);
      }
      if (battleResult.enemyToxinActivated) {
        currentEnemyToxin = battleResult.enemyToxinActivated;
        setEnemyToxin(battleResult.enemyToxinActivated);
      }
    }
    
    // Applica la tossina a fine turno (prima di passare al prossimo round)
    // Usa i valori aggiornati invece degli stati che potrebbero non essere ancora sincronizzati
    if (currentPlayerToxin || currentEnemyToxin) {
      const toxinResult = applyToxin(currentPlayerToxin, currentEnemyToxin, currentPlayerHP, currentEnemyHP);
      currentPlayerHP = toxinResult.newPlayerHP;
      currentEnemyHP = toxinResult.newEnemyHP;
      setPlayerToxin(toxinResult.playerToxinActive);
      setEnemyToxin(toxinResult.enemyToxinActive);
      
      // Aggiungi i log della tossina
      if (toxinResult.logs.length > 0) {
        toxinResult.logs.forEach(log => addLog(`[R${roundNumber}] ${log}`));
      }
      
      // Check vittoria dopo tossina
      if (currentPlayerHP <= 0) {
        const playerFields = Object.values(conqueredFields).filter(f => 
          (typeof f === 'object' && f?.winner === 'player') || (typeof f === 'string' && playerHand.some(c => c.army === f))
        ).length;
        const enemyFields = Object.values(conqueredFields).filter(f => 
          (typeof f === 'object' && f?.winner === 'enemy') || (typeof f === 'string' && enemyHand.some(c => c.army === f))
        ).length;
        setGameResult({ winner: 'enemy', reason: 'hp', playerFields, enemyFields });
        setPlayerHP(currentPlayerHP);
        setEnemyHP(currentEnemyHP);
        setGamePhase('gameOver');
        return;
      }
      if (currentEnemyHP <= 0) {
        const playerFields = Object.values(conqueredFields).filter(f => 
          (typeof f === 'object' && f?.winner === 'player') || (typeof f === 'string' && playerHand.some(c => c.army === f))
        ).length;
        const enemyFields = Object.values(conqueredFields).filter(f => 
          (typeof f === 'object' && f?.winner === 'enemy') || (typeof f === 'string' && enemyHand.some(c => c.army === f))
        ).length;
        setGameResult({ winner: 'player', reason: 'hp', playerFields, enemyFields });
        setPlayerHP(currentPlayerHP);
        setEnemyHP(currentEnemyHP);
        setGamePhase('gameOver');
        return;
      }
    }
    
    // Aggiorna HP dopo aver applicato la tossina
    setPlayerHP(currentPlayerHP);
    setEnemyHP(currentEnemyHP);
    
    // Aggiorna conqueredFields e cardBattleOutcomes ORA (dopo che l'utente ha visto il risultato)
    let updatedConqueredFields = { ...conqueredFields };
    if (battleResult && battleResult.fieldIndex !== undefined) {
      // Memorizza vincitore E armata: il vincitore per il conteggio vittoria, l'armata per la UI
      updatedConqueredFields[battleResult.fieldIndex] = {
        winner: battleResult.winner,
        army: battleResult.winnerArmy
      };
      setConqueredFields(updatedConqueredFields);
      
      // Aggiorna gli esiti delle battaglie per le carte usate
      if (battleResult.playerAgent && battleResult.enemyAgent) {
        setCardBattleOutcomes(prev => ({
          ...prev,
          [battleResult.playerAgent.id]: battleResult.winner === 'player' ? 'winner' : 'loser',
          [battleResult.enemyAgent.id]: battleResult.winner === 'enemy' ? 'winner' : 'loser'
        }));
      }
    }
    
    // Rivela campo nascosto se ce ne sono
    if (revealedFields < 5) {
      setRevealedFields(prev => prev + 1);
    }
    
    // Conta campi conquistati per giocatore (usa il vincitore effettivo, non l'armata)
    const playerFields = Object.values(updatedConqueredFields).filter(f => 
      (typeof f === 'object' && f?.winner === 'player') || (typeof f === 'string' && playerHand.some(c => c.army === f))
    ).length;
    const enemyFields = Object.values(updatedConqueredFields).filter(f => 
      (typeof f === 'object' && f?.winner === 'enemy') || (typeof f === 'string' && enemyHand.some(c => c.army === f))
    ).length;

    const newPlayerHP = battleResult ? battleResult.finalPlayerHP : playerHP;
    const newEnemyHP = battleResult ? battleResult.finalEnemyHP : enemyHP;
    const annihilationOnly = gameMode === 'campaign' && campaignDuelMod?.winCondition === 'annihilation_only';
    const blockTerritorialPlayerWin = annihilationOnly && newEnemyHP > 0;
    
    // Check vittoria per campi conquistati (3 campi)
    // In modalità classica: SOLO nei round 1-4 (al round 5+ cambia in "Supremazia")
    // In modalità Bare Hands: SEMPRE attiva
    // REKLAMAZIONE: ai round 3 o 4, chi vince per campi può reclamare la vittoria o continuare a giocare
    const canReclaim = (roundNumber === 3 || roundNumber === 4);
    if (gameMode === 'bareHands') {
      // Bare Hands: sempre controlla vittoria per campi
      if (playerFields >= 3 && !blockTerritorialPlayerWin) {
        if (canReclaim) {
          setShowClaimVictoryChoice({ winner: 'player', playerFields, enemyFields });
          return;
        }
        setGameResult({ winner: 'player', reason: 'fields', playerFields, enemyFields });
        setGamePhase('gameOver');
        return;
      }
      if (enemyFields >= 3) {
        if (canReclaim) {
          // IA reclama la vittoria
          setGameResult({ winner: 'enemy', reason: 'fields', playerFields, enemyFields });
          setGamePhase('gameOver');
          return;
        }
        setGameResult({ winner: 'enemy', reason: 'fields', playerFields, enemyFields });
        setGamePhase('gameOver');
        return;
      }
    } else if (roundNumber < 5) {
      // Classic mode: controlla vittoria per campi SOLO nei round 1-4
      if (playerFields >= 3 && !blockTerritorialPlayerWin) {
        if (canReclaim) {
          setShowClaimVictoryChoice({ winner: 'player', playerFields, enemyFields });
          return;
        }
        setGameResult({ winner: 'player', reason: 'fields', playerFields, enemyFields });
        setGamePhase('gameOver');
        return;
      }
      if (enemyFields >= 3) {
        if (canReclaim) {
          // IA reclama la vittoria
          setGameResult({ winner: 'enemy', reason: 'fields', playerFields, enemyFields });
          setGamePhase('gameOver');
          return;
        }
        setGameResult({ winner: 'enemy', reason: 'fields', playerFields, enemyFields });
        setGamePhase('gameOver');
        return;
      }
    }
    // Se siamo in classic mode e roundNumber >= 5, NON controlliamo la vittoria per campi
    
    // Check fine gioco per PV (a 0) - newPlayerHP / newEnemyHP già calcolati sopra
    if (newPlayerHP <= 0) {
      setGameResult({ winner: 'enemy', reason: 'hp', playerFields, enemyFields });
      setGamePhase('gameOver');
      return;
    }
    if (newEnemyHP <= 0) {
      setGameResult({ winner: 'player', reason: 'hp', playerFields, enemyFields });
      setGamePhase('gameOver');
      return;
    }
    
    const playerAvailable = playerHand.filter(c => !playerUsedCards.includes(c.id));
    const enemyAvailable = enemyHand.filter(c => !enemyUsedCards.includes(c.id));
    
    // Check fine gioco per carte esaurite (fine round 5)
    if (playerAvailable.length === 0 || enemyAvailable.length === 0) {
      // Al round 5: vince chi ha più PV
      let winner, reason;
      if (newPlayerHP > newEnemyHP) {
        winner = 'player';
        reason = 'hp';
      } else if (newEnemyHP > newPlayerHP) {
        winner = 'enemy';
        reason = 'hp';
      } else {
        // Pareggio di PV: controlla i campi come tiebreaker
        if (playerFields > enemyFields) {
          winner = 'player';
          reason = 'fields';
        } else if (enemyFields > playerFields) {
          winner = 'enemy';
          reason = 'fields';
        } else {
          winner = 'draw';
          reason = 'draw';
        }
      }
      if (annihilationOnly && winner === 'player' && newEnemyHP > 0) {
        winner = 'enemy';
        reason = 'hp';
      }
      setGameResult({ winner, reason, playerFields, enemyFields });
      setGamePhase('gameOver');
      return;
    }
    
    doResetAndNextRound(playerFields, enemyFields);
  };

  // Reset e passaggio al prossimo round (usato anche da "Continua a giocare" nella reclamazione)
  const doResetAndNextRound = (playerFields, enemyFields) => {
    setSelectedAgent(null);
    setSelectedFocus(1);
    setEnemyAgent(null);
    setEnemySelectedFocus(1);
    setCurrentFieldIndex(null);
    setBattleResult(null);
    setShowClashAnimation(false);
    aiHasSelectedAgent.current = false;
    setPlayerConfirmedAwaitingAI(false);
    // Non cancellare un relay già arrivato per il prossimo round: se l'avversario ha
    // cliccato Continua prima, il messaggio field/agent ha roundNumber === round+1
    // mentre noi siamo ancora al round corrente; azzerarlo qui causerebbe soft-lock
    // (secondo giocatore in attesa campo / agente perso).
    setIncomingPeerMoveQueue((prev) =>
      prev.filter((msg) => typeof msg.roundNumber === 'number' && msg.roundNumber > roundNumber)
    );
    setGuidedHint('');

    const nextRoundNum = roundNumber + 1;
    if (guidedMatch.active && nextRoundNum > guidedMatch.rounds.length) {
      resetGuidedTutorial();
      setLogs((prev) => [
        ...prev.slice(-80),
        `[R${roundNumber}] ✅ Partita guidata completata. Puoi avviare una nuova guida dal menu.`,
      ]);
      setGamePhase('menu');
      return;
    }
    setRoundNumber(nextRoundNum);
    
    if (campaignDuelMod?.initiativeProfile === 'assault' && nextRoundNum === 2) {
      setIsPlayerFirst(true);
    } else if (campaignDuelMod?.initiativeProfile === 'defense' && nextRoundNum === 2) {
      setIsPlayerFirst(false);
    } else {
      setIsPlayerFirst(prev => !prev);
    }
    
    if (nextRoundNum === 5 && playerFields < 3 && enemyFields < 3 && gameMode === 'classic') {
      setShowFinalRoundAnimation(true);
      setTimeout(() => {
        setShowFinalRoundAnimation(false);
        setGamePhase('selectField');
      }, 3000);
    } else {
      setGamePhase('selectField');
    }
  };

  // ============================================
  // RENDER
  // ============================================

  // Scelta slot salvataggio campagna
  if (gamePhase === 'campaignSlots') {
    return (
      <CampaignSaveSlots
        onBack={() => setGamePhase('menu')}
        onSlotChosen={(slotIndex) => {
          setCampaignSaveSlot(slotIndex);
          setGamePhase('campaignHub');
        }}
      />
    );
  }

  // Schermata Campagna — hub dedicato (non popup sul menu)
  if (gamePhase === 'campaignHub') {
    return (
      <div className="relative w-full h-full min-h-full" style={{ minHeight: '100%' }}>
        <CampaignWarHub
          campaignSaveSlot={campaignSaveSlot}
          onOpenDeckManager={() => {
            setEditingDeckId(null);
            setDeckManagerSource('menu');
            setDeckManagerView('list');
            setShowDeckManager(true);
          }}
          onStartMission={(mission) => {
            markCampaignMissionStarted(mission.id, campaignSaveSlot);
            setCampaignLevel(mission);
            setSelectedMode('campaign');
            setIsMultiplayer(false);
            setSelectedArmy(null);
            setSelectedDeckKey(null);
            setGamePhase('selectArmy');
          }}
          onBack={() => setGamePhase('menu')}
        />
        {showDeckManager && deckManagerView === 'list' && (
            <CosmicDeckManagerList
              onEditDeck={(deckId) => {
                setEditingDeckId(deckId);
                setDeckManagerView('builder');
              }}
              onCreateNew={() => {
                setEditingDeckId(null);
                setDeckManagerView('builder');
              }}
              onClose={() => {
                setShowDeckManager(false);
                setEditingDeckId(null);
              }}
            />
          )}
        {showDeckManager && deckManagerView === 'builder' && (
            <CosmicDeckBuilderWrapper
              existingDeckId={editingDeckId}
              onClose={() => {
                if (deckManagerSource === 'menu') {
                  setDeckManagerView('list');
                  setEditingDeckId(null);
                } else {
                  setShowDeckManager(false);
                  setEditingDeckId(null);
                }
              }}
            />
          )}
      </div>
    );
  }

  // Menu principale — stile cosmic V5 (ufficiale)
  if (gamePhase === 'menu') {
    const openCropTool = () => {
      const url = new URL(window.location.href);
      url.searchParams.set('cropTool', '1');
      window.location.href = url.toString();
    };
    const openStyleLab = () => {
      const url = new URL(window.location.href);
      url.searchParams.set('styleLab', '1');
      window.location.href = url.toString();
    };
    const menuItems = [
      {
        label: 'PARTITA LOCALE',
        sub: 'AVVIO',
        meta: 'CLIC · POI SCEGLI LA MODALITÀ',
        accent: MENU_ACCENTS.pink,
        choices: [
          { label: 'GIOCA VS IA', sub: 'VS IA', meta: 'CLASSIC', onClick: () => { setSelectedMode('classic'); setIsMultiplayer(false); setCampaignLevel(null); setGamePhaseFromMainMenu('selectArmy'); } },
          { label: 'BARE HANDS', sub: 'MODALITÀ', meta: 'SENZA ESERCITO', onClick: () => { setSelectedMode('bareHands'); setIsMultiplayer(false); setCampaignLevel(null); setGamePhaseFromMainMenu('selectArmy'); } },
        ],
      },
      { label: 'CAMPAGNA', sub: 'STORIA', meta: 'SLOT SALVATAGGIO', onClick: () => setGamePhaseFromMainMenu('campaignSlots') },
      { label: 'MULTIPLAYER', sub: 'ONLINE', meta: 'LOBBY · BETA', onClick: () => { setSelectedMode('multiplayer'); setIsMultiplayer(true); setCampaignLevel(null); setGamePhaseFromMainMenu('multiplayerLobby'); } },
      { label: 'GESTIONE ESERCITI', sub: 'ESERCITO', meta: 'LISTA / BUILDER', onClick: () => { setEditingDeckId(null); setDeckManagerSource('menu'); setDeckManagerView('list'); setShowDeckManager(false); setGamePhaseFromMainMenu('deckManager'); } },
      { label: 'STORICO PLAYTEST', sub: 'DATI', meta: 'MATCH · EXPORT CSV', onClick: () => setGamePhaseFromMainMenu('playtestHistory') },
      { label: 'TUTORIAL', sub: 'GUIDA', meta: '3 PERCORSI', onClick: openTutorialSelector },
      { label: 'GALLERIA', sub: 'ARCHIVIO', meta: 'CARTE · CAMPI', onClick: () => startTransition(() => setGamePhaseFromMainMenu('gallery')) },
      {
        label: 'STRUMENTI DEV',
        sub: 'LAB',
        meta: 'CLIC · POI SCEGLI LO STRUMENTO',
        accent: '#94a3b8',
        choices: [
          { label: 'STYLE LAB', sub: 'UI', meta: 'EXPERIMENTS', onClick: openStyleLab },
          { label: 'TOOL RITAGLIO', sub: 'ASSET', meta: 'SPRITE CROP', onClick: openCropTool },
        ],
      },
    ];
    return (
      <div className="relative w-full h-full min-h-full" style={{ minHeight: '100%' }}>
        {!showDeckManager && <SatzeMenuPrototype menuItems={menuItems} />}

        <TutorialSelector
          isOpen={isTutorialSelectorOpen}
          onClose={closeTutorialSelector}
          onSelect={handleTutorialTrackSelect}
          tracks={TUTORIAL_TRACKS}
        />

        {/* Tutorial */}
        <Tutorial
          isActive={tutorial.isActive}
          currentStep={tutorial.currentStep}
          onNext={tutorial.nextStep}
          onPrevious={tutorial.previousStep}
          onGoToStep={tutorial.goToStep}
          onClose={tutorial.closeTutorial}
          onComplete={tutorial.completeTutorial}
          steps={activeTutorialSteps}
        />
        
        {/* Deck Manager: lista mazzi (da Gestione Mazzi) o costruttore */}
        {showDeckManager && deckManagerView === 'list' && (
            <CosmicDeckManagerList
              onEditDeck={(deckId) => { setEditingDeckId(deckId); setDeckManagerView('builder'); }}
              onCreateNew={() => { setEditingDeckId(null); setDeckManagerView('builder'); }}
              onClose={() => { setShowDeckManager(false); setEditingDeckId(null); setDeckManagerView('list'); }}
            />
          )}
        {showDeckManager && deckManagerView === 'builder' && (
            <CosmicDeckBuilderWrapper
              existingDeckId={editingDeckId}
              onClose={() => {
                if (deckManagerSource === 'menu') {
                  setDeckManagerView('list');
                  setEditingDeckId(null);
                } else {
                  setShowDeckManager(false);
                  setEditingDeckId(null);
                }
              }}
            />
          )}
        
      </div>
    );
  }

  if (gamePhase === 'playtestHistory') {
    return (
      <PlaytestHistoryScreen onClose={() => setGamePhase('menu')} />
    );
  }

  if (gamePhase === 'deckManager') {
    return (
      <div className="relative w-full h-full min-h-full" style={{ minHeight: '100%' }}>
        {deckManagerView === 'list' && (
          <CosmicDeckManagerList
            onEditDeck={(deckId) => {
              setEditingDeckId(deckId);
              setDeckManagerView('builder');
            }}
            onCreateNew={() => {
              setEditingDeckId(null);
              setDeckManagerView('builder');
            }}
            onClose={() => {
              setEditingDeckId(null);
              setDeckManagerView('list');
              setShowDeckManager(false);
                if (deckManagerSource === 'selectDeck') {
                  setGamePhase('selectDeck');
                } else {
                  setGamePhase('menu');
                }
            }}
          />
        )}
        {deckManagerView === 'builder' && (
          <CosmicDeckBuilderWrapper
            existingDeckId={editingDeckId}
            onClose={() => {
              setEditingDeckId(null);
              if (deckManagerSource === 'selectDeck') {
                setDeckManagerView('list');
                setGamePhase('selectDeck');
              } else {
                setDeckManagerView('list');
              }
            }}
          />
        )}
      </div>
    );
  }

  // Multiplayer Lobby
  if (gamePhase === 'multiplayerLobby') {
    return (
      <MultiplayerLobby
        onStartGame={(gameData) => {
          setOnlineOpponentLeft(false);
          setMpConnectionLost(false);
          setMpOpponentAway(false);
          setMpReconnectError('');
          onlineMatchStartedRef.current = false;
          setPendingGuestMatch(null);
          setIncomingPeerMoveQueue([]);
          setMultiplayerSession({
            roomCode: gameData.roomCode,
            role: gameData.role,
            playerName: gameData.playerName,
            playerId: gameData.playerId,
            reconnectSecret: gameData.reconnectSecret,
          });
          setGamePhase('selectArmy');
        }}
        onClose={() => {
          setIsMultiplayer(false);
          setMultiplayerSession(null);
          onlineMatchStartedRef.current = false;
          setPendingGuestMatch(null);
          setIncomingPeerMoveQueue([]);
          clearMpSession();
          getMultiplayerManager().disconnect({ intentional: true });
          setGamePhase('menu');
        }}
      />
    );
  }

  // Opzione Mazzi misti (usata in selectArmy, selectDeck, selectDifficulty)
  const MIXED_DECKS_OPTION = 'Eserciti misti';
  const MIXED_DECKS_COLOR = '#a78bfa'; // violet-400

  // Schermata Selezione Armata
  if (gamePhase === 'selectArmy') {
    let availableArmies = Object.keys(ARMY_SETS);
    if (campaignLevel && campaignLevel.playerArmy) {
      availableArmies = [campaignLevel.playerArmy];
    }
    return (
      <ArmySelectCinematic
        onSelect={(armyName) => {
          if (armyName == null) {
            setSelectedArmy(MIXED_DECKS_OPTION);
            setGamePhase('selectDeck');
            return;
          }
          selectArmyAndContinue(armyName);
        }}
        onBack={() => {
          setCampaignLevel(null);
          setSelectedArmy(null);
          setSelectedDeckKey(null);
          setGamePhase(selectedMode === 'campaign' ? 'campaignHub' : 'menu');
        }}
      />
    );
  }

  // Schermata Selezione Esercito
  if (gamePhase === 'selectDeck' && selectedArmy) {
    const isMixedMode = selectedArmy === MIXED_DECKS_OPTION;
    const colors = isMixedMode ? { accent: MIXED_DECKS_COLOR } : ARMY_COLORS[selectedArmy];
    const customDecks = loadCustomDecks();
    const customDecksForArmy = isMixedMode
      ? Object.entries(customDecks).filter(([_, deck]) => isMixedDeck(deck, ARMY_SETS))
      : Object.entries(customDecks).filter(([_, deck]) => deck.army === selectedArmy);
    const predefinedDecks = isMixedMode ? {} : ARMY_DECKS[selectedArmy];
    const campaignDeckSubtitle =
      "Esercito precostruito (A, B, …) o esercito personalizzato — stesse regole del duello core.";
    const campaignProg = loadCampaignProgress(campaignSaveSlot);
    const campDeckIds = campaignProg.meta?.activeDeckCardIds;
    const deckValidHub =
      Array.isArray(campDeckIds) &&
      campDeckIds.length >= 3 &&
      campDeckIds.length <= 10 &&
      totalLeagueForCampaignDeck(campDeckIds, "Figli dell'Orizzonte") <= 30;
    const campaignHubDeckOnly =
      selectedMode === 'campaign' &&
      campaignLevel &&
      campaignLevel.playerArmy === "Figli dell'Orizzonte" &&
      selectedArmy === "Figli dell'Orizzonte" &&
      !isMixedMode;
    const figliCampaignDeckOk =
      selectedMode !== 'campaign' &&
      campaignLevel &&
      campaignLevel.playerArmy === "Figli dell'Orizzonte" &&
      selectedArmy === "Figli dell'Orizzonte" &&
      !isMixedMode &&
      deckValidHub;
    const deckOptions = [];
    if (figliCampaignDeckOk) {
      deckOptions.push({
        key: 'campaign_figli',
        name: 'Esercito campagna (Figli)',
        armyLabel: 'Campagna',
        description: 'Usa l\'esercito modificato nel segmento gestionale.',
        meta: `${campDeckIds.length} carte • Lega ${totalLeagueForCampaignDeck(campDeckIds, "Figli dell'Orizzonte")}/30`,
        accent: '#a78bfa',
        onSelect: () => {
          setSelectedDeckKey(campDeckIds);
          goAfterDeckSelection();
        },
      });
    }
    if (!isMixedMode) {
      Object.entries(predefinedDecks).forEach(([key, deck]) => {
        const deckCards = ARMY_SETS[selectedArmy].filter(card => deck.cards.includes(card.id));
        const totalLeague = deckCards.reduce((sum, c) => sum + c.league, 0);
        deckOptions.push({
          key,
          name: `Esercito ${key} — ${deck.name}`,
          armyLabel: selectedArmy,
          description: deck.description,
          meta: `${deckCards.length} carte • Lega ${totalLeague}`,
          accent: colors.accent,
          onSelect: () => {
            setSelectedDeckKey(key);
            goAfterDeckSelection();
          },
        });
      });
    }
    customDecksForArmy.forEach(([deckId, deck]) => {
      const deckCards = isMixedMode ? resolveDeckCards(deck, ARMY_SETS) : ARMY_SETS[selectedArmy].filter(card => deck.cards.includes(card.id));
      const totalLeague = deckCards.reduce((sum, c) => sum + c.league, 0);
      deckOptions.push({
        key: `custom_${deckId}`,
        name: deck.name,
        armyLabel: deck.army || (isMixedMode ? 'Misto' : selectedArmy),
        description: deck.description || 'Esercito personalizzato',
        meta: `${deck.cards.length} carte • Lega ${totalLeague}/30`,
        accent: colors.accent,
        onSelect: () => {
          setSelectedDeckKey(`custom_${deckId}`);
          goAfterDeckSelection();
        },
      });
    });

    if (campaignHubDeckOnly && !deckValidHub) {
      const errBack = () => {
        setSelectedArmy(null);
        setSelectedDeckKey(null);
        setGamePhase('campaignHub');
      };
      return (
        <MenuScreenLayout title="Esercito campagna" subtitle="L'esercito nel comando non è valido (3–10 carte, Lega ≤30).">
          <p className="text-slate-400 text-sm text-center max-w-md mb-6">
            Modifica l&apos;esercito nel segmento gestionale dell&apos;hub campagna, poi riprova.
          </p>
          <MenuBackButton onClick={errBack}>Torna all&apos;hub campagna</MenuBackButton>
        </MenuScreenLayout>
      );
    }

    if (campaignHubDeckOnly && deckValidHub) {
      return (
        <MenuScreenLayout title="Esercito campagna" subtitle="Esercito costruito nel comando (Figli dell&apos;Orizzonte).">
          <div className="w-full max-w-4xl px-4 mb-6">
            <MenuCard
              accentColor="#a78bfa"
              onClick={() => {
                setSelectedDeckKey(campDeckIds);
                goAfterDeckSelection();
              }}
              className="border-2 border-purple-500/50"
            >
              <div className="text-xs font-bold uppercase tracking-widest text-purple-300 mb-2">Campagna</div>
              <div className="text-xl font-black text-white mb-1">Esercito hub</div>
              <p className="text-slate-400 text-sm mb-3">
                {campDeckIds.length} carte · Lega {totalLeagueForCampaignDeck(campDeckIds, "Figli dell'Orizzonte")}/30
              </p>
            </MenuCard>
          </div>
          <MenuBackButton onClick={() => { setSelectedArmy(null); setGamePhase('selectArmy'); }}>Cambia Armata</MenuBackButton>
        </MenuScreenLayout>
      );
    }

    // === COSMIC DECK SELECT (DUELLO IMMINENTE) ===
    const useCosmicDeckSelect = true;
    if (useCosmicDeckSelect && deckOptions.length > 0 && !campaignHubDeckOnly) {
      const hexToRgb = (hex) => {
        if (!hex || typeof hex !== 'string') return null;
        const clean = hex.replace('#', '');
        if (clean.length !== 6) return null;
        return {
          r: parseInt(clean.slice(0, 2), 16),
          g: parseInt(clean.slice(2, 4), 16),
          b: parseInt(clean.slice(4, 6), 16),
        };
      };
      const rgbToHex = ({ r, g, b }) =>
        `#${[r, g, b]
          .map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0'))
          .join('')}`;
      const sumArmyColors = (armyNames) => {
        const uniques = [...new Set((armyNames || []).filter(Boolean))];
        if (!uniques.length) return { bgColor: MENU_ACCENTS.magenta, bgColorSecondary: '#a78bfa' };
        const sum = uniques
          .map((army) => ARMY_COLORS[army]?.accent || '#a78bfa')
          .map(hexToRgb)
          .filter(Boolean)
          .reduce(
            (acc, rgb) => ({ r: acc.r + rgb.r, g: acc.g + rgb.g, b: acc.b + rgb.b }),
            { r: 0, g: 0, b: 0 }
          );
        const maxChannel = Math.max(sum.r, sum.g, sum.b, 1);
        const norm = maxChannel > 255 ? 255 / maxChannel : 1;
        const primary = { r: sum.r * norm, g: sum.g * norm, b: sum.b * norm };
        const secondary = {
          r: primary.r * 0.75 + 26,
          g: primary.g * 0.75 + 20,
          b: primary.b * 0.75 + 36,
        };
        return { bgColor: rgbToHex(primary), bgColorSecondary: rgbToHex(secondary) };
      };
      const resolveLeadImage = (card) => {
        if (!card) return '';
        return (
          card.image ||
          CARD_IMAGES?.[card.id] ||
          AGENT_IMAGES?.[card.id] ||
          ''
        );
      };

      const cosmicDecks = deckOptions.map((opt) => {
        let deckCards = [];
        let totalLeague = 0;
        let cardsCount = 0;
        let leadImg = '';
        let leadCardId = null;

        if (opt.key === 'campaign_figli') {
          deckCards = (ARMY_SETS[selectedArmy] || []).filter((c) => campDeckIds.includes(c.id));
          cardsCount = campDeckIds.length;
          totalLeague = totalLeagueForCampaignDeck(campDeckIds, "Figli dell'Orizzonte");
          const leadCard = deckCards.slice().sort((a, b) => b.league - a.league)[0];
          leadCardId = leadCard?.id ?? null;
          leadImg = resolveLeadImage(leadCard);
        } else if (opt.key.startsWith('custom_')) {
          const id = opt.key.replace('custom_', '');
          const deck = customDecks[id];
          deckCards = isMixedMode ? resolveDeckCards(deck, ARMY_SETS) : (ARMY_SETS[selectedArmy] || []).filter((c) => deck.cards.includes(c.id));
          totalLeague = deckCards.reduce((s, c) => s + (c.league || 0), 0);
          cardsCount = deck.cards.length;
          leadCardId = deckCards[0]?.id ?? null;
          leadImg = resolveLeadImage(deckCards[0]);
        } else {
          const deck = predefinedDecks[opt.key];
          deckCards = (ARMY_SETS[selectedArmy] || []).filter((c) => deck.cards.includes(c.id));
          totalLeague = deckCards.reduce((s, c) => s + (c.league || 0), 0);
          cardsCount = deckCards.length;
          const leadCard = deckCards.slice().sort((a, b) => b.league - a.league)[0];
          leadCardId = leadCard?.id ?? null;
          leadImg = resolveLeadImage(leadCard);
        }

        const potAvg = deckCards.length ? deckCards.reduce((s, c) => s + (c.power || 0), 0) / deckCards.length : 0;
        const danAvg = deckCards.length ? deckCards.reduce((s, c) => s + (c.damage || 0), 0) / deckCards.length : 0;

        const curve = [0, 0, 0, 0, 0];
        deckCards.forEach((c) => {
          const idx = Math.min(Math.max((c.league || 1) - 1, 0), 4);
          curve[idx]++;
        });

        const triggerMap = new Map();
        deckCards.forEach((c) => {
          const triggerName = c?.ability?.trigger ? (TRIGGER_NAMES[c.ability.trigger] || 'Sempre') : 'Sempre';
          triggerMap.set(triggerName, (triggerMap.get(triggerName) || 0) + 1);
        });
        const triggers = [...triggerMap.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 4)
          .map(([n, v]) => ({ n, v }));

        const warning =
          cardsCount < 10
            ? `${10 - cardsCount} carte mancanti`
            : cardsCount > 10
              ? `${cardsCount - 10} carte in eccesso`
              : totalLeague > 30
                ? `Lega ${totalLeague}/30 superata`
                : null;
        const armies = [...new Set(deckCards.map((c) => c.army || selectedArmy).filter(Boolean))];
        const { bgColor, bgColorSecondary } = sumArmyColors(deckCards.map((c) => c.army || selectedArmy));
        const leadBgPosCfg = DECK_SUMMARY_BG_POSITION?.[leadCardId] ?? DECK_SUMMARY_BG_POSITION?.[String(leadCardId)];
        const leadObjectPosition =
          leadBgPosCfg && typeof leadBgPosCfg === 'object'
            ? `${leadBgPosCfg.x ?? 50}% ${leadBgPosCfg.y ?? 25}%`
            : '50% 25%';
        const previewCards = deckCards.slice(0, 10).map((card) => {
          const cardArmy = card.army || selectedArmy;
          const formattedAbility = formatAbilityHelper(card.ability);
          return {
            ...card,
            army: cardArmy,
            powerDesc: formattedAbility || card.description || '—',
            bonusDesc: ARMY_BONUSES?.[cardArmy]?.description || '—',
            tags: getCardTags(card.id),
          };
        });

        return {
          id: opt.key,
          name: opt.name,
          description: opt.description || 'Nessuna descrizione disponibile.',
          army: deckCards[0]?.army || selectedArmy,
          accentColor: bgColor,
          fac: (opt.armyLabel || selectedArmy || '').toUpperCase(),
          sigil: '◈',
          cards: cardsCount,
          lega: totalLeague,
          pot: Number(potAvg.toFixed(1)),
          dan: Number(danAvg.toFixed(1)),
          win: 0,
          lead: leadImg,
          leadObjectPosition,
          armies,
          previewCards,
          curve,
          triggers,
          bgColor,
          bgColorSecondary,
          warning,
          _opt: opt,
        };
      });

      const opponent = campaignLevel
        ? {
            name: campaignLevel.enemyName || 'AVVERSARIO',
            faction: campaignLevel.enemyArmy || '',
            level: campaignLevel.level || '—',
            sigil: 'X',
          }
        : { name: 'IA', faction: 'AVVERSARIO', level: '—', sigil: 'X' };

      return (
        <div style={{ position: 'absolute', inset: 0, zIndex: 50, background: MENU_ACCENTS.void }}>
          <DeckSelectCosmic
            decks={cosmicDecks}
            opponent={opponent}
            mapName={campaignLevel?.mapName || 'PIANE DEL DEBITO'}
            mode={selectedMode === 'campaign' ? 'CAMPAGNA' : selectedMode === 'multiplayer' ? 'MULTIPLAYER' : 'DUELLO 1v1'}
            onBack={() => {
              setSelectedArmy(null);
              setGamePhase('selectArmy');
            }}
            onSelectDeck={(deck) => deck._opt.onSelect()}
            onPreviewDeck={(deck) => {
              const previewPayload = {
                id: deck.id,
                name: deck.name,
                army: deck.army || selectedArmy,
                accentColor: deck.bgColor || colors.accent,
                cards: (deck.previewCards || []).slice(0, 10),
                _opt: deck._opt,
              };
              setPreviewDeckData(previewPayload);
              setGamePhase('previewDeck');
            }}
            onEditDeck={(deck) => {
              if (deck.id.startsWith('custom_')) {
                setEditingDeckId(deck.id.replace('custom_', ''));
                setDeckManagerSource('selectDeck');
                setDeckManagerView('builder');
                setShowDeckManager(false);
                setGamePhase('deckManager');
              }
            }}
          />
        </div>
      );
    }

    return (
      <CosmicScreenLayout
        title={selectedArmy}
        subtitle={campaignLevel ? campaignDeckSubtitle : (isMixedMode ? 'Eserciti con carte da più armate' : 'Scegli il tuo esercito')}
        footer={(
          <CosmicBannerButton accent={colors.accent} onClick={() => { setSelectedArmy(null); setGamePhase('selectArmy'); }}>
            Cambia armata
          </CosmicBannerButton>
        )}
      >
        {deckOptions.length > 0 ? (
          <CosmicDeckCarousel
            decks={deckOptions}
            onChooseDeck={(deckChoice) => deckChoice.onSelect()}
          />
        ) : null}
        {campaignLevel && customDecksForArmy.length === 0 && (
          <p className="text-center text-slate-400 text-sm mb-2 max-w-lg mx-auto">
            Nessun esercito salvato: puoi usare gli eserciti precostruiti sopra oppure crearne uno in Gestione eserciti.
          </p>
        )}
        {isMixedMode && customDecksForArmy.length === 0 && (
          <div className="text-center text-slate-400 mb-2">
            Nessun esercito misto. Crea un esercito da &quot;Gestione Eserciti&quot; selezionando carte da armate diverse.
          </div>
        )}
      </CosmicScreenLayout>
    );
  }

  if (gamePhase === 'previewDeck' && previewDeckData) {
    return (
      <div style={{ position: 'absolute', inset: 0, zIndex: 50, background: MENU_ACCENTS.void }}>
        <DeckPreviewCosmic
          deck={previewDeckData}
          onBack={() => {
            setPreviewDeckData(null);
            setGamePhase('selectDeck');
          }}
          onEdit={(d) => {
            if (d?.id && d.id.startsWith('custom_')) {
              setPreviewDeckData(null);
              setEditingDeckId(d.id.replace('custom_', ''));
              setDeckManagerSource('selectDeck');
              setDeckManagerView('builder');
              setShowDeckManager(false);
              setGamePhase('deckManager');
            }
          }}
          onConfirm={(d) => {
            setPreviewDeckData(null);
            d?._opt?.onSelect?.();
          }}
        />
      </div>
    );
  }

  // Schermata pronti per match online (dopo scelta deck)
  if (gamePhase === 'onlineDeckReady' && selectedArmy && selectedDeckKey && multiplayerSession) {
    const deck = selectedDeckKey.startsWith('custom_')
      ? (() => {
          const decks = loadCustomDecks();
          const id = selectedDeckKey.replace('custom_', '');
          return decks[id] || { name: 'Esercito personalizzato' };
        })()
      : ARMY_DECKS[selectedArmy]?.[selectedDeckKey] || { name: 'Esercito' };

    const handleOnlineReady = () => {
      if (onlineLocalReady) return;
      setOnlineLocalReady(true);
      const resolved = resolveDeckCardsForArmy(selectedArmy, selectedDeckKey);
      const deckCardIds = resolved.map((c) => c.id).filter(Boolean);
      const relayPayload = {
        type: 'deck_ready',
        army: selectedArmy,
        deckKey: selectedDeckKey,
        ...(deckCardIds.length ? { deckCardIds } : {}),
      };
      getMultiplayerManager().sendRelay(multiplayerSession.roomCode, relayPayload);
    };

    /** Entrambi hanno inviato deck_ready: non siamo "in attesa dell'avversario" ma in sincronizzazione avvio. */
    const bothOnlineDeckReady = onlineLocalReady && !!onlinePeerDeck;
    const onlineReadyButtonLabel = !onlineLocalReady
      ? 'Pronto'
      : bothOnlineDeckReady
        ? 'Avvio partita…'
        : "In attesa dell'avversario…";

    return (
      <MenuScreenLayout
        title="Partita online"
        subtitle={`Codice stanza: ${multiplayerSession.roomCode}`}
      >
        <div className="flex flex-col items-center gap-4 max-w-md w-full px-4">
          <p className="text-slate-300 text-center text-sm">
            Esercito: <span className="text-white font-bold">{deck.name}</span>
          </p>
          <p className="text-xs text-slate-500 text-center">
            {multiplayerSession.role === 'host' ? 'Host' : 'Ospite'} — quando entrambi siete pronti parte la partita.
          </p>
          {onlinePeerDeck && <p className="text-emerald-400 text-sm">L&apos;avversario ha confermato l&apos;esercito</p>}
          <button
            type="button"
            onClick={handleOnlineReady}
            disabled={onlineLocalReady}
            className="w-full px-8 py-4 font-bold rounded-lg disabled:opacity-50 transition-opacity"
            style={{
              fontFamily: HUD_ORATORIO_FONT_UI,
              color: MENU_ACCENTS.void,
              border: `1.5px solid ${MENU_ACCENTS.magenta}`,
              background: `linear-gradient(90deg, ${MENU_ACCENTS.magenta} 0%, #a855f7 55%, ${MENU_ACCENTS.pink} 100%)`,
              boxShadow: '0 0 24px rgba(192, 38, 211, 0.35)',
            }}
          >
            {onlineReadyButtonLabel}
          </button>
          <MenuBackButton
            onClick={() => {
              setSelectedDeckKey(null);
              setOnlineLocalReady(false);
              setOnlinePeerDeck(null);
              onlineMatchStartedRef.current = false;
              setGamePhase('selectDeck');
            }}
          >
            Cambia esercito
          </MenuBackButton>
        </div>
      </MenuScreenLayout>
    );
  }
  
  // Schermata Selezione Difficoltà
  if (gamePhase === 'selectDifficulty') {
    // In campagna, usa la difficoltà del livello e avvia direttamente
    if (campaignLevel) {
      // Avvia il gioco con la difficoltà del livello
      if (selectedArmy && selectedDeckKey) {
        const launch = buildCampaignDuelLaunchConfig(campaignLevel, null);
        startStandardGame(
          selectedArmy, 
          selectedDeckKey, 
          'campaign', 
          campaignLevel.difficulty, 
          ALL_BATTLEFIELDS,
          campaignLevel.enemyArmy,
          campaignLevel.enemyDeck,
          launch.campaignDuelMod
        );
      }
      // Non renderizzare nulla, la partita partirà automaticamente
      return null;
    }
    
    // Modalità normale: mostra selezione difficoltà
    if (!selectedArmy || !selectedDeckKey) {
      return null;
    }
    
    const isMixedMode = selectedArmy === MIXED_DECKS_OPTION;
    const colors = isMixedMode ? { accent: MIXED_DECKS_COLOR } : ARMY_COLORS[selectedArmy];
    const deck = selectedDeckKey.startsWith('custom_')
      ? (() => { const decks = loadCustomDecks(); const id = selectedDeckKey.replace('custom_', ''); return decks[id] || { name: 'Esercito personalizzato' }; })()
      : (ARMY_DECKS[selectedArmy]?.[selectedDeckKey] || { name: 'Esercito' });
    const difficulties = getAllDifficulties();

    return (
      <CosmicScreenLayout
        title={selectedArmy}
        subtitle={`"${deck.name}" — Scegli il livello di difficoltà dell'IA`}
        footer={(
          <CosmicBannerButton accent={colors.accent} onClick={() => { setSelectedDeckKey(null); setGamePhase('selectDeck'); }}>
            Cambia esercito
          </CosmicBannerButton>
        )}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl w-full px-4">
          {difficulties.map((diff) => (
            <button
              type="button"
              key={diff.id}
              onClick={() => startStandardGame(selectedArmy, selectedDeckKey, selectedMode, diff.id, ALL_BATTLEFIELDS)}
              style={{
                border: `1.5px solid ${diff.color}`,
                background: 'linear-gradient(180deg, rgba(20,8,28,0.95) 0%, rgba(8,7,13,0.95) 100%)',
                padding: '16px',
                color: MENU_ACCENTS.text,
                textAlign: 'left',
                minHeight: '164px',
                boxShadow: `0 0 20px ${diff.color}2f`,
                cursor: 'pointer',
              }}
            >
              <div className="flex items-center gap-3 mb-3">
                <Icon name={diff.icon} type="cardIcon" size={30} />
                <div>
                  <div style={{ fontFamily: "'Cinzel', serif", fontSize: '1.05rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{diff.name}</div>
                  <div style={{ fontSize: '0.8rem', color: '#b9b2c8' }}>{diff.description}</div>
                </div>
              </div>
              <p style={{ margin: 0, fontSize: '0.86rem', color: '#d2cce0' }}>{diff.longDescription}</p>
            </button>
          ))}
        </div>
        {isMixedMode ? (
          <div style={{ color: '#b9b2c8', fontFamily: "'Share Tech Mono', monospace", fontSize: '0.72rem', letterSpacing: '0.1em' }}>
            Armata mista selezionata.
          </div>
        ) : (
          <div style={{ color: colors.accent, fontFamily: "'Share Tech Mono', monospace", fontSize: '0.72rem', letterSpacing: '0.1em' }}>
            Preparazione duello: {selectedArmy}
          </div>
        )}
      </CosmicScreenLayout>
    );
  }

  // Schermata Galleria
  if (gamePhase === 'gallery') {
    const armies = Object.keys(ARMY_SETS);
    const allAgentsList = ALL_AGENTS;
    const filteredAgents = selectedArmyFilter ? allAgentsList.filter(a => a.army === selectedArmyFilter) : allAgentsList;
    // Ordine griglia: per lega (alta → bassa), poi per ID — così le carte nuove in coda al dataset non finiscono dopo tutte le L2 pur essendo L5/L4.
    const galleryAgentsSorted = [...filteredAgents].sort((a, b) => {
      if (b.league !== a.league) return b.league - a.league;
      return a.id - b.id;
    });

    const galleryInner = (
      <div className="w-full flex flex-col overflow-hidden" style={{ flex: '1 1 0', minHeight: 0 }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b w-full" style={{ borderColor: '#334155' }}>
          <button
            onClick={() => setGamePhase('menu')}
            className="px-4 py-2 flex items-center gap-2 transition-all font-semibold"
            style={{ background: MENU_ACCENTS.panel, border: '1.5px solid #334155', color: '#94A3B8' }}
          >
            <span>←</span> Menu
          </button>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: MENU_ACCENTS.pink, fontFamily: HUD_ORATORIO_FONT_UI }}>
            <Icon name="book" type="cardIcon" size={28} color={MENU_ACCENTS.pink} /> GALLERIA
          </h1>
          <div className="w-24" />
        </div>
        {/* Tabs */}
        <div className="flex justify-center gap-4 py-4 border-b w-full" style={{ borderColor: '#334155' }}>
          <button
            onClick={() => startTransition(() => setGalleryTab('agents'))}
            className="px-6 py-2 font-bold transition-all flex items-center gap-2"
            style={galleryTab === 'agents' ? { background: MENU_ACCENTS.magenta, color: MENU_ACCENTS.void, border: `1.5px solid ${MENU_ACCENTS.magenta}` } : { background: MENU_ACCENTS.panel, color: '#94A3B8', border: '1.5px solid #334155' }}
          >
            <Icon name="card" type="cardIcon" size={18} /> Agenti ({allAgentsList.length})
          </button>
          <button
            onClick={() => startTransition(() => setGalleryTab('battlefields'))}
            className="px-6 py-2 font-bold transition-all flex items-center gap-2"
            style={galleryTab === 'battlefields' ? { background: MENU_ACCENTS.magenta, color: MENU_ACCENTS.void, border: `1.5px solid ${MENU_ACCENTS.magenta}` } : { background: MENU_ACCENTS.panel, color: '#94A3B8', border: '1.5px solid #334155' }}
          >
            <Icon name="tower" type="cardIcon" size={18} /> Campi ({ALL_BATTLEFIELDS.length})
          </button>
        </div>
        {/* Content - scroll nascosto, scrollabile con rotella/touch */}
        <div
          className="overflow-y-auto overflow-x-hidden p-4 satze-hide-scrollbar"
          style={{ flex: '1 1 0', minHeight: 0 }}
        >
          {!galleryContentReady ? (
            <div className="flex items-center justify-center py-24">
              <div className="flex flex-col items-center gap-3 text-slate-400">
                <div className="w-8 h-8 border-2 border-amber-500/50 border-t-amber-400 rounded-full animate-spin" />
                <p className="text-sm">Caricamento galleria...</p>
              </div>
            </div>
          ) : galleryTab === 'agents' ? (
            !agentsTabReady ? (
              <div className="flex items-center justify-center py-24">
                <div className="flex flex-col items-center gap-3 text-slate-400">
                  <div className="w-8 h-8 border-2 border-amber-500/50 border-t-amber-400 rounded-full animate-spin" />
                  <p className="text-sm">Caricamento agenti...</p>
                </div>
              </div>
            ) : (
            <>
              {/* Filtro per armata */}
              <div className="flex flex-wrap justify-center gap-2 mb-6">
                <button
                  onClick={() => setSelectedArmyFilter(null)}
                  className={`px-3 py-1 rounded-full text-sm font-bold transition-all ${
                    selectedArmyFilter === null 
                      ? 'bg-white text-black' 
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  Tutte
                </button>
                {armies.map(army => (
                  <button
                    key={army}
                    onClick={() => setSelectedArmyFilter(army)}
                    className={`px-3 py-1 rounded-full text-sm font-bold transition-all ${
                      selectedArmyFilter === army 
                        ? 'text-black' 
                        : 'text-white/70 hover:text-white'
                    }`}
                    style={{
                      backgroundColor: selectedArmyFilter === army 
                        ? ARMY_COLORS[army]?.accent 
                        : 'rgba(51,65,85,0.5)'
                    }}
                  >
                    {army}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap justify-center items-center gap-3 mb-6 px-2">
                <span className="text-xs uppercase tracking-wider font-semibold text-slate-500">Layout carte</span>
                <div className="flex flex-wrap justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => startTransition(() => setGalleryCardLayout('reworkP4'))}
                    className="px-4 py-1.5 text-sm font-bold transition-all"
                    style={
                      galleryCardLayout === 'reworkP4'
                        ? { background: MENU_ACCENTS.magenta, color: MENU_ACCENTS.void, border: `1.5px solid ${MENU_ACCENTS.magenta}` }
                        : { background: MENU_ACCENTS.panel, color: '#94A3B8', border: '1.5px solid #334155' }
                    }
                  >
                    P4 React
                  </button>
                  <button
                    type="button"
                    onClick={() => startTransition(() => setGalleryCardLayout('reworkP4html'))}
                    className="px-4 py-1.5 text-sm font-bold transition-all"
                    style={
                      galleryCardLayout === 'reworkP4html'
                        ? { background: MENU_ACCENTS.magenta, color: MENU_ACCENTS.void, border: `1.5px solid ${MENU_ACCENTS.magenta}` }
                        : { background: MENU_ACCENTS.panel, color: '#94A3B8', border: '1.5px solid #334155' }
                    }
                  >
                    P4 (mock HTML)
                  </button>
                </div>
              </div>
              
              {/* Griglia Agenti (rendering incrementale) */}
              <div className="grid grid-cols-4 gap-6 justify-items-center">
                {galleryAgentsSorted.slice(0, galleryVisibleCount).map((agent) => (
                  <div key={agent.id} className="flex flex-col items-center gap-2 group">
                    <div className="cursor-pointer">
                      {galleryCardLayout === 'reworkP4html' ? (
                        <div onClick={() => setSelectedCardForModal(agent)}>
                          <CardReworkP4AsHtml agent={agent} />
                        </div>
                      ) : (
                        <GameCard
                          cardLayout={galleryCardLayout}
                          agent={agent}
                          showBonus={false}
                          onClick={() => setSelectedCardForModal(agent)}
                        />
                      )}
                    </div>
                    {agent.flavour && (
                      <div className="bg-slate-800/50 rounded-lg p-2 mt-1 w-[230px]">
                        <p className="text-slate-400 text-[10px] italic text-center leading-relaxed">
                          "{agent.flavour}"
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {galleryVisibleCount < galleryAgentsSorted.length && (
                <div className="flex justify-center mt-6">
                  <button
                    type="button"
                    onClick={() => startTransition(() => setGalleryVisibleCount((n) => n + GALLERY_PAGE_SIZE))}
                    className="px-6 py-2 font-bold transition-all"
                    style={{ background: MENU_ACCENTS.panel, color: '#94A3B8', border: '1.5px solid #334155' }}
                  >
                    Mostra altre carte ({galleryAgentsSorted.length - galleryVisibleCount} rimanenti)
                  </button>
                </div>
              )}
              
              {/* Modal per carta ingrandita */}
              {selectedCardForModal && (
                <div 
                  className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm animate-fade-in overflow-y-auto"
                  onClick={() => setSelectedCardForModal(null)}
                >
                  <div 
                    className="relative max-w-5xl w-full p-4 md:p-8 my-8"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Pulsante chiusura */}
                    <button
                      onClick={() => setSelectedCardForModal(null)}
                      className="absolute top-2 right-2 md:top-4 md:right-4 z-10 w-10 h-10 bg-slate-800/90 hover:bg-slate-700 text-white rounded-full flex items-center justify-center transition-all shadow-lg hover:scale-110"
                      aria-label="Chiudi"
                    >
                      <span className="text-2xl leading-none">×</span>
                    </button>
                    
                    {/* Carta ingrandita */}
                    <div className="flex justify-center mb-[124px]">
                      <div className="transform scale-125 md:scale-150 origin-center transition-transform duration-300">
                        {galleryCardLayout === 'reworkP4html' ? (
                          <CardReworkP4AsHtml agent={selectedCardForModal} />
                        ) : (
                          <GameCard cardLayout={galleryCardLayout} agent={selectedCardForModal} showBonus />
                        )}
                      </div>
                    </div>
                    
                    {/* Descrizione e flavour */}
                    <div className="bg-slate-800/90 rounded-xl p-4 md:p-6 max-w-3xl mx-auto backdrop-blur-sm">
                      {selectedCardForModal.description && (() => {
                        const raw = selectedCardForModal.description;
                        const body = raw.replace(/^Potere:\s*/i, '');
                        return (
                          <p className="text-white text-base md:text-lg mb-4">
                            <span className="text-amber-400 font-bold">Potere: </span>
                            {body}
                          </p>
                        );
                      })()}
                      {getCardTags(selectedCardForModal.id).length > 0 && (
                        <div className="mb-4">
                          <CardTagsRow cardId={selectedCardForModal.id} compact={false} splitRoleRows />
                        </div>
                      )}
                      {selectedCardForModal.flavour && (
                        <p className="text-slate-300 text-sm md:text-base italic leading-relaxed border-t border-slate-700 pt-4">
                          "{selectedCardForModal.flavour}"
                        </p>
                      )}
                    </div>
                    
                    {/* Istruzione per chiudere */}
                    <p className="text-center text-slate-500 text-xs mt-4">
                      Clicca fuori o premi ESC per chiudere
                    </p>
                  </div>
                </div>
              )}
            </>
            )
          ) : (
            /* Campi di Battaglia: riempie il contenitore, scroll solo nella griglia */
            <div className="h-full min-h-0 flex flex-col">
              <BattlefieldGallery />
            </div>
          )}
        </div>
      </div>
    );

    return <MenuScreenLayout centered={false}>{galleryInner}</MenuScreenLayout>;
  }

// Schermata di gioco

  // Posizioni fisse per le carte nelle mani (diagonale)
  const iaCardPositions = [
    { left: 667, top: 30 },
    { left: 507, top: 60 },
    { left: 347, top: 90 },
    { left: 187, top: 120 },
    { left: 27, top: 150 },
  ];
  
  const playerCardPositions = [
    { right: 667, bottom: 30 },
    { right: 507, bottom: 60 },
    { right: 347, bottom: 90 },
    { right: 187, bottom: 120 },
    { right: 27, bottom: 150 },
  ];

  // Sfondo duello: immagine specifica per ogni campo di battaglia (nessun gradiente)
  const activeFieldForBg = (currentFieldIndex !== null && battlefields[currentFieldIndex])
    ? battlefields[currentFieldIndex]
    : battleResult?.field;
  const fieldBgImage = activeFieldForBg?.bgImage || null;
  const entranceAnimationType = activeFieldForBg ? getBattlefieldAnimationType(activeFieldForBg.id) : 'default';

  return (
    <div 
      className="relative overflow-visible"
      style={{
        width: '1920px', 
        height: '1080px', 
        minWidth: '1920px', 
        minHeight: '1080px',
        maxWidth: '1920px',
        maxHeight: '1080px',
        margin: '0 auto',
        display: 'block',
        backgroundColor: PALETTE.deepVoid,
      }}
    >
      {onlineOpponentLeft && (
        <div
          className="absolute inset-0 z-[300] flex items-center justify-center bg-black/75 pointer-events-auto px-4"
          style={{ fontFamily: HUD_ORATORIO_FONT_UI }}
        >
          <div
            className="max-w-md w-full p-6 rounded-xl border-2 bg-[#0a0e1a] border-[#D4A847]"
          >
            <h3 className="text-amber-400 font-bold text-lg mb-2 text-center">Avversario disconnesso</h3>
            <p className="text-slate-300 text-sm mb-4 text-center">La connessione con l&apos;altro giocatore si è interrotta in modo definitivo (tempo scaduto o uscita).</p>
            <button
              type="button"
              onClick={() => {
                setOnlineOpponentLeft(false);
                onlineMatchStartedRef.current = false;
                setPendingGuestMatch(null);
                setIncomingPeerMoveQueue([]);
                setMultiplayerSession(null);
                setIsMultiplayer(false);
                clearMpSession();
                getMultiplayerManager().disconnect({ intentional: true });
                setGamePhase('menu');
              }}
              className="w-full py-3 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold"
            >
              Torna al menu
            </button>
          </div>
        </div>
      )}
      {mpConnectionLost && !onlineOpponentLeft && isMultiplayer && multiplayerSession?.reconnectSecret && (
        <div
          className="absolute inset-0 z-[299] flex items-center justify-center bg-black/80 pointer-events-auto px-4"
          style={{ fontFamily: HUD_ORATORIO_FONT_UI }}
        >
          <div
            className="max-w-md w-full p-6 rounded-xl border-2 bg-[#0a0e1a] border-[#D4A847]"
          >
            <h3 className="text-amber-400 font-bold text-lg mb-2 text-center">Connessione persa</h3>
            <p className="text-slate-300 text-sm mb-3 text-center">
              Il collegamento con il server multiplayer si è interrotto. Puoi riconnetterti alla stessa stanza con il tuo token.
            </p>
            {mpReconnectError && (
              <p className="text-red-400 text-xs mb-3 text-center">{mpReconnectError}</p>
            )}
            <button
              type="button"
              onClick={attemptMpSelfReconnect}
              disabled={mpReconnecting}
              className="w-full py-3 mb-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold disabled:opacity-50"
            >
              {mpReconnecting ? 'Riconnessione…' : 'Riconnetti'}
            </button>
            <button
              type="button"
              onClick={abandonMultiplayerSession}
              className="w-full py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm"
            >
              Abbandona e torna al menu
            </button>
          </div>
        </div>
      )}
      {mpOpponentAway && !mpConnectionLost && !onlineOpponentLeft && isMultiplayer && (
        <div
          className="absolute inset-0 z-[298] flex items-center justify-center bg-black/55 pointer-events-auto px-4"
          style={{ fontFamily: HUD_ORATORIO_FONT_UI }}
        >
          <div
            className="max-w-lg w-full p-5 rounded-xl border bg-[#0a0e1a]/95 border-[#D4A847]/60"
          >
            <p className="text-amber-200 text-center text-sm font-semibold mb-1">In attesa dell&apos;avversario</p>
            <p className="text-slate-400 text-center text-xs">
              La sua connessione si è interrotta temporaneamente. Se non si riconnette entro alcuni minuti (host assente), la stanza verrà chiusa.
            </p>
          </div>
        </div>
      )}
      {/* Immagine campo con animazione reveal (effetto per tema armata) - galleria e duello */}
      {fieldBgImage && (
        <div key={fieldBgImage} className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
          <BattlefieldReveal imageSrc={fieldBgImage} animationType={entranceAnimationType} />
        </div>
      )}
      {/* ============================================ */}
      {/* COLONNA SINISTRA - z-index 1 */}
      {/* ============================================ */}
      <div 
        className={`absolute top-0 left-0 flex flex-col p-4 gap-6 justify-end overflow-visible ${
          'border-r border-slate-600/50'
        } ${
          gamePhase === 'result' ? 'animate-fade-out-panels pointer-events-none' : ''
        }`}
        style={{
          width: '428px',
          height: '1080px',
          zIndex: 1,
          fontFamily: HUD_ORATORIO_FONT_UI,
          background: 'rgba(10, 14, 26, 0.4)',
        }}
      >
        {/* Anteprima Carta - inizia a metà colonna */}
        <div 
          className={`p-3 mb-4 flex flex-col overflow-hidden satze-hide-scrollbar ${
            'satze-hud-panel'
          }`} 
          style={{
            height: '530px',
            fontFamily: HUD_ORATORIO_FONT_UI,
            position: 'relative',
            zIndex: isGuidedIntroPreviewPhase ? 21 : undefined,
            border: isGuidedIntroPreviewPhase ? '2px solid rgba(251, 191, 36, 0.95)' : undefined,
            boxShadow: isGuidedIntroPreviewPhase ? '0 0 24px rgba(251, 191, 36, 0.45)' : undefined,
          }}
        >
          <div 
            className="text-sm font-bold mb-2 uppercase tracking-[0.15em]"
            style={{ color: PALETTE.textPrimary, textShadow: `0 0 20px ${PALETTE.amber}44, 0 2px 4px #000` }}
          >
            ANTEPRIMA
          </div>
          <div className="flex-1 overflow-y-auto flex flex-col items-center">
            {(hoveredCard || lastPreviewCard) ? (
              <div className="flex flex-col items-center w-full">
                <GameCard
                  cardLayout={galleryCardLayout}
                  agent={(hoveredCard || lastPreviewCard).agent}
                  showBonus={(hoveredCard || lastPreviewCard).showBonus !== undefined
                    ? (hoveredCard || lastPreviewCard).showBonus
                    : ((hoveredCard || lastPreviewCard).isPlayer !== false
                        ? playerArmyBonuses
                        : enemyArmyBonuses)[(hoveredCard || lastPreviewCard).agent?.army] &&
                      isBonusTriggerSatisfied(
                        (hoveredCard || lastPreviewCard).agent?.army,
                        (hoveredCard || lastPreviewCard).isPlayer !== false,
                        (hoveredCard || lastPreviewCard).agent
                      )}
                  bonusBaseInactive={(() => {
                    const p = hoveredCard || lastPreviewCard;
                    const a = p.agent;
                    const map = p.isPlayer !== false ? playerArmyBonuses : enemyArmyBonuses;
                    return Boolean(ARMY_BONUSES[a?.army]) && !map?.[a?.army];
                  })()}
                  modifiedPower={(hoveredCard || lastPreviewCard).modifiedPower}
                  modifiedDamage={(hoveredCard || lastPreviewCard).modifiedDamage}
                  abilityCurrentValue={getAbilityCurrentValue((hoveredCard || lastPreviewCard).agent, (hoveredCard || lastPreviewCard).isPlayer !== false)}
                  disabled
                />
                <div className="mt-3 w-full">
                  <div 
                    className="p-4 space-y-3 rounded-xl"
                    style={{ background: `${PALETTE.deepVoid}99`, border: `1px solid ${PALETTE.slate}` }}
                  >
                    {(hoveredCard || lastPreviewCard).agent?.ability && (() => {
                      const fullText = getAbilityExplanation((hoveredCard || lastPreviewCard).agent.ability);
                      if (!fullText) return null;
                      const colonIdx = fullText.indexOf(': ');
                      const hasTrigger = colonIdx !== undefined && colonIdx >= 0;
                      const triggerPart = hasTrigger ? fullText.substring(0, colonIdx + 2) : null;
                      const effectPart = hasTrigger ? fullText.substring(colonIdx + 2) : fullText;
                      return (
                        <div>
                          <div 
                            className="text-xs font-bold uppercase tracking-[0.12em] mb-2 flex items-center gap-1.5"
                            style={{ color: PALETTE.amber }}
                          >
                            <Icon name="lightning" type="cardIcon" size={14} /> Potere
                          </div>
                          <div className="space-y-2">
                            {triggerPart && (
                              <div 
                                className="pl-3 py-1.5 rounded-r border-l-2"
                                style={{
                                  background: `${PALETTE.amber}18`,
                                  borderColor: PALETTE.amber,
                                  color: PALETTE.amber,
                                  fontVariant: 'tabular-nums',
                                }}
                              >
                                <span className="text-sm font-semibold">{triggerPart}</span>
                              </div>
                            )}
                            <p 
                              className="text-sm leading-[1.7] tracking-wide" 
                              style={{ color: PALETTE.textSecondary, fontVariant: 'tabular-nums' }}
                            >
                              {effectPart}
                            </p>
                          </div>
                        </div>
                      );
                    })()}
                    {(hoveredCard || lastPreviewCard).agent?.flavour && (
                      <div
                        className={(hoveredCard || lastPreviewCard).agent?.ability ? 'pt-3' : ''}
                        style={{ borderTop: `1px solid ${PALETTE.slate}` }}
                      >
                        <p 
                          className="text-sm italic leading-[1.75]" 
                          style={{ color: PALETTE.textPrimary, opacity: 0.92 }}
                        >
                          "{(hoveredCard || lastPreviewCard).agent.flavour}"
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : hoveredField ? (
              <div className="flex flex-col items-center w-full">
                <div 
                  className="rounded-xl p-4 shadow-lg w-full"
                  style={{ background: `${PALETTE.deepVoid}cc`, border: `1.5px solid ${PALETTE.amber}88`, boxShadow: `0 0 20px ${PALETTE.amber}22` }}
                >
                  <div className="text-center">
                    <div className="flex justify-center mb-2"><Icon name={hoveredField.icon} type="cardIcon" size={32} /></div>
                    <div className="text-lg font-bold mb-1" style={{ color: PALETTE.textPrimary }}>{hoveredField.name}</div>
                    <div className="text-sm" style={{ color: PALETTE.amber }}>{hoveredField.effect}</div>
                  </div>
                </div>
                {hoveredField.flavour && (
                  <div className="mt-2 w-full">
                    <div 
                      className="rounded-xl p-2"
                      style={{ background: `${PALETTE.deepVoid}99`, border: `1px solid ${PALETTE.slate}` }}
                    >
                      <p className="text-[10px] italic leading-relaxed" style={{ color: PALETTE.textSecondary }}>
                        "{hoveredField.flavour}"
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-xs py-8" style={{ color: PALETTE.textSecondary }}>
                Clicca su una carta<br/>per vedere i dettagli
              </div>
            )}
          </div>
        </div>
        
        {/* Tasto Glossario */}
        <button
          ref={glossaryButtonRef}
          onClick={handleGlossaryButtonClick}
          className="block w-full transition-all duration-250 overflow-hidden border rounded-2xl py-3"
          style={{
            position: 'relative',
            zIndex: isGuidedIntroGlossaryPromptPhase || isGuidedIntroGlossaryOpenPhase ? 21 : undefined,
            background: `url(/Immagini_bg/adam_samson_hardcover_book_spine_dark_leather_binding_gold_de_e0c822f3-c6e7-43d5-8296-0a58b1c0173f_1.webp) center/cover no-repeat`,
            border: isGuidedIntroGlossaryPromptPhase || isGuidedIntroGlossaryOpenPhase
              ? '2px solid rgba(251, 191, 36, 0.95)'
              : `1.5px solid ${PALETTE.slate}`,
            boxShadow: isGuidedIntroGlossaryPromptPhase || isGuidedIntroGlossaryOpenPhase
              ? '0 0 24px rgba(251, 191, 36, 0.45)'
              : '0 2px 8px #000',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = PALETTE.gold;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = PALETTE.slate;
          }}
          aria-label="Glossario"
        />
      </div>

      {/* ============================================ */}
      {/* COLONNA DESTRA - z-index 1 */}
      {/* ============================================ */}
      <div 
        className={`absolute top-0 right-0 flex flex-col p-4 gap-6 overflow-visible ${
          'border-l border-slate-600/50'
        } ${
          gamePhase === 'result' ? 'animate-fade-out-panels-right pointer-events-none' : ''
        }`}
        style={{
          width: '428px',
          height: '1080px',
          zIndex: 1,
          background: 'rgba(10, 14, 26, 0.4)',
        }}
      >
        {/* Round e Stato Partita - sopra il tabellone campi (grafica menù principale) */}
        <div 
          className="p-2 flex-shrink-0 satze-hud-panel"
          style={{ fontFamily: HUD_ORATORIO_FONT_UI }}
        >
        {/* Campi conquistati: IA a sinistra, Tu a destra - colori dalle armate */}
          {(() => {
            const getArmies = (winner) => Object.entries(conqueredFields)
              .filter(([, v]) => (typeof v === 'object' && v?.winner === winner) || (typeof v === 'string' && (winner === 'player' ? playerHand : enemyHand).some(c => c.army === v)))
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([, v]) => typeof v === 'object' ? v.army : v);
            const playerArmies = getArmies('player');
            const enemyArmies = getArmies('enemy');
            /* Stendardo verticale medievale: gonfalone con code */
            const BannerSilhouette = ({ filled, color }) => {
              const c = color || PALETTE.slate;
              return (
                <svg viewBox="0 0 24 24" fill={filled ? c : 'none'} stroke={c} strokeWidth="1.2" strokeLinejoin="round" className="w-full h-full" style={{ opacity: filled ? 1 : 0.5 }}>
                  <path d="M4 2h16v16l-4 4-4-4-4 4-4-4v-16z" />
                </svg>
              );
            };
            const Slot = ({ filled, army }) => {
              const colors = army && ARMY_COLORS[army];
              const accent = colors?.accent || PALETTE.slate;
              const isFilled = filled && colors?.accent;
              const strokeColor = isFilled ? accent : `${PALETTE.slate}66`;
              return (
                <div 
                  className="flex-1 aspect-square min-w-[28px] max-w-[40px] flex items-center justify-center p-0.5"
                  style={{
                    background: isFilled ? `${accent}22` : 'transparent',
                    border: `1px solid ${strokeColor}`,
                    borderRadius: '4px',
                    boxShadow: isFilled ? `0 0 6px ${accent}44` : 'none',
                  }}
                >
                  <BannerSilhouette filled={isFilled} color={isFilled ? accent : strokeColor} />
                </div>
              );
            };
            const Row = ({ armies }) => (
              <div className="flex items-center justify-center gap-2 py-0.5">
                <div className="flex gap-2 flex-1 min-w-0 justify-center">
                  {[0,1,2].map(i => <Slot key={i} filled={i < armies.length} army={armies[i]} />)}
                </div>
              </div>
            );
            return (
              <div className="flex justify-between gap-4 mb-1">
                <div className="flex-1 min-w-0">
                  <Row armies={enemyArmies} />
                </div>
                <div className="flex-1 min-w-0">
                  <Row armies={playerArmies} />
                </div>
              </div>
            );
          })()}
          {/* Condizione di vittoria */}
          <div 
            className="px-3 py-2 text-center rounded-xl"
            style={{
              background: 'rgba(56, 189, 248, 0.08)',
              border: '1px solid rgba(56, 189, 248, 0.28)',
              boxShadow: 'inset 0 0 20px rgba(0, 0, 0, 0.35)',
            }}
          >
            <div className="text-[11px] uppercase tracking-wider mb-1" style={{ color: PALETTE.textSecondary, textShadow: '0 1px 2px #000' }}>Condizione di Vittoria</div>
            <div className="text-sm font-bold leading-tight" style={{ color: PALETTE.amber, textShadow: `0 1px 3px #000, 0 0 12px ${PALETTE.amber}44` }}>
              {gameMode === 'bareHands' 
                ? 'Conquista 3 campi!'
                : (roundNumber >= 5
                    ? "Annienta il nemico!"
                    : 'Conquista 3 campi!')}
            </div>
            {gameMode !== 'bareHands' && roundNumber < 5 && (
              <div className="text-xs mt-1.5" style={{ color: PALETTE.textSecondary, textShadow: '0 1px 2px #000' }}>
                Cambierà tra {5 - roundNumber} turn{5 - roundNumber === 1 ? 'o' : 'i'}
              </div>
            )}
            {gameMode !== 'bareHands' && roundNumber >= 5 && (
              <div className="text-xs mt-1.5" style={{ color: PALETTE.textSecondary, textShadow: '0 1px 2px #000' }}>
                (Vince chi alla fine del turno ha più PV)
              </div>
            )}
          </div>
        </div>

        {/* Tabellone Campi */}
        <div 
          className={`p-2 -mt-4 flex flex-col h-[300px] satze-hud-panel ${gamePhase === 'selectField' && isPlayerFirst && !tabelloneTiltDismissed && !guidedMatch.active ? 'animate-satze-tabellone-tilt' : ''} ${isGuidedIntroBattlefieldsPhase ? 'animate-satze-guided-twinkle' : ''}`} 
          onMouseEnter={() => setTabelloneTiltDismissed(true)}
          style={{
            fontFamily: HUD_ORATORIO_FONT_UI,
            position: 'relative',
            zIndex: isGuidedIntroBattlefieldsPhase ? 21 : undefined,
            border: isGuidedIntroBattlefieldsPhase ? '2px solid rgba(251, 191, 36, 0.95)' : undefined,
            boxShadow: isGuidedIntroBattlefieldsPhase ? '0 0 24px rgba(251, 191, 36, 0.45)' : undefined,
          }}
        >
          <div 
            className="text-sm font-bold mb-1 text-center uppercase tracking-[0.15em]"
            style={{ color: PALETTE.textPrimary, textShadow: `0 0 20px ${PALETTE.amber}44, 0 2px 4px #000` }}
          >
            Prossima conquista!
          </div>

          {/* Lista Campi di Battaglia - 5 righe */}
          <div 
            className={`grid grid-rows-5 grid-cols-1 gap-0.5 flex-1 min-h-0 ${
              gamePhase === 'result' ? 'animate-fade-out-panels pointer-events-none' : ''
            }`}
          >
            {battlefields.map((field, idx) => {
              const canSelectField = isPlayerFirst && 
                !(idx in conqueredFields) && 
                idx < revealedFields &&
                (gamePhase === 'selectField' || gamePhase === 'selectAgent');
              
              return (
                <MiniBattlefield
                  key={field.id}
                  field={field}
                  selected={currentFieldIndex === idx}
                  conquered={idx in conqueredFields}
                  conqueredBy={typeof conqueredFields[idx] === 'object' ? conqueredFields[idx]?.army : conqueredFields[idx]}
                  hidden={idx >= revealedFields}
                  turnsUntilReveal={idx >= revealedFields ? idx - revealedFields + 1 : 0}
                  onClick={canSelectField ? () => handleFieldSelect(field) : undefined}
                  onHover={setHoveredField}
                  guidedHighlight={isGuidedIntroBattlefieldsPhase}
                />
              );
            })}
          </div>
        </div>
        
        {/* Log Battaglia / Slider Focus Coin - flip come carta */}
        <div className={`satze-panel-flip-container ${gamePhase === 'result' ? 'pointer-events-none' : ''}`}>
          <div className={`satze-panel-flip-inner ${gamePhase === 'selectAgent' && selectedAgent ? 'satze-panel-flipped' : ''}`}>
            {/* Fronte: Log */}
            <div className="satze-panel-flip-face">
              <LogPanel
                logs={logs}
                gamePhase={gamePhase}
                playerColor={getHandAccentColor(playerHand, ARMY_COLORS, '#4FD1C5')}
                enemyColor={getHandAccentColor(enemyHand, ARMY_COLORS, '#D946EF')}
              />
            </div>
            {/* Retro: FC */}
            <div ref={fcPanelRef} className="satze-panel-flip-face satze-panel-flip-face-back p-2 flex flex-col overflow-hidden items-center justify-start pt-4 satze-hide-scrollbar satze-fc-panel rounded-3xl"
              style={{
                background: `linear-gradient(135deg, rgba(10, 14, 26, 0.88) 0%, rgba(15, 23, 42, 0.85) 100%), url(/Immagini_bg/CampoFC_bg.webp) center/cover no-repeat`,
                border: '2px solid #000',
                boxShadow: '3px 3px 0 #000',
                fontFamily: HUD_ORATORIO_FONT_UI
              }}>
              <div 
                className="text-base font-bold uppercase tracking-[0.2em] mb-1 transition-all duration-300" 
                style={{ 
                  WebkitFontSmoothing: 'antialiased',
                  color: (() => {
                    const reserved = Math.max(0, playerHand.filter(c => !playerUsedCards.includes(c.id)).length - 1);
                    const maxFC = Math.max(1, playerFocus - reserved);
                    const t = maxFC <= 1 ? 1 : Math.max(0, Math.min(1, (selectedFocus - 1) / (maxFC - 1)));
                    const [r1, g1, b1] = [148, 163, 184];
                    const [r2, g2, b2] = [255, 224, 130];
                    const r = Math.round(r1 + (r2 - r1) * t);
                    const g = Math.round(g1 + (g2 - g1) * t);
                    const b = Math.round(b1 + (b2 - b1) * t);
                    return `rgb(${r},${g},${b})`;
                  })(),
                  textShadow: (() => {
                    const reserved = Math.max(0, playerHand.filter(c => !playerUsedCards.includes(c.id)).length - 1);
                    const maxFC = Math.max(1, playerFocus - reserved);
                    const t = maxFC <= 1 ? 1 : Math.max(0, Math.min(1, (selectedFocus - 1) / (maxFC - 1)));
                    const base = '255, 224, 130';
                    const innerAlpha = 0.05 + t * 0.85;
                    const midBlur = 1 + t * 10;
                    const midAlpha = 0.02 + t * 0.58;
                    const outerBlur = 2 + t * 36;
                    const outerAlpha = 0.01 + t * 0.55;
                    const stroke = '0 1px 2px rgba(0,0,0,0.9), 0 0 1px rgba(0,0,0,1)';
                    const glow = `0 0 2px rgba(${base}, ${innerAlpha}), 0 0 ${midBlur}px rgba(${base}, ${midAlpha}), 0 0 ${outerBlur}px rgba(${base}, ${outerAlpha})`;
                    return `${stroke}, ${glow}`;
                  })()
                }}
              >
                Quanto vale questo Agente?
              </div>
              <FocusCoinSelector
                value={selectedFocus}
                onChange={handleFocusChange}
                max={playerFocus}
                reserved={playerHand.filter(c => !playerUsedCards.includes(c.id)).length - 1}
                agent={selectedAgent}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* TRIANGOLO MANO IA - Alto Sinistra */}
      {/* ============================================ */}
      <Hand
        hand={enemyHand}
        usedCards={enemyUsedCards}
        selectedAgent={enemyAgent}
        onPreviewClick={(data) => handleCardPreviewClick({ ...data, isPlayer: false })}
        battleOutcomes={cardBattleOutcomes}
        cardPositions={iaCardPositions}
        position="top-left"
        label="Mano Avversario"
        gamePhase={gamePhase}
        disabled={true}
        armyBonuses={enemyArmyBonuses}
        isBonusTriggerSatisfied={isBonusTriggerSatisfied}
        isActive={gamePhase === 'selectField' && !isPlayerFirst || (gamePhase === 'selectAgent' && !isPlayerFirst && !enemyAgent)}
        handCardLayout={galleryCardLayout === 'reworkP4html' ? 'reworkP4' : galleryCardLayout}
        hideCards={shouldHideHandsForGuidedSetup}
        guidedBackgroundGlow={isGuidedIntroHandsPhase}
      />

      {/* ============================================ */}
      {/* TRIANGOLO MANO PLAYER - Basso Destra */}
      {/* ============================================ */}
      <Hand
        hand={playerHand}
        usedCards={playerUsedCards}
        selectedAgent={selectedAgent}
        onAgentSelect={handleAgentSelect}
        onPreviewClick={(data) => handleCardPreviewClick({ ...data, isPlayer: true })}
        battleOutcomes={cardBattleOutcomes}
        cardPositions={playerCardPositions}
        position="bottom-right"
        label="La Tua Mano"
        gamePhase={gamePhase}
        disabled={gamePhase !== 'selectAgent' || (!isPlayerFirst && !enemyAgent)}
        onDragStart={handleDragStart}
        draggingCard={draggingCard}
        isPlayerFirst={isPlayerFirst}
        enemyAgent={enemyAgent}
        armyBonuses={playerArmyBonuses}
        isBonusTriggerSatisfied={isBonusTriggerSatisfied}
        selectedCardRef={selectedCardInHandRef}
        isActive={gamePhase === 'selectField' && isPlayerFirst || (gamePhase === 'selectAgent' && (isPlayerFirst || enemyAgent))}
        handCardLayout={galleryCardLayout === 'reworkP4html' ? 'reworkP4' : galleryCardLayout}
        hideCards={shouldHideHandsForGuidedSetup}
        highlightedAgentId={isGuidedIntroCardPickPhase ? guidedIntroTargetCardId : null}
        guidedBackgroundGlow={isGuidedIntroHandsPhase}
      />

      {/* ============================================ */}
      {/* EFFETTO CINEMA - Barre nere */}
      {/* ============================================ */}
      {gamePhase === 'result' && (
        <>
          {/* Barra superiore */}
          <div 
            className="absolute top-0 left-0 w-full bg-black cinema-bar-top pointer-events-none"
            style={{ zIndex: 15 }}
          />
          {/* Barra inferiore */}
          <div 
            className="absolute bottom-0 left-0 w-full bg-black cinema-bar-bottom pointer-events-none"
            style={{ zIndex: 15 }}
          />
        </>
      )}

      {/* ============================================ */}
      {/* ZONE CENTRALI DI GIOCO */}
      {/* ============================================ */}
      
      {/* Sfondo campo di battaglia */}
      <BattlefieldBackground 
        activeField={(currentFieldIndex !== null && battlefields[currentFieldIndex]) 
          ? battlefields[currentFieldIndex] 
          : battleResult?.field} 
      />

      {/* Campo di Battaglia - Centro */}
      <BattlefieldPanel
        field={battlefields[currentFieldIndex]}
        gamePhase={gamePhase}
        isPlayerFirst={isPlayerFirst}
        isZoomed={isZoomed}
        selectedAgent={selectedAgent}
        onConfirm={confirmPlayerChoice}
        awaitingEnemySelection={playerConfirmedAwaitingAI}
        isOnlinePvP={isOnlinePvP}
        duelPhase={duelPhase}
        battleResult={battleResult}
        onContinue={nextRound}
        gameResult={gameResult}
        onMenu={() => {
          resetGuidedTutorial();
          setGameResult(null);
          setCampaignLevel(null);
          setGamePhase(selectedMode === 'campaign' ? 'campaignHub' : 'menu');
        }}
        onOpenPlaytest={() => {
          setGamePhase('playtestHistory');
        }}
      />

      <GuidedTutorialOverlay
        isActive={guidedMatch.active}
        guidedMatch={guidedMatch}
        guidedCallouts={guidedCallouts}
        guidedInstruction={guidedInstruction}
        guidedHint={guidedHint}
        showGuidedTrianglesHighlight={showGuidedTrianglesHighlight}
        isGuidedIntroWelcomePhase={isGuidedIntroWelcomePhase}
        isGuidedIntroHandsPhase={isGuidedIntroHandsPhase}
        isGuidedIntroPreviewPhase={isGuidedIntroPreviewPhase}
        isGuidedIntroBattlefieldsPhase={isGuidedIntroBattlefieldsPhase}
        raiseAboveGlossary={showGlossary}
        onIntroContinue={handleGuidedIntroContinue}
      />
      {!guidedMatch.active && guidedHint && (
        <div className="absolute left-1/2 pointer-events-none" style={{ top: 118, transform: 'translateX(-50%)', zIndex: 18 }}>
          <div className="px-3 py-2 rounded-xl border bg-black/80 backdrop-blur-sm">
            <div className="text-xs text-amber-300">{guidedHint}</div>
          </div>
        </div>
      )}
      
      
      {/* Zona Duello IA - Sinistra del centro */}
      <div 
        className={`absolute bg-transparent border-none rounded-xl flex flex-col items-center justify-center p-5 pointer-events-none ease-in-out ${
          isZoomed ? '' : ''
        }`}
        style={{
          top: '50%', 
          left: '50%', 
          transform: isZoomed ? 'translate(-450px, -50%) scale(1.05)' : 'translate(-380px, -50%)', 
          width: '240px', 
          height: '400px', 
          zIndex: 5,
          transitionProperty: 'transform, border-color, background-color, box-shadow',
          transitionDuration: `${duelVfx.zoomTransitionMs}ms`,
          transitionTimingFunction: 'ease-in-out',
          transitionDelay: isZoomed ? `${duelVfx.zoomDelayMs}ms` : '0ms',
        }}
      >
        {gamePhase !== 'result' && (
          <div className="text-red-400 text-sm font-bold mb-3 uppercase tracking-wide satze-duel-label">Il Nemico</div>
        )}
        {gamePhase === 'selectAgent' && enemyAgent && (
          <div className="flex-shrink-0">
            <GameCard
              cardLayout={galleryCardLayout === 'reworkP4html' ? 'reworkP4' : galleryCardLayout}
              agent={enemyAgent}
              showBonus={enemyArmyBonuses[enemyAgent.army] && isBonusTriggerSatisfied(enemyAgent.army, false, enemyAgent)}
              bonusBaseInactive={Boolean(ARMY_BONUSES[enemyAgent.army]) && !enemyArmyBonuses[enemyAgent.army]}
              abilityCurrentValue={getAbilityCurrentValue(enemyAgent, false)}
              onHover={(data) => handleCardPreviewClick({ ...data, isPlayer: false })}
            />
          </div>
        )}
        {gamePhase === 'selectAgent' && !enemyAgent && (
          <div className="text-slate-500 text-sm text-center">In attesa...</div>
        )}
        {/* Risultato duello: fasi VA/FC/danno = src/components/battle/DuelResultDuelBodies.jsx (stesso del VFX Lab) */}
        {gamePhase === 'result' && battleResult && duelPhase < 4 && (
          <DuelResultEnemyResultBody
            battleResult={battleResult}
            duelPhase={duelPhase}
            duelEffectStep={visualEffectStep}
            duelVfx={duelVfx}
            showClashAnimation={showClashAnimation}
            enemyFocusCoinsShown={enemyFocusCoinsShown}
            enemyCardGlow={enemyCardGlow}
            getFocusCoinGlowColor={getFocusCoinGlowColor}
            galleryCardLayout={galleryCardLayout}
            getAbilityCurrentValue={getAbilityCurrentValue}
            onCardHover={handleCardPreviewClick}
            particleSeed={battleResult.enemyAgent?.id ?? 1}
          />
        )}
      </div>
      
      {/* Zona Duello Player - Destra del centro */}
      <div 
        className={`absolute bg-transparent border-none rounded-xl flex flex-col items-center justify-center p-5 pointer-events-none ease-in-out ${
          isZoomed ? '' : ''
        }`}
        style={{
          top: '50%', 
          left: '50%', 
          transform: isZoomed ? 'translate(210px, -50%) scale(1.05)' : 'translate(140px, -50%)', 
          width: '240px', 
          height: '400px', 
          zIndex: 5,
          transitionProperty: 'transform, border-color, background-color, box-shadow',
          transitionDuration: `${duelVfx.zoomTransitionMs}ms`,
          transitionTimingFunction: 'ease-in-out',
          transitionDelay: isZoomed ? `${duelVfx.zoomDelayMs}ms` : '0ms',
        }}
      >
        {gamePhase !== 'result' && (
          <div className="text-blue-400 text-sm font-bold mb-3 uppercase tracking-wide satze-duel-label">L'eroe</div>
        )}
        {gamePhase === 'selectAgent' && selectedAgent && (
          <div ref={playerCardZoneRef} className="relative flex items-center justify-center pointer-events-auto flex-shrink-0">
            <GameCard
              cardLayout={galleryCardLayout === 'reworkP4html' ? 'reworkP4' : galleryCardLayout}
              agent={selectedAgent}
              showBonus={playerArmyBonuses[selectedAgent.army] && isBonusTriggerSatisfied(selectedAgent.army, true, selectedAgent)}
              bonusBaseInactive={Boolean(ARMY_BONUSES[selectedAgent.army]) && !playerArmyBonuses[selectedAgent.army]}
              abilityCurrentValue={getAbilityCurrentValue(selectedAgent, true)}
              onHover={(data) => handleCardPreviewClick({ ...data, isPlayer: true })}
              onClick={() => setSelectedAgent(null)}
              onDragStart={handleDragStart}
              isDragging={draggingCard?.id === selectedAgent?.id}
            />
          </div>
        )}
        {gamePhase === 'selectAgent' && !selectedAgent && (
          <div 
            ref={dropZoneRef}
            className={`w-44 h-64 border-2 border-dashed rounded-xl flex items-center justify-center transition-all duration-200 pointer-events-auto cursor-copy ${
              isOverDropZone 
                ? 'border-green-400 bg-green-500/20 scale-105 ring-2 ring-green-400/50' 
                : 'border-green-500/30 hover:border-green-500/50 hover:bg-green-500/10'
            }`}
          >
            <div className={`text-center text-sm p-4 ${isOverDropZone ? 'text-green-300' : 'text-slate-500'}`}>
              {isOverDropZone ? (
                <>⬇️<br/>Rilascia!</>
              ) : (
                <>🎴<br/>Trascina<br/>un Agente</>
              )}
            </div>
          </div>
        )}
        {gamePhase === 'result' && battleResult && duelPhase < 4 && (
          <DuelResultPlayerResultBody
            battleResult={battleResult}
            duelPhase={duelPhase}
            duelEffectStep={visualEffectStep}
            duelVfx={duelVfx}
            showClashAnimation={showClashAnimation}
            playerFocusCoinsShown={playerFocusCoinsShown}
            playerCardGlow={playerCardGlow}
            getFocusCoinGlowColor={getFocusCoinGlowColor}
            galleryCardLayout={galleryCardLayout}
            getAbilityCurrentValue={getAbilityCurrentValue}
            onCardHover={handleCardPreviewClick}
            particleSeed={battleResult.playerAgent?.id ?? 2}
          />
        )}
      </div>

      {gamePhase === 'result' && battleResult && duelPhase >= 4 && (
        <DuelClashAuroraSequence
          battleResult={battleResult}
          duelPhase={duelPhase}
          duelEffectStep={visualEffectStep}
          variant="n5"
          galleryCardLayout={galleryCardLayout}
          getAbilityCurrentValue={getAbilityCurrentValue}
          isZoomed={isZoomed}
        />
      )}

      {/* ============================================ */}
      {/* Centro alto: Round, SATZE; sopra il pannello campo: Replay/Skip (fuori da BattlefieldPanel) */}
      {/* ============================================ */}
      <div
        className="absolute left-1/2 flex flex-col items-center gap-1.5 pointer-events-none"
        style={{
          transform: 'translateX(-50%)',
          zIndex: 10,
          /* Sotto la letterbox / bordo alto del viewport: evita che Round e tasti vengano tagliati */
          top: 56,
        }}
      >
        <div
          className={`flex flex-col items-center justify-center gap-0.5 px-4 py-2 w-fit min-w-0 shrink-0 text-center satze-hud-panel ${gamePhase === 'result' ? 'animate-fade-out-panels' : ''}`}
          style={{ fontFamily: HUD_ORATORIO_FONT_UI }}
        >
          <span className="font-bold text-sm uppercase tracking-wider" style={{ color: PALETTE.amber }}>
            Round {roundNumber}/5
          </span>
          <span className="text-xs leading-tight" style={{ color: PALETTE.textSecondary }}>
            {isPlayerFirst ? 'Tu inizi' : isOnlinePvP ? 'Avversario inizia' : 'IA inizia'}
          </span>
        </div>

        <div
          role="button"
          tabIndex={0}
          className={`bg-black/70 rounded-b-lg flex justify-center items-center px-4 py-2 cursor-pointer hover:bg-black/80 transition-colors w-fit shrink-0 pointer-events-auto ${
            gamePhase === 'result' ? 'animate-fade-out-panels' : ''
          }`}
          style={gamePhase === 'result' ? { pointerEvents: 'none' } : undefined}
          onClick={() => {
            if (window.confirm('Vuoi davvero abbandonare la partita?')) {
              setCampaignLevel(null);
              setGamePhase(selectedMode === 'campaign' ? 'campaignHub' : 'menu');
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              if (window.confirm('Vuoi davvero abbandonare la partita?')) {
                setCampaignLevel(null);
                setGamePhase(selectedMode === 'campaign' ? 'campaignHub' : 'menu');
              }
            }
          }}
        >
          <span className="text-amber-400 font-bold">⚔️ SATZE</span>
        </div>

        {gamePhase === 'result' && battleResult && (
          <div className="flex gap-1.5 items-center justify-center pointer-events-auto relative z-20 w-fit shrink-0">
            <button
              type="button"
              onClick={() => {
                setDuelPhase(0);
                setPlayerFocusCoinsShown(0);
                setEnemyFocusCoinsShown(0);
                setPlayerCardGlow(0);
                setEnemyCardGlow(0);
                setCardGlowIntensity(0);
              }}
              className="satze-hud-duel-btn"
            >
              Replay
            </button>
            {typeof window !== 'undefined' &&
              new URLSearchParams(window.location.search).get('duelDebug') === '1' && (
                <button
                  type="button"
                  onClick={() => {
                    setDuelPhase(6);
                    if (battleResult) {
                      setPlayerFocusCoinsShown(battleResult.playerFocusUsed || 0);
                      setEnemyFocusCoinsShown(battleResult.enemyFocusUsed || 0);
                      setPlayerCardGlow(1);
                      setEnemyCardGlow(1);
                      setCardGlowIntensity(1);
                    }
                  }}
                  className="satze-hud-duel-btn satze-hud-duel-btn--skip"
                >
                  Skip
                </button>
              )}
          </div>
        )}
      </div>

      {/* ============================================ */}
      {/* DATI IA - Alto Sinistra - z-index 10 */}
      {/* ============================================ */}
      <StatsPanel 
        label={isOnlinePvP ? 'Avversario' : 'IA'} 
        hp={enemyHP} 
        focus={enemyFocus}
        toxin={enemyToxin}
        position="top-left"
        gamePhase={gamePhase}
      />

      {/* ============================================ */}
      {/* DATI PLAYER - Basso Destra - z-index 10 */}
      {/* ============================================ */}
      <StatsPanel 
        label="TU" 
        hp={playerHP}
        focus={playerFocus} 
        toxin={playerToxin}
        position="bottom-right"
        gamePhase={gamePhase}
      />

      {/* ============================================ */}
      {/* ANIMAZIONE ROUND 5 - z-index 100 */}
      {/* ============================================ */}
      {showFinalRoundAnimation && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-[100]"
          style={{ pointerEvents: 'auto', background: 'rgba(10, 14, 26, 0.9)' }}
        >
          <div className="text-center animate-final-round-enter" style={{ fontFamily: HUD_ORATORIO_FONT_UI }}>
            <div className="mb-8">
              <div className="text-8xl font-black mb-4 animate-final-round-pulse" style={{ color: '#FFB347', textShadow: '0 0 40px rgba(255, 179, 71, 0.8)' }}>
                ROUND 5
              </div>
              <div className="text-4xl font-bold text-red-400 mb-2">
                ⚔️ ANNIENTA IL NEMICO! ⚔️
              </div>
              <div className="text-xl text-slate-300 mt-4">
                La condizione di vittoria cambia:
              </div>
              <div className="text-2xl font-bold text-amber-400 mt-2">
                Vincerà chi ha più Punti Vita!
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* RECLAMAZIONE - Scelta vittoria (round 3 o 4) */}
      {/* ============================================ */}
      {showClaimVictoryChoice && showClaimVictoryChoice.winner === 'player' && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-[100]"
          style={{ pointerEvents: 'auto', background: 'rgba(10, 14, 26, 0.92)' }}
        >
          <div 
            className="flex flex-col items-center gap-6 p-8 rounded-2xl max-w-md text-center border border-amber-500/50"
            style={{ fontFamily: HUD_ORATORIO_FONT_UI, boxShadow: '0 0 60px rgba(251, 191, 36, 0.2)' }}
          >
            <div className="text-2xl font-bold" style={{ color: PALETTE.amber }}>
              🏆 Hai conquistato 3 campi!
            </div>
            <div className="text-slate-300 text-sm">
              Puoi reclamare la vittoria ora o continuare a giocare per accumulare più punti.
            </div>
            <div className="flex gap-4 w-full justify-center">
              <button
                onClick={() => {
                  if (gameMode === 'campaign' && campaignDuelMod?.winCondition === 'annihilation_only' && enemyHP > 0) {
                    return;
                  }
                  setGameResult({ winner: 'player', reason: 'fields', playerFields: showClaimVictoryChoice.playerFields, enemyFields: showClaimVictoryChoice.enemyFields });
                  setShowClaimVictoryChoice(null);
                  setGamePhase('gameOver');
                }}
                className="flex-1 px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all bg-amber-600/90 hover:bg-amber-500 text-white border border-amber-400/50"
              >
                <Icon name="star" type="cardIcon" size={18} color="#fff" />
                Reclamare vittoria
              </button>
              <button
                onClick={() => {
                  setShowClaimVictoryChoice(null);
                  doResetAndNextRound(showClaimVictoryChoice.playerFields, showClaimVictoryChoice.enemyFields);
                }}
                className="flex-1 px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all bg-slate-600/80 hover:bg-slate-500 text-slate-200 border border-slate-500/50"
              >
                <Icon name="check" type="cardIcon" size={18} color="#fff" />
                Continua a giocare
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Carta trascinata (floating) - portal su body per posizione corretta con viewport scalato */}
      {draggingCard && createPortal(
        (() => {
          const hx = 115;
          const hy = 165;
          return (
        <div 
          className="fixed pointer-events-none"
          style={{
            left: dragPosition.x - hx,
            top: dragPosition.y - hy,
            transform: 'rotate(-5deg)',
            filter: 'drop-shadow(0 20px 30px rgba(0,0,0,0.5))',
            zIndex: 9999
          }}
        >
          <GameCard
            agent={draggingCard}
            showBonus={playerArmyBonuses[draggingCard.army] && isBonusTriggerSatisfied(draggingCard.army, true, draggingCard)}
            bonusBaseInactive={Boolean(ARMY_BONUSES[draggingCard.army]) && !playerArmyBonuses[draggingCard.army]}
          />
        </div>
          );
        })(),
        document.body
      )}

      {showGlossary && (
        <Glossary
          variant="duel"
          onClose={handleGlossaryClose}
          originButtonRef={glossaryButtonRef}
        />
      )}
      
      {/* Tutorial */}
      <Tutorial
        isActive={tutorial.isActive}
        currentStep={tutorial.currentStep}
        onNext={tutorial.nextStep}
        onPrevious={tutorial.previousStep}
        onGoToStep={tutorial.goToStep}
        onClose={tutorial.closeTutorial}
        onComplete={tutorial.completeTutorial}
        steps={activeTutorialSteps}
      />
      
    </div>
  );
}

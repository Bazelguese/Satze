import React, { useState, useEffect, useLayoutEffect, useCallback, useMemo, useRef, startTransition } from 'react';
import { createPortal } from 'react-dom';
import { createRoot } from 'react-dom/client';
import { formatAbilityHelper, generateFieldParticles, FIELD_STYLES } from '../src/utils';
import { FocusCoinSelector, LogPanel, StatsPanel, Icon } from '../src/components/ui';
import { CardReworkP4AsHtml, CardImage, Hand, GameCard } from '../src/components/cards';
import { CardTagsRow } from '../src/components/cards/CardTagBadges';
import { getCardTags } from '../src/data/cardTags';
import { MiniBattlefield, BattlefieldBackground, BattlefieldPanel } from '../src/components/battle';
import { DuelResultEnemyResultBody, DuelResultPlayerResultBody } from '../src/components/battle/DuelResultDuelBodies';
import { DuelClashAuroraSequence } from '../src/components/battle/DuelClashAuroraSequence';
import { DuelDialogueOverlay } from '../src/components/dialogue/DuelDialogueOverlay';
import { ARMY_COLORS, ARMY_BONUSES, TRIGGER_NAMES, TRIGGER_DESCRIPTIONS, getAbilityExplanation, ARMY_SETS, ARMY_DECKS, ALL_AGENTS, ALL_BATTLEFIELDS, CARD_IMAGES, AGENT_IMAGES, getBattlefieldAnimationType, markCampaignMissionStarted } from '../src/data';
import { loadCampaignProgress } from '../src/data/campaign';
import { totalLeagueForCampaignDeck } from '../src/game/campaign/campaignDeckLogic.js';
import { applyToxin } from '../src/game/toxinLogic';
import { checkTrigger } from '../src/game/triggerLogic';
import { getFieldModifiers, fieldGrantsOverdriveBonus } from '../src/game/fieldLogic';
import { countAttritionPriorCards, countInitialLeagueCards } from '../src/game/duel/duelHelpers.js';
import { BattlefieldShuffleDealOverlay } from '../src/components/shuffle/BattlefieldShuffleDealOverlay';
import { getLaunchRevealHoldMs, DUEL_REVEAL_MS } from '../src/components/shuffle/duelEntranceTiming';
import { DuelRevealHudStyles } from '../src/components/shuffle/DuelRevealVeil';
import { prepareDuelShuffleHands, prepareRandomDuelShuffleHands } from '../src/components/shuffle/prepareDuelShuffleHands';
import { SHUFFLE_STYLE_OPTIONS, setShuffleStyle } from '../src/utils/shuffleStylePreference';
import {
  armyMenuLabel,
  buildDialogueDuelArmyChoices,
} from '../src/utils/devDialogueDuelMenu';
import { IA_CARD_POSITIONS, PLAYER_CARD_POSITIONS } from '../src/config/battlefieldHandLayout';
import { useGameState, useAnimations, useBattle, useDragAndDrop, useGameFlow, useAI, useTutorial, useCampaignGameOutcome, useGuidedTutorialFlow, useTutorialOrchestrator } from '../src/hooks';
import {
  ADV_STAGE_EPILOGUE,
  ADV_STAGE_TRIGGERS,
  INTRO_STAGE_EPILOGUE,
  INTRO_STAGE_FREE_PLAY_FINAL,
  INTRO_STAGE_PLAY,
} from '../src/data/tutorialGuidedContent';
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
import { DIFFICULTY_NAMES } from '../src/utils';
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
import DeckSelectCinematic, { buildDeckPreviewPayload } from '../src/components/menu/cosmic/DeckSelectCinematic.jsx';
import CardGallery from '../src/components/menu/gallery/CardGallery.jsx';
import GalleryCinematic from '../src/components/menu/gallery/GalleryCinematic.jsx';
import { CosmicDeckCarousel } from '../src/components/menu/cosmic/CosmicDeckCarousel';
import { CosmicBannerButton } from '../src/components/menu/cosmic/CosmicBannerButton';
import { DifficultySelectPopup } from '../src/components/menu/cosmic/DifficultySelectPopup';
import { DeckConfirmTransition, LAUNCH_TRANSITION } from '../src/components/menu/cosmic/DeckConfirmTransition';
import { CosmicDeckManagerList } from '../src/components/menu/cosmic/CosmicDeckManagerList';
import { CosmicDeckBuilderWrapper } from '../src/components/menu/cosmic/CosmicDeckBuilderWrapper';
import { BattlefieldGallery } from '../src/components/gallery/BattlefieldGallery';
import { BattlefieldReveal } from '../src/components/gallery/BattlefieldRevealAnimations';
import { PlaytestHistoryScreen } from '../src/components/playtest/PlaytestHistoryScreen';
import { GAME_MODES } from '../src/data/gameModes';
import { loadCustomDecks, isMixedDeck, resolveDeckCards, getHandAccentColor, getDeckVisualMeta } from '../src/utils/deckManager';
import { appendPlaytestRecord } from '../src/utils/playtestHistory';
import { getMultiplayerWsUrl } from '../src/config/multiplayerConfig';
import { resolvePublicAssetUrl } from '../src/utils/preloadAssets';
import { getMultiplayerManager } from '../src/utils/multiplayer';
import { clearMpSession, persistMpSession, reconnectToRoom } from '../src/utils/multiplayerReconnect';
import { buildOnlineMatchPayload } from '../src/utils/onlineMatch';
import { resolveDeckCardsForArmy } from '../src/utils/deckResolve';
import { getDuelVisualConfig } from '../src/config/duelVisualConfigStore.js';
import { DUEL_VFX_CHANGED_EVENT } from '../src/config/duelVisualConfig.js';
import { buildPhaseAdvanceDelaysMs, countDuelPhase3SubSteps, computeFocusCoinAppearDelayMs, getNextDuelPhase, syncDuelVisualsForPhase } from '../src/config/duelVisualTimeline.js';
import { countDuelEffectSteps, countDuelPostEffectSteps } from '../src/game/duel/duelVisualSteps.js';
import { DUEL_VISUAL_DEFAULTS } from '../src/config/duelVisualConfig.js';
import { useSafeDuelEffectStep } from '../src/components/battle/useSafeDuelEffectStep.js';
import { getFocusCoinGlowColor as computeFocusCoinGlowColor } from '../src/utils/focusCoinGlow.js';
import {
  IS_PUBLIC_PLAYTEST_BUILD,
  PUBLIC_BUILD_MARQUEE,
  filterMenuItemsForBuild,
} from '../src/config/buildProfile.js';

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

/** Ritardo naturale prima che il nemico mostri la carta nel tutorial guidato (0,5–1 s). */
function getGuidedEnemyDeployDelayMs() {
  return 500 + Math.floor(Math.random() * 501);
}

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
    shuffleDealSetup,
    setShuffleDealSetup,
    playerDeckVisual,
    enemyDeckVisual,
  } = gameState;

  /** Solo STRUMENTI DEV → DIALOGUE DUELLO: fumetti durante il duello di test. */
  const [devDialogueDuelActive, setDevDialogueDuelActive] = useState(false);

  const playerIdentityColor = useMemo(
    () => playerDeckVisual?.accent
      ?? getHandAccentColor(playerHand, ARMY_COLORS, '#4FD1C5'),
    [playerHand, playerDeckVisual?.accent],
  );
  const enemyIdentityColor = useMemo(
    () => enemyDeckVisual?.accent
      ?? getHandAccentColor(enemyHand, ARMY_COLORS, '#D946EF'),
    [enemyHand, enemyDeckVisual?.accent],
  );

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
      setDevDialogueDuelActive(false);
      setGamePhaseAnimated(nextPhase);
      return;
    }
    setGamePhaseRaw(nextPhase);
  }, [gamePhase, setGamePhaseAnimated, setGamePhaseRaw]);

  useEffect(() => {
    if (!IS_PUBLIC_PLAYTEST_BUILD) return;
    if (
      gamePhase === 'playtestHistory' ||
      gamePhase === 'campaignSlots' ||
      gamePhase === 'campaignHub'
    ) {
      setGamePhaseRaw('menu');
    }
  }, [gamePhase, setGamePhaseRaw]);

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
  const clearCardPreview = useCallback(() => {
    setLastPreviewCard(null);
    setHoveredCard(null);
    setHoveredField(null);
  }, [setHoveredCard, setHoveredField]);
  // Tilt Tabellone: una volta che il cursore ci passa sopra, si ferma e non riparte
  const [tabelloneTiltDismissed, setTabelloneTiltDismissed] = useState(false);
  
  // Stato per modal carta ingrandita nella galleria
  const [selectedCardForModal, setSelectedCardForModal] = useState(null);
  const [previewDeckData, setPreviewDeckData] = useState(null);
  const [showDifficultyPopup, setShowDifficultyPopup] = useState(false);
  const [pendingGameLaunch, setPendingGameLaunch] = useState(null);
  const [launchVisualPhase, setLaunchVisualPhase] = useState(null);
  const [launchShowText, setLaunchShowText] = useState(false);
  const launchStartedRef = useRef(null);
  const launchSessionRef = useRef(null);
  const pendingGameLaunchRef = useRef(null);
  const launchOverlayRootRef = useRef(null);
  const launchOverlayContainerRef = useRef(null);
  const shuffleLaunchHoldMsRef = useRef(null);
  const [duelRevealPhase, setDuelRevealPhase] = useState('idle');
  pendingGameLaunchRef.current = pendingGameLaunch;

  useEffect(() => {
    if (gamePhase !== 'shuffleDeal') setDuelRevealPhase('idle');
  }, [gamePhase]);

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
      if (e.key === 'Escape' && showDifficultyPopup) {
        setShowDifficultyPopup(false);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [selectedCardForModal, showDifficultyPopup]);
  
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
  const [onlinePeerName, setOnlinePeerName] = useState(null);
  const [pendingGuestMatch, setPendingGuestMatch] = useState(null);
  /** Coda relay peer_move: un solo messaggio non può essere sovrascritto (field poi agent). */
  const [incomingPeerMoveQueue, setIncomingPeerMoveQueue] = useState([]);
  /** Avversario ha 3 campi (R3–4): attende la sua scelta reclamare / continuare (solo online). */
  const [opponentClaimPending, setOpponentClaimPending] = useState(null);
  const [incomingClaimDecision, setIncomingClaimDecision] = useState(null);
  const forceContinueAfterClaimRef = useRef(false);
  const focusCoinTimersRef = useRef([]);
  const [onlineOpponentLeft, setOnlineOpponentLeft] = useState(false);
  /** Connessione WebSocket persa (rete / refresh): mostra pulsante Riconnetti */
  const [mpConnectionLost, setMpConnectionLost] = useState(false);
  /** L'avversario è temporaneamente offline ma può tornare */
  const [mpOpponentAway, setMpOpponentAway] = useState(false);
  const [mpReconnecting, setMpReconnecting] = useState(false);
  const mpAutoReconnectTriedRef = useRef(false);
  const [mpReconnectError, setMpReconnectError] = useState('');
  const onlineMatchStartedRef = useRef(false);
  const playtestAutoSavedRef = useRef(false);
  const multiplayerSessionRef = useRef(multiplayerSession);
  useEffect(() => {
    multiplayerSessionRef.current = multiplayerSession;
  }, [multiplayerSession]);

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
          mpAutoReconnectTriedRef.current = false;
          setLogs((prev) => [...prev.slice(-200), '[!] Connessione al server persa. Riconnessione automatica…']);
        }
        return;
      }
      if (msg.type !== 'relay' || !msg.payload) return;
      const p = msg.payload;
      if (p.type === 'deck_ready') {
        setOnlinePeerDeck({
          army: p.army,
          deckKey: p.deckKey,
          ...(p.playerName ? { playerName: p.playerName } : {}),
          ...(Array.isArray(p.deckCardIds) && p.deckCardIds.length ? { deckCardIds: p.deckCardIds } : {}),
        });
        if (p.playerName) setOnlinePeerName(p.playerName);
      }
      if (p.type === 'match_start' && p.match) {
        setPendingGuestMatch(p.match);
      }
      if (p.type === 'claim_decision') {
        setIncomingClaimDecision(p);
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
      mpAutoReconnectTriedRef.current = false;
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

  useEffect(() => {
    if (!mpConnectionLost || mpReconnecting || mpAutoReconnectTriedRef.current) return;
    mpAutoReconnectTriedRef.current = true;
    const t = setTimeout(() => {
      attemptMpSelfReconnect();
    }, 1200);
    return () => clearTimeout(t);
  }, [mpConnectionLost, mpReconnecting, attemptMpSelfReconnect]);

  const abandonMultiplayerSession = useCallback(() => {
    setMpConnectionLost(false);
    setMpOpponentAway(false);
    setMpReconnectError('');
    setOnlineOpponentLeft(false);
    onlineMatchStartedRef.current = false;
    setPendingGuestMatch(null);
    setIncomingPeerMoveQueue([]);
    setOpponentClaimPending(null);
    setIncomingClaimDecision(null);
    forceContinueAfterClaimRef.current = false;
    setMultiplayerSession(null);
    setIsMultiplayer(false);
    clearMpSession();
    getMultiplayerManager().disconnect({ intentional: true });
    setGamePhase('menu');
  }, [setMultiplayerSession, setIsMultiplayer, setGamePhase]);

  useEffect(() => {
    if (!pendingGuestMatch || multiplayerSession?.role !== 'guest') return;
    if (gamePhase !== 'onlineDeckReady') return;
    try {
      startOnlineMatch('guest', pendingGuestMatch);
      setPendingGuestMatch(null);
    } catch (e) {
      console.error('[multiplayer] avvio partita guest:', e);
      alert(
        `Errore sincronizzazione partita: ${e?.message || e}\n\nChiedi all'host di uscire e ricreare la stanza, oppure aggiorna entrambi i client alla stessa versione.`
      );
    }
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
  const guidedEnemyDeployTimerRef = useRef(null);
  const guidedEnemyDeployScheduledRef = useRef(false);
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
    guidedPause,
    setGuidedHint,
    setGuidedIntroStage,
    setGuidedPause,
    openTutorialSelector,
    closeTutorialSelector,
    handleTutorialTrackSelect,
    startStandardGame,
    resetGuidedTutorial,
    enableGuidedFreePlay,
    finishGuidedTutorial,
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

  const handleTutorialTrackSelectWithPreviewReset = useCallback((mode) => {
    clearCardPreview();
    handleTutorialTrackSelect(mode);
  }, [clearCardPreview, handleTutorialTrackSelect]);

  const startStandardGameRef = useRef(startStandardGame);
  startStandardGameRef.current = startStandardGame;

  const launchDialogueDuelTest = useCallback((playerArmy, shuffleKind) => {
    setDevDialogueDuelActive(true);
    setShuffleStyle(shuffleKind);
    try {
      const duel = prepareDuelShuffleHands({ playerArmy });
      startStandardGame(
        duel.playerArmy,
        duel.playerDeckKey,
        'classic',
        'medium',
        ALL_BATTLEFIELDS,
        duel.enemyArmy,
        duel.enemyDeckKey
      );
    } catch (err) {
      console.error('[Dialogue duel] avvio fallito:', err);
    }
  }, [startStandardGame]);

  const dialogueDuelArmyMenuChoices = useMemo(
    () => buildDialogueDuelArmyChoices(Object.keys(ARMY_SETS), launchDialogueDuelTest),
    [launchDialogueDuelTest]
  );

  const startCampaignGame = useCallback((army, deckKey) => {
    if (!campaignLevel || !army || !deckKey) return;
    const launch = buildCampaignDuelLaunchConfig(campaignLevel, null);
    startStandardGame(
      army,
      deckKey,
      'campaign',
      campaignLevel.difficulty,
      ALL_BATTLEFIELDS,
      campaignLevel.enemyArmy,
      campaignLevel.enemyDeck,
      launch.campaignDuelMod
    );
  }, [campaignLevel, startStandardGame]);

  const goAfterDeckSelection = useCallback((deckKeyOverride) => {
    const deckKey = deckKeyOverride ?? selectedDeckKey;
    if (isMultiplayer && selectedMode === 'multiplayer') {
      setOnlineLocalReady(false);
      setOnlinePeerDeck(null);
      setOnlinePeerName(null);
      onlineMatchStartedRef.current = false;
      // Non azzerare pendingGuestMatch: match_start può arrivare mentre si è ancora su selectDeck.
      setIncomingPeerMoveQueue([]);
      setGamePhase('onlineDeckReady');
      return;
    }
    if (campaignLevel && deckKey) {
      startCampaignGame(selectedArmy, deckKey);
      return;
    }
    setPreviewDeckData(null);
    setGamePhase('selectDeck');
    setShowDifficultyPopup(true);
  }, [
    selectedDeckKey,
    selectedArmy,
    isMultiplayer,
    selectedMode,
    campaignLevel,
    startCampaignGame,
    setGamePhase,
  ]);

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
          startCampaignGame(army, ids);
          return;
        }
      }
      setGamePhase('selectDeck');
    },
    [selectedMode, campaignLevel, campaignSaveSlot, setSelectedArmy, setSelectedDeckKey, setGamePhase, startCampaignGame]
  );

  useEffect(() => {
    const sessionId = pendingGameLaunch?.sessionId;
    if (!sessionId) {
      launchSessionRef.current = null;
      launchStartedRef.current = null;
      return undefined;
    }

    const payload = pendingGameLaunchRef.current;
    if (!payload || payload.sessionId !== sessionId) return undefined;

    if (launchSessionRef.current !== sessionId) {
      launchSessionRef.current = sessionId;
      launchStartedRef.current = null;
    }

    const textTimer = setTimeout(() => {
      setLaunchShowText(false);
    }, LAUNCH_TRANSITION.TEXT_HIDE_AT_MS);

    const launchTimer = setTimeout(() => {
      if (launchStartedRef.current === sessionId) return;
      launchStartedRef.current = sessionId;
      clearCardPreview();
      startStandardGameRef.current(
        payload.army,
        payload.deckKey,
        payload.mode,
        payload.difficulty,
        ALL_BATTLEFIELDS
      );
      setLaunchVisualPhase('hold');
    }, LAUNCH_TRANSITION.LAUNCH_AT_MS);

    const fadeTimer = setTimeout(() => {
      setLaunchVisualPhase('fadeOut');
    }, LAUNCH_TRANSITION.FADE_OUT_AT_MS);

    const completeTimer = setTimeout(() => {
      setPendingGameLaunch((current) => (current?.sessionId === sessionId ? null : current));
      setLaunchVisualPhase(null);
      setLaunchShowText(false);
      if (launchSessionRef.current === sessionId) launchSessionRef.current = null;
    }, LAUNCH_TRANSITION.COMPLETE_AT_MS);

    return () => {
      clearTimeout(textTimer);
      clearTimeout(launchTimer);
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
  }, [pendingGameLaunch?.sessionId, clearCardPreview]);

  useLayoutEffect(() => {
    if (pendingGameLaunch?.sessionId) {
      clearCardPreview();
    }
  }, [pendingGameLaunch?.sessionId, clearCardPreview]);

  useLayoutEffect(() => {
    const sessionId = pendingGameLaunch?.sessionId;
    const phase = launchVisualPhase;

    if (!sessionId || !phase) {
      if (launchOverlayRootRef.current) {
        launchOverlayRootRef.current.unmount();
        launchOverlayContainerRef.current?.remove();
        launchOverlayRootRef.current = null;
        launchOverlayContainerRef.current = null;
      }
      return undefined;
    }

    if (!launchOverlayRootRef.current) {
      const container = document.createElement('div');
      container.id = 'satze-launch-overlay';
      document.body.appendChild(container);
      launchOverlayContainerRef.current = container;
      launchOverlayRootRef.current = createRoot(container);
    }

    const payload = pendingGameLaunchRef.current;
    launchOverlayRootRef.current.render(
      <DeckConfirmTransition
        accent={payload?.accent}
        deckName={payload?.deckName}
        showText={launchShowText}
        visualPhase={phase}
      />
    );

    return undefined;
  }, [pendingGameLaunch?.sessionId, launchVisualPhase, launchShowText]);

  useEffect(() => () => {
    launchOverlayRootRef.current?.unmount();
    launchOverlayContainerRef.current?.remove();
    launchOverlayRootRef.current = null;
    launchOverlayContainerRef.current = null;
  }, []);

  const completeShuffleDeal = useCallback(() => {
    if (!shuffleDealSetup) return;
    setPlayerHand(shuffleDealSetup.playerHand);
    setEnemyHand(shuffleDealSetup.enemyHand);
    setPlayerArmyBonuses(shuffleDealSetup.playerBonuses);
    setEnemyArmyBonuses(shuffleDealSetup.enemyBonuses);
    setShuffleDealSetup(null);
    setGamePhase('selectField');
  }, [
    shuffleDealSetup,
    setPlayerHand,
    setEnemyHand,
    setPlayerArmyBonuses,
    setEnemyArmyBonuses,
    setShuffleDealSetup,
    setGamePhase,
  ]);

  const {
    currentGuidedRound,
    isGuidedIntroWelcomePhase,
    isGuidedIntroHandsPhase,
    isGuidedIntroCardPickPhase,
    isGuidedIntroPreviewPhase,
    isGuidedIntroGlossaryPromptPhase,
    isGuidedIntroGlossaryOpenPhase,
    isGuidedIntroBattlefieldsPhase,
    isGuidedIntroVictoryPhase,
    isGuidedIntroFcBudgetPhase,
    isGuidedIntroEpiloguePhase,
    isGuidedIntroFreePlayFinalPhase,
    isGuidedAdvancedGoalPhase,
    isGuidedAdvancedTriggersPhase,
    isGuidedAdvancedEpiloguePhase,
    isGuidedOkContinuePhase,
    isGuidedEnemyAckPause,
    isGuidedDuelPause,
    shouldHideHandsForGuidedSetup,
    guidedIntroTargetCardId,
    guidedIntroTargetCardName,
    showGuidedTrianglesHighlight,
    guidedInstruction,
    guidedCallouts,
    handleGuidedIntroContinue,
    validateFocusForRound,
    guidedOverlayMode,
    shouldPlayerPickField,
  } = useGuidedTutorialFlow({
    guidedMatch,
    guidedIntroStage,
    guidedPause,
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
    conqueredFields,
    playerHP,
    enemyHP,
    playerFocus,
    enemyFocus,
    gameResult,
    isPlayerFirst,
    duelPhase,
    enemyAgent,
  });

  const clearFocusCoinTimers = useCallback(() => {
    focusCoinTimersRef.current.forEach(clearTimeout);
    focusCoinTimersRef.current = [];
  }, []);

  const applyDuelVisualSync = useCallback(
    (phase) => {
      if (!battleResult) return;
      syncDuelVisualsForPhase(phase, battleResult, {
        setEffectStep: setDuelEffectStep,
        setFocusCoins: (pFc, eFc) => {
          setPlayerFocusCoinsShown(pFc);
          setEnemyFocusCoinsShown(eFc);
        },
        setCardGlow: () => {
          setPlayerCardGlow(1);
          setEnemyCardGlow(1);
          setCardGlowIntensity(1);
        },
      });
    },
    [battleResult, setDuelEffectStep, setPlayerFocusCoinsShown, setEnemyFocusCoinsShown, setPlayerCardGlow, setEnemyCardGlow, setCardGlowIntensity]
  );

  const advanceDuelPhase = useCallback(() => {
    if (!battleResult) return;
    setDuelPhase((prev) => {
      const next = getNextDuelPhase(prev, battleResult);
      return next;
    });
  }, [battleResult, setDuelPhase]);

  useLayoutEffect(() => {
    if (gamePhase === 'result' && battleResult) {
      applyDuelVisualSync(duelPhase);
    }
  }, [gamePhase, battleResult, duelPhase, applyDuelVisualSync]);

  const skipDuelAnimation = useCallback(() => {
    if (!battleResult || duelPhase >= 6) return;
    clearFocusCoinTimers();
    const effectCount = countDuelEffectSteps(battleResult.visualSteps);
    const phase3SubCount = countDuelPhase3SubSteps(battleResult);
    const postCount = countDuelPostEffectSteps(battleResult.visualSteps);
    const maxStep = Math.max(effectCount, phase3SubCount, postCount, 1);
    setDuelEffectStep(maxStep);
    setPlayerFocusCoinsShown(battleResult.playerFocusUsed || 0);
    setEnemyFocusCoinsShown(battleResult.enemyFocusUsed || 0);
    setPlayerCardGlow(1);
    setEnemyCardGlow(1);
    setCardGlowIntensity(1);
    setRainbowTime(0);
    setDuelPhase(6);
    if (guidedPause === 'duel') {
      setGuidedPause(null);
    }
  }, [
    battleResult,
    duelPhase,
    clearFocusCoinTimers,
    setDuelEffectStep,
    setPlayerFocusCoinsShown,
    setEnemyFocusCoinsShown,
    setPlayerCardGlow,
    setEnemyCardGlow,
    setCardGlowIntensity,
    setRainbowTime,
    setDuelPhase,
    guidedPause,
    setGuidedPause,
  ]);

  const replayDuelAnimation = useCallback(() => {
    clearFocusCoinTimers();
    setDuelPhase(0);
    setDuelEffectStep(1);
    setPlayerFocusCoinsShown(0);
    setEnemyFocusCoinsShown(0);
    setPlayerCardGlow(0);
    setEnemyCardGlow(0);
    setCardGlowIntensity(0);
    setRainbowTime(0);
  }, [
    clearFocusCoinTimers,
    setDuelPhase,
    setDuelEffectStep,
    setPlayerFocusCoinsShown,
    setEnemyFocusCoinsShown,
    setPlayerCardGlow,
    setEnemyCardGlow,
    setCardGlowIntensity,
    setRainbowTime,
  ]);

  const deployScriptedGuidedEnemy = useCallback(() => {
    if (!currentGuidedRound) return;
    const scriptedEnemy =
      enemyHand.find((c) => c.id === currentGuidedRound.enemyAgentId) || enemyHand[0];
    if (!scriptedEnemy) return;
    const enemyFocusScripted = currentGuidedRound.enemyFocusAllIn
      ? Math.max(1, enemyFocus)
      : currentGuidedRound.enemyFocus;
    setEnemyAgent(scriptedEnemy);
    setEnemySelectedFocus(enemyFocusScripted);
    setLogs((prev) => [
      ...prev.slice(-80),
      `[R${roundNumber}] Guida: il nemico schiera ${scriptedEnemy.name} (${enemyFocusScripted} FC).`,
    ]);
  }, [
    currentGuidedRound,
    enemyHand,
    enemyFocus,
    roundNumber,
    setEnemyAgent,
    setEnemySelectedFocus,
    setLogs,
  ]);

  const scheduleGuidedEnemyDeploy = useCallback(() => {
    if (guidedEnemyDeployTimerRef.current) {
      clearTimeout(guidedEnemyDeployTimerRef.current);
    }
    guidedEnemyDeployTimerRef.current = setTimeout(() => {
      guidedEnemyDeployTimerRef.current = null;
      deployScriptedGuidedEnemy();
    }, getGuidedEnemyDeployDelayMs());
  }, [deployScriptedGuidedEnemy]);

  const handleGuidedContinue = useCallback(() => {
    if (guidedPause === 'enemyField' && currentGuidedRound) {
      const fieldIdx = currentGuidedRound.fieldIndex;
      const fieldName = battlefields[fieldIdx]?.name || `Campo ${fieldIdx + 1}`;
      setCurrentFieldIndex(fieldIdx);
      setLogs((prev) => [...prev.slice(-20), `[R${roundNumber}] L'IA sceglie: ${fieldName}`]);
      setGuidedPause(null);
      setGamePhase('selectAgent');
      return;
    }
    if (guidedPause === 'enemyAgent' && currentGuidedRound) {
      setGuidedPause(null);
      scheduleGuidedEnemyDeploy();
      return;
    }
    if (guidedPause === 'duel') {
      if (gamePhase === 'battle') {
        resolveBattle();
        return;
      }
      if (gamePhase === 'result' && battleResult) {
        const next = getNextDuelPhase(duelPhase, battleResult);
        setDuelPhase(next);
        if (next >= 6) setGuidedPause(null);
        return;
      }
    }
    handleGuidedIntroContinue();
  }, [
    guidedPause,
    currentGuidedRound,
    battlefields,
    roundNumber,
    gamePhase,
    battleResult,
    duelPhase,
    resolveBattle,
    advanceDuelPhase,
    setDuelPhase,
    setCurrentFieldIndex,
    setLogs,
    setGuidedPause,
    setGamePhase,
    scheduleGuidedEnemyDeploy,
    handleGuidedIntroContinue,
  ]);

  useEffect(() => () => {
    if (guidedEnemyDeployTimerRef.current) {
      clearTimeout(guidedEnemyDeployTimerRef.current);
    }
  }, []);

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
      if (guidedIntroStage >= 6 && guidedIntroStage < INTRO_STAGE_PLAY) {
        setGuidedHint('Premi OK per continuare.');
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

  useEffect(() => {
    if (gamePhase !== 'gameOver' || !guidedMatch.active) return;
    if (guidedMatch.trackId === 'intro' && guidedMatch.freePlay) {
      setGuidedIntroStage(INTRO_STAGE_FREE_PLAY_FINAL);
    }
    if (guidedMatch.trackId === 'advanced') {
      setGuidedIntroStage(ADV_STAGE_EPILOGUE);
    }
  }, [gamePhase, guidedMatch.active, guidedMatch.freePlay, guidedMatch.trackId, setGuidedIntroStage]);

  // Auto-save singolo per ogni fine partita (solo build interna / playtest dev).
  useEffect(() => {
    if (IS_PUBLIC_PLAYTEST_BUILD) return;
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
    if (
      guidedMatch.active &&
      !guidedMatch.freePlay &&
      currentGuidedRound?.playerAgentId &&
      agent?.id !== currentGuidedRound.playerAgentId
    ) {
      const expectedName = playerHand.find((c) => c.id === currentGuidedRound.playerAgentId)?.name || 'la carta indicata';
      setGuidedHint(`Per questo step devi schierare: ${expectedName}.`);
      return;
    }
    setGuidedHint('');
    setSelectedAgent((prev) => (prev?.id === agent?.id ? null : agent));
  }, [guidedMatch.active, guidedMatch.freePlay, currentGuidedRound, playerHand, setSelectedAgent, setGuidedHint]);

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

  const playerOverdrivePreview = useMemo(() => {
    if (gamePhase !== 'selectAgent' || !selectedAgent) return false;
    const field = currentFieldIndex != null ? battlefields[currentFieldIndex] : null;
    const fieldModifiers = getFieldModifiers(field);
    const overdriveActive = checkTrigger('overdrive', {
      focusCoins: selectedFocus || 1,
      fieldModifiers,
    });
    if (!overdriveActive) return false;

    const abilityHasOverdrive = selectedAgent.ability?.trigger === 'overdrive';
    const armyBonus = ARMY_BONUSES[selectedAgent.army];
    const bonusHasOverdrive =
      Boolean(playerArmyBonuses[selectedAgent.army]) &&
      armyBonus?.trigger === 'overdrive';
    const fieldHasOverdrive = fieldGrantsOverdriveBonus(field);

    return abilityHasOverdrive || bonusHasOverdrive || fieldHasOverdrive;
  }, [gamePhase, selectedAgent, selectedFocus, currentFieldIndex, battlefields, playerArmyBonuses]);
  
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
    const isGuidedScripted = guidedMatch.active && !guidedMatch.freePlay && currentGuidedRound;

    if (isGuidedScripted) return;

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
  }, [
    gamePhase,
    isPlayerFirst,
    battlefields,
    conqueredFields,
    revealedFields,
    roundNumber,
    ai.getThinkingTime,
    isOnlinePvP,
    guidedMatch.active,
    guidedMatch.freePlay,
    currentGuidedRound,
    setCurrentFieldIndex,
    setLogs,
    setGamePhase,
  ]);

  // Reset tilt Tabellone quando si esce da selectField (per il prossimo round)
  useEffect(() => {
    if (gamePhase !== 'selectField') setTabelloneTiltDismissed(false);
  }, [gamePhase]);

  // Anteprima vuota all'apertura di ogni nuovo duello / round / mischia iniziale
  useLayoutEffect(() => {
    if (gamePhase === 'selectField' || gamePhase === 'shuffleDeal') {
      clearCardPreview();
    }
  }, [gamePhase, clearCardPreview]);

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
    if (guidedMatch.active && !guidedMatch.freePlay && currentGuidedRound) return;
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
  }, [gamePhase, isPlayerFirst, enemyHand.length, enemyAgent, ai.selectEnemyAgentAndFocus, ai.getThinkingTime, isOnlinePvP, guidedMatch.active, guidedMatch.freePlay, currentGuidedRound]);

  useEffect(() => {
    if (!guidedMatch.active || guidedMatch.freePlay || !currentGuidedRound) return;
    if (guidedIntroStage < INTRO_STAGE_PLAY) return;
    if (gamePhase === 'selectField' && !isPlayerFirst && guidedPause === null && currentFieldIndex === null) {
      setGuidedPause('enemyField');
    }
  }, [
    guidedMatch.active,
    guidedMatch.freePlay,
    currentGuidedRound,
    guidedIntroStage,
    gamePhase,
    isPlayerFirst,
    guidedPause,
    currentFieldIndex,
    setGuidedPause,
  ]);

  useEffect(() => {
    if (!guidedMatch.active || guidedMatch.freePlay || !currentGuidedRound) return;
    if (guidedIntroStage < INTRO_STAGE_PLAY) return;
    if (gamePhase === 'selectAgent' && !isPlayerFirst && guidedPause === null && !enemyAgent) {
      setGuidedPause('enemyAgent');
    }
  }, [
    guidedMatch.active,
    guidedMatch.freePlay,
    currentGuidedRound,
    guidedIntroStage,
    gamePhase,
    isPlayerFirst,
    guidedPause,
    enemyAgent,
    setGuidedPause,
  ]);

  useEffect(() => {
    if (!guidedMatch.active || !currentGuidedRound || guidedMatch.freePlay) return;
    if (gamePhase !== 'selectAgent') return;
    if (enemyAgent) return;
    // Con iniziativa giocatore: il nemico si rivela solo dopo la scelta del tuo agente
    if (isPlayerFirst && !selectedAgent) return;
    // Con iniziativa nemica: rivelazione solo dopo conferma lettura (handleGuidedContinue)
    if (!isPlayerFirst) return;

    if (guidedEnemyDeployScheduledRef.current) return;
    guidedEnemyDeployScheduledRef.current = true;

    const timer = setTimeout(() => {
      deployScriptedGuidedEnemy();
    }, getGuidedEnemyDeployDelayMs());

    return () => clearTimeout(timer);
  }, [
    guidedMatch.active,
    guidedMatch.freePlay,
    currentGuidedRound,
    gamePhase,
    enemyAgent,
    isPlayerFirst,
    selectedAgent,
    deployScriptedGuidedEnemy,
  ]);

  // Selezione campo giocatore
  const handleFieldSelect = (field) => {
    if (isGuidedIntroEpiloguePhase || isGuidedAdvancedEpiloguePhase || isGuidedIntroFreePlayFinalPhase) {
      return;
    }
    if (
      isGuidedIntroWelcomePhase ||
      isGuidedIntroHandsPhase ||
      isGuidedIntroPreviewPhase ||
      isGuidedIntroVictoryPhase ||
      isGuidedIntroFcBudgetPhase ||
      isGuidedAdvancedGoalPhase ||
      isGuidedAdvancedTriggersPhase
    ) {
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
    if (
      guidedMatch.active &&
      currentGuidedRound &&
      !guidedMatch.freePlay &&
      gamePhase === 'selectField' &&
      !isPlayerFirst
    ) {
      setGuidedHint('Il nemico ha l\'iniziativa: sceglierà lui il campo.');
      return;
    }
    if (guidedMatch.active && currentGuidedRound && !guidedMatch.freePlay && idx !== currentGuidedRound.fieldIndex) {
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
    if (isOnlinePvP && multiplayerSession?.roomCode && isPlayerFirst) {
      getMultiplayerManager().sendRelay(multiplayerSession.roomCode, {
        type: 'peer_move',
        roundNumber,
        phase: 'field',
        fieldIndex: idx,
      });
    }
    // Passa alla fase selectAgent solo se non siamo già lì
    if (gamePhase === 'selectField') {
      setGamePhase('selectAgent');
    }
  };

  const handleFocusChange = useCallback((focusValue) => {
    setSelectedFocus(focusValue);
    if (guidedMatch.active && currentGuidedRound && !guidedMatch.freePlay) {
      const { ok, feedback } = validateFocusForRound(currentGuidedRound, focusValue);
      if (!ok) {
        setGuidedHint(feedback || `FC non validi per questo step.`);
        return;
      }
      if (feedback && currentGuidedRound.focusPolicy === 'range') {
        setGuidedHint(feedback);
        return;
      }
    }
    setGuidedHint('');
  }, [guidedMatch.active, guidedMatch.freePlay, currentGuidedRound, validateFocusForRound, setSelectedFocus, setGuidedHint]);

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

    if (
      p.phase === 'field' &&
      !isPlayerFirst &&
      (gamePhase === 'selectField' || gamePhase === 'selectAgent')
    ) {
      setCurrentFieldIndex(p.fieldIndex);
      const fieldName = battlefields[p.fieldIndex]?.name || `Campo ${p.fieldIndex + 1}`;
      setLogs((prev) => [
        ...prev.slice(-20),
        gamePhase === 'selectField'
          ? `[R${roundNumber}] L'avversario sceglie: ${fieldName}`
          : `[R${roundNumber}] L'avversario cambia campo: ${fieldName}`,
      ]);
      if (gamePhase === 'selectField') {
        setGamePhase('selectAgent');
      }
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
    if (guidedMatch.active && currentGuidedRound && !guidedMatch.freePlay) {
      const expectedFieldName = battlefields[currentGuidedRound.fieldIndex]?.name || `Campo ${currentGuidedRound.fieldIndex + 1}`;
      const expectedAgentName = playerHand.find((c) => c.id === currentGuidedRound.playerAgentId)?.name || 'agente richiesto';
      if (currentFieldIndex !== currentGuidedRound.fieldIndex) {
        if (!isPlayerFirst && gamePhase === 'selectField') {
          setGuidedHint('Attendi che il nemico scelga il campo.');
        } else {
          setGuidedHint(`Prima scegli il campo corretto: "${expectedFieldName}".`);
        }
        return;
      }
      if (!selectedAgent || selectedAgent.id !== currentGuidedRound.playerAgentId) {
        setGuidedHint(`Per questo step devi schierare "${expectedAgentName}".`);
        return;
      }
      const focusCheck = validateFocusForRound(currentGuidedRound, selectedFocus);
      if (!focusCheck.ok) {
        setGuidedHint(focusCheck.feedback || `FC non validi per questo step.`);
        return;
      }
      if (focusCheck.feedback && currentGuidedRound.focusPolicy === 'range') {
        setGuidedHint(focusCheck.feedback);
      } else {
        setGuidedHint('');
      }
      if (!selectedAgent || selectedFocus < 1) return;
      if (enemyAgent) {
        setGamePhase('battle');
        return;
      }
      if (isPlayerFirst) {
        setPlayerConfirmedAwaitingAI(true);
        return;
      }
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
      const isGuidedDuelPaused =
        guidedMatch.active &&
        !guidedMatch.freePlay &&
        guidedIntroStage >= INTRO_STAGE_PLAY &&
        guidedPause === 'duel';
      if (isGuidedDuelPaused) return;
      resolveBattle();
    }
  }, [gamePhase, selectedAgent, enemyAgent, resolveBattle, guidedMatch.active, guidedMatch.freePlay, guidedIntroStage, guidedPause]);

  // Pausa guidata: attende OK prima di avviare il duello
  useEffect(() => {
    if (!guidedMatch.active || guidedMatch.freePlay || guidedIntroStage < INTRO_STAGE_PLAY) return;
    if (gamePhase === 'battle' && guidedPause === null) {
      setGuidedPause('duel');
    }
  }, [
    guidedMatch.active,
    guidedMatch.freePlay,
    guidedIntroStage,
    gamePhase,
    guidedPause,
    setGuidedPause,
  ]);

  // Fasi: 0=Schieramento, 1=Poteri/bonus (sub-step), 2=Focus+POT×FC, 3=Mod/min VA, 4=Scontro, 5=Risultato, 6=Pulsante
  useEffect(() => {
    if (gamePhase === 'result' && battleResult) {
      const isGuidedDuelPaused =
        guidedMatch.active &&
        !guidedMatch.freePlay &&
        guidedIntroStage >= INTRO_STAGE_PLAY &&
        guidedPause === 'duel';
      if (isGuidedDuelPaused) return;
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
        const timer = setTimeout(() => advanceDuelPhase(), bufferMs);
        return () => clearTimeout(timer);
      }

      if (duelPhase === 3 && phase3SubCount > 1) {
        if (visualEffectStep < phase3SubCount) {
          const timer = setTimeout(() => advanceEffectStep(), stepMs);
          return () => clearTimeout(timer);
        }
        const timer = setTimeout(() => advanceDuelPhase(), bufferMs);
        return () => clearTimeout(timer);
      }

      if (duelPhase === 5 && postCount > 0) {
        if (visualEffectStep < postCount) {
          const timer = setTimeout(() => advanceEffectStep(), stepMs);
          return () => clearTimeout(timer);
        }
        const timer = setTimeout(() => advanceDuelPhase(), bufferMs);
        return () => clearTimeout(timer);
      }

      const delays = buildPhaseAdvanceDelaysMs(
        duelVfx,
        battleResult.playerFocusUsed,
        battleResult.enemyFocusUsed,
        battleResult
      );
      if (duelPhase < delays.length - 1) {
        const delay = delays[duelPhase];
        const timer = setTimeout(() => {
          advanceDuelPhase();
        }, delay);
        return () => clearTimeout(timer);
      }
    }
  }, [
    gamePhase,
    duelPhase,
    visualEffectStep,
    battleResult,
    duelVfx,
    advanceEffectStep,
    advanceDuelPhase,
    guidedMatch.active,
    guidedMatch.freePlay,
    guidedIntroStage,
    guidedPause,
  ]);
  
  const getFocusCoinGlowColor = (focusCount, intensity) =>
    computeFocusCoinGlowColor(focusCount, intensity, rainbowTime, {
      rainbowHueMul12: duelVfx.rainbowHueMul12,
      rainbowHueMul13: duelVfx.rainbowHueMul13,
      rainbowHueMul14: duelVfx.rainbowHueMul14,
    });

  
  // Animazione focus coin sequenziali (fase 2)
  useEffect(() => {
    if (gamePhase === 'result' && battleResult && duelPhase === 2) {
      clearFocusCoinTimers();
      // Reset quando entra nella fase 2
      setPlayerFocusCoinsShown(0);
      setEnemyFocusCoinsShown(0);
      setCardGlowIntensity(0);
      setPlayerCardGlow(0);
      setEnemyCardGlow(0);
      
      const playerTotal = battleResult.playerFocusUsed;
      const enemyTotal = battleResult.enemyFocusUsed;
      const maxTotal = Math.max(playerTotal, enemyTotal);
      
      // Anima l'apparizione sequenziale (lento all'inizio, veloce verso la fine)
      for (let i = 0; i < maxTotal; i++) {
        const appearMs = computeFocusCoinAppearDelayMs(i, maxTotal, duelVfx);
        const timer = setTimeout(() => {
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
        }, appearMs);
        focusCoinTimersRef.current.push(timer);
      }
    }
    return () => clearFocusCoinTimers();
    // Non resettare quando si esce dalla fase 2 - i focus coin devono rimanere visibili
  }, [gamePhase, duelPhase, battleResult, duelVfx, clearFocusCoinTimers]);
  
  // Aggiorna continuamente i colori arcobaleno e diamante (per animazione).
  // I colori speciali esistono solo da 12 FC in su: sotto quella soglia
  // l'interval non parte, evitando ~20 re-render/s inutili.
  useEffect(() => {
    const needsRainbow =
      battleResult &&
      Math.max(battleResult.playerFocusUsed || 0, battleResult.enemyFocusUsed || 0) >= 12;
    // Fase 4: il clash ha il proprio loop rAF — evitare ~20 re-render/s del root in parallelo.
    if (gamePhase === 'result' && needsRainbow && duelPhase >= 2 && duelPhase < 4) {
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
    const suspendGuidedTerritorialWin = guidedMatch.active && !guidedMatch.freePlay;
    
    // Check vittoria per campi conquistati (3 campi)
    // In modalità classica: SOLO nei round 1-4 (al round 5+ cambia in "Supremazia")
    // In modalità Bare Hands: SEMPRE attiva
    // REKLAMAZIONE: ai round 3 o 4, chi vince per campi può reclamare la vittoria o continuare a giocare
    const canReclaim = (roundNumber === 3 || roundNumber === 4) && !suspendGuidedTerritorialWin;
    const skipTerritorialWin = forceContinueAfterClaimRef.current;
    if (skipTerritorialWin) {
      forceContinueAfterClaimRef.current = false;
    } else if (!suspendGuidedTerritorialWin && gameMode === 'bareHands') {
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
          if (isOnlinePvP) {
            setOpponentClaimPending({ playerFields, enemyFields });
            return;
          }
          setGameResult({ winner: 'enemy', reason: 'fields', playerFields, enemyFields });
          setGamePhase('gameOver');
          return;
        }
        setGameResult({ winner: 'enemy', reason: 'fields', playerFields, enemyFields });
        setGamePhase('gameOver');
        return;
      }
    } else if (!suspendGuidedTerritorialWin && roundNumber < 5) {
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
          if (isOnlinePvP) {
            setOpponentClaimPending({ playerFields, enemyFields });
            return;
          }
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

  const advanceGuidedRoundState = (playerFields, enemyFields) => {
    setSelectedAgent(null);
    setSelectedFocus(1);
    setEnemyAgent(null);
    setEnemySelectedFocus(1);
    setCurrentFieldIndex(null);
    setBattleResult(null);
    setShowClashAnimation(false);
    aiHasSelectedAgent.current = false;
    setPlayerConfirmedAwaitingAI(false);
    guidedEnemyDeployScheduledRef.current = false;
    if (guidedEnemyDeployTimerRef.current) {
      clearTimeout(guidedEnemyDeployTimerRef.current);
      guidedEnemyDeployTimerRef.current = null;
    }
    setGuidedPause(null);
    setIncomingPeerMoveQueue((prev) =>
      prev.filter((msg) => typeof msg.roundNumber === 'number' && msg.roundNumber > roundNumber)
    );
    setGuidedHint('');

    const nextRoundNum = roundNumber + 1;
    setRoundNumber(nextRoundNum);

    if (campaignDuelMod?.initiativeProfile === 'assault' && nextRoundNum === 2) {
      setIsPlayerFirst(true);
    } else if (campaignDuelMod?.initiativeProfile === 'defense' && nextRoundNum === 2) {
      setIsPlayerFirst(false);
    } else {
      setIsPlayerFirst((prev) => !prev);
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

  const handleIntroEpiloguePlay = () => {
    enableGuidedFreePlay();
    const playerFields = Object.values(conqueredFields).filter((f) =>
      (typeof f === 'object' && f?.winner === 'player') || (typeof f === 'string' && playerHand.some((c) => c.army === f))
    ).length;
    const enemyFields = Object.values(conqueredFields).filter((f) =>
      (typeof f === 'object' && f?.winner === 'enemy') || (typeof f === 'string' && enemyHand.some((c) => c.army === f))
    ).length;
    advanceGuidedRoundState(playerFields, enemyFields);
  };

  // Reset e passaggio al prossimo round (usato anche da "Continua a giocare" nella reclamazione)
  const doResetAndNextRound = (playerFields, enemyFields) => {
    if (
      guidedMatch.active &&
      guidedMatch.trackId === 'intro' &&
      !guidedMatch.freePlay &&
      roundNumber === 3
    ) {
      setGuidedIntroStage(INTRO_STAGE_EPILOGUE);
      setGuidedHint('');
      return;
    }

    if (
      guidedMatch.active &&
      guidedMatch.trackId === 'advanced' &&
      roundNumber === 5
    ) {
      setGuidedIntroStage(ADV_STAGE_EPILOGUE);
      setGuidedHint('');
      return;
    }

    if (
      guidedMatch.active &&
      guidedMatch.trackId === 'advanced' &&
      roundNumber === 1
    ) {
      setGuidedIntroStage(ADV_STAGE_TRIGGERS);
    }

    advanceGuidedRoundState(playerFields, enemyFields);
  };

  const sendClaimDecisionRelay = useCallback(
    (decision, playerFields, enemyFields) => {
      if (!isOnlinePvP || !multiplayerSession?.roomCode) return;
      getMultiplayerManager().sendRelay(multiplayerSession.roomCode, {
        type: 'claim_decision',
        decision,
        roundNumber,
        playerFields,
        enemyFields,
      });
    },
    [isOnlinePvP, multiplayerSession?.roomCode, roundNumber]
  );

  useEffect(() => {
    if (!isOnlinePvP || !incomingClaimDecision) return;
    const p = incomingClaimDecision;
    if (typeof p.roundNumber !== 'number') {
      setIncomingClaimDecision(null);
      return;
    }
    if (p.roundNumber < roundNumber) {
      setIncomingClaimDecision(null);
      return;
    }
    if (p.roundNumber !== roundNumber) return;

    const countLocalFields = () => {
      const pf = Object.values(conqueredFields).filter((f) =>
        (typeof f === 'object' && f?.winner === 'player') ||
        (typeof f === 'string' && playerHand.some((c) => c.army === f))
      ).length;
      const ef = Object.values(conqueredFields).filter((f) =>
        (typeof f === 'object' && f?.winner === 'enemy') ||
        (typeof f === 'string' && enemyHand.some((c) => c.army === f))
      ).length;
      return { pf, ef };
    };

    if (p.decision === 'victory') {
      const { pf, ef } = countLocalFields();
      setOpponentClaimPending(null);
      setShowClaimVictoryChoice(null);
      setGameResult({ winner: 'enemy', reason: 'fields', playerFields: pf, enemyFields: ef });
      setGamePhase('gameOver');
      setIncomingClaimDecision(null);
      return;
    }

    if (p.decision === 'continue') {
      const wasWaiting = opponentClaimPending != null;
      setOpponentClaimPending(null);
      setShowClaimVictoryChoice(null);
      const { pf, ef } = countLocalFields();
      if (wasWaiting) {
        doResetAndNextRound(pf, ef);
      } else {
        forceContinueAfterClaimRef.current = true;
      }
      setIncomingClaimDecision(null);
    }
  }, [
    isOnlinePvP,
    incomingClaimDecision,
    roundNumber,
    conqueredFields,
    playerHand,
    enemyHand,
    opponentClaimPending,
    setGameResult,
    setGamePhase,
    setShowClaimVictoryChoice,
  ]);

  const mpSelfLabel = isOnlinePvP ? (multiplayerSession?.playerName || 'Tu') : 'TU';
  const mpEnemyLabel = isOnlinePvP ? (onlinePeerName || 'Avversario') : 'IA';
  const mpSelfHandLabel = isOnlinePvP ? (multiplayerSession?.playerName || 'Tu') : 'La Tua Mano';
  const mpEnemyHandLabel = isOnlinePvP ? (onlinePeerName || 'Avversario') : 'Mano Avversario';

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
    const openOverdriveLab = () => {
      const url = new URL(window.location.href);
      url.searchParams.set('overdriveLab', '1');
      window.location.href = url.toString();
    };
    const launchShuffleDuelTest = (shuffleKind) => {
      setDevDialogueDuelActive(false);
      setShuffleStyle(shuffleKind);
      const duel = prepareRandomDuelShuffleHands();
      startStandardGame(
        duel.playerArmy,
        duel.playerDeckKey,
        'classic',
        'medium',
        ALL_BATTLEFIELDS,
        duel.enemyArmy,
        duel.enemyDeckKey
      );
    };
    const menuItems = filterMenuItemsForBuild([
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
          { label: 'OVERDRIVE LAB', sub: 'VFX', meta: 'ANTEPRIMA FC', onClick: openOverdriveLab },
          {
            label: 'DIALOGUE DUELLO',
            sub: 'TEST',
            meta: 'ARMATA · MISCHIA',
            choices: dialogueDuelArmyMenuChoices,
          },
          {
            label: 'SHUFFLE DUELLO',
            sub: 'TEST',
            meta: 'SCEGLI MISCHIA',
            choices: SHUFFLE_STYLE_OPTIONS.map((opt) => ({
              label: opt.title.toUpperCase(),
              sub: opt.sub,
              meta: 'DUELLO CASUALE',
              onClick: () => launchShuffleDuelTest(opt.key),
            })),
          },
          { label: 'TOOL RITAGLIO', sub: 'ASSET', meta: 'SPRITE CROP', onClick: openCropTool },
        ],
      },
    ]);
    return (
      <div className="relative w-full h-full min-h-full" style={{ minHeight: '100%' }}>
        {!showDeckManager && (
          <SatzeMenuPrototype
            menuItems={menuItems}
            marqueeText={IS_PUBLIC_PLAYTEST_BUILD ? PUBLIC_BUILD_MARQUEE : undefined}
          />
        )}

        <TutorialSelector
          isOpen={isTutorialSelectorOpen}
          onClose={closeTutorialSelector}
          onSelect={handleTutorialTrackSelectWithPreviewReset}
          tracks={TUTORIAL_TRACKS}
          wasIntroCompleted={tutorial.wasCompleted('intro')}
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
          setOnlinePeerName(null);
          setOpponentClaimPending(null);
          setIncomingClaimDecision(null);
          forceContinueAfterClaimRef.current = false;
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

  // Opzione Mazzi misti (usata in selectArmy, selectDeck)
  const MIXED_DECKS_OPTION = 'Eserciti misti';
  const MIXED_DECKS_COLOR = '#a78bfa'; // violet-400

  const buildDeckConfirmDisplay = (army, deckKey, accent) => {
    if (!deckKey) return { accent, deckName: 'Esercito', armyLabel: army || '' };
    if (Array.isArray(deckKey)) {
      return { accent, deckName: 'Esercito hub', armyLabel: army || '' };
    }
    if (deckKey.startsWith('custom_')) {
      const decks = loadCustomDecks();
      const id = deckKey.replace('custom_', '');
      return {
        accent,
        deckName: decks[id]?.name || 'Esercito personalizzato',
        armyLabel: decks[id]?.army || army || '',
      };
    }
    return {
      accent,
      deckName: ARMY_DECKS[army]?.[deckKey]?.name || 'Esercito',
      armyLabel: army || '',
    };
  };

  // Durante la transizione post-difficoltà resta visibile la schermata esercito sotto l'iris (portal).

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
    const resolveSelectedDeckName = () => {
      if (!selectedDeckKey) return null;
      if (Array.isArray(selectedDeckKey)) return 'Esercito hub';
      if (selectedDeckKey.startsWith('custom_')) {
        const decks = loadCustomDecks();
        const id = selectedDeckKey.replace('custom_', '');
        return decks[id]?.name || 'Esercito personalizzato';
      }
      return ARMY_DECKS[selectedArmy]?.[selectedDeckKey]?.name || 'Esercito';
    };
    const difficultyPopupEl = showDifficultyPopup && typeof document !== 'undefined'
      ? createPortal(
          <DifficultySelectPopup
            isOpen
            armyName={selectedArmy}
            deckName={resolveSelectedDeckName()}
            accentColor={colors.accent}
            onClose={() => setShowDifficultyPopup(false)}
            onSelect={(diffId) => {
              setShowDifficultyPopup(false);
              clearCardPreview();
              const display = buildDeckConfirmDisplay(selectedArmy, selectedDeckKey, colors.accent);
              setLaunchShowText(true);
              setLaunchVisualPhase('animate');
              setPendingGameLaunch({
                sessionId: Date.now(),
                army: selectedArmy,
                deckKey: selectedDeckKey,
                mode: selectedMode,
                difficulty: diffId,
                ...display,
              });
            }}
          />,
          document.body
        )
      : null;
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
          goAfterDeckSelection(campDeckIds);
        },
      });
    }
    if (!isMixedMode) {
      Object.entries(predefinedDecks).forEach(([key, deck]) => {
        const deckCards = resolveDeckCards(deck, ARMY_SETS);
        const totalLeague = deckCards.reduce((sum, c) => sum + c.league, 0);
        deckOptions.push({
          key,
          name: `Esercito ${key} — ${deck.name}`,
          armyLabel: selectedArmy,
          description: deck.description,
          meta: `${deckCards.length} carte • Lega ${totalLeague}/30`,
          accent: colors.accent,
          onSelect: () => {
            setSelectedDeckKey(key);
            goAfterDeckSelection(key);
          },
        });
      });
    }
    customDecksForArmy.forEach(([deckId, deck]) => {
      const deckCards = isMixedMode ? resolveDeckCards(deck, ARMY_SETS) : ARMY_SETS[selectedArmy].filter(card => deck.cards.includes(card.id));
      const totalLeague = deckCards.reduce((sum, c) => sum + c.league, 0);
      const deckMixed = isMixedMode || isMixedDeck(deck, ARMY_SETS);
      const { accent: deckAccent, armies: deckArmies } = getDeckVisualMeta(deckCards, {
        fallbackArmy: deck.army || selectedArmy,
        armyColors: ARMY_COLORS,
        fallbackAccent: deckMixed ? MIXED_DECKS_COLOR : colors.accent,
      });
      deckOptions.push({
        key: `custom_${deckId}`,
        name: deck.name,
        armyLabel: deckMixed && deckArmies.length >= 2
          ? deckArmies.join(' · ')
          : (deck.army || (isMixedMode ? 'Misto' : selectedArmy)),
        description: deck.description || 'Esercito personalizzato',
        meta: `${deck.cards.length} carte • Lega ${totalLeague}/30`,
        accent: deckAccent,
        onSelect: () => {
          setSelectedDeckKey(`custom_${deckId}`);
          goAfterDeckSelection(`custom_${deckId}`);
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
                goAfterDeckSelection(campDeckIds);
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

    const resolveArmyFromDeckSlug = (armySlug) =>
      Object.keys(ARMY_DECKS).find(
        (army) =>
          army
            .toLowerCase()
            .replace(/['’]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '') === armySlug
      );

    if (deckOptions.length > 0) {
      return (
        <>
          {difficultyPopupEl}
          <DeckSelectCinematic
          armyName={isMixedMode ? null : selectedArmy}
          gameDeckOptions={deckOptions}
          selectedArmy={selectedArmy}
          isMixedMode={isMixedMode}
          campaignDeckIds={Array.isArray(campDeckIds) ? campDeckIds : null}
          onSelectDeck={(deckKey) => {
            let resolvedKey = deckKey;
            if (deckKey.includes('::')) {
              const [armySlug, key] = deckKey.split('::');
              const army = resolveArmyFromDeckSlug(armySlug);
              if (army) setSelectedArmy(army);
              resolvedKey = key;
              setSelectedDeckKey(key);
            } else {
              setSelectedDeckKey(deckKey);
            }
            goAfterDeckSelection(resolvedKey);
          }}
          onBack={() => {
            setShowDifficultyPopup(false);
            setSelectedArmy(null);
            setSelectedDeckKey(null);
            setGamePhase('selectArmy');
          }}
          onPreviewDeck={(deck) => {
            const payload = buildDeckPreviewPayload(deck, { selectedArmy });
            setPreviewDeckData({
              ...payload,
              _opt: payload._opt || {
                onSelect: () => {
                  let resolvedKey = deck.deckKey;
                  if (deck.deckKey.includes('::')) {
                    const [armySlug, key] = deck.deckKey.split('::');
                    const army = resolveArmyFromDeckSlug(armySlug);
                    if (army) setSelectedArmy(army);
                    resolvedKey = key;
                    setSelectedDeckKey(key);
                  } else {
                    setSelectedDeckKey(deck.deckKey);
                  }
                  goAfterDeckSelection(resolvedKey);
                },
              },
            });
            setGamePhase('previewDeck');
          }}
        />
        </>
      );
    }

    return (
      <>
        {difficultyPopupEl}
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
      </>
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
        playerName: multiplayerSession.playerName || 'Giocatore',
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
          <p className="text-[10px] text-slate-600 text-center font-mono break-all">
            Server: {getMultiplayerWsUrl()}
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
              setOnlinePeerName(null);
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

  // Schermata Galleria (DS3 cinematic)
  if (gamePhase === 'gallery') {
    const galleryTabProps = {
      galleryTab,
      onGalleryTabChange: (tab) => startTransition(() => setGalleryTab(tab)),
      agentCount: ALL_AGENTS.length,
      fieldCount: ALL_BATTLEFIELDS.length,
    };

    return galleryTab === 'agents' ? (
      <CardGallery
        totalCards={ALL_AGENTS.length}
        onBack={() => setGamePhase('menu')}
        {...galleryTabProps}
      />
    ) : (
      <GalleryCinematic
        totalFields={ALL_BATTLEFIELDS.length}
        onBack={() => setGamePhase('menu')}
        {...galleryTabProps}
      />
    );
  }

// Schermata di gioco

  const iaCardPositions = IA_CARD_POSITIONS;
  const playerCardPositions = PLAYER_CARD_POSITIONS;
  const isShuffleDealPhase = gamePhase === 'shuffleDeal' && !!shuffleDealSetup;
  const isPreviewEntranceBlocked =
    Boolean(pendingGameLaunch) ||
    isShuffleDealPhase;
  const displayPreviewCard = isPreviewEntranceBlocked ? null : (hoveredCard || lastPreviewCard);

  if (isShuffleDealPhase && shuffleLaunchHoldMsRef.current === null) {
    shuffleLaunchHoldMsRef.current = pendingGameLaunch ? getLaunchRevealHoldMs() : 0;
  }
  if (!isShuffleDealPhase) {
    shuffleLaunchHoldMsRef.current = null;
  }

  const duelHudDiscovering =
    isShuffleDealPhase && duelRevealPhase === 'reveal';

  // Sfondo duello: immagine specifica per ogni campo di battaglia (nessun gradiente)
  const activeFieldForBg = (currentFieldIndex !== null && battlefields[currentFieldIndex])
    ? battlefields[currentFieldIndex]
    : battleResult?.field;
  const fieldBgImage = activeFieldForBg?.bgImage || null;
  const entranceAnimationType = activeFieldForBg ? getBattlefieldAnimationType(activeFieldForBg.id) : 'default';

  return (
    <div 
      className={`relative overflow-visible${duelHudDiscovering ? ' duel-hud--discovering' : ''}`}
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
        '--duel-reveal-ms': `${DUEL_REVEAL_MS}ms`,
        '--duel-reveal-delay': '0ms',
      }}
    >
      <DuelRevealHudStyles />
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
              <p className="text-red-400 text-xs mb-3 text-center">
                {mpReconnectError}
                {/non trovata/i.test(mpReconnectError) && (
                  <span className="block mt-2 text-slate-400">
                    La stanza non esiste più sul server (riavvio o timeout). Dovete creare una nuova partita.
                  </span>
                )}
              </p>
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
            {displayPreviewCard ? (
              <div className="flex flex-col items-center w-full">
                <GameCard
                  cardLayout={galleryCardLayout}
                  agent={displayPreviewCard.agent}
                  showBonus={displayPreviewCard.showBonus !== undefined
                    ? displayPreviewCard.showBonus
                    : (displayPreviewCard.isPlayer !== false
                        ? playerArmyBonuses
                        : enemyArmyBonuses)[displayPreviewCard.agent?.army] &&
                      isBonusTriggerSatisfied(
                        displayPreviewCard.agent?.army,
                        displayPreviewCard.isPlayer !== false,
                        displayPreviewCard.agent
                      )}
                  bonusBaseInactive={(() => {
                    const p = displayPreviewCard;
                    const a = p.agent;
                    const map = p.isPlayer !== false ? playerArmyBonuses : enemyArmyBonuses;
                    return Boolean(ARMY_BONUSES[a?.army]) && !map?.[a?.army];
                  })()}
                  modifiedPower={displayPreviewCard.modifiedPower}
                  modifiedDamage={displayPreviewCard.modifiedDamage}
                  abilityCurrentValue={getAbilityCurrentValue(displayPreviewCard.agent, displayPreviewCard.isPlayer !== false)}
                  disabled
                />
                <div className="mt-3 w-full">
                  <div 
                    className="p-4 space-y-3 rounded-xl"
                    style={{ background: `${PALETTE.deepVoid}99`, border: `1px solid ${PALETTE.slate}` }}
                  >
                    {displayPreviewCard.agent?.ability && (() => {
                      const fullText = getAbilityExplanation(displayPreviewCard.agent.ability);
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
                    {displayPreviewCard.agent?.flavour && (
                      <div
                        className={displayPreviewCard.agent?.ability ? 'pt-3' : ''}
                        style={{ borderTop: `1px solid ${PALETTE.slate}` }}
                      >
                        <p 
                          className="text-sm italic leading-[1.75]" 
                          style={{ color: PALETTE.textPrimary, opacity: 0.92 }}
                        >
                          "{displayPreviewCard.agent.flavour}"
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
            background: `url(${resolvePublicAssetUrl('/Immagini_bg/adam_samson_hardcover_book_spine_dark_leather_binding_gold_de_e0c822f3-c6e7-43d5-8296-0a58b1c0173f_1.webp')}) center/cover no-repeat`,
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
        {/* Campi conquistati: IA a sinistra, Tu a destra - colore identità esercito (fusione) */}
          {(() => {
            const getConqueredCount = (winner) => Object.entries(conqueredFields)
              .filter(([, v]) => (typeof v === 'object' && v?.winner === winner) || (typeof v === 'string' && (winner === 'player' ? playerHand : enemyHand).some(c => c.army === v)))
              .length;
            const playerConqueredCount = getConqueredCount('player');
            const enemyConqueredCount = getConqueredCount('enemy');
            /* Stendardo verticale medievale: gonfalone con code */
            const BannerSilhouette = ({ filled, color }) => {
              const c = color || PALETTE.slate;
              return (
                <svg viewBox="0 0 24 24" fill={filled ? c : 'none'} stroke={c} strokeWidth="1.2" strokeLinejoin="round" className="w-full h-full" style={{ opacity: filled ? 1 : 0.5 }}>
                  <path d="M4 2h16v16l-4 4-4-4-4 4-4-4v-16z" />
                </svg>
              );
            };
            const Slot = ({ filled, accent }) => {
              const isFilled = filled && accent;
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
            const Row = ({ count, accent }) => (
              <div className="flex items-center justify-center gap-2 py-0.5">
                <div className="flex gap-2 flex-1 min-w-0 justify-center">
                  {[0, 1, 2].map((i) => <Slot key={i} filled={i < count} accent={accent} />)}
                </div>
              </div>
            );
            return (
              <div className="flex justify-between gap-4 mb-1">
                <div className="flex-1 min-w-0">
                  <Row count={enemyConqueredCount} accent={enemyIdentityColor} />
                </div>
                <div className="flex-1 min-w-0">
                  <Row count={playerConqueredCount} accent={playerIdentityColor} />
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
                  conqueredAccent={
                    idx in conqueredFields
                      ? (typeof conqueredFields[idx] === 'object' && conqueredFields[idx]?.winner === 'player'
                          ? playerIdentityColor
                          : typeof conqueredFields[idx] === 'object' && conqueredFields[idx]?.winner === 'enemy'
                            ? enemyIdentityColor
                            : null)
                      : null
                  }
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
                playerColor={playerIdentityColor}
                enemyColor={enemyIdentityColor}
              />
            </div>
            {/* Retro: FC */}
            <div ref={fcPanelRef} className="satze-panel-flip-face satze-panel-flip-face-back p-2 flex flex-col overflow-hidden items-center justify-start pt-4 satze-hide-scrollbar satze-fc-panel rounded-3xl"
              style={{
                background: `linear-gradient(135deg, rgba(10, 14, 26, 0.88) 0%, rgba(15, 23, 42, 0.85) 100%), url(${resolvePublicAssetUrl('/Immagini_bg/CampoFC_bg.webp')}) center/cover no-repeat`,
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
                accentColor={playerIdentityColor}
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
        label={mpEnemyHandLabel}
        gamePhase={gamePhase}
        disabled={true}
        armyBonuses={enemyArmyBonuses}
        isBonusTriggerSatisfied={isBonusTriggerSatisfied}
        isActive={gamePhase === 'selectField' && !isPlayerFirst || (gamePhase === 'selectAgent' && !isPlayerFirst && !enemyAgent)}
        handCardLayout={galleryCardLayout === 'reworkP4html' ? 'reworkP4' : galleryCardLayout}
        hideCards={shouldHideHandsForGuidedSetup}
        guidedBackgroundGlow={isGuidedIntroHandsPhase}
        showZoneShell={isShuffleDealPhase}
        zoneArmy={shuffleDealSetup?.enemyArmy}
        zoneColorHand={enemyDeckVisual?.deckCards}
        zoneArmies={enemyDeckVisual?.armies}
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
        label={mpSelfHandLabel}
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
        showZoneShell={isShuffleDealPhase}
        zoneArmy={shuffleDealSetup?.playerArmy}
        zoneColorHand={playerDeckVisual?.deckCards}
        zoneArmies={playerDeckVisual?.armies}
      />

      {isShuffleDealPhase && (
        <div className="absolute inset-0 z-[24] pointer-events-auto" aria-hidden />
      )}
      {isShuffleDealPhase && (
        <BattlefieldShuffleDealOverlay
          setup={shuffleDealSetup}
          onComplete={completeShuffleDeal}
          launchRevealHoldMs={shuffleLaunchHoldMsRef.current ?? 0}
          onRevealPhaseChange={setDuelRevealPhase}
        />
      )}

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
        onOpenPlaytest={IS_PUBLIC_PLAYTEST_BUILD ? undefined : () => {
          setGamePhase('playtestHistory');
        }}
        onReplayDuel={replayDuelAnimation}
        onSkipDuel={skipDuelAnimation}
      />

      <GuidedTutorialOverlay
        isActive={guidedMatch.active}
        guidedMatch={guidedMatch}
        guidedCallouts={guidedCallouts}
        guidedInstruction={guidedInstruction}
        guidedHint={guidedHint}
        showGuidedTrianglesHighlight={showGuidedTrianglesHighlight}
        isGuidedOkContinuePhase={isGuidedOkContinuePhase}
        isGuidedAckPause={isGuidedEnemyAckPause}
        isGuidedDuelPause={isGuidedDuelPause}
        isGuidedIntroEpiloguePhase={isGuidedIntroEpiloguePhase}
        isGuidedIntroFreePlayFinalPhase={isGuidedIntroFreePlayFinalPhase}
        isGuidedAdvancedEpiloguePhase={isGuidedAdvancedEpiloguePhase}
        guidedIntroStage={guidedIntroStage}
        gamePhase={gamePhase}
        overlayMode={guidedOverlayMode}
        raiseAboveGlossary={showGlossary}
        onIntroContinue={handleGuidedContinue}
        onIntroEpiloguePlay={handleIntroEpiloguePlay}
        onIntroEpilogueEnd={() => finishGuidedTutorial('intro')}
        onIntroFreePlayFinalClose={() => finishGuidedTutorial('intro')}
        onAdvancedEpilogueClose={() => finishGuidedTutorial('advanced')}
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
              overdrivePreview={playerOverdrivePreview}
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

      {devDialogueDuelActive && gamePhase === 'result' && battleResult && (
        <DuelDialogueOverlay
          battleResult={battleResult}
          duelPhase={duelPhase}
          showDiscardDialogue={showClashAnimation}
          isZoomed={isZoomed}
          paused={isGuidedDuelPause}
        />
      )}

      {/* ============================================ */}
      {/* Centro alto: Round, SATZE */}
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
      </div>

      {/* ============================================ */}
      {/* DATI IA - Alto Sinistra - z-index 10 */}
      {/* ============================================ */}
      <StatsPanel
        label={mpEnemyLabel}
        hp={enemyHP}
        focus={enemyFocus}
        toxin={enemyToxin}
        position="top-left"
        gamePhase={gamePhase}
        accentColor={ARMY_COLORS[enemyHand?.[0]?.army]?.accent}
      />

      {/* ============================================ */}
      {/* DATI PLAYER - Basso Destra - z-index 10 */}
      {/* ============================================ */}
      <StatsPanel
        label={mpSelfLabel}
        hp={playerHP}
        focus={playerFocus}
        toxin={playerToxin}
        position="bottom-right"
        gamePhase={gamePhase}
        accentColor={playerIdentityColor}
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
                  sendClaimDecisionRelay(
                    'victory',
                    showClaimVictoryChoice.playerFields,
                    showClaimVictoryChoice.enemyFields
                  );
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
                  sendClaimDecisionRelay(
                    'continue',
                    showClaimVictoryChoice.playerFields,
                    showClaimVictoryChoice.enemyFields
                  );
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

      {/* Attesa decisione reclamazione avversario (multiplayer, round 3–4) */}
      {opponentClaimPending && isOnlinePvP && (
        <div
          className="fixed inset-0 flex items-center justify-center z-[100]"
          style={{ pointerEvents: 'auto', background: 'rgba(10, 14, 26, 0.88)' }}
        >
          <div
            className="flex flex-col items-center gap-4 p-8 rounded-2xl max-w-md text-center border border-slate-500/50"
            style={{ fontFamily: HUD_ORATORIO_FONT_UI }}
          >
            <div className="text-xl font-bold text-slate-200">
              {onlinePeerName || 'L\'avversario'} ha conquistato 3 campi
            </div>
            <div className="text-slate-400 text-sm">
              Può reclamare la vittoria o continuare la partita. In attesa della sua scelta…
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

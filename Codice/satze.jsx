import { useFirstActPersistence, restoreFirstActSnapshot } from '../src/hooks/useFirstActPersistence.js';
import { CampaignDuelPreload } from '../src/components/campaign/CampaignDuelPreload.jsx';
import { CampaignPrototypeFrame } from '../src/components/campaign/CampaignPrototypeFrame.jsx';
import { firstActMatchOutcome, revealedAt } from '../src/campaign/logic/firstActBattle.js';
import { selectConcordiaAbility } from '../src/campaign/logic/concordiaAI.js';
import React, { useState, useEffect, useLayoutEffect, useCallback, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { createRoot } from 'react-dom/client';
import { formatAbilityHelper, generateFieldParticles, FIELD_STYLES } from '../src/utils';
import { FocusCoinSelector, LogPanel, StatsPanel, Icon } from '../src/components/ui';
import { CardReworkP4AsHtml, CardImage, Hand, GameCard } from '../src/components/cards';
import { MultiSeatWaitingQueue, playMultiSeatArrival, readMultiSeatRects } from '../src/components/battle/MultiSeatWaitingQueue.jsx';
import { CardBack } from '../src/components/cards/CardBack';
import { CardFlightLayer, rectToFlightPoint, useCardFlights } from '../src/components/cards/CardFlight.jsx';
import { applyPlaceHandoff, prefersReducedMotion, CLICK_FLIGHT_MS, DROP_IMPACT_MS } from '../src/components/battle/placeHandoff.js';
import { ArmyEntryFx } from '../src/components/fx/ArmyCardFx.jsx';
import { EntryPrecapture, entrySnapshotKey } from '../src/components/fx/EntryPrecapture.jsx';
import { ScreenCacheHost } from '../src/components/screenCache/ScreenCache.jsx';
import { getArmyAccent } from '../src/theme/duelAccents.js';
import { FX_CATALOG, FX_LAB_ARMY_PARAM, FX_LAB_PARAM } from '../src/components/fx/effects/catalog.js';
import { CardTagsRow } from '../src/components/cards/CardTagBadges';
import { MiniBattlefield, BattlefieldBackground, BattlefieldPanel } from '../src/components/battle';
import { RuneTitle, setRuneDecodeProgress } from '../src/components/ui/RuneTitle.jsx';
import { DuelCosmicHud } from '../src/components/battle/DuelCosmicHud.jsx';
import { DuelResultEnemyResultBody, DuelResultPlayerResultBody } from '../src/components/battle/DuelResultDuelBodies';
import { DuelClashAuroraSequence } from '../src/components/battle/DuelClashAuroraSequence';
import { useClashFocusHandoff } from '../src/components/battle/useClashFocusHandoff';
import { useDuelHpPresentation } from '../src/components/battle/useDuelHpPresentation';
import { DuelHpProjectiles } from '../src/components/battle/DuelHpProjectiles';
import { DuelVaLedger } from '../src/components/battle/DuelVaLedger';
import { DuelStepFx } from '../src/components/battle/DuelStepFx.jsx';
import { DuelFocusStage } from '../src/components/battle/DuelFocusStage.jsx';
import { useFocusLaunches } from '../src/components/battle/useFocusLaunches.js';
import { overdriveCoinThreshold } from '../src/game/duel/duelOverdriveTrigger.js';
import {
  DuelRound5Overlay,
  DuelWinOverlay,
  DuelLoseOverlay,
  useDuelOutcomeOverlay,
  getDuelOutcomeSubtitle,
  DUEL_OV_DUR,
  DUEL_R5_VICTORY_FLIP_MS,
} from '../src/components/battle/DuelCinematicOverlays';
import { DuelDialogueOverlay } from '../src/components/dialogue/DuelDialogueOverlay';
import { ClaimVictoryPopup, OpponentClaimPendingPopup, CLAIM_EXIT_MS } from '../src/components/battle/ClaimVictoryPopup';
import { usePresence } from '../src/hooks/usePresence';
import { ARMY_COLORS, ARMY_BONUSES, TRIGGER_NAMES, TRIGGER_DESCRIPTIONS, getAbilityExplanation, ARMY_SETS, ARMY_DECKS, ALL_AGENTS, ALL_BATTLEFIELDS, CARD_IMAGES, AGENT_IMAGES, getBattlefieldAnimationType, ARMY_ICONS } from '../src/data';
import { ACT as CAMPAIGN_ACT } from '../src/campaign/data/atto1.js';
import { buildDuelConfig as buildCampaignDuelConfig, restartCampaignEncounter } from '../src/campaign/logic/missionAdapter.js';
import { applyToxin } from '../src/game/toxinLogic';
import { checkTrigger } from '../src/game/triggerLogic';
import {
  getFieldModifiers,
  fieldGrantsOverdriveBonus,
  resolveAbilityForDisplay,
  resolveArmyBonusForDisplay,
  buildDisplayTriggerRules,
  getFieldSetupFlags,
} from '../src/game/fieldLogic';

import { countAttritionPriorCards, countInitialLeagueCards, battleOutcomeKey } from '../src/game/duel/duelHelpers.js';
import { resolveRoundInitiative } from '../src/game/duel/resolveRoundInitiative.js';
import { needsEminenceRoundOpen, openEminenceRound, autoSelectFirstLegalAbility, advanceToNextRevealGate, autoCommitEminenceSetup, commitEminenceSetupChoice, resolvePendingDeal, autoResponseForPendingDeal, isEminenceSetupPending } from '../src/game/eminence/eminenceDuelGate.js';
import { selectEminenceAbility, areSelectionsComplete, getNextGate, setEminenceAbilityParams } from '../src/game/eminence/eminenceRound.js';
import { EMINENCE_ONLINE_MESSAGES, choiceMessage as eminenceChoiceMessage, setupMessage as eminenceSetupMessage, dealMessage as eminenceDealMessage, applyRemoteChoice, applyRemoteSetup, dealNeedsRemoteResponse, forcedDealResponse } from '../src/game/eminence/eminenceOnline.js';
import { settleEminenceMatch } from '../src/game/eminence/eminenceDuelGate.js';
import { readHpDelta, resolveLivePowerBonusSwapDisplay } from '../src/game/eminence/eminenceDuelBinding.js';
import { getEminenceAbility } from '../src/data/eminences.js';
import { EMINENCE_PRIMITIVES as EP, PRIMITIVE_TARGETS as ET } from '../src/game/eminence/eminenceConstants.js';
import { applyFieldOperations } from '../src/game/eminence/fieldOperations.js';
import { noticesFromRoundStart, noticesFromSetupPending } from '../src/game/eminence/eminenceAnnouncements.js';
import {
  getEminenceAnnounceHoldMs,
  getEminenceSparkNoticeGapMs,
} from '../src/utils/eminenceSystemPreference.js';
import { isEminenceSubsystemEnabled } from '../src/game/eminence/eminenceState.js';
import { waitForFieldAgentEntrance } from '../src/components/eminence/eminenceMarkCinematic.js';
import { stampComposeParams } from '../src/game/eminence/composeAbilityParams.js';
import { mergeSlotCurseCounts } from '../src/game/eminence/slotCurses.js';
import { REVEAL_GATES } from '../src/game/eminence/eminenceConstants.js';
import {
  buildEminenceChoiceView,
  isAwaitingEminenceChoice,
  isAwaitingRevealParams,
  shouldHoldDuelForEminence,
  canSelectBattlefield,
  canAdvanceEminenceGeneralGate,
  shouldShowEminenceAbilityRail,
  shouldShowEminenceSideZone,
  shouldShowEminenceLayer,
  shouldRevealEnemyHandForEminenceChoice,
  shouldRevealBoardForEminenceChoice,
  isEminenceTableInspectable,
  resolveEminenceChromeVisible,
  legalPreyIdsForChoice,
  legalFragmentIdsForChoice,
  legalCardIdsForChoice,
  legalSlotIndicesForChoice,
  CHOICE_STATES,
} from '../src/game/eminence/eminenceChoiceView.js';
import { buildDuelStepFx, currentStepFx } from '../src/game/duel/duelStepFx.js';
import { EminencePresenceSparks, useEminencePresenceLink } from '../src/components/eminence/useEminencePresenceLink.jsx';
import { EminenzaZone } from '../src/components/eminence/EminenzaZone.jsx';
import { EminenzaTableToggle } from '../src/components/eminence/EminenzaTableToggle.jsx';
import { useEminencePreyFlight, curseSlotKeys } from '../src/components/eminence/EminenceMarkFlight.jsx';
import { resolveNoticeCinematics } from '../src/game/eminence/eminenceCinematics.js';
import { playNoticeAudioPreview } from '../src/audio/cinematicAudio.js';
import { useMatchAudio } from '../src/audio/useMatchAudio.js';
import { GAME_SOUND, playGame, playGameAt } from '../src/audio/gameSounds.js';
import { playUiClick } from '../src/audio/soundBus';
import { formatAIReasoningLogText } from '../src/game/ai/aiDebug.js';
import { BattlefieldShuffleDealOverlay } from '../src/components/shuffle/BattlefieldShuffleDealOverlay';
import { getLaunchRevealHoldMs, DUEL_REVEAL_MS } from '../src/components/shuffle/duelEntranceTiming';
import { DuelRevealHudStyles } from '../src/components/shuffle/DuelRevealVeil';
import { prepareDuelShuffleHands, prepareRandomDuelShuffleHands } from '../src/components/shuffle/prepareDuelShuffleHands';
import { SHUFFLE_STYLE_OPTIONS, setShuffleStyle } from '../src/utils/shuffleStylePreference';
import {
  getPlaceFxPreference,
  resolvePlaceFxForVia,
  placeFxStyleClass,
  needsTwoFaces,
  getPlaceFxDurationMs,
} from '../src/utils/placeFxPreference';
import { CARD_BACK_IMAGES } from '../src/utils/cardBackPicker';
import {
  armyMenuLabel,
  buildDialogueDuelArmyChoices,
} from '../src/utils/devDialogueDuelMenu';
import { IA_CARD_POSITIONS, PLAYER_CARD_POSITIONS, enemyHandIdsLeftToRight } from '../src/config/battlefieldHandLayout';
import { useGameState, useAnimations, useBattle, useDragAndDrop, useGameFlow, useAI, useTutorial, useCampaignGameOutcome, useGuidedTutorialFlow, useTutorialOrchestrator, useEventCallback } from '../src/hooks';
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
  TUTORIAL_ACCENT,
  GuidedTutorialOverlay,
  TUTORIAL_STEPS,
  TUTORIAL_STEPS_BY_MODE,
  TUTORIAL_STEPS_DEFAULT_MODE,
  TUTORIAL_TRACKS,
} from '../src/components/tutorial';
import { ManualBook } from '../src/manual/ManualBook.jsx';
import { Glossary } from '../src/components/Glossary';
import { DIFFICULTY_NAMES } from '../src/utils';
import { abandonFirstActAttempt, loadCampaignRun, saveCampaignRun } from '../src/campaign/state/persistence';
import { CampaignSaveSlots } from '../src/components/campaign/CampaignSaveSlots';
import { MultiplayerLobby, MULTIPLAYER_ACCENT } from '../src/components/multiplayer/MultiplayerLobby';
import { SatzeMenuPrototype, MenuCard, OptionsScreen, PALETTE, MENU_ACCENTS, HUD_ORATORIO_FONT_UI } from '../src/components/menu';
import { useTransitionedSetGamePhase, useCurtain } from '../src/components/cosmic/ScreenTransition';
import { applyVfxQualityToDuelConfig, getVfxQualityProfile } from '../src/settings/vfxQualityProfile';
import { scaleDuelMs, scaleDuelVisualConfig } from '../src/settings/duelPlayback.js';
import { DISPLAY_SETTINGS_CHANGED_EVENT, getDisplaySettings, resolveDuelLayoutBreathClass } from '../src/settings/displaySettings';
import { isSatzeCursorDuelPhase, setSatzeCursorProps } from '../src/components/cursor/satzeCursorState';
import DeckSelectCosmic from '../src/components/cosmic/DeckSelectCosmic.jsx';
import DeckPreviewCosmic from '../src/components/cosmic/DeckPreviewCosmic.jsx';
import { DECK_SUMMARY_BG_POSITION } from '../src/data/deckSummaryCropConfig';
import { CosmicScreenLayout } from '../src/components/menu/cosmic/CosmicScreenLayout';
import ArmySelectCinematic from '../src/components/menu/cosmic/ArmySelectCinematic.jsx';
import DeckSelectCinematic, { buildDeckPreviewPayload } from '../src/components/menu/cosmic/DeckSelectCinematic.jsx';
import CardGallery, { GALLERY_AGENT_COUNT, GALLERY_ALTERNATIVE_COUNT } from '../src/components/menu/gallery/CardGallery.jsx';
import EminenceGallery from '../src/components/menu/gallery/EminenceGallery.jsx';
import GalleryCinematic from '../src/components/menu/gallery/GalleryCinematic.jsx';
import { EMINENCE_IDS } from '../src/data/eminences.js';
import { CosmicDeckCarousel } from '../src/components/menu/cosmic/CosmicDeckCarousel';
import { CosmicBannerButton } from '../src/components/menu/cosmic/CosmicBannerButton';
import { DifficultySelectPopup } from '../src/components/menu/cosmic/DifficultySelectPopup';
import { useMultiSeatDuel, MULTI_SEAT_KINDS } from '../src/hooks/useMultiSeatDuel';
import OnlineRoomPanel, { ONLINE_MODES } from '../src/components/multiplayer/OnlineRoomPanel.jsx';
import { OnlineRoomScreen } from '../src/components/multiplayer/OnlineRoomScreen.jsx';
import { buildMatchPackage, MS as MULTI_MS } from '../src/game/multiSeat/onlineSession.js';
import { MultiSeatPanel } from '../src/components/battle/MultiSeatPanel';
import { TeamDuelBoard, useBoardLayouts } from '../src/components/battle/TeamDuelBoard';
import { DeckConfirmTransition, LAUNCH_TRANSITION } from '../src/components/menu/cosmic/DeckConfirmTransition';
import { armVersusHandoff } from '../src/components/versus/versusHandoff.js';

import { DuelLoadingOverlay } from '../src/components/DuelLoadingOverlay';
import { buildDuelVersusData } from '../src/components/versus/versusMatchData';
import { CosmicDeckManagerList } from '../src/components/menu/cosmic/CosmicDeckManagerList';
import { CosmicDeckBuilderWrapper } from '../src/components/menu/cosmic/CosmicDeckBuilderWrapper';
import { BattlefieldGallery } from '../src/components/gallery/BattlefieldGallery';
import { BattlefieldReveal } from '../src/components/gallery/BattlefieldRevealAnimations';
import { PlaytestHistoryScreen } from '../src/components/playtest/PlaytestHistoryScreen';
import { TournamentHubScreen } from '../src/components/tournament/TournamentHubScreen';
import { SpectatorHud } from '../src/components/tournament/SpectatorHud';
import {
  ROUND_NAMES, describeHumanMatch, getMatch, getPendingGame, prepareHumanGame, recordHumanGameResult,
  convertToAi, getPendingAiMatches, recordAiSeries, recordMatchGameResult, withViewer,
} from '../src/game/tournament/tournamentLogic.js';
import {
  createTournamentForPlayer, loadTournament, saveTournament, resolveTournamentCards,
  hasGameLog, playAiSeries, playPendingAiSeries, replaySavedAiGame,
  buildTournamentOnlineMatch, createOnlineTournament, detachToOffline, prepareOpenHumanGames,
} from '../src/game/tournament/tournamentSetup.js';
import { GAME_MODES, MATCH_FORMATS } from '../src/data/gameModes';
import { EMINENCE_FORMAT } from '../src/game/eminence/eminenceConstants.js';
import { loadCustomDecks, isMixedDeck, resolveDeckCards, getHandAccentColor, getDeckVisualMeta } from '../src/utils/deckManager';
import { appendPlaytestRecord } from '../src/utils/playtestHistory';
import { registraPartita, nuovoIdPartita, telemetriaAttiva, svuotaCoda, serveNomeGiocatore } from '../src/telemetry/telemetria.js';
import { roundDuello, partitaDuello, partitaMultiPosto } from '../src/telemetry/recordPartita.js';
import NomeGiocatoreModal from '../src/components/playtest/NomeGiocatoreModal.jsx';
import { getMultiplayerWsUrl } from '../src/config/multiplayerConfig';
import { resolvePublicAssetUrl } from '../src/utils/preloadAssets';
import { preloadCardImagesForAgents } from '../src/data/images.js';
import { getCardSprite } from '../src/utils/cardUtils.js';
import { getMultiplayerManager } from '../src/utils/multiplayer';
import { mulberry32 } from '../src/utils/seededRandom.js';
import { clearMpSession, persistMpSession, reconnectToRoom } from '../src/utils/multiplayerReconnect';
import { buildOnlineMatchPayload } from '../src/utils/onlineMatch';
import { resolveDeckCardsForArmy } from '../src/utils/deckResolve';
import { getDuelVisualConfig } from '../src/config/duelVisualConfigStore.js';
import { DUEL_VFX_CHANGED_EVENT } from '../src/config/duelVisualConfig.js';
import { buildPhaseAdvanceDelaysMs, countDuelPhase3SubSteps, computeFocusCoinAppearDelayMs, getNextDuelPhase, syncDuelVisualsForPhase, effectStepPeriodMs } from '../src/config/duelVisualTimeline.js';
import { keepLastRounds } from '../src/game/duel/battleEventSelectors.js';
import { BATTLE_EVENT_TYPES, createBattleEventEmitter } from '../src/game/duel/battleEventTypes.js';
import { createBattleLogChannel, emitInfo } from '../src/game/duel/battleEventEmit.js';
import { countDuelEffectSteps, countDuelPostEffectSteps } from '../src/game/duel/duelVisualSteps.js';
import { DUEL_VISUAL_DEFAULTS } from '../src/config/duelVisualConfig.js';
import { useSafeDuelEffectStep } from '../src/components/battle/useSafeDuelEffectStep.js';
import {
  startRainbowGlowClock,
  stopRainbowGlowClock,
  getRainbowGlowTime,
} from '../src/utils/rainbowGlowClock.js';
import {
  IS_PUBLIC_PLAYTEST_BUILD,
  PUBLIC_BUILD_MARQUEE,
  filterMenuItemsForBuild,
} from '../src/config/buildProfile.js';
import { confirmQuitDesktopGame, shouldShowMainMenuQuit } from '../src/utils/electronApp.js';
import { computeLegalMaxFocus } from '../src/game/legalFocusSpend.js';

/** Quanto dura lo smontaggio della scelta esercito prima del VS. */
const DECK_LAUNCH_MS = 750;
/** Al click la carta vola nello slot e poi si apre verso la camera (place-rise ~60-80%): lì si posa. */
const CLICK_LAND_MS = CLICK_FLIGHT_MS + 500;

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

function phaseForEminenceGate(gate) {
  if (gate === REVEAL_GATES.PRE_AGENT) return 'selectAgent';
  if (gate === REVEAL_GATES.PRE_FIELD) return 'selectField';
  if (gate === REVEAL_GATES.GENERAL) return 'battle';
  return null;
}

function formatEminenceDealEffect(effect) {
  if (!effect?.primitive) return null;
  if (effect.primitive === EP.LOSE_HP) return `Perdi ${Math.abs(effect.amount || 0)} PV`;
  if (effect.primitive === EP.HEAL_HP) return `Cura ${Math.abs(effect.amount || 0)} PV`;
  if (effect.primitive === EP.CHANGE_PRESENCE) {
    const delta = effect.delta || 0;
    return delta >= 0 ? `+${delta} Presenza` : `${delta} Presenza`;
  }
  if (effect.primitive === EP.GRANT_TEMPORARY_FOCUS) {
    const who = effect.target === ET.OWN_AGENT || effect.target == null
      ? 'il tuo Agente'
      : 'l\'Agente';
    return `${who} riceve ${Math.abs(effect.amount || 0)} FC temporaneo`;
  }
  return null;
}

function formatEminenceDealEffects(effects) {
  return (effects || []).map(formatEminenceDealEffect).filter(Boolean).join('; ');
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
    openingPlayerFirst, setOpeningPlayerFirst,
    battleResult, setBattleResult,
    logs, setLogs,
    battleEvents, setBattleEvents,
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
    pendingDuelPhase,
    setPendingDuelPhase,
    duelDeckKeys,
    playerDeckVisual,
    enemyDeckVisual,
    eminenceMatchState,
    setEminenceMatchState,
  } = gameState;

  // Fase corrente sul documento: il registro scatti del pannello F9 la associa a ogni frame lento.
  useEffect(() => {
    document.documentElement.dataset.satzePhase = gamePhase || '';
    // segnaposto nel trace del registratore F10: ogni blocco porta la fase in cui è avvenuto
    try { performance.mark(`satze:${gamePhase || ''}`); } catch { /* ignore */ }
  }, [gamePhase]);

  const [emDraftId, setEmDraftId] = useState(null);
  const [emDraftParams, setEmDraftParams] = useState(null);
  const [eminenceNotices, setEminenceNotices] = useState([]);
  const [pendingEminencePhase, setPendingEminencePhase] = useState(null);
  const [pendingEminenceDeals, setPendingEminenceDeals] = useState([]);
  const campaignAssetsSlotRef = useRef(null);
  const [campaignEntryRun,setCampaignEntryRun] = useState(null);
  const [campaignActionError,setCampaignActionError] = useState('');
  const setupAnnounceShownRef = useRef(false);
  const eminenceSetupSceneRef = useRef(null);
  const playerZoneKeptRef = useRef(false);
  const enemyZoneKeptRef = useRef(false);
  const eminenceChoiceFlushedRoundRef = useRef(null);
  const outcomeNoticesShownKeyRef = useRef(null);
  const [peekCampo, setPeekCampo] = useState(false);
  const [peekEminence, setPeekEminence] = useState(false);
  const [focusedMark, setFocusedMark] = useState(null);
  const [announceHeldId, setAnnounceHeldId] = useState(null);
  const [activeSparkNoticeId, setActiveSparkNoticeId] = useState(null);
  const [announcePointerGuard, setAnnouncePointerGuard] = useState(false);
  const announceGuardTimerRef = useRef(null);
  const noticeSparkRef = useRef(new Set());
  const eminenceNoticesRef = useRef(eminenceNotices);
  const sparkRunnerBusyRef = useRef(false);
  const announceWaitAbortRef = useRef(null);
  const announceSkipAheadRef = useRef(false);
  const awaitingRevealParamsRef = useRef(false);
  const pendingDuelAfterRevealRef = useRef(false);
  const revealHpCommittedRef = useRef({ player: 0, enemy: 0 });
  // Eminenze online (eminenceOnline.js): messaggi dell'altro giocatore in attesa di essere
  // applicati, Affari proposti da noi che aspettano la sua risposta, risposte arrivate in anticipo.
  const [remoteEminenceQueue, setRemoteEminenceQueue] = useState([]);
  const remoteEminenceDealsRef = useRef([]);
  const [remoteEminenceDealsWaiting, setRemoteEminenceDealsWaiting] = useState(0);
  const earlyEminenceDealResponsesRef = useRef([]);
  /** Ultima scelta ricevuta dall'altro giocatore per ogni round: serve a ripararla se va persa. */
  const remoteChoiceByRoundRef = useRef(new Map());
  const openedEminenceGatesRef = useRef(new Set());
  const agentsLockedThisRoundRef = useRef(false);

  /**
   * Apertura del round Eminenza.
   *
   * Vive in un effetto e non dentro l'avanzamento di round perché la sostituzione del Campo
   * ha bisogno di `conqueredFields` aggiornato, che nello stesso batch è ancora quello del
   * round precedente. È di layout perché il tabellone non deve mostrare per un frame il Campo
   * che sta per essere sostituito.
   *
   * Non apre durante lo shuffle: la scelta Eminenza è il primo passo del round a carte in
   * mano, dopo la consegna. Sigillarla prima del deal saltava la fase.
   */
  useLayoutEffect(() => {
    if (gamePhase === 'shuffleDeal' || gamePhase === 'duelLoading') return;
    if (animations.showFinalRoundAnimation) return;
    // Apertura round Eminenza solo a carte già in mano (dopo lo shuffle / deal).
    if (!playerHand?.length || !enemyHand?.length) return;
    if (!needsEminenceRoundOpen(eminenceMatchState, roundNumber)) return;

    openedEminenceGatesRef.current = new Set();
    revealHpCommittedRef.current = { player: 0, enemy: 0 };
    agentsLockedThisRoundRef.current = false;
    setPendingEminenceDeals([]);
    const { matchState: opened, bundle, appliedEffects } = openEminenceRound(eminenceMatchState, {
      roundNumber,
      initiativeSide: isPlayerFirst ? 'player' : 'enemy',
    });
    let next = opened;
    // Vs IA la scelta avversaria è simultanea e segreta: la sigilliamo qui, senza UI.
    // Il giocatore sceglie dalla rail, anche se resta una sola abilità legale.
    if (aiDifficulty !== 'multiplayer') {
      next = selectConcordiaAbility(next, { hand: enemyHand, usedCards: enemyUsedCards, choosesSecond: isPlayerFirst, roundNumber });
      next = autoSelectFirstLegalAbility(next, 'enemy', {
        paramContext: {
          // Contesto dal punto di vista giocatore; autoSelect lo ruota per l'IA.
          ownUndeployedCardIds: (playerHand || [])
            .filter((card) => !(playerUsedCards || []).includes(card.id))
            .map((card) => card.id),
          enemyUndeployedCardIds: (enemyHand || [])
            .filter((card) => !(enemyUsedCards || []).includes(card.id))
            .map((card) => card.id),
          slotCount: (battlefields || []).length || 5,
          slots: (battlefields || []).map((field, index) => ({
            index,
            conquered: Boolean(conqueredFields?.[index]),
            name: field?.name,
            revealed: true,
          })),
        },
      });
    }
    setEminenceMatchState(next);
    setEminenceNotices(noticesFromRoundStart(next, appliedEffects));

    if (!bundle?.fieldOperations.length) return;
    // Generatore con seme ricavato dal tabellone: online i due client sostituiscono lo stesso Campo.
    const semeCampi = (battlefields || []).reduce((h, f, i) => ((h * 31) + (f?.id || 0) + i) >>> 0, (roundNumber * 7919) >>> 0);
    const replaced = applyFieldOperations(bundle.fieldOperations, {
      battlefields,
      conqueredFields,
      rng: mulberry32(semeCampi),
    });
    if (replaced.changes.length) setBattlefields(replaced.battlefields);
  }, [
    gamePhase,
    animations.showFinalRoundAnimation,
    eminenceMatchState,
    roundNumber,
    isPlayerFirst,
    aiDifficulty,
    playerHand,
    enemyHand,
    playerUsedCards,
    enemyUsedCards,
    battlefields,
    conqueredFields,
    setEminenceMatchState,
    setBattlefields,
  ]);

  const enemyUndeployedCardIds = useMemo(
    () => enemyHandIdsLeftToRight(enemyHand, enemyUsedCards),
    [enemyHand, enemyUsedCards],
  );
  const playerUndeployedCardIds = useMemo(
    () => (playerHand || []).filter((card) => !playerUsedCards.includes(card.id)).map((card) => card.id),
    [playerHand, playerUsedCards],
  );
  const slotCurseCounts = useMemo(
    () => mergeSlotCurseCounts(
      eminenceMatchState?.player?.persistent?.slotCurses,
      eminenceMatchState?.enemy?.persistent?.slotCurses,
    ),
    [eminenceMatchState?.player?.persistent?.slotCurses, eminenceMatchState?.enemy?.persistent?.slotCurses],
  );
  const eminenceChoiceView = useMemo(
    () => buildEminenceChoiceView(eminenceMatchState, 'player', {
      enemyUndeployedCardIds,
      ownUndeployedCardIds: playerUndeployedCardIds,
      confirmedAgents: [
        selectedAgent ? { id: selectedAgent.id, side: 'player', label: selectedAgent.name } : null,
        enemyAgent ? { id: enemyAgent.id, side: 'enemy', label: enemyAgent.name } : null,
      ].filter(Boolean),
      slotCount: battlefields.length,
      slots: battlefields.map((field, index) => ({
        index,
        name: field?.name ?? null,
        revealed: index < revealedFields,
        conquered: index in conqueredFields,
        cursed: Boolean(slotCurseCounts[index] || slotCurseCounts[String(index)]),
      })),
    }),
    [
      eminenceMatchState,
      enemyUndeployedCardIds,
      playerUndeployedCardIds,
      selectedAgent,
      enemyAgent,
      battlefields,
      revealedFields,
      conqueredFields,
      slotCurseCounts,
    ],
  );
  const playerSlotKeys = useMemo(
    () => curseSlotKeys(eminenceMatchState?.player?.persistent?.slotCurses),
    [eminenceMatchState?.player?.persistent?.slotCurses],
  );
  const enemySlotKeys = useMemo(
    () => curseSlotKeys(eminenceMatchState?.enemy?.persistent?.slotCurses),
    [eminenceMatchState?.enemy?.persistent?.slotCurses],
  );
  const slotCurseAccent = ARMY_COLORS.Khemet?.accent || '#26c4e8';
  const pendingCurseSlot = emDraftParams?.slot != null
    ? Number(emDraftParams.slot)
    : eminenceMatchState?.player?.selectedParams?.slot != null
      ? Number(eminenceMatchState.player.selectedParams.slot)
      : null;
  const slotIsCursed = (idx) => Boolean(
    idx != null
    && (
      slotCurseCounts[idx]
      || slotCurseCounts[String(idx)]
      || pendingCurseSlot === Number(idx)
    ),
  );
  const r5Cinematic = Boolean(animations.showFinalRoundAnimation);
  const awaitingEminenceChoice =
    !r5Cinematic
    && isAwaitingEminenceChoice(eminenceChoiceView)
    && (gamePhase === 'selectField' || gamePhase === 'selectAgent');
  const awaitingRevealParams = !r5Cinematic && isAwaitingRevealParams(eminenceChoiceView);
  awaitingRevealParamsRef.current = awaitingRevealParams;
  const eminenceAnnounceHold = eminenceNotices.length > 0;
  const holdForConfirmedAgentPick = Boolean(
    awaitingRevealParams && selectedAgent && enemyAgent && !eminenceAnnounceHold,
  );
  const confirmedPickAbility = holdForConfirmedAgentPick
    ? eminenceChoiceView.self?.options?.find(
      (option) => option.id === eminenceChoiceView.self.selectedAbilityId,
    )
    : null;
  const preyFlight = useEminencePreyFlight({
    playerPreyIds: eminenceChoiceView.self?.persistent?.preyCardIds,
    enemyPreyIds: eminenceChoiceView.opponent?.persistent?.preyCardIds,
    playerFragmentIds: eminenceChoiceView.self?.persistent?.fragmentCardIds,
    enemyFragmentIds: eminenceChoiceView.opponent?.persistent?.fragmentCardIds,
    playerSlotKeys,
    enemySlotKeys,
    playerAccent: ARMY_COLORS[eminenceChoiceView.self?.eminence?.army]?.accent || '#c9e238',
    enemyAccent: ARMY_COLORS[eminenceChoiceView.opponent?.eminence?.army]?.accent || '#c9e238',
    waitForNotice: eminenceAnnounceHold && eminenceNotices.some((notice) => notice.kind !== 'setup'),
    resetKey: eminenceMatchState?.roundOpenedAt ?? `off-${roundNumber}`,
  });
  // Titoli in rune: restano rune durante la smazzata e si decifrano con le carte consegnate.
  const [dealProgress, setDealProgress] = useState(0);
  useEffect(() => {
    if (gamePhase === 'duelLoading') setDealProgress(0);
  }, [gamePhase]);
  useEffect(() => {
    setRuneDecodeProgress(
      gamePhase === 'duelLoading' ? 0 : gamePhase === 'shuffleDeal' ? (shuffleDealSetup ? dealProgress : 0) : 1
    );
  }, [gamePhase, shuffleDealSetup, dealProgress]);
  useEffect(() => () => setRuneDecodeProgress(1), []);
  const handsDealt = Boolean(playerHand?.length && enemyHand?.length);
  const eminenceRoundPending =
    gamePhase !== 'shuffleDeal'
    && gamePhase !== 'duelLoading'
    && handsDealt
    && isEminenceSubsystemEnabled(eminenceMatchState)
    && needsEminenceRoundOpen(eminenceMatchState, roundNumber);
  const eminenceSetupPending =
    gamePhase !== 'shuffleDeal'
    && gamePhase !== 'duelLoading'
    && handsDealt
    && Boolean(eminenceChoiceView.setupPending);
  const eminenceBlocksMatch = shouldHoldDuelForEminence({
    awaitingChoice: awaitingEminenceChoice,
    announceHold: eminenceAnnounceHold,
    cinematic: r5Cinematic,
    roundPending: eminenceRoundPending,
    setupPending: eminenceSetupPending,
    markFlightHold: preyFlight.busy,
    awaitingRevealParams,
  });
  const playerEminenceNotice = eminenceNotices.find((notice) => notice.side === 'player') || null;
  const enemyEminenceNotice = eminenceNotices.find((notice) => notice.side === 'enemy') || null;
  const sparkSequenceActive = activeSparkNoticeId != null;
  const displayPlayerNotice = sparkSequenceActive
    ? (playerEminenceNotice?.id === activeSparkNoticeId ? playerEminenceNotice : null)
    : playerEminenceNotice;
  const displayEnemyNotice = sparkSequenceActive
    ? (enemyEminenceNotice?.id === activeSparkNoticeId ? enemyEminenceNotice : null)
    : enemyEminenceNotice;
  // Avviso → Presenza: il contatore sulla carta cambia quando arrivano le scintille dell'avviso
  const presenceLink = useEminencePresenceLink({
    notices: eminenceNotices,
    shown: [displayPlayerNotice, displayEnemyNotice],
    live: { player: eminenceChoiceView.self?.presence ?? 0, enemy: eminenceChoiceView.opponent?.presence ?? 0 },
  });
  const eminenceInspectable = !r5Cinematic && isEminenceTableInspectable(eminenceChoiceView, gamePhase);
  const forcedEminenceView =
    !r5Cinematic
    && (
      eminenceAnnounceHold
      || preyFlight.busy
      || shouldShowEminenceLayer(eminenceChoiceView, { gamePhase })
    );
  const showEminenceLayer = resolveEminenceChromeVisible({
    forced: forcedEminenceView,
    peekCampo: eminenceAnnounceHold ? false : peekCampo,
    peekEminence,
    inspectable: eminenceInspectable,
  });
  const revealEnemyHandForPrey = shouldRevealEnemyHandForEminenceChoice(eminenceChoiceView, {
    announcing: eminenceAnnounceHold,
    draftId: emDraftId,
  }) || (preyFlight.busy && preyFlight.activeKind === 'prey');
  const revealBoardForSlot = shouldRevealBoardForEminenceChoice(eminenceChoiceView, {
    announcing: eminenceAnnounceHold,
    draftId: emDraftId,
  }) || (preyFlight.busy && preyFlight.activeKind === 'slot');
  if (eminenceChoiceView.self?.setup?.pending) {
    eminenceSetupSceneRef.current = eminenceChoiceView.self.setup;
  } else if (!preyFlight.busy) {
    eminenceSetupSceneRef.current = null;
  }
  const playerSetupScene = eminenceChoiceView.self?.setup?.pending
    ? eminenceChoiceView.self.setup
    : (preyFlight.busy ? eminenceSetupSceneRef.current : null);
  const holdSetupScene = Boolean(playerSetupScene && preyFlight.busy);
  const showPlayerEminenceZone = shouldShowEminenceSideZone({
    layerVisible: showEminenceLayer && Boolean(eminenceChoiceView.self?.eminence),
    announcing: eminenceAnnounceHold,
    hasNotice: Boolean(displayPlayerNotice),
    setupPending: eminenceSetupPending,
    isSetupActor: Boolean(eminenceChoiceView.self?.setup?.pending) || holdSetupScene,
    markFlightHold: holdSetupScene,
  });
  const showEnemyEminenceZone = shouldShowEminenceSideZone({
    layerVisible: showEminenceLayer && Boolean(eminenceChoiceView.opponent?.eminence),
    announcing: eminenceAnnounceHold,
    hasNotice: Boolean(displayEnemyNotice),
    setupPending: eminenceSetupPending,
    isSetupActor: false,
    concealForEnemyHandRead: revealEnemyHandForPrey,
    markFlightHold: holdSetupScene,
  });
  if (showPlayerEminenceZone) playerZoneKeptRef.current = true;
  if (showEnemyEminenceZone) enemyZoneKeptRef.current = true;
  eminenceNoticesRef.current = eminenceNotices;

  const abortAnnounceWait = useCallback(() => {
    const abort = announceWaitAbortRef.current;
    announceWaitAbortRef.current = null;
    if (abort) abort();
  }, []);

  const waitAnnounceMs = useCallback((ms) => new Promise((resolve) => {
    if (ms <= 0) {
      resolve();
      return;
    }
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      if (announceWaitAbortRef.current === finish) announceWaitAbortRef.current = null;
      resolve();
    };
    const timer = window.setTimeout(finish, ms);
    announceWaitAbortRef.current = () => {
      window.clearTimeout(timer);
      finish();
    };
  }), []);

  const runNoticeSparkQueue = useCallback(async () => {
    if (sparkRunnerBusyRef.current) return;
    sparkRunnerBusyRef.current = true;

    try {
      while (true) {
        const next = eminenceNoticesRef.current.find(
          (notice) => notice.kind !== 'setup' && !noticeSparkRef.current.has(notice.id),
        );
        if (!next) break;

        noticeSparkRef.current.add(next.id);
        announceSkipAheadRef.current = false;
        setActiveSparkNoticeId(next.id);

        const cancelNoticeAudio = playNoticeAudioPreview(resolveNoticeCinematics(next));

        await waitAnnounceMs(getEminenceAnnounceHoldMs());
        cancelNoticeAudio();

        const skipped = announceSkipAheadRef.current;
        announceSkipAheadRef.current = false;
        setAnnounceHeldId((id) => (id === next.id ? null : id));
        setEminenceNotices((prev) => {
          const filtered = prev.filter((notice) => notice.id !== next.id);
          eminenceNoticesRef.current = filtered;
          return filtered;
        });
        setActiveSparkNoticeId(null);

        const more = eminenceNoticesRef.current.find(
          (notice) => notice.kind !== 'setup' && !noticeSparkRef.current.has(notice.id),
        );
        if (!more) break;

        if (!skipped) {
          await waitAnnounceMs(getEminenceSparkNoticeGapMs());
        }
      }
    } finally {
      sparkRunnerBusyRef.current = false;
      setActiveSparkNoticeId(null);
      const pending = eminenceNoticesRef.current.some(
        (notice) => notice.kind !== 'setup' && !noticeSparkRef.current.has(notice.id),
      );
      if (pending) {
        window.setTimeout(() => runNoticeSparkQueue(), 0);
      }
    }
  }, [waitAnnounceMs]);

  useEffect(() => {
    const hasPending = eminenceNotices.some(
      (notice) => notice.kind !== 'setup' && !noticeSparkRef.current.has(notice.id),
    );
    if (!hasPending) return undefined;
    runNoticeSparkQueue();
    return undefined;
  }, [eminenceNotices, runNoticeSparkQueue]);
  const slotShowsCurse = (idx) => {
    const persisted = Boolean(slotCurseCounts[idx] || slotCurseCounts[String(idx)]);
    if (persisted && !preyFlight.visibleSlotKeys.includes(Number(idx))) return false;
    return slotIsCursed(idx);
  };

  useEffect(() => {
    setEmDraftId(null);
    setEmDraftParams(null);
  }, [roundNumber, eminenceMatchState?.player?.selectedAbilityId]);

  useEffect(() => {
    setEmDraftParams(null);
  }, [emDraftId]);

  // Bozza slot/preda residua dopo confirm/reveal non deve più colorare il tabellone.
  useEffect(() => {
    if (awaitingEminenceChoice || awaitingRevealParams || eminenceChoiceView.self?.setup?.pending) {
      return;
    }
    if (emDraftParams != null) setEmDraftParams(null);
    if (emDraftId != null) setEmDraftId(null);
  }, [
    awaitingEminenceChoice,
    awaitingRevealParams,
    eminenceChoiceView.self?.setup?.pending,
    emDraftParams,
    emDraftId,
  ]);

  useEffect(() => {
    setPeekCampo(false);
    setPeekEminence(false);
    setFocusedMark(null);
    noticeSparkRef.current = new Set();
    setActiveSparkNoticeId(null);
  }, [roundNumber]);

  useEffect(() => {
    if (forcedEminenceView) setPeekCampo(false);
  }, [forcedEminenceView]);

  const confirmEminenceAbility = useCallback((abilityId, params = null) => {
    const online = aiDifficulty === 'multiplayer' && multiplayerSession?.roomCode;
    // Online la scelta, una volta inviata, non si cambia: l'altro client potrebbe averla già
    // usata per aprire un gate. Restano ammessi i params della stessa abilità (reveal).
    const giaScelta = eminenceMatchState?.player?.selectedAbilityId;
    if (online && giaScelta && giaScelta !== abilityId) return;
    playGame(GAME_SOUND.LOCK_IN);
    const stamped = stampComposeParams(params);
    if (stamped?.cardId != null && !stamped.targetSide) {
      if (selectedAgent?.id === stamped.cardId) stamped.targetSide = 'player';
      else if (enemyAgent?.id === stamped.cardId) stamped.targetSide = 'enemy';
    }
    if (online) {
      // Si invia solo una scelta che qui è valida: altrimenti i due client divergerebbero.
      const prova = eminenceMatchState?.player?.selectedAbilityId === abilityId
        ? setEminenceAbilityParams(eminenceMatchState, 'player', stamped)
        : selectEminenceAbility(eminenceMatchState, 'player', abilityId, stamped);
      if (!prova.ok) {
        console.warn('[eminenze online] scelta non valida, non inviata:', prova.reason, abilityId);
        return;
      }
      if (import.meta.env.DEV) console.info('[eminenze online] invio scelta', { round: eminenceMatchState?.roundNumber, roundGioco: roundNumber, aperto: eminenceMatchState?.roundOpenedAt, abilityId });
      getMultiplayerManager().sendRelay(
        multiplayerSession.roomCode,
        eminenceChoiceMessage(eminenceMatchState?.roundNumber ?? roundNumber, abilityId, stamped ?? null),
      );
    }
    setEminenceMatchState((prev) => {
      if (prev?.player?.selectedAbilityId === abilityId && !prev.player.revealedAbilityId) {
        const updated = setEminenceAbilityParams(prev, 'player', stamped);
        return updated.ok ? updated.matchState : prev;
      }
      const attempt = selectEminenceAbility(prev, 'player', abilityId, stamped);
      return attempt.ok ? attempt.matchState : prev;
    });
  }, [setEminenceMatchState, selectedAgent, enemyAgent, aiDifficulty, multiplayerSession?.roomCode, eminenceMatchState, roundNumber]);

  const confirmEminenceSetup = useCallback((params) => {
    playGame(GAME_SOUND.LOCK_IN);
    if (aiDifficulty === 'multiplayer' && multiplayerSession?.roomCode) {
      getMultiplayerManager().sendRelay(multiplayerSession.roomCode, eminenceSetupMessage(params));
    }
    setEminenceMatchState((prev) => {
      const attempt = commitEminenceSetupChoice(prev, 'player', params);
      return attempt.ok ? attempt.matchState : prev;
    });
  }, [setEminenceMatchState, aiDifficulty, multiplayerSession?.roomCode]);

  const focusMarkToken = useCallback((cardId, sourceSide, kind = 'prey') => {
    setFocusedMark((prev) => {
      if (prev?.id === cardId && prev.source === sourceSide && prev.kind === kind) return null;
      return { id: cardId, source: sourceSide, kind };
    });
  }, []);

  const highlightIdForHand = useCallback((handSide) => {
    if (!focusedMark?.id) return null;
    if (focusedMark.kind === 'fragment') {
      return focusedMark.source === handSide ? focusedMark.id : null;
    }
    return focusedMark.source !== handSide ? focusedMark.id : null;
  }, [focusedMark]);

  useLayoutEffect(() => {
    if (gamePhase === 'shuffleDeal' || gamePhase === 'duelLoading') return;
    if (aiDifficulty === 'multiplayer') return;
    if (!isEminenceSubsystemEnabled(eminenceMatchState)) return;
    setEminenceMatchState((prev) => autoCommitEminenceSetup(prev, 'enemy', playerUndeployedCardIds));
  }, [
    gamePhase,
    aiDifficulty,
    eminenceMatchState,
    playerUndeployedCardIds,
    setEminenceMatchState,
  ]);

  useLayoutEffect(() => {
    if (gamePhase === 'shuffleDeal' || gamePhase === 'duelLoading') {
      setupAnnounceShownRef.current = false;
      playerZoneKeptRef.current = false;
      enemyZoneKeptRef.current = false;
      eminenceSetupSceneRef.current = null;
      noticeSparkRef.current = new Set();
      openedEminenceGatesRef.current = new Set();
      revealHpCommittedRef.current = { player: 0, enemy: 0 };
      agentsLockedThisRoundRef.current = false;
      // Evita che un avviso setup (es. La Fame) resti montato su loading/shuffle.
      setEminenceNotices((prev) => (prev.length ? [] : prev));
      return;
    }
    // Presentazione inizio Scontro solo dopo che entrambi hanno ricevuto gli Agenti.
    if (gamePhase !== 'selectField' && gamePhase !== 'selectAgent') return;
    if (!playerHand?.length || !enemyHand?.length) return;
    if (!eminenceChoiceView.setupPending) return;
    if (setupAnnounceShownRef.current) return;
    const notices = noticesFromSetupPending(eminenceMatchState);
    if (!notices.length) return;
    setupAnnounceShownRef.current = true;
    setEminenceNotices((prev) => {
      if (prev.some((notice) => notice.kind === 'setup')) return prev;
      return [...notices, ...prev];
    });
  }, [
    gamePhase,
    eminenceChoiceView.setupPending,
    eminenceMatchState,
    playerHand,
    enemyHand,
  ]);

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
  // Da spettatore (torneo) l'esito non è né vittoria né sconfitta del giocatore: niente sipario.
  const outcomeOverlayKind = useDuelOutcomeOverlay(gamePhase, gameResult?.spectate ? null : gameResult);
  /** Sigilli esito: fino a 2 armate del mazzo giocatore (doppia armata). */
  const playerArmySealSrcs = useMemo(() => {
    const armies = playerDeckVisual?.armies?.length
      ? playerDeckVisual.armies
      : [...new Set((playerHand || []).map((c) => c?.army).filter(Boolean))].slice(0, 2);
    return armies.map((army) => ARMY_ICONS[army]).filter(Boolean);
  }, [playerDeckVisual?.armies, playerHand]);

  const matchArmyBonuses = campaignDuelMod?.firstAct ? {...ARMY_BONUSES, 'Concordia di Caelion':{trigger:'staffetta',effects:[{effect:'power',value:1}],description:'Staffetta: +1 POT'}} : ARMY_BONUSES;
  const campaignPersistenceError = useFirstActPersistence(gameState);
  const campaignOutcomeError = useCampaignGameOutcome({ gamePhase, campaignLevel, gameResult, campaignSaveSlot, playerHP, enemyHP, campaignDuelMod });

  const setGamePhaseAnimated = useTransitionedSetGamePhase(setGamePhaseRaw, gamePhase);
  /** Cortina attorno a cambi dentro il flusso Partita locale (anteprima, ritorno alla Fase I). */
  const runCurtain = useCurtain();
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

  const armAnnouncePointerGuard = useCallback(() => {
    setAnnouncePointerGuard(true);
    if (announceGuardTimerRef.current) clearTimeout(announceGuardTimerRef.current);
    announceGuardTimerRef.current = window.setTimeout(() => {
      setAnnouncePointerGuard(false);
      announceGuardTimerRef.current = null;
    }, 350);
  }, []);

  useEffect(() => () => {
    if (announceGuardTimerRef.current) clearTimeout(announceGuardTimerRef.current);
  }, []);

  const dismissEminenceNotice = useCallback((id) => {
    armAnnouncePointerGuard();
    noticeSparkRef.current.add(id);
    announceSkipAheadRef.current = true;
    setAnnounceHeldId((held) => (held === id ? null : held));
    setEminenceNotices((prev) => {
      const filtered = prev.filter((notice) => notice.id !== id);
      eminenceNoticesRef.current = filtered;
      return filtered;
    });
    abortAnnounceWait();
  }, [armAnnouncePointerGuard, abortAnnounceWait]);

  const commitEminenceAdvance = useCallback((matchState, { announceDeployedMarks = false } = {}) => {
    if (!isEminenceSubsystemEnabled(matchState)) {
      return { gate: null, notices: [], blocked: null };
    }
    const agentsReady = Boolean(selectedAgent?.id && enemyAgent?.id);
    const nextGate = getNextGate(matchState.gateProgress);
    if (nextGate) {
      const gateKey = `${matchState.roundOpenedAt || 0}:${nextGate}`;
      if (openedEminenceGatesRef.current.has(gateKey)) {
        return { matchState, events: [], notices: [], gate: null, bundle: null, blocked: null };
      }
      openedEminenceGatesRef.current.add(gateKey);
    }
    const initiativeSide = isPlayerFirst ? 'player' : 'enemy';
    const eminenceParamContext = {
      ownUndeployedCardIds: playerUndeployedCardIds,
      enemyUndeployedCardIds: enemyUndeployedCardIds,
      confirmedAgents: agentsReady
        ? [
          { id: selectedAgent.id, side: 'player', label: selectedAgent.name },
          { id: enemyAgent.id, side: 'enemy', label: enemyAgent.name },
        ]
        : [],
      slotCount: (battlefields || []).length || 5,
      slots: (battlefields || []).map((field, index) => ({
        index,
        conquered: Boolean(conqueredFields?.[index]),
        name: field?.name,
        revealed: true,
      })),
    };
    const result = advanceToNextRevealGate(matchState, {
      initiativeSide,
      announceDeployedMarks,
      agentIdBySide: {
        player: selectedAgent?.id ?? null,
        enemy: enemyAgent?.id ?? null,
      },
      focusInvestedBySide: agentsReady
        ? { player: selectedFocus || 0, enemy: enemySelectedFocus || 0 }
        : null,
      leagueBySide: agentsReady
        ? { player: selectedAgent.league ?? 0, enemy: enemyAgent.league ?? 0 }
        : null,
      paramContext: eminenceParamContext,
      toxinBySide: { player: playerToxin, enemy: enemyToxin },
      remoteEnemy: aiDifficulty === 'multiplayer',
    });
    if (import.meta.env.DEV && aiDifficulty === 'multiplayer') {
      console.info('[eminenze online] gate', { gate: nextGate, round: roundNumber, blocked: result.blocked, rivelate: (result.events || []).filter((e) => e?.type === 'REVEAL').map((e) => `${e.side}:${e.abilityId}`) });
    }
    if (result.blocked) {
      // Gate non aperto (online: manca una scelta dell'altro giocatore). Va ritentato quando arriva.
      if (nextGate) openedEminenceGatesRef.current.delete(`${matchState.roundOpenedAt || 0}:${nextGate}`);
      eminenceChoiceFlushedRoundRef.current = null;
      return result;
    }

    let nextMatch = result.matchState;
    let notices = [...(result.notices || [])];
    const pending = result.bundle?.pendingDeals || [];
    let playerHp = readHpDelta(result.bundle, 'player');
    let enemyHp = readHpDelta(result.bundle, 'enemy');

    // Affari verso l'IA: risposta automatica (niente default silenzioso sul motore).
    // Online risponde l'altro giocatore: si aspetta il suo messaggio, salvo le scelte forzate.
    for (const deal of pending.filter((entry) => entry.recipientSide === 'enemy')) {
      let response;
      if (aiDifficulty !== 'multiplayer') response = autoResponseForPendingDeal(deal, nextMatch);
      else if (!dealNeedsRemoteResponse(deal, nextMatch)) response = forcedDealResponse(deal, nextMatch);
      else if (earlyEminenceDealResponsesRef.current.length) response = earlyEminenceDealResponsesRef.current.shift().response || {};
      else {
        remoteEminenceDealsRef.current.push(deal);
        continue;
      }
      const resolved = resolvePendingDeal(
        nextMatch,
        deal,
        response,
        { initiativeSide },
      );
      nextMatch = resolved.matchState;
      notices = [...notices, ...(resolved.notices || [])];
      playerHp += readHpDelta(resolved.bundle, 'player');
      enemyHp += readHpDelta(resolved.bundle, 'enemy');
    }

    // Affari verso il giocatore: una sola scelta legale Salasso → auto; altrimenti UI.
    const playerDeals = [];
    for (const deal of pending.filter((entry) => entry.recipientSide === 'player')) {
      if (deal.mode === 'CHOOSE_ONE') {
        const presence = nextMatch.player?.presence ?? 0;
        const legal = (deal.deals || []).filter((option) => (
          option.minPresence == null || presence >= Math.abs(option.minPresence)
        ));
        if (legal.length <= 1) {
          const resolved = resolvePendingDeal(
            nextMatch,
            deal,
            { dealChoice: (legal[0] || deal.deals?.[0])?.id ?? null, opponentPresence: presence },
            { initiativeSide },
          );
          nextMatch = resolved.matchState;
          notices = [...notices, ...(resolved.notices || [])];
          playerHp += readHpDelta(resolved.bundle, 'player');
          enemyHp += readHpDelta(resolved.bundle, 'enemy');
          continue;
        }
      }
      playerDeals.push(deal);
    }

    setEminenceMatchState(nextMatch);
    setPendingEminenceDeals(playerDeals);
    setRemoteEminenceDealsWaiting(remoteEminenceDealsRef.current.length);
    const waitingRemoteDeals = remoteEminenceDealsRef.current.length;
    if (playerHp || enemyHp) {
      if (playerHp) setPlayerHP((hp) => Math.max(0, hp + playerHp));
      if (enemyHp) setEnemyHP((hp) => Math.max(0, hp + enemyHp));
      revealHpCommittedRef.current = {
        player: (revealHpCommittedRef.current.player || 0) + playerHp,
        enemy: (revealHpCommittedRef.current.enemy || 0) + enemyHp,
      };
    }
    const phase = phaseForEminenceGate(result.gate);
    if (notices.length) {
      setEminenceNotices(notices);
      if (phase) setPendingEminencePhase(phase);
    } else if (phase && playerDeals.length === 0 && waitingRemoteDeals === 0) {
      setGamePhase(phase);
    } else if (phase) {
      // Affare in sospeso: memorizza la fase ma non avviare il Duello.
      setPendingEminencePhase(phase);
    }
    return { ...result, matchState: nextMatch, notices };
  }, [
    aiDifficulty,
    isPlayerFirst,
    selectedAgent,
    enemyAgent,
    selectedFocus,
    enemySelectedFocus,
    playerUndeployedCardIds,
    enemyUndeployedCardIds,
    battlefields,
    conqueredFields,
    playerToxin,
    enemyToxin,
    setEminenceMatchState,
    setPlayerHP,
    setEnemyHP,
    setGamePhase,
  ]);

  const confirmPendingEminenceDeal = useCallback((response) => {
    const deal = pendingEminenceDeals[0];
    if (!deal || !eminenceMatchState) return;
    if (aiDifficulty === 'multiplayer' && multiplayerSession?.roomCode) {
      getMultiplayerManager().sendRelay(multiplayerSession.roomCode, eminenceDealMessage(roundNumber, response));
    }
    const initiativeSide = isPlayerFirst ? 'player' : 'enemy';
    const resolved = resolvePendingDeal(eminenceMatchState, deal, response, { initiativeSide });
    setEminenceMatchState(resolved.matchState);
    const playerHp = readHpDelta(resolved.bundle, 'player');
    const enemyHp = readHpDelta(resolved.bundle, 'enemy');
    if (playerHp || enemyHp) {
      if (playerHp) setPlayerHP((hp) => Math.max(0, hp + playerHp));
      if (enemyHp) setEnemyHP((hp) => Math.max(0, hp + enemyHp));
      revealHpCommittedRef.current = {
        player: (revealHpCommittedRef.current.player || 0) + playerHp,
        enemy: (revealHpCommittedRef.current.enemy || 0) + enemyHp,
      };
    }
    if (resolved.notices?.length) {
      setEminenceNotices((prev) => [...prev, ...resolved.notices]);
    }
    setPendingEminenceDeals((prev) => prev.slice(1));
  }, [
    aiDifficulty,
    multiplayerSession?.roomCode,
    roundNumber,
    pendingEminenceDeals,
    eminenceMatchState,
    isPlayerFirst,
    setEminenceMatchState,
    setPlayerHP,
    setEnemyHP,
  ]);

  /**
   * Eminenze online: applica in ordine i messaggi dell'altro giocatore.
   * Una scelta di round aspetta che qui quel round sia aperto; una risposta a un Affare
   * risolve il primo Affare in attesa, oppure resta da parte finché l'Affare non nasce qui.
   */
  useEffect(() => {
    if (!remoteEminenceQueue.length || !eminenceMatchState) return;
    // Primo passaggio sullo stato di questo render: decide quali messaggi si applicano ora
    // (e a quali Affari), e raccoglie PV e annunci. Lo stato vero si aggiorna poi con un
    // updater funzionale che riapplica gli stessi passi sullo stato più recente: così una
    // scelta locale fatta nel frattempo non viene sovrascritta.
    let state = eminenceMatchState;
    const passi = [];
    let playerHp = 0;
    let enemyHp = 0;
    let notices = [];
    const rimasti = [];
    const initiativeSide = isPlayerFirst ? 'player' : 'enemy';
    for (let i = 0; i < remoteEminenceQueue.length; i++) {
      const msg = remoteEminenceQueue[i];
      if (msg.type === EMINENCE_ONLINE_MESSAGES.CHOICE) {
        const roundAperto = !needsEminenceRoundOpen(state, roundNumber) && state.roundNumber === roundNumber;
        if (msg.roundNumber > roundNumber || (msg.roundNumber === roundNumber && !roundAperto)) {
          rimasti.push(...remoteEminenceQueue.slice(i)); // round non ancora aperto qui: si riprova dopo
          break;
        }
        if (msg.roundNumber < roundNumber) {
          console.warn('[eminenze online] scelta remota scartata (round già chiuso):', msg.roundNumber, roundNumber);
          continue;
        }
        const r = applyRemoteChoice(state, msg);
        if (import.meta.env.DEV) console.info('[eminenze online] applico scelta remota', { msgRound: msg.roundNumber, roundGioco: roundNumber, aperto: state.roundOpenedAt, abilityId: msg.abilityId, ok: r.ok, reason: r.reason });
        if (r.ok) {
          state = r.matchState;
          passi.push({ msg });
          const prima = remoteChoiceByRoundRef.current.get(msg.roundNumber);
          // Si conserva l'ultima versione (con i params, se arrivano dopo la scelta).
          remoteChoiceByRoundRef.current.set(msg.roundNumber, prima && prima.abilityId === msg.abilityId && !msg.params ? prima : msg);
        }
        else console.warn('[eminenze online] scelta remota non applicata:', r.reason, msg);
      } else if (msg.type === EMINENCE_ONLINE_MESSAGES.SETUP) {
        if (!isEminenceSetupPending(state, 'enemy')) continue; // già registrata (o non prevista)
        const r = applyRemoteSetup(state, msg);
        if (r.ok) { state = r.matchState; passi.push({ msg }); }
      } else if (msg.type === EMINENCE_ONLINE_MESSAGES.DEAL) {
        const deal = remoteEminenceDealsRef.current.shift();
        if (!deal) { earlyEminenceDealResponsesRef.current.push(msg); continue; }
        const resolved = resolvePendingDeal(state, deal, msg.response || {}, { initiativeSide });
        state = resolved.matchState;
        passi.push({ msg, deal });
        playerHp += readHpDelta(resolved.bundle, 'player');
        enemyHp += readHpDelta(resolved.bundle, 'enemy');
        notices = [...notices, ...(resolved.notices || [])];
      }
    }
    // Aggiornare la coda solo se è cambiata: riscriverla identica rilancerebbe l'effetto all'infinito.
    if (rimasti.length !== remoteEminenceQueue.length) setRemoteEminenceQueue(rimasti);
    setRemoteEminenceDealsWaiting(remoteEminenceDealsRef.current.length);
    if (!passi.length) return;
    setEminenceMatchState((prev) => {
      let st = prev;
      for (const { msg, deal } of passi) {
        if (msg.type === EMINENCE_ONLINE_MESSAGES.CHOICE) {
          const r = applyRemoteChoice(st, msg);
          if (r.ok) st = r.matchState;
        } else if (msg.type === EMINENCE_ONLINE_MESSAGES.SETUP) {
          const r = applyRemoteSetup(st, msg);
          if (r.ok) st = r.matchState;
        } else if (deal) {
          st = resolvePendingDeal(st, deal, msg.response || {}, { initiativeSide }).matchState;
        }
      }
      return st;
    });
    if (playerHp || enemyHp) {
      if (playerHp) setPlayerHP((hp) => Math.max(0, hp + playerHp));
      if (enemyHp) setEnemyHP((hp) => Math.max(0, hp + enemyHp));
      revealHpCommittedRef.current = {
        player: (revealHpCommittedRef.current.player || 0) + playerHp,
        enemy: (revealHpCommittedRef.current.enemy || 0) + enemyHp,
      };
    }
    if (notices.length) setEminenceNotices((prev) => [...prev, ...notices]);
  }, [remoteEminenceQueue, eminenceMatchState, roundNumber, isPlayerFirst, setEminenceMatchState, setPlayerHP, setEnemyHP]);

  // Autoriparazione: se una scelta dell'altro giocatore già applicata sparisce dallo stato
  // (riscritto altrove da una copia precedente), la si riapplica. Senza, il round resterebbe
  // in attesa di una scelta che l'altro client considera già fatta.
  useEffect(() => {
    if (aiDifficulty !== 'multiplayer' || !eminenceMatchState?.enemy) return;
    if (needsEminenceRoundOpen(eminenceMatchState, roundNumber)) return;
    const msg = remoteChoiceByRoundRef.current.get(roundNumber);
    const e = eminenceMatchState.enemy;
    if (!msg || e.revealedAbilityId) return;
    const persa = !e.selectedAbilityId || (msg.params && !e.selectedParams);
    if (!persa) return;
    console.warn('[eminenze online] scelta remota persa, la riapplico', { round: roundNumber, abilityId: msg.abilityId });
    setEminenceMatchState((prev) => {
      const r = applyRemoteChoice(prev, msg);
      return r.ok ? r.matchState : prev;
    });
  }, [aiDifficulty, eminenceMatchState, roundNumber, setEminenceMatchState]);

  // Nuova partita online: niente residui della precedente.
  useEffect(() => {
    if (roundNumber !== 1 || gamePhase !== 'shuffleDeal') return;
    remoteChoiceByRoundRef.current = new Map();
    remoteEminenceDealsRef.current = [];
    earlyEminenceDealResponsesRef.current = [];
    setRemoteEminenceDealsWaiting(0);
  }, [roundNumber, gamePhase]);

  const afterFieldLocked = useCallback(() => {
    if (!isEminenceSubsystemEnabled(eminenceMatchState)) {
      setGamePhase('selectAgent');
      return;
    }
    commitEminenceAdvance(eminenceMatchState);
  }, [eminenceMatchState, commitEminenceAdvance, setGamePhase]);

  const afterAgentsLocked = useCallback(() => {
    if (awaitingRevealParamsRef.current) {
      pendingDuelAfterRevealRef.current = true;
      return;
    }
    pendingDuelAfterRevealRef.current = false;
    agentsLockedThisRoundRef.current = true;
    if (!isEminenceSubsystemEnabled(eminenceMatchState)) {
      setGamePhase('battle');
      return;
    }
    const nextGate = getNextGate(eminenceMatchState.gateProgress);
    if (!nextGate) {
      setGamePhase('battle');
      return;
    }
    commitEminenceAdvance(eminenceMatchState, { announceDeployedMarks: true });
  }, [eminenceMatchState, commitEminenceAdvance, setGamePhase]);

  useEffect(() => {
    if (!pendingDuelAfterRevealRef.current) return;
    if (awaitingRevealParams) return;
    pendingDuelAfterRevealRef.current = false;
    afterAgentsLocked();
  }, [awaitingRevealParams, afterAgentsLocked]);

  useLayoutEffect(() => {
    if (eminenceNotices.length > 0) return;
    if (pendingEminenceDeals.length > 0) return;
    if (remoteEminenceDealsWaiting > 0) return;
    if (!pendingEminencePhase) return;
    const nextPhase = pendingEminencePhase;
    setPendingEminencePhase(null);
    setGamePhase(nextPhase);
  }, [eminenceNotices, pendingEminenceDeals, remoteEminenceDealsWaiting, pendingEminencePhase, setGamePhase]);

  useLayoutEffect(() => {
    if (gamePhase === 'shuffleDeal' || gamePhase === 'duelLoading') return;
    if (r5Cinematic) return;
    if (eminenceAnnounceHold) return;
    if (awaitingEminenceChoice) return;
    // PRE_FIELD con params AT_REVEAL (es. Maledizione su slot): non rivelare
    // finché il giocatore non ha fissato il bersaglio, altrimenti il tabellone
    // resta agganciato al targeting e il Campo non si può scegliere.
    if (awaitingRevealParams) return;
    if (!isEminenceSubsystemEnabled(eminenceMatchState)) return;
    if (!areSelectionsComplete(eminenceMatchState)) return;
    if (eminenceChoiceFlushedRoundRef.current === roundNumber) return;
    const nextGate = getNextGate(eminenceMatchState.gateProgress);
    if (nextGate !== REVEAL_GATES.PRE_AGENT && nextGate !== REVEAL_GATES.PRE_FIELD) return;
    eminenceChoiceFlushedRoundRef.current = roundNumber;
    commitEminenceAdvance(eminenceMatchState);
  }, [
    gamePhase,
    r5Cinematic,
    eminenceAnnounceHold,
    awaitingEminenceChoice,
    awaitingRevealParams,
    eminenceMatchState,
    roundNumber,
    commitEminenceAdvance,
  ]);

  // Online la scelta dell'avversario può arrivare DOPO che il Campo è stato fissato: in quel
  // momento il gate era bloccato e nessuno lo ritenterebbe. Appena le scelte sono complete,
  // si riprova ad aprire il gate pre-Agente/pre-Campo (la dedup per gate evita doppioni).
  useLayoutEffect(() => {
    if (aiDifficulty !== 'multiplayer') return;
    if (gamePhase !== 'selectField' || currentFieldIndex == null) return;
    if (r5Cinematic || eminenceAnnounceHold || awaitingEminenceChoice || awaitingRevealParams) return;
    if (pendingEminenceDeals.length > 0 || remoteEminenceDealsWaiting > 0) return;
    if (!isEminenceSubsystemEnabled(eminenceMatchState) || !areSelectionsComplete(eminenceMatchState)) return;
    const gate = getNextGate(eminenceMatchState.gateProgress);
    if (gate !== REVEAL_GATES.PRE_AGENT && gate !== REVEAL_GATES.PRE_FIELD) return;
    if (import.meta.env.DEV) console.info('[eminenze online] ritento il gate dopo il Campo', { gate, round: roundNumber });
    commitEminenceAdvance(eminenceMatchState);
  }, [
    aiDifficulty, gamePhase, currentFieldIndex, r5Cinematic, eminenceAnnounceHold, awaitingEminenceChoice,
    awaitingRevealParams, pendingEminenceDeals, remoteEminenceDealsWaiting, eminenceMatchState, roundNumber,
    commitEminenceAdvance,
  ]);

  useLayoutEffect(() => {
    if (!canAdvanceEminenceGeneralGate({
      agentsLocked: agentsLockedThisRoundRef.current,
      fieldIndex: currentFieldIndex,
    })) return;
    if (r5Cinematic) return;
    if (eminenceAnnounceHold) return;
    if (pendingEminenceDeals.length > 0) return;
    if (remoteEminenceDealsWaiting > 0) return;
    if (awaitingEminenceChoice || awaitingRevealParams) return;
    if (!selectedAgent || !enemyAgent) return;
    if (!isEminenceSubsystemEnabled(eminenceMatchState)) return;
    if (getNextGate(eminenceMatchState.gateProgress) !== REVEAL_GATES.GENERAL) return;
    commitEminenceAdvance(eminenceMatchState, { announceDeployedMarks: true });
  }, [
    r5Cinematic,
    eminenceAnnounceHold,
    pendingEminenceDeals,
    remoteEminenceDealsWaiting,
    awaitingEminenceChoice,
    awaitingRevealParams,
    selectedAgent,
    enemyAgent,
    currentFieldIndex,
    eminenceMatchState,
    commitEminenceAdvance,
  ]);

  useEffect(() => {
    if (!IS_PUBLIC_PLAYTEST_BUILD) return;
    if (gamePhase === 'playtestHistory') {
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

  // Ingresso galleria: le lame coprono lo schermo solo alla prima apertura della visita.
  const galleryPhaseRef = useRef(null);
  const galleryVisitRef = useRef(0);
  const galleryIntroSeenRef = useRef(0);
  if (galleryPhaseRef.current !== gamePhase) {
    if (gamePhase === 'gallery') galleryVisitRef.current += 1;
    galleryPhaseRef.current = gamePhase;
  }
  const playGalleryIntro = gamePhase === 'gallery'
    && galleryIntroSeenRef.current !== galleryVisitRef.current;
  useEffect(() => {
    if (gamePhase === 'gallery') galleryIntroSeenRef.current = galleryVisitRef.current;
  }, [gamePhase]);

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

  // Tab Agenti / Alternative: differisci la griglia pesante quando si passa da Campi
  useEffect(() => {
    if (gamePhase === 'gallery' && (galleryTab === 'agents' || galleryTab === 'alternative')) {
      setAgentsTabReady(false);
      const id = requestAnimationFrame(() => {
        requestAnimationFrame(() => setAgentsTabReady(true));
      });
      return () => cancelAnimationFrame(id);
    } else if (galleryTab === 'battlefields') {
      setAgentsTabReady(false);
    }
  }, [gamePhase, galleryTab]);
  
  // Menu: precarica l'arte delle carte (galleria / deck aprono più leggeri), ma con garbo:
  // due immagini alla volta, solo a gioco libero e mai a ridosso di tasti o mouse. Prima
  // partivano blocchi da 28 immagini full-res ogni ~0,5 s anche mentre si navigava il menù,
  // e il loro caricamento cadeva proprio sui tasti.
  useEffect(() => {
    if (gamePhase !== 'menu') return undefined;
    let cancelled = false;
    let cursor = 0;
    let idleId = 0;
    let lastInput = performance.now();
    const onInput = () => { lastInput = performance.now(); };
    window.addEventListener('keydown', onInput, true);
    window.addEventListener('pointermove', onInput, true);
    window.addEventListener('pointerdown', onInput, true);
    window.addEventListener('wheel', onInput, true);

    const QUIET_MS = 1500;
    const schedule = (delay) => {
      const run = () => {
        idleId =
          typeof requestIdleCallback === 'function'
            ? requestIdleCallback(pump)
            : setTimeout(pump, 120);
      };
      if (delay > 0) idleId = setTimeout(run, delay);
      else run();
    };
    const pump = (deadline) => {
      if (cancelled) return;
      const sinceInput = performance.now() - lastInput;
      if (sinceInput < QUIET_MS || (deadline && deadline.timeRemaining() < 8)) {
        schedule(Math.max(200, QUIET_MS - sinceInput));
        return;
      }
      const slice = ALL_AGENTS.slice(cursor, cursor + 2);
      cursor += 2;
      Promise.all(preloadCardImagesForAgents(slice, getCardSprite)).then(() => {
        if (!cancelled && cursor < ALL_AGENTS.length) schedule(0);
      });
    };

    schedule(1200);

    return () => {
      cancelled = true;
      clearTimeout(idleId);
      if (typeof cancelIdleCallback === 'function') cancelIdleCallback(idleId);
      window.removeEventListener('keydown', onInput, true);
      window.removeEventListener('pointermove', onInput, true);
      window.removeEventListener('pointerdown', onInput, true);
      window.removeEventListener('wheel', onInput, true);
    };
  }, [gamePhase]);

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
  /** Indice riga tabellone appena rivelata (animazione imp-row-reveal). */
  const [justRevealedFieldIdx, setJustRevealedFieldIdx] = useState(-1);
  const prevRevealedFieldsRef = useRef(null);
  
  // Stato per modal carta ingrandita nella galleria
  const [selectedCardForModal, setSelectedCardForModal] = useState(null);
  const [previewDeckData, setPreviewDeckData] = useState(null);
  /** Passaggio armata ⇄ esercito sullo stesso sfondo: { from: 'army'|'deck', army }. */
  const [armyDeckHandoff, setArmyDeckHandoff] = useState(null);
  const [showDifficultyPopup, setShowDifficultyPopup] = useState(false);
  const [pendingGameLaunch, setPendingGameLaunch] = useState(null);
  /** INIZIA premuto: la scelta esercito si smonta prima dell'avvio del duello. */
  const [deckLaunching, setDeckLaunching] = useState(false);
  /** Armata nemica scelta in Imposta la partita: il sorteggio nel VS gira sui suoi eserciti. */
  const [vsChosenEnemyArmy, setVsChosenEnemyArmy] = useState(null);
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
    rainbowTime: _unusedRainbowTime, setRainbowTime,
  } = animations;
  void _unusedRainbowTime;

  /** Round 5: tiene la vecchia condizione finché non parte il flip reveal. */
  const [victoryCondFx, setVictoryCondFx] = useState(/** @type {null | 'hold' | 'reveal'} */ (null));
  const r5VictoryTimersRef = useRef([]);

  const [duelVfxRev, setDuelVfxRev] = useState(0);
  useEffect(() => {
    const on = () => setDuelVfxRev((r) => r + 1);
    window.addEventListener(DUEL_VFX_CHANGED_EVENT, on);
    window.addEventListener(DISPLAY_SETTINGS_CHANGED_EVENT, on);
    return () => {
      window.removeEventListener(DUEL_VFX_CHANGED_EVENT, on);
      window.removeEventListener(DISPLAY_SETTINGS_CHANGED_EVENT, on);
    };
  }, []);
  const duelVfx = useMemo(
    () => scaleDuelVisualConfig(applyVfxQualityToDuelConfig(getDuelVisualConfig(), getVfxQualityProfile())),
    [duelVfxRev],
  );
  const vfxProfile = useMemo(() => getVfxQualityProfile(), [duelVfxRev]);
  const {
    showBodies: showDuelResultBodies,
    cinemaHideAgent,
  } = useClashFocusHandoff(
    gamePhase === 'result' && battleResult ? duelPhase : -1,
    Boolean(vfxProfile.clashVfxEnabled)
  );
  // PV a schermo nel risultato: scendono colpo per colpo (i PV veri cambiano su «Continua»)
  const duelLayoutBreathClass = useMemo(
    () => resolveDuelLayoutBreathClass(getDisplaySettings(), { isResult: gamePhase === 'result' }),
    [duelVfxRev, gamePhase],
  );

  const { visualEffectStep, advanceEffectStep } = useSafeDuelEffectStep(
    duelPhase,
    duelEffectStep,
    setDuelEffectStep
  );
  const duelHp = useDuelHpPresentation({ battleResult, gamePhase, duelPhase, duelEffectStep: visualEffectStep, playerHP, enemyHP, playerToxin, enemyToxin, duelVfx });
  const shownPlayerHP = duelHp.displayHP ? duelHp.displayHP.player : playerHP;
  const shownEnemyHP = duelHp.displayHP ? duelHp.displayHP.enemy : enemyHP;
  // FC aggiunte dagli effetti e Tossina: stessa regia dei PV nel risultato
  const shownPlayerFC = duelHp.displayFC ? duelHp.displayFC.player : playerFocus;
  const shownEnemyFC = duelHp.displayFC ? duelHp.displayFC.enemy : enemyFocus;
  const shownPlayerToxin = duelHp.displayToxin ? duelHp.displayToxin.player : playerToxin;
  const shownEnemyToxin = duelHp.displayToxin ? duelHp.displayToxin.enemy : enemyToxin;
  // Conta scenica delle FC: partenza e atterraggio delle monete, bagliore e Overdrive sulla carta
  const duelStamp = gamePhase === 'result' && battleResult
    ? [battleResult.playerAgent?.id, battleResult.enemyAgent?.id, battleResult.playerAssault, battleResult.enemyAssault, battleResult.finalPlayerHP, battleResult.finalEnemyHP].join('|')
    : null;
  const focusLaunch = useFocusLaunches({
    duelKey: duelStamp,
    duelPhase,
    playerCoins: playerFocusCoinsShown,
    enemyCoins: enemyFocusCoinsShown,
    playerTotal: battleResult?.playerFocusUsed || 0,
    enemyTotal: battleResult?.enemyFocusUsed || 0,
  });
  const overdriveAt = useMemo(
    () => ({ player: overdriveCoinThreshold(battleResult, 'player'), enemy: overdriveCoinThreshold(battleResult, 'enemy') }),
    [battleResult],
  );
  const duelOverdriveOn = (side) => Boolean(
    duelStamp && overdriveAt[side] != null && duelPhase >= 2 && focusLaunch.landed[side] >= overdriveAt[side]
  );
  // Overdrive: una volta per lato, quando atterra la moneta che lo fa scattare (non se si salta il duello)
  const playerOverdriveOn = duelOverdriveOn('player');
  const enemyOverdriveOn = duelOverdriveOn('enemy');
  const overdriveHeardRef = useRef({ player: false, enemy: false });
  useEffect(() => {
    const was = overdriveHeardRef.current;
    const fresh = (playerOverdriveOn && !was.player) || (enemyOverdriveOn && !was.enemy);
    if (fresh && duelPhase === 2) playGame(GAME_SOUND.DUEL_OVERDRIVE);
    overdriveHeardRef.current = { player: playerOverdriveOn, enemy: enemyOverdriveOn };
  }, [playerOverdriveOn, enemyOverdriveOn, duelPhase]);
  // Portale: esito del duello al centro quando partono i proiettili (e a Continua);
  // nella Chiusura (fase 5) resta il nome della sottofase
  const portalDuelEsito = useMemo(() => {
    if (!battleResult || gamePhase !== 'result' || !duelHp.started || duelPhase === 5) return null;
    const w = battleResult.winner;
    if (w !== 'player' && w !== 'enemy') return { title: 'Pareggio', desc: `VA ${battleResult.playerAssault}–${battleResult.enemyAssault}` };
    const l = w === 'player' ? 'enemy' : 'player';
    const wa = w === 'player' ? battleResult.playerAgent : battleResult.enemyAgent;
    const la = w === 'player' ? battleResult.enemyAgent : battleResult.playerAgent;
    const vaW = w === 'player' ? battleResult.playerAssault : battleResult.enemyAssault;
    const vaL = l === 'player' ? battleResult.playerAssault : battleResult.enemyAssault;
    const tie = vaW === vaL && wa?.league != null ? ` · Lega ${wa.league}` : '';
    return { title: `Vince ${String(wa?.name || '').split(',')[0]}`, desc: `VA ${vaW}–${vaL}${tie} · −${battleResult.damageDealt ?? 0} PV` };
  }, [battleResult, gamePhase, duelHp.started, duelPhase]);

  // Portale nel duello: tinto col colore di chi attiva il passo; all'Esito chi vince; neutro altrimenti
  const duelStepFxList = useMemo(() => (battleResult ? buildDuelStepFx(battleResult) : []), [battleResult]);
  const sideColor = (side) => (side === 'player' ? playerIdentityColor : side === 'enemy' ? enemyIdentityColor : null);
  let portalDuelTint = null;
  if (gamePhase === 'result' && battleResult) {
    if (portalDuelEsito) portalDuelTint = sideColor(battleResult.winner);
    else portalDuelTint = sideColor(currentStepFx(duelStepFxList, duelPhase, visualEffectStep)?.side);
  }

  // Portale ambra: tocca al giocatore scegliere (Affare proposto, abilità del Comando)
  const pendingDeal = !eminenceAnnounceHold ? pendingEminenceDeals[0] : null;
  const commandChoosing = gamePhase === 'selectField'
    && eminenceChoiceView?.self?.state === CHOICE_STATES.CHOOSING
    && Boolean(eminenceChoiceView?.self?.mustChoose);
  let portalDecision = null;
  if (pendingDeal) {
    const ownerEminenceId = eminenceMatchState?.[pendingDeal.ownerSide]?.eminenceId;
    const ability = ownerEminenceId ? getEminenceAbility(ownerEminenceId, pendingDeal.source) : null;
    const title = ability?.name || 'Affare';
    if (pendingDeal.mode === 'CHOOSE_ONE') {
      const presence = eminenceMatchState?.player?.presence ?? 0;
      const names = ['Primo', 'Secondo'];
      const opts = (pendingDeal.deals || []).slice(0, 2);
      portalDecision = {
        kicker: 'Affare',
        name: title,
        desc: 'Scegli uno dei due Affari',
        options: opts.map((option, i) => ({
          key: `deal-${option.id}`,
          label: names[i],
          variant: i === opts.length - 1 ? 'primary' : 'secondary',
          disabled: option.minPresence != null && presence < Math.abs(option.minPresence),
          onClick: () => confirmPendingEminenceDeal({ dealChoice: option.id, opponentPresence: presence }),
        })),
        note: opts.map((o, i) => `${names[i]}: ${formatEminenceDealEffects(o.effects) || o.id}`).join(' · '),
      };
    } else {
      portalDecision = {
        kicker: 'Affare',
        name: title,
        desc: formatEminenceDealEffects(pendingDeal.deal?.effects) || "Accetti l'Affare proposto?",
        options: [
          { key: 'deal-refuse', label: 'Rifiuta', variant: 'secondary', onClick: () => confirmPendingEminenceDeal({ dealAccepted: false, dealResponse: 'refuse' }) },
          { key: 'deal-accept', label: 'Accetta', variant: 'primary', waiting: true, onClick: () => confirmPendingEminenceDeal({ dealAccepted: true }) },
        ],
        note: "Se rifiuti, l'effetto si risolve come se l'avesse accettato chi l'ha proposto.",
      };
    }
  } else if (commandChoosing) {
    portalDecision = { kicker: 'Scelta', name: 'Comando', desc: "Abilità dell'Eminenza", note: "Scegli un'abilità dell'Eminenza e confermala" };
  }

  const duelHpColors = useMemo(() => ({ player: playerIdentityColor, enemy: enemyIdentityColor }), [playerIdentityColor, enemyIdentityColor]);
  const duelFocusGlow = (side) => {
    const total = side === 'player' ? battleResult?.playerFocusUsed : battleResult?.enemyFocusUsed;
    return total ? focusLaunch.landed[side] / total : 0;
  };

  // Hook per la logica di battaglia
  const { resolveBattle, presentPrecomputedBattle } = useBattle(gameState, animations, { revealHpCommittedRef });

  // Modalità a più posti (2v2, Re della collina): un controllore guida la scena del duello.
  // La scena gli espone le proprie azioni tramite multiSeatSceneRef (assegnato prima del render).
  const multiSeatSceneRef = useRef({});
  const multiSeat = useMultiSeatDuel({ gameState, sceneRef: multiSeatSceneRef });
  const isMultiSeat = multiSeat.isActive;
  /** Torneo: partita tra IA mostrata sul tavolo (turni già giocati dal motore, vedi startSpectate). */
  const [spectate, setSpectate] = useState(null);
  const spectateRef = useRef(null);
  spectateRef.current = spectate;
  const spectating = Boolean(spectate);
  const multiSeatActiveRef = useRef(false);
  // Anche da spettatore il tavolo è guidato da fuori: niente IA di base né input del giocatore.
  multiSeatActiveRef.current = isMultiSeat || spectating;
  const multiSeatDeployRef = useRef(false);
  multiSeatDeployRef.current = multiSeat.acceptsHumanDeploy;
  const multiSeatStageTimerRef = useRef(null);
  const [multiSeatLeftTab, setMultiSeatLeftTab] = useState('table');
  // Mano mostrata in ciascun triangolo (indice in multiSeat.handSeats): 0 = quella in gioco.
  const [multiSeatHandView, setMultiSeatHandView] = useState({ player: 0, enemy: 0 });
  /**
   * Multiplayer, dal secondo scontro del turno: come entra l'Agente di ogni lato ('advance' dalla
   * coda sfocata, 'stay' resta in campo, 'swap' arriva dall'altro lato; null = ingresso normale).
   */
  const [multiSeatEntry, setMultiSeatEntry] = useState({ player: null, enemy: null });
  /** Lati il cui Agente esce di scena dopo «Prossimo duello». */
  const [multiSeatLeaving, setMultiSeatLeaving] = useState(null);
  /** Rettangoli delle carte (in campo e prime in coda) al clic di «Prossimo duello». */
  const multiSeatRectsRef = useRef(null);
  // Lista dei Campi scorrevole (più di 5 Campi): quanti ne restano sotto, per l'indicatore.
  const fieldsScrollRef = useRef(null);
  const [fieldsBelow, setFieldsBelow] = useState(0);
  // Cambio di mano nei triangoli: animazione via Web Animations sui figli del triangolo, così
  // non sostituisce le animazioni CSS d'ingresso/respiro/uscita delle mani (riprendono da sole).
  const playerHandWrapRef = useRef(null);
  const enemyHandWrapRef = useRef(null);
  const prevHandViewRef = useRef({ player: 0, enemy: 0 });
  useEffect(() => {
    const prev = prevHandViewRef.current;
    prevHandViewRef.current = multiSeatHandView;
    const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    const play = (el, origin) => {
      if (!el) return;
      for (const child of Array.from(el.children)) {
        child.animate?.([
          { opacity: 0, transform: 'scale(0.82)', filter: 'brightness(1.9) saturate(1.4)', transformOrigin: origin },
          { opacity: 1, filter: 'brightness(1.3) saturate(1.2)', offset: 0.55, transformOrigin: origin },
          { opacity: 1, transform: 'none', filter: 'none', transformOrigin: origin },
        ], { duration: 600, easing: 'cubic-bezier(0.2, 0.9, 0.3, 1.1)' });
      }
    };
    if (prev.player !== multiSeatHandView.player) play(playerHandWrapRef.current, 'bottom right');
    if (prev.enemy !== multiSeatHandView.enemy) play(enemyHandWrapRef.current, 'top left');
  }, [multiSeatHandView]);
  // 2v2: versione di prova del tavolo a quattro carte e coppia mostrata in «alternanza».
  // Versioni del tavolo (modificabili in Strumenti dev → TAVOLO 2V2 LAB).
  const teamBoardLayouts = useBoardLayouts();
  const teamBoardVariant = teamBoardLayouts.activeId;
  const setTeamBoardVariant = teamBoardLayouts.setActiveId;
  const [teamBoardPair, setTeamBoardPair] = useState(0);
  const multiSeatProjectionKey = `${multiSeat.view?.projection?.playerSeatId || ''}|${multiSeat.view?.projection?.enemySeatId || ''}`;
  useEffect(() => {
    setMultiSeatHandView({ player: 0, enemy: 0 });
  }, [multiSeatProjectionKey]);

  useMatchAudio({ gamePhase, duelPhase, battleResult });

  // Hook per l'IA (prima di useGameFlow: serve resetAiSession al reset/start partita)
  const ai = useAI(gameState);
  
  // Hook per il flusso del gioco
  const gameFlow = useGameFlow(gameState, animations, ai.resetAiSession);
  const { startOnlineMatch, resetToMenu } = gameFlow;

  const isOnlinePvP = aiDifficulty === 'multiplayer';

  const [onlineLocalReady, setOnlineLocalReady] = useState(false);
  const [onlinePeerDeck, setOnlinePeerDeck] = useState(null);
  const [onlinePeerName, setOnlinePeerName] = useState(null);
  /** true dopo un rematch nella stessa stanza (solo UI) */
  const [onlineRematchActive, setOnlineRematchActive] = useState(false);
  const [pendingGuestMatch, setPendingGuestMatch] = useState(null);
  /** Formato della partita online: lo sceglie l'host nella schermata d'attesa, l'ospite lo vede. */
  const [onlineFormatId, setOnlineFormatId] = useState(MATCH_FORMATS.standard.id);
  /** Stanza online: modalità, giocatori del Re della collina, difficoltà delle IA (le sceglie l'host). */
  const [onlineMode, setOnlineMode] = useState('duel');
  const [onlinePlayers, setOnlinePlayers] = useState(4);
  const [onlineDifficulty, setOnlineDifficulty] = useState('medium');
  /** Posti della stanza (server a 4 posti) e giocatori pronti per posto. */
  const [onlineMembers, setOnlineMembers] = useState([]);
  const [onlineReadies, setOnlineReadies] = useState({});
  const onlineModeRef = useRef('duel');
  onlineModeRef.current = onlineMode;
  const multiSeatNetRef = useRef(null);
  const multiSeatReconnectRef = useRef(null);
  const multiSeatOnlineRef = useRef(false);
  const startMultiOnlineRef = useRef(null);
  /** Torneo online: messaggi `tn_*` ed eventi di stanza (vedi blocco «Torneo online»). */
  const tournamentNetRef = useRef(null);
  /** Coda relay peer_move: un solo messaggio non può essere sovrascritto (field poi agent). */
  const [incomingPeerMoveQueue, setIncomingPeerMoveQueue] = useState([]);
  /** Avversario ha 3 campi (R3–4): attende la sua scelta reclamare / continuare (solo online). */
  const [opponentClaimPending, setOpponentClaimPending] = useState(null);
  // l'attesa resta in scena per la sua uscita quando l'avversario ha deciso
  const opponentClaimPresence = usePresence(opponentClaimPending, CLAIM_EXIT_MS);
  const [incomingClaimDecision, setIncomingClaimDecision] = useState(null);
  const forceContinueAfterClaimRef = useRef(false);
  /** Evita doppio advance (double-click / doppio timeout) che ribaltava l'iniziativa. */
  const roundAdvanceLockRef = useRef(null);
  const nextRoundInFlightRef = useRef(false);

  useEffect(() => {
    if (roundNumber === 1 && (gamePhase === 'selectField' || gamePhase === 'shuffleDeal')) {
      roundAdvanceLockRef.current = null;
      nextRoundInFlightRef.current = false;
    }
  }, [roundNumber, gamePhase]);
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
  // Telemetria del playtest: partita in corso (inizio e round giocati) e invio unico a fine partita.
  const telemetriaRef = useRef({ inCorso: false, inviata: false, idPartita: null, inizio: null, round: [] });
  const [chiediNomeGiocatore, setChiediNomeGiocatore] = useState(() => serveNomeGiocatore());
  const multiplayerSessionRef = useRef(multiplayerSession);
  /** Impostato dopo applyOnlineRematch — usato dal relay rematch */
  const applyOnlineRematchRef = useRef(/** @type {null | ((mode: 'same' | 'change') => void)} */ (null));
  useEffect(() => {
    multiplayerSessionRef.current = multiplayerSession;
  }, [multiplayerSession]);

  useEffect(() => {
    if (!multiplayerSession?.roomCode) return;
    const mgr = getMultiplayerManager();
    return mgr.onMessage((msg) => {
      if (msg.type === 'room_members' && Array.isArray(msg.members)) {
        setOnlineMembers(msg.members);
        return;
      }
      if (msg.type === 'member_left') {
        setOnlineReadies((prev) => {
          const next = { ...prev };
          delete next[msg.slot];
          return next;
        });
        // Nel Duello l'unico altro giocatore è l'avversario: come se avesse lasciato la stanza.
        tournamentNetRef.current?.({ type: '__member_left', slot: msg.slot }, null);
        if (onlineModeRef.current === 'duel') {
          setOnlineOpponentLeft(true);
          setLogs((prev) => [...prev.slice(-200), "[!] L'avversario ha lasciato la stanza."]);
        } else if (multiSeatOnlineRef.current) {
          setLogs((prev) => [...prev.slice(-200), `[!] Il giocatore del posto ${Number(msg.slot) + 1} ha lasciato la stanza: la partita non può proseguire.`]);
        }
        return;
      }
      if (msg.type === 'peer_left') {
        tournamentNetRef.current?.({ type: '__room_closed' }, null);
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
        multiSeatReconnectRef.current?.(msg.slot ?? null);
        setMpOpponentAway(false);
        setLogs((prev) => [...prev.slice(-200), "[+] L'avversario si è riconnesso."]);
        return;
      }
      if (msg.type === 'reconnected') {
        tournamentNetRef.current?.({ type: '__reconnected' }, null);
        multiSeatReconnectRef.current?.(null);
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
        setOnlineReadies((prev) => ({ ...prev, [msg.fromSlot ?? 1]: { ...p, slot: msg.fromSlot ?? 1 } }));
        setOnlinePeerDeck({
          army: p.army,
          deckKey: p.deckKey,
          ...(p.playerName ? { playerName: p.playerName } : {}),
          ...(typeof p.deckName === 'string' && p.deckName.trim() ? { deckName: p.deckName.trim().slice(0, 60) } : {}),
          ...(Array.isArray(p.deckCardIds) && p.deckCardIds.length ? { deckCardIds: p.deckCardIds } : {}),
          ...(Array.isArray(p.deckCardIds) && p.deckCardIds.includes(p.coverCardId) ? { coverCardId: p.coverCardId } : {}),
        });
        if (p.playerName) setOnlinePeerName(p.playerName);
      }
      if (p.type === 'match_start' && p.match) {
        setPendingGuestMatch(p.match);
      }
      if ((p.type === 'room_format' || p.type === 'room_config') && MATCH_FORMATS[p.formatId]) {
        setOnlineFormatId(p.formatId);
        if (ONLINE_MODES[p.mode]) setOnlineMode(p.mode);
        if (p.players === 3 || p.players === 4) setOnlinePlayers(p.players);
        if (p.difficulty) setOnlineDifficulty(p.difficulty);
      }
      if (typeof p.type === 'string' && p.type.startsWith('tn_')) {
        tournamentNetRef.current?.(p, msg.fromSlot);
      }
      if (typeof p.type === 'string' && p.type.startsWith('ms_')) {
        if (p.type === MULTI_MS.START && p.pkg) startMultiOnlineRef.current?.(p.pkg);
        else multiSeatNetRef.current?.(p, msg.fromSlot);
      }
      if (Object.values(EMINENCE_ONLINE_MESSAGES).includes(p.type)) {
        setRemoteEminenceQueue((prev) => [...prev.slice(-99), p]);
      }
      if (p.type === 'rematch') {
        applyOnlineRematchRef.current?.(p.mode === 'change' ? 'change' : 'same');
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

  /** Chiude stanza lato server + pulisce stato locale (senza cambiare gamePhase). */
  const cleanupMultiplayerSession = useCallback(() => {
    const s = multiplayerSessionRef.current;
    const mgr = getMultiplayerManager();
    if (s?.roomCode && mgr.isConnected()) {
      mgr.send({ type: 'leave_room', roomCode: s.roomCode });
    }
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
    setOnlineLocalReady(false);
    setOnlinePeerDeck(null);
    setOnlinePeerName(null);
    setOnlineRematchActive(false);
    setMultiplayerSession(null);
    setIsMultiplayer(false);
    clearMpSession();
    mgr.disconnect({ intentional: true });
  }, [setMultiplayerSession, setIsMultiplayer]);

  const abandonMultiplayerSession = useCallback(() => {
    cleanupMultiplayerSession();
    setGamePhase('menu');
  }, [cleanupMultiplayerSession, setGamePhase]);

  /** Prepara un rematch online nella stessa stanza (stesso mazzo o cambio mazzo). */
  const applyOnlineRematch = useCallback((mode) => {
    const keepDeck = mode !== 'change';
    aiThinkGenerationRef.current += 1;
    if (aiAgentThinkTimerRef.current) {
      clearTimeout(aiAgentThinkTimerRef.current);
      aiAgentThinkTimerRef.current = null;
    }
    aiHasSelectedAgent.current = false;
    setPlayerConfirmedAwaitingAI(false);
    setVictoryCondFx(null);
    setShowFinalRoundAnimation(false);
    ai.resetAiSession();
    clearCardPreview();
    setSelectedAgent(null);
    setEnemyAgent(null);
    setEnemySelectedFocus(1);
    setSelectedFocus(1);
    setCurrentFieldIndex(null);
    setBattleResult(null);
    setGameResult(null);
    setShowClaimVictoryChoice(null);
    setOpponentClaimPending(null);
    setIncomingClaimDecision(null);
    forceContinueAfterClaimRef.current = false;
    setIncomingPeerMoveQueue([]);
    setPendingGuestMatch(null);
    setOnlineLocalReady(false);
    setOnlinePeerDeck(null);
    onlineMatchStartedRef.current = false;
    setShuffleDealSetup(null);
    setMpOpponentAway(false);
    setOnlineOpponentLeft(false);
    setOnlineRematchActive(true);

    if (keepDeck && selectedArmy && selectedDeckKey) {
      setGamePhase('onlineDeckReady');
      return;
    }
    setGamePhase('selectArmy');
  }, [
    ai,
    clearCardPreview,
    selectedArmy,
    selectedDeckKey,
    setSelectedAgent,
    setEnemyAgent,
    setEnemySelectedFocus,
    setSelectedFocus,
    setCurrentFieldIndex,
    setBattleResult,
    setGameResult,
    setShowClaimVictoryChoice,
    setShuffleDealSetup,
    setGamePhase,
  ]);

  applyOnlineRematchRef.current = applyOnlineRematch;

  const requestOnlineRematch = useCallback((mode) => {
    if (!multiplayerSession?.roomCode) return;
    if (onlineOpponentLeft || mpConnectionLost) {
      alert("L'avversario non è più connesso. Torna al menu e crea una nuova stanza.");
      return;
    }
    if (!getMultiplayerManager().isConnected()) {
      alert('Connessione al server multiplayer assente. Usa «Riconnetti» se compare, altrimenti torna al menu.');
      return;
    }
    getMultiplayerManager().sendRelay(multiplayerSession.roomCode, {
      type: 'rematch',
      mode: mode === 'change' ? 'change' : 'same',
    });
    applyOnlineRematch(mode === 'change' ? 'change' : 'same');
  }, [
    multiplayerSession?.roomCode,
    onlineOpponentLeft,
    mpConnectionLost,
    applyOnlineRematch,
  ]);

  useEffect(() => {
    if (!pendingGuestMatch || multiplayerSession?.role !== 'guest') return;
    if (gamePhase !== 'onlineDeckReady') return;
    try {
      startOnlineMatch('guest', pendingGuestMatch);
      setPendingGuestMatch(null);
      setOnlineRematchActive(false);
    } catch (e) {
      console.error('[multiplayer] avvio partita guest:', e);
      alert(
        `Errore sincronizzazione partita: ${e?.message || e}\n\nChiedi all'host di uscire e ricreare la stanza, oppure aggiorna entrambi i client alla stessa versione.`
      );
    }
  }, [pendingGuestMatch, gamePhase, multiplayerSession?.role, startOnlineMatch, setGamePhase]);

  useEffect(() => {
    if (gamePhase !== 'onlineDeckReady' || multiplayerSession?.role !== 'host') return;
    if (onlineMode !== 'duel') return;
    if (!onlineLocalReady || !onlinePeerDeck) return;
    if (onlineMatchStartedRef.current) return;
    if (!getMultiplayerManager().isConnected()) {
      alert('Connessione al server multiplayer assente. Usa «Riconnetti» se compare, altrimenti torna al menu e rientra in stanza.');
      return;
    }
    onlineMatchStartedRef.current = true;
    try {
      setOnlineRematchActive(false);
      const seed = (Date.now() ^ (Math.random() * 0x7fffffff)) >>> 0;
      const guestDeckSource =
        Array.isArray(onlinePeerDeck.deckCardIds) && onlinePeerDeck.deckCardIds.length
          ? onlinePeerDeck.deckCardIds
          : onlinePeerDeck.deckKey;
      const formato = MATCH_FORMATS[onlineFormatId] || MATCH_FORMATS.standard;
      const match = buildOnlineMatchPayload(
        selectedArmy,
        selectedDeckKey,
        onlinePeerDeck.army,
        guestDeckSource,
        formato.mode === 'bareHands' ? 'bareHands' : selectedMode,
        seed,
        ALL_BATTLEFIELDS
      );
      // Le Eminenze si deducono dal mazzo su entrambi i client: basta concordare il formato.
      match.eminence = { format: formato.eminenceFormat ?? EMINENCE_FORMAT.DISABLED };
      match.formatId = formato.id;
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
    onlineFormatId,
    onlineMode,
    startOnlineMatch,
    setGamePhase,
  ]);

  // L'host comunica il formato all'ospite: all'ingresso nella schermata d'attesa, a ogni cambio
  // e quando l'ospite conferma l'esercito (così lo vede anche chi è entrato dopo).
  useEffect(() => {
    if (gamePhase !== 'onlineDeckReady' || multiplayerSession?.role !== 'host' || !multiplayerSession?.roomCode) return;
    if (!getMultiplayerManager().isConnected()) return;
    getMultiplayerManager().sendRelay(multiplayerSession.roomCode, {
      type: 'room_config', formatId: onlineFormatId, mode: onlineMode, players: onlinePlayers, difficulty: onlineDifficulty,
    });
  }, [gamePhase, multiplayerSession?.role, multiplayerSession?.roomCode, onlineFormatId, onlineMode, onlinePlayers, onlineDifficulty, onlinePeerDeck, onlineMembers.length]);

  /**
   * 2v2 / Re della collina online: dal pacchetto dell'host. Ogni client arma la sessione con il
   * proprio posto e avvia la distribuzione con la propria mano e quella del primo avversario.
   */
  const startMultiOnline = useCallback((pkg) => {
    const session = multiplayerSessionRef.current;
    if (!session?.roomCode || !pkg?.seats) return;
    const mySlot = session.slot ?? (session.role === 'host' ? 0 : 1);
    const send = (payload, to) => getMultiplayerManager().sendRelay(session.roomCode, payload, to);
    const { me, firstFoe } = multiSeat.armOnline({ pkg, localSlot: mySlot, isHost: session.role === 'host', send });
    if (!me) {
      setLogs((prev) => [...prev.slice(-200), '[!] Partita avviata senza un posto per te: sei spettatore.']);
      return;
    }
    const seatMe = pkg.seats.find((x) => x.id === me);
    const seatFoe = pkg.seats.find((x) => x.id === firstFoe);
    setSelectedMode(pkg.fieldMode === 'bareHands' ? 'bareHands' : 'classic');
    startOnlineMatch('host', {
      seed: pkg.seed,
      mode: pkg.fieldMode === 'bareHands' ? 'bareHands' : 'classic',
      battlefields: pkg.battlefieldIds.slice(0, 5),
      hostPlayerHand: seatMe.handIds.map((id) => ({ id, army: seatMe.army })),
      hostEnemyHand: seatFoe.handIds.map((id) => ({ id, army: seatFoe.army })),
      hostIsPlayerFirst: true,
      hostPlayerArmy: seatMe.army,
      hostEnemyArmy: seatFoe.army,
      hostPlayerSet: [],
      hostEnemySet: [],
    }, { aiDifficulty: onlineDifficulty || 'medium' });
  }, [multiSeat, startOnlineMatch, onlineDifficulty, setSelectedMode, setLogs]);
  startMultiOnlineRef.current = startMultiOnline;
  multiSeatNetRef.current = multiSeat.onNetMessage;
  multiSeatReconnectRef.current = multiSeat.onReconnect;
  multiSeatOnlineRef.current = multiSeat.isActive && multiSeat.isOnline;
  
  // Hook per il tutorial
  const tutorial = useTutorial();
  const [playerConfirmedAwaitingAI, setPlayerConfirmedAwaitingAI] = useState(false);
  
  // Ref per tracciare se l'IA ha già selezionato l'agente in questo round
  const aiHasSelectedAgent = useRef(false);
  /** Timer pensiero IA dopo conferma giocatore (player-first): va cancellato su Menu/reset. */
  const aiAgentThinkTimerRef = useRef(null);
  /** Incrementato a ogni reset/menu/round: invalida timeout pensiero IA orfani. */
  const aiThinkGenerationRef = useRef(0);
  /** Istante in cui l'agente nemico è comparso in campo (ingresso place-fx). */
  const enemyAgentPlacedAtRef = useRef(0);
  /** Evita un secondo handoff allo scontro mentre il primo è ancora in attesa. */
  const clashHoldPendingRef = useRef(false);
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
    setOpeningPlayerFirst,
    setLogs,
    setBattleEvents,
    setGamePhase,
    setPlayerConfirmedAwaitingAI,
    resetAiSelectionRef: () => {
      aiHasSelectedAgent.current = false;
    },
    setEminenceMatchState,
  });

  const handleTutorialTrackSelectWithPreviewReset = useCallback((mode) => {
    clearCardPreview();
    handleTutorialTrackSelect(mode);
  }, [clearCardPreview, handleTutorialTrackSelect]);

  const startStandardGameRef = useRef(startStandardGame);
  startStandardGameRef.current = startStandardGame;

  // ── Torneo (vs IA): tabellone salvato in locale, una partita alla volta ──
  const [tournament, setTournament] = useState(() => loadTournament());
  /** Scelta armata/esercito avviata dalla voce TORNEO del menù. */
  const [tournamentSetup, setTournamentSetup] = useState(false);
  /** La partita in corso (o appena finita) appartiene al torneo. */
  const [tournamentGameActive, setTournamentGameActive] = useState(false);
  /** Esito della partita di torneo ancora da registrare. */
  const tournamentResultPendingRef = useRef(false);

  const storeTournament = useCallback((next) => {
    setTournament(next);
    // Il torneo online vive nella stanza: non prende il posto di quello locale salvato.
    if (!next?.online) saveTournament(next);
  }, []);
  /** Torneo online: azioni del blocco «Torneo online», assegnate più sotto a ogni render. */
  const tnOnlineRef = useRef({});

  const stopAiThinking = useCallback(() => {
    aiThinkGenerationRef.current += 1;
    if (aiAgentThinkTimerRef.current) {
      clearTimeout(aiAgentThinkTimerRef.current);
      aiAgentThinkTimerRef.current = null;
    }
    aiHasSelectedAgent.current = false;
    setPlayerConfirmedAwaitingAI(false);
  }, []);

  /** Avvia la prossima partita della serie del giocatore, con le mani decise dal torneo. */
  const playTournamentGame = useCallback(() => {
    if (!tournament) return;
    // Online le mani le serve l'host; contro un altro giocatore la partita la avvia la sfida.
    if (tournament.online && tnOnlineRef.current.challenge?.()) return;
    const prepared = tournament.online ? tournament : prepareHumanGame(tournament);
    const info = describeHumanMatch(prepared);
    const game = info ? getPendingGame(info.match) : null;
    if (!game) return;
    const human = prepared.participants[prepared.humanId];
    const otherSide = info.side === 'a' ? 'b' : 'a';
    // Esercito bloccato: se quello salvato è stato modificato nel frattempo, valgono le carte iscritte.
    const customId = typeof human.deckKey === 'string' && human.deckKey.startsWith('custom_') ? human.deckKey.replace('custom_', '') : null;
    const currentIds = customId ? loadCustomDecks()[customId]?.cards : ARMY_DECKS[human.army]?.[human.deckKey]?.cards;
    const sameDeck = Array.isArray(currentIds)
      && currentIds.length === human.cardIds.length
      && currentIds.every((id) => human.cardIds.includes(id));
    if (!prepared.online) storeTournament(prepared);
    tnOnlineRef.current.markLocalGame?.(prepared.online ? { matchId: info.match.id, gameIndex: info.match.series.games.length - 1, side: info.side, peerSlot: null } : null);
    stopAiThinking();
    setVictoryCondFx(null);
    setShowFinalRoundAnimation(false);
    ai.resetAiSession();
    multiSeat.cancel();
    clearCardPreview();
    setDevDialogueDuelActive(false);
    if (!prepared.online) setIsMultiplayer(false);
    setCampaignLevel(null);
    setSelectedMode(prepared.settings.mode || 'classic');
    setSelectedArmy(human.army);
    setSelectedDeckKey(human.deckKey);
    setVsChosenEnemyArmy(info.opponent.army);
    // cortina sul tabellone, poi il VS: niente stacco netto verso il tavolo
    runCurtain({ label: info.opponent.deckName, kicker: `${info.roundName.toUpperCase()} · PARTITA ${info.gameNumber}`, accent: ARMY_COLORS[human.army]?.accent }, () => {
    tournamentResultPendingRef.current = true;
    setTournamentGameActive(true);
    startStandardGame(
      human.army,
      sameDeck ? human.deckKey : human.cardIds,
      prepared.settings.mode || 'classic',
      prepared.settings.difficulty || 'medium',
      ALL_BATTLEFIELDS,
      info.opponent.army,
      info.opponent.deckKey,
      null,
      {
        eminenceFormat: prepared.settings.eminenceFormat,
        fixedHands: {
          playerHand: resolveTournamentCards(game.hands[info.side]),
          enemyHand: resolveTournamentCards(game.hands[otherSide]),
        },
      }
    );
    });
  }, [runCurtain, tournament, storeTournament, stopAiThinking, ai, multiSeat, clearCardPreview, startStandardGame, setShowFinalRoundAnimation, setIsMultiplayer, setCampaignLevel, setSelectedMode, setSelectedArmy, setSelectedDeckKey]);

  /** Dal tavolo al tabellone (fine partita o abbandono: la partita non conclusa si rigioca con la stessa mano). */
  const returnToTournamentHub = useCallback(() => {
    stopAiThinking();
    runCurtain({ label: 'TORNEO', kicker: 'TABELLONE', dir: 'back' }, () => {
      ai.resetAiSession();
      setVictoryCondFx(null);
      setShowFinalRoundAnimation(false);
      tournamentResultPendingRef.current = false;
      setTournamentGameActive(false);
      setSpectate(null);
      tnOnlineRef.current.leaveGame?.();
      resetToMenu();
      setGamePhaseRaw('tournamentHub');
    });
  }, [runCurtain, stopAiThinking, ai, resetToMenu, setShowFinalRoundAnimation, setGamePhaseRaw]);

  /** Spettatore: i duelli proseguono da soli dopo l'esito (si può spegnere dalla fascia). */
  const [spectateAuto, setSpectateAuto] = useState(true);

  /** Lavoro in corso sul tabellone (serie tra IA che si stanno giocando): { label }. */
  const [tournamentBusy, setTournamentBusy] = useState(null);

  /**
   * Mostra sul tavolo una partita tra IA già giocata: il motore la rigioca identica e ogni
   * duello entra in scena già risolto, come gli scontri delle modalità a più posti.
   */
  const startSpectate = useCallback((t, matchId, gameIndex, onCovered = null) => {
    const match = getMatch(t, matchId);
    const saved = match?.series.games[gameIndex];
    if (!hasGameLog(saved)) return;
    const { handA, handB, battlefields, game } = replaySavedAiGame(t, saved);
    const sideA = t.participants[match.a];
    const sideB = t.participants[match.b];
    const earlier = match.series.games.slice(0, gameIndex);
    stopAiThinking();
    runCurtain({ label: `${sideA.deckName} – ${sideB.deckName}`, kicker: `SPETTATORE · PARTITA ${gameIndex + 1}` }, () => {
    onCovered?.();
    setVictoryCondFx(null);
    setShowFinalRoundAnimation(false);
    ai.resetAiSession();
    multiSeat.cancel();
    clearCardPreview();
    setDevDialogueDuelActive(false);
    setIsMultiplayer(false);
    setCampaignLevel(null);
    setSelectedMode(t.settings.mode || 'classic');
    setVsChosenEnemyArmy(sideB.army);
    tournamentResultPendingRef.current = false;
    setTournamentGameActive(false);
    setSpectate({
      matchId,
      gameIndex,
      gamesTotal: match.series.games.length,
      roundName: ROUND_NAMES[match.round],
      seriesBefore: { a: earlier.filter((g) => g.winner === 'a').length, b: earlier.filter((g) => g.winner === 'b').length },
      frames: game.frames,
      index: 0,
      staged: -1,
      winner: game.winner,
      reason: game.reason,
      names: { a: sideA.deckName, b: sideB.deckName },
    });
    startStandardGame(
      sideA.army,
      sideA.cardIds,
      t.settings.mode || 'classic',
      t.settings.difficulty || 'medium',
      ALL_BATTLEFIELDS,
      sideB.army,
      sideB.cardIds,
      { fixedFields: battlefields, openingPlayerFirst: saved.aFirst },
      {
        eminenceFormat: EMINENCE_FORMAT.DISABLED,
        skipShuffleDeal: true,
        fixedHands: { playerHand: handA, enemyHand: handB },
      }
    );
    });
  }, [runCurtain, stopAiThinking, ai, multiSeat, clearCardPreview, startStandardGame, setShowFinalRoundAnimation, setIsMultiplayer, setCampaignLevel, setSelectedMode]);

  /** Guarda una serie tra IA: se non è ancora stata giocata la gioca prima per intero. */
  const watchTournamentSeries = useCallback(async (matchId, gameIndex = 0) => {
    if (!tournament || tournamentBusy) return;
    let current = tournament;
    if (!getMatch(current, matchId)?.winnerId) {
      setTournamentBusy({ matchId, label: 'Partita 1' });
      try {
        current = await playAiSeries(current, matchId, {
          onGame: (n) => setTournamentBusy({ matchId, label: `Partita ${n}` }),
        });
      } catch (err) {
        console.error('[Torneo] serie IA fallita:', err);
        setTournamentBusy(null);
        return;
      }
      // L'esito è già salvato, ma il tabellone lo mostra solo al ritorno: prima si guarda la serie.
      saveTournament(current);
      const played = current;
      startSpectate(played, matchId, gameIndex, () => { setTournament(played); setTournamentBusy(null); });
      return;
    }
    startSpectate(current, matchId, gameIndex);
  }, [tournament, tournamentBusy, startSpectate]);

  /** Aspetta la fine: gioca subito tutte le serie tra IA pronte, senza guardarle. */
  const concludeTournamentRound = useCallback(async () => {
    if (!tournament || tournamentBusy) return;
    setTournamentBusy({ label: 'Serie in corso' });
    try {
      const next = await playPendingAiSeries(tournament, {
        onProgress: ({ match, gameNumber, done, remaining }) => setTournamentBusy({
          matchId: match.id,
          label: `Partita ${gameNumber}`,
          step: done + 1,
          total: done + remaining,
        }),
        // ogni serie finita entra subito nel tabellone, con una pausa per vederla arrivare
        onSeriesDone: (current) => {
          storeTournament(current);
          return new Promise((resolve) => { setTimeout(resolve, 650); });
        },
      });
      storeTournament(next);
    } catch (err) {
      console.error('[Torneo] conclusione turno fallita:', err);
    }
    setTournamentBusy(null);
  }, [tournament, tournamentBusy, storeTournament]);

  /** Stato del tavolo da spettatore: lato 'a' sul lato player, lato 'b' sul lato enemy. */
  const applySpectateTable = useCallback((snap, frames, uptoIndex) => {
    setPlayerUsedCards(snap.used.a);
    setEnemyUsedCards(snap.used.b);
    setPlayerFocus(snap.focus.a);
    setEnemyFocus(snap.focus.b);
    setPlayerHP(snap.hp.a);
    setEnemyHP(snap.hp.b);
    setPlayerToxin(snap.toxin.a || null);
    setEnemyToxin(snap.toxin.b || null);
    setConqueredFields(snap.conqueredFields);
    setRevealedFields(snap.revealedFields);
    const outcomes = {};
    frames.slice(0, uptoIndex).forEach((f) => {
      outcomes[battleOutcomeKey('player', f.cardA.id)] = f.battleResult.winner === 'player' ? 'winner' : 'loser';
      outcomes[battleOutcomeKey('enemy', f.cardB.id)] = f.battleResult.winner === 'enemy' ? 'winner' : 'loser';
    });
    setCardBattleOutcomes(outcomes);
  }, [setPlayerUsedCards, setEnemyUsedCards, setPlayerFocus, setEnemyFocus, setPlayerHP, setEnemyHP, setPlayerToxin, setEnemyToxin, setConqueredFields, setRevealedFields, setCardBattleOutcomes]);

  // Spettatore: a ogni turno il duello già risolto entra in scena.
  useEffect(() => {
    if (!spectate || gamePhase !== 'selectField' || spectate.staged === spectate.index) return;
    const frame = spectate.frames[spectate.index];
    const scene = multiSeatSceneRef.current;
    setSpectate((prev) => (prev ? { ...prev, staged: prev.index } : prev));
    scene.resetForProjection();
    applySpectateTable(frame.before, spectate.frames, spectate.index);
    setRoundNumber(frame.before.roundNumber);
    setIsPlayerFirst(frame.before.isPlayerFirst);
    setLastWinner(null);
    scene.stageBattle({
      result: {
        ...frame.battleResult,
        presentStart: {
          hp: { player: frame.before.hp.a, enemy: frame.before.hp.b },
          toxin: { player: frame.before.toxin.a || null, enemy: frame.before.toxin.b || null },
        },
      },
      playerAgent: frame.cardA,
      enemyAgent: frame.cardB,
      playerFocus: frame.focusA,
      enemyFocus: frame.focusB,
      fieldIndex: frame.fieldIndex,
    });
  }, [spectate, gamePhase, applySpectateTable, setRoundNumber, setIsPlayerFirst, setLastWinner]);

  /** Spettatore, dopo «Continua»: turno successivo oppure esito della partita. */
  const advanceSpectate = useCallback((toEnd = false) => {
    const s = spectateRef.current;
    if (!s) return;
    const lastIndex = toEnd ? s.frames.length - 1 : s.index;
    const frame = s.frames[lastIndex];
    multiSeatSceneRef.current.resetForProjection();
    applySpectateTable(frame.after, s.frames, lastIndex + 1);
    if (toEnd) {
      setIsZoomed(false);
      setRoundNumber(frame.before.roundNumber);
      setSpectate({ ...s, index: lastIndex, staged: lastIndex });
    }
    if (lastIndex + 1 < s.frames.length) {
      setSpectate({ ...s, index: s.index + 1 });
      setGamePhaseRaw('selectField');
      return;
    }
    const fields = Object.values(frame.after.conqueredFields);
    setGameResult({
      winner: s.winner === 'a' ? 'player' : s.winner === 'b' ? 'enemy' : 'draw',
      reason: s.reason,
      playerFields: fields.filter((f) => f?.winner === 'player').length,
      enemyFields: fields.filter((f) => f?.winner === 'enemy').length,
      // partita di sola visione: fuori da storico playtest e telemetria
      test: true,
      spectate: true,
    });
    setGamePhaseRaw('gameOver');
  }, [applySpectateTable, setGameResult, setGamePhaseRaw, setIsZoomed, setRoundNumber]);

  // Uscita dal tavolo per un'altra via (es. menù): la partita non è più del torneo.
  useEffect(() => {
    if (gamePhase === 'menu') {
      setTournamentGameActive(false);
      setSpectate(null);
    }
  }, [gamePhase]);

  // Fine partita di torneo: l'esito entra nella serie una volta sola.
  useEffect(() => {
    if (!tournamentGameActive || gamePhase !== 'gameOver' || !gameResult || !tournament) return;
    if (!tournamentResultPendingRef.current) return;
    tournamentResultPendingRef.current = false;
    const outcome = gameResult.winner === 'player' ? 'human' : gameResult.winner === 'enemy' ? 'opponent' : 'draw';
    if (tournament.online) {
      tnOnlineRef.current.reportResult?.(outcome);
      return;
    }
    storeTournament(recordHumanGameResult(tournament, outcome));
  }, [tournamentGameActive, gamePhase, gameResult, tournament, storeTournament]);

  // ── Torneo online ────────────────────────────────────────────────────────────────────────
  // L'host della stanza tiene il tabellone: iscrive i giocatori, serve le mani, gioca le serie
  // tra IA, registra gli esiti e trasmette lo stato (`tn_state`). Ognuno gioca la propria
  // serie in contemporanea: contro un'IA la partita è locale e se ne riferisce l'esito; tra due
  // giocatori è un Duello online i cui messaggi vanno solo all'avversario (`relayTarget`).
  // Chi lascia la stanza viene sostituito da un'IA; se si chiude la stanza, ognuno prosegue in
  // locale contro le IA.
  /** Host: copia autorevole del torneo, aggiornata subito (lo stato React arriva al render dopo). */
  const hostTournamentRef = useRef(null);
  /** Partita di torneo in corso su questo client: { matchId, gameIndex, side, peerSlot|null }. */
  const tournamentOnlineGameRef = useRef(null);
  /** Host: giocatori pronti alla sfida, per incontro. */
  const tournamentReadyRef = useRef({});
  /** Sfida inviata: id dell'incontro per cui si aspetta l'avversario. */
  const [tournamentWaiting, setTournamentWaiting] = useState(null);
  const tournamentAiFailedRef = useRef(new Set());
  const gamePhaseRef = useRef(gamePhase);
  gamePhaseRef.current = gamePhase;
  const tournamentRef = useRef(tournament);
  tournamentRef.current = tournament;

  const tnMySlot = () => {
    const sess = multiplayerSessionRef.current;
    return sess ? (sess.slot ?? (sess.role === 'host' ? 0 : 1)) : null;
  };
  const tnIsHost = () => multiplayerSessionRef.current?.role === 'host';
  const tnRelay = (payload, to = 'all') => {
    const sess = multiplayerSessionRef.current;
    if (sess?.roomCode) getMultiplayerManager().sendRelay(sess.roomCode, payload, to);
  };

  /** Il torneo ricevuto (o deciso, per l'host) visto dal proprio posto. */
  const tnApply = (t) => {
    const me = `h${tnMySlot()}`;
    setTournament(withViewer(t, me));
    // L'avversario della partita in corso ha lasciato: è subentrata un'IA, si riparte dal tabellone.
    const game = tournamentOnlineGameRef.current;
    if (game?.peerSlot != null) {
      const match = getMatch(t, game.matchId);
      const peer = match ? t.participants[match[game.side === 'a' ? 'b' : 'a']] : null;
      if (!peer?.isHuman) {
        setLogs((prev) => [...prev.slice(-200), "[!] L'avversario ha lasciato il torneo: al suo posto gioca un'IA."]);
        returnToTournamentHub();
      }
    }
    if (tournamentWaiting && getMatch(t, tournamentWaiting)?.winnerId) setTournamentWaiting(null);
  };

  /** Host: nuovo stato del tabellone, con le prossime partite già servite, a tutti. */
  const tnHostCommit = (next) => {
    const prepared = prepareOpenHumanGames(next);
    hostTournamentRef.current = prepared;
    tnApply(prepared);
    tnRelay({ type: 'tn_state', tournament: prepared });
  };

  /** Avvio di un Duello online tra due giocatori del torneo (su entrambi i client). */
  const tnStartPeerGame = (msg) => {
    const t = tournamentRef.current || hostTournamentRef.current;
    const match = t ? getMatch(t, msg.matchId) : null;
    const peer = match ? t.participants[match[msg.side === 'a' ? 'b' : 'a']] : null;
    getMultiplayerManager().relayTarget = [msg.peerSlot];
    tournamentOnlineGameRef.current = { matchId: msg.matchId, gameIndex: msg.gameIndex, side: msg.side, peerSlot: msg.peerSlot };
    setTournamentWaiting(null);
    stopAiThinking();
    runCurtain({ label: peer?.deckName || 'SFIDA', kicker: `${ROUND_NAMES[match?.round ?? 0].toUpperCase()} · CONTRO ${(peer?.playerName || 'AVVERSARIO').toUpperCase()}` }, () => {
      setVictoryCondFx(null);
      setShowFinalRoundAnimation(false);
      ai.resetAiSession();
      multiSeat.cancel();
      clearCardPreview();
      setIncomingPeerMoveQueue([]);
      setOpponentClaimPending(null);
      setIncomingClaimDecision(null);
      setRemoteEminenceQueue([]);
      setOnlineOpponentLeft(false);
      setOnlinePeerName(peer?.playerName || null);
      setVsChosenEnemyArmy(peer?.army || null);
      setSelectedMode(msg.match.mode === 'bareHands' ? 'bareHands' : 'classic');
      tournamentResultPendingRef.current = true;
      setTournamentGameActive(true);
      try {
        startOnlineMatch(msg.side === 'a' ? 'host' : 'guest', msg.match);
      } catch (err) {
        console.error('[Torneo online] avvio partita:', err);
        returnToTournamentHub();
      }
    });
  };

  /** Host: un giocatore è pronto alla sfida; con entrambi pronti parte il Duello. */
  const tnHostReady = (fromSlot, matchId) => {
    const t = hostTournamentRef.current;
    const match = t ? getMatch(t, matchId) : null;
    if (!match || match.winnerId || !getPendingGame(match)) return;
    const slots = ['a', 'b'].map((side) => t.participants[match[side]]);
    if (!slots.every((p) => p.isHuman)) return;
    const ready = (tournamentReadyRef.current[matchId] ||= new Set());
    ready.add(fromSlot);
    if (!slots.every((p) => ready.has(p.slot))) return;
    delete tournamentReadyRef.current[matchId];
    const seed = (Date.now() ^ (Math.random() * 0x7fffffff)) >>> 0;
    const payload = buildTournamentOnlineMatch(t, match, seed);
    const gameIndex = match.series.games.length - 1;
    ['a', 'b'].forEach((side, i) => {
      const msg = { type: 'tn_match_start', matchId, gameIndex, side, peerSlot: slots[1 - i].slot, match: payload };
      if (slots[i].slot === tnMySlot()) tnStartPeerGame(msg);
      else tnRelay(msg, [slots[i].slot]);
    });
  };

  /** Host: esito riferito da un giocatore dell'incontro (il primo che arriva vale). */
  const tnHostResult = (fromSlot, { matchId, gameIndex, winner }) => {
    const t = hostTournamentRef.current;
    const match = t ? getMatch(t, matchId) : null;
    const who = `h${fromSlot}`;
    if (!match || (match.a !== who && match.b !== who)) return;
    tnHostCommit(recordMatchGameResult(t, matchId, winner, gameIndex));
  };

  /** Uscita dal torneo online: si lascia la stanza (all'host arriva l'uscita e subentra un'IA). */
  const leaveOnlineTournament = () => {
    getMultiplayerManager().relayTarget = null;
    tournamentOnlineGameRef.current = null;
    hostTournamentRef.current = null;
    tournamentReadyRef.current = {};
    setTournamentWaiting(null);
    setTournamentBusy(null);
    setTournamentGameActive(false);
    cleanupMultiplayerSession();
    setTournament(loadTournament());
    resetToMenu();
  };

  tnOnlineRef.current = {
    // true se la sfida è stata gestita qui (avversario umano, o mani non ancora arrivate)
    challenge: () => {
      const t = tournamentRef.current;
      const info = t ? describeHumanMatch(t) : null;
      if (!info) return true;
      if (!getPendingGame(info.match)) {
        tnRelay({ type: 'tn_hello' }, [0]);
        return true;
      }
      if (!info.opponent.isHuman) return false;
      setTournamentWaiting(info.match.id);
      if (tnIsHost()) tnHostReady(tnMySlot(), info.match.id);
      else tnRelay({ type: 'tn_ready', matchId: info.match.id }, [0]);
      return true;
    },
    markLocalGame: (game) => { tournamentOnlineGameRef.current = game; },
    leaveGame: () => {
      getMultiplayerManager().relayTarget = null;
      tournamentOnlineGameRef.current = null;
      // il Duello tra giocatori lascia la difficoltà su «multiplayer»: sul tabellone torna quella del torneo
      if (tournamentRef.current?.online) setAiDifficulty(tournamentRef.current.settings?.difficulty || 'medium');
    },
    reportResult: (outcome) => {
      const game = tournamentOnlineGameRef.current;
      if (!game) return;
      const other = game.side === 'a' ? 'b' : 'a';
      const result = { matchId: game.matchId, gameIndex: game.gameIndex, winner: outcome === 'human' ? game.side : outcome === 'opponent' ? other : 'draw' };
      if (tnIsHost()) tnHostResult(tnMySlot(), result);
      else tnRelay({ type: 'tn_result', ...result }, [0]);
    },
    // Host: i giocatori pronti della stanza diventano il tabellone
    start: (humans, settings) => {
      const sess = multiplayerSessionRef.current;
      const t = createOnlineTournament({ humans, settings, roomCode: sess?.roomCode });
      hostTournamentRef.current = t;
      tournamentReadyRef.current = {};
      tournamentAiFailedRef.current = new Set();
      tnRelay({ type: 'tn_start', tournament: t });
      runCurtain({ label: 'TORNEO', kicker: 'TABELLONE ONLINE' }, () => {
        tnApply(t);
        setGamePhaseRaw('tournamentHub');
      });
    },
    leave: leaveOnlineTournament,
  };

  tournamentNetRef.current = (p, fromSlot) => {
    const t = tournamentRef.current;
    if (p.type === 'tn_start' && p.tournament && fromSlot === 0) {
      runCurtain({ label: 'TORNEO', kicker: 'TABELLONE ONLINE' }, () => {
        tnApply(p.tournament);
        setGamePhaseRaw('tournamentHub');
      });
      return;
    }
    if (p.type === 'tn_state' && p.tournament && fromSlot === 0) {
      tnApply(p.tournament);
      // rientrato in stanza a torneo già iniziato: si torna al tabellone
      if (!t?.online && gamePhaseRef.current === 'onlineDeckReady') setGamePhaseRaw('tournamentHub');
      return;
    }
    if (p.type === 'tn_match_start' && p.match && fromSlot === 0) {
      tnStartPeerGame(p);
      return;
    }
    if (p.type === '__reconnected') {
      if (t?.online && !tnIsHost()) tnRelay({ type: 'tn_hello' }, [0]);
      return;
    }
    if (p.type === '__room_closed') {
      // L'host ha chiuso la stanza: il torneo prosegue in locale contro le IA.
      if (!t?.online) return;
      const inGame = tournamentOnlineGameRef.current;
      getMultiplayerManager().relayTarget = null;
      tournamentOnlineGameRef.current = null;
      setTournamentWaiting(null);
      storeTournament(detachToOffline(t, t.humanId));
      setLogs((prev) => [...prev.slice(-200), "[!] La stanza è stata chiusa: il torneo prosegue in locale contro le IA."]);
      if (inGame?.peerSlot != null) returnToTournamentHub();
      // dopo il resto della gestione di «stanza chiusa»: la sessione online non serve più
      setTimeout(() => cleanupMultiplayerSession(), 0);
      return;
    }
    if (!tnIsHost() || !hostTournamentRef.current) return;
    if (p.type === '__member_left') {
      delete tournamentReadyRef.current;
      tournamentReadyRef.current = {};
      tnHostCommit(convertToAi(hostTournamentRef.current, `h${p.slot}`));
    } else if (p.type === 'tn_hello') {
      tnRelay({ type: 'tn_state', tournament: hostTournamentRef.current }, [fromSlot]);
    } else if (p.type === 'tn_ready') {
      tnHostReady(fromSlot, p.matchId);
    } else if (p.type === 'tn_result') {
      tnHostResult(fromSlot, p);
    }
  };

  // Host sul tabellone: gioca in sottofondo le serie tra IA, una alla volta, e ne trasmette l'esito.
  useEffect(() => {
    if (!tournament?.online || !tnIsHost() || gamePhase !== 'tournamentHub' || tournamentBusy) return;
    const match = getPendingAiMatches(tournament).find((m) => !tournamentAiFailedRef.current.has(m.id));
    if (!match) return;
    setTournamentBusy({ matchId: match.id, label: 'Partita 1', soft: true });
    (async () => {
      try {
        const played = await playAiSeries(hostTournamentRef.current, match.id, {
          onGame: (n) => setTournamentBusy({ matchId: match.id, label: `Partita ${n}`, soft: true }),
        });
        const current = hostTournamentRef.current;
        // si registra sullo stato di adesso: nel frattempo possono essere arrivati altri esiti
        if (current?.online && !getMatch(current, match.id)?.winnerId) {
          tnHostCommit(recordAiSeries(current, match.id, getMatch(played, match.id).series.games));
        }
      } catch (err) {
        console.error('[Torneo online] serie IA fallita:', err);
        tournamentAiFailedRef.current.add(match.id);
      }
      setTournamentBusy(null);
    })();
  }, [tournament, gamePhase, tournamentBusy]);

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

  /**
   * Campagna Atto I: lancio diretto della missione dall'hub.
   * Il mazzo arriva dalla run (carte reali, Nascente assemblato al volo);
   * il nemico dalla missione; le tre estensioni motore via campaignDuelMod.
   */
  const startCampaignMission = useCallback((mission, run) => {
    if (!mission || !run) return;
    const cfg = buildCampaignDuelConfig(mission, run, CAMPAIGN_ACT);
    setCampaignLevel(mission);
    setSelectedMode('campaign');
    setIsMultiplayer(false);
    setSelectedArmy(cfg.playerArmy);
    setSelectedDeckKey(null);
    startStandardGame(
      cfg.playerArmy,
      cfg.playerDeckCards,
      'campaign',
      cfg.difficulty,
      ALL_BATTLEFIELDS,
      cfg.enemyArmy,
      cfg.enemyDeckIds,
      cfg.campaignDuelMod,
      {...cfg.startOptions, campaignAssetsReady: campaignAssetsSlotRef.current === campaignSaveSlot}
    );
    if (run.model === 'first-act') restoreFirstActSnapshot(gameState, run.active?.snapshot, {campaignAssetsReady:campaignAssetsSlotRef.current === campaignSaveSlot});
  }, [gameState, campaignSaveSlot, startStandardGame, setCampaignLevel, setSelectedMode, setIsMultiplayer, setSelectedArmy, setSelectedDeckKey]);

  const retryCampaignMission = () => {
    try {
      const next = restartCampaignEncounter(loadCampaignRun(campaignSaveSlot, CAMPAIGN_ACT), CAMPAIGN_ACT, campaignLevel);
      if (!saveCampaignRun(next,campaignSaveSlot)) throw new Error('Salvataggio non riuscito: impossibile ritentare.');
      aiThinkGenerationRef.current += 1;
      if (aiAgentThinkTimerRef.current) clearTimeout(aiAgentThinkTimerRef.current);
      aiAgentThinkTimerRef.current = null;
      aiHasSelectedAgent.current = false;
      setPlayerConfirmedAwaitingAI(false);
      ai.resetAiSession();
      setVictoryCondFx(null);
      setShowFinalRoundAnimation(false);
      setCampaignActionError('');
      const mission = next.model === 'first-act'
        ? {...campaignLevel,campaignAttempt:next.active.id,campaignPhase:0}
        : {...campaignLevel,campaignAttempt:next.activeAttempt};
      startCampaignMission(mission,next);
    } catch (e) { setCampaignActionError(e.message); }
  };

  const winCampaignTest = () => {
    aiThinkGenerationRef.current += 1;
    if (aiAgentThinkTimerRef.current) clearTimeout(aiAgentThinkTimerRef.current);
    aiAgentThinkTimerRef.current = null;
    aiHasSelectedAgent.current = false;
    setPlayerConfirmedAwaitingAI(false);
    setPlayerHP(Math.max(1,playerHP));
    setEnemyHP(0);
    setGameResult({winner:'player',reason:'hp',test:true});
    setGamePhase('gameOver');
  };

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
    void deckKey;
    setPreviewDeckData(null);
    setGamePhase('selectDeck');
    setShowDifficultyPopup(true);
  }, [
    selectedDeckKey,
    isMultiplayer,
    selectedMode,
    setGamePhase,
  ]);

  const selectArmyAndContinue = useCallback(
    (army) => {
      setArmyDeckHandoff({ from: 'army', army });
      setSelectedArmy(army);
      setGamePhase('selectDeck');
    },
    [setSelectedArmy, setGamePhase]
  );

  // Fuori dal flusso armata/esercito si torna all'intro completa (sigillo).
  useEffect(() => {
    if (gamePhase !== 'selectArmy' && gamePhase !== 'selectDeck' && gamePhase !== 'previewDeck') {
      setArmyDeckHandoff(null);
    }
  }, [gamePhase]);

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
        ALL_BATTLEFIELDS,
        payload.enemyArmy ?? null,
        null,
        null,
        payload.startOptions ?? null
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
    stopRainbowGlowClock({ reset: true });
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

  // «Salta»: chiude l'animazione del duello e porta subito ai valori finali del risultato
  const skipDuelAndResult = () => {
    skipDuelAnimation();
    duelHp.skip();
  };

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
    stopRainbowGlowClock({ reset: true });
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
      ? Math.max(0, enemyFocus)
      : currentGuidedRound.enemyFocus;
    setEnemyAgent(scriptedEnemy);
    setEnemySelectedFocus(enemyFocusScripted);
    setLogs((prev) => [
      ...prev.slice(-80),
      // FC investiti: solo in phaseLogs.phase2
      `[R${roundNumber}] Guida: il nemico schiera ${scriptedEnemy.name}.`,
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
      setBattleEvents((prev) => {
        const emitter = createBattleEventEmitter(roundNumber);
        const ch = createBattleLogChannel(emitter, { dualStrings: false });
        emitInfo(ch, {
          phase: 'preDuel',
          revealAt: 'deploy',
          infoCode: 'opponentFieldChosen',
          data: { fieldName },
        });
        return keepLastRounds([...prev, ...emitter.events], 10);
      });
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

  // Handler a identità stabile per i componenti memoizzati del duello:
  // un'arrow inline li farebbe re-renderizzare a ogni setState della radice.
  const tryPickEminencePrey = useCallback((cardId) => {
    if (eminenceAnnounceHold || preyFlight.busy || cardId == null) return false;
    const legal = legalPreyIdsForChoice(eminenceChoiceView, { draftId: emDraftId });
    if (!legal.includes(cardId)) return false;
    if (emDraftParams?.preyCardId === cardId) return true;
    setEmDraftParams({ preyCardId: cardId });
    return true;
  }, [eminenceAnnounceHold, preyFlight.busy, eminenceChoiceView, emDraftId, emDraftParams]);

  const tryPickEminenceFragment = useCallback((cardId) => {
    if (eminenceAnnounceHold || preyFlight.busy || cardId == null) return false;
    const legal = legalFragmentIdsForChoice(eminenceChoiceView, { draftId: emDraftId });
    if (!legal.includes(cardId)) return false;
    setEmDraftParams((prev) => ({ ...(prev || {}), fragmentCardId: cardId }));
    return true;
  }, [eminenceAnnounceHold, preyFlight.busy, eminenceChoiceView, emDraftId]);

  const tryPickEminenceSlot = useCallback((slotIndex) => {
    if (eminenceAnnounceHold || preyFlight.busy || slotIndex == null) return false;
    const legal = legalSlotIndicesForChoice(eminenceChoiceView, { draftId: emDraftId });
    if (!legal.includes(slotIndex)) return false;
    const next = { slot: slotIndex };
    const sealedId = eminenceChoiceView.self?.selectedAbilityId;
    // AT_REVEAL già sigillata: il click sul tabellone fissa i params (come gli Agenti).
    // Senza questo il draft resta appeso e i click non passano mai alla scelta Campo.
    const sealedAwaitingParams = Boolean(
      sealedId
      && !emDraftId
      && !eminenceChoiceView.self?.revealedAbilityId,
    );
    if (sealedAwaitingParams) {
      setEmDraftParams(next);
      confirmEminenceAbility(sealedId, next);
      return true;
    }
    if (emDraftParams?.slot === slotIndex) return true;
    setEmDraftParams(next);
    return true;
  }, [
    eminenceAnnounceHold,
    preyFlight.busy,
    eminenceChoiceView,
    emDraftId,
    emDraftParams,
    confirmEminenceAbility,
  ]);

  const tryPickEminenceCard = useCallback((cardId) => {
    if (eminenceAnnounceHold || preyFlight.busy || cardId == null) return false;
    const abilityId = emDraftId || eminenceChoiceView.self?.selectedAbilityId;
    const legal = legalCardIdsForChoice(eminenceChoiceView, { draftId: abilityId });
    if (!legal.includes(cardId)) return false;
    if (!abilityId) return false;
    const next = { ...(emDraftParams || {}), cardId };
    setEmDraftParams(next);
    confirmEminenceAbility(abilityId, next);
    return true;
  }, [eminenceAnnounceHold, preyFlight.busy, eminenceChoiceView, emDraftId, emDraftParams, confirmEminenceAbility]);

  const handleEnemyPreviewClick = useEventCallback((data) => {
    if (tryPickEminencePrey(data?.agent?.id)) return;
    if (tryPickEminenceCard(data?.agent?.id)) return;
    handleCardPreviewClick({ ...data, isPlayer: false });
  });
  const handlePlayerPreviewClick = useEventCallback((data) => {
    if (tryPickEminenceFragment(data?.agent?.id)) return;
    if (tryPickEminenceCard(data?.agent?.id)) return;
    handleCardPreviewClick({ ...data, isPlayer: true });
  });

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
    if (playtestAutoSavedRef.current || !gameResult || gameResult.spectate) return;

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

  // Telemetria del playtest (solo build pubblica con webhook configurato): vedi src/telemetry/.
  useEffect(() => {
    svuotaCoda(); // partite rimaste in coda da una sessione precedente senza connessione
  }, []);

  useEffect(() => {
    const t = telemetriaRef.current;
    if (gamePhase === 'menu' || gamePhase === 'tournamentHub') {
      // Partita abbandonata o finita: la prossima ripartirà da zero.
      telemetriaRef.current = { inCorso: false, inviata: false, idPartita: null, inizio: null, round: [] };
      return;
    }
    const inPartita = ['selectField', 'selectAgent', 'battle', 'result'].includes(gamePhase);
    if (inPartita && (!t.inCorso || t.inviata)) {
      telemetriaRef.current = { inCorso: true, inviata: false, idPartita: nuovoIdPartita(), inizio: Date.now(), round: [] };
    }
  }, [gamePhase, roundNumber]);

  useEffect(() => {
    if (gamePhase !== 'gameOver' || !gameResult) return;
    const t = telemetriaRef.current;
    if (!t.inCorso || t.inviata || !telemetriaAttiva()) return;
    t.inviata = true;
    // Fuori dal test: tutorial guidati, campagna, partite di prova.
    if (guidedMatch?.active || selectedMode === 'campaign' || gameMode === 'campaign' || gameResult.test || devDialogueDuelActive) return;
    try {
      const fine = Date.now();
      if (gameResult.telemetria) {
        registraPartita(partitaMultiPosto({ idPartita: t.idPartita, inizio: t.inizio, fine, gameResult, telemetria: gameResult.telemetria }));
        return;
      }
      const customId = typeof selectedDeckKey === 'string' && selectedDeckKey.startsWith('custom_')
        ? selectedDeckKey.replace('custom_', '')
        : null;
      const custom = customId ? loadCustomDecks()[customId] : null;
      registraPartita(partitaDuello({
        idPartita: t.idPartita,
        inizio: t.inizio,
        fine,
        round: t.round,
        gameResult,
        online: isOnlinePvP ? { stanza: multiplayerSession?.roomCode ?? null } : null,
        aiDifficulty,
        gameMode,
        eminenze: { ...eminenceMatchState, enabled: isEminenceSubsystemEnabled(eminenceMatchState) },
        giocatore: {
          armata: selectedArmy || playerHand?.[0]?.army || null,
          esercito: custom ? `personalizzato: ${custom.name || customId}` : (typeof selectedDeckKey === 'string' ? `${selectedDeckKey} · ${ARMY_DECKS[selectedArmy]?.[selectedDeckKey]?.name || ''}`.trim() : null),
          carteEsercito: custom?.cards ?? null,
          mano: playerHand,
          pv: playerHP,
        },
        avversario: {
          nome: isOnlinePvP ? onlinePeerName : null,
          armata: enemyHand?.[0]?.army || null,
          esercito: duelDeckKeys?.enemy ?? null,
          mano: enemyHand,
          pv: enemyHP,
        },
      }));
    } catch (err) {
      console.warn('Telemetria: partita non registrata', err);
    }
  }, [
    gamePhase, gameResult, guidedMatch?.active, selectedMode, gameMode, devDialogueDuelActive, selectedDeckKey,
    isOnlinePvP, multiplayerSession?.roomCode, aiDifficulty, eminenceMatchState, selectedArmy, playerHand, playerHP,
    onlinePeerName, enemyHand, duelDeckKeys?.enemy, enemyHP,
  ]);

  // Rotella mouse sui FC - funziona su panel, sulla carta posizionata e sulla carta in mano
  useEffect(() => {
    if (gamePhase !== 'selectAgent' || !selectedAgent) return;
    const reserved = Math.max(0, playerHand.filter(c => !playerUsedCards.includes(c.id)).length - 1);
    const effectiveMax = computeLegalMaxFocus(playerFocus, reserved);
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

  // Hook per drag and drop — posa ingresso da preferenze (click/drop + stile FX)
  const [agentPlaceFx, setAgentPlaceFx] = useState('rise');
  const [agentPlaceFxStyle, setAgentPlaceFxStyle] = useState(null);
  const [enemyPlaceFx, setEnemyPlaceFx] = useState('rise');
  const [enemyPlaceFxStyle, setEnemyPlaceFxStyle] = useState(null);
  /** Ingresso d'armata (preferenze): 'with' insieme alla posa, 'replace' al posto della posa, 'off'. */
  const [agentArmyEntry, setAgentArmyEntry] = useState({ mode: 'with', delayMs: 0 });
  const [enemyArmyEntry, setEnemyArmyEntry] = useState('with');
  const prevEnemyAgentIdRef = useRef(null);
  /** Dorsi della partita (stessi dello shuffle): persistono dopo clear di shuffleDealSetup. */
  const [duelCardBacks, setDuelCardBacks] = useState({
    player: CARD_BACK_IMAGES[0],
    enemy: CARD_BACK_IMAGES[1] || CARD_BACK_IMAGES[0],
  });

  useEffect(() => {
    if (!shuffleDealSetup?.playerCardBack && !shuffleDealSetup?.enemyCardBack) return;
    setDuelCardBacks({
      player: shuffleDealSetup.playerCardBack || CARD_BACK_IMAGES[0],
      enemy: shuffleDealSetup.enemyCardBack || CARD_BACK_IMAGES[1] || CARD_BACK_IMAGES[0],
    });
  }, [shuffleDealSetup?.playerCardBack, shuffleDealSetup?.enemyCardBack]);

  // Ingresso agente nemico: famiglia drop se sceglie per primo, click se risponde
  useEffect(() => {
    const id = enemyAgent?.id ?? null;
    if (id && id !== prevEnemyAgentIdRef.current) {
      enemyAgentPlacedAtRef.current = Date.now();
      const prefs = getPlaceFxPreference();
      setEnemyPlaceFx(resolvePlaceFxForVia(isPlayerFirst ? 'click' : 'drop', prefs));
      setEnemyPlaceFxStyle(prefs.style);
      setEnemyArmyEntry(prefs.army);
    }
    if (!id) enemyAgentPlacedAtRef.current = 0;
    prevEnemyAgentIdRef.current = id;
  }, [enemyAgent?.id, isPlayerFirst]);

  /**
   * Ingresso d'armata (WebGL) per lato: id dell'agente il cui ingresso è finito.
   * `getAnimations` non lo vede, quindi lo segnala `ArmyEntryFx` con `onComplete`.
   */
  const armyEntryDoneRef = useRef({ player: null, enemy: null });
  const armyEntryWaitersRef = useRef(new Set());
  const deployedAgentIdRef = useRef({ player: null, enemy: null });
  deployedAgentIdRef.current = { player: selectedAgent?.id ?? null, enemy: enemyAgent?.id ?? null };
  const playerAgentPlacedAtRef = useRef(0);
  const notifyArmyEntryWaiters = useCallback(() => {
    armyEntryWaitersRef.current.forEach((check) => check());
  }, []);
  const markArmyEntryDone = useCallback((side, agentId) => {
    armyEntryDoneRef.current[side] = agentId;
    notifyArmyEntryWaiters();
  }, [notifyArmyEntryWaiters]);
  const markPlayerArmyEntryDone = useCallback(() => markArmyEntryDone('player', selectedAgent?.id ?? null), [markArmyEntryDone, selectedAgent?.id]);
  const markEnemyArmyEntryDone = useCallback(() => markArmyEntryDone('enemy', enemyAgent?.id ?? null), [markArmyEntryDone, enemyAgent?.id]);
  useEffect(() => {
    if (selectedAgent?.id) playerAgentPlacedAtRef.current = Date.now();
    else {
      playerAgentPlacedAtRef.current = 0;
      armyEntryDoneRef.current.player = null;
    }
    notifyArmyEntryWaiters();
  }, [selectedAgent?.id, notifyArmyEntryWaiters]);
  useEffect(() => {
    if (!enemyAgent?.id) armyEntryDoneRef.current.enemy = null;
    notifyArmyEntryWaiters();
  }, [enemyAgent?.id, notifyArmyEntryWaiters]);
  /** Risolve quando l'ingresso d'armata dell'agente schierato su `side` è finito (o non c'è agente). */
  const waitForArmyEntry = useCallback((side, timeoutMs) => new Promise((resolve) => {
    let timer = 0;
    const check = () => {
      const id = deployedAgentIdRef.current[side];
      if (id != null && armyEntryDoneRef.current[side] !== id) return;
      armyEntryWaitersRef.current.delete(check);
      window.clearTimeout(timer);
      resolve();
    };
    timer = window.setTimeout(() => {
      armyEntryWaitersRef.current.delete(check);
      resolve();
    }, timeoutMs);
    armyEntryWaitersRef.current.add(check);
    check();
  }), []);

  /** Ultimo gesto sulla carta (pressione o rilascio): da lì parte l'ingresso in campo. */
  const placeHandoffRef = useRef(null);
  const cardFlights = useCardFlights();
  const launchCardFlight = cardFlights.launch;

  /** Rettangolo della carta in mano (per i voli di ritorno). */
  const handCardRect = useCallback((agentId) => {
    const el = document.querySelector(`[data-hand-agent="${agentId}"]`);
    const r = el?.getBoundingClientRect();
    return r && r.width ? r : null;
  }, []);

  /** La carta schierata torna in mano in volo (click di ritiro). */
  const flyDeployedAgentBackToHand = useCallback((agent) => {
    if (!agent || prefersReducedMotion()) return;
    const slot = playerCardZoneRef.current?.getBoundingClientRect();
    const hand = handCardRect(agent.id);
    if (!slot?.width || !hand) return;
    launchCardFlight({ agent, from: rectToFlightPoint(slot), to: rectToFlightPoint(hand), duration: 300, arc: 40 });
  }, [handCardRect, launchCardFlight]);

  /** Rilascio fuori dallo slot: la carta trascinata torna al suo posto in mano. */
  const returnDraggedToHand = useCallback(({ agent, from }) => {
    const hand = handCardRect(agent.id);
    if (!hand) return;
    launchCardFlight({ agent, from, to: rectToFlightPoint(hand), duration: 280, arc: 30 });
  }, [handCardRect, launchCardFlight]);

  const handleAgentSelect = useCallback((agent, via = 'click') => {
    if (eminenceBlocksMatch) return;
    if (multiSeatActiveRef.current && !multiSeatDeployRef.current) return;
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
    if (!agent) {
      playGame(GAME_SOUND.CARD_DESELECT);
      setSelectedAgent(null);
      return;
    }
    if (selectedAgent?.id === agent.id) {
      playGame(GAME_SOUND.CARD_DESELECT);
      flyDeployedAgentBackToHand(selectedAgent);
      setSelectedAgent(null);
      return;
    }
    const prefs = getPlaceFxPreference();
    const placeFx = resolvePlaceFxForVia(via, prefs);
    setAgentPlaceFx(placeFx);
    setAgentPlaceFxStyle(prefs.style);
    // dal click la carta vola dalla mano: l'ingresso d'armata parte all'arrivo
    setAgentArmyEntry({ mode: prefs.army, delayMs: via === 'drop' ? 0 : CLICK_FLIGHT_MS });
    // il suono cade quando la carta tocca il campo, non al click
    const landMs = prefersReducedMotion() ? 0 : via === 'drop' ? (DROP_IMPACT_MS[placeFx] ?? 0) : CLICK_LAND_MS;
    playGameAt(via === 'drop' ? GAME_SOUND.CARD_PLACE : GAME_SOUND.CARD_SELECT, landMs);
    setSelectedAgent(agent);
  }, [eminenceBlocksMatch, guidedMatch.active, guidedMatch.freePlay, currentGuidedRound, playerHand, selectedAgent, setSelectedAgent, setGuidedHint, flyDeployedAgentBackToHand]);

  const dragAndDrop = useDragAndDrop({
    gamePhase,
    isPlayerFirst,
    enemyAgent,
    playerUsedCards,
    onAgentSelect: handleAgentSelect,
    selectedAgent,
    gameState,
    handoffRef: placeHandoffRef,
    onReturnToHand: returnDraggedToHand,
  });
  
  const { handleDragStart, dropZoneRef, dragVisual, dragGhostRef } = dragAndDrop;

  /** Posa effettiva: con «solo armata» niente posa, l'agente compare con l'ingresso d'armata. */
  const agentPose = agentArmyEntry.mode === 'replace' ? 'none' : agentPlaceFx;
  const enemyPose = enemyArmyEntry === 'replace' ? 'none' : enemyPlaceFx;

  // Ingresso in campo raccordato al gesto: dal punto di rilascio (drop) o con il volo dalla mano (click)
  useLayoutEffect(() => {
    const handoff = placeHandoffRef.current;
    const wrap = playerCardZoneRef.current;
    if (!selectedAgent || !handoff || !wrap) return undefined;
    if (handoff.agentId !== selectedAgent.id || handoff.via === 'used') return undefined;
    placeHandoffRef.current = { ...handoff, via: 'used' };
    return applyPlaceHandoff(wrap, handoff, agentPose, {
      agentId: selectedAgent.id,
      agent: selectedAgent,
      sceneEl: wrap.closest('.satze-scene'),
      launchFlight: launchCardFlight,
    });
    // solo l'id: un nuovo oggetto per lo stesso agente non deve interrompere il raccordo
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAgent?.id, agentPose, agentPlaceFxStyle, launchCardFlight]);
  
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

  // Sync cursore custom (army / inDuel / carta in drag) — host montato in App
  useEffect(() => {
    setSatzeCursorProps({
      army: selectedArmy || playerHand?.[0]?.army || null,
      inDuel: isSatzeCursorDuelPhase(gamePhase),
      dragCard: dragVisual
        ? { cx: dragVisual.cx, cy: dragVisual.cy }
        : null,
    });
  }, [selectedArmy, gamePhase, playerHand, dragVisual]);

  // Cursore di sistema durante drag solo se il custom cursor è spento
  useEffect(() => {
    if (!draggingCard) return undefined;
    if (document.documentElement.classList.contains('satze-custom-cursor')) return undefined;
    document.body.style.cursor = isOverDropZone ? 'copy' : 'grabbing';
    return () => { document.body.style.cursor = ''; };
  }, [draggingCard, isOverDropZone]);

  const addLog = (message) => {
    setLogs(prev => [...prev.slice(-200), `[R${roundNumber}] ${message}`]);
  };

  // Commit structured duel events once per resolved battleResult.
  const committedBattleResultRef = useRef(null);
  useEffect(() => {
    if (battleEvents.length === 0) {
      committedBattleResultRef.current = null;
    }
  }, [battleEvents]);
  useEffect(() => {
    if (!battleResult?.events?.length) return;
    if (committedBattleResultRef.current === battleResult) return;
    if (gamePhase !== 'result') return;
    if (duelPhase < 5) return;
    committedBattleResultRef.current = battleResult;
    setBattleEvents((prev) => {
      const round = battleResult.events[0]?.round;
      const withoutRound = round == null ? prev : prev.filter((e) => e.round !== round);
      return keepLastRounds([...withoutRound, ...battleResult.events], 10);
    });
  }, [battleResult, gamePhase, duelPhase, setBattleEvents]);

  useEffect(() => {
    if (gamePhase !== 'result') {
      outcomeNoticesShownKeyRef.current = null;
      return;
    }
    // Avvisi Pre-Trigger (es. Male Crescente): all'inizio della risoluzione, non a fine Duello.
    if (duelPhase === 0) {
      const prep = battleResult?.eminencePrepNotices;
      if (Array.isArray(prep) && prep.length > 0) {
        const key = `prep:${prep.map((notice) => notice.id).join('|')}`;
        if (outcomeNoticesShownKeyRef.current !== key) {
          outcomeNoticesShownKeyRef.current = key;
          setEminenceNotices(prep);
        }
      }
      return;
    }
    if (duelPhase < 5) return;
    const incoming = battleResult?.eminenceOutcomeNotices;
    if (!Array.isArray(incoming) || incoming.length === 0) return;
    const key = `out:${incoming.map((notice) => notice.id).join('|')}`;
    if (outcomeNoticesShownKeyRef.current === key) return;
    outcomeNoticesShownKeyRef.current = key;
    setEminenceNotices(incoming);
  }, [gamePhase, duelPhase, battleResult]);

  
  // Helper per calcolare se il bonus armata sarà attivo (per preview durante selectAgent)
  const isBonusTriggerSatisfied = useCallback((army, isPlayer, agent = null) => {
    const side = isPlayer ? 'player' : 'enemy';
    const sideAgent = agent ?? (isPlayer ? selectedAgent : enemyAgent);
    const live = resolveLivePowerBonusSwapDisplay({
      agent: sideAgent || { army },
      side,
      matchState: eminenceMatchState,
      armyBonus: matchArmyBonuses[army] || null,
    });
    const bonus = live.armyBonus || matchArmyBonuses[army];
    if (!bonus || !bonus.trigger) return true; // Nessun trigger = sempre attivo

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
      previousBonusActivated: campaignDuelMod?.previousBonus?.[side] === true,
      fieldModifiers: getFieldModifiers(battlefields[currentFieldIndex]),
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
    eminenceMatchState, campaignDuelMod, battlefields, currentFieldIndex,
  ]);

  const playerLiveSwap = useMemo(
    () => resolveLivePowerBonusSwapDisplay({
      agent: selectedAgent,
      side: 'player',
      matchState: eminenceMatchState,
      armyBonus: selectedAgent ? matchArmyBonuses[selectedAgent.army] || null : null,
    }),
    [selectedAgent, eminenceMatchState],
  );
  const enemyLiveSwap = useMemo(
    () => resolveLivePowerBonusSwapDisplay({
      agent: enemyAgent,
      side: 'enemy',
      matchState: eminenceMatchState,
      armyBonus: enemyAgent ? matchArmyBonuses[enemyAgent.army] || null : null,
    }),
    [enemyAgent, eminenceMatchState],
  );
  const displaySelectedAgent = playerLiveSwap.agent || selectedAgent;
  const displayEnemyAgent = enemyLiveSwap.agent || enemyAgent;

  const activeFieldForAbilityDisplay = useMemo(() => {
    if (battleResult?.field) return battleResult.field;
    if (currentFieldIndex != null) return battlefields[currentFieldIndex] || null;
    return null;
  }, [battleResult?.field, currentFieldIndex, battlefields]);

  const activeFieldAbilityMods = useMemo(
    () => getFieldSetupFlags(activeFieldForAbilityDisplay),
    [activeFieldForAbilityDisplay],
  );

  const displayTriggerRules = useMemo(
    () => buildDisplayTriggerRules({ matchState: eminenceMatchState }),
    [eminenceMatchState],
  );

  const resolveEffectiveAbility = useCallback(
    (ability, isPlayer, card = null) =>
      resolveAbilityForDisplay(ability, {
        fieldMods: activeFieldAbilityMods,
        isFirst: isPlayer ? isPlayerFirst : !isPlayerFirst,
        card,
        triggerRules: displayTriggerRules,
      }),
    [activeFieldAbilityMods, isPlayerFirst, displayTriggerRules],
  );

  const playerEffectiveArmyBonus = useMemo(() => {
    const base = playerLiveSwap.swapped
      ? playerLiveSwap.armyBonus
      : (displaySelectedAgent ? matchArmyBonuses[displaySelectedAgent.army] : null);
    const fieldBonus = resolveArmyBonusForDisplay({
      field: activeFieldForAbilityDisplay,
      fieldMods: activeFieldAbilityMods,
      armyBonus: base || matchArmyBonuses[displaySelectedAgent?.army] || null,
      hasBonus: Boolean(displaySelectedAgent && playerArmyBonuses[displaySelectedAgent.army]),
      opponentArmyBonus: displayEnemyAgent ? matchArmyBonuses[displayEnemyAgent.army] : null,
      opponentHasBonus: Boolean(displayEnemyAgent && enemyArmyBonuses[displayEnemyAgent.army]),
    });
    return fieldBonus || (playerLiveSwap.swapped ? playerLiveSwap.armyBonus : null);
  }, [
    playerLiveSwap,
    displaySelectedAgent,
    displayEnemyAgent,
    playerArmyBonuses,
    enemyArmyBonuses,
    activeFieldForAbilityDisplay,
    activeFieldAbilityMods,
  ]);

  const enemyEffectiveArmyBonus = useMemo(() => {
    const base = enemyLiveSwap.swapped
      ? enemyLiveSwap.armyBonus
      : (displayEnemyAgent ? matchArmyBonuses[displayEnemyAgent.army] : null);
    const fieldBonus = resolveArmyBonusForDisplay({
      field: activeFieldForAbilityDisplay,
      fieldMods: activeFieldAbilityMods,
      armyBonus: base || matchArmyBonuses[displayEnemyAgent?.army] || null,
      hasBonus: Boolean(displayEnemyAgent && enemyArmyBonuses[displayEnemyAgent.army]),
      opponentArmyBonus: displaySelectedAgent ? matchArmyBonuses[displaySelectedAgent.army] : null,
      opponentHasBonus: Boolean(displaySelectedAgent && playerArmyBonuses[displaySelectedAgent.army]),
    });
    return fieldBonus || (enemyLiveSwap.swapped ? enemyLiveSwap.armyBonus : null);
  }, [
    enemyLiveSwap,
    displaySelectedAgent,
    displayEnemyAgent,
    playerArmyBonuses,
    enemyArmyBonuses,
    activeFieldForAbilityDisplay,
    activeFieldAbilityMods,
  ]);

  const playerOverdrivePreview = useMemo(() => {
    if (gamePhase !== 'selectAgent' || !displaySelectedAgent) return false;
    const field = currentFieldIndex != null ? battlefields[currentFieldIndex] : null;
    const fieldModifiers = getFieldModifiers(field);
    const overdriveActive = checkTrigger('overdrive', {
      focusCoins: selectedFocus || 1,
      fieldModifiers,
    });
    if (!overdriveActive) return false;

    const abilityHasOverdrive = displaySelectedAgent.ability?.trigger === 'overdrive';
    const armyBonus = playerLiveSwap.armyBonus || matchArmyBonuses[displaySelectedAgent.army];
    const bonusHasOverdrive =
      Boolean(playerArmyBonuses[displaySelectedAgent.army]) &&
      armyBonus?.trigger === 'overdrive';
    const fieldHasOverdrive = fieldGrantsOverdriveBonus(field);

    return abilityHasOverdrive || bonusHasOverdrive || fieldHasOverdrive;
  }, [gamePhase, displaySelectedAgent, selectedFocus, currentFieldIndex, battlefields, playerArmyBonuses, playerLiveSwap]);
  
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

  // Ref stabili: le callback di useAI cambiano identità a ogni gameState e
  // non devono riarmare/cancellare i timer di pensiero IA.
  const selectEnemyFieldRef = useRef(ai.selectEnemyField);
  const selectEnemyFieldAsyncRef = useRef(ai.selectEnemyFieldAsync);
  const selectEnemyAgentAndFocusRef = useRef(ai.selectEnemyAgentAndFocus);
  const selectEnemyAgentAndFocusAsyncRef = useRef(ai.selectEnemyAgentAndFocusAsync);
  const getThinkingTimeRef = useRef(ai.getThinkingTime);
  selectEnemyFieldRef.current = ai.selectEnemyField;
  selectEnemyFieldAsyncRef.current = ai.selectEnemyFieldAsync;
  selectEnemyAgentAndFocusRef.current = ai.selectEnemyAgentAndFocus;
  selectEnemyAgentAndFocusAsyncRef.current = ai.selectEnemyAgentAndFocusAsync;
  getThinkingTimeRef.current = ai.getThinkingTime;
  const afterAgentsLockedRef = useRef(afterAgentsLocked);
  afterAgentsLockedRef.current = afterAgentsLocked;
  /**
   * Dopo la posa dell'agente nemico: fine ingresso (posa + ingresso d'armata di entrambi
   * i lati), poi almeno 1s di scelta FC (anche se i FC sono già stati fissati insieme alla
   * carta) prima dello scontro. Se nel frattempo il giocatore ritira la carta non si procede.
   * `mode: 'afterAnimation'` aggiunge sempre il secondo dopo l'ingresso
   * (risposta IA a conferma già data). `mode: 'floor'` rispetta solo il minimo
   * da quando la carta è comparsa (conferma del giocatore più tardi).
   */
  const ENEMY_FC_BEAT_MS = 1000;
  /** Tetto all'attesa dell'ingresso d'armata: ritardo del volo + foto (900ms) + effetto più lungo. */
  const ARMY_ENTRY_WAIT_MS = 6500;
  const holdClashForEnemyDeployRef = useRef(async () => false);
  holdClashForEnemyDeployRef.current = async (mode = 'floor') => {
    const generation = aiThinkGenerationRef.current;
    if (!enemyAgentPlacedAtRef.current) enemyAgentPlacedAtRef.current = Date.now();
    // La posa (classe play-*) può arrivare nel render subito dopo il set dell'agente.
    await new Promise((resolve) => {
      if (typeof requestAnimationFrame !== 'function') {
        setTimeout(resolve, 32);
        return;
      }
      requestAnimationFrame(() => requestAnimationFrame(resolve));
    });
    if (generation !== aiThinkGenerationRef.current) return false;
    // posa del giocatore a tempo: le animazioni `backwards` finite spariscono da getAnimations,
    // e su una carta già ferma l'attesa DOM ripartirebbe da capo
    const playerPoseLeft = playerAgentPlacedAtRef.current && agentPose !== 'none'
      ? Math.max(0, playerAgentPlacedAtRef.current + agentArmyEntry.delayMs + getPlaceFxDurationMs(agentPose) - Date.now())
      : 0;
    await Promise.all([
      waitForFieldAgentEntrance('enemy', { timeoutMs: 4500 }),
      waitForArmyEntry('enemy', ARMY_ENTRY_WAIT_MS),
      waitForArmyEntry('player', ARMY_ENTRY_WAIT_MS),
      playerPoseLeft > 0 ? new Promise((resolve) => setTimeout(resolve, playerPoseLeft)) : null,
    ]);
    if (generation !== aiThinkGenerationRef.current) return false;
    const elapsed = Date.now() - enemyAgentPlacedAtRef.current;
    const remain = mode === 'afterAnimation'
      ? ENEMY_FC_BEAT_MS
      : Math.max(0, ENEMY_FC_BEAT_MS - elapsed);
    if (remain > 0) {
      await new Promise((resolve) => setTimeout(resolve, remain));
    }
    return generation === aiThinkGenerationRef.current && deployedAgentIdRef.current.player != null;
  };
  const queueClashAfterEnemyDeploy = (proceed, mode = 'floor') => {
    if (clashHoldPendingRef.current) return;
    clashHoldPendingRef.current = true;
    void (async () => {
      try {
        const ok = await holdClashForEnemyDeployRef.current(mode);
        if (ok) proceed();
      } finally {
        clashHoldPendingRef.current = false;
      }
    })();
  };
  const holdDuelForEminenceRef = useRef(false);
  holdDuelForEminenceRef.current = eminenceBlocksMatch;

  // Gestione turno IA - selezione campo (tempo pensiero variabile)
  useEffect(() => {
    if (isOnlinePvP || multiSeatActiveRef.current) return;
    if (eminenceBlocksMatch) return;
    const isGuidedScripted = guidedMatch.active && !guidedMatch.freePlay && currentGuidedRound;

    if (isGuidedScripted) return;

    if (
      gamePhase === 'selectField'
      && !isPlayerFirst
      && battlefields.length > 0
      && (
        eminenceChoiceView.gateSequenceName !== 'AGENTS_FIRST'
        || (selectedAgent && enemyAgent)
      )
    ) {
      let cancelled = false;
      const delay = getThinkingTimeRef.current?.() ?? 2000;
      const startedAt = Date.now();
      /** Hard cap: se il motore IA si blocca, la partita non deve restare su selectField. */
      const HARD_TIMEOUT_MS = 12000;

      (async () => {
        await new Promise((resolve) => {
          if (typeof requestAnimationFrame === 'function') requestAnimationFrame(resolve);
          else setTimeout(resolve, 0);
        });
        if (cancelled) return;

        const available = battlefields.filter(
          (_, i) => !(i in conqueredFields) && i < revealedFields
        );
        if (available.length === 0) return;

        const fallbackIdx = battlefields.indexOf(available[0]);
        let fieldIdx = fallbackIdx;

        try {
          const timed = Promise.race([
            Promise.resolve(selectEnemyFieldAsyncRef.current?.()).then((v) =>
              v == null ? fallbackIdx : v
            ),
            new Promise((resolve) => {
              setTimeout(() => resolve(fallbackIdx), HARD_TIMEOUT_MS);
            }),
          ]);
          fieldIdx = await timed;
        } catch (err) {
          console.error('[SATZE] IA selectField compute:', err);
          fieldIdx = fallbackIdx;
        }

        if (
          fieldIdx == null ||
          fieldIdx < 0 ||
          !(fieldIdx in battlefields) ||
          fieldIdx in conqueredFields ||
          fieldIdx >= revealedFields
        ) {
          fieldIdx = fallbackIdx;
        }

        const waitMs = delay - (Date.now() - startedAt);
        if (waitMs > 0) {
          await new Promise((resolve) => setTimeout(resolve, waitMs));
        }
        if (cancelled || holdDuelForEminenceRef.current) return;

        setCurrentFieldIndex(fieldIdx);
        setBattleEvents((prev) => {
          const emitter = createBattleEventEmitter(roundNumber);
          const ch = createBattleLogChannel(emitter, { dualStrings: false });
          emitInfo(ch, {
            phase: 'preDuel',
            revealAt: 'deploy',
            infoCode: 'opponentFieldChosen',
            data: { fieldName: battlefields[fieldIdx].name, fieldId: battlefields[fieldIdx]?.id },
          });
          return keepLastRounds([...prev, ...emitter.events], 10);
        });
        afterFieldLocked();
      })().catch((err) => {
        console.error('[SATZE] IA selectField:', err);
        if (cancelled || holdDuelForEminenceRef.current) return;
        const available = battlefields.filter(
          (_, i) => !(i in conqueredFields) && i < revealedFields
        );
        if (!available.length) return;
        const fieldIdx = battlefields.indexOf(available[0]);
        setCurrentFieldIndex(fieldIdx);
        afterFieldLocked();
      });

      return () => {
        cancelled = true;
      };
    }
  }, [
    gamePhase,
    isPlayerFirst,
    battlefields,
    conqueredFields,
    revealedFields,
    roundNumber,
    isOnlinePvP,
    eminenceBlocksMatch,
    eminenceChoiceView.gateSequenceName,
    selectedAgent,
    enemyAgent,
    guidedMatch.active,
    guidedMatch.freePlay,
    currentGuidedRound,
    setCurrentFieldIndex,
    setLogs,
    setGamePhase,
    afterFieldLocked,
  ]);

  // Tilt Tabellone: una volta che il cursore ci passa sopra, si ferma e non riparte
  useEffect(() => {
    if (gamePhase !== 'selectField') setTabelloneTiltDismissed(false);
  }, [gamePhase]);

  // Animazione rivelazione nuova riga campo (handoff duello2)
  useEffect(() => {
    const prev = prevRevealedFieldsRef.current;
    prevRevealedFieldsRef.current = revealedFields;
    if (prev == null || revealedFields <= prev) return undefined;
    const idx = revealedFields - 1;
    setJustRevealedFieldIdx(idx);
    const t = setTimeout(() => setJustRevealedFieldIdx(-1), 900);
    return () => clearTimeout(t);
  }, [revealedFields]);

  // Anteprima vuota all'apertura di ogni nuovo duello / round / mischia iniziale
  useLayoutEffect(() => {
    if (gamePhase === 'shuffleDeal') {
      clearCardPreview();
      return;
    }
    if (gamePhase === 'selectField' && !selectedAgent && !enemyAgent) {
      clearCardPreview();
    }
  }, [gamePhase, selectedAgent, enemyAgent, clearCardPreview]);

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
  // Non latchare aiHasSelectedAgent prima del timer: se l'effect si riarma
  // (re-render / cleanup) il flag resterebbe true e l'IA non sceglierebbe più.
  useEffect(() => {
    if (isOnlinePvP || multiSeatActiveRef.current) return;
    if (eminenceBlocksMatch) return;
    if (guidedMatch.active && !guidedMatch.freePlay && currentGuidedRound) return;
    if (gamePhase !== 'selectAgent' || isPlayerFirst || enemyHand.length === 0 || enemyAgent) {
      return;
    }
    if (aiHasSelectedAgent.current) return;

    let cancelled = false;
    const delay = getThinkingTimeRef.current?.() ?? 2000;
    const startedAt = Date.now();

    (async () => {
      await new Promise((resolve) => {
        if (typeof requestAnimationFrame === 'function') requestAnimationFrame(resolve);
        else setTimeout(resolve, 0);
      });
      if (cancelled || aiHasSelectedAgent.current) return;

      const result = await selectEnemyAgentAndFocusAsyncRef.current?.(true, {
        revealAt: startedAt + delay,
        shouldAbort: () => cancelled || holdDuelForEminenceRef.current,
      });
      if (cancelled || holdDuelForEminenceRef.current || aiHasSelectedAgent.current) return;
      if (result?.agent) {
        aiHasSelectedAgent.current = true;
      }
    })().catch((err) => {
      console.error('[SATZE] IA selectAgent:', err);
    });

    return () => {
      cancelled = true;
    };
  }, [
    gamePhase,
    isPlayerFirst,
    enemyHand.length,
    enemyAgent,
    isOnlinePvP,
    eminenceBlocksMatch,
    guidedMatch.active,
    guidedMatch.freePlay,
    currentGuidedRound,
  ]);

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
    if (eminenceBlocksMatch) return;
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
    if (isMultiSeat && Array.isArray(multiSeat.view?.legalFields) && !multiSeat.view.legalFields.includes(idx)) {
      addLog('Campo non disponibile: scegline un altro.');
      return;
    }
    // Scelta campo locale: già visibile in scena — nessun log.
    playGame(GAME_SOUND.FIELD_SELECT);
    setCurrentFieldIndex(idx);
    if (isOnlinePvP && multiplayerSession?.roomCode && isPlayerFirst) {
      getMultiplayerManager().sendRelay(multiplayerSession.roomCode, {
        type: 'peer_move',
        roundNumber,
        phase: 'field',
        fieldIndex: idx,
      });
    }
    // Dopo il Campo: o si scelgono gli Agenti, o (sequenza Agenti-prima) si apre il reveal GENERAL.
    if (gamePhase === 'selectField') {
      afterFieldLocked();
    }
  };

  // Un handler stabile per campo: evita di invalidare i 5 MiniBattlefield memoizzati
  // (ognuno monta lo sfondo del campo) a ogni render del duello.
  const handleFieldSelectStable = useEventCallback(handleFieldSelect);
  const fieldSelectHandlers = useMemo(
    () => battlefields.map((field) => () => handleFieldSelectStable(field)),
    [battlefields, handleFieldSelectStable]
  );

  const logPanelBattleEvents = useMemo(() => {
    if (gamePhase !== 'result' || !battleResult?.events) return battleEvents;
    const resolvedRound = battleResult.events[0]?.round ?? roundNumber;
    return [
      ...battleEvents.filter((e) => e.round !== resolvedRound),
      ...battleResult.events,
    ];
  }, [gamePhase, battleResult, battleEvents, roundNumber]);

  const handleFocusChange = useCallback((focusValue) => {
    if (eminenceAnnounceHold || announcePointerGuard) return;
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
  }, [eminenceAnnounceHold, announcePointerGuard, guidedMatch.active, guidedMatch.freePlay, currentGuidedRound, validateFocusForRound, setSelectedFocus, setGuidedHint]);

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
        afterFieldLocked();
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
    afterFieldLocked,
  ]);

  // Conferma scelta giocatore
  const confirmPlayerChoice = () => {
    if (spectateRef.current) return;
    if (eminenceAnnounceHold || announcePointerGuard) return;
    if (eminenceBlocksMatch) return;
    if (isMultiSeat) {
      if (!multiSeat.acceptsHumanConfirm) return;
      if (!selectedAgent || selectedFocus < 1 || selectedFocus > playerFocus) return;
      playGame(GAME_SOUND.LOCK_IN);
      multiSeat.onHumanConfirm({ agent: selectedAgent, focus: selectedFocus, fieldIndex: currentFieldIndex });
      return;
    }
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
      if (!selectedAgent || selectedFocus < 1 || selectedFocus > playerFocus) return;
      playGame(GAME_SOUND.LOCK_IN);
      if (enemyAgent) {
        queueClashAfterEnemyDeploy(() => setGamePhase('battle'));
        return;
      }
      if (isPlayerFirst) {
        setPlayerConfirmedAwaitingAI(true);
        return;
      }
    }

    if (!selectedAgent || selectedFocus < 1 || selectedFocus > playerFocus) return;
    playGame(GAME_SOUND.LOCK_IN);

    if (isOnlinePvP && multiplayerSession?.roomCode) {
      if (enemyAgent) {
        getMultiplayerManager().sendRelay(multiplayerSession.roomCode, {
          type: 'peer_move',
          roundNumber,
          phase: 'agent',
          agentId: selectedAgent.id,
          focus: selectedFocus,
        });
        queueClashAfterEnemyDeploy(() => afterAgentsLocked());
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

    // Se l'IA ha già scelto (IA inizia), avanza solo a ingresso finito e dopo il minimo sui FC
    if (enemyAgent) {
      queueClashAfterEnemyDeploy(() => afterAgentsLocked());
      return;
    }

    // Se il giocatore inizia: resta in selectAgent, mostra "L'IA sta pensando...", poi passa a battle quando l'IA ha scelto
    if (!aiHasSelectedAgent.current) {
      setPlayerConfirmedAwaitingAI(true);
      aiHasSelectedAgent.current = true;
      const delay = ai.getThinkingTime?.() ?? 2000;
      const startedAt = Date.now();
      const scheduledGeneration = aiThinkGenerationRef.current;
      if (aiAgentThinkTimerRef.current) {
        clearTimeout(aiAgentThinkTimerRef.current);
        aiAgentThinkTimerRef.current = null;
      }
      (async () => {
        await new Promise((resolve) => {
          if (typeof requestAnimationFrame === 'function') requestAnimationFrame(resolve);
          else setTimeout(resolve, 0);
        });
        if (scheduledGeneration !== aiThinkGenerationRef.current) return;
        await ai.selectEnemyAgentAndFocusAsync(false, {
          revealAt: startedAt + delay,
          shouldAbort: () => scheduledGeneration !== aiThinkGenerationRef.current,
        });
      })().catch((err) => {
        console.error('[SATZE] IA risposta (giocatore primo):', err);
      });
    }
  };

  // Quando l'IA ha scelto dopo che il giocatore (primo) ha confermato:
  // resta in selectAgent finché l'ingresso dell'agente non è finito, poi un secondo
  // di scelta FC (anche se i FC erano già fissati) e solo allora lo scontro.
  useEffect(() => {
    if (!(gamePhase === 'selectAgent' && selectedAgent && enemyAgent && isPlayerFirst && playerConfirmedAwaitingAI)) {
      return undefined;
    }
    let cancelled = false;
    (async () => {
      const ok = await holdClashForEnemyDeployRef.current('afterAnimation');
      if (cancelled || !ok) return;
      setPlayerConfirmedAwaitingAI(false);
      afterAgentsLockedRef.current();
    })();
    return () => {
      cancelled = true;
    };
  }, [gamePhase, selectedAgent, enemyAgent, isPlayerFirst, playerConfirmedAwaitingAI, enemyPlaceFx, enemyPlaceFxStyle]);

  // Trigger risoluzione battaglia (deve rieseguire quando enemyAgent viene impostato dopo il delay)
  useEffect(() => {
    // Nelle modalità a più posti il risultato arriva già calcolato dal controllore.
    if (multiSeatActiveRef.current) return;
    if (eminenceAnnounceHold || pendingEminenceDeals.length > 0 || (awaitingRevealParams && gamePhase === 'battle')) return;
    if (gamePhase === 'battle' && selectedAgent && enemyAgent) {
      const isGuidedDuelPaused =
        guidedMatch.active &&
        !guidedMatch.freePlay &&
        guidedIntroStage >= INTRO_STAGE_PLAY &&
        guidedPause === 'duel';
      if (isGuidedDuelPaused) return;
      resolveBattle();
    }
  }, [gamePhase, selectedAgent, enemyAgent, resolveBattle, guidedMatch.active, guidedMatch.freePlay, guidedIntroStage, guidedPause, eminenceAnnounceHold, awaitingRevealParams, pendingEminenceDeals]);

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
      // Log causale: LogPanel legge battleResult.events filtrati per revealAt/duelPhase.

      const effectCount = countDuelEffectSteps(battleResult.visualSteps);
      const phase3SubCount = countDuelPhase3SubSteps(battleResult);
      const postCount = countDuelPostEffectSteps(battleResult.visualSteps);
      // ogni passo dura l'animazione più un respiro; anche l'ultimo, prima della fase successiva
      const stepMs = effectStepPeriodMs(duelVfx);
      const bufferMs = duelVfx.effectPhaseBufferMs ?? DUEL_VISUAL_DEFAULTS.effectPhaseBufferMs;

      if (duelPhase === 1 && effectCount > 0) {
        if (visualEffectStep < effectCount) {
          const timer = setTimeout(() => advanceEffectStep(), stepMs);
          return () => clearTimeout(timer);
        }
        const timer = setTimeout(() => advanceDuelPhase(), stepMs + bufferMs);
        return () => clearTimeout(timer);
      }

      if (duelPhase === 3 && phase3SubCount > 1) {
        if (visualEffectStep < phase3SubCount) {
          const timer = setTimeout(() => advanceEffectStep(), stepMs);
          return () => clearTimeout(timer);
        }
        const timer = setTimeout(() => advanceDuelPhase(), stepMs + bufferMs);
        return () => clearTimeout(timer);
      }

      if (duelPhase === 5 && postCount > 0) {
        if (visualEffectStep < postCount) {
          const timer = setTimeout(() => advanceEffectStep(), stepMs);
          return () => clearTimeout(timer);
        }
        const timer = setTimeout(() => advanceDuelPhase(), stepMs + bufferMs);
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
  
  // Colori arcobaleno/diamante: clock esterno → solo i corpi risultato si aggiornano.
  useEffect(() => {
    const needsRainbow =
      battleResult &&
      Math.max(battleResult.playerFocusUsed || 0, battleResult.enemyFocusUsed || 0) >= 12;
    const active =
      gamePhase === 'result' && needsRainbow && duelPhase >= 2 && duelPhase < 4;
    if (!active) return undefined;
    startRainbowGlowClock({
      intervalMs: duelVfx.rainbowIntervalMs,
      step: duelVfx.rainbowStep,
    });
    return () => stopRainbowGlowClock({ reset: true });
  }, [gamePhase, duelPhase, battleResult, duelVfx.rainbowIntervalMs, duelVfx.rainbowStep]);

  // Risoluzione battaglia

  // Prossimo round
  const nextRound = () => {
    if (nextRoundInFlightRef.current) return;
    nextRoundInFlightRef.current = true;
    playGame(GAME_SOUND.ROUND_NEXT);

    // Se siamo in fase risultato e c'è un battleResult, attiva l'animazione clash delle carte
    if (gamePhase === 'result' && battleResult && duelPhase >= 4) {
      setShowClashAnimation(true);
      // Multiplayer: chi non c'è nello scontro dopo esce di scena durante la pausa.
      if (isMultiSeat && multiSeatQueue?.hasNext) {
        // posizioni di partenza per l'arrivo dello scontro dopo, prima che chi esce si muova
        multiSeatRectsRef.current = readMultiSeatRects();
        setMultiSeatLeaving(multiSeatQueue.transition?.leaves || null);
      }
      
      // Dopo l'animazione (1 secondo), procedi con il reset
      setTimeout(() => {
        setShowClashAnimation(false);
        proceedToNextRound();
      }, duelVfx.nextRoundClashHoldMs ?? scaleDuelMs(getDuelVisualConfig().nextRoundClashHoldMs));
      return;
    }
    
    // Se non siamo in fase risultato, procedi normalmente
    proceedToNextRound();
  };
  
  const proceedToNextRound = () => {
    if (spectateRef.current) {
      setIsZoomed(false);
      nextRoundInFlightRef.current = false;
      advanceSpectate();
      return;
    }
    if (isMultiSeat) {
      // con un altro scontro nel turno si resta nella vista del duello
      if (!multiSeatQueue?.hasNext) setIsZoomed(false);
      nextRoundInFlightRef.current = false;
      multiSeat.onScontroDone();
      return;
    }
    let handedOffToAdvance = false;
    try {
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
    }
    
    // Aggiorna HP dopo aver applicato la tossina
    setPlayerHP(currentPlayerHP);
    setEnemyHP(currentEnemyHP);
    
    // Aggiorna conqueredFields e cardBattleOutcomes ORA (dopo che l'utente ha visto il risultato)
    let updatedConqueredFields = { ...conqueredFields };
    if (battleResult && battleResult.fieldIndex !== undefined) {
      // Memorizza vincitore E armata: il vincitore per il conteggio vittoria, l'armata per la UI
      updatedConqueredFields[battleResult.fieldIndex] = (battleResult.fieldDestroyed || battleResult.skipConquest)
        ? { winner: null, destroyed: true }
        : {
            winner: battleResult.winner,
            army: battleResult.winnerArmy
          };
      setConqueredFields(updatedConqueredFields);
      
      // Esiti scoped per lato: stesso cardId su player e IA non devono condividere winner/loser
      if (battleResult.playerAgent && battleResult.enemyAgent) {
        const playerKey = battleOutcomeKey('player', battleResult.playerAgent.id);
        const enemyKey = battleOutcomeKey('enemy', battleResult.enemyAgent.id);
        setCardBattleOutcomes(prev => ({
          ...prev,
          [playerKey]: battleResult.winner === 'player' ? 'winner' : 'loser',
          [enemyKey]: battleResult.winner === 'enemy' ? 'winner' : 'loser'
        }));
      }
    }
    
    // Rivela campo nascosto se ce ne sono (il totale può essere <5 in campagna: fields per missione)
    if (revealedFields < battlefields.length) {
      setRevealedFields(prev => campaignDuelMod?.firstAct ? revealedAt(campaignDuelMod.revealRounds, roundNumber + 1) : prev + 1);
    }
    
    // Conta campi conquistati per giocatore (usa il vincitore effettivo, non l'armata)
    const playerFields = Object.values(updatedConqueredFields).filter(f => 
      (typeof f === 'object' && f?.winner === 'player') || (typeof f === 'string' && playerHand.some(c => c.army === f))
    ).length;
    const enemyFields = Object.values(updatedConqueredFields).filter(f => 
      (typeof f === 'object' && f?.winner === 'enemy') || (typeof f === 'string' && enemyHand.some(c => c.army === f))
    ).length;

    const annihilationOnly = gameMode === 'campaign' && campaignDuelMod?.winCondition === 'annihilation_only';
    const suspendGuidedTerritorialWin = guidedMatch.active && !guidedMatch.freePlay;
    
    // Check vittoria per campi conquistati (maggioranza: 3 su 5, 2 su 3, ...)
    // Classic e Bare Hands: SOLO nei round 1-4 (al round 5+ cambia in "Supremazia" / più PV)
    // REKLAMAZIONE: ai round 3 o 4, chi vince per campi può reclamare la vittoria o continuare a giocare
    const fieldsMajority = Math.floor(battlefields.length / 2) + 1;
    const canReclaim = (roundNumber === 3 || roundNumber === 4) && !suspendGuidedTerritorialWin;
    const skipTerritorialWin = forceContinueAfterClaimRef.current;
    const playerAvailable = playerHand.filter(c => !playerUsedCards.includes(c.id));
    const enemyAvailable = enemyHand.filter(c => !enemyUsedCards.includes(c.id));
    const matchClosing = currentPlayerHP <= 0 || currentEnemyHP <= 0
      || playerAvailable.length === 0 || enemyAvailable.length === 0
      || (
        !suspendGuidedTerritorialWin
        && !canReclaim
        && !skipTerritorialWin
        && roundNumber < 5
        && (playerFields >= fieldsMajority || enemyFields >= fieldsMajority)
      );
    if (matchClosing && isEminenceSubsystemEnabled(eminenceMatchState)) {
      const settled = settleEminenceMatch(eminenceMatchState, {
        finalPowerByCardId: battleResult?.playerAgent && battleResult?.enemyAgent
          ? { [battleResult.playerAgent.id]: battleResult.playerPower, [battleResult.enemyAgent.id]: battleResult.enemyPower }
          : null,
        finalPowerBySide: battleResult
          ? { player: battleResult.playerPower, enemy: battleResult.enemyPower }
          : null,
        agentIdBySide: battleResult?.playerAgent && battleResult?.enemyAgent
          ? { player: battleResult.playerAgent.id, enemy: battleResult.enemyAgent.id }
          : null,
      });
      setEminenceMatchState(settled.matchState);
      currentPlayerHP = Math.max(0, currentPlayerHP + readHpDelta(settled.bundle, 'player'));
      currentEnemyHP = Math.max(0, currentEnemyHP + readHpDelta(settled.bundle, 'enemy'));
      setPlayerHP(currentPlayerHP);
      setEnemyHP(currentEnemyHP);
    }
    const newPlayerHP = currentPlayerHP;
    const newEnemyHP = currentEnemyHP;
    if (telemetriaRef.current.inCorso && battleResult) {
      telemetriaRef.current.round.push(roundDuello({
        roundNumber,
        battleResult,
        isPlayerFirst,
        pvTu: newPlayerHP,
        pvAvversario: newEnemyHP,
        eminenze: { ...eminenceMatchState, enabled: isEminenceSubsystemEnabled(eminenceMatchState) },
      }));
    }
    if (campaignDuelMod?.firstAct) {
      const outcome = firstActMatchOutcome({ playerHP:newPlayerHP,enemyHP:newEnemyHP,playerFields,enemyFields,
        exhausted:playerAvailable.length===0||enemyAvailable.length===0,round:roundNumber,rule:campaignDuelMod.winRule,conquestEffect:battleResult?.resolvedField?.campaignEffect,duelWinner:battleResult?.winner,conquered:!battleResult?.skipConquest });
      if (outcome && !(outcome.claim && skipTerritorialWin)) {
        if (outcome.claim) setShowClaimVictoryChoice({winner:'player',playerFields,enemyFields});
        else { setGameResult({...outcome,playerFields,enemyFields}); setGamePhase('gameOver'); }
        return;
      }
      forceContinueAfterClaimRef.current = false;
      handedOffToAdvance = true;
      doResetAndNextRound(playerFields,enemyFields);
      return;
    }
    const blockTerritorialPlayerWin = annihilationOnly && newEnemyHP > 0;
    if (skipTerritorialWin) {
      forceContinueAfterClaimRef.current = false;
    } else if (!suspendGuidedTerritorialWin && roundNumber < 5) {
      if (playerFields >= fieldsMajority && !blockTerritorialPlayerWin) {
        if (canReclaim) {
          setShowClaimVictoryChoice({ winner: 'player', playerFields, enemyFields });
          return;
        }
        setGameResult({ winner: 'player', reason: 'fields', playerFields, enemyFields });
        setGamePhase('gameOver');
        return;
      }
      if (enemyFields >= fieldsMajority) {
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
    // Round 5+: niente vittoria per campi — decide Supremazia (PV) a carte esaurite
    
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
    
    handedOffToAdvance = true;
    doResetAndNextRound(playerFields, enemyFields);
    } finally {
      if (!handedOffToAdvance) {
        nextRoundInFlightRef.current = false;
      }
    }
  };

  // Spettatore con AUTO: a esito mostrato il duello successivo parte da solo.
  const nextRoundRef = useRef(nextRound);
  nextRoundRef.current = nextRound;
  useEffect(() => {
    if (!spectating || !spectateAuto || gamePhase !== 'result' || !battleResult || duelPhase < 4 || !duelHp.settled) return undefined;
    const t = setTimeout(() => nextRoundRef.current(), 2200);
    return () => clearTimeout(t);
  }, [spectating, spectateAuto, gamePhase, battleResult, duelPhase, duelHp.settled]);

  const advanceGuidedRoundState = (playerFields, enemyFields) => {
    const nextRoundNum = roundNumber + 1;
    if (roundAdvanceLockRef.current === nextRoundNum) {
      nextRoundInFlightRef.current = false;
      return;
    }
    roundAdvanceLockRef.current = nextRoundNum;

    setSelectedAgent(null);
    setSelectedFocus(1);
    setEnemyAgent(null);
    setEnemySelectedFocus(1);
    setCurrentFieldIndex(null);
    setBattleResult(null);
    setShowClashAnimation(false);
    ai.clearPendingDecision();
    aiThinkGenerationRef.current += 1;
    aiHasSelectedAgent.current = false;
    if (aiAgentThinkTimerRef.current) {
      clearTimeout(aiAgentThinkTimerRef.current);
      aiAgentThinkTimerRef.current = null;
    }
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

    setRoundNumber(nextRoundNum);
    setIsPlayerFirst(
      campaignDuelMod?.alwaysPlayerFirst ? true : resolveRoundInitiative({
        roundNumber: nextRoundNum,
        openingPlayerFirst,
        initiativeProfile: campaignDuelMod?.initiativeProfile ?? null,
      })
    );
    nextRoundInFlightRef.current = false;

    if (
      nextRoundNum === 5 &&
      playerFields < 3 &&
      enemyFields < 3 &&
      (gameMode === 'classic' || gameMode === 'bareHands')
    ) {
      r5VictoryTimersRef.current.forEach(clearTimeout);
      r5VictoryTimersRef.current = [];
      setVictoryCondFx('hold');
      // HUD visibile sotto l'overlay (niente fade-out di result) così si vede il flip condizione
      setGamePhase('selectField');
      setShowFinalRoundAnimation(true);
      r5VictoryTimersRef.current.push(
        setTimeout(() => setVictoryCondFx('reveal'), scaleDuelMs(DUEL_R5_VICTORY_FLIP_MS)),
        setTimeout(() => {
          setVictoryCondFx(null);
          setShowFinalRoundAnimation(false);
        }, scaleDuelMs(DUEL_OV_DUR.r5)),
      );
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
      nextRoundInFlightRef.current = false;
      return;
    }

    if (
      guidedMatch.active &&
      guidedMatch.trackId === 'advanced' &&
      roundNumber === 5
    ) {
      setGuidedIntroStage(ADV_STAGE_EPILOGUE);
      setGuidedHint('');
      nextRoundInFlightRef.current = false;
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

  // Solo con il server di sviluppo (mai nella build): comandi per i test automatici end-to-end
  // (es. due browser in multiplayer). Si aggiorna a ogni render, così le azioni non sono mai vecchie.
  useEffect(() => {
    if (!import.meta.env.DEV || typeof window === 'undefined') return;
    const lato = (st) => st && {
      eminenceId: st.eminenceId, presence: st.presence, selectedAbilityId: st.selectedAbilityId,
      revealedAbilityId: st.revealedAbilityId, selectedParams: st.selectedParams, setupCommitted: st.setupCommitted,
    };
    window.__satzeTest = {
      stato: () => ({
        gamePhase, roundNumber, isPlayerFirst, currentFieldIndex, revealedFields,
        playerHP, enemyHP, playerFocus, enemyFocus, selectedFocus,
        selectedAgent: selectedAgent?.id ?? null, enemyAgent: enemyAgent?.id ?? null,
        mano: (playerHand || []).filter((c) => !playerUsedCards.includes(c.id)).map((c) => c.id),
        campi: (battlefields || []).map((f) => f?.id ?? null), conquistati: conqueredFields,
        eminenze: eminenceMatchState?.enabled === false || !eminenceMatchState ? null : {
          player: lato(eminenceMatchState.player), enemy: lato(eminenceMatchState.enemy),
          gate: getNextGate(eminenceMatchState.gateProgress),
        },
        sceltaEminenza: {
          attesa: awaitingEminenceChoice, attesaParams: awaitingRevealParams,
          setup: Boolean(eminenceChoiceView.self?.setup?.pending),
          opzioni: (eminenceChoiceView.self?.options || []).map((o) => ({ id: o.id, selectable: o.selectable, paramsSchema: o.paramsSchema, timing: o.choiceParamsTiming })),
          setupSchema: eminenceChoiceView.self?.setup?.paramsSchema ?? null,
          selezionata: eminenceChoiceView.self?.selectedAbilityId ?? null,
        },
        affari: pendingEminenceDeals, affariRemoti: remoteEminenceDealsWaiting,
        reclamo: showClaimVictoryChoice, risultato: gameResult, log: (logs || []).slice(-6),
        codaEminenzeRemote: remoteEminenceQueue.map((m) => `${m.type}:r${m.roundNumber ?? '-'}:${m.abilityId ?? ''}`),
        roundEminenze: eminenceMatchState?.roundNumber ?? null,
        multi: multiSeat.isActive ? {
          stage: multiSeat.stage, kind: multiSeat.kind, online: multiSeat.isOnline,
          role: multiSeat.view?.role ?? null, round: multiSeat.view?.roundNumber ?? null,
          legalFields: multiSeat.view?.legalFields ?? null, claim: multiSeat.view?.claim ?? null,
          contestFieldIndex: multiSeat.view?.contestFieldIndex ?? null, result: multiSeat.view?.result ?? null,
        } : null,
        confermatoInAttesa: playerConfirmedAwaitingAI, annunci: eminenceNotices.length,
        guardiaAnnunci: Boolean(announcePointerGuard), bloccoEminenze: Boolean(eminenceBlocksMatch),
      }),
      campo: (idx) => handleFieldSelect(battlefields[idx]),
      agente: (id) => handleAgentSelect((playerHand || []).find((c) => c.id === id)),
      fc: (n) => setSelectedFocus(n),
      conferma: () => confirmPlayerChoice(),
      eminenza: (id, params) => confirmEminenceAbility(id, params ?? null),
      setup: (params) => confirmEminenceSetup(params),
      affare: (risposta) => confirmPendingEminenceDeal(risposta),
      prossimoRound: () => nextRound(),
      // chiude subito la partita con l'esito dato (prove del torneo senza giocare ogni duello)
      concludi: (winner) => { setGameResult({ winner, reason: 'hp' }); setGamePhaseRaw('gameOver'); },
      torneo: () => tournament,
      decidiReclamo: (d) => multiSeat.decideClaim(d),
      // Simula una caduta di rete: chiusura non intenzionale → riconnessione automatica.
      cadiConnessione: () => getMultiplayerManager().ws?.close(),
    };
  });

  const sendClaimDecisionRelay = useCallback(
    (decision, playerFields, enemyFields) => {
      if (!isOnlinePvP || !multiplayerSession?.roomCode) return;
      getMultiplayerManager().sendRelay(multiplayerSession.roomCode, {
        type: 'claim_decision',
        decision,
        roundNumber,
        playerFields,
        enemyFields,
        // PV dopo il round appena chiuso: chi riceve può essere ancora indietro di un round.
        playerHP,
        enemyHP,
      });
    },
    [isOnlinePvP, multiplayerSession?.roomCode, roundNumber, playerHP, enemyHP]
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
      const locali = countLocalFields();
      // Chi reclama ha già chiuso il round: i suoi conteggi (invertiti) sono quelli giusti,
      // quelli locali possono essere indietro di un round.
      const pf = typeof p.enemyFields === 'number' ? p.enemyFields : locali.pf;
      const ef = typeof p.playerFields === 'number' ? p.playerFields : locali.ef;
      setOpponentClaimPending(null);
      setShowClaimVictoryChoice(null);
      if (typeof p.enemyHP === 'number') setPlayerHP(p.enemyHP);
      if (typeof p.playerHP === 'number') setEnemyHP(p.playerHP);
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

  // Azioni della scena usate dal controllore delle modalità a più posti.
  multiSeatSceneRef.current = {
    // keepDuel: lo scontro dopo nello stesso turno, senza uscire dalla vista del duello.
    resetForProjection: ({ keepDuel = false } = {}) => {
      if (multiSeatStageTimerRef.current) {
        clearTimeout(multiSeatStageTimerRef.current);
        multiSeatStageTimerRef.current = null;
      }
      setSelectedAgent(null);
      setSelectedFocus(1);
      setEnemyAgent(null);
      setEnemySelectedFocus(1);
      setShowClashAnimation(false);
      if (!keepDuel) {
        setCurrentFieldIndex(null);
        setBattleResult(null);
        setIsZoomed(false);
      }
      ai.clearPendingDecision();
      aiThinkGenerationRef.current += 1;
      aiHasSelectedAgent.current = false;
      if (aiAgentThinkTimerRef.current) {
        clearTimeout(aiAgentThinkTimerRef.current);
        aiAgentThinkTimerRef.current = null;
      }
      setPlayerConfirmedAwaitingAI(false);
      nextRoundInFlightRef.current = false;
      setMultiSeatEntry({ player: null, enemy: null });
      setMultiSeatLeaving(null);
    },
    setGamePhase: (phase) => setGamePhase(phase),
    showOpponentDeploy: ({ agent, fieldIndex }) => {
      if (fieldIndex != null) setCurrentFieldIndex(fieldIndex);
      setEnemySelectedFocus(1);
      setEnemyAgent(agent);
    },
    // Uno scontro deciso dall'orchestratore: gli Agenti entrano in campo, poi la risoluzione.
    stageBattle: ({ result, playerAgent, enemyAgent: eAgent, playerFocus: pFocus, enemyFocus: eFocus, fieldIndex, entry = null }) => {
      setCurrentFieldIndex(fieldIndex);
      setSelectedFocus(pFocus);
      setEnemySelectedFocus(eFocus);
      setSelectedAgent(playerAgent);
      setEnemyAgent(eAgent);
      if (entry) {
        // Scontro dopo nello stesso turno: si resta nella vista del duello. Gli Agenti arrivano
        // dalla coda sfocata, restano o cambiano lato (playMultiSeatArrival), poi il duello.
        setMultiSeatEntry({ player: entry.player || null, enemy: entry.enemy || null });
        presentPrecomputedBattle(result);
        return;
      }
      setGamePhase('selectAgent');
      if (multiSeatStageTimerRef.current) clearTimeout(multiSeatStageTimerRef.current);
      // Come nel duello normale: lo scontro parte solo a ingresso finito (posa degli Agenti e
      // ingresso d'armata di entrambi i lati) più il secondo di scelta FC. Una nuova proiezione
      // (resetForProjection) cambia la generazione e annulla l'attesa.
      const generation = aiThinkGenerationRef.current;
      multiSeatStageTimerRef.current = setTimeout(() => {
        multiSeatStageTimerRef.current = null;
        void (async () => {
          const ok = await holdClashForEnemyDeployRef.current('afterAnimation');
          if (!ok || generation !== aiThinkGenerationRef.current) return;
          presentPrecomputedBattle(result);
        })();
      }, 0);
    },
    showGameOver: (result) => {
      setGameResult(result);
      setGamePhase('gameOver');
    },
    hint: (message) => addLog(message),
    // Online: l'host ha rifiutato la scelta (es. Campo già preso dal compagno) → si sceglie di nuovo.
    clearSelection: (phase) => {
      setSelectedAgent(null);
      setSelectedFocus(1);
      setPlayerConfirmedAwaitingAI(false);
      if (phase === 'selectField') setCurrentFieldIndex(null);
      if (phase) setGamePhase(phase);
    },
  };
  const multiSeatView = multiSeat.view;
  // Tasto a fine scontro: «Prossimo duello» se nel turno ne segue un altro.
  const multiSeatQueue = isMultiSeat ? multiSeatView?.scontroQueue || null : null;
  // Arrivo degli Agenti nello scontro dopo (vista del duello): dalle posizioni lette al clic.
  useLayoutEffect(() => {
    if (!isMultiSeat || gamePhase !== 'result' || !battleResult) return;
    if (!multiSeatEntry.player && !multiSeatEntry.enemy) return;
    const rects = multiSeatRectsRef.current;
    multiSeatRectsRef.current = null;
    playMultiSeatArrival(multiSeatEntry, rects);
  }, [isMultiSeat, gamePhase, battleResult, multiSeatEntry]);
  // Agenti in attesa visibili durante lo scontro (schieramento proiettato e risultato).
  const multiSeatWaitingShown = Boolean(multiSeatQueue) && (gamePhase === 'selectAgent' || gamePhase === 'result');
  const multiSeatContinue = (() => {
    if (!multiSeatQueue?.hasNext) return { label: 'Continua', note: null };
    const leaves = multiSeatQueue.transition?.leaves;
    const one = leaves && leaves.player !== leaves.enemy;
    return { label: 'Prossimo duello', note: one ? 'Premi Prossimo duello per scartare l’Agente sconfitto' : null };
  })();
  const multiSeatSeatName = (seatId) => multiSeatView?.seats?.find((s) => s.id === seatId)?.name || null;
  const multiSeatPlayerName = isMultiSeat ? multiSeatSeatName(multiSeatView?.projection?.playerSeatId) : null;
  const multiSeatEnemyName = isMultiSeat ? multiSeatSeatName(multiSeatView?.projection?.enemySeatId) : null;
  const multiSeatThreshold = isMultiSeat && multiSeatView?.threshold ? multiSeatView.threshold : null;
  // Anello centrale durante il ragionamento delle IA nelle modalità a più posti.
  const multiSeatStatus = (() => {
    const v = multiSeatView;
    if (!isMultiSeat || !v || v.stage === 'presenting' || v.stage === 'over') return null;
    const thinkingIds = Object.entries(v.thinkingSeats || {}).filter(([, st]) => st.status === 'thinking').map(([id]) => id);
    const names = thinkingIds.map((id) => multiSeatSeatName(id)).filter(Boolean).join(' e ');
    const task = thinkingIds.length ? v.thinkingSeats[thinkingIds[0]].task : '';
    if (v.revealing) {
      return { side: 'enemy', turnLabel: 'Rivelazione', kicker: 'Rivelazione', name: 'Piani scoperti', desc: 'Disposizione e investimenti' };
    }
    if (v.pendingConfirm) {
      return { side: 'player', turnLabel: 'Il compagno pensa', kicker: 'Compagno', name: 'Sta decidendo', desc: `${multiSeatSeatName(multiSeatView?.mate ?? 'A2')} sceglie la sua carta`, wait: 'Il compagno sta decidendo…' };
    }
    if (v.stage === 'aiTurn' && thinkingIds.length) {
      return { side: 'enemy', turnLabel: 'Turno avversario', name: thinkingIds.length > 1 ? 'Ragionano' : 'Ragiona', desc: names, wait: 'Gli avversari stanno pensando…' };
    }
    return null;
  })();
  // Piano del 2v2 quando risponde la tua squadra: sotto ogni carta, l'avversario del suo fronte.
  const multiSeatOpponentOf = {};
  if (multiSeatView?.fronts && multiSeatView.openingTeam === 'B') {
    for (const f of multiSeatView.fronts) {
      multiSeatOpponentOf[f.secondSeatId] = `contro ${multiSeatSeatName(f.firstSeatId)}`;
      multiSeatOpponentOf[f.firstSeatId] = `contro ${multiSeatSeatName(f.secondSeatId)}`;
    }
  }
  const enemyHandOverride = isMultiSeat && multiSeatHandView.enemy > 0
    ? multiSeat.handViewFor(multiSeat.handSeats.enemy[multiSeatHandView.enemy], 'enemy')
    : null;
  const playerHandOverride = isMultiSeat && multiSeatHandView.player > 0
    ? multiSeat.handViewFor(multiSeat.handSeats.player[multiSeatHandView.player], 'player')
    : null;
  // Campi scelti in questo turno del 2v2 (anche la proposta del compagno), per la lista dei Campi.
  const multiSeatFieldClaims = {};
  if (isMultiSeat && multiSeatView?.board) {
    const b = multiSeatView.board;
    const add = (idx, claim) => {
      if (!Number.isInteger(idx)) return;
      (multiSeatFieldClaims[idx] ||= []).push(claim);
    };
    for (const e of b.player) {
      const idx = e.isMe ? (e.fieldIndex ?? (b.myOpening ? currentFieldIndex : null)) : e.fieldIndex;
      add(idx, { key: e.seatId, side: 'ally', label: e.isMe ? 'Tu' : e.name, tentative: !e.locked && !e.isMe });
    }
    for (const e of b.enemy) add(e.fieldIndex, { key: e.seatId, side: 'foe', label: e.name, tentative: !e.locked });
  }
  const fieldsScrollable = battlefields.length > 5;
  const updateFieldsScrollHint = useCallback(() => {
    const el = fieldsScrollRef.current;
    if (!el) return;
    const rowH = el.firstElementChild?.getBoundingClientRect().height || 52;
    const hiddenPx = el.scrollHeight - el.clientHeight - el.scrollTop;
    setFieldsBelow(hiddenPx > 4 ? Math.max(1, Math.round(hiddenPx / (rowH + 2))) : 0);
  }, []);
  useEffect(() => {
    if (!fieldsScrollable) { setFieldsBelow(0); return undefined; }
    updateFieldsScrollHint();
    const el = fieldsScrollRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(updateFieldsScrollHint);
    ro.observe(el);
    return () => ro.disconnect();
  }, [fieldsScrollable, battlefields.length, gamePhase, updateFieldsScrollHint]);
  const mpSelfLabel = isOnlinePvP ? (multiplayerSession?.playerName || 'Tu') : spectating ? spectate.names.a : (multiSeatPlayerName || 'TU');
  const mpEnemyLabel = isOnlinePvP ? (onlinePeerName || 'Avversario') : spectating ? spectate.names.b : (multiSeatEnemyName || 'IA');
  const mpSelfHandLabel = isOnlinePvP ? (multiplayerSession?.playerName || 'Tu') : 'La Tua Mano';
  const mpEnemyHandLabel = isOnlinePvP ? (onlinePeerName || 'Avversario') : 'Mano Avversario';

  // ============================================
  // RENDER
  // ============================================

  // Ogni schermata passa dalla cache: quelle conservabili restano montate e nascoste quando
  // si esce, così tornandoci non si ricostruiscono (vedi ScreenCacheHost). Le altre, legate
  // allo stato della partita, si smontano come prima.
  const screen = (key, cacheable, element) => (
    <ScreenCacheHost screenKey={key} cacheable={cacheable}>
      {element}
    </ScreenCacheHost>
  );

  // Scelta slot salvataggio campagna
  if ((campaignPersistenceError || campaignOutcomeError) && campaignDuelMod?.firstAct && gamePhase !== 'campaignHub' && gamePhase !== 'menu') {
    return screen('campaignError', false, <div role="alert" style={{padding:32,color:'white',background:'#211',minHeight:'100vh'}}><p>{campaignPersistenceError || campaignOutcomeError}</p><button onClick={()=>setGamePhaseRaw('campaignHub')}>Torna alla campagna salvata</button></div>);
  }

  if (gamePhase === 'campaignSlots') {
    return (
      screen('campaignSlots', true, <CampaignSaveSlots
        onBack={() => setGamePhase('menu')}
        onSlotChosen={(slotIndex) => {
          campaignAssetsSlotRef.current = null;
          setCampaignEntryRun(loadCampaignRun(slotIndex, CAMPAIGN_ACT));
          setCampaignSaveSlot(slotIndex);
          setGamePhase('campaignLoading');
        }}
      />)
    );
  }

  if (gamePhase === 'campaignLoading') {
    return screen('campaignLoading', false, <CampaignDuelPreload run={campaignEntryRun} onComplete={()=>{
      campaignAssetsSlotRef.current = campaignSaveSlot;
      setGamePhase('campaignHub');
    }}/>);
  }

  // Schermata Campagna — il cammino verso Cael (prototipi/campagna-cael) aperto sullo stesso slot
  if (gamePhase === 'campaignHub') {
    return (
      screen('campaignHub', false, <div className="relative w-full h-full min-h-full" style={{ position: 'absolute', inset: 0, width: 1920, height: 1080 }}>
        <CampaignPrototypeFrame
          campaignSaveSlot={campaignSaveSlot}
          onStartMission={startCampaignMission}
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
      </div>)
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
    const openPerfectFocusLab = () => {
      const url = new URL(window.location.href);
      url.searchParams.set('perfectFocusLab', '1');
      window.location.href = url.toString();
    };
    const openEminenceArtLab = () => {
      const url = new URL(window.location.href);
      url.searchParams.set('eminenceArtLab', '1');
      window.location.href = url.toString();
    };
    const openEminenceSystemLab = () => {
      const url = new URL(window.location.href);
      url.searchParams.set('eminenceSystemLab', '1');
      window.location.href = url.toString();
    };
    const openDuelLayoutLab = () => {
      const url = new URL(window.location.href);
      url.searchParams.set('duelLayoutLab', '1');
      window.location.href = url.toString();
    };
    const openTeamBoardLab = () => {
      const url = new URL(window.location.href);
      url.searchParams.set('teamBoardLab', '1');
      window.location.href = url.toString();
    };
    const openCardFaceLab = () => {
      const url = new URL(window.location.href);
      url.searchParams.set('cardFaceLab', '1');
      window.location.href = url.toString();
    };
    const openVersusLab = () => {
      const url = new URL(window.location.href);
      url.searchParams.set('vsLab', '1');
      window.location.href = url.toString();
    };
    /** Lab delle animazioni carta: vista per armata (su un'armata) o tutti gli effetti (su un effetto). */
    const openCardFxLab = ({ fxId = null, army = null } = {}) => {
      const url = new URL(window.location.href);
      url.searchParams.set('cardFxLab', '1');
      if (fxId) url.searchParams.set(FX_LAB_PARAM, fxId);
      else url.searchParams.delete(FX_LAB_PARAM);
      if (army) url.searchParams.set(FX_LAB_ARMY_PARAM, army);
      else url.searchParams.delete(FX_LAB_ARMY_PARAM);
      window.location.href = url.toString();
    };
    /** Per ogni armata: quale ingresso e quale sconfitta ha già (dal catalogo leggero). */
    const cardFxArmyChoices = Object.keys(ARMY_COLORS).map((army) => {
      const entries = FX_CATALOG.filter((fx) => fx.army === army && fx.role === 'entry');
      const defeat = FX_CATALOG.find((fx) => fx.army === army && fx.role === 'defeat');
      return {
        label: armyMenuLabel(army),
        sub: entries.length > 1 ? `${entries.length} INGRESSI + SCONFITTA` : entries.length ? 'INGRESSO + SCONFITTA' : 'INGRESSO DA FARE',
        meta: `INGRESSO ${entries.length ? entries.map((fx) => fx.label.toUpperCase()).join(' / ') : '—'} · SCONFITTA ${defeat ? defeat.label.toUpperCase() : '—'}`,
        onClick: () => openCardFxLab({ army }),
      };
    });
    const launchArenaContesa = (playerArmy) => {
      const url = new URL(window.location.href);
      url.searchParams.set('arenaContesa', '1');
      if (playerArmy) url.searchParams.set('army', playerArmy);
      else url.searchParams.delete('army');
      window.location.href = url.toString();
    };
    const arenaContesaArmyMenuChoices = Object.keys(ARMY_SETS).map((playerArmy) => ({
      label: armyMenuLabel(playerArmy),
      sub: 'TU',
      meta: 'GIOCA CONTESA',
      onClick: () => launchArenaContesa(playerArmy),
    }));
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
        meta: 'VS IA · FORMATO IN SEGUITO',
        accent: MENU_ACCENTS.pink,
        onClick: () => { setTournamentSetup(false); setSelectedMode('classic'); setIsMultiplayer(false); setCampaignLevel(null); setGamePhaseFromMainMenu('selectArmy'); },
      },
      {
        label: 'TORNEO',
        sub: tournament ? 'IN CORSO' : 'NUOVO',
        meta: '12 ARMATE · VS IA · AL MEGLIO DELLE 3',
        accent: MENU_ACCENTS.pink,
        onClick: () => {
          setSelectedMode('classic');
          setIsMultiplayer(false);
          setCampaignLevel(null);
          if (tournament) {
            setTournamentSetup(false);
            setGamePhaseFromMainMenu('tournamentHub');
          } else {
            setTournamentSetup(true);
            setGamePhaseFromMainMenu('selectArmy');
          }
        },
      },
      { label: 'CAMPAGNA', sub: 'STORIA', meta: 'SLOT SALVATAGGIO', accent: MENU_ACCENTS.magenta, onClick: () => { setTournamentSetup(false); setGamePhaseFromMainMenu('campaignSlots'); } },
      { label: 'MULTIPLAYER', sub: 'ONLINE', meta: 'LOBBY · BETA', accent: MULTIPLAYER_ACCENT, onClick: () => { setTournamentSetup(false); setSelectedMode('multiplayer'); setIsMultiplayer(true); setCampaignLevel(null); setGamePhaseFromMainMenu('multiplayerLobby'); } },
      { label: 'GESTIONE ESERCITI', sub: 'ESERCITO', meta: 'LISTA / BUILDER', onClick: () => { setEditingDeckId(null); setDeckManagerSource('menu'); setDeckManagerView('list'); setShowDeckManager(false); setGamePhaseFromMainMenu('deckManager'); } },
      { label: 'STORICO PLAYTEST', sub: 'DATI', meta: 'MATCH · EXPORT CSV', onClick: () => setGamePhaseFromMainMenu('playtestHistory') },
      { label: 'OPZIONI', sub: 'SISTEMA', meta: 'VIDEO', onClick: () => setGamePhaseFromMainMenu('options') },
      { label: 'TUTORIAL', sub: 'GUIDA', meta: '3 PERCORSI', accent: TUTORIAL_ACCENT, onClick: openTutorialSelector },
      { label: 'MANUALE', sub: 'LIBRETTO', meta: 'ISTRUZIONI · ANCHE IN PDF', accent: TUTORIAL_ACCENT, onClick: () => setGamePhaseFromMainMenu('manual') },
      { label: 'GALLERIA', sub: 'ARCHIVIO', meta: 'CARTE · EMINENZE · CAMPI', onClick: () => setGamePhaseFromMainMenu('gallery') },
      {
        label: 'STRUMENTI DEV',
        sub: 'LAB',
        meta: 'CLIC · POI SCEGLI LO STRUMENTO',
        accent: '#94a3b8',
        choices: [
          { label: 'STYLE LAB', sub: 'UI', meta: 'EXPERIMENTS', onClick: openStyleLab },
          { label: 'DUEL LAYOUT LAB', sub: 'SKIN', meta: 'ALT ART · STY', onClick: openDuelLayoutLab },
          { label: 'TAVOLO 2V2 LAB', sub: 'LAYOUT', meta: 'QUATTRO CARTE · VERSIONI', onClick: openTeamBoardLab },
          { label: 'CARD FACE LAB', sub: 'CARTA', meta: 'ELDRITCH', onClick: openCardFaceLab },
          { label: 'VS LAB', sub: 'DUELLO', meta: 'INGRESSO · ESERCITI', onClick: openVersusLab },
          {
            label: 'ANIMAZIONI CARTA',
            sub: 'VFX',
            meta: 'INGRESSO · SCONFITTA · ARMATE',
            choices: [
              { label: 'PER ARMATA', sub: `${cardFxArmyChoices.length} ARMATE`, meta: 'INGRESSO + SCONFITTA', choices: cardFxArmyChoices },
              {
                label: 'TUTTI GLI EFFETTI',
                sub: `${FX_CATALOG.length} EFFETTI`,
                meta: 'GENERALI + ARMATE',
                choices: FX_CATALOG.map((fx) => ({
                  label: fx.label.toUpperCase(),
                  sub: fx.role === 'defeat' ? 'SCONFITTA' : fx.role === 'entry' || fx.kind === 'in' ? 'INGRESSO' : 'USCITA',
                  meta: fx.army ? fx.army.toUpperCase() : 'GENERALE',
                  onClick: () => openCardFxLab({ fxId: fx.id }),
                })),
              },
            ],
          },
          { label: 'OVERDRIVE LAB', sub: 'VFX', meta: 'ANTEPRIMA FC', onClick: openOverdriveLab },
          { label: 'PERFECT FC LAB', sub: 'VFX', meta: 'STAMP DUELLO', onClick: openPerfectFocusLab },
          { label: 'EMINENCE LAB', sub: 'DUELLO', meta: 'FORMA · CARTA', onClick: openEminenceArtLab },
          { label: 'EMINENCE SYSTEM', sub: 'PIPELINE', meta: 'STANDARD · TIMING', onClick: openEminenceSystemLab },
          {
            label: 'ARENA CONTESA',
            sub: 'GIOCA',
            meta: 'FFA · ARMATA',
            choices: arenaContesaArmyMenuChoices,
          },
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
    const menuItemsResolved = shouldShowMainMenuQuit()
      ? [
          ...menuItems,
          {
            label: 'ESCI DAL GIOCO',
            sub: 'DESKTOP',
            meta: 'CHIUDI APPLICAZIONE',
            accent: '#64748b',
            onClick: () => {
              void confirmQuitDesktopGame();
            },
          },
        ]
      : menuItems;
    return (
      screen('menu', true, <div className="relative w-full h-full min-h-full" style={{ minHeight: '100%' }}>
        {!showDeckManager && (
          <SatzeMenuPrototype
            menuItems={menuItemsResolved}
            buildLabel={IS_PUBLIC_PLAYTEST_BUILD ? PUBLIC_BUILD_MARQUEE : undefined}
            inputLocked={isTutorialSelectorOpen || tutorial.isActive || chiediNomeGiocatore}
          />
        )}
        {chiediNomeGiocatore && <NomeGiocatoreModal onFatto={() => setChiediNomeGiocatore(false)} />}

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
        
      </div>)
    );
  }

  if (gamePhase === 'tournamentHub') {
    if (!tournament) {
      return screen('tournamentHub', false, <div style={{ padding: 32, color: 'white' }}><button type="button" onClick={() => setGamePhase('menu')}>Nessun torneo in corso — torna al menù</button></div>);
    }
    const startNewTournament = () => {
      if (tournament.online) { tnOnlineRef.current.leave(); return; }
      storeTournament(null);
      setTournamentSetup(true);
      setSelectedMode('classic');
      setIsMultiplayer(false);
      setCampaignLevel(null);
      runCurtain({ label: 'NUOVO TORNEO', kicker: 'FASE I · SCHIERAMENTO' }, () => setGamePhase('selectArmy'));
    };
    return (
      screen('tournamentHub', false, <TournamentHubScreen
        tournament={tournament}
        busy={tournamentBusy}
        online={tournament.online ? { isHost: multiplayerSession?.role === 'host', waiting: tournamentWaiting } : null}
        onPlay={playTournamentGame}
        onWatch={watchTournamentSeries}
        onConcludeRound={concludeTournamentRound}
        onMenu={() => {
          if (tournament.online) {
            if (window.confirm("Vuoi uscire dal torneo online? Il tuo esercito passerà a un'IA.")) tnOnlineRef.current.leave();
            return;
          }
          setGamePhase('menu');
        }}
        onNewTournament={startNewTournament}
        onAbandon={() => {
          if (tournament.online) {
            if (window.confirm("Vuoi abbandonare il torneo online? Il tuo esercito passerà a un'IA.")) tnOnlineRef.current.leave();
            return;
          }
          if (!window.confirm('Vuoi davvero abbandonare il torneo? Il tabellone andrà perso.')) return;
          storeTournament(null);
          setGamePhase('menu');
        }}
      />)
    );
  }

  if (gamePhase === 'playtestHistory') {
    return (
      screen('playtestHistory', true, <PlaytestHistoryScreen onClose={() => setGamePhase('menu')} />)
    );
  }

  if (gamePhase === 'manual') {
    return (
      screen('manual', false, <ManualBook onClose={() => setGamePhase('menu')} />)
    );
  }

  if (gamePhase === 'options') {
    return (
      screen('options', true, <OptionsScreen onClose={() => setGamePhase('menu')} />)
    );
  }

  if (gamePhase === 'deckManager') {
    return (
      screen('deckManager', false, <div className="relative w-full h-full min-h-full" style={{ minHeight: '100%' }}>
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
      </div>)
    );
  }

  // Multiplayer Lobby
  if (gamePhase === 'multiplayerLobby') {
    return (
      screen('multiplayerLobby', false, <MultiplayerLobby
        onStartGame={(gameData) => {
          setOnlineOpponentLeft(false);
          setMpConnectionLost(false);
          setMpOpponentAway(false);
          setMpReconnectError('');
          onlineMatchStartedRef.current = false;
          setPendingGuestMatch(null);
          setIncomingPeerMoveQueue([]);
          setOnlineLocalReady(false);
          setOnlinePeerDeck(null);
          setOnlinePeerName(null);
          setOnlineRematchActive(false);
          setOpponentClaimPending(null);
          setIncomingClaimDecision(null);
          forceContinueAfterClaimRef.current = false;
          setOnlineReadies({});
          setOnlineMembers([]);
          setMultiplayerSession({
            roomCode: gameData.roomCode,
            slot: gameData.slot ?? (gameData.role === 'host' ? 0 : 1),
            capacity: gameData.capacity ?? 2,
            role: gameData.role,
            playerName: gameData.playerName,
            playerId: gameData.playerId,
            reconnectSecret: gameData.reconnectSecret,
          });
          setGamePhase('selectArmy');
        }}
        onClose={() => {
          cleanupMultiplayerSession();
          setGamePhase('menu');
        }}
      />)
    );
  }

  // Opzione eserciti personalizzati (usata in selectArmy, selectDeck)
  const MIXED_DECKS_OPTION = 'Eserciti personalizzati';
  const MIXED_DECKS_COLOR = '#a78bfa'; // violet-400

  // Durante la transizione post-difficoltà resta visibile la schermata esercito sotto l'iris (portal).

  // Schermata Selezione Armata (la campagna non passa più di qui: lancio diretto dall'hub)
  if (gamePhase === 'selectArmy') {
    const availableArmies = Object.keys(ARMY_SETS);
    return (
      screen('selectArmy', true, <ArmySelectCinematic
        entry={armyDeckHandoff?.from === 'deck' ? 'handoff' : 'intro'}
        initialArmy={armyDeckHandoff?.from === 'deck' ? armyDeckHandoff.army : undefined}
        onSelect={(armyName) => {
          if (armyName == null) {
            setArmyDeckHandoff({ from: 'army', army: null });
            setSelectedArmy(MIXED_DECKS_OPTION);
            setGamePhase('selectDeck');
            return;
          }
          selectArmyAndContinue(armyName);
        }}
        onBack={() => {
          setCampaignLevel(null);
          if (multiplayerSession && selectedMode === 'multiplayer') {
            if (selectedArmy && selectedDeckKey) {
              setOnlineLocalReady(false);
              setGamePhase('onlineDeckReady');
              return;
            }
            cleanupMultiplayerSession();
            setSelectedArmy(null);
            setSelectedDeckKey(null);
            setGamePhase('menu');
            return;
          }
          setSelectedArmy(null);
          setSelectedDeckKey(null);
          setGamePhase(selectedMode === 'campaign' ? 'campaignHub' : 'menu');
        }}
      />)
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
    // dentro il canvas di gioco (scalato con lui), sopra la scelta esercito
    const difficultyPopupEl = showDifficultyPopup
      ? (
          <DifficultySelectPopup
            isOpen
            armyName={selectedArmy}
            deckName={resolveSelectedDeckName()}
            accentColor={colors.accent}
            initialMode={selectedMode}
            excludeArmy={isMixedMode ? null : selectedArmy}
            tournament={tournamentSetup}
            onClose={() => setShowDifficultyPopup(false)}
            onSelect={(choice) => {
              if (tournamentSetup) {
                // Torneo: l'esercito scelto resta bloccato, si passa al tabellone.
                const customId = typeof selectedDeckKey === 'string' && selectedDeckKey.startsWith('custom_') ? selectedDeckKey.replace('custom_', '') : null;
                const playerCardIds = customId ? loadCustomDecks()[customId]?.cards : ARMY_DECKS[selectedArmy]?.[selectedDeckKey]?.cards;
                setShowDifficultyPopup(false);
                clearCardPreview();
                multiSeat.cancel();
                try {
                  storeTournament(createTournamentForPlayer({
                    playerArmy: selectedArmy,
                    playerDeckKey: selectedDeckKey,
                    playerDeckName: resolveSelectedDeckName(),
                    playerCardIds: playerCardIds || [],
                    settings: { difficulty: choice.difficulty, mode: choice.mode, eminenceFormat: choice.eminenceFormat, formatId: choice.formatId },
                  }));
                } catch (err) {
                  console.error('[Torneo] iscrizione fallita:', err);
                  window.alert(`Impossibile avviare il torneo: ${err.message}`);
                  return;
                }
                setTournamentSetup(false);
                setSelectedMode(choice.mode);
                runCurtain({ label: 'TORNEO', kicker: 'TABELLONE', accent: colors.accent }, () => setGamePhase('tournamentHub'));
                return;
              }
              // INIZIA: si passa subito al VS; la scatola dell'esercito scelto vola da qui
              // al suo posto e la ruota sorteggia l'avversario mentre il duello si carica.
              armVersusHandoff(document.querySelector('.dsk .dsk-tk.is-center')?.getBoundingClientRect() ?? null);
              setShowDifficultyPopup(false);
              clearCardPreview();
              setSelectedMode(choice.mode);
              // la scelta esercito si smonta a pezzi attorno alla scatola, poi parte l'avvio
              setDeckLaunching(true);
              setVsChosenEnemyArmy(choice.enemyArmy ?? null);
              // Modalità a più posti: le IA sono scelte subito; il primo avversario è il lato
              // enemy della distribuzione del duello.
              let multiSeatEnemy = null;
              if (choice.matchMode === MULTI_SEAT_KINDS.TEAM || choice.matchMode === MULTI_SEAT_KINDS.KOTH) {
                multiSeatEnemy = multiSeat.arm({
                  kind: choice.matchMode,
                  teammatePreset: choice.teammatePreset,
                  players: choice.players,
                  difficulty: choice.difficulty,
                  fieldMode: choice.mode,
                  humanArmy: selectedArmy,
                });
              } else {
                multiSeat.cancel();
              }
              const start = () => startStandardGameRef.current(
                selectedArmy,
                selectedDeckKey,
                choice.mode,
                choice.difficulty,
                ALL_BATTLEFIELDS,
                multiSeatEnemy?.enemyArmy ?? choice.enemyArmy ?? null,
                multiSeatEnemy?.enemyDeckKey ?? null,
                null,
                { eminenceFormat: choice.eminenceFormat }
              );
              window.setTimeout(() => {
                start();
                setDeckLaunching(false);
              }, DECK_LAUNCH_MS);
            }}
          />
        )
      : null;
    const customDecks = loadCustomDecks();
    // Armate: solo mazzi base. Eserciti personalizzati: tutti i mazzi creati dall'utente.
    const customDecksForArmy = isMixedMode ? Object.entries(customDecks) : [];
    const predefinedDecks = isMixedMode ? {} : ARMY_DECKS[selectedArmy];
    const deckOptions = [];
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
      const deckCards = resolveDeckCards(deck, ARMY_SETS);
      const totalLeague = deckCards.reduce((sum, c) => sum + c.league, 0);
      const deckMixed = isMixedDeck(deck, ARMY_SETS);
      const { accent: deckAccent, armies: deckArmies } = getDeckVisualMeta(deckCards, {
        fallbackArmy: deck.army || selectedArmy,
        armyColors: ARMY_COLORS,
        fallbackAccent: deckMixed ? MIXED_DECKS_COLOR : ((ARMY_COLORS[deck.army] || {}).accent || MIXED_DECKS_COLOR),
      });
      deckOptions.push({
        key: `custom_${deckId}`,
        name: deck.name,
        armyLabel: deckMixed && deckArmies.length >= 2
          ? deckArmies.join(' · ')
          : (deck.army || 'Personalizzato'),
        description: deck.description || 'Esercito personalizzato',
        meta: `${deck.cards.length} carte • Lega ${totalLeague}/30`,
        accent: deckAccent,
        onSelect: () => {
          setSelectedDeckKey(`custom_${deckId}`);
          goAfterDeckSelection(`custom_${deckId}`);
        },
      });
    });

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
        screen('selectDeck', true, <>
          <DeckSelectCinematic
          launching={deckLaunching}
          entry={armyDeckHandoff?.from === 'army' ? 'handoff' : 'intro'}
          armyName={isMixedMode ? null : selectedArmy}
          gameDeckOptions={deckOptions}
          selectedArmy={selectedArmy}
          isMixedMode={isMixedMode}
          campaignDeckIds={null}
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
            runCurtain(
              { accent: colors.accent, label: 'SCEGLI LA TUA ARMATA', kicker: 'FASE I · SCHIERAMENTO', dir: 'back' },
              () => {
                setShowDifficultyPopup(false);
                setArmyDeckHandoff({ from: 'deck', army: isMixedMode ? null : selectedArmy });
                setSelectedArmy(null);
                setSelectedDeckKey(null);
                setGamePhase('selectArmy');
              }
            );
          }}
          onPreviewDeck={(deck) => {
            const payload = buildDeckPreviewPayload(deck, { selectedArmy });
            runCurtain({ accent: payload.accentColor, label: payload.name, kicker: 'ANTEPRIMA ESERCITO' }, () => {
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
            });
          }}
        />
          {difficultyPopupEl}
        </>)
      );
    }

    return (
      screen('selectDeckList', false, <>
        {difficultyPopupEl}
        <CosmicScreenLayout
        title={selectedArmy}
        subtitle={isMixedMode ? 'I tuoi eserciti creati' : 'Scegli il tuo esercito'}
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
        {campaignLevel && !isMixedMode && (
          <p className="text-center text-slate-400 text-sm mb-2 max-w-lg mx-auto">
            Nessun esercito precostruito disponibile. Gli eserciti creati da te sono in &quot;Eserciti personalizzati&quot;.
          </p>
        )}
        {isMixedMode && customDecksForArmy.length === 0 && (
          <div className="text-center text-slate-400 mb-2">
            Nessun esercito personalizzato. Creane uno da &quot;Gestione Eserciti&quot;.
          </div>
        )}
      </CosmicScreenLayout>
      </>)
    );
  }

  if (gamePhase === 'previewDeck' && previewDeckData) {
    const previewIsCustom = Boolean(previewDeckData?.id?.startsWith?.('custom_'));
    return (
      screen('previewDeck', false, <div style={{ position: 'absolute', inset: 0, zIndex: 50, background: MENU_ACCENTS.void }}>
        <DeckPreviewCosmic
          deck={previewDeckData}
          onBack={() => {
            runCurtain(
              { accent: previewDeckData.accentColor, label: "SCEGLI L'ESERCITO", kicker: 'FASE II · ARRUOLAMENTO', dir: 'back' },
              () => {
                setPreviewDeckData(null);
                setGamePhase('selectDeck');
              }
            );
          }}
          onEdit={previewIsCustom ? (d) => {
            if (d?.id && d.id.startsWith('custom_')) {
              setPreviewDeckData(null);
              setEditingDeckId(d.id.replace('custom_', ''));
              setDeckManagerSource('selectDeck');
              setDeckManagerView('builder');
              setShowDeckManager(false);
              setGamePhase('deckManager');
            }
          } : null}
          onConfirm={(d) => {
            setPreviewDeckData(null);
            d?._opt?.onSelect?.();
          }}
        />
      </div>)
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
        ...(deck.name ? { deckName: deck.name } : {}),
        ...(deckCardIds.length ? { deckCardIds } : {}),
        ...(deck.coverCardId != null && deckCardIds.includes(deck.coverCardId) ? { coverCardId: deck.coverCardId } : {}),
      };
      getMultiplayerManager().sendRelay(multiplayerSession.roomCode, relayPayload);
    };

    const mySlot = multiplayerSession.slot ?? (multiplayerSession.role === 'host' ? 0 : 1);
    const onlineRoomMembers = (onlineMembers.length ? onlineMembers : [{ slot: mySlot, name: multiplayerSession.playerName, connected: true }])
      .map((m) => {
        const pronto = m.slot === mySlot ? (onlineLocalReady ? { deckName: deck.name } : null) : onlineReadies[m.slot];
        return { ...m, ready: Boolean(pronto), deckName: pronto?.deckName ?? null };
      });
    const isMultiMode = onlineMode !== 'duel';
    const membriConnessi = onlineRoomMembers.filter((m) => m.connected !== false);
    const tuttiPronti = membriConnessi.length >= 2 && membriConnessi.every((m) => m.ready);
    const avviaMultiOnline = () => {
      if (!tuttiPronti || multiplayerSession.role !== 'host') return;
      const formato = MATCH_FORMATS[onlineFormatId] || MATCH_FORMATS.noEminence;
      const resolved = resolveDeckCardsForArmy(selectedArmy, selectedDeckKey);
      if (onlineMode === 'tournament') {
        // Torneo: i giocatori pronti entrano nel tabellone con l'esercito scelto, bloccato.
        const umani = [
          { slot: mySlot, name: multiplayerSession.playerName || 'Host', army: selectedArmy, deckKey: selectedDeckKey, deckName: deck.name, cardIds: resolved.map((c) => c.id) },
          ...membriConnessi.filter((m) => m.slot !== mySlot).map((m) => {
            const r = onlineReadies[m.slot] || {};
            return { slot: m.slot, name: r.playerName || m.name, army: r.army, deckKey: r.deckKey, deckName: r.deckName || 'Esercito', cardIds: r.deckCardIds || [] };
          }),
        ];
        try {
          tnOnlineRef.current.start(umani, {
            difficulty: onlineDifficulty,
            mode: formato.mode === 'bareHands' ? 'bareHands' : 'classic',
            eminenceFormat: formato.eminenceFormat,
            formatId: formato.id,
          });
        } catch (err) {
          console.error('[Torneo online] avvio fallito:', err);
          window.alert(`Impossibile avviare il torneo: ${err.message}`);
        }
        return;
      }
      const readies = [
        { slot: mySlot, name: multiplayerSession.playerName || 'Host', army: selectedArmy, deckKey: selectedDeckKey, deckCardIds: resolved.map((c) => c.id) },
        ...membriConnessi.filter((m) => m.slot !== mySlot).map((m) => {
          const r = onlineReadies[m.slot] || {};
          return { slot: m.slot, name: r.playerName || m.name, army: r.army, deckKey: r.deckKey, deckCardIds: r.deckCardIds || [] };
        }),
      ];
      const seed = (Date.now() ^ (Math.random() * 0x7fffffff)) >>> 0;
      const pkg = buildMatchPackage({
        kind: onlineMode,
        fieldMode: formato.mode === 'bareHands' ? 'bareHands' : 'classic',
        players: onlinePlayers,
        difficulty: onlineDifficulty,
        teammatePreset: 'equilibrato',
      }, readies, seed);
      getMultiplayerManager().sendRelay(multiplayerSession.roomCode, { type: MULTI_MS.START, pkg });
      startMultiOnline(pkg);
    };

    /** Entrambi hanno inviato deck_ready: non siamo "in attesa dell'avversario" ma in sincronizzazione avvio. */
    const bothOnlineDeckReady = onlineLocalReady && !!onlinePeerDeck;
    const onlineReadyButtonLabel = !onlineLocalReady
      ? 'Pronto'
      : onlineMode !== 'duel'
        ? 'Pronto ✓'
        : bothOnlineDeckReady
          ? 'Avvio partita…'
          : "In attesa dell'avversario…";

    return (
      screen('onlineDeckReady', false, <OnlineRoomScreen
        title={onlineRematchActive ? 'Rematch online' : 'Partita online'}
        roomCode={multiplayerSession.roomCode}
        deckName={deck.name}
        roleLabel={multiplayerSession.role === 'host' ? 'HOST' : 'OSPITE'}
        hint={isMultiMode
          ? (multiplayerSession.role === 'host' ? 'Quando tutti sono pronti, premi «Avvia partita».' : "Premi Pronto: la partita la avvia l'host.")
          : 'Quando entrambi siete pronti parte la partita.'}
        serverUrl={getMultiplayerWsUrl()}
        peerConfirmed={Boolean(onlinePeerDeck) && !isMultiMode}
        ready={{ label: onlineReadyButtonLabel, disabled: onlineLocalReady, onClick: handleOnlineReady }}
        start={isMultiMode && multiplayerSession.role === 'host'
          ? {
              label: onlineMode === 'tournament'
                ? (tuttiPronti ? `Avvia torneo (${membriConnessi.length} giocatori + ${12 - membriConnessi.length} IA)` : 'Avvia torneo (aspetta che tutti siano pronti)')
                : tuttiPronti
                  ? `Avvia partita (${membriConnessi.length} giocatori${membriConnessi.length < (onlineMode === 'teamDuel' ? 4 : onlinePlayers) ? ' + IA' : ''})`
                  : 'Avvia partita (aspetta che tutti siano pronti)',
              disabled: !tuttiPronti,
              onClick: avviaMultiOnline,
            }
          : null}
        waitingNote={isMultiMode && multiplayerSession.role !== 'host' && onlineLocalReady
          ? "Sei pronto: la partita parte quando l'host la avvia."
          : null}
        onBack={() => {
          setSelectedDeckKey(null);
          setOnlineLocalReady(false);
          setOnlinePeerDeck(null);
          setOnlinePeerName(null);
          onlineMatchStartedRef.current = false;
          setGamePhase('selectDeck');
        }}
      >
        <OnlineRoomPanel
          isHost={multiplayerSession.role === 'host'}
          locked={onlineMode === 'duel' ? (onlineLocalReady && !!onlinePeerDeck) : false}
          multiDisponibile={(multiplayerSession.capacity ?? 2) > 2}
          config={{ mode: onlineMode, formatId: onlineFormatId, players: onlinePlayers, difficulty: onlineDifficulty }}
          onConfig={(patch) => {
            if (patch.mode) setOnlineMode(patch.mode);
            if (patch.formatId) setOnlineFormatId(patch.formatId);
            if (patch.players) setOnlinePlayers(patch.players);
            if (patch.difficulty) setOnlineDifficulty(patch.difficulty);
          }}
          members={onlineRoomMembers}
        />
      </OnlineRoomScreen>)
    );
  }

  // Schermata Galleria (DS3 cinematic)
  if (gamePhase === 'gallery') {
    const galleryTabProps = {
      galleryTab,
      // Non startTransition: il montaggio idle della griglia Agenti affamerebbe il tab.
      onGalleryTabChange: setGalleryTab,
      agentCount: GALLERY_AGENT_COUNT,
      alternativeCount: GALLERY_ALTERNATIVE_COUNT,
      fieldCount: ALL_BATTLEFIELDS.length,
      eminenceCount: EMINENCE_IDS.length,
      playIntro: playGalleryIntro,
    };

    if (galleryTab === 'agents') {
      return (
        screen('gallery-cards', true, <CardGallery
          totalCards={GALLERY_AGENT_COUNT}
          onBack={() => setGamePhase('menu')}
          {...galleryTabProps}
        />)
      );
    }
    if (galleryTab === 'alternative') {
      return (
        screen('gallery-cards', true, <CardGallery
          alternativeOnly
          totalCards={GALLERY_ALTERNATIVE_COUNT}
          onBack={() => setGamePhase('menu')}
          {...galleryTabProps}
        />)
      );
    }
    if (galleryTab === 'eminences') {
      return (
        screen('gallery-eminences', true, <EminenceGallery
          totalCards={EMINENCE_IDS.length}
          onBack={() => setGamePhase('menu')}
          {...galleryTabProps}
        />)
      );
    }
    return (
      screen('gallery-fields', true, <GalleryCinematic
        totalFields={ALL_BATTLEFIELDS.length}
        onBack={() => setGamePhase('menu')}
        {...galleryTabProps}
      />)
    );
  }

  // Loading densissimo prima del duello (campi full-res + warm-up animazioni)
  if (gamePhase === 'duelLoading') {
    const setup = shuffleDealSetup;
    const duelPlayerCards = setup?.playerHand?.length ? setup.playerHand : playerHand;
    const duelEnemyCards = setup?.enemyHand?.length ? setup.enemyHand : enemyHand;
    const duelPlayerArmy = setup?.playerArmy || selectedArmy || duelPlayerCards?.[0]?.army || null;
    const duelEnemyArmy = setup?.enemyArmy || duelEnemyCards?.[0]?.army || null;
    // Non coprire l'ultima animazione di passaggio (iris DeckConfirm → fadeOut/hold)
    const launchHandoffBusy = Boolean(pendingGameLaunch?.sessionId) || Boolean(launchVisualPhase);
    // Schermata VS (IA e multiplayer; la campagna tiene il suo caricamento).
    const duelVersusBase = buildDuelVersusData({
      gameMode,
      isOnline: isOnlinePvP,
      difficulty: aiDifficulty,
      selfName: multiplayerSession?.playerName,
      peerName: onlinePeerName,
      playerArmy: duelPlayerArmy,
      playerDeckKey: isOnlinePvP ? selectedDeckKey : duelDeckKeys?.player,
      playerSet: setup?.playerSet || null,
      enemyArmy: duelEnemyArmy,
      enemyDeckKey: duelDeckKeys?.enemy,
      enemySet: setup?.enemySet || null,
      peerDeck: onlinePeerDeck,
      eminenceMatchState,
    });
    // Modalità a più posti: compagno e altri avversari accanto ai due mazzi principali.
    const duelVersus = duelVersusBase && multiSeat.versus
      ? {
          ...duelVersusBase,
          enemyIdentity: multiSeat.versus.enemyName
            ? { ...duelVersusBase.enemyIdentity, name: multiSeat.versus.enemyName, sub: duelEnemyArmy || duelVersusBase.enemyIdentity?.sub }
            : duelVersusBase.enemyIdentity,
          playerAllies: multiSeat.versus.playerAllies,
          enemyAllies: multiSeat.versus.enemyAllies,
        }
      : duelVersusBase;
    return (
      screen('duelLoading', false, <DuelLoadingOverlay
        battlefields={battlefields}
        playerCards={duelPlayerCards}
        enemyCards={duelEnemyCards}
        playerCardBack={setup?.playerCardBack || duelCardBacks?.player || null}
        enemyCardBack={setup?.enemyCardBack || duelCardBacks?.enemy || null}
        playerArmy={duelPlayerArmy}
        enemyArmy={duelEnemyArmy}
        eminenceMatchState={eminenceMatchState}
        showChrome={!launchHandoffBusy}
        versus={duelVersus}
        versusIntro={!isOnlinePvP}
        versusDeckArmy={vsChosenEnemyArmy}
        onComplete={() => {
          const next = pendingDuelPhase || (setup ? 'shuffleDeal' : 'selectField');
          setPendingDuelPhase(null);
          setGamePhase(next);
        }}
      />)
    );
  }

// Schermata di gioco

  const iaCardPositions = IA_CARD_POSITIONS;
  const playerCardPositions = PLAYER_CARD_POSITIONS;
  const isShuffleDealPhase = gamePhase === 'shuffleDeal' && !!shuffleDealSetup;
  // Di chi è il turno: dopo lo shuffle segue l'iniziativa, poi si scambia dopo Conferma / scelta avversario
  const turnSideNow = ['result', 'battle', 'gameOver', 'shuffleDeal'].includes(gamePhase)
    ? null
    : (gamePhase === 'selectField'
        ? isPlayerFirst
        : gamePhase === 'selectAgent'
          ? (isPlayerFirst
              ? !playerConfirmedAwaitingAI
              : Boolean(enemyAgent) && !playerConfirmedAwaitingAI)
          : isPlayerFirst)
      ? 'player'
      : 'enemy';
  const turnInfo = turnSideNow && {
    side: turnSideNow,
    label: turnSideNow === 'player' ? 'Tocca a te' : (isOnlinePvP ? 'Turno avversario' : 'Turno nemico'),
    color: turnSideNow === 'player' ? playerIdentityColor : enemyIdentityColor,
  };
  const agentsLockedAwaitingField =
    gamePhase === 'selectField' && Boolean(selectedAgent && enemyAgent);
  const showDeployedEnemyAgent = (gamePhase === 'selectAgent' || agentsLockedAwaitingField) && Boolean(enemyAgent);

  // Carta dell'agente nemico all'ingresso: le prop in un oggetto solo, così la chiave della foto
  // d'ingresso nasce dagli stessi valori che la carta mostra (vedi EntryPrecapture).
  const enemyEntryCardFor = (agent, display, effectiveArmyBonus) => ({
    cardLayout: galleryCardLayout === 'reworkP4html' ? 'reworkP4' : galleryCardLayout,
    agent: display,
    showBonus: enemyArmyBonuses[agent.army] && isBonusTriggerSatisfied(agent.army, false, agent),
    bonusBaseInactive: Boolean(ARMY_BONUSES[agent.army]) && !enemyArmyBonuses[agent.army],
    effectiveArmyBonus,
    effectiveAbility: resolveEffectiveAbility(display?.ability, false, display),
    abilityCurrentValue: getAbilityCurrentValue(agent, false),
  });
  const enemyEntryCard = showDeployedEnemyAgent
    ? enemyEntryCardFor(enemyAgent, displayEnemyAgent, enemyEffectiveArmyBonus)
    : null;
  const enemyEntryAccent = enemyAgent ? getArmyAccent(enemyAgent, enemyIdentityColor) : null;
  const enemyEntryCaptureKey = enemyEntryCard ? entrySnapshotKey(enemyEntryCard, enemyEntryAccent) : null;

  // Contro l'IA, mentre si sceglie, le foto d'ingresso delle carte che il nemico può ancora
  // giocare si preparano in anticipo: all'ingresso (dopo CONFERMA) lo scontro non paga lo scatto.
  // Il calcolo ricalca enemyLiveSwap / enemyEffectiveArmyBonus per una carta qualsiasi: se
  // all'ingresso qualcosa differisce la chiave non combacia e si fotografa come prima.
  const enemyEntryPrecaptureOn =
    !isMultiplayer &&
    aiDifficulty !== 'multiplayer' &&
    !enemyAgent &&
    (gamePhase === 'selectAgent' || gamePhase === 'selectField') &&
    // posa e ingresso che l'IA userà alla prossima giocata (vedi l'effetto su enemyAgent.id)
    getPlaceFxPreference().army !== 'off' &&
    !needsTwoFaces(resolvePlaceFxForVia(isPlayerFirst ? 'click' : 'drop')) &&
    !prefersReducedMotion();
  const enemyEntryPrecaptureItems = enemyEntryPrecaptureOn
    ? (enemyHand || [])
        .filter((card) => card?.army && !(enemyUsedCards || []).includes(card.id))
        .map((card) => {
          const swap = resolveLivePowerBonusSwapDisplay({
            agent: card,
            side: 'enemy',
            matchState: eminenceMatchState,
            armyBonus: matchArmyBonuses[card.army] || null,
          });
          const display = swap.agent || card;
          const base = swap.swapped ? swap.armyBonus : matchArmyBonuses[display.army];
          const fieldBonus = resolveArmyBonusForDisplay({
            field: activeFieldForAbilityDisplay,
            fieldMods: activeFieldAbilityMods,
            armyBonus: base || matchArmyBonuses[display.army] || null,
            hasBonus: Boolean(enemyArmyBonuses[display.army]),
            opponentArmyBonus: displaySelectedAgent ? matchArmyBonuses[displaySelectedAgent.army] : null,
            opponentHasBonus: Boolean(displaySelectedAgent && playerArmyBonuses[displaySelectedAgent.army]),
          });
          const cardProps = enemyEntryCardFor(card, display, fieldBonus || (swap.swapped ? swap.armyBonus : null));
          const accent = getArmyAccent(card, enemyIdentityColor);
          return { key: entrySnapshotKey(cardProps, accent), accent, cardProps };
        })
    : [];
  const showDeployedPlayerAgent = (gamePhase === 'selectAgent' || agentsLockedAwaitingField) && Boolean(selectedAgent);
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
    screen('duel', false, <div 
        className={`relative overflow-visible satze-scene dep-2 ${duelLayoutBreathClass} sty-a hud-cosmo imp-center${isMultiSeat ? ' msb-on' : ''}${multiSeatView?.board ? ` msb-board-on msb-board--${teamBoardVariant}${teamBoardLayouts.active?.mode === 'pairs' && teamBoardPair === 1 ? ' msb-board-pair-2' : ''}` : ''}${duelHudDiscovering ? ' duel-hud--discovering' : ''}${showEminenceLayer ? ' em-on' : ''}${revealEnemyHandForPrey ? ' em-prey-read' : ''}${revealBoardForSlot ? ' em-slot-pick' : ''}${holdForConfirmedAgentPick ? ' em-agent-pick' : ''}`}
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
        '--acc': playerIdentityColor,
        '--acc-en': enemyIdentityColor,
      }}
    >
      <div className="dep-floor" aria-hidden />
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
                cleanupMultiplayerSession();
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
        <div
          key={fieldBgImage}
          className="absolute inset-0 pointer-events-none"
          style={{ zIndex: 0 }}
        >
          <BattlefieldReveal imageSrc={fieldBgImage} animationType={entranceAnimationType} />
        </div>
      )}
      {/* HUD cosmico: ogni pannello riceve la sua finestra sul cosmo (segue la 2.5D) */}
      <DuelCosmicHud
        playerHP={shownPlayerHP}
        enemyHP={shownEnemyHP}
        playerFocus={shownPlayerFC}
        enemyFocus={shownEnemyFC}
        conqueredFields={conqueredFields}
        playerColor={playerIdentityColor}
        enemyColor={enemyIdentityColor}
        gamePhase={gamePhase}
        duelPhase={duelPhase}
        battleResult={battleResult}
        eventsCount={Array.isArray(logPanelBattleEvents) ? logPanelBattleEvents.length : (logs?.length || 0)}
        turnSide={turnSideNow /* la luce corre veloce sul box di chi agisce */}
      />
      {/* Danno visibile: un proiettile per ogni PV tolto, dalla sua fonte al pannello PV colpito */}
      <DuelHpProjectiles
        projectiles={duelHp.projectiles}
        colors={duelHpColors}
      />
      {/* Schede VA laterali: POT, × FC, modificatori per fonte, VA (fuori dalle carte, nascoste nello zoom) */}
      {gamePhase === 'result' && battleResult && (
        <>
          {/* Conta scenica delle FC: monete dalla scheda VA alla carta, orbita, contatore */}
          <DuelFocusStage
            battleResult={battleResult}
            duelPhase={duelPhase}
            launchesRef={focusLaunch.launchesRef}
            accent={{ player: playerIdentityColor, enemy: enemyIdentityColor }}
          />
          <DuelVaLedger
            battleResult={battleResult}
            side="enemy"
            duelPhase={duelPhase}
            duelEffectStep={visualEffectStep}
            coinsShown={focusLaunch.landed.enemy}
            duelVfx={duelVfx}
            accentColor={enemyIdentityColor}
            kicker={mpEnemyLabel}
          />
          <DuelVaLedger
            battleResult={battleResult}
            side="player"
            duelPhase={duelPhase}
            duelEffectStep={visualEffectStep}
            coinsShown={focusLaunch.landed.player}
            duelVfx={duelVfx}
            accentColor={playerIdentityColor}
            kicker={isOnlinePvP || isMultiSeat || spectating ? mpSelfLabel : 'Tu'}
          />
          {/* Passi del duello: riquadro con fonte e stato, fasci verso il bersaglio */}
          <DuelStepFx battleResult={battleResult} duelPhase={duelPhase} duelEffectStep={visualEffectStep} />
        </>
      )}
      {/* ============================================ */}
      {/* COLONNA SINISTRA - z-index 1 */}
      {/* ============================================ */}
      <div 
        className={`absolute top-0 left-0 flex flex-col p-4 gap-6 justify-end overflow-visible imp-colL ${
          'border-r border-slate-600/50'
        } ${
          gamePhase === 'result' ? 'animate-fade-out-panels pointer-events-none' : ''
        }`}
        style={{
          width: '428px',
          height: '1080px',
          zIndex: revealEnemyHandForPrey ? 18 : 1,
          fontFamily: HUD_ORATORIO_FONT_UI,
          background: 'rgba(10, 14, 26, 0.4)',
        }}
      >
        {/* Anteprima Carta - inizia a metà colonna */}
        <div 
          className={`p-3 mb-4 flex flex-col overflow-hidden satze-hide-scrollbar satze-hud-panel imp-preview`} 
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
            {isMultiSeat ? (
              <div className="msp-tabs">
                <button type="button" className={multiSeatLeftTab === 'table' ? 'on' : ''} onClick={() => setMultiSeatLeftTab('table')}>Tavolo</button>
                <button type="button" className={multiSeatLeftTab === 'preview' ? 'on' : ''} onClick={() => setMultiSeatLeftTab('preview')}>Anteprima</button>
              </div>
            ) : (
              <RuneTitle text="Anteprima" />
            )}
          </div>
          {isMultiSeat && multiSeatLeftTab === 'table' && (
            <div
              className="satze-hide-scrollbar"
              style={{ position: 'absolute', inset: '52px 12px 12px 12px', zIndex: 6, background: 'rgba(8, 11, 22, 0.96)', display: 'flex', flexDirection: 'column' }}
            >
              <MultiSeatPanel
                view={multiSeatView}
                ownFocus={selectedFocus}
                onPairing={(pairing) => { playUiClick(); multiSeat.setPlanPairing(pairing); }}
                onClaim={multiSeat.decideClaim}
                ownFieldIndex={currentFieldIndex}
                onAdvise={(kind, value) => { playUiClick(); multiSeat.advise(kind, value); }}
                onHoverField={setHoveredField}
                boardVariant={teamBoardVariant}
                boardVariants={teamBoardLayouts.layouts}
                allyColor={playerIdentityColor}
                foeColor={enemyIdentityColor}
                onBoardVariant={setTeamBoardVariant}
              />
            </div>
          )}
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
                  effectiveAbility={resolveEffectiveAbility(
                    displayPreviewCard.agent?.ability,
                    displayPreviewCard.isPlayer !== false,
                    displayPreviewCard.agent,
                  )}
                  effectiveArmyBonus={
                    displayPreviewCard.isPlayer !== false
                      ? playerEffectiveArmyBonus
                      : enemyEffectiveArmyBonus
                  }
                  disabled
                />
                <div className="mt-3 w-full">
                  <div 
                    className="p-4 space-y-3 rounded-xl"
                    style={{ background: `${PALETTE.deepVoid}99`, border: `1px solid ${PALETTE.slate}` }}
                  >
                    {displayPreviewCard.agent?.ability && (() => {
                      const displayAbility = resolveEffectiveAbility(
                        displayPreviewCard.agent.ability,
                        displayPreviewCard.isPlayer !== false,
                        displayPreviewCard.agent,
                      );
                      const fullText = getAbilityExplanation(displayAbility);
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
                          style={{ color: PALETTE.textPrimary, opacity: 0.92, whiteSpace: 'pre-line' }}
                        >
                          {displayPreviewCard.agent.flavour.startsWith('«') ? displayPreviewCard.agent.flavour : <>"{displayPreviewCard.agent.flavour}"</>}
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
        className={`absolute top-0 right-0 flex flex-col p-4 gap-6 overflow-visible imp-colR ${
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
          className="p-2 flex-shrink-0 satze-hud-panel imp-topbar"
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
                  {Array.from({ length: multiSeatThreshold || 3 }, (_, i) => i).map((i) => <Slot key={i} filled={i < count} accent={accent} />)}
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
          {(() => {
            const holdOldVictory = victoryCondFx === 'hold';
            const showAnnihilate = roundNumber >= 5 && !holdOldVictory;
            return (
          <div 
            className={`px-3 py-2 text-center rounded-xl imp-victory${victoryCondFx === 'reveal' ? ' imp-victory-reveal' : ''}`}
            style={{
              background: 'rgba(56, 189, 248, 0.08)',
              border: '1px solid rgba(56, 189, 248, 0.28)',
              boxShadow: 'inset 0 0 20px rgba(0, 0, 0, 0.35)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div className="text-[11px] uppercase tracking-wider mb-1" style={{ color: PALETTE.textSecondary, textShadow: '0 1px 2px #000' }}>Condizione di Vittoria</div>
            <div className="text-sm font-bold leading-tight" style={{ color: PALETTE.amber, textShadow: `0 1px 3px #000, 0 0 12px ${PALETTE.amber}44` }}>
              {showAnnihilate ? 'Annienta il nemico!' : `Conquista ${multiSeatThreshold || Math.floor(battlefields.length / 2) + 1} campi!`}
            </div>
            {!showAnnihilate && playerHand.length >= 5 && (
              <div className="text-xs mt-1.5" style={{ color: PALETTE.textSecondary, textShadow: '0 1px 2px #000' }}>
                {holdOldVictory
                  ? 'Sta per cambiare…'
                  : `Cambierà tra ${5 - roundNumber} turn${5 - roundNumber === 1 ? 'o' : 'i'}`}
              </div>
            )}
            {showAnnihilate && (
              <div className="text-xs mt-1.5" style={{ color: PALETTE.textSecondary, textShadow: '0 1px 2px #000' }}>
                (Vince chi alla fine del turno ha più PV)
              </div>
            )}
          </div>
            );
          })()}
        </div>

        {/* Tabellone Campi */}
        <div 
          className={`p-2 -mt-4 flex flex-col h-[300px] satze-hud-panel imp-board imp-fields ${gamePhase === 'selectField' && isPlayerFirst && !tabelloneTiltDismissed && !guidedMatch.active ? 'animate-satze-tabellone-tilt' : ''} ${isGuidedIntroBattlefieldsPhase ? 'animate-satze-guided-twinkle' : ''}`} 
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
            <RuneTitle text="Prossima conquista!" />
          </div>

          {/* Lista Campi di Battaglia - 5 righe (10 nel 2v2) */}
          <div className="imp-fields-wrap">
          <div 
            ref={fieldsScrollRef}
            onScroll={fieldsScrollable ? updateFieldsScrollHint : undefined}
            className={`grid grid-cols-1 gap-0.5 flex-1 min-h-0 ${battlefields.length > 5 ? 'imp-fields-scroll' : 'grid-rows-5'} ${
              gamePhase === 'result' ? 'animate-fade-out-panels pointer-events-none' : ''
            }`}
            style={battlefields.length > 5 ? { gridTemplateRows: `repeat(${battlefields.length}, var(--imp-field-row, 52px))` } : undefined}
          >
            {battlefields.map((field, idx) => {
              const canSelectField = canSelectBattlefield({
                isPlayerFirst,
                eminenceBlocked: eminenceBlocksMatch,
                gamePhase,
                gateSequenceName: eminenceChoiceView.gateSequenceName,
                agentsReady: Boolean(selectedAgent && enemyAgent),
              }) && !(idx in conqueredFields) && idx < revealedFields;
              const locked = idx >= revealedFields;
              const rowCls = [
                'imp-row',
                locked && !slotShowsCurse(idx) ? 'imp-row-locked' : currentFieldIndex === idx ? 'imp-row-sel' : '',
                slotShowsCurse(idx) ? 'imp-row-cursed' : '',
                justRevealedFieldIdx === idx ? 'imp-row-reveal' : '',
              ].filter(Boolean).join(' ');
              
              return (
                <div
                  key={field.id}
                  className={rowCls}
                  data-field-slot={idx}
                  style={{
                    position: 'relative',
                    display: 'flex',
                    width: '100%',
                    overflow: 'hidden',
                    '--imp-accent': slotShowsCurse(idx) ? slotCurseAccent : (locked ? PALETTE.slate : PALETTE.amber),
                    '--curse-accent': slotShowsCurse(idx) ? slotCurseAccent : undefined,
                  }}
                >
                  <MiniBattlefield
                    field={field}
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
                    turnsUntilReveal={idx >= revealedFields ? Math.ceil((idx - revealedFields + 1) / (multiSeat.kind === MULTI_SEAT_KINDS.TEAM ? 2 : 1)) : 0}
                    selected={currentFieldIndex === idx}
                    onClick={
                      legalSlotIndicesForChoice(eminenceChoiceView, { draftId: emDraftId }).includes(idx)
                        && !eminenceAnnounceHold
                        && !preyFlight.busy
                        ? () => { tryPickEminenceSlot(idx); }
                        : (canSelectField ? fieldSelectHandlers[idx] : undefined)
                    }
                    onHover={setHoveredField}
                    guidedHighlight={isGuidedIntroBattlefieldsPhase}
                    cursed={slotShowsCurse(idx)}
                    curseAccent={slotCurseAccent}
                    curseArriving={preyFlight.arrivingSlot === idx}
                  />
                  {multiSeatFieldClaims[idx] && !(idx in conqueredFields) ? (
                    <div className="imp-field-claims">
                      {multiSeatFieldClaims[idx].map((c) => (
                        <span
                          key={c.key}
                          className={`imp-field-claim is-${c.side}${c.tentative ? ' is-tentative' : ''}`}
                          style={{ '--claim': c.side === 'ally' ? playerIdentityColor : enemyIdentityColor }}
                          title={c.tentative ? `${c.label} (proposta)` : c.label}
                        >
                          {c.label}{c.tentative ? '?' : ''}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
          {fieldsScrollable && fieldsBelow > 0 ? (
            <button
              type="button"
              className="imp-fields-more"
              onClick={() => fieldsScrollRef.current?.scrollBy({ top: fieldsScrollRef.current.clientHeight * 0.8, behavior: 'smooth' })}
            >
              ▼ {fieldsBelow === 1 ? 'Altro Campo' : `Altri ${fieldsBelow} Campi`}
            </button>
          ) : null}
          </div>
        </div>
        
        {/* Log Battaglia / Slider Focus Coin - flip come carta */}
        <div className={`satze-panel-flip-container ${gamePhase === 'result' ? 'pointer-events-none' : ''}${eminenceInspectable ? ' has-em-toggle' : ''}`}>
          <div className={`satze-panel-flip-inner ${gamePhase === 'selectAgent' && selectedAgent ? 'satze-panel-flipped' : ''}`}>
            {/* Fronte: Log */}
            <div className="satze-panel-flip-face">
              <LogPanel
                logs={logs}
                battleEvents={logPanelBattleEvents}
                duelPhase={duelPhase}
                currentRound={roundNumber}
                gamePhase={gamePhase}
                playerColor={playerIdentityColor}
                enemyColor={enemyIdentityColor}
                localLabel="Tu"
                opponentLabel="IA"
              />
            </div>
            {/* Retro: FC */}
            <div ref={fcPanelRef} className={`satze-panel-flip-face satze-panel-flip-face-back p-2 flex flex-col overflow-hidden items-center justify-start pt-4 satze-hide-scrollbar satze-fc-panel rounded-3xl${eminenceAnnounceHold || announcePointerGuard ? ' pointer-events-none' : ''}`}
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
                    const maxFC = computeLegalMaxFocus(playerFocus, reserved);
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
                    const maxFC = computeLegalMaxFocus(playerFocus, reserved);
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


      {eminenceInspectable && (
        <EminenzaTableToggle
          anchorSelector=".satze-panel-flip-container"
          viewingEminence={showEminenceLayer}
          accent={playerIdentityColor}
          fragmentCount={(eminenceChoiceView.self?.persistent?.fragmentCardIds || []).length}
          preyCount={(eminenceChoiceView.self?.persistent?.preyCardIds || []).length}
          onToggle={() => {
            if (forcedEminenceView) setPeekCampo((v) => !v);
            else setPeekEminence((v) => !v);
          }}
        />
      )}

      {/* 2v2: le quattro carte prima dei duelli (versione di prova scelta nel Tavolo) */}
      {multiSeatView?.board && (
        <TeamDuelBoard
          board={multiSeatView.board}
          layout={teamBoardLayouts.active}
          layoutId={teamBoardVariant}
          humanCard={selectedAgent}
          humanFieldIndex={currentFieldIndex}
          battlefields={battlefields}
          opponentOf={multiSeatOpponentOf}
          pairIndex={teamBoardPair}
          onPairIndex={setTeamBoardPair}
          onHumanCardClick={multiSeat.acceptsHumanDeploy ? () => { flyDeployedAgentBackToHand(selectedAgent); setSelectedAgent(null); } : undefined}
          onHover={(card) => handlePlayerPreviewClick({ agent: card, isPlayer: true })}
          cardLayout={galleryCardLayout === 'reworkP4html' ? 'reworkP4' : galleryCardLayout}
          playerColor={playerIdentityColor}
          enemyColor={enemyIdentityColor}
        />
      )}

      {/* Modalità a più posti: tasti per guardare le altre mani (solo lettura) */}
      {isMultiSeat && gamePhase !== 'result' && multiSeat.handSeats.enemy.length > 1 && (
        <button
          type="button"
          className="msp-hand-toggle msp-hand-toggle--enemy"
          title="Mostra la mano di un altro giocatore"
          onClick={() => setMultiSeatHandView((v) => ({ ...v, enemy: (v.enemy + 1) % multiSeat.handSeats.enemy.length }))}
        >
          <span aria-hidden>⇄</span> {multiSeatHandView.enemy === 0 ? 'Altre mani' : `${multiSeatHandView.enemy + 1}/${multiSeat.handSeats.enemy.length}`}
        </button>
      )}
      {isMultiSeat && gamePhase !== 'result' && multiSeat.handSeats.player.length > 1 && (
        <button
          type="button"
          className="msp-hand-toggle msp-hand-toggle--player"
          title="Mostra la mano del compagno"
          onClick={() => setMultiSeatHandView((v) => ({ ...v, player: (v.player + 1) % multiSeat.handSeats.player.length }))}
        >
          <span aria-hidden>⇄</span> {multiSeatHandView.player === 0 ? 'Mano compagno' : 'Torna alla tua'}
        </button>
      )}

      {/* ============================================ */}
      {/* TRIANGOLO MANO IA - Alto Sinistra */}
      {/* ============================================ */}
      <div className="imp-hand imp-hand-enemy" ref={enemyHandWrapRef}>
      <Hand
        hand={enemyHandOverride ? enemyHandOverride.hand : enemyHand}
        usedCards={enemyHandOverride ? enemyHandOverride.usedCards : enemyUsedCards}
        fragmentCardIds={eminenceChoiceView.opponent?.persistent?.fragmentCardIds || []}
        preyCardIds={[
          ...preyFlight.visibleHandPreyIds(eminenceChoiceView.self?.persistent?.preyCardIds || []),
          ...(revealEnemyHandForPrey && emDraftParams?.preyCardId != null ? [emDraftParams.preyCardId] : []),
        ]}
        arrivingPreyId={preyFlight.preyLandId}
        highlightedAgentId={highlightIdForHand('enemy') ?? (revealEnemyHandForPrey ? emDraftParams?.preyCardId ?? null : null)}
        selectedAgent={enemyHandOverride ? null : enemyAgent}
        onPreviewClick={handleEnemyPreviewClick}
        battleOutcomes={enemyHandOverride ? enemyHandOverride.outcomes : cardBattleOutcomes}
        battleOutcomeSide="enemy"
        cardPositions={iaCardPositions}
        position="top-left"
        label={enemyHandOverride ? enemyHandOverride.name : mpEnemyHandLabel}
        gamePhase={gamePhase}
        disabled={true}
        armyBonuses={enemyHandOverride ? enemyHandOverride.armyBonuses : enemyArmyBonuses}
        isBonusTriggerSatisfied={isBonusTriggerSatisfied}
        isActive={!eminenceBlocksMatch && (gamePhase === 'selectField' && !isPlayerFirst || (gamePhase === 'selectAgent' && !isPlayerFirst && !enemyAgent))}
        handCardLayout={galleryCardLayout === 'reworkP4html' ? 'reworkP4' : galleryCardLayout}
        hideCards={shouldHideHandsForGuidedSetup}
        guidedBackgroundGlow={isGuidedIntroHandsPhase}
        showZoneShell={isShuffleDealPhase}
        zoneArmy={enemyHandOverride ? enemyHandOverride.army : shuffleDealSetup?.enemyArmy}
        zoneColorHand={enemyHandOverride ? enemyHandOverride.hand : enemyDeckVisual?.deckCards}
        zoneArmies={enemyHandOverride ? [enemyHandOverride.army] : enemyDeckVisual?.armies}
        elevateCards={revealEnemyHandForPrey}
        resolveEffectiveAbility={resolveEffectiveAbility}
      />
      </div>

      {/* ============================================ */}
      {/* TRIANGOLO MANO PLAYER - Basso Destra */}
      {/* ============================================ */}
      <div className="imp-hand imp-hand-player" ref={playerHandWrapRef}>
      <Hand
        hand={playerHandOverride ? playerHandOverride.hand : playerHand}
        usedCards={playerHandOverride ? playerHandOverride.usedCards : playerUsedCards}
        fragmentCardIds={eminenceChoiceView.self?.persistent?.fragmentCardIds || []}
        preyCardIds={preyFlight.visibleHandPreyIds(eminenceChoiceView.opponent?.persistent?.preyCardIds || [])}
        arrivingPreyId={preyFlight.preyLandId}
        selectedAgent={playerHandOverride ? null : selectedAgent}
        hideSelected
        onAgentSelect={playerHandOverride ? undefined : handleAgentSelect}
        onPreviewClick={playerHandOverride?.seatId === 'A2'
          ? (data) => {
            handlePlayerPreviewClick(data);
            // Mano del compagno: cliccare una carta la consiglia.
            if (data?.agent?.id != null && multiSeat.advise('card', data.agent.id)) setMultiSeatLeftTab('table');
          }
          : handlePlayerPreviewClick}
        battleOutcomes={playerHandOverride ? playerHandOverride.outcomes : cardBattleOutcomes}
        battleOutcomeSide="player"
        cardPositions={playerCardPositions}
        position="bottom-right"
        label={playerHandOverride ? playerHandOverride.name : mpSelfHandLabel}
        gamePhase={gamePhase}
        disabled={Boolean(playerHandOverride) || eminenceBlocksMatch || gamePhase !== 'selectAgent' || (!isPlayerFirst && !enemyAgent)}
        onDragStart={playerHandOverride ? undefined : handleDragStart}
        draggingCard={draggingCard}
        isPlayerFirst={isPlayerFirst}
        enemyAgent={enemyAgent}
        armyBonuses={playerHandOverride ? playerHandOverride.armyBonuses : playerArmyBonuses}
        isBonusTriggerSatisfied={isBonusTriggerSatisfied}
        selectedCardRef={selectedCardInHandRef}
        isActive={!eminenceBlocksMatch && (gamePhase === 'selectField' && isPlayerFirst || (gamePhase === 'selectAgent' && (isPlayerFirst || enemyAgent)))}
        handCardLayout={galleryCardLayout === 'reworkP4html' ? 'reworkP4' : galleryCardLayout}
        hideCards={shouldHideHandsForGuidedSetup}
        highlightedAgentId={playerHandOverride?.seatId === 'A2'
          ? (multiSeatView?.advice?.card?.value ?? null)
          : (isGuidedIntroCardPickPhase ? guidedIntroTargetCardId : highlightIdForHand('player'))}
        guidedBackgroundGlow={isGuidedIntroHandsPhase}
        showZoneShell={isShuffleDealPhase}
        zoneArmy={playerHandOverride ? playerHandOverride.army : shuffleDealSetup?.playerArmy}
        zoneColorHand={playerHandOverride ? playerHandOverride.hand : playerDeckVisual?.deckCards}
        zoneArmies={playerHandOverride ? [playerHandOverride.army] : playerDeckVisual?.armies}
        resolveEffectiveAbility={resolveEffectiveAbility}
      />
      </div>

      {(showEnemyEminenceZone || enemyZoneKeptRef.current) && (
        <EminenzaZone
          side="enemy"
          stowed={!showEnemyEminenceZone}
          announceHeld={announceHeldId != null && announceHeldId === enemyEminenceNotice?.id}
          eminence={eminenceChoiceView.opponent.eminence}
          presence={presenceLink.presence.enemy}
          presencePulse={presenceLink.pulse.enemy}
          options={eminenceChoiceView.opponent.options}
          pickedId={eminenceChoiceView.opponent.revealedAbilityId}
          choiceState={eminenceChoiceView.opponent.state}
          fragments={preyFlight.visibleEnemyFragmentIds}
          prey={preyFlight.visibleEnemyPreyIds}
          arrivingMarkId={preyFlight.preyLandId}
          focusedMarkId={focusedMark?.source === 'enemy' ? focusedMark.id : null}
          onMarkFocus={(cardId, kind) => focusMarkToken(cardId, 'enemy', kind)}
          announce={displayEnemyNotice}
          announceAutoDismiss={!sparkSequenceActive}
          announceEdge={gamePhase === 'result'}
          hideRail={!shouldShowEminenceAbilityRail(eminenceChoiceView, {
            announcing: eminenceAnnounceHold,
            peeking: peekEminence,
            side: 'enemy',
            markFlightHold: holdSetupScene,
          })}
          onDismissAnnounce={dismissEminenceNotice}
        />
      )}
      {(showPlayerEminenceZone || playerZoneKeptRef.current) && (
        <EminenzaZone
          side="player"
          stowed={!showPlayerEminenceZone}
          announceHeld={announceHeldId != null && announceHeldId === playerEminenceNotice?.id}
          eminence={eminenceChoiceView.self.eminence}
          presence={presenceLink.presence.player}
          presencePulse={presenceLink.pulse.player}
          options={eminenceChoiceView.self.options}
          pickedId={emDraftId || eminenceChoiceView.self.selectedAbilityId}
          choiceState={eminenceChoiceView.self.state}
          fragments={preyFlight.visiblePlayerFragmentIds}
          prey={preyFlight.visiblePlayerPreyIds}
          arrivingMarkId={preyFlight.preyLandId}
          setup={playerSetupScene}
          focusedMarkId={focusedMark?.source === 'player' ? focusedMark.id : null}
          onMarkFocus={(cardId, kind) => focusMarkToken(cardId, 'player', kind)}
          onSetupConfirm={eminenceAnnounceHold || preyFlight.busy ? undefined : confirmEminenceSetup}
          onPick={eminenceAnnounceHold || preyFlight.busy ? undefined : setEmDraftId}
          onConfirm={eminenceAnnounceHold || preyFlight.busy ? undefined : confirmEminenceAbility}
          draftParams={emDraftParams}
          onDraftParams={setEmDraftParams}
          paramMeta={eminenceChoiceView.paramMeta}
          paramsOpen={awaitingRevealParams}
          announce={displayPlayerNotice}
          announceAutoDismiss={!sparkSequenceActive}
          announceEdge={gamePhase === 'result'}
          hideRail={!shouldShowEminenceAbilityRail(eminenceChoiceView, {
            announcing: eminenceAnnounceHold,
            peeking: peekEminence,
            side: 'player',
            markFlightHold: holdSetupScene,
          })}
          onDismissAnnounce={dismissEminenceNotice}
        />
      )}
      <EminencePresenceSparks flights={presenceLink.flights} />

      {(eminenceAnnounceHold || announcePointerGuard) && (
        <div
          className="absolute inset-0"
          style={{ zIndex: 22 }}
          onPointerDown={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            if (!eminenceNotices.length) return;
            armAnnouncePointerGuard();
            announceSkipAheadRef.current = true;
            eminenceNoticesRef.current.forEach((notice) => {
              noticeSparkRef.current.add(notice.id);
            });
            eminenceNoticesRef.current = [];
            setEminenceNotices([]);
            setAnnounceHeldId(null);
            setActiveSparkNoticeId(null);
            abortAnnounceWait();
          }}
          aria-hidden
        />
      )}

      {/* L'Affare si sceglie nel portale (BattlefieldPanel · decision) */}

      {isShuffleDealPhase && (
        <div className="absolute inset-0 z-[24] pointer-events-auto" aria-hidden />
      )}
      {isShuffleDealPhase && (
        <BattlefieldShuffleDealOverlay
          setup={shuffleDealSetup}
          onComplete={completeShuffleDeal}
          launchRevealHoldMs={shuffleLaunchHoldMsRef.current ?? 0}
          onRevealPhaseChange={setDuelRevealPhase}
          onDealProgress={setDealProgress}
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
      <div className="dep-stage" aria-hidden />
      <BattlefieldBackground 
        activeField={(currentFieldIndex !== null && battlefields[currentFieldIndex]) 
          ? battlefields[currentFieldIndex] 
          : battleResult?.field}
        cursed={slotShowsCurse(currentFieldIndex) && (
          gamePhase === 'selectAgent' || gamePhase === 'battle' || gamePhase === 'result'
        )}
        curseAccent={slotCurseAccent}
      />

      {/* Il turno ora è dentro il portale del campo (BattlefieldPanel → turn) */}

      {/* Invito tabellone in selectField (sostituisce il placeholder del pannello) */}
      {gamePhase === 'selectField' && (
        <div
          className="absolute flex flex-col items-center justify-center gap-3 pointer-events-none imp-turn-badge"
          style={{
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 200,
            height: 280,
            zIndex: 11,
          }}
        >
          <div className="text-center px-3">
            <div className="text-sm font-semibold mb-1 tracking-wide" style={{ color: PALETTE.amber }}>
              Campo di Battaglia
            </div>
            <div className="text-xs leading-snug" style={{ color: PALETTE.textPrimary }}>
              {eminenceAnnounceHold
                ? 'Un\'abilità Eminenza è in rivelazione. Il resto del round è in pausa.'
                : awaitingEminenceChoice
                ? 'Scegli un\'abilità Eminenza. Da qui puoi consultare il tabellone.'
                : awaitingRevealParams
                ? (legalSlotIndicesForChoice(eminenceChoiceView).length > 0
                  ? 'Scegli uno slot dal tabellone, poi conferma l\'abilità.'
                  : 'Scegli i parametri dell\'abilità Eminenza.')
                : eminenceBlocksMatch
                ? 'Le Eminenze stanno per entrare in scena.'
                : isPlayerFirst
                  ? 'Scegli un campo dal tabellone'
                  : isOnlinePvP
                    ? "L'avversario sta scegliendo il campo di battaglia"
                    : 'Il nemico sta scegliendo il campo di battaglia'}
            </div>
            {isPlayerFirst && !eminenceBlocksMatch && (
              <div
                className="mt-3 flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-wider imp-arrow"
                style={{ color: PALETTE.textSecondary }}
              >
                <span>Tabellone</span>
                <span>→</span>
              </div>
            )}
          </div>
        </div>
      )}

      {campaignActionError && selectedMode === 'campaign' && <div role="alert" className="cs-error" style={{position:'absolute',top:100,left:'35%',zIndex:100}}>{campaignActionError}</div>}
      {campaignDuelMod?.firstAct && ['selectField','selectAgent','selectFocus'].includes(gamePhase) && (
        <button type="button" className="cs-test-win satze-hud-panel pointer-events-auto" style={{position:'absolute',top:105,left:'50%',transform:'translateX(-50%)',zIndex:100,padding:'8px 14px'}} onClick={winCampaignTest}>Test: vinci incontro</button>
      )}
      {/* Campo di Battaglia - Centro */}
      <BattlefieldPanel
        portalFrame
        turn={multiSeatStatus
          ? { side: multiSeatStatus.side, label: multiSeatStatus.turnLabel, color: multiSeatStatus.side === 'player' ? playerIdentityColor : enemyIdentityColor }
          : turnInfo}
        duelTint={portalDuelTint}
        outcomeColor={gameResult?.winner === 'player' ? playerIdentityColor : gameResult?.winner === 'enemy' ? enemyIdentityColor : null}
        commandPhase={forcedEminenceView}
        field={battlefields[currentFieldIndex]}
        cursed={slotShowsCurse(currentFieldIndex) && (
          gamePhase === 'selectAgent' || gamePhase === 'battle' || gamePhase === 'result'
        )}
        curseAccent={slotCurseAccent}
        gamePhase={gamePhase}
        isPlayerFirst={isPlayerFirst}
        isZoomed={isZoomed}
        selectedAgent={selectedAgent}
        onConfirm={confirmPlayerChoice}
        sideNames={isMultiSeat || spectating ? { player: mpSelfLabel, enemy: mpEnemyLabel } : null}
        confirmDisabled={eminenceAnnounceHold || announcePointerGuard}
        awaitingEnemySelection={playerConfirmedAwaitingAI || Boolean(multiSeatStatus?.wait)}
        waitLabel={multiSeatStatus?.wait || null}
        statusStep={multiSeatStatus}
        isOnlinePvP={isOnlinePvP}
        duelPhase={duelPhase}
        battleResult={battleResult}
        onContinue={nextRound}
        continueLabel={multiSeatContinue.label}
        continueNote={multiSeatContinue.note}
        gameResult={gameResult}
        aiDecisionLog={isOnlinePvP ? null : ai.aiDecisionLog}
        onCopyAiDecisionLog={
          isOnlinePvP || !ai.aiDecisionLog?.length
            ? undefined
            : () => {
                const text = formatAIReasoningLogText(ai.aiDecisionLog);
                if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
                  navigator.clipboard.writeText(text).catch(() => {});
                }
              }
        }
        onMenu={() => {
          resetGuidedTutorial();
          aiThinkGenerationRef.current += 1;
          if (aiAgentThinkTimerRef.current) {
            clearTimeout(aiAgentThinkTimerRef.current);
            aiAgentThinkTimerRef.current = null;
          }
          aiHasSelectedAgent.current = false;
          setPlayerConfirmedAwaitingAI(false);
          setCampaignLevel(null);
            if (selectedMode === 'campaign') {
            ai.resetAiSession();
            setSelectedAgent(null);
            setEnemyAgent(null);
            setEnemySelectedFocus(1);
            setSelectedFocus(1);
            setCurrentFieldIndex(null);
            setBattleResult(null);
            setGameResult(null);
            setShowClaimVictoryChoice(null);
            setShuffleDealSetup(null);
            setGamePhase('campaignHub');
          } else {
            // Fine partita online: liberare stanza/codice, altrimenti lo slot resta occupato
            // e non si può più entrare con un nuovo codice dalla lobby.
            if (isOnlinePvP || multiplayerSession || selectedMode === 'multiplayer') {
              cleanupMultiplayerSession();
            }
            resetToMenu();
          }
        }}
        isCampaign={selectedMode === 'campaign'}
        onCampaignRetry={retryCampaignMission}
        onTournamentContinue={
          spectating && spectate.gameIndex + 1 < spectate.gamesTotal
            ? () => startSpectate(tournament, spectate.matchId, spectate.gameIndex + 1)
            : tournamentGameActive || spectating ? returnToTournamentHub : undefined
        }
        tournamentContinueLabel={spectating && spectate.gameIndex + 1 < spectate.gamesTotal ? `Partita ${spectate.gameIndex + 2}` : 'Torna al torneo'}
        onTournamentSecondary={spectating && spectate.gameIndex + 1 < spectate.gamesTotal ? returnToTournamentHub : undefined}
        outcomeOverride={spectating && gameResult ? {
          // il portale è stretto: titolo corto, il nome dell'esercito va nella riga sotto
          title: `Partita ${spectate.gameIndex + 1}`,
          desc: gameResult.winner === 'draw'
            ? 'Pareggio'
            : `Vince ${gameResult.winner === 'player' ? spectate.names.a : spectate.names.b} · ${gameResult.reason === 'fields' ? 'Conquista' : 'Punti Vita'}`,
          color: gameResult.winner === 'player' ? playerIdentityColor : gameResult.winner === 'enemy' ? enemyIdentityColor : null,
        } : null}
        onRematch={
          isOnlinePvP && multiplayerSession && !onlineOpponentLeft
            ? () => requestOnlineRematch('same')
            : !isOnlinePvP &&
                !tournamentGameActive &&
                !guidedMatch.active &&
                selectedMode !== 'campaign' &&
                selectedMode !== 'multiplayer' &&
                selectedArmy &&
                selectedDeckKey
              ? () => {
                  aiThinkGenerationRef.current += 1;
                  if (aiAgentThinkTimerRef.current) {
                    clearTimeout(aiAgentThinkTimerRef.current);
                    aiAgentThinkTimerRef.current = null;
                  }
                  aiHasSelectedAgent.current = false;
                  setPlayerConfirmedAwaitingAI(false);
                  setVictoryCondFx(null);
                  setShowFinalRoundAnimation(false);
                  ai.resetAiSession();
                  clearCardPreview();
                  startStandardGame(
                    selectedArmy,
                    selectedDeckKey,
                    gameMode || selectedMode || 'classic',
                    aiDifficulty || 'medium',
                    ALL_BATTLEFIELDS,
                    enemyHand?.[0]?.army
                      || enemyUsedCards?.[0]?.army
                      || shuffleDealSetup?.enemyArmy
                      || null,
                    null,
                    null,
                    {
                      eminenceFormat: eminenceMatchState?.format ?? undefined,
                    }
                  );
                }
              : undefined
        }
        onRematchChangeDeck={
          isOnlinePvP && multiplayerSession && !onlineOpponentLeft
            ? () => requestOnlineRematch('change')
            : undefined
        }
        rematchLabel={isOnlinePvP ? 'Rematch (stesso mazzo)' : 'Rematch'}
        rematchChangeDeckLabel="Rematch (cambia mazzo)"
        endGameActionsReady={!outcomeOverlayKind}
        onOpenPlaytest={IS_PUBLIC_PLAYTEST_BUILD || spectating ? undefined : () => {
          setGamePhase('playtestHistory');
        }}
        onReplayDuel={replayDuelAnimation}
        onSkipDuel={skipDuelAndResult}
        continueReady={duelHp.settled}
        duelEsito={portalDuelEsito}
        decision={portalDecision}
      />

      {spectating && (() => {
        const frame = spectate.frames[Math.min(spectate.index, spectate.frames.length - 1)];
        const shown = gamePhase === 'result' && battleResult && duelPhase >= 4 && duelHp.settled;
        const field = battlefields[frame.fieldIndex];
        let line = `Turno ${frame.before.roundNumber} · ${field?.name || 'Campo'} · apre ${frame.before.isPlayerFirst ? spectate.names.a : spectate.names.b}`;
        if (gamePhase === 'gameOver' && gameResult) {
          line = gameResult.winner === 'draw'
            ? 'Partita finita in pareggio'
            : `${gameResult.winner === 'player' ? spectate.names.a : spectate.names.b} vince la partita ${gameResult.reason === 'fields' ? 'per Conquista' : 'per Punti Vita'}`;
        } else if (shown) {
          const aWon = frame.battleResult.winner === 'player';
          const [w, l] = aWon ? [frame.cardA, frame.cardB] : [frame.cardB, frame.cardA];
          const [vw, vl] = aWon ? [frame.battleResult.playerAssault, frame.battleResult.enemyAssault] : [frame.battleResult.enemyAssault, frame.battleResult.playerAssault];
          line = `${w.name} batte ${l.name} · VA ${vw} a ${vl}`;
        }
        return (
          <SpectatorHud
            roundName={spectate.roundName}
            gameNumber={spectate.gameIndex + 1}
            names={spectate.names}
            colors={{ a: playerIdentityColor, b: enemyIdentityColor }}
            series={spectate.seriesBefore}
            hp={{ a: playerHP, b: enemyHP }}
            line={line}
            over={gamePhase === 'gameOver'}
            auto={spectateAuto}
            onToggleAuto={() => setSpectateAuto((v) => !v)}
            onSkip={() => advanceSpectate(true)}
          />
        );
      })()}

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
        className={`absolute bg-transparent border-none rounded-xl flex flex-col items-center justify-center p-5 pointer-events-none ease-in-out${holdForConfirmedAgentPick ? ' em-agent-pick-target' : ''}${multiSeatLeaving?.enemy ? ' ms-leave-enemy' : ''}${multiSeatEntry.enemy ? ' ms-arrive' : ''} ms-zone-enemy ${
          isZoomed ? '' : ''
        }`}
        style={{
          top: '50%', 
          left: '50%', 
          transform: isZoomed ? 'translate3d(-450px, -50%, 0) scale(1.05)' : 'translate3d(-380px, -50%, 0)', 
          width: '240px', 
          height: '400px', 
          zIndex: 5,
          overflow: 'visible',
          willChange: 'transform',
          transitionProperty: 'transform',
          transitionDuration: `${duelVfx.zoomTransitionMs}ms`,
          transitionTimingFunction: 'ease-in-out',
          transitionDelay: isZoomed ? `${duelVfx.zoomDelayMs}ms` : '0ms',
        }}
      >
        {gamePhase !== 'result' && (
          <div className="text-red-400 text-sm font-bold mb-3 uppercase tracking-wide satze-duel-label">Il Nemico</div>
        )}
        {multiSeatWaitingShown && (
          <MultiSeatWaitingQueue side="enemy" entries={multiSeatQueue.waiting.enemy} cardLayout={galleryCardLayout === 'reworkP4html' ? 'reworkP4' : galleryCardLayout} />
        )}
          {showDeployedEnemyAgent && (
          <div className={`relative flex items-center justify-center flex-shrink-0${holdForConfirmedAgentPick ? ' pointer-events-auto' : ''}`} data-field-agent="enemy" style={{ transformStyle: 'flat', '--acc-en': getArmyAccent(enemyAgent, enemyIdentityColor), '--acc': getArmyAccent(enemyAgent, enemyIdentityColor) }}>
            <React.Fragment key={`enemy-place-${enemyAgent.id}-${enemyPose}-${enemyPlaceFxStyle || 'default'}`}>
              <div className={`place-fx fx-${enemyPose}${placeFxStyleClass(enemyPlaceFxStyle)}`} style={enemyPose === 'none' ? { display: 'none' } : undefined}>
                <div className="place-shadow" />
                <div className="place-flash" />
                <div className="place-ring" />
                <div className="place-ring b" />
                <div className="place-echo" />
                <div className="place-echo e2" />
                <div className="place-echo e3" />
                <div className="place-edge l" />
                <div className="place-edge r" />
                <div className="place-dust" />
              </div>
              <div
                className={`place-card play-${enemyPose} relative flex items-center justify-center`}
                style={needsTwoFaces(enemyPose) ? { width: 230, height: 330 } : undefined}
              >
                {needsTwoFaces(enemyPose) ? (
                  <div className="place-flip-inner">
                    <div className="place-flip-face">
                      <ArmyEntryFx agent={enemyAgent} enabled={enemyArmyEntry !== 'off'} delayMs={0} onComplete={markEnemyArmyEntryDone}>
                        <GameCard
                          cardLayout={galleryCardLayout === 'reworkP4html' ? 'reworkP4' : galleryCardLayout}
                          agent={displayEnemyAgent}
                          showBonus={enemyArmyBonuses[enemyAgent.army] && isBonusTriggerSatisfied(enemyAgent.army, false, enemyAgent)}
                          bonusBaseInactive={Boolean(ARMY_BONUSES[enemyAgent.army]) && !enemyArmyBonuses[enemyAgent.army]}
                          effectiveArmyBonus={enemyEffectiveArmyBonus}
                          effectiveAbility={resolveEffectiveAbility(displayEnemyAgent?.ability, false, displayEnemyAgent)}
                          abilityCurrentValue={getAbilityCurrentValue(enemyAgent, false)}
                          onHover={handleEnemyPreviewClick}
                          onClick={holdForConfirmedAgentPick ? () => tryPickEminenceCard(enemyAgent.id) : undefined}
                        />
                      </ArmyEntryFx>
                    </div>
                    <div className="place-flip-face back">
                      <CardBack
                        armies={enemyDeckVisual?.armies}
                        deck={enemyHand}
                        backImage={duelCardBacks.enemy}
                        fallbackArmy={enemyAgent.army}
                        borderRadius={10}
                      />
                    </div>
                  </div>
                ) : (
                  <ArmyEntryFx agent={enemyAgent} enabled={enemyArmyEntry !== 'off'} delayMs={0} captureKey={enemyEntryCaptureKey} onComplete={markEnemyArmyEntryDone}>
                    <GameCard
                      {...enemyEntryCard}
                      onHover={handleEnemyPreviewClick}
                      onClick={holdForConfirmedAgentPick ? () => tryPickEminenceCard(enemyAgent.id) : undefined}
                    />
                  </ArmyEntryFx>
                )}
              </div>
            </React.Fragment>
          </div>
        )}
        {gamePhase === 'selectAgent' && !enemyAgent && (
          <div className="text-slate-500 text-sm text-center imp-wait-hint">In attesa...</div>
        )}
        <EntryPrecapture items={enemyEntryPrecaptureItems} enabled={enemyEntryPrecaptureOn} />
        {/* Risultato duello: fasi VA/FC/danno = src/components/battle/DuelResultDuelBodies.jsx (stesso del VFX Lab) */}
        {gamePhase === 'result' && battleResult && showDuelResultBodies && (
          <DuelResultEnemyResultBody
            battleResult={battleResult}
            duelPhase={duelPhase}
            duelEffectStep={visualEffectStep}
            duelVfx={duelVfx}
            showClashAnimation={showClashAnimation}
            focusGlow={duelFocusGlow('enemy')}
            focusAccent={enemyIdentityColor}
            overdrive={duelOverdriveOn('enemy')}
            galleryCardLayout={galleryCardLayout}
            getAbilityCurrentValue={getAbilityCurrentValue}
            onCardHover={handleCardPreviewClick}
            cinemaHideAgent={cinemaHideAgent}
          />
        )}
      </div>
      
      {/* Zona Duello Player - Destra del centro */}
      <div 
        className={`absolute bg-transparent border-none rounded-xl flex flex-col items-center justify-center p-5 pointer-events-none ease-in-out${holdForConfirmedAgentPick ? ' em-agent-pick-target' : ''}${multiSeatLeaving?.player ? ' ms-leave-player' : ''}${multiSeatEntry.player ? ' ms-arrive' : ''} ms-zone-player ${
          isZoomed ? '' : ''
        }`}
        style={{
          top: '50%', 
          left: '50%', 
          transform: isZoomed ? 'translate3d(210px, -50%, 0) scale(1.05)' : 'translate3d(140px, -50%, 0)', 
          width: '240px', 
          height: '400px', 
          zIndex: 5,
          overflow: 'visible',
          willChange: 'transform',
          transitionProperty: 'transform',
          transitionDuration: `${duelVfx.zoomTransitionMs}ms`,
          transitionTimingFunction: 'ease-in-out',
          transitionDelay: isZoomed ? `${duelVfx.zoomDelayMs}ms` : '0ms',
        }}
      >
        {gamePhase !== 'result' && (
          <div className="text-blue-400 text-sm font-bold mb-3 uppercase tracking-wide satze-duel-label">L'eroe</div>
        )}
        {multiSeatWaitingShown && (
          <MultiSeatWaitingQueue side="player" entries={multiSeatQueue.waiting.player} cardLayout={galleryCardLayout === 'reworkP4html' ? 'reworkP4' : galleryCardLayout} />
        )}
        {showDeployedPlayerAgent && (
          <div
            ref={playerCardZoneRef}
            className="relative flex items-center justify-center pointer-events-auto flex-shrink-0"
            data-field-agent="player"
            style={{ transformStyle: 'flat', '--acc': getArmyAccent(selectedAgent, playerIdentityColor) }}
          >
            <React.Fragment key={`place-${selectedAgent.id}-${agentPose}-${agentPlaceFxStyle || 'default'}`}>
              <div className={`place-fx fx-${agentPose}${placeFxStyleClass(agentPlaceFxStyle)}`} style={agentPose === 'none' ? { display: 'none' } : undefined}>
                <div className="place-shadow" />
                <div className="place-flash" />
                <div className="place-ring" />
                <div className="place-ring b" />
                <div className="place-echo" />
                <div className="place-echo e2" />
                <div className="place-echo e3" />
                <div className="place-edge l" />
                <div className="place-edge r" />
                <div className="place-dust" />
              </div>
              <div
                className={`place-card play-${agentPose} relative flex items-center justify-center`}
                style={needsTwoFaces(agentPose) ? { width: 230, height: 330 } : undefined}
              >
                {needsTwoFaces(agentPose) ? (
                  <div className="place-flip-inner">
                    <div className="place-flip-face">
                      <ArmyEntryFx agent={selectedAgent} enabled={agentArmyEntry.mode !== 'off'} delayMs={agentArmyEntry.delayMs} onComplete={markPlayerArmyEntryDone}>
                        <GameCard
                          cardLayout={galleryCardLayout === 'reworkP4html' ? 'reworkP4' : galleryCardLayout}
                          agent={displaySelectedAgent}
                          showBonus={playerArmyBonuses[selectedAgent.army] && isBonusTriggerSatisfied(selectedAgent.army, true, selectedAgent)}
                          bonusBaseInactive={Boolean(ARMY_BONUSES[selectedAgent.army]) && !playerArmyBonuses[selectedAgent.army]}
                          effectiveArmyBonus={playerEffectiveArmyBonus}
                          effectiveAbility={resolveEffectiveAbility(displaySelectedAgent?.ability, true, displaySelectedAgent)}
                          abilityCurrentValue={getAbilityCurrentValue(selectedAgent, true)}
                          overdrivePreview={playerOverdrivePreview}
                          onHover={handlePlayerPreviewClick}
                          onClick={holdForConfirmedAgentPick
                            ? () => tryPickEminenceCard(selectedAgent.id)
                            : gamePhase === 'selectAgent' && !spectating ? () => { flyDeployedAgentBackToHand(selectedAgent); setSelectedAgent(null); } : undefined}
                          onDragStart={gamePhase === 'selectAgent' ? handleDragStart : undefined}
                          isDragging={draggingCard?.id === selectedAgent?.id}
                        />
                      </ArmyEntryFx>
                    </div>
                    <div className="place-flip-face back">
                      <CardBack
                        armies={playerDeckVisual?.armies}
                        deck={playerHand}
                        backImage={duelCardBacks.player}
                        fallbackArmy={selectedAgent.army}
                        borderRadius={10}
                      />
                    </div>
                  </div>
                ) : (
                  <ArmyEntryFx agent={selectedAgent} enabled={agentArmyEntry.mode !== 'off'} delayMs={agentArmyEntry.delayMs} onComplete={markPlayerArmyEntryDone}>
                    <GameCard
                      cardLayout={galleryCardLayout === 'reworkP4html' ? 'reworkP4' : galleryCardLayout}
                      agent={displaySelectedAgent}
                      showBonus={playerArmyBonuses[selectedAgent.army] && isBonusTriggerSatisfied(selectedAgent.army, true, selectedAgent)}
                      bonusBaseInactive={Boolean(ARMY_BONUSES[selectedAgent.army]) && !playerArmyBonuses[selectedAgent.army]}
                      effectiveArmyBonus={playerEffectiveArmyBonus}
                      effectiveAbility={resolveEffectiveAbility(displaySelectedAgent?.ability, true, displaySelectedAgent)}
                      abilityCurrentValue={getAbilityCurrentValue(selectedAgent, true)}
                      overdrivePreview={playerOverdrivePreview}
                      onHover={handlePlayerPreviewClick}
                      onClick={holdForConfirmedAgentPick
                        ? () => tryPickEminenceCard(selectedAgent.id)
                        : gamePhase === 'selectAgent' && !spectating ? () => { flyDeployedAgentBackToHand(selectedAgent); setSelectedAgent(null); } : undefined}
                      onDragStart={gamePhase === 'selectAgent' ? handleDragStart : undefined}
                      isDragging={draggingCard?.id === selectedAgent?.id}
                    />
                  </ArmyEntryFx>
                )}
              </div>
            </React.Fragment>
          </div>
        )}
        {gamePhase === 'selectAgent' && !selectedAgent && (
          <div
            ref={dropZoneRef}
            className={`satze-agent-dropzone w-44 h-64 rounded-xl pointer-events-auto cursor-copy${draggingCard ? ' is-dragging' : ''}${isOverDropZone ? ' is-over' : ''}`}
            style={{ '--acc': draggingCard ? getArmyAccent(draggingCard, playerIdentityColor) : playerIdentityColor }}
          >
            <div className="satze-agent-dropzone__glow" aria-hidden />
            <div className="satze-agent-dropzone__frame" aria-hidden />
            <div className="satze-agent-dropzone__silhouette" aria-hidden />
            <div className="satze-agent-dropzone__label">
              {isOverDropZone ? 'Rilascia' : draggingCard ? 'Qui' : <>Trascina<br />un Agente</>}
            </div>
          </div>
        )}
        {gamePhase === 'result' && battleResult && showDuelResultBodies && (
          <DuelResultPlayerResultBody
            battleResult={battleResult}
            duelPhase={duelPhase}
            duelEffectStep={visualEffectStep}
            duelVfx={duelVfx}
            showClashAnimation={showClashAnimation}
            focusGlow={duelFocusGlow('player')}
            focusAccent={playerIdentityColor}
            overdrive={duelOverdriveOn('player')}
            galleryCardLayout={galleryCardLayout}
            getAbilityCurrentValue={getAbilityCurrentValue}
            onCardHover={handleCardPreviewClick}
            cinemaHideAgent={cinemaHideAgent}
          />
        )}
      </div>

      {gamePhase === 'result' && battleResult && duelPhase >= 4 && vfxProfile.clashVfxEnabled && (
        <div
          style={{ display: 'contents' }}
          className={`${multiSeatLeaving?.enemy ? 'ms-leave-enemy' : ''}${multiSeatLeaving?.player ? ' ms-leave-player' : ''}`}
        >
        <DuelClashAuroraSequence
          battleResult={battleResult}
          duelPhase={duelPhase}
          duelEffectStep={visualEffectStep}
          variant="n5"
          galleryCardLayout={galleryCardLayout}
          getAbilityCurrentValue={getAbilityCurrentValue}
          isZoomed={isZoomed}
          hideOrbitCoins
          playerOverdrive={duelOverdriveOn('player')}
          enemyOverdrive={duelOverdriveOn('enemy')}
        />
        </div>
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

      {holdForConfirmedAgentPick && (
        <div
          className="em-agent-pick-hud satze-hud-panel"
          style={{ fontFamily: HUD_ORATORIO_FONT_UI }}
        >
          <div className="em-agent-pick-hud-name" style={{ color: PALETTE.amber }}>
            {confirmedPickAbility?.name || 'Eminenza'}
          </div>
          <div className="em-agent-pick-hud-title" style={{ color: PALETTE.textPrimary }}>
            Scegli l'Agente
          </div>
          {confirmedPickAbility?.text && (
            <div className="em-agent-pick-hud-note" style={{ color: PALETTE.textSecondary }}>
              {confirmedPickAbility.text}
            </div>
          )}
        </div>
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
          className={`hud-round flex flex-col items-center justify-center gap-0.5 px-4 py-2 w-fit min-w-0 shrink-0 text-center satze-hud-panel ${gamePhase === 'result' ? 'animate-fade-out-panels' : ''}`}
          style={{ fontFamily: HUD_ORATORIO_FONT_UI }}
        >
          <span className="font-bold text-sm uppercase tracking-wider" style={{ color: PALETTE.amber }}>
            Round {roundNumber}/{playerHand.length > 0 ? Math.max(playerHand.length, roundNumber) : 5}
          </span>
        </div>

        <div
          role="button"
          tabIndex={0}
          className={`hud-exit bg-black/70 rounded-b-lg flex justify-center items-center px-4 py-2 cursor-pointer hover:bg-black/80 transition-colors w-fit shrink-0 pointer-events-auto ${
            gamePhase === 'result' ? 'animate-fade-out-panels' : ''
          }`}
          style={gamePhase === 'result' ? { pointerEvents: 'none' } : undefined}
          onClick={() => {
            if (spectating) { returnToTournamentHub(); return; }
            if (tournamentGameActive && isOnlinePvP) {
              if (window.confirm("Vuoi abbandonare il torneo online? Il tuo esercito passerà a un'IA.")) tnOnlineRef.current.leave();
              return;
            }
            if (tournamentGameActive) {
              if (window.confirm('Vuoi tornare al tabellone? Questa partita andrà rigiocata con la stessa mano.')) returnToTournamentHub();
              return;
            }
            if (window.confirm('Vuoi davvero abbandonare la partita?')) {
              if (campaignDuelMod?.firstAct) abandonFirstActAttempt(campaignSaveSlot);
              setCampaignLevel(null);
              setGamePhase(selectedMode === 'campaign' ? 'campaignHub' : 'menu');
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              if (spectating) { returnToTournamentHub(); return; }
              if (tournamentGameActive && isOnlinePvP) {
                if (window.confirm("Vuoi abbandonare il torneo online? Il tuo esercito passerà a un'IA.")) tnOnlineRef.current.leave();
                return;
              }
              if (tournamentGameActive) {
                if (window.confirm('Vuoi tornare al tabellone? Questa partita andrà rigiocata con la stessa mano.')) returnToTournamentHub();
                return;
              }
              if (window.confirm('Vuoi davvero abbandonare la partita?')) {
              if (campaignDuelMod?.firstAct) abandonFirstActAttempt(campaignSaveSlot);
                setCampaignLevel(null);
                setGamePhase(selectedMode === 'campaign' ? 'campaignHub' : 'menu');
              }
            }
          }}
        >
          <span className="text-amber-400 font-bold">SATZE</span>
        </div>
      </div>

      {/* ============================================ */}
      {/* DATI IA - Alto Sinistra - z-index 10 */}
      {/* ============================================ */}
      <StatsPanel
        label={mpEnemyLabel}
        hp={shownEnemyHP}
        hpBursts={duelHp.bursts.enemy}
        fcBursts={duelHp.fcBursts.enemy}
        fadeOnResult={false}
        styleOverride={gamePhase === 'result' ? { zIndex: 20 } : null /* sopra le barre cinema (z 15) */}
        focus={shownEnemyFC}
        toxin={shownEnemyToxin}
        position="top-left"
        gamePhase={gamePhase}
        accentColor={ARMY_COLORS[enemyHand?.[0]?.army]?.accent}
      />

      {/* ============================================ */}
      {/* DATI PLAYER - Basso Destra - z-index 10 */}
      {/* ============================================ */}
      <StatsPanel
        label={mpSelfLabel}
        hp={shownPlayerHP}
        hpBursts={duelHp.bursts.player}
        fcBursts={duelHp.fcBursts.player}
        fadeOnResult={false}
        styleOverride={gamePhase === 'result' ? { zIndex: 20 } : null /* sopra le barre cinema (z 15) */}
        focus={shownPlayerFC}
        toxin={shownPlayerToxin}
        position="bottom-right"
        gamePhase={gamePhase}
        accentColor={playerIdentityColor}
      />

      {/* ============================================ */}
      {/* ANIMAZIONE ROUND 5 / ESITO — overlay handoff duello2 */}
      {/* ============================================ */}
      <DuelRound5Overlay active={showFinalRoundAnimation} />
      <DuelWinOverlay
        active={outcomeOverlayKind === 'win'}
        sealSrcs={playerArmySealSrcs}
        subtitle={getDuelOutcomeSubtitle(gameResult, 'win')}
      />
      <DuelLoseOverlay
        active={outcomeOverlayKind === 'lose'}
        sealSrcs={playerArmySealSrcs}
        subtitle={getDuelOutcomeSubtitle(gameResult, 'lose')}
      />

      {/* ============================================ */}
      {/* RECLAMAZIONE - Scelta vittoria (round 3 o 4) */}
      {/* ============================================ */}
      {showClaimVictoryChoice && showClaimVictoryChoice.winner === 'player' && (
        <ClaimVictoryPopup
          fields={showClaimVictoryChoice.playerFields ?? 3}
          accentColor={playerIdentityColor}
          onClaim={() => {
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
          onContinue={() => {
            sendClaimDecisionRelay(
              'continue',
              showClaimVictoryChoice.playerFields,
              showClaimVictoryChoice.enemyFields
            );
            setShowClaimVictoryChoice(null);
            doResetAndNextRound(showClaimVictoryChoice.playerFields, showClaimVictoryChoice.enemyFields);
          }}
        />
      )}

      {/* Attesa decisione reclamazione avversario (multiplayer, round 3–4) */}
      {opponentClaimPresence.present && isOnlinePvP && (
        <OpponentClaimPendingPopup
          opponentName={onlinePeerName}
          accentColor={enemyIdentityColor}
          leaving={opponentClaimPresence.leaving}
        />
      )}

      {/* Carta trascinata: cresce dalla mano, si inclina col moto, si aggancia allo slot.
          Posizione via transform scritta dal hook (niente left/top né filter per frame). */}
      {draggingCard && dragVisual && createPortal(
        <div
          ref={dragGhostRef}
          className="satze-drag-ghost"
          style={{ transform: dragVisual.transform, zIndex: 99990 }}
        >
          <div className="satze-drag-ghost-shadow" aria-hidden />
          <div className="relative">
            <GameCard
              agent={draggingCard}
              showBonus={playerArmyBonuses[draggingCard.army] && isBonusTriggerSatisfied(draggingCard.army, true, draggingCard)}
              bonusBaseInactive={Boolean(ARMY_BONUSES[draggingCard.army]) && !playerArmyBonuses[draggingCard.army]}
              effectiveAbility={resolveEffectiveAbility(draggingCard.ability, true, draggingCard)}
            />
          </div>
        </div>,
        document.body
      )}

      <CardFlightLayer
        flights={cardFlights.flights}
        onDone={cardFlights.done}
        renderCard={(agent) => <GameCard agent={agent} suppressAnimations />}
      />

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

      <div className="dep-vignette" aria-hidden />
    </div>)
  );
}

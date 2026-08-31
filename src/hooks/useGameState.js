// ============================================
// HOOK: useGameState
// Gestisce tutti gli stati del gioco
// ============================================

import { useState, useEffect } from 'react';

const GALLERY_CARD_LAYOUT_KEY = 'satze_gallery_card_layout';

function readGalleryCardLayout() {
  if (typeof window === 'undefined') return 'reworkP4';
  try {
    const v = window.localStorage.getItem(GALLERY_CARD_LAYOUT_KEY);
    if (v === 'reworkP4' || v === 'reworkP4html') return v;
    if (v === 'classic') return 'reworkP4';
    return 'reworkP4';
  } catch {
    return 'reworkP4';
  }
}

/**
 * Hook per gestire lo stato completo del gioco
 * @returns {Object} Oggetto con tutti gli stati e i setter
 */
export function useGameState() {
  // Stati di gioco principali
  const [gamePhase, setGamePhase] = useState('menu'); // menu, setup, selectField, selectAgent, selectFocus, battle, result, gameOver
  const [gameMode, setGameMode] = useState('classic'); // 'classic' | 'bareHands'
  const [playerHand, setPlayerHand] = useState([]);
  const [enemyHand, setEnemyHand] = useState([]);
  const [battlefields, setBattlefields] = useState([]);
  const [conqueredFields, setConqueredFields] = useState({}); // { fieldIndex: { winner: 'player'|'enemy', army: string } }
  
  // Statistiche giocatori
  const [playerHP, setPlayerHP] = useState(25);
  const [enemyHP, setEnemyHP] = useState(25);
  const [playerFocus, setPlayerFocus] = useState(18);
  const [enemyFocus, setEnemyFocus] = useState(18);
  
  // Selezione agenti e focus
  const [currentFieldIndex, setCurrentFieldIndex] = useState(null);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [selectedFocus, setSelectedFocus] = useState(1);
  const [enemyAgent, setEnemyAgent] = useState(null);
  const [enemySelectedFocus, setEnemySelectedFocus] = useState(1);
  
  // Carte usate e risultati
  const [playerUsedCards, setPlayerUsedCards] = useState([]);
  const [enemyUsedCards, setEnemyUsedCards] = useState([]);
  const [cardBattleOutcomes, setCardBattleOutcomes] = useState({}); // { 'player:id' | 'enemy:id': 'winner' | 'loser' }
  
  // Battaglia
  const [isPlayerFirst, setIsPlayerFirst] = useState(true);
  /** Iniziativa del round 1: usata per derivare i round successivi (niente toggle). */
  const [openingPlayerFirst, setOpeningPlayerFirst] = useState(true);
  const [battleResult, setBattleResult] = useState(null);
  const [logs, setLogs] = useState([]);
  /** Structured battle-log history (last N complete rounds). */
  const [battleEvents, setBattleEvents] = useState([]);
  
  // Round e vincitori
  const [roundNumber, setRoundNumber] = useState(1);
  const [lastWinner, setLastWinner] = useState(null);
  const [revealedFields, setRevealedFields] = useState(3);
  const [gameResult, setGameResult] = useState(null); // { winner: 'player'|'enemy', reason: 'hp'|'fields'|'cards' }
  
  // Bonus armata (calcolati a inizio partita, non cambiano)
  const [playerArmyBonuses, setPlayerArmyBonuses] = useState({});
  const [enemyArmyBonuses, setEnemyArmyBonuses] = useState({});
  
  // Tossina (persiste tra i turni)
  const [playerToxin, setPlayerToxin] = useState(null); // { value, minHealth, source } o null
  const [enemyToxin, setEnemyToxin] = useState(null); // { value, minHealth, source } o null
  
  // UI states
  const [hoveredCard, setHoveredCard] = useState(null);
  const [hoveredField, setHoveredField] = useState(null);
  const [showGlossary, setShowGlossary] = useState(false);
  
  // Galleria
  const [galleryTab, setGalleryTab] = useState('agents'); // 'agents' | 'battlefields'
  const [selectedArmyFilter, setSelectedArmyFilter] = useState("Figli dell'Orizzonte");
  const [galleryCardLayout, setGalleryCardLayout] = useState(readGalleryCardLayout);

  useEffect(() => {
    try {
      window.localStorage.setItem(GALLERY_CARD_LAYOUT_KEY, galleryCardLayout);
    } catch {
      /* ignore */
    }
  }, [galleryCardLayout]);
  
  // Drag and drop
  const [draggingCard, setDraggingCard] = useState(null);
  const [selectedMode, setSelectedMode] = useState('classic');
  const [selectedArmy, setSelectedArmy] = useState(null);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [isOverDropZone, setIsOverDropZone] = useState(false);
  
  // Selezione deck e difficoltà
  const [selectedDeckKey, setSelectedDeckKey] = useState(null);
  const [aiDifficulty, setAiDifficulty] = useState(null); // 'easy' | 'medium' | 'hard' (legacy 'chaos' → medium)
  
  // UI states aggiuntivi
  const [showDeckManager, setShowDeckManager] = useState(false);
  const [deckManagerView, setDeckManagerView] = useState('list'); // 'list' | 'builder'
  const [deckManagerSource, setDeckManagerSource] = useState('menu'); // 'menu' | 'deckSelection' - da dove è stato aperto
  const [editingDeckId, setEditingDeckId] = useState(null);
  const [showClaimVictoryChoice, setShowClaimVictoryChoice] = useState(null); // { winner, playerFields, enemyFields } per reclamazione
  
  // Multiplayer locale / online
  const [isMultiplayer, setIsMultiplayer] = useState(false);
  /** Sessione WebSocket dopo lobby: { roomCode, role, playerName, playerId, reconnectSecret } */
  const [multiplayerSession, setMultiplayerSession] = useState(null);
  const [player2Hand, setPlayer2Hand] = useState([]);
  const [player2HP, setPlayer2HP] = useState(25);
  const [player2Focus, setPlayer2Focus] = useState(18);
  const [player2UsedCards, setPlayer2UsedCards] = useState([]);
  const [player2ArmyBonuses, setPlayer2ArmyBonuses] = useState({});
  const [player2Toxin, setPlayer2Toxin] = useState(null);
  const [currentPlayer, setCurrentPlayer] = useState(1); // 1 o 2, chi sta giocando ora
  
  // Campagna
  const [campaignLevel, setCampaignLevel] = useState(null);
  /** Slot salvataggio campagna attivo (0–2). */
  const [campaignSaveSlot, setCampaignSaveSlot] = useState(0);
  /** Campagna: modificatori duello da missione. */
  const [campaignDuelMod, setCampaignDuelMod] = useState(null);

  /**
   * Sottosistema Eminenze. `null` finché una partita non lo attiva esplicitamente:
   * i formati che non lo richiedono girano come prima della sua introduzione.
   */
  const [eminenceMatchState, setEminenceMatchState] = useState(null);

  /** Setup animazione mischia & deal (fase shuffleDeal). */
  const [shuffleDealSetup, setShuffleDealSetup] = useState(null);
  /** Identità visiva mazzo (accent + armate dal deck da 10) — persiste per tutta la partita. */
  const [playerDeckVisual, setPlayerDeckVisual] = useState(null);
  const [enemyDeckVisual, setEnemyDeckVisual] = useState(null);
  
  return {
    // Game phase
    gamePhase,
    setGamePhase,
    gameMode,
    setGameMode,
    
    // Hands and battlefields
    playerHand,
    setPlayerHand,
    enemyHand,
    setEnemyHand,
    battlefields,
    setBattlefields,
    conqueredFields,
    setConqueredFields,
    
    // Player stats
    playerHP,
    setPlayerHP,
    enemyHP,
    setEnemyHP,
    playerFocus,
    setPlayerFocus,
    enemyFocus,
    setEnemyFocus,
    
    // Selection
    currentFieldIndex,
    setCurrentFieldIndex,
    selectedAgent,
    setSelectedAgent,
    selectedFocus,
    setSelectedFocus,
    enemyAgent,
    setEnemyAgent,
    enemySelectedFocus,
    setEnemySelectedFocus,
    
    // Used cards
    playerUsedCards,
    setPlayerUsedCards,
    enemyUsedCards,
    setEnemyUsedCards,
    cardBattleOutcomes,
    setCardBattleOutcomes,
    
    // Battle
    isPlayerFirst,
    setIsPlayerFirst,
    openingPlayerFirst,
    setOpeningPlayerFirst,
    battleResult,
    setBattleResult,
    logs,
    setLogs,
    battleEvents,
    setBattleEvents,
    
    // Round info
    roundNumber,
    setRoundNumber,
    lastWinner,
    setLastWinner,
    revealedFields,
    setRevealedFields,
    gameResult,
    setGameResult,
    
    // Army bonuses
    playerArmyBonuses,
    setPlayerArmyBonuses,
    enemyArmyBonuses,
    setEnemyArmyBonuses,
    
    // Toxin
    playerToxin,
    setPlayerToxin,
    enemyToxin,
    setEnemyToxin,
    
    // UI
    hoveredCard,
    setHoveredCard,
    hoveredField,
    setHoveredField,
    showGlossary,
    setShowGlossary,
    
    // Gallery
    galleryTab,
    setGalleryTab,
    selectedArmyFilter,
    setSelectedArmyFilter,
    galleryCardLayout,
    setGalleryCardLayout,
    
    // Drag and drop
    draggingCard,
    setDraggingCard,
    selectedMode,
    setSelectedMode,
    selectedArmy,
    setSelectedArmy,
    dragPosition,
    setDragPosition,
    isOverDropZone,
    setIsOverDropZone,
    
    // Selezione deck e difficoltà
    selectedDeckKey,
    setSelectedDeckKey,
    aiDifficulty,
    setAiDifficulty,
    
    // Multiplayer locale / online
    isMultiplayer,
    setIsMultiplayer,
    multiplayerSession,
    setMultiplayerSession,
    player2Hand,
    setPlayer2Hand,
    player2HP,
    setPlayer2HP,
    player2Focus,
    setPlayer2Focus,
    player2UsedCards,
    setPlayer2UsedCards,
    player2ArmyBonuses,
    setPlayer2ArmyBonuses,
    player2Toxin,
    setPlayer2Toxin,
    currentPlayer,
    setCurrentPlayer,
    
    // Campagna
    campaignLevel,
    setCampaignLevel,
    campaignSaveSlot,
    setCampaignSaveSlot,
    campaignDuelMod,
    setCampaignDuelMod,

    // Eminenze
    eminenceMatchState,
    setEminenceMatchState,

    shuffleDealSetup,
    setShuffleDealSetup,
    playerDeckVisual,
    setPlayerDeckVisual,
    enemyDeckVisual,
    setEnemyDeckVisual,
    
    // UI states aggiuntivi
    showDeckManager,
    setShowDeckManager,
    deckManagerView,
    setDeckManagerView,
    deckManagerSource,
    setDeckManagerSource,
    editingDeckId,
    setEditingDeckId,
    showClaimVictoryChoice,
    setShowClaimVictoryChoice,
  };
}

// ============================================
// Motore a simulazione ↔ stato del gioco
// ============================================
//
// Converte lo stato React (useGameState) nella vista del motore a simulazione,
// dal punto di vista dell'IA (lato `enemy`), con le sole informazioni pubbliche:
// l'Agente del giocatore solo se già schierato con l'iniziativa, mai i suoi FC.

import { chooseMonteCarloAction } from './mcSearch.js';
import { getMcProfile } from './mcProfiles.js';
import { mulberry32 } from '../../../utils/seededRandom.js';

const MC_MODES = new Set(['classic', 'bareHands']);
const MC_DIFFICULTIES = new Set(['easy', 'medium', 'hard', 'chaos']);

/**
 * Il motore a simulazione gioca Classico e Mani nude contro l'IA locale.
 * Le Eminenze non vengono simulate: con il formato Standard l'IA decide come se non
 * ci fossero (scelta concordata, vedi Documentazione/PIANO_MIGLIORAMENTO_IA.md).
 * Campagna e partite online restano sul motore precedente.
 */
export function isMonteCarloSupported(gameState) {
  if (!gameState) return false;
  if (!MC_MODES.has(gameState.gameMode || 'classic')) return false;
  if (gameState.campaignDuelMod) return false;
  if (!MC_DIFFICULTIES.has(gameState.aiDifficulty || 'medium')) return false;
  return Array.isArray(gameState.battlefields) && gameState.battlefields.length > 0;
}

const list = (value) => (Array.isArray(value) ? value : []);

/**
 * Vista per il motore a simulazione. Non legge mai `selectedFocus`.
 * @param {object} gameState
 */
export function buildMcViewFromGameState(gameState) {
  const battlefields = list(gameState.battlefields);
  const isPlayerFirst = gameState.isPlayerFirst !== false;
  return {
    gameMode: gameState.gameMode || 'classic',
    battlefields,
    conqueredFields: { ...(gameState.conqueredFields || {}) },
    revealedFields:
      gameState.revealedFields == null ? battlefields.length : Number(gameState.revealedFields),
    currentFieldIndex:
      gameState.currentFieldIndex == null ? null : Number(gameState.currentFieldIndex),

    playerHand: list(gameState.playerHand),
    enemyHand: list(gameState.enemyHand),
    playerArmyBonuses: gameState.playerArmyBonuses || {},
    enemyArmyBonuses: gameState.enemyArmyBonuses || {},
    playerHP: Number(gameState.playerHP) || 0,
    enemyHP: Number(gameState.enemyHP) || 0,
    playerFocus: Number(gameState.playerFocus) || 0,
    enemyFocus: Number(gameState.enemyFocus) || 0,
    playerUsedCards: list(gameState.playerUsedCards),
    enemyUsedCards: list(gameState.enemyUsedCards),
    playerToxin: gameState.playerToxin ?? null,
    enemyToxin: gameState.enemyToxin ?? null,

    roundNumber: Number(gameState.roundNumber) || 1,
    lastWinner: gameState.lastWinner ?? null,
    openingPlayerFirst:
      gameState.openingPlayerFirst != null ? Boolean(gameState.openingPlayerFirst) : isPlayerFirst,
    isPlayerFirst,

    // Agente del giocatore: pubblico solo se ha schierato per primo.
    selectedAgent: isPlayerFirst ? gameState.selectedAgent ?? null : null,
    enemyAgent: null,

    campaignDuelMod: null,
    eminenceState: null,
  };
}

/** Rende la vista trasferibile al worker (structuredClone-safe, senza funzioni). */
export function serializeMcView(view) {
  return JSON.parse(JSON.stringify(view));
}

/**
 * Decisione del motore a simulazione, nella forma attesa da useAI:
 * { card, cardId, focus, fieldIndex, score, debug }.
 *
 * @param {object} view - da buildMcViewFromGameState
 * @param {string} difficulty
 * @param {{ seed?: number, maxMs?: number, trait?: string }} [options] - trait: personalità (mcTraits.js)
 */
export function chooseMonteCarloDecision(view, difficulty, options = {}) {
  const profile = getMcProfile(difficulty);
  const params = {
    ...profile,
    maxMs: options.maxMs ?? profile.maxMs,
    trait: options.trait || 'neutral',
  };
  const seed = options.seed ?? Math.floor(Math.random() * 2 ** 32);
  const decision = chooseMonteCarloAction(view, params, mulberry32(seed >>> 0));
  if (!decision) return null;
  const card = view.enemyHand.find((c) => c.id === decision.cardId) || null;
  return {
    card,
    cardId: decision.cardId,
    focus: decision.focus,
    fieldIndex: decision.fieldIndex,
    score: decision.mean,
    debug: {
      engine: 'montecarlo',
      difficulty: profile.id,
      trait: options.trait || 'neutral',
      winEstimate: Number(decision.mean.toFixed(3)),
      ...decision.stats,
    },
  };
}

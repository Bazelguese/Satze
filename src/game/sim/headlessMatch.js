// ============================================
// Partita 1v1 senza interfaccia (Classico / Mani nude)
// ============================================
//
// Gioca una partita intera con le stesse regole del gioco, senza React.
// Serve al banco di prova dell'IA (partite IA contro IA).
//
// Fonti delle regole riprodotte qui:
// - setup: src/hooks/useGameFlow.js (startGame) e src/utils/onlineMatch.js (mescolata con seme);
// - turno: chi ha l'iniziativa sceglie Campo e Agente per primo, l'altro vede l'Agente e risponde;
// - risoluzione: computeDuelResolution (src/game/duelResolve.js), come src/hooks/useBattle.js;
// - fine turno: Codice/satze.jsx (proceedToNextRound): Tossina, conquista, rivelazione Campi,
//   condizioni di vittoria, alternanza dell'iniziativa (resolveRoundInitiative).
//
// Fuori ambito: Eminenze, Campagna, Multiposto, Arena Contesa.
// Il setup della partita (mazzi, mani, Campi) è in headlessSetup.js: questo file contiene
// solo regole pure, senza dati di gioco, così il motore a simulazione può girare nel worker.
// Rivendicazione ai turni 3-4: chi raggiunge la maggioranza dei Campi la rivendica sempre.

import { computeDuelResolution } from '../duelResolve.js';
import { applyToxin } from '../toxinLogic.js';
import { countConqueredFields } from '../duel/duelHelpers.js';
import { computeLegalMaxFocus, getReservedFocus } from '../legalFocusSpend.js';
import { resolveRoundInitiative } from '../duel/resolveRoundInitiative.js';

export const HEADLESS_START_HP = 25;
export const HEADLESS_START_FOCUS = 18;
export const HEADLESS_HAND_SIZE = 5;
/** Turno da cui la vittoria per Campi lascia il posto alla Supremazia (PV). */
export const HEADLESS_SUPREMACY_ROUND = 5;

export const SIDES = ['player', 'enemy'];

export function otherSide(side) {
  return side === 'player' ? 'enemy' : 'player';
}

// ------------------------------------------------------------------
// Prospettive
// ------------------------------------------------------------------

const SWAP_WINNER = { player: 'enemy', enemy: 'player' };

function swapWinner(winner) {
  return SWAP_WINNER[winner] ?? winner;
}

function swapConquered(conqueredFields) {
  const out = {};
  for (const [index, entry] of Object.entries(conqueredFields || {})) {
    out[index] =
      entry && typeof entry === 'object' ? { ...entry, winner: swapWinner(entry.winner) } : entry;
  }
  return out;
}

/**
 * Stato visto da un lato, nella forma che legge l'IA (l'IA è sempre il lato `enemy`).
 * Il Focus scelto dall'avversario non compare mai: lo stato non lo contiene.
 *
 * @param {object} state
 * @param {'player'|'enemy'} side
 * @param {object|null} visibleOpponentAgent - Agente avversario già schierato, se c'è
 */
export function viewForSide(state, side, visibleOpponentAgent = null) {
  if (side === 'enemy') {
    return { ...state, selectedAgent: visibleOpponentAgent, enemyAgent: null };
  }
  return {
    ...state,
    playerHand: state.enemyHand,
    enemyHand: state.playerHand,
    playerArmyBonuses: state.enemyArmyBonuses,
    enemyArmyBonuses: state.playerArmyBonuses,
    playerHP: state.enemyHP,
    enemyHP: state.playerHP,
    playerFocus: state.enemyFocus,
    enemyFocus: state.playerFocus,
    playerUsedCards: state.enemyUsedCards,
    enemyUsedCards: state.playerUsedCards,
    playerToxin: state.enemyToxin,
    enemyToxin: state.playerToxin,
    conqueredFields: swapConquered(state.conqueredFields),
    lastWinner: swapWinner(state.lastWinner),
    isPlayerFirst: !state.isPlayerFirst,
    openingPlayerFirst: !state.openingPlayerFirst,
    selectedAgent: visibleOpponentAgent,
    enemyAgent: null,
  };
}

// ------------------------------------------------------------------
// Legalità
// ------------------------------------------------------------------

export function legalFieldIndexes(state) {
  const out = [];
  for (let i = 0; i < state.battlefields.length; i += 1) {
    if (i >= state.revealedFields) continue;
    if (i in state.conqueredFields) continue;
    out.push(i);
  }
  return out;
}

export function availableCards(state, side) {
  const hand = side === 'player' ? state.playerHand : state.enemyHand;
  const used = side === 'player' ? state.playerUsedCards : state.enemyUsedCards;
  return hand.filter((card) => !used.includes(card.id));
}

/** Range FC come nel gioco: minimo 1, massimo pool meno 1 FC per ogni Agente successivo. */
export function legalFocusRange(state, side) {
  const pool = side === 'player' ? state.playerFocus : state.enemyFocus;
  const remaining = availableCards(state, side).length;
  const maxFocus = computeLegalMaxFocus(pool, getReservedFocus(remaining));
  return { minFocus: 1, maxFocus, pool, cardsRemaining: remaining };
}

/** Come useAI: FC tra 1 e max(1, maxFocus). */
function clampFocus(state, side, focus) {
  const { maxFocus } = legalFocusRange(state, side);
  return Math.max(1, Math.min(Math.max(1, maxFocus), Number(focus) || 1));
}

export function sanitizeChoice(state, side, choice, { needsField }) {
  const cards = availableCards(state, side);
  const fields = legalFieldIndexes(state);
  const fixes = [];

  let card = cards.find((c) => c.id === (choice?.cardId ?? choice?.card?.id));
  if (!card) {
    card = cards[0];
    fixes.push('card');
  }
  let fieldIndex = state.currentFieldIndex;
  if (needsField) {
    fieldIndex = choice?.fieldIndex;
    if (!fields.includes(fieldIndex)) {
      fieldIndex = fields[0];
      fixes.push('field');
    }
  }
  const focus = clampFocus(state, side, choice?.focus);
  if (focus !== choice?.focus) fixes.push('focus');
  return { card, fieldIndex, focus, fixes };
}

// ------------------------------------------------------------------
// Fine turno
// ------------------------------------------------------------------

/**
 * Esito della partita dopo il turno, nello stesso ordine di Codice/satze.jsx.
 * @returns {{ winner: 'player'|'enemy'|'draw', reason: string }|null}
 */
export function resolveMatchEnd(state, roundJustPlayed) {
  const { playerFieldsConquered: playerFields, enemyFieldsConquered: enemyFields } =
    countConqueredFields(state.conqueredFields, state.playerHand, state.enemyHand);
  const majority = Math.floor(state.battlefields.length / 2) + 1;

  if (roundJustPlayed < HEADLESS_SUPREMACY_ROUND) {
    if (playerFields >= majority) return { winner: 'player', reason: 'fields' };
    if (enemyFields >= majority) return { winner: 'enemy', reason: 'fields' };
  }
  if (state.playerHP <= 0) return { winner: 'enemy', reason: 'hp' };
  if (state.enemyHP <= 0) return { winner: 'player', reason: 'hp' };

  if (!availableCards(state, 'player').length || !availableCards(state, 'enemy').length) {
    if (state.playerHP > state.enemyHP) return { winner: 'player', reason: 'supremacy' };
    if (state.enemyHP > state.playerHP) return { winner: 'enemy', reason: 'supremacy' };
    if (playerFields > enemyFields) return { winner: 'player', reason: 'fields_tiebreak' };
    if (enemyFields > playerFields) return { winner: 'enemy', reason: 'fields_tiebreak' };
    return { winner: 'draw', reason: 'draw' };
  }
  return null;
}

export function applyRoundOutcome(state, battleResult, fieldIndex, playerCard, enemyCard) {
  let playerHP = battleResult.finalPlayerHP;
  let enemyHP = battleResult.finalEnemyHP;
  let playerToxin = battleResult.playerToxinActivated || state.playerToxin;
  let enemyToxin = battleResult.enemyToxinActivated || state.enemyToxin;

  if (playerToxin || enemyToxin) {
    const toxin = applyToxin(playerToxin, enemyToxin, playerHP, enemyHP);
    playerHP = toxin.newPlayerHP;
    enemyHP = toxin.newEnemyHP;
    playerToxin = toxin.playerToxinActive;
    enemyToxin = toxin.enemyToxinActive;
  }

  const conqueredFields = { ...state.conqueredFields };
  const resolvedIndex = battleResult.fieldIndex ?? fieldIndex;
  conqueredFields[resolvedIndex] =
    battleResult.fieldDestroyed || battleResult.skipConquest
      ? { winner: null, destroyed: true }
      : { winner: battleResult.winner, army: battleResult.winnerArmy };

  return {
    ...state,
    playerHP,
    enemyHP,
    playerFocus: battleResult.finalPlayerFC,
    enemyFocus: battleResult.finalEnemyFC,
    playerToxin,
    enemyToxin,
    playerUsedCards: [...state.playerUsedCards, playerCard.id],
    enemyUsedCards: [...state.enemyUsedCards, enemyCard.id],
    lastWinner: battleResult.winner,
    conqueredFields,
    revealedFields: Math.min(state.battlefields.length, state.revealedFields + 1),
  };
}

// ------------------------------------------------------------------
// Partita
// ------------------------------------------------------------------

function now() {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

/**
 * Risolve un duello sul Campo `fieldIndex` con il risolutore del gioco, come useBattle.
 * @param {object} state
 * @param {number} fieldIndex
 * @param {{ card: object, focus: number }} playerPick
 * @param {{ card: object, focus: number }} enemyPick
 */
export function resolveHeadlessDuel(state, fieldIndex, playerPick, enemyPick, extra = {}) {
  const { battleResult } = computeDuelResolution({
    field: state.battlefields[fieldIndex],
    campaign: null,
    selectedAgent: playerPick.card,
    enemyAgent: enemyPick.card,
    selectedFocus: playerPick.focus,
    enemySelectedFocus: enemyPick.focus,
    playerHP: state.playerHP,
    enemyHP: state.enemyHP,
    playerFocus: state.playerFocus,
    enemyFocus: state.enemyFocus,
    playerUsedCards: state.playerUsedCards,
    enemyUsedCards: state.enemyUsedCards,
    isPlayerFirst: state.isPlayerFirst,
    lastWinner: state.lastWinner,
    playerArmyBonuses: state.playerArmyBonuses,
    enemyArmyBonuses: state.enemyArmyBonuses,
    playerToxin: state.playerToxin,
    enemyToxin: state.enemyToxin,
    roundNumber: state.roundNumber,
    conqueredFields: state.conqueredFields,
    playerHand: state.playerHand,
    enemyHand: state.enemyHand,
    currentFieldIndex: fieldIndex,
    // Eminenze (headlessEminenceMatch.js): bundle del Duello, snapshot Presenza, ecc.
    ...extra,
  });
  return battleResult;
}

/**
 * Un turno completo.
 * Gli agenti espongono `lead(view)` → { fieldIndex, cardId, focus } e
 * `respond(view)` → { cardId, focus }. `view` è lo stato dal loro punto di vista (IA = `enemy`).
 * `resolveDuel`: risolutore del Duello (le simulazioni con le Eminenze ne passano uno proprio).
 */
export function playHeadlessRound(state, agents, { resolveDuel = resolveHeadlessDuel } = {}) {
  const leader = state.isPlayerFirst ? 'player' : 'enemy';
  const follower = otherSide(leader);

  let t0 = now();
  const leadRaw = agents[leader].lead(viewForSide(state, leader, null));
  const leadMs = now() - t0;
  const lead = sanitizeChoice(state, leader, leadRaw, { needsField: true });

  const withField = { ...state, currentFieldIndex: lead.fieldIndex };
  t0 = now();
  const respRaw = agents[follower].respond(viewForSide(withField, follower, lead.card));
  const respMs = now() - t0;
  const resp = sanitizeChoice(withField, follower, respRaw, { needsField: false });

  const playerPick = leader === 'player' ? lead : resp;
  const enemyPick = leader === 'enemy' ? lead : resp;
  const fieldIndex = lead.fieldIndex;

  const battleResult = resolveDuel(state, fieldIndex, playerPick, enemyPick);

  const after = applyRoundOutcome(withField, battleResult, fieldIndex, playerPick.card, enemyPick.card);
  const record = {
    round: state.roundNumber,
    leader,
    fieldIndex,
    fieldId: state.battlefields[fieldIndex]?.id ?? null,
    player: { cardId: playerPick.card.id, focus: playerPick.focus, fixes: playerPick.fixes },
    enemy: { cardId: enemyPick.card.id, focus: enemyPick.focus, fixes: enemyPick.fixes },
    winner: battleResult.winner,
    ms: { [leader]: leadMs, [follower]: respMs },
    hpAfter: { player: after.playerHP, enemy: after.enemyHP },
  };
  return { state: after, record };
}

/**
 * Gioca la partita fino alla fine.
 * @returns {{ winner: 'player'|'enemy'|'draw', reason: string, rounds: object[], finalState: object }}
 */
export function playHeadlessMatch(initialState, agents, { maxRounds = 20 } = {}) {
  let state = initialState;
  const rounds = [];
  for (let guard = 0; guard < maxRounds; guard += 1) {
    const { state: after, record } = playHeadlessRound(state, agents);
    rounds.push(record);
    const end = resolveMatchEnd(after, state.roundNumber);
    if (end) {
      return { ...end, rounds, finalState: { ...after, currentFieldIndex: null } };
    }
    const nextRound = state.roundNumber + 1;
    state = {
      ...after,
      roundNumber: nextRound,
      isPlayerFirst: resolveRoundInitiative({
        roundNumber: nextRound,
        openingPlayerFirst: after.openingPlayerFirst,
        initiativeProfile: null,
      }),
      currentFieldIndex: null,
      selectedAgent: null,
      enemyAgent: null,
    };
  }
  throw new Error(`Partita oltre ${maxRounds} turni (seed ${initialState.seed})`);
}

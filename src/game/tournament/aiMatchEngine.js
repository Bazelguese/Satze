// ============================================
// TORNEO — partita IA contro IA senza tavolo
// ============================================
// Gioca una partita 1v1 completa con il motore vero: `computeDuelResolution` per ogni
// duello, il pianificatore IA della partita locale per le scelte di entrambi i lati,
// Campi con i loro effetti, Tossine, conquista, supremazia e annientamento come nel
// turno della schermata di gioco (Codice/satze.jsx, proceedToNextRound).
//
// Limite dichiarato: le Eminenze non partecipano (come in 2v2 e Re della collina),
// perché la loro orchestrazione vive nella schermata di gioco.
//
// Lato 'a' = lato player del motore, lato 'b' = lato enemy. Il pianificatore ragiona
// sempre dal lato enemy: per il lato 'a' gli si passa lo stato specchiato.
// ============================================

import { computeDuelResolution } from '../duelResolve.js';
import { applyToxin } from '../toxinLogic.js';
import { resolveRoundInitiative } from '../duel/resolveRoundInitiative.js';
import { countConqueredFields } from '../duel/duelHelpers.js';
import { calcInitialBonuses } from '../../utils/onlineMatch.js';
import { buildAIContext } from '../ai/buildAIContext.js';
import { chooseAIAction } from '../ai/chooseAIAction.js';
import { chooseJointAIAction } from '../ai/chooseJointAIAction.js';
import { getLegalFieldIndexes } from '../ai/legalFields.js';
import { getAvailableCards, getLegalFocusRange } from '../ai/generateAIActions.js';

export const AI_MATCH_START_HP = 25;
export const AI_MATCH_START_FOCUS = 18;

function leagueSum(hand) {
  return hand.reduce((sum, card) => sum + (Number(card.league) || 0), 0);
}

function swapWinner(winner) {
  return winner === 'player' ? 'enemy' : winner === 'enemy' ? 'player' : winner;
}

function mirrorConquered(conquered) {
  const out = {};
  for (const [index, entry] of Object.entries(conquered)) {
    out[index] = entry && typeof entry === 'object' ? { ...entry, winner: swapWinner(entry.winner) } : entry;
  }
  return out;
}

/** Lo stesso stato visto dall'altro lato (player ↔ enemy). */
function mirrorState(state) {
  return {
    ...state,
    isPlayerFirst: !state.isPlayerFirst,
    openingPlayerFirst: !state.openingPlayerFirst,
    lastWinner: swapWinner(state.lastWinner),
    conqueredFields: mirrorConquered(state.conqueredFields),
    playerHand: state.enemyHand,
    enemyHand: state.playerHand,
    playerUsedCards: state.enemyUsedCards,
    enemyUsedCards: state.playerUsedCards,
    playerHP: state.enemyHP,
    enemyHP: state.playerHP,
    playerFocus: state.enemyFocus,
    enemyFocus: state.playerFocus,
    playerArmyBonuses: state.enemyArmyBonuses,
    enemyArmyBonuses: state.playerArmyBonuses,
    playerToxin: state.enemyToxin,
    enemyToxin: state.playerToxin,
  };
}

function createInitialState({ handA, handB, battlefields, mode, difficulty, rng }) {
  const leagueA = leagueSum(handA);
  const leagueB = leagueSum(handB);
  // Inizia chi ha la Lega totale più bassa in mano; a parità si decide a caso.
  const aFirst = leagueA < leagueB ? true : leagueA > leagueB ? false : rng() < 0.5;
  return {
    gameMode: mode,
    aiDifficulty: difficulty,
    battlefields,
    revealedFields: mode === 'bareHands' ? battlefields.length : Math.min(3, battlefields.length),
    conqueredFields: {},
    roundNumber: 1,
    openingPlayerFirst: aFirst,
    isPlayerFirst: aFirst,
    lastWinner: null,
    playerHand: handA,
    enemyHand: handB,
    playerUsedCards: [],
    enemyUsedCards: [],
    playerHP: AI_MATCH_START_HP,
    enemyHP: AI_MATCH_START_HP,
    playerFocus: AI_MATCH_START_FOCUS,
    enemyFocus: AI_MATCH_START_FOCUS,
    playerArmyBonuses: calcInitialBonuses(handA),
    enemyArmyBonuses: calcInitialBonuses(handB),
    playerToxin: null,
    enemyToxin: null,
    currentFieldIndex: null,
    selectedAgent: null,
  };
}

/**
 * Scelta di un lato. Chi apre decide Campo, Agente e FC insieme; chi risponde vede il
 * Campo e l'Agente avversario (mai i suoi FC) e decide Agente e FC.
 * @returns {{ fieldIndex: number, cardId: number, focus: number }}
 */
function decideWithPlanner(state, side, lead, rng) {
  // Nello stato passato al pianificatore chi decide è sempre il lato enemy.
  const view = side === 'b' ? state : mirrorState(state);
  const input = {
    ...view,
    isPlayerFirst: !lead,
    currentFieldIndex: lead ? null : view.currentFieldIndex,
    selectedAgent: lead ? null : view.selectedAgent,
  };
  const context = buildAIContext(input);
  let decision = null;
  try {
    decision = lead
      ? chooseJointAIAction(context, context.difficulty, { rng })
      : chooseAIAction(context, context.difficulty, { rng });
  } catch {
    decision = null;
  }
  const available = getAvailableCards(context.ai.hand, context.ai.usedCardIds);
  const card = available.find((c) => c.id === decision?.card?.id) || available[0];
  const legalFields = getLegalFieldIndexes(context);
  const fieldIndex = lead
    ? (legalFields.includes(decision?.fieldIndex) ? decision.fieldIndex : legalFields[0])
    : view.currentFieldIndex;
  const { maxFocus } = getLegalFocusRange(context, 'ai');
  const focus = Math.max(1, Math.min(Math.max(1, maxFocus), Number(decision?.focus) || 1));
  return { fieldIndex, cardId: card.id, focus };
}

function findCard(hand, cardId) {
  return hand.find((c) => c.id === cardId);
}

/** Stato del tavolo all'inizio del duello, per mostrarlo o riassumerlo. */
function snapshot(state) {
  return {
    roundNumber: state.roundNumber,
    isPlayerFirst: state.isPlayerFirst,
    revealedFields: state.revealedFields,
    conqueredFields: { ...state.conqueredFields },
    hp: { a: state.playerHP, b: state.enemyHP },
    focus: { a: state.playerFocus, b: state.enemyFocus },
    used: { a: [...state.playerUsedCards], b: [...state.enemyUsedCards] },
    toxin: { a: state.playerToxin, b: state.enemyToxin },
  };
}

/** Esito della partita dopo il duello, con le stesse precedenze del turno di gioco. */
function resolveOutcome(state, fieldsA, fieldsB, roundPlayed) {
  const majority = Math.floor(state.battlefields.length / 2) + 1;
  // Conquista: solo nei turni 1-4. Un'IA che arriva alla maggioranza reclama sempre.
  if (roundPlayed < 5) {
    if (fieldsA >= majority) return { winner: 'a', reason: 'fields' };
    if (fieldsB >= majority) return { winner: 'b', reason: 'fields' };
  }
  if (state.playerHP <= 0) return { winner: 'b', reason: 'hp' };
  if (state.enemyHP <= 0) return { winner: 'a', reason: 'hp' };
  const leftA = state.playerHand.length - state.playerUsedCards.length;
  const leftB = state.enemyHand.length - state.enemyUsedCards.length;
  if (leftA <= 0 || leftB <= 0) {
    if (state.playerHP !== state.enemyHP) return { winner: state.playerHP > state.enemyHP ? 'a' : 'b', reason: 'hp' };
    if (fieldsA !== fieldsB) return { winner: fieldsA > fieldsB ? 'a' : 'b', reason: 'fields' };
    return { winner: 'draw', reason: 'draw' };
  }
  return null;
}

/**
 * Gioca una partita. Con `script` (scelte di una partita già giocata) la rigioca identica:
 * la risoluzione dei duelli è deterministica, quindi basta ripetere le scelte.
 *
 * @param {object} cfg
 * @param {object[]} cfg.handA - 5 carte complete del lato 'a'
 * @param {object[]} cfg.handB
 * @param {object[]} cfg.battlefields - i 5 Campi della partita
 * @param {string} [cfg.mode='classic']
 * @param {string} [cfg.difficulty='medium']
 * @param {() => number} [cfg.rng]
 * @param {{ aFirst: boolean, rounds: object[] }|null} [cfg.script]
 * @returns {{ winner: 'a'|'b'|'draw', reason: string, aFirst: boolean, rounds: object[], frames: object[], final: object }}
 */
function* gameSteps({ handA, handB, battlefields, mode = 'classic', difficulty = 'medium', rng = Math.random, script = null }) {
  let state = createInitialState({ handA, handB, battlefields, mode, difficulty, rng });
  if (script) {
    state.openingPlayerFirst = script.aFirst;
    state.isPlayerFirst = script.aFirst;
  }
  const aFirst = state.openingPlayerFirst;
  const rounds = [];
  const frames = [];
  let outcome = null;

  while (!outcome) {
    const leadSide = state.isPlayerFirst ? 'a' : 'b';
    const followSide = leadSide === 'a' ? 'b' : 'a';
    const scripted = script?.rounds[rounds.length] || null;
    let choiceA;
    let choiceB;
    let fieldIndex;
    if (scripted) {
      fieldIndex = scripted.fieldIndex;
      choiceA = scripted.a;
      choiceB = scripted.b;
    } else {
      const lead = decideWithPlanner(state, leadSide, true, rng);
      fieldIndex = lead.fieldIndex;
      const leadCard = findCard(leadSide === 'a' ? state.playerHand : state.enemyHand, lead.cardId);
      // Chi risponde vede Campo e Agente di chi ha aperto. Nello stato specchiato l'Agente
      // di chi ha aperto è comunque `selectedAgent` (lato player della vista).
      const follow = decideWithPlanner({ ...state, currentFieldIndex: fieldIndex, selectedAgent: leadCard }, followSide, false, rng);
      choiceA = leadSide === 'a' ? lead : follow;
      choiceB = leadSide === 'b' ? lead : follow;
    }
    const cardA = findCard(state.playerHand, choiceA.cardId);
    const cardB = findCard(state.enemyHand, choiceB.cardId);
    const before = snapshot(state);

    const { battleResult } = computeDuelResolution({
      field: state.battlefields[fieldIndex],
      selectedAgent: cardA,
      enemyAgent: cardB,
      selectedFocus: choiceA.focus,
      enemySelectedFocus: choiceB.focus,
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
    });

    // Fine duello: PV, FC e carte usate, poi le Tossine di fine turno.
    let hpA = battleResult.finalPlayerHP;
    let hpB = battleResult.finalEnemyHP;
    let toxinA = battleResult.playerToxinActivated || state.playerToxin;
    let toxinB = battleResult.enemyToxinActivated || state.enemyToxin;
    if (toxinA || toxinB) {
      const toxin = applyToxin(toxinA, toxinB, hpA, hpB);
      hpA = toxin.newPlayerHP;
      hpB = toxin.newEnemyHP;
      toxinA = toxin.playerToxinActive;
      toxinB = toxin.enemyToxinActive;
    }
    const noConquest = Boolean(battleResult.fieldDestroyed || battleResult.skipConquest);
    const conqueredFields = {
      ...state.conqueredFields,
      [fieldIndex]: noConquest
        ? { winner: null, destroyed: true }
        : { winner: battleResult.winner, army: battleResult.winnerArmy },
    };
    const roundPlayed = state.roundNumber;
    state = {
      ...state,
      playerHP: hpA,
      enemyHP: hpB,
      playerFocus: Math.max(0, battleResult.finalPlayerFC),
      enemyFocus: Math.max(0, battleResult.finalEnemyFC),
      playerUsedCards: [...state.playerUsedCards, cardA.id],
      enemyUsedCards: [...state.enemyUsedCards, cardB.id],
      playerToxin: toxinA || null,
      enemyToxin: toxinB || null,
      lastWinner: battleResult.winner,
      conqueredFields,
      revealedFields: Math.min(state.battlefields.length, state.revealedFields + 1),
      currentFieldIndex: null,
      selectedAgent: null,
    };
    const { playerFieldsConquered: fieldsA, enemyFieldsConquered: fieldsB } = countConqueredFields(
      conqueredFields, state.playerHand, state.enemyHand
    );
    outcome = resolveOutcome(state, fieldsA, fieldsB, roundPlayed);

    const duelWinner = battleResult.winner === 'player' ? 'a' : battleResult.winner === 'enemy' ? 'b' : null;
    rounds.push({
      round: roundPlayed,
      fieldIndex,
      first: leadSide,
      a: { cardId: cardA.id, focus: choiceA.focus },
      b: { cardId: cardB.id, focus: choiceB.focus },
      winner: duelWinner,
      conquered: !noConquest,
      va: { a: battleResult.playerAssault ?? null, b: battleResult.enemyAssault ?? null },
      hp: { a: hpA, b: hpB },
      focus: { a: state.playerFocus, b: state.enemyFocus },
      fields: { a: fieldsA, b: fieldsB },
    });
    frames.push({ before, fieldIndex, cardA, cardB, focusA: choiceA.focus, focusB: choiceB.focus, battleResult, after: snapshot(state) });

    if (!outcome) {
      const nextRound = roundPlayed + 1;
      state = {
        ...state,
        roundNumber: nextRound,
        isPlayerFirst: resolveRoundInitiative({ roundNumber: nextRound, openingPlayerFirst: aFirst }),
      };
      // Un passo per turno: chi chiama può cedere il controllo all'interfaccia tra un turno e l'altro.
      yield rounds.length;
    }
  }

  return {
    winner: outcome.winner,
    reason: outcome.reason,
    aFirst,
    rounds,
    frames,
    final: {
      hp: { a: state.playerHP, b: state.enemyHP },
      fields: rounds[rounds.length - 1].fields,
    },
  };
}

export function playAiGame(cfg) {
  const steps = gameSteps(cfg);
  let step = steps.next();
  while (!step.done) step = steps.next();
  return step.value;
}

/** Come `playAiGame`, ma tra un turno e l'altro aspetta `pause()` per non bloccare l'interfaccia. */
export async function playAiGameAsync(cfg, pause) {
  const steps = gameSteps(cfg);
  let step = steps.next();
  while (!step.done) {
    await pause();
    step = steps.next();
  }
  return step.value;
}

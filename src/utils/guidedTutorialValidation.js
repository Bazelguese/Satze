import { computeDuelResolution } from '../game/duelResolve.js';
import { ALL_BATTLEFIELDS } from '../data/battlefields.js';
import { ARMY_DECKS, ARMY_SETS } from '../data/cards.js';
import { calcInitialBonuses } from './onlineMatch.js';

const TUTORIAL_FIELD_IDS = [51, 52, 53, 54, 55];

export function getTutorialBattlefields(allBattlefields) {
  const byId = new Map(allBattlefields.map((f) => [f.id, f]));
  return TUTORIAL_FIELD_IDS.map((id) => byId.get(id)).filter(Boolean);
}

/**
 * La partita guidata usa mani scriptate da 5 carte, non il mazzo base da 10.
 * Verifica che le carte appartengano all'armata del meta (le liste tutorial
 * possono includere carte tipiche dell'armata fuori dalla lista precostruita).
 */
export function assertGuidedHandInDeck(handIds, deckMeta) {
  const armyCards = ARMY_SETS[deckMeta.army];
  if (!armyCards?.length) {
    throw new Error(`Armata non trovata: ${deckMeta.army}`);
  }
  const armyPool = new Set(armyCards.map((c) => c.id));
  handIds.forEach((id) => {
    if (!armyPool.has(id)) {
      const label = deckMeta.name || ARMY_DECKS[deckMeta.army]?.[deckMeta.deckKey]?.name || deckMeta.deckKey;
      throw new Error(`Carta ${id} non appartiene all'armata "${deckMeta.army}" (${label})`);
    }
  });
}

export function buildGuidedHands(allAgents, handIds) {
  const byId = new Map(allAgents.map((a) => [a.id, a]));
  const pick = (ids) =>
    ids.map((id) => {
      const card = byId.get(id);
      if (!card) throw new Error(`Guided tutorial: carta ${id} non trovata nel pool`);
      return { ...card };
    });
  return {
    player: pick(handIds.player),
    enemy: pick(handIds.enemy),
  };
}

export function countGuidedConqueredFields(conqueredFields) {
  let player = 0;
  let enemy = 0;
  Object.values(conqueredFields || {}).forEach((entry) => {
    if (typeof entry === 'object' && entry?.winner === 'player') player += 1;
    else if (typeof entry === 'object' && entry?.winner === 'enemy') enemy += 1;
  });
  return { player, enemy };
}

export function validateGuidedFocus(round, focus) {
  if (!round) return { ok: false, feedback: null };
  const policy = round.focusPolicy || 'exact';

  if (policy === 'free') {
    return { ok: focus >= 1, feedback: null };
  }
  if (policy === 'exact') {
    return {
      ok: focus === round.focus,
      feedback: focus === round.focus ? null : `Imposta ${round.focus} FC.`,
    };
  }
  if (policy === 'range') {
    const min = round.focusMin ?? 1;
    const max = round.focusMax ?? round.focus;
    if (focus < min) {
      return { ok: false, feedback: round.lesson?.feedbackUnder || `Investi almeno ${min} FC.` };
    }
    if (focus > max) {
      return { ok: false, feedback: round.lesson?.feedbackOver || `Troppi FC: resta tra ${min} e ${max}.` };
    }
    const saved = max - focus;
    const okMsg = round.lesson?.feedbackOk || 'Scelta nella fascia consigliata.';
    const overMsg = round.lesson?.feedbackOver || 'Nella fascia, ma verifica se serviva così tanto.';
    return {
      ok: true,
      feedback: focus <= round.focus ? okMsg.replace('{fcSaved}', String(saved)).replace('{focus}', String(focus)) : overMsg.replace('{focus}', String(focus)),
    };
  }
  return { ok: false, feedback: null };
}

export function classifyAdvancedR5({ playerHp, enemyHp, enemyDamage, focus, won }) {
  const needWin = playerHp - enemyDamage <= enemyHp;
  if (needWin && won) return 'advEvalWinNeeded';
  if (!needWin && won) return 'advEvalWinWasted';
  if (!needWin && !won) return 'advEvalLossOk';
  return 'advEvalLossFatal';
}

export function simulateGuidedDuel({
  playerAgent,
  enemyAgent,
  fieldIndex,
  playerFocus,
  enemyFocus,
  playerHp = 25,
  enemyHp = 25,
  roundNumber = 1,
}) {
  const fields = TUTORIAL_FIELD_IDS.map((id) => ALL_BATTLEFIELDS.find((f) => f.id === id)).filter(Boolean);
  const field = fields[fieldIndex] || fields[0];
  const playerHand = [playerAgent];
  const enemyHand = [enemyAgent];

  const { battleResult } = computeDuelResolution({
    field,
    selectedAgent: playerAgent,
    enemyAgent,
    selectedFocus: playerFocus,
    enemySelectedFocus: enemyFocus,
    playerHP: playerHp,
    enemyHP: enemyHp,
    playerFocus: 18,
    enemyFocus: 18,
    playerUsedCards: [],
    enemyUsedCards: [],
    isPlayerFirst: true,
    lastWinner: null,
    playerArmyBonuses: calcInitialBonuses(playerHand),
    enemyArmyBonuses: calcInitialBonuses(enemyHand),
    playerToxin: null,
    enemyToxin: null,
    roundNumber,
    conqueredFields: {},
    playerHand,
    enemyHand,
    currentFieldIndex: fieldIndex,
  });

  return battleResult;
}

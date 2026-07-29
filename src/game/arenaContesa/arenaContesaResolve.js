import { computeDuelResolution } from '../duelResolve.js';
import { getArenaPlayer } from './createArenaContesaMatch.js';

/**
 * Conquista Contesa → formato atteso da countConqueredFields (player=Chiamante, enemy=Contestatore).
 */
export function buildDuelConqueredMap(match, callerId, contestantId) {
  const out = {};
  Object.entries(match.conqueredByFieldId || {}).forEach(([fieldId, meta]) => {
    if (meta.winnerId === callerId) {
      out[fieldId] = { winner: 'player', army: meta.army };
    } else if (meta.winnerId === contestantId) {
      out[fieldId] = { winner: 'enemy', army: meta.army };
    }
  });
  return out;
}

/**
 * Risolve lo scontro 1v1 Chiamante vs Contestatore via computeDuelResolution.
 * Nel risultato: player = Chiamante, enemy = Contestatore.
 */
export function resolveArenaDuel(match) {
  const caller = getArenaPlayer(match, match.callerId);
  const contestant = getArenaPlayer(match, match.contestantId);
  const field = match.fieldPool.find((f) => f.id === match.contestedFieldId);
  if (!caller || !contestant || !field) {
    throw new Error('Arena Contesa: stato duello incompleto');
  }

  const callerAgent = caller.hand.find((c) => c.id === match.callerAgentId);
  const contestantAgent = contestant.hand.find((c) => c.id === match.contestantAgentId);
  if (!callerAgent || !contestantAgent) {
    throw new Error('Arena Contesa: agenti non in mano');
  }

  const lastWinner =
    caller.lastDuelOutcome === 'win'
      ? 'player'
      : caller.lastDuelOutcome === 'loss'
        ? 'enemy'
        : null;

  const { battleResult } = computeDuelResolution({
    field,
    selectedAgent: callerAgent,
    enemyAgent: contestantAgent,
    selectedFocus: match.callerFocus,
    enemySelectedFocus: match.contestantFocus,
    playerHP: caller.hp,
    enemyHP: contestant.hp,
    playerFocus: caller.focus,
    enemyFocus: contestant.focus,
    playerUsedCards: caller.usedIds,
    enemyUsedCards: contestant.usedIds,
    isPlayerFirst: true,
    lastWinner,
    playerArmyBonuses: caller.armyBonuses || {},
    enemyArmyBonuses: contestant.armyBonuses || {},
    playerToxin: null,
    enemyToxin: null,
    roundNumber: match.giro,
    conqueredFields: buildDuelConqueredMap(match, caller.id, contestant.id),
    playerHand: caller.hand,
    enemyHand: contestant.hand,
    currentFieldIndex: match.fieldPool.findIndex((f) => f.id === field.id),
  });

  return battleResult;
}

/**
 * Applica PV/FC/conquista dal battleResult (player=Chiamante).
 */
export function applyArenaDuelOutcome(match, battleResult) {
  const callerId = match.callerId;
  const contestantId = match.contestantId;
  const fieldId = match.contestedFieldId;
  const field = match.fieldPool.find((f) => f.id === fieldId);

  let winnerSeatId = null;
  if (battleResult.winner === 'player') winnerSeatId = callerId;
  else if (battleResult.winner === 'enemy') winnerSeatId = contestantId;

  const conqueredByFieldId = { ...match.conqueredByFieldId };
  if (winnerSeatId && field) {
    const winner = getArenaPlayer(match, winnerSeatId);
    const armyFromResult =
      battleResult.winner === 'player'
        ? battleResult.playerAgent?.army
        : battleResult.enemyAgent?.army;
    conqueredByFieldId[fieldId] = {
      winnerId: winnerSeatId,
      army: winner?.army || armyFromResult,
    };
  }

  const fieldPool = match.fieldPool.filter((f) => f.id !== fieldId);

  const players = match.players.map((p) => {
    if (p.id === callerId) {
      return {
        ...p,
        hp: Math.max(0, battleResult.finalPlayerHP ?? p.hp),
        focus: Math.max(0, battleResult.finalPlayerFC ?? p.focus),
        fieldsWon:
          winnerSeatId === callerId ? p.fieldsWon + 1 : p.fieldsWon,
        lastDuelOutcome:
          battleResult.winner === 'player'
            ? 'win'
            : battleResult.winner === 'enemy'
              ? 'loss'
              : 'draw',
      };
    }
    if (p.id === contestantId) {
      return {
        ...p,
        hp: Math.max(0, battleResult.finalEnemyHP ?? p.hp),
        focus: Math.max(0, battleResult.finalEnemyFC ?? p.focus),
        fieldsWon:
          winnerSeatId === contestantId ? p.fieldsWon + 1 : p.fieldsWon,
        lastDuelOutcome:
          battleResult.winner === 'enemy'
            ? 'win'
            : battleResult.winner === 'player'
              ? 'loss'
              : 'draw',
      };
    }
    return p;
  });

  return {
    ...match,
    players,
    fieldPool,
    conqueredByFieldId,
    battleResult,
    pendingSubstitutionIds: [callerId, contestantId],
  };
}

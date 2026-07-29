import { ARENA_CONTESA, ARENA_PHASES } from './arenaContesaConstants.js';
import {
  appendArenaLog,
  getArenaPlayer,
  rotateCallOrder,
  updateArenaPlayer,
} from './createArenaContesaMatch.js';
import { applyAgentUseAndReserve } from './arenaContesaReserve.js';
import { applyArenaDuelOutcome, resolveArenaDuel } from './arenaContesaResolve.js';
import { applyAnnihilationCheck, checkEndOfGiroVictory } from './arenaContesaVictory.js';

function responseOrderFromCaller(callOrder, callerId) {
  const idx = callOrder.indexOf(callerId);
  if (idx < 0) return callOrder.filter((id) => id !== callerId);
  return [...callOrder.slice(idx + 1), ...callOrder.slice(0, idx)];
}

function availableAgents(player) {
  return (player?.hand || []).filter((c) => !player.usedIds.includes(c.id));
}

function maxSpendableFocus(player) {
  const unused = availableAgents(player).length;
  const reserved = Math.max(0, unused - 1);
  return Math.max(1, Math.min(14, player.focus - reserved));
}

export function getActingPlayerId(match) {
  switch (match.phase) {
    case ARENA_PHASES.SCELTA_CAMPO:
    case ARENA_PHASES.CHIAMATA:
      return match.callerId;
    case ARENA_PHASES.RISPOSTE:
      return match.responseCursor;
    case ARENA_PHASES.CONTESTAZIONE:
      return match.contestantId;
    case ARENA_PHASES.DUELLO:
      return match.localPlayerId;
    default:
      return null;
  }
}

export function isHumanTurn(match) {
  const id = getActingPlayerId(match);
  const p = getArenaPlayer(match, id);
  return Boolean(p?.isHuman) && match.phase !== ARENA_PHASES.GAME_OVER;
}

/** Chiamante sceglie Campo dal pool. */
export function selectField(match, fieldId) {
  if (match.phase !== ARENA_PHASES.SCELTA_CAMPO) return match;
  const field = match.fieldPool.find((f) => f.id === fieldId);
  if (!field) return match;
  if (match.conqueredByFieldId[fieldId]) return match;

  const caller = getArenaPlayer(match, match.callerId);
  let next = {
    ...match,
    contestedFieldId: fieldId,
    phase: ARENA_PHASES.CHIAMATA,
    callerAgentId: null,
    callerFocus: null,
  };
  next = appendArenaLog(next, `${caller?.name} sceglie ${field.name}`);
  return next;
}

/** Chiamante / Contestatore sceglie Agente (non conferma ancora). */
export function selectAgent(match, agentId) {
  const acting = getActingPlayerId(match);
  const player = getArenaPlayer(match, acting);
  if (!player) return match;
  if (!availableAgents(player).some((c) => c.id === agentId)) return match;

  if (match.phase === ARENA_PHASES.CHIAMATA && acting === match.callerId) {
    return { ...match, callerAgentId: agentId };
  }
  if (match.phase === ARENA_PHASES.CONTESTAZIONE && acting === match.contestantId) {
    return { ...match, contestantAgentId: agentId };
  }
  return match;
}

/** Conferma FC: Chiamante → risposte; Contestatore → duello. */
export function confirmFocus(match, focusValue) {
  const acting = getActingPlayerId(match);
  const player = getArenaPlayer(match, acting);
  if (!player) return match;

  const maxFc = maxSpendableFocus(player);
  const focus = Math.max(1, Math.min(maxFc, Number(focusValue) || 1));

  if (match.phase === ARENA_PHASES.CHIAMATA) {
    if (!match.callerAgentId) return match;
    const queue = responseOrderFromCaller(match.callOrder, match.callerId).filter((id) => {
      const p = getArenaPlayer(match, id);
      return p && !p.eliminated;
    });
    const agent = player.hand.find((c) => c.id === match.callerAgentId);
    let next = {
      ...match,
      callerFocus: focus,
      phase: ARENA_PHASES.RISPOSTE,
      responseQueue: queue,
      responseCursor: queue[0] || null,
      contestantId: null,
      contestantAgentId: null,
      contestantFocus: null,
    };
    next = appendArenaLog(
      next,
      `${player.name} schiera ${agent?.name || 'Agente'} e blocca i Focus Coin`
    );
    if (!next.responseCursor) {
      // nessuno può rispondere (edge) — non dovrebbe succedere con 4 vivi
      return next;
    }
    next = appendArenaLog(
      next,
      `Risposte: ${queue.map((id) => getArenaPlayer(match, id)?.name).join(' → ')} (ultimo obbligato)`
    );
    return next;
  }

  if (match.phase === ARENA_PHASES.CONTESTAZIONE) {
    if (!match.contestantAgentId) return match;
    const agent = player.hand.find((c) => c.id === match.contestantAgentId);
    let next = {
      ...match,
      contestantFocus: focus,
      phase: ARENA_PHASES.DUELLO,
    };
    next = appendArenaLog(next, `${player.name} schiera ${agent?.name || 'Agente'} (Contestatore)`);
    return next;
  }

  return match;
}

/** True se il cursore risposte è l'ultimo della coda (obbligato a Contestare). */
export function isLastResponder(match) {
  if (match?.phase !== ARENA_PHASES.RISPOSTE) return false;
  const cursor = match.responseCursor;
  const queue = match.responseQueue || [];
  if (!cursor || !queue.length) return false;
  const idx = queue.indexOf(cursor);
  return idx >= 0 && idx === queue.length - 1;
}

/** Contesta o Passa. Ultimo risponditore: Contesta obbligatoria (Passa rifiutato). */
export function respond(match, choice) {
  if (match.phase !== ARENA_PHASES.RISPOSTE) return match;
  const cursor = match.responseCursor;
  if (!cursor) return match;

  const queue = match.responseQueue || [];
  const idx = queue.indexOf(cursor);
  if (idx < 0) return match;

  const last = idx === queue.length - 1;
  const player = getArenaPlayer(match, cursor);

  // Ultimo: Passa non è legale — forza Contesta
  if (choice === 'pass' && last) {
    let next = {
      ...match,
      contestantId: cursor,
      phase: ARENA_PHASES.CONTESTAZIONE,
      responseCursor: null,
      responseQueue: [],
      contestantAgentId: null,
      contestantFocus: null,
    };
    next = appendArenaLog(
      next,
      `${player?.name} non può passare (ultimo risponditore) — Contesta obbligata`
    );
    return next;
  }

  if (choice === 'contest' || last) {
    let next = {
      ...match,
      contestantId: cursor,
      phase: ARENA_PHASES.CONTESTAZIONE,
      responseCursor: null,
      responseQueue: [],
      contestantAgentId: null,
      contestantFocus: null,
    };
    next = appendArenaLog(next, `${player?.name} Contesta`);
    return next;
  }

  // Pass (solo se non ultimo)
  const remaining = queue.slice(idx + 1);
  if (remaining.length === 0) {
    // Failsafe: coda vuota ⇒ Contesta
    let next = {
      ...match,
      contestantId: cursor,
      phase: ARENA_PHASES.CONTESTAZIONE,
      responseCursor: null,
      responseQueue: [],
      contestantAgentId: null,
      contestantFocus: null,
    };
    next = appendArenaLog(next, `${player?.name} Contesta (obbligato)`);
    return next;
  }

  let next = appendArenaLog(match, `${player?.name} Passa`);
  return {
    ...next,
    responseQueue: remaining,
    responseCursor: remaining[0],
  };
}

/**
 * Calcola e applica l'esito del duello, restando in DUELLO per la presentazione UI.
 * (La sostituzione parte con beginSubstitution.)
 */
export function resolveDuel(match) {
  if (match.phase !== ARENA_PHASES.DUELLO) return match;
  if (match.battleResult) return match;
  if (
    match.callerAgentId == null ||
    match.contestantAgentId == null ||
    match.callerFocus == null ||
    match.contestantFocus == null
  ) {
    return match;
  }

  let battleResult;
  try {
    battleResult = resolveArenaDuel(match);
  } catch (err) {
    console.error('[Arena Contesa] resolveArenaDuel failed', err);
    let next = appendArenaLog(match, `Errore risoluzione duello: ${err?.message || err}`);
    // Failsafe: evita stallo — passa a sostituzione senza esito
    return { ...next, phase: ARENA_PHASES.SOSTITUZIONE, pendingSubstitutionIds: [match.callerId, match.contestantId].filter(Boolean) };
  }

  let next = applyArenaDuelOutcome(match, battleResult);
  // Resta in DUELLO: la UI mostra il risultato, poi beginSubstitution
  next = { ...next, phase: ARENA_PHASES.DUELLO };

  const winnerLabel =
    battleResult.winner === 'player'
      ? getArenaPlayer(next, next.callerId)?.name
      : battleResult.winner === 'enemy'
        ? getArenaPlayer(next, next.contestantId)?.name
        : 'Pareggio';
  next = appendArenaLog(
    next,
    `Esito: ${winnerLabel} · VA ${battleResult.playerAssault} vs ${battleResult.enemyAssault} · danno ${battleResult.damageDealt}`
  );

  const annihilated = applyAnnihilationCheck(next);
  next = annihilated.match;
  if (annihilated.ended) {
    next = appendArenaLog(next, `Vittoria per Annientamento: ${getArenaPlayer(next, next.winnerId)?.name}`);
  }
  return next;
}

/** Dopo la presentazione del duello → fase sostituzione (se non già game over). */
export function beginSubstitution(match) {
  if (match.phase === ARENA_PHASES.GAME_OVER) return match;
  if (match.phase !== ARENA_PHASES.DUELLO) return match;
  if (!match.battleResult) return match;
  return { ...match, phase: ARENA_PHASES.SOSTITUZIONE };
}

/** Applica riserva ai due partecipanti e avanza al call successivo / fine Giro. */
export function completeSubstitution(match) {
  if (match.phase === ARENA_PHASES.GAME_OVER) return match;
  if (match.phase !== ARENA_PHASES.SOSTITUZIONE) return match;

  let next = { ...match };
  for (const pid of match.pendingSubstitutionIds || []) {
    const p = getArenaPlayer(next, pid);
    if (!p) continue;
    const agentId = pid === next.callerId ? next.callerAgentId : next.contestantAgentId;
    if (agentId == null) continue;
    next = updateArenaPlayer(next, pid, (pl) => applyAgentUseAndReserve(pl, agentId));
  }

  next = {
    ...next,
    pendingSubstitutionIds: [],
    battleResult: null,
    contestedFieldId: null,
    callerAgentId: null,
    callerFocus: null,
    contestantId: null,
    contestantAgentId: null,
    contestantFocus: null,
  };

  return advanceAfterCall(next);
}

function advanceAfterCall(match) {
  let next = { ...match };
  const callIndex = next.callIndexInGiro + 1;

  if (callIndex < next.callOrder.length) {
    // prossimo Turno di Chiamata nello stesso Giro — salta eliminati
    let idx = callIndex;
    while (idx < next.callOrder.length) {
      const cid = next.callOrder[idx];
      const p = getArenaPlayer(next, cid);
      if (p && !p.eliminated && availableAgents(p).length > 0) break;
      idx += 1;
    }
    if (idx < next.callOrder.length) {
      next = {
        ...next,
        callIndexInGiro: idx,
        callerId: next.callOrder[idx],
        phase: ARENA_PHASES.SCELTA_CAMPO,
      };
      next = appendArenaLog(
        next,
        `Turno di Chiamata: ${getArenaPlayer(next, next.callerId)?.name}`
      );
      return next;
    }
  }

  // Fine Giro
  const victory = checkEndOfGiroVictory(next);
  if (victory) {
    next = {
      ...next,
      phase: ARENA_PHASES.GAME_OVER,
      winnerId: victory.winnerId,
      winReason: victory.winReason,
    };
    next = appendArenaLog(
      next,
      `Fine Giro ${next.giro}: vittoria ${victory.winReason} — ${getArenaPlayer(next, victory.winnerId)?.name}`
    );
    return next;
  }

  const newOrder = rotateCallOrder(next.callOrder);
  const newGiro = next.giro + 1;
  let startIdx = 0;
  while (startIdx < newOrder.length) {
    const p = getArenaPlayer(next, newOrder[startIdx]);
    if (p && !p.eliminated && availableAgents(p).length > 0) break;
    startIdx += 1;
  }

  if (startIdx >= newOrder.length || next.fieldPool.length === 0) {
    // fallback: supremazia forzata / nessun campo
    const forced = checkEndOfGiroVictory({ ...next, giro: ARENA_CONTESA.maxGiro });
    next = {
      ...next,
      phase: ARENA_PHASES.GAME_OVER,
      winnerId: forced?.winnerId ?? null,
      winReason: forced?.winReason || 'supremazia',
    };
    next = appendArenaLog(next, 'Partita conclusa (pool/agenti esauriti)');
    return next;
  }

  next = {
    ...next,
    giro: newGiro,
    callOrder: newOrder,
    callIndexInGiro: startIdx,
    callerId: newOrder[startIdx],
    phase: ARENA_PHASES.SCELTA_CAMPO,
  };
  next = appendArenaLog(
    next,
    `Giro ${newGiro} — ordine: ${newOrder.map((id) => getArenaPlayer(next, id)?.name).join(' → ')}`
  );
  next = appendArenaLog(
    next,
    `Turno di Chiamata: ${getArenaPlayer(next, next.callerId)?.name}`
  );
  return next;
}

export function getMaxFocusForActing(match) {
  const id = getActingPlayerId(match);
  const p = getArenaPlayer(match, id);
  if (!p) return 1;
  return maxSpendableFocus(p);
}

export function getAvailableAgentsForActing(match) {
  const id = getActingPlayerId(match);
  const p = getArenaPlayer(match, id);
  return availableAgents(p);
}

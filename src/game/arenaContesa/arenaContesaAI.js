import { getArenaPlayer } from './createArenaContesaMatch.js';
import {
  confirmFocus,
  getAvailableAgentsForActing,
  getMaxFocusForActing,
  isLastResponder,
  respond,
  selectAgent,
  selectField,
} from './arenaContesaPhases.js';
import { ARENA_PHASES } from './arenaContesaConstants.js';

function pickBestAgent(player) {
  const available = (player.hand || []).filter((c) => !player.usedIds.includes(c.id));
  if (!available.length) return null;
  return [...available].sort((a, b) => {
    const scoreA = (a.power || 0) * 2 + (a.damage || 0) + (a.league || 0);
    const scoreB = (b.power || 0) * 2 + (b.damage || 0) + (b.league || 0);
    return scoreB - scoreA;
  })[0];
}

function pickField(match) {
  const free = match.fieldPool.filter((f) => !match.conqueredByFieldId[f.id]);
  if (!free.length) return null;
  // Preferisci campi senza minTurn alto; altrimenti primo disponibile
  const sorted = [...free].sort((a, b) => (a.minTurn || 1) - (b.minTurn || 1));
  return sorted[Math.floor(Math.random() * Math.min(3, sorted.length))];
}

/**
 * Contesta se ha un agente decente e FC ≥ 3; altrimenti Passa.
 * Ultimo risponditore: Contesta sempre (gestito in respond()).
 */
export function aiShouldContest(match) {
  const p = getArenaPlayer(match, match.responseCursor);
  if (!p) return false;
  const agent = pickBestAgent(p);
  if (!agent) return false;
  if (p.focus < 3) return false;
  if (p.hp <= 12) return false;
  // Contesta ~55% se ha buon agente
  const power = (agent.power || 0) + (agent.damage || 0);
  if (power >= 7) return Math.random() < 0.65;
  return Math.random() < 0.35;
}

/**
 * Esegue un singolo passo IA sulla fase corrente. Ritorna nuovo match.
 */
export function runArenaAiStep(match) {
  if (!match || match.phase === ARENA_PHASES.GAME_OVER) return match;

  if (match.phase === ARENA_PHASES.SCELTA_CAMPO) {
    const field = pickField(match);
    if (!field) return match;
    return selectField(match, field.id);
  }

  if (match.phase === ARENA_PHASES.CHIAMATA || match.phase === ARENA_PHASES.CONTESTAZIONE) {
    let next = match;
    const actingId =
      match.phase === ARENA_PHASES.CHIAMATA ? match.callerId : match.contestantId;
    const player = getArenaPlayer(next, actingId);
    const needAgent =
      match.phase === ARENA_PHASES.CHIAMATA ? !match.callerAgentId : !match.contestantAgentId;

    if (needAgent) {
      const agent = pickBestAgent(player);
      if (!agent) return next;
      next = selectAgent(next, agent.id);
    }

    const maxFc = getMaxFocusForActing(next);
    const agent =
      getAvailableAgentsForActing(next).find(
        (c) =>
          c.id ===
          (next.phase === ARENA_PHASES.CHIAMATA ? next.callerAgentId : next.contestantAgentId)
      ) || pickBestAgent(getArenaPlayer(next, actingId));
    const desired = Math.min(
      maxFc,
      Math.max(2, Math.round((agent?.power || 3) * 0.9 + Math.random() * 2))
    );
    return confirmFocus(next, desired);
  }

  if (match.phase === ARENA_PHASES.RISPOSTE) {
    if (isLastResponder(match)) return respond(match, 'contest');
    const contest = aiShouldContest(match);
    return respond(match, contest ? 'contest' : 'pass');
  }

  return match;
}

// ============================================
// EMINENZE — Ricette cinematiche (scintille / voli)
// ============================================
//
// Il motore emette notice ed eventi; questo modulo traduce fase + primitive + contesto
// UI in ricette dati-driven. Nessun ramo per singola Eminenza.

import { ANNOUNCE_PHASES } from './eminenceAnnounceLabels.js';
import { EMINENCE_PRIMITIVES as P } from './eminenceConstants.js';

/** Ricette standard — il renderer (`EminenceMarkFlight`) non le conosce per nome. */
export const CINEMATIC_RECIPES = {
  REVEAL_OPEN: 'REVEAL_OPEN',
  VERIFY_LINK: 'VERIFY_LINK',
  LINK_AGENT: 'LINK_AGENT',
  MISS_DIM: 'MISS_DIM',
  PASSIVE_AURA: 'PASSIVE_AURA',
  PRESENCE_PULSE: 'PRESENCE_PULSE',
  MARK_SPAWN: 'MARK_SPAWN',
  SLOT_CURSE: 'SLOT_CURSE',
  FIELD_RULE: 'FIELD_RULE',
  HP_TICK: 'HP_TICK',
};

const AGENT_PRIMITIVES = new Set([
  P.MODIFY_STAT,
  P.IGNORE_FIELD,
  P.FORCE_TRIGGER,
  P.FORBID_TRIGGER,
  P.REPLACE_TRIGGER,
  P.ALIAS_TRIGGER,
  P.UNBLOCKABLE_POWER,
  P.GRANT_TEMPORARY_FOCUS,
  P.MODIFY_LEAGUE,
  P.SET_ARMY_BONUS_STATE,
  P.APPLY_TOXIN,
  P.SUPPRESS_CONQUEST,
  P.MODIFY_ANCHORED_THRESHOLD,
]);

/**
 * @typedef {object} CinematicCue
 * @property {string} recipe
 * @property {{ accent: string, from: object, to: object }|null} flight
 * @property {boolean} [holdAnnounce] attende il volo prima di chiudere l'avviso
 * @property {{ type: string, side?: string }|null} [waitFor] ancora da attendere (ingresso Agente)
 */

function oppositeSide(side) {
  return side === 'enemy' ? 'player' : 'enemy';
}

function sideForTarget(noticeSide, target) {
  if (target === 'OPPONENT' || target === 'ENEMY_AGENT') return oppositeSide(noticeSide);
  return noticeSide || 'player';
}

function cueFromPayoff(payoff, notice, context, accent) {
  const side = notice.side;
  const dest = sideForTarget(side, payoff?.target);
  const agentReady = Boolean(context.agentsDeployed?.[dest]);
  const slot = payoff?.slot ?? notice.slot ?? null;
  const prim = payoff?.primitive;

  if (prim === P.MARK_CARD) return null;
  if (prim === P.CHANGE_PRESENCE) {
    return {
      recipe: CINEMATIC_RECIPES.PRESENCE_PULSE,
      flight: { accent, from: { type: 'card', side }, to: { type: 'presence', side } },
    };
  }
  if (prim === P.LOSE_HP || prim === P.HEAL_HP) {
    return {
      recipe: CINEMATIC_RECIPES.HP_TICK,
      flight: { accent, from: { type: 'card', side }, to: { type: 'hp', side: dest } },
    };
  }
  if (prim === P.APPLY_SLOT_MODIFIER) {
    return {
      recipe: CINEMATIC_RECIPES.SLOT_CURSE,
      flight: {
        accent,
        from: { type: 'card', side },
        to: slot != null ? { type: 'slot', id: slot } : { type: 'slot' },
      },
    };
  }
  if (prim === P.REPLACE_FIELD || prim === P.DESTROY_FIELD) {
    return {
      recipe: CINEMATIC_RECIPES.FIELD_RULE,
      flight: {
        accent,
        from: { type: 'card', side },
        to: slot != null ? { type: 'slot', id: slot } : { type: 'slot' },
      },
    };
  }
  if (AGENT_PRIMITIVES.has(prim) && agentReady) {
    return {
      recipe: CINEMATIC_RECIPES.LINK_AGENT,
      flight: { accent, from: { type: 'card', side }, to: { type: 'field-agent', side: dest } },
      waitFor: { type: 'field-agent', side: dest },
    };
  }
  return null;
}

function uniqueCues(cues) {
  const seen = new Set();
  return cues.filter((cue) => {
    if (!cue) return false;
    const key = cue.flight
      ? `${cue.recipe}:${cue.flight.from?.type}:${cue.flight.from?.side}:${cue.flight.from?.id}:${cue.flight.to?.type}:${cue.flight.to?.side}:${cue.flight.to?.id}`
      : cue.recipe;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Risolve le cinematiche per un avviso Eminenza arricchito.
 *
 * @param {object|null} notice da `eminenceAnnouncements` + `enrichNotice`
 * @param {object} [context]
 * @returns {CinematicCue[]}
 */
export function resolveNoticeCinematics(notice, context = {}) {
  if (!notice || notice.kind === 'setup') return [];

  const side = notice.side;
  const accent = context.accents?.[side] ?? '#c9e238';
  const phase = notice.phase;
  const payoffs = Array.isArray(notice.payoffs) ? notice.payoffs : [];

  if (notice.outcome === 'miss' || phase === ANNOUNCE_PHASES.MISS) {
    return [{ recipe: CINEMATIC_RECIPES.MISS_DIM, flight: null }];
  }

  if (notice.origin === 'deployed_mark' || (phase === ANNOUNCE_PHASES.VERIFY && notice.markCardId != null)) {
    const cues = [];
    for (const payoff of payoffs) {
      if (payoff.primitive === P.CHANGE_PRESENCE) continue;
      cues.push(cueFromPayoff(payoff, notice, context, accent));
    }
    if (notice.presenceDelta) {
      cues.push({
        recipe: CINEMATIC_RECIPES.PRESENCE_PULSE,
        flight: { accent, from: { type: 'card', side }, to: { type: 'presence', side } },
      });
    }
    return uniqueCues(cues);
  }

  const fromPayoffs = uniqueCues(payoffs.map((payoff) => cueFromPayoff(payoff, notice, context, accent)));
  if (fromPayoffs.length) return fromPayoffs;

  if (phase === ANNOUNCE_PHASES.PASSIVE || notice.kind === 'static') {
    return [{ recipe: CINEMATIC_RECIPES.PASSIVE_AURA, flight: null }];
  }

  if (phase === ANNOUNCE_PHASES.REVEAL || notice.kind === 'reveal') {
    return [{
      recipe: CINEMATIC_RECIPES.REVEAL_OPEN,
      flight: { accent, from: { type: 'card', side }, to: { type: 'announce', side } },
      holdAnnounce: true,
    }];
  }

  return [];
}

function runCue(cue, { playLink, noticeId, setAnnounceHeldId }, onDone) {
  if (!cue.flight) {
    onDone?.();
    return;
  }
  if (cue.holdAnnounce) {
    playLink(cue.flight, () => {
      setAnnounceHeldId((id) => (id === noticeId ? null : id));
      onDone?.();
    });
    return;
  }
  playLink(cue.flight, onDone);
}

/**
 * Esegue le cue sul controller di volo, in sequenza.
 *
 * @returns {Promise<void>}
 */
export function playNoticeCinematics(cues, {
  playLink,
  noticeId,
  setAnnounceHeldId,
  waitForEntrance,
} = {}) {
  const list = Array.isArray(cues) ? cues : [];
  const flights = list.filter((cue) => cue?.flight);

  return new Promise((resolve) => {
    if (!flights.length) {
      resolve();
      return;
    }

    const playFrom = (index) => {
      if (index >= flights.length) {
        resolve();
        return;
      }
      runCue(flights[index], { playLink, noticeId, setAnnounceHeldId }, () => playFrom(index + 1));
    };

    if (flights[0].holdAnnounce) setAnnounceHeldId(noticeId);
    if (flights[0].waitFor && typeof waitForEntrance === 'function') {
      Promise.resolve(waitForEntrance(flights[0].waitFor)).then(() => playFrom(0));
      return;
    }
    playFrom(0);
  });
}

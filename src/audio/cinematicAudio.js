/**
 * Orchestrazione audio per cue cinematiche Eminenza.
 * Launch all'inizio; impact al landing (o dopo delay se il volo è no-op).
 * Il callback di gioco NON aspetta i timer audio.
 */

import { getEminenceMarkFlightMs } from '../utils/eminenceSystemPreference.js';
import { playCinematic, prefersReducedMotionAudio } from './soundBus.js';

const INSTANT_MS = 32;

/**
 * @param {{ recipe?: string, flight?: object|null }} cue
 * @param {(onDone: () => void) => void} runFlight
 * @param {() => void} [onDone]
 * @param {{ reduceMotion?: boolean }} [opts]
 */
export function playCueWithAudio(cue, runFlight, onDone, opts = {}) {
  const recipe = cue?.recipe;
  const reduce = opts.reduceMotion ?? prefersReducedMotionAudio();
  const hasFlight = Boolean(cue?.flight);

  if (recipe && hasFlight) {
    playCinematic(recipe, 'launch', { reduceMotion: reduce });
  } else if (recipe && !hasFlight) {
    playCinematic(recipe, 'impact', { reduceMotion: reduce });
    onDone?.();
    return;
  } else if (!hasFlight) {
    onDone?.();
    return;
  }

  const t0 = typeof performance !== 'undefined' ? performance.now() : Date.now();

  const playImpact = () => {
    if (recipe) playCinematic(recipe, 'impact', { reduceMotion: reduce });
  };

  runFlight(() => {
    const elapsed = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - t0;
    // Volo no-op: impatto ritardato solo in audio; la coda gioco prosegue subito.
    if (recipe && hasFlight && !reduce && elapsed < INSTANT_MS) {
      const ms = getEminenceMarkFlightMs() || 900;
      if (typeof window !== 'undefined') {
        window.setTimeout(playImpact, ms);
      } else {
        playImpact();
      }
    } else {
      playImpact();
    }
    onDone?.();
  });
}

/**
 * Audio leggero per la coda annunci in partita (senza controller di volo).
 * @param {Array<{ recipe?: string, flight?: object|null }>} cues
 * @param {{ reduceMotion?: boolean }} [opts]
 * @returns {() => void} cancel
 */
export function playNoticeAudioPreview(cues, opts = {}) {
  const list = Array.isArray(cues) ? cues.filter(Boolean) : [];
  const cue = list.find((c) => c.recipe) || null;
  if (!cue?.recipe) return () => {};

  const reduce = opts.reduceMotion ?? prefersReducedMotionAudio();
  const timers = [];

  if (cue.flight) {
    playCinematic(cue.recipe, 'launch', { reduceMotion: reduce });
    if (!reduce) {
      const ms = getEminenceMarkFlightMs() || 900;
      if (typeof window !== 'undefined') {
        timers.push(window.setTimeout(() => {
          playCinematic(cue.recipe, 'impact', { reduceMotion: reduce });
        }, ms));
      }
    } else {
      playCinematic(cue.recipe, 'impact', { reduceMotion: reduce });
    }
  } else {
    playCinematic(cue.recipe, 'impact', { reduceMotion: reduce });
  }

  return () => {
    if (typeof window === 'undefined') return;
    for (const id of timers) window.clearTimeout(id);
  };
}

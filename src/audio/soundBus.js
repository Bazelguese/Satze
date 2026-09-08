/**
 * Bus SFX leggero: pool di HTMLAudioElement, unlock gesture, dedupe same-frame.
 * Nessuna dipendenza esterna.
 */

import {
  AUDIO_SETTINGS_CHANGED_EVENT,
  getAudioSettings,
} from './audioPreferences.js';
import { cinematicSoundId, resolveSoundSrc } from './soundCatalog.js';

const POOL_SIZE = 8;

/** WAV silenzioso (1 sample) per sbloccare l'autoplay senza toccare il pool. */
const SILENT_WAV =
  'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=';

/** @type {HTMLAudioElement[]} */
let pool = [];
let poolIndex = 0;
let unlocked = false;
let unlockBound = false;
let settingsBound = false;
/** @type {Map<string, number>} */
const lastPlayFrame = new Map();
let cachedSettings = null;

function nowFrame() {
  if (typeof performance !== 'undefined' && performance.now) {
    return Math.floor(performance.now());
  }
  return Date.now();
}

function readSettings() {
  if (!cachedSettings) cachedSettings = getAudioSettings();
  return cachedSettings;
}

function bindSettingsListener() {
  if (settingsBound || typeof window === 'undefined') return;
  settingsBound = true;
  window.addEventListener(AUDIO_SETTINGS_CHANGED_EVENT, () => {
    cachedSettings = getAudioSettings();
  });
}

function ensurePool() {
  if (typeof Audio === 'undefined') return;
  bindSettingsListener();
  if (pool.length) return;
  for (let i = 0; i < POOL_SIZE; i += 1) {
    const el = new Audio();
    el.preload = 'auto';
    el.muted = false;
    pool.push(el);
  }
}

/**
 * @returns {boolean}
 */
export function prefersReducedMotionAudio() {
  if (typeof window === 'undefined') return false;
  try {
    return Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches);
  } catch {
    return false;
  }
}

/**
 * Launch = movimento; con reduced-motion si salta.
 * Impact resta sempre (è il segnale leggibile).
 * @param {'launch'|'impact'|string} beat
 * @param {boolean} [reduceMotion]
 */
export function shouldPlayCinematicBeat(beat, reduceMotion = prefersReducedMotionAudio()) {
  if (beat === 'launch' && reduceMotion) return false;
  return true;
}

/**
 * Sblocca l'autoplay dopo il primo gesto utente.
 * Usa un Audio dedicato: non mutea/interrompe il pool di playback.
 */
export function unlockAudio() {
  if (unlocked) return;
  if (typeof Audio === 'undefined') return;
  unlocked = true;
  ensurePool();
  try {
    const gate = new Audio(SILENT_WAV);
    gate.volume = 0.01;
    const p = gate.play();
    if (p && typeof p.then === 'function') {
      p.then(() => {
        try {
          gate.pause();
        } catch {
          /* ignore */
        }
        // Prefetch clip comuni nello stesso gesture-turn
        warmCommonSounds();
      }).catch(() => {
        unlocked = false;
      });
    } else {
      warmCommonSounds();
    }
  } catch {
    unlocked = false;
  }
}

function warmCommonSounds() {
  const ids = [
    'ui.click',
    'ui.confirm',
    'ui.soft',
    'game.card.place',
    'game.fc.tick',
    'game.duel.clash',
    'game.duel.win',
    'game.duel.lose',
    'cinematic.LINK_AGENT.launch',
    'cinematic.LINK_AGENT.impact',
  ];
  for (const id of ids) {
    const src = resolveSoundSrc(id);
    if (!src || typeof Audio === 'undefined') continue;
    try {
      const a = new Audio();
      a.preload = 'auto';
      a.src = src;
    } catch {
      /* ignore */
    }
  }
}

/** Aggancia unlock al primo pointer/keydown (idempotente). */
export function bindAudioUnlock() {
  if (unlockBound || typeof window === 'undefined') return;
  unlockBound = true;
  const once = () => {
    unlockAudio();
  };
  // Non rimuovere subito: alcuni browser richiedono play() nello stesso turn del gesto.
  // unlockAudio è idempotente; dopo il primo successo i successivi sono no-op.
  window.addEventListener('pointerdown', once, true);
  window.addEventListener('keydown', once, true);
}

/**
 * @param {string} soundId
 * @param {{ force?: boolean }} [opts]
 * @returns {boolean} true se ha tentato la riproduzione
 */
export function playSound(soundId, opts = {}) {
  const src = resolveSoundSrc(soundId);
  if (!src) return false;

  const settings = readSettings();
  if (settings.muted && !opts.force) return false;
  const volume = settings.sfxVolume;
  if (volume <= 0 && !opts.force) return false;

  const frame = nowFrame();
  const prev = lastPlayFrame.get(soundId);
  if (prev != null && frame - prev < 16) return false;
  lastPlayFrame.set(soundId, frame);

  if (typeof Audio === 'undefined') return false;
  ensurePool();
  unlockAudio();

  const el = pool[poolIndex % pool.length];
  poolIndex += 1;
  try {
    el.pause();
    el.muted = false;
    el.volume = Math.min(1, Math.max(0, volume));
    // Confronta path logico: el.src del browser è sempre assoluto.
    const current = el.getAttribute('src') || '';
    if (current !== src) {
      el.src = src;
    }
    try {
      el.currentTime = 0;
    } catch {
      /* ignore */
    }
    const p = el.play();
    if (p && typeof p.catch === 'function') {
      p.catch(() => {
        unlocked = false;
        unlockAudio();
        try {
          el.muted = false;
          const retry = el.play();
          if (retry && typeof retry.catch === 'function') retry.catch(() => {});
        } catch {
          /* ignore */
        }
      });
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * @param {string} recipe CINEMATIC_RECIPES.*
 * @param {'launch'|'impact'} beat
 * @param {{ reduceMotion?: boolean, force?: boolean }} [opts]
 */
export function playCinematic(recipe, beat, opts = {}) {
  if (!recipe || !beat) return false;
  const reduce = opts.reduceMotion ?? prefersReducedMotionAudio();
  if (!shouldPlayCinematicBeat(beat, reduce)) return false;
  return playSound(cinematicSoundId(recipe, beat), { force: opts.force });
}

/** @param {{ force?: boolean }} [opts] */
export function playUiClick(opts = {}) {
  return playSound('ui.click', opts);
}

/** Solo test / lab: svuota cache frame. */
export function __resetSoundBusForTests() {
  lastPlayFrame.clear();
  cachedSettings = null;
  unlocked = false;
  pool = [];
  poolIndex = 0;
}

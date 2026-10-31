import { getDisplaySettings } from './displaySettings.js';

/** Tempi della regia dello scontro che seguono «Velocità duello»; zoom e arcobaleno restano fissi. */
const PLAYBACK_TIMING_KEYS = [
  'phaseMs0',
  'phaseMs0Empty',
  'phaseMs1',
  'effectStepMs',
  'animationBeatMs',
  'effectPhaseBufferMs',
  'focusCoinStepMs',
  'focusPhaseBufferMs',
  'phaseMs3',
  'phaseMs3Empty',
  'phaseMs4',
  'phaseMs5',
  'nextRoundClashHoldMs',
];

/** 1 = ritmo normale; 2 = il doppio più veloce; 0,75 = più lento. */
export function getDuelPlaybackSpeed() {
  const speed = Number(getDisplaySettings().duelSpeed);
  return Number.isFinite(speed) && speed > 0 ? speed : 1;
}

export function scaleDuelMs(ms, speed = getDuelPlaybackSpeed()) {
  const n = Number(ms);
  if (!Number.isFinite(n)) return ms;
  return Math.max(0, Math.round(n / (speed > 0 ? speed : 1)));
}

export function scaleDuelVisualConfig(config, speed = getDuelPlaybackSpeed()) {
  if (!config || speed === 1) return config;
  const next = { ...config };
  for (const key of PLAYBACK_TIMING_KEYS) {
    if (Number.isFinite(Number(config[key]))) next[key] = scaleDuelMs(config[key], speed);
  }
  return next;
}

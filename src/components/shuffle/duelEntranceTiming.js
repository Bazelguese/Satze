import { LAUNCH_TRANSITION } from '../menu/cosmic/DeckConfirmTransition';

/** Breve attesa prima della scoperta (campagna / online). */
export const DUEL_REVEAL_HOLD_MS = 80;

/** Scoperta continua: un'unica animazione fluida. */
export const DUEL_REVEAL_MS = 2100;

/** @deprecated Alias */
export const DUEL_IRIS_REVEAL_MS = DUEL_REVEAL_MS;

/** @deprecated Dissolve integrato nella reveal */
export const DUEL_REVEAL_DISSOLVE_MS = 0;

/** Fade-in dei mazzi impilati prima di iniziare la mischia. */
export const DUEL_DECK_INTRO_FADE_MS = 550;

/** Pausa breve dopo il fade-in prima del fan-out / shuffle kit. */
export const DUEL_DECK_INTRO_BEAT_MS = 80;

/** Handoff portal → overlay duello. */
export const LAUNCH_PORTAL_HANDOFF_MS = 360;

/** Attesa sotto il nero prima della scoperta (VS IA). */
export function getLaunchRevealHoldMs() {
  return LAUNCH_TRANSITION.FADE_OUT_AT_MS - LAUNCH_TRANSITION.LAUNCH_AT_MS;
}

/** @deprecated La mischia parte su animationend, non su timer fisso. */
export function getDuelShuffleStartMs(launchRevealHoldMs = 0) {
  const hold = launchRevealHoldMs > 0 ? launchRevealHoldMs : DUEL_REVEAL_HOLD_MS;
  return hold + DUEL_REVEAL_MS;
}

/** @deprecated Use getLaunchRevealHoldMs */
export function getLaunchRevealSyncMs() {
  return getDuelShuffleStartMs(getLaunchRevealHoldMs());
}

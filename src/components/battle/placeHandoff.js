// Raccordo fra il gesto del giocatore e la posa d'ingresso dell'agente in campo.
//
// - Rilascio (drop): la carta è già sopra lo slot, quindi la posa salta al momento del
//   «contatto» (le animazioni CSS della carta e dei suoi effetti avanzano insieme, via Web
//   Animations API) e la carta scivola dal punto esatto in cui è stata lasciata. All'impatto
//   la scena dà una piccola scossa.
// - Click: la posa aspetta un istante mentre una copia della carta vola dalla mano allo slot.
//
// Le pose restano quelle di satze-duello-ingresso-carta(-extra).css: qui si sposta solo il tempo.

import { rectToFlightPoint } from '../cards/CardFlight.jsx';

/** Istante (ms) in cui la carta della posa è appena sopra lo slot, poco prima del contatto. */
export const DROP_CONTACT_MS = {
  slam: 470,
  bounce: 290,
  whirlwind: 230,
  // il Varco è un'apertura in aria: senza la prima parte non avrebbe senso
  gate: 0,
  guillotine: 330,
  meteor: 520,
};

/** Istante (ms) dell'impatto sul piano, per la scossa della scena. */
export const DROP_IMPACT_MS = {
  slam: 547,
  bounce: 333,
  whirlwind: 265,
  gate: 680,
  guillotine: 384,
  meteor: 654,
};

/** Attesa della posa al click mentre la carta vola dalla mano allo slot (ms). */
export const CLICK_FLIGHT_MS = 260;

/** Un raccordo vale solo per la carta appena toccata e solo per poco. */
const HANDOFF_MAX_AGE_MS = 1500;

export function prefersReducedMotion() {
  return typeof window !== 'undefined' && Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches);
}

/** Animazioni CSS della posa (carta + effetti) dentro il wrapper dello slot. */
function placeAnimations(wrapEl) {
  try {
    return wrapEl.getAnimations({ subtree: true }).filter((a) => typeof CSSAnimation === 'undefined' || a instanceof CSSAnimation);
  } catch {
    return [];
  }
}

function shakeScene(sceneEl) {
  if (!sceneEl?.animate) return;
  const frames = [
    { transform: 'translate3d(0,0,0)' },
    { transform: 'translate3d(-3px,4px,0)' },
    { transform: 'translate3d(3px,-2px,0)' },
    { transform: 'translate3d(-1px,1px,0)' },
    { transform: 'translate3d(0,0,0)' },
  ];
  try {
    sceneEl.animate(frames, { duration: 260, easing: 'ease-out', composite: 'add' });
  } catch {
    sceneEl.animate(frames, { duration: 260, easing: 'ease-out' });
  }
}

/**
 * @param {HTMLElement} wrapEl wrapper della carta schierata (contiene .place-fx e .place-card)
 * @param {object|null} handoff ultimo gesto ({ via:'drop', cx, cy, rot, scale } o { via:'click', rect })
 * @param {string} pose posa d'ingresso (slam, rise, …)
 * @param {{ agentId: any, sceneEl?: HTMLElement|null, launchFlight?: Function, agent?: object }} ctx
 * @returns {() => void} pulizia (timer e animazioni avviate qui)
 */
export function applyPlaceHandoff(wrapEl, handoff, pose, ctx) {
  if (!wrapEl || !handoff || prefersReducedMotion()) return () => {};
  if (handoff.agentId !== ctx.agentId) return () => {};
  if (performance.now() - (handoff.t ?? 0) > HANDOFF_MAX_AGE_MS) return () => {};

  const anims = placeAnimations(wrapEl);
  const box = wrapEl.getBoundingClientRect();
  const sceneScale = wrapEl.offsetWidth ? box.width / wrapEl.offsetWidth : 1;
  const slotCx = box.left + box.width / 2;
  const slotCy = box.top + box.height / 2;
  const timers = [];
  const started = [];

  if (handoff.via === 'drop') {
    const skip = DROP_CONTACT_MS[pose] ?? 0;
    if (skip > 0) anims.forEach((a) => { a.currentTime = skip; });
    // dal punto di rilascio allo slot (coordinate locali della scena)
    const dx = (handoff.cx - slotCx) / sceneScale;
    const dy = (handoff.cy - slotCy) / sceneScale;
    const s = (handoff.scale ?? sceneScale) / sceneScale;
    if (Math.hypot(dx, dy) > 1 || Math.abs((handoff.rot ?? 0)) > 0.5 || Math.abs(s - 1) > 0.01) {
      started.push(
        wrapEl.animate(
          [{ transform: `translate(${dx}px, ${dy}px) rotate(${handoff.rot ?? 0}deg) scale(${s})` }, { transform: 'none' }],
          { duration: skip > 0 ? 180 : 260, easing: 'cubic-bezier(.2,.8,.2,1)' },
        ),
      );
    }
    const impact = (DROP_IMPACT_MS[pose] ?? 0) - skip;
    if (ctx.sceneEl && impact >= 0) timers.push(setTimeout(() => shakeScene(ctx.sceneEl), impact));
  } else if (handoff.via === 'press' && handoff.rect) {
    // click: la posa aspetta il volo dalla mano
    anims.forEach((a) => { a.currentTime = -CLICK_FLIGHT_MS; });
    ctx.launchFlight?.({
      agent: ctx.agent,
      from: rectToFlightPoint(handoff.rect),
      to: { cx: slotCx, cy: slotCy, scale: sceneScale, rot: 0 },
      duration: CLICK_FLIGHT_MS + 80,
      arc: 70,
      fadeOut: true,
    });
  }

  return () => {
    timers.forEach(clearTimeout);
    started.forEach((a) => a.cancel());
  };
}

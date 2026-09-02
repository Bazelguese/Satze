import { getPlaceFxDurationMs } from '../../utils/placeFxPreference.js';

export function queryFlightAnchor(anchor) {
  if (!anchor || typeof document === 'undefined') return null;
  if (anchor.type === 'prey-token') {
    const exact = anchor.id != null
      ? document.querySelector(`[data-side="${anchor.side}"] [data-mark-token="prey-${anchor.id}"]`)
      : null;
    return exact
      || document.querySelector(`[data-side="${anchor.side}"] [data-mark-token^="prey-"]`)
      || document.querySelector(`[data-side="${anchor.side}"] .em-card`);
  }
  if (anchor.type === 'card') {
    return document.querySelector(`[data-side="${anchor.side}"] .em-card`);
  }
  if (anchor.type === 'announce') {
    return document.querySelector(`[data-em-announce="${anchor.side}"]`);
  }
  if (anchor.type === 'field-agent') {
    const zone = document.querySelector(`[data-field-agent="${anchor.side}"]`);
    return zone?.querySelector('.place-card') || zone;
  }
  if (anchor.type === 'presence') {
    return document.querySelector(`[data-side="${anchor.side}"] [data-em-presence]`)
      || document.querySelector(`[data-side="${anchor.side}"] .em-card`);
  }
  if (anchor.type === 'hp') {
    return document.querySelector(`[data-em-hp="${anchor.side}"]`);
  }
  if (anchor.type === 'slot') {
    if (anchor.id != null) return document.querySelector(`[data-field-slot="${anchor.id}"]`);
    return document.querySelector('[data-field-slot]');
  }
  if (anchor.type === 'hand') {
    return document.querySelector(`[data-hand-agent="${anchor.id}"]`);
  }
  return null;
}

export function normalizeFlight(flight) {
  if (!flight) return null;
  if (flight.from && flight.to) return flight;
  return {
    ...flight,
    from: { type: 'card', side: flight.fromSide },
    to: flight.kind === 'slot'
      ? { type: 'slot', id: flight.id }
      : { type: 'hand', id: flight.id },
  };
}

export function addedIds(prev, next) {
  const known = prev instanceof Set ? prev : new Set(prev || []);
  return (next || []).filter((id) => !known.has(id));
}

export function curseSlotKeys(slotCurses) {
  return Object.entries(slotCurses || {})
    .filter(([, list]) => Array.isArray(list) && list.length > 0)
    .map(([key]) => Number(key))
    .filter((key) => Number.isFinite(key));
}

function placeCardOf(side) {
  if (typeof document === 'undefined') return null;
  const zone = document.querySelector(`[data-field-agent="${side}"]`);
  return zone?.querySelector('.place-card') || zone;
}

function animationsOf(el) {
  if (!el || typeof el.getAnimations !== 'function') return [];
  return el.getAnimations();
}

function liveAnimations(el) {
  return animationsOf(el).filter((anim) => anim.playState === 'running' || anim.playState === 'pending');
}

function playFxName(el) {
  const playClass = el ? [...el.classList].find((name) => name.startsWith('play-')) : null;
  return playClass ? playClass.slice(5) : null;
}

/**
 * Attende la fine dell'ingresso (place-fx) dell'Agente in campo.
 * Se la carta è già ferma, risolve subito: non ritarda un Agente già assestato.
 */
export function waitForFieldAgentEntrance(side, { timeoutMs = 1800 } = {}) {
  return new Promise((resolve) => {
    if (typeof document === 'undefined' || !side) {
      resolve();
      return;
    }
    let settled = false;
    let raf = 0;
    let timer = 0;
    let fallback = 0;
    let watched = null;
    const onEnd = (event) => {
      if (!watched || event.target !== watched) return;
      if (!liveAnimations(watched).length) finish();
    };
    const finish = () => {
      if (settled) return;
      settled = true;
      window.cancelAnimationFrame(raf);
      window.clearTimeout(timer);
      window.clearTimeout(fallback);
      watched?.removeEventListener('animationend', onEnd);
      resolve();
    };
    timer = window.setTimeout(finish, timeoutMs);

    const watch = (tries) => {
      if (settled) return;
      const el = placeCardOf(side);
      if (el && el !== watched) {
        watched?.removeEventListener('animationend', onEnd);
        watched = el;
        watched.addEventListener('animationend', onEnd);
      }
      const running = liveAnimations(el);
      if (running.length) {
        Promise.all(running.map((anim) => anim.finished.catch(() => {}))).then(finish);
        return;
      }
      if (animationsOf(el).some((anim) => anim.playState === 'finished')) {
        finish();
        return;
      }
      if (tries < 8) {
        raf = window.requestAnimationFrame(() => watch(tries + 1));
        return;
      }
      const fx = playFxName(el);
      if (fx) {
        fallback = window.setTimeout(finish, getPlaceFxDurationMs(fx));
        return;
      }
      finish();
    };
    watch(0);
  });
}

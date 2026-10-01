/**
 * Clock arcobaleno/diamante FC fuori dallo state React root.
 * I consumer si iscrivono con useSyncExternalStore e si ri-renderizzano
 * senza far riconciliare tutta la schermata di gioco.
 */

let time = 0;
let epoch = 0;
/** @type {Set<() => void>} */
const listeners = new Set();
/** @type {ReturnType<typeof setInterval> | null} */
let timer = null;

function emit() {
  epoch += 1;
  listeners.forEach((cb) => {
    try {
      cb();
    } catch (err) {
      console.error(err);
    }
  });
}

/**
 * @param {{ intervalMs: number, step: number }} opts
 */
export function startRainbowGlowClock({ intervalMs, step }) {
  stopRainbowGlowClock({ reset: true });
  const ms = Number.isFinite(intervalMs) && intervalMs > 0 ? intervalMs : 50;
  const delta = Number.isFinite(step) ? step : 0.05;
  timer = setInterval(() => {
    time += delta;
    emit();
  }, ms);
}

/**
 * @param {{ reset?: boolean }} [opts]
 */
export function stopRainbowGlowClock(opts = {}) {
  const hadTimer = timer != null;
  if (hadTimer) {
    clearInterval(timer);
    timer = null;
  }
  if (opts.reset === false) return;
  const changed = time !== 0 || hadTimer;
  time = 0;
  // Evita emit a vuoto: altrimenti ogni effect “idle” può stormare i subscriber.
  if (changed) emit();
}

/** @param {() => void} cb */
export function subscribeRainbowGlow(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function getRainbowGlowTime() {
  return time;
}

/** Solo per forzare re-render (valore che cambia a ogni tick). */
export function getRainbowGlowEpoch() {
  return epoch;
}

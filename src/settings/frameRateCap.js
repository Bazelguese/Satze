/**
 * Cap globale del frame rate via throttle di requestAnimationFrame.
 * 0 / non finito = illimitato (ripristina i nativi).
 */

let nativeRAF = null;
let nativeCAF = null;
let installed = false;
/** @type {number} ms tra frame; 0 = passthrough */
let targetInterval = 0;
let nextId = 1;
/** @type {Map<number, FrameRequestCallback>} */
const queue = new Map();
let pumpScheduled = false;
let lastFire = 0;

function ensureNative() {
  if (typeof window === 'undefined') return false;
  if (!nativeRAF) {
    nativeRAF = window.requestAnimationFrame.bind(window);
    nativeCAF = window.cancelAnimationFrame.bind(window);
  }
  return true;
}

function pump(ts) {
  pumpScheduled = false;
  if (targetInterval <= 0) return;

  if (ts - lastFire < targetInterval - 0.5) {
    pumpScheduled = true;
    nativeRAF(pump);
    return;
  }

  lastFire = ts;
  const batch = Array.from(queue.entries());
  queue.clear();
  for (const [, cb] of batch) {
    try {
      cb(ts);
    } catch (err) {
      console.error(err);
    }
  }

  if (queue.size > 0 && !pumpScheduled) {
    pumpScheduled = true;
    nativeRAF(pump);
  }
}

function uninstall() {
  if (!installed || !nativeRAF || !nativeCAF) return;
  window.requestAnimationFrame = nativeRAF;
  window.cancelAnimationFrame = nativeCAF;
  installed = false;
  queue.clear();
  pumpScheduled = false;
  targetInterval = 0;
}

function install() {
  if (installed || !ensureNative()) return;

  window.requestAnimationFrame = (cb) => {
    if (typeof cb !== 'function' || targetInterval <= 0) {
      return nativeRAF(cb);
    }
    const id = nextId++;
    queue.set(id, cb);
    if (!pumpScheduled) {
      pumpScheduled = true;
      nativeRAF(pump);
    }
    return id;
  };

  window.cancelAnimationFrame = (id) => {
    if (queue.has(id)) {
      queue.delete(id);
      return;
    }
    return nativeCAF(id);
  };

  installed = true;
}

/**
 * @param {number} fps 0 = illimitato
 */
export function applyFrameRateCap(fps) {
  if (!ensureNative()) return;
  const cap = Number(fps);
  if (!Number.isFinite(cap) || cap <= 0) {
    uninstall();
    return;
  }
  targetInterval = 1000 / Math.min(240, Math.max(1, Math.round(cap)));
  install();
}

/** @returns {number} FPS effettivo del cap, o 0 se illimitato */
export function getActiveFrameRateCap() {
  if (!installed || targetInterval <= 0) return 0;
  return Math.round(1000 / targetInterval);
}

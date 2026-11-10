import { hydrateAiDecision } from './worker/serializeAiDecision.js';

let worker = null;
let nextRequestId = 0;
const pending = new Map();

/** Se il worker non risponde, la UI restava bloccata su “IA sta pensando”. */
const AI_WORKER_TIMEOUT_MS = 6000;

function rejectAllPending(reason) {
  pending.forEach(({ reject, timer }) => {
    if (timer) clearTimeout(timer);
    reject(reason);
  });
  pending.clear();
}

function getAiWorker() {
  if (worker) return worker;
  if (typeof Worker === 'undefined') {
    throw new Error('Web Workers non disponibili');
  }

  worker = new Worker(new URL('./worker/aiComputeWorker.js', import.meta.url), {
    type: 'module',
  });

  worker.onmessage = (event) => {
    const { id, ok, decision, error } = event.data || {};
    const entry = pending.get(id);
    if (!entry) return;
    pending.delete(id);
    if (entry.timer) clearTimeout(entry.timer);
    if (ok) entry.resolve(decision);
    else entry.reject(new Error(error || 'AI worker failed'));
  };

  worker.onerror = (event) => {
    rejectAllPending(new Error(event.message || 'AI worker error'));
    try {
      worker?.terminate();
    } catch {
      /* ignore */
    }
    worker = null;
  };

  return worker;
}

function cloneContextForWorker(context) {
  if (typeof structuredClone === 'function') {
    return structuredClone(context);
  }
  return JSON.parse(JSON.stringify(context));
}

/**
 * Calcolo IA su thread separato; ritorna decisione con `card` idratata dal contesto locale.
 * Timeout → reject (il caller fa fallback sul main thread).
 */
export function runAiDecisionInWorker(context, difficulty, needsJoint) {
  return new Promise((resolve, reject) => {
    let w;
    try {
      w = getAiWorker();
    } catch (err) {
      reject(err);
      return;
    }

    const id = ++nextRequestId;
    const timer = setTimeout(() => {
      if (!pending.has(id)) return;
      pending.delete(id);
      reject(new Error(`AI worker timeout after ${AI_WORKER_TIMEOUT_MS}ms`));
    }, AI_WORKER_TIMEOUT_MS);

    pending.set(id, { resolve, reject, timer });

    try {
      w.postMessage({
        id,
        needsJoint: Boolean(needsJoint),
        difficulty: difficulty || context?.difficulty || 'medium',
        context: cloneContextForWorker(context),
      });
    } catch (err) {
      pending.delete(id);
      clearTimeout(timer);
      reject(err);
    }
  }).then((stripped) => hydrateAiDecision(stripped, context));
}

/**
 * Motore a simulazione nel worker. `maxMs` è il tempo di calcolo concesso al motore;
 * il timeout del messaggio lascia un margine. Timeout o errore → reject (fallback del caller).
 *
 * @param {object} view - da buildMcViewFromGameState (già serializzabile)
 * @param {object} context - information set, per idratare la carta scelta
 * @param {string} difficulty
 * @param {{ maxMs: number, seed?: number, trait?: string }} options
 */
export function runMcDecisionInWorker(view, context, difficulty, { maxMs, seed, trait } = {}) {
  const timeoutMs = Math.max(AI_WORKER_TIMEOUT_MS, (Number(maxMs) || 0) + 4000);
  return new Promise((resolve, reject) => {
    let w;
    try {
      w = getAiWorker();
    } catch (err) {
      reject(err);
      return;
    }
    const id = ++nextRequestId;
    const timer = setTimeout(() => {
      if (!pending.has(id)) return;
      pending.delete(id);
      reject(new Error(`AI worker (simulazione) timeout after ${timeoutMs}ms`));
    }, timeoutMs);
    pending.set(id, { resolve, reject, timer });
    try {
      w.postMessage({ id, kind: 'montecarlo', difficulty, view, maxMs, seed, trait });
    } catch (err) {
      pending.delete(id);
      clearTimeout(timer);
      reject(err);
    }
  }).then((stripped) => hydrateAiDecision(stripped, context));
}

export function isAiWorkerSupported() {
  return typeof Worker !== 'undefined';
}

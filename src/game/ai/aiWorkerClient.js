import { hydrateAiDecision } from './worker/serializeAiDecision.js';

let worker = null;
let nextRequestId = 0;
const pending = new Map();

function rejectAllPending(reason) {
  pending.forEach(({ reject }) => reject(reason));
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
    if (ok) entry.resolve(decision);
    else entry.reject(new Error(error || 'AI worker failed'));
  };

  worker.onerror = (event) => {
    rejectAllPending(new Error(event.message || 'AI worker error'));
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
    pending.set(id, { resolve, reject });

    try {
      w.postMessage({
        id,
        needsJoint: Boolean(needsJoint),
        difficulty: difficulty || context?.difficulty || 'medium',
        context: cloneContextForWorker(context),
      });
    } catch (err) {
      pending.delete(id);
      reject(err);
    }
  }).then((stripped) => hydrateAiDecision(stripped, context));
}

export function isAiWorkerSupported() {
  return typeof Worker !== 'undefined';
}

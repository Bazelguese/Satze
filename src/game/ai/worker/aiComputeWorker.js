import { chooseAIAction, chooseJointAIAction } from '../index.js';
import { chooseMonteCarloDecision } from '../mc/mcGameAdapter.js';
import { stripDecisionForTransfer } from './serializeAiDecision.js';

self.onmessage = (event) => {
  const { id, kind, needsJoint, difficulty, context, view, maxMs, seed, trait } = event.data || {};
  try {
    const cache = new Map();
    const raw =
      kind === 'montecarlo'
        ? chooseMonteCarloDecision(view, difficulty, { maxMs, seed, trait })
        : needsJoint
          ? chooseJointAIAction(context, difficulty, { cache })
          : chooseAIAction(context, difficulty, { cache });
    self.postMessage({
      id,
      ok: true,
      decision: stripDecisionForTransfer(raw),
    });
  } catch (err) {
    self.postMessage({
      id,
      ok: false,
      error: err?.message ? String(err.message) : String(err),
    });
  }
};

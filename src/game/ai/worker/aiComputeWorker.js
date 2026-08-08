import { chooseAIAction, chooseJointAIAction } from '../index.js';
import { stripDecisionForTransfer } from './serializeAiDecision.js';

self.onmessage = (event) => {
  const { id, needsJoint, difficulty, context } = event.data || {};
  try {
    const cache = new Map();
    const raw = needsJoint
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

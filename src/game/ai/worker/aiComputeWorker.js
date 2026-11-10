import { chooseAIAction, chooseJointAIAction } from '../index.js';
import { chooseMonteCarloDecision } from '../mc/mcGameAdapter.js';
import { chooseTeamOpening, chooseTeamResponse } from '../mcTeam/teamSearch.js';
import { getTeamMcProfile } from '../mcTeam/teamProfiles.js';
import { chooseKothCommit } from '../mcKoth/kothSearch.js';
import { getKothMcProfile } from '../mcKoth/kothProfiles.js';
import { mulberry32 } from '../../../utils/seededRandom.js';
import { stripDecisionForTransfer } from './serializeAiDecision.js';

self.onmessage = (event) => {
  const { id, kind, needsJoint, difficulty, context, view, maxMs, seed, trait } = event.data || {};
  if (kind === 'koth-commit') {
    try {
      const { match, seatId } = event.data;
      const params = { ...getKothMcProfile(difficulty), trait: trait || 'neutral', ...(maxMs ? { maxMs } : {}) };
      const rng = mulberry32((seed ?? Math.floor(Math.random() * 2 ** 32)) >>> 0);
      self.postMessage({ id, ok: true, decision: chooseKothCommit(match, seatId, params, rng) });
    } catch (err) {
      self.postMessage({ id, ok: false, error: err?.message ? String(err.message) : String(err) });
    }
    return;
  }
  if (kind === 'team-opening' || kind === 'team-response') {
    try {
      const { match, teamId, aiSeatIds, fixedSeats, fixedPairing, traits } = event.data;
      const params = { ...getTeamMcProfile(difficulty), traits: traits || {}, ...(maxMs ? { maxMs } : {}) };
      const rng = mulberry32((seed ?? Math.floor(Math.random() * 2 ** 32)) >>> 0);
      const result =
        kind === 'team-opening'
          ? chooseTeamOpening(match, teamId, params, rng, { aiSeatIds, fixedSeats })
          : chooseTeamResponse(match, teamId, params, rng, { aiSeatIds, fixedSeats, fixedPairing });
      self.postMessage({ id, ok: true, decision: result });
    } catch (err) {
      self.postMessage({ id, ok: false, error: err?.message ? String(err.message) : String(err) });
    }
    return;
  }
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

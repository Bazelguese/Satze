// ============================================
// SATZE — Libreria harness traccia Eminenza
// Lettore puro: nessun ramo di gioco, nessun fix di regole.
// ============================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  EFFECT_TIMINGS,
  EMINENCE_PRIMITIVES,
  HP_LOSS_CAUSES,
  REVEAL_GATES,
  SIDES,
} from '../src/game/eminence/eminenceConstants.js';
import { CONDITION_KEYS, matchesCondition, createConditionContext } from '../src/game/eminence/effectConditions.js';
import {
  EMINENCES,
  IMPLEMENTED_EMINENCE_IDS,
  getEminence,
  getEminenceAbility,
} from '../src/data/eminences.js';
import {
  createEminenceMatchState,
  getLegalAbilityIds,
  hasAlwaysLegalOption,
} from '../src/game/eminence/eminenceState.js';
import { selectEminenceAbility, getNextGate } from '../src/game/eminence/eminenceRound.js';
import {
  openEminenceRound,
  advanceToNextRevealGate,
  prepareEminenceDuel,
  settleEminenceRound,
  notifyHpLossEvents,
} from '../src/game/eminence/eminenceDuelGate.js';
import { enrichNotices, GATE_LABELS } from '../src/game/eminence/eminenceAnnouncements.js';
import { resolveNoticeCinematics, CINEMATIC_RECIPES } from '../src/game/eminence/eminenceCinematics.js';
import { isLowestEffectiveLeague } from '../src/game/eminence/eminenceDuelBinding.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const FIXTURES_DIR = path.join(HERE, 'fixtures', 'eminence');
export const DEFAULTS_PATH = path.join(FIXTURES_DIR, '_defaults.json');

/** Primitive che non producono cue per scelta di design (non sono buchi). */
export const EXPECTED_NO_CUE_PRIMITIVES = Object.freeze([
  EMINENCE_PRIMITIVES.MARK_CARD,
]);

const KNOWN_PRIMITIVES = new Set(Object.values(EMINENCE_PRIMITIVES));
const KNOWN_TIMINGS = new Set(Object.values(EFFECT_TIMINGS));
const KNOWN_CONDITION_KEYS = new Set(CONDITION_KEYS);

const INITIATIVE_LABEL = {
  [SIDES.PLAYER]: 'giocatore',
  [SIDES.ENEMY]: 'avversario',
};

const SIDE_LABEL = {
  [SIDES.PLAYER]: 'giocatore',
  [SIDES.ENEMY]: 'avversario',
};

function deepMerge(base, over) {
  if (!over || typeof over !== 'object') return base;
  if (Array.isArray(base) || Array.isArray(over)) return over ?? base;
  const out = { ...(base || {}) };
  for (const [key, value] of Object.entries(over)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      out[key] = deepMerge(base?.[key], value);
    } else if (value !== undefined) {
      out[key] = value;
    }
  }
  return out;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

export function loadDefaults() {
  if (!fs.existsSync(DEFAULTS_PATH)) {
    throw new Error(`Manca ${DEFAULTS_PATH}`);
  }
  return readJson(DEFAULTS_PATH);
}

export function loadScenario(filePath) {
  const defaults = loadDefaults();
  const raw = readJson(filePath);
  const merged = deepMerge(defaults, raw);
  if (!merged.name) merged.name = path.basename(filePath, '.json');
  return merged;
}

/** Scenario sintetico da flag CLI (usa i default + branch hit/miss). */
export function scenarioFromFlags({ eminenceId, abilityId, branch = 'hit' }) {
  const defaults = loadDefaults();
  const eminence = getEminence(eminenceId);
  if (!eminence) throw new Error(`Eminenza sconosciuta: ${eminenceId}`);
  const ability = getEminenceAbility(eminenceId, abilityId);
  if (!ability) throw new Error(`Abilità sconosciuta: ${eminenceId}/${abilityId}`);

  const hit = branch !== 'miss';
  const scenario = deepMerge(defaults, {
    name: `${abilityId}_${branch}`,
    player: {
      eminenceId,
      presence: Math.max(eminence.initialPresence ?? 1, Math.abs(Math.min(0, ability.presenceDelta || 0))),
      abilityId,
      params: suggestParams(ability, hit),
    },
    enemy: {
      eminenceId: null,
    },
    outcome: hit ? defaults.outcome : {
      ...defaults.outcome,
      winner: SIDES.PLAYER,
      powerResolvedBySide: { player: false, enemy: false },
      activatedTriggerBySide: { player: null, enemy: null },
      hpDeltas: { player: 0, enemy: 0 },
    },
  });

  // Rami specifici per condizioni tipiche
  if (abilityId.includes('sacrificio') || abilityId.includes('cannibalismo')) {
    scenario.outcome.winner = hit ? SIDES.ENEMY : SIDES.PLAYER;
  }
  if (abilityId.includes('devozione') || abilityId.includes('convalida')) {
    scenario.outcome.powerResolvedBySide = {
      player: hit,
      enemy: false,
    };
  }
  if (abilityId.includes('leggerezza')) {
    scenario.player.presence = Math.max(scenario.player.presence || 0, 2);
    scenario.player.agent = {
      ...(scenario.player.agent || defaults.player.agent),
      focusInvested: hit ? 1 : 3,
      league: 3,
      anchored: !hit,
    };
  }
  if (abilityId.includes('rito') || ability.segments?.some((s) => s.condition?.ownActivatedTrigger === 'overdrive')) {
    scenario.outcome.activatedTriggerBySide = {
      player: hit ? 'overdrive' : null,
      enemy: null,
    };
  }
  if (ability.paramsSchema?.slot && hit) {
    scenario.player.params = { slot: 2 };
  }
  if (ability.paramsSchema?.pronostico) {
    scenario.player.params = { ...(scenario.player.params || {}), pronostico: hit ? 'win' : 'loss' };
    scenario.outcome.winner = hit ? SIDES.PLAYER : SIDES.ENEMY;
  }

  return scenario;
}

function suggestParams(ability, hit) {
  if (!ability?.paramsSchema) return null;
  const params = {};
  if (ability.paramsSchema.slot) params.slot = 2;
  if (ability.paramsSchema.pronostico) params.pronostico = hit ? 'win' : 'loss';
  if (ability.paramsSchema.preyCardId) params.preyCardId = 118;
  if (ability.paramsSchema.cardId) params.cardId = 231;
  if (ability.paramsSchema.fragmentCardId) params.fragmentCardId = 231;
  return Object.keys(params).length ? params : null;
}

export function stableStringify(value) {
  return JSON.stringify(sortKeys(value), null, 2);
}

function sortKeys(value) {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === 'object') {
    const out = {};
    for (const key of Object.keys(value).sort()) out[key] = sortKeys(value[key]);
    return out;
  }
  return value;
}

function formatPresenceDelta(delta) {
  if (delta > 0) return `+${delta}`;
  return String(delta);
}

function cueFromNotice(notice, agentsDeployed) {
  const cues = resolveNoticeCinematics(notice, {
    accents: { player: '#c9e238', enemy: '#c9e238' },
    agentsDeployed: agentsDeployed || { player: true, enemy: true },
  });
  return cues.map((cue) => ({
    recipe: cue.recipe,
    from: cue.flight?.from || null,
    to: cue.flight?.to || null,
    waitFor: cue.waitFor || null,
    holdAnnounce: Boolean(cue.holdAnnounce),
    flight: cue.flight ? true : false,
  }));
}

function describeAnchor(anchor) {
  if (!anchor) return '—';
  const bits = [anchor.type];
  if (anchor.side) bits.push(anchor.side);
  if (anchor.id != null) bits.push(String(anchor.id));
  return bits.join('/');
}

function collectCatalogSegments(eminenceId, abilityId) {
  const eminence = getEminence(eminenceId);
  const rows = [];
  if (eminence?.static?.segments) {
    for (const segment of eminence.static.segments) {
      rows.push({
        source: 'static',
        sourceId: eminence.static.id,
        sourceName: eminence.static.name,
        segment,
      });
    }
  }
  if (eminence?.static?.setupSegments) {
    for (const segment of eminence.static.setupSegments) {
      rows.push({
        source: 'static-setup',
        sourceId: eminence.static.id,
        sourceName: eminence.static.name,
        segment,
      });
    }
  }
  if (abilityId) {
    const ability = getEminenceAbility(eminenceId, abilityId);
    for (const segment of ability?.segments || []) {
      rows.push({
        source: 'ability',
        sourceId: ability.id,
        sourceName: ability.name,
        segment,
      });
    }
  }
  return rows;
}

function evaluateCondition(condition, context) {
  if (!condition) return { status: 'none', detail: null };
  try {
    for (const key of Object.keys(condition)) {
      if (!(key in context)) {
        return {
          status: 'deferred',
          detail: `${key}: (assente) → non ancora valutabile`,
          keys: Object.keys(condition),
        };
      }
    }
    const ok = matchesCondition(condition, context);
    const parts = Object.entries(condition).map(([key, expected]) => {
      const actual = context[key];
      return `${key}: ${JSON.stringify(expected)} (obs ${JSON.stringify(actual)}) → ${ok ? 'vera' : 'falsa'}`;
    });
    return { status: ok ? 'true' : 'false', detail: parts.join('; '), keys: Object.keys(condition) };
  } catch (err) {
    return { status: 'error', detail: err.message, keys: Object.keys(condition) };
  }
}

function agentIdBySideFrom(scenario) {
  return {
    [SIDES.PLAYER]: scenario.player?.agent?.cardId ?? null,
    [SIDES.ENEMY]: scenario.enemy?.agent?.cardId ?? null,
  };
}

function focusInvestedFrom(scenario) {
  return {
    [SIDES.PLAYER]: scenario.player?.agent?.focusInvested ?? 0,
    [SIDES.ENEMY]: scenario.enemy?.agent?.focusInvested ?? 0,
  };
}

function leagueFrom(scenario) {
  return {
    [SIDES.PLAYER]: scenario.player?.agent?.league ?? 0,
    [SIDES.ENEMY]: scenario.enemy?.agent?.league ?? 0,
  };
}

function agentCardFrom(sideState) {
  const agent = sideState?.agent;
  if (!agent) return null;
  return { id: agent.cardId, league: agent.league };
}

function deployedIsLowestFrom(scenario) {
  if (scenario.deployedIsLowestLeagueBySide) return scenario.deployedIsLowestLeagueBySide;
  const leagueByCardId = scenario.leagueByCardId || null;
  return {
    [SIDES.PLAYER]: isLowestEffectiveLeague(
      agentCardFrom(scenario.player),
      scenario.player?.remainingHand || [],
      leagueByCardId,
    ),
    [SIDES.ENEMY]: isLowestEffectiveLeague(
      agentCardFrom(scenario.enemy),
      scenario.enemy?.remainingHand || [],
      leagueByCardId,
    ),
  };
}

function presenceOf(state, side) {
  return state?.[side]?.presence ?? null;
}

function fragmentCount(state, side) {
  return state?.[side]?.persistent?.fragmentCardIds?.length ?? 0;
}

/**
 * Fixture `outcome.hpDeltas` è un oggetto { player, enemy } (handoff).
 * Il motore vuole un array di eventi { side, amount, cause }.
 */
function normalizeHpDeltas(hpDeltas) {
  if (!hpDeltas) return [];
  if (Array.isArray(hpDeltas)) return hpDeltas;
  const out = [];
  for (const side of [SIDES.PLAYER, SIDES.ENEMY]) {
    const amount = hpDeltas[side];
    if (amount == null || amount === 0) continue;
    out.push({
      side,
      amount,
      cause: amount < 0 ? HP_LOSS_CAUSES.DUEL_DEFEAT_DAMAGE : HP_LOSS_CAUSES.OTHER,
    });
  }
  return out;
}

/**
 * Esegue lo scenario e restituisce un oggetto traccia deterministico.
 */
export function runTrace(scenario) {
  const playerId = scenario.player?.eminenceId;
  if (!playerId) throw new Error('scenario.player.eminenceId obbligatorio');
  const enemyId = scenario.enemy?.eminenceId ?? null;
  const abilityId = scenario.player?.abilityId;
  if (!abilityId) throw new Error('scenario.player.abilityId obbligatorio');

  const eminence = getEminence(playerId);
  const ability = getEminenceAbility(playerId, abilityId);
  if (!eminence || !ability) throw new Error(`Voce catalogo assente: ${playerId}/${abilityId}`);

  const initiativeSide = scenario.initiativeSide || SIDES.PLAYER;
  const roundNumber = scenario.roundNumber ?? 3;
  const agents = agentIdBySideFrom(scenario);
  const agentsDeployed = {
    player: agents.player != null,
    enemy: agents.enemy != null,
  };

  let matchState = createEminenceMatchState({
    playerEminenceId: playerId,
    enemyEminenceId: enemyId,
  });

  if (scenario.player?.presence != null) matchState.player.presence = scenario.player.presence;
  if (enemyId && scenario.enemy?.presence != null) matchState.enemy.presence = scenario.enemy.presence;

  // Persistenti opzionali (frammenti / prede già presenti)
  if (scenario.player?.fragments) {
    matchState.player.persistent.fragmentCardIds = [...scenario.player.fragments];
  }
  if (scenario.player?.prey) {
    matchState.player.persistent.preyCardIds = [...scenario.player.prey];
  }

  const presenceStart = {
    player: matchState.player.presence,
    enemy: matchState.enemy?.presence ?? null,
  };
  const fragmentsStart = {
    player: fragmentCount(matchState, SIDES.PLAYER),
    enemy: fragmentCount(matchState, SIDES.ENEMY),
  };

  const opened = openEminenceRound(matchState, { roundNumber, initiativeSide });
  matchState = opened.matchState;

  const checkpointPresence = matchState.player.selectionCheckpointPresence;
  const legalIds = getLegalAbilityIds(playerId, checkpointPresence);
  const alwaysLegal = hasAlwaysLegalOption(playerId);
  const legalDescribed = legalIds.map((id) => {
    const entry = getEminenceAbility(playerId, id);
    return {
      id,
      presenceDelta: entry?.presenceDelta ?? null,
    };
  });

  const choice = selectEminenceAbility(
    matchState,
    SIDES.PLAYER,
    abilityId,
    scenario.player?.params ?? null,
  );
  if (!choice.ok) {
    throw new Error(`Scelta rifiutata: ${choice.reason}`);
  }
  matchState = choice.matchState;

  if (enemyId && scenario.enemy?.abilityId) {
    const enemyChoice = selectEminenceAbility(
      matchState,
      SIDES.ENEMY,
      scenario.enemy.abilityId,
      scenario.enemy?.params ?? null,
    );
    if (!enemyChoice.ok) throw new Error(`Scelta avversario rifiutata: ${enemyChoice.reason}`);
    matchState = enemyChoice.matchState;
  }

  const presenceAfterSelect = presenceOf(matchState, SIDES.PLAYER);
  const steps = [];
  const allNotices = [];
  const allCues = [];
  let segmentsWithoutCue = 0;
  let segmentsWithoutNotice = 0;

  // ROUND_START già applicato in open — registra effetti applicati
  if (opened.appliedEffects?.length || opened.notices?.length) {
    const notices = enrichNotices(opened.notices || []);
    const cueRows = notices.flatMap((notice) => {
      const cues = cueFromNotice(notice, agentsDeployed);
      allCues.push(...cues);
      return cues.map((cue) => ({ noticeId: notice.id, ...cue }));
    });
    allNotices.push(...notices);
    steps.push({
      kind: 'checkpoint',
      timing: EFFECT_TIMINGS.ROUND_START,
      gate: null,
      badge: 'Passivo',
      notices: notices.map(serializeNotice),
      cues: cueRows,
      presence: {
        player: presenceOf(matchState, SIDES.PLAYER),
        enemy: presenceOf(matchState, SIDES.ENEMY),
      },
    });
  }

  // Gate loop
  let guard = 0;
  while (getNextGate(matchState.gateProgress) && guard < 6) {
    guard += 1;
    const gate = getNextGate(matchState.gateProgress);
    const advanced = advanceToNextRevealGate(matchState, {
      initiativeSide,
      announceDeployedMarks: gate === REVEAL_GATES.GENERAL,
      agentIdBySide: agents,
      focusInvestedBySide: focusInvestedFrom(scenario),
      leagueBySide: leagueFrom(scenario),
    });
    if (advanced.blocked) {
      throw new Error(`Gate bloccato (${gate}): ${advanced.blocked}`);
    }
    matchState = advanced.matchState;
    const notices = enrichNotices(advanced.notices || []);
    const cueRows = [];
    for (const notice of notices) {
      const cues = cueFromNotice(notice, agentsDeployed);
      if (!cues.length) {
        // reveal senza payoff → REVEAL_OPEN o PASSIVE già gestiti; se ancora vuoto conta
        if (notice.kind === 'reveal' || notice.kind === 'effect') {
          // resolveNoticeCinematics should still return something for reveal
        }
      }
      for (const cue of cues) {
        cueRows.push({ noticeId: notice.id, ...cue });
        allCues.push(cue);
      }
      if ((notice.payoffs || []).some((p) => EXPECTED_NO_CUE_PRIMITIVES.includes(p.primitive))) {
        segmentsWithoutCue += 1;
      }
    }
    allNotices.push(...notices);
    steps.push({
      kind: 'gate',
      timing: null,
      gate: advanced.gate,
      gateLabel: GATE_LABELS[advanced.gate] || advanced.gate,
      badge: notices[0]?.badgeText || GATE_LABELS[advanced.gate] || advanced.gate,
      notices: notices.map(serializeNotice),
      cues: cueRows,
      presence: {
        player: presenceOf(matchState, SIDES.PLAYER),
        enemy: presenceOf(matchState, SIDES.ENEMY),
      },
      presenceAfterReveal: presenceOf(matchState, SIDES.PLAYER),
    });
  }

  const presenceAfterReveal = presenceOf(matchState, SIDES.PLAYER);

  // Pre-duello (BEFORE_TRIGGER_CHECK / BEFORE_POWER / BEFORE_FIELD)
  const prepared = prepareEminenceDuel(matchState, {
    initiativeSide,
    agentIdBySide: agents,
    focusInvestedBySide: focusInvestedFrom(scenario),
    leagueBySide: leagueFrom(scenario),
    currentFieldIndex: scenario.fieldIndex ?? 0,
    deployedIsLowestLeagueBySide: deployedIsLowestFrom(scenario),
  });
  if (prepared.blocked) {
    throw new Error(`prepareEminenceDuel bloccato: ${prepared.blocked}`);
  }
  matchState = prepared.matchState;
  {
    const notices = enrichNotices(prepared.notices || []);
    const cueRows = [];
    for (const notice of notices) {
      const cues = cueFromNotice(notice, agentsDeployed);
      for (const cue of cues) {
        cueRows.push({ noticeId: notice.id, ...cue });
        allCues.push(cue);
      }
      if ((notice.payoffs || []).some((p) => EXPECTED_NO_CUE_PRIMITIVES.includes(p.primitive))) {
        segmentsWithoutCue += 1;
      }
    }
    allNotices.push(...notices);
    steps.push({
      kind: 'checkpoint',
      timing: EFFECT_TIMINGS.BEFORE_TRIGGER_CHECK,
      gate: null,
      badge: notices[0]?.badgeText || 'Verifica',
      notices: notices.map(serializeNotice),
      cues: cueRows,
      presence: {
        player: presenceOf(matchState, SIDES.PLAYER),
        enemy: presenceOf(matchState, SIDES.ENEMY),
      },
    });
  }

  // Settle
  const outcome = scenario.outcome || {};
  const settled = settleEminenceRound(matchState, {
    initiativeSide,
    winner: outcome.winner,
    agentIdBySide: agents,
    powerResolvedBySide: outcome.powerResolvedBySide,
    activatedTriggerBySide: outcome.activatedTriggerBySide,
    aliasUsedBySide: outcome.aliasUsedBySide,
    finalPowerBySide: outcome.finalPowerBySide,
    finalPowerByCardId: outcome.finalPowerByCardId,
    finalDamageBySide: outcome.finalDamageBySide,
    activationSatisfiedBySide: outcome.activationSatisfiedBySide,
    focusInvestedBySide: focusInvestedFrom(scenario),
    statReductionOccurred: outcome.statReductionOccurred ?? false,
  });
  matchState = settled.matchState;

  let settleNotices = enrichNotices(settled.notices || []);
  const hpEvents = normalizeHpDeltas(outcome.hpDeltas);
  if (hpEvents.length) {
    const hp = notifyHpLossEvents(matchState, hpEvents, { initiativeSide });
    matchState = hp.matchState;
    settleNotices = enrichNotices([...(settleNotices || []), ...(hp.notices || [])]);
  }

  const settleCues = [];
  for (const notice of settleNotices) {
    const cues = cueFromNotice(notice, agentsDeployed);
    for (const cue of cues) {
      settleCues.push({ noticeId: notice.id, ...cue });
      allCues.push(cue);
    }
    for (const payoff of notice.payoffs || []) {
      if (EXPECTED_NO_CUE_PRIMITIVES.includes(payoff.primitive)) segmentsWithoutCue += 1;
      else if (!cues.length && notice.kind === 'effect') segmentsWithoutCue += 1;
    }
  }
  allNotices.push(...settleNotices);

  // Segmenti catalogo post-duello con valutazione condizioni (informativo)
  const conditionContext = createConditionContext(matchState, {
    winner: outcome.winner ?? null,
    duelWinnerRelative: relativeWinner(outcome.winner, SIDES.PLAYER),
    powerResolved: Boolean(outcome.powerResolvedBySide?.[SIDES.PLAYER]),
    ownPowerResolved: Boolean(outcome.powerResolvedBySide?.[SIDES.PLAYER]),
    ownActivatedTrigger: outcome.activatedTriggerBySide?.[SIDES.PLAYER] ?? null,
    enemyAgentTrigger: scenario.enemy?.agent?.trigger ?? null,
    ownAnchored: Boolean(scenario.player?.agent?.anchored),
    agentIdBySide: agents,
  });

  const segmentReviews = collectCatalogSegments(playerId, abilityId).map((row) => {
    const cond = evaluateCondition(row.segment.condition, conditionContext);
    const primitive = row.segment.primitive || null;
    const expectedNoCue = EXPECTED_NO_CUE_PRIMITIVES.includes(primitive);
    return {
      source: row.source,
      sourceId: row.sourceId,
      sourceName: row.sourceName,
      timing: row.segment.timing || null,
      primitive,
      target: row.segment.target || null,
      condition: cond,
      expectedNoCue,
    };
  });

  steps.push({
    kind: 'settle',
    timing: EFFECT_TIMINGS.AFTER_DUEL_OUTCOME,
    gate: null,
    badge: 'Risoluzione · Dopo il Duello',
    notices: settleNotices.map(serializeNotice),
    cues: settleCues,
    segments: segmentReviews,
    presence: {
      player: presenceOf(matchState, SIDES.PLAYER),
      enemy: presenceOf(matchState, SIDES.ENEMY),
    },
  });

  const presenceEnd = {
    player: presenceOf(matchState, SIDES.PLAYER),
    enemy: presenceOf(matchState, SIDES.ENEMY),
  };
  const fragmentsEnd = {
    player: fragmentCount(matchState, SIDES.PLAYER),
    enemy: fragmentCount(matchState, SIDES.ENEMY),
  };

  // Conta i segmenti catalogo che hanno scattato ma non hanno cue (atteso o no).
  for (const row of segmentReviews) {
    if (row.condition.status === 'true' && row.expectedNoCue) {
      segmentsWithoutCue += 1;
    }
  }

  // Segmenti con notice: confronta payoffs vs notices
  for (const row of segmentReviews) {
    if (row.condition.status === 'true') {
      const hasNotice = allNotices.some(
        (n) => n.name === row.sourceName || (n.payoffs || []).some((p) => p.primitive === row.primitive),
      );
      if (!hasNotice && row.timing && POST_OR_PRE.has(row.timing)) {
        segmentsWithoutNotice += 1;
      }
    }
  }

  return {
    eminence: {
      id: playerId,
      army: eminence.army,
      name: eminence.name,
    },
    ability: {
      id: abilityId,
      name: ability.name,
      presenceDelta: ability.presenceDelta,
      revealGate: ability.revealGate,
      text: ability.text,
    },
    scenario: {
      name: scenario.name,
      roundNumber,
      initiativeSide,
      branch: scenario.branch || null,
    },
    choice: {
      presenceAvailable: presenceStart.player,
      legalAbilities: legalDescribed,
      alwaysLegalOption: alwaysLegal,
      selected: abilityId,
      presenceDelta: ability.presenceDelta,
      presenceAfterReveal,
      presenceAfterSelect,
    },
    steps,
    bilance: {
      presencePlayer: [presenceStart.player, presenceEnd.player],
      presenceEnemy: [presenceStart.enemy, presenceEnd.enemy],
      fragmentsPlayer: [fragmentsStart.player, fragmentsEnd.player],
      noticesEmitted: allNotices.length,
      cinematicCues: allCues.filter((c) => c.flight || c.recipe === CINEMATIC_RECIPES.MISS_DIM || c.recipe === CINEMATIC_RECIPES.PASSIVE_AURA).length,
      segmentsWithoutCue,
      segmentsWithoutNotice,
    },
    notices: allNotices.map(serializeNotice),
  };
}

const POST_OR_PRE = new Set(Object.values(EFFECT_TIMINGS));

function relativeWinner(winner, side) {
  if (winner == null) return null;
  if (winner === 'draw') return 'draw';
  if (winner === side) return 'self';
  return 'opponent';
}

function serializeNotice(notice) {
  return {
    id: notice.id,
    side: notice.side,
    kind: notice.kind,
    name: notice.name,
    text: notice.text,
    phase: notice.phase,
    phaseLabel: notice.phaseLabel,
    phaseDetail: notice.phaseDetail,
    badgeText: notice.badgeText,
    presenceDelta: notice.presenceDelta ?? null,
    outcome: notice.outcome ?? null,
    payoffs: notice.payoffs || [],
    cues: cueFromNotice(notice, { player: true, enemy: true }),
  };
}

export function formatTraceHuman(trace) {
  const lines = [];
  const push = (line = '') => lines.push(line);

  push(`EMINENZA  ${trace.eminence.army} — ${trace.eminence.name}`);
  push(
    `SCENARIO  ${trace.scenario.name} · round ${trace.scenario.roundNumber} · iniziativa: ${INITIATIVE_LABEL[trace.scenario.initiativeSide] || trace.scenario.initiativeSide}`,
  );
  push('');
  push('SCELTA');
  push(`  Presenza disponibile         ${trace.choice.presenceAvailable}`);
  push(
    `  Abilità legali               ${trace.choice.legalAbilities.map((a) => `${a.id} (${formatPresenceDelta(a.presenceDelta)})`).join(', ') || '—'}`,
  );
  push(`  Opzione sempre legale        ${trace.choice.alwaysLegalOption ? 'sì' : 'no'}`);
  push(
    `  Scelta                       ${trace.choice.selected}  (${formatPresenceDelta(trace.choice.presenceDelta)} al reveal)`,
  );
  push(`  Presenza dopo il reveal      ${trace.choice.presenceAfterReveal}`);
  push('');

  for (const step of trace.steps) {
    if (step.kind === 'gate') {
      push(`CHECKPOINT  GATE ${step.gate}`.padEnd(40) + `[badge: ${step.badge}]`);
    } else if (step.timing) {
      push(`CHECKPOINT  ${step.timing}`.padEnd(40) + `[badge: ${step.badge}]`);
    } else {
      push(`CHECKPOINT  ${step.kind}`.padEnd(40) + `[badge: ${step.badge}]`);
    }

    if (!step.notices?.length && !step.segments?.length) {
      push('  · nessun segmento / avviso');
    }

    for (const notice of step.notices || []) {
      push(`  ${SIDE_LABEL[notice.side] || notice.side} · ${notice.name}`);
      push(`      testo        "${notice.text}"`);
      push(`      badge        ${notice.badgeText}`);
      if (notice.payoffs?.length) {
        push(
          `      payoffs      ${notice.payoffs.map((p) => `${p.primitive}${p.slot != null ? ` slot=${p.slot}` : ''}`).join(', ')}`,
        );
      }
      if (!notice.cues?.length) {
        push('      cue          nessuna   ⚠');
      } else {
        for (const cue of notice.cues) {
          if (!cue.flight && cue.recipe) {
            push(`      cue          ${cue.recipe}   (senza volo)`);
          } else {
            push(
              `      cue          ${cue.recipe}   ${describeAnchor(cue.from)} → ${describeAnchor(cue.to)}`,
            );
          }
          push(
            `                   waitFor: ${cue.waitFor ? describeAnchor(cue.waitFor) : '—'}   holdAnnounce: ${cue.holdAnnounce ? 'sì' : 'no'}`,
          );
        }
      }
    }

    if (step.segments?.length) {
      for (const seg of step.segments) {
        if (step.kind !== 'settle') continue;
        if (seg.timing !== EFFECT_TIMINGS.AFTER_DUEL_OUTCOME
          && seg.timing !== EFFECT_TIMINGS.BEFORE_CONQUEST
          && seg.timing !== EFFECT_TIMINGS.POST_BATTLE
          && seg.timing !== EFFECT_TIMINGS.ON_HP_LOSS) {
          continue;
        }
        push(
          `  ${SIDE_LABEL.player} · ${seg.source === 'static' ? 'statico ' : ''}${seg.sourceId} · ${seg.primitive} → ${seg.target || '—'}`,
        );
        if (seg.condition?.detail) {
          push(`      condizione   ${seg.condition.detail}`);
        }
        if (seg.expectedNoCue) {
          push('      cue          nessuna   ⚠  (atteso: lista EXPECTED_NO_CUE_PRIMITIVES)');
        }
      }
    }
    push('');
  }

  push('BILANCIO');
  push(`  Presenza giocatore           ${trace.bilance.presencePlayer[0]} → ${trace.bilance.presencePlayer[1]}`);
  if (trace.bilance.presenceEnemy[0] != null) {
    push(`  Presenza avversario          ${trace.bilance.presenceEnemy[0]} → ${trace.bilance.presenceEnemy[1]}`);
  }
  push(`  Frammenti giocatore          ${trace.bilance.fragmentsPlayer[0]} → ${trace.bilance.fragmentsPlayer[1]}`);
  push(`  Avvisi emessi                ${trace.bilance.noticesEmitted}`);
  push(`  Cue cinematiche              ${trace.bilance.cinematicCues}`);
  push(`  Segmenti senza cue           ${trace.bilance.segmentsWithoutCue}`);
  push(`  Segmenti senza avviso        ${trace.bilance.segmentsWithoutNotice}`);
  push('');

  return `${lines.join('\n')}\n`;
}

// ------------------------------------------------------------------
// Gaps
// ------------------------------------------------------------------

export function findCatalogGaps() {
  const noCuePrimitives = new Set();
  const inertRecharge = [];
  const noAlwaysLegal = [];
  const unknownConditionKeys = [];
  const unknownTimings = [];
  const unknownPrimitives = [];
  const segmentsWithoutNoticeHint = [];

  // Probe primitives via empty notice payoffs
  for (const primitive of Object.values(EMINENCE_PRIMITIVES)) {
    const notice = {
      kind: 'effect',
      side: SIDES.PLAYER,
      phase: 'RESOLVE',
      payoffs: [{ primitive, target: 'SELF', slot: null }],
    };
    const cues = resolveNoticeCinematics(notice, {
      accents: { player: '#fff', enemy: '#fff' },
      agentsDeployed: { player: true, enemy: true },
    });
    if (!cues.length) noCuePrimitives.add(primitive);
  }

  for (const id of IMPLEMENTED_EMINENCE_IDS) {
    const eminence = getEminence(id);
    if (!hasAlwaysLegalOption(id)) noAlwaysLegal.push(id);

    const inspectSegments = (segments, path) => {
      for (const [index, segment] of (segments || []).entries()) {
        if (segment.timing && !KNOWN_TIMINGS.has(segment.timing)) {
          unknownTimings.push(`${path}[${index}].timing=${segment.timing}`);
        }
        if (segment.primitive && !KNOWN_PRIMITIVES.has(segment.primitive)) {
          unknownPrimitives.push(`${path}[${index}].primitive=${segment.primitive}`);
        }
        if (segment.condition) {
          for (const key of Object.keys(segment.condition)) {
            if (!KNOWN_CONDITION_KEYS.has(key)) {
              unknownConditionKeys.push(`${path}[${index}].condition.${key}`);
            }
          }
        }
      }
    };

    if (eminence.static?.segments) inspectSegments(eminence.static.segments, `${id}.static`);
    for (const ability of eminence.abilities || []) {
      inspectSegments(ability.segments, `${id}.${ability.id}`);
      const segs = ability.segments || [];
      if (
        ability.presenceDelta >= 0
        && segs.length > 0
        && segs.every((s) => s.primitive === EMINENCE_PRIMITIVES.CHANGE_PRESENCE)
        && !ability.paramsSchema
      ) {
        inertRecharge.push({ id: ability.id, eminenceId: id, name: ability.name });
      }
    }

    // Statico solo CHANGE_PRESENCE condizionale (es. Khemet)
    const staticSegs = eminence.static?.segments || [];
    if (
      staticSegs.length > 0
      && staticSegs.every((s) => s.primitive === EMINENCE_PRIMITIVES.CHANGE_PRESENCE)
    ) {
      inertRecharge.push({
        id: eminence.static.id,
        eminenceId: id,
        name: eminence.static.name,
        static: true,
      });
    }
  }

  // Also scan non-implemented for orathai_tacet / ratti_sussurro listed in handoff
  for (const id of ['orathai_primo_canto', 'ratti_bella_malelabbra']) {
    const eminence = EMINENCES[id];
    if (!eminence) continue;
    for (const ability of eminence.abilities || []) {
      if (ability.presenceDelta >= 0 && (!ability.segments || ability.segments.every((s) => !s || s.primitive === EMINENCE_PRIMITIVES.CHANGE_PRESENCE || s.primitive == null))) {
        // null segments still count as observation-shaped recharge in catalog text
        if (ability.id === 'orathai_tacet' || ability.id === 'ratti_sussurro') {
          inertRecharge.push({ id: ability.id, eminenceId: id, name: ability.name, unimplemented: true });
        }
      }
    }
  }

  const unexpectedNoCue = [...noCuePrimitives].filter(
    (p) => !EXPECTED_NO_CUE_PRIMITIVES.includes(p),
  );

  const expectedInertIds = [
    'kethran_sacrificio',
    'khemet_devozione',
    'orathai_tacet',
    'ratti_sussurro',
    'figli_leggerezza',
    'khemet_rito_overdrive',
  ];
  const foundInertIds = inertRecharge.map((r) => r.id);
  const missingExpectedInert = expectedInertIds.filter((id) => !foundInertIds.includes(id));

  const mustReportNoCue = [
    EMINENCE_PRIMITIVES.COMPOSE_ABILITY,
    EMINENCE_PRIMITIVES.REGISTER_END_MATCH_DEBT,
    EMINENCE_PRIMITIVES.BLOCK_EMINENCE,
  ];
  const missingNoCueProbe = mustReportNoCue.filter((p) => !noCuePrimitives.has(p));

  const issues = [];
  if (unexpectedNoCue.length) issues.push(`primitive senza cue: ${unexpectedNoCue.join(', ')}`);
  if (noAlwaysLegal.length) issues.push(`senza opzione sempre legale: ${noAlwaysLegal.join(', ')}`);
  if (unknownConditionKeys.length) issues.push(`condition keys ignote: ${unknownConditionKeys.join(', ')}`);
  if (unknownTimings.length) issues.push(`timing ignoti: ${unknownTimings.join(', ')}`);
  if (unknownPrimitives.length) issues.push(`primitive ignote: ${unknownPrimitives.join(', ')}`);
  if (missingExpectedInert.length) issues.push(`ricariche attese non trovate: ${missingExpectedInert.join(', ')}`);
  if (missingNoCueProbe.length) issues.push(`probe cue incompleta: ${missingNoCueProbe.join(', ')}`);

  const hasDocumentedFindings =
    mustReportNoCue.every((p) => noCuePrimitives.has(p))
    && expectedInertIds.every((id) => foundInertIds.includes(id));

  return {
    ok: false, // i casi documentati (inerte / no-cue) restano da chiudere in design
    expectedNoCuePrimitives: [...EXPECTED_NO_CUE_PRIMITIVES],
    primitivesWithoutCue: [...noCuePrimitives].sort(),
    unexpectedNoCue: unexpectedNoCue.sort(),
    inertRecharge,
    noAlwaysLegal,
    unknownConditionKeys,
    unknownTimings,
    unknownPrimitives,
    segmentsWithoutNoticeHint,
    documentedFindingsOk: hasDocumentedFindings && missingNoCueProbe.length === 0,
    issues,
  };
}

export function formatGapsHuman(report) {
  const lines = [];
  lines.push('EMINENCE TRACE — GAPS');
  lines.push('');
  lines.push(`Expected no-cue primitives: ${report.expectedNoCuePrimitives.join(', ')}`);
  lines.push(`Primitives without cue:     ${report.primitivesWithoutCue.join(', ') || '—'}`);
  lines.push(`Unexpected no-cue:          ${report.unexpectedNoCue.join(', ') || '—'}`);
  lines.push('');
  lines.push('Ricariche / sola osservazione:');
  for (const row of report.inertRecharge) {
    lines.push(
      `  - ${row.eminenceId}/${row.id} (${row.name})${row.static ? ' [statico]' : ''}${row.unimplemented ? ' [catalogo non implemented]' : ''}`,
    );
  }
  lines.push('');
  lines.push(`hasAlwaysLegalOption=false: ${report.noAlwaysLegal.join(', ') || '—'}`);
  lines.push(`condition keys ignote:      ${report.unknownConditionKeys.join(', ') || '—'}`);
  lines.push(`timing ignoti:              ${report.unknownTimings.join(', ') || '—'}`);
  lines.push(`primitive ignote:           ${report.unknownPrimitives.join(', ') || '—'}`);
  lines.push('');
  lines.push(`Documented findings OK: ${report.documentedFindingsOk ? 'sì' : 'no'}`);
  if (report.issues.length) {
    lines.push('Issues:');
    for (const issue of report.issues) lines.push(`  · ${issue}`);
  }
  lines.push('');
  return `${lines.join('\n')}\n`;
}

// ------------------------------------------------------------------
// Scaffold
// ------------------------------------------------------------------

export function scaffoldFixtures({ root, force = false } = {}) {
  const dir = FIXTURES_DIR;
  fs.mkdirSync(dir, { recursive: true });
  const written = [];
  const skipped = [];
  const defaults = loadDefaults();

  for (const eminenceId of IMPLEMENTED_EMINENCE_IDS) {
    const eminence = getEminence(eminenceId);
    const entries = [];
    if (eminence.static?.id) {
      entries.push({ kind: 'static', id: eminence.static.id, abilityId: null });
    }
    for (const ability of eminence.abilities || []) {
      entries.push({ kind: 'ability', id: ability.id, abilityId: ability.id });
    }

    for (const entry of entries) {
      for (const branch of entry.kind === 'static' ? ['hit'] : ['hit', 'miss']) {
        const name = entry.kind === 'static'
          ? `${entry.id}_static`
          : `${entry.abilityId}_${branch}`;
        const filePath = path.join(dir, `${name}.json`);
        if (fs.existsSync(filePath) && !force) {
          skipped.push(name);
          continue;
        }

        const abilityId = entry.abilityId || pickAlwaysLegal(eminenceId);
        const ability = getEminenceAbility(eminenceId, abilityId);
        const scenario = deepMerge(defaults, {
          name,
          branch,
          player: {
            eminenceId,
            presence: Math.max(
              eminence.initialPresence ?? 1,
              Math.abs(Math.min(0, ability?.presenceDelta || 0)),
            ),
            abilityId,
            params: suggestParams(ability, branch === 'hit'),
          },
          enemy: { eminenceId: null },
        });

        // Rami esito tipici
        if (branch === 'miss') {
          scenario.outcome = {
            ...defaults.outcome,
            winner: SIDES.PLAYER,
            powerResolvedBySide: { player: false, enemy: false },
            activatedTriggerBySide: { player: null, enemy: null },
            hpDeltas: { player: 0, enemy: 0 },
          };
        }
        if (/sacrificio|cannibalismo/i.test(abilityId) && branch === 'hit') {
          scenario.outcome = { ...scenario.outcome, winner: SIDES.ENEMY };
        }
        if (/devozione/i.test(abilityId)) {
          scenario.outcome = {
            ...scenario.outcome,
            powerResolvedBySide: { player: branch === 'hit', enemy: false },
          };
        }
        if (/leggerezza/i.test(abilityId)) {
          scenario.player.presence = Math.max(scenario.player.presence || 0, 2);
          scenario.player.agent = {
            ...(scenario.player.agent || defaults.player.agent),
            focusInvested: branch === 'hit' ? 1 : 3,
            league: 3,
            anchored: branch !== 'hit',
          };
        }
        if (entry.kind === 'static' && /overdrive|rito/i.test(entry.id)) {
          scenario.outcome = {
            ...scenario.outcome,
            activatedTriggerBySide: { player: 'overdrive', enemy: null },
            powerResolvedBySide: { player: true, enemy: false },
          };
        }

        fs.writeFileSync(filePath, `${JSON.stringify(scenario, null, 2)}\n`, 'utf8');
        written.push(name);
      }
    }
  }

  // Edge cases richiesti
  for (const edge of [
    {
      name: 'edge_pareggio',
      patch: { outcome: { winner: 'draw', powerResolvedBySide: { player: false, enemy: false } } },
      abilityId: 'mascarada_scommessa',
      eminenceId: 'mascarada_organizzatore',
      params: { pronostico: 'draw' },
    },
    {
      name: 'edge_bersaglio_assente',
      patch: { player: { params: null }, outcome: { winner: 'enemy' } },
      abilityId: 'khemet_maledizione_va',
      eminenceId: 'khemet_maledizioni',
      presence: 2,
    },
    {
      name: 'edge_effetto_gia_attivo',
      patch: {
        player: { fragments: [231] },
        outcome: { winner: 'enemy' },
      },
      abilityId: 'kethran_sacrificio',
      eminenceId: 'kethran_altare',
    },
  ]) {
    const filePath = path.join(dir, `${edge.name}.json`);
    if (fs.existsSync(filePath) && !force) {
      skipped.push(edge.name);
      continue;
    }
    const ability = getEminenceAbility(edge.eminenceId, edge.abilityId);
    const scenario = deepMerge(defaults, deepMerge({
      name: edge.name,
      player: {
        eminenceId: edge.eminenceId,
        presence: edge.presence ?? Math.max(2, Math.abs(Math.min(0, ability?.presenceDelta || 0))),
        abilityId: edge.abilityId,
        params: edge.params ?? suggestParams(ability, true),
      },
      enemy: { eminenceId: null },
    }, edge.patch || {}));
    fs.writeFileSync(filePath, `${JSON.stringify(scenario, null, 2)}\n`, 'utf8');
    written.push(edge.name);
  }

  return { written, skipped, dir };
}

function pickAlwaysLegal(eminenceId) {
  const eminence = getEminence(eminenceId);
  const zero = (eminence.abilities || []).find((a) => a.presenceDelta === 0);
  if (zero) return zero.id;
  const gain = (eminence.abilities || []).find((a) => a.presenceDelta > 0);
  return gain?.id || eminence.abilities?.[0]?.id;
}

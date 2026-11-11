// ============================================
// Partite senza interfaccia con le Eminenze (formato Standard)
// ============================================
//
// Ripete la sequenza del gioco con le stesse funzioni pure:
// - Codice/satze.jsx: apertura del round (openEminenceRound + Terraformare), scelta segreta
//   delle abilità, gate di reveal (advanceToNextRevealGate) con le Offerte (resolvePendingDeal),
//   iniziativa imposta (Corteggiamento), chiusura dello Scontro (settleEminenceMatch);
// - src/hooks/useBattle.js: prepareEminenceDuel → computeDuelResolution → settleEminenceRound.
//
// Ordine delle decisioni come nel gioco:
// - FIELD_FIRST: gate PRE_FIELD → Campo → gate PRE_AGENT → Agenti → gate GENERAL → Duello.
//   Chi ha l'iniziativa decide Campo + Agente insieme e tiene l'Agente se resta legale dopo il
//   gate PRE_AGENT (come la decisione riusata da useAI); altrimenti ridecide a Campo fissato.
// - AGENTS_FIRST (Mascarada): gate PRE_AGENT → Agenti → gate PRE_FIELD → Campo → GENERAL.
//   Approssimazione: il Campo è quello deciso insieme all'Agente; chi risponde sceglie
//   l'Agente senza conoscere il Campo.
//
// Differenze note dal gioco: i parametri scelti al reveal per il lato `player` non passano da
// un'interfaccia (le politiche li fissano alla selezione); niente scelta di reclamare la vittoria
// ai turni 3-4 (si reclama sempre, come in headlessMatch).
//
// Politiche Eminenza (una per lato):
// - 'smart': src/game/ai/eminence/aiEminenceChoice.js (IA attuale);
// - 'first': prima abilità legale, Offerte sempre accettate (IA prima dell'11/11/2026).

import { getEminence } from '../../data/eminences.js';
import { EMINENCE_FORMAT, REVEAL_GATES } from '../eminence/eminenceConstants.js';
import { createMatchEminenceState } from '../eminence/eminenceSetup.js';
import { constrainedDeployableCardIds, isEminenceSubsystemEnabled } from '../eminence/eminenceState.js';
import { getNextGate } from '../eminence/eminenceRound.js';
import {
  advanceToNextRevealGate,
  autoCommitEminenceSetup,
  autoResponseForPendingDeal,
  autoSelectFirstLegalAbility,
  isEminenceSetupPending,
  needsEminenceRoundOpen,
  openEminenceRound,
  prepareEminenceDuel,
  resolvePendingDeal,
  settleEminenceMatch,
  settleEminenceRound,
} from '../eminence/eminenceDuelGate.js';
import {
  collectRoundLeagueByCardId,
  consumeHpDeltas,
  isLowestEffectiveLeague,
  powerResolutionFromDuel,
  readCardLeagueDelta,
  readHpDelta,
} from '../eminence/eminenceDuelBinding.js';
import { capturePresenceSnapshot } from '../eminence/presence.js';
import { applyFieldOperations } from '../eminence/fieldOperations.js';
import { resolveRoundInitiative } from '../duel/resolveRoundInitiative.js';
import { mulberry32 } from '../../utils/seededRandom.js';
import {
  chooseAiDealResponse,
  chooseAiEminenceSelection,
  orderSetupPreyCandidates,
} from '../ai/eminence/aiEminenceChoice.js';
import { createHeadlessMatch, resolveHeadlessDeck } from './headlessSetup.js';
import {
  applyRoundOutcome,
  legalFieldIndexes,
  legalFocusRange,
  otherSide,
  resolveHeadlessDuel,
  resolveMatchEnd,
  viewForSide,
} from './headlessMatch.js';

const SIDES = ['player', 'enemy'];

// ------------------------------------------------------------------
// Politiche Eminenza
// ------------------------------------------------------------------

export const EMINENCE_POLICIES = {
  smart: {
    id: 'smart',
    select: (ms, side, { game, paramContext, rng }) => chooseAiEminenceSelection(ms, side, { game, paramContext, rng }),
    respondDeal: (deal, ms, game) => chooseAiDealResponse(deal, ms, game),
    orderPrey: (ids, cards) => orderSetupPreyCandidates(ids, cards),
  },
  first: {
    id: 'first',
    select: (ms, side, { paramContext }) => autoSelectFirstLegalAbility(ms, side, { paramContext }),
    respondDeal: (deal, ms) => autoResponseForPendingDeal(deal, ms),
    orderPrey: (ids) => ids,
  },
};

export function getEminencePolicy(id) {
  const policy = EMINENCE_POLICIES[id];
  if (!policy) throw new Error(`Politica Eminenza sconosciuta: ${id}`);
  return policy;
}

// ------------------------------------------------------------------
// Setup
// ------------------------------------------------------------------

/**
 * Partita Standard: come createHeadlessMatch più lo stato Eminenze dedotto dai mazzi
 * (createMatchEminenceState, come useGameFlow.initEminences).
 */
export function createHeadlessEminenceMatch(options) {
  const state = createHeadlessMatch({ ...options, mode: 'classic' });
  const { matchState } = createMatchEminenceState({
    format: EMINENCE_FORMAT.REQUIRED,
    playerDeck: options.playerDeckCards || resolveHeadlessDeck(options.player),
    enemyDeck: options.enemyDeckCards || resolveHeadlessDeck(options.enemy),
    playerEminenceId: options.playerEminenceId ?? null,
    enemyEminenceId: options.enemyEminenceId ?? null,
  });
  return { ...state, eminenceMatchState: matchState };
}

// ------------------------------------------------------------------
// Utilità di stato
// ------------------------------------------------------------------

function undeployedIds(state, side) {
  const used = new Set(state[`${side}UsedCards`]);
  return state[`${side}Hand`].filter((card) => !used.has(card.id)).map((card) => card.id);
}

/** paramContext dal punto di vista del giocatore, come Codice/satze.jsx. */
function paramContextFor(state, { agents = null } = {}) {
  return {
    ownUndeployedCardIds: undeployedIds(state, 'player'),
    enemyUndeployedCardIds: undeployedIds(state, 'enemy'),
    confirmedAgents: agents
      ? [
        { id: agents.player.id, side: 'player', label: agents.player.name },
        { id: agents.enemy.id, side: 'enemy', label: agents.enemy.name },
      ]
      : [],
    slotCount: state.battlefields.length || 5,
    slots: state.battlefields.map((field, index) => ({
      index,
      conquered: Boolean(state.conqueredFields?.[index]),
      name: field?.name,
      revealed: true,
    })),
  };
}

/** Agenti schierabili dal lato in questo Duello (vincoli Eminenza compresi). */
export function legalAgentCards(state, side, ms) {
  const hand = state[`${side}Hand`];
  const used = state[`${side}UsedCards`];
  const allowed = constrainedDeployableCardIds(ms, side, hand, used);
  if (Array.isArray(allowed)) {
    const set = new Set(allowed);
    const cards = hand.filter((card) => set.has(card.id));
    if (cards.length) return cards;
  }
  return hand.filter((card) => !used.includes(card.id));
}

function mirrorMatchState(ms) {
  if (!ms) return ms;
  return { ...ms, player: ms.enemy, enemy: ms.player };
}

/** Vista per l'agente con i vincoli di schieramento del suo lato. */
function eminenceView(state, side, visible, ms) {
  const view = viewForSide(state, side, visible);
  const hand = state[`${side}Hand`];
  const used = state[`${side}UsedCards`];
  return {
    ...view,
    eminenceMatchState: side === 'enemy' ? ms : mirrorMatchState(ms),
    enemyDeployableCardIds: constrainedDeployableCardIds(ms, side, hand, used),
  };
}

function clampFocus(state, side, focus) {
  const { maxFocus } = legalFocusRange(state, side);
  return Math.max(1, Math.min(Math.max(1, maxFocus), Number(focus) || 1));
}

function sanitizePick(state, side, ms, choice, fixes) {
  const cards = legalAgentCards(state, side, ms);
  let card = cards.find((c) => c.id === choice?.cardId);
  if (!card) {
    card = cards[0];
    fixes.push(`${side}:card`);
  }
  const focus = clampFocus(state, side, choice?.focus);
  return { card, focus };
}

function applyHp(state, hp) {
  if (!hp.player && !hp.enemy) return state;
  return {
    ...state,
    playerHP: Math.max(0, state.playerHP + (hp.player || 0)),
    enemyHP: Math.max(0, state.enemyHP + (hp.enemy || 0)),
  };
}

// ------------------------------------------------------------------
// Gate
// ------------------------------------------------------------------

/**
 * Apre il prossimo gate e risolve le Offerte con le politiche dei destinatari
 * (Codice/satze.jsx, commitEminenceAdvance).
 */
function advanceGate(ctx, { agents = null, focus = null, announceDeployedMarks = false } = {}) {
  const { policies, log } = ctx;
  const initiativeSide = ctx.state.isPlayerFirst ? 'player' : 'enemy';
  const agentsReady = Boolean(agents?.player && agents?.enemy);
  const leagueByCardId = collectRoundLeagueByCardId(ctx.ms);
  const result = advanceToNextRevealGate(ctx.ms, {
    initiativeSide,
    announceDeployedMarks,
    agentIdBySide: { player: agents?.player?.id ?? null, enemy: agents?.enemy?.id ?? null },
    focusInvestedBySide: agentsReady ? { player: focus.player, enemy: focus.enemy } : null,
    leagueBySide: agentsReady
      ? {
        player: (agents.player.league ?? 0) + readCardLeagueDelta(leagueByCardId, agents.player.id),
        enemy: (agents.enemy.league ?? 0) + readCardLeagueDelta(leagueByCardId, agents.enemy.id),
      }
      : null,
    paramContext: paramContextFor(ctx.state, { agents: agentsReady ? agents : null }),
    toxinBySide: { player: ctx.state.playerToxin, enemy: ctx.state.enemyToxin },
    remoteEnemy: false,
  });
  if (result.blocked) throw new Error(`Gate Eminenza bloccato: ${result.blocked}`);
  let ms = result.matchState;
  const hp = { player: readHpDelta(result.bundle, 'player'), enemy: readHpDelta(result.bundle, 'enemy') };
  for (const deal of result.bundle?.pendingDeals || []) {
    const response = policies[deal.recipientSide].respondDeal(deal, ms, ctx.state);
    const resolved = resolvePendingDeal(ms, deal, response, { initiativeSide });
    ms = resolved.matchState;
    hp.player += readHpDelta(resolved.bundle, 'player');
    hp.enemy += readHpDelta(resolved.bundle, 'enemy');
    log.deals.push({
      round: ctx.state.roundNumber,
      owner: deal.ownerSide,
      source: deal.source,
      accepted: response.dealAccepted !== false,
      choice: response.dealChoice ?? null,
    });
  }
  ctx.ms = ms;
  ctx.state = applyHp(ctx.state, hp);
  ctx.committedHp.player += hp.player;
  ctx.committedHp.enemy += hp.enemy;
  // Corteggiamento: iniziativa del round imposta (Codice/satze.jsx, roundInitiativeOverride).
  if (ms.roundInitiativeOverride) ctx.state = { ...ctx.state, isPlayerFirst: ms.roundInitiativeOverride === 'player' };
  return result.gate;
}

function advanceGateIf(ctx, gate, options) {
  if (getNextGate(ctx.ms.gateProgress) !== gate) return null;
  return advanceGate(ctx, options);
}

// ------------------------------------------------------------------
// Turno
// ------------------------------------------------------------------

/**
 * Un turno con le Eminenze.
 * @param {object} state - stato headless con `eminenceMatchState`
 * @param {{ player, enemy }} agents - agenti di gioco (lead/respond)
 * @param {{ player, enemy }} policies - politiche Eminenza
 * @param {{ rng?: () => number }} [options]
 */
export function playHeadlessEminenceRound(state, agents, policies, { rng = Math.random } = {}) {
  const log = { abilities: [], deals: [] };
  const ctx = { state, ms: state.eminenceMatchState, policies, log, committedHp: { player: 0, enemy: 0 } };
  const round = state.roundNumber;

  // 1. Apertura del round (statici di inizio round, Terraformare).
  if (needsEminenceRoundOpen(ctx.ms, round)) {
    const opened = openEminenceRound(ctx.ms, {
      roundNumber: round,
      initiativeSide: ctx.state.isPlayerFirst ? 'player' : 'enemy',
    });
    ctx.ms = opened.matchState;
    if (opened.bundle?.fieldOperations?.length) {
      const seed = ctx.state.battlefields.reduce((h, f, i) => ((h * 31) + (f?.id || 0) + i) >>> 0, (round * 7919) >>> 0);
      const replaced = applyFieldOperations(opened.bundle.fieldOperations, {
        battlefields: ctx.state.battlefields,
        conqueredFields: ctx.state.conqueredFields,
        rng: mulberry32(seed),
      });
      if (replaced.changes.length) ctx.state = { ...ctx.state, battlefields: replaced.battlefields };
    }
  }

  // 2. Scelta segreta: ogni politica vede solo lo stato pubblico.
  for (const side of SIDES) {
    if (!ctx.ms[side]?.eminenceId) continue;
    ctx.ms = policies[side].select(ctx.ms, side, { game: ctx.state, paramContext: paramContextFor(ctx.state), rng });
    const chosen = ctx.ms[side].selectedAbilityId;
    if (chosen) log.abilities.push({ round, side, abilityId: chosen, presence: ctx.ms[side].selectionCheckpointPresence });
  }

  const agentsFirst = ctx.ms.gateProgress?.sequenceName === 'AGENTS_FIRST';
  const fixes = [];
  let leader;
  let follower;
  let fieldIndex;
  let leaderPick;
  let followerPick;

  if (!agentsFirst) {
    // 3a. PRE_FIELD → Campo → PRE_AGENT → Agenti.
    advanceGateIf(ctx, REVEAL_GATES.PRE_FIELD);
    leader = ctx.state.isPlayerFirst ? 'player' : 'enemy';
    follower = otherSide(leader);
    const lead = agents[leader].lead(eminenceView({ ...ctx.state, currentFieldIndex: null }, leader, null, ctx.ms));
    const fields = legalFieldIndexes(ctx.state);
    fieldIndex = fields.includes(lead?.fieldIndex) ? lead.fieldIndex : fields[0];
    if (!fields.includes(lead?.fieldIndex)) fixes.push(`${leader}:field`);
    ctx.state = { ...ctx.state, currentFieldIndex: fieldIndex };
    advanceGateIf(ctx, REVEAL_GATES.PRE_AGENT);
    const stillLegal = legalAgentCards(ctx.state, leader, ctx.ms).some((c) => c.id === lead?.cardId);
    const leadCard = stillLegal ? lead : agents[leader].lead(eminenceView(ctx.state, leader, null, ctx.ms));
    leaderPick = sanitizePick(ctx.state, leader, ctx.ms, leadCard, fixes);
    const resp = agents[follower].respond(eminenceView(ctx.state, follower, leaderPick.card, ctx.ms));
    followerPick = sanitizePick(ctx.state, follower, ctx.ms, resp, fixes);
  } else {
    // 3b. Mascarada: PRE_AGENT → Agenti → PRE_FIELD → Campo.
    advanceGateIf(ctx, REVEAL_GATES.PRE_AGENT);
    leader = ctx.state.isPlayerFirst ? 'player' : 'enemy';
    follower = otherSide(leader);
    const lead = agents[leader].lead(eminenceView({ ...ctx.state, currentFieldIndex: null }, leader, null, ctx.ms));
    leaderPick = sanitizePick(ctx.state, leader, ctx.ms, lead, fixes);
    const resp = agents[follower].respond(
      eminenceView({ ...ctx.state, currentFieldIndex: null }, follower, leaderPick.card, ctx.ms),
    );
    followerPick = sanitizePick(ctx.state, follower, ctx.ms, resp, fixes);
    advanceGateIf(ctx, REVEAL_GATES.PRE_FIELD);
    const fields = legalFieldIndexes(ctx.state);
    fieldIndex = fields.includes(lead?.fieldIndex) ? lead.fieldIndex : fields[0];
    ctx.state = { ...ctx.state, currentFieldIndex: fieldIndex };
  }

  const pick = { [leader]: leaderPick, [follower]: followerPick };
  const pAgent = pick.player.card;
  const eAgent = pick.enemy.card;
  const focus = { player: pick.player.focus, enemy: pick.enemy.focus };
  const agentsBySide = { player: pAgent, enemy: eAgent };

  // 4. Gate GENERAL con gli Agenti noti.
  advanceGateIf(ctx, REVEAL_GATES.GENERAL, { agents: agentsBySide, focus, announceDeployedMarks: true });

  // 5. Duello (src/hooks/useBattle.js).
  const s = ctx.state;
  const initiativeSide = s.isPlayerFirst ? 'player' : 'enemy';
  const leagueByCardId = collectRoundLeagueByCardId(ctx.ms);
  const remaining = (side) => s[`${side}Hand`].filter((card) => !s[`${side}UsedCards`].includes(card.id));
  const prepared = prepareEminenceDuel(ctx.ms, {
    initiativeSide,
    agentIdBySide: { player: pAgent.id, enemy: eAgent.id },
    currentFieldIndex: fieldIndex,
    focusInvestedBySide: focus,
    leagueBySide: {
      player: (pAgent.league ?? 0) + readCardLeagueDelta(leagueByCardId, pAgent.id),
      enemy: (eAgent.league ?? 0) + readCardLeagueDelta(leagueByCardId, eAgent.id),
    },
    deployedIsLowestLeagueBySide: {
      player: isLowestEffectiveLeague(pAgent, remaining('player'), leagueByCardId),
      enemy: isLowestEffectiveLeague(eAgent, remaining('enemy'), leagueByCardId),
    },
    toxinBySide: { player: s.playerToxin, enemy: s.enemyToxin },
    remoteEnemy: false,
    paramContext: {
      ownUndeployedCardIds: remaining('player').filter((c) => c.id !== pAgent.id).map((c) => c.id),
      enemyUndeployedCardIds: remaining('enemy').filter((c) => c.id !== eAgent.id).map((c) => c.id),
      confirmedAgents: [
        { id: pAgent.id, side: 'player', label: pAgent.name },
        { id: eAgent.id, side: 'enemy', label: eAgent.name },
      ],
      slotCount: s.battlefields.length || 5,
    },
  });
  if (prepared.blocked) throw new Error(`Duello Eminenza bloccato: ${prepared.blocked}`);
  const active = isEminenceSubsystemEnabled(prepared.matchState);
  const battleResult = resolveHeadlessDuel(s, fieldIndex, pick.player, pick.enemy, {
    eminenceBundle: consumeHpDeltas(prepared.bundle, ctx.committedHp),
    presenceSnapshot: active ? capturePresenceSnapshot(prepared.matchState) : null,
    playerHasEminence: Boolean(prepared.matchState?.player?.eminenceId),
    enemyHasEminence: Boolean(prepared.matchState?.enemy?.eminenceId),
  });

  let ms = prepared.matchState;
  let result = battleResult;
  if (active) {
    const settled = settleEminenceRound(prepared.matchState, {
      initiativeSide,
      winner: battleResult.winner,
      agentIdBySide: { player: pAgent.id, enemy: eAgent.id },
      aliasUsedBySide: battleResult.aliasUsedBySide,
      finalPowerByCardId: { [pAgent.id]: battleResult.playerPower, [eAgent.id]: battleResult.enemyPower },
      finalPowerBySide: { player: battleResult.playerPower, enemy: battleResult.enemyPower },
      finalDamageBySide: { player: battleResult.playerDamage, enemy: battleResult.enemyDamage },
      activationSatisfiedBySide: {
        player: battleResult.playerActivationSatisfied,
        enemy: battleResult.enemyActivationSatisfied,
      },
      focusInvestedBySide: focus,
      statReductionOccurred: Boolean(battleResult.statReductionOccurred),
      ...powerResolutionFromDuel({ battleResult, playerAgent: pAgent, enemyAgent: eAgent }),
    });
    ms = settled.matchState;
    result = {
      ...battleResult,
      finalPlayerHP: Math.max(0, battleResult.finalPlayerHP + readHpDelta(settled.bundle, 'player')),
      finalEnemyHP: Math.max(0, battleResult.finalEnemyHP + readHpDelta(settled.bundle, 'enemy')),
    };
  }

  // 6. Esito del turno. Un Agente riusato (Vendetta) è già fra le carte usate.
  const after = applyRoundOutcome(s, result, fieldIndex, pAgent, eAgent);
  const dedup = (ids) => [...new Set(ids)];
  const next = {
    ...after,
    playerUsedCards: dedup(after.playerUsedCards),
    enemyUsedCards: dedup(after.enemyUsedCards),
    eminenceMatchState: ms,
  };
  const record = {
    round,
    leader,
    fieldIndex,
    fieldId: s.battlefields[fieldIndex]?.id ?? null,
    player: { cardId: pAgent.id, focus: focus.player },
    enemy: { cardId: eAgent.id, focus: focus.enemy },
    winner: battleResult.winner,
    power: { player: battleResult.playerPower, enemy: battleResult.enemyPower },
    fixes,
    hpAfter: { player: next.playerHP, enemy: next.enemyHP },
    presenceAfter: { player: ms?.player?.presence ?? null, enemy: ms?.enemy?.presence ?? null },
    ...log,
  };
  return { state: next, record };
}

/** Chiusura dello Scontro come Codice/satze.jsx: Registro e altri debiti di fine Scontro. */
function closeMatch(state, lastRecord) {
  const ms = state.eminenceMatchState;
  if (!isEminenceSubsystemEnabled(ms)) return state;
  const settled = settleEminenceMatch(ms, {
    finalPowerByCardId: lastRecord
      ? { [lastRecord.player.cardId]: lastRecord.power.player, [lastRecord.enemy.cardId]: lastRecord.power.enemy }
      : null,
    finalPowerBySide: lastRecord ? { ...lastRecord.power } : null,
    agentIdBySide: lastRecord
      ? { player: lastRecord.player.cardId, enemy: lastRecord.enemy.cardId }
      : null,
  });
  return {
    ...applyHp(state, {
      player: readHpDelta(settled.bundle, 'player'),
      enemy: readHpDelta(settled.bundle, 'enemy'),
    }),
    eminenceMatchState: settled.matchState,
  };
}

/** Preda iniziale e altre scelte di setup (Codice/satze.jsx, autoCommitEminenceSetup). */
function commitSetup(state, policies) {
  let ms = state.eminenceMatchState;
  for (const side of SIDES) {
    if (!isEminenceSetupPending(ms, side)) continue;
    const opp = otherSide(side);
    const ids = policies[side].orderPrey(undeployedIds(state, opp), state[`${opp}Hand`]);
    ms = autoCommitEminenceSetup(ms, side, ids);
  }
  return { ...state, eminenceMatchState: ms };
}

/**
 * Partita intera con le Eminenze.
 * @param {object} initialState - da createHeadlessEminenceMatch
 * @param {{ player, enemy }} agents
 * @param {{ player: string|object, enemy: string|object }} policies - 'smart' | 'first' o oggetti
 */
export function playHeadlessEminenceMatch(initialState, agents, policies, { maxRounds = 12, rng = Math.random } = {}) {
  const resolved = {
    player: typeof policies.player === 'string' ? getEminencePolicy(policies.player) : policies.player,
    enemy: typeof policies.enemy === 'string' ? getEminencePolicy(policies.enemy) : policies.enemy,
  };
  let state = commitSetup(initialState, resolved);
  const rounds = [];
  for (let guard = 0; guard < maxRounds; guard += 1) {
    const { state: after, record } = playHeadlessEminenceRound(state, agents, resolved, { rng });
    rounds.push(record);
    let end = resolveMatchEnd(after, state.roundNumber);
    let closed = after;
    if (end) {
      closed = closeMatch(after, record);
      end = resolveMatchEnd(closed, state.roundNumber) || end;
    }
    if (end) {
      return {
        ...end,
        rounds,
        finalState: { ...closed, currentFieldIndex: null },
        eminences: {
          player: getEminence(initialState.eminenceMatchState?.player?.eminenceId)?.id ?? null,
          enemy: getEminence(initialState.eminenceMatchState?.enemy?.eminenceId)?.id ?? null,
        },
      };
    }
    const nextRound = state.roundNumber + 1;
    state = {
      ...after,
      roundNumber: nextRound,
      isPlayerFirst: resolveRoundInitiative({
        roundNumber: nextRound,
        openingPlayerFirst: after.openingPlayerFirst,
        initiativeProfile: null,
      }),
      currentFieldIndex: null,
      selectedAgent: null,
      enemyAgent: null,
    };
  }
  throw new Error(`Partita con Eminenze oltre ${maxRounds} turni (seed ${initialState.seed})`);
}


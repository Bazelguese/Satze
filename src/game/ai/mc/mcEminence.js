// ============================================
// Motore a simulazione: Eminenze nel primo Duello delle simulazioni
// ============================================
//
// Nel Duello che l'IA sta decidendo, ogni simulazione risolve le Eminenze con le stesse funzioni
// del gioco (gate rimasti, prepareEminenceDuel → computeDuelResolution → settleEminenceRound).
// I Duelli successivi della simulazione restano senza Eminenze.
//
// Informazione nascosta: la scelta segreta dell'avversario, finché non è rivelata, non si legge
// (sanitizeEminenceForAi la toglie). In ogni simulazione se ne estrae una fra le sue abilità
// legali, con pesi dati dalla valutazione dell'IA (aiEminenceChoice.js) vista dal suo lato.

import { mulberry32 } from '../../../utils/seededRandom.js';
import { isEminenceSubsystemEnabled } from '../../eminence/eminenceState.js';
import { getNextGate, selectEminenceAbility } from '../../eminence/eminenceRound.js';
import {
  advanceToNextRevealGate,
  prepareEminenceDuel,
  resolvePendingDeal,
  settleEminenceRound,
} from '../../eminence/eminenceDuelGate.js';
import {
  collectRoundLeagueByCardId,
  consumeHpDeltas,
  isLowestEffectiveLeague,
  powerResolutionFromDuel,
  readCardLeagueDelta,
  readHpDelta,
} from '../../eminence/eminenceDuelBinding.js';
import { capturePresenceSnapshot } from '../../eminence/presence.js';
import { resolveHeadlessDuel } from '../../sim/headlessMatch.js';
import { chooseAiDealResponse, rankAiEminenceAbilities } from '../eminence/aiEminenceChoice.js';

/** Temperatura della stima sulla scelta segreta dell'avversario (in FC). */
const OPPONENT_CHOICE_TEMPERATURE = 0.5;

/**
 * Stato Eminenze visto dall'IA (lato `side`): la scelta dell'avversario non ancora rivelata
 * sparisce, con i dati che la tradirebbero (parametri, costo prenotato).
 */
export function sanitizeEminenceForAi(matchState, side = 'enemy') {
  if (!isEminenceSubsystemEnabled(matchState)) return null;
  const opp = side === 'enemy' ? 'player' : 'enemy';
  const state = matchState[opp];
  if (!state || state.revealedAbilityId || !state.selectedAbilityId) return matchState;
  return {
    ...matchState,
    [opp]: {
      ...state,
      selectedAbilityId: null,
      selectedParams: null,
      selectionSnapshotPresence: state.selectionCheckpointPresence ?? state.presence ?? 0,
      committedPresenceCost: 0,
    },
  };
}

function undeployedIds(state, side) {
  const used = new Set(state[`${side}UsedCards`] || []);
  return (state[`${side}Hand`] || []).filter((card) => !used.has(card.id)).map((card) => card.id);
}

/** paramContext dal punto di vista del lato `player` (come Codice/satze.jsx). */
function paramContextFor(state, agents = null) {
  return {
    ownUndeployedCardIds: undeployedIds(state, 'player'),
    enemyUndeployedCardIds: undeployedIds(state, 'enemy'),
    confirmedAgents: agents
      ? [
        { id: agents.player.id, side: 'player', label: agents.player.name },
        { id: agents.enemy.id, side: 'enemy', label: agents.enemy.name },
      ]
      : [],
    slotCount: (state.battlefields || []).length || 5,
    slots: (state.battlefields || []).map((field, index) => ({
      index,
      conquered: Boolean(state.conqueredFields?.[index]),
      name: field?.name,
      revealed: true,
    })),
  };
}

/**
 * Contesto per le simulazioni di una decisione, oppure null se non ci sono Eminenze.
 * @param {object} view - vista dell'IA (lato `enemy`) con `eminenceMatchState`
 */
export function createEminenceRolloutContext(view) {
  const ms = sanitizeEminenceForAi(view?.eminenceMatchState, 'enemy');
  if (!ms) return null;
  const opp = ms.player;
  let choices = [];
  if (opp?.eminenceId && !opp.selectedAbilityId && !opp.revealedAbilityId && !opp.blockedThisRound) {
    const ranking = rankAiEminenceAbilities(ms, 'player', {
      game: view,
      paramContext: paramContextFor(view),
      rng: () => 0.5,
    });
    if (ranking.length) {
      const best = ranking[0].q;
      const weights = ranking.map((r) => Math.exp((r.q - best) / OPPONENT_CHOICE_TEMPERATURE));
      const total = weights.reduce((a, b) => a + b, 0);
      choices = ranking.map((r, i) => ({ abilityId: r.abilityId, params: r.params, weight: weights[i] / total }));
    }
  }
  return { ms, choices };
}

function sampleChoice(choices, rng) {
  let x = rng();
  for (const choice of choices) {
    x -= choice.weight;
    if (x <= 0) return choice;
  }
  return choices[choices.length - 1] || null;
}

function addHp(target, bundle) {
  target.player += readHpDelta(bundle, 'player');
  target.enemy += readHpDelta(bundle, 'enemy');
}

/**
 * Risolutore del Duello per una simulazione: il primo Duello con le Eminenze, gli altri senza.
 * @param {object} ctx - da createEminenceRolloutContext
 * @param {number} seed - seme della simulazione (si usa un flusso separato dalle politiche)
 */
export function createEminenceDuelResolver(ctx, seed) {
  let first = true;
  return (state, fieldIndex, playerPick, enemyPick) => {
    if (!first) return resolveHeadlessDuel(state, fieldIndex, playerPick, enemyPick);
    first = false;
    try {
      return resolveWithEminences(ctx, state, fieldIndex, playerPick, enemyPick, mulberry32((seed ^ 0x9e3779b9) >>> 0));
    } catch {
      // Uno stato Eminenze che la simulazione non sa portare avanti: Duello senza Eminenze.
      return resolveHeadlessDuel(state, fieldIndex, playerPick, enemyPick);
    }
  };
}

function resolveWithEminences(ctx, state, fieldIndex, playerPick, enemyPick, rng) {
  let ms = ctx.ms;
  if (ctx.choices.length) {
    const choice = sampleChoice(ctx.choices, rng);
    const attempt = selectEminenceAbility(ms, 'player', choice.abilityId, choice.params);
    if (attempt.ok) ms = attempt.matchState;
  }
  const pAgent = playerPick.card;
  const eAgent = enemyPick.card;
  const agents = { player: pAgent, enemy: eAgent };
  const focus = { player: playerPick.focus, enemy: enemyPick.focus };
  const initiativeSide = state.isPlayerFirst ? 'player' : 'enemy';
  const leagueByCardId = collectRoundLeagueByCardId(ms);
  const leagueBySide = {
    player: (pAgent.league ?? 0) + readCardLeagueDelta(leagueByCardId, pAgent.id),
    enemy: (eAgent.league ?? 0) + readCardLeagueDelta(leagueByCardId, eAgent.id),
  };
  const toxinBySide = { player: state.playerToxin, enemy: state.enemyToxin };

  // Gate non ancora aperti (in gioco si aprono prima del Duello).
  const revealHp = { player: 0, enemy: 0 };
  for (let guard = 0; guard < 4 && getNextGate(ms.gateProgress); guard += 1) {
    const res = advanceToNextRevealGate(ms, {
      initiativeSide,
      agentIdBySide: { player: pAgent.id, enemy: eAgent.id },
      focusInvestedBySide: focus,
      leagueBySide,
      paramContext: paramContextFor(state, agents),
      toxinBySide,
      remoteEnemy: false,
    });
    if (res.blocked) break;
    ms = res.matchState;
    addHp(revealHp, res.bundle);
    for (const deal of res.bundle?.pendingDeals || []) {
      const resolved = resolvePendingDeal(ms, deal, chooseAiDealResponse(deal, ms, state), { initiativeSide });
      ms = resolved.matchState;
      addHp(revealHp, resolved.bundle);
    }
  }
  const s = {
    ...state,
    playerHP: Math.max(0, state.playerHP + revealHp.player),
    enemyHP: Math.max(0, state.enemyHP + revealHp.enemy),
  };

  const remaining = (side) => (s[`${side}Hand`] || []).filter((card) => !(s[`${side}UsedCards`] || []).includes(card.id));
  const prepared = prepareEminenceDuel(ms, {
    initiativeSide,
    agentIdBySide: { player: pAgent.id, enemy: eAgent.id },
    currentFieldIndex: fieldIndex,
    focusInvestedBySide: focus,
    leagueBySide,
    deployedIsLowestLeagueBySide: {
      player: isLowestEffectiveLeague(pAgent, remaining('player'), leagueByCardId),
      enemy: isLowestEffectiveLeague(eAgent, remaining('enemy'), leagueByCardId),
    },
    toxinBySide,
    remoteEnemy: false,
    paramContext: {
      ...paramContextFor(s, agents),
      ownUndeployedCardIds: remaining('player').filter((c) => c.id !== pAgent.id).map((c) => c.id),
      enemyUndeployedCardIds: remaining('enemy').filter((c) => c.id !== eAgent.id).map((c) => c.id),
    },
  });
  if (prepared.blocked) return resolveHeadlessDuel(s, fieldIndex, playerPick, enemyPick);

  const battleResult = resolveHeadlessDuel(s, fieldIndex, playerPick, enemyPick, {
    eminenceBundle: consumeHpDeltas(prepared.bundle, revealHp),
    presenceSnapshot: capturePresenceSnapshot(prepared.matchState),
    playerHasEminence: Boolean(prepared.matchState?.player?.eminenceId),
    enemyHasEminence: Boolean(prepared.matchState?.enemy?.eminenceId),
  });
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
  return {
    ...battleResult,
    finalPlayerHP: Math.max(0, battleResult.finalPlayerHP + readHpDelta(settled.bundle, 'player')),
    finalEnemyHP: Math.max(0, battleResult.finalEnemyHP + readHpDelta(settled.bundle, 'enemy')),
  };
}

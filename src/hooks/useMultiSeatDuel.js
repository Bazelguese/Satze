// ============================================================
// useMultiSeatDuel — 2v2 e Re della collina dentro la scena del duello
// ============================================================
// L'orchestratore puro (src/game/teamDuel, src/game/kingOfHill) decide le regole. Questo
// controllore:
//  - prepara i posti dopo la distribuzione delle carte del giocatore;
//  - guida le scelte delle IA con brevi pause;
//  - proietta ogni scontro nello stato 1v1 della scena (lato player = giocatore umano o la
//    sua squadra), così la presentazione cinematica resta quella del duello;
//  - riprende il controllo quando la scena passerebbe al turno successivo.
//
// La scena (Codice/satze.jsx) espone le proprie azioni tramite `sceneRef.current`.
// ============================================================

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ALL_BATTLEFIELDS } from '../data/battlefields.js';
import { selectBattlefields } from '../game/fieldLogic.js';
import { battleOutcomeKey } from '../game/duel/duelHelpers.js';
import { createRng, createSeat, legalFocusRange } from '../game/multiSeat/multiSeatCore.js';
import { getSeatAIProfile, investmentForLevel, npcSeatNames, profileForDifficulty } from '../game/multiSeat/seatAI.js';
import { pickAiArmyDeck } from '../game/multiSeat/seatSetup.js';
import { kothScontri, scontroTransition, teamScontri, waitingAgents } from '../game/multiSeat/scontroQueue.js';
import {
  PAIRINGS,
  TEAM_DUEL_CONFIG,
  TEAM_DUEL_PHASES,
  advanceAfterRound,
  buildFronts,
  legalFieldIndexes as legalFieldIndexesTeam,
  createTeamDuelMatch,
  getSeat as getTeamSeat,
  resolveClaim as resolveTeamClaim,
  respondingTeam,
  submitOpeningDeploy,
  submitResponseDeploy,
  teamFieldCount,
} from '../game/teamDuel/teamDuel.js';
import {
  aiOpeningDeploy,
  aiResponseDeploy,
  aiResponseInvestment,
  aiResponsePlan,
  suggestPairing,
} from '../game/teamDuel/teamDuelAI.js';
import {
  KOTH_CONFIG,
  KOTH_PHASES,
  advanceAfterContest,
  contestOrder,
  createKothMatch,
  currentCommitter,
  getSeat as getKothSeat,
  openerSeatId,
  resolveClaim as resolveKothClaim,
  seatFieldCount,
  submitCommit,
} from '../game/kingOfHill/kingOfHill.js';
import { aiCommit } from '../game/kingOfHill/kingOfHillAI.js';

function pickHandAgain(extra, rng) {
  const cards = [...(extra.deckCards || [])];
  for (let i = cards.length - 1; i > 0; i -= 1) {
    const j = Math.floor((rng ? rng() : Math.random()) * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards.slice(0, 5);
}

export const MULTI_SEAT_KINDS = {
  TEAM: 'teamDuel',
  KOTH: 'kingOfHill',
};

const HUMAN_TEAM_SEAT = 'A1';
const HUMAN_KOTH_SEAT = 'P1';
const AI_STEP_MS = 650;
/**
 * Tempi di riflessione delle IA (ms): [base, variazione casuale], per tipo di decisione.
 * Ogni preset ha il suo passo: l'Assaltatore decide in fretta, il Calcolatore ci pensa.
 */
const THINK_TIMES = {
  opening: [1900, 1500], // scegliere Agente, Campo e FC in apertura
  response: [2400, 1800], // rispondere: Agenti, FC e disposizione
  proposal: [1400, 1100], // il compagno propone carta e FC
  commit: [1500, 1200], // Re della collina: Agente, FC (e Campo)
};
const THINK_PACE = { aggressivo: 0.7, casuale: 0.8, equilibrato: 1, prudente: 1.15, calcolatore: 1.35 };
const THINK_TASK = {
  opening: 'sceglie Agente, Campo e FC',
  response: 'studia le vostre carte',
  proposal: 'sceglie carta e FC',
  commit: 'sceglie Agente e FC',
};
/** Pausa dopo che tutti hanno deciso, prima di mostrare il risultato. */
const THINK_SETTLE_MS = 450;
/** Momento della rivelazione del piano prima del primo duello (2v2). */
const REVEAL_PAUSE_MS = 900;

function thinkMs(rng, profileId, kind) {
  const [base, extra] = THINK_TIMES[kind] || THINK_TIMES.response;
  return Math.round((base + rng() * extra) * (THINK_PACE[profileId] ?? 1));
}

/** Frase del compagno sulla carta scelta, secondo il suo stile. */
function mateCardLine(profileId, cardName) {
  switch (profileId) {
    case 'aggressivo': return `Parto forte: gioco ${cardName}.`;
    case 'prudente': return `Tengo le carte migliori per dopo: per ora ${cardName}.`;
    case 'calcolatore': return `Ho fatto i conti: ${cardName} è la mossa giusta.`;
    case 'casuale': return `Vado con ${cardName}!`;
    default: return `${cardName} mi sembra la scelta giusta adesso.`;
  }
}

function mateInvestLine(seat, value) {
  const remaining = Math.max(1, seat.hand.filter((c) => !seat.usedCardIds.includes(c.id)).length);
  const base = seat.focus / remaining;
  if (value <= base * 0.7) return `Investo poco (${value} FC): risparmio per dopo.`;
  if (value >= base * 1.4) return `Ci metto tanto (${value} FC): questo fronte conta.`;
  return `Investimento nella media: ${value} FC.`;
}
/** Stadi del controllore (cosa sta facendo la scena). */
export const MULTI_SEAT_STAGES = {
  PENDING: 'pending', // in attesa della distribuzione delle carte del giocatore
  HUMAN_DEPLOY: 'humanDeploy', // il giocatore sceglie Campo/Agente/FC con i comandi del duello
  AI_TURN: 'aiTurn', // le IA stanno scegliendo
  PRESENTING: 'presenting', // uno scontro è in scena
  CLAIM: 'claim', // reclamo della vittoria ai turni 3–4
  OVER: 'over',
};

function seatOf(session, seatId) {
  if (!session?.match) return null;
  return session.kind === MULTI_SEAT_KINDS.TEAM ? getTeamSeat(session.match, seatId) : getKothSeat(session.match, seatId);
}

/** Esiti delle carte già giocate dai due posti proiettati, per i segni in mano. */
function outcomesFor(session, playerSeatId, enemySeatId) {
  const out = {};
  const mark = (side, seatId, cardId, won) => {
    if (seatId && cardId != null) out[battleOutcomeKey(side, cardId)] = won ? 'winner' : 'loser';
  };
  const sideOf = (seatId) => (seatId === playerSeatId ? 'player' : seatId === enemySeatId ? 'enemy' : null);
  for (const entry of session.match.history || []) {
    const scontri = session.kind === MULTI_SEAT_KINDS.TEAM ? entry.fronts : entry.fights;
    for (const s of scontri || []) {
      for (const [seatId, cardId] of [[s.firstSeatId, s.firstCardId], [s.secondSeatId, s.secondCardId]]) {
        const side = sideOf(seatId);
        if (side) mark(side, seatId, cardId, s.winnerSeatId === seatId);
      }
    }
  }
  return out;
}

/** Campi conquistati visti dalla scena: proprietario del lato player → 'player'. */
function projectConquered(conquered, ownerSide) {
  const out = {};
  for (const [idx, entry] of Object.entries(conquered || {})) {
    if (!entry || entry.owner == null) {
      out[idx] = { winner: null, destroyed: true };
      continue;
    }
    out[idx] = { winner: ownerSide(entry.owner), army: entry.army ?? null };
  }
  return out;
}

/**
 * Tavolo a quattro carte del 2v2 prima dei duelli: per lato, il posto principale (quello
 * proiettato nella scena) e il compagno. La carta del giocatore umano mentre schiera la
 * fornisce la scena (è ancora solo una scelta locale).
 */
/**
 * Coda degli scontri del turno mentre se ne presenta uno: chi aspetta dietro (sfocato) per
 * lato, se c'è un altro scontro e come si passa al successivo.
 */
function presentQueue(session) {
  const i = session.presentIndex;
  if (session.stage !== MULTI_SEAT_STAGES.PRESENTING || i == null || i < 0 || !session.match) return null;
  const isTeam = session.kind === MULTI_SEAT_KINDS.TEAM;
  const scontri = isTeam ? teamScontri(session.match.roundResult) : kothScontri(session.match.contestResult);
  const before = isTeam ? session.roundStartMatch : session.contestStartMatch;
  if (!before || i >= scontri.length) return null;
  const withCard = (e) => {
    const seat = before.seats.find((x) => x.id === e.seatId);
    return { ...e, name: seat?.name || null, agent: seat?.hand.find((c) => c.id === e.cardId) || null };
  };
  const w = waitingAgents(scontri, i);
  return {
    index: i,
    total: scontri.length,
    hasNext: i + 1 < scontri.length,
    waiting: {
      player: w.player.map(withCard).filter((e) => e.agent),
      enemy: w.enemy.map(withCard).filter((e) => e.agent),
    },
    transition: scontroTransition(scontri, i),
  };
}

function teamBoard(session) {
  const match = session?.match;
  if (!match || session.kind !== MULTI_SEAT_KINDS.TEAM) return null;
  const active = [MULTI_SEAT_STAGES.HUMAN_DEPLOY, MULTI_SEAT_STAGES.AI_TURN].includes(session.stage);
  if (!active) return null;
  const entry = (seatId) => {
    const seat = getTeamSeat(match, seatId);
    const deployed = match.deployments[seatId];
    const proposal = seatId === 'A2' && !deployed ? session.teammateProposal : null;
    const cardId = deployed?.cardId ?? proposal?.cardId ?? null;
    return {
      seatId,
      name: seat.name,
      isHuman: seat.isHuman,
      card: cardId != null ? seat.hand.find((c) => c.id === cardId) || null : null,
      fieldIndex: deployed?.fieldIndex ?? proposal?.fieldIndex ?? null,
      locked: Boolean(deployed),
      proposal: Boolean(proposal),
    };
  };
  return {
    openingTeam: match.openingTeam,
    player: [entry('A1'), entry('A2')],
    enemy: [entry('B1'), entry('B2')],
  };
}

function mapTeamResult(match) {
  const r = match.result;
  const winner = r.winner === 'A' ? 'player' : r.winner === 'B' ? 'enemy' : 'draw';
  return { winner, reason: r.reason, playerFields: r.fields.A, enemyFields: r.fields.B, multiSeat: { kind: MULTI_SEAT_KINDS.TEAM, ...r } };
}

function mapKothResult(match, humanEliminated = false) {
  const r = match.result;
  const others = match.seats.filter((s) => s.id !== HUMAN_KOTH_SEAT);
  let winner = 'enemy';
  if (!humanEliminated && r?.winners?.includes(HUMAN_KOTH_SEAT)) winner = r.winners.length === 1 ? 'player' : 'draw';
  if (r?.draw) winner = 'draw';
  return {
    winner,
    reason: humanEliminated ? 'hp' : r?.reason === 'shared' ? 'draw' : r?.reason,
    playerFields: seatFieldCount(match, HUMAN_KOTH_SEAT),
    enemyFields: Math.max(0, ...others.map((s) => seatFieldCount(match, s.id))),
    multiSeat: { kind: MULTI_SEAT_KINDS.KOTH, ...(r || {}), humanEliminated },
  };
}

/**
 * @param {object} p
 * @param {object} p.gameState - stato del duello (useGameState)
 * @param {{ current: object }} p.sceneRef - azioni della scena (vedi Codice/satze.jsx)
 */
export function useMultiSeatDuel({ gameState, sceneRef }) {
  const [session, setSession] = useState(null);
  const sessionRef = useRef(null);
  const rngRef = useRef(null);
  const timersRef = useRef([]);

  const commit = useCallback((next) => {
    sessionRef.current = next;
    setSession(next);
  }, []);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  const later = useCallback((fn, ms = AI_STEP_MS) => {
    const t = setTimeout(() => {
      timersRef.current = timersRef.current.filter((x) => x !== t);
      fn();
    }, ms);
    timersRef.current.push(t);
  }, []);

  /**
   * Fa «pensare» alcuni posti IA: ciascuno con il proprio tempo, lo stato è visibile nel
   * Tavolo; quando hanno deciso tutti si chiama onDone con la sessione corrente.
   * Le decisioni vere restano quelle dell'orchestratore: qui cambia solo il ritmo.
   */
  const think = useCallback((seatIds, kind, onDone) => {
    const start = sessionRef.current;
    if (!start) return;
    const rng = rngRef.current || Math.random;
    const round = start.match?.roundNumber;
    const alive = () => {
      const cur = sessionRef.current;
      return cur && cur.stage !== MULTI_SEAT_STAGES.OVER && cur.match?.roundNumber === round && cur.thinking?.[kind];
    };
    const seats = Object.fromEntries(seatIds.map((id) => [id, { status: 'thinking', task: THINK_TASK[kind] }]));
    commit({ ...start, thinking: { ...(start.thinking || {}), [kind]: seats } });
    let remaining = seatIds.length;
    for (const id of seatIds) {
      const ms = thinkMs(rng, seatOf(start, id)?.aiProfile, kind);
      later(() => {
        if (!alive()) return;
        const cur = sessionRef.current;
        commit({ ...cur, thinking: { ...cur.thinking, [kind]: { ...cur.thinking[kind], [id]: { status: 'ready', task: 'pronto' } } } });
        remaining -= 1;
        if (remaining > 0) return;
        later(() => {
          if (!alive()) return;
          const c2 = sessionRef.current;
          const th = { ...c2.thinking };
          delete th[kind];
          commit({ ...c2, thinking: th });
          onDone(sessionRef.current);
        }, THINK_SETTLE_MS);
      }, ms);
    }
  }, [commit, later]);

  const log = useCallback((line) => {
    gameState.setLogs?.((prev) => [...prev.slice(-200), line]);
  }, [gameState]);

  // ------------------------------------------------------------------
  // Proiezione di una coppia di posti nello stato 1v1 della scena
  // ------------------------------------------------------------------
  const project = useCallback((s, { playerSeatId, enemySeatId, playerHP, enemyHP, isPlayerFirst, conquered = null, keepDuel = false }) => {
    const gs = gameState;
    const match = s.match;
    const pSeat = seatOf(s, playerSeatId);
    const eSeat = seatOf(s, enemySeatId);
    sceneRef.current?.resetForProjection?.({ keepDuel });
    gs.setPlayerHand(pSeat.hand);
    gs.setEnemyHand(eSeat.hand);
    gs.setPlayerUsedCards(pSeat.usedCardIds);
    gs.setEnemyUsedCards(eSeat.usedCardIds);
    gs.setPlayerFocus(pSeat.focus);
    gs.setEnemyFocus(eSeat.focus);
    gs.setPlayerHP(playerHP);
    gs.setEnemyHP(enemyHP);
    gs.setPlayerArmyBonuses(pSeat.armyBonuses || {});
    gs.setEnemyArmyBonuses(eSeat.armyBonuses || {});
    gs.setPlayerToxin(pSeat.toxin || null);
    gs.setEnemyToxin(eSeat.toxin || null);
    gs.setBattlefields(match.battlefields);
    gs.setRevealedFields(match.revealedFields);
    const ownerSide = s.kind === MULTI_SEAT_KINDS.TEAM
      ? (owner) => (owner === pSeat.team ? 'player' : 'enemy')
      : (owner) => (owner === playerSeatId ? 'player' : owner === enemySeatId ? 'enemy' : 'other');
    gs.setConqueredFields(projectConquered(conquered ?? match.conqueredFields, ownerSide));
    gs.setCardBattleOutcomes?.(outcomesFor(s, playerSeatId, enemySeatId));
    gs.setRoundNumber(match.roundNumber);
    gs.setIsPlayerFirst(isPlayerFirst);
    gs.setLastWinner(null);
    commit({ ...s, projection: { playerSeatId, enemySeatId } });
  }, [gameState, sceneRef, commit]);

  const finishWith = useCallback((s, gameResult) => {
    clearTimers();
    const over = { ...s, stage: MULTI_SEAT_STAGES.OVER };
    // La scena finale torna sul giocatore: la sua squadra (o lui) contro chi conta di più.
    const match = s.match;
    if (s.kind === MULTI_SEAT_KINDS.TEAM) {
      project(over, { playerSeatId: HUMAN_TEAM_SEAT, enemySeatId: 'B1', playerHP: match.teams.A.hp, enemyHP: match.teams.B.hp, isPlayerFirst: true });
    } else {
      const others = match.seats.filter((x) => x.id !== HUMAN_KOTH_SEAT);
      const winnerId = match.result?.winners?.find((id) => id !== HUMAN_KOTH_SEAT);
      const enemy = others.find((x) => x.id === winnerId)
        || [...others].sort((a, b) => b.conquests - a.conquests || b.hp - a.hp)[0];
      const human = getKothSeat(match, HUMAN_KOTH_SEAT);
      project(over, { playerSeatId: HUMAN_KOTH_SEAT, enemySeatId: enemy.id, playerHP: human.hp, enemyHP: enemy.hp, isPlayerFirst: true });
    }
    sceneRef.current?.showGameOver?.(gameResult);
  }, [clearTimers, project, sceneRef]);

  // ------------------------------------------------------------------
  // 2v2
  // ------------------------------------------------------------------
  /**
   * FC del compagno IA per la sua proposta: il consiglio accettato vince; in risposta mira
   * all'avversario del fronte che gli tocca con la disposizione scelta.
   */
  const mateFocusFor = useCallback((s, cardId, pairing) => {
    const match = s.match;
    const mate = getTeamSeat(match, 'A2');
    if (s.advice?.invest?.accepted) return investmentForLevel(mate, s.advice.invest.value);
    if (s.role === 'response' && pairing) return aiResponseInvestment(match, 'A2', cardId, pairing, rngRef.current);
    return s.teammateProposal?.focus ?? aiOpeningDeploy(match, 'A2', rngRef.current).focus;
  }, []);

  /** Ricalcola gli FC del compagno dopo un cambio (carta consigliata, disposizione, consiglio FC). */
  const refreshMatePlan = useCallback((s) => {
    if (!s.teammateProposal || !s.plan) return s;
    const focus = mateFocusFor(s, s.teammateProposal.cardId, s.plan.pairing);
    return {
      ...s,
      teammateProposal: { ...s.teammateProposal, focus },
      plan: { ...s.plan, investments: { ...s.plan.investments, A2: focus } },
    };
  }, [mateFocusFor]);

  /** Il turno è risolto: un attimo di rivelazione (Agenti, disposizione, FC), poi i duelli. */
  const teamReveal = useCallback((s, match, roundStartMatch) => {
    const rr = match.roundResult;
    log(`[T${rr.roundNumber}] 2v2 · Disposizione ${rr.pairing === PAIRINGS.CROSSED ? 'incrociata' : 'diretta'} e investimenti rivelati.`);
    commit({ ...s, match, roundStartMatch, plan: null, pendingConfirm: null, teammateProposal: null, revealing: true, stage: MULTI_SEAT_STAGES.AI_TURN });
    later(() => {
      const cur = sessionRef.current;
      if (!cur?.revealing) return;
      teamPresentFrontRef.current?.({ ...cur, revealing: false }, 0);
    }, REVEAL_PAUSE_MS);
  }, [commit, later, log]);

  /**
   * Turno del 2v2 come nell'1v1: chi apre sceglie Campo, Agente e FC insieme; chi risponde
   * vede gli Agenti dell'apertura (non i loro FC) e sceglie Agenti, FC e disposizione; poi
   * tutto si rivela insieme. Il compagno IA decide in parallelo al giocatore.
   */
  const teamBeginTurn = useCallback((s0) => {
    const rng = rngRef.current;
    // I consigli valgono per un turno.
    const s = {
      ...s0,
      advice: {}, adviceMemo: {}, adviceReplies: {},
      thinking: {}, pendingConfirm: null,
      mateReady: false, mateLine: null, revealing: false,
    };
    let match = s.match;
    const hp = (team) => match.teams[team].hp;
    // Il compagno pensa mentre scegli tu: la sua proposta (carta, FC e, in risposta, la
    // disposizione che consiglia) arriva dopo qualche istante.
    const mateThinks = (role) => think(['A2'], 'proposal', (cur) => {
      const m = cur.match;
      const mate = getTeamSeat(m, 'A2');
      let proposal;
      let plan;
      if (role === 'opening') {
        proposal = aiOpeningDeploy(m, 'A2', rng);
        plan = { pairing: null, suggestedPairing: null, investments: {} };
      } else {
        const cardId = aiResponseDeploy(m, 'A2', rng).cardId;
        const pairing = suggestPairing(m, 'A', 'A2', cardId, rng);
        proposal = { cardId };
        plan = { pairing, suggestedPairing: pairing, investments: {} };
      }
      let next = { ...cur, teammateProposal: proposal, plan, mateReady: true };
      // Carta consigliata e accettata prima che il compagno decidesse.
      if (cur.advice?.card?.accepted) next.teammateProposal = { ...next.teammateProposal, cardId: cur.advice.card.value };
      next = refreshMatePlan(next);
      const card = mate.hand.find((c) => c.id === next.teammateProposal.cardId);
      next = { ...next, mateLine: `${mateCardLine(mate.aiProfile, card?.name)} ${mateInvestLine(mate, next.teammateProposal.focus)}` };
      commit(next);
      if (cur.pendingConfirm) teamHumanConfirmRef.current?.(next, cur.pendingConfirm);
    });
    if (match.openingTeam === 'A') {
      const next = { ...s, match, stage: MULTI_SEAT_STAGES.HUMAN_DEPLOY, role: 'opening', plan: null, teammateProposal: null };
      log(`[T${match.roundNumber}] 2v2 · Apre la tua squadra: Campo, Agente e FC, insieme al compagno.`);
      project(next, { playerSeatId: HUMAN_TEAM_SEAT, enemySeatId: 'B1', playerHP: hp('A'), enemyHP: hp('B'), isPlayerFirst: true });
      sceneRef.current?.setGamePhase('selectField');
      mateThinks('opening');
      return;
    }
    // La scena mostra subito la tua squadra contro gli avversari (PV di squadra, mani).
    project({ ...s, match, stage: MULTI_SEAT_STAGES.AI_TURN, role: 'response', plan: null, teammateProposal: null }, {
      playerSeatId: HUMAN_TEAM_SEAT, enemySeatId: 'B1', playerHP: hp('A'), enemyHP: hp('B'), isPlayerFirst: false,
    });
    sceneRef.current?.setGamePhase('selectField');
    // Gli avversari pensano ciascuno con il suo tempo; le due carte si rivelano insieme
    // (i loro FC restano nascosti fino alla rivelazione).
    think(['B1', 'B2'], 'opening', (cur) => {
      const d1 = aiOpeningDeploy(cur.match, 'B1', rng);
      const d2 = aiOpeningDeploy(cur.match, 'B2', rng, [d1.fieldIndex]);
      const m = submitOpeningDeploy(cur.match, { B1: d1, B2: d2 });
      const next = { ...cur, match: m, stage: MULTI_SEAT_STAGES.HUMAN_DEPLOY, role: 'response', teammateProposal: null };
      log(`[T${m.roundNumber}] 2v2 · Apre la squadra avversaria: ${m.battlefields[d1.fieldIndex].name} e ${m.battlefields[d2.fieldIndex].name}.`);
      project(next, { playerSeatId: HUMAN_TEAM_SEAT, enemySeatId: 'B1', playerHP: m.teams.A.hp, enemyHP: m.teams.B.hp, isPlayerFirst: false });
      // Il fronte di B1 resta in scena come riferimento; chi attacca chi si sceglie nel Tavolo.
      const b1Card = getTeamSeat(m, 'B1').hand.find((c) => c.id === d1.cardId);
      sceneRef.current?.showOpponentDeploy?.({ agent: b1Card, fieldIndex: d1.fieldIndex });
      sceneRef.current?.setGamePhase('selectAgent');
      mateThinks('response');
    });
  }, [commit, log, project, refreshMatePlan, sceneRef, think]);

  const teamHumanConfirm = useCallback((s, choice) => {
    const { agent, focus, fieldIndex } = choice;
    const rng = rngRef.current;
    let match = s.match;
    const proposal = s.teammateProposal;
    // Il compagno non ha ancora deciso: la tua scelta resta in attesa della sua.
    if (!proposal) {
      // Scelta bloccata (niente altri trascinamenti) finché il compagno non decide.
      commit({ ...s, pendingConfirm: choice, stage: MULTI_SEAT_STAGES.AI_TURN });
      log(`[T${match.roundNumber}] 2v2 · Hai scelto: aspetti che il compagno decida.`);
      return;
    }
    const roundStartMatch = match;
    try {
      if (s.role === 'opening') {
        // Il compagno cambia Campo solo se hai scelto proprio il suo.
        let a2 = { ...proposal };
        if (a2.fieldIndex === fieldIndex) a2.fieldIndex = aiOpeningDeploy(match, 'A2', rng, [fieldIndex]).fieldIndex;
        match = submitOpeningDeploy(match, {
          A1: { cardId: agent.id, fieldIndex, focus },
          A2: { cardId: a2.cardId, fieldIndex: a2.fieldIndex, focus: a2.focus },
        });
      } else {
        match = submitResponseDeploy(match, {
          A1: { cardId: agent.id, focus },
          A2: { cardId: proposal.cardId, focus: proposal.focus },
        }, s.plan?.pairing || PAIRINGS.DIRECT);
      }
    } catch (err) {
      sceneRef.current?.hint?.(err.message);
      return;
    }
    if (s.role === 'response') {
      log(`[T${match.roundNumber}] 2v2 · La tua squadra risponde.`);
      teamReveal({ ...s, pendingConfirm: null }, match, roundStartMatch);
      return;
    }
    // La tua squadra è schierata (insieme); la risposta arriva dopo una pausa visibile.
    log(`[T${match.roundNumber}] 2v2 · La tua squadra si schiera. Risponde la squadra avversaria…`);
    commit({ ...s, match, stage: MULTI_SEAT_STAGES.AI_TURN, teammateProposal: null, pendingConfirm: null });
    think(['B1', 'B2'], 'response', (cur) => {
      if (cur.stage !== MULTI_SEAT_STAGES.AI_TURN) return;
      const before = cur.match;
      const plan = aiResponsePlan(before, 'B', rng);
      const m = submitResponseDeploy(before, plan.deployments, plan.pairing);
      log(`[T${m.roundNumber}] 2v2 · La squadra avversaria risponde con due Agenti.`);
      teamReveal(cur, m, before);
    });
  }, [commit, log, sceneRef, teamReveal, think]);
  const teamHumanConfirmRef = useRef(teamHumanConfirm);
  teamHumanConfirmRef.current = teamHumanConfirm;

  const teamPresentFront = useCallback((s, index) => {
    const rr = s.match.roundResult;
    const front = rr.fronts[index];
    const before = s.roundStartMatch;
    const pSeat = getTeamSeat(before, front.playerSeatId);
    const eSeat = getTeamSeat(before, front.enemySeatId);
    const next = { ...s, stage: MULTI_SEAT_STAGES.PRESENTING, presentIndex: index };
    // Gli scontri leggono la stessa Vita di inizio turno: la scena mostra ogni fronte da lì.
    project({ ...next, match: before }, {
      playerSeatId: pSeat.id,
      enemySeatId: eSeat.id,
      playerHP: rr.hpBefore[pSeat.team],
      enemyHP: rr.hpBefore[eSeat.team],
      isPlayerFirst: front.playerSeatId === front.firstSeatId,
      // dal secondo scontro del turno si resta nella vista del duello
      keepDuel: index > 0,
    });
    commit({ ...sessionRef.current, match: s.match });
    const result = front.battleResult;
    const max = s.match.config.maxHp;
    const display = {
      ...result,
      finalPlayerHP: Math.min(max, Math.max(0, result.finalPlayerHP)),
      finalEnemyHP: Math.min(max, Math.max(0, result.finalEnemyHP)),
    };
    const pCard = pSeat.hand.find((c) => c.id === (front.playerSeatId === front.firstSeatId ? front.firstCardId : front.secondCardId));
    const eCard = eSeat.hand.find((c) => c.id === (front.playerSeatId === front.firstSeatId ? front.secondCardId : front.firstCardId));
    sceneRef.current?.stageBattle({
      result: display,
      playerAgent: pCard,
      enemyAgent: eCard,
      playerFocus: rr.investments[pSeat.id],
      enemyFocus: rr.investments[eSeat.id],
      fieldIndex: front.fieldIndex,
      // Dal secondo scontro gli Agenti arrivano dalla coda sfocata (o restano in campo).
      entry: index > 0 ? scontroTransition(teamScontri(rr), index - 1)?.enter ?? null : null,
    });
  }, [commit, project, sceneRef]);
  const teamPresentFrontRef = useRef(teamPresentFront);
  teamPresentFrontRef.current = teamPresentFront;

  const teamAfterScontro = useCallback((s) => {
    const rr = s.match.roundResult;
    if (s.presentIndex + 1 < rr.fronts.length) {
      teamPresentFront(s, s.presentIndex + 1);
      return;
    }
    log(`[T${rr.roundNumber}] 2v2 · Fine turno: la tua squadra ${rr.hpAfter.A} PV, avversari ${rr.hpAfter.B} PV.`);
    let match = advanceAfterRound(s.match);
    if (match.phase === TEAM_DUEL_PHASES.CLAIM) {
      if (match.claim.team === 'A') {
        commit({ ...s, match, stage: MULTI_SEAT_STAGES.CLAIM });
        return;
      }
      match = resolveTeamClaim(match, 'claim');
    }
    if (match.phase === TEAM_DUEL_PHASES.GAME_OVER) {
      finishWith({ ...s, match }, mapTeamResult(match));
      return;
    }
    teamBeginTurn({ ...s, match, roundStartMatch: null, presentIndex: 0 });
  }, [commit, finishWith, log, teamBeginTurn, teamPresentFront]);

  // ------------------------------------------------------------------
  // Re della collina
  // ------------------------------------------------------------------
  const kothPresentFight = useCallback((s, index) => {
    const cr = s.match.contestResult;
    const fight = cr.fights[index];
    const before = s.contestStartMatch;
    const pSeat = getKothSeat(before, fight.playerSeatId);
    const eSeat = getKothSeat(before, fight.enemySeatId);
    const reveal = s.afterReveal;
    const next = { ...s, stage: MULTI_SEAT_STAGES.PRESENTING, presentIndex: index };
    const viewMatch = {
      ...before,
      seats: before.seats.map((seat) => ({ ...seat, focus: reveal[seat.id]?.focus ?? seat.focus, hp: reveal[seat.id]?.hp ?? seat.hp })),
    };
    project({ ...next, match: viewMatch }, {
      playerSeatId: pSeat.id,
      enemySeatId: eSeat.id,
      playerHP: fight.hpBefore[pSeat.id],
      enemyHP: fight.hpBefore[eSeat.id],
      isPlayerFirst: fight.playerSeatId === fight.firstSeatId,
      keepDuel: index > 0,
    });
    commit({ ...sessionRef.current, match: s.match });
    const pIsFirst = fight.playerSeatId === fight.firstSeatId;
    const pCard = pSeat.hand.find((c) => c.id === (pIsFirst ? fight.firstCardId : fight.secondCardId));
    const eCard = eSeat.hand.find((c) => c.id === (pIsFirst ? fight.secondCardId : fight.firstCardId));
    sceneRef.current?.stageBattle({
      result: fight.battleResult,
      playerAgent: pCard,
      enemyAgent: eCard,
      playerFocus: pIsFirst ? fight.firstFocus : fight.secondFocus,
      enemyFocus: pIsFirst ? fight.secondFocus : fight.firstFocus,
      fieldIndex: cr.fieldIndex,
      entry: index > 0 ? scontroTransition(kothScontri(cr), index - 1)?.enter ?? null : null,
    });
    // Stato intermedio della catena per lo scontro successivo.
    const afterReveal = { ...reveal };
    afterReveal[pSeat.id] = { hp: fight.hpAfter[pSeat.id], focus: fight.battleResult.finalPlayerFC };
    afterReveal[eSeat.id] = { hp: fight.hpAfter[eSeat.id], focus: fight.battleResult.finalEnemyFC };
    commit({ ...sessionRef.current, afterReveal });
  }, [commit, project, sceneRef]);

  const kothRunCommits = useCallback((s) => {
    const rng = rngRef.current;
    let match = s.match;
    const committer = currentCommitter(match);
    if (committer == null) {
      // Tutti hanno posato: la contesa è risolta, si presenta la catena.
      const cr = match.contestResult;
      log(`[C${cr.roundNumber}] Re della collina · Investimenti rivelati su ${match.battlefields[cr.fieldIndex].name}.`);
      const start = s.contestStartMatch;
      const afterReveal = {};
      for (const seat of start.seats) {
        const inv = cr.commits[seat.id]?.investment ?? 0;
        afterReveal[seat.id] = { hp: seat.hp, focus: Math.max(0, seat.focus - inv) };
      }
      if (cr.fights.length === 0) {
        kothAfterScontroRef.current({ ...s, match, afterReveal, presentIndex: -1 });
        return;
      }
      kothPresentFight({ ...s, match, afterReveal }, 0);
      return;
    }
    if (committer === HUMAN_KOTH_SEAT) {
      const order = contestOrder(match);
      const isOpener = openerSeatId(match) === HUMAN_KOTH_SEAT;
      const enemyId = isOpener ? order[1] : order[0];
      const human = getKothSeat(match, HUMAN_KOTH_SEAT);
      const enemy = getKothSeat(match, enemyId);
      const next = { ...s, match, stage: MULTI_SEAT_STAGES.HUMAN_DEPLOY, role: isOpener ? 'opening' : 'challenger' };
      project(next, { playerSeatId: HUMAN_KOTH_SEAT, enemySeatId: enemyId, playerHP: human.hp, enemyHP: enemy.hp, isPlayerFirst: isOpener });
      if (isOpener) {
        log(`[C${match.roundNumber}] Re della collina · Apri tu: scegli il Campo, l'Agente e i FC.`);
        sceneRef.current?.setGamePhase('selectField');
      } else {
        const openerCard = enemy.hand.find((c) => c.id === match.commits[enemyId].cardId);
        sceneRef.current?.showOpponentDeploy?.({ agent: openerCard, fieldIndex: match.contestFieldIndex });
        sceneRef.current?.setGamePhase('selectAgent');
      }
      return;
    }
    commit({ ...s, match, stage: MULTI_SEAT_STAGES.AI_TURN });
    think([committer], 'commit', (cur) => {
      if (!cur || cur.stage === MULTI_SEAT_STAGES.OVER) return;
      const choice = aiCommit(cur.match, committer, rng);
      const m2 = submitCommit(cur.match, committer, choice);
      const seat = getKothSeat(m2, committer);
      const card = seat.hand.find((c) => c.id === choice.cardId);
      const fieldName = m2.battlefields[m2.contestFieldIndex]?.name;
      log(`[C${m2.roundNumber}] ${seat.name} posa ${card?.name}${choice.fieldIndex != null ? ` su ${fieldName}` : ''}.`);
      kothRunCommitsRef.current({ ...cur, match: m2 });
    });
  }, [commit, kothPresentFight, log, project, sceneRef, think]);
  const kothRunCommitsRef = useRef(kothRunCommits);
  kothRunCommitsRef.current = kothRunCommits;

  const kothBeginContest = useCallback((s) => {
    const match = s.match;
    const next = { ...s, contestStartMatch: match, afterReveal: null, presentIndex: 0 };
    const order = contestOrder(match);
    log(`[C${match.roundNumber}] Re della collina · Ordine: ${order.map((id) => getKothSeat(match, id).name).join(' → ')}.`);
    // Scena di attesa: il giocatore contro il primo della coda.
    const enemyId = order.find((id) => id !== HUMAN_KOTH_SEAT) || order[0];
    project(next, {
      playerSeatId: HUMAN_KOTH_SEAT,
      enemySeatId: enemyId,
      playerHP: getKothSeat(match, HUMAN_KOTH_SEAT).hp,
      enemyHP: getKothSeat(match, enemyId).hp,
      isPlayerFirst: openerSeatId(match) === HUMAN_KOTH_SEAT,
    });
    sceneRef.current?.setGamePhase('selectField');
    kothRunCommitsRef.current(sessionRef.current);
  }, [log, project, sceneRef]);

  const kothAfterScontro = useCallback((s) => {
    const cr = s.match.contestResult;
    if (s.presentIndex >= 0 && s.presentIndex + 1 < cr.fights.length) {
      kothPresentFight(s, s.presentIndex + 1);
      return;
    }
    const conqueror = cr.conquerorSeatId ? getKothSeat(s.match, cr.conquerorSeatId).name : null;
    log(`[C${cr.roundNumber}] Re della collina · ${conqueror ? `${conqueror} conquista ${s.match.battlefields[cr.fieldIndex].name}.` : 'Il Campo resta senza proprietario.'}`);
    if (getKothSeat(s.match, HUMAN_KOTH_SEAT).eliminated) {
      finishWith(s, mapKothResult(s.match, true));
      return;
    }
    let match = advanceAfterContest(s.match);
    if (match.phase === KOTH_PHASES.CLAIM) {
      if (match.claim.seatId === HUMAN_KOTH_SEAT) {
        commit({ ...s, match, stage: MULTI_SEAT_STAGES.CLAIM });
        return;
      }
      match = resolveKothClaim(match, 'claim');
    }
    if (match.phase === KOTH_PHASES.GAME_OVER) {
      finishWith({ ...s, match }, mapKothResult(match));
      return;
    }
    kothBeginContest({ ...s, match });
  }, [commit, finishWith, kothBeginContest, kothPresentFight, log]);
  const kothAfterScontroRef = useRef(kothAfterScontro);
  kothAfterScontroRef.current = kothAfterScontro;

  const kothHumanConfirm = useCallback((s, { agent, focus, fieldIndex }) => {
    let match;
    try {
      match = submitCommit(s.match, HUMAN_KOTH_SEAT, {
        cardId: agent.id,
        investment: focus,
        fieldIndex: s.role === 'opening' ? fieldIndex : null,
      });
    } catch (err) {
      sceneRef.current?.hint?.(err.message);
      return;
    }
    log(`[C${match.roundNumber}] Hai posato ${agent.name}.`);
    commit({ ...s, match, stage: MULTI_SEAT_STAGES.AI_TURN });
    later(() => kothRunCommitsRef.current({ ...sessionRef.current, match }), 300);
  }, [commit, later, log, sceneRef]);

  // ------------------------------------------------------------------
  // Avvio
  // ------------------------------------------------------------------
  const init = useCallback((s) => {
    const rng = rngRef.current || createRng().rng;
    rngRef.current = rng;
    const seed = s.seed ?? null;
    const humanHand = gameState.playerHand;
    const enemyHand = gameState.enemyHand;
    const humanArmy = humanHand[0]?.army;
    const firstEnemyArmy = enemyHand[0]?.army;
    // Posti IA aggiuntivi già scelti all'avvio (servono alla schermata VS).
    const queue = [...(s.extras || [])];
    const nameQueue = [...(s.npcNames?.extras || [])];
    const npcName = (fallback) => nameQueue.shift() || fallback;
    const firstEnemyName = s.npcNames?.firstEnemy || firstEnemyArmy;
    const taken = [humanArmy, firstEnemyArmy, ...queue.map((x) => x.army)];
    const extra = () => {
      if (queue.length) return queue.shift();
      const pick = pickAiArmyDeck(taken, rng);
      taken.push(pick.army);
      return pick;
    };
    const enemyProfile = profileForDifficulty(s.options.difficulty);
    if (s.kind === MULTI_SEAT_KINDS.TEAM) {
      const mate = extra();
      const foe = extra();
      const preset = getSeatAIProfile(s.options.teammatePreset);
      const seats = [
        createSeat({ id: 'A1', name: 'Tu', isHuman: true, team: 'A', army: humanArmy, hand: humanHand, focus: TEAM_DUEL_CONFIG.startFocus }),
        // Nomi segnaposto dei posti IA: PNG + archetipo di personalità (l'armata resta a parte).
        createSeat({ id: 'A2', name: npcName(`PNG ${preset.name}`), team: 'A', army: mate.army, hand: mate.hand, focus: TEAM_DUEL_CONFIG.startFocus, aiProfile: preset.id, deckKey: mate.deckKey }),
        createSeat({ id: 'B1', name: firstEnemyName, team: 'B', army: firstEnemyArmy, hand: enemyHand, focus: TEAM_DUEL_CONFIG.startFocus, aiProfile: enemyProfile }),
        createSeat({ id: 'B2', name: npcName(foe.army), team: 'B', army: foe.army, hand: foe.hand, focus: TEAM_DUEL_CONFIG.startFocus, aiProfile: enemyProfile, deckKey: foe.deckKey }),
      ];
      const battlefields = selectBattlefields(s.options.fieldMode, ALL_BATTLEFIELDS, {
        rng,
        fieldCount: TEAM_DUEL_CONFIG.fieldCount,
        selectionConfig: { REVEAL_START: TEAM_DUEL_CONFIG.revealStart },
      });
      const match = createTeamDuelMatch({ seats, battlefields, rng, seed, mode: s.options.fieldMode, perspectiveTeam: 'A' });
      log(`2v2 · Tu e ${seats[1].name} contro ${seats[2].name} e ${seats[3].name}.`);
      teamBeginTurn({ ...s, match, pending: false });
      return;
    }
    const players = s.options.players === 4 ? 4 : 3;
    const seats = [
      createSeat({ id: 'P1', name: 'Tu', isHuman: true, army: humanArmy, hand: humanHand, focus: KOTH_CONFIG.startFocus }),
      createSeat({ id: 'P2', name: firstEnemyName, army: firstEnemyArmy, hand: enemyHand, focus: KOTH_CONFIG.startFocus, aiProfile: enemyProfile }),
    ];
    for (let i = 3; i <= players; i += 1) {
      const pick = extra();
      seats.push(createSeat({ id: `P${i}`, name: npcName(pick.army), army: pick.army, hand: pick.hand, focus: KOTH_CONFIG.startFocus, aiProfile: enemyProfile, deckKey: pick.deckKey }));
    }
    const battlefields = selectBattlefields(s.options.fieldMode, ALL_BATTLEFIELDS, { rng });
    const match = createKothMatch({ seats, battlefields, rng, seed, mode: s.options.fieldMode, perspectiveSeatId: HUMAN_KOTH_SEAT });
    log(`Re della collina · ${seats.map((x) => x.name).join(', ')}.`);
    kothBeginContest({ ...s, match, pending: false });
  }, [gameState.playerHand, gameState.enemyHand, kothBeginContest, log, teamBeginTurn]);

  // Avvio dopo la distribuzione delle carte del giocatore (prima selectField della partita).
  useEffect(() => {
    if (!session?.pending) return;
    if (gameState.gamePhase !== 'selectField') return;
    if (!gameState.playerHand?.length || !gameState.enemyHand?.length) return;
    init(session);
  }, [session, gameState.gamePhase, gameState.playerHand, gameState.enemyHand, init]);

  // Uscita dalla partita: si chiude la sessione. Una sessione armata (in attesa) resta viva
  // mentre si è ancora nella scelta dell'esercito, dove è stata armata.
  useEffect(() => {
    if (!session) return;
    const phase = gameState.gamePhase;
    const leaving = phase === 'menu'
      || (!session.pending && ['selectArmy', 'selectDeck', 'previewDeck'].includes(phase));
    if (leaving) {
      clearTimers();
      sessionRef.current = null;
      setSession(null);
      return;
    }
    // Rivincita dalla fine partita: nuova partita nella stessa modalità.
    if (session.stage === MULTI_SEAT_STAGES.OVER && (phase === 'shuffleDeal' || phase === 'duelLoading')) {
      clearTimers();
      const next = {
        kind: session.kind,
        options: session.options,
        pending: true,
        stage: MULTI_SEAT_STAGES.PENDING,
        match: null,
        seed: session.seed,
        firstEnemy: session.firstEnemy,
        extras: (session.extras || []).map((x) => ({ ...x, hand: pickHandAgain(x, rngRef.current) })),
        // stessi PNG della partita appena finita (servono già alla schermata VS)
        npcNames: session.npcNames,
      };
      sessionRef.current = next;
      setSession(next);
    }
  }, [session, gameState.gamePhase, clearTimers]);

  useEffect(() => clearTimers, [clearTimers]);

  // ------------------------------------------------------------------
  // API per la scena e per il pannello
  // ------------------------------------------------------------------
  /**
   * Arma la modalità prima dell'avvio del duello. Sceglie subito armate e mazzi delle IA,
   * così la schermata VS può mostrarle tutte. Restituisce armata e mazzo del primo
   * avversario, da passare all'avvio del duello (è il lato `enemy` della distribuzione).
   */
  const arm = useCallback((options) => {
    clearTimers();
    const { rng, seed } = createRng();
    rngRef.current = rng;
    const taken = [options.humanArmy].filter(Boolean);
    const pick = () => {
      const p = pickAiArmyDeck(taken, rng);
      taken.push(p.army);
      return p;
    };
    const first = pick();
    const extraCount = options.kind === MULTI_SEAT_KINDS.TEAM ? 2 : (options.players === 4 ? 4 : 3) - 2;
    const extras = Array.from({ length: extraCount }, pick);
    // Nomi PNG decisi subito: servono già alla schermata VS. Ordine: [compagno,] primo avversario, altri.
    const enemyProfile = profileForDifficulty(options.difficulty);
    const isTeam = options.kind === MULTI_SEAT_KINDS.TEAM;
    const names = npcSeatNames(isTeam
      ? [getSeatAIProfile(options.teammatePreset).id, enemyProfile, enemyProfile]
      : Array.from({ length: 1 + extraCount }, () => enemyProfile));
    const npcNames = isTeam
      ? { mate: names[0], firstEnemy: names[1], extras: [names[0], names[2]] }
      : { mate: null, firstEnemy: names[0], extras: names.slice(1) };
    commit({
      kind: options.kind,
      options,
      pending: true,
      stage: MULTI_SEAT_STAGES.PENDING,
      match: null,
      seed,
      firstEnemy: { army: first.army, deckKey: first.deckKey },
      extras,
      npcNames,
    });
    return { enemyArmy: first.army, enemyDeckKey: first.deckKey };
  }, [clearTimers, commit]);

  const cancel = useCallback(() => {
    clearTimers();
    sessionRef.current = null;
    setSession(null);
  }, [clearTimers]);

  const onHumanConfirm = useCallback((choice) => {
    const s = sessionRef.current;
    if (!s) return false;
    if (s.stage !== MULTI_SEAT_STAGES.HUMAN_DEPLOY) return false;
    if (s.kind === MULTI_SEAT_KINDS.TEAM) teamHumanConfirm(s, choice);
    else kothHumanConfirm(s, choice);
    return true;
  }, [teamHumanConfirm, kothHumanConfirm]);

  const onScontroDone = useCallback(() => {
    const s = sessionRef.current;
    if (!s || s.stage !== MULTI_SEAT_STAGES.PRESENTING) return;
    if (s.kind === MULTI_SEAT_KINDS.TEAM) teamAfterScontro(s);
    else kothAfterScontro(s);
  }, [teamAfterScontro, kothAfterScontro]);

  /** 2v2, quando risponde la tua squadra: chi attacca chi (prima di confermare). */
  const setPlanPairing = useCallback((pairing) => {
    const s = sessionRef.current;
    if (!s?.plan || s.role !== 'response' || s.match?.phase !== TEAM_DUEL_PHASES.RESPONSE_DEPLOY) return;
    if (pairing !== PAIRINGS.DIRECT && pairing !== PAIRINGS.CROSSED) return;
    commit(refreshMatePlan({ ...s, plan: { ...s.plan, pairing } }));
  }, [commit, refreshMatePlan]);

  /**
   * Consiglio al compagno IA (2v2): 'card' (carta dalla sua mano), 'field' (Campo, quando
   * aprite), 'invest' ('basso' | 'medio' | 'alto'). Il compagno lo segue con la probabilità
   * della fiducia del suo preset; lo stesso consiglio ripetuto riceve la stessa risposta.
   * @returns {{ accepted: boolean, text: string }|null}
   */
  const advise = useCallback((kind, value) => {
    const s = sessionRef.current;
    if (!s || s.kind !== MULTI_SEAT_KINDS.TEAM || !s.match) return null;
    const match = s.match;
    const mate = getTeamSeat(match, 'A2');
    const deployed = Boolean(match.deployments?.A2);
    const deploying = s.stage === MULTI_SEAT_STAGES.HUMAN_DEPLOY && !deployed && s.teammateProposal;
    if ((kind === 'card' || kind === 'field') && !deploying) return null;
    if (kind === 'field' && s.role !== 'opening') return null;
    // Gli FC si consigliano finché il compagno non si è schierato (come la carta).
    if (kind === 'invest' && (deployed || ![MULTI_SEAT_STAGES.HUMAN_DEPLOY, MULTI_SEAT_STAGES.AI_TURN].includes(s.stage))) return null;
    if (kind === 'card' && !mate.hand.some((c) => c.id === value && !mate.usedCardIds.includes(c.id))) {
      commit({ ...s, adviceReplies: { ...(s.adviceReplies || {}), card: { accepted: false, text: 'Questa carta l’ho già giocata.', what: null } } });
      return { accepted: false, text: 'Questa carta l’ho già giocata.' };
    }

    const profile = getSeatAIProfile(mate.aiProfile);
    const memoKey = `${kind}:${value}`;
    const memo = { ...(s.adviceMemo || {}) };
    if (memo[memoKey] == null) memo[memoKey] = rngRef.current() < (profile.trust ?? 0.6);
    const accepted = memo[memoKey];

    const cardName = kind === 'card' ? mate.hand.find((c) => c.id === value)?.name : null;
    const fieldName = kind === 'field' ? match.battlefields[value]?.name : null;
    const what = kind === 'card' ? cardName : kind === 'field' ? fieldName : `investimento ${value}`;
    const text = accepted
      ? (kind === 'card' ? `Va bene, gioco ${cardName}.` : kind === 'field' ? `D'accordo, vado su ${fieldName}.` : `Ok, investimento ${value}.`)
      : (kind === 'card' ? `Preferisco tenere la mia scelta.` : kind === 'field' ? `Resto sul mio Campo.` : `Investo come avevo deciso.`);

    let next = {
      ...s,
      adviceMemo: memo,
      advice: { ...(s.advice || {}), [kind]: { value, accepted } },
      adviceReplies: { ...(s.adviceReplies || {}), [kind]: { accepted, text, what } },
    };
    if (accepted && kind === 'card') next.teammateProposal = { ...s.teammateProposal, cardId: value };
    if (accepted && kind === 'field') next.teammateProposal = { ...s.teammateProposal, fieldIndex: value };
    // Carta o FC cambiati: il compagno rifà i conti sui suoi FC.
    if (accepted && (kind === 'card' || kind === 'invest')) next = refreshMatePlan(next);
    log(`[T${match.roundNumber}] Consiglio a ${mate.name} (${what}): ${accepted ? 'accettato' : 'rifiutato'}.`);
    commit(next);
    return { accepted, text };
  }, [commit, log, refreshMatePlan]);

  const decideClaim = useCallback((decision) => {
    const s = sessionRef.current;
    if (!s || s.stage !== MULTI_SEAT_STAGES.CLAIM) return;
    if (s.kind === MULTI_SEAT_KINDS.TEAM) {
      const match = resolveTeamClaim(s.match, decision);
      if (match.phase === TEAM_DUEL_PHASES.GAME_OVER) finishWith({ ...s, match }, mapTeamResult(match));
      else teamBeginTurn({ ...s, match, roundStartMatch: null, presentIndex: 0 });
      return;
    }
    const match = resolveKothClaim(s.match, decision);
    if (match.phase === KOTH_PHASES.GAME_OVER) finishWith({ ...s, match }, mapKothResult(match));
    else kothBeginContest({ ...s, match });
  }, [finishWith, kothBeginContest, teamBeginTurn]);

  /**
   * Mani consultabili per triangolo: la prima è quella proiettata. In basso la squadra del
   * lato player (solo 2v2), in alto gli avversari (nel Re della collina tutti gli altri).
   */
  const handSeats = useMemo(() => {
    const match = session?.match;
    const proj = session?.projection;
    if (!match || !proj) return { player: [], enemy: [] };
    const pSeat = seatOf(session, proj.playerSeatId);
    const eSeat = seatOf(session, proj.enemySeatId);
    if (!pSeat || !eSeat) return { player: [], enemy: [] };
    if (session.kind === MULTI_SEAT_KINDS.TEAM) {
      const mates = match.seats.filter((x) => x.team === pSeat.team && x.id !== pSeat.id).map((x) => x.id);
      const foes = match.seats.filter((x) => x.team === eSeat.team && x.id !== eSeat.id).map((x) => x.id);
      return { player: [pSeat.id, ...mates], enemy: [eSeat.id, ...foes] };
    }
    const others = match.seats.filter((x) => x.id !== pSeat.id && x.id !== eSeat.id).map((x) => x.id);
    return { player: [pSeat.id], enemy: [eSeat.id, ...others] };
  }, [session]);

  /**
   * Schermata VS: mazzi aggiuntivi per lato. Il giocatore e il primo avversario sono quelli
   * del duello; qui il compagno (2v2) e gli altri avversari.
   */
  const versus = useMemo(() => {
    if (!session?.extras) return null;
    const deckOf = (x) => ({ army: x.army, deckKey: x.deckKey, cardIds: (x.deckCards || []).map((c) => c.id) });
    if (session.kind === MULTI_SEAT_KINDS.TEAM) {
      const [mate, foe] = session.extras;
      const [mateName, foeName] = session.npcNames?.extras || [];
      return {
        enemyName: session.npcNames?.firstEnemy || null,
        playerAllies: mate ? [{ identity: { eyebrow: 'Compagno IA', name: mateName || mate.army, sub: mate.army }, deck: deckOf(mate) }] : [],
        enemyAllies: foe ? [{ identity: { eyebrow: 'Avversario IA', name: foeName || foe.army, sub: foe.army }, deck: deckOf(foe) }] : [],
      };
    }
    return {
      enemyName: session.npcNames?.firstEnemy || null,
      playerAllies: [],
      enemyAllies: session.extras.map((x, i) => ({ identity: { eyebrow: 'Sfidante IA', name: session.npcNames?.extras?.[i] || x.army, sub: x.army }, deck: deckOf(x) })),
    };
  }, [session?.extras, session?.kind, session?.npcNames]);

  /** Dati in sola lettura per mostrare la mano di un posto in un triangolo. */
  const handViewFor = useCallback((seatId, side) => {
    const s = sessionRef.current;
    const seat = seatOf(s, seatId);
    if (!seat) return null;
    const outcomes = {};
    const all = outcomesFor(s, side === 'player' ? seatId : null, side === 'enemy' ? seatId : null);
    Object.assign(outcomes, all);
    return { seatId, name: seat.name, army: seat.army, hand: seat.hand, usedCards: seat.usedCardIds, outcomes, armyBonuses: seat.armyBonuses || {} };
  }, []);

  const view = useMemo(() => {
    if (!session) return null;
    const match = session.match;
    // Stato di riflessione per posto (unione dei tipi in corso).
    const thinkingSeats = {};
    for (const [kind, seats] of Object.entries(session.thinking || {})) {
      for (const [id, st] of Object.entries(seats || {})) thinkingSeats[id] = { ...st, kind };
    }
    const base = {
      kind: session.kind,
      stage: session.stage,
      role: session.role || null,
      plan: session.plan || null,
      projection: session.projection || null,
      thinkingSeats,
      thinkingKinds: Object.keys(session.thinking || {}),
      pendingConfirm: Boolean(session.pendingConfirm),
      mateReady: Boolean(session.mateReady),
      mateLine: session.mateLine || null,
      revealing: Boolean(session.revealing),
      scontroQueue: presentQueue(session),
    };
    if (!match) return base;
    if (session.kind === MULTI_SEAT_KINDS.TEAM) {
      return {
        ...base,
        roundNumber: match.roundNumber,
        openingTeam: match.openingTeam,
        threshold: match.config.conquestThreshold,
        teams: {
          A: { hp: match.teams.A.hp, maxHp: match.teams.A.maxHp, fields: teamFieldCount(match, 'A') },
          B: { hp: match.teams.B.hp, maxHp: match.teams.B.maxHp, fields: teamFieldCount(match, 'B') },
        },
        seats: match.seats,
        deployments: match.deployments,
        battlefields: match.battlefields,
        presentIndex: session.presentIndex ?? null,
        roundResult: match.roundResult,
        claim: match.claim,
        result: match.result,
        board: teamBoard(session),
        advice: session.advice || {},
        adviceReplies: session.adviceReplies || {},
        legalFields: legalFieldIndexesTeam(match),
        mateTrust: getSeatAIProfile(getTeamSeat(match, 'A2')?.aiProfile)?.trust ?? null,
        // Quando risponde la tua squadra: i fronti con la disposizione che stai scegliendo.
        fronts: match.phase === TEAM_DUEL_PHASES.RESPONSE_DEPLOY && session.role === 'response' && session.plan
          ? buildFronts(match, session.plan.pairing || PAIRINGS.DIRECT)
          : null,
      };
    }
    return {
      ...base,
      roundNumber: match.roundNumber,
      threshold: match.config.conquestThreshold,
      seats: match.seats,
      order: contestOrder(match),
      commits: match.commits,
      contestFieldIndex: match.contestFieldIndex,
      battlefields: match.battlefields,
      contestResult: match.contestResult,
      presentIndex: session.presentIndex ?? null,
      claim: match.claim,
      result: match.result,
    };
  }, [session]);

  return {
    /** La modalità a più posti controlla la scena (anche prima che i posti siano pronti). */
    isActive: Boolean(session),
    /** Il giocatore può scegliere Campo e Agente con i comandi nativi del duello. */
    acceptsHumanDeploy: session?.stage === MULTI_SEAT_STAGES.HUMAN_DEPLOY,
    /** Il giocatore può regolare i FC e confermare con il pannello FC del duello. */
    acceptsHumanConfirm: session?.stage === MULTI_SEAT_STAGES.HUMAN_DEPLOY,
    kind: session?.kind ?? null,
    stage: session?.stage ?? null,
    view,
    arm,
    cancel,
    onHumanConfirm,
    onScontroDone,
    setPlanPairing,
    decideClaim,
    handSeats,
    handViewFor,
    versus,
    advise,
  };
}

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
import { getSeatAIProfile, profileForDifficulty } from '../game/multiSeat/seatAI.js';
import { pickAiArmyDeck } from '../game/multiSeat/seatSetup.js';
import {
  PAIRINGS,
  TEAM_DUEL_CONFIG,
  TEAM_DUEL_PHASES,
  advanceAfterRound,
  buildFronts,
  createTeamDuelMatch,
  getSeat as getTeamSeat,
  resolveClaim as resolveTeamClaim,
  respondingTeam,
  submitOpeningDeploy,
  submitResponseDeploy,
  submitTeamPlan,
  teamFieldCount,
} from '../game/teamDuel/teamDuel.js';
import { aiInvestment, aiOpeningDeploy, aiResponseDeploy, aiTeamPlan, suggestPairing } from '../game/teamDuel/teamDuelAI.js';
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

/** Stadi del controllore (cosa sta facendo la scena). */
export const MULTI_SEAT_STAGES = {
  PENDING: 'pending', // in attesa della distribuzione delle carte del giocatore
  HUMAN_DEPLOY: 'humanDeploy', // il giocatore sceglie Campo/Agente/FC con i comandi del duello
  PLANNING: 'planning', // 2v2: piano segreto della squadra (pannello)
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

  const log = useCallback((line) => {
    gameState.setLogs?.((prev) => [...prev.slice(-200), line]);
  }, [gameState]);

  // ------------------------------------------------------------------
  // Proiezione di una coppia di posti nello stato 1v1 della scena
  // ------------------------------------------------------------------
  const project = useCallback((s, { playerSeatId, enemySeatId, playerHP, enemyHP, isPlayerFirst, conquered = null }) => {
    const gs = gameState;
    const match = s.match;
    const pSeat = seatOf(s, playerSeatId);
    const eSeat = seatOf(s, enemySeatId);
    sceneRef.current?.resetForProjection?.();
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
  const teamBeginTurn = useCallback((s) => {
    const rng = rngRef.current;
    let match = s.match;
    const hp = (team) => match.teams[team].hp;
    if (match.openingTeam === 'A') {
      const next = { ...s, match, stage: MULTI_SEAT_STAGES.HUMAN_DEPLOY, role: 'opening', plan: null };
      log(`[T${match.roundNumber}] 2v2 · Apre la tua squadra: scegli un Campo e un Agente.`);
      project(next, { playerSeatId: HUMAN_TEAM_SEAT, enemySeatId: 'B1', playerHP: hp('A'), enemyHP: hp('B'), isPlayerFirst: true });
      sceneRef.current?.setGamePhase('selectField');
      return;
    }
    commit({ ...s, match, stage: MULTI_SEAT_STAGES.AI_TURN, role: 'response', plan: null });
    sceneRef.current?.setGamePhase('selectField');
    later(() => {
      const d1 = aiOpeningDeploy(match, 'B1', rng);
      const d2 = aiOpeningDeploy(match, 'B2', rng, [d1.fieldIndex]);
      match = submitOpeningDeploy(match, { B1: d1, B2: d2 });
      const cur = sessionRef.current;
      const next = { ...cur, match, stage: MULTI_SEAT_STAGES.HUMAN_DEPLOY, role: 'response' };
      log(`[T${match.roundNumber}] 2v2 · Apre la squadra avversaria: ${match.battlefields[d1.fieldIndex].name} e ${match.battlefields[d2.fieldIndex].name}.`);
      project(next, { playerSeatId: HUMAN_TEAM_SEAT, enemySeatId: 'B1', playerHP: hp('A'), enemyHP: hp('B'), isPlayerFirst: false });
      // Il fronte di B1 resta in scena come riferimento; la disposizione si sceglie dopo.
      const b1Card = getTeamSeat(match, 'B1').hand.find((c) => c.id === d1.cardId);
      sceneRef.current?.showOpponentDeploy?.({ agent: b1Card, fieldIndex: d1.fieldIndex });
      sceneRef.current?.setGamePhase('selectAgent');
    });
  }, [commit, later, log, project, sceneRef]);

  const teamToPlanning = useCallback((s, match, proposedFocus) => {
    const rng = rngRef.current;
    const isResponse = respondingTeam(match) === 'A';
    const human = getTeamSeat(match, HUMAN_TEAM_SEAT);
    const range = legalFocusRange(human);
    const own = Math.max(range.min, Math.min(range.max, proposedFocus || 1));
    const draftInvestments = { [HUMAN_TEAM_SEAT]: own, A2: aiInvestment(match, 'A2', rng) };
    const pairing = isResponse ? suggestPairing(match, 'A', draftInvestments) : null;
    if (isResponse) {
      const opp = buildFronts(match, pairing).find((f) => f.secondSeatId === 'A2')?.firstSeatId;
      draftInvestments.A2 = aiInvestment(match, 'A2', rng, { opponentSeatId: opp });
    }
    commit({
      ...s,
      match,
      stage: MULTI_SEAT_STAGES.PLANNING,
      plan: { investments: draftInvestments, pairing, suggestedPairing: pairing, range },
    });
  }, [commit]);

  const teamHumanConfirm = useCallback((s, { agent, focus, fieldIndex }) => {
    const rng = rngRef.current;
    let match = s.match;
    try {
      if (s.role === 'opening') {
        const a2 = aiOpeningDeploy(match, 'A2', rng, [fieldIndex]);
        match = submitOpeningDeploy(match, { A1: { cardId: agent.id, fieldIndex }, A2: a2 });
        const b1 = aiResponseDeploy(match, 'B1', rng);
        const b2 = aiResponseDeploy(match, 'B2', rng);
        match = submitResponseDeploy(match, { B1: b1, B2: b2 });
      } else {
        const a2 = aiResponseDeploy(match, 'A2', rng);
        match = submitResponseDeploy(match, { A1: { cardId: agent.id }, A2: a2 });
      }
    } catch (err) {
      sceneRef.current?.hint?.(err.message);
      return;
    }
    teamToPlanning(s, match, focus);
  }, [sceneRef, teamToPlanning]);

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
    });
  }, [commit, project, sceneRef]);

  const teamSubmitPlan = useCallback((ownFocus = null) => {
    const s = sessionRef.current;
    if (!s || s.stage !== MULTI_SEAT_STAGES.PLANNING) return;
    const rng = rngRef.current;
    let match = s.match;
    const roundStartMatch = match;
    const investments = { ...s.plan.investments };
    if (Number.isFinite(ownFocus)) investments[HUMAN_TEAM_SEAT] = ownFocus;
    try {
      const isResponse = respondingTeam(match) === 'A';
      match = submitTeamPlan(match, 'A', {
        investments,
        ...(isResponse ? { pairing: s.plan.pairing } : {}),
      });
      match = submitTeamPlan(match, 'B', aiTeamPlan(match, 'B', rng));
    } catch (err) {
      sceneRef.current?.hint?.(err.message);
      return;
    }
    const rr = match.roundResult;
    log(`[T${rr.roundNumber}] 2v2 · Disposizione ${rr.pairing === PAIRINGS.CROSSED ? 'incrociata' : 'diretta'} rivelata.`);
    const next = { ...s, match, roundStartMatch, plan: null };
    teamPresentFront(next, 0);
  }, [log, sceneRef, teamPresentFront]);

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
    later(() => {
      const cur = sessionRef.current;
      if (!cur || cur.stage === MULTI_SEAT_STAGES.OVER) return;
      const choice = aiCommit(cur.match, committer, rng);
      const m2 = submitCommit(cur.match, committer, choice);
      const seat = getKothSeat(m2, committer);
      const card = seat.hand.find((c) => c.id === choice.cardId);
      const fieldName = m2.battlefields[m2.contestFieldIndex]?.name;
      log(`[C${m2.roundNumber}] ${seat.name} posa ${card?.name}${choice.fieldIndex != null ? ` su ${fieldName}` : ''}.`);
      kothRunCommitsRef.current({ ...cur, match: m2 });
    });
  }, [commit, kothPresentFight, later, log, project, sceneRef]);
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
        createSeat({ id: 'A2', name: `${preset.name} · ${mate.army}`, team: 'A', army: mate.army, hand: mate.hand, focus: TEAM_DUEL_CONFIG.startFocus, aiProfile: preset.id, deckKey: mate.deckKey }),
        createSeat({ id: 'B1', name: firstEnemyArmy, team: 'B', army: firstEnemyArmy, hand: enemyHand, focus: TEAM_DUEL_CONFIG.startFocus, aiProfile: enemyProfile }),
        createSeat({ id: 'B2', name: foe.army, team: 'B', army: foe.army, hand: foe.hand, focus: TEAM_DUEL_CONFIG.startFocus, aiProfile: enemyProfile, deckKey: foe.deckKey }),
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
      createSeat({ id: 'P2', name: firstEnemyArmy, army: firstEnemyArmy, hand: enemyHand, focus: KOTH_CONFIG.startFocus, aiProfile: enemyProfile }),
    ];
    for (let i = 3; i <= players; i += 1) {
      const pick = extra();
      seats.push(createSeat({ id: `P${i}`, name: pick.army, army: pick.army, hand: pick.hand, focus: KOTH_CONFIG.startFocus, aiProfile: enemyProfile, deckKey: pick.deckKey }));
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
    commit({
      kind: options.kind,
      options,
      pending: true,
      stage: MULTI_SEAT_STAGES.PENDING,
      match: null,
      seed,
      firstEnemy: { army: first.army, deckKey: first.deckKey },
      extras,
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
    // 2v2: nel piano il pulsante di conferma del duello blocca il piano con i FC del pannello FC.
    if (s.stage === MULTI_SEAT_STAGES.PLANNING) {
      teamSubmitPlan(choice?.focus);
      return true;
    }
    if (s.stage !== MULTI_SEAT_STAGES.HUMAN_DEPLOY) return false;
    if (s.kind === MULTI_SEAT_KINDS.TEAM) teamHumanConfirm(s, choice);
    else kothHumanConfirm(s, choice);
    return true;
  }, [teamHumanConfirm, kothHumanConfirm, teamSubmitPlan]);

  const onScontroDone = useCallback(() => {
    const s = sessionRef.current;
    if (!s || s.stage !== MULTI_SEAT_STAGES.PRESENTING) return;
    if (s.kind === MULTI_SEAT_KINDS.TEAM) teamAfterScontro(s);
    else kothAfterScontro(s);
  }, [teamAfterScontro, kothAfterScontro]);

  const setPlanInvestment = useCallback((value) => {
    const s = sessionRef.current;
    if (!s?.plan) return;
    const { min, max } = s.plan.range;
    const v = Math.max(min, Math.min(max, Math.round(value)));
    commit({ ...s, plan: { ...s.plan, investments: { ...s.plan.investments, [HUMAN_TEAM_SEAT]: v } } });
  }, [commit]);

  const setPlanPairing = useCallback((pairing) => {
    const s = sessionRef.current;
    if (!s?.plan || respondingTeam(s.match) !== 'A') return;
    const opp = buildFronts(s.match, pairing).find((f) => f.secondSeatId === 'A2')?.firstSeatId;
    const a2 = aiInvestment(s.match, 'A2', rngRef.current, { opponentSeatId: opp });
    commit({ ...s, plan: { ...s.plan, pairing, investments: { ...s.plan.investments, A2: a2 } } });
  }, [commit]);

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
      const preset = getSeatAIProfile(session.options.teammatePreset);
      return {
        playerAllies: mate ? [{ identity: { eyebrow: 'Compagno IA', name: preset.name, sub: mate.army }, deck: deckOf(mate) }] : [],
        enemyAllies: foe ? [{ identity: { eyebrow: 'Avversario IA', name: foe.army, sub: null }, deck: deckOf(foe) }] : [],
      };
    }
    return {
      playerAllies: [],
      enemyAllies: session.extras.map((x) => ({ identity: { eyebrow: 'Sfidante IA', name: x.army, sub: null }, deck: deckOf(x) })),
    };
  }, [session?.extras, session?.kind, session?.options]);

  /** Dati in sola lettura per mostrare la mano di un posto in un triangolo. */
  const handViewFor = useCallback((seatId, side) => {
    const s = sessionRef.current;
    const seat = seatOf(s, seatId);
    if (!seat) return null;
    const outcomes = {};
    const all = outcomesFor(s, side === 'player' ? seatId : null, side === 'enemy' ? seatId : null);
    Object.assign(outcomes, all);
    return { seatId, name: seat.name, hand: seat.hand, usedCards: seat.usedCardIds, outcomes, armyBonuses: seat.armyBonuses || {} };
  }, []);

  const view = useMemo(() => {
    if (!session) return null;
    const match = session.match;
    const base = {
      kind: session.kind,
      stage: session.stage,
      role: session.role || null,
      plan: session.plan || null,
      projection: session.projection || null,
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
        fronts: match.phase === TEAM_DUEL_PHASES.PLANNING && session.plan
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
    acceptsHumanConfirm: session?.stage === MULTI_SEAT_STAGES.HUMAN_DEPLOY || session?.stage === MULTI_SEAT_STAGES.PLANNING,
    kind: session?.kind ?? null,
    stage: session?.stage ?? null,
    view,
    arm,
    cancel,
    onHumanConfirm,
    onScontroDone,
    setPlanInvestment,
    setPlanPairing,
    submitPlan: teamSubmitPlan,
    decideClaim,
    handSeats,
    handViewFor,
    versus,
  };
}

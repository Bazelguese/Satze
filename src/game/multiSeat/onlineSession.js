// ============================================
// MULTIPLAYER A PIÙ POSTI (2v2, Re della collina) — sessione online, logica pura.
//
// Modello (vedi Documentazione/PIANO_MULTIPLAYER_MULTIPOSTO.md):
//  - l'host crea un pacchetto di partita con seme (posti, mani, Campi, ordine);
//  - ogni client costruisce la partita dalla propria prospettiva e applica le stesse voci di
//    log nello stesso ordine: il motore è deterministico, quindi gli stati coincidono;
//  - i giocatori mandano le proprie decisioni (intent) all'host; il SEQUENCER dell'host le
//    valida sulla partita canonica, fa decidere l'IA nei posti senza giocatore e pubblica le
//    voci di log numerate. Online si sincronizzano solo decisioni concrete, mai l'rng.
// ============================================

import { ALL_AGENTS } from '../../data/cards.js';
import { ALL_BATTLEFIELDS } from '../../data/battlefields.js';
import { mulberry32, shuffleArraySeeded } from '../../utils/seededRandom.js';
import { selectBattlefields } from '../fieldLogic.js';
import { createSeat, dealHand } from './multiSeatCore.js';
import { pickAiArmyDeck, resolveDeckCards } from './seatSetup.js';
import { getSeatAIProfile, profileForDifficulty } from './seatAI.js';
import {
  TEAM_DUEL_CONFIG, TEAM_DUEL_PHASES, PAIRINGS, createTeamDuelMatch, submitOpeningDeploy, submitResponseDeploy,
  advanceAfterRound, resolveClaim as resolveTeamClaim, teamSeats, respondingTeam, legalFieldIndexes as teamLegalFields,
} from '../teamDuel/teamDuel.js';
import {
  KOTH_CONFIG, KOTH_PHASES, createKothMatch, submitCommit, advanceAfterContest, resolveClaim as resolveKothClaim,
  currentCommitter, openerSeatId,
} from '../kingOfHill/kingOfHill.js';
import { aiOpeningDeploy, aiResponsePlan } from '../teamDuel/teamDuelAI.js';
import { aiCommit } from '../kingOfHill/kingOfHillAI.js';

export const ONLINE_PROTO = 1;
export const MULTI_KINDS = { TEAM: 'teamDuel', KOTH: 'kingOfHill' };

/** Messaggi applicativi del multi-posto, dentro il `relay` del server. */
export const MS = {
  LOBBY: 'ms_lobby', // host → tutti: configurazione della stanza
  READY: 'ms_ready', // ospite → host: armata, esercito, pronto
  START: 'ms_start', // host → tutti: pacchetto di partita
  INTENT: 'ms_intent', // controllore → host: decisione di uno o più posti
  LOG: 'ms_log', // host → tutti: voce di log numerata
  REJECT: 'ms_reject', // host → mittente: decisione non valida
  RESYNC_REQ: 'ms_resync_req', // client → host: mi mancano voci
  RESYNC: 'ms_resync', // host → client: pacchetto + log completo
};

export const ENTRY = { OPEN: 'td_open', RESPOND: 'td_respond', COMMIT: 'koth_commit', CLAIM: 'claim' };

const cartaPerId = new Map(ALL_AGENTS.map((c) => [c.id, c]));
const campoPerId = new Map(ALL_BATTLEFIELDS.map((f) => [f.id, f]));

/** Posti del 2v2 nell'ordine in cui li riempiono gli ospiti (host A1, poi B1, A2, B2). */
export const TEAM_SEAT_ORDER = ['A1', 'B1', 'A2', 'B2'];
export const KOTH_SEAT_IDS = ['P1', 'P2', 'P3', 'P4'];

/** Mappa di default posto → slot del server (null = IA). */
export function defaultSeatMap(kind, humanSlots, players = 4) {
  const ids = kind === MULTI_KINDS.TEAM ? TEAM_SEAT_ORDER : KOTH_SEAT_IDS.slice(0, players);
  const map = {};
  ids.forEach((id, i) => { map[id] = humanSlots[i] ?? null; });
  return map;
}

/**
 * Pacchetto di partita (solo l'host). `readies`: giocatori umani pronti
 * [{ slot, name, army, deckKey, deckCardIds }]. Deterministico dato il seme.
 */
export function buildMatchPackage(config, readies, seed) {
  const rng = mulberry32(seed >>> 0);
  const kind = config.kind;
  const fieldMode = config.fieldMode === 'bareHands' ? 'bareHands' : 'classic';
  const players = kind === MULTI_KINDS.TEAM ? 4 : (config.players === 4 ? 4 : 3);
  const seatMap = config.seatMap || defaultSeatMap(kind, readies.map((r) => r.slot), players);
  const perSlot = new Map(readies.map((r) => [r.slot, r]));
  const ids = kind === MULTI_KINDS.TEAM ? ['A1', 'A2', 'B1', 'B2'] : KOTH_SEAT_IDS.slice(0, players);
  const prese = readies.map((r) => r.army).filter(Boolean);
  const enemyProfile = profileForDifficulty(config.difficulty || 'medium');
  const mateProfile = getSeatAIProfile(config.teammatePreset).id;
  let nIA = 0;

  const seats = ids.map((id) => {
    const team = kind === MULTI_KINDS.TEAM ? id[0] : null;
    const slot = seatMap[id];
    const umano = slot != null ? perSlot.get(slot) : null;
    if (umano) {
      const deck = (umano.deckCardIds || []).map((cid) => cartaPerId.get(cid)).filter(Boolean);
      const deckCards = deck.length ? deck : resolveDeckCards(umano.army, umano.deckKey);
      const hand = dealHand(deckCards, rng);
      return {
        id, team, name: umano.name || `Giocatore ${slot + 1}`, army: umano.army, deckKey: umano.deckKey ?? null,
        handIds: hand.map((c) => c.id), controller: { type: 'human', slot },
      };
    }
    const ai = pickAiArmyDeck(prese, rng);
    prese.push(ai.army);
    nIA += 1;
    // Il compagno IA di un umano usa il carattere scelto; gli altri la difficoltà.
    const compagnoDiUmano = kind === MULTI_KINDS.TEAM
      && ids.some((x) => x !== id && x[0] === team && seatMap[x] != null && perSlot.has(seatMap[x]));
    return {
      id, team, name: `IA ${nIA}`, army: ai.army, deckKey: ai.deckKey,
      handIds: ai.hand.map((c) => c.id),
      controller: { type: 'ai', profile: compagnoDiUmano ? mateProfile : enemyProfile },
    };
  });

  const fieldCount = kind === MULTI_KINDS.TEAM ? TEAM_DUEL_CONFIG.fieldCount : KOTH_CONFIG.fieldCount;
  const battlefields = selectBattlefields(fieldMode, ALL_BATTLEFIELDS, {
    rng,
    fieldCount,
    ...(kind === MULTI_KINDS.TEAM ? { selectionConfig: { REVEAL_START: TEAM_DUEL_CONFIG.revealStart } } : {}),
  });
  const initialOrder = kind === MULTI_KINDS.KOTH ? shuffleArraySeeded(ids, rng) : null;

  return {
    proto: ONLINE_PROTO,
    kind,
    fieldMode,
    seed: seed >>> 0,
    battlefieldIds: battlefields.map((f) => f.id),
    initialOrder,
    seats,
  };
}

/** Posto controllato da questo slot (null se nessuno: spettatore). */
export function seatOfSlot(pkg, slot) {
  return pkg.seats.find((s) => s.controller.type === 'human' && s.controller.slot === slot)?.id ?? null;
}

/** Partita dal pacchetto, vista dal posto `localSeatId` (per la proprietà di prospettiva il risultato non cambia). */
export function matchFromPackage(pkg, localSeatId = null) {
  const startFocus = pkg.kind === MULTI_KINDS.TEAM ? TEAM_DUEL_CONFIG.startFocus : KOTH_CONFIG.startFocus;
  const seats = pkg.seats.map((s) => createSeat({
    id: s.id,
    name: s.name,
    isHuman: s.controller.type === 'human',
    army: s.army,
    team: s.team,
    aiProfile: s.controller.type === 'ai' ? s.controller.profile : null,
    deckKey: s.deckKey,
    hand: s.handIds.map((id) => cartaPerId.get(id)).filter(Boolean),
    focus: startFocus,
  }));
  const battlefields = pkg.battlefieldIds.map((id) => ({ ...campoPerId.get(id) }));
  const rng = mulberry32(pkg.seed);
  if (pkg.kind === MULTI_KINDS.TEAM) {
    const localTeam = pkg.seats.find((s) => s.id === localSeatId)?.team ?? null;
    return createTeamDuelMatch({ seats, battlefields, rng, seed: pkg.seed, mode: pkg.fieldMode, perspectiveTeam: localTeam });
  }
  return createKothMatch({
    seats, battlefields, rng, seed: pkg.seed, mode: pkg.fieldMode,
    initialOrder: pkg.initialOrder, perspectiveSeatId: localSeatId,
  });
}

/** Applica una voce di log (decisione). Non fa avanzare oltre RESOLVED: la presentazione viene prima. */
export function applyEntry(match, entry) {
  switch (entry.type) {
    case ENTRY.OPEN: return submitOpeningDeploy(match, entry.deployments);
    case ENTRY.RESPOND: return submitResponseDeploy(match, entry.deployments, entry.pairing);
    case ENTRY.COMMIT: return submitCommit(match, entry.seatId, { cardId: entry.cardId, investment: entry.investment, fieldIndex: entry.fieldIndex ?? null });
    case ENTRY.CLAIM: return match.mode === MULTI_KINDS.TEAM ? resolveTeamClaim(match, entry.decision) : resolveKothClaim(match, entry.decision);
    default: throw new Error(`Voce di log sconosciuta: ${entry.type}`);
  }
}

/** Dopo la presentazione di un turno/contesa (deterministico, ogni client lo fa da sé). */
export function advanceIfResolved(match) {
  if (match.mode === MULTI_KINDS.TEAM && match.phase === TEAM_DUEL_PHASES.RESOLVED) return advanceAfterRound(match);
  if (match.mode === MULTI_KINDS.KOTH && match.phase === KOTH_PHASES.RESOLVED) return advanceAfterContest(match);
  return match;
}

function djb2(text) {
  let h = 5381;
  for (let i = 0; i < text.length; i += 1) h = ((h * 33) ^ text.charCodeAt(i)) >>> 0;
  return h.toString(16);
}

/** Impronta dello stato indipendente dalla prospettiva: due client allineati hanno la stessa. */
export function stateHash(match) {
  const core = {
    round: match.roundNumber,
    phase: match.phase,
    teams: match.teams ? { A: match.teams.A.hp, B: match.teams.B.hp } : null,
    seats: match.seats.map((s) => [s.id, s.focus, s.hp, [...s.usedCardIds].sort(), s.toxin ? [s.toxin.value, s.toxin.minHealth] : null,
      s.previousResult, s.conquests, s.eliminated]),
    conquered: Object.keys(match.conqueredFields).sort().map((k) => [k, match.conqueredFields[k]]),
    revealed: match.revealedFields,
    result: match.result ?? null,
  };
  return djb2(JSON.stringify(core));
}

/** Chi deve decidere adesso: { kind, seatIds, team?, claimBy? } oppure null (nessuna decisione attesa). */
export function requiredDecision(match) {
  if (match.mode === MULTI_KINDS.TEAM) {
    if (match.phase === TEAM_DUEL_PHASES.OPENING_DEPLOY) {
      return { kind: ENTRY.OPEN, team: match.openingTeam, seatIds: teamSeats(match, match.openingTeam).map((s) => s.id) };
    }
    if (match.phase === TEAM_DUEL_PHASES.RESPONSE_DEPLOY) {
      const team = respondingTeam(match);
      return { kind: ENTRY.RESPOND, team, seatIds: teamSeats(match, team).map((s) => s.id) };
    }
    if (match.phase === TEAM_DUEL_PHASES.CLAIM) {
      return { kind: ENTRY.CLAIM, team: match.claim.team, seatIds: teamSeats(match, match.claim.team).map((s) => s.id) };
    }
    return null;
  }
  if (match.phase === KOTH_PHASES.COMMITS) {
    const seatId = currentCommitter(match);
    return seatId ? { kind: ENTRY.COMMIT, seatIds: [seatId], opener: seatId === openerSeatId(match) } : null;
  }
  if (match.phase === KOTH_PHASES.CLAIM) return { kind: ENTRY.CLAIM, seatIds: [match.claim.seatId] };
  return null;
}

/**
 * Sequencer dell'host: partita canonica, decisioni in arrivo, IA dei posti senza giocatore.
 * `receive` e `pump` restituiscono le nuove voci di log da trasmettere a tutti (host compreso).
 */
export class HostSequencer {
  constructor(pkg, { rng = mulberry32((pkg.seed ^ 0x5eed) >>> 0) } = {}) {
    this.pkg = pkg;
    this.match = matchFromPackage(pkg, null);
    this.rng = rng;
    this.log = [];
    this.pending = {}; // decisioni parziali del turno: { [seatId]: deployment }, pairing, claim
    this.controllers = Object.fromEntries(pkg.seats.map((s) => [s.id, s.controller]));
  }

  slotOf(seatId) {
    const c = this.controllers[seatId];
    return c?.type === 'human' ? c.slot : null;
  }

  /** Primo umano della squadra (decide la disposizione e il reclamo), o null se la squadra è tutta IA. */
  captainSlot(seatIds) {
    for (const id of seatIds) {
      const slot = this.slotOf(id);
      if (slot != null) return slot;
    }
    return null;
  }

  /** Decisione di un giocatore. Errore (con messaggio) se non è valida ora. */
  receive(fromSlot, intent) {
    const req = requiredDecision(this.match);
    if (!req) throw new Error('Nessuna decisione attesa adesso');
    if (intent.round !== this.match.roundNumber) throw new Error('Turno sbagliato');
    if (intent.kind !== req.kind) throw new Error('Fase sbagliata');
    if (req.kind === ENTRY.CLAIM) {
      if (this.captainSlot(req.seatIds) !== fromSlot) throw new Error('Non tocca a te reclamare');
      this.pending.claim = intent.decision;
      return this.pump();
    }
    for (const [seatId, choice] of Object.entries(intent.deployments || {})) {
      if (!req.seatIds.includes(seatId)) throw new Error(`Il posto ${seatId} non deve decidere ora`);
      if (this.slotOf(seatId) !== fromSlot) throw new Error(`Il posto ${seatId} non è tuo`);
      if (req.kind === ENTRY.OPEN) {
        const preso = Object.entries(this.pending.deployments || {})
          .some(([id, d]) => id !== seatId && d.fieldIndex === choice.fieldIndex);
        if (preso) throw new Error('Campo già scelto dal compagno');
        if (!teamLegalFields(this.match).includes(choice.fieldIndex)) throw new Error('Campo non disponibile');
      }
      this.pending.deployments = { ...(this.pending.deployments || {}), [seatId]: choice };
    }
    if (req.kind === ENTRY.RESPOND && intent.pairing && this.captainSlot(req.seatIds) === fromSlot) {
      this.pending.pairing = intent.pairing;
    }
    return this.pump();
  }

  /** Completa con l'IA ciò che manca e applica le decisioni complete. Ripete finché serve un umano. */
  pump() {
    const nuove = [];
    for (let guard = 0; guard < 50; guard += 1) {
      const req = requiredDecision(this.match);
      if (!req) break;
      const entry = this.tryBuild(req);
      if (!entry) break;
      this.pending = {};
      this.match = advanceIfResolved(applyEntry(this.match, entry));
      const voce = { seq: this.log.length + 1, entry, hash: stateHash(this.match) };
      this.log.push(voce);
      nuove.push(voce);
    }
    return nuove;
  }

  tryBuild(req) {
    const m = this.match;
    const round = m.roundNumber;
    if (req.kind === ENTRY.CLAIM) {
      if (this.captainSlot(req.seatIds) == null) return { type: ENTRY.CLAIM, round, decision: 'claim' }; // IA: reclama sempre
      return this.pending.claim ? { type: ENTRY.CLAIM, round, decision: this.pending.claim } : null;
    }
    if (req.kind === ENTRY.COMMIT) {
      const seatId = req.seatIds[0];
      if (this.slotOf(seatId) != null) {
        const d = this.pending.deployments?.[seatId];
        return d ? { type: ENTRY.COMMIT, round, seatId, cardId: d.cardId, investment: d.investment, fieldIndex: req.opener ? d.fieldIndex : null } : null;
      }
      const ai = aiCommit(m, seatId, this.rng);
      return { type: ENTRY.COMMIT, round, seatId, ...ai, fieldIndex: req.opener ? ai.fieldIndex : null };
    }
    const deployments = { ...(this.pending.deployments || {}) };
    const umaniMancanti = req.seatIds.filter((id) => this.slotOf(id) != null && !deployments[id]);
    if (umaniMancanti.length) return null;
    if (req.kind === ENTRY.OPEN) {
      for (const id of req.seatIds) {
        if (deployments[id]) continue;
        const prese = Object.values(deployments).map((d) => d.fieldIndex);
        const ai = aiOpeningDeploy(m, id, this.rng, prese);
        deployments[id] = { cardId: ai.cardId, fieldIndex: ai.fieldIndex, focus: ai.focus };
      }
      return { type: ENTRY.OPEN, round, deployments };
    }
    // Risposta: la disposizione la sceglie il capitano umano; senza umani la sceglie l'IA.
    const capitano = this.captainSlot(req.seatIds);
    if (capitano != null && !this.pending.pairing) return null;
    const fixedCards = {};
    const fixedInvestments = {};
    for (const [id, d] of Object.entries(deployments)) { fixedCards[id] = d.cardId; fixedInvestments[id] = d.focus; }
    const plan = aiResponsePlan(m, req.team, this.rng, {
      fixedCards, fixedInvestments, fixedPairing: this.pending.pairing ?? null,
    });
    return { type: ENTRY.RESPOND, round, deployments: plan.deployments, pairing: plan.pairing ?? PAIRINGS.DIRECT };
  }
}

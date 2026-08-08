// ============================================
// STATO DELLA RUN CAMPAGNA + REDUCER PURO
// Contratto: SPEC_PROTOTIPO_CAMPAGNA_CURSOR §3
//
// Le regole invarianti sono asserite QUI, non solo in UI:
// - deck ≤ 10 carte, somma Lega ≤ 30, nessun duplicato, Nascente non rimovibile
// - day ≤ daysLimit; oltre → esito 'tempo_scaduto'
// - Faglie attive ≤ maxActiveFaglie
// - la Lega del Nascente non si scrive mai: è derivata (nascente.js)
// ============================================

import { ARMY_SETS } from '../../data/cards.js';
import {
  NASCENTE_ID,
  createNascente,
  acquire,
  upgradeEffect,
  upgradeStats,
  lega,
} from '../logic/nascente.js';
import { advanceDay, collectDayEvents } from '../logic/dayCycle.js';

export const DECK_MAX_CARDS = 10;
export const DECK_MAX_LEAGUE = 30;

// ---- lookup carte -------------------------------------------------------

const CARD_INDEX = new Map();
for (const [army, list] of Object.entries(ARMY_SETS)) {
  for (const c of list) CARD_INDEX.set(c.id, { ...c, army: c.army || army });
}

/** Carta reale dal pool (null per il Nascente: vive nello stato della run). */
export function poolCardById(id) {
  return CARD_INDEX.get(id) || null;
}

/** Somma Lega del mazzo: carte del pool + Nascente derivato. */
export function deckTotalLeague(deck, nascente) {
  return deck.reduce((sum, id) => {
    if (id === NASCENTE_ID) return sum + lega(nascente);
    return sum + (poolCardById(id)?.league ?? 0);
  }, 0);
}

/**
 * Controlli STRUTTURALI del mazzo (sempre obbligatori).
 */
export function validateDeckStructure(deck, nascente) {
  const errors = [];
  if (!Array.isArray(deck)) return { ok: false, errors: ['mazzo non valido'] };
  if (!deck.includes(NASCENTE_ID)) errors.push('il Nascente non è rimovibile dal mazzo');
  if (deck.length > DECK_MAX_CARDS) errors.push(`mazzo oltre le ${DECK_MAX_CARDS} carte`);
  if (new Set(deck).size !== deck.length) errors.push('carte duplicate nel mazzo');
  for (const id of deck) {
    if (id !== NASCENTE_ID && !poolCardById(id)) errors.push(`carta ${id} inesistente nel pool`);
  }
  return { ok: errors.length === 0, errors };
}

/**
 * Valida il mazzo contro TUTTE le invarianti (struttura + Lega ≤ 30).
 * Nota: la crescita del Nascente può portare la Lega oltre il limite —
 * lo stato resta valido ma la partenza in missione è bloccata finché
 * il mazzo non viene aggiustato (vedi START_MISSION).
 */
export function validateDeck(deck, nascente) {
  const structure = validateDeckStructure(deck, nascente);
  const errors = [...structure.errors];
  const league = deckTotalLeague(deck, nascente);
  if (league > DECK_MAX_LEAGUE) errors.push(`Lega totale ${league} oltre il limite ${DECK_MAX_LEAGUE}`);
  return { ok: errors.length === 0, errors };
}

/** La Lega del mazzo corrente è nel limite? */
export function isDeckLeagueValid(run) {
  return deckTotalLeague(run.deck, run.nascente) <= DECK_MAX_LEAGUE;
}

// ---- creazione run ------------------------------------------------------

/**
 * Crea una run nuova per l'Atto.
 * @param {Object} act - dati dichiarativi (atto1.js)
 * @param {{deck?: number[], seed?: number}} [opts] - mazzo iniziale (Nascente sempre incluso)
 */
export function createCampaignRun(act, opts = {}) {
  const nodes = {};
  for (const n of act.nodes) {
    nodes[n.id] = (n.requires || []).length === 0 && n.type !== 'faglia' ? 'available' : 'locked';
  }
  const nascente = createNascente(act.nascente?.startStats);
  const companions = act.companions || [];
  const deck = opts.deck || [NASCENTE_ID, ...companions.slice(0, 2)];
  const warehouse = companions.filter((id) => !deck.includes(id));
  const run = {
    version: 1,
    actId: act.id,
    day: 1,
    daysLimit: act.dayLimit,
    nodes,
    currentNode: null,
    faglie: [],
    nascente,
    deck,
    warehouse,
    flags: {},
    history: [],
    pendingEvents: [],
    eventsSeen: [],
    outcome: null, // null | 'won' | 'tempo_scaduto'
    seed: opts.seed ?? Math.floor(Math.random() * 2 ** 31),
    savedAt: null,
  };
  assertRunInvariants(run, act);
  return run;
}

// ---- invarianti -----------------------------------------------------------

/**
 * Asserisce le invarianti della run. Lancia in caso di violazione.
 * La Lega del mazzo NON è un'invariante di stato (può sforare dopo una
 * crescita del Nascente): è un prerequisito di partenza missione.
 */
export function assertRunInvariants(run, act) {
  const deckCheck = validateDeckStructure(run.deck, run.nascente);
  if (!deckCheck.ok) throw new Error(`Invariante mazzo violata: ${deckCheck.errors.join('; ')}`);
  if (run.day > run.daysLimit && run.outcome !== 'tempo_scaduto' && run.outcome !== 'won') {
    throw new Error(`Invariante giorni violata: day ${run.day} > limite ${run.daysLimit} senza esito`);
  }
  const maxFaglie = act?.maxActiveFaglie ?? 2;
  if (run.faglie.length > maxFaglie) {
    throw new Error(`Invariante Faglie violata: ${run.faglie.length} attive (max ${maxFaglie})`);
  }
  if (Object.prototype.hasOwnProperty.call(run.nascente, 'league')) {
    throw new Error('Invariante Nascente violata: la Lega non si memorizza, si deriva');
  }
}

// ---- selettori ------------------------------------------------------------

export function isRunOver(run) {
  return run.outcome != null;
}

export function nodeById(act, nodeId) {
  return act.nodes.find((n) => n.id === nodeId) || null;
}

/** Nodi faglia liberi (slot senza faglia attiva). */
export function freeFagliaNodes(act, run) {
  const occupied = new Set(run.faglie.map((f) => f.nodeId));
  return act.nodes.filter((n) => n.type === 'faglia' && !occupied.has(n.id));
}

// ---- eventi -----------------------------------------------------------------

/** Eventi pendenti dopo una missione (trigger afterMission + finestra giorni). */
export function collectAfterMissionEvents(act, run, missionId) {
  return (act.events || [])
    .filter((ev) => ev.trigger?.type === 'afterMission' && ev.trigger.mission === missionId)
    .filter((ev) => !run.eventsSeen.includes(ev.id))
    .filter((ev) => !ev.window || (run.day >= ev.window[0] && run.day <= ev.window[1]))
    .map((ev) => ev.id);
}

function applyEventEffect(run, effect) {
  let next = { ...run };
  const n = effect?.nascente;
  if (n?.acquire) {
    next.nascente = acquire(next.nascente, n.acquire.trigger, n.acquire.effect, n.acquire.value ?? 1);
  }
  if (n?.upgrade) {
    next.nascente = upgradeEffect(next.nascente, n.upgrade);
  }
  if (n?.stats) {
    next.nascente = upgradeStats(next.nascente, n.stats);
  }
  if (effect?.flags) {
    next.flags = { ...next.flags, ...effect.flags };
  }
  if (Array.isArray(effect?.warehouseCards)) {
    const wh = new Set(next.warehouse);
    for (const id of effect.warehouseCards) if (!next.deck.includes(id)) wh.add(id);
    next.warehouse = [...wh];
  }
  return next;
}

/**
 * Anteprima di una scelta evento: Lega del mazzo DOPO l'effetto sul Nascente.
 * Serve alla UI per segnalare lo sforamento del cap PRIMA della conferma
 * e per mostrare lo stato simulato del Nascente (EvolutionPanel).
 * @returns {{ league: number, leagueOk: boolean, nascenteLeague: number, nascente: Object }}
 */
export function previewEventChoiceLeague(run, effect) {
  const simulated = applyEventEffect(run, effect);
  const league = deckTotalLeague(simulated.deck, simulated.nascente);
  return {
    league,
    leagueOk: league <= DECK_MAX_LEAGUE,
    nascenteLeague: lega(simulated.nascente),
    nascente: simulated.nascente,
  };
}

// ---- reducer ---------------------------------------------------------------

/**
 * Reducer puro della run. Ogni azione restituisce una NUOVA run
 * e asserisce le invarianti in uscita.
 *
 * Azioni:
 *  - { type: 'START_MISSION', nodeId }
 *  - { type: 'APPLY_DUEL_RESULT', missionId, nodeId, winner: 'player'|'enemy'|'draw' }
 *  - { type: 'APPLY_EVENT_CHOICE', eventId, choiceIndex }
 *  - { type: 'SET_DECK', deck: number[] }
 *  - { type: 'END_DAY' } — passa il giorno senza missione (riposo/gestione)
 */
export function campaignReducer(run, action, act) {
  if (isRunOver(run) && action.type !== 'APPLY_EVENT_CHOICE') return run;
  let next;
  switch (action.type) {
    case 'START_MISSION': {
      if (run.nodes[action.nodeId] !== 'available') {
        throw new Error(`Nodo ${action.nodeId} non disponibile`);
      }
      if (!isDeckLeagueValid(run)) {
        throw new Error(
          `Mazzo oltre il limite di Lega (${deckTotalLeague(run.deck, run.nascente)}/${DECK_MAX_LEAGUE}): aggiustalo prima di partire`
        );
      }
      next = { ...run, currentNode: action.nodeId };
      break;
    }

    case 'APPLY_DUEL_RESULT': {
      const { missionId, nodeId, winner } = action;
      const node = nodeById(act, nodeId);
      if (!node) throw new Error(`Nodo ${nodeId} inesistente`);
      next = { ...run, currentNode: null };
      next.history = [...run.history, { day: run.day, missionId, result: winner }];

      if (winner === 'player') {
        const nodes = { ...next.nodes, [nodeId]: 'completed' };
        // §req-or: la disponibilità è guidata da unlocks — il primo completamento sblocca
        for (const u of node.unlocks || []) {
          if (nodes[u] === 'locked') nodes[u] = 'available';
        }
        next.nodes = nodes;
        // Ricompense missione → magazzino (solo la prima volta)
        const mission = (act.missions || []).find((m) => m.id === missionId);
        const rewardCards = mission?.rewards?.warehouseCards || [];
        const alreadyWon = run.history.some((h) => h.missionId === missionId && h.result === 'player');
        if (rewardCards.length && !alreadyWon) {
          const owned = new Set([...next.deck, ...next.warehouse]);
          next.warehouse = [...next.warehouse, ...rewardCards.filter((id) => !owned.has(id))];
        }
        // Faglia chiusa: rimuovi e libera lo slot
        const faglia = next.faglie.find((f) => f.nodeId === nodeId);
        if (faglia) {
          next.faglie = next.faglie.filter((f) => f.id !== faglia.id);
          next.nodes = { ...next.nodes, [nodeId]: 'locked' };
        }
        if (node.type === 'boss') {
          next.outcome = 'won';
        }
      }
      // Sconfitta: NON è game over — il nodo resta disponibile, il giorno passa comunque.

      // Eventi post-missione SOLO in vittoria: la missione si può ritentare,
      // e l'evento arriva quando viene finalmente superata.
      // (Raccolti prima dell'avanzamento giorno: la finestra vale sul giorno corrente.)
      if (winner === 'player') {
        const evs = collectAfterMissionEvents(act, next, missionId);
        next.pendingEvents = [...next.pendingEvents, ...evs];
        next.eventsSeen = [...next.eventsSeen, ...evs];
      }

      // Le missioni consumano un giorno
      if (next.outcome !== 'won') {
        next = advanceDay(next, act);
      }
      break;
    }

    case 'APPLY_EVENT_CHOICE': {
      const ev = (act.events || []).find((e) => e.id === action.eventId);
      if (!ev) throw new Error(`Evento ${action.eventId} inesistente`);
      const choice = ev.choices?.[action.choiceIndex];
      if (!choice) throw new Error(`Scelta ${action.choiceIndex} inesistente per ${action.eventId}`);
      next = applyEventEffect(run, choice.effect);
      next.pendingEvents = next.pendingEvents.filter((id) => id !== action.eventId);
      // Il salto di Lega del Nascente può sforare il cap 30: la UI lo mostra
      // PRIMA di confermare; qui la violazione va comunque intercettata.
      break;
    }

    case 'SET_DECK': {
      const check = validateDeck(action.deck, run.nascente);
      if (!check.ok) throw new Error(`Mazzo non valido: ${check.errors.join('; ')}`);
      const inDeck = new Set(action.deck);
      const pool = new Set([...run.deck, ...run.warehouse].filter((id) => id !== NASCENTE_ID));
      for (const id of action.deck) {
        if (id !== NASCENTE_ID && !pool.has(id)) {
          throw new Error(`Carta ${id} non posseduta (né mazzo né magazzino)`);
        }
      }
      next = {
        ...run,
        deck: [...action.deck],
        warehouse: [...pool].filter((id) => !inDeck.has(id)),
      };
      break;
    }

    case 'END_DAY': {
      next = advanceDay({ ...run }, act);
      break;
    }

    default:
      throw new Error(`Azione sconosciuta: ${action.type}`);
  }

  assertRunInvariants(next, act);
  return next;
}

export { NASCENTE_ID, collectDayEvents };

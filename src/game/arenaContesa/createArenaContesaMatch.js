import { ARMY_SETS, ARMY_DECKS } from '../../data/cards.js';
import { ARMY_COLORS } from '../../data/armies.js';
import { ALL_BATTLEFIELDS } from '../../data/battlefields.js';
import { shuffleArray } from '../../utils/shuffle.js';
import { calcInitialBonuses } from '../../utils/onlineMatch.js';
import { ARENA_CONTESA, ARENA_PHASES, SEAT_NAMES } from './arenaContesaConstants.js';

const SEATS = ['A', 'B', 'C', 'D'];

function resolveDeckCards(army, deckKey) {
  const deck = ARMY_DECKS[army]?.[deckKey];
  if (!deck?.cards?.length) return null;
  return deck.cards
    .map((id) => {
      const card = ARMY_SETS[army]?.find((c) => c.id === id);
      return card ? { ...card, army } : null;
    })
    .filter(Boolean);
}

function pickRandomDeck(army) {
  const keys = Object.keys(ARMY_DECKS[army] || {});
  const key = keys[Math.floor(Math.random() * keys.length)] || 'A';
  return { key, cards: resolveDeckCards(army, key) || [] };
}

function handLeagueSum(hand) {
  return hand.reduce((sum, c) => sum + (c.league || 0), 0);
}

/**
 * Ordine call Giro 1: somma Lega mano — inizia chi ha la somma più BASSA (come useGameFlow).
 */
export function resolveCallOrderByLeague(players) {
  const ranked = players.map((p) => ({
    id: p.id,
    league: handLeagueSum(p.hand),
    tie: Math.random(),
  }));
  ranked.sort((a, b) => {
    if (a.league !== b.league) return a.league - b.league;
    return a.tie - b.tie;
  });
  return ranked.map((r) => r.id);
}

export function rotateCallOrder(order) {
  if (!order?.length) return order;
  return [...order.slice(1), order[0]];
}

function pushLog(logs, line) {
  return [...(logs || []).slice(-120), line];
}

/**
 * @param {{ humanArmy?: string, humanDeckKey?: string }} [options]
 */
export function createArenaContesaMatch(options = {}) {
  const armyNames = Object.keys(ARMY_SETS);
  const humanArmy =
    options.humanArmy && armyNames.includes(options.humanArmy)
      ? options.humanArmy
      : armyNames[Math.floor(Math.random() * armyNames.length)];

  const usedArmies = new Set([humanArmy]);
  const aiArmies = [];
  for (let i = 0; i < 3; i++) {
    const pool = armyNames.filter((a) => !usedArmies.has(a));
    const pick = pool[Math.floor(Math.random() * pool.length)] || armyNames[i % armyNames.length];
    usedArmies.add(pick);
    aiArmies.push(pick);
  }

  const armyBySeat = {
    A: humanArmy,
    B: aiArmies[0],
    C: aiArmies[1],
    D: aiArmies[2],
  };

  const players = SEATS.map((seat) => {
    const army = armyBySeat[seat];
    const isHuman = seat === 'A';
    const deckPick =
      isHuman && options.humanDeckKey
        ? { key: options.humanDeckKey, cards: resolveDeckCards(army, options.humanDeckKey) }
        : pickRandomDeck(army);
    const cards = shuffleArray([...(deckPick.cards || [])]).slice(0, ARENA_CONTESA.deckSize);
    // Se deck corto, riempi da ARMY_SETS
    while (cards.length < ARENA_CONTESA.deckSize) {
      const filler = ARMY_SETS[army]?.[cards.length];
      if (!filler) break;
      cards.push({ ...filler, army });
    }
    const hand = cards.slice(0, ARENA_CONTESA.handSize);
    const reserve = cards.slice(ARENA_CONTESA.handSize, ARENA_CONTESA.deckSize);
    return {
      id: seat,
      seat,
      name: SEAT_NAMES[seat] || seat,
      army,
      accent: ARMY_COLORS[army]?.accent || '#94a3b8',
      isHuman,
      hp: ARENA_CONTESA.maxHp,
      focus: ARENA_CONTESA.startFocus,
      hand,
      reserve,
      usedIds: [],
      substitutionsDone: 0,
      fieldsWon: 0,
      armyBonuses: calcInitialBonuses(hand),
      lastDuelOutcome: null,
      eliminated: false,
      deckKey: deckPick.key,
    };
  });

  const callOrder = resolveCallOrderByLeague(players);
  const callerId = callOrder[0];
  const fieldPool = shuffleArray([...ALL_BATTLEFIELDS]).slice(0, ARENA_CONTESA.fieldPoolSize);

  const leagueLines = players.map(
    (p) => `${p.name} Lega ${handLeagueSum(p.hand)}`
  );

  let logs = [
    'Arena Contesa v0.3 — partita Dev',
    `Armate: ${players.map((p) => `${p.seat} ${p.army}`).join(' · ')}`,
    `Iniziativa (Lega mano, più bassa prima): ${leagueLines.join(' | ')}`,
    `Ordine Call Giro 1: ${callOrder.map((id) => players.find((p) => p.id === id)?.name).join(' → ')}`,
    `Primo Chiamante: ${players.find((p) => p.id === callerId)?.name}`,
  ];

  return {
    phase: ARENA_PHASES.SCELTA_CAMPO,
    giro: 1,
    callIndexInGiro: 0,
    callOrder,
    localPlayerId: 'A',
    players,
    fieldPool,
    conqueredByFieldId: {},
    contestedFieldId: null,
    callerId,
    contestantId: null,
    responseQueue: [],
    responseCursor: null,
    callerAgentId: null,
    callerFocus: null,
    contestantAgentId: null,
    contestantFocus: null,
    battleResult: null,
    pendingSubstitutionIds: [],
    logs,
    winnerId: null,
    winReason: null,
  };
}

export function getArenaPlayer(match, id) {
  return match.players.find((p) => p.id === id) || null;
}

export function updateArenaPlayer(match, id, updater) {
  return {
    ...match,
    players: match.players.map((p) => (p.id === id ? updater(p) : p)),
  };
}

export function appendArenaLog(match, line) {
  return { ...match, logs: pushLog(match.logs, line) };
}

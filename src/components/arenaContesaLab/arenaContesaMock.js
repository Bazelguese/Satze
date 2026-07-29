import { ARMY_SETS } from '../../data/cards';
import { ALL_BATTLEFIELDS } from '../../data/battlefields';
import { ARMY_COLORS } from '../../data/armies';
import { ARENA_CONTESA } from '../../game/arenaContesa/arenaContesaConstants.js';

/** @deprecated preferisci ARENA_CONTESA dal motore */
export const ARENA_V03 = ARENA_CONTESA;

const PLAYER_DEFS = [
  { id: 'A', name: 'Tu', seat: 'A', army: "Figli dell'Orizzonte" },
  { id: 'B', name: 'Kael', seat: 'B', army: 'Kethran' },
  { id: 'C', name: 'Mira', seat: 'C', army: 'Corte Rossa' },
  { id: 'D', name: 'Soren', seat: 'D', army: 'Orathai' },
];

function agentsFromArmy(army, count, offset = 0) {
  const pool = ARMY_SETS[army] || [];
  return pool.slice(offset, offset + count).map((card) => ({ ...card, army }));
}

export function buildArenaMockState() {
  const players = PLAYER_DEFS.map((def, index) => {
    const deck = agentsFromArmy(def.army, ARENA_V03.deckSize);
    const hand = deck.slice(0, ARENA_V03.handSize);
    const reserve = deck.slice(ARENA_V03.handSize);
    const accent = ARMY_COLORS[def.army]?.accent || '#94a3b8';
    return {
      ...def,
      accent,
      hp: [42, 38, 47, 45][index],
      focus: [28, 31, 22, 34][index],
      fields: [2, 1, 3, 0][index],
      hand,
      reserve,
      usedIds: [],
      substitutionsDone: 2,
    };
  });

  const caller = players[0];
  const contestant = players[1];
  const fields = ALL_BATTLEFIELDS.slice(0, 8);
  const contestedField = fields[2];

  return {
    giro: 2,
    callOrder: ['A', 'B', 'C', 'D'],
    responseOrder: ['B', 'C', 'D'],
    callerId: caller.id,
    contestantId: contestant.id,
    localPlayerId: 'A',
    players,
    fields,
    contestedField,
    contestedFieldIndex: 2,
    conqueredByIndex: {
      0: { winner: 'A', army: players[0].army },
      1: { winner: 'C', army: players[2].army },
      4: { winner: 'B', army: players[1].army },
    },
    logs: [
      'Giro 2 — Turno di Chiamata: Tu',
      `Campo scelto: ${contestedField?.name || '—'}`,
      'Chiamante schiera e blocca i Focus Coin',
      'Ordine risposte: Kael → Mira → Soren (obbligato)',
    ],
  };
}

export const ARENA_LAYOUT_PHASES = [
  {
    id: 'sceltaCampo',
    label: '1 · Scelta Campo',
    blurb: 'Il Chiamante sceglie un Campo dal pool comune.',
  },
  {
    id: 'chiamata',
    label: '2 · Dichiarazione',
    blurb: 'Chiamante schiera l’Agente e blocca i Focus Coin in segreto.',
  },
  {
    id: 'risposte',
    label: '3 · Contesta / Passa',
    blurb: 'Risposte circolari; il terzo risponditore è obbligato.',
  },
  {
    id: 'contestazione',
    label: '4 · Contestatore',
    blurb: 'Il Contestatore schiera e assegna i Focus Coin.',
  },
  {
    id: 'duello',
    label: '5 · Duello 1v1',
    blurb: 'Stesso duello di produzione: Chiamante vs Contestatore.',
  },
  {
    id: 'sostituzione',
    label: '6 · Riserva',
    blurb: 'Dopo lo scontro: conquista Campo e sostituzione dalla Riserva.',
  },
];

export function getPlayer(state, id) {
  return state.players.find((p) => p.id === id) || state.players[0];
}

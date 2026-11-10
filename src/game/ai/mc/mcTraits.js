// ============================================
// Personalità dell'IA (tratti), indipendenti dalla difficoltà
// ============================================
//
// Un tratto cambia lo stile senza cambiare il livello. Leve (unità: punti di probabilità
// di vittoria stimata, la stessa scala delle simulazioni):
// - bias(view, card, focus, ctx): preferenza per certe mosse, sommata alla stima;
// - objective(end, state): premio a fine partita simulata (es. Campi, PV), dal lato IA (`enemy`);
// - risk: avversione al rischio. >0 penalizza le mosse dall'esito variabile (Cauto),
//   <0 le cerca (Temerario). Punteggio = media − risk × deviazione standard;
// - focusWindow: rende i FC meno prevedibili: estrazione uniforme fra i FC dello stesso Agente
//   con stima entro questa distanza dalla migliore.
//
// Le intensità sono tarate al banco di prova: ogni tratto resta entro ~5 punti dal Neutrale
// dello stesso livello (vedi Documentazione/PIANO_MIGLIORAMENTO_IA.md).

import { countConqueredFields } from '../../duel/duelHelpers.js';

const early = (ctx) => ctx.round <= 2;
const late = (ctx) => ctx.round >= 4 || ctx.remaining <= 2;
/** 1 = la carta più forte rimasta, 0 = la più debole. */
const strongness = (card, ctx) => (ctx.remaining > 1 ? 1 - ctx.rankOf(card) / (ctx.remaining - 1) : 1);
const focusAboveFair = (focus, ctx) => focus / ctx.fair - 1;

function fieldsOf(state) {
  const { playerFieldsConquered, enemyFieldsConquered } = countConqueredFields(
    state.conqueredFields,
    state.playerHand,
    state.enemyHand
  );
  return { own: enemyFieldsConquered, opp: playerFieldsConquered };
}

export const MC_TRAITS = {
  neutral: {
    id: 'neutral',
    name: 'Neutrale',
    description: 'Gioca al meglio, senza preferenze.',
  },
  impetuoso: {
    id: 'impetuoso',
    name: 'Impetuoso',
    description: 'Parte fortissimo: tanti FC e carte forti nei primi turni.',
    bias: (view, card, focus, ctx) =>
      early(ctx) ? 0.1 * focusAboveFair(focus, ctx) + 0.06 * strongness(card, ctx) : 0,
  },
  paziente: {
    id: 'paziente',
    name: 'Paziente',
    description: 'Cede volentieri i primi scontri e conserva FC e carte migliori per il finale.',
    bias: (view, card, focus, ctx) => {
      if (early(ctx)) return -0.08 * focusAboveFair(focus, ctx) - 0.05 * strongness(card, ctx);
      return late(ctx) ? 0.04 * focusAboveFair(focus, ctx) : 0;
    },
  },
  conquistatore: {
    id: 'conquistatore',
    name: 'Conquistatore',
    description: 'Vuole i Campi: punta a vincerne la maggioranza prima della Supremazia.',
    objective: (end, state) => {
      const { own, opp } = fieldsOf(state);
      return 0.06 * (own - opp) + (end.winner === 'enemy' && end.reason === 'fields' ? 0.1 : 0);
    },
  },
  spietato: {
    id: 'spietato',
    name: 'Spietato',
    description: 'Vuole i tuoi PV: danni e colpi diretti, poco interesse per i Campi.',
    bias: (view, card) => 0.12 * ((card.damage || 0) / 6),
    // Conta i PV tolti all'avversario, non il saldo: gli interessa ferire.
    objective: (end, state) =>
      0.06 * (25 - (Number(state.playerHP) || 0)) +
      (end.winner === 'enemy' && end.reason === 'hp' ? 0.1 : 0),
  },
  avaro: {
    id: 'avaro',
    name: 'Avaro',
    description: 'Spende il minimo indispensabile e odia sprecare FC.',
    bias: (view, card, focus, ctx) => -0.08 * Math.max(0, focusAboveFair(focus, ctx)),
  },
  temerario: {
    id: 'temerario',
    name: 'Temerario',
    description: 'Ama il rischio: mosse tutto-o-niente e puntate audaci.',
    // Misurato: rischio −1 e preferenza 0,08 lo indeboliscono troppo (33% contro il Neutrale).
    risk: -0.5,
    bias: (view, card, focus, ctx) => 0.04 * Math.max(0, focusAboveFair(focus, ctx)),
  },
  cauto: {
    id: 'cauto',
    name: 'Cauto',
    description: 'Odia il rischio e protegge i propri PV, anche cedendo un Campo.',
    // Misurato: rischio 1 e obiettivo 0,05 lo indeboliscono troppo (41%). Stile ancora poco
    // riconoscibile con questi valori: da rivedere.
    risk: 0.5,
    // Conta i propri PV rimasti: subire danni gli pesa anche quando vince.
    objective: (end, state) => 0.02 * (Number(state.enemyHP) || 0),
  },
  imprevedibile: {
    id: 'imprevedibile',
    name: 'Imprevedibile',
    description: 'I suoi FC sono illeggibili: alterna puntate minime e altissime.',
    // Fra i FC "accettabili" per la carta scelta (entro questa soglia dalla stima migliore)
    // ne estrae uno a caso. Misurato: le puntate per una stessa carta raramente sono vicine,
    // quindi l'effetto è piccolo; da rivedere.
    focusWindow: 0.08,
  },
};

/** Tratti estraibili da "Casuale" (tutti, Neutrale compreso). */
export const MC_TRAIT_IDS = Object.keys(MC_TRAITS);

/** @param {string|null|undefined} id */
export function getMcTrait(id) {
  return MC_TRAITS[id] || MC_TRAITS.neutral;
}

/**
 * Risolve la scelta del menu: un id di tratto, oppure 'random' (estrazione uniforme).
 * @param {string|null|undefined} choice
 * @param {() => number} [rng]
 */
export function resolveTraitChoice(choice, rng = Math.random) {
  if (choice === 'random') return MC_TRAIT_IDS[Math.floor(rng() * MC_TRAIT_IDS.length)];
  return MC_TRAITS[choice] ? choice : 'neutral';
}

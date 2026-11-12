// ============================================
// EMINENZE — Condizioni in sospeso
// ============================================
//
// Alcune abilità rivelate pagano (o costano) solo a fine Duello, se succede qualcosa:
// «se vince», «se si attiva Turbo»… L'avviso lo dice una volta: questa lista serve a tenere
// scritta la posta finché il Duello non è deciso.
//
// Funzione pura sullo stato delle Eminenze: nessun ramo per singola abilità, solo per
// chiave di condizione e per primitiva. Una condizione che non sa descrivere non produce
// una riga (meglio niente che una frase sbagliata).

import { getEminence, getEminenceAbility } from '../../data/eminences.js';
import { TRIGGER_NAMES } from '../../data/triggers.js';
import { EFFECT_TIMINGS, EMINENCE_PRIMITIVES as P } from './eminenceConstants.js';

const signed = (n) => `${n > 0 ? '+' : '−'}${Math.abs(n)}`;
const MARK_NAMES = { fragment: 'Frammento', prey: 'Preda' };

const WINNER = {
  self: 'vince il Duello',
  opponent: 'perde il Duello',
  draw: 'il Duello finisce pari',
};

/** chiave di condizione → (valore atteso, parametri scelti) → pezzo di frase, o null. */
const CLAUSES = {
  duelWinnerRelative: (expected, params) => {
    if (typeof expected === 'string') return WINNER[expected] || null;
    if (expected && typeof expected === 'object' && 'not' in expected) {
      return expected.not === 'self' ? 'non vince il Duello' : null;
    }
    if (expected && typeof expected === 'object' && 'param' in expected) {
      const raw = params?.[expected.param];
      return WINNER[expected.map ? expected.map[raw] : raw] || null;
    }
    return null;
  },
  activatedTriggers: (expected) => {
    const list = (expected?.any || []).map((key) => TRIGGER_NAMES[key] || key);
    return list.length ? `si attiva ${list.join(' o ')}` : null;
  },
  ownPowerResolved: (expected) => (expected === true ? 'il suo Potere si attiva' : null),
  enemyPowerResolved: (expected) => (expected === true ? 'il Potere avversario si attiva' : null),
  enemyMarks: (expected) => {
    if (expected?.has && MARK_NAMES[expected.has]) return `contro una ${MARK_NAMES[expected.has]}`;
    if (expected?.not?.has && MARK_NAMES[expected.not.has]) return `non contro una ${MARK_NAMES[expected.not.has]}`;
    return null;
  },
};

function describeCondition(condition, params) {
  const parts = [];
  for (const [key, expected] of Object.entries(condition || {})) {
    const clause = CLAUSES[key]?.(expected, params);
    if (!clause) return null;
    parts.push(clause);
  }
  return parts.length ? `Se ${parts.join(', ')}` : null;
}

/** primitiva → segmento → esito in parole, visto da chi ha giocato l'abilità. */
const PAYOFFS = {
  [P.CHANGE_PRESENCE]: (seg) => (typeof seg.delta === 'number' && seg.delta
    ? `${signed(seg.delta)} Presenza${seg.target === 'OPPONENT' ? " all'avversario" : ''}`
    : null),
  [P.LOSE_HP]: (seg) => (seg.amount
    ? `${seg.target === 'OPPONENT' ? "l'avversario perde" : 'perde'} ${seg.amount} PV`
    : null),
  [P.MARK_CARD]: (seg) => (MARK_NAMES[seg.mark] ? `l'Agente diventa ${MARK_NAMES[seg.mark]}` : null),
};

/**
 * @param {object|null} matchState stato Eminenze della partita
 * @returns {Array<{ key, ownerSide, army, abilityName, text, condition: string, payoff: string, tone: 'gain'|'loss' }>}
 *   una riga per ogni condizione di fine Duello ancora aperta delle abilità rivelate
 */
export function buildPendingStakes(matchState) {
  const out = [];
  if (!matchState) return out;
  for (const owner of ['enemy', 'player']) {
    const state = matchState[owner];
    const eminence = state?.eminenceId ? getEminence(state.eminenceId) : null;
    const ability = eminence && state.revealedAbilityId ? getEminenceAbility(state.eminenceId, state.revealedAbilityId) : null;
    if (!ability) continue;
    const byCondition = new Map();
    for (const seg of ability.segments || []) {
      if (seg.timing !== EFFECT_TIMINGS.AFTER_DUEL_OUTCOME || !seg.condition) continue;
      const condition = describeCondition(seg.condition, state.selectedParams);
      const payoff = PAYOFFS[seg.primitive]?.(seg);
      if (!condition || !payoff) continue;
      const loss = seg.primitive === P.LOSE_HP ? seg.target !== 'OPPONENT' : (seg.primitive === P.CHANGE_PRESENCE && seg.target !== 'OPPONENT' && seg.delta < 0);
      const entry = byCondition.get(condition) || { payoffs: [], loss: false };
      entry.payoffs.push(payoff);
      entry.loss = entry.loss || loss;
      byCondition.set(condition, entry);
    }
    let i = 0;
    for (const [condition, entry] of byCondition) {
      out.push({
        key: `${owner}:${ability.id}:${i++}`,
        ownerSide: owner,
        army: eminence.army,
        abilityName: ability.name,
        text: ability.text,
        condition,
        payoff: entry.payoffs.join(', '),
        tone: entry.loss ? 'loss' : 'gain',
      });
    }
  }
  return out;
}

// ============================================
// EMINENZE — Regole del round
// ============================================
//
// Alcune abilità non toccano un Agente ma cambiano le regole per tutti e due i giocatori
// (le luci del Grande Semaforo, Silenzio). L'avviso lo dice una volta: questa lista serve
// a tenerle scritte sul tavolo finché valgono.
//
// Funzione pura sullo stato delle Eminenze: nessun ramo per singola abilità, solo per primitiva.

import { getEminence, getEminenceAbility } from '../../data/eminences.js';
import { TRIGGER_NAMES } from '../../data/triggers.js';
import { EMINENCE_PRIMITIVES as P } from './eminenceConstants.js';

const names = (keys) => (keys || []).map((key) => TRIGGER_NAMES[key] || key);

/** primitiva → segmento → riga della regola { kind, triggers } */
const LINES = {
  [P.FORCE_TRIGGER]: (seg) => ({ kind: 'forced', triggers: names(seg.triggers) }),
  [P.FORBID_TRIGGER]: (seg) => ({ kind: 'forbidden', triggers: names(seg.triggers) }),
  [P.REPLACE_TRIGGER]: (seg) => ({ kind: 'replaced', triggers: names([seg.trigger]) }),
};

/**
 * @param {object|null} matchState stato Eminenze della partita
 * @returns {Array<{ key, ownerSide, eminenceId, army, abilityName, text, lines: Array<{ kind: 'forced'|'forbidden'|'replaced', triggers: string[] }> }>}
 *   una voce per ogni abilità rivelata che vale per entrambi i giocatori
 */
export function buildRoundRules(matchState) {
  const out = [];
  if (!matchState) return out;
  for (const owner of ['enemy', 'player']) {
    const state = matchState[owner];
    const eminence = state?.eminenceId ? getEminence(state.eminenceId) : null;
    const ability = eminence && state.revealedAbilityId ? getEminenceAbility(state.eminenceId, state.revealedAbilityId) : null;
    if (!ability) continue;
    const lines = [];
    for (const seg of ability.segments || []) {
      if (seg.scope !== 'GLOBAL' || seg.condition) continue;
      const line = LINES[seg.primitive]?.(seg);
      if (line?.triggers.length) lines.push(line);
    }
    if (!lines.length) continue;
    out.push({
      key: `${owner}:${ability.id}`,
      ownerSide: owner,
      eminenceId: eminence.id,
      army: eminence.army,
      abilityName: ability.name,
      text: ability.text,
      lines,
    });
  }
  return out;
}

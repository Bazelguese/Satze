// ============================================
// EMINENZE — Segni sugli Agenti in gioco
// ============================================
//
// Un'abilità rivelata può cambiare l'Agente schierato (Potere sostituito o bloccato, trigger
// scambiati, valori, FC temporanei…). L'avviso lo dice una volta e poi sparisce: questi segni
// restano accanto alla carta per tutto il Duello.
//
// Funzione pura sullo stato delle Eminenze: nessun ramo per singola abilità, solo per primitiva.

import { getEminence, getEminenceAbility } from '../../data/eminences.js';
import { EMINENCE_PRIMITIVES as P } from './eminenceConstants.js';

const STAT_LABELS = { power: 'POT', damage: 'DAN', assaultValue: 'VA' };
const signed = (n) => `${n > 0 ? '+' : '−'}${Math.abs(n)}`;

/** primitiva → (segmento, parametri scelti) → { row, word } oppure null. */
const MARKERS = {
  [P.MODIFY_STAT]: (seg) => ({
    row: 'agent',
    word: `${signed(seg.delta ?? 0)} ${STAT_LABELS[seg.stat] || seg.stat}${seg.scaleBy === 'presenceSpent' ? ' per Presenza' : ''}`,
  }),
  [P.IGNORE_FIELD]: () => ({ row: 'agent', word: 'Ignora il Campo' }),
  [P.REPLACE_ABILITY]: (seg) => (seg.slot === 'bonus'
    ? { row: 'bonus', word: 'Bonus sostituito' }
    : { row: 'power', word: 'Potere sostituito' }),
  [P.TRANSPLANT_POWER]: (seg, params) => (params?.[seg.slotParam] === 'bonus'
    ? { row: 'bonus', word: 'Bonus innestato' }
    : { row: 'power', word: 'Potere innestato' }),
  [P.COMPOSE_ABILITY]: () => ({ row: 'power', word: 'Potere composto' }),
  [P.BLOCK_POWER]: () => ({ row: 'power', word: 'Potere bloccato' }),
  [P.ECHO_POWER]: () => ({ row: 'power', word: 'Eco del Potere' }),
  [P.MIRROR_UNSATISFIED_POWER]: () => ({ row: 'power', word: 'Potere legato' }),
  [P.SWAP_POWER_BONUS_TRIGGERS]: () => ({ row: 'trigger', word: 'Trigger invertiti' }),
  [P.REPLACE_TRIGGER]: () => ({ row: 'trigger', word: 'Trigger cambiato' }),
  [P.ALIAS_TRIGGER]: () => ({ row: 'trigger', word: 'Trigger scambiabili' }),
  [P.FORCE_TRIGGER]: () => ({ row: 'trigger', word: 'Trigger soddisfatto' }),
  [P.FORBID_TRIGGER]: () => ({ row: 'trigger', word: 'Trigger vietato' }),
  [P.GRANT_TEMPORARY_FOCUS]: (seg) => ({ row: 'agent', word: `+${seg.amount ?? 1} FC temporanei` }),
  [P.GRANT_IMMUNE]: () => ({ row: 'agent', word: 'Immune' }),
  [P.SET_ARMY_BONUS_STATE]: (seg) => (seg.suppressed ? { row: 'bonus', word: 'Bonus bloccato' } : null),
};

const other = (side) => (side === 'enemy' ? 'player' : 'enemy');

/** Lati degli Agenti toccati da un segmento, visti da chi ha giocato l'abilità. */
function sidesOf(seg, owner) {
  if (seg.scope === 'GLOBAL') return []; // vale per tutti: lo dice la regola del round (eminenceRoundRules)
  if (seg.scope === 'ENEMY') return [other(owner)];
  if (seg.scope === 'OWN') return [owner];
  if (seg.target === 'ENEMY_AGENT' || seg.target === 'OPPONENT') return [other(owner)];
  if (seg.target === 'OWN_AGENT' || seg.target === 'SELF') return [owner];
  return [];
}

/**
 * Condizione del segmento: le Offerte si sanno (accettata o no, variante scelta);
 * le altre si decidono durante il Duello, quindi il segno resta «in forse».
 * @returns {'yes'|'no'|'maybe'}
 */
function conditionState(condition, params) {
  if (!condition) return 'yes';
  const keys = Object.keys(condition);
  if ('dealAccepted' in condition && Boolean(params?.dealAccepted) !== Boolean(condition.dealAccepted)) return 'no';
  if ('dealChoice' in condition && params?.dealChoice !== condition.dealChoice) return 'no';
  return keys.every((key) => key === 'dealAccepted' || key === 'dealChoice') ? 'yes' : 'maybe';
}

/**
 * @param {object|null} matchState stato Eminenze della partita
 * @returns {{ player: Array, enemy: Array }} segni per l'Agente di ciascun lato:
 *   { key, word, row: 'power'|'bonus'|'trigger'|'agent', conditional, ownerSide, army, abilityName, text }
 */
export function buildAgentMarks(matchState) {
  const out = { player: [], enemy: [] };
  if (!matchState) return out;
  for (const owner of ['player', 'enemy']) {
    const state = matchState[owner];
    const eminence = state?.eminenceId ? getEminence(state.eminenceId) : null;
    if (!eminence) continue;
    const ability = state.revealedAbilityId ? getEminenceAbility(state.eminenceId, state.revealedAbilityId) : null;
    for (const seg of ability?.segments || []) {
      const marker = MARKERS[seg.primitive];
      if (!marker) continue;
      const when = conditionState(seg.condition, state.selectedParams);
      if (when === 'no') continue;
      const mark = marker(seg, state.selectedParams);
      if (!mark) continue;
      for (const side of sidesOf(seg, owner)) {
        const key = `${owner}:${ability.id}:${seg.primitive}:${mark.word}`;
        if (out[side].some((entry) => entry.key === key)) continue;
        out[side].push({
          key,
          ...mark,
          conditional: when === 'maybe',
          ownerSide: owner,
          army: eminence.army,
          abilityName: ability.name,
          text: ability.text,
        });
      }
    }
    // Bonus d'Armata sostituito da un'abilità di un round precedente (Preghiera Ululata, Ego senza Maschere)
    const override = state.persistent?.armyBonusOverride;
    if (override && !out[owner].some((entry) => entry.row === 'bonus' && entry.ownerSide === owner)) {
      const source = typeof override.source === 'string' ? getEminenceAbility(state.eminenceId, override.source) : null;
      out[owner].push({
        key: `${owner}:persistent:bonus`,
        row: 'bonus',
        word: 'Bonus sostituito',
        conditional: false,
        ownerSide: owner,
        army: eminence.army,
        abilityName: source?.name || eminence.name,
        text: source?.text || '',
      });
    }
  }
  return out;
}

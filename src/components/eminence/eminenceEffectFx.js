// ============================================
// EMINENZE — Effetti d'attivazione a tema
// ============================================
//
// Quando un'abilità si attiva, l'avviso dice cosa succede; questo modulo decide che cosa
// si vede sul tavolo: uno sciame nel motivo dell'Eminenza che parte dall'avviso e un
// impatto sul bersaglio (Agente, Campo, PV). Il motivo è uno per Eminenza (`theme`),
// la forma dell'impatto dipende dal tipo di effetto (`kind`).
//
// Parte dalle stesse ricette di `eminenceCinematics.js`: nessun ramo per singola abilità,
// tranne il colore della luce del Semaforo.

import { CINEMATIC_RECIPES as R } from '../../game/eminence/eminenceCinematics.js';
import { EMINENCE_PRIMITIVES as P } from '../../game/eminence/eminenceConstants.js';
import { resolveArmyEntrySlug } from '../../lib/eminenzaEntry.js';

/** Tipi di impatto. `aura` non ha bersaglio: il motivo si accende sull'avviso stesso. */
export const EFFECT_FX_KINDS = Object.freeze({
  BOON: 'boon',
  BANE: 'bane',
  SLOT: 'slot',
  HP: 'hp',
  AURA: 'aura',
});

/** Motivi disponibili: uno per armata/Eminenza (stessi slug degli ingressi). */
export const EFFECT_FX_THEMES = Object.freeze([
  'apex', 'indocili', 'mascarada', 'kethran', 'mounthborn', 'khemet',
  'orathai', 'corte', 'orizzonte', 'ratti', 'enclave', 'calibri',
]);

const SEMAFORO_LAMPS = Object.freeze({ verde: '#38f07a', giallo: '#ffc933', rosso: '#ff3b3b' });

/** Colore della luce per le abilità del Grande Semaforo (dal nome), altrimenti null. */
export function semaforoLamp(abilityName) {
  return SEMAFORO_LAMPS[String(abilityName || '').trim().toLowerCase()] || null;
}

function kindOfCue(cue, side) {
  if (!cue?.flight) return null;
  if (cue.recipe === R.LINK_AGENT) {
    return cue.flight.to?.side === side ? EFFECT_FX_KINDS.BOON : EFFECT_FX_KINDS.BANE;
  }
  if (cue.recipe === R.SLOT_CURSE || cue.recipe === R.FIELD_RULE) return EFFECT_FX_KINDS.SLOT;
  if (cue.recipe === R.HP_TICK) return EFFECT_FX_KINDS.HP;
  return null; // Presenza propria: ci pensano già le scintille verso il contatore
}

const other = (side) => (side === 'enemy' ? 'player' : 'enemy');
const agentOf = (side) => ({ type: 'field-agent', side });
const isFoeTarget = (target) => target === 'ENEMY_AGENT' || target === 'OPPONENT';

/**
 * Bersagli delle primitive che le ricette cinematiche non collegano a nulla: abilità che
 * cambiano Potere o trigger di un Agente, segnano o vincolano carte in mano, fanno
 * un'Offerta, danno FC o tolgono Presenza all'avversario.
 * Ogni voce: (lato di chi attiva, payoff) → lista di { kind, to, fallback? }.
 */
const EXTRA_TARGETS = {
  [P.REPLACE_ABILITY]: (side, p) => [isFoeTarget(p.target) ? { kind: 'bane', to: agentOf(other(side)) } : { kind: 'boon', to: agentOf(side) }],
  [P.TRANSPLANT_POWER]: (side) => [{ kind: 'boon', to: agentOf(side) }],
  [P.COMPOSE_ABILITY]: (side) => [{ kind: 'boon', to: agentOf(side) }],
  [P.ECHO_POWER]: (side) => [{ kind: 'boon', to: agentOf(side) }],
  [P.SWAP_POWER_BONUS_TRIGGERS]: (side) => [{ kind: 'boon', to: agentOf(side) }],
  // blocca un Potere: è un colpo «contro», anche quando l'Agente è il proprio (Fermo Macchine)
  [P.BLOCK_POWER]: (side, p) => [{ kind: 'bane', to: agentOf(isFoeTarget(p.target) ? other(side) : side) }],
  [P.MIRROR_UNSATISFIED_POWER]: (side) => [{ kind: 'boon', to: agentOf(side) }, { kind: 'bane', to: agentOf(other(side)) }],
  // segno: sull'Agente proprio (Frammento) oppure su una carta in mano all'avversario (Preda)
  [P.MARK_CARD]: (side, p) => [p.target === 'OWN_AGENT' ? { kind: 'boon', to: agentOf(side) } : { kind: 'bane', to: { type: 'hand', side: other(side) } }],
  [P.CONSTRAIN_DEPLOY]: (side, p) => [p.target === 'SELF' ? { kind: 'boon', to: { type: 'hand', side } } : { kind: 'bane', to: { type: 'hand', side: other(side) } }],
  // un'Offerta arriva all'avversario: sulla sua targa
  [P.PROPOSE_DEAL]: (side) => [{ kind: 'hp', to: { type: 'hp', side: other(side) } }],
  [P.GRANT_POOL_FOCUS]: (side, p) => [{ kind: 'hp', to: { type: 'fc', side: isFoeTarget(p.target) ? other(side) : side } }],
  // Presenza tolta all'avversario: sul suo contatore se la carta è in vista, altrimenti sulla sua targa
  [P.CHANGE_PRESENCE]: (side, p) => (isFoeTarget(p.target)
    ? [{ kind: 'hp', to: { type: 'presence', side: other(side) }, fallback: { type: 'hp', side: other(side) } }]
    : []),
};

/**
 * Traduce un avviso in effetti da mostrare.
 *
 * @param {Array} cues da `resolveNoticeCinematics`
 * @param {{ side: string, army: string, accent: string, abilityName?: string, payoffs?: Array }} source
 *   `payoffs` sono quelli dell'avviso: servono a collegare le abilità che le ricette lasciano senza bersaglio.
 * @returns {Array<{ kind: string, theme: string, accent: string, lamp: string|null, from: object, to: object|null, fallback?: object }>}
 */
export function planEffectFx(cues, { side, army, accent, abilityName, payoffs } = {}) {
  const list = Array.isArray(cues) ? cues : [];
  if (!side || list.some((cue) => cue?.recipe === R.MISS_DIM)) return [];
  const theme = resolveArmyEntrySlug(army);
  const base = {
    theme,
    accent: accent || '#d5ecf9',
    lamp: theme === 'indocili' ? semaforoLamp(abilityName) : null,
    from: { type: 'announce', side },
  };
  const hits = [];
  const seen = new Set();
  const add = (kind, to, fallback) => {
    const key = `${to?.type}:${to?.side}:${to?.id}`;
    if (seen.has(key)) return;
    seen.add(key);
    hits.push(fallback ? { ...base, kind, to, fallback } : { ...base, kind, to });
  };
  for (const cue of list) {
    const kind = kindOfCue(cue, side);
    if (kind) add(kind, cue.flight.to);
  }
  for (const payoff of Array.isArray(payoffs) ? payoffs : []) {
    const extra = EXTRA_TARGETS[payoff?.primitive];
    if (extra) extra(side, payoff).forEach((hit) => add(hit.kind, hit.to, hit.fallback));
  }
  if (hits.length) return hits;
  return [{ ...base, kind: EFFECT_FX_KINDS.AURA, to: null }];
}

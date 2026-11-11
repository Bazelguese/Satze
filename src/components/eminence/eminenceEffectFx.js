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
  return null; // Presenza: ci pensano già le scintille verso il contatore
}

/**
 * Traduce le cue di un avviso in effetti da mostrare.
 *
 * @param {Array} cues da `resolveNoticeCinematics`
 * @param {{ side: string, army: string, accent: string, abilityName?: string }} source
 * @returns {Array<{ kind: string, theme: string, accent: string, lamp: string|null, from: object, to: object|null }>}
 */
export function planEffectFx(cues, { side, army, accent, abilityName } = {}) {
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
  for (const cue of list) {
    const kind = kindOfCue(cue, side);
    if (!kind) continue;
    const to = cue.flight.to;
    const key = `${kind}:${to?.type}:${to?.side}:${to?.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    hits.push({ ...base, kind, to });
  }
  if (hits.length) return hits;
  return [{ ...base, kind: EFFECT_FX_KINDS.AURA, to: null }];
}

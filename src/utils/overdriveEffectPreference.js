export const OVERDRIVE_EFFECT_STORAGE_KEY = 'satze_overdrive_effect';
export const DEFAULT_OVERDRIVE_EFFECT = 'veil-columns';

export const OVERDRIVE_EFFECT_OPTIONS = [
  {
    key: 'veil-columns',
    title: 'Veil Columns',
    sub: 'BASE',
    desc: 'Tre colonne di luce che salgono — effetto predefinito in partita.',
  },
  {
    key: 'heat-rise',
    title: 'Heat Rise',
    sub: 'CALORE',
    desc: 'Calore che sale dal basso: wash, flussi sfumati e scintille in loop.',
  },
  {
    key: 'aurora-ring',
    title: 'Aurora Ring',
    sub: 'ORBITALE',
    desc: 'Anello conico che ruota alla base della carta, bagliore morbido al centro.',
  },
  {
    key: 'veil-columns-full',
    title: 'Veil Full',
    sub: '5 COLONNE',
    desc: 'Cinque colonne più larghe e luminose, con nucleo centrale su ogni vela.',
  },
  {
    key: 'veil-columns-dense',
    title: 'Veil Dense',
    sub: '7 COLONNE',
    desc: 'Sette colonne fitte e saturate — riempie quasi tutta la carta.',
  },
  {
    key: 'veil-columns-flood',
    title: 'Veil Flood',
    sub: 'PIENO',
    desc: 'Quattro vele molto larghe che invadono il campo — la versione più corposa.',
  },
  {
    key: 'ember-field',
    title: 'Ember Field',
    sub: 'MINIMALE',
    desc: 'Solo scintille e bagliore di base: discreto ma leggibile.',
  },
  {
    key: 'prism-halo',
    title: 'Prism Halo',
    sub: 'BORDO',
    desc: 'Cornice che ciclano i tre colori armata; interno quasi pulito.',
  },
  {
    key: 'surge-bloom',
    title: 'Surge Bloom',
    sub: 'IMPULSO',
    desc: 'Un’unica onda ampia che sale dal piede della carta.',
  },
];

const VALID = new Set(OVERDRIVE_EFFECT_OPTIONS.map((o) => o.key));

export function isValidOverdriveEffect(key) {
  return VALID.has(key);
}

function readStorage() {
  if (typeof window !== 'undefined' && window.localStorage) return window.localStorage;
  if (typeof globalThis !== 'undefined' && globalThis.localStorage) return globalThis.localStorage;
  return null;
}

export function getOverdriveEffectVariant() {
  const storage = readStorage();
  if (!storage) return DEFAULT_OVERDRIVE_EFFECT;
  try {
    const stored = storage.getItem(OVERDRIVE_EFFECT_STORAGE_KEY);
    return stored && isValidOverdriveEffect(stored) ? stored : DEFAULT_OVERDRIVE_EFFECT;
  } catch {
    return DEFAULT_OVERDRIVE_EFFECT;
  }
}

export function setOverdriveEffectVariant(key) {
  if (!isValidOverdriveEffect(key)) return;
  const storage = readStorage();
  if (!storage) return;
  try {
    storage.setItem(OVERDRIVE_EFFECT_STORAGE_KEY, key);
  } catch {
    /* ignore */
  }
}

export function getOverdriveEffectMeta(key) {
  return OVERDRIVE_EFFECT_OPTIONS.find((o) => o.key === key) ?? OVERDRIVE_EFFECT_OPTIONS[0];
}

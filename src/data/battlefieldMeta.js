// Parametri motore selezione campi (SISTEMA_POOL_CAMPI.md §4)

export const BATTLEFIELD_REVEAL_START = 3;

export const BATTLEFIELD_RARITA = {
  COMUNE: 'comune',
  RARO: 'raro',
  SPECIAL: 'special',
};

export const BATTLEFIELD_SELECTION_DEFAULTS = {
  pR_base: 0.4,
  d: 0.5,
  f_R: 0.1,
  pS_base: 0.12,
  SPECIAL_SLOT_MIN: 3,
  REVEAL_START: BATTLEFIELD_REVEAL_START,
};

export const BATTLEFIELD_TEMA = {
  GENERICO: 'generico',
  FIGLI_ORIZZONTE: "Figli dell'Orizzonte",
  KETHRAN: 'Kethran',
  CORTE_ROSSA: 'Corte Rossa',
  CALIBRI: 'Calibri Pesanti',
  ORATHAI: 'Orathai',
  NATI_BOCca: 'Nati dalla Bocca',
  ENCLAVE: 'Enclave delle Scaglie',
  RATTI: 'Ratti della Megera',
  PATTO: 'Patto degli Indocili',
  KHEMET: 'Khemet',
  APEX: 'Apex',
};

/** @param {{ rarita?: string, category?: string }} field */
export function getFieldRarita(field) {
  if (!field || field.category === 'neutral') return null;
  return field.rarita ?? BATTLEFIELD_RARITA.COMUNE;
}

/** Declassa tier per fallback bucket vuoto */
export function declassRarita(tier) {
  if (tier === BATTLEFIELD_RARITA.SPECIAL) return BATTLEFIELD_RARITA.RARO;
  if (tier === BATTLEFIELD_RARITA.RARO) return BATTLEFIELD_RARITA.COMUNE;
  return null;
}

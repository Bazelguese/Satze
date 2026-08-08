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
  MASCARADA: 'Mascarada',
};

/** Ordine sezioni galleria / elenco (tipo meccanico). */
export const BATTLEFIELD_CATEGORY_ORDER = [
  'values',
  'limit',
  'conditional',
  'focus',
  'trigger',
  'neutral',
];

export const BATTLEFIELD_CATEGORY_LABEL = {
  values: 'Valori',
  limit: 'Vincolo',
  conditional: 'Condizionale',
  focus: 'Focus',
  trigger: 'Innesco',
  neutral: 'Neutro',
};

/** Ordine temi come in CAMPI_MASTER (generico → armate → neutri in coda via category). */
export const BATTLEFIELD_TEMA_ORDER = [
  'generico',
  "Figli dell'Orizzonte",
  'Kethran',
  'Corte Rossa',
  'Calibri Pesanti',
  'Orathai',
  'Nati dalla Bocca',
  'Enclave delle Scaglie',
  'Ratti della Megera',
  'Patto degli Indocili',
  'Khemet',
  'Apex',
  'Mascarada',
];

/**
 * Raggruppa i campi per category (tipo), ordinati per tema poi id.
 * @param {Array<{ id: number, category?: string, tema?: string }>} fields
 * @returns {Array<{ category: string, label: string, fields: typeof fields }>}
 */
export function groupBattlefieldsByCategory(fields) {
  const byCat = new Map();
  for (const f of fields || []) {
    const cat = f.category || 'values';
    if (!byCat.has(cat)) byCat.set(cat, []);
    byCat.get(cat).push(f);
  }
  const temaRank = (tema) => {
    const i = BATTLEFIELD_TEMA_ORDER.indexOf(tema);
    return i === -1 ? 99 : i;
  };
  const sortFields = (list) =>
    [...list].sort((a, b) => {
      const td = temaRank(a.tema) - temaRank(b.tema);
      if (td !== 0) return td;
      return (a.id || 0) - (b.id || 0);
    });

  const groups = [];
  for (const cat of BATTLEFIELD_CATEGORY_ORDER) {
    const list = byCat.get(cat);
    if (!list?.length) continue;
    groups.push({
      category: cat,
      label: BATTLEFIELD_CATEGORY_LABEL[cat] || cat,
      fields: sortFields(list),
    });
    byCat.delete(cat);
  }
  for (const [cat, list] of byCat) {
    groups.push({
      category: cat,
      label: BATTLEFIELD_CATEGORY_LABEL[cat] || cat,
      fields: sortFields(list),
    });
  }
  return groups;
}

/** Lista piatta: tipi in ordine, dentro ogni tipo per tema/id. */
export function flattenBattlefieldsByCategory(fields) {
  return groupBattlefieldsByCategory(fields).flatMap((g) => g.fields);
}

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

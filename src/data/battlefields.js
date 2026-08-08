// ============================================
// CAMPI DI BATTAGLIA — 121 campi (CAMPI_MASTER.md)
// ============================================

import { RAW_BATTLEFIELDS } from './battlefieldsData.js';
export {
  groupBattlefieldsByCategory,
  flattenBattlefieldsByCategory,
  BATTLEFIELD_CATEGORY_ORDER,
  BATTLEFIELD_CATEGORY_LABEL,
} from './battlefieldMeta.js';

export const FIELD_STYLES = {
  values: { gradient: 'linear-gradient(135deg, #1a1a2e 0%, #2a2a4e 100%)', glow: 'rgba(100, 150, 255, 0.4)', icon: 'sword' },
  limit: { gradient: 'linear-gradient(135deg, #2d1a0d 0%, #4a2a1a 100%)', glow: 'rgba(200, 100, 50, 0.4)', icon: 'block' },
  conditional: { gradient: 'linear-gradient(135deg, #1a2e1a 0%, #2a4a2a 100%)', glow: 'rgba(50, 200, 100, 0.4)', icon: 'target' },
  focus: { gradient: 'linear-gradient(135deg, #2e1a2e 0%, #4a2a4a 100%)', glow: 'rgba(200, 50, 200, 0.4)', icon: 'coin' },
  trigger: { gradient: 'linear-gradient(135deg, #2e2e1a 0%, #4a4a2a 100%)', glow: 'rgba(200, 200, 50, 0.4)', icon: 'lightning' },
  neutral: { gradient: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)', glow: 'rgba(150, 150, 150, 0.3)', icon: 'circle' },
};

export const getFieldStyle = (category) => FIELD_STYLES[category] || FIELD_STYLES.values;

export const ALL_BATTLEFIELDS = RAW_BATTLEFIELDS;

/** Mappa `tema` → animazione reveal. Tutte e 12 le armate hanno un'animazione dedicata. */
export const BATTLEFIELD_TEMA_TO_ANIMATION = {
  "Figli dell'Orizzonte": 'swirl',
  Kethran: 'frammenti',
  'Corte Rossa': 'sipario',
  'Calibri Pesanti': 'hud',
  Orathai: 'onda',
  'Nati dalla Bocca': 'morsi',
  'Enclave delle Scaglie': 'occhio',
  'Ratti della Megera': 'sciame',
  'Patto degli Indocili': 'rivolta',
  Khemet: 'cerchi',
  Apex: 'artigli',
  Mascarada: 'ring',
};

const FIELD_BY_ID = new Map(RAW_BATTLEFIELDS.map((f) => [f.id, f]));

/** @returns {string} tema armata o `'default'` per generico / sconosciuto */
export const getBattlefieldEntranceTheme = (fieldId) => {
  const field = FIELD_BY_ID.get(fieldId);
  if (!field?.tema || field.tema === 'generico') return 'default';
  return field.tema;
};

/** @returns {'default'|'swirl'|'frammenti'|'sipario'|'hud'|'onda'|'morsi'|'occhio'|'sciame'|'rivolta'|'cerchi'|'artigli'|'ring'} */
export const getBattlefieldAnimationType = (fieldId) => {
  const field = FIELD_BY_ID.get(fieldId);
  if (!field?.tema || field.tema === 'generico') return 'default';
  return BATTLEFIELD_TEMA_TO_ANIMATION[field.tema] || 'default';
};

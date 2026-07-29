import { ARMY_COLORS } from '../data/armies.js';

/** Colori companion per l'anteprima Overdrive — accanto all'accent principale. */
const ARMY_OVERDRIVE_COMPANIONS = {
  "Figli dell'Orizzonte": { secondary: '#6366f1', tertiary: '#c4b5fd' },
  Kethran: { secondary: '#f59e0b', tertiary: '#fef08a' },
  'Corte Rossa': { secondary: '#fb7185', tertiary: '#fda4af' },
  'Calibri Pesanti': { secondary: '#64748b', tertiary: '#f97316' },
  Orathai: { secondary: '#14b8a6', tertiary: '#5eead4' },
  Mounthborn: { secondary: '#84cc16', tertiary: '#ecfccb' },
  "L'Enclave delle Scaglie": { secondary: '#ef4444', tertiary: '#fcd34d' },
  'Ratti della Megera': { secondary: '#34d399', tertiary: '#a7f3d0' },
  'Patto degli Indocili': { secondary: '#a855f7', tertiary: '#f472b6' },
  Khemet: { secondary: '#8b5cf6', tertiary: '#3b82f6' },
  Apex: { secondary: '#94a3b8', tertiary: '#cbd5e1' },
};

const FALLBACK = { accent: '#ef4444', secondary: '#fb923c', tertiary: '#fbbf24' };

export function getOverdrivePalette(armyName) {
  const accent = ARMY_COLORS[armyName]?.accent ?? FALLBACK.accent;
  const companions = ARMY_OVERDRIVE_COMPANIONS[armyName] ?? FALLBACK;
  return {
    accent,
    secondary: companions.secondary ?? FALLBACK.secondary,
    tertiary: companions.tertiary ?? FALLBACK.tertiary,
  };
}

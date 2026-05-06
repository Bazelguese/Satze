// Tema UI campagna — allineato a PALETTE Oratorio (valori missione / stato restano dedicati).

import { PALETTE, injectSatzeUiFonts } from '../theme/hudOratorioPalette';

export const CAMPAIGN_UI = {
  bg: PALETTE.deepVoid,
  panelBg: PALETTE.nebula,
  panelBg2: '#10081c',
  border: PALETTE.slate,
  borderHi: PALETTE.panelEdge,
  violet: '#5a3d78',
  violetLit: PALETTE.magenta,
  violetDim: '#1a0f28',
  amber: '#b8893d',
  amberLit: '#d4b060',
  red: '#c43c3c',
  redLit: '#e87070',
  green: '#3d6b40',
  greenLit: '#7aab7e',
  textPri: PALETTE.textPrimary,
  textSec: PALETTE.textSecondary,
  textMuted: '#6b5f86',
  mono: '#9eb8e8',
};

export const CAMPAIGN_FONTS = {
  ui: "'Chakra Petch', 'Segoe UI', system-ui, sans-serif",
  mono: "'Share Tech Mono', 'Courier New', monospace",
};

/** Inietta font campagna una sola volta (idempotente). */
export function injectCampaignFonts() {
  injectSatzeUiFonts();
}

const MISSION_COLOR = {
  assault: '#d4b060',
  defense: '#5a7cbd',
  dominion: '#7aab7e',
  annihilation: '#e87070',
  special: '#d85eb8',
};

export function missionKindColor(kind) {
  return MISSION_COLOR[kind] || CAMPAIGN_UI.violetLit;
}

export function pressureBarColor(p) {
  if (p >= 80) return CAMPAIGN_UI.redLit;
  if (p >= 50) return CAMPAIGN_UI.amberLit;
  return CAMPAIGN_UI.violetLit;
}

export const MISSION_KIND_TAGS = {
  assault: { tag: 'ASS', col: CAMPAIGN_UI.amber },
  defense: { tag: 'DIF', col: CAMPAIGN_UI.mono },
  dominion: { tag: 'DOM', col: CAMPAIGN_UI.green },
  annihilation: { tag: 'ANN', col: CAMPAIGN_UI.redLit },
  special: { tag: 'SPC', col: CAMPAIGN_UI.violetLit },
};

export function rewardProfileForKind(kind) {
  const k = kind || 'assault';
  const map = {
    assault: { label: 'Carte offensive', col: CAMPAIGN_UI.amber },
    defense: { label: 'Carte difensive', col: CAMPAIGN_UI.mono },
    dominion: { label: 'Carte campo + modif.', col: CAMPAIGN_UI.greenLit },
    annihilation: { label: 'Rare / Lega alta', col: CAMPAIGN_UI.amberLit },
    special: { label: 'Ricompensa speciale', col: CAMPAIGN_UI.violetLit },
  };
  return map[k] || map.assault;
}

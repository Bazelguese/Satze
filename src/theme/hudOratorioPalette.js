/**
 * Palette SATZE — logo cosmico (viola / magenta / argento / blu notte).
 */
import brandLogoUrl from '../assets/logo-satze.png';

export const PALETTE = {
  /** Vuoto cosmico */
  deepVoid: '#0c0814',
  /** Profondità notturna */
  nebula: '#140f22',
  /** Nebbie e glow — viola reale */
  nebulaGlow: '#6b3d9e',
  /** Abisso in basso */
  nebulaFloor: '#080612',
  /** Luce primaria UI — argento-lilla */
  amber: '#d4c4e8',
  /** Calore / energia — magenta profondo */
  fire: '#9a4a7a',
  /** Accento freddo — blu cobalto */
  cyan: '#5a7cbd',
  /** Accenti vividi — magenta */
  magenta: '#d85eb8',
  /** Testo principale — quasi bianco freddo */
  textPrimary: '#eae4f2',
  /** Testo secondario — lavanda spenta */
  textSecondary: '#a89bc4',
  /** Highlight metallici */
  gold: '#c9b8e8',
  goldBright: '#f0e8ff',
  /** Bordi — viola ardesia */
  slate: '#4a3f66',
  panelBg: 'rgba(20, 14, 36, 0.94)',
  panelEdge: '#7c5cb8',
};

/**
 * Accenti dell'identità cosmic del menu (viola/magenta) — stessi valori dei
 * token CSS `--menu-*` in src/styles/cosmic-tokens.css. Usare queste costanti
 * nei contesti dove `var(--...)` non funziona (canvas 2D, attributi SVG,
 * concatenazioni con alpha tipo `${MENU_ACCENTS.magenta}44`).
 */
export const MENU_ACCENTS = {
  void: '#06030a',
  panel: '#110b20',
  magenta: '#c026d3',
  pink: '#ec4899',
  hotPink: '#ff2db8',
  text: '#f5f3eb',
};

/** UI principale */
export const HUD_ORATORIO_FONT_UI = "'Chakra Petch', 'Segoe UI', system-ui, sans-serif";

/** Titoli — Cinzel come nel menu bandiere */
export const HUD_ORATORIO_FONT_DISPLAY = "'Cinzel', Georgia, serif";

/** Logo senza sfondo (PNG da `npm run logo:transparent` + URL hashed da Vite) */
export const BRAND_LOGO_SRC = brandLogoUrl;

/** Dimensioni intrinseche del PNG (allineare a index.html dopo cambio sorgente) */
export const BRAND_LOGO_WIDTH = 1536;
export const BRAND_LOGO_HEIGHT = 1024;

/** Sfondo a strati (LoadingScreen / pagine tool) — stesso linguaggio visivo. */
export function buildSatzeCosmicBackgroundCSS() {
  return `
    radial-gradient(ellipse 90% 55% at 42% 34%, ${PALETTE.nebulaGlow}33 0%, transparent 58%),
    radial-gradient(ellipse 70% 45% at 78% 28%, ${PALETTE.magenta}22 0%, transparent 55%),
    radial-gradient(ellipse 60% 42% at 50% 100%, ${PALETTE.nebulaFloor}cc 0%, transparent 52%),
    linear-gradient(180deg, ${PALETTE.deepVoid} 0%, ${PALETTE.nebula} 55%, ${PALETTE.nebulaFloor} 100%)
  `.trim();
}

/**
 * I font sono self-hosted e caricati globalmente da public/fonts/fonts.css
 * (link in index.html): questa funzione resta solo per compatibilità API.
 */
export function injectSatzeUiFonts() {}

/**
 * Profilo build giocabile / playtest esterno.
 * Attiva con: npm run build:public  (mode public → .env.public)
 */
export const IS_PUBLIC_PLAYTEST_BUILD =
  typeof import.meta !== 'undefined' &&
  import.meta.env?.VITE_SATZE_PUBLIC_BUILD === 'true';

/* global __SATZE_VERSION__, __SATZE_BUILD_DATE__ */
/** Versione del gioco (da package.json), iniettata da Vite in fase di build. */
export const SATZE_VERSION =
  typeof __SATZE_VERSION__ !== 'undefined' ? __SATZE_VERSION__ : 'dev';

/** Data della build (AAAA-MM-GG), fissata quando Vite compila: non quella di avvio del gioco. */
export const SATZE_BUILD_DATE =
  typeof __SATZE_BUILD_DATE__ !== 'undefined' ? __SATZE_BUILD_DATE__ : null;

/** Voci menu principale nascoste nella build pubblica. */
export const PUBLIC_BUILD_HIDDEN_MENU_LABELS = new Set([
  'STORICO PLAYTEST',
  'STRUMENTI DEV',
]);

export function filterMenuItemsForBuild(items) {
  if (!IS_PUBLIC_PLAYTEST_BUILD) return items;
  return items.filter((item) => !PUBLIC_BUILD_HIDDEN_MENU_LABELS.has(item.label));
}

/** Evita toggle multipli se il puntatore si muove (click vs trascinamento). */
export function createSingleClickHandlers(onClick, thresholdPx = 6) {
  let startX = 0;
  let startY = 0;
  let active = false;

  return {
    onPointerDown: (e) => {
      if (e.button !== 0) return;
      active = true;
      startX = e.clientX;
      startY = e.clientY;
    },
    onPointerUp: (e) => {
      if (!active || e.button !== 0) return;
      active = false;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (dx * dx + dy * dy <= thresholdPx * thresholdPx) {
        onClick(e);
      }
    },
    onPointerCancel: () => {
      active = false;
    },
  };
}

export const PUBLIC_BUILD_MARQUEE =
  'PLAYTEST · SATZE · LA GRANDE GUERRA · ';

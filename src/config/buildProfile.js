/**
 * Profilo build giocabile / playtest esterno.
 * Attiva con: npm run build:public  (mode public → .env.public)
 */
export const IS_PUBLIC_PLAYTEST_BUILD =
  typeof import.meta !== 'undefined' &&
  import.meta.env?.VITE_SATZE_PUBLIC_BUILD === 'true';

/** Voci menu principale nascoste nella build pubblica. */
export const PUBLIC_BUILD_HIDDEN_MENU_LABELS = new Set([
  'CAMPAGNA',
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

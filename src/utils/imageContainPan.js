// ============================================
// Pan orizzontale per CardImage con object-fit: contain
// Quando l'arte riempie tutta la larghezza del box, object-position X non ha effetto.
// Il ritaglio tool (?cropTool=1) usa gli stessi coefficienti di export/import.
// ============================================

/** Ampiezza massima dello shift orizzontale (±%) applicato tramite translate quando lo slider è agli estremi 0 / 100. */
export const OBJECT_CONTAIN_HORIZONTAL_PAN_RANGE_PCT = 12;

/**
 * Limiti slider X/Y nel tool ritaglio (?cropTool=1).
 * Centro a 50 (come background-position / object-position). Oltre 0–100 il pan orizzontale
 * supera ±OBJECT_CONTAIN_HORIZONTAL_PAN_RANGE_PCT in modo lineare (es. -50 / +150 → ±24%).
 */
export const CROP_TOOL_SLIDER_MIN = -50;
export const CROP_TOOL_SLIDER_MAX = 150;

export function sliderXToContainerLeftPercent(x) {
  if (x == null || x === 50) return undefined;
  const raw = ((x - 50) / 50) * OBJECT_CONTAIN_HORIZONTAL_PAN_RANGE_PCT;
  const rounded = Math.round(raw * 100) / 100;
  return `${rounded}%`;
}

/** Inverso di sliderXToContainerLeftPercent; ritorna null se non è una percentua valida. */
export function containerLeftPercentToSliderX(str) {
  const m = String(str ?? '').trim().match(/^(-?[\d.]+)%$/);
  if (!m) return null;
  const pct = parseFloat(m[1]);
  return Math.round(
    Math.min(CROP_TOOL_SLIDER_MAX, Math.max(CROP_TOOL_SLIDER_MIN, 50 + (pct / OBJECT_CONTAIN_HORIZONTAL_PAN_RANGE_PCT) * 50))
  );
}

/**
 * Evita doppio pan orizzontale: object-position solo verticale (center + %) + translate X quando serve.
 * Compatibilità: `objectPosition: "40% 35%"` senza containerLeft viene mappato su translate + `center 35%`.
 */
export function normalizeContainCrop(objectPosition, containerLeft, containerTop) {
  let op = objectPosition || 'center center';
  const leftRaw = containerLeft != null && containerLeft !== '' ? containerLeft : undefined;
  const topRaw = containerTop != null && containerTop !== '' ? containerTop : undefined;

  if (leftRaw != null) {
    const dual = String(op).match(/^(\d+)%\s+(\d+)%$/);
    const normalizedOp = dual ? `center ${dual[2]}%` : op;
    return { objectPosition: normalizedOp, containerLeft: leftRaw, containerTop: topRaw };
  }

  const dual = String(op).match(/^(\d+)%\s+(\d+)%$/);
  if (dual) {
    const xv = parseInt(dual[1], 10);
    const leftDerived = xv !== 50 ? sliderXToContainerLeftPercent(xv) : undefined;
    return {
      objectPosition: `center ${dual[2]}%`,
      containerLeft: leftDerived,
      containerTop: topRaw,
    };
  }

  const xpctCenter = String(op).match(/^(\d+)%\s+center$/i);
  if (xpctCenter) {
    const xv = parseInt(xpctCenter[1], 10);
    const leftDerived = xv !== 50 ? sliderXToContainerLeftPercent(xv) : undefined;
    return {
      objectPosition: 'center center',
      containerLeft: leftDerived,
      containerTop: topRaw,
    };
  }

  return { objectPosition: op, containerLeft: undefined, containerTop: topRaw };
}

/** Estrae la % verticale da object-position stile carta (contain). */
export function parseObjectPositionCenterY(objectPosition) {
  const s = String(objectPosition ?? 'center center').trim();
  const centerY = s.match(/^center\s+(-?[\d.]+)%$/i);
  if (centerY) return parseFloat(centerY[1]);
  const dual = s.match(/^\d+(?:\.\d+)?%\s+(-?[\d.]+)%$/);
  if (dual) return parseFloat(dual[1]);
  if (/^center\s+center$/i.test(s)) return 50;
  if (/center/i.test(s)) return 50;
  return 50;
}

/** Somma un pan verticale in % a un containerTop esistente. */
export function addVerticalPanPercent(containerTop, addPercent) {
  if (addPercent == null || addPercent === 0) return containerTop;
  if (containerTop == null || containerTop === '') return `${addPercent}%`;
  const m = String(containerTop).trim().match(/^(-?[\d.]+)%$/);
  if (!m) return containerTop;
  const v = Math.round((parseFloat(m[1]) + addPercent) * 100) / 100;
  return `${v}%`;
}

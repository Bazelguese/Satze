import { ARMY_BONUSES } from '../../data/armies.js';
import { TRIGGER_NAMES } from '../../data/triggers.js';
import { ARCANA_NAME_BOX, ARCANA_SEALS } from './arcanaGeometry.js';

const BASE =
  typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL != null
    ? import.meta.env.BASE_URL
    : './';

/**
 * Font Arcana live: **Lora Semibold** (600) per tutti i testi.
 */
export const ARCANA_DISPLAY_FONT_URL = `${BASE}fonts/Lora-600.woff2`;
export const ARCANA_BODY_FONT_URL = `${BASE}fonts/Lora-600.woff2`;
export const ARCANA_DISPLAY_FONT_FAMILY = 'SatzeArcanaLora';
export const ARCANA_BODY_FONT_FAMILY = 'SatzeArcanaLora';
/** @deprecated */
export const ARCANA_CARD_FONT_URL = ARCANA_DISPLAY_FONT_URL;
export const ARCANA_CARD_FONT_FAMILY = ARCANA_DISPLAY_FONT_FAMILY;
export const ARCANA_FONT_URL = ARCANA_DISPLAY_FONT_URL;

export function arcanaFontForKey(_key) {
  return ARCANA_DISPLAY_FONT_FAMILY;
}

export function arcanaFontWeightForKey(_key) {
  return 600;
}

/**
 * Nudge Y sigilli. Negativo = alza i numeri (Lora Semibold legge basso nel cerchio).
 * Potenza/danno più alzati della lega.
 */
export const ARCANA_SEAL_Y_NUDGE = 0;
export const ARCANA_STAT_SEAL_Y_NUDGE = -16;

const sealY = (cy, nudge = ARCANA_SEAL_Y_NUDGE) => cy + nudge;

/** Chiavi layout tipografico bloccate tra kit (come Eldritch). */
export const ARCANA_LOCKED_LAYOUT_KEYS = [
  'name',
  'subtitle',
  'abilityTitle',
  'abilityText',
  'bonusTitle',
  'bonusText',
];

/** Layout testi default (spazio arte 1024). */
export const ARCANA_DEFAULT_TEXT_LAYOUT = {
  name: {
    x: ARCANA_NAME_BOX.x,
    w: ARCANA_NAME_BOX.w,
    boxY: ARCANA_NAME_BOX.boxY,
    h: ARCANA_NAME_BOX.h,
    size: 72,
    lineHeightRatio: 1.06,
  },
  subtitle: { x: 362, y: 208, w: 480, size: 36, lineHeight: 40 },
  league: {
    x: ARCANA_SEALS.league.cx,
    y: sealY(ARCANA_SEALS.league.cy),
    w: 118,
    size: 74,
  },
  power: {
    x: ARCANA_SEALS.power.cx,
    y: sealY(ARCANA_SEALS.power.cy, ARCANA_STAT_SEAL_Y_NUDGE),
    w: 125,
    size: 118,
  },
  damage: {
    x: ARCANA_SEALS.damage.cx,
    y: sealY(ARCANA_SEALS.damage.cy, ARCANA_STAT_SEAL_Y_NUDGE),
    w: 125,
    size: 118,
  },
  abilityTitle: { x: 367, y: 1114, w: 425, size: 52 },
  abilityText: { x: 377, y: 1172, w: 420, size: 44 },
  bonusTitle: { x: 672, y: 1298, w: 320, size: 46 },
  bonusText: { x: 672, y: 1352, w: 430, size: 38 },
};

export const ARCANA_DEFAULT_COLORS = {
  ink: '#080704',
  leagueInk: '#fff1ce',
};

/** Trigger / titoli potere sempre in maiuscolo (con due punti finali). */
export function formatArcanaTriggerTitle(raw) {
  const base = String(raw || 'SEMPRE').replace(/\s*:?\s*$/, '').trim();
  return `${base.toLocaleUpperCase('it-IT')}:`;
}

function abilityTitleFromAgent(agent) {
  const ability = agent?.ability;
  if (ability?.trigger && TRIGGER_NAMES[ability.trigger]) {
    return TRIGGER_NAMES[ability.trigger];
  }
  return 'Sempre';
}

function abilityTextFromAgent(agent) {
  const description = agent?.description;
  if (typeof description === 'string' && description.includes(':')) {
    const m = description.match(/^Potere:\s*[^:]+:\s*(.+)$/i);
    if (m) return m[1].trim();
    const m2 = description.match(/^Potere:\s*(.+)$/i);
    if (m2) return m2[1].trim();
  }
  return '';
}

function bonusParts(army) {
  const bonus = ARMY_BONUSES[army];
  if (!bonus) return { title: 'Sempre', text: '—' };
  const title =
    (bonus.trigger && TRIGGER_NAMES[bonus.trigger]) || 'Sempre';
  let text = String(bonus.description || '—').trim();
  if (title !== 'Sempre' && text.includes(':')) {
    text = text.slice(text.lastIndexOf(':') + 1).trim() || text;
  }
  return { title, text };
}

/**
 * "Mezzanotte, il Mai Nato" → title + subtitle (testo dopo la virgola).
 * @returns {{ title: string, subtitle: string }}
 */
export function splitArcanaDisplayName(name) {
  const raw = String(name || '').trim();
  if (!raw) return { title: '', subtitle: '' };
  const comma = raw.indexOf(',');
  if (comma < 0) return { title: raw, subtitle: '' };
  return {
    title: raw.slice(0, comma).trim(),
    subtitle: raw.slice(comma + 1).trim(),
  };
}

/** Nome (prima della virgola) → righe maiuscole per cartiglio Arcana. */
export function formatArcanaNameLines(name) {
  const { title } = splitArcanaDisplayName(name);
  const cleaned = title.trim();
  if (!cleaned) return ['—'];
  const parts = cleaned.split(/\s+/);
  if (parts.length <= 1) return [cleaned.toLocaleUpperCase('it-IT')];
  if (parts.length === 2) {
    return parts.map((p) => p.toLocaleUpperCase('it-IT'));
  }
  return [
    parts[0].toLocaleUpperCase('it-IT'),
    parts.slice(1).join(' ').toLocaleUpperCase('it-IT'),
  ];
}

/**
 * Modello testi live per overlay Arcana.
 * @param {object} agent
 * @param {object|null} kit
 */
export function buildArcanaLiveTexts(agent, kit = null) {
  const army = agent?.army || kit?.faction || "Figli dell'Orizzonte";
  const bonus = bonusParts(army);
  const kitLayout = kit?.textLayout || {};
  const layout = {
    ...ARCANA_DEFAULT_TEXT_LAYOUT,
    ...kitLayout,
  };
  // Tipografia cartigli bloccata tra kit (come Eldritch LOCKED_LAYOUT_KEYS).
  for (const key of ARCANA_LOCKED_LAYOUT_KEYS) {
    if (ARCANA_DEFAULT_TEXT_LAYOUT[key]) {
      layout[key] = { ...ARCANA_DEFAULT_TEXT_LAYOUT[key] };
    }
  }
  // Sigilli: forza centri GEOMETRY + nudge ottico (ignora y kit).
  layout.league = {
    ...ARCANA_DEFAULT_TEXT_LAYOUT.league,
    x: ARCANA_SEALS.league.cx,
    y: sealY(ARCANA_SEALS.league.cy),
  };
  layout.power = {
    ...ARCANA_DEFAULT_TEXT_LAYOUT.power,
    x: ARCANA_SEALS.power.cx,
    y: sealY(ARCANA_SEALS.power.cy, ARCANA_STAT_SEAL_Y_NUDGE),
  };
  layout.damage = {
    ...ARCANA_DEFAULT_TEXT_LAYOUT.damage,
    x: ARCANA_SEALS.damage.cx,
    y: sealY(ARCANA_SEALS.damage.cy, ARCANA_STAT_SEAL_Y_NUDGE),
  };

  const colors = {
    ...ARCANA_DEFAULT_COLORS,
    ...(kit?.textColors || {}),
  };

  const league = Number(agent?.league ?? kit?.league ?? 0);
  const power = Number(agent?.power ?? 0);
  const damage = Number(agent?.damage ?? 0);
  const fullName = agent?.name || kit?.displayName || kit?.label || '';
  const nameLines = formatArcanaNameLines(fullName);
  const { subtitle } = splitArcanaDisplayName(fullName);

  const nameBox = {
    ...ARCANA_DEFAULT_TEXT_LAYOUT.name,
    ...layout.name,
    x: layout.name?.x ?? ARCANA_NAME_BOX.x,
    w: layout.name?.w ?? ARCANA_NAME_BOX.w,
    boxY: layout.name?.boxY ?? ARCANA_NAME_BOX.boxY,
    h: subtitle
      ? layout.name?.hWithSubtitle ?? ARCANA_NAME_BOX.hWithSubtitle
      : layout.name?.h ?? ARCANA_NAME_BOX.h,
    fillBox: true,
  };

  const item = (key, box, lines, fill) => ({
    key,
    ...box,
    lines,
    fill,
    font: arcanaFontForKey(key),
    weight: arcanaFontWeightForKey(key),
  });

  const items = [item('name', nameBox, nameLines, colors.ink)];
  if (subtitle) {
    items.push(item('subtitle', layout.subtitle, [subtitle], colors.ink));
  }
  items.push(
    item('league', layout.league, [`L${league}`], colors.leagueInk),
    item('power', layout.power, [String(power)], colors.ink),
    item('damage', layout.damage, [String(damage)], colors.ink),
    item(
      'abilityTitle',
      layout.abilityTitle,
      [formatArcanaTriggerTitle(abilityTitleFromAgent(agent))],
      colors.ink
    ),
    item(
      'abilityText',
      layout.abilityText,
      [abilityTextFromAgent(agent) || '—'],
      colors.ink
    ),
    item(
      'bonusTitle',
      layout.bonusTitle,
      [formatArcanaTriggerTitle(bonus.title)],
      colors.ink
    ),
    item('bonusText', layout.bonusText, [bonus.text || '—'], colors.ink)
  );

  return { colors, items };
}

let fontLoadPromise = null;

export function loadArcanaCardFont() {
  if (typeof document === 'undefined') return Promise.resolve();
  if (fontLoadPromise) return fontLoadPromise;
  fontLoadPromise = (async () => {
    try {
      if (document.fonts?.check?.(`600 16px ${ARCANA_DISPLAY_FONT_FAMILY}`)) {
        return;
      }
      const face = new FontFace(
        ARCANA_DISPLAY_FONT_FAMILY,
        `url("${ARCANA_DISPLAY_FONT_URL}")`,
        { weight: '600', style: 'normal', display: 'swap' }
      );
      await face.load();
      document.fonts.add(face);
    } catch {
      /* fallback system serif */
    }
  })();
  return fontLoadPromise;
}

/** Riduce il corpo se la riga più lunga supera `maxW` (spazio arte). */
export function fitArcanaFontSize(
  lines,
  size,
  maxW,
  fontFamily = ARCANA_DISPLAY_FONT_FAMILY,
  weight = 600,
  letterSpacingEm = 0
) {
  if (typeof document === 'undefined') return size;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return size;
  let s = size;
  const min = 18;
  while (s > min) {
    ctx.font = `${weight} ${s}px ${fontFamily}, Lora, Georgia, serif`;
    const width = Math.max(
      ...lines.map((l) => {
        const raw = ctx.measureText(l).width;
        return raw + s * letterSpacingEm * Math.max(l.length - 1, 0);
      }),
      1
    );
    if (width <= maxW) return s;
    s -= 1;
  }
  return min;
}

/**
 * Riempie il box nome: massimo corpo che entra in larghezza e altezza.
 * @returns {{ size: number, lineHeight: number }}
 */
export function fitArcanaNameToBox(
  lines,
  maxW,
  maxH,
  fontFamily = ARCANA_DISPLAY_FONT_FAMILY,
  weight = 600,
  letterSpacingEm = 0.03,
  lineHeightRatio = 1.06
) {
  const n = Math.max(lines?.length || 1, 1);
  const min = 22;
  const max = n >= 2 ? 78 : 92;
  if (typeof document === 'undefined') {
    const size = Math.min(max, Math.max(min, Math.floor(maxH / (n * lineHeightRatio))));
    return { size, lineHeight: size * lineHeightRatio };
  }
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    const size = Math.min(max, min);
    return { size, lineHeight: size * lineHeightRatio };
  }
  const measure = (text, s) => {
    ctx.font = `${weight} ${s}px ${fontFamily}, Lora, Georgia, serif`;
    return (
      ctx.measureText(text).width + s * letterSpacingEm * Math.max(text.length - 1, 0)
    );
  };
  let lo = min;
  let hi = max;
  let best = min;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const widthOk = lines.every((l) => measure(l, mid) <= maxW);
    const heightOk = n * mid * lineHeightRatio <= maxH;
    if (widthOk && heightOk) {
      best = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return { size: best, lineHeight: best * lineHeightRatio };
}

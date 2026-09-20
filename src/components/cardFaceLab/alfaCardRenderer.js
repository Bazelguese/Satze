/**
 * Alfa / Eldritch card face renderer (from Atelier Alfa 1.3 — shared with editors).
 * Canvas 1024×1536 SVG. No React deps.
 */

import { leagueTierColorHex } from '../../data/leagueColors.js';

export const CARD_FACE_W = 1024;
export const CARD_FACE_H = 1536;

/** Colori UI carta — allineati a CardReworkP4. */
export const ELDRITCH_UI_COLORS = {
  power: '#fde047',
  damage: '#c084fc',
  ability: '#fb923c',
  bonus: '#38bdf8',
  cream: '#eee8c9',
};

export const ELDRITCH_COLORS = {
  'Concordia di Caelion': '#c7ad71',
  "Figli dell'Orizzonte": '#a288fb',
  Kethran: '#eebf3c',
  'Corte Rossa': '#f8504f',
  'Calibri Pesanti': '#a9a294',
  Orathai: '#5ad4bc',
  Mounthborn: '#c9e238',
  "L'Enclave delle Scaglie": '#fb912d',
  'Ratti della Megera': '#40ad60',
  "Patto degli Indocili": '#e867c3',
  Khemet: '#26c4e8',
  Apex: '#d5ecf9',
  Mascarada: '#437ef2',
};

export const ELEMENT_NAMES = {
  name: 'Nome',
  nameSubtitle: 'Sottotitolo nome',
  faction: 'Fazione',
  leagueMark: 'Sigla L lega',
  league: 'Numero lega',
  power: 'Numero potenza',
  powerLabel: 'Scritta POTENZA',
  damage: 'Numero danno',
  damageLabel: 'Scritta DANNO',
  abilityTitle: 'Titolo potere',
  abilityText: 'Testo potere',
  bonusTitle: 'Titolo bonus',
  bonusText: 'Testo bonus',
};

export const LAYOUT_RANGES = {
  x: [0, 1024],
  y: [0, 1536],
  w: [40, 1024],
  h: [30, 1536],
  fontSize: [16, 320],
  rotation: [-45, 45],
  slant: [-30, 30],
  scaleX: [0.4, 1.6],
  lineHeight: [0.85, 1.8],
};

/**
 * Regola Eldritch: se il nome contiene una virgola, la parte dopo è sottotitolo.
 * "Sorethai, il Primo Ancorante" → title "Sorethai", subtitle "il Primo Ancorante"
 */
export function splitEldritchName(fullName) {
  const raw = String(fullName ?? '').trim();
  const comma = raw.indexOf(',');
  if (comma < 0) return { title: raw, subtitle: '' };
  return {
    title: raw.slice(0, comma).trim(),
    subtitle: raw.slice(comma + 1).trim(),
  };
}

/** Layout tipico salvato dall’Atelier Eldritch (Sorethai). */
export const ELDRITCH_DEFAULT_LAYOUT = {
  damageLabel: { x: 794, y: 1340 },
  powerLabel: { x: 72, y: 1176 },
  league: { x: 836, y: 93 },
  name: { x: 82, y: 90, w: 715, h: 205, fontSize: 116, scaleX: 0.9 },
  nameSubtitle: { x: 88, y: 228, w: 500, h: 72, fontSize: 48 },
  // Targhetta armata — bordo destro fisso (Nucleo Comando Nord); il nome cresce a sinistra.
  faction: { x: 620, y: 285, w: 310, h: 60, fontSize: 40, anchor: 'end' },
  // Colonne effetti — regola unica (stesso x titolo/testo; sinistra↔potenza, destra↔danno).
  abilityTitle: { x: 248, y: 1000, w: 400, h: 110 },
  abilityText: { x: 248, y: 1095, w: 400, h: 80 },
  bonusTitle: { x: 530, y: 1180, w: 290, h: 110 },
  bonusText: { x: 530, y: 1275, w: 290, h: 80 },
  damage: { x: 803, y: 1120 },
};

/** Chiavi layout bloccate: i kit non le spostano. */
export const ELDRITCH_LOCKED_LAYOUT_KEYS = [
  'abilityTitle',
  'abilityText',
  'bonusTitle',
  'bonusText',
];

/** @deprecated alias */
export const ELDRITCH_LOCKED_EFFECT_KEYS = ELDRITCH_LOCKED_LAYOUT_KEYS;

/** Cornice interna sul canvas 1024×1536 (stessi % anteprima: 4.5 / 3.3 / 4.5 / 3.5). */
export const ELDRITCH_ART_CORNICE = {
  x: Math.round(1024 * 0.045),
  y: Math.round(1536 * 0.033),
  w: Math.round(1024 * (1 - 0.045 - 0.045)),
  h: Math.round(1536 * (1 - 0.033 - 0.035)),
};

export const ALFA_DEFAULTS = {
  name: 'Sorethai',
  faction: 'Fazione da confermare',
  league: 4,
  power: 3,
  damage: 1,
  ability: { title: 'Imboscata', text: 'Infliggi 2 danni diretti' },
  bonus: { title: 'Sempre', text: '+1 Potenza a tutti gli agenti' },
  accent: '#f22c59',
  artY: 0,
  artScale: 1,
  autoFaction: false,
  whiteBackground: false,
  layout: {},
};

const esc = (v) =>
  String(v ?? '').replace(
    /[&<>"']/g,
    (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c])
  );

let measureCtx = null;
let serial = 0;

function getMeasureCtx() {
  if (typeof document === 'undefined') return null;
  if (!measureCtx) {
    measureCtx = document.createElement('canvas').getContext('2d');
  }
  return measureCtx;
}

export function sanitizeLayout(input) {
  const result = {};
  if (!input || typeof input !== 'object' || Array.isArray(input)) return result;
  const srcMap = { ...input };
  // Alias kit atelier: subtitle → nameSubtitle
  if (srcMap.subtitle && !srcMap.nameSubtitle) srcMap.nameSubtitle = srcMap.subtitle;
  for (const key of Object.keys(ELEMENT_NAMES)) {
    const src = srcMap[key];
    if (!src || typeof src !== 'object' || Array.isArray(src)) continue;
    const item = {};
    for (const [prop, [min, max]] of Object.entries(LAYOUT_RANGES)) {
      if (Number.isFinite(src[prop])) item[prop] = Math.max(min, Math.min(max, src[prop]));
    }
    if (/^#[0-9a-f]{6}$/i.test(src.color)) item.color = src.color;
    if (typeof src.autoFit === 'boolean') item.autoFit = src.autoFit;
    result[key] = item;
  }
  return result;
}

function wrap(text, width, font) {
  const ctx = getMeasureCtx();
  if (!ctx) {
    return String(text)
      .split('\n')
      .flatMap((p) => p.trim().split(/\s+/).filter(Boolean));
  }
  ctx.font = font;
  const out = [];
  for (const paragraph of String(text).split('\n')) {
    let line = '';
    for (const word of paragraph.trim().split(/\s+/)) {
      if (ctx.measureText((line ? `${line} ` : '') + word).width <= width) {
        line += (line ? ' ' : '') + word;
        continue;
      }
      if (line) out.push(line);
      line = '';
      for (const c of word) {
        if (ctx.measureText(line + c).width > width && line) {
          out.push(line);
          line = '';
        }
        line += c;
      }
    }
    out.push(line);
  }
  return out;
}

function fit(text, box, family, max, min, maxLines = 99, lineHeight = 1.13) {
  for (let size = max; size >= min; size--) {
    const lines = wrap(text, box.w, `${size}px ${family}`);
    const leading = size * lineHeight;
    if (lines.length <= maxLines && lines.length * leading <= box.h) {
      return { lines, size, leading, overflow: false };
    }
  }
  return {
    lines: wrap(text, box.w, `${min}px ${family}`),
    size: min,
    leading: min * lineHeight,
    overflow: true,
  };
}

/** Una sola riga: nessun a capo; riduce solo il font fino a entrare in larghezza. */
function fitSingleLine(text, width, family, max, min, lineHeight = 1.13) {
  const raw = String(text ?? '')
    .replace(/\s*\n+\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const ctx = getMeasureCtx();
  for (let size = max; size >= min; size--) {
    if (!ctx) {
      return { lines: [raw], size, leading: size * lineHeight, overflow: false };
    }
    ctx.font = `${size}px ${family}`;
    if (ctx.measureText(raw).width <= width) {
      return { lines: [raw], size, leading: size * lineHeight, overflow: false };
    }
  }
  return {
    lines: [raw],
    size: min,
    leading: min * lineHeight,
    overflow: true,
  };
}

let fontsPromise = null;

/**
 * @param {{ displayFont: string, bodyFont: string }} assets
 */
export function loadCardFaceFonts(assets) {
  if (typeof document === 'undefined' || !assets?.displayFont || !assets?.bodyFont) {
    return Promise.resolve();
  }
  if (!fontsPromise) {
    fontsPromise = Promise.all(
      [
        ['AlfaDisplay', assets.displayFont],
        ['AlfaBody', assets.bodyFont],
      ].map(async ([family, url]) => {
        const face = new FontFace(family, `url("${url}")`);
        await face.load();
        document.fonts.add(face);
      })
    ).catch((err) => {
      fontsPromise = null;
      throw err;
    });
  }
  return fontsPromise;
}

/**
 * @param {object} input
 * @param {{ art?: string, displayFont?: string, bodyFont?: string, frame?: string, ring?: string, wide?: string, compact?: string, useArmyChrome?: boolean }} [assets]
 */
export function renderCardFace(input = {}, assets = {}) {
  const d = {
    ...ALFA_DEFAULTS,
    ...input,
    ability: { ...ALFA_DEFAULTS.ability, ...input.ability },
    bonus: { ...ALFA_DEFAULTS.bonus, ...input.bonus },
  };
  const id = `alfa${++serial}`;
  const accent =
    (d.autoFaction !== false && ELDRITCH_COLORS[d.faction]) ||
    (/^#[0-9a-f]{6}$/i.test(d.accent) ? d.accent : ALFA_DEFAULTS.accent);
  const warnings = [];
  const layouts = [];
  d.layout = sanitizeLayout(input.layout);

  const text = (key, value, box, family, max, min, color, maxLines, style = {}) => {
    const column = ELDRITCH_LOCKED_LAYOUT_KEYS.includes(key)
      ? ELDRITCH_DEFAULT_LAYOUT[key]
      : null;
    const cfg = {
      ...box,
      fontSize: max,
      rotation: style.rotation ?? (family === 'AlfaDisplay' ? -3.5 : -3),
      slant: style.slant ?? -6,
      scaleX: style.scaleX ?? (family === 'AlfaDisplay' ? 0.76 : 0.88),
      lineHeight: 1.13,
      color,
      autoFit: true,
      anchor: style.anchor || 'start',
      ...(column ? {} : d.layout[key] || {}),
      ...(column || {}),
    };
    box = { x: cfg.x, y: cfg.y, w: cfg.w, h: cfg.h };
    const sx = cfg.scaleX;
    const tilt = cfg.rotation;
    const slant = cfg.slant;
    const anchorEnd = cfg.anchor === 'end';
    const local = { w: (box.w - 20) / sx, h: box.h };
    const singleLine = maxLines === 1;
    const f = singleLine
      ? fitSingleLine(
          value,
          local.w,
          family,
          cfg.fontSize,
          cfg.autoFit ? Math.min(min, cfg.fontSize) : cfg.fontSize,
          cfg.lineHeight
        )
      : fit(
          value,
          local,
          family,
          cfg.fontSize,
          cfg.autoFit ? Math.min(min, cfg.fontSize) : cfg.fontSize,
          maxLines,
          cfg.lineHeight
        );
    // Lega: il glifo (scaleX ~0.82) resta a sinistra del centro anello con pad 16;
    // +14 allinea il numero nel foro dell’anello (Livelli / motion).
    const padX = key === 'league' ? 30 : key === 'leagueMark' ? 4 : 16;
    const padY = key === 'leagueMark' ? 8 : 12;
    // Ancoraggio a destra: bordo destro fisso, box si allarga a sinistra sul testo reale.
    // Testo sempre left-aligned nel box (niente text-anchor end: con skew/scale spariva).
    if (anchorEnd) {
      const right = box.x + box.w;
      const mctx = getMeasureCtx();
      let glyphW = local.w;
      if (mctx) {
        mctx.font = `${f.size}px ${family}`;
        glyphW = Math.max(1, ...f.lines.map((l) => mctx.measureText(l).width));
      }
      const tightW = Math.min(box.w, Math.max(80, glyphW * sx + padX * 2 + 36));
      box = { x: right - tightW, y: box.y, w: tightW, h: box.h };
    }
    layouts.push({
      key,
      label: ELEMENT_NAMES[key],
      text: value,
      box,
      ...f,
      config: cfg,
      scaleX: sx,
      rotation: tilt,
    });
    if (f.overflow) warnings.push(`${ELEMENT_NAMES[key]}: testo oltre lo spazio disponibile.`);
    if (box.x + box.w > CARD_FACE_W || box.y + box.h > CARD_FACE_H) {
      warnings.push(`${ELEMENT_NAMES[key]}: area fuori dalla carta.`);
    }
    const cid = `${id}-clip${layouts.length}`;
    // Nome/sottotitolo: niente wear-mask, altrimenti l'arte sotto "bucava" le lettere (ala sopra il nome).
    const maskAttr =
      key === 'name' || key === 'nameSubtitle'
        ? ''
        : `mask="url(#${family === 'AlfaBody' ? `${id}-light` : `${id}-wear`})"`;
    // Slant negativo spinge i glifi a sinistra: clip largo altrimenti taglia la P e l'ala sotto sembra sopra.
    const clipPadX = key === 'name' || key === 'nameSubtitle' ? 90 : 20;
    return `<g data-alfa-key="${key}" transform="translate(${box.x + padX} ${box.y + padY}) rotate(${tilt})"><g transform="skewX(${slant}) scale(${sx} 1)"><defs><clipPath id="${cid}"><rect x="${-clipPadX}" y="-10" width="${local.w + clipPadX * 2}" height="${box.h + 20}"/></clipPath></defs><text ${maskAttr} clip-path="url(#${cid})" fill="${cfg.color}" font-family="${family}" font-size="${f.size}">${f.lines.map((l, i) => `<tspan x="0" y="${f.size * 0.86 + i * f.leading}">${esc(l)}</tspan>`).join('')}</text></g></g>`;
  };

  const imageUrl = d.illustration || assets.art || '';
  const safeImage =
    /^(data:image\/(png|jpeg|webp);base64,|blob:|https?:\/\/)/i.test(imageUrl) ||
    (!imageUrl.includes(':') && !imageUrl.startsWith('//'))
      ? imageUrl
      : '';

  let seed = 1701;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  let grain = '';
  for (let i = 0; i < 600; i++) {
    const x = rand() * 128;
    const y = rand() * 128;
    const r = 0.15 + rand() * 0.85;
    grain += `<path d="M${x.toFixed(1)} ${y.toFixed(1)}l${(r * 2.4).toFixed(1)} -${r.toFixed(1)} ${r.toFixed(1)} ${(r * 1.7).toFixed(1)} -${(r * 2).toFixed(1)} ${(r * 0.9).toFixed(1)}Z" fill="black" opacity="${(0.3 + rand() * 0.7).toFixed(2)}"/>`;
  }

  const { title: nameTitle, subtitle: nameSub } = splitEldritchName(d.displayName || d.name);
  const title = text(
    'name',
    String(nameTitle).toUpperCase(),
    nameSub ? { x: 82, y: 82, w: 705, h: 140 } : { x: 82, y: 82, w: 705, h: 194 },
    'AlfaDisplay',
    nameSub ? 148 : 174,
    65,
    '#eee8c9',
    nameSub ? 1 : 2
  );
  const nameSubtitle = nameSub
    ? text(
        'nameSubtitle',
        nameSub,
        { x: 88, y: 228, w: 500, h: 72 },
        'AlfaBody',
        48,
        28,
        '#eee8c9',
        2,
        { scaleX: 0.9, rotation: -3, slant: -4 }
      )
    : '';
  // Tag armata: non più nel layout Eldritch (fazione resta nei dati per cornice/colori).
  const faction = '';
  const triggerLabel = (raw) => {
    const base = String(raw ?? '')
      .trim()
      .replace(/:+\s*$/, '');
    return `${base.toUpperCase()}:`;
  };
  const oneLine = (raw) =>
    String(raw ?? '')
      .replace(/\s*\n+\s*/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  // Colonna sinistra (accanto a POTENZA) e colonna destra (accanto a DANNO):
  // stesso x per titolo e testo — vedi ELDRITCH_DEFAULT_LAYOUT.
  const ability =
    text(
      'abilityTitle',
      triggerLabel(d.ability.title),
      ELDRITCH_DEFAULT_LAYOUT.abilityTitle,
      'AlfaDisplay',
      88,
      36,
      ELDRITCH_UI_COLORS.ability,
      1,
      { scaleX: 0.72, rotation: -3.5, slant: -3 }
    ) +
    text(
      'abilityText',
      oneLine(d.ability.text),
      ELDRITCH_DEFAULT_LAYOUT.abilityText,
      'AlfaBody',
      48,
      30,
      ELDRITCH_UI_COLORS.ability,
      1,
      { scaleX: 0.88, rotation: -3, slant: -3 }
    );
  const bonus =
    text(
      'bonusTitle',
      triggerLabel(d.bonus.title),
      ELDRITCH_DEFAULT_LAYOUT.bonusTitle,
      'AlfaDisplay',
      88,
      36,
      ELDRITCH_UI_COLORS.bonus,
      1,
      { scaleX: 0.72, rotation: -3, slant: -3 }
    ) +
    text(
      'bonusText',
      oneLine(d.bonus.text),
      ELDRITCH_DEFAULT_LAYOUT.bonusText,
      'AlfaBody',
      48,
      30,
      ELDRITCH_UI_COLORS.bonus,
      1,
      { scaleX: 0.88, rotation: -3, slant: -3 }
    );
  const leagueColor = leagueTierColorHex(d.league);
  const numeral = (key, v, x, y, size, width, scaleX = 0.82, color = ELDRITCH_UI_COLORS.cream) =>
    text(key, v, { x, y, w: width, h: size * 1.15 }, 'AlfaDisplay', size, 60, color, 1, {
      scaleX,
      rotation: -1,
      slant: 0,
    });
  // L + valore: centrati nel foro (centro = centro raster anello), senza mask wear
  // (la grain mask + macchia ink rendevano la L nera/illeggibile).
  const leagueX = d.layout.league?.x ?? 851;
  const leagueY = d.layout.league?.y ?? 108;
  const leagueRingSize = 195;
  const leagueRingX = leagueX - 38;
  const leagueRingY = leagueY - 26;
  const leagueCx = leagueRingX + leagueRingSize / 2;
  const leagueCy = leagueRingY + leagueRingSize / 2;
  const leagueNumSize = 108;
  const leagueLSize = 72;
  const leagueDigit = String(d.league ?? '');
  layouts.push({
    key: 'leagueMark',
    label: ELEMENT_NAMES.leagueMark,
    text: 'L',
    box: { x: leagueCx - 50, y: leagueCy - 40, w: 40, h: 70 },
    size: leagueLSize,
    lines: ['L'],
    leading: leagueLSize,
    config: { color: leagueColor },
    scaleX: 1,
    rotation: 0,
  });
  layouts.push({
    key: 'league',
    label: ELEMENT_NAMES.league,
    text: leagueDigit,
    box: { x: leagueCx - 15, y: leagueCy - 50, w: 90, h: 120 },
    size: leagueNumSize,
    lines: [leagueDigit],
    leading: leagueNumSize,
    config: { color: leagueColor, x: leagueX, y: leagueY, w: 120, h: 135 },
    scaleX: 1,
    rotation: 0,
  });
  // text-anchor middle sul blocco intero; alone senza mask; alone leggero per leggibilità sul nero.
  const leagueCluster = `<g data-alfa-key="league-cluster" transform="translate(${leagueCx.toFixed(1)} ${leagueCy.toFixed(1)})"><text text-anchor="middle" dominant-baseline="middle" fill="${leagueColor}" font-family="AlfaDisplay" stroke="#0a0a0c" stroke-width="5" paint-order="stroke fill" stroke-linejoin="round"><tspan font-size="${leagueLSize}" dx="0" dy="0">L</tspan><tspan font-size="${leagueNumSize}" dx="0.14em">${esc(leagueDigit)}</tspan></text></g>`;
  const leagueMark = '';
  const league = leagueCluster;
  // Stessa distanza verticale numero → etichetta (potenza e danno).
  const powerY = d.layout.power?.y ?? 956;
  const powerLabelY = d.layout.powerLabel?.y ?? 1174;
  const damageY = d.layout.damage?.y ?? 1120;
  const damageLabelY = damageY + (powerLabelY - powerY);
  // Forza la Y dell’etichetta danno (i layout kit non devono spezzare la simmetria).
  d.layout = {
    ...d.layout,
    damageLabel: { ...(d.layout.damageLabel || {}), y: damageLabelY },
  };
  const power = numeral('power', d.power, 82, powerY, 235, 170, 1.03, ELDRITCH_UI_COLORS.power);
  const damage = numeral('damage', d.damage, 820, damageY, 235, 155, 0.82, ELDRITCH_UI_COLORS.damage);
  const labels =
    text(
      'powerLabel',
      'POTENZA',
      { x: 68, y: powerLabelY, w: 168, h: 63 },
      'AlfaDisplay',
      46,
      36,
      ELDRITCH_UI_COLORS.power,
      1
    ) +
    text(
      'damageLabel',
      'DANNO',
      { x: 790, y: damageLabelY, w: 160, h: 64 },
      'AlfaDisplay',
      48,
      36,
      ELDRITCH_UI_COLORS.damage,
      1
    );

  const scale = Math.max(0.7, Math.min(1.5, Number(d.artScale) || 1));
  const artY = Math.max(-300, Math.min(300, Number(d.artY) || 0));
  const fontCss =
    assets.displayFont && assets.bodyFont
      ? `@font-face{font-family:AlfaDisplay;src:url('${assets.displayFont}')}@font-face{font-family:AlfaBody;src:url('${assets.bodyFont}')}`
      : '';

  const layoutAssets = {
    frame: assets.frame || '',
    ring: assets.ring || '',
    wide: assets.wide || '',
    compact: assets.compact || '',
  };
  const layoutOnly = Boolean(d.layoutOnly || assets.layoutOnly);
  const hasPainted = Boolean(layoutAssets.frame && layoutAssets.wide && layoutAssets.compact && layoutAssets.ring);
  const tintFrame = hasPainted && !assets.useArmyChrome && !layoutOnly;

  const raster = (key, assetKey, x, y, w, h, extra = '') => {
    const href = layoutAssets[assetKey];
    if (!href) return '';
    return `<image data-raster="${key}" href="${esc(href)}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="none" ${extra}/>`;
  };

  const patch = (key, keys, asset = 'wide') => {
    const els = layouts.filter((l) => keys.includes(l.key));
    if (!els.length) return '';
    const x = Math.min(...els.map((l) => l.box.x));
    const y = Math.min(...els.map((l) => l.box.y));
    const w = Math.max(...els.map((l) => l.box.x + l.box.w)) - x;
    const h =
      Math.max(...els.map((l) => l.box.y + Math.min(l.box.h, l.lines.length * l.leading))) - y;
    return asset === 'wide'
      ? raster(key, asset, x - w * 0.32, y - h * 0.65, w * 1.65, h * 2.25)
      : raster(key, asset, x - w * 0.6, y - h * 0.35, w * 2.2, h * 1.7);
  };

  let body;
  if (hasPainted) {
    const stains =
      patch('ink-name', nameSub ? ['name', 'nameSubtitle'] : ['name']) +
      patch('ink-ability', ['abilityTitle', 'abilityText']) +
      patch('ink-bonus', ['bonusTitle', 'bonusText']) +
      patch('ink-power', ['power', 'powerLabel'], 'compact') +
      patch('ink-damage', ['damage', 'damageLabel'], 'compact');
    // Niente macchia ink sotto la lega: oscurava L/numero nel foro nero.
    const rx = leagueRingX;
    const ry = leagueRingY;
    const tintExtra = tintFrame ? `filter="url(#${id}-tint)"` : '';
    const frame = layoutOnly
      ? ''
      : raster('frame', 'frame', 0, 0, CARD_FACE_W, CARD_FACE_H, tintExtra);
    const ring = raster('league-ring', 'ring', rx, ry, leagueRingSize, leagueRingSize, tintExtra);
    const artLayer =
      layoutOnly || d.whiteBackground
        ? ''
        : `<image data-raster="art" href="${esc(safeImage)}" x="${(CARD_FACE_W - CARD_FACE_W * scale) / 2}" y="${artY}" width="${CARD_FACE_W * scale}" height="${CARD_FACE_H * scale}" preserveAspectRatio="xMidYMid slice"/>`;
    const baseFill = layoutOnly
      ? 'transparent'
      : d.whiteBackground
        ? '#ffffff'
        : '#08080a';
    // Clip tondo sempre: in layoutOnly le macchie altrimenti finivano sulla cornice PNG.
    const clipOpen = `<g clip-path="url(#${id}-round)">`;
    const clipClose = `</g>`;
    // ink sotto la cornice (clip + z-order bake/layered); type sopra.
    body = `<rect width="1024" height="1536" fill="${baseFill}"/>${clipOpen}${artLayer}<g data-layer="ink">${stains}</g>${clipClose}<g data-layer="frame">${frame}</g><g data-layer="league-ring">${ring}</g><g data-layer="type">${title}${nameSubtitle}${faction}${leagueMark}${league}${ability}${bonus}${power}${damage}${labels}</g>`;
  } else {
    // Fallback Alfa 1.x (bordo SVG) se mancano gli asset dipinti
    let flecks = '';
    for (let i = 0; i < 1500; i++) {
      const x = rand() * CARD_FACE_W;
      const y = rand() * CARD_FACE_H;
      const r = 0.5 + rand() * 1.5;
      flecks += `<path d="M${x.toFixed(1)} ${y.toFixed(1)}l${(r * 2.3).toFixed(1)} -${r.toFixed(1)}" stroke="#050507" stroke-width="${r.toFixed(1)}" opacity="${(0.16 + rand() * 0.38).toFixed(2)}"/>`;
    }
    body = `<rect width="1024" height="1536" fill="#08080a"/><g clip-path="url(#${id}-round)"><image href="${esc(safeImage)}" x="${(CARD_FACE_W - CARD_FACE_W * scale) / 2}" y="${artY}" width="${CARD_FACE_W * scale}" height="${CARD_FACE_H * scale}" preserveAspectRatio="xMidYMid slice"/><rect width="1024" height="1536" fill="url(#${id}-shade)"/>
    <rect mask="url(#${id}-wear)" x="51" y="55" width="922" height="1424" rx="47" fill="none" stroke="${accent}" stroke-width="12"/><path d="M61 228L49 445M972 584L963 911M54 1257L60 1409M112 1478L291 1472M749 57L927 63" stroke="#09090b" stroke-width="7" fill="none"/><path mask="url(#${id}-wear)" d="M866 90C986 66 982 239 880 239C781 240 791 102 866 90Z" fill="none" stroke="${accent}" stroke-width="7"/>
    <g>${title}${nameSubtitle}${faction}${leagueMark}${league}${ability}${bonus}${power}${damage}${labels}</g><g pointer-events="none">${flecks}</g></g>`;
  }

  const tintFilter = tintFrame
    ? `<filter id="${id}-tint" color-interpolation-filters="sRGB"><feFlood flood-color="${accent}"/><feComposite in2="SourceAlpha" operator="in"/></filter>`
    : '';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1536" viewBox="0 0 1024 1536" role="img" aria-labelledby="${id}-title"><title id="${id}-title">${esc(d.name)} — lega ${esc(d.league)}, potenza ${esc(d.power)}, danno ${esc(d.damage)}. ${esc(d.ability.title)}: ${esc(d.ability.text)}. ${esc(d.bonus.title)}: ${esc(d.bonus.text)}.</title>
    <defs>${tintFilter}<pattern id="${id}-grain" width="128" height="128" patternUnits="userSpaceOnUse"><rect width="128" height="128" fill="white"/>${grain}</pattern><mask id="${id}-wear"><rect width="1024" height="1536" fill="url(#${id}-grain)"/></mask><mask id="${id}-light"><rect width="1024" height="1536" fill="white"/><rect width="1024" height="1536" fill="url(#${id}-grain)" opacity=".2"/></mask><style>${fontCss}</style><clipPath id="${id}-round"><rect x="39" y="43" width="946" height="1450" rx="57"/></clipPath><linearGradient id="${id}-shade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#060608"/><stop offset=".14" stop-color="#060608" stop-opacity=".93"/><stop offset=".24" stop-color="#060608" stop-opacity="0"/><stop offset="1" stop-color="#060608" stop-opacity="0"/></linearGradient></defs>
    ${body}</svg>`;

  return { svg, warnings, layouts, data: { ...d, accent }, accent };
}

export function parseLayoutFile(obj) {
  if (!obj || typeof obj !== 'object') throw new Error('JSON non valido');
  const okTypes = ['satze-alfa-layout', 'satze-eldritch-layout'];
  if (!okTypes.includes(obj.type) || obj.version !== 1 || !obj.elements) {
    throw new Error('Formato layout non riconosciuto (atteso satze-alfa-layout / satze-eldritch-layout v1)');
  }
  const elements = sanitizeLayout(obj.elements);
  if (!Object.keys(elements).length) throw new Error('Nessun elemento valido');
  return elements;
}

export function parseCardFaceJson(obj, base = ALFA_DEFAULTS) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) throw new Error('Scheda non valida');
  const n = structuredClone(base);
  for (const k of ['name', 'displayName', 'faction', 'style', 'description', 'flavour']) {
    if (typeof obj[k] === 'string') n[k] = obj[k];
  }
  for (const k of ['league', 'power', 'damage']) {
    if (Number.isFinite(obj[k]) && obj[k] >= 0 && obj[k] <= 99) n[k] = obj[k];
  }
  if (/^#[0-9a-f]{6}$/i.test(obj.accent)) n.accent = obj.accent;
  for (const k of ['ability', 'bonus']) {
    for (const p of ['title', 'text']) {
      if (typeof obj[k]?.[p] === 'string') n[k][p] = obj[k][p];
    }
  }
  for (const k of ['artY', 'artScale']) {
    if (Number.isFinite(obj[k])) n[k] = obj[k];
  }
  if (
    typeof obj.illustration === 'string' &&
    /^data:image\/(png|jpeg|webp);base64,/.test(obj.illustration)
  ) {
    n.illustration = obj.illustration;
  }
  if (typeof obj.autoFaction === 'boolean') n.autoFaction = obj.autoFaction;
  if (typeof obj.whiteBackground === 'boolean') n.whiteBackground = obj.whiteBackground;
  if (Number.isInteger(obj.id)) n.id = obj.id;
  n.layout = sanitizeLayout(obj.layout);
  return n;
}

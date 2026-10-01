/**
 * Geometria Arcana dal kit (src/geometry.js).
 * Path in spazio arte 1024×1536; montaggio canvas 1104×1584 = translate(24 0) scale(1.03125).
 */

export const ARCANA_ART_W = 1024;
export const ARCANA_ART_H = 1536;
export const ARCANA_CANVAS_W = 1104;
export const ARCANA_CANVAS_H = 1584;
export const ARCANA_ART_SCALE = 1.03125;
export const ARCANA_ART_X = 24;

/** Sagoma interna carta — ritaglia lo sfondo. */
export const ARCANA_OUTER_PATH =
  'M158 53 H809 Q946 53 956 152 L957 1382 Q958 1468 910 1471 H258 Q182 1471 163 1432 Q69 1430 70 1378 L61 989 L64 480 L70 154 Q73 57 158 53Z';

/** Cartigli (spazio arte). */
export const ARCANA_PANEL_PATHS = {
  name: 'M156 49 C70 48 70 119 70 151 C69 208 98 238 220 250 C340 266 532 231 611 203 C658 185 672 125 649 89 C626 50 595 50 548 49Z',
  ability:
    'M65 970 C69 1045 162 1068 310 1068 C492 1068 626 1052 677 1180 L687 1258 C624 1191 561 1219 403 1228 C229 1229 99 1206 83 1183 C66 1146 63 1066 65 970Z',
  bonus:
    'M350 1230 C414 1281 552 1260 700 1267 C844 1267 932 1302 946 1404 L938 1471 C900 1409 838 1416 730 1416 C544 1416 397 1398 370 1336 C354 1302 348 1263 350 1230Z',
};

/**
 * Baseline curva 2ª riga nome — deprecata (niente più textPath obbligatorio).
 * @deprecated
 */
export const ARCANA_NAME_LINE2_PATH =
  'M150 168 C240 188 310 196 400 194 C490 190 560 175 640 158';

/** @deprecated */
export const ARCANA_NAME_LINE2_PATH_FIT = 0.88;

/** Box tipografico nome nel cartiglio (spazio arte). */
export const ARCANA_NAME_BOX = {
  x: 362,
  w: 520,
  /** Top del rettangolo utile nel cartiglio. */
  boxY: 78,
  /** Altezza utile (senza sottotitolo). Con sottotitolo si riduce. */
  h: 138,
  hWithSubtitle: 86,
};

/** Sigilli (spazio arte). */
export const ARCANA_SEALS = {
  league: { cx: 884, cy: 144, r: 98 },
  power: { cx: 145, cy: 904, r: 103 },
  damage: { cx: 880, cy: 904, r: 103 },
};

/** Arte → objectBoundingBox sul canvas 1104×1584. */
export const ARCANA_OUTER_CLIP_TRANSFORM = `scale(${1 / ARCANA_CANVAS_W} ${1 / ARCANA_CANVAS_H}) translate(${ARCANA_ART_X} 0) scale(${ARCANA_ART_SCALE})`;

/** Gruppo arte dentro SVG canvas 1104×1584. */
export const ARCANA_ART_GROUP_TRANSFORM = `translate(${ARCANA_ART_X} 0) scale(${ARCANA_ART_SCALE})`;

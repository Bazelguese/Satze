/** Preferenze ingresso carta in campo (posa click / drop + stile effetti). */

export const PLACE_FX_STORAGE_KEY = 'satze_place_fx';

export const DROP_PLACE_FX = ['slam', 'bounce', 'whirlwind', 'gate', 'guillotine', 'meteor'];
export const CLICK_PLACE_FX = ['rise', 'flip', 'bloom', 'ascend', 'unfold', 'spiral'];
export const PLACE_FX_STYLES = [null, 'runic', 'thunder', 'sigil', 'shock'];

export const DEFAULT_PLACE_FX = {
  drop: 'slam',
  click: 'rise',
  style: null,
};

export const DROP_PLACE_FX_OPTIONS = [
  { key: 'slam', title: 'Tonfo', sub: 'SLAM', desc: 'Piomba coricata e sbatte sul piano.' },
  { key: 'bounce', title: 'Rimbalzo', sub: 'BOUNCE', desc: 'Cala pesante e rimbalza tre volte.' },
  { key: 'whirlwind', title: 'Turbine', sub: 'WHIRL', desc: 'Caduta inclinata, poi vortica su sé stessa.' },
  { key: 'gate', title: 'Varco', sub: 'GATE', desc: 'Un varco si apre e la carta ne esce.' },
  { key: 'guillotine', title: 'Ghigliottina', sub: 'FALL', desc: 'Cala rigida con stop secco.' },
  { key: 'meteor', title: 'Meteora', sub: 'METEOR', desc: 'Precipita verso la camera e frena.' },
];

export const CLICK_PLACE_FX_OPTIONS = [
  { key: 'rise', title: 'Emersione', sub: 'RISE', desc: 'Emerge dal piano verso la camera.' },
  { key: 'flip', title: 'Rivelazione', sub: 'FLIP', desc: 'Risale di dorso e si gira sul posto.' },
  { key: 'bloom', title: 'Sboccio', sub: 'BLOOM', desc: 'Si dispiega dal centro del piano.' },
  { key: 'ascend', title: 'Ascesa', sub: 'ASCEND', desc: 'Salita lenta e solenne.' },
  { key: 'unfold', title: 'Anta', sub: 'UNFOLD', desc: 'Si alza in verticale come un\'anta.' },
  { key: 'spiral', title: 'Spirale', sub: 'SPIRAL', desc: 'Risale avvitandosi su sé stessa.' },
];

export const PLACE_FX_STYLE_OPTIONS = [
  { key: null, title: 'Ufficiale', sub: 'DEFAULT', desc: 'Look effetti di default del duello.' },
  { key: 'runic', title: 'Runico', sub: 'RUNIC', desc: 'Cerchi tratteggiati e cornici squadrate.' },
  { key: 'thunder', title: 'Tuono', sub: 'THUNDER', desc: 'Doppio lampo a scatti con scariche.' },
  { key: 'sigil', title: 'Sigillo', sub: 'SIGIL', desc: 'Sigillo quadrato che si apre e chiude.' },
  { key: 'shock', title: 'Onda', sub: 'SHOCK', desc: 'Un anello enorme sfocato.' },
];

const DROP_SET = new Set(DROP_PLACE_FX);
const CLICK_SET = new Set(CLICK_PLACE_FX);
const STYLE_SET = new Set(PLACE_FX_STYLES.map((s) => String(s)));

function readStorage() {
  if (typeof window !== 'undefined' && window.localStorage) return window.localStorage;
  if (typeof globalThis !== 'undefined' && globalThis.localStorage) return globalThis.localStorage;
  return null;
}

export function isValidDropPlaceFx(key) {
  return DROP_SET.has(key);
}

export function isValidClickPlaceFx(key) {
  return CLICK_SET.has(key);
}

export function isValidPlaceFxStyle(key) {
  return STYLE_SET.has(String(key));
}

export function pickPlaceFx(list, wanted, fallback) {
  return list.includes(wanted) ? wanted : fallback;
}

export function needsTwoFaces(fx) {
  return fx === 'flip' || fx === 'whirlwind';
}

function normalizePrefs(raw) {
  const drop = isValidDropPlaceFx(raw?.drop) ? raw.drop : DEFAULT_PLACE_FX.drop;
  const click = isValidClickPlaceFx(raw?.click) ? raw.click : DEFAULT_PLACE_FX.click;
  const styleRaw = raw?.style === undefined ? DEFAULT_PLACE_FX.style : raw.style;
  const style = isValidPlaceFxStyle(styleRaw) ? styleRaw : DEFAULT_PLACE_FX.style;
  return { drop, click, style };
}

export function getPlaceFxPreference() {
  const storage = readStorage();
  if (!storage) return { ...DEFAULT_PLACE_FX };
  try {
    const stored = storage.getItem(PLACE_FX_STORAGE_KEY);
    if (!stored) return { ...DEFAULT_PLACE_FX };
    return normalizePrefs(JSON.parse(stored));
  } catch {
    return { ...DEFAULT_PLACE_FX };
  }
}

/** Alias config runtime usata dal duello (doc handoff). */
export function getDuelPlaceFx() {
  return getPlaceFxPreference();
}

export function setPlaceFxPreference(partial) {
  const next = normalizePrefs({ ...getPlaceFxPreference(), ...partial });
  const storage = readStorage();
  if (!storage) return next;
  try {
    storage.setItem(PLACE_FX_STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore quota */
  }
  return next;
}

export function getDropPlaceFxMeta(key) {
  return DROP_PLACE_FX_OPTIONS.find((o) => o.key === key) ?? DROP_PLACE_FX_OPTIONS[0];
}

export function getClickPlaceFxMeta(key) {
  return CLICK_PLACE_FX_OPTIONS.find((o) => o.key === key) ?? CLICK_PLACE_FX_OPTIONS[0];
}

export function getPlaceFxStyleMeta(key) {
  return PLACE_FX_STYLE_OPTIONS.find((o) => String(o.key) === String(key)) ?? PLACE_FX_STYLE_OPTIONS[0];
}

/** Resolve posa per via (click/drop) con fallback obbligatorio. */
export function resolvePlaceFxForVia(via, prefs = getPlaceFxPreference()) {
  if (via === 'drop') {
    return pickPlaceFx(DROP_PLACE_FX, prefs.drop, DEFAULT_PLACE_FX.drop);
  }
  return pickPlaceFx(CLICK_PLACE_FX, prefs.click, DEFAULT_PLACE_FX.click);
}

/** Classe stile effetti (`fxstyle-*`) o stringa vuota se ufficiale. */
export function placeFxStyleClass(style = getPlaceFxPreference().style) {
  return style ? ` fxstyle-${style}` : '';
}

/** Posa casuale nella famiglia giusta (es. avversario). */
export function pickRandomPlaceFx(via) {
  const list = via === 'drop' ? DROP_PLACE_FX : CLICK_PLACE_FX;
  return list[Math.floor(Math.random() * list.length)];
}

/** Durata utile (ms) per riprodurre l'anteprima; include coda effetti. */
export const PLACE_FX_DURATION_MS = {
  slam: 900,
  bounce: 1500,
  whirlwind: 1200,
  gate: 1100,
  guillotine: 800,
  meteor: 1100,
  rise: 1000,
  flip: 1700,
  bloom: 1000,
  ascend: 1300,
  unfold: 1050,
  spiral: 1100,
};

export function getPlaceFxDurationMs(fx) {
  return PLACE_FX_DURATION_MS[fx] ?? 1200;
}

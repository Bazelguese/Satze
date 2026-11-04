// ============================================================
// Layout del tavolo a quattro carte del 2v2 (TeamDuelBoard)
// ============================================================
// Ogni versione descrive dove stanno le quattro carte nella scena del duello (1920×1080):
//   x, y   angolo in alto a sinistra della carta (230×330 a scala 1)
//   s      scala
//   r      rotazione in gradi
//   z      livello (più alto = davanti)
//   dim    luminosità 0–1 (1 = normale)
//   front  passandoci sopra la carta viene in primo piano
//   tagX, tagY, tagAlign   etichetta (nome, Campo, avversario) rispetto alla carta
// mode 'all' mostra le quattro carte; 'pairs' una coppia alla volta (con i due tasti in pairsX/pairsY).
//
// Le modifiche fatte nel laboratorio (Strumenti dev → TAVOLO 2V2 LAB) restano nel browser
// (localStorage). Per renderle predefinite: Esporta JSON e copiarle in DEFAULT_TEAM_BOARD_LAYOUTS.
// ============================================================

export const CARD_W = 230;
export const CARD_H = 330;

export const SLOT_KEYS = ['enemyMate', 'enemyMain', 'playerMain', 'playerMate'];

export const SLOT_LABELS = {
  enemyMate: 'Secondo avversario',
  enemyMain: 'Avversario principale',
  playerMain: 'Tu',
  playerMate: 'Compagno',
};

const slot = (x, y, extra = {}) => ({
  x, y, s: 1, r: 0, z: 3, dim: 1, front: false, tagX: 0, tagY: null, tagAlign: 'center', ...extra,
});

export const DEFAULT_TEAM_BOARD_LAYOUTS = {
  quattro: {
    name: 'Quattro slot',
    mode: 'all',
    slots: {
      enemyMate: slot(462, 430, { s: 0.72 }),
      enemyMain: slot(650, 430, { s: 0.72 }),
      playerMain: slot(1106, 430, { s: 0.72 }),
      playerMate: slot(1294, 430, { s: 0.72 }),
    },
  },
  accanto: {
    name: 'Compagno accanto',
    mode: 'all',
    slots: {
      enemyMate: slot(462, 555, { s: 0.5, z: 2 }),
      enemyMain: slot(588, 390),
      playerMain: slot(1106, 390),
      playerMate: slot(1343, 555, { s: 0.5, z: 2 }),
    },
  },
  ventaglio: {
    name: 'Ventaglio',
    mode: 'all',
    slots: {
      // Il nome del secondo avversario e del compagno sta centrato sopra la loro carta.
      enemyMate: slot(488, 356, { r: -9, z: 1, dim: 0.62, front: true, tagY: -24 }),
      enemyMain: slot(588, 390),
      playerMain: slot(1106, 390),
      playerMate: slot(1206, 356, { r: 9, z: 1, dim: 0.62, front: true, tagY: -24 }),
    },
  },
  alternanza: {
    name: 'Alternanza',
    mode: 'pairs',
    pairsX: 960,
    pairsY: 790,
    slots: {
      enemyMate: slot(588, 390),
      enemyMain: slot(588, 390),
      playerMain: slot(1106, 390),
      playerMate: slot(1106, 390),
    },
  },
};

export const DEFAULT_VARIANT_ID = 'ventaglio';

const LAYOUTS_KEY = 'satze_2v2_board_layouts';
const ACTIVE_KEY = 'satze_2v2_board_variant';
const CHANGE_EVENT = 'satze-board-layouts-change';

function readJson(key) {
  try {
    const raw = window.localStorage?.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeJson(key, value) {
  try {
    window.localStorage?.setItem(key, JSON.stringify(value));
  } catch {
    /* preferenza facoltativa */
  }
}

function notify() {
  try {
    window.dispatchEvent(new Event(CHANGE_EVENT));
  } catch {
    /* fuori dal browser */
  }
}

function clone(v) {
  return JSON.parse(JSON.stringify(v));
}

/** Completa un layout con i valori mancanti (versioni salvate da versioni precedenti). */
export function normalizeLayout(layout, fallback = DEFAULT_TEAM_BOARD_LAYOUTS[DEFAULT_VARIANT_ID]) {
  const out = { name: layout?.name || fallback.name, mode: layout?.mode === 'pairs' ? 'pairs' : 'all', slots: {} };
  if (out.mode === 'pairs') {
    out.pairsX = Number.isFinite(layout?.pairsX) ? layout.pairsX : 960;
    out.pairsY = Number.isFinite(layout?.pairsY) ? layout.pairsY : 790;
  }
  for (const key of SLOT_KEYS) {
    out.slots[key] = { ...slot(0, 0), ...(fallback.slots?.[key] || {}), ...(layout?.slots?.[key] || {}) };
  }
  if (layout?.custom) out.custom = true;
  return out;
}

/** Tutte le versioni: predefinite (con eventuali modifiche) e create nel laboratorio. */
export function loadBoardLayouts() {
  const saved = readJson(LAYOUTS_KEY) || {};
  const out = {};
  for (const [id, def] of Object.entries(DEFAULT_TEAM_BOARD_LAYOUTS)) {
    out[id] = normalizeLayout(saved[id] || def, def);
  }
  for (const [id, layout] of Object.entries(saved)) {
    if (!out[id] && layout?.custom) out[id] = normalizeLayout(layout);
  }
  return out;
}

export function saveBoardLayout(id, layout) {
  const saved = readJson(LAYOUTS_KEY) || {};
  saved[id] = clone(layout);
  writeJson(LAYOUTS_KEY, saved);
  notify();
}

/** Ripristina una versione predefinita (elimina le modifiche salvate). */
export function resetBoardLayout(id) {
  const saved = readJson(LAYOUTS_KEY) || {};
  delete saved[id];
  writeJson(LAYOUTS_KEY, saved);
  notify();
}

/** Crea una nuova versione copiando quella indicata. Restituisce il nuovo id. */
export function duplicateBoardLayout(fromId, name) {
  const layouts = loadBoardLayouts();
  const base = layouts[fromId] || layouts[DEFAULT_VARIANT_ID];
  let n = 1;
  while (layouts[`custom-${n}`]) n += 1;
  const id = `custom-${n}`;
  saveBoardLayout(id, { ...clone(base), name: name || `${base.name} (copia)`, custom: true });
  return id;
}

export function deleteBoardLayout(id) {
  if (DEFAULT_TEAM_BOARD_LAYOUTS[id]) return;
  resetBoardLayout(id);
  if (readActiveBoardLayoutId() === id) writeActiveBoardLayoutId(DEFAULT_VARIANT_ID);
}

export function readActiveBoardLayoutId() {
  try {
    const id = window.localStorage?.getItem(ACTIVE_KEY);
    return id && loadBoardLayouts()[id] ? id : DEFAULT_VARIANT_ID;
  } catch {
    return DEFAULT_VARIANT_ID;
  }
}

export function writeActiveBoardLayoutId(id) {
  try {
    window.localStorage?.setItem(ACTIVE_KEY, id);
  } catch {
    /* preferenza facoltativa */
  }
  notify();
}

export function exportBoardLayouts() {
  return JSON.stringify(loadBoardLayouts(), null, 2);
}

/** Importa versioni da JSON (stesso formato dell'esportazione). Restituisce gli id importati. */
export function importBoardLayouts(json) {
  const data = typeof json === 'string' ? JSON.parse(json) : json;
  if (!data || typeof data !== 'object') throw new Error('JSON non valido');
  const ids = [];
  for (const [id, layout] of Object.entries(data)) {
    if (!layout?.slots) continue;
    const isDefault = Boolean(DEFAULT_TEAM_BOARD_LAYOUTS[id]);
    saveBoardLayout(id, normalizeLayout({ ...layout, custom: isDefault ? undefined : true }, DEFAULT_TEAM_BOARD_LAYOUTS[id]));
    ids.push(id);
  }
  return ids;
}

/** Ascolta le modifiche (anche da un'altra scheda con il laboratorio aperto). */
export function subscribeBoardLayouts(callback) {
  const onStorage = (e) => {
    if (e.key === LAYOUTS_KEY || e.key === ACTIVE_KEY) callback();
  };
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener('storage', onStorage);
  };
}

/** Preferenza faccia Eldritch per carta — galleria scrive, partita legge. */

export const ELDRITCH_FACE_STORAGE_KEY = 'satze_eldritch_faces_v1';
export const ELDRITCH_FACE_CHANGE_EVENT = 'satze-eldritch-face-change';

/** @typedef {'standard'|'eldritch'} EldritchFaceMode */

function readStorage() {
  if (typeof window !== 'undefined' && window.localStorage) return window.localStorage;
  if (typeof globalThis !== 'undefined' && globalThis.localStorage) return globalThis.localStorage;
  return null;
}

function readMap() {
  const storage = readStorage();
  if (!storage) return {};
  try {
    const raw = storage.getItem(ELDRITCH_FACE_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeMap(map) {
  const storage = readStorage();
  if (!storage) return;
  try {
    storage.setItem(ELDRITCH_FACE_STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* ignore quota */
  }
}

function emitChange(agentId, mode) {
  if (typeof window === 'undefined') return;
  try {
    window.dispatchEvent(
      new CustomEvent(ELDRITCH_FACE_CHANGE_EVENT, {
        detail: { agentId: Number(agentId), mode },
      })
    );
  } catch {
    /* ignore */
  }
}

/**
 * @param {number|string} agentId
 * @returns {EldritchFaceMode}
 */
export function getEldritchFacePreference(agentId) {
  const id = String(agentId);
  const map = readMap();
  return map[id] === 'eldritch' ? 'eldritch' : 'standard';
}

/**
 * @param {number|string} agentId
 * @param {EldritchFaceMode} mode
 */
export function setEldritchFacePreference(agentId, mode) {
  const id = String(agentId);
  const nextMode = mode === 'eldritch' ? 'eldritch' : 'standard';
  const map = { ...readMap() };
  if (nextMode === 'standard') {
    if (!(id in map)) {
      emitChange(agentId, 'standard');
      return;
    }
    delete map[id];
  } else {
    map[id] = 'eldritch';
  }
  writeMap(map);
  emitChange(agentId, nextMode);
}

/**
 * True se la carta deve mostrare Eldritch in UI (preferenza + kit disponibile).
 * @param {number|string} agentId
 * @param {boolean} hasKit
 */
export function prefersEldritchFace(agentId, hasKit) {
  return Boolean(hasKit) && getEldritchFacePreference(agentId) === 'eldritch';
}

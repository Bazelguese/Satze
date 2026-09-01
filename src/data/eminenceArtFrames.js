// Inquadratura arte Eminenze — per carta (distorsione + zoom).
// Il lab scrive overlay in localStorage; il duello e la gallery li leggono.

export const EMINENCE_ART_FRAME_DEFAULT = {
  artX: 50,
  artY: 50,
  focusX: 50,
  focusY: 50,
  zoom: 100,
};

/** Override commessi nel repo (id → frame). Il lab può sovrascriverli in locale. */
export const EMINENCE_ART_FRAMES = {
  ratti_bella_malelabbra: { focusY: 18 },
};

const STORE_KEY = 'satze-em-art-frames';

function readStore() {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeStore(map) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORE_KEY, JSON.stringify(map));
  } catch {
    /* ignore quota */
  }
}

function clampFrame(frame) {
  const src = frame && typeof frame === 'object' ? frame : {};
  const artX = Number(src.artX);
  const artY = Number(src.artY);
  const focusX = Number(src.focusX);
  const focusY = Number(src.focusY);
  const zoom = Number(src.zoom);
  return {
    artX: Number.isFinite(artX) ? Math.min(100, Math.max(0, Math.round(artX))) : EMINENCE_ART_FRAME_DEFAULT.artX,
    artY: Number.isFinite(artY) ? Math.min(100, Math.max(0, Math.round(artY))) : EMINENCE_ART_FRAME_DEFAULT.artY,
    focusX: Number.isFinite(focusX) ? Math.min(100, Math.max(0, Math.round(focusX))) : EMINENCE_ART_FRAME_DEFAULT.focusX,
    focusY: Number.isFinite(focusY) ? Math.min(100, Math.max(0, Math.round(focusY))) : EMINENCE_ART_FRAME_DEFAULT.focusY,
    zoom: Number.isFinite(zoom) ? Math.min(180, Math.max(100, Math.round(zoom))) : EMINENCE_ART_FRAME_DEFAULT.zoom,
  };
}

export function getEminenceArtFrame(eminenceId) {
  const id = eminenceId != null ? String(eminenceId) : '';
  const stored = id ? readStore()[id] : null;
  return clampFrame({
    ...EMINENCE_ART_FRAME_DEFAULT,
    ...(id && EMINENCE_ART_FRAMES[id] ? EMINENCE_ART_FRAMES[id] : null),
    ...(stored && typeof stored === 'object' ? stored : null),
  });
}

export function saveEminenceArtFrame(eminenceId, frame) {
  const id = eminenceId != null ? String(eminenceId) : '';
  if (!id) return getEminenceArtFrame(id);
  const next = clampFrame(frame);
  const map = readStore();
  map[id] = next;
  writeStore(map);
  return next;
}

export function resetEminenceArtFrame(eminenceId) {
  const id = eminenceId != null ? String(eminenceId) : '';
  if (!id) return { ...EMINENCE_ART_FRAME_DEFAULT };
  const map = readStore();
  delete map[id];
  writeStore(map);
  return getEminenceArtFrame(id);
}

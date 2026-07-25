const { screen } = require('electron');
const { join } = require('path');
const { existsSync, writeFileSync, readFileSync, mkdirSync } = require('fs');

const MIN_WIDTH = 1280;
const MIN_HEIGHT = 720;

const RESOLUTION_PRESETS = {
  '1280x720': { width: 1280, height: 720 },
  '1366x768': { width: 1366, height: 768 },
  '1600x900': { width: 1600, height: 900 },
  '1920x1080': { width: 1920, height: 1080 },
  '2560x1440': { width: 2560, height: 1440 },
};

function displayFilePath(app) {
  return join(app.getPath('userData'), 'display.json');
}

function normalizePayload(raw) {
  const displayMode =
    raw?.displayMode === 'fullscreen' || raw?.displayMode === 'borderless'
      ? raw.displayMode
      : 'windowed';
  const resolutionPreset =
    typeof raw?.resolutionPreset === 'string' ? raw.resolutionPreset : 'native';
  let customResolution = null;
  if (
    raw?.customResolution &&
    Number.isFinite(raw.customResolution.width) &&
    Number.isFinite(raw.customResolution.height)
  ) {
    customResolution = {
      width: Math.round(raw.customResolution.width),
      height: Math.round(raw.customResolution.height),
    };
  }
  return { displayMode, resolutionPreset, customResolution };
}

function loadDisplaySettings(app) {
  const path = displayFilePath(app);
  if (!existsSync(path)) {
    return normalizePayload({ displayMode: 'windowed', resolutionPreset: 'native' });
  }
  try {
    return normalizePayload(JSON.parse(readFileSync(path, 'utf8')));
  } catch {
    return normalizePayload({ displayMode: 'windowed', resolutionPreset: 'native' });
  }
}

function saveDisplaySettings(app, payload) {
  const normalized = normalizePayload(payload);
  const dir = app.getPath('userData');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(displayFilePath(app), JSON.stringify(normalized, null, 2), 'utf8');
  return normalized;
}

function getPrimaryDisplay() {
  return screen.getPrimaryDisplay();
}

function resolveTargetSize(payload, workArea) {
  if (payload.resolutionPreset === 'custom' && payload.customResolution) {
    return {
      width: payload.customResolution.width,
      height: payload.customResolution.height,
    };
  }
  if (payload.resolutionPreset === 'native' || !RESOLUTION_PRESETS[payload.resolutionPreset]) {
    return { width: workArea.width, height: workArea.height };
  }
  return { ...RESOLUTION_PRESETS[payload.resolutionPreset] };
}

function clampToWorkArea(size, workArea) {
  const width = Math.min(Math.max(MIN_WIDTH, size.width), workArea.width);
  const height = Math.min(Math.max(MIN_HEIGHT, size.height), workArea.height);
  const clamped =
    width < size.width || height < size.height
      ? `Risoluzione limitata a ${width}×${height} (area utile monitor).`
      : undefined;
  return { width, height, warning: clamped };
}

/**
 * @param {import('electron').BrowserWindow} win
 * @param {ReturnType<typeof normalizePayload>} payload
 */
function applyDisplayToWindow(win, payload) {
  if (!win || win.isDestroyed()) {
    return { ok: false, error: 'Finestra non disponibile' };
  }

  const display = getPrimaryDisplay();
  const workArea = display.workArea;
  const bounds = display.bounds;

  if (payload.displayMode === 'fullscreen') {
    if (win.isFullScreenable && !win.isFullScreenable()) {
      /* ignore */
    }
    if (win.isSimpleFullScreen?.()) win.setSimpleFullScreen(false);
    win.setFullScreen(true);
    return { ok: true };
  }

  // Esci da fullscreen classico
  if (win.isFullScreen()) win.setFullScreen(false);

  if (payload.displayMode === 'borderless') {
    win.setMovable(true);
    try {
      win.setResizable(true);
    } catch {
      /* ignore */
    }
    // Borderless = massimizza sulla work area senza chrome fullscreen OS
    win.setBounds({
      x: workArea.x,
      y: workArea.y,
      width: workArea.width,
      height: workArea.height,
    });
    if (!win.isMaximized()) win.maximize();
    return { ok: true };
  }

  // windowed
  if (win.isMaximized()) win.unmaximize();
  const target = resolveTargetSize(payload, workArea);
  const { width, height, warning } = clampToWorkArea(target, workArea);
  const x = Math.round(workArea.x + (workArea.width - width) / 2);
  const y = Math.round(workArea.y + (workArea.height - height) / 2);
  win.setBounds({ x, y, width, height });
  return { ok: true, warning, bounds: { x, y, width, height, displayBounds: bounds } };
}

function getDisplayState(win) {
  if (!win || win.isDestroyed()) {
    return { displayMode: 'windowed', bounds: null, isFullScreen: false, isMaximized: false };
  }
  const isFullScreen = win.isFullScreen();
  const isMaximized = win.isMaximized();
  let displayMode = 'windowed';
  if (isFullScreen) displayMode = 'fullscreen';
  else if (isMaximized) displayMode = 'borderless';
  return {
    displayMode,
    bounds: win.getBounds(),
    isFullScreen,
    isMaximized,
  };
}

function listDisplays() {
  return screen.getAllDisplays().map((d) => ({
    id: d.id,
    bounds: d.bounds,
    workArea: d.workArea,
    scaleFactor: d.scaleFactor,
  }));
}

function initialWindowOptions(app) {
  const saved = loadDisplaySettings(app);
  const display = getPrimaryDisplay();
  const workArea = display.workArea;

  if (saved.displayMode === 'fullscreen' || saved.displayMode === 'borderless') {
    return {
      width: Math.min(1920, workArea.width),
      height: Math.min(1080, workArea.height),
      minWidth: MIN_WIDTH,
      minHeight: MIN_HEIGHT,
      _satzeDisplay: saved,
    };
  }

  const target = resolveTargetSize(saved, workArea);
  const { width, height } = clampToWorkArea(target, workArea);
  return {
    width,
    height,
    minWidth: MIN_WIDTH,
    minHeight: MIN_HEIGHT,
    _satzeDisplay: saved,
  };
}

module.exports = {
  MIN_WIDTH,
  MIN_HEIGHT,
  loadDisplaySettings,
  saveDisplaySettings,
  applyDisplayToWindow,
  getDisplayState,
  listDisplays,
  initialWindowOptions,
  normalizePayload,
};

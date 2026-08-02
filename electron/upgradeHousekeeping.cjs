const { join } = require('path');
const { existsSync, readFileSync, writeFileSync, mkdirSync, rmSync, statSync } = require('fs');

const CACHE_DIR_NAMES = [
  'Cache',
  'Code Cache',
  'GPUCache',
  'DawnGraphiteCache',
  'DawnWebGPUCache',
  'Service Worker',
];

const FINGERPRINT_FILE = 'satze-build-fingerprint.txt';

function getPackagedBuildFingerprint(app) {
  if (!app.isPackaged) return null;
  try {
    const asarPath = join(process.resourcesPath, 'app.asar');
    const st = statSync(asarPath);
    return `${app.getVersion()}-${st.size}-${Math.floor(st.mtimeMs)}`;
  } catch {
    return app.getVersion();
  }
}

function pruneElectronCacheDirs(baseDir) {
  if (!baseDir || !existsSync(baseDir)) return;
  for (const name of CACHE_DIR_NAMES) {
    try {
      rmSync(join(baseDir, name), { recursive: true, force: true });
    } catch {
      /* ignore */
    }
  }
}

/**
 * Dopo un aggiornamento playtest (anche stesso semver) evita che cache Chromium
 * si accumuli in AppData oltre la dimensione dell'installazione.
 * @returns {boolean} true se è un nuovo build rispetto all'ultimo avvio
 */
function prepareUpgradeHousekeeping(app) {
  const fp = getPackagedBuildFingerprint(app);
  if (!fp) return false;

  const userData = app.getPath('userData');
  const markerPath = join(userData, FINGERPRINT_FILE);
  let previous = '';
  try {
    previous = readFileSync(markerPath, 'utf8').trim();
  } catch {
    /* primo avvio */
  }

  if (previous === fp) return false;

  pruneElectronCacheDirs(userData);
  try {
    const alt = join(app.getPath('appData'), 'satze');
    if (alt !== userData) pruneElectronCacheDirs(alt);
  } catch {
    /* ignore */
  }

  try {
    mkdirSync(userData, { recursive: true });
    writeFileSync(markerPath, fp, 'utf8');
  } catch {
    /* ignore */
  }

  return true;
}

async function clearWindowSessionCache(webContents) {
  if (!webContents || webContents.isDestroyed()) return;
  try {
    await webContents.session.clearCache();
  } catch {
    /* ignore */
  }
}

module.exports = {
  prepareUpgradeHousekeeping,
  clearWindowSessionCache,
};

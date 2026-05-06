/**
 * URL del server WebSocket multiplayer.
 *
 * Ordine di risoluzione (il primo non vuoto vince):
 * 1) File multiplayer.json (Electron: accanto all'exe o in AppData)
 * 2) public/satze-multiplayer.json (build web / fetch)
 * 3) VITE_MULTIPLAYER_URL (file .env in sviluppo / build)
 * 4) Fallback da hostname (solo browser su http/https)
 */

/** @type {string | null} */
let cachedUrl = null;

function defaultFromLocation() {
  const DEFAULT_HOST = '127.0.0.1';
  const PORT = 3847;
  if (typeof window === 'undefined') {
    return `ws://${DEFAULT_HOST}:${PORT}`;
  }
  let host = window.location.hostname;
  if (!host || host === '') {
    host = DEFAULT_HOST;
  }
  if (host === 'localhost') {
    host = DEFAULT_HOST;
  }
  const wsProto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${wsProto}//${host}:${PORT}`;
}

/**
 * Risolve e memorizza l'URL WebSocket (chiamare prima di connettere).
 * @returns {Promise<string>}
 */
export async function resolveMultiplayerWsUrl() {
  if (cachedUrl) return cachedUrl;

  // 1) Electron: file multiplayer.json
  if (typeof window !== 'undefined' && window.electronAPI?.getMultiplayerConfig) {
    try {
      const cfg = await window.electronAPI.getMultiplayerConfig();
      if (cfg?.wsUrl && String(cfg.wsUrl).trim()) {
        cachedUrl = String(cfg.wsUrl).trim();
        return cachedUrl;
      }
    } catch (e) {
      console.warn('[multiplayer] lettura config Electron:', e);
    }
  }

  // 2) Fetch JSON statico (stesso host del gioco)
  try {
    const base = import.meta.env?.BASE_URL || '/';
    const path = `${base}satze-multiplayer.json`.replace(/\/{2,}/g, '/');
    const res = await fetch(path, { cache: 'no-store' });
    if (res.ok) {
      const j = await res.json();
      if (j?.wsUrl && String(j.wsUrl).trim()) {
        cachedUrl = String(j.wsUrl).trim();
        return cachedUrl;
      }
    }
  } catch {
    /* offline o file assente */
  }

  // 3) Vite env
  const env = typeof import.meta !== 'undefined' && import.meta.env?.VITE_MULTIPLAYER_URL;
  if (env && String(env).trim()) {
    cachedUrl = String(env).trim();
    return cachedUrl;
  }

  cachedUrl = defaultFromLocation();
  return cachedUrl;
}

/**
 * Versione sincrona: usa solo cache o VITE_ o fallback (dopo almeno una resolve è accurata).
 */
export function getMultiplayerWsUrl() {
  if (cachedUrl) return cachedUrl;
  const env = typeof import.meta !== 'undefined' && import.meta.env?.VITE_MULTIPLAYER_URL;
  if (env && String(env).trim()) {
    return String(env).trim();
  }
  return defaultFromLocation();
}

/** Invalida la cache (es. dopo modifica file di config). */
export function clearMultiplayerUrlCache() {
  cachedUrl = null;
}

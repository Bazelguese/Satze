import { IS_PUBLIC_PLAYTEST_BUILD } from '../config/buildProfile.js';

function isElectronUserAgent() {
  return typeof navigator !== 'undefined' && /Electron/i.test(navigator.userAgent);
}

/** Client desktop Electron (preload completo o shell playtest). */
export function isSatzeDesktopShell() {
  if (typeof window === 'undefined') return false;
  if (typeof window.electronAPI?.quitApp === 'function') return true;
  if (typeof window.electronAPI?.getMultiplayerConfig === 'function') return true;
  if (typeof window.electronAPI?.display?.getSaved === 'function') return true;
  if (IS_PUBLIC_PLAYTEST_BUILD && isElectronUserAgent()) return true;
  return isElectronUserAgent();
}

/** @deprecated usa isSatzeDesktopShell */
export function hasElectronQuitApi() {
  return typeof window.electronAPI?.quitApp === 'function';
}

export function shouldShowMainMenuQuit() {
  return isSatzeDesktopShell();
}

/**
 * Chiede conferma e chiude l'app desktop.
 * @returns {Promise<boolean>}
 */
export async function confirmQuitDesktopGame(options = {}) {
  const {
    title = 'Uscire dal gioco?',
    detail = 'La sessione in corso verrà chiusa.',
  } = options;

  if (!isSatzeDesktopShell()) return false;

  const message = detail ? `${title}\n\n${detail}` : title;
  if (!window.confirm(message)) return false;

  try {
    if (typeof window.electronAPI?.quitApp === 'function') {
      await window.electronAPI.quitApp();
    } else {
      window.close();
    }
  } catch {
    try {
      window.close();
    } catch {
      /* ignore */
    }
  }
  return true;
}

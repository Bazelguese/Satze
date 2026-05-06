// ============================================
// Riconnessione multiplayer — token server + sessionStorage
// ============================================

import { getMultiplayerManager } from './multiplayer';
import { resolveMultiplayerWsUrl } from '../config/multiplayerConfig';

export const MP_SESSION_STORAGE_KEY = 'satze_mp_session';

/**
 * @param {{ roomCode: string, role: string, reconnectSecret: string, playerName?: string }} session
 */
export function persistMpSession(session) {
  try {
    if (session?.roomCode && session?.reconnectSecret && session?.role) {
      sessionStorage.setItem(
        MP_SESSION_STORAGE_KEY,
        JSON.stringify({
          roomCode: session.roomCode,
          role: session.role,
          reconnectSecret: session.reconnectSecret,
          playerName: session.playerName || '',
        })
      );
    }
  } catch (_) {
    /* ignore */
  }
}

export function readMpSession() {
  try {
    const s = sessionStorage.getItem(MP_SESSION_STORAGE_KEY);
    if (!s) return null;
    const o = JSON.parse(s);
    if (o?.roomCode && o?.reconnectSecret && (o.role === 'host' || o.role === 'guest')) return o;
    return null;
  } catch {
    return null;
  }
}

export function clearMpSession() {
  try {
    sessionStorage.removeItem(MP_SESSION_STORAGE_KEY);
  } catch (_) {
    /* ignore */
  }
}

/**
 * Chiude il socket corrente (intenzionale), ne apre uno nuovo e invia `reconnect` al server.
 * @param {{ roomCode: string, role: 'host'|'guest', reconnectSecret: string }} session
 */
export async function reconnectToRoom(session) {
  const { roomCode, role, reconnectSecret } = session;
  if (!roomCode || !role || !reconnectSecret) {
    throw new Error('Sessione incompleta per la riconnessione');
  }
  const mgr = getMultiplayerManager();
  mgr.disconnect({ intentional: true });
  const url = await resolveMultiplayerWsUrl();
  await mgr.connect(url);

  return new Promise((resolve, reject) => {
    let done = false;
    let unsub = () => {};
    const finish = (err, val) => {
      if (done) return;
      done = true;
      clearTimeout(tid);
      unsub();
      if (err) reject(err);
      else resolve(val);
    };
    const tid = setTimeout(() => {
      finish(new Error('Timeout: nessuna risposta dal server'));
    }, 20000);
    unsub = mgr.onMessage((msg) => {
      if (msg.type === 'error') {
        finish(new Error(msg.message || 'Errore server'));
        return;
      }
      if (msg.type === 'reconnected') {
        finish(null, msg);
      }
    });
    mgr.send({ type: 'reconnect', roomCode, role, secret: reconnectSecret });
  });
}

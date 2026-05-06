// ============================================
// MULTIPLAYER LOBBY — Connessione WebSocket reale
// ============================================

import React, { useMemo, useState } from 'react';
import { getMultiplayerManager } from '../../utils/multiplayer';
import { resolveMultiplayerWsUrl } from '../../config/multiplayerConfig';
import {
  readMpSession,
  reconnectToRoom,
  clearMpSession,
} from '../../utils/multiplayerReconnect';
import { PALETTE, HUD_ORATORIO_FONT_DISPLAY, HUD_ORATORIO_FONT_UI, injectSatzeUiFonts } from '../../theme/hudOratorioPalette';

function waitForMessage(manager, predicate, timeoutMs = 20000) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => {
      unsub();
      reject(new Error('Timeout: nessuna risposta dal server'));
    }, timeoutMs);
    const unsub = manager.onMessage((msg) => {
      if (msg.type === 'error') {
        clearTimeout(t);
        unsub();
        reject(new Error(msg.message || 'Errore server'));
        return;
      }
      if (predicate(msg)) {
        clearTimeout(t);
        unsub();
        resolve(msg);
      }
    });
  });
}

const ACCENT = '#c026d3';
const ACCENT_TEXT = '#06030a';

const inputStyle = {
  width: '100%',
  maxWidth: '100%',
  padding: '0.5rem 1rem',
  borderRadius: 8,
  border: `1px solid ${PALETTE.slate}`,
  background: 'rgba(12, 10, 22, 0.95)',
  color: PALETTE.textPrimary,
  fontFamily: HUD_ORATORIO_FONT_UI,
};

const btnGhostStyle = {
  width: '100%',
  padding: '0.75rem 1rem',
  borderRadius: 8,
  border: `1px solid ${PALETTE.slate}`,
  background: 'rgba(74, 63, 102, 0.35)',
  color: PALETTE.textPrimary,
  fontWeight: 700,
  cursor: 'pointer',
  fontFamily: HUD_ORATORIO_FONT_UI,
};

export function MultiplayerLobby({ onStartGame, onClose }) {
  const [mode, setMode] = useState('menu');
  const [playerName, setPlayerName] = useState('');
  const [roomIdInput, setRoomIdInput] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  /** Sessione salvata (refresh / crash) per riconnettersi alla stessa stanza */
  const savedSession = useMemo(() => readMpSession(), []);

  React.useEffect(() => {
    injectSatzeUiFonts();
  }, []);

  const connectAndCreate = async () => {
    if (!playerName.trim()) {
      setErrorMessage('Inserisci un nome giocatore');
      return;
    }
    setIsConnecting(true);
    setErrorMessage('');
    const mgr = getMultiplayerManager();
    if (mgr.isConnected()) mgr.disconnect({ intentional: true });
    try {
      const url = await resolveMultiplayerWsUrl();
      await mgr.connect(url);
      mgr.send({ type: 'create_room', playerName: playerName.trim() });
      const msg = await waitForMessage(mgr, (m) => m.type === 'room_created');
      onStartGame({
        roomCode: msg.roomCode,
        playerId: msg.playerId || 'host',
        role: 'host',
        playerName: playerName.trim(),
        reconnectSecret: msg.reconnectSecret,
      });
    } catch (e) {
      setErrorMessage(e.message || 'Errore di connessione');
      mgr.disconnect({ intentional: true });
    } finally {
      setIsConnecting(false);
    }
  };

  const connectAndJoin = async () => {
    if (!playerName.trim()) {
      setErrorMessage('Inserisci un nome giocatore');
      return;
    }
    if (!roomIdInput.trim()) {
      setErrorMessage('Inserisci un codice stanza');
      return;
    }
    setIsConnecting(true);
    setErrorMessage('');
    const mgr = getMultiplayerManager();
    if (mgr.isConnected()) mgr.disconnect({ intentional: true });
    try {
      const url = await resolveMultiplayerWsUrl();
      await mgr.connect(url);
      mgr.send({
        type: 'join_room',
        roomCode: roomIdInput.trim().toUpperCase(),
        playerName: playerName.trim(),
      });
      const msg = await waitForMessage(mgr, (m) => m.type === 'joined');
      onStartGame({
        roomCode: msg.roomCode,
        playerId: msg.playerId || 'guest',
        role: 'guest',
        playerName: playerName.trim(),
        reconnectSecret: msg.reconnectSecret,
      });
    } catch (e) {
      setErrorMessage(e.message || 'Errore di connessione');
      mgr.disconnect({ intentional: true });
    } finally {
      setIsConnecting(false);
    }
  };

  const resumeSavedSession = async () => {
    if (!savedSession) return;
    setIsConnecting(true);
    setErrorMessage('');
    try {
      await reconnectToRoom(savedSession);
      onStartGame({
        roomCode: savedSession.roomCode,
        role: savedSession.role,
        playerName: savedSession.playerName || 'Giocatore',
        playerId: savedSession.role === 'host' ? 'host' : 'guest',
        reconnectSecret: savedSession.reconnectSecret,
      });
    } catch (e) {
      const msg = e.message || 'Riconnessione fallita';
      setErrorMessage(msg);
      if (/non trovata|non valida/i.test(msg)) {
        clearMpSession();
      }
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div
        className="max-w-md border-2"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: `linear-gradient(180deg, ${PALETTE.deepVoid} 0%, ${PALETTE.nebula} 50%, ${PALETTE.deepVoid} 100%)`,
          borderColor: ACCENT,
          boxShadow: `0 0 30px ${ACCENT}44`,
          fontFamily: HUD_ORATORIO_FONT_UI,
        }}
      >
        <div className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold" style={{ color: ACCENT, fontFamily: HUD_ORATORIO_FONT_DISPLAY }}>
              Sfida un amico
            </h2>
            <button onClick={onClose} className="text-2xl hover:opacity-100" style={{ color: PALETTE.textSecondary, opacity: 0.85 }} type="button">
              ✕
            </button>
          </div>

          {mode === 'menu' && (
            <div className="space-y-4">
              {savedSession && (
                <div className="space-y-2 rounded-lg border border-fuchsia-500/40 bg-fuchsia-950/25 p-3">
                  <p className="text-xs text-fuchsia-100/90">
                    Trovata una sessione precedente (stanza <span className="font-mono tracking-widest">{savedSession.roomCode}</span> come{' '}
                    {savedSession.role === 'host' ? 'host' : 'ospite'}).
                  </p>
                  <button
                    type="button"
                    onClick={resumeSavedSession}
                    disabled={isConnecting}
                    className="w-full rounded-lg bg-fuchsia-600/90 px-3 py-2 text-xs font-bold text-black hover:bg-fuchsia-500 disabled:opacity-50"
                  >
                    {isConnecting ? 'Riconnessione…' : 'Riconnetti alla stanza'}
                  </button>
                </div>
              )}
              <div className="mb-4">
                <label className="mb-2 block text-sm font-bold" style={{ color: PALETTE.textSecondary }}>
                  Nome giocatore *
                </label>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  style={inputStyle}
                  placeholder="Il tuo nome"
                  maxLength={20}
                />
              </div>
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => {
                    if (playerName.trim()) setMode('create');
                    else setErrorMessage('Inserisci un nome giocatore');
                  }}
                  className="w-full rounded-lg px-6 py-4 font-bold transition-all"
                  style={{
                    background: `linear-gradient(90deg, ${ACCENT}, #a855f7)`,
                    color: ACCENT_TEXT,
                  }}
                >
                  Crea stanza
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (playerName.trim()) setMode('join');
                    else setErrorMessage('Inserisci un nome giocatore');
                  }}
                  className="w-full py-4 text-center font-bold"
                  style={btnGhostStyle}
                >
                  Entra con codice
                </button>
              </div>
              {errorMessage && (
                <div className="rounded-lg border border-red-500/50 bg-red-900/30 p-3 text-sm text-red-400">{errorMessage}</div>
              )}
              <p className="mt-4 text-xs" style={{ color: PALETTE.textSecondary }}>
                Avvia il server con <span className="font-mono" style={{ color: PALETTE.textPrimary }}>npm run server</span> (porta 3847). Per giocare da
                un altro dispositivo in LAN imposta <span className="font-mono">VITE_MULTIPLAYER_URL</span> nel file{' '}
                <span className="font-mono">.env</span>.
              </p>
            </div>
          )}

          {mode === 'create' && (
            <div className="space-y-4">
              <p className="text-sm" style={{ color: PALETTE.textSecondary }}>
                Verrà creato un codice a 6 caratteri da inviare all&apos;amico.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setMode('menu');
                    setErrorMessage('');
                  }}
                  disabled={isConnecting}
                  className="flex-1 py-3 font-bold disabled:opacity-50"
                  style={{ ...btnGhostStyle, width: 'auto', flex: 1 }}
                >
                  Indietro
                </button>
                <button
                  type="button"
                  onClick={connectAndCreate}
                  disabled={isConnecting || !playerName.trim()}
                  className="flex-1 rounded-lg py-3 font-bold disabled:opacity-50"
                  style={{
                    background: `linear-gradient(90deg, ${ACCENT}, #a855f7)`,
                    color: ACCENT_TEXT,
                    fontFamily: HUD_ORATORIO_FONT_UI,
                  }}
                >
                  {isConnecting ? 'Connessione…' : 'Crea'}
                </button>
              </div>
              {errorMessage && (
                <div className="rounded-lg border border-red-500/50 bg-red-900/30 p-3 text-sm text-red-400">{errorMessage}</div>
              )}
            </div>
          )}

          {mode === 'join' && (
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-bold" style={{ color: PALETTE.textSecondary }}>
                  Codice stanza *
                </label>
                <input
                  type="text"
                  value={roomIdInput}
                  onChange={(e) => setRoomIdInput(e.target.value.toUpperCase())}
                  style={{ ...inputStyle, fontFamily: 'Share Tech Mono, monospace', letterSpacing: '0.2em' }}
                  placeholder="es. ABC12X"
                  maxLength={8}
                  disabled={isConnecting}
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setMode('menu');
                    setErrorMessage('');
                    setRoomIdInput('');
                  }}
                  disabled={isConnecting}
                  className="flex-1 py-3 font-bold disabled:opacity-50"
                  style={{ ...btnGhostStyle, width: 'auto', flex: 1 }}
                >
                  Indietro
                </button>
                <button
                  type="button"
                  onClick={connectAndJoin}
                  disabled={isConnecting || !playerName.trim() || !roomIdInput.trim()}
                  className="flex-1 rounded-lg py-3 font-bold disabled:opacity-50"
                  style={{
                    background: `linear-gradient(90deg, ${ACCENT}, #a855f7)`,
                    color: ACCENT_TEXT,
                    fontFamily: HUD_ORATORIO_FONT_UI,
                  }}
                >
                  {isConnecting ? 'Connessione…' : 'Entra'}
                </button>
              </div>
              {errorMessage && (
                <div className="rounded-lg border border-red-500/50 bg-red-900/30 p-3 text-sm text-red-400">{errorMessage}</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

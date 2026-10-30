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
import { IS_PUBLIC_PLAYTEST_BUILD } from '../../config/buildProfile';
import { injectSatzeUiFonts } from '../../theme/hudOratorioPalette';
import { playUiClick } from '../../audio/soundBus';

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

/** Stesso colore della voce MULTIPLAYER del menù. */
export const MULTIPLAYER_ACCENT = '#a78bfa';
const ACCENT = MULTIPLAYER_ACCENT;

export function MultiplayerLobby({ onStartGame, onClose }) {
  const [mode, setMode] = useState('menu');
  const [playerName, setPlayerName] = useState('');
  const [roomIdInput, setRoomIdInput] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [serverUrl, setServerUrl] = useState('');
  /** Sessione salvata (refresh / crash) per riconnettersi alla stessa stanza */
  const savedSession = useMemo(() => readMpSession(), []);

  React.useEffect(() => {
    injectSatzeUiFonts();
    resolveMultiplayerWsUrl()
      .then((url) => setServerUrl(url))
      .catch(() => {});
  }, []);

  const leaveCurrentRoomIfAny = () => {
    const mgr = getMultiplayerManager();
    const saved = readMpSession();
    if (saved?.roomCode && mgr.isConnected()) {
      mgr.send({ type: 'leave_room', roomCode: saved.roomCode });
    }
  };

  const connectAndCreate = async () => {
    if (!playerName.trim()) {
      setErrorMessage('Inserisci un nome giocatore');
      return;
    }
    setIsConnecting(true);
    setErrorMessage('');
    const mgr = getMultiplayerManager();
    leaveCurrentRoomIfAny();
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
    leaveCurrentRoomIfAny();
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
      let msg = e.message || 'Errore di connessione';
      if (/non trovata/i.test(msg) && serverUrl) {
        msg += ` Verifica che l'host usi lo stesso server (${serverUrl}).`;
      }
      setErrorMessage(msg);
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

  // ---------- tastiera: Esc torna indietro, ↑↓ sceglie l'azione ----------
  const [actionIdx, setActionIdx] = useState(0);
  const keyRef = React.useRef({});
  keyRef.current = { mode, actionIdx, playerName, isConnecting, onClose };
  const goMode = (next) => {
    if (next !== 'menu' && !playerName.trim()) {
      setErrorMessage('Inserisci un nome giocatore');
      return;
    }
    playUiClick();
    setErrorMessage('');
    setMode(next);
  };
  const goModeRef = React.useRef(goMode);
  goModeRef.current = goMode;

  React.useEffect(() => {
    const onKey = (e) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      const k = keyRef.current;
      const typing = /^(INPUT|TEXTAREA)$/.test(e.target?.tagName || '');
      if (e.key === 'Escape') {
        e.preventDefault();
        if (k.isConnecting) return;
        playUiClick();
        if (k.mode !== 'menu') { setMode('menu'); setErrorMessage(''); } else k.onClose?.();
        return;
      }
      if (k.mode !== 'menu') return;
      // ↑↓ funzionano anche scrivendo il nome (campo su una riga); Invio lì lo gestisce il campo
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        playUiClick();
        setActionIdx((i) => 1 - i);
      } else if (e.key === 'Enter' && !typing) {
        e.preventDefault();
        goModeRef.current(k.actionIdx === 0 ? 'create' : 'join');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const serverNote = IS_PUBLIC_PLAYTEST_BUILD
    ? 'Connessione online automatica: crea una stanza e manda il codice di 6 caratteri al tuo amico.'
    : 'Avvia il server con «npm run server» (porta 3847). Da un altro dispositivo in LAN imposta VITE_MULTIPLAYER_URL nel file .env.';

  return (
    <div className="mpl" style={{ '--accent': ACCENT }}>
      <div className="mpl-bg" aria-hidden="true">
        <div className="mpl-bg-slab" />
        <div className="mpl-bg-edge" />
        <div className="mpl-bg-halftone" />
        <div className="mpl-bg-stripes" />
      </div>
      <div className="mpl-watermark" aria-hidden="true">ONLINE</div>

      <button type="button" className="mpl-back" onClick={() => { playUiClick(); onClose?.(); }} disabled={isConnecting}>
        <span className="key">ESC</span><span className="lbl">MENU</span>
      </button>

      <div className="mpl-title">
        <div className="mpl-eyebrow"><span>ONLINE · BETA</span></div>
        <h1>MULTIPLAYER</h1>
        <p>Sfida un amico: uno crea la stanza, l’altro entra con il codice.</p>
      </div>

      <section className="mpl-panel" key={mode}>
        {mode === 'menu' && (
          <>
            {savedSession && (
              <div className="mpl-resume">
                <div className="txt">
                  <span className="eye">PARTITA IN SOSPESO</span>
                  <span>Stanza <b className="code">{savedSession.roomCode}</b> come {savedSession.role === 'host' ? 'host' : 'ospite'}</span>
                </div>
                <button type="button" className="mpl-btn mpl-btn--main" onClick={resumeSavedSession} disabled={isConnecting}>
                  <span>{isConnecting ? 'RICONNESSIONE…' : 'RICONNETTI'}</span>
                </button>
              </div>
            )}

            <label className="mpl-field">
              <span className="mpl-field-lbl"><span className="n">01</span>IL TUO NOME</span>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); goMode(actionIdx === 0 ? 'create' : 'join'); }
                }}
                placeholder="Come ti vedrà l'avversario"
                maxLength={20}
                autoFocus
              />
            </label>

            <div className="mpl-actions">
              {[
                { id: 'create', label: 'CREA STANZA', sub: 'Ricevi un codice da mandare all’amico' },
                { id: 'join', label: 'ENTRA CON CODICE', sub: 'Hai già un codice? Scrivilo qui' },
              ].map((a, i) => (
                <button
                  key={a.id}
                  type="button"
                  className={`mpl-action${actionIdx === i ? ' on' : ''}`}
                  style={{ '--zz': `${i * 34}px` }}
                  onMouseMove={(e) => { if ((e.movementX || e.movementY) && actionIdx !== i) setActionIdx(i); }}
                  onClick={() => { setActionIdx(i); goMode(a.id); }}
                >
                  <span className="mpl-action-shadow" aria-hidden="true" />
                  <span className="mpl-action-plate">
                    <span className="mpl-action-cursor" aria-hidden="true" />
                    <span className="n">{String(i + 2).padStart(2, '0')}</span>
                    <span className="txt">
                      <span className="t">{a.label}</span>
                      <span className="s">{a.sub}</span>
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </>
        )}

        {mode === 'create' && (
          <div className="mpl-step">
            <span className="mpl-step-eye">CREA STANZA</span>
            <h2>Pronto, {playerName.trim()}?</h2>
            <p>Verrà creato un codice di 6 caratteri: mandalo al tuo amico perché possa entrare.</p>
            <div className="mpl-step-btns">
              <button type="button" className="mpl-btn" onClick={() => goMode('menu')} disabled={isConnecting}><span>INDIETRO</span></button>
              <button type="button" className="mpl-btn mpl-btn--main" onClick={connectAndCreate} disabled={isConnecting || !playerName.trim()} autoFocus>
                <span>{isConnecting ? 'CONNESSIONE…' : 'CREA'}</span>
              </button>
            </div>
          </div>
        )}

        {mode === 'join' && (
          <div className="mpl-step">
            <span className="mpl-step-eye">ENTRA CON CODICE</span>
            <h2>Il codice della stanza</h2>
            <input
              className="mpl-code"
              type="text"
              value={roomIdInput}
              onChange={(e) => setRoomIdInput(e.target.value.toUpperCase().replace(/\s+/g, ''))}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); connectAndJoin(); } }}
              placeholder="ABC12X"
              maxLength={6}
              aria-label="Codice stanza"
              autoFocus
            />
            <div className="mpl-step-btns">
              <button type="button" className="mpl-btn" onClick={() => goMode('menu')} disabled={isConnecting}><span>INDIETRO</span></button>
              <button type="button" className="mpl-btn mpl-btn--main" onClick={connectAndJoin} disabled={isConnecting || !roomIdInput.trim()}>
                <span>{isConnecting ? 'CONNESSIONE…' : 'ENTRA'}</span>
              </button>
            </div>
          </div>
        )}

        {errorMessage && <div className="mpl-error" role="alert">{errorMessage}</div>}
      </section>

      <footer className="mpl-help">
        <div className="mpl-help-text">
          <span className="mpl-help-label">ONLINE</span>
          <span className="mpl-help-hint" title={serverUrl || undefined}>{serverNote}{serverUrl ? ` · Server: ${serverUrl}` : ''}</span>
        </div>
        <div className="mpl-help-keys">
          {mode === 'menu' && <span><kbd>↑</kbd><kbd>↓</kbd>AZIONE</span>}
          <span><kbd>↵</kbd>{mode === 'menu' ? 'SCEGLI' : mode === 'create' ? 'CREA' : 'ENTRA'}</span>
          <span><kbd>ESC</kbd>{mode === 'menu' ? 'MENU' : 'INDIETRO'}</span>
        </div>
      </footer>

      <LobbyStyles />
    </div>
  );
}

function LobbyStyles() {
  return (
    <style>{`
      .mpl {
        --ink: #f5f3eb; --void: #050507; --plate: #111116; --dim: rgba(245,243,235,0.6); --danger: #ef4444;
        position: absolute; inset: 0; overflow: hidden; isolation: isolate; z-index: 50;
        background: var(--void); color: var(--ink); font-family: 'Chakra Petch', sans-serif;
      }
      .mpl * { box-sizing: border-box; }
      .mpl kbd {
        display: inline-grid; place-items: center; min-width: 24px; height: 22px; padding: 0 5px;
        background: var(--void); color: var(--ink); border: 0;
        font-family: 'Chakra Petch', sans-serif; font-weight: 700; font-size: 12px;
        clip-path: polygon(3px 0, 100% 0, calc(100% - 3px) 100%, 0 100%);
      }
      .mpl-bg { position: absolute; inset: 0; z-index: 0; pointer-events: none; }
      .mpl-bg-slab {
        position: absolute; top: -20%; bottom: -20%; left: -10%; width: 42%;
        background: linear-gradient(170deg, color-mix(in srgb, var(--accent) 85%, #000) 0%, color-mix(in srgb, var(--accent) 32%, #000) 100%);
        transform: skewX(-13deg);
      }
      .mpl-bg-edge { position: absolute; top: -20%; bottom: -20%; left: 31.4%; width: 14px; background: var(--ink); transform: skewX(-13deg); }
      .mpl-bg-halftone {
        position: absolute; inset: 0; opacity: 0.4;
        background-image: radial-gradient(circle, var(--void) 1.5px, transparent 2px); background-size: 11px 11px;
        -webkit-mask-image: linear-gradient(100deg, #000 0%, transparent 32%); mask-image: linear-gradient(100deg, #000 0%, transparent 32%);
      }
      .mpl-bg-stripes { position: absolute; inset: 0; opacity: 0.05; background-image: repeating-linear-gradient(-77deg, #fff 0 2px, transparent 2px 46px); }
      .mpl-watermark {
        position: absolute; right: -30px; bottom: -60px; z-index: 1;
        font-weight: 700; font-style: italic; font-size: 300px; line-height: 0.8; letter-spacing: -0.04em;
        color: transparent; -webkit-text-stroke: 2px color-mix(in srgb, var(--accent) 26%, transparent);
        transform: rotate(-7deg); pointer-events: none; user-select: none; white-space: nowrap;
      }

      .mpl-back {
        position: absolute; top: 26px; left: 40px; z-index: 20; display: inline-flex; align-items: center; gap: 12px;
        border: 0; cursor: pointer; background: var(--void); color: var(--ink);
        padding: 10px 26px 10px 14px; transform: skewX(-14deg) rotate(-2deg); box-shadow: 5px 5px 0 var(--ink);
        transition: transform .15s, box-shadow .15s;
      }
      .mpl-back > * { transform: skewX(14deg); }
      .mpl-back:hover:not(:disabled), .mpl-back:focus-visible { transform: skewX(-14deg) rotate(-2deg) translate(-3px,-3px); box-shadow: 9px 9px 0 var(--ink); }
      .mpl-back .key { background: var(--ink); color: var(--void); font-weight: 700; font-size: 12px; padding: 3px 7px; }
      .mpl-back .lbl { font-weight: 700; font-style: italic; font-size: 22px; letter-spacing: 0.08em; }

      .mpl-title { position: absolute; top: 120px; left: 70px; z-index: 12; width: 560px; transform: rotate(-5deg); transform-origin: left top; }
      .mpl-eyebrow span {
        display: inline-block; background: var(--void); color: var(--ink);
        font-weight: 700; font-size: 15px; letter-spacing: 0.3em; padding: 3px 14px; transform: skewX(-14deg);
      }
      .mpl-title h1 { margin: 0; font-weight: 700; font-style: italic; font-size: 86px; line-height: 0.9; letter-spacing: -0.02em; text-shadow: 7px 7px 0 var(--void); }
      .mpl-title p { margin: 18px 0 0; max-width: 460px; font-weight: 600; font-size: 19px; line-height: 1.35; text-shadow: 2px 2px 0 var(--void); }

      .mpl-panel {
        position: absolute; top: 120px; left: 760px; right: 110px; bottom: 150px; z-index: 12;
        display: flex; flex-direction: column; justify-content: center; gap: 26px;
        animation: mpl-in .3s cubic-bezier(.2,1,.3,1) both;
      }
      @keyframes mpl-in { from { opacity: 0; transform: translateX(50px); } }

      .mpl-resume {
        display: flex; align-items: center; gap: 24px; padding: 18px 26px 18px 34px; background: var(--plate);
        clip-path: polygon(14px 0, 100% 0, calc(100% - 14px) 100%, 0 100%); border-left: 0;
        box-shadow: inset 8px 0 0 var(--accent);
      }
      .mpl-resume .txt { flex: 1; display: flex; flex-direction: column; gap: 6px; font-weight: 600; font-size: 21px; }
      .mpl-resume .eye { font-family: 'Share Tech Mono', monospace; font-size: 13px; letter-spacing: 0.2em; color: var(--accent); }
      .mpl-resume .code { font-family: 'Share Tech Mono', monospace; letter-spacing: 0.2em; }

      .mpl-field { display: flex; flex-direction: column; gap: 10px; }
      .mpl-field-lbl { display: flex; align-items: baseline; gap: 14px; font-weight: 700; font-size: 24px; letter-spacing: 0.04em; }
      .mpl-field-lbl .n, .mpl-action .n { font-family: 'Share Tech Mono', monospace; font-weight: 400; font-size: 15px; color: var(--accent); }
      .mpl-field input, .mpl-code {
        width: 100%; height: 84px; padding: 0 30px; border: 0; outline: 0;
        background: var(--ink); color: var(--void); font: italic 700 40px/1 'Chakra Petch', sans-serif;
        clip-path: polygon(18px 0, 100% 0, calc(100% - 18px) 100%, 0 100%);
        box-shadow: none;
      }
      .mpl-field input::placeholder { color: rgba(5,5,7,0.35); font-weight: 600; }
      .mpl-field input:focus, .mpl-code:focus { background: #fff; box-shadow: inset 0 -8px 0 var(--accent); }

      .mpl-actions { display: flex; flex-direction: column; gap: 22px; margin-top: 10px; }
      .mpl-action {
        position: relative; display: block; width: 100%; height: 132px; padding: 0; border: 0; background: transparent; cursor: pointer;
        text-align: left; color: inherit; font-family: inherit;
        transform: translateX(var(--zz)); transition: transform .2s cubic-bezier(.3,1.5,.5,1);
      }
      .mpl-action-shadow, .mpl-action-plate { position: absolute; inset: 0; clip-path: polygon(24px 0, 100% 0, calc(100% - 24px) 100%, 0 100%); }
      .mpl-action-shadow { background: var(--accent); opacity: 0; transition: transform .2s, opacity .15s; }
      .mpl-action-plate { display: flex; align-items: center; gap: 24px; padding: 0 40px; background: var(--plate); color: var(--ink); transition: background .15s, color .15s; }
      .mpl-action-plate::before { content: ''; position: absolute; left: 18px; top: 0; bottom: 0; width: 7px; background: var(--accent); transform: skewX(-12deg); }
      .mpl-action-cursor {
        position: absolute; left: -48px; top: 50%; width: 38px; height: 44px; margin-top: -22px;
        background: var(--ink); clip-path: polygon(0 0, 100% 50%, 0 100%, 30% 50%);
        filter: drop-shadow(3px 3px 0 var(--void)); opacity: 0; transition: opacity .15s;
      }
      .mpl-action .txt { display: flex; flex-direction: column; gap: 6px; line-height: 1; }
      .mpl-action .t { font-weight: 700; font-style: italic; font-size: 56px; letter-spacing: -0.01em; }
      .mpl-action .s { font-weight: 600; font-size: 19px; opacity: 0.75; }
      .mpl-action.on { transform: translateX(calc(var(--zz) - 26px)) rotate(-1.5deg) scale(1.03); z-index: 2; }
      .mpl-action.on .mpl-action-shadow { opacity: 1; transform: translate(12px, 10px); }
      .mpl-action.on .mpl-action-plate { background: var(--ink); color: var(--void); }
      .mpl-action.on .n { color: var(--void); }
      .mpl-action.on .mpl-action-cursor { opacity: 1; animation: mpl-cursor .9s ease-in-out infinite; }
      @keyframes mpl-cursor { 50% { transform: translateX(8px); } }

      .mpl-step { display: flex; flex-direction: column; align-items: flex-start; gap: 18px; padding: 40px 56px 40px 60px; background: var(--plate); clip-path: polygon(24px 0, 100% 0, calc(100% - 24px) 100%, 0 100%); box-shadow: inset 10px 0 0 var(--accent); }
      .mpl-step-eye { background: var(--accent); color: var(--void); font-weight: 700; font-size: 14px; letter-spacing: 0.28em; padding: 3px 14px; transform: skewX(-14deg); }
      .mpl-step h2 { margin: 0; font-weight: 700; font-style: italic; font-size: 60px; line-height: 1; letter-spacing: -0.01em; text-shadow: 5px 5px 0 var(--accent); }
      .mpl-step p { margin: 0; max-width: 820px; font-weight: 600; font-size: 21px; line-height: 1.4; color: var(--dim); }
      .mpl-code { max-width: 560px; height: 104px; font: 700 64px/1 'Share Tech Mono', monospace; letter-spacing: 0.35em; text-transform: uppercase; }
      .mpl-code::placeholder { color: rgba(5,5,7,0.2); }
      .mpl-step-btns { display: flex; gap: 16px; margin-top: 8px; }

      .mpl-btn {
        border: 0; cursor: pointer; height: 60px; padding: 0 32px;
        background: var(--void); color: var(--ink); font: 700 20px/1 'Chakra Petch', sans-serif; letter-spacing: 0.1em;
        transform: skewX(-14deg); box-shadow: inset 0 0 0 2px var(--ink);
        transition: background .15s, color .15s, box-shadow .15s, transform .15s, opacity .15s;
      }
      .mpl-btn > span { display: inline-block; transform: skewX(14deg); white-space: nowrap; }
      .mpl-btn:hover:not(:disabled), .mpl-btn:focus-visible { background: var(--ink); color: var(--void); }
      .mpl-btn--main { background: var(--accent); color: var(--void); box-shadow: 6px 6px 0 var(--ink); font-style: italic; font-size: 28px; height: 66px; }
      .mpl-btn--main:hover:not(:disabled), .mpl-btn--main:focus-visible { background: var(--accent); color: var(--void); transform: skewX(-14deg) translate(-3px,-3px); box-shadow: 9px 9px 0 var(--ink); }
      .mpl-btn:disabled { opacity: 0.4; cursor: not-allowed; }

      .mpl-error {
        align-self: flex-start; padding: 12px 22px; background: var(--danger); color: var(--void);
        font-weight: 700; font-size: 19px; transform: skewX(-10deg); box-shadow: 6px 6px 0 var(--ink);
      }

      .mpl-help {
        position: absolute; left: 0; right: 0; bottom: 0; height: 96px; z-index: 14;
        display: flex; align-items: center; gap: 28px; padding: 0 60px 0 70px;
        background: var(--ink); color: var(--void); clip-path: polygon(0 26px, 100% 0, 100% 100%, 0 100%);
      }
      .mpl-help-text { flex: 1; min-width: 0; display: flex; align-items: center; gap: 18px; padding-top: 18px; }
      .mpl-help-label {
        flex: none; background: var(--void); color: var(--ink); font-weight: 700; font-size: 15px; letter-spacing: 0.14em;
        padding: 4px 14px; transform: skewX(-14deg); box-shadow: 4px 4px 0 var(--accent);
      }
      .mpl-help-hint { font-weight: 600; font-size: 17px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .mpl-help-keys { display: flex; gap: 20px; padding-top: 18px; font-weight: 700; font-style: italic; font-size: 15px; letter-spacing: 0.1em; }
      .mpl-help-keys span { display: inline-flex; align-items: center; gap: 4px; }

      @media (prefers-reduced-motion: reduce) {
        .mpl-panel, .mpl-action.on .mpl-action-cursor { animation: none; }
      }
    `}</style>
  );
}

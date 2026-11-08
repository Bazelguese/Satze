// ============================================================
// OnlineRoomScreen.jsx — Stanza online prima della partita
// ============================================================
// Stesso linguaggio della lobby multiplayer (lastra d'accento inclinata,
// retino, piede chiaro con i tasti): a sinistra titolo, codice stanza ed
// esercito; a destra le impostazioni della stanza (OnlineRoomPanel), poi
// PRONTO e, per l'host nelle modalità a più posti, AVVIA PARTITA.
// La logica resta in Codice/satze.jsx: qui arrivano solo testi e azioni.
// Tastiera: Invio = Pronto, C = copia il codice stanza, Esc = cambia esercito.
// Va renderizzato dentro il canvas di gioco (1920×1080).
// ============================================================

import { useEffect, useRef, useState } from 'react';
import { useScreenActiveRef } from '../screenCache/ScreenCache.jsx';
import { playUiClick } from '../../audio/soundBus';
import { LobbyStyles, MULTIPLAYER_ACCENT } from './MultiplayerLobby.jsx';

/** Copia negli appunti; ripiega su execCommand dove l'API asincrona non c'è o è negata. */
async function copiaTesto(testo) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(testo);
      return true;
    }
  } catch {
    /* si prova il ripiego */
  }
  try {
    const area = document.createElement('textarea');
    area.value = testo;
    area.setAttribute('readonly', '');
    area.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0';
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand('copy');
    area.remove();
    return ok;
  } catch {
    return false;
  }
}

/**
 * @param {{
 *   title: string,
 *   roomCode: string,
 *   deckName: string,
 *   roleLabel: string,
 *   hint: string,
 *   serverUrl: string,
 *   peerConfirmed?: boolean,
 *   ready: { label: string, disabled: boolean, onClick: () => void },
 *   start?: { label: string, disabled: boolean, onClick: () => void } | null,
 *   waitingNote?: string | null,
 *   onBack: () => void,
 *   children: import('react').ReactNode,
 * }} props
 */
export function OnlineRoomScreen({
  title,
  roomCode,
  deckName,
  roleLabel,
  hint,
  serverUrl,
  peerConfirmed = false,
  ready,
  start = null,
  waitingNote = null,
  onBack,
  children,
}) {
  const screenActiveRef = useScreenActiveRef();
  // stato del bottone COPIA CODICE: idle → ok / err per qualche istante
  const [copia, setCopia] = useState('idle');
  const copiaTimer = useRef(0);
  useEffect(() => () => window.clearTimeout(copiaTimer.current), []);
  const copiaCodice = async () => {
    playUiClick();
    const ok = await copiaTesto(String(roomCode || ''));
    setCopia(ok ? 'ok' : 'err');
    window.clearTimeout(copiaTimer.current);
    copiaTimer.current = window.setTimeout(() => setCopia('idle'), 1800);
  };
  const keyRef = useRef({});
  keyRef.current = { ready, onBack, copiaCodice };
  useEffect(() => {
    const onKey = (e) => {
      if (!screenActiveRef.current) return;
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      const k = keyRef.current;
      if (e.key === 'Escape') { e.preventDefault(); playUiClick(); k.onBack(); return; }
      if (e.key === 'Enter' && !k.ready.disabled) { e.preventDefault(); k.ready.onClick(); return; }
      if ((e.key === 'c' || e.key === 'C') && !e.repeat) { e.preventDefault(); k.copiaCodice(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="mpl orm" style={{ '--accent': MULTIPLAYER_ACCENT }}>
      <div className="mpl-bg" aria-hidden="true">
        <div className="mpl-bg-slab" />
        <div className="mpl-bg-edge" />
        <div className="mpl-bg-halftone" />
        <div className="mpl-bg-stripes" />
      </div>
      <div className="mpl-watermark" aria-hidden="true">STANZA</div>

      <button type="button" className="mpl-back" onClick={() => { playUiClick(); onBack(); }}>
        <span className="key">ESC</span><span className="lbl">ESERCITO</span>
      </button>

      <div className="mpl-title orm-title">
        <div className="mpl-eyebrow"><span>ONLINE · STANZA</span></div>
        <h1>{title}</h1>
        <div className="orm-code">
          <span className="lbl">CODICE STANZA</span>
          <div className="orm-code-row">
            <span className="code">{roomCode}</span>
            <button
              type="button"
              className={`orm-copy is-${copia}`}
              onClick={copiaCodice}
              aria-label="Copia il codice stanza"
            >
              <span>{copia === 'ok' ? 'COPIATO ✓' : copia === 'err' ? 'NON COPIATO' : 'COPIA CODICE'}</span>
            </button>
          </div>
          <span className="orm-copy-status" role="status">
            {copia === 'ok' ? 'Codice negli appunti: incollalo all’amico.' : copia === 'err' ? 'Copia non riuscita: scrivi il codice a mano.' : ''}
          </span>
        </div>
        <div className="orm-deck">
          <span className="lbl">ESERCITO</span>
          <span className="name">{deckName}</span>
        </div>
      </div>

      <section className="orm-panel">
        {children}

        <div className="orm-actions">
          {peerConfirmed && <span className="orm-peer">L&apos;avversario ha confermato l&apos;esercito</span>}
          {waitingNote && <span className="orm-wait">{waitingNote}</span>}
          {start && (
            <button type="button" className="mpl-btn orm-start" onClick={start.onClick} disabled={start.disabled}>
              <span>{start.label}</span>
            </button>
          )}
          <button type="button" className="mpl-btn mpl-btn--main orm-ready" onClick={ready.onClick} disabled={ready.disabled}>
            <span>{ready.label}</span>
          </button>
        </div>
      </section>

      <footer className="mpl-help">
        <div className="mpl-help-text">
          <span className="mpl-help-label">{roleLabel}</span>
          <span className="mpl-help-hint" title={serverUrl ? `Server: ${serverUrl}` : undefined}>
            {hint}{serverUrl ? <span className="orm-server"> · Server: {serverUrl}</span> : null}
          </span>
        </div>
        <div className="mpl-help-keys">
          {!ready.disabled && <span><kbd>↵</kbd>PRONTO</span>}
          <span><kbd>C</kbd>COPIA CODICE</span>
          <span><kbd>ESC</kbd>ESERCITO</span>
        </div>
      </footer>

      <LobbyStyles />
      <OnlineRoomStyles />
    </div>
  );
}

function OnlineRoomStyles() {
  return (
    <style>{`
      .orm-title p { display: none; }
      .orm-title h1 { font-size: 70px; text-transform: uppercase; white-space: nowrap; }
      .orm-code, .orm-deck { display: flex; flex-direction: column; align-items: flex-start; gap: 6px; margin-top: 26px; }
      .orm-code .lbl, .orm-deck .lbl {
        background: var(--void); color: var(--ink); font-weight: 700; font-size: 13px; letter-spacing: 0.28em;
        padding: 3px 12px; transform: skewX(-14deg);
      }
      .orm-code .code {
        background: var(--ink); color: var(--void); padding: 8px 26px 8px 22px;
        font: 700 56px/1 'Share Tech Mono', monospace; letter-spacing: 0.22em;
        transform: skewX(-8deg); box-shadow: 7px 7px 0 var(--void);
      }
      .orm-code-row { display: flex; align-items: center; gap: 22px; }
      .orm-copy {
        border: 0; cursor: pointer; height: 54px; padding: 0 22px;
        background: var(--void); color: var(--ink); font: italic 700 19px/1 'Chakra Petch', sans-serif; letter-spacing: 0.06em;
        transform: skewX(-14deg); box-shadow: 5px 5px 0 var(--ink);
        transition: transform .15s, box-shadow .15s, background .15s, color .15s;
      }
      .orm-copy > span { display: inline-block; transform: skewX(14deg); white-space: nowrap; }
      .orm-copy:hover, .orm-copy:focus-visible { transform: skewX(-14deg) translate(-3px,-3px); box-shadow: 8px 8px 0 var(--ink); }
      .orm-copy.is-ok { background: #4ade80; color: var(--void); }
      .orm-copy.is-err { background: var(--danger); color: var(--void); }
      .orm-copy-status { min-height: 22px; font-weight: 600; font-size: 16px; text-shadow: 2px 2px 0 var(--void); }
      .orm-deck { margin-top: 22px; }
      .orm-deck .name {
        max-width: 520px; font-weight: 700; font-style: italic; font-size: 32px; line-height: 1.05;
        text-shadow: 4px 4px 0 var(--void); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }

      .orm-panel {
        position: absolute; top: 96px; left: 760px; right: 110px; bottom: 130px; z-index: 12;
        display: flex; flex-direction: column; justify-content: center; gap: 22px;
        animation: mpl-in .3s cubic-bezier(.2,1,.3,1) both;
      }
      .orm-actions { display: flex; align-items: center; justify-content: flex-end; flex-wrap: wrap; gap: 18px; }
      .orm-actions .mpl-btn { text-transform: uppercase; }
      .orm-actions .mpl-btn--main { min-width: 300px; }
      .orm-start { height: 66px; font-size: 22px; font-style: italic; }
      .orm-peer, .orm-wait {
        margin-right: auto; padding: 8px 18px; font-weight: 700; font-size: 17px; transform: skewX(-10deg);
      }
      .orm-peer { background: #4ade80; color: var(--void); }
      .orm-wait { background: var(--plate); color: var(--ink); box-shadow: inset 0 0 0 2px var(--accent); }
      .orm-server { font-family: 'Share Tech Mono', monospace; font-size: 13px; opacity: 0.7; }
    `}</style>
  );
}

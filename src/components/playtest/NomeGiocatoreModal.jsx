import React, { useEffect, useRef, useState } from 'react';
import { MAX_NOME, setNomeGiocatore } from '../../telemetry/telemetria.js';

/**
 * Chiede il nome al primo avvio della build di playtest.
 * Il nome accompagna i dati di gioco inviati a fine partita (vedi src/telemetry/telemetria.js).
 */
export default function NomeGiocatoreModal({ onFatto }) {
  const [nome, setNome] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const pulito = nome.replace(/\s+/g, ' ').trim();
  const conferma = (e) => {
    e?.preventDefault();
    if (!pulito) return;
    onFatto?.(setNomeGiocatore(pulito));
  };

  return (
    <div className="ngm" role="dialog" aria-modal="true" aria-labelledby="ngm-titolo">
      <form className="ngm-box" onSubmit={conferma} onKeyDown={(e) => e.stopPropagation()}>
        <div className="ngm-tag">PLAYTEST</div>
        <h2 id="ngm-titolo" className="ngm-titolo">Come ti chiami?</h2>
        <p className="ngm-testo">
          Durante il playtest, a fine partita il gioco invia a Davide i dati della partita:
          modalità, armate, carte giocate, FC investiti ed esito. Il nome serve a capire chi ha giocato
          cosa: usa quello che usi su Discord.
        </p>
        <input
          ref={inputRef}
          className="ngm-input"
          value={nome}
          maxLength={MAX_NOME}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Il tuo nome su Discord"
          aria-label="Il tuo nome"
        />
        <button type="submit" className="ngm-ok" disabled={!pulito}>
          CONFERMA
        </button>
      </form>
      <style>{`
        .ngm {
          position: fixed; inset: 0; z-index: 10000;
          display: grid; place-items: center;
          background: rgba(8, 4, 16, 0.82);
          font-family: 'Chakra Petch', system-ui, sans-serif;
        }
        .ngm-box {
          width: min(520px, calc(100vw - 32px));
          padding: 28px 28px 24px;
          background: #14091f; color: #f5f3eb;
          border: 1px solid rgba(224, 69, 123, 0.55);
          box-shadow: 0 0 0 1px rgba(0,0,0,.6), 0 24px 60px rgba(0,0,0,.6);
          clip-path: polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px));
        }
        .ngm-tag { font-family: 'Share Tech Mono', monospace; font-size: 12px; letter-spacing: .3em; color: #e0457b; }
        .ngm-titolo { margin: 6px 0 10px; font-size: 28px; font-weight: 700; letter-spacing: .02em; }
        .ngm-testo { margin: 0 0 18px; font-size: 15px; line-height: 1.5; color: rgba(245,243,235,.78); }
        .ngm-input {
          width: 100%; box-sizing: border-box; padding: 12px 14px; font: inherit; font-size: 18px;
          color: #f5f3eb; background: rgba(255,255,255,.06); border: 1px solid rgba(245,243,235,.25); outline: none;
        }
        .ngm-input:focus { border-color: #e0457b; }
        .ngm-ok {
          margin-top: 16px; width: 100%; padding: 12px; font: inherit; font-weight: 700; letter-spacing: .2em;
          color: #14091f; background: #e0457b; border: 0; cursor: pointer;
        }
        .ngm-ok:disabled { opacity: .4; cursor: default; }
      `}</style>
    </div>
  );
}

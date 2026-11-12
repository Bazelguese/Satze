import React, { createContext, useEffect, useId, useRef } from 'react';
import { useLeaveThen } from '../../hooks/usePresence.js';
import { campaignMotionAllowed } from './CampaignScene.jsx';

/** Durata dell'uscita (stessa di .cs-dialog-shade.is-leaving in campaign-scene.css). */
const DIALOG_EXIT_MS = 220;

const DialogCloseContext = createContext(null);

/**
 * Per i pulsanti dentro la finestra che la chiudono da sé (es. "Salva esercito"):
 * `<CampaignDialogClose>{close => <button onClick={close}>…</button>}</CampaignDialogClose>`
 * chiude con la stessa uscita di Esc, sfondo e "Chiudi".
 */
export function CampaignDialogClose({ children }) {
  return <DialogCloseContext.Consumer>{close => children(close)}</DialogCloseContext.Consumer>;
}

export function CampaignDialog({ title, onClose, children, kicker = 'RICOGNIZIONE' }) {
  const ref = useRef(null), titleId = useId();
  // con il movimento della campagna spento (.cs-motion-off) si chiude subito
  const [leaving, requestClose] = useLeaveThen(onClose, campaignMotionAllowed() ? DIALOG_EXIT_MS : 0);
  const close = useRef(requestClose);
  close.current = requestClose;
  useEffect(() => {
    const previous = document.activeElement;
    const dialog = ref.current;
    dialog.querySelector('button').focus();
    const handleKey = event => {
      if (event.key === 'Escape') { event.preventDefault(); close.current(); }
      if (event.key !== 'Tab') return;
      const items = [...dialog.querySelectorAll('button:not(:disabled), a[href], input:not(:disabled), [tabindex="0"]')];
      const first = items[0], last = items.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    dialog.addEventListener('keydown', handleKey);
    return () => { dialog.removeEventListener('keydown', handleKey); previous?.focus(); };
  }, []);
  return <DialogCloseContext.Provider value={requestClose}>
    <div className={`cs-dialog-shade${leaving ? ' is-leaving' : ''}`} onClick={event => { if (event.target === event.currentTarget) requestClose(); }}>
      <section ref={ref} className="cs-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <header><div><p className="cs-kicker">{kicker}</p><h2 id={titleId}>{title}</h2></div><button onClick={() => requestClose()}>Chiudi</button></header>
        {children}
      </section>
    </div>
  </DialogCloseContext.Provider>;
}

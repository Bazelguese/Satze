// ============================================================
// ManualBook — il libretto di istruzioni sfogliabile, dentro il gioco
// ============================================================
// Mostra le pagine di manualPages.jsx a doppia pagina, come un libretto
// aperto: copertina da sola, poi le coppie 2-3, 4-5, …
//
// Tastiera: ← → pagina · Home/Fine inizio e fine · I indice · Esc chiude.
// ============================================================

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { MANUAL_PAGES, ManualPage } from './manualPages.jsx';
import { playUiClick } from '../audio/soundBus';
import './manual.css';

/** Percorso del PDF generato da scripts/manuale/build-pdf.mjs. */
export const MANUAL_PDF_URL = './manuale/SATZE-Manuale.pdf';

const SPREAD_W = 1480;
const SPREAD_H = 1050;

/** Doppie pagine: [null, 0], [1, 2], [3, 4], … ; l'ultima pagina sta a sinistra da sola. */
function buildSpreads(count) {
  const spreads = [[null, 0]];
  for (let i = 1; i < count; i += 2) spreads.push([i, i + 1 < count ? i + 1 : null]);
  return spreads;
}

export function ManualBook({ onClose, initialPage = 0 }) {
  const spreads = useMemo(() => buildSpreads(MANUAL_PAGES.length), []);
  const spreadOfPage = useCallback((pageIndex) => Math.max(0, spreads.findIndex((s) => s.includes(pageIndex))), [spreads]);
  const [spread, setSpread] = useState(() => spreadOfPage(initialPage));
  const [dir, setDir] = useState('next');
  const [scale, setScale] = useState(0.9);
  const stageRef = useRef(null);

  const go = useCallback((next) => {
    setSpread((cur) => {
      const target = Math.min(spreads.length - 1, Math.max(0, typeof next === 'function' ? next(cur) : next));
      if (target === cur) return cur;
      setDir(target > cur ? 'next' : 'prev');
      playUiClick();
      return target;
    });
  }, [spreads.length]);

  const goToPage = useCallback((pageIndex) => go(spreadOfPage(pageIndex)), [go, spreadOfPage]);
  const indexSpread = useMemo(() => spreadOfPage(MANUAL_PAGES.findIndex((p) => p.id === 'indice')), [spreadOfPage]);

  // La doppia pagina si adatta allo spazio disponibile, senza mai deformarsi.
  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return undefined;
    const fit = () => {
      const w = el.clientWidth - 240; // spazio per le frecce ai lati
      const h = el.clientHeight;
      if (w > 0 && h > 0) setScale(Math.min(w / SPREAD_W, h / SPREAD_H, 1.15));
    };
    fit();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(fit) : null;
    ro?.observe(el);
    return () => ro?.disconnect();
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      const k = e.key;
      if (k === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); playUiClick(); onClose?.(); return; }
      if (k === 'ArrowRight' || k === 'PageDown' || k === ' ') { e.preventDefault(); go((c) => c + 1); return; }
      if (k === 'ArrowLeft' || k === 'PageUp') { e.preventDefault(); go((c) => c - 1); return; }
      if (k === 'Home') { e.preventDefault(); go(0); return; }
      if (k === 'End') { e.preventDefault(); go(spreads.length - 1); return; }
      if (k === 'i' || k === 'I') { e.preventDefault(); go(indexSpread); }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [go, indexSpread, onClose, spreads.length]);

  const [left, right] = spreads[spread];
  const label = [left, right].filter((n) => n != null).map((n) => n + 1).join('–');

  return (
    <div className="mn-root mn-viewer" role="dialog" aria-label="Manuale di istruzioni">
      <div className="mn-desk" />
      <div className="mn-topbar">
        <button type="button" className="mn-btn" onClick={() => { playUiClick(); onClose?.(); }}>
          <span className="mn-key">ESC</span><span>MENU</span>
        </button>
        <span className="mn-topbar-title">SATZE · LIBRETTO DI ISTRUZIONI</span>
        <div className="mn-topbar-actions">
          <button type="button" className="mn-btn" onClick={() => go(indexSpread)}>
            <span className="mn-key">I</span><span>INDICE</span>
          </button>
          <a className="mn-btn" href={MANUAL_PDF_URL} download="SATZE-Manuale.pdf" target="_blank" rel="noreferrer">
            <span>SCARICA PDF</span>
          </a>
        </div>
      </div>

      <div className="mn-stage" ref={stageRef}>
        <div key={spread} className={`mn-spread is-flip-${dir}`} style={{ scale: String(scale) }}>
          <button type="button" className="mn-hit is-prev" aria-label="Pagina precedente" disabled={spread === 0} onClick={() => go((c) => c - 1)}><span>‹</span></button>
          <div className={`mn-slot is-left${left == null ? ' is-empty' : ''}`}>
            {left != null ? <ManualPage index={left} goTo={goToPage} /> : null}
          </div>
          <div className={`mn-slot is-right${right == null ? ' is-empty' : ''}`}>
            {right != null ? <ManualPage index={right} goTo={goToPage} /> : null}
          </div>
          <button type="button" className="mn-hit is-next" aria-label="Pagina successiva" disabled={spread === spreads.length - 1} onClick={() => go((c) => c + 1)}><span>›</span></button>
        </div>
      </div>

      <div className="mn-bottombar">
        <div className="mn-hints">
          <span><span className="mn-key">←</span><span className="mn-key">→</span> PAGINA</span>
          <span>PAG. {label} / {MANUAL_PAGES.length}</span>
        </div>
        <div className="mn-progress" aria-hidden="true">
          {spreads.map((s, i) => (
            <i key={i} className={i === spread ? 'is-on' : ''} onClick={() => go(i)} />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Tutte le pagine in fila, una per foglio A5: è la sorgente del PDF (?manuale=stampa). */
export function ManualPrint() {
  return (
    <div className="mn-root mn-print">
      {MANUAL_PAGES.map((p, i) => (
        <div className="mn-sheet" key={p.id}>
          <ManualPage index={i} />
        </div>
      ))}
    </div>
  );
}

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
import { getDisplaySettings } from '../settings/displaySettings';
import './manual.css';

/** Percorso del PDF generato da scripts/manuale/build-pdf.mjs. */
export const MANUAL_PDF_URL = './manuale/SATZE-Manuale.pdf';

const SPREAD_W = 1480;
const SPREAD_H = 1050;
/** Durata del giro di pagina: uguale all'animazione .mn-leaf in manual.css. */
const FLIP_MS = 560;

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
  // Pagina che sta girando: { from, to, id }. Il libro resta fermo, si muove solo il foglio.
  const [flip, setFlip] = useState(null);
  const [scale, setScale] = useState(0.9);
  const stageRef = useRef(null);
  const spreadRef = useRef(spread);
  const flipTimerRef = useRef(0);
  const flipIdRef = useRef(0);

  const go = useCallback((next) => {
    const cur = spreadRef.current;
    const target = Math.min(spreads.length - 1, Math.max(0, typeof next === 'function' ? next(cur) : next));
    if (target === cur) return;
    spreadRef.current = target;
    playUiClick();
    window.clearTimeout(flipTimerRef.current);
    setSpread(target);
    if (getDisplaySettings().reduceMotion) { setFlip(null); return; }
    flipIdRef.current += 1;
    setFlip({ from: cur, to: target, id: flipIdRef.current });
    flipTimerRef.current = window.setTimeout(() => setFlip(null), FLIP_MS);
  }, [spreads.length]);

  useEffect(() => () => window.clearTimeout(flipTimerRef.current), []);

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

  // Durante il giro: sotto restano la pagina vecchia dal lato da cui si parte e quella nuova
  // dal lato che si scopre; il foglio porta sul fronte la pagina che lascia e sul retro quella che arriva.
  const forward = flip ? flip.to > flip.from : true;
  const [fromL, fromR] = flip ? spreads[flip.from] : [left, right];
  const baseLeft = flip ? (forward ? fromL : left) : left;
  const baseRight = flip ? (forward ? right : fromR) : right;
  const leafFront = flip ? (forward ? fromR : fromL) : null;
  const leafBack = flip ? (forward ? left : right) : null;

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
        <div className="mn-spread" style={{ scale: String(scale) }}>
          <button type="button" className="mn-hit is-prev" aria-label="Pagina precedente" disabled={spread === 0} onClick={() => go((c) => c - 1)}><span>‹</span></button>
          <div className={`mn-slot is-left${baseLeft == null ? ' is-empty' : ''}`}>
            {baseLeft != null ? <ManualPage index={baseLeft} goTo={goToPage} /> : null}
          </div>
          <div className={`mn-slot is-right${baseRight == null ? ' is-empty' : ''}`}>
            {baseRight != null ? <ManualPage index={baseRight} goTo={goToPage} /> : null}
          </div>
          {flip ? (
            <div key={flip.id} className={`mn-leaf ${forward ? 'is-next' : 'is-prev'}`} aria-hidden="true">
              <div className="mn-leaf-face is-front">{leafFront != null ? <ManualPage index={leafFront} /> : null}</div>
              <div className="mn-leaf-face is-back">{leafBack != null ? <ManualPage index={leafBack} /> : null}</div>
            </div>
          ) : null}
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

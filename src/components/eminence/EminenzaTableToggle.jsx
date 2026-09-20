import React, { useEffect, useRef } from 'react';
import { HUD_ORATORIO_FONT_UI } from '../../theme/hudOratorioPalette.js';

/**
 * Tasto Campo ↔ Eminenza.
 * Con `anchorSelector` si aggancia in alto a destra di quel pannello (es. il log):
 * resta a livello di scena, sopra il velo dell'Eminenza, ma segue il pannello
 * anche quando la colonna si inclina o respira.
 */
export function EminenzaTableToggle({ viewingEminence, accent = '#d5ecf9', fragmentCount = 0, preyCount = 0, onToggle, anchorSelector = null }) {
  const label = viewingEminence ? 'Guarda il campo' : "Guarda l'Eminenza";
  const extras = [];
  if (fragmentCount > 0) extras.push(`${fragmentCount} ${fragmentCount === 1 ? 'Frammento' : 'Frammenti'}`);
  if (preyCount > 0) extras.push(`${preyCount} ${preyCount === 1 ? 'Preda' : 'Prede'}`);
  const extra = extras.length ? ` · ${extras.join(' · ')}` : '';
  const btnRef = useRef(null);

  useEffect(() => {
    if (!anchorSelector) return undefined;
    let raf = 0;
    const place = () => {
      const btn = btnRef.current;
      const scene = btn?.offsetParent;
      const anchor = scene?.querySelector(anchorSelector);
      if (btn && scene && anchor) {
        const sr = scene.getBoundingClientRect();
        const ar = anchor.getBoundingClientRect();
        const k = sr.width / (scene.offsetWidth || sr.width) || 1;
        const left = (ar.right - sr.left) / k - btn.offsetWidth - 14;
        const top = (ar.top - sr.top) / k + 8;
        btn.style.left = `${Math.round(left)}px`;
        btn.style.top = `${Math.round(top)}px`;
        btn.style.visibility = ar.width > 2 ? 'visible' : 'hidden';
      }
      raf = requestAnimationFrame(place);
    };
    raf = requestAnimationFrame(place);
    return () => cancelAnimationFrame(raf);
  }, [anchorSelector]);

  return (
    <button
      ref={btnRef}
      type="button"
      className={`em-table-toggle${anchorSelector ? ' em-table-toggle--anchored' : ''}`}
      onClick={onToggle}
      aria-pressed={viewingEminence}
      aria-label={`${label}${extra}`}
      style={{
        '--em-toggle-acc': accent,
        fontFamily: HUD_ORATORIO_FONT_UI,
        ...(anchorSelector ? { visibility: 'hidden' } : null),
      }}
    >
      {label}{extra}
    </button>
  );
}

export default EminenzaTableToggle;

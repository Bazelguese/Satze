import React from 'react';
import { HUD_ORATORIO_FONT_UI } from '../../theme/hudOratorioPalette.js';

export function EminenzaTableToggle({ viewingEminence, accent = '#d5ecf9', onToggle }) {
  const label = viewingEminence ? 'Guarda il campo' : "Guarda l'Eminenza";

  return (
    <button
      type="button"
      className="em-table-toggle"
      onClick={onToggle}
      aria-pressed={viewingEminence}
      aria-label={label}
      style={{
        '--em-toggle-acc': accent,
        fontFamily: HUD_ORATORIO_FONT_UI,
      }}
    >
      {label}
    </button>
  );
}

export default EminenzaTableToggle;

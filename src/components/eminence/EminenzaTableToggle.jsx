import React from 'react';
import { HUD_ORATORIO_FONT_UI } from '../../theme/hudOratorioPalette.js';

export function EminenzaTableToggle({ viewingEminence, accent = '#d5ecf9', fragmentCount = 0, preyCount = 0, onToggle }) {
  const label = viewingEminence ? 'Guarda il campo' : "Guarda l'Eminenza";
  const extras = [];
  if (fragmentCount > 0) extras.push(`${fragmentCount} ${fragmentCount === 1 ? 'Frammento' : 'Frammenti'}`);
  if (preyCount > 0) extras.push(`${preyCount} ${preyCount === 1 ? 'Preda' : 'Prede'}`);
  const extra = extras.length ? ` · ${extras.join(' · ')}` : '';

  return (
    <button
      type="button"
      className="em-table-toggle"
      onClick={onToggle}
      aria-pressed={viewingEminence}
      aria-label={`${label}${extra}`}
      style={{
        '--em-toggle-acc': accent,
        fontFamily: HUD_ORATORIO_FONT_UI,
      }}
    >
      {label}{extra}
    </button>
  );
}

export default EminenzaTableToggle;

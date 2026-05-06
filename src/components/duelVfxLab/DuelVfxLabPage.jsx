// ============================================
// Laboratorio effetti visivi duello
// Accesso: ?duelVfxLab=1
// Salva in localStorage (chiave satze_duel_vfx); il gioco legge al render.
// ============================================

import React, { useState, useCallback } from 'react';
import { ToolPageShell } from '../layout/ToolPageShell';
import { DuelVfxSimulator } from './DuelVfxSimulator';
import { DUEL_VISUAL_DEFAULTS } from '../../config/duelVisualConfig.js';
import {
  getDuelVisualConfig,
  saveDuelVisualOverrides,
  resetDuelVisualOverrides,
  loadDuelVisualOverrides,
} from '../../config/duelVisualConfigStore.js';

const LABELS = {
  phaseMs0: 'Fase 0 — Schieramento (ms)',
  phaseMs1: 'Fase 1 — Poteri (ms)',
  focusCoinStepMs: 'Focus coin — passo tra una moneta e l’altra (ms)',
  focusPhaseBufferMs: 'Focus coin — buffer dopo l’ultima moneta (ms)',
  phaseMs3: 'Fase 3 — Mod / minimo VA (ms, se serve)',
  phaseMs3Empty: 'Fase 3 — nessun mod (passaggio rapido, ms)',
  phaseMs4: 'Fase 4 — Scontro (ms)',
  phaseMs5: 'Fase 5 — Risultato prima del pulsante (ms)',
  rainbowIntervalMs: 'Arcobaleno — intervallo tick (ms)',
  rainbowStep: 'Arcobaleno — incremento tempo per tick',
  rainbowHueMul12: 'Tinta FC 12 — moltiplicatore',
  rainbowHueMul13: 'Tinta FC 13 — moltiplicatore',
  rainbowHueMul14: 'Tinta FC 14 — moltiplicatore',
  nextRoundClashHoldMs: 'Continua — pausa dopo clash (ms)',
  zoomTransitionMs: 'Zoom pannelli — durata transizione (ms)',
  zoomDelayMs: 'Zoom pannelli — ritardo (ms)',
};

function num(v, fallback) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export function DuelVfxLabPage({ onClose }) {
  const [draft, setDraft] = useState(() => ({ ...getDuelVisualConfig() }));
  const [jsonError, setJsonError] = useState('');

  const setField = useCallback((key, raw) => {
    setDraft((d) => {
      const def = DUEL_VISUAL_DEFAULTS[key];
      const next = { ...d };
      if (typeof def === 'number' && typeof raw === 'string') {
        const n = num(raw, def);
        if (key === 'rainbowStep') next[key] = Math.max(0.001, n);
        else if (String(key).startsWith('rainbowHueMul')) next[key] = Math.max(0, n);
        else next[key] = Math.max(0, Math.round(n));
      } else {
        next[key] = raw;
      }
      return next;
    });
  }, []);

  const persist = useCallback(() => {
    const overrides = {};
    for (const key of Object.keys(DUEL_VISUAL_DEFAULTS)) {
      if (draft[key] !== DUEL_VISUAL_DEFAULTS[key]) overrides[key] = draft[key];
    }
    saveDuelVisualOverrides(overrides);
  }, [draft]);

  const applyDefaults = useCallback(() => {
    resetDuelVisualOverrides();
    setDraft({ ...DUEL_VISUAL_DEFAULTS });
  }, []);

  const applyFromStorage = useCallback(() => {
    setDraft({ ...getDuelVisualConfig() });
  }, []);

  const importJson = useCallback(() => {
    setJsonError('');
    const text = window.prompt('Incolla JSON (oggetto con chiavi come phaseMs0, …):', '');
    if (text == null) return;
    try {
      const o = JSON.parse(text);
      if (!o || typeof o !== 'object') throw new Error('Non è un oggetto');
      const next = { ...DUEL_VISUAL_DEFAULTS };
      for (const key of Object.keys(DUEL_VISUAL_DEFAULTS)) {
        if (key in o) next[key] = typeof DUEL_VISUAL_DEFAULTS[key] === 'number' ? num(o[key], DUEL_VISUAL_DEFAULTS[key]) : o[key];
      }
      setDraft(next);
      saveDuelVisualOverrides(
        Object.fromEntries(
          Object.keys(DUEL_VISUAL_DEFAULTS).map((k) => [k, next[k]]).filter(([k, v]) => v !== DUEL_VISUAL_DEFAULTS[k])
        )
      );
    } catch (e) {
      setJsonError(e.message || 'JSON non valido');
    }
  }, []);

  const exportJson = useCallback(() => {
    const overrides = loadDuelVisualOverrides();
    const blob = new Blob([JSON.stringify(overrides, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'satze-duel-vfx.json';
    a.click();
    URL.revokeObjectURL(a.href);
  }, []);

  const keys = Object.keys(DUEL_VISUAL_DEFAULTS);

  return (
    <ToolPageShell
      title="Duel VFX Lab"
      subtitle="Modifica i numeri qui sotto: l’anteprima si aggiorna subito. Salva per applicare al gioco; usa il blocco testo in fondo all’anteprima per descrivere in chat cosa vuoi cambiare (fase, zona schermo, ms)."
      onClose={onClose}
    >
      <div className="mb-8">
        <DuelVfxSimulator vfx={draft} />
      </div>

      <div className="satze-tool-panel space-y-4 p-5">
        {keys.map((key) => (
          <label key={key} className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-[var(--st-muted)]">
              {LABELS[key] || key}
            </span>
            <div className="mt-1 flex items-center gap-3">
              <input
                type="number"
                step={key === 'rainbowStep' ? '0.01' : '1'}
                min={key === 'rainbowStep' ? '0.01' : '0'}
                className="satze-tool-input max-w-xs text-sm"
                value={draft[key]}
                onChange={(e) => setField(key, e.target.value)}
              />
              <span className="tabular-nums text-xs text-[var(--st-muted)]">def. {DUEL_VISUAL_DEFAULTS[key]}</span>
            </div>
          </label>
        ))}
      </div>

      {jsonError && <p className="mt-3 text-sm text-red-400">{jsonError}</p>}

      <div className="mt-6 flex flex-wrap gap-2">
        <button type="button" onClick={persist} className="satze-tool-btn-primary">
          Salva (localStorage + notifica gioco)
        </button>
        <button type="button" onClick={applyDefaults} className="satze-tool-btn-secondary text-sm">
          Ripristina default
        </button>
        <button type="button" onClick={applyFromStorage} className="satze-tool-btn-secondary text-sm">
          Ricarica da storage
        </button>
        <button type="button" onClick={importJson} className="satze-tool-btn-secondary text-sm">
          Importa JSON
        </button>
        <button type="button" onClick={exportJson} className="satze-tool-btn-secondary text-sm">
          Esporta override JSON
        </button>
      </div>

      <p className="mt-8 text-xs leading-relaxed text-[var(--st-muted)]">
        Fasi duello nel codice: 0 schieramento, 1 poteri, 2 focus coin, 3 calcolo VA, 4 scontro, 5 risultato, 6 pulsante
        continua. La durata della fase 2 è <code className="text-[var(--st-text)]">max(FC) × passo + buffer</code>.
      </p>
    </ToolPageShell>
  );
}

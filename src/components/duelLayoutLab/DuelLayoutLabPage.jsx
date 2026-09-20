// ============================================
// Duel Layout Lab — anteprima skin / alternative art su composizione ufficiale
// Accesso: ?duelLayoutLab=1  |  menu → STRUMENTI DEV
// ============================================

import React, { useCallback, useState } from 'react';
import { ToolPageShell } from '../layout/ToolPageShell';
import { GameViewport } from '../GameViewport';
import { DuelLayoutLabStage } from './DuelLayoutLabStage';
import {
  ALT_ART_OPTIONS,
  DEP_OPTIONS,
  MOV_OPTIONS,
  PHASE_OPTIONS,
  STY_OPTIONS,
  loadDuelLayoutLabPrefs,
  resetDuelLayoutLabPrefs,
  saveDuelLayoutLabPrefs,
} from './duelLayoutLabPrefs';
import './duelLayoutLab.css';

function ChipGroup({ label, options, value, onChange }) {
  return (
    <div className="space-y-2">
      <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--st-muted)]">
        {label}
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = value === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChange(opt.id)}
              className="px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] border transition-colors"
              style={{
                borderColor: active ? 'var(--st-accent)' : 'var(--st-border)',
                background: active ? 'rgba(212, 168, 71, 0.18)' : 'var(--st-well)',
                color: active ? 'var(--st-text)' : 'var(--st-muted)',
              }}
              title={opt.note || opt.label}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function DuelLayoutLabPage({ onClose }) {
  const [prefs, setPrefs] = useState(loadDuelLayoutLabPrefs);

  const patch = useCallback((partial) => {
    setPrefs((prev) => {
      const next = { ...prev, ...partial };
      saveDuelLayoutLabPrefs(next);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setPrefs(resetDuelLayoutLabPrefs());
  }, []);

  const sceneLine = [
    prefs.dep,
    prefs.mov,
    prefs.sty,
    prefs.altArt !== 'off' ? prefs.altArt : null,
    'imp-center',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <ToolPageShell
      title="Duel Layout Lab"
      subtitle={
        <>
          Composizione ufficiale 1920×1080 (stessi marker <code className="text-[var(--st-text)]">imp-*</code> di
          produzione). Serve a provare skin / alternative art prima di wirearle in partita.
        </>
      }
      onClose={onClose}
      closeLabel="← Gioco"
    >
      <div className="mb-5 grid gap-4 rounded border border-[var(--st-border)] bg-[var(--st-well)] p-4 lg:grid-cols-2">
        <ChipGroup
          label="Stile pannelli (sty-*)"
          options={STY_OPTIONS}
          value={prefs.sty}
          onChange={(sty) => patch({ sty })}
        />
        <ChipGroup
          label="Profondità (dep-*)"
          options={DEP_OPTIONS}
          value={prefs.dep}
          onChange={(dep) => patch({ dep })}
        />
        <ChipGroup
          label="Respiro (mov-*)"
          options={MOV_OPTIONS}
          value={prefs.mov}
          onChange={(mov) => patch({ mov })}
        />
        <ChipGroup
          label="Alternative art / layout WIP"
          options={ALT_ART_OPTIONS}
          value={prefs.altArt}
          onChange={(altArt) => patch({ altArt })}
        />
        <ChipGroup
          label="Fase demo"
          options={PHASE_OPTIONS}
          value={prefs.phase}
          onChange={(phase) => patch({ phase })}
        />
        <div className="space-y-3">
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--st-muted)]">
            Livelli
          </div>
          <label className="flex items-center gap-2 text-sm text-[var(--st-muted)]">
            <input
              type="checkbox"
              checked={prefs.showAgents}
              onChange={(e) => patch({ showAgents: e.target.checked })}
            />
            Agenti schierati (offset produzione)
          </label>
          <label className="flex items-center gap-2 text-sm text-[var(--st-muted)]">
            <input
              type="checkbox"
              checked={prefs.showHands}
              onChange={(e) => patch({ showHands: e.target.checked })}
            />
            Mani (triangoli ufficiali)
          </label>
          <button type="button" className="satze-tool-btn-secondary text-sm" onClick={reset}>
            Reset preferenze lab
          </button>
        </div>
      </div>

      <p className="mb-3 text-xs text-[var(--st-muted)]">
        Root scene:{' '}
        <code className="text-[var(--st-text)]">satze-scene {sceneLine}</code>
        {prefs.altArt === 'layout-alt' && (
          <>
            {' '}
            — CSS WIP in <code className="text-[var(--st-text)]">duelLayoutLab.css</code>
          </>
        )}
      </p>

      <GameViewport>
        <DuelLayoutLabStage
          sty={prefs.sty}
          dep={prefs.dep}
          mov={prefs.mov}
          altArt={prefs.altArt}
          phase={prefs.phase}
          showAgents={prefs.showAgents}
          showHands={prefs.showHands}
        />
      </GameViewport>

      <p className="mt-6 text-xs leading-relaxed text-[var(--st-muted)]">
        Produzione oggi: <code className="text-[var(--st-text)]">dep-2 + mov-* + sty-a</code> in{' '}
        <code className="text-[var(--st-text)]">Codice/satze.jsx</code>.{' '}
        <code className="text-[var(--st-text)]">sty-b</code> / <code className="text-[var(--st-text)]">sty-c</code>{' '}
        esistono già in <code className="text-[var(--st-text)]">satze-duello-2_5d.css</code> ma non sono wired.
        Per un nuovo alternative art: itera su <code className="text-[var(--st-text)]">layout-alt</code>, poi promuovi
        a classe ufficiale e collega il root del duello.
      </p>
    </ToolPageShell>
  );
}

export default DuelLayoutLabPage;

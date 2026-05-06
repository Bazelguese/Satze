// ============================================
// STYLE LAB — prototipi + tool di valutazione
// Accesso: ?styleLab=1
// ============================================

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { injectCampaignFonts } from '../../campaign/campaignTheme';
import {
  loadEvaluations,
  saveEvaluations,
  buildEvalReportText,
  sortScore,
  STYLELAB_EVAL_KEY,
} from './styleLabEvalStorage';
import './styleLab.css';
import { StyleLabRealPreview } from './StyleLabRealPreview';
import { ToolPageShell } from '../layout/ToolPageShell';

export const STYLELAB_THEMES = [
  {
    id: 'campaign',
    label: 'Gioco (HUD tattico cyber)',
    hint: 'Stesso look del client attuale: Chakra Petch, ciano, scanline, angoli tagliati.',
    className: 'sl-theme--campaign',
  },
  {
    id: 'tabletop',
    label: 'Tavolo / pergamena',
    hint: 'Prima iterazione: carta, inchiostro, cornice.',
    className: 'sl-theme--tabletop',
  },
  {
    id: 'pergamena2',
    label: 'Pergamena II (raffinata)',
    hint: 'Dopo “bello ma non ci siamo”: più materiale, sigillo, bordo irregolare.',
    className: 'sl-theme--pergamena2',
  },
  {
    id: 'hud',
    label: 'HUD tattico (ref. cyber)',
    hint: 'Angoli tagliati + ciano — riferimento Cyberpunk che temi per il setting.',
    className: 'sl-theme--hud',
  },
  {
    id: 'hud_satze',
    label: 'HUD oratorio (Satze)',
    hint: 'Stessa struttura HUD, palette viola/oro/ambra da campagna — meno “notte cyber”.',
    className: 'sl-theme--hud_satze',
  },
  {
    id: 'forgia',
    label: 'Forgia ambra',
    hint: 'Al posto dell’incisione troppo dura: calore, ombre morbide, ancora leggibile.',
    className: 'sl-theme--forgia',
  },
];

const CRITERIA = [
  { key: 'overall', label: 'Complessivo' },
  { key: 'gameFeel', label: 'Sensazione “da gioco”' },
  { key: 'legibility', label: 'Leggibilità' },
  { key: 'notWeb', label: 'Non sembra un sito web' },
];

function MockPanel() {
  return (
    <div className="sl-mock">
      <div className="sl-mock__tag">Fronte attivo</div>
      <div className="sl-mock__title">Assalto — settore nord</div>
      <div className="sl-mock__stats">
        <div className="sl-mock__stat">
          Pressione
          <strong>62</strong>
        </div>
        <div className="sl-mock__stat">
          Giorno
          <strong>04</strong>
        </div>
      </div>
      <div className="sl-mock__actions">
        <button type="button" className="sl-mock__btn sl-mock__btn--pri">
          Conferma
        </button>
        <button type="button" className="sl-mock__btn sl-mock__btn--sec">
          Indietro
        </button>
      </div>
    </div>
  );
}

function injectStyleLabFonts() {
  if (typeof document === 'undefined') return;
  if (document.getElementById('satze-stylelab-fonts')) return;
  const link = document.createElement('link');
  link.id = 'satze-stylelab-fonts';
  link.rel = 'stylesheet';
  link.href =
    'https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700&family=Chakra+Petch:wght@400;500;600;700&family=Cinzel:wght@600;700&family=Cormorant+Garamond:wght@500;600;700&family=Crimson+Pro:wght@500;600&family=EB+Garamond:wght@500;600&family=Libre+Baskerville:wght@400;700&family=Rajdhani:wght@400;500;600;700&display=swap';
  document.head.appendChild(link);
}

function StarRow({ label, value, onChange }) {
  return (
    <div className="sl-eval__row">
      <span className="sl-eval__row-label">{label}</span>
      <div className="sl-eval__stars" role="group" aria-label={label}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            className={`sl-eval__star ${value >= n ? 'sl-eval__star--on' : ''}`}
            aria-pressed={value >= n}
            aria-label={`${label}: ${n} su 5`}
            onClick={() => onChange(value === n ? 0 : n)}
          >
            ★
          </button>
        ))}
      </div>
    </div>
  );
}

function EvalPanel({ themeId, themeLabel, data, onChange, compact }) {
  const patch = useCallback(
    (key, val) => {
      onChange(themeId, { ...data, [key]: val });
    },
    [data, onChange, themeId]
  );

  return (
    <div className={`sl-eval ${compact ? 'sl-eval--compact' : ''}`}>
      <div className="sl-eval__head">
        <span className="sl-eval__head-title">Valutazione</span>
        <span className="sl-eval__head-sub">{themeLabel}</span>
      </div>
      {CRITERIA.map(({ key, label }) => (
        <StarRow
          key={key}
          label={label}
          value={data[key] || 0}
          onChange={(v) => patch(key, v)}
        />
      ))}
      <label className="sl-eval__note-label" htmlFor={`note-${themeId}`}>
        Note libere
      </label>
      <textarea
        id={`note-${themeId}`}
        className="sl-eval__note"
        rows={compact ? 2 : 3}
        placeholder="Cosa funziona, cosa no, idee…"
        value={data.note || ''}
        onChange={(e) => patch('note', e.target.value)}
      />
    </div>
  );
}

function ThemePreview({ theme, large }) {
  return (
    <div
      className={`${theme.className} ${large ? 'sl-preview--large' : ''} sl-preview-wrap flex flex-col items-center justify-center`}
    >
      <div className="w-full max-w-[360px] mb-3 text-center px-2">
        <h2 className="text-lg font-bold opacity-95">{theme.label}</h2>
        <p className="text-xs mt-2 opacity-75 leading-relaxed">{theme.hint}</p>
      </div>
      <StyleLabRealPreview themeId={theme.id} large={large} />
      <div className="sl-preview__sep">Pannello missione (campagna)</div>
      <MockPanel />
    </div>
  );
}

export function StyleLabPage({ onClose }) {
  const themeIds = useMemo(() => STYLELAB_THEMES.map((t) => t.id), []);

  const [evalByTheme, setEvalByTheme] = useState(() => loadEvaluations(themeIds));
  const [viewMode, setViewMode] = useState('grid');
  const [focusIndex, setFocusIndex] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [exportMsg, setExportMsg] = useState('');

  useEffect(() => {
    injectCampaignFonts();
    injectStyleLabFonts();
  }, []);

  useEffect(() => {
    saveEvaluations(evalByTheme);
  }, [evalByTheme]);

  const updateEval = useCallback((themeId, next) => {
    setEvalByTheme((prev) => ({ ...prev, [themeId]: next }));
  }, []);

  const handleReset = useCallback(() => {
    if (typeof window !== 'undefined' && !window.confirm('Azzerare tutte le valutazioni e le note?')) {
      return;
    }
    try {
      localStorage.removeItem(STYLELAB_EVAL_KEY);
    } catch {
      /* ignore */
    }
    const empty = {};
    for (const id of themeIds) {
      empty[id] = { overall: 0, gameFeel: 0, legibility: 0, notWeb: 0, note: '' };
    }
    setEvalByTheme(empty);
  }, [themeIds]);

  const handleExport = useCallback(async () => {
    const text = buildEvalReportText(STYLELAB_THEMES, evalByTheme);
    try {
      await navigator.clipboard.writeText(text);
      setExportMsg('Report copiato negli appunti.');
      setTimeout(() => setExportMsg(''), 3500);
    } catch {
      setExportMsg('Copia non disponibile: seleziona il testo dal riepilogo.');
      setShowSummary(true);
    }
  }, [evalByTheme]);

  const ranked = useMemo(() => {
    return [...STYLELAB_THEMES]
      .map((t) => ({
        theme: t,
        score: sortScore(evalByTheme[t.id] || {}),
      }))
      .sort((a, b) => b.score - a.score);
  }, [evalByTheme]);

  const focusTheme = STYLELAB_THEMES[focusIndex];

  useEffect(() => {
    if (viewMode !== 'focus') return;
    const onKey = (e) => {
      if (e.key === 'ArrowLeft') {
        setFocusIndex((i) => (i - 1 + STYLELAB_THEMES.length) % STYLELAB_THEMES.length);
      }
      if (e.key === 'ArrowRight') {
        setFocusIndex((i) => (i + 1) % STYLELAB_THEMES.length);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [viewMode]);

  const subtitle = (
    <>
      In alto: <strong className="text-[var(--st-text)] opacity-90">anteprima duello reale</strong> —{' '}
      <code className="text-xs text-[var(--st-muted)]">StatsPanel</code>,{' '}
      <code className="text-xs text-[var(--st-muted)]">MiniBattlefield</code>,{' '}
      <code className="text-xs text-[var(--st-muted)]">Card</code> come in partita (dati fissi, ridimensionati). Sotto:
      pannello missione campagna. Stelle e note restano salvate in questo browser.
    </>
  );

  return (
    <ToolPageShell
      title="Style Lab — valutazione prototipi"
      subtitle={subtitle}
      onClose={onClose}
      closeLabel="← Gioco"
      contentClassName="style-lab-root"
      headerActions={
        <>
          <div className="mr-1 flex overflow-hidden rounded border border-[var(--st-border)]">
            <button
              type="button"
              className={`px-3 py-1.5 text-xs font-semibold ${
                viewMode === 'grid'
                  ? 'bg-[var(--st-border-hi)] text-[var(--st-text)]'
                  : 'bg-[var(--st-well)] text-[var(--st-muted)] hover:text-[var(--st-text)]'
              }`}
              onClick={() => setViewMode('grid')}
            >
              Griglia
            </button>
            <button
              type="button"
              className={`px-3 py-1.5 text-xs font-semibold ${
                viewMode === 'focus'
                  ? 'bg-[var(--st-border-hi)] text-[var(--st-text)]'
                  : 'bg-[var(--st-well)] text-[var(--st-muted)] hover:text-[var(--st-text)]'
              }`}
              onClick={() => setViewMode('focus')}
            >
              Focus
            </button>
          </div>
          <button
            type="button"
            onClick={() => setShowSummary((s) => !s)}
            className="satze-tool-btn-secondary px-3 py-1.5 text-xs"
          >
            {showSummary ? 'Nascondi' : 'Mostra'} riepilogo
          </button>
          <button type="button" onClick={handleExport} className="satze-tool-btn-primary px-3 py-1.5 text-xs">
            Copia report
          </button>
          <button type="button" onClick={handleReset} className="satze-tool-btn-secondary px-3 py-1.5 text-xs">
            Azzera
          </button>
        </>
      }
    >
        {exportMsg && (
          <p className="text-sm text-emerald-400/90 mb-3" role="status">
            {exportMsg}
          </p>
        )}

        {viewMode === 'focus' && (
          <p className="text-xs text-slate-500 mb-4">
            Modalità Focus: usa <kbd className="px-1 bg-slate-800 rounded border border-slate-600">←</kbd>{' '}
            <kbd className="px-1 bg-slate-800 rounded border border-slate-600">→</kbd> per cambiare prototipo.
          </p>
        )}

        {ranked.some((r) => r.score > 0) && (
          <div className="mb-6 p-4 rounded border border-slate-800 bg-slate-950/80">
            <div className="text-[11px] uppercase tracking-wider text-slate-500 mb-2">Ordine per punteggio (stima)</div>
            <ol className="flex flex-wrap gap-3 text-sm text-slate-300">
              {ranked.map(({ theme, score }, i) => (
                <li key={theme.id} className="flex items-center gap-2">
                  <span className="text-slate-600 w-4">{i + 1}.</span>
                  <span>{theme.label}</span>
                  {score > 0 && (
                    <span className="text-amber-500/90 font-mono text-xs">({score.toFixed(1)})</span>
                  )}
                </li>
              ))}
            </ol>
          </div>
        )}

        {showSummary && (
          <div className="mb-8 p-4 rounded border border-slate-700 bg-slate-900/90 text-sm">
            <h3 className="text-slate-200 font-semibold mb-3">Report testuale</h3>
            <pre className="text-slate-400 whitespace-pre-wrap font-mono text-xs leading-relaxed overflow-x-auto p-3 bg-black/40 rounded border border-slate-800 max-h-64 overflow-y-auto">
              {buildEvalReportText(STYLELAB_THEMES, evalByTheme)}
            </pre>
          </div>
        )}

        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            {STYLELAB_THEMES.map((t) => (
              <div key={t.id} className="rounded-sm border border-slate-800 overflow-hidden bg-slate-950/50">
                <div className="p-4 md:p-6 min-h-[260px] flex items-center justify-center">
                  <ThemePreview theme={t} />
                </div>
                <EvalPanel
                  themeId={t.id}
                  themeLabel={t.label}
                  data={evalByTheme[t.id]}
                  onChange={updateEval}
                  compact
                />
              </div>
            ))}
          </div>
        )}

        {viewMode === 'focus' && focusTheme && (
          <div className="flex flex-col xl:flex-row gap-6 xl:gap-10 items-start">
            <div className="flex-1 min-w-0 w-full">
              <div className="flex items-center justify-between gap-4 mb-4">
                <button
                  type="button"
                  className="px-3 py-2 text-slate-300 border border-slate-600 hover:bg-slate-800 text-sm"
                  onClick={() =>
                    setFocusIndex((i) => (i - 1 + STYLELAB_THEMES.length) % STYLELAB_THEMES.length)
                  }
                >
                  ← Precedente
                </button>
                <span className="text-slate-500 text-sm">
                  {focusIndex + 1} / {STYLELAB_THEMES.length}
                </span>
                <button
                  type="button"
                  className="px-3 py-2 text-slate-300 border border-slate-600 hover:bg-slate-800 text-sm"
                  onClick={() => setFocusIndex((i) => (i + 1) % STYLELAB_THEMES.length)}
                >
                  Successivo →
                </button>
              </div>
              <div className="p-6 md:p-10 rounded-sm border border-slate-800 min-h-[360px] flex items-center justify-center">
                <ThemePreview theme={focusTheme} large />
              </div>
            </div>
            <div className="w-full xl:w-[380px] shrink-0 xl:sticky xl:top-4">
              <EvalPanel
                themeId={focusTheme.id}
                themeLabel={focusTheme.label}
                data={evalByTheme[focusTheme.id]}
                onChange={updateEval}
                compact={false}
              />
            </div>
          </div>
        )}

        <p className="mt-10 text-xs text-[var(--st-muted)]">
          Per tornare al gioco usa il pulsante in alto. Puoi anche aprire questa schermata dal{' '}
          <strong className="opacity-90">menu principale → STYLE LAB</strong>.
        </p>
    </ToolPageShell>
  );
}

export default StyleLabPage;

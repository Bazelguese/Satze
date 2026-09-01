// ============================================
// Eminence Lab — duello (zona produzione) + arte carta
// Accesso: ?eminenceArtLab=1  |  menu → STRUMENTI DEV
// ============================================

import React, { useMemo, useState } from 'react';
import { ToolPageShell } from '../layout/ToolPageShell';
import { EMINENCES } from '../../data/eminences';
import { getEminenceArtUrl } from '../../data/eminenceArt';
import { ARMY_COLORS } from '../../data/armies';
import {
  EminenceTarotCard,
  EMINENCE_ART_BASE_OPTIONS,
  EMINENCE_ART_DEFAULT,
  EMINENCE_CURVE_OPTIONS,
  EMINENCE_FOIL_OPTION,
} from './EminenceTarotCard';
import { EminenceDuelLab, RangeField, useEminenceArtFrame } from './EminenceDuelLab.jsx';
import './eminenceArtLab.css';

const EMINENCE_LIST = Object.values(EMINENCES);

function OptionList({ name, options, value, onChange, activeClass }) {
  return (
    <div className="space-y-2">
      {options.map((opt) => (
        <label
          key={opt.key}
          className={`flex cursor-pointer gap-3 rounded border px-3 py-2 transition-colors ${
            value === opt.key
              ? activeClass
              : 'border-[var(--st-border)] bg-[var(--st-well)] hover:border-[var(--st-border-hi)]'
          }`}
        >
          <input
            type="radio"
            name={name}
            className="mt-1"
            checked={value === opt.key}
            onChange={() => onChange(opt.key)}
          />
          <span>
            <span className="block text-sm font-semibold text-[var(--st-text)]">{opt.title}</span>
            <span className="block text-xs text-[var(--st-muted)] leading-relaxed">{opt.desc}</span>
          </span>
        </label>
      ))}
    </div>
  );
}

function TabButton({ id, label, active, onClick }) {
  return (
    <button
      type="button"
      className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] ${
        active
          ? 'bg-[var(--st-border-hi)] text-[var(--st-text)]'
          : 'bg-[var(--st-well)] text-[var(--st-muted)] hover:text-[var(--st-text)]'
      }`}
      onClick={() => onClick(id)}
    >
      {label}
    </button>
  );
}

function EminenceArtStudio() {
  const [eminenceId, setEminenceId] = useState('figli_domanda_senza_fine');
  const [life, setLife] = useState(EMINENCE_ART_DEFAULT);
  const [intensity, setIntensity] = useState(1);
  const [tiltEnabled, setTiltEnabled] = useState(true);
  const [compare, setCompare] = useState(false);
  const { frame, setFrameField, resetFrame } = useEminenceArtFrame(eminenceId);

  const eminence = useMemo(
    () => EMINENCE_LIST.find((e) => e.id === eminenceId) || EMINENCE_LIST[0],
    [eminenceId]
  );

  const accent = ARMY_COLORS[eminence.army]?.accent ?? '#a288fb';
  const staticText = eminence.static?.text || eminence.static?.name || '';

  const cardProps = {
    name: eminence.name,
    army: eminence.army,
    staticText,
    presence: eminence.initialPresence ?? 0,
    artUrl: getEminenceArtUrl(eminence),
    accent,
    intensity,
  };

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      <div className="space-y-6">
        <div className="satze-tool-panel p-6 space-y-4">
          <h2 className="text-lg font-bold text-[var(--st-text)]">Eminenza</h2>
          <select
            className="satze-tool-input"
            value={eminence.id}
            onChange={(e) => setEminenceId(e.target.value)}
          >
            {EMINENCE_LIST.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name} — {e.army}
              </option>
            ))}
          </select>
        </div>

        <div className="satze-tool-panel p-6 space-y-4">
          <h2 className="text-lg font-bold text-[var(--st-text)]">Base</h2>
          <OptionList
            name="eminence-life"
            options={EMINENCE_ART_BASE_OPTIONS}
            value={life}
            onChange={setLife}
            activeClass="border-amber-500/60 bg-amber-950/25"
          />
        </div>

        <div className="satze-tool-panel p-6 space-y-4">
          <h2 className="text-lg font-bold text-[var(--st-text)]">Curvatura / movimento</h2>
          <OptionList
            name="eminence-life"
            options={EMINENCE_CURVE_OPTIONS}
            value={life}
            onChange={setLife}
            activeClass="border-sky-500/50 bg-sky-950/25"
          />
        </div>

        <div className="satze-tool-panel p-6 space-y-3 border-dashed border-[var(--st-border)]">
          <h2 className="text-lg font-bold text-[var(--st-text)]">Riservato</h2>
          <OptionList
            name="eminence-life"
            options={[EMINENCE_FOIL_OPTION]}
            value={life}
            onChange={setLife}
            activeClass="border-fuchsia-500/50 bg-fuchsia-950/20"
          />
        </div>

        <div className="satze-tool-panel p-6 space-y-3">
          <h2 className="text-lg font-bold text-[var(--st-text)]">Opzioni</h2>
          <label className="flex flex-col gap-2 text-sm text-[var(--st-muted)]">
            <span className="flex justify-between">
              <span>Intensità</span>
              <span className="tabular-nums text-[var(--st-text)]">{intensity.toFixed(2)}</span>
            </span>
            <input
              type="range"
              min={0.5}
              max={1.5}
              step={0.05}
              value={intensity}
              onChange={(e) => setIntensity(Number(e.target.value))}
              disabled={life === 'flat'}
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-[var(--st-muted)]">
            <input
              type="checkbox"
              checked={tiltEnabled}
              onChange={(e) => setTiltEnabled(e.target.checked)}
              disabled={life === 'flat' || life === 'satze'}
            />
            Segui il mouse (carta intera; in SATZE curved è già sull’immagine)
          </label>
          <label className="flex items-center gap-2 text-sm text-[var(--st-muted)]">
            <input
              type="checkbox"
              checked={compare}
              onChange={(e) => setCompare(e.target.checked)}
            />
            Confronta prove curvatura
          </label>
        </div>

        <div className="satze-tool-panel p-6 space-y-3">
          <h2 className="text-lg font-bold text-[var(--st-text)]">Inquadratura arte</h2>
          <p className="text-xs text-[var(--st-muted)] leading-relaxed">
            Solo per {eminence.name}. L’inquadratura sposta il ritaglio (0 = alto).
          </p>
          <RangeField
            label="Inquadratura orizzontale"
            value={frame.focusX}
            min={0}
            max={100}
            step={1}
            onChange={(v) => setFrameField('focusX', v)}
          />
          <RangeField
            label="Inquadratura verticale"
            value={frame.focusY}
            min={0}
            max={100}
            step={1}
            onChange={(v) => setFrameField('focusY', v)}
          />
          <RangeField
            label="Piega orizzontale"
            value={frame.artX}
            min={0}
            max={100}
            step={1}
            onChange={(v) => setFrameField('artX', v)}
          />
          <RangeField
            label="Piega verticale"
            value={frame.artY}
            min={0}
            max={100}
            step={1}
            onChange={(v) => setFrameField('artY', v)}
          />
          <RangeField
            label="Zoom"
            value={frame.zoom}
            min={100}
            max={180}
            step={1}
            suffix="%"
            onChange={(v) => setFrameField('zoom', v)}
          />
          <button type="button" className="satze-tool-btn-secondary w-full" onClick={resetFrame}>
            Azzera questa carta
          </button>
        </div>
      </div>

      <div className="lg:col-span-2 space-y-6">
        {!compare ? (
          <div className="eminence-lab-stage">
            <EminenceTarotCard
              {...cardProps}
              life={life}
              tiltEnabled={tiltEnabled}
              artX={frame.artX}
              artY={frame.artY}
              artZoom={frame.zoom}
              artFocusX={frame.focusX}
              artFocusY={frame.focusY}
            />
          </div>
        ) : (
          <div className="satze-tool-panel p-6">
            <div className="eminence-lab-compare">
              {EMINENCE_CURVE_OPTIONS.map((opt) => (
                <div key={opt.key} className="space-y-2">
                  <div className="text-center text-[10px] uppercase tracking-[0.2em] text-[var(--st-muted)]">
                    {opt.title}
                  </div>
                  <EminenceTarotCard {...cardProps} life={opt.key} tiltEnabled={false} artX={frame.artX} artY={frame.artY} artZoom={frame.zoom} artFocusX={frame.focusX} artFocusY={frame.focusY} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function EminenceArtLabPage({ onClose }) {
  const [tab, setTab] = useState('duel');

  return (
    <ToolPageShell
      title="Eminence Lab"
      subtitle={
        tab === 'duel'
          ? 'Stessa zona del duello. Cambia forma e apparizione del costruttore, poi il click sull’abilità riempie la losanga.'
          : 'Default: SATZE curved (maschera fissa + overscan/parallax/tilt). Prove curvatura sotto. WebGL barrel = step successivo.'
      }
      onClose={onClose}
      contentClassName={tab === 'duel' ? '!max-w-[1680px]' : ''}
      headerActions={
        <div className="mr-1 flex overflow-hidden rounded border border-[var(--st-border)]">
          <TabButton id="duel" label="Duello" active={tab === 'duel'} onClick={setTab} />
          <TabButton id="art" label="Arte" active={tab === 'art'} onClick={setTab} />
        </div>
      }
    >
      {tab === 'duel' ? <EminenceDuelLab /> : <EminenceArtStudio />}
    </ToolPageShell>
  );
}

export default EminenceArtLabPage;

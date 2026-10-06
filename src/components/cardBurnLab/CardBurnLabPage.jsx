import React from 'react';
import { ToolPageShell } from '../layout/ToolPageShell';
import { GameCard } from '../cards/GameCard';
import { ARMY_SETS } from '../../data/cards';
import { getArmyAccent } from '../../theme/duelAccents.js';
import { BurnEffect } from '../fx/burn/BurnEffect.jsx';
import { BURN_DEFAULTS, BURN_DIRECTIONS, BURN_SLIDERS } from '../fx/burn/burnParams.js';

/**
 * Lab ?cardBurnLab=1 — demo dell'animazione di bruciatura su carte reali.
 * Il colore della fiamma segue l'armata della carta (o un colore scelto a mano).
 */

const ARMY_NAMES = Object.keys(ARMY_SETS);

const PRESETS = {
  reel: {
    label: 'Cartoon (riferimento)',
    params: {
      thickness: 0.136, flamePercent: 0.76, outlinePercent: 0.22, burntAlpha: 0,
      burnNoiseScale: 3.4, noiseAmount: 0.45, noiseScale: 16, wobble: 0.06, jaggedness: 0.05,
      speed: 3.3, shrink: 0.85, softness: 0, glow: 0, embers: 0, outlineColor: '#050307',
    },
  },
  cosmico: {
    label: 'Cosmico (morbido)',
    params: { ...BURN_DEFAULTS },
  },
  cenere: {
    label: 'Cenere lenta',
    params: {
      durationMs: 3200, thickness: 0.09, flamePercent: 0.45, outlinePercent: 0.5, burntAlpha: 0.12,
      burnNoiseScale: 5, noiseAmount: 0.6, noiseScale: 7, wobble: 0.03, jaggedness: 0.02,
      speed: 0.8, shrink: 0.96, softness: 0.7, glow: 0.5, embers: 140, outlineColor: '#1a1410',
    },
  },
  vampata: {
    label: 'Vampata',
    params: {
      durationMs: 900, thickness: 0.22, flamePercent: 0.85, outlinePercent: 0.12, burntAlpha: 0,
      burnNoiseScale: 2.2, noiseAmount: 0.3, noiseScale: 10, wobble: 0.09, jaggedness: 0.04,
      speed: 4.5, shrink: 0.8, softness: 0.55, glow: 1.4, embers: 260, outlineColor: '#000000',
    },
  },
};

/** Una carta per armata per la fila di confronto. */
const ROW_ARMIES = ["Figli dell'Orizzonte", 'Corte Rossa', 'Khemet', 'Mounthborn', 'Kethran', 'Patto degli Indocili'];

function agentOf(army, index = 0) {
  const list = ARMY_SETS[army] || [];
  const card = list[Math.min(index, list.length - 1)] || list[0];
  return card ? { ...card, army } : null;
}

export function CardBurnLabPage({ onClose }) {
  const [army, setArmy] = React.useState("Figli dell'Orizzonte");
  const [cardIndex, setCardIndex] = React.useState(0);
  const [useArmyColor, setUseArmyColor] = React.useState(true);
  const [customColor, setCustomColor] = React.useState('#8fdcff');
  const [params, setParams] = React.useState({ ...BURN_DEFAULTS });
  const [mode, setMode] = React.useState('anim'); // anim | manual
  const [manualProgress, setManualProgress] = React.useState(0.45);
  const [burning, setBurning] = React.useState(false);
  const [rowBurning, setRowBurning] = React.useState(false);
  const [status, setStatus] = React.useState('Pronta');

  const agent = React.useMemo(() => agentOf(army, cardIndex), [army, cardIndex]);
  const armyColor = getArmyAccent(agent);
  const flameColor = useArmyColor ? armyColor : customColor;
  const effectParams = React.useMemo(() => ({ ...params, flameColor }), [params, flameColor]);

  const replay = React.useCallback(() => {
    setMode('anim');
    setBurning(false);
    requestAnimationFrame(() => requestAnimationFrame(() => setBurning(true)));
  }, []);

  const replayRow = React.useCallback(() => {
    setRowBurning(false);
    requestAnimationFrame(() => requestAnimationFrame(() => setRowBurning(true)));
  }, []);

  const setParam = (key, value) => setParams((prev) => ({ ...prev, [key]: value }));

  const onCardClick = (e) => {
    if (params.direction !== 'point') return;
    const r = e.currentTarget.getBoundingClientRect();
    setParams((prev) => ({
      ...prev,
      originX: Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)),
      originY: Math.max(0, Math.min(1, (e.clientY - r.top) / r.height)),
    }));
    replay();
  };

  const exported = JSON.stringify(
    Object.fromEntries(Object.entries(params).filter(([k]) => k !== 'flameColor')),
    null,
    2,
  );

  return (
    <ToolPageShell
      title="Bruciatura carta"
      subtitle="Dissolve/burn WebGL su carte reali · fiamma nel colore dell'armata"
      onClose={onClose}
    >
      <div className="grid gap-4" style={{ gridTemplateColumns: 'minmax(0, 1fr) 360px' }}>
        <div className="flex flex-col gap-4 min-w-0">
          <div className="satze-tool-panel flex flex-wrap gap-3 items-end p-4">
            <label className="text-xs text-slate-400">
              Armata
              <select
                className="ml-1 satze-tool-input"
                value={army}
                onChange={(e) => {
                  setArmy(e.target.value);
                  setCardIndex(0);
                  setBurning(false);
                }}
              >
                {ARMY_NAMES.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </label>
            <label className="text-xs text-slate-400">
              Carta
              <select
                className="ml-1 satze-tool-input"
                value={cardIndex}
                onChange={(e) => {
                  setCardIndex(Number(e.target.value));
                  setBurning(false);
                }}
              >
                {(ARMY_SETS[army] || []).map((c, i) => (
                  <option key={c.id} value={i}>{c.name}</option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-300">
              <input type="checkbox" checked={useArmyColor} onChange={(e) => setUseArmyColor(e.target.checked)} />
              Colore dell'armata
              <span className="inline-block w-4 h-4 rounded" style={{ background: armyColor, boxShadow: `0 0 8px ${armyColor}` }} />
            </label>
            {!useArmyColor ? (
              <label className="text-xs text-slate-400 flex items-center gap-1">
                Fiamma
                <input type="color" value={customColor} onChange={(e) => setCustomColor(e.target.value)} />
              </label>
            ) : null}
            <label className="text-xs text-slate-400">
              Direzione
              <select className="ml-1 satze-tool-input" value={params.direction} onChange={(e) => setParam('direction', e.target.value)}>
                {Object.entries(BURN_DIRECTIONS).map(([k, label]) => (
                  <option key={k} value={k}>{label}</option>
                ))}
              </select>
            </label>
            <button type="button" className="satze-tool-btn-primary" onClick={replay}>
              🔥 Brucia
            </button>
            <button
              type="button"
              className="satze-tool-btn-secondary text-sm"
              onClick={() => {
                setMode('anim');
                setBurning(false);
                setStatus('Pronta');
              }}
            >
              Ricomponi
            </button>
          </div>

          <div className="satze-tool-panel flex flex-wrap gap-4 items-center p-4">
            <label className="flex items-center gap-2 text-xs text-slate-300">
              <input type="radio" checked={mode === 'anim'} onChange={() => { setMode('anim'); setBurning(false); }} />
              Animazione
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-300">
              <input type="radio" checked={mode === 'manual'} onChange={() => setMode('manual')} />
              Anteprima a quota fissa
            </label>
            <label className="text-xs text-slate-400 flex items-center gap-2 flex-1 min-w-[220px]">
              Avanzamento
              <input
                type="range"
                min={0}
                max={1}
                step={0.001}
                value={manualProgress}
                disabled={mode !== 'manual'}
                onChange={(e) => setManualProgress(Number(e.target.value))}
                className="flex-1"
              />
              <span className="w-12 text-right text-slate-200 tabular-nums">{manualProgress.toFixed(3)}</span>
            </label>
            <span className="text-xs text-slate-500">Stato: <span className="text-slate-200">{status}</span></span>
          </div>

          <div
            className="relative flex items-center justify-center rounded-xl overflow-hidden"
            style={{
              height: 620,
              background: 'radial-gradient(ellipse at 50% 60%, #1b1430 0%, #0a0714 55%, #05030a 100%)',
              border: '1px solid var(--st-border)',
            }}
          >
            {agent ? (
              <div onClick={onCardClick} style={{ cursor: params.direction === 'point' ? 'crosshair' : 'default' }}>
                <BurnEffect
                  burning={mode === 'anim' && burning}
                  progress={mode === 'manual' ? manualProgress : null}
                  params={effectParams}
                  captureKey={`${agent.id}`}
                  precapture
                  pixelRatio={2}
                  onStart={() => setStatus('Brucia…')}
                  onComplete={() => setStatus('Bruciata')}
                >
                  <GameCard agent={agent} suppressAnimations />
                </BurnEffect>
              </div>
            ) : null}
            {params.direction === 'point' ? (
              <div className="absolute bottom-3 left-0 right-0 text-center text-xs text-slate-400 pointer-events-none">
                Clic sulla carta: il fuoco parte da lì
              </div>
            ) : null}
          </div>

          <div className="satze-tool-panel p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="text-sm text-slate-200">Confronto armate</div>
              <button type="button" className="satze-tool-btn-primary text-sm" onClick={replayRow}>
                🔥 Brucia tutte
              </button>
              <button type="button" className="satze-tool-btn-secondary text-sm" onClick={() => setRowBurning(false)}>
                Ricomponi
              </button>
            </div>
            <div
              className="flex items-end justify-center gap-2 rounded-lg py-24"
              style={{ background: 'radial-gradient(ellipse at 50% 70%, #171126 0%, #07050d 70%)' }}
            >
              {ROW_ARMIES.map((name, i) => {
                const a = agentOf(name, 1);
                if (!a) return null;
                return (
                  <div key={name} style={{ width: 150, height: 216, position: 'relative' }}>
                    <div style={{ transform: 'scale(0.62)', transformOrigin: 'top left', position: 'absolute', left: 0, top: 0 }}>
                      <BurnEffect
                        burning={rowBurning}
                        params={{ ...params, flameColor: getArmyAccent(a), seed: params.seed + i * 13 }}
                        captureKey={`${a.id}`}
                        precapture
                      >
                        <GameCard agent={a} suppressAnimations />
                      </BurnEffect>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="satze-tool-panel p-4">
            <div className="text-sm text-slate-200 mb-2">Preset</div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(PRESETS).map(([k, preset]) => (
                <button
                  key={k}
                  type="button"
                  className="satze-tool-btn-secondary text-xs"
                  onClick={() => {
                    setParams((prev) => ({ ...BURN_DEFAULTS, ...preset.params, direction: prev.direction, originX: prev.originX, originY: prev.originY }));
                    replay();
                  }}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div className="satze-tool-panel p-4 flex flex-col gap-2">
            <div className="text-sm text-slate-200 mb-1">Parametri</div>
            {BURN_SLIDERS.map(([key, label, min, max, step]) => (
              <label key={key} className="text-xs text-slate-400 grid items-center gap-2" style={{ gridTemplateColumns: '120px 1fr 56px' }}>
                <span>{label}</span>
                <input type="range" min={min} max={max} step={step} value={params[key]} onChange={(e) => setParam(key, Number(e.target.value))} />
                <span className="text-right text-slate-200 tabular-nums">
                  {step >= 1 ? Math.round(params[key]) : Number(params[key]).toFixed(3)}
                </span>
              </label>
            ))}
            <label className="text-xs text-slate-400 flex items-center gap-2 mt-1">
              Colore carbone
              <input type="color" value={params.outlineColor} onChange={(e) => setParam('outlineColor', e.target.value)} />
            </label>
            <button
              type="button"
              className="satze-tool-btn-secondary text-xs mt-2 self-start"
              onClick={() => setParams((prev) => ({ ...BURN_DEFAULTS, direction: prev.direction }))}
            >
              Ripristina default
            </button>
          </div>

          <div className="satze-tool-panel p-4">
            <div className="text-sm text-slate-200 mb-2">Parametri (JSON)</div>
            <textarea
              readOnly
              value={exported}
              className="w-full satze-tool-input text-[11px] font-mono"
              style={{ height: 180 }}
              onFocus={(e) => e.target.select()}
            />
            <p className="text-[11px] text-slate-500 mt-2">
              Il colore della fiamma non è nel JSON: in gioco arriva dall'armata della carta.
            </p>
          </div>
        </div>
      </div>
    </ToolPageShell>
  );
}

import React from 'react';
import { ToolPageShell } from '../layout/ToolPageShell';
import { GameCard } from '../cards/GameCard';
import { ARMY_SETS } from '../../data/cards';
import { getArmyAccent } from '../../theme/duelAccents.js';
import { ElementFx } from '../fx/ElementFx.jsx';
import { FX_ARMY_EFFECTS, FX_EFFECTS, FX_EFFECTS_BY_ID, FX_GENERIC_EFFECTS } from '../fx/effects/index.js';
import { FX_LAB_PARAM } from '../fx/effects/catalog.js';

/**
 * Lab ?cardFxLab=1 (o ?cardBurnLab=1) — demo delle animazioni su carte reali:
 * effetti generici (bruciatura, disintegrazione, frattura, vortice, materializzazione)
 * e un effetto caratteristico per ogni armata.
 * Il colore dell'effetto segue l'armata della carta (o un colore scelto a mano).
 */

const ARMY_NAMES = Object.keys(ARMY_SETS);

/** Una carta per armata per la fila di confronto. */
const ROW_ARMIES = ["Figli dell'Orizzonte", 'Corte Rossa', 'Khemet', 'Mounthborn', 'Kethran', 'Patto degli Indocili'];

function agentOf(army, index = 0) {
  const list = ARMY_SETS[army] || [];
  const card = list[Math.min(index, list.length - 1)] || list[0];
  return card ? { ...card, army } : null;
}

/** Effetto richiesto dal menu (?fx=<id>), se valido. */
function requestedEffectId() {
  if (typeof window === 'undefined') return null;
  const id = new URLSearchParams(window.location.search).get(FX_LAB_PARAM);
  return id && FX_EFFECTS_BY_ID[id] ? id : null;
}

/** Armata iniziale: quella dell'effetto richiesto, se ha carte giocabili. */
function initialArmy(fxId) {
  const army = fxId ? FX_EFFECTS_BY_ID[fxId]?.army : null;
  return army && ARMY_SETS[army] ? army : "Figli dell'Orizzonte";
}

function initialParams() {
  return Object.fromEntries(FX_EFFECTS.map((fx) => [fx.id, { ...fx.defaults }]));
}

export function CardFxLabPage({ onClose }) {
  const [effectId, setEffectId] = React.useState(() => requestedEffectId() || FX_EFFECTS[0].id);
  const [paramsById, setParamsById] = React.useState(initialParams);
  const [army, setArmy] = React.useState(() => initialArmy(requestedEffectId()));
  const [cardIndex, setCardIndex] = React.useState(0);
  const [useArmyColor, setUseArmyColor] = React.useState(true);
  const [customColor, setCustomColor] = React.useState('#8fdcff');
  const [mode, setMode] = React.useState('anim'); // anim | manual
  const [manualProgress, setManualProgress] = React.useState(0.45);
  const [playing, setPlaying] = React.useState(false);
  const [rowPlaying, setRowPlaying] = React.useState(false);
  const [status, setStatus] = React.useState('Pronta');

  const effect = FX_EFFECTS_BY_ID[effectId];
  const params = paramsById[effectId];
  const agent = React.useMemo(() => agentOf(army, cardIndex), [army, cardIndex]);
  // un'armata senza carte giocabili (es. Concordia di Caelion) usa comunque il suo colore
  // sconfitta: la carta è quella battuta, il colore è dell'armata che vince.
  // ingresso (o armata senza carte giocabili): colore dell'armata dell'effetto.
  const isDefeat = effect.role === 'defeat';
  const armyColor = effect.army && (isDefeat || !ARMY_SETS[effect.army]) ? getArmyAccent({ army: effect.army }) : getArmyAccent(agent);
  const color = useArmyColor ? armyColor : customColor;
  const effectParams = React.useMemo(() => ({ ...params, color }), [params, color]);
  const usesOrigin = Boolean(effect.usesOrigin || params.direction === 'point');

  const replay = React.useCallback(() => {
    setMode('anim');
    setPlaying(false);
    requestAnimationFrame(() => requestAnimationFrame(() => setPlaying(true)));
  }, []);

  const replayRow = React.useCallback(() => {
    setRowPlaying(false);
    requestAnimationFrame(() => requestAnimationFrame(() => setRowPlaying(true)));
  }, []);

  const setParams = (updater) =>
    setParamsById((prev) => ({ ...prev, [effectId]: typeof updater === 'function' ? updater(prev[effectId]) : updater }));
  const setParam = (key, value) => setParams((prev) => ({ ...prev, [key]: value }));

  const selectEffect = (id) => {
    setEffectId(id);
    // l'ingresso si prova su una carta di quell'armata; la sconfitta su una carta battuta
    // (resta quella scelta: l'armata dell'effetto è chi vince)
    const fx = FX_EFFECTS_BY_ID[id];
    const fxArmy = fx?.army;
    if (fxArmy && fx.role === 'entry' && ARMY_SETS[fxArmy]) {
      setArmy(fxArmy);
      setCardIndex(0);
    }
    setPlaying(false);
    setRowPlaying(false);
    setMode('anim');
    setStatus('Pronta');
  };

  const onCardClick = (e) => {
    if (!usesOrigin) return;
    const r = e.currentTarget.getBoundingClientRect();
    setParams((prev) => ({
      ...prev,
      originX: Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)),
      originY: Math.max(0, Math.min(1, (e.clientY - r.top) / r.height)),
    }));
    replay();
  };

  const exported = JSON.stringify(
    { effect: effect.id, ...Object.fromEntries(Object.entries(params).filter(([k]) => k !== 'color')) },
    null,
    2,
  );

  return (
    <ToolPageShell
      title="Animazioni carta"
      subtitle="Effetti WebGL su carte reali · colore dell'armata"
      onClose={onClose}
    >
      <div className="satze-tool-panel flex flex-col gap-2 p-3 mb-4">
        {[
          ['Generali', FX_GENERIC_EFFECTS],
          ['Armate', FX_ARMY_EFFECTS],
        ].map(([group, list]) => (
          <div key={group} className="flex flex-wrap gap-2 items-center">
            <span className="text-[11px] uppercase tracking-wider text-slate-500 w-16">{group}</span>
            {list.map((fx) => (
              <button
                key={fx.id}
                type="button"
                className={fx.id === effectId ? 'satze-tool-btn-primary text-sm' : 'satze-tool-btn-secondary text-sm'}
                onClick={() => selectEffect(fx.id)}
                title={fx.army ? `${fx.army} — ${fx.description}` : fx.description}
                style={fx.army ? { borderColor: getArmyAccent({ army: fx.army }) } : undefined}
              >
                {fx.label}
                {fx.role === 'entry' || (!fx.army && fx.kind === 'in') ? ' ↘ ingresso' : ''}
              </button>
            ))}
          </div>
        ))}
        <span className="text-xs text-slate-400">
          {effect.army ? (
            <strong className="text-slate-200">
              {effect.army} · {effect.role === 'defeat' ? 'sconfitta inflitta (la carta qui sotto è quella battuta)' : 'ingresso'} ·{' '}
            </strong>
          ) : null}
          {effect.description}
        </span>
      </div>

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
                  setPlaying(false);
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
                  setPlaying(false);
                }}
              >
                {(ARMY_SETS[army] || []).map((c, i) => (
                  <option key={c.id} value={i}>{c.name}</option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-300">
              <input type="checkbox" checked={useArmyColor} onChange={(e) => setUseArmyColor(e.target.checked)} />
              {isDefeat ? `Colore di chi vince (${effect.army})` : "Colore dell'armata"}
              <span className="inline-block w-4 h-4 rounded" style={{ background: armyColor, boxShadow: `0 0 8px ${armyColor}` }} />
            </label>
            {!useArmyColor ? (
              <label className="text-xs text-slate-400 flex items-center gap-1">
                Colore
                <input type="color" value={customColor} onChange={(e) => setCustomColor(e.target.value)} />
              </label>
            ) : null}
            {effect.directions ? (
              <label className="text-xs text-slate-400">
                Direzione
                <select className="ml-1 satze-tool-input" value={params.direction} onChange={(e) => setParam('direction', e.target.value)}>
                  {Object.entries(effect.directions).map(([k, label]) => (
                    <option key={k} value={k}>{label}</option>
                  ))}
                </select>
              </label>
            ) : null}
            <button type="button" className="satze-tool-btn-primary" onClick={replay}>
              ▶ Avvia
            </button>
            <button
              type="button"
              className="satze-tool-btn-secondary text-sm"
              onClick={() => {
                setMode('anim');
                setPlaying(false);
                setStatus('Pronta');
              }}
            >
              Ricomponi
            </button>
          </div>

          <div className="satze-tool-panel flex flex-wrap gap-4 items-center p-4">
            <label className="flex items-center gap-2 text-xs text-slate-300">
              <input type="radio" checked={mode === 'anim'} onChange={() => { setMode('anim'); setPlaying(false); }} />
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
              height: 640,
              background: 'radial-gradient(ellipse at 50% 60%, #1b1430 0%, #0a0714 55%, #05030a 100%)',
              border: '1px solid var(--st-border)',
            }}
          >
            {agent ? (
              <div onClick={onCardClick} style={{ cursor: usesOrigin ? 'crosshair' : 'default' }}>
                <ElementFx
                  effect={effect}
                  active={mode === 'anim' && playing}
                  progress={mode === 'manual' ? manualProgress : null}
                  params={effectParams}
                  captureKey={`${agent.id}`}
                  precapture
                  pixelRatio={2}
                  onStart={() => setStatus('In corso…')}
                  onComplete={() => setStatus(effect.kind === 'in' ? 'Comparsa' : 'Finita')}
                >
                  <GameCard agent={agent} suppressAnimations />
                </ElementFx>
              </div>
            ) : null}
            {usesOrigin ? (
              <div className="absolute bottom-3 left-0 right-0 text-center text-xs text-slate-400 pointer-events-none">
                Clic sulla carta: {effect.id === 'shatter' ? "punto d'impatto" : effect.id === 'vortex' ? 'centro del vortice' : "l'effetto parte da lì"}
              </div>
            ) : null}
          </div>

          <div className="satze-tool-panel p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="text-sm text-slate-200">
                {isDefeat ? `${effect.army} batte sei armate · ${effect.label}` : `Confronto armate · ${effect.label}`}
              </div>
              <button type="button" className="satze-tool-btn-primary text-sm" onClick={replayRow}>
                ▶ Avvia tutte
              </button>
              <button type="button" className="satze-tool-btn-secondary text-sm" onClick={() => setRowPlaying(false)}>
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
                      <ElementFx
                        effect={effect}
                        active={rowPlaying}
                        params={{ ...params, color: isDefeat ? armyColor : getArmyAccent(a), seed: (params.seed ?? 0) + i * 13 }}
                        captureKey={`${a.id}`}
                        precapture
                      >
                        <GameCard agent={a} suppressAnimations />
                      </ElementFx>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="satze-tool-panel p-4">
            <div className="text-sm text-slate-200 mb-2">Preset · {effect.label}</div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(effect.presets).map(([k, preset]) => (
                <button
                  key={k}
                  type="button"
                  className="satze-tool-btn-secondary text-xs"
                  onClick={() => {
                    setParams((prev) => ({
                      ...effect.defaults,
                      ...preset.params,
                      direction: preset.params.direction ?? prev.direction,
                      originX: prev.originX,
                      originY: prev.originY,
                    }));
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
            {effect.sliders.map(([key, label, min, max, step]) => (
              <label key={key} className="text-xs text-slate-400 grid items-center gap-2" style={{ gridTemplateColumns: '130px 1fr 56px' }}>
                <span>{label}</span>
                <input type="range" min={min} max={max} step={step} value={params[key]} onChange={(e) => setParam(key, Number(e.target.value))} />
                <span className="text-right text-slate-200 tabular-nums">
                  {step >= 1 ? Math.round(params[key]) : Number(params[key]).toFixed(3)}
                </span>
              </label>
            ))}
            {(effect.colorParams || []).map(([key, label]) => (
              <label key={key} className="text-xs text-slate-400 flex items-center gap-2 mt-1">
                {label}
                <input type="color" value={params[key]} onChange={(e) => setParam(key, e.target.value)} />
              </label>
            ))}
            <button
              type="button"
              className="satze-tool-btn-secondary text-xs mt-2 self-start"
              onClick={() => setParams((prev) => ({ ...effect.defaults, direction: prev.direction ?? effect.defaults.direction }))}
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
              Il colore non è nel JSON: in gioco arriva dall'armata della carta.
            </p>
          </div>
        </div>
      </div>
    </ToolPageShell>
  );
}

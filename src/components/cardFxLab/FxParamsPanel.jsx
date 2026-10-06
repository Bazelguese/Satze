import React from 'react';

/**
 * Pannello dei parametri di un effetto (preset, cursori, colori, ripristino, JSON).
 * Condiviso dalle viste del lab: i valori vivono nella pagina, così restano cambiando vista.
 */
export function FxParamsPanel({ effect, params, setParams, onReplay, title }) {
  const setParam = (key, value) => setParams((prev) => ({ ...prev, [key]: value }));
  const exported = JSON.stringify(
    { effect: effect.id, ...Object.fromEntries(Object.entries(params).filter(([k]) => k !== 'color')) },
    null,
    2,
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="satze-tool-panel p-4">
        <div className="text-sm text-slate-200 mb-2">{title || 'Preset'} · {effect.label}</div>
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
                onReplay?.();
              }}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <div className="satze-tool-panel p-4 flex flex-col gap-2">
        <div className="text-sm text-slate-200 mb-1">Parametri</div>
        {effect.directions ? (
          <label className="text-xs text-slate-400 grid items-center gap-2" style={{ gridTemplateColumns: '130px 1fr' }}>
            <span>Direzione</span>
            <select className="satze-tool-input" value={params.direction} onChange={(e) => setParam('direction', e.target.value)}>
              {Object.entries(effect.directions).map(([k, label]) => (
                <option key={k} value={k}>{label}</option>
              ))}
            </select>
          </label>
        ) : null}
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
          style={{ height: 160 }}
          onFocus={(e) => e.target.select()}
        />
        <p className="text-[11px] text-slate-500 mt-2">
          Il colore non è nel JSON: in gioco arriva dall'armata (per la sconfitta, da chi vince).
        </p>
      </div>
    </div>
  );
}

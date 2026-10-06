import React from 'react';
import { GameCard } from '../cards/GameCard';
import { ARMY_SETS } from '../../data/cards';
import { ARMY_COLORS } from '../../data/armies.js';
import { getArmyAccent } from '../../theme/duelAccents.js';
import { ElementFx } from '../fx/ElementFx.jsx';
import { armyDefeatFor, armyEntryFor, materializeEffect } from '../fx/effects/index.js';
import { FxParamsPanel } from './FxParamsPanel.jsx';

/**
 * Vista «Per armata»: per l'armata scelta, il suo ingresso in campo e la sconfitta che
 * infligge a chi batte, affiancati. Se l'ingresso non c'è ancora lo dice e mostra
 * un'anteprima provvisoria (Materializzazione nel colore dell'armata).
 */

export const ALL_ARMIES = Object.keys(ARMY_COLORS);
const PLAYABLE = Object.keys(ARMY_SETS);

function agentOf(army, index = 0) {
  const list = ARMY_SETS[army] || [];
  const card = list[Math.min(index, list.length - 1)] || list[0];
  return card ? { ...card, army } : null;
}

/** Carta per l'ingresso: dell'armata se ha carte giocabili, altrimenti una carta qualsiasi. */
function entryAgentOf(army) {
  return agentOf(ARMY_SETS[army] ? army : PLAYABLE[0], 0);
}

/** Avversario di default: l'armata successiva (fra quelle giocabili) diversa da chi vince. */
function defaultOpponent(army) {
  const i = PLAYABLE.indexOf(army);
  return PLAYABLE[(i + 1 + PLAYABLE.length) % PLAYABLE.length] === army ? PLAYABLE[0] : PLAYABLE[(i + 1) % PLAYABLE.length];
}

function Stage({ children, height = 560 }) {
  return (
    <div
      className="relative flex items-center justify-center rounded-xl overflow-hidden"
      style={{
        height,
        background: 'radial-gradient(ellipse at 50% 60%, #1b1430 0%, #0a0714 55%, #05030a 100%)',
        border: '1px solid var(--st-border)',
      }}
    >
      {children}
    </div>
  );
}

export function ArmyFxView({ paramsById, setParamsFor, initialArmy }) {
  const [army, setArmy] = React.useState(() => (ALL_ARMIES.includes(initialArmy) ? initialArmy : ALL_ARMIES[0]));
  const [opponent, setOpponent] = React.useState(() => defaultOpponent(army));
  const [opponentCard, setOpponentCard] = React.useState(1);
  const [mode, setMode] = React.useState('anim'); // anim | manual
  const [progress, setProgress] = React.useState(0.45);
  const [entryOn, setEntryOn] = React.useState(false);
  const [defeatOn, setDefeatOn] = React.useState(false);
  const [editing, setEditing] = React.useState('defeat');
  const [status, setStatus] = React.useState({ entry: 'Pronta', defeat: 'Pronta' });
  const sequenceRef = React.useRef(false);

  const accent = getArmyAccent({ army });
  const entryFx = armyEntryFor(army);
  const entryEffect = entryFx || materializeEffect;
  const defeatEffect = armyDefeatFor(army);
  const entryAgent = React.useMemo(() => entryAgentOf(army), [army]);
  const loser = React.useMemo(() => agentOf(opponent, opponentCard), [opponent, opponentCard]);

  const entryParams = { ...paramsById[entryEffect.id], color: accent };
  const defeatParams = defeatEffect ? { ...paramsById[defeatEffect.id], color: accent } : null;

  const pulse = (setter) => {
    setMode('anim');
    setter(false);
    requestAnimationFrame(() => requestAnimationFrame(() => setter(true)));
  };
  const playEntry = () => {
    sequenceRef.current = false;
    pulse(setEntryOn);
  };
  const playDefeat = () => {
    sequenceRef.current = false;
    pulse(setDefeatOn);
  };
  const playSequence = () => {
    sequenceRef.current = true;
    setDefeatOn(false);
    pulse(setEntryOn);
  };
  const reset = () => {
    sequenceRef.current = false;
    setMode('anim');
    setEntryOn(false);
    setDefeatOn(false);
    setStatus({ entry: 'Pronta', defeat: 'Pronta' });
  };

  const selectArmy = (name) => {
    setArmy(name);
    if (opponent === name) setOpponent(defaultOpponent(name));
    reset();
  };

  const onDefeatCardClick = (e) => {
    if (!defeatEffect?.usesOrigin) return;
    const r = e.currentTarget.getBoundingClientRect();
    setParamsFor(defeatEffect.id, (prev) => ({
      ...prev,
      originX: Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)),
      originY: Math.max(0, Math.min(1, (e.clientY - r.top) / r.height)),
    }));
    playDefeat();
  };

  const editedEffect = editing === 'entry' ? entryEffect : defeatEffect;

  return (
    <>
      <div className="satze-tool-panel p-3 mb-4 flex flex-wrap gap-2">
        {ALL_ARMIES.map((name) => {
          const c = getArmyAccent({ army: name });
          const hasEntry = Boolean(armyEntryFor(name));
          return (
            <button
              key={name}
              type="button"
              onClick={() => selectArmy(name)}
              className={name === army ? 'satze-tool-btn-primary text-xs' : 'satze-tool-btn-secondary text-xs'}
              style={{ borderColor: c }}
              title={`Ingresso: ${hasEntry ? armyEntryFor(name).label : 'da fare'} · Sconfitta: ${armyDefeatFor(name)?.label || 'da fare'}`}
            >
              <span className="inline-block w-2.5 h-2.5 rounded-full mr-1.5 align-middle" style={{ background: c, boxShadow: `0 0 6px ${c}` }} />
              {name}
              <span className="ml-1.5 text-[10px] opacity-70">{hasEntry ? '●●' : '○●'}</span>
            </button>
          );
        })}
        <span className="text-[11px] text-slate-500 self-center ml-1">●● ingresso e sconfitta · ○● ingresso da fare</span>
      </div>

      <div className="satze-tool-panel flex flex-wrap gap-3 items-center p-3 mb-4">
        <button type="button" className="satze-tool-btn-primary text-sm" onClick={playEntry}>▶ Ingresso</button>
        <button type="button" className="satze-tool-btn-primary text-sm" onClick={playDefeat} disabled={!defeatEffect}>▶ Sconfitta</button>
        <button type="button" className="satze-tool-btn-secondary text-sm" onClick={playSequence} disabled={!defeatEffect}>
          ▶ Sequenza (ingresso, poi sconfitta)
        </button>
        <button type="button" className="satze-tool-btn-secondary text-sm" onClick={reset}>Ricomponi</button>
        <span className="w-px h-6 bg-slate-700 mx-1" />
        <label className="flex items-center gap-2 text-xs text-slate-300">
          <input type="radio" checked={mode === 'anim'} onChange={reset} />
          Animazione
        </label>
        <label className="flex items-center gap-2 text-xs text-slate-300">
          <input type="radio" checked={mode === 'manual'} onChange={() => setMode('manual')} />
          Anteprima a quota fissa
        </label>
        <label className="text-xs text-slate-400 flex items-center gap-2 flex-1 min-w-[200px]">
          <input
            type="range"
            min={0}
            max={1}
            step={0.001}
            value={progress}
            disabled={mode !== 'manual'}
            onChange={(e) => setProgress(Number(e.target.value))}
            className="flex-1"
          />
          <span className="w-12 text-right text-slate-200 tabular-nums">{progress.toFixed(3)}</span>
        </label>
      </div>

      <div className="grid gap-4" style={{ gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr) 340px' }}>
        {/* ingresso */}
        <div className="flex flex-col gap-2 min-w-0">
          <button
            type="button"
            onClick={() => setEditing('entry')}
            className={`text-left satze-tool-panel px-4 py-3 ${editing === 'entry' ? 'ring-1 ring-slate-300/40' : ''}`}
          >
            <div className="text-[11px] uppercase tracking-wider text-slate-500">Ingresso in campo</div>
            <div className="text-slate-100 text-base">
              {entryFx ? entryFx.label : 'Da fare'}
              {!entryFx ? <span className="text-xs text-amber-300/90 ml-2">anteprima provvisoria: Materializzazione</span> : null}
            </div>
            <div className="text-xs text-slate-400">
              {entryFx ? entryFx.description : `${army} non ha ancora il suo ingresso.`}
              {!ARMY_SETS[army] ? ' (Nessuna carta giocabile: anteprima su una carta di un\'altra armata.)' : ''}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Stato: {status.entry}</div>
          </button>
          <Stage>
            {entryAgent ? (
              <ElementFx
                effect={entryEffect}
                active={mode === 'anim' && entryOn}
                progress={mode === 'manual' ? progress : null}
                params={entryParams}
                captureKey={`entry-${entryAgent.id}`}
                precapture
                pixelRatio={2}
                onStart={() => setStatus((s) => ({ ...s, entry: 'In corso…' }))}
                onComplete={() => {
                  setStatus((s) => ({ ...s, entry: 'Comparsa' }));
                  if (sequenceRef.current) {
                    sequenceRef.current = false;
                    setTimeout(() => pulse(setDefeatOn), 450);
                  }
                }}
              >
                <GameCard agent={entryAgent} suppressAnimations />
              </ElementFx>
            ) : null}
          </Stage>
        </div>

        {/* sconfitta inflitta */}
        <div className="flex flex-col gap-2 min-w-0">
          <div
            role="button"
            tabIndex={0}
            onClick={() => setEditing('defeat')}
            className={`satze-tool-panel px-4 py-3 cursor-pointer ${editing === 'defeat' ? 'ring-1 ring-slate-300/40' : ''}`}
          >
            <div className="text-[11px] uppercase tracking-wider text-slate-500">Sconfitta inflitta</div>
            <div className="text-slate-100 text-base">{defeatEffect ? defeatEffect.label : 'Da fare'}</div>
            <div className="text-xs text-slate-400 flex flex-wrap items-center gap-2 mt-1" onClick={(e) => e.stopPropagation()}>
              <span style={{ color: accent }}>{army}</span> batte
              <select
                className="satze-tool-input text-xs"
                value={opponent}
                onChange={(e) => {
                  setOpponent(e.target.value);
                  setOpponentCard(1);
                  setDefeatOn(false);
                }}
              >
                {PLAYABLE.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
              <select
                className="satze-tool-input text-xs max-w-[180px]"
                value={opponentCard}
                onChange={(e) => {
                  setOpponentCard(Number(e.target.value));
                  setDefeatOn(false);
                }}
              >
                {(ARMY_SETS[opponent] || []).map((c, i) => (
                  <option key={c.id} value={i}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Stato: {status.defeat}
              {defeatEffect?.usesOrigin ? ' · clic sulla carta: punto del colpo' : ''}
            </div>
          </div>
          <Stage>
            {loser && defeatEffect ? (
              <div onClick={onDefeatCardClick} style={{ cursor: defeatEffect.usesOrigin ? 'crosshair' : 'default' }}>
                <ElementFx
                  effect={defeatEffect}
                  active={mode === 'anim' && defeatOn}
                  progress={mode === 'manual' ? progress : null}
                  params={defeatParams}
                  captureKey={`defeat-${loser.id}`}
                  precapture
                  pixelRatio={2}
                  onStart={() => setStatus((s) => ({ ...s, defeat: 'In corso…' }))}
                  onComplete={() => setStatus((s) => ({ ...s, defeat: 'Battuta' }))}
                >
                  <GameCard agent={loser} suppressAnimations />
                </ElementFx>
              </div>
            ) : null}
          </Stage>
        </div>

        {/* parametri dell'animazione selezionata */}
        <div className="min-w-0">
          <div className="flex gap-2 mb-3">
            <button
              type="button"
              className={editing === 'entry' ? 'satze-tool-btn-primary text-xs' : 'satze-tool-btn-secondary text-xs'}
              onClick={() => setEditing('entry')}
            >
              Parametri ingresso
            </button>
            <button
              type="button"
              className={editing === 'defeat' ? 'satze-tool-btn-primary text-xs' : 'satze-tool-btn-secondary text-xs'}
              onClick={() => setEditing('defeat')}
              disabled={!defeatEffect}
            >
              Parametri sconfitta
            </button>
          </div>
          {editedEffect ? (
            <FxParamsPanel
              effect={editedEffect}
              params={paramsById[editedEffect.id]}
              setParams={(updater) => setParamsFor(editedEffect.id, updater)}
              onReplay={editing === 'entry' ? playEntry : playDefeat}
              title={editing === 'entry' ? (entryFx ? 'Preset ingresso' : 'Preset (provvisorio)') : 'Preset sconfitta'}
            />
          ) : null}
        </div>
      </div>
    </>
  );
}

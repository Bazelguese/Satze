// ============================================================
// Tavolo 2v2 Lab — layout delle quattro carte prima dei duelli
// Accesso: ?teamBoardLab=1  |  menu → STRUMENTI DEV → TAVOLO 2V2 LAB
// ============================================================
// Scena del duello a 1920×1080 con il tavolo a quattro carte sopra. Si sceglie una
// versione, si seleziona una carta (clic) e la si sposta trascinandola o con i controlli.
// Le versioni restano nel browser e il gioco le usa subito; «Usa in partita» sceglie quella
// mostrata nel 2v2.
// ============================================================

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ToolPageShell } from '../layout/ToolPageShell';
import { DuelLayoutLabStage } from '../duelLayoutLab/DuelLayoutLabStage';
import { TeamDuelBoard } from '../battle/TeamDuelBoard';
import { ARMY_SETS } from '../../data/cards';
import { ARMY_COLORS } from '../../data/armies';
import { ALL_BATTLEFIELDS } from '../../data/battlefields';
import {
  CARD_W,
  DEFAULT_TEAM_BOARD_LAYOUTS,
  SLOT_KEYS,
  SLOT_LABELS,
  deleteBoardLayout,
  duplicateBoardLayout,
  exportBoardLayouts,
  importBoardLayouts,
  loadBoardLayouts,
  readActiveBoardLayoutId,
  resetBoardLayout,
  saveBoardLayout,
  subscribeBoardLayouts,
  writeActiveBoardLayoutId,
} from '../../config/teamBoardLayouts';
import '../duelLayoutLab/duelLayoutLab.css';
import './teamBoardLab.css';

const STAGE_W = 1920;
const STAGE_H = 1080;

const SCENARIOS = [
  { id: 'openDeploy', label: 'Apri tu · schieramento', note: 'La tua carta non è ancora posata; il compagno propone la sua.' },
  { id: 'respDeploy', label: 'Rispondi · schieramento', note: 'Gli avversari hanno aperto su due Campi; tu e il compagno scegliete.' },
  { id: 'openPlan', label: 'Apri tu · piano', note: 'Tutte e quattro le carte schierate; la disposizione la sceglie la risposta.' },
  { id: 'respPlan', label: 'Rispondi · piano', note: 'Tutte e quattro le carte, con l’avversario di ogni fronte.' },
];

const ARMIES = ["Figli dell'Orizzonte", 'Kethran', 'Corte Rossa', 'Orathai'];

function pickCard(army, index) {
  const set = ARMY_SETS[army] || Object.values(ARMY_SETS)[0];
  const card = set[index % set.length];
  return { ...card, army };
}

function buildBoard(scenario) {
  const [human, mate, foe1, foe2] = ARMIES;
  const cards = { A1: pickCard(human, 3), A2: pickCard(mate, 5), B1: pickCard(foe1, 4), B2: pickCard(foe2, 6) };
  const names = { A1: 'Tu', A2: 'PNG Stratega', B1: 'PNG Calcolatore 1', B2: 'PNG Calcolatore 2' };
  const fields = { A1: 0, A2: 1, B1: 2, B2: 3 };
  // Per ogni scenario: chi ha la carta in campo, chi è una proposta, chi mostra il Campo.
  const plans = {
    openDeploy: { shown: ['A2'], proposal: ['A2'], field: ['A2'] },
    respDeploy: { shown: ['B1', 'B2', 'A2'], proposal: ['A2'], field: ['B1', 'B2'] },
    openPlan: { shown: ['A1', 'A2', 'B1', 'B2'], proposal: [], field: ['A1', 'A2'] },
    respPlan: { shown: ['A1', 'A2', 'B1', 'B2'], proposal: [], field: ['B1', 'B2'] },
  };
  const plan = plans[scenario];
  const entry = (seatId) => ({
    seatId,
    name: names[seatId],
    isHuman: seatId === 'A1',
    isMe: seatId === 'A1',
    card: plan.shown.includes(seatId) ? cards[seatId] : null,
    fieldIndex: plan.field.includes(seatId) ? fields[seatId] : null,
    locked: plan.shown.includes(seatId) && !plan.proposal.includes(seatId),
    proposal: plan.proposal.includes(seatId),
  });
  return {
    board: {
      openingTeam: scenario.startsWith('open') ? 'A' : 'B',
      myOpening: scenario.startsWith('open'),
      player: [entry('A1'), entry('A2')],
      enemy: [entry('B1'), entry('B2')],
    },
    opponentOf: scenario === 'respPlan'
      ? { A1: `contro ${foe1}`, A2: `contro ${foe2}`, B1: 'contro Tu', B2: `contro ${names.A2}` }
      : {},
  };
}

function ScaledStage({ children, onScale }) {
  const wrapRef = useRef(null);
  const [scale, setScale] = useState(0.5);
  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return undefined;
    const update = () => {
      const k = el.clientWidth / STAGE_W;
      setScale(k);
      onScale?.(k);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [onScale]);
  return (
    <div ref={wrapRef} className="tbl-stage" style={{ height: STAGE_H * scale }}>
      <div className="tbl-stage-inner" style={{ width: STAGE_W, height: STAGE_H, transform: `scale(${scale})` }}>
        {children}
      </div>
    </div>
  );
}

function NumberField({ label, value, step = 1, min, max, onChange, disabled = false }) {
  return (
    <label className="tbl-field">
      <span>{label}</span>
      <input
        type="number"
        value={Number.isFinite(value) ? value : ''}
        step={step}
        min={min}
        max={max}
        disabled={disabled}
        onChange={(e) => {
          const v = Number(e.target.value);
          if (Number.isFinite(v)) onChange(v);
        }}
      />
      {min != null && max != null ? (
        <input
          type="range"
          value={Number.isFinite(value) ? value : 0}
          step={step}
          min={min}
          max={max}
          disabled={disabled}
          onChange={(e) => onChange(Number(e.target.value))}
        />
      ) : null}
    </label>
  );
}

export function TeamBoardLabPage({ onClose }) {
  const [layouts, setLayouts] = useState(loadBoardLayouts);
  const [activeId, setActiveIdState] = useState(readActiveBoardLayoutId);
  const [editId, setEditId] = useState(readActiveBoardLayoutId);
  const [slotKey, setSlotKey] = useState('playerMate');
  const [scenario, setScenario] = useState('respPlan');
  const [pairIndex, setPairIndex] = useState(0);
  const [showHands, setShowHands] = useState(true);
  const [jsonText, setJsonText] = useState('');
  const [message, setMessage] = useState('');
  const scaleRef = useRef(0.5);

  useEffect(() => subscribeBoardLayouts(() => {
    setLayouts(loadBoardLayouts());
    setActiveIdState(readActiveBoardLayoutId());
  }), []);

  const layout = layouts[editId] || layouts[activeId];
  const isPairs = layout?.mode === 'pairs';
  const isDefault = Boolean(DEFAULT_TEAM_BOARD_LAYOUTS[editId]);
  const { board, opponentOf } = useMemo(() => buildBoard(scenario), [scenario]);

  const flash = (text) => {
    setMessage(text);
    window.setTimeout(() => setMessage(''), 2200);
  };

  const update = useCallback((mutator) => {
    setLayouts((prev) => {
      const current = prev[editId];
      if (!current) return prev;
      const next = JSON.parse(JSON.stringify(current));
      mutator(next);
      saveBoardLayout(editId, next);
      return { ...prev, [editId]: next };
    });
  }, [editId]);

  const setSlot = (key, patch) => update((l) => { l.slots[key] = { ...l.slots[key], ...patch }; });

  // Trascinamento delle carte (e dei tasti delle coppie) nella scena.
  const dragRef = useRef(null);
  const startDrag = useCallback((key, e) => {
    e.preventDefault();
    setSlotKey(key);
    const cfg = key === 'pairs' ? { x: layout.pairsX, y: layout.pairsY } : layout.slots[key];
    dragRef.current = { key, x0: e.clientX, y0: e.clientY, sx: cfg.x, sy: cfg.y };
    const onMove = (ev) => {
      const d = dragRef.current;
      if (!d) return;
      const k = scaleRef.current || 1;
      const nx = Math.round((d.sx + (ev.clientX - d.x0) / k) / 2) * 2;
      const ny = Math.round((d.sy + (ev.clientY - d.y0) / k) / 2) * 2;
      if (d.key === 'pairs') update((l) => { l.pairsX = nx; l.pairsY = ny; });
      else update((l) => { l.slots[d.key] = { ...l.slots[d.key], x: nx, y: ny }; });
    };
    const onUp = () => {
      dragRef.current = null;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }, [layout, update]);

  // Frecce: sposta la carta selezionata (Maiusc = 10 px).
  useEffect(() => {
    const onKey = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;
      const step = e.shiftKey ? 10 : 1;
      const delta = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
      if (!delta) return;
      e.preventDefault();
      if (slotKey === 'pairs') update((l) => { l.pairsX += delta[0]; l.pairsY += delta[1]; });
      else update((l) => { l.slots[slotKey].x += delta[0]; l.slots[slotKey].y += delta[1]; });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [slotKey, update]);

  const mirror = () => {
    if (slotKey === 'pairs') return;
    const target = { enemyMate: 'playerMate', enemyMain: 'playerMain', playerMain: 'enemyMain', playerMate: 'enemyMate' }[slotKey];
    const src = layout.slots[slotKey];
    setSlot(target, {
      ...src,
      x: Math.round(STAGE_W - src.x - CARD_W * src.s),
      r: -src.r,
      tagX: -(src.tagX || 0),
      tagAlign: src.tagAlign === 'left' ? 'right' : src.tagAlign === 'right' ? 'left' : 'center',
    });
    flash(`Copiata e specchiata su «${SLOT_LABELS[target]}».`);
  };

  if (!layout) return null;
  const cfg = slotKey === 'pairs' ? null : layout.slots[slotKey];
  const slotChoices = [...SLOT_KEYS, ...(isPairs ? ['pairs'] : [])];

  return (
    <ToolPageShell
      title="Tavolo 2v2 Lab"
      subtitle="Layout delle quattro carte del 2v2 prima dei duelli. Clicca una carta per selezionarla, trascinala o usa le frecce (Maiusc = 10 px). Le modifiche valgono subito in partita, in questo browser."
      onClose={onClose}
      closeLabel="← Gioco"
    >
      <div className="tbl-layout">
        <div className="tbl-main">
          <div className="tbl-chips">
            {SCENARIOS.map((s) => (
              <button key={s.id} type="button" className={`tbl-chip${scenario === s.id ? ' on' : ''}`} title={s.note} onClick={() => setScenario(s.id)}>
                {s.label}
              </button>
            ))}
            <label className="tbl-check">
              <input type="checkbox" checked={showHands} onChange={(e) => setShowHands(e.target.checked)} /> Mani
            </label>
          </div>
          <ScaledStage onScale={(k) => { scaleRef.current = k; }}>
            <DuelLayoutLabStage sty="sty-a" dep="dep-2" mov="mov-1" altArt="off" phase="selectAgent" showAgents={false} showHands={showHands}>
              <TeamDuelBoard
                board={board}
                layout={layout}
                layoutId={editId}
                humanCard={null}
                battlefields={ALL_BATTLEFIELDS}
                opponentOf={opponentOf}
                pairIndex={pairIndex}
                onPairIndex={setPairIndex}
                cardLayout="reworkP4"
                playerColor={ARMY_COLORS[ARMIES[0]]?.accent || '#a78bfa'}
                enemyColor={ARMY_COLORS[ARMIES[2]]?.accent || '#f87171'}
                editable
                selectedSlot={slotKey}
                onSlotPointerDown={startDrag}
                onPairsPointerDown={(e) => startDrag('pairs', e)}
              />
            </DuelLayoutLabStage>
          </ScaledStage>
          <p className="tbl-note">{SCENARIOS.find((s) => s.id === scenario)?.note}</p>
        </div>

        <aside className="tbl-side">
          <section className="tbl-box">
            <h3>Versioni</h3>
            <div className="tbl-variants">
              {Object.entries(layouts).map(([id, l]) => (
                <button key={id} type="button" className={`tbl-variant${editId === id ? ' on' : ''}`} onClick={() => setEditId(id)}>
                  <span>{l.name}</span>
                  {activeId === id ? <b title="Usata in partita">★ in partita</b> : null}
                  {l.custom ? <i>tua</i> : null}
                </button>
              ))}
            </div>
            <label className="tbl-field">
              <span>Nome</span>
              <input type="text" value={layout.name} onChange={(e) => update((l) => { l.name = e.target.value; })} />
            </label>
            <label className="tbl-field">
              <span>Modo</span>
              <select value={layout.mode} onChange={(e) => update((l) => {
                l.mode = e.target.value;
                if (l.mode === 'pairs') { l.pairsX = l.pairsX ?? 960; l.pairsY = l.pairsY ?? 790; }
              })}>
                <option value="all">Quattro carte insieme</option>
                <option value="pairs">Una coppia alla volta</option>
              </select>
            </label>
            <div className="tbl-row">
              <button type="button" className="tbl-btn primary" disabled={activeId === editId} onClick={() => { writeActiveBoardLayoutId(editId); flash('Questa versione è ora quella usata in partita.'); }}>Usa in partita</button>
              <button type="button" className="tbl-btn" onClick={() => { const id = duplicateBoardLayout(editId); setEditId(id); flash('Creata una copia.'); }}>Duplica</button>
            </div>
            <div className="tbl-row">
              {isDefault ? (
                <button type="button" className="tbl-btn" onClick={() => { resetBoardLayout(editId); flash('Ripristinati i valori predefiniti.'); }}>Ripristina</button>
              ) : (
                <button type="button" className="tbl-btn danger" onClick={() => { const id = editId; setEditId(activeId === id ? 'ventaglio' : activeId); deleteBoardLayout(id); flash('Versione eliminata.'); }}>Elimina</button>
              )}
            </div>
          </section>

          <section className="tbl-box">
            <h3>Carta selezionata</h3>
            <div className="tbl-slots">
              {slotChoices.map((k) => (
                <button key={k} type="button" className={`tbl-chip${slotKey === k ? ' on' : ''}`} onClick={() => setSlotKey(k)}>
                  {k === 'pairs' ? 'Tasti coppie' : SLOT_LABELS[k]}
                </button>
              ))}
            </div>
            {isPairs && slotKey !== 'pairs' ? (
              <p className="tbl-note">Una coppia alla volta: la coppia 1 usa «principale» e «Tu», la coppia 2 «secondo avversario» e «Compagno». Coppia mostrata:{' '}
                <button type="button" className="tbl-link" onClick={() => setPairIndex(pairIndex ? 0 : 1)}>{pairIndex + 1}</button>
              </p>
            ) : null}
            {slotKey === 'pairs' ? (
              <>
                <NumberField label="X (centro)" value={layout.pairsX} min={0} max={1920} onChange={(v) => update((l) => { l.pairsX = v; })} />
                <NumberField label="Y" value={layout.pairsY} min={0} max={1080} onChange={(v) => update((l) => { l.pairsY = v; })} />
              </>
            ) : cfg ? (
              <>
                <NumberField label="X" value={cfg.x} min={0} max={1920} onChange={(v) => setSlot(slotKey, { x: v })} />
                <NumberField label="Y" value={cfg.y} min={0} max={1080} onChange={(v) => setSlot(slotKey, { y: v })} />
                <NumberField label="Scala" value={cfg.s} step={0.01} min={0.3} max={1.3} onChange={(v) => setSlot(slotKey, { s: v })} />
                <NumberField label="Rotazione °" value={cfg.r} step={0.5} min={-30} max={30} onChange={(v) => setSlot(slotKey, { r: v })} />
                <NumberField label="Livello" value={cfg.z} min={0} max={9} onChange={(v) => setSlot(slotKey, { z: v })} />
                <NumberField label="Luminosità" value={cfg.dim} step={0.02} min={0.2} max={1} onChange={(v) => setSlot(slotKey, { dim: v })} />
                <label className="tbl-check">
                  <input type="checkbox" checked={Boolean(cfg.front)} onChange={(e) => setSlot(slotKey, { front: e.target.checked })} />
                  In primo piano al passaggio del mouse
                </label>
                <h4>Etichetta</h4>
                <NumberField label="Etichetta X" value={cfg.tagX || 0} min={-300} max={300} onChange={(v) => setSlot(slotKey, { tagX: v })} />
                <label className="tbl-check">
                  <input type="checkbox" checked={cfg.tagY == null} onChange={(e) => setSlot(slotKey, { tagY: e.target.checked ? null : -26 })} />
                  Sotto la carta
                </label>
                <NumberField label="Etichetta Y" value={cfg.tagY ?? 0} min={-120} max={420} disabled={cfg.tagY == null} onChange={(v) => setSlot(slotKey, { tagY: v })} />
                <label className="tbl-field">
                  <span>Allineamento</span>
                  <select value={cfg.tagAlign || 'center'} onChange={(e) => setSlot(slotKey, { tagAlign: e.target.value })}>
                    <option value="left">Sinistra</option>
                    <option value="center">Centro</option>
                    <option value="right">Destra</option>
                  </select>
                </label>
                <button type="button" className="tbl-btn" onClick={mirror}>Specchia sull’altro lato</button>
              </>
            ) : null}
          </section>

          <section className="tbl-box">
            <h3>Esporta / importa</h3>
            <p className="tbl-note">Le versioni restano in questo browser. Per renderle predefinite nel gioco esportale e passami il JSON.</p>
            <div className="tbl-row">
              <button type="button" className="tbl-btn" onClick={async () => {
                const json = exportBoardLayouts();
                setJsonText(json);
                try { await navigator.clipboard.writeText(json); flash('JSON copiato negli appunti.'); } catch { flash('JSON pronto qui sotto.'); }
              }}>Esporta JSON</button>
              <button type="button" className="tbl-btn" disabled={!jsonText.trim()} onClick={() => {
                try { const ids = importBoardLayouts(jsonText); flash(`Importate ${ids.length} versioni.`); } catch (err) { flash(`Errore: ${err.message}`); }
              }}>Importa</button>
            </div>
            <textarea className="tbl-json" value={jsonText} placeholder="Incolla qui un JSON da importare" onChange={(e) => setJsonText(e.target.value)} />
          </section>
          {message ? <div className="tbl-toast">{message}</div> : null}
        </aside>
      </div>
    </ToolPageShell>
  );
}

export default TeamBoardLabPage;

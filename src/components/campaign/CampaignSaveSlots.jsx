import { createFirstActRun } from '../../campaign/state/firstActState.js';
// Scelta slot salvataggio campagna (3 slot indipendenti).

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { MENU_ACCENTS } from '../../theme/hudOratorioPalette';
import {
  CAMPAIGN_SLOT_COUNT,
  getCampaignRunSummary,
  clearCampaignRun,
} from '../../campaign/state/persistence.js';
import { saveCampaignRun } from '../../campaign/state/persistence.js';
import { CampaignEventEditor } from './CampaignEventEditor.jsx';
import { CampaignScene, CampaignMotionControl } from './CampaignScene.jsx';
import { CampaignBackdrop, CampaignSigil, heroArt } from './CampaignScenery.jsx';
import { playUiClick, playUiConfirm } from '../../audio/gameSounds.js';

import '../../styles/campaign/colors_and_type.css';
import '../../styles/campaign/atto1-components.css';

/**
 * @param {{
 *   onSlotChosen: (slotIndex: number) => void,
 *   onBack: () => void,
 * }} props
 */
export function CampaignSaveSlots({ onSlotChosen, onBack }) {
  const [summaries, setSummaries] = useState(() =>
    Array.from({ length: CAMPAIGN_SLOT_COUNT }, (_, i) => getCampaignRunSummary(i))
  );
  const [pendingDelete, setPendingDelete] = useState(null);
  // Slot su cui è aperta la scelta dell'esercito iniziale (nuova campagna)
  const [armySlot, setArmySlot] = useState(null);

  const [editor, setEditor] = useState(false);
  const [error, setError] = useState('');

  const refresh = useCallback(() => {
    setSummaries(Array.from({ length: CAMPAIGN_SLOT_COUNT }, (_, i) => getCampaignRunSummary(i)));
  }, []);

  if (editor) return <CampaignEventEditor onBack={() => setEditor(false)} />;
  if (armySlot != null) return <CampaignScene>
    <CampaignBackdrop/>
    <div className="cs-content">
      <header className="cs-hud"><div className="cs-brand"><CampaignSigil kind="sun"/><div><span className="cs-kicker">SATZE · NUOVA CAMPAGNA</span><strong>Il cammino del Nascente</strong></div></div><nav className="cs-actions"><CampaignMotionControl/><button onClick={() => { setArmySlot(null); setError(''); }}>Torna agli slot</button></nav></header>
      <div className="cs-origin">
        <div className="cs-origin-portrait"><img src={heroArt({league: 2})} alt="Il Nascente, arciere dell’Orizzonte"/><div>2 POT · 2 DAN · LEGA 2</div></div>
        <div className="cs-origin-copy"><p className="cs-kicker">ATTO I · UN’IDENTITÀ DA FORGIARE</p><h1>Il Nascente</h1><p>Un tempo Concordia governava tutto il mondo. Poi i colori della Nebula illuminarono una parte del cielo notturno: chi ne fu colpito ricevette la Domanda. Ora i Figli cercano una risposta negli altri, mentre le campane di Concordia chiamano i suoi soldati alla difesa. Il Nascente affronta il primo varco da solo. Gli agenti ottenuti dagli avversari formeranno il tuo esercito. La forma che assumerai dipende dalle tue scelte.</p>
          <p>Il primo Potere prenderà forma attraverso le Domande lungo il cammino.</p>
          {error && <p role="alert" className="cs-error">{error}</p>}
          <button className="cs-primary" onClick={() => {
            try {
              const run = createFirstActRun();
              if (!saveCampaignRun(run, armySlot)) throw new Error('Salvataggio non riuscito.');
              playUiConfirm();
              onSlotChosen(armySlot);
            } catch (e) { setError(e.message); }
          }}>Inizia il cammino</button><small className="cs-footnote">Il Nascente è sempre nella mano iniziale. Ogni incontro apre un passo del percorso.</small>
        </div>
      </div>
    </div>
  </CampaignScene>;

  return (
    <SlotsScreen
      summaries={summaries}
      pendingDelete={pendingDelete}
      onAskDelete={setPendingDelete}
      onConfirmDelete={() => {
        clearCampaignRun(pendingDelete);
        setPendingDelete(null);
        refresh();
      }}
      onCancelDelete={() => setPendingDelete(null)}
      onNew={(idx) => setArmySlot(idx)}
      onContinue={(idx) => onSlotChosen(idx)}
      onEditor={() => setEditor(true)}
      onBack={onBack}
    />
  );
}

const ACCENT = MENU_ACCENTS.magenta;

function fmtTime(ts) {
  if (ts == null || !Number.isFinite(ts)) return null;
  try {
    return new Date(ts).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return null;
  }
}

/** Testi di uno slot: stato, riga di dettaglio, esito, azione principale. */
function describeSlot(sum) {
  if (sum.corrupt) return { kind: 'corrupt', title: 'DATI ROVINATI', detail: 'Il salvataggio non si legge. Puoi solo eliminarlo.' };
  if (sum.empty) {
    return {
      kind: 'empty',
      title: 'VUOTO',
      detail: sum.legacy ? 'Salvataggio del vecchio modello: una nuova campagna lo sostituisce.' : 'Nessuna campagna in questo slot.',
      action: 'NUOVA CAMPAGNA',
    };
  }
  let title;
  let detail;
  if (sum.firstAct) {
    title = 'ATTO I';
    detail = `${sum.completed ?? 0} tappe completate`;
  } else if (sum.controlled) {
    title = `ATTO ${sum.actNumber} DI 3`;
    detail = `Incontro ${sum.stageNumber} di 6`;
  } else {
    title = `GIORNO ${sum.day} DI ${sum.daysLimit}`;
    detail = '';
  }
  detail = [detail, `${sum.missionsCompleted} missioni superate`].filter(Boolean).join(' · ');
  const outcome = sum.outcome == null ? null
    : sum.outcome === 'won'
      ? { won: true, text: sum.controlled ? 'CAMPAGNA COMPLETATA' : 'ATTO I COMPLETATO' }
      : { won: false, text: 'TEMPO SCADUTO' };
  return { kind: 'run', title, detail, outcome, saved: fmtTime(sum.savedAt), action: 'CONTINUA' };
}

function SlotsScreen({ summaries, pendingDelete, onAskDelete, onConfirmDelete, onCancelDelete, onNew, onContinue, onEditor, onBack }) {
  const [active, setActive] = useState(() => Math.max(0, summaries.findIndex((s) => !s.empty)));
  const slots = summaries.map(describeSlot);
  const cur = slots[active];

  const primary = (i) => {
    const d = slots[i];
    if (d.kind === 'corrupt') return;
    playUiConfirm();
    if (d.kind === 'empty') onNew(i);
    else onContinue(i);
  };
  const askDelete = (i) => {
    if (slots[i].kind === 'empty') return;
    playUiClick();
    onAskDelete(i);
  };

  const keyRef = useRef({});
  keyRef.current = { active, primary, askDelete, onBack, pendingDelete, n: slots.length };
  useEffect(() => {
    const onKey = (e) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      const k = keyRef.current;
      if (k.pendingDelete != null) return; // la conferma ha i suoi tasti
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (key === 'Escape') { e.preventDefault(); playUiClick(); k.onBack(); return; }
      if (key === 'ArrowUp' || key === 'ArrowDown') {
        e.preventDefault();
        playUiClick();
        setActive((a) => (a + (key === 'ArrowUp' ? -1 : 1) + k.n) % k.n);
        return;
      }
      if (key === 'Enter') { e.preventDefault(); k.primary(k.active); return; }
      if (key === 'x' || key === 'Delete' || key === 'Backspace') { e.preventDefault(); k.askDelete(k.active); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="csl" style={{ '--accent': ACCENT }}>
      <div className="csl-bg" aria-hidden="true">
        <div className="csl-bg-slab" />
        <div className="csl-bg-edge" />
        <div className="csl-bg-halftone" />
        <div className="csl-bg-stripes" />
      </div>
      <div className="csl-watermark" aria-hidden="true">STORIA</div>

      <button type="button" className="csl-back" onClick={() => { playUiClick(); onBack(); }}>
        <span className="key">ESC</span><span className="lbl">MENU</span>
      </button>

      <div className="csl-title">
        <div className="csl-eyebrow"><span>STORIA · SALVATAGGI</span></div>
        <h1>CAMPAGNA</h1>
        <p>Tre slot indipendenti. Riprendi un cammino o iniziane uno nuovo.</p>
      </div>

      <div className="csl-slots" role="list">
        {slots.map((d, i) => {
          const on = i === active;
          return (
            <div
              key={i}
              role="listitem"
              className={`csl-slot csl-slot--${d.kind}${on ? ' on' : ''}`}
              style={{ '--zz': `${[0, 46, 12][i % 3]}px` }}
              onMouseMove={(e) => { if ((e.movementX || e.movementY) && !on) setActive(i); }}
            >
              <span className="csl-slot-shadow" aria-hidden="true" />
              <div className="csl-slot-plate">
                <span className="csl-cursor" aria-hidden="true" />
                <div className="csl-num"><small>SLOT</small><b>{String(i + 1).padStart(2, '0')}</b></div>
                <div className="csl-info">
                  <div className="csl-state">
                    <span className="t">{d.title}</span>
                    {d.outcome && <span className={`csl-outcome${d.outcome.won ? ' won' : ''}`}>{d.outcome.text}</span>}
                  </div>
                  <div className="csl-detail">{d.detail}</div>
                  {d.saved && <div className="csl-saved">ULTIMO SALVATAGGIO · {d.saved}</div>}
                </div>
                <div className="csl-actions">
                  {d.action && (
                    <button type="button" className="csl-btn csl-btn--main" onClick={() => { setActive(i); primary(i); }}>
                      <span>{d.action}</span>
                    </button>
                  )}
                  {d.kind !== 'empty' && (
                    <button type="button" className="csl-btn csl-btn--del" onClick={() => { setActive(i); askDelete(i); }}>
                      <span>ELIMINA</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <footer className="csl-help">
        <div className="csl-help-text" key={active}>
          <span className="csl-help-label">SLOT {active + 1}</span>
          <span className="csl-help-hint">{cur.kind === 'empty' ? 'Inizia una nuova campagna in questo slot.' : cur.kind === 'corrupt' ? 'Dati non leggibili: elimina lo slot per riusarlo.' : 'Riprendi da dove avevi lasciato.'}</span>
        </div>
        <div className="csl-help-keys">
          <span><kbd>↑</kbd><kbd>↓</kbd>SLOT</span>
          {cur.action && <span><kbd>↵</kbd>{cur.kind === 'empty' ? 'NUOVA' : 'CONTINUA'}</span>}
          {cur.kind !== 'empty' && <span><kbd>X</kbd>ELIMINA</span>}
          <span><kbd>ESC</kbd>MENU</span>
        </div>
        <button type="button" className="csl-editor" onClick={onEditor}>EDITOR EVENTI</button>
      </footer>

      {pendingDelete != null && (
        <DeleteConfirm slot={pendingDelete} onConfirm={onConfirmDelete} onCancel={onCancelDelete} />
      )}

      <SlotsStyles />
    </div>
  );
}

/** Conferma di eliminazione: ANNULLA è la scelta di partenza. */
function DeleteConfirm({ slot, onConfirm, onCancel }) {
  const [pick, setPick] = useState(0); // 0 annulla, 1 elimina
  const ref = useRef({});
  ref.current = { pick, onConfirm, onCancel };
  useEffect(() => {
    const onKey = (e) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      const k = ref.current;
      if (e.key === 'Escape') { e.preventDefault(); playUiClick(); k.onCancel(); return; }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); playUiClick(); setPick((p) => 1 - p); return; }
      if (e.key === 'Enter') { e.preventDefault(); playUiClick(); if (k.pick === 1) k.onConfirm(); else k.onCancel(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  return (
    <div className="csl-modal" onClick={onCancel}>
      <div className="csl-confirm" role="alertdialog" aria-modal="true" aria-label={`Eliminare lo slot ${slot + 1}?`} onClick={(e) => e.stopPropagation()}>
        <span className="csl-confirm-eye">ATTENZIONE</span>
        <h2>ELIMINARE LO SLOT {slot + 1}?</h2>
        <p>Il salvataggio verrà cancellato per sempre.</p>
        <div className="csl-confirm-btns">
          <button type="button" className={`csl-btn${pick === 0 ? ' csl-btn--main' : ''}`} onMouseEnter={() => setPick(0)} onClick={onCancel}><span>ANNULLA</span></button>
          <button type="button" className={`csl-btn csl-btn--danger${pick === 1 ? ' on' : ''}`} onMouseEnter={() => setPick(1)} onClick={onConfirm}><span>ELIMINA</span></button>
        </div>
      </div>
    </div>
  );
}

function SlotsStyles() {
  return (
    <style>{`
      .csl {
        --ink: #f5f3eb; --void: #050507; --plate: #111116; --dim: rgba(245,243,235,0.6); --danger: #ef4444;
        position: absolute; inset: 0; overflow: hidden; isolation: isolate; z-index: 2;
        background: var(--void); color: var(--ink); font-family: 'Chakra Petch', sans-serif;
      }
      .csl * { box-sizing: border-box; }
      .csl kbd {
        display: inline-grid; place-items: center; min-width: 24px; height: 22px; padding: 0 5px;
        background: var(--void); color: var(--ink); border: 0;
        font-family: 'Chakra Petch', sans-serif; font-weight: 700; font-size: 12px;
        clip-path: polygon(3px 0, 100% 0, calc(100% - 3px) 100%, 0 100%);
      }

      .csl-bg { position: absolute; inset: 0; z-index: 0; pointer-events: none; }
      .csl-bg-slab {
        position: absolute; top: -20%; bottom: -20%; left: -10%; width: 40%;
        background: linear-gradient(170deg, color-mix(in srgb, var(--accent) 85%, #000) 0%, color-mix(in srgb, var(--accent) 32%, #000) 100%);
        transform: skewX(-13deg);
      }
      .csl-bg-edge { position: absolute; top: -20%; bottom: -20%; left: 29.4%; width: 14px; background: var(--ink); transform: skewX(-13deg); }
      .csl-bg-halftone {
        position: absolute; inset: 0; opacity: 0.4;
        background-image: radial-gradient(circle, var(--void) 1.5px, transparent 2px); background-size: 11px 11px;
        -webkit-mask-image: linear-gradient(100deg, #000 0%, transparent 30%); mask-image: linear-gradient(100deg, #000 0%, transparent 30%);
      }
      .csl-bg-stripes { position: absolute; inset: 0; opacity: 0.05; background-image: repeating-linear-gradient(-77deg, #fff 0 2px, transparent 2px 46px); }
      .csl-watermark {
        position: absolute; right: -30px; bottom: -60px; z-index: 1;
        font-weight: 700; font-style: italic; font-size: 300px; line-height: 0.8; letter-spacing: -0.04em;
        color: transparent; -webkit-text-stroke: 2px color-mix(in srgb, var(--accent) 26%, transparent);
        transform: rotate(-7deg); pointer-events: none; user-select: none; white-space: nowrap;
      }

      .csl-back {
        position: absolute; top: 26px; left: 40px; z-index: 20; display: inline-flex; align-items: center; gap: 12px;
        border: 0; cursor: pointer; background: var(--void); color: var(--ink);
        padding: 10px 26px 10px 14px; transform: skewX(-14deg) rotate(-2deg); box-shadow: 5px 5px 0 var(--ink);
        transition: transform .15s, box-shadow .15s;
      }
      .csl-back > * { transform: skewX(14deg); }
      .csl-back:hover, .csl-back:focus-visible { transform: skewX(-14deg) rotate(-2deg) translate(-3px,-3px); box-shadow: 9px 9px 0 var(--ink); }
      .csl-back .key { background: var(--ink); color: var(--void); font-weight: 700; font-size: 12px; padding: 3px 7px; }
      .csl-back .lbl { font-weight: 700; font-style: italic; font-size: 22px; letter-spacing: 0.08em; }

      .csl-title { position: absolute; top: 120px; left: 70px; z-index: 12; width: 520px; transform: rotate(-5deg); transform-origin: left top; }
      .csl-eyebrow span {
        display: inline-block; background: var(--void); color: var(--ink);
        font-weight: 700; font-size: 15px; letter-spacing: 0.3em; padding: 3px 14px; transform: skewX(-14deg);
      }
      .csl-title h1 {
        margin: 0; font-weight: 700; font-style: italic; font-size: 104px; line-height: 0.9; letter-spacing: -0.02em;
        color: var(--ink); text-shadow: 7px 7px 0 var(--void);
      }
      .csl-title p {
        margin: 18px 0 0; max-width: 440px; font-weight: 600; font-size: 19px; line-height: 1.35;
        color: var(--ink); text-shadow: 2px 2px 0 var(--void);
      }

      .csl-slots { position: absolute; top: 140px; left: 690px; right: 90px; z-index: 12; display: flex; flex-direction: column; gap: 30px; }
      .csl-slot { position: relative; height: 210px; transform: translateX(var(--zz)); transition: transform .22s cubic-bezier(.3,1.5,.5,1); }
      .csl-slot-shadow, .csl-slot-plate { position: absolute; inset: 0; clip-path: polygon(26px 0, 100% 0, calc(100% - 26px) 100%, 0 100%); }
      .csl-slot-shadow { background: var(--accent); opacity: 0; transition: transform .2s, opacity .15s; }
      .csl-slot-plate {
        display: grid; grid-template-columns: 170px 1fr auto; align-items: center; gap: 28px; padding: 0 60px 0 44px;
        background: var(--plate); color: var(--ink); transition: background .15s, color .15s;
      }
      .csl-slot-plate::before { content: ''; position: absolute; left: 20px; top: 0; bottom: 0; width: 8px; background: var(--accent); transform: skewX(-12deg); }
      .csl-slot--empty .csl-slot-plate::before { background: rgba(245,243,235,0.25); }
      .csl-slot--corrupt .csl-slot-plate::before { background: var(--danger); }
      .csl-cursor {
        position: absolute; left: -50px; top: 50%; width: 40px; height: 46px; margin-top: -23px;
        background: var(--ink); clip-path: polygon(0 0, 100% 50%, 0 100%, 30% 50%);
        filter: drop-shadow(3px 3px 0 var(--void)); opacity: 0; transition: opacity .15s;
      }
      .csl-slot.on { transform: translateX(calc(var(--zz) - 30px)) rotate(-1.5deg) scale(1.03); z-index: 2; }
      .csl-slot.on .csl-slot-shadow { opacity: 1; transform: translate(14px, 12px); }
      .csl-slot.on .csl-slot-plate { background: var(--ink); color: var(--void); }
      .csl-slot.on .csl-cursor { opacity: 1; animation: csl-cursor .9s ease-in-out infinite; }
      @keyframes csl-cursor { 50% { transform: translateX(8px); } }

      .csl-num { display: flex; flex-direction: column; line-height: 0.85; }
      .csl-num small { font-family: 'Share Tech Mono', monospace; font-size: 14px; letter-spacing: 0.3em; color: var(--accent); margin-bottom: 6px; }
      .csl-num b { font-weight: 700; font-style: italic; font-size: 120px; letter-spacing: -0.04em; color: transparent; -webkit-text-stroke: 3px rgba(245,243,235,0.55); }
      .csl-slot.on .csl-num b { color: var(--accent); -webkit-text-stroke: 0; text-shadow: 5px 5px 0 var(--void); }
      .csl-slot.on .csl-num small { color: var(--void); }

      .csl-info { min-width: 0; display: flex; flex-direction: column; gap: 8px; }
      .csl-state { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
      .csl-state .t { font-weight: 700; font-style: italic; font-size: 52px; line-height: 1; letter-spacing: -0.01em; }
      .csl-slot--empty .csl-state .t { color: var(--dim); }
      .csl-slot--empty.on .csl-state .t { color: rgba(5,5,7,0.55); }
      .csl-slot--corrupt .csl-state .t { color: var(--danger); }
      .csl-outcome {
        font-weight: 700; font-size: 14px; letter-spacing: 0.18em; padding: 3px 12px; transform: skewX(-14deg);
        background: var(--danger); color: var(--void);
      }
      .csl-outcome.won { background: #4ade80; }
      .csl-detail { font-weight: 600; font-size: 21px; }
      .csl-saved { font-family: 'Share Tech Mono', monospace; font-size: 13px; letter-spacing: 0.14em; opacity: 0.7; }

      .csl-actions { display: flex; flex-direction: column; align-items: stretch; gap: 10px; }
      .csl-btn {
        border: 0; cursor: pointer; height: 54px; padding: 0 28px;
        background: var(--void); color: var(--ink); font: 700 18px/1 'Chakra Petch', sans-serif; letter-spacing: 0.1em;
        transform: skewX(-14deg); box-shadow: inset 0 0 0 2px var(--ink);
        transition: background .15s, color .15s, box-shadow .15s, transform .15s;
      }
      .csl-btn > span { display: inline-block; transform: skewX(14deg); white-space: nowrap; }
      .csl-btn:hover, .csl-btn:focus-visible { background: var(--ink); color: var(--void); }
      .csl-slot.on .csl-btn:hover, .csl-slot.on .csl-btn:focus-visible { background: var(--void); color: var(--ink); }
      .csl-btn--main { background: var(--accent); color: var(--void); box-shadow: 6px 6px 0 var(--ink); font-style: italic; font-size: 26px; height: 64px; }
      .csl-slot.on .csl-btn--main { box-shadow: 6px 6px 0 var(--void); }
      .csl-btn--main:hover, .csl-btn--main:focus-visible { background: var(--accent) !important; color: var(--void) !important; transform: skewX(-14deg) translate(-3px,-3px); }
      .csl-btn--del { height: 40px; font-size: 14px; color: var(--danger); box-shadow: inset 0 0 0 2px var(--danger); }
      .csl-slot.on .csl-btn--del { background: transparent; }
      .csl-btn--del:hover, .csl-btn--del:focus-visible { background: var(--danger) !important; color: var(--void) !important; }

      .csl-help {
        position: absolute; left: 0; right: 0; bottom: 0; height: 96px; z-index: 14;
        display: flex; align-items: center; gap: 28px; padding: 0 60px 0 70px;
        background: var(--ink); color: var(--void); clip-path: polygon(0 26px, 100% 0, 100% 100%, 0 100%);
      }
      .csl-help-text { flex: 1; min-width: 0; display: flex; align-items: center; gap: 18px; padding-top: 18px; animation: csl-fade .25s ease both; }
      @keyframes csl-fade { from { opacity: 0; transform: translateY(8px); } }
      .csl-help-label {
        flex: none; background: var(--void); color: var(--ink); font-weight: 700; font-size: 15px; letter-spacing: 0.14em;
        padding: 4px 14px; transform: skewX(-14deg); box-shadow: 4px 4px 0 var(--accent);
      }
      .csl-help-hint { font-weight: 600; font-size: 19px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .csl-help-keys { display: flex; gap: 20px; padding-top: 18px; font-weight: 700; font-style: italic; font-size: 15px; letter-spacing: 0.1em; }
      .csl-help-keys span { display: inline-flex; align-items: center; gap: 4px; }
      .csl-help-keys kbd { margin-right: 2px; }
      .csl-editor {
        margin-top: 18px; border: 0; cursor: pointer; background: transparent; color: rgba(5,5,7,0.55);
        font: 700 12px/1 'Share Tech Mono', monospace; letter-spacing: 0.16em; text-decoration: underline;
      }
      .csl-editor:hover, .csl-editor:focus-visible { color: var(--void); }

      .csl-modal {
        position: absolute; inset: 0; z-index: 50; display: grid; place-items: center;
        background: radial-gradient(circle, rgba(239,68,68,0.25) 1.4px, transparent 1.8px) 0 0 / 11px 11px, rgba(5,5,7,0.84);
        animation: csl-fade .2s ease both;
      }
      .csl-confirm {
        position: relative; width: 760px; padding: 40px 56px 36px; background: var(--ink); color: var(--void);
        transform: rotate(-2deg); box-shadow: 14px 14px 0 var(--danger);
        clip-path: polygon(0 0, 100% 0, calc(100% - 26px) 100%, 0 100%);
        animation: csl-pop .3s cubic-bezier(.2,1.3,.4,1) both;
      }
      @keyframes csl-pop { from { opacity: 0; transform: rotate(-2deg) scale(.9); } }
      .csl-confirm-eye { display: inline-block; background: var(--danger); color: var(--void); font-weight: 700; font-size: 14px; letter-spacing: 0.3em; padding: 3px 14px; transform: skewX(-14deg); }
      .csl-confirm h2 { margin: 12px 0 6px; font-weight: 700; font-style: italic; font-size: 60px; line-height: 1; letter-spacing: -0.01em; }
      .csl-confirm p { margin: 0 0 26px; font-weight: 600; font-size: 20px; }
      .csl-confirm-btns { display: flex; justify-content: flex-end; gap: 16px; }
      .csl-confirm .csl-btn { box-shadow: inset 0 0 0 2px var(--void); }
      .csl-confirm .csl-btn--main { box-shadow: 6px 6px 0 var(--void); font-size: 24px; height: 58px; }
      .csl-btn--danger { color: var(--danger); box-shadow: inset 0 0 0 2px var(--danger) !important; height: 58px; font-size: 22px; }
      .csl-btn--danger.on, .csl-btn--danger:hover { background: var(--danger) !important; color: var(--void) !important; box-shadow: 6px 6px 0 var(--void) !important; }

      @media (prefers-reduced-motion: reduce) {
        .csl-slot.on .csl-cursor, .csl-help-text, .csl-modal, .csl-confirm { animation: none; }
      }
    `}</style>
  );
}

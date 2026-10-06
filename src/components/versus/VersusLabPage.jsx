// ============================================
// VS Lab — prova della schermata VS d'ingresso al duello
// Accesso: ?vsLab=1  |  menu → STRUMENTI DEV → VS LAB
// ============================================

import React, { useEffect, useMemo, useState } from 'react';
import { GameViewport } from '../GameViewport';
import { ARMY_DECKS } from '../../data/cards.js';
import { DIFFICULTY_NAMES } from '../../utils/aiConstants.js';
import { loadCustomDecks } from '../../utils/deckManager.js';
import { EMINENCE_FORMAT } from '../../game/eminence/eminenceConstants.js';
import { DECK_COVER_STYLES, getDeckCoverStyle, setDeckCoverStyle } from '../../utils/deckCoverPreference.js';
import { DuelVersusScreen, VERSUS_FX, VERSUS_LAYOUTS, buildVersusIdentity } from './DuelVersusScreen.jsx';

/** Durata simulata del caricamento duello (≈ preload + warm-up reali). */
const FAKE_LOADING_MS = 4800;
const MIXED_SAMPLE_KEY = '__mixed__';
const ARMY_NAMES = Object.keys(ARMY_DECKS);
const DIFFICULTIES = ['easy', 'medium', 'hard'];

/** Mazzo misto d'esempio: 5 carte del primo mazzo di `army` + 5 della armata successiva. */
function buildMixedSample(army) {
  const other = ARMY_NAMES[(ARMY_NAMES.indexOf(army) + 1) % ARMY_NAMES.length];
  const firstCards = (a) => Object.values(ARMY_DECKS[a] || {})[0]?.cards || [];
  return {
    army,
    deckKey: null,
    cardIds: [...firstCards(army).slice(0, 5), ...firstCards(other).slice(0, 5)],
    name: 'Esercito misto (esempio)',
  };
}

function resolveLabDeck({ army, deckKey }) {
  if (deckKey === MIXED_SAMPLE_KEY) return buildMixedSample(army);
  return { army, deckKey, cardIds: null, name: null };
}

const LAB_LAYOUT_KEY = 'satze_vs_lab_layout';
/** Modello scelto per il VS: «Alle spalle» + «Scatola 3D». */
const LAB_DEFAULT_COVER = 'box';

/** Copertina del lab: la preferenza salvata se esiste, altrimenti il modello scelto. */
function loadLabCover() {
  try {
    return localStorage.getItem('satze_deck_cover_style') ? getDeckCoverStyle() : LAB_DEFAULT_COVER;
  } catch {
    return LAB_DEFAULT_COVER;
  }
}

function loadLabLayout() {
  try {
    const v = localStorage.getItem(LAB_LAYOUT_KEY);
    return VERSUS_LAYOUTS.some((l) => l.key === v) ? v : 'shadow';
  } catch {
    return 'shadow';
  }
}

const LAB_FX_KEY = 'satze_vs_lab_fx';
const ALL_FX_ON = Object.fromEntries(VERSUS_FX.map((f) => [f.key, true]));

function loadLabFx() {
  try {
    const v = JSON.parse(localStorage.getItem(LAB_FX_KEY) || 'null');
    return v && typeof v === 'object' ? { ...ALL_FX_ON, ...v } : ALL_FX_ON;
  } catch {
    return ALL_FX_ON;
  }
}

function FxRow({ value, onToggle }) {
  return (
    <div className="space-y-1">
      <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Effetti (indipendenti)</span>
      <div className="grid grid-cols-2 gap-1">
        {VERSUS_FX.map((f) => (
          <button
            key={f.key}
            type="button"
            title={f.meta}
            aria-pressed={Boolean(value[f.key])}
            className={`border px-2 py-1 text-xs ${value[f.key] ? 'border-amber-300 bg-amber-300/15' : 'border-slate-600 text-slate-400'}`}
            onClick={() => onToggle(f.key)}
          >
            {value[f.key] ? '● ' : '○ '}{f.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function ChipRow({ label, options, value, onChange }) {
  return (
    <div className="space-y-1">
      <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">{label}</span>
      <div className="grid grid-cols-2 gap-1">
        {options.map((opt) => (
          <button
            key={opt.key}
            type="button"
            title={opt.meta}
            className={`border px-2 py-1 text-xs ${value === opt.key ? 'border-amber-300 bg-amber-300/15' : 'border-slate-600'}`}
            onClick={() => onChange(opt.key)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function DeckPicker({ label, value, onChange, customDecks }) {
  const builtIn = Object.entries(ARMY_DECKS[value.army] || {});
  const customEntries = Object.entries(customDecks);
  return (
    <fieldset className="space-y-1.5">
      <legend className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">{label}</legend>
      <select
        className="w-full bg-slate-900 border border-slate-600 px-2 py-1 text-sm"
        value={value.army}
        onChange={(e) => {
          const army = e.target.value;
          const firstKey = Object.keys(ARMY_DECKS[army] || {})[0] || null;
          onChange({ army, deckKey: firstKey });
        }}
      >
        {ARMY_NAMES.map((army) => <option key={army} value={army}>{army}</option>)}
      </select>
      <select
        className="w-full bg-slate-900 border border-slate-600 px-2 py-1 text-sm"
        value={value.deckKey || ''}
        onChange={(e) => onChange({ ...value, deckKey: e.target.value })}
      >
        <optgroup label="Precostruiti">
          {builtIn.map(([key, deck]) => <option key={key} value={key}>{key} — {deck.name}</option>)}
        </optgroup>
        <optgroup label="Prova">
          <option value={MIXED_SAMPLE_KEY}>Misto di esempio (2 armate)</option>
        </optgroup>
        {customEntries.length ? (
          <optgroup label="Personalizzati (salvati)">
            {customEntries.map(([id, deck]) => (
              <option key={id} value={`custom_${id}`}>{deck?.name || id}</option>
            ))}
          </optgroup>
        ) : null}
      </select>
    </fieldset>
  );
}

export function VersusLabPage({ onClose }) {
  const customDecks = useMemo(() => loadCustomDecks(), []);
  const [panelOpen, setPanelOpen] = useState(true);
  const [mode, setMode] = useState('ai');
  const [difficulty, setDifficulty] = useState('medium');
  const [selfName, setSelfName] = useState('Giocatore');
  const [peerName, setPeerName] = useState('Avversario');
  const [playerPick, setPlayerPick] = useState({ army: ARMY_NAMES[0], deckKey: 'A' });
  const [enemyPick, setEnemyPick] = useState({ army: ARMY_NAMES[2] || ARMY_NAMES[0], deckKey: MIXED_SAMPLE_KEY });
  const [layout, setLayout] = useState(loadLabLayout);
  const [coverStyle, setCoverStyle] = useState(loadLabCover);
  const [eminenceFormat, setEminenceFormat] = useState(EMINENCE_FORMAT.REQUIRED);
  const [fx, setFx] = useState(loadLabFx);
  const [playKey, setPlayKey] = useState(0);
  const [progress, setProgress] = useState(0);

  const identity = useMemo(
    () => buildVersusIdentity({ isOnline: mode === 'online', difficulty, selfName, peerName }),
    [mode, difficulty, selfName, peerName]
  );
  const playerDeck = useMemo(() => resolveLabDeck(playerPick), [playerPick]);
  const enemyDeck = useMemo(() => resolveLabDeck(enemyPick), [enemyPick]);

  useEffect(() => {
    let raf = 0;
    const t0 = performance.now();
    const tick = () => {
      const p = Math.min(100, ((performance.now() - t0) / FAKE_LOADING_MS) * 100);
      setProgress(Math.round(p));
      if (p < 100) raf = requestAnimationFrame(tick);
    };
    setProgress(0);
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playKey]);

  const replay = () => setPlayKey((k) => k + 1);
  const pickLayout = (key) => {
    setLayout(key);
    try { localStorage.setItem(LAB_LAYOUT_KEY, key); } catch { /* solo sessione */ }
    replay();
  };
  const toggleFx = (key) => {
    setFx((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      try { localStorage.setItem(LAB_FX_KEY, JSON.stringify(next)); } catch { /* solo sessione */ }
      return next;
    });
    replay();
  };
  /** Lo stile copertina scelto qui vale anche nella scelta mazzo. */
  const pickCoverStyle = (key) => {
    setCoverStyle(key);
    setDeckCoverStyle(key);
    replay();
  };

  return (
    <>
      <GameViewport>
        <DuelVersusScreen
          key={playKey}
          playerIdentity={identity.player}
          enemyIdentity={identity.enemy}
          playerDeck={playerDeck}
          enemyDeck={enemyDeck}
          layout={layout}
          coverStyle={coverStyle}
          eminenceFormat={eminenceFormat}
          fx={fx}
          progress={progress}
        />
      </GameViewport>

      <div
        className="fixed top-3 left-3 z-[100000] text-slate-100 text-sm"
        style={{ fontFamily: "'Chakra Petch', sans-serif" }}
      >
        {panelOpen ? (
          <div className="w-72 max-h-[calc(100vh-24px)] overflow-y-auto space-y-3 border border-slate-600 bg-slate-950/90 p-3 shadow-xl">
            <div className="flex items-center justify-between gap-2">
              <strong className="tracking-[0.18em] text-xs">VS LAB</strong>
              <div className="flex gap-1">
                <button type="button" className="border border-slate-600 px-2 py-0.5 text-xs" onClick={() => setPanelOpen(false)}>
                  Nascondi
                </button>
                <button type="button" className="border border-slate-600 px-2 py-0.5 text-xs" onClick={onClose}>
                  ← Gioco
                </button>
              </div>
            </div>

            <div className="flex gap-1">
              {[['ai', 'VS IA'], ['online', 'Multiplayer']].map(([id, lbl]) => (
                <button
                  key={id}
                  type="button"
                  className={`flex-1 border px-2 py-1 text-xs ${mode === id ? 'border-amber-300 bg-amber-300/15' : 'border-slate-600'}`}
                  onClick={() => setMode(id)}
                >
                  {lbl}
                </button>
              ))}
            </div>

            {mode === 'ai' ? (
              <label className="block space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Difficoltà IA</span>
                <select
                  className="w-full bg-slate-900 border border-slate-600 px-2 py-1 text-sm"
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                >
                  {DIFFICULTIES.map((d) => <option key={d} value={d}>{DIFFICULTY_NAMES[d]}</option>)}
                </select>
              </label>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <label className="block space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Tuo nome</span>
                  <input className="w-full bg-slate-900 border border-slate-600 px-2 py-1" value={selfName} onChange={(e) => setSelfName(e.target.value)} />
                </label>
                <label className="block space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Avversario</span>
                  <input className="w-full bg-slate-900 border border-slate-600 px-2 py-1" value={peerName} onChange={(e) => setPeerName(e.target.value)} />
                </label>
              </div>
            )}

            <ChipRow label="Eminenze" options={VERSUS_LAYOUTS} value={layout} onChange={pickLayout} />
            <ChipRow
              label="Copertina (vale anche in scelta mazzo)"
              options={DECK_COVER_STYLES}
              value={coverStyle}
              onChange={pickCoverStyle}
            />
            <FxRow value={fx} onToggle={toggleFx} />
            <ChipRow
              label="Formato"
              options={[
                { key: EMINENCE_FORMAT.REQUIRED, label: 'Standard', meta: 'Eminenze e Campi' },
                { key: EMINENCE_FORMAT.DISABLED, label: 'No Eminenza', meta: 'Campi attivi' },
              ]}
              value={eminenceFormat}
              onChange={setEminenceFormat}
            />

            <DeckPicker label="Il tuo esercito" value={playerPick} onChange={setPlayerPick} customDecks={customDecks} />
            <DeckPicker label="Esercito avversario" value={enemyPick} onChange={setEnemyPick} customDecks={customDecks} />

            <button type="button" className="w-full border border-amber-300 bg-amber-300/15 px-2 py-1.5 text-xs tracking-[0.18em]" onClick={replay}>
              RIPRODUCI INGRESSO
            </button>
          </div>
        ) : (
          <button type="button" className="border border-slate-600 bg-slate-950/80 px-2 py-1 text-xs" onClick={() => setPanelOpen(true)}>
            VS LAB ▸
          </button>
        )}
      </div>
    </>
  );
}

export default VersusLabPage;

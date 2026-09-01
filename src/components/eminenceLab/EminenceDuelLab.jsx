import React, { useEffect, useMemo, useState } from 'react';
import { EMINENCES } from '../../data/eminences';
import { ARMY_COLORS } from '../../data/armies';
import { CHOICE_STATES, OPTION_BLOCKERS } from '../../game/eminence/eminenceChoiceView.js';
import {
  APPEARANCES,
  DEFAULT_APPEARANCE,
  DEFAULT_SHAPE,
  SHAPES,
} from '../eminence/eminenceUi.js';
import { EminenzaZone } from '../eminence/EminenzaZone.jsx';
import {
  getEminenceArtFrame,
  resetEminenceArtFrame,
  saveEminenceArtFrame,
} from '../../data/eminenceArtFrames.js';

const EMINENCE_LIST = Object.values(EMINENCES);
const SHAPE_IDS = Object.keys(SHAPES);
const APPEARANCE_IDS = Object.keys(APPEARANCES);

const APPEARANCE_NOTES = {
  affondo: 'Tutto entra di lato storto e frena di colpo: la carta rimbalza, le abilità la incalzano a raffica.',
  mano: 'Le abilità vengono servite come carte da un mazziere: ruotano fuori dal fianco una dopo l’altra.',
  martello: 'La carta timbra il tavolo, l’onda parte dal centro e le abilità cadono dall’alto.',
  taglio: 'Una lama diagonale attraversa il banco e ciò che ha già tagliato resta scoperto.',
  ribalta: 'La carta gira su sé e le abilità si ribaltano in avanti come insegne, una alla volta.',
  sciame: 'Le abilità arrivano da direzioni diverse e trovano il proprio posto insieme.',
};

const SHAPE_NOTES = {
  nastro: 'Nastro con pedana colorata sotto, clip a bandiera.',
  strappo: 'Carta chiara con bordo irregolare e grana.',
  scheggia: 'Taglio obliquo, barra d’armata sul filo.',
  timbro: 'Riquadro offset, doppio bordo chiaro.',
  manifesto: 'Lastra chiara da manifesto, costo a cuneo.',
  lama: 'Punta a sinistra, pedana d’armata.',
};

function toZoneEminence(eminence) {
  return {
    id: eminence.id,
    name: eminence.name,
    army: eminence.army,
    staticName: eminence.static?.name ?? null,
    staticText: eminence.static?.text ?? null,
    presenceCurve: (eminence.abilities || []).map((a) => a.presenceDelta),
  };
}

function toLabOptions(eminence, presence, pickedId) {
  return (eminence.abilities || []).map((ability) => {
    const cost = Math.max(0, -ability.presenceDelta);
    const unaffordable = cost > 0 && cost > presence;
    return {
      id: ability.id,
      name: ability.name,
      text: ability.text,
      presenceDelta: ability.presenceDelta,
      isGain: ability.presenceDelta >= 0,
      revealGate: ability.revealGate,
      implemented: ability.segments != null,
      selectable: !unaffordable,
      blocker: unaffordable ? OPTION_BLOCKERS.INSUFFICIENT_PRESENCE : null,
      selected: pickedId === ability.id,
    };
  });
}

function Chip({ label, active, accent, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em]"
      style={{
        border: `1px solid ${active ? accent : 'rgba(255,255,255,.18)'}`,
        background: active ? `${accent}2e` : 'transparent',
        color: active ? '#f8fafc' : '#94a3b8',
        clipPath: 'polygon(5px 0,100% 0,100% calc(100% - 5px),calc(100% - 5px) 100%,0 100%,0 5px)',
      }}
    >
      {label}
    </button>
  );
}

export function RangeField({ label, value, min, max, step, suffix, onChange }) {
  return (
    <label className="flex flex-col gap-2 text-sm text-[var(--st-muted)]">
      <span className="flex justify-between">
        <span>{label}</span>
        <span className="tabular-nums text-[var(--st-text)]">
          {value}
          {suffix}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

const POS_KEY = 'satze-em-lab-layout';
const POS_DEFAULT = { cardX: 0, cardY: 0 };

function loadLabPos() {
  if (typeof window === 'undefined') return POS_DEFAULT;
  try {
    const raw = window.localStorage.getItem(POS_KEY);
    if (!raw) return POS_DEFAULT;
    const parsed = JSON.parse(raw);
    return {
      cardX: Number.isFinite(parsed?.cardX) ? parsed.cardX : 0,
      cardY: Number.isFinite(parsed?.cardY) ? parsed.cardY : 0,
    };
  } catch {
    return POS_DEFAULT;
  }
}

function persistLabPos(next) {
  try {
    window.localStorage.setItem(POS_KEY, JSON.stringify(next));
  } catch {
    /* ignore quota */
  }
}

export function useEminenceLabPos() {
  const [pos, setPos] = useState(loadLabPos);
  const setPosField = (field, value) => {
    setPos((prev) => {
      const next = { ...prev, [field]: value };
      persistLabPos(next);
      return next;
    });
  };
  const resetPos = () => {
    setPos(POS_DEFAULT);
    persistLabPos(POS_DEFAULT);
  };
  return { pos, setPosField, resetPos };
}

export function useEminenceArtFrame(eminenceId) {
  const [frame, setFrame] = useState(() => getEminenceArtFrame(eminenceId));
  useEffect(() => {
    setFrame(getEminenceArtFrame(eminenceId));
  }, [eminenceId]);
  const setFrameField = (field, value) => {
    setFrame((prev) => {
      const next = saveEminenceArtFrame(eminenceId, { ...prev, [field]: value });
      return next;
    });
  };
  const resetFrame = () => {
    setFrame(resetEminenceArtFrame(eminenceId));
  };
  return { frame, setFrameField, resetFrame };
}

export function EminenceDuelLab() {
  const [eminenceId, setEminenceId] = useState('apex_sole_verde');
  const [appearance, setAppearance] = useState(DEFAULT_APPEARANCE);
  const [shape, setShape] = useState(DEFAULT_SHAPE);
  const [side, setSide] = useState('player');
  const [presence, setPresence] = useState(3);
  const [pickedId, setPickedId] = useState(null);
  const [sealed, setSealed] = useState(false);
  const [mountKey, setMountKey] = useState(0);
  const { frame, setFrameField, resetFrame } = useEminenceArtFrame(eminenceId);

  const eminence = useMemo(
    () => EMINENCE_LIST.find((e) => e.id === eminenceId) || EMINENCE_LIST[0],
    [eminenceId],
  );
  const accent = ARMY_COLORS[eminence.army]?.accent ?? '#d5ecf9';
  const options = useMemo(
    () => toLabOptions(eminence, presence, pickedId),
    [eminence, presence, pickedId],
  );

  return (
    <div className="grid grid-cols-1 gap-8 xl:grid-cols-3">
      <div className="space-y-6">
        <div className="satze-tool-panel p-6 space-y-4">
          <h2 className="text-lg font-bold text-[var(--st-text)]">Eminenza</h2>
          <select
            className="satze-tool-input"
            value={eminence.id}
            onChange={(e) => {
              setEminenceId(e.target.value);
              setPickedId(null);
              setSealed(false);
              setMountKey((k) => k + 1);
            }}
          >
            {EMINENCE_LIST.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} — {item.army}
              </option>
            ))}
          </select>
        </div>

        <div className="satze-tool-panel p-6 space-y-3">
          <h2 className="text-lg font-bold text-[var(--st-text)]">Apparizione</h2>
          <div className="flex flex-wrap gap-2">
            {APPEARANCE_IDS.map((id) => (
              <Chip
                key={id}
                label={id}
                active={appearance === id}
                accent={accent}
                onClick={() => {
                  setAppearance(id);
                  setMountKey((k) => k + 1);
                }}
              />
            ))}
          </div>
          <p className="text-xs text-[var(--st-muted)] leading-relaxed">
            {APPEARANCE_NOTES[appearance]}
          </p>
        </div>

        <div className="satze-tool-panel p-6 space-y-3">
          <h2 className="text-lg font-bold text-[var(--st-text)]">Forma losanga</h2>
          <div className="flex flex-wrap gap-2">
            {SHAPE_IDS.map((id) => (
              <Chip
                key={id}
                label={id}
                active={shape === id}
                accent={accent}
                onClick={() => {
                  setShape(id);
                  setMountKey((k) => k + 1);
                }}
              />
            ))}
          </div>
          <p className="text-xs text-[var(--st-muted)] leading-relaxed">
            {SHAPE_NOTES[shape]} Stesse sei forme del costruttore.
          </p>
        </div>

        <div className="satze-tool-panel p-6 space-y-3">
          <h2 className="text-lg font-bold text-[var(--st-text)]">Stato</h2>
          <div className="flex flex-wrap gap-2">
            <Chip label="Giocatore" active={side === 'player'} accent={accent} onClick={() => setSide('player')} />
            <Chip label="Avversario" active={side === 'enemy'} accent={accent} onClick={() => setSide('enemy')} />
          </div>
          <label className="flex flex-col gap-2 text-sm text-[var(--st-muted)]">
            <span className="flex justify-between">
              <span>Presenza</span>
              <span className="tabular-nums text-[var(--st-text)]">{presence}</span>
            </span>
            <input
              type="range"
              min={0}
              max={6}
              step={1}
              value={presence}
              onChange={(e) => {
                const next = Number(e.target.value);
                setPresence(next);
                const ability = eminence.abilities?.find((a) => a.id === pickedId);
                const cost = Math.max(0, -(ability?.presenceDelta ?? 0));
                if (pickedId && cost > next) {
                  setPickedId(null);
                  setSealed(false);
                }
              }}
            />
          </label>
          <button
            type="button"
            className="satze-tool-btn-secondary w-full"
            onClick={() => {
              setPickedId(null);
              setSealed(false);
              setMountKey((k) => k + 1);
            }}
          >
            Rigioca ingresso
          </button>
        </div>

        <div className="satze-tool-panel p-6 space-y-3">
          <h2 className="text-lg font-bold text-[var(--st-text)]">Inquadratura arte</h2>
          <p className="text-xs text-[var(--st-muted)] leading-relaxed">
            Solo per <span className="text-[var(--st-text)]">{eminence.name}</span>.
            Orizzontale e verticale piegano l’illustrazione. L’inquadratura sposta il ritaglio (0 = alto).
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
          <button
            type="button"
            className="satze-tool-btn-secondary w-full"
            onClick={resetFrame}
          >
            Azzera questa carta
          </button>
        </div>
      </div>

      <div className="xl:col-span-2 space-y-3">
        <div className="em-duel-lab-stage">
          <EminenzaZone
            key={`${mountKey}-${eminence.id}-${appearance}-${shape}-${side}`}
            side={side}
            embedded
            eminence={toZoneEminence(eminence)}
            presence={presence}
            options={options}
            pickedId={pickedId}
            choiceState={sealed ? CHOICE_STATES.LOCKED_HIDDEN : CHOICE_STATES.CHOOSING}
            appearance={appearance}
            shape={shape}
            artX={frame.artX}
            artY={frame.artY}
            artZoom={frame.zoom}
            artFocusX={frame.focusX}
            artFocusY={frame.focusY}
            onPick={side === 'player' && !sealed ? setPickedId : undefined}
            onConfirm={side === 'player' && !sealed ? (id) => { setPickedId(id); setSealed(true); } : undefined}
          />
        </div>
        <p className="text-xs text-[var(--st-muted)] leading-relaxed">
          Click sull’abilità: riempie la losanga. Secondo click: sigilla, senza spostare il palco.
          Cambia forma e apparizione qui, poi si porta nel duello.
        </p>
      </div>
    </div>
  );
}

export default EminenceDuelLab;

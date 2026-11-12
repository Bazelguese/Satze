import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ARMY_COLORS } from '../../data/armies.js';
import { getEminenceArtUrl } from '../../data/eminenceArt.js';
import { getEminenceArtFrame } from '../../data/eminenceArtFrames.js';
import { inkOn } from './eminenceUi.js';
import { CHOICE_PORTAL_CLOSED as CLOSED, CHOICE_PORTAL_OPEN as OPEN, PLATE_GAP, PLATE_T, CHOICE_PORTAL_FALLBACK_CENTER, answerPlates } from './eminenceChoiceGeometry.js';
import '../../styles/em-scelta.css';

/**
 * Schermata di scelta delle Eminenze: il portale del campo si espande e diventa la schermata.
 * Serve tutte le scelte «tra opzioni» (Offerte, Affari, Scommessa…): illustrazione dell'Eminenza
 * in alto, testo al centro, risposte come placche ad arco lungo la ghiera in basso.
 * «Guarda il campo» la riduce al portale senza rispondere; la scelta resta in sospeso.
 *
 * Coordinate di scena (1920×1080): si aggancia al portale vero (`anchorSelector`).
 */

/** Le stesse rune del portale (Battlefield.jsx), nella stessa sequenza. */
const RUNES = [
  'M -3 -3 L 3 -3 L 0 3 Z',
  'M -3 0 L 0 -3 L 3 0 L 0 3 Z',
  'M -3 -3 L 3 3 M -3 3 L 3 -3',
  'M -3 0 L 3 0 M 0 -3 L 0 3',
  'M -3 -2 L 3 -2 M -3 2 L 3 2',
  'M 0 -3 L 3 0 L 0 3 L -3 0 Z',
  'M -3 -3 L 3 -3 M 0 -3 L 0 3',
  'M -3 -3 L -3 3 L 3 0 Z',
  'M -3 -3 L 3 -3 L 3 3 L -3 3 Z M -3 0 L 3 0',
];
const RUNE_SEQ = [0, 3, 7, 1, 5, 2, 8, 4, 6, 0, 2, 7, 3, 1, 8, 5, 4, 6, 1, 7, 0, 3, 5, 8];
const RUNE_COUNT = 56;
const RUNE_LAP_S = 60;

/** Un'etichetta troppo lunga per la sua placca viene stretta, non tagliata. */
function fitLabel(label, room) {
  const estimate = String(label).length * 18.5;
  return estimate > room ? { textLength: Math.round(room), lengthAdjust: 'spacingAndGlyphs' } : {};
}

function RuneRing({ uid }) {
  const w = OPEN.rx * 2;
  const h = OPEN.ry * 2;
  const rx = OPEN.rx - 15;
  const ry = OPEN.ry - 15;
  const ring = `M ${OPEN.rx - rx} ${OPEN.ry} A ${rx} ${ry} 0 1 1 ${OPEN.rx + rx} ${OPEN.ry} A ${rx} ${ry} 0 1 1 ${OPEN.rx - rx} ${OPEN.ry}`;
  return (
    <svg className="em-scelta-runes" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden>
      <defs><path id={`${uid}-ring`} d={ring} /></defs>
      {Array.from({ length: RUNE_COUNT }, (_, i) => (
        <g key={i}>
          <animateMotion dur={`${RUNE_LAP_S}s`} repeatCount="indefinite" rotate="auto" begin={`${((-RUNE_LAP_S * i) / RUNE_COUNT).toFixed(2)}s`}>
            <mpath href={`#${uid}-ring`} />
          </animateMotion>
          <path d={RUNES[RUNE_SEQ[i % RUNE_SEQ.length]]} transform="scale(2)" />
        </g>
      ))}
    </svg>
  );
}

/**
 * @param {object} props
 * @param {null|{ id: string, eminence: object, kicker: string, name: string, text: string, note?: string,
 *   options: Array<{ key: string, label: string, sub?: string, kind?: 'accept'|'refuse', disabled?: boolean, onClick: () => void }> }} props.choice
 * @param {string} [props.anchorSelector]
 */
export function EminenceChoicePortal({ choice, anchorSelector = '.satze-bf-portal' }) {
  const rootRef = useRef(null);
  const uid = React.useId().replace(/:/g, '');
  const [center, setCenter] = useState(CHOICE_PORTAL_FALLBACK_CENTER);
  const [open, setOpen] = useState(false);
  const [peek, setPeek] = useState(false);
  const choiceId = choice?.id ?? null;

  // Si aggancia al portale vero: stesso centro, in coordinate di scena.
  useLayoutEffect(() => {
    if (!choiceId) return undefined;
    setOpen(false);
    setPeek(false);
    const root = rootRef.current;
    const scene = root?.offsetParent;
    const anchor = scene?.querySelector(anchorSelector);
    if (scene && anchor) {
      const sr = scene.getBoundingClientRect();
      const ar = anchor.getBoundingClientRect();
      const k = sr.width / (scene.offsetWidth || sr.width) || 1;
      if (ar.width > 2) setCenter({ x: (ar.left + ar.width / 2 - sr.left) / k, y: (ar.top + ar.height / 2 - sr.top) / k });
    }
    // un attimo da chiuso, poi si espande: l'occhio vede da dove nasce
    const t = window.setTimeout(() => setOpen(true), 120);
    return () => window.clearTimeout(t);
  }, [choiceId, anchorSelector]);

  // Invio = la risposta principale (l'ultima), come «Conferma» nel resto del duello… solo se è l'unica.
  useEffect(() => {
    if (!choice || !open || peek) return undefined;
    const onKey = (event) => {
      if (event.key !== 'Enter' || event.target?.closest?.('button, [role="button"], input, textarea')) return;
      const live = choice.options.filter((o) => !o.disabled);
      if (live.length === 1) { event.preventDefault(); live[0].onClick?.(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [choice, open, peek]);

  const plates = useMemo(() => answerPlates(choice?.options?.length || 0), [choice?.options?.length]);

  if (!choice) return null;

  const eminence = choice.eminence || null;
  const accent = (eminence && ARMY_COLORS[eminence.army]?.accent) || '#f5c451';
  const artUrl = eminence ? getEminenceArtUrl(eminence) : null;
  const frame = eminence ? getEminenceArtFrame(eminence.id) : null;
  const shown = open && !peek;
  const half = shown ? OPEN : CLOSED;
  const nameSize = choice.name.length > 22 ? 34 : choice.name.length > 15 ? 42 : 52;
  const textSize = (choice.text || '').length > 190 ? 19 : (choice.text || '').length > 120 ? 21 : 24;
  const svgHalfW = OPEN.rx + PLATE_GAP + PLATE_T + 20;
  const svgHalfH = OPEN.ry + PLATE_GAP + PLATE_T + 20;

  return (
    <div
      ref={rootRef}
      className={`em-scelta${shown ? ' is-open' : ''}${peek ? ' is-peek' : ''}`}
      style={{ '--em-sc-acc': accent, '--em-sc-ink': inkOn(accent) }}
      role="dialog"
      aria-modal={shown}
      aria-label={`${choice.kicker}: ${choice.name}`}
    >
      <div className="em-scelta-dim" />
      <div
        className="em-scelta-oval"
        style={{ left: center.x, top: center.y, width: half.rx * 2, height: half.ry * 2 }}
        onClick={peek ? () => setPeek(false) : undefined}
        role={peek ? 'button' : undefined}
        tabIndex={peek ? 0 : undefined}
        onKeyDown={peek ? (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setPeek(false); } } : undefined}
        aria-label={peek ? `Torna alla scelta: ${choice.name}` : undefined}
      >
        <div className="em-scelta-face">
          {artUrl && (
            <div className="em-scelta-art" style={{ backgroundImage: `url(${artUrl})`, backgroundPosition: `${frame?.focusX ?? 50}% ${Math.min(60, (frame?.focusY ?? 50) * 0.8)}%` }} />
          )}
          <div className="em-scelta-closed">
            <small>{peek ? 'In sospeso' : 'Scegli ora'}</small>
            {choice.name}
          </div>
          <div className="em-scelta-body" style={{ width: OPEN.rx * 2, height: OPEN.ry * 2 }}>
            <div className="em-scelta-kicker">{choice.kicker}</div>
            <div className="em-scelta-name" style={{ fontSize: nameSize }}>{choice.name}</div>
            <p className="em-scelta-text" style={{ fontSize: textSize }}>{choice.text}</p>
            {choice.note && <p className="em-scelta-note">{choice.note}</p>}
          </div>
        </div>
        <RuneRing uid={uid} />
      </div>

      <svg
        className="em-scelta-answers"
        style={{ left: center.x - svgHalfW, top: center.y - svgHalfH, width: svgHalfW * 2, height: svgHalfH * 2 }}
        viewBox={`${-svgHalfW} ${-svgHalfH} ${svgHalfW * 2} ${svgHalfH * 2}`}
      >
        <defs>
          <linearGradient id={`${uid}-yes`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" className="em-scelta-stop-a" />
            <stop offset="0.5" className="em-scelta-stop-b" />
            <stop offset="1" className="em-scelta-stop-c" />
          </linearGradient>
          <linearGradient id={`${uid}-no`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#3a2a22" />
            <stop offset="0.5" stopColor="#1a100d" />
            <stop offset="1" stopColor="#0b0605" />
          </linearGradient>
        </defs>
        {choice.options.map((option, i) => {
          const plate = plates[i];
          if (!plate) return null;
          const refuse = option.kind === 'refuse';
          const act = () => { if (!option.disabled && shown) option.onClick?.(); };
          return (
            <g
              key={option.key}
              className={`em-scelta-plate ${refuse ? 'is-refuse' : 'is-accept'}${option.disabled ? ' is-disabled' : ''}`}
              style={{ '--px': `${plate.push[0].toFixed(1)}px`, '--py': `${plate.push[1].toFixed(1)}px` }}
              role="button"
              tabIndex={shown && !option.disabled ? 0 : -1}
              aria-disabled={option.disabled || undefined}
              aria-label={option.sub ? `${option.label}, ${option.sub}` : option.label}
              onClick={act}
              onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); event.stopPropagation(); act(); } }}
            >
              <path className="em-scelta-plate-body" d={plate.shape} fill={`url(#${uid}-${refuse ? 'no' : 'yes'})`} />
              <path className="em-scelta-plate-gloss" d={plate.gloss} />
              <path id={`${uid}-l${i}`} d={plate.label(option.sub ? 0.4 : 0.5)} fill="none" />
              <text className="em-scelta-plate-label" dy="8">
                <textPath href={`#${uid}-l${i}`} startOffset="50%" textAnchor="middle" {...fitLabel(option.label, plate.length)}>{option.label}</textPath>
              </text>
              {option.sub && (
                <>
                  <path id={`${uid}-s${i}`} d={plate.label(0.74)} fill="none" />
                  <text className="em-scelta-plate-sub" dy="4">
                    <textPath href={`#${uid}-s${i}`} startOffset="50%" textAnchor="middle">{option.sub}</textPath>
                  </text>
                </>
              )}
            </g>
          );
        })}
      </svg>

      <button
        type="button"
        className="em-scelta-peek"
        style={{ left: center.x, top: shown ? center.y - OPEN.ry - 58 : center.y + CLOSED.ry + 96 }}
        onClick={() => setPeek((v) => !v)}
        aria-pressed={peek}
      >
        {peek ? 'Torna alla scelta' : 'Guarda il campo'}
      </button>
    </div>
  );
}

export default EminenceChoicePortal;

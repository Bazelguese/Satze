// ============================================================
// MultiVersusScreen.jsx — schermata VS per 3 e 4 giocatori (2v2, Re della collina)
// ============================================================
// Ogni giocatore ha la sua colonna, separata dalle altre da tagli obliqui come la diagonale
// del VS a due. Ordine da sinistra: gli avversari, poi tu, poi (nel 2v2) il compagno.
// Durante il caricamento la tua colonna è già ferma (il tuo mazzo, con il volo della scatola
// dalla scelta esercito); in ogni altra colonna gira una ruota delle armate, ognuna con le
// armate in un ordine diverso e partendo da un punto diverso. Le ruote condividono una sola
// freccia (linea di mira e lancette) e frenano insieme, fermandosi nello stesso istante; poi
// le colonne si accendono come lastre e calano i VS (uno fra le due squadre nel 2v2, uno a
// ogni taglio nel Re della collina).
// Stesse props di DuelVersusScreen (vedi lì); le Eminenze non ci sono in queste modalità.
// ============================================================

import React, { useCallback, useMemo, useRef, useState } from 'react';
import { ARMY_COLORS } from '../../data/armies.js';
import { EMINENCE_ARMY_ORDER } from '../../data/eminences.js';
import { VersusRoulette, buildRouletteItems, ROULETTE_SHARED_STOP_MS } from './VersusRoulette.jsx';
import { VersusCover, useVersusHandoffFlight } from './DuelVersusScreen.jsx';
import { DeckSelectStyles, buildDeckTicketEntry } from '../menu/cosmic/DeckSelectCinematic.jsx';
import './duelVersusScreen.css';
import './multiVersusScreen.css';

const W = 1920;
const H = 1080;
/** Spostamento orizzontale dei tagli fra centro e bordo (stessa pendenza del VS a due: 12°). */
const SLANT = 115;
const SEAM_DEG = (Math.atan((2 * SLANT) / H) * 180) / Math.PI;
/** Altezza della freccia condivisa (centro dello schermo) e inclinazione delle fasce. */
const ARROW_Y = 540;
const LANCET_MARGIN = 64;

/** Mescolamento deterministico (stesso ordine fra un render e l'altro). */
function seededShuffle(list, seed) {
  const out = [...list];
  let x = seed * 9301 + 49297;
  for (let i = out.length - 1; i > 0; i -= 1) {
    x = (x * 9301 + 49297) % 233280;
    const j = Math.floor((x / 233280) * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Colonne: avversari (gli altri, poi il principale), tu, compagni. */
export function buildVersusPortions({ playerIdentity, enemyIdentity, playerDeck, enemyDeck, playerAllies = [], enemyAllies = [] }) {
  const foes = enemyAllies.map((a, i) => ({ key: `foe-${i + 1}`, identity: a.identity, deck: a.deck, role: 'foe' }));
  const mates = playerAllies.map((a, i) => ({ key: `mate-${i}`, identity: a.identity, deck: a.deck, role: 'mate' }));
  return [
    ...foes,
    { key: 'foe-0', identity: enemyIdentity, deck: enemyDeck, role: 'foe' },
    { key: 'self', identity: playerIdentity, deck: playerDeck, role: 'self' },
    ...mates,
  ];
}

/** Geometria delle colonne nel canvas 1920×1080 (bordi dello schermo dritti, tagli obliqui). */
function columnGeometry(n) {
  const step = W / n;
  return Array.from({ length: n }, (_, i) => {
    const x0 = i * step;
    const x1 = (i + 1) * step;
    const lt = i === 0 ? 0 : x0 + SLANT;
    const lb = i === 0 ? 0 : x0 - SLANT;
    const rt = i === n - 1 ? W : x1 + SLANT;
    const rb = i === n - 1 ? W : x1 - SLANT;
    return {
      x0,
      x1,
      cx: (x0 + x1) / 2,
      clip: `polygon(${lt}px 0, ${rt}px 0, ${rb}px ${H}px, ${lb}px ${H}px)`,
      // la ruota usa la fascia della colonna all'altezza della freccia (lì il taglio cade in x0/x1)
      left: x0,
      width: step,
    };
  });
}

export function MultiVersusScreen({
  playerIdentity,
  enemyIdentity,
  playerDeck,
  enemyDeck,
  playerAllies = [],
  enemyAllies = [],
  coverStyle = 'ticket',
  fx = {},
  playerCardBack = null,
  progress = null,
  statusLabel = 'Preparazione scontro',
  intro = null,
}) {
  const rootRef = useRef(null);
  const introHeld = Boolean(intro) && intro.stage !== 'reveal';
  const [handoff] = useState(() => intro?.handoff || null);
  const onFlightDoneRef = useRef(intro?.onFlightDone);
  onFlightDoneRef.current = intro?.onFlightDone;
  useVersusHandoffFlight(rootRef, handoff, '.mvs-side--self .vsx-ticket', onFlightDoneRef);

  const portions = useMemo(
    () => buildVersusPortions({ playerIdentity, enemyIdentity, playerDeck, enemyDeck, playerAllies, enemyAllies })
      .map((p) => ({ ...p, entry: buildDeckTicketEntry(p.deck || {}) })),
    [playerIdentity, enemyIdentity, playerDeck, enemyDeck, playerAllies, enemyAllies]
  );
  const n = portions.length;
  const cols = useMemo(() => columnGeometry(n), [n]);
  const selfIndex = portions.findIndex((p) => p.role === 'self');
  const isTeam = portions.some((p) => p.role === 'mate');

  // Una ruota per ogni colonna non tua: armate in ordine diverso, partenza diversa.
  const wheels = useMemo(() => {
    const base = EMINENCE_ARMY_ORDER.filter((a) => ARMY_COLORS[a]);
    const ai = portions.map((p, i) => ({ p, i })).filter(({ p }) => p.role !== 'self');
    return ai.map(({ p, i }, k) => {
      const target = p.entry.armies?.[0] || p.deck?.army || null;
      const armies = seededShuffle(target && !base.includes(target) ? [...base, target] : base, k + 3);
      const reel = buildRouletteItems({ armies, enemyArmy: target, enemyDeckKey: null, deckArmy: null });
      return {
        index: i,
        reel,
        phase: Math.round((k * reel.items.length) / Math.max(1, ai.length)) + k,
        eyebrows: p.role === 'mate'
          ? { spin: 'SORTEGGIO DEL COMPAGNO', landed: 'IL TUO COMPAGNO' }
          : { spin: 'SORTEGGIO DELL’AVVERSARIO', landed: 'AVVERSARIO' },
      };
    });
  }, [portions]);

  // Tutte le ruote si fermano insieme: il VS parte quando sono arrivate tutte.
  const landedRef = useRef(new Set());
  const onReelLandedRef = useRef(intro?.onReelLanded);
  onReelLandedRef.current = intro?.onReelLanded;
  const landedFor = useCallback((idx) => () => {
    landedRef.current.add(idx);
    if (landedRef.current.size >= wheels.length) onReelLandedRef.current?.();
  }, [wheels.length]);

  // Lancette condivise: scattano al passaggio delle fasce della prima ruota.
  const needleLRef = useRef(null);
  const needleRRef = useRef(null);
  const onTick = useCallback((spd) => {
    const swing = -(8 + 10 * (1 - spd));
    const dur = 150 + 230 * (1 - spd);
    [needleLRef.current, needleRRef.current].forEach((el, i) => {
      el?.animate?.(
        [{ transform: `rotate(${i ? -swing : swing}deg)` }, { transform: 'rotate(0deg)' }],
        { duration: dur, easing: 'cubic-bezier(.2,1.6,.4,1)' }
      );
    });
  }, []);

  const hasIntro = Boolean(intro);
  const reelStopping = hasIntro && intro.stage !== 'spin';
  const reelLeaving = hasIntro && intro.stage === 'reveal';
  const opening = Boolean(fx.open) && coverStyle === 'box';
  const spin = Boolean(fx.spin) && coverStyle === 'box' && !introHeld;
  const p = progress == null ? null : Math.min(100, Math.max(0, Number(progress) || 0));

  // La freccia arriva fino all'ultima colonna che gira (nel Re della collina tu sei l'ultima).
  const lastWheelCol = cols[wheels.length ? wheels[wheels.length - 1].index : 0];
  const arrowRight = lastWheelCol.x1 >= W ? W - LANCET_MARGIN : lastWheelCol.x1;
  // VS: fra le due squadre nel 2v2, a ogni taglio nel Re della collina.
  const vsSeams = isTeam ? [selfIndex] : cols.slice(1).map((_, i) => i + 1);

  const scene = useMemo(() => (
    <>
      <DeckSelectStyles />

      {hasIntro ? wheels.map((w, k) => (
        <VersusRoulette
          key={portions[w.index].key}
          items={w.reel.items}
          targetKey={w.reel.targetKey}
          mode="armies"
          stopping={reelStopping}
          leaving={reelLeaving}
          onLanded={landedFor(w.index)}
          column={cols[w.index]}
          phase={w.phase}
          stopMs={ROULETTE_SHARED_STOP_MS}
          muted={k > 0}
          hideNeedles
          onTick={k === 0 ? onTick : null}
          eyebrows={w.eyebrows}
        />
      )) : null}

      {portions.map((pt, i) => (
        <div
          key={`half-${pt.key}`}
          className={`mvs-half${pt.role === 'self' ? ' is-self' : ' is-ai'}`}
          style={{ clipPath: cols[i].clip, '--accent': pt.entry.accent, '--cx': `${cols[i].cx}px` }}
        >
          <div className="vsx-half-bg" style={{ backgroundImage: pt.entry.bg ? `url('${pt.entry.bg}')` : 'none' }} />
          <div className="mvs-half-tint" />
        </div>
      ))}

      {hasIntro ? (
        <div className={`mvs-arrow${reelLeaving ? ' is-leaving' : ''}`} style={{ '--ar': `${W - arrowRight}px` }} aria-hidden>
          <span className="mvs-arrow-line" />
          <span className="mvs-needle mvs-needle--l"><i ref={needleLRef} /></span>
          <span className="mvs-needle mvs-needle--r"><i ref={needleRRef} /></span>
        </div>
      ) : null}

      {cols.slice(1).map((c, k) => (
        <div
          key={`seam-${k}`}
          className="mvs-seam"
          style={{
            left: `${c.x0}px`,
            transform: `translate(-50%, -50%) rotate(${SEAM_DEG}deg)`,
            '--la': portions[k].entry.accent,
            '--ra': portions[k + 1].entry.accent,
            '--seam-rot': `${SEAM_DEG}deg`,
          }}
        />
      ))}

      {portions.map((pt, i) => (
        <div
          key={`side-${pt.key}`}
          className={`mvs-side mvs-side--${pt.role === 'self' ? 'self' : 'ai'} is-${pt.role}`}
          style={{ left: `${cols[i].cx}px`, '--accent': pt.entry.accent }}
        >
          <header className="vsx-who mvs-who">
            <span className="vsx-who-eyebrow">{pt.identity?.eyebrow}</span>
            <span className="vsx-who-name">{pt.identity?.name}</span>
            {pt.identity?.sub ? <span className="vsx-who-sub">{pt.identity.sub}</span> : null}
          </header>
          <VersusCover
            entry={pt.entry}
            coverStyle={coverStyle}
            mirror={cols[i].cx > W / 2}
            opening={opening}
            spin={spin && pt.role === 'self'}
            backImage={pt.role === 'self' ? playerCardBack : null}
          />
        </div>
      ))}

      {vsSeams.map((ci) => (
        <div
          key={`vs-${ci}`}
          className={`mvs-vs-at${isTeam ? ' is-team' : ''}`}
          style={{ left: `${cols[ci].x0}px`, top: `${ARROW_Y}px`, '--la': portions[ci - 1].entry.accent, '--ra': portions[ci].entry.accent }}
        >
          <div className="vsx-vs" aria-label="contro">
            <div className="vsx-vs-ring" />
            <div className="vsx-vs-flash" />
            <span className="vsx-vs-v">V</span>
            <span className="vsx-vs-s">S</span>
          </div>
        </div>
      ))}
    </>
  ), [
    hasIntro, wheels, portions, cols, reelStopping, reelLeaving, landedFor, onTick, arrowRight,
    coverStyle, opening, spin, playerCardBack, vsSeams.join(','), isTeam,
  ]);

  return (
    <div
      ref={rootRef}
      className={`vsx mvs mvs-n${n}${isTeam ? ' mvs-team' : ' mvs-ffa'}${introHeld ? ' mvs-intro' : ''}${hasIntro ? ' mvs-has-intro' : ''}${handoff ? ' mvs-intro-handoff' : ''}${opening ? ' vsx-fx-open' : ''}`}
      style={{ '--la': portions[0]?.entry.accent, '--ra': portions[selfIndex]?.entry.accent }}
      role="presentation"
    >
      {scene}

      {p != null ? (
        <div className="vsx-foot">
          <div className="vsx-foot-bar">
            <div className="vsx-foot-fill" style={{ width: `${p}%` }} />
          </div>
          <span className="vsx-foot-lbl">{p >= 100 ? 'Pronto' : statusLabel}</span>
        </div>
      ) : null}

      <div className="vsx-scanlines" aria-hidden />
    </div>
  );
}

export default MultiVersusScreen;

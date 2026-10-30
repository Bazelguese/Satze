// ============================================================
// DuelVersusScreen.jsx — schermata VS d'ingresso al duello (prova)
// ============================================================
// Due lati — avversario a sinistra, giocatore a destra — con: chi gioca, la copertina dell'esercito,
// le armate di cui è composto e (opzionale) l'Eminenza in campo.
// Canvas logico 1920×1080: va montata dentro GameViewport (o un parent 1920×1080).
// Accesso di prova: ?vsLab=1 (VersusLabPage).
//
// layout:
//   base   — solo copertina (nessuna Eminenza)
//   side   — copertina + carta Eminenza affiancata verso il centro
//   hero   — Eminenza grande, copertina piccola in primo piano
//   shadow — arte dell'Eminenza come sfondo della metà + fascia con la sua statica
// ============================================================

import React, { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ARMY_COLORS, ARMY_ICONS } from '../../data/armies.js';
import { getEminence } from '../../data/eminences.js';
import { getEminenceArtUrl } from '../../data/eminenceArt.js';
import { getEminenceArtFrame } from '../../data/eminenceArtFrames.js';
import { EMINENCE_FORMAT } from '../../game/eminence/eminenceConstants.js';
import { EMINENCE_ARMY_ORDER } from '../../data/eminences.js';
import { VersusRoulette, buildRouletteItems } from './VersusRoulette.jsx';
import { resolveSideEminence } from '../../game/eminence/eminenceSetup.js';
import { pickDistinctCardBackPair } from '../../utils/cardBackPicker.js';
import { buildVersusIdentity } from './versusMatchData.js';

export { buildVersusIdentity };
import {
  DeckTicket,
  DeckSelectStyles,
  buildDeckTicketEntry,
} from '../menu/cosmic/DeckSelectCinematic.jsx';
import { EminenceTarotCard } from '../eminenceLab/EminenceTarotCard.jsx';
import '../eminenceLab/eminenceArtLab.css';
import './duelVersusScreen.css';

export const VERSUS_LAYOUTS = [
  { key: 'base', label: 'Senza Eminenza', meta: 'Solo copertina' },
  { key: 'side', label: 'Affiancata', meta: 'Copertina + Eminenza' },
  { key: 'hero', label: 'Protagonista', meta: 'Eminenza grande' },
  { key: 'shadow', label: 'Alle spalle', meta: 'Arte Eminenza sullo sfondo' },
];

/** Effetti d'ingresso in prova (attivabili uno per uno dal VS LAB). */
export const VERSUS_FX = [
  { key: 'open', label: 'Apertura scatola', meta: 'Coperchio, carte a ventaglio, poi il VS' },
  { key: 'spin', label: 'Rotazione 3D', meta: 'La scatola gira piano e si può girare col mouse' },
  { key: 'awaken', label: 'Risveglio Eminenza', meta: 'Lo sfondo si accende con un\'ondata di luce' },
  { key: 'impact', label: 'Impatto VS', meta: 'Scossa e scintille quando cala il VS' },
  { key: 'parallax', label: 'Parallasse', meta: 'Sfondo e lati seguono il puntatore' },
];

/** Pseudo-casuale deterministico: le particelle restano uguali fra un render e l'altro. */
function seeded(n) {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

const SPARKS = Array.from({ length: 14 }, (_, i) => ({
  a: `${Math.round((360 / 14) * i + seeded(i + 7) * 18)}deg`,
  d: `${170 + Math.round(seeded(i + 17) * 150)}px`,
}));

/**
 * Eminenza di un lato: id dallo stato partita se c'è, altrimenti stessa regola
 * dell'avvio duello (resolveSideEminence sul mazzo da 10).
 */
function resolveVersusEminence(entry, format, eminenceId) {
  if (format === EMINENCE_FORMAT.DISABLED) return { eminence: null, reason: 'Formato senza Eminenze' };
  const res = resolveSideEminence(entry.deckCards || [], eminenceId || null, format);
  const eminence = res.eminenceId ? getEminence(res.eminenceId) : null;
  if (eminence) return { eminence, reason: null };
  return {
    eminence: null,
    reason: res.reason === 'NO_ELIGIBLE_ARMY' ? 'Nessuna armata con 5+ carte' : 'Nessuna Eminenza',
  };
}

function VersusArmies({ armies }) {
  const list = (armies || []).filter(Boolean);
  if (!list.length) return null;
  return (
    <div className="vsx-armies">
      <span className="vsx-armies-lbl">{list.length > 1 ? 'ARMATE' : 'ARMATA'}</span>
      <div className="vsx-armies-list">
        {list.map((army) => (
          <span
            key={army}
            className="vsx-army"
            style={{ '--army': ARMY_COLORS[army]?.accent || '#94a3b8' }}
          >
            {ARMY_ICONS[army] ? (
              <img className="vsx-army-icon" src={ARMY_ICONS[army]} alt="" draggable={false} />
            ) : null}
            <span className="vsx-army-name">{army}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function VersusCover({ entry, coverStyle, mirror, opening, spin, backImage }) {
  return (
    <div className="vsx-ticket" aria-label={`Esercito: ${entry.name}`}>
      <div className="vsx-ticket-scale">
        <DeckTicket
          deck={entry}
          number={1}
          total={1}
          offset={0}
          isCenter
          visible
          coverStyle={coverStyle}
          mirror={mirror}
          coverOpening={opening}
          coverSpin={spin}
          coverBackImage={backImage}
        />
      </div>
    </div>
  );
}

function VersusEminenceCard({ eminence, reason }) {
  if (!eminence) {
    return (
      <div className="vsx-em vsx-em--none">
        <div className="vsx-em-scale vsx-em-empty">
          <span className="vsx-em-empty-eye">EMINENZA</span>
          <span className="vsx-em-empty-txt">{reason}</span>
        </div>
      </div>
    );
  }
  const frame = getEminenceArtFrame(eminence.id);
  return (
    <div className="vsx-em" aria-label={`Eminenza: ${eminence.name}`}>
      <div className="vsx-em-scale">
        <EminenceTarotCard
          name={eminence.name}
          army={eminence.army}
          staticText={eminence.static?.name || ''}
          presence={eminence.initialPresence ?? 0}
          artUrl={getEminenceArtUrl(eminence)}
          accent={ARMY_COLORS[eminence.army]?.accent || '#c9a227'}
          intensity={0.9}
          tiltEnabled={false}
          idleOrbit
          artX={frame.artX}
          artY={frame.artY}
          artZoom={frame.zoom}
          artFocusX={frame.focusX}
          artFocusY={frame.focusY}
        />
      </div>
    </div>
  );
}

function VersusEminenceBanner({ eminence, reason }) {
  return (
    <div className={`vsx-em-banner${eminence ? '' : ' is-none'}`}>
      <span className="vsx-em-banner-eye">EMINENZA</span>
      {eminence ? (
        <>
          <span className="vsx-em-banner-name">{eminence.name}</span>
          {eminence.static ? (
            <span className="vsx-em-banner-static">
              <b>{eminence.static.name}</b> — {eminence.static.text}
            </span>
          ) : null}
        </>
      ) : (
        <span className="vsx-em-banner-static">{reason}</span>
      )}
    </div>
  );
}

function VersusSide({ side, identity, entry, layout, coverStyle, em, opening, spin, backImage }) {
  // Slot destro: la scatola è specchiata così il dorso guarda il centro.
  const mirror = side === 'r';
  const showCard = layout === 'side' || layout === 'hero';
  const cover = <VersusCover entry={entry} coverStyle={coverStyle} mirror={mirror} opening={opening} spin={spin} backImage={backImage} />;
  return (
    <div className={`vsx-side vsx-side--${side}`} style={{ '--accent': entry.accent }}>
      <header className="vsx-who">
        <span className="vsx-who-eyebrow">{identity.eyebrow}</span>
        <span className="vsx-who-name">{identity.name}</span>
        {identity.sub ? <span className="vsx-who-sub">{identity.sub}</span> : null}
      </header>

      {showCard ? (
        <div className="vsx-stage">
          <div className="vsx-stage-cover">{cover}</div>
          <div className="vsx-stage-em">
            <VersusEminenceCard eminence={em.eminence} reason={em.reason} />
          </div>
        </div>
      ) : (
        cover
      )}

      {layout === 'shadow' ? <VersusEminenceBanner eminence={em.eminence} reason={em.reason} /> : null}

      <VersusArmies armies={entry.armies} />
    </div>
  );
}

function halfBackground(entry, em, layout) {
  if (layout === 'shadow' && em.eminence) return getEminenceArtUrl(em.eminence);
  return entry.bg || null;
}

/**
 * @param {object} props
 * @param {{ eyebrow: string, name: string, sub?: string|null }} props.playerIdentity
 * @param {{ eyebrow: string, name: string, sub?: string|null }} props.enemyIdentity
 * @param {{ army: string, deckKey?: string|null, cardIds?: number[]|null, name?: string|null, coverCardId?: number|null }} props.playerDeck
 * @param {{ army: string, deckKey?: string|null, cardIds?: number[]|null, name?: string|null, coverCardId?: number|null }} props.enemyDeck
 * @param {'base'|'side'|'hero'|'shadow'} [props.layout]
 * @param {'ticket'|'fullart'|'box'|'tarot'} [props.coverStyle]
 * @param {string} [props.eminenceFormat] EMINENCE_FORMAT.*
 * @param {string|null} [props.playerEminenceId] da eminenceMatchState, se già deciso
 * @param {string|null} [props.enemyEminenceId]
 * @param {{ open?: boolean, spin?: boolean, awaken?: boolean, impact?: boolean, parallax?: boolean }} [props.fx]
 * @param {string|null} [props.playerCardBack] dorso carte del giocatore (in partita quello del match)
 * @param {string|null} [props.enemyCardBack] dorso carte dell'avversario
 * @param {number|null} [props.progress] 0–100; null nasconde la barra
 * @param {string} [props.statusLabel]
 * @param {{ stage: 'spin'|'stop'|'reveal', handoff?: { rect: object }|null }|null} [props.intro]
 *   ingresso a tappe: prima solo il tuo lato (la scatola vola dalla scelta esercito), a sinistra
 *   la ruota delle armate gira al buio; 'stop' la ferma sull'avversario, 'reveal' fa partire il VS.
 */
export function DuelVersusScreen({
  playerIdentity,
  enemyIdentity,
  playerDeck,
  enemyDeck,
  layout = 'base',
  coverStyle = 'ticket',
  eminenceFormat = EMINENCE_FORMAT.REQUIRED,
  playerEminenceId = null,
  enemyEminenceId = null,
  fx = {},
  playerCardBack = null,
  enemyCardBack = null,
  progress = null,
  statusLabel = 'Preparazione scontro',
  intro = null,
}) {
  const rootRef = useRef(null);
  const introHeld = Boolean(intro) && intro.stage !== 'reveal';
  const [handoff] = useState(() => intro?.handoff || null);
  // Dorsi: quelli della partita se passati, altrimenti due dorsi casuali distinti (come in partita).
  const [randomBacks] = useState(() => pickDistinctCardBackPair());
  const playerBack = playerCardBack || randomBacks.playerCardBack;
  const enemyBack = enemyCardBack || randomBacks.enemyCardBack;
  const opening = Boolean(fx.open) && coverStyle === 'box';
  // la rotazione della scatola parte solo a VS avviato (il suo ritardo conta da lì)
  const spin = Boolean(fx.spin) && coverStyle === 'box' && !introHeld;
  // Parallasse: variabili CSS sul root, senza re-render a ogni movimento.
  const onPointerMove = useCallback((e) => {
    const el = rootRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', (((e.clientX - r.left) / r.width) * 2 - 1).toFixed(3));
    el.style.setProperty('--my', (((e.clientY - r.top) / r.height) * 2 - 1).toFixed(3));
  }, []);
  const playerEntry = useMemo(() => buildDeckTicketEntry(playerDeck || {}), [playerDeck]);
  const enemyEntry = useMemo(() => buildDeckTicketEntry(enemyDeck || {}), [enemyDeck]);
  const playerEm = useMemo(
    () => resolveVersusEminence(playerEntry, eminenceFormat, playerEminenceId),
    [playerEntry, eminenceFormat, playerEminenceId]
  );
  const enemyEm = useMemo(
    () => resolveVersusEminence(enemyEntry, eminenceFormat, enemyEminenceId),
    [enemyEntry, eminenceFormat, enemyEminenceId]
  );
  const p = progress == null ? null : Math.min(100, Math.max(0, Number(progress) || 0));
  const playerBg = halfBackground(playerEntry, playerEm, layout);
  const enemyBg = halfBackground(enemyEntry, enemyEm, layout);
  // La scatola vola dal punto in cui era nella scelta esercito al suo posto nel VS.
  // Il volo parte solo quando i fotogrammi scorrono regolari: se il montaggio del VS
  // blocca il disegno, la scatola resta ferma dov'era invece di saltare a metà volo.
  const onFlightDoneRef = useRef(intro?.onFlightDone);
  onFlightDoneRef.current = intro?.onFlightDone;
  useLayoutEffect(() => {
    const done = () => onFlightDoneRef.current?.();
    const root = rootRef.current;
    const wrap = root?.querySelector('.vsx-side--r .vsx-ticket');
    const tk = wrap?.querySelector('.dsk-tk');
    const cube = wrap?.querySelector('.dcv-box-cube');
    if (!handoff?.rect || !wrap || !tk || typeof wrap.animate !== 'function') {
      done();
      return undefined;
    }
    const fin = tk.getBoundingClientRect();
    const k = root.getBoundingClientRect().width / 1920 || 1;
    const o = handoff.rect;
    const dx = (o.left + o.width / 2 - (fin.left + fin.width / 2)) / k;
    const dy = (o.top + o.height / 2 - (fin.top + fin.height / 2)) / k;
    const sc = fin.width ? o.width / fin.width : 1;
    const FLIGHT_MS = 1150;
    // volo ad arco: si stacca, sale girandosi verso il centro e scende al suo posto
    const fly = wrap.animate(
      [
        { transform: `translate(${dx}px, ${dy}px) scale(${sc})`, easing: 'cubic-bezier(.5,0,.6,1)' },
        { transform: `translate(${dx * 0.45}px, ${dy * 0.45 - 140}px) scale(${(sc + 1) / 2 + 0.08}) rotate(-4deg)`, offset: 0.45, easing: 'cubic-bezier(.3,0,.2,1)' },
        { transform: 'translate(0, 8px) scale(1.02)', offset: 0.88 },
        { transform: 'none' },
      ],
      { duration: FLIGHT_MS, fill: 'both' }
    );
    // e intanto si gira dalla posa della scelta esercito a quella del VS (dorso verso il centro)
    const endPose = cube ? getComputedStyle(cube).transform : null;
    const turn = cube && endPose && endPose !== 'none'
      ? cube.animate(
          [
            { transform: 'translate(-50%, -50%) rotateX(-7deg) rotateY(-32deg)' },
            { transform: endPose },
          ],
          { duration: FLIGHT_MS, easing: 'cubic-bezier(.6,0,.2,1)', fill: 'backwards' }
        )
      : null;
    fly.pause();
    turn?.pause();
    let raf = 0;
    let prev = 0;
    let calm = 0;
    let started = false;
    const t0 = performance.now();
    const wait = (now) => {
      calm = prev && now - prev < 40 ? calm + 1 : 0;
      prev = now;
      // tre fotogrammi regolari di fila (o al massimo 1,5 s di attesa): si parte
      if (calm >= 3 || now - t0 > 1500) {
        started = true;
        fly.play();
        turn?.play();
        fly.finished.then(() => { fly.cancel(); done(); }, () => {});
        return;
      }
      raf = requestAnimationFrame(wait);
    };
    raf = requestAnimationFrame(wait);
    return () => {
      // (StrictMode rimonta: niente animazioni ferme lasciate sulla scatola)
      cancelAnimationFrame(raf);
      if (!started) {
        fly.cancel();
        turn?.cancel();
      }
    };
  }, [handoff]);

  // voci del sorteggio: le armate, o gli eserciti dell'armata nemica se l'ha scelta il giocatore
  const deckArmy = intro?.deckArmy || null;
  const reel = useMemo(() => {
    const armies = EMINENCE_ARMY_ORDER.filter((a) => ARMY_COLORS[a]);
    const enemyArmy = enemyEntry.armies?.[0] || enemyDeck?.army || null;
    if (enemyArmy && !armies.includes(enemyArmy)) armies.push(enemyArmy);
    return buildRouletteItems({ armies, enemyArmy, enemyDeckKey: enemyDeck?.deckKey || null, deckArmy });
  }, [enemyEntry, enemyDeck, deckArmy]);

  const fxClass = [
    intro && 'vsx-has-intro',
    introHeld && 'vsx-intro',
    handoff && 'vsx-intro-handoff',
    opening && 'vsx-fx-open',
    fx.awaken && 'vsx-fx-awaken',
    fx.impact && 'vsx-fx-impact',
    fx.parallax && 'vsx-fx-parallax',
  ].filter(Boolean).map((c) => ` ${c}`).join('');

  return (
    <div
      ref={rootRef}
      className={`vsx vsx-lay-${layout} vsx-cover-${coverStyle}${fxClass}`}
      style={{ '--la': enemyEntry.accent, '--ra': playerEntry.accent }}
      role="presentation"
      onPointerMove={fx.parallax ? onPointerMove : undefined}
    >
      <DeckSelectStyles />

      {/* Slot: avversario sempre a sinistra, chi guarda sempre a destra (anche online, ognuno dal suo client). */}
      {/* il sorteggio sta sotto la metà nemica: quando parte il VS la lastra ci passa sopra */}
      {intro ? (
        <VersusRoulette
          items={reel.items}
          targetKey={reel.targetKey}
          mode={reel.mode}
          stopping={intro.stage !== 'spin'}
          leaving={intro.stage === 'reveal'}
        />
      ) : null}
      <div className="vsx-half vsx-half--l">
        <div className="vsx-half-bg" style={{ backgroundImage: enemyBg ? `url('${enemyBg}')` : 'none' }} />
        <div className="vsx-half-tint" />
        <div className="vsx-half-glow" />
      </div>
      <div className="vsx-half vsx-half--r">
        <div className="vsx-half-bg" style={{ backgroundImage: playerBg ? `url('${playerBg}')` : 'none' }} />
        <div className="vsx-half-tint" />
        <div className="vsx-half-glow" />
      </div>
      <div className="vsx-seam" aria-hidden />

      <VersusSide side="l" identity={enemyIdentity} entry={enemyEntry} layout={layout} coverStyle={coverStyle} em={enemyEm} opening={opening} spin={spin} backImage={enemyBack} />
      <VersusSide side="r" identity={playerIdentity} entry={playerEntry} layout={layout} coverStyle={coverStyle} em={playerEm} opening={opening} spin={spin} backImage={playerBack} />

      <div className="vsx-vs" aria-label="contro">
        <div className="vsx-vs-ring" />
        <div className="vsx-vs-flash" />
        <span className="vsx-vs-v">V</span>
        <span className="vsx-vs-s">S</span>
      </div>

      {fx.impact ? (
        <div className="vsx-sparks" aria-hidden>
          {SPARKS.map((sp, i) => <span key={i} style={{ '--a': sp.a, '--d': sp.d }} />)}
        </div>
      ) : null}

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

export default DuelVersusScreen;

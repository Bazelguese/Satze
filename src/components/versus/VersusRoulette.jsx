// ============================================================
// VersusRoulette.jsx — il sorteggio dell'avversario nella metà nemica del VS
// ============================================================
// Mentre il duello si carica la metà nemica, ancora al buio, si accende una
// ruota della fortuna a fasce inclinate (arte, icona, nome, sottotitolo):
// si carica all'indietro, prende la spinta, gira a velocità leggibile e con
// `stopping` frena per attrito fino a fermarsi sull'avversario, con un piccolo
// rimbalzo indietro sulla lancetta.
// Le voci sono le armate, oppure gli eserciti dell'armata nemica se il
// giocatore l'ha scelta lui (vedi buildRouletteItems).
// Il movimento è una funzione del tempo (createReelMotion) che viene
// campionata in Web Animations sul `transform` del nastro: gira sul
// compositor, quindi resta fluido anche mentre il caricamento occupa il thread
// principale. Il thread principale segue la stessa funzione solo per scatti,
// lancette, colore e nome.
// ============================================================

import React, { useEffect, useRef, useState } from 'react';
import { ARMY_COLORS, ARMY_ICONS, ARMY_GIFS } from '../../data/armies.js';
import { ARMY_DECKS } from '../../data/cards.js';
import { ARMY_LORE } from '../menu/cosmic/armyLore.js';
import { buildDeckTicketEntry } from '../menu/cosmic/DeckSelectCinematic.jsx';
import { playSound } from '../../audio/soundBus';
import { UI_SOUND, GAME_SOUND } from '../../audio/soundCatalog';

/** Altezza di una fascia (px, canvas 1920×1080). */
const BAND_H = 250;
/** Le fasce si accendono, poi la ruota parte. */
const POWER_ON_MS = 380;
/** Carica: la ruota arretra di WIND voci prima della spinta. */
const WIND = 0.22;
const WIND_MS = 340;
/** Spinta: da ferma a VMAX (voci/ms) in SPINUP_MS. */
const SPINUP_MS = 1100;
const VMAX = 7 / 1000;
/** Frenata: velocità ∝ (1-u)^(k-1); k più alto = coda più lenta e lunga. */
const STOP_K = 2.8;
const STOP_NOMINAL_MS = 4600;
const STOP_MIN_MS = 3800;
const STOP_MAX_MS = 6000;
/** Supera il centro di poco e torna indietro (il «clack» della lancetta). */
const OVERSHOOT = 0.14;
const SETTLE_MS = 480;

/** Durata massima dalla richiesta di fermata all'arrivo (per chi aspetta senza callback). */
export const ROULETTE_STOP_MAX_MS = STOP_MAX_MS + SETTLE_MS + 100;

const SPARKS = Array.from({ length: 16 }, (_, i) => ({
  a: `${Math.round((360 / 16) * i + ((i * 37) % 13))}deg`,
  d: `${150 + ((i * 53) % 140)}px`,
}));

const mod = (x, n) => ((x % n) + n) % n;
const easeInOut = (u) => (u < 0.5 ? 2 * u * u : 1 - ((-2 * u + 2) ** 2) / 2);
const reelTransform = (p) => `translate3d(0, ${(-p * BAND_H).toFixed(2)}px, 0)`;

/**
 * Posizione della ruota (in voci, non avvolta) in funzione del tempo del documento.
 * @param {number} t0 inizio della carica
 */
function createReelMotion(t0, { phase = 0, stopMs = null } = {}) {
  const tSpin = t0 + WIND_MS;
  const tCruise = tSpin + SPINUP_MS;
  // integrale di v(u) = VMAX·(1-(1-u)²): accelerazione che si spegne dolcemente in crociera
  const spin = (u) => u - (1 - (1 - u) ** 3) / 3;
  // `phase`: voce di partenza (le ruote del VS a più giocatori partono da punti diversi)
  const pCruise = phase - WIND + VMAX * SPINUP_MS * spin(1);
  let stop = null;

  const free = (t) => {
    if (t <= t0) return phase;
    if (t < tSpin) return phase - WIND * easeInOut((t - t0) / WIND_MS);
    if (t < tCruise) return phase - WIND + VMAX * SPINUP_MS * spin((t - tSpin) / SPINUP_MS);
    return pCruise + VMAX * (t - tCruise);
  };

  const posAt = (t) => {
    if (!stop || t < stop.at) return free(t);
    const e = t - stop.at;
    if (e < stop.T) return stop.p0 + stop.D * (1 - (1 - e / stop.T) ** stop.k);
    return stop.land + OVERSHOOT * (1 - easeInOut(Math.min(1, (e - stop.T) / SETTLE_MS)));
  };

  /** Fermata da `at` sulla prima voce `targetIdx` raggiungibile con una frenata naturale. */
  const planStop = (at, targetIdx, n) => {
    const p0 = free(at);
    const v0 = Math.max(VMAX * 0.35, (p0 - free(at - 8)) / 8);
    const dNat = (v0 * (stopMs || STOP_NOMINAL_MS)) / STOP_K;
    let land = Math.ceil(p0 + dNat * 0.75 - OVERSHOOT);
    while (mod(land, n) !== targetIdx) land += 1;
    const D = land + OVERSHOOT - p0;
    // velocità iniziale della frenata = D·k/T: durata e k scelti per non avere strappi.
    // Con `stopMs` la durata è fissa: più ruote frenate insieme si fermano nello stesso istante.
    const T = stopMs || Math.min(STOP_MAX_MS, Math.max(STOP_MIN_MS, (STOP_K * D) / v0));
    const k = Math.max(1.6, (v0 * T) / D);
    stop = { at, p0, D, T, k, land, end: at + T + SETTLE_MS };
    return stop;
  };

  return { t0, tCruise, pCruise, posAt, planStop, get stop() { return stop; } };
}

/**
 * Fotogrammi chiave del nastro fra `from` e `to`, avvolti dentro un giro: al
 * passaggio di giro due fotogrammi con lo stesso offset (contenuto identico).
 */
function sampleReelKeyframes(posAt, from, to, n) {
  const dur = Math.max(1, to - from);
  const steps = Math.max(2, Math.ceil(dur / (1000 / 60)));
  const frames = [];
  let prev = null;
  for (let i = 0; i <= steps; i += 1) {
    const offset = i / steps;
    const p = posAt(from + dur * offset);
    const lap = Math.floor(p / n);
    if (prev && prev.lap !== lap) {
      const edge = Math.max(prev.lap, lap) * n;
      const f = prev.offset + (offset - prev.offset) * ((edge - prev.p) / (p - prev.p));
      frames.push({ offset: f, transform: reelTransform(edge - prev.lap * n) });
      frames.push({ offset: f, transform: reelTransform(edge - lap * n) });
    }
    frames.push({ offset, transform: reelTransform(p - lap * n) });
    prev = { p, lap, offset };
  }
  return frames;
}

/**
 * Voci del rullo. Con `deckArmy` (armata nemica scelta dal giocatore) sono
 * gli eserciti di quell'armata e il bersaglio è l'esercito nemico; altrimenti
 * le armate e il bersaglio è l'armata nemica.
 * @returns {{ items: object[], targetKey: string|null, mode: 'armies'|'decks' }}
 */
export function buildRouletteItems({ armies, enemyArmy, enemyDeckKey, deckArmy }) {
  const decks = deckArmy ? ARMY_DECKS[deckArmy] : null;
  if (decks && enemyDeckKey && decks[enemyDeckKey] && Object.keys(decks).length > 1) {
    const items = Object.keys(decks).map((key) => {
      const e = buildDeckTicketEntry({ army: deckArmy, deckKey: key });
      return {
        key,
        label: e.name,
        sub: `${e.leader?.name || deckArmy} · LEGA ${e.totalLeague ?? 30}`,
        art: ARMY_GIFS[deckArmy] || null,
        portrait: e.leader?.img || null,
        icon: ARMY_ICONS[deckArmy] || null,
        accent: ARMY_COLORS[deckArmy]?.accent || '#94a3b8',
      };
    });
    return { items, targetKey: enemyDeckKey, mode: 'decks' };
  }
  const items = armies.map((army) => ({
    key: army,
    label: army,
    sub: ARMY_LORE[army]?.motto || '',
    art: ARMY_GIFS[army] || null,
    portrait: null,
    icon: ARMY_ICONS[army] || null,
    accent: ARMY_COLORS[army]?.accent || '#94a3b8',
  }));
  return { items, targetKey: enemyArmy, mode: 'armies' };
}

/** Durata fissa della frenata per le ruote che devono fermarsi insieme (VS a più giocatori). */
export const ROULETTE_SHARED_STOP_MS = STOP_NOMINAL_MS;

/**
 * @param {{ items: object[], targetKey: string|null, mode: 'armies'|'decks', stopping: boolean, leaving: boolean, onLanded?: () => void }} props
 * Per il VS a più giocatori (una ruota per colonna):
 *   column      { left, width, clip } in px del canvas 1920×1080: la ruota sta nella sua colonna
 *   phase       voce da cui parte la ruota
 *   stopMs      durata fissa della frenata (tutte le ruote si fermano insieme)
 *   muted       niente suoni (li fa una sola ruota)
 *   hideNeedles lancette e finestra condivise, disegnate da chi ospita le ruote
 *   onTick(spd) a ogni fascia che passa sotto la lancetta
 *   eyebrows    { spin, landed } testi sopra il nome
 */
export function VersusRoulette({
  items, targetKey, mode = 'armies', stopping, leaving, onLanded,
  column = null, phase = 0, stopMs = null, muted = false, hideNeedles = false, onTick = null, eyebrows = null,
}) {
  const n = Math.max(1, items.length);
  const targetIdx = Math.max(0, items.findIndex((it) => it.key === targetKey));
  const rootRef = useRef(null);
  const trackRef = useRef(null);
  const glowRef = useRef(null);
  const streaksRef = useRef(null);
  const flashRef = useRef(null);
  const needleLRef = useRef(null);
  const needleRRef = useRef(null);
  const nameRef = useRef(null);
  const engineRef = useRef(null);
  const onLandedRef = useRef(onLanded);
  onLandedRef.current = onLanded;
  const onTickRef = useRef(onTick);
  onTickRef.current = onTick;
  const [landed, setLanded] = useState(false);
  const [firstAccent] = useState(() => items[0]?.accent || '#f5f3eb');
  // abbastanza giri di fasce da coprire la metà schermo anche con 2-3 eserciti
  const laps = Math.max(1, Math.ceil(7 / n));

  useEffect(() => {
    const root = rootRef.current;
    const track = trackRef.current;
    if (!root || !track) return undefined;
    const timeline = document.timeline;
    const nowT = () => (timeline?.currentTime ?? performance.now());
    const motion = createReelMotion(nowT() + POWER_ON_MS, { phase, stopMs });
    const bandsByItem = Array.from({ length: n }, () => []);
    root.querySelectorAll('.vsr-band').forEach((el) => {
      bandsByItem[Number(el.dataset.item)]?.push(el);
    });
    const anims = [];
    const canAnimate = typeof track.animate === 'function';
    if (canAnimate) {
      // carica + spinta, poi crociera: un giro lineare ripetuto (il contenuto è identico giro dopo giro)
      const spinUp = track.animate(
        sampleReelKeyframes(motion.posAt, motion.t0, motion.tCruise, n),
        { duration: motion.tCruise - motion.t0, fill: 'both' }
      );
      spinUp.startTime = motion.t0;
      const cruise = track.animate(
        [{ transform: reelTransform(0) }, { transform: reelTransform(n) }],
        { duration: n / VMAX, iterations: Infinity, iterationStart: mod(motion.pCruise, n) / n }
      );
      cruise.startTime = motion.tCruise;
      anims.push(spinUp, cruise);
    }

    let raf = 0;
    let lastShown = null;
    let lastTick = 0;
    let lastSpd = -1;
    let flashAnim = null;

    const highlight = (idx) => {
      root.querySelectorAll('.vsr-band.on').forEach((el) => el.classList.remove('on'));
      bandsByItem[idx].forEach((el) => el.classList.add('on'));
      const it = items[idx];
      if (it) {
        root.style.setProperty('--cur', it.accent || '#f5f3eb');
        if (nameRef.current) nameRef.current.textContent = it.label;
      }
    };
    const tick = (spd) => {
      onTickRef.current?.(spd);
      // la lancetta: a ruota lenta scatta ampia e ricade piano, a ruota veloce vibra
      const swing = -(8 + 10 * (1 - spd));
      const dur = 150 + 230 * (1 - spd);
      [needleLRef.current, needleRRef.current].forEach((el, i) => {
        el?.animate(
          [{ transform: `rotate(${i ? -swing : swing}deg)` }, { transform: 'rotate(0deg)' }],
          { duration: dur, easing: 'cubic-bezier(.2,1.6,.4,1)' }
        );
      });
      flashAnim?.cancel();
      flashAnim = flashRef.current?.animate(
        [{ opacity: 0.35 + 0.35 * (1 - spd) }, { opacity: 0 }],
        { duration: 260 + 200 * (1 - spd), easing: 'ease-out' }
      ) || null;
    };

    const frame = (now) => {
      const p = motion.posAt(now);
      const v = Math.max(0, (p - motion.posAt(now - 16)) / 16);
      const spd = Math.min(1, v / VMAX);
      const q = Math.round(spd * 20) / 20;
      if (q !== lastSpd) {
        lastSpd = q;
        if (glowRef.current) glowRef.current.style.opacity = String(0.35 + q * 0.5);
        if (streaksRef.current) streaksRef.current.style.opacity = String(q * q * 0.75);
      }
      if (!canAnimate) track.style.transform = reelTransform(mod(p, n));
      const s = Math.round(p);
      if (s !== lastShown) {
        const first = lastShown == null;
        lastShown = s;
        highlight(mod(s, n));
        if (!first) {
          tick(spd);
          if (!muted && now - lastTick > 45) {
            lastTick = now;
            playSound(UI_SOUND.NAVIGATE);
          }
        }
      }
      const stop = motion.stop;
      if (stop && now >= stop.end) {
        // resta la frenata (ferma sull'ultimo fotogramma); carica e crociera non servono più
        anims.slice(0, -1).forEach((a) => a.cancel());
        highlight(mod(stop.land, n));
        if (!muted) playSound(GAME_SOUND.LOCK_IN);
        setLanded(true);
        onLandedRef.current?.();
        return;
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    engineRef.current = {
      stop() {
        if (motion.stop) return;
        // qualche fotogramma avanti: il compositor non è ancora passato da lì
        const stop = motion.planStop(nowT() + 50, targetIdx, n);
        if (!canAnimate) return;
        const brake = track.animate(
          sampleReelKeyframes(motion.posAt, stop.at, stop.end, n),
          { duration: stop.end - stop.at, fill: 'forwards' }
        );
        brake.startTime = stop.at;
        anims.push(brake);
      },
    };

    return () => {
      cancelAnimationFrame(raf);
      engineRef.current = null;
      flashAnim?.cancel();
      anims.forEach((a) => a.cancel());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (stopping) engineRef.current?.stop();
  }, [stopping]);

  const lapList = Array.from({ length: laps * 2 + 1 }, (_, k) => k - laps);

  return (
    <div
      ref={rootRef}
      className={`vsr vsr--${mode}${column ? ' vsr--col' : ''}${hideNeedles ? ' vsr--shared' : ''}${landed ? ' is-landed' : ''}${leaving ? ' is-leaving' : ''}`}
      style={{
        '--cur': firstAccent, '--n': n, '--h': `${BAND_H}px`,
        ...(column ? { '--cl': `${column.left}px`, '--cw': `${column.width}px`, clipPath: column.clip } : null),
      }}
      aria-hidden="true"
    >
      <div className="vsr-glow" ref={glowRef} />
      <div className="vsr-reel-box">
        <div className="vsr-reel">
          <div className="vsr-track" ref={trackRef}>
            {lapList.flatMap((lap) =>
              items.map((it, i) => {
                const idx = lap * n + i;
                return (
                  <div
                    key={`${lap}-${it.key}`}
                    className="vsr-band"
                    data-item={i}
                    style={{
                      '--i': idx,
                      // accensione: dal centro verso fuori, una fascia dopo l'altra
                      '--on': `${Math.min(Math.abs(idx), Math.abs(idx - n)) * 55}ms`,
                      '--c': it.accent,
                    }}
                  >
                    {it.art ? <span className="vsr-art" style={{ backgroundImage: `url('${it.art}')` }} /> : <span className="vsr-art" />}
                    {it.portrait ? <span className="vsr-portrait" style={{ backgroundImage: `url('${it.portrait}')` }} /> : null}
                    <span className="vsr-band-tint" />
                    {it.icon ? <img className="vsr-band-icon" src={it.icon} alt="" draggable={false} /> : null}
                    <span className="vsr-band-txt">
                      <b>{it.label}</b>
                      <small>{it.sub}</small>
                    </span>
                  </div>
                );
              })
            )}
          </div>
          {/* scie di velocità: si vedono solo quando la ruota corre */}
          <div className="vsr-streaks" ref={streaksRef} />
        </div>
        <div className="vsr-reel-window">
          <span className="vsr-shade" />
          <span className="vsr-flash" ref={flashRef} />
          <span className="vsr-centerline" />
          <span className="vsr-needle vsr-needle--l"><i ref={needleLRef} /></span>
          <span className="vsr-needle vsr-needle--r"><i ref={needleRRef} /></span>
        </div>
        {landed ? (
          <div className="vsr-sparks">
            {SPARKS.map((sp, i) => <span key={i} style={{ '--a': sp.a, '--d': sp.d }} />)}
          </div>
        ) : null}
      </div>

      <div className="vsr-caption">
        <span className="vsr-eye">
          {eyebrows
            ? (landed ? eyebrows.landed : eyebrows.spin)
            : landed
              ? (mode === 'decks' ? 'ESERCITO AVVERSARIO' : 'IL TUO AVVERSARIO')
              : (mode === 'decks' ? 'SORTEGGIO DELL’ESERCITO' : 'SORTEGGIO DELL’AVVERSARIO')}
        </span>
        <span className="vsr-name" ref={nameRef}>{items[0]?.label}</span>
      </div>
      <VersusRouletteStyles />
    </div>
  );
}

function VersusRouletteStyles() {
  return (
    <style>{`
      /* la metà sinistra del VS: stesso taglio diagonale della .vsx-half--l */
      .vsr {
        position: absolute; inset: 0; z-index: 0; pointer-events: none; overflow: hidden;
        clip-path: polygon(0 0, 56% 0, 44% 100%, 0 100%);
        background: #050507;
        font-family: 'Chakra Petch', sans-serif; color: #f5f3eb;
        transition: opacity .4s ease .5s;
      }
      .vsr.is-leaving { opacity: 0; }
      .vsr * { box-sizing: border-box; }
      .vsr-art { position: absolute; inset: 0; background: #111116 center / cover no-repeat; }

      /* alone del colore corrente dietro al rullo, più forte quando corre */
      .vsr-glow {
        position: absolute; left: -10%; top: 50%; width: 90%; height: 520px; margin-top: -260px;
        background: radial-gradient(ellipse at 40% 50%, color-mix(in srgb, var(--cur) 45%, transparent), transparent 70%);
        opacity: 0.35; transition: background .25s;
      }

      /* ---------- rullo ---------- */
      .vsr-reel-box {
        position: absolute; inset: 0;
        -webkit-mask-image: linear-gradient(180deg, transparent 0%, #000 22%, #000 78%, transparent 100%);
        mask-image: linear-gradient(180deg, transparent 0%, #000 22%, #000 78%, transparent 100%);
      }
      .vsr-reel {
        position: absolute; left: -60px; right: 40%; top: 540px; transform: skewY(-4deg);
        animation: vsr-reel-in .6s cubic-bezier(.2,.9,.25,1) both;
      }
      @keyframes vsr-reel-in { from { transform: skewY(-4deg) translateX(-38%); } }
      /* il nastro scorre solo col transform (livello proprio, niente layout per fotogramma) */
      .vsr-track { position: absolute; left: 0; right: 0; top: 0; height: 0; will-change: transform; }
      .vsr-band {
        position: absolute; left: 0; right: 0; height: calc(var(--h) - 14px);
        top: calc(var(--i) * var(--h) - var(--h) / 2 + 7px);
        overflow: hidden; box-shadow: inset 0 0 0 2px rgba(245,243,235,0.12);
        /* accensione da insegna al neon: sfarfalla e poi resta accesa */
        animation: vsr-band-on .5s steps(1, end) var(--on) both, vsr-band-glow .8s ease-out var(--on) both;
      }
      @keyframes vsr-band-on {
        0% { opacity: 0; }
        12% { opacity: .85; }
        22% { opacity: .1; }
        34% { opacity: 1; }
        46% { opacity: .35; }
        58%, 100% { opacity: 1; }
      }
      @keyframes vsr-band-glow { from { filter: brightness(2.2) saturate(1.4); } }
      .vsr-band .vsr-art { filter: brightness(0.4) saturate(1.1); }
      .vsr-portrait {
        position: absolute; right: 0; top: 0; bottom: 0; width: 46%; background: center 20% / cover no-repeat;
        -webkit-mask-image: linear-gradient(90deg, transparent, #000 45%); mask-image: linear-gradient(90deg, transparent, #000 45%);
        filter: brightness(0.6);
      }
      .vsr-band.on .vsr-portrait { filter: brightness(0.95); }
      .vsr-band-tint { position: absolute; inset: 0; background: linear-gradient(90deg, color-mix(in srgb, var(--c) 45%, transparent) 0%, transparent 55%); }
      .vsr-band::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 14px; background: var(--c); z-index: 2; }
      /* contenuto fra le due lancette: icona dopo quella sinistra, testo che finisce prima di quella destra */
      .vsr-band-icon { position: absolute; left: 134px; top: 50%; width: 120px; height: 120px; margin-top: -60px; object-fit: contain; z-index: 2; filter: drop-shadow(0 0 10px rgba(0,0,0,.8)); }
      .vsr-band-txt { position: absolute; left: 272px; right: 276px; top: 50%; transform: translateY(-50%); z-index: 2; display: flex; flex-direction: column; gap: 8px; }
      .vsr-band-txt b { font-weight: 700; font-style: italic; font-size: 50px; line-height: 0.95; text-transform: uppercase; text-shadow: 4px 4px 0 #050507; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .vsr--decks .vsr-band-txt b { font-size: 44px; }
      .vsr-band-txt small { font-weight: 600; font-size: 18px; opacity: 0.8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .vsr-band.on .vsr-art { filter: brightness(0.75) saturate(1.2); }
      .vsr-band.on .vsr-band-txt b { color: var(--c); }

      /* scie verticali: compaiono con la velocità */
      .vsr-streaks {
        position: absolute; left: 0; right: 0; top: -700px; height: 1400px; z-index: 3;
        background:
          repeating-linear-gradient(90deg, transparent 0 46px, rgba(245,243,235,0.16) 46px 48px, transparent 48px 120px),
          linear-gradient(180deg, rgba(5,5,7,0.55), transparent 30%, transparent 70%, rgba(5,5,7,0.55));
        opacity: 0;
      }

      /* finestra: i bordi si tracciano, le lancette scattano dentro.
         Stesso riquadro orizzontale di .vsr-reel: lo skew ha lo stesso centro, così i bordi
         cadono nello stacco fra le fasce; a destra la taglia la diagonale come le fasce. */
      .vsr-reel-window {
        position: absolute; left: -60px; right: 40%; top: 540px; height: 256px; margin-top: -128px; z-index: 6;
        transform: skewY(-4deg);
        animation: vsr-fade .5s ease .3s both;
      }
      /* fuori dalla finestra le fasce si abbassano: la voce sotto le lancette stacca */
      .vsr-shade { position: absolute; inset: 0; box-shadow: 0 0 0 1400px rgba(5,5,7,0.5); }
      /* bordi: riga chiara su una fascia scura (si legge su qualsiasi arte) + alone del colore corrente */
      .vsr-reel-window::before, .vsr-reel-window::after {
        content: ''; position: absolute; transform-origin: left center;
        animation: vsr-draw .5s cubic-bezier(.6,0,.2,1) .25s both;
      }
      .vsr-reel-window::before {
        inset: -4px 0; border-top: 14px solid rgba(5,5,7,0.92); border-bottom: 14px solid rgba(5,5,7,0.92);
      }
      .vsr-reel-window::after {
        inset: 0; border-top: 6px solid #f5f3eb; border-bottom: 6px solid #f5f3eb;
        box-shadow: 0 0 22px 2px color-mix(in srgb, var(--cur) 70%, transparent), inset 0 0 22px 2px color-mix(in srgb, var(--cur) 70%, transparent);
      }
      @keyframes vsr-draw { from { transform: scaleX(0); } }
      @keyframes vsr-fade { from { opacity: 0; } }
      .vsr.is-landed .vsr-reel-window::after { border-color: var(--cur); }
      .vsr.is-landed .vsr-reel-window { animation: vsr-win-pop .55s cubic-bezier(.2,1.6,.4,1) both; }
      @keyframes vsr-win-pop { 40% { transform: skewY(-4deg) scale(1.05); } }
      /* lampo a ogni fascia che passa sotto le lancette (acceso da JS a ogni scatto) */
      .vsr-flash {
        position: absolute; inset: 6px 0; background: linear-gradient(90deg, transparent, color-mix(in srgb, var(--cur) 40%, #fff 10%) 60%, transparent);
        mix-blend-mode: screen; opacity: 0;
      }
      /* linea di mira al centro della finestra */
      .vsr-centerline {
        position: absolute; left: 0; right: 0; top: 50%; height: 2px; margin-top: -1px;
        background: repeating-linear-gradient(90deg, rgba(245,243,235,0.85) 0 18px, transparent 18px 30px);
        box-shadow: 0 0 0 1px rgba(5,5,7,0.55);
        animation: vsr-draw .5s cubic-bezier(.6,0,.2,1) .45s both; transform-origin: left center;
      }
      /* lancette: due becchi ai lati che indicano il centro e «scattano» a ogni fascia.
         Contorno e alone stanno sullo span: sull'<i> li taglierebbe il suo clip-path. */
      .vsr-needle {
        position: absolute; top: 50%; width: 62px; height: 96px; margin-top: -48px; z-index: 2;
        filter: drop-shadow(2px 0 0 #050507) drop-shadow(-2px 0 0 #050507) drop-shadow(0 2px 0 #050507) drop-shadow(0 -2px 0 #050507)
          drop-shadow(4px 5px 0 rgba(5,5,7,0.8)) drop-shadow(0 0 10px var(--cur));
      }
      .vsr-needle i { position: absolute; inset: 0; background: #f5f3eb; }
      /* a sinistra appena dentro lo schermo; a destra appena prima della diagonale */
      .vsr-needle--r { right: 202px; animation: vsr-needle-in-r .4s cubic-bezier(.2,1.6,.4,1) .65s both; }
      .vsr-needle--r i { clip-path: polygon(0 50%, 100% 0, 78% 50%, 100% 100%); transform-origin: 100% 50%; }
      .vsr-needle--l { left: 64px; animation: vsr-needle-in-l .4s cubic-bezier(.2,1.6,.4,1) .7s both; }
      .vsr-needle--l i { clip-path: polygon(100% 50%, 0 0, 22% 50%, 0 100%); transform-origin: 0 50%; }
      @keyframes vsr-needle-in-r { from { opacity: 0; transform: translateX(70px); } }
      @keyframes vsr-needle-in-l { from { opacity: 0; transform: translateX(-70px); } }
      .vsr.is-landed .vsr-needle i { background: var(--cur); animation: vsr-pop .55s cubic-bezier(.2,1.6,.4,1) both; }

      /* scintille all'arrivo, dalla punta della lancetta destra */
      .vsr-sparks { position: absolute; left: 880px; top: 518px; width: 0; height: 0; z-index: 8; }
      .vsr-sparks span {
        position: absolute; left: -4px; top: -4px; width: 8px; height: 26px; background: var(--cur);
        box-shadow: 0 0 12px var(--cur);
        transform: rotate(var(--a)) translateY(0); opacity: 0;
        animation: vsr-spark .7s cubic-bezier(.1,.8,.3,1) both;
      }
      @keyframes vsr-spark {
        0% { opacity: 1; transform: rotate(var(--a)) translateY(0) scaleY(1.6); }
        100% { opacity: 0; transform: rotate(var(--a)) translateY(calc(-1 * var(--d))) scaleY(.4); }
      }

      .vsr-caption {
        position: absolute; left: 60px; bottom: 70px; z-index: 20; display: flex; flex-direction: column; align-items: flex-start; gap: 10px;
        transform: rotate(-4deg); transform-origin: left bottom;
        animation: vsr-caption-in .5s cubic-bezier(.2,1,.3,1) .45s both;
      }
      @keyframes vsr-caption-in { from { opacity: 0; transform: rotate(-4deg) translateX(-80px); } }
      .vsr-eye {
        background: #f5f3eb; color: #050507; font-weight: 700; font-size: 16px; letter-spacing: 0.3em;
        padding: 4px 16px; transform: skewX(-14deg);
      }
      .vsr.is-landed .vsr-eye { background: var(--cur); }
      .vsr-name {
        font-weight: 700; font-style: italic; font-size: 64px; line-height: 0.95; text-transform: uppercase; max-width: 720px;
        text-shadow: 5px 5px 0 var(--cur), 10px 10px 0 #050507;
      }
      .vsr--decks .vsr-name { font-size: 54px; }
      .vsr.is-landed .vsr-name { animation: vsr-pop .55s cubic-bezier(.2,1.6,.4,1) both; }
      @keyframes vsr-pop { 40% { transform: scale(1.12) rotate(-1deg); } }

      /* ---------- una colonna del VS a più giocatori ----------
         Rullo e finestra coprono tutto il canvas (stessa inclinazione e stesso centro per tutte
         le colonne, così le fasce e la finestra si allineano da una colonna all'altra); la
         colonna li ritaglia col suo clip-path. Il contenuto delle fasce sta dentro la colonna. */
      .vsr--col .vsr-reel, .vsr--col .vsr-reel-window { left: 0; right: 0; }
      .vsr--col .vsr-glow { left: var(--cl); width: var(--cw); }
      .vsr--col .vsr-band::before { left: var(--cl); width: 10px; }
      .vsr--col .vsr-portrait { display: none; }
      .vsr--col .vsr-band-tint { background: linear-gradient(90deg, transparent 0, transparent var(--cl), color-mix(in srgb, var(--c) 40%, transparent) var(--cl), transparent calc(var(--cl) + var(--cw) * 0.7)); }
      .vsr--col .vsr-band-icon { left: calc(var(--cl) + 34px); width: 84px; height: 84px; margin-top: -42px; }
      .vsr--col .vsr-band-txt { left: calc(var(--cl) + 130px); right: auto; width: calc(var(--cw) - 170px); gap: 6px; }
      .vsr--col .vsr-band-txt b { font-size: 34px; }
      .vsr--col .vsr-band-txt small { font-size: 14px; }
      .vsr--shared .vsr-needle, .vsr--shared .vsr-centerline { display: none; }
      .vsr--col .vsr-sparks { left: calc(var(--cl) + var(--cw) / 2); }
      .vsr--col .vsr-caption { left: calc(var(--cl) + 40px); bottom: 150px; max-width: calc(var(--cw) - 80px); }
      .vsr--col .vsr-eye { font-size: 13px; letter-spacing: 0.24em; padding: 3px 12px; }
      .vsr--col .vsr-name { font-size: 38px; max-width: calc(var(--cw) - 80px); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; text-shadow: 4px 4px 0 var(--cur), 8px 8px 0 #050507; }

      @media (prefers-reduced-motion: reduce) {
        .vsr-reel, .vsr-band, .vsr-reel-window, .vsr-reel-window::before, .vsr-reel-window::after, .vsr-needle, .vsr-needle i,
        .vsr-centerline, .vsr-flash, .vsr-sparks span, .vsr-caption { animation: none; }
        .vsr-streaks { display: none; }
      }
    `}</style>
  );
}

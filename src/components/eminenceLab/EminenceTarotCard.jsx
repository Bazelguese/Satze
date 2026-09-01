// Carta Eminenza — Arena rare + varianti “curvatura / movimento”.
// Default: `arena`. Foil `holo` riservato.

import React, { useCallback, useEffect, useId, useRef } from 'react';
import { CurvedParallaxImage } from '../shared/CurvedParallaxImage';

/** Trattamento visuale di default per le Eminenze full-art. */
export const EMINENCE_ART_DEFAULT = 'satze';

/**
 * @param {object} props
 * @param {string} props.name
 * @param {string} props.army
 * @param {string} [props.staticText]
 * @param {number} [props.presence]
 * @param {string} props.artUrl
 * @param {string} props.accent
 * @param {string} [props.life]
 * @param {number} [props.intensity] 0.5–1.5
 * @param {boolean} [props.tiltEnabled]
 * @param {boolean} [props.showChrome] Overlay titolo/presenza del tarocco.
 * @param {boolean} [props.showEdge] Cornice interna. Non è lo stile Arena.
 * @param {boolean} [props.idleOrbit] Parallax/tilt/glare in loop quando il puntatore è fuori.
 * @param {boolean} [props.lockPlane] Tilt solo sull'arte: la carta non ruota (innesto a fianco delle abilità).
 * @param {number} [props.artX] Distorsione orizzontale (0–100, 50 = neutra).
 * @param {number} [props.artY] Distorsione verticale (0–100, 50 = neutra).
 * @param {number} [props.artZoom] Zoom arte (100–180).
 * @param {number} [props.artFocusX] Inquadratura orizzontale (0–100, 50 = centro).
 * @param {number} [props.artFocusY] Inquadratura verticale (0 = alto, 100 = basso).
 * @param {string} [props.className]
 * @param {import('react').ReactNode} [props.children] Overlay sul frame (segue tilt Arena).
 */
export function EminenceTarotCard({
  name,
  army,
  staticText = '',
  presence = 0,
  artUrl,
  accent = '#c9a227',
  life = EMINENCE_ART_DEFAULT,
  intensity = 1,
  tiltEnabled = true,
  showChrome = true,
  showEdge = true,
  idleOrbit = false,
  lockPlane = false,
  artX = 50,
  artY = 50,
  artZoom = 100,
  artFocusX = 50,
  artFocusY = 50,
  className = '',
  children = null,
}) {
  const rootRef = useRef(null);
  const rafRef = useRef(0);
  const hoveringRef = useRef(false);
  const filterUid = useId().replace(/:/g, '');

  const useSatzeCurve = life === 'satze';
  const needsBarrel = life === 'barrel' || life === 'comboA';
  const needsDual = life === 'dual';
  const needsShade = life === 'shade' || life === 'roll' || life === 'comboC';
  const needsRake = life === 'rake' || life === 'comboB';
  const needsRoll = life === 'roll' || life === 'comboC';
  // In modalità SATZE il tilt è sull'immagine (CurvedParallaxImage), non sulla carta intera
  const cardTilt = tiltEnabled && !useSatzeCurve && life !== 'flat';

  const setVars = useCallback(
    (px, py, active) => {
      const el = rootRef.current;
      if (!el) return;
      const k = intensity;
      const maxTilt = life === 'flat' ? 0 : 14 * k;
      const rx = maxTilt === 0 ? 0 : -py * 2 * maxTilt;
      const ry = maxTilt === 0 ? 0 : px * 2 * maxTilt;
      const mx = (px + 0.5) * 100;
      const my = (py + 0.5) * 100;
      el.style.setProperty('--et-rx', `${rx.toFixed(2)}deg`);
      el.style.setProperty('--et-ry', `${ry.toFixed(2)}deg`);
      el.style.setProperty('--et-mx', `${mx.toFixed(2)}%`);
      el.style.setProperty('--et-my', `${my.toFixed(2)}%`);
      el.style.setProperty('--et-px', px.toFixed(3));
      el.style.setProperty('--et-py', py.toFixed(3));
      el.style.setProperty('--et-active', active ? '1' : '0');
      el.style.setProperty('--et-roll', ((px + 0.5)).toFixed(3));
    },
    [intensity, life]
  );

  const reset = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    hoveringRef.current = false;
    if (!idleOrbit) setVars(0, 0, false);
  }, [idleOrbit, setVars]);

  useEffect(() => {
    if (!idleOrbit || !cardTilt) return undefined;
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return undefined;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now) => {
      if (!hoveringRef.current) {
        const t = (now - start) / 1000;
        setVars(Math.sin(t * 0.42) * 0.32, Math.cos(t * 0.31) * 0.22, true);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [idleOrbit, cardTilt, setVars]);

  const onPointerMove = useCallback(
    (e) => {
      if (!cardTilt) return;
      const el = rootRef.current;
      if (!el) return;
      hoveringRef.current = true;
      const rect = el.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => setVars(px, py, true));
    },
    [cardTilt, setVars]
  );

  const barrelFilter = needsBarrel ? `url(#et-barrel-${filterUid})` : '';
  const warpX = Math.round(((artX - 50) / 50) * 24 * intensity);
  const warpY = Math.round(((artY - 50) / 50) * 24 * intensity);
  const artFilter = [((warpX || warpY) ? `url(#et-warp-${filterUid})` : ''), barrelFilter].filter(Boolean).join(' ');
  const panX = (50 - artFocusX) / 50;
  const panY = (50 - artFocusY) / 50;
  const cover = 1 + Math.max(Math.abs(panX), Math.abs(panY)) * 0.28;

  return (
    <div
      ref={rootRef}
      className={`eminence-tarot ${className}`.trim()}
      data-life={life}
      data-roll={needsRoll ? '1' : '0'}
      data-lock-plane={lockPlane ? '1' : '0'}
      style={{
        '--et-accent': accent,
        '--et-intensity': String(intensity),
        '--et-art-x': `${artX}%`,
        '--et-art-y': `${artY}%`,
        '--et-art-xn': String(artX),
        '--et-art-yn': String(artY),
        '--et-art-zoom': String(Math.max(1, artZoom / 100)),
        '--et-art-focus-x': `${artFocusX}%`,
        '--et-art-focus-y': `${artFocusY}%`,
        '--et-art-pan-x': `${(panX * 52).toFixed(1)}px`,
        '--et-art-pan-y': `${(panY * 72).toFixed(1)}px`,
        '--et-art-cover': cover.toFixed(3),
        '--et-art-filter': artFilter,
      }}
      onPointerMove={onPointerMove}
      onPointerLeave={reset}
    >
      <svg className="eminence-tarot__defs" aria-hidden>
        <defs>
          <filter
            id={`et-warp-${filterUid}`}
            x="-14%"
            y="-14%"
            width="128%"
            height="128%"
            colorInterpolationFilters="sRGB"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.014 0.0018"
              numOctaves="1"
              seed="4"
              result="nx"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="nx"
              scale={warpX}
              xChannelSelector="R"
              yChannelSelector="R"
              result="dx"
            />
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.0018 0.032"
              numOctaves="1"
              seed="7"
              result="ny"
            />
            <feDisplacementMap
              in="dx"
              in2="ny"
              scale={warpY}
              xChannelSelector="G"
              yChannelSelector="G"
            />
          </filter>
          {needsBarrel ? (
            <filter
              id={`et-barrel-${filterUid}`}
              x="-8%"
              y="-8%"
              width="116%"
              height="116%"
              colorInterpolationFilters="sRGB"
            >
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.0025 0.045"
                numOctaves="1"
                seed="2"
                result="n"
              >
                <animate
                  attributeName="baseFrequency"
                  dur="8s"
                  values="0.0025 0.038;0.0025 0.052;0.0025 0.038"
                  repeatCount="indefinite"
                />
              </feTurbulence>
              <feDisplacementMap
                in="SourceGraphic"
                in2="n"
                scale={Math.round(7 * intensity)}
                xChannelSelector="R"
                yChannelSelector="G"
              >
                <animate
                  attributeName="scale"
                  dur="8s"
                  values={`${5 * intensity};${10 * intensity};${5 * intensity}`}
                  repeatCount="indefinite"
                />
              </feDisplacementMap>
            </filter>
          ) : null}
        </defs>
      </svg>

      <div className="eminence-tarot__frame">
        <div className="eminence-tarot__art-wrap">
          {useSatzeCurve ? (
            <CurvedParallaxImage
              src={artUrl}
              strength={12 + intensity * 6}
              scale={(1.08 + intensity * 0.04) * (artZoom / 100)}
              tiltX={0.8 + intensity * 0.4}
              tiltY={1.1 + intensity * 0.4}
              objectPosition={`${artFocusX}% ${artFocusY}%`}
              autoOrbit
              orbitPeriodSec={16}
              orbitTranslate={3 + intensity * 1.5}
              orbitAmplitude={0.88}
              lens
            />
          ) : (
            <div className="eminence-tarot__art-parallax">
              {needsDual ? (
                <>
                  <div className="eminence-tarot__dual eminence-tarot__dual--deep" aria-hidden>
                    <img src={artUrl} alt="" draggable={false} decoding="async" />
                  </div>
                  <div className="eminence-tarot__dual eminence-tarot__dual--near">
                    <img src={artUrl} alt="" draggable={false} decoding="async" />
                  </div>
                </>
              ) : (
                <img
                  className="eminence-tarot__art"
                  src={artUrl}
                  alt=""
                  draggable={false}
                  decoding="async"
                />
              )}
            </div>
          )}

          {needsShade ? <div className="eminence-tarot__curve-shade" aria-hidden /> : null}
          {needsRake ? <div className="eminence-tarot__curve-rake" aria-hidden /> : null}

          {!useSatzeCurve ? <div className="eminence-tarot__glare" aria-hidden /> : null}
          <div className="eminence-tarot__foil" aria-hidden />
          {!useSatzeCurve ? <div className="eminence-tarot__sheen" aria-hidden /> : null}
          <div className="eminence-tarot__scrim" />
        </div>
        {showEdge ? <div className="eminence-tarot__edge" /> : null}
        {showChrome ? (
          <div className="eminence-tarot__chrome">
            <div>
              <div className="eminence-tarot__eyebrow">Eminenza</div>
              <div className="eminence-tarot__title">{name}</div>
              <div className="eminence-tarot__army">{army}</div>
            </div>
            <div className="eminence-tarot__footer">
              <div className="eminence-tarot__static">{staticText}</div>
              <div className="eminence-tarot__presence">
                <span className="eminence-tarot__presence-label">Presenza</span>
                <span className="eminence-tarot__presence-value">{presence}</span>
              </div>
            </div>
          </div>
        ) : null}
        {children ? <div className="eminence-tarot__overlay">{children}</div> : null}
      </div>
    </div>
  );
}

export const EMINENCE_ART_BASE_OPTIONS = [
  {
    key: 'satze',
    title: 'SATZE curved (consigliata)',
    desc: 'Layout fisso come maschera + immagine overscan 110% con parallax/tilt via rAF. Stesso modello previsto per i Campi.',
    default: true,
  },
  {
    key: 'arena',
    title: 'Arena',
    desc: 'Tilt carta intera + parallax arte + glare (variante precedente).',
  },
  {
    key: 'flat',
    title: 'Piatta',
    desc: 'Solo l’immagine, nessun 3D.',
  },
  {
    key: 'tilt',
    title: 'Solo tilt 3D',
    desc: 'La carta ruota col puntatore, arte fissa.',
  },
  {
    key: 'parallax',
    title: 'Solo parallax arte',
    desc: 'L’arte si sposta nella cornice.',
  },
];

/** Opzioni di curvatura / movimento (tutte su base Arena). */
export const EMINENCE_CURVE_OPTIONS = [
  {
    key: 'barrel',
    title: '1 · Barrel soft',
    desc: 'Piega a cilindro molto soft che respira. Arena + deformazione geometrica leggera.',
  },
  {
    key: 'rake',
    title: '2 · Rake di luce',
    desc: 'Niente deformazione: banda di luce che rade la superficie come su una curva.',
  },
  {
    key: 'shade',
    title: '3 · Shade ai lati',
    desc: 'Ombre laterali che pulsano: volume finto senza muovere i pixel.',
  },
  {
    key: 'roll',
    title: '4 · Micro-roll',
    desc: 'Shade che segue il mouse: il cilindro “ruota” con l’inclinazione.',
  },
  {
    key: 'dual',
    title: '5 · Dual-plane soft',
    desc: 'Due piani, parallax minimo (pochi px). Centro vs margini.',
  },
  {
    key: 'comboA',
    title: 'A · Arena + Barrel',
    desc: 'Combinazione: tilt/parallax + piega soft.',
  },
  {
    key: 'comboB',
    title: 'B · Arena + Rake',
    desc: 'Combinazione: tilt/parallax + luce che scorre.',
  },
  {
    key: 'comboC',
    title: 'C · Arena + Shade/Roll',
    desc: 'Combinazione: tilt/parallax + ombre che seguono il mouse.',
  },
];

export const EMINENCE_FOIL_OPTION = {
  key: 'holo',
  title: 'Foil olo',
  desc: 'Arena + lamina iridescente. Riservato premium.',
  reserved: true,
};

export const EMINENCE_LIFE_OPTIONS = [
  ...EMINENCE_ART_BASE_OPTIONS,
  ...EMINENCE_CURVE_OPTIONS,
  EMINENCE_FOIL_OPTION,
];

/** @deprecated */
export const EMINENCE_WARP_OPTIONS = EMINENCE_LIFE_OPTIONS;

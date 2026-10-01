import React, { useEffect, useId, useRef, useState } from 'react';
import {
  ARCANA_ART_GROUP_TRANSFORM,
  ARCANA_ART_H,
  ARCANA_ART_W,
  ARCANA_CANVAS_H,
  ARCANA_CANVAS_W,
  ARCANA_OUTER_CLIP_TRANSFORM,
  ARCANA_OUTER_PATH,
  ARCANA_PANEL_PATHS,
  ARCANA_SEALS,
} from './arcanaGeometry.js';
import { ArcanaTextOverlay } from './ArcanaTextOverlay.jsx';
import './arcanaLayeredPreview.css';

/**
 * Layered Arcana — ordine kit (LEGGIMI):
 * 1 sfondo (clip sagoma) → 2 vetro → 3 soggetto → 4 cartigli/sigilli → 5 layout.
 * Cornice.webp (tela 1104×1584) mascherata con GEOMETRY pannelli/sigilli.
 * Composition = posizione/scala soggetto (lab); parallasse solo su sfondo/soggetto.
 */
export function ArcanaLayeredPreview({
  agent = null,
  kit = null,
  backgroundUrl,
  subjectUrl,
  frameUrl,
  layoutUrl = '',
  useLiveText = true,
  framedBackground = true,
  composition: compositionProp = null,
  parallax = null,
  motionDefault = true,
  parallaxOnly = false,
  idleMotion = true,
  showControls = false,
  className = '',
}) {
  const composition = {
    subjectScale: compositionProp?.subjectScale ?? 1,
    subjectXPercent: compositionProp?.subjectXPercent ?? 0,
    subjectYPercent: compositionProp?.subjectYPercent ?? 0,
    backgroundScale: compositionProp?.backgroundScale ?? 1,
    backgroundYPercent: compositionProp?.backgroundYPercent ?? 0,
  };

  const px = {
    subjectX: parallax?.subjectX ?? 0.45,
    subjectY: parallax?.subjectY ?? 0.27,
    backgroundX: parallax?.backgroundX ?? -0.55,
    backgroundY: parallax?.backgroundY ?? -0.36,
    tiltX: parallax?.tiltX ?? 3,
    tiltY: parallax?.tiltY ?? 4,
  };

  const reactId = useId().replace(/:/g, '');
  const clipId = `arcana-inside-${reactId}`;
  const glassMaskId = `arcana-glass-${reactId}`;
  const panelsMaskId = `arcana-panels-${reactId}`;

  const tiltRef = useRef(null);
  const bgImgRef = useRef(null);
  const subjectImgRef = useRef(null);
  const [motion, setMotion] = useState(motionDefault);
  /** Kit default: soggetto sopra il vetro, sotto cartigli+testi. */
  const [pop, setPop] = useState(true);
  const pointerRef = useRef({ active: false, tx: 0, ty: 0 });
  const smoothRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef(0);
  const runningRef = useRef(false);
  const idleMotionRef = useRef(idleMotion);
  idleMotionRef.current = idleMotion;
  const parallaxOnlyRef = useRef(parallaxOnly);
  parallaxOnlyRef.current = parallaxOnly;
  const framedBgRef = useRef(framedBackground);
  framedBgRef.current = framedBackground;
  const pxRef = useRef(px);
  pxRef.current = px;
  const compositionRef = useRef(composition);
  compositionRef.current = composition;

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reduce.matches) setMotion(false);
    const onChange = () => {
      if (reduce.matches) setMotion(false);
    };
    reduce.addEventListener?.('change', onChange);
    return () => reduce.removeEventListener?.('change', onChange);
  }, []);

  const subjectBaseTransform = (c = compositionRef.current) =>
    `translate(${c.subjectXPercent || 0}%, ${c.subjectYPercent || 0}%) scale(${c.subjectScale ?? 1})`;

  const backgroundBaseTransform = (c = compositionRef.current) => {
    const framed = framedBgRef.current;
    const scale = framed ? c.backgroundScale ?? 1 : (c.backgroundScale ?? 1) * 1.03;
    return `translate(0%, ${c.backgroundYPercent || 0}%) scale(${scale})`;
  };

  const applyStatic = () => {
    if (tiltRef.current) tiltRef.current.style.transform = '';
    if (bgImgRef.current) bgImgRef.current.style.transform = backgroundBaseTransform();
    if (subjectImgRef.current) subjectImgRef.current.style.transform = subjectBaseTransform();
  };

  const stopLoop = () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
    runningRef.current = false;
  };

  const startLoop = () => {
    if (!motion || runningRef.current) return;
    runningRef.current = true;
    const tick = (t) => {
      const { active, tx, ty } = pointerRef.current;
      const idle = idleMotionRef.current;
      const p = pxRef.current;
      const c = compositionRef.current;
      const ax = active ? tx : idle ? Math.sin(t / 2900) * 0.55 : 0;
      const ay = active ? ty : idle ? Math.cos(t / 3600) * 0.35 : 0;
      const s = smoothRef.current;
      s.x += (ax - s.x) * 0.08;
      s.y += (ay - s.y) * 0.08;
      if (tiltRef.current && !parallaxOnlyRef.current) {
        tiltRef.current.style.transform = `rotateY(${s.x * p.tiltY}deg) rotateX(${-s.y * p.tiltX}deg)`;
      } else if (tiltRef.current) {
        tiltRef.current.style.transform = '';
      }
      if (bgImgRef.current) {
        bgImgRef.current.style.transform = `${backgroundBaseTransform(c)} translate(${s.x * p.backgroundX}%, ${s.y * p.backgroundY}%)`;
      }
      if (subjectImgRef.current) {
        subjectImgRef.current.style.transform = `${subjectBaseTransform(c)} translate(${s.x * p.subjectX}%, ${s.y * p.subjectY}%)`;
      }
      if (!idle && !active && Math.abs(s.x) < 0.002 && Math.abs(s.y) < 0.002) {
        s.x = 0;
        s.y = 0;
        applyStatic();
        stopLoop();
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  useEffect(() => {
    if (!motion) {
      stopLoop();
      applyStatic();
      return undefined;
    }
    if (idleMotion) startLoop();
    else applyStatic();
    return () => stopLoop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [motion, idleMotion, parallaxOnly]);

  // Re-applica base transform quando cambiano scale/posizione dal lab.
  useEffect(() => {
    if (!motion || !runningRef.current) applyStatic();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    composition.subjectScale,
    composition.subjectXPercent,
    composition.subjectYPercent,
    composition.backgroundScale,
    composition.backgroundYPercent,
    motion,
  ]);

  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return;
    pointerRef.current = {
      active: true,
      tx: Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width) * 2 - 1)),
      ty: Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height) * 2 - 1)),
    };
    startLoop();
  };

  const onLeave = () => {
    pointerRef.current.active = false;
    if (!idleMotionRef.current) startLoop();
  };

  const layoutContent =
    layoutUrl && !useLiveText ? (
      <img src={layoutUrl} alt="" draggable={false} />
    ) : agent || kit ? (
      <ArcanaTextOverlay agent={agent} kit={kit} />
    ) : null;

  const renderPanelShapes = (fill) => (
    <g fill={fill}>
      {Object.values(ARCANA_PANEL_PATHS).map((d) => (
        <path key={d.slice(0, 24)} d={d} />
      ))}
      {Object.values(ARCANA_SEALS).map((s) => (
        <circle key={`${s.cx}-${s.cy}`} cx={s.cx} cy={s.cy} r={s.r} />
      ))}
    </g>
  );

  /** Maschere nello stesso SVG dell'immagine (riferimenti cross-SVG non affidabili). */
  const frameSvg = (maskId, maskContent, className) =>
    frameUrl ? (
      <div className={`arcana-layered__cell ${className}`}>
        <svg
          className="arcana-layered__frame-svg"
          viewBox={`0 0 ${ARCANA_CANVAS_W} ${ARCANA_CANVAS_H}`}
          width="100%"
          height="100%"
          aria-hidden
        >
          <defs>
            <mask
              id={maskId}
              maskUnits="userSpaceOnUse"
              x="0"
              y="0"
              width={ARCANA_CANVAS_W}
              height={ARCANA_CANVAS_H}
            >
              {maskContent}
            </mask>
          </defs>
          <image
            href={frameUrl}
            width={ARCANA_CANVAS_W}
            height={ARCANA_CANVAS_H}
            mask={`url(#${maskId})`}
            preserveAspectRatio="none"
          />
        </svg>
      </div>
    ) : null;

  const glassLayer = frameSvg(
    glassMaskId,
    <g transform={ARCANA_ART_GROUP_TRANSFORM}>
      <rect width={ARCANA_ART_W} height={ARCANA_ART_H} fill="#fff" />
      {renderPanelShapes('#000')}
    </g>,
    'arcana-layered__glass'
  );

  const panelsLayer = frameSvg(
    panelsMaskId,
    <g transform={ARCANA_ART_GROUP_TRANSFORM}>
      <rect width={ARCANA_ART_W} height={ARCANA_ART_H} fill="#000" />
      {renderPanelShapes('#fff')}
    </g>,
    'arcana-layered__panels'
  );

  const subjectCell = subjectUrl ? (
    <div
      className={`arcana-layered__cell arcana-layered__subject${pop ? ' is-pop' : ' is-under'}`}
    >
      <img
        ref={subjectImgRef}
        src={subjectUrl}
        alt=""
        draggable={false}
        style={{ transform: subjectBaseTransform(composition) }}
      />
    </div>
  ) : null;

  return (
    <div className={`arcana-layered ${className}`}>
      <div className="arcana-layered__stage">
        <div
          className="arcana-layered__hit"
          onPointerMove={motion ? onMove : undefined}
          onPointerLeave={motion ? onLeave : undefined}
        />
        <div className="arcana-layered__tilt" ref={tiltRef}>
          <div className="arcana-layered__stack">
            <svg className="arcana-layered__defs" width="0" height="0" aria-hidden>
              <defs>
                <clipPath id={clipId} clipPathUnits="objectBoundingBox">
                  <path d={ARCANA_OUTER_PATH} transform={ARCANA_OUTER_CLIP_TRANSFORM} />
                </clipPath>
              </defs>
            </svg>

            <div
              className="arcana-layered__cell arcana-layered__bg"
              style={{ clipPath: `url(#${clipId})`, WebkitClipPath: `url(#${clipId})` }}
            >
              {backgroundUrl ? (
                <img
                  ref={bgImgRef}
                  className={framedBackground ? 'is-framed' : ''}
                  src={backgroundUrl}
                  alt=""
                  draggable={false}
                  style={{ transform: backgroundBaseTransform(composition) }}
                />
              ) : null}
            </div>

            {glassLayer}
            {subjectCell}
            {panelsLayer}

            {layoutContent ? (
              <div className="arcana-layered__cell arcana-layered__layout">{layoutContent}</div>
            ) : null}
          </div>
        </div>
      </div>

      {showControls ? (
        <div className="arcana-layered__controls">
          <label>
            <input
              type="checkbox"
              checked={motion}
              onChange={(e) => setMotion(e.target.checked)}
            />
            Parallasse
          </label>
          <label>
            <input type="checkbox" checked={pop} onChange={(e) => setPop(e.target.checked)} />
            Soggetto sopra vetro
          </label>
        </div>
      ) : null}
    </div>
  );
}

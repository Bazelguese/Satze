import React, { useEffect, useRef, useState } from 'react';
import './eldritchLayeredPreview.css';

/**
 * @typedef {{
 *   subjectScale?: number,
 *   subjectXPercent?: number,
 *   subjectYPercent?: number,
 *   backgroundScale?: number,
 *   backgroundYPercent?: number,
 *   breakHeadClip?: string,
 *   breakHeadMask?: string,
 *   breakShoulderClip?: string,
 *   breakShoulderMask?: string,
 *   breakRightClip?: string,
 *   breakRightMask?: string,
 *   breaksAboveLayout?: boolean,
 *   popLabel?: string,
 * }} LayerComposition
 */

const DEFAULT_COMPOSITION = {
  subjectScale: 1.025,
  subjectXPercent: 0,
  subjectYPercent: 0,
  backgroundScale: 1.07,
  backgroundYPercent: 0,
  breakHeadClip: 'polygon(16% 0, 82% 0, 82% 31%, 16% 31%)',
  breakHeadMask: undefined,
  breakShoulderClip: 'polygon(0 31%, 31% 31%, 31% 71%, 0 71%)',
  breakShoulderMask:
    'linear-gradient(to bottom, transparent 31%, #000 40%, #000 59%, transparent 71%)',
  breakRightClip: undefined,
  breakRightMask: undefined,
  breakExtraClip: undefined,
  breakExtraMask: undefined,
  breaksAboveLayout: false,
  popLabel: 'Testa e spalla sopra la cornice',
};

/**
 * Anteprima a livelli Eldritch (kit Cyber May Punk / Sorethai):
 * sfondo + soggetto + cornice + overflow mascherato + layout SVG sopra.
 */
export function EldritchLayeredPreview({
  backgroundUrl,
  subjectUrl,
  frameUrl,
  layoutSvg = '',
  composition: compositionProp = null,
  motionDefault = true,
  /** Parallax livelli sì; niente rotateX/Y sulla carta (tilt gestito dal parent). */
  parallaxOnly = false,
  /** Se false: niente orbit idle — rAF solo con il puntatore (lightbox). */
  idleMotion = true,
  showControls = true,
  className = '',
}) {
  const composition = (() => {
    const c = { ...DEFAULT_COMPOSITION, ...compositionProp };
    for (const key of [
      'breakHeadClip',
      'breakHeadMask',
      'breakShoulderClip',
      'breakShoulderMask',
      'breakRightClip',
      'breakRightMask',
      'breakExtraClip',
      'breakExtraMask',
    ]) {
      if (
        compositionProp &&
        Object.prototype.hasOwnProperty.call(compositionProp, key) &&
        !compositionProp[key]
      ) {
        c[key] = null;
      }
    }
    return c;
  })();
  const stageRef = useRef(null);
  const cardRef = useRef(null);
  const bgRef = useRef(null);
  const subjectRefs = useRef([]);
  const [motion, setMotion] = useState(motionDefault);
  const [pop, setPop] = useState(true);
  const [mode, setMode] = useState('composite');
  const pointerRef = useRef({ active: false, tx: 0, ty: 0 });
  const smoothRef = useRef({ x: 0, y: 0 });
  const compositionRef = useRef(composition);
  compositionRef.current = composition;
  const rafRef = useRef(0);
  const runningRef = useRef(false);
  const idleMotionRef = useRef(idleMotion);
  idleMotionRef.current = idleMotion;
  const parallaxOnlyRef = useRef(parallaxOnly);
  parallaxOnlyRef.current = parallaxOnly;

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reduce.matches) setMotion(false);
  }, []);

  const applyStatic = () => {
    const c = compositionRef.current;
    const bg = bgRef.current;
    const card = cardRef.current;
    if (card) card.style.transform = '';
    if (bg) {
      bg.style.transform = `translate(0%, ${c.backgroundYPercent}%) scale(${c.backgroundScale})`;
    }
    for (const el of subjectRefs.current) {
      if (el) {
        el.style.transform = `translate(${c.subjectXPercent || 0}%, ${c.subjectYPercent}%) scale(${c.subjectScale})`;
      }
    }
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
      const comp = compositionRef.current;
      const idle = idleMotionRef.current;
      const ax = active ? tx : idle ? Math.sin(t / 2900) * 0.55 : 0;
      const ay = active ? ty : idle ? Math.cos(t / 3600) * 0.35 : 0;
      const s = smoothRef.current;
      s.x += (ax - s.x) * 0.08;
      s.y += (ay - s.y) * 0.08;
      const cardEl = cardRef.current;
      const bgEl = bgRef.current;
      if (cardEl) {
        cardEl.style.transform = parallaxOnlyRef.current
          ? ''
          : `rotateX(${-s.y * 3}deg) rotateY(${s.x * 4}deg)`;
      }
      if (bgEl) {
        bgEl.style.transform = `translate(${-s.x * 1.55}%, ${comp.backgroundYPercent - s.y * 1.15}%) scale(${comp.backgroundScale})`;
      }
      for (const el of subjectRefs.current) {
        if (el) {
          el.style.transform = `translate(${(comp.subjectXPercent || 0) + s.x * 0.65}%, ${comp.subjectYPercent + s.y * 0.4}%) scale(${comp.subjectScale})`;
        }
      }
      // Senza idle: ferma il loop quando il puntatore è fuori e lo smooth è a zero.
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- start/stop only on motion/idle flags
  }, [motion, idleMotion, parallaxOnly]);

  const onMove = (e) => {
    // Hit = cornice: mappa sul rettangolo sotto il cursore, non sullo stage padded.
    const hit = e.currentTarget;
    const r = hit.getBoundingClientRect();
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
    if (!idleMotionRef.current) startLoop(); // settle verso 0, poi stop
  };

  const modeClass =
    mode === 'subject' ? 'mode-subject' : mode === 'background' ? 'mode-background' : '';

  const breakAbove = composition.breaksAboveLayout ? ' eldritch-layered__break--above' : '';
  const maskStyle = (clip, mask) => ({
    clipPath: clip,
    ...(mask ? { WebkitMaskImage: mask, maskImage: mask } : {}),
  });
  const headAbove =
    composition.breakHeadAbove != null
      ? composition.breakHeadAbove
      : composition.breaksAboveLayout;
  const shoulderAbove =
    composition.breakShoulderAbove != null
      ? composition.breakShoulderAbove
      : composition.breaksAboveLayout;
  const rightAbove =
    composition.breakRightAbove != null
      ? composition.breakRightAbove
      : composition.breaksAboveLayout;
  const extraAbove =
    composition.breakExtraAbove != null
      ? composition.breakExtraAbove
      : composition.breaksAboveLayout;

  const mkBreak = (style, cls, above, refIdx) =>
    style ? (
      <img
        ref={(el) => {
          subjectRefs.current[refIdx] = el;
        }}
        className={`eldritch-layered__break eldritch-layered__break--${cls}${above ? ' eldritch-layered__break--above' : ''}`}
        style={style}
        src={subjectUrl}
        alt=""
        draggable={false}
      />
    ) : null;

  const headStyle = composition.breakHeadClip
    ? maskStyle(composition.breakHeadClip, composition.breakHeadMask)
    : null;
  const shoulderStyle = composition.breakShoulderClip
    ? maskStyle(composition.breakShoulderClip, composition.breakShoulderMask)
    : null;
  const rightStyle = composition.breakRightClip
    ? maskStyle(composition.breakRightClip, composition.breakRightMask)
    : null;
  const extraStyle = composition.breakExtraClip
    ? maskStyle(composition.breakExtraClip, composition.breakExtraMask)
    : null;

  const breaksBelow = (
    <>
      {!headAbove ? mkBreak(headStyle, 'head', false, 1) : null}
      {!shoulderAbove ? mkBreak(shoulderStyle, 'shoulder', false, 2) : null}
      {!rightAbove ? mkBreak(rightStyle, 'right', false, 3) : null}
      {!extraAbove ? mkBreak(extraStyle, 'extra', false, 4) : null}
    </>
  );
  const breaksAbove = (
    <>
      {headAbove ? mkBreak(headStyle, 'head', true, 1) : null}
      {shoulderAbove ? mkBreak(shoulderStyle, 'shoulder', true, 2) : null}
      {rightAbove ? mkBreak(rightStyle, 'right', true, 3) : null}
      {extraAbove ? mkBreak(extraStyle, 'extra', true, 4) : null}
    </>
  );

  return (
    <div className={`eldritch-layered ${className}`}>
      <div className="eldritch-layered__stage" ref={stageRef}>
        <div
          ref={cardRef}
          className={`eldritch-layered__card ${modeClass}${pop ? '' : ' no-break'}`}
          role="img"
          aria-label="Carta Eldritch a livelli con parallasse"
        >
          <div className="eldritch-layered__window">
            <img ref={bgRef} className="eldritch-layered__bg" src={backgroundUrl} alt="" draggable={false} />
            <img
              ref={(el) => {
                subjectRefs.current[0] = el;
              }}
              className="eldritch-layered__subject"
              src={subjectUrl}
              alt=""
              draggable={false}
            />
          </div>
          {layoutSvg ? (
            <div
              className="eldritch-layered__layout eldritch-layered__layout--ink"
              dangerouslySetInnerHTML={{ __html: layoutSvg }}
            />
          ) : null}
          {frameUrl ? (
            <img className="eldritch-layered__frame" src={frameUrl} alt="" draggable={false} />
          ) : null}
          {breaksBelow}
          {layoutSvg ? (
            <div
              className="eldritch-layered__layout eldritch-layered__layout--type"
              dangerouslySetInnerHTML={{ __html: layoutSvg }}
            />
          ) : null}
          {breaksAbove}
        </div>
        {/* Hit solo sulla cornice: evita che il canvas oversized blocchi il ✕ lightbox. */}
        <div
          className="eldritch-layered__hit"
          onPointerMove={onMove}
          onPointerLeave={onLeave}
        />
      </div>

      {showControls ? (
        <div className="eldritch-layered__controls">
          <label>
            <input type="checkbox" checked={motion} onChange={(e) => setMotion(e.target.checked)} />
            Movimento leggero
          </label>
          <label>
            <input type="checkbox" checked={pop} onChange={(e) => setPop(e.target.checked)} />
            {composition.popLabel}
          </label>
          <label>
            Mostra
            <select value={mode} onChange={(e) => setMode(e.target.value)}>
              <option value="composite">Composizione</option>
              <option value="subject">Solo soggetto</option>
              <option value="background">Solo sfondo</option>
            </select>
          </label>
        </div>
      ) : null}
    </div>
  );
}

import React, { useEffect, useRef, useState } from 'react';
import './eldritchLayeredPreview.css';

/**
 * @typedef {{
 *   subjectScale?: number,
 *   subjectXPercent?: number,
 *   subjectYPercent?: number,
 *   backgroundScale?: number,
 *   backgroundYPercent?: number,
 *   parallaxSubjectX?: number,
 *   parallaxSubjectY?: number,
 *   parallaxBackgroundX?: number,
 *   parallaxBackgroundY?: number,
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
  parallaxSubjectX: 0.65,
  parallaxSubjectY: 0.4,
  parallaxBackgroundX: -1.55,
  parallaxBackgroundY: -1.15,
  breakHeadClip: 'polygon(0 0, 100% 0, 100% 29%, 0 29%)',
  breakHeadMask: undefined,
  breakHeadAbove: true,
  breakShoulderClip: 'polygon(0 31%, 31% 31%, 31% 71%, 0 71%)',
  breakShoulderMask:
    'linear-gradient(to bottom, transparent 31%, #000 40%, #000 59%, transparent 71%)',
  breakRightClip: undefined,
  breakRightMask: undefined,
  breakExtraClip: undefined,
  breakExtraMask: undefined,
  breaksAboveLayout: false,
  popLabel: 'Testa sopra nome; spalla sopra cornice',
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
  /**
   * `gallery`: niente break (copie soggetto), un solo SVG layout, parallax solo bg/soggetto.
   */
  performance = 'full',
  showControls = true,
  className = '',
}) {
  const galleryLite = performance === 'gallery';
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
    // Se il kit spegne il head clip (tutto in cornice), non ripristinare il default Berserker.
    const headOff =
      compositionProp &&
      Object.prototype.hasOwnProperty.call(compositionProp, 'breakHeadClip') &&
      !compositionProp.breakHeadClip;
    if (headOff) {
      c.breakHeadClip = null;
      c.breakHeadAbove = false;
    } else {
      if (!c.breakHeadClip) c.breakHeadClip = DEFAULT_COMPOSITION.breakHeadClip;
      // Rispetta il tier impostato dal lab/kit (below / over-ink / above).
      if (
        compositionProp &&
        Object.prototype.hasOwnProperty.call(compositionProp, 'breakHeadAbove')
      ) {
        c.breakHeadAbove = compositionProp.breakHeadAbove;
      } else if (c.breakHeadAbove == null) {
        c.breakHeadAbove = true;
      }
    }
    return c;
  })();
  const stageRef = useRef(null);
  const cardRef = useRef(null);
  const bgRef = useRef(null);
  const subjectRefs = useRef([]);
  const [motion, setMotion] = useState(motionDefault);
  const [pop, setPop] = useState(() => !galleryLite);
  const [mode, setMode] = useState('composite');
  const pointerRef = useRef({ active: false, tx: 0, ty: 0 });
  const smoothRef = useRef({ x: 0, y: 0 });
  const compositionRef = useRef(composition);
  compositionRef.current = composition;
  const rafRef = useRef(0);
  const runningRef = useRef(false);
  const idleMotionRef = useRef(idleMotion);
  idleMotionRef.current = idleMotion;
  const parallaxOnlyRef = useRef(parallaxOnly || galleryLite);
  parallaxOnlyRef.current = parallaxOnly || galleryLite;
  const galleryLiteRef = useRef(galleryLite);
  galleryLiteRef.current = galleryLite;

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reduce.matches) setMotion(false);
  }, []);

  const subjectTransform = `translate(${composition.subjectXPercent || 0}%, ${composition.subjectYPercent || 0}%) scale(${composition.subjectScale ?? 1})`;
  const backgroundTransform = `translate(0%, ${composition.backgroundYPercent || 0}%) scale(${composition.backgroundScale ?? 1.07})`;

  const applyStatic = () => {
    const c = compositionRef.current;
    const bg = bgRef.current;
    const card = cardRef.current;
    if (card) card.style.transform = '';
    const subT = `translate(${c.subjectXPercent || 0}%, ${c.subjectYPercent || 0}%) scale(${c.subjectScale ?? 1})`;
    const bgT = `translate(0%, ${c.backgroundYPercent || 0}%) scale(${c.backgroundScale ?? 1.07})`;
    if (bg) bg.style.transform = bgT;
    for (const el of subjectRefs.current) {
      if (el) el.style.transform = subT;
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
      const subBase = `translate(${comp.subjectXPercent || 0}%, ${comp.subjectYPercent || 0}%) scale(${comp.subjectScale ?? 1})`;
      const bgBase = `translate(0%, ${comp.backgroundYPercent || 0}%) scale(${comp.backgroundScale ?? 1.07})`;
      const px = s.x * (comp.parallaxSubjectX ?? 0.65) * (galleryLiteRef.current ? 0.7 : 1);
      const py = s.y * (comp.parallaxSubjectY ?? 0.4) * (galleryLiteRef.current ? 0.7 : 1);
      const bx = s.x * (comp.parallaxBackgroundX ?? -1.55) * (galleryLiteRef.current ? 0.7 : 1);
      const by = s.y * (comp.parallaxBackgroundY ?? -1.15) * (galleryLiteRef.current ? 0.7 : 1);
      if (cardEl && !parallaxOnlyRef.current) {
        cardEl.style.transform = `rotateY(${s.x * 4.5}deg) rotateX(${-s.y * 3.2}deg)`;
      } else if (cardEl) {
        cardEl.style.transform = '';
      }
      if (bgEl) {
        bgEl.style.transform = `${bgBase} translate(${bx}%, ${by}%)`;
      }
      // Gallery lite: solo soggetto principale (idx 0), niente break refs.
      const subjects = galleryLiteRef.current
        ? subjectRefs.current.slice(0, 1)
        : subjectRefs.current;
      for (const el of subjects) {
        if (el) el.style.transform = `${subBase} translate(${px}%, ${py}%)`;
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

  // Dopo edit composition (clip/tier/scale) re-applica transform: React altrimenti azzera lo style inline.
  useEffect(() => {
    if (!motion || !runningRef.current) applyStatic();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [composition, motion]);

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

  const maskStyle = (clip, mask) => ({
    clipPath: clip,
    WebkitClipPath: clip,
    ...(mask
      ? { WebkitMaskImage: mask, maskImage: mask, WebkitMaskSize: '100% 100%', maskSize: '100% 100%' }
      : {}),
    transform: subjectTransform,
  });

  /** false | 'ink' | true — sotto macchia / sopra macchia sotto testi / sopra tutto. */
  const breakTier = (flag) => {
    const v = flag != null ? flag : composition.breaksAboveLayout;
    if (v === 'ink' || v === 'over-ink') return 'over-ink';
    if (v === true || v === 'type' || v === 'above') return 'above';
    return 'below';
  };
  const headTier = breakTier(composition.breakHeadAbove);
  const shoulderTier = breakTier(composition.breakShoulderAbove);
  const rightTier = breakTier(composition.breakRightAbove);
  const extraTier = breakTier(composition.breakExtraAbove);

  const mkBreak = (style, cls, tier, refIdx) => {
    if (!style) return null;
    const tierClass =
      tier === 'above'
        ? ' eldritch-layered__break--above'
        : tier === 'over-ink'
          ? ' eldritch-layered__break--over-ink'
          : '';
    return (
      <img
        ref={(el) => {
          subjectRefs.current[refIdx] = el;
        }}
        className={`eldritch-layered__break eldritch-layered__break--${cls}${tierClass}`}
        style={style}
        src={subjectUrl}
        alt=""
        draggable={false}
      />
    );
  };

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
      {headTier === 'below' ? mkBreak(headStyle, 'head', 'below', 1) : null}
      {shoulderTier === 'below' ? mkBreak(shoulderStyle, 'shoulder', 'below', 2) : null}
      {rightTier === 'below' ? mkBreak(rightStyle, 'right', 'below', 3) : null}
      {extraTier === 'below' ? mkBreak(extraStyle, 'extra', 'below', 4) : null}
    </>
  );
  const breaksOverInk = (
    <>
      {headTier === 'over-ink' ? mkBreak(headStyle, 'head', 'over-ink', 1) : null}
      {shoulderTier === 'over-ink' ? mkBreak(shoulderStyle, 'shoulder', 'over-ink', 2) : null}
      {rightTier === 'over-ink' ? mkBreak(rightStyle, 'right', 'over-ink', 3) : null}
      {extraTier === 'over-ink' ? mkBreak(extraStyle, 'extra', 'over-ink', 4) : null}
    </>
  );
  const breaksAbove = (
    <>
      {headTier === 'above' ? mkBreak(headStyle, 'head', 'above', 1) : null}
      {shoulderTier === 'above' ? mkBreak(shoulderStyle, 'shoulder', 'above', 2) : null}
      {rightTier === 'above' ? mkBreak(rightStyle, 'right', 'above', 3) : null}
      {extraTier === 'above' ? mkBreak(extraStyle, 'extra', 'above', 4) : null}
    </>
  );

  return (
    <div className={`eldritch-layered ${className}`}>
      <div className="eldritch-layered__stage" ref={stageRef}>
        <div
          ref={cardRef}
          className={`eldritch-layered__card ${modeClass}${pop ? '' : ' no-break'}${
            galleryLite ? ' perf-gallery' : ''
          }${composition.inkAboveSubject === false ? ' ink-under-subject' : ''}${
            composition.nameInkUnderSubject ? ' name-ink-under' : ''
          }`}
          role="img"
          aria-label="Carta Eldritch a livelli con parallasse"
        >
          <div className="eldritch-layered__window">
            <img
              ref={bgRef}
              className="eldritch-layered__bg"
              src={backgroundUrl}
              alt=""
              draggable={false}
              decoding="async"
              style={{ transform: backgroundTransform }}
            />
            <img
              ref={(el) => {
                subjectRefs.current[0] = el;
              }}
              className="eldritch-layered__subject"
              src={subjectUrl}
              alt=""
              draggable={false}
              decoding="async"
              style={{ transform: subjectTransform }}
            />
          </div>
          {frameUrl ? (
            <img
              className="eldritch-layered__frame"
              src={frameUrl}
              alt=""
              draggable={false}
              decoding="async"
            />
          ) : null}
          {galleryLite ? (
            layoutSvg ? (
              <div
                className="eldritch-layered__layout eldritch-layered__layout--gallery"
                dangerouslySetInnerHTML={{ __html: layoutSvg }}
              />
            ) : null
          ) : (
            <>
              {composition.nameInkUnderSubject && layoutSvg ? (
                <div
                  className="eldritch-layered__layout eldritch-layered__layout--ink-name"
                  dangerouslySetInnerHTML={{ __html: layoutSvg }}
                />
              ) : null}
              {breaksBelow}
              {layoutSvg ? (
                <div
                  className="eldritch-layered__layout eldritch-layered__layout--ink"
                  dangerouslySetInnerHTML={{ __html: layoutSvg }}
                />
              ) : null}
              {!composition.nameInkUnderSubject && layoutSvg ? (
                <div
                  className="eldritch-layered__layout eldritch-layered__layout--ink-name"
                  dangerouslySetInnerHTML={{ __html: layoutSvg }}
                />
              ) : null}
              {breaksOverInk}
              {layoutSvg ? (
                <div
                  className="eldritch-layered__layout eldritch-layered__layout--type"
                  dangerouslySetInnerHTML={{ __html: layoutSvg }}
                />
              ) : null}
              {breaksAbove}
            </>
          )}
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

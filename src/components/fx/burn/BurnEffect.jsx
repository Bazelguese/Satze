import React from 'react';
import { captureElementToCanvas } from './captureElement.js';
import { createBurnRenderer } from './burnRenderer.js';
import { burnProgressCurve, resolveBurnParams } from './burnParams.js';

/**
 * Animazione a sé: brucia (dissolve con fiamma) qualunque contenuto.
 *
 * Il contenuto resta DOM vivo finché il fuoco non parte; allora se ne fa una foto
 * (texture), lo si nasconde e un canvas WebGL sovrapposto lo consuma. Il canvas sta
 * dentro il wrapper, quindi eredita transform, rotazioni e movimenti del genitore.
 *
 * Uso:
 *   <BurnEffect burning={lost} params={{ flameColor: armyAccent }} onComplete={...}>
 *     <GameCard agent={agent} />
 *   </BurnEffect>
 *
 * - `burning`: da false a true avvia la bruciatura da 0; tornando false il contenuto ricompare.
 * - `progress`: numero 0-1 per fermare il fuoco a una quota (anteprima/regia esterna);
 *   ha la precedenza su `burning`. null = non usato.
 * - `captureKey`: cambia quando cambia l'aspetto del contenuto (scarta la foto in cache).
 * - `precapture`: fa la foto in anticipo, a riposo, così il fuoco parte senza attesa.
 */
export function BurnEffect({
  children,
  burning = false,
  progress = null,
  params,
  captureKey = null,
  precapture = false,
  pixelRatio,
  onStart,
  onComplete,
  className = '',
  style,
}) {
  const contentRef = React.useRef(null);
  const canvasRef = React.useRef(null);
  const snapshotRef = React.useRef({ key: undefined, canvas: null, promise: null });
  const runSeqRef = React.useRef(0);
  const paramsRef = React.useRef(resolveBurnParams(params));
  const progressRef = React.useRef(progress);
  const callbacksRef = React.useRef({ onStart, onComplete });
  /** Giro in corso: { id, snap, layout } con il canvas montato, o null. */
  const [run, setRun] = React.useState(null);
  /** none | hidden (bruciato o in fiamme) | fade (ripiego senza WebGL) */
  const [contentMode, setContentMode] = React.useState('none');

  paramsRef.current = resolveBurnParams(params);
  progressRef.current = progress;
  callbacksRef.current = { onStart, onComplete };

  const manual = progress != null && Number.isFinite(Number(progress));
  const wantFire = manual || burning;

  const getSnapshot = React.useCallback(() => {
    const snap = snapshotRef.current;
    if (snap.key === captureKey && snap.canvas) return Promise.resolve(snap.canvas);
    if (snap.key === captureKey && snap.promise) return snap.promise;
    const node = contentRef.current;
    if (!node) return Promise.reject(new Error('burn: contenuto non montato'));
    const promise = captureElementToCanvas(node, { pixelRatio }).then((cv) => {
      if (snapshotRef.current.promise === promise) {
        snapshotRef.current = { key: captureKey, canvas: cv, promise: null };
      }
      return cv;
    });
    snapshotRef.current = { key: captureKey, canvas: null, promise };
    promise.catch(() => {
      if (snapshotRef.current.promise === promise) {
        snapshotRef.current = { key: undefined, canvas: null, promise: null };
      }
    });
    return promise;
  }, [captureKey, pixelRatio]);

  // foto in anticipo, a riposo
  React.useEffect(() => {
    if (!precapture || wantFire) return undefined;
    let cancelled = false;
    const go = () => {
      if (!cancelled) getSnapshot().catch((err) => console.warn('[burn] foto anticipata fallita', err));
    };
    const id = typeof requestIdleCallback === 'function' ? requestIdleCallback(go, { timeout: 600 }) : setTimeout(go, 120);
    return () => {
      cancelled = true;
      if (typeof cancelIdleCallback === 'function') cancelIdleCallback(id);
      else clearTimeout(id);
    };
  }, [precapture, wantFire, getSnapshot]);

  // 1) acceso/spento: foto + misure, poi il canvas viene montato col nuovo giro
  React.useEffect(() => {
    const id = ++runSeqRef.current;
    if (!wantFire) {
      setRun(null);
      setContentMode('none');
      return undefined;
    }
    let cancelled = false;
    (async () => {
      const node = contentRef.current;
      if (!node) return;
      let snap = null;
      try {
        snap = await getSnapshot();
      } catch (err) {
        console.warn('[burn] foto fallita, ripiego su dissolvenza', err);
      }
      if (cancelled || runSeqRef.current !== id) return;
      if (!snap) {
        callbacksRef.current.onStart?.();
        setContentMode('fade');
        return;
      }
      const w = node.offsetWidth;
      const h = node.offsetHeight;
      const padX = Math.round(w * 0.2);
      const padTop = Math.round(h * 0.45);
      const padBottom = Math.round(h * 0.15);
      setRun({
        id,
        snap,
        layout: {
          w,
          h,
          padX,
          padTop,
          cssW: w + padX * 2,
          cssH: h + padTop + padBottom,
          dpr: Math.min(2, window.devicePixelRatio || 1),
        },
      });
    })();
    return () => {
      cancelled = true;
    };
    // `manual` cambia la modalità: riparte da capo; il valore di progress si legge dal ref
  }, [wantFire, manual, getSnapshot]);

  // ripiego senza foto/WebGL: dissolvenza della stessa durata
  React.useEffect(() => {
    if (contentMode !== 'fade' || manual) return undefined;
    const t = setTimeout(() => callbacksRef.current.onComplete?.(), paramsRef.current.durationMs);
    return () => clearTimeout(t);
  }, [contentMode, manual]);

  // 2) canvas montato: renderer WebGL e ciclo di animazione
  React.useLayoutEffect(() => {
    if (!run) return undefined;
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const { layout, snap } = run;
    canvas.width = Math.round(layout.cssW * layout.dpr);
    canvas.height = Math.round(layout.cssH * layout.dpr);
    let renderer = null;
    try {
      renderer = createBurnRenderer(canvas);
      renderer?.setSource(snap);
    } catch (err) {
      console.warn('[burn] WebGL non disponibile, ripiego su dissolvenza', err);
      renderer?.dispose();
      renderer = null;
    }
    if (!renderer) {
      callbacksRef.current.onStart?.();
      setContentMode('fade');
      return undefined;
    }

    const rect = [
      layout.padX / layout.cssW,
      layout.padTop / layout.cssH,
      layout.w / layout.cssW,
      layout.h / layout.cssH,
    ];
    const aspect = layout.w / Math.max(1, layout.h);
    let raf = 0;
    let start = null;
    let last = null;
    let completed = false;
    let firstFrame = true;
    let disposed = false;
    callbacksRef.current.onStart?.();

    const tick = (ts) => {
      if (disposed) return;
      if (start == null) start = ts;
      const dt = last == null ? 0 : Math.min(0.05, (ts - last) / 1000);
      last = ts;
      const p = paramsRef.current;
      const manualP = progressRef.current;
      const isManual = manualP != null && Number.isFinite(Number(manualP));
      let prog;
      let linear;
      if (isManual) {
        prog = Math.max(0, Math.min(1, Number(manualP)));
        linear = prog;
      } else {
        linear = Math.min(1, (ts - start) / Math.max(1, p.durationMs));
        prog = burnProgressCurve(linear);
      }
      const active = isManual
        ? (prog > 0.001 && prog < 0.999 ? 1 : 0)
        : Math.min(1, linear / 0.04) * (1 - Math.max(0, (linear - 0.9) / 0.1));
      renderer.draw({
        params: p,
        progress: prog,
        active,
        time: ts / 1000,
        dt,
        rect,
        aspect,
        scale: 1 - (1 - p.shrink) * prog,
        dpr: layout.dpr,
      });
      if (firstFrame) {
        firstFrame = false;
        setContentMode('hidden');
      }
      if (!isManual && linear >= 1 && !completed) {
        completed = true;
        callbacksRef.current.onComplete?.();
      }
      // dopo la fine restano solo le ultime faville: poi si libera il contesto WebGL
      if (!isManual && completed && renderer.emberCount === 0) {
        renderer.clear();
        setRun((cur) => (cur && cur.id === run.id ? null : cur));
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      renderer.dispose();
    };
  }, [run]);

  const contentStyle =
    contentMode === 'hidden'
      ? { opacity: 0 }
      : contentMode === 'fade'
        ? manual
          ? { opacity: 1 - Math.max(0, Math.min(1, Number(progress))) }
          : { opacity: 0, transition: `opacity ${paramsRef.current.durationMs}ms ease-in` }
        : undefined;

  return (
    <div className={className} style={{ position: 'relative', display: 'inline-block', ...style }}>
      {/* opacity e non visibility: nella carta ci sono figli con visibility:visible esplicito */}
      <div ref={contentRef} style={contentStyle}>{children}</div>
      {run ? (
        <canvas
          key={run.id}
          ref={canvasRef}
          aria-hidden
          style={{
            position: 'absolute',
            left: -run.layout.padX,
            top: -run.layout.padTop,
            width: run.layout.cssW,
            height: run.layout.cssH,
            pointerEvents: 'none',
          }}
        />
      ) : null}
    </div>
  );
}

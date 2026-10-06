import React from 'react';
import { captureElementToCanvas } from './captureElement.js';

/** Entrata: da questa quota il disegno sfuma verso la carta vera, già visibile sotto. */
const IN_HANDOVER_START = 0.86;

const smoothstepJs = (a, b, x) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/**
 * Esegue un effetto WebGL su qualunque contenuto (bruciatura, polvere, frattura, vortice,
 * materializzazione…). L'effetto è una «definizione» (vedi fx/effects): parametri di
 * default, curva del tempo, margini del canvas e renderer.
 *
 * Il contenuto resta DOM vivo; al via se ne fa una foto (texture), lo si nasconde e un
 * canvas sovrapposto disegna l'effetto. Il canvas sta dentro il wrapper, quindi eredita
 * transform, rotazioni e movimenti del genitore.
 *
 * - effect.kind 'out' (uscita): il contenuto sparisce col primo fotogramma e resta nascosto.
 * - effect.kind 'in' (entrata): il contenuto è nascosto finché l'effetto non finisce.
 *
 * Props:
 * - `active`: da false a true avvia l'effetto da 0; tornando false il contenuto torna normale.
 * - `progress`: numero 0-1 per fermare l'effetto a una quota (anteprima/regia esterna);
 *   ha la precedenza su `active`. null = non usato.
 * - `params`: parametri dell'effetto (uniti ai default della definizione).
 * - `captureKey`: cambia quando cambia l'aspetto del contenuto (scarta la foto in cache).
 * - `precapture`: fa la foto in anticipo, a riposo, così l'effetto parte senza attesa.
 * - `snapshotTimeoutMs`: se la foto tarda oltre questo tempo l'effetto si salta (entrata: il
 *   contenuto compare subito). Utile in gioco, dove una carta nascosta troppo a lungo stona.
 */
export function ElementFx({
  effect,
  children,
  active = false,
  progress = null,
  params,
  captureKey = null,
  precapture = false,
  pixelRatio,
  snapshotTimeoutMs = 0,
  onStart,
  onComplete,
  className = '',
  style,
}) {
  const contentRef = React.useRef(null);
  const canvasRef = React.useRef(null);
  const snapshotRef = React.useRef({ key: undefined, canvas: null, promise: null });
  const runSeqRef = React.useRef(0);
  const resolveParams = React.useCallback((p) => resolveFxParams(effect, p), [effect]);
  const paramsRef = React.useRef(resolveParams(params));
  const progressRef = React.useRef(progress);
  const callbacksRef = React.useRef({ onStart, onComplete });
  const effectRef = React.useRef(effect);
  /** Giro in corso: { id, snap, layout } con il canvas montato, o null. */
  const [run, setRun] = React.useState(null);
  /** none | hidden | fade (ripiego senza WebGL) */
  const [contentMode, setContentMode] = React.useState('none');

  paramsRef.current = resolveParams(params);
  progressRef.current = progress;
  callbacksRef.current = { onStart, onComplete };
  effectRef.current = effect;

  const isIn = effect.kind === 'in';
  const manual = progress != null && Number.isFinite(Number(progress));
  const wantFx = manual || active;

  const getSnapshot = React.useCallback(() => {
    const snap = snapshotRef.current;
    if (snap.key === captureKey && snap.canvas) return Promise.resolve(snap.canvas);
    if (snap.key === captureKey && snap.promise) return snap.promise;
    const node = contentRef.current;
    if (!node) return Promise.reject(new Error('fx: contenuto non montato'));
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
    if (!precapture || wantFx) return undefined;
    let cancelled = false;
    const go = () => {
      if (!cancelled) getSnapshot().catch((err) => console.warn('[fx] foto anticipata fallita', err));
    };
    const id = typeof requestIdleCallback === 'function' ? requestIdleCallback(go, { timeout: 600 }) : setTimeout(go, 120);
    return () => {
      cancelled = true;
      if (typeof cancelIdleCallback === 'function') cancelIdleCallback(id);
      else clearTimeout(id);
    };
  }, [precapture, wantFx, getSnapshot]);

  // entrata: il contenuto sparisce prima del primo paint, non quando arriva la foto
  React.useLayoutEffect(() => {
    if (isIn && wantFx) setContentMode('hidden');
  }, [isIn, wantFx, manual, effect]);

  // 1) acceso/spento: foto + misure, poi il canvas viene montato col nuovo giro
  React.useEffect(() => {
    const id = ++runSeqRef.current;
    if (!wantFx) {
      setRun(null);
      setContentMode('none');
      return undefined;
    }
    let cancelled = false;
    (async () => {
      const node = contentRef.current;
      if (!node) return;
      let snap = null;
      let late = false;
      try {
        const pending = getSnapshot();
        snap = snapshotTimeoutMs > 0 && !manual
          ? await Promise.race([pending, new Promise((r) => setTimeout(() => { late = true; r(null); }, snapshotTimeoutMs))])
          : await pending;
      } catch (err) {
        console.warn('[fx] foto fallita, ripiego su dissolvenza', err);
      }
      if (cancelled || runSeqRef.current !== id) return;
      if (late && !snap) {
        // foto troppo lenta: niente effetto (in entrata il contenuto compare così com'è)
        callbacksRef.current.onStart?.();
        setContentMode(effectRef.current.kind === 'in' ? 'none' : 'fade');
        if (effectRef.current.kind === 'in') callbacksRef.current.onComplete?.();
        return;
      }
      if (!snap) {
        callbacksRef.current.onStart?.();
        setContentMode(effectRef.current.kind === 'in' ? 'none' : 'fade');
        if (effectRef.current.kind === 'in') callbacksRef.current.onComplete?.();
        return;
      }
      const w = node.offsetWidth;
      const h = node.offsetHeight;
      const pad = effectRef.current.padding(w, h, paramsRef.current);
      setRun({
        id,
        snap,
        effect: effectRef.current,
        layout: {
          w,
          h,
          left: Math.round(pad.left),
          top: Math.round(pad.top),
          cssW: Math.round(w + pad.left + pad.right),
          cssH: Math.round(h + pad.top + pad.bottom),
          dpr: Math.min(2, window.devicePixelRatio || 1),
        },
      });
    })();
    return () => {
      cancelled = true;
    };
    // `manual` ed `effect` cambiano la modalità: riparte da capo; progress si legge dal ref
  }, [wantFx, manual, effect, getSnapshot, snapshotTimeoutMs]);

  // ripiego senza foto/WebGL in uscita: dissolvenza della stessa durata
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
    const { layout, snap, effect: fx } = run;
    canvas.width = Math.round(layout.cssW * layout.dpr);
    canvas.height = Math.round(layout.cssH * layout.dpr);
    let renderer = null;
    try {
      renderer = fx.createRenderer(canvas);
      renderer?.setSource(snap);
    } catch (err) {
      console.warn('[fx] WebGL non disponibile, ripiego', err);
      renderer?.dispose();
      renderer = null;
    }
    if (!renderer) {
      callbacksRef.current.onStart?.();
      if (fx.kind === 'in') {
        setContentMode('none');
        callbacksRef.current.onComplete?.();
      } else {
        setContentMode('fade');
      }
      return undefined;
    }

    const rect = [layout.left / layout.cssW, layout.top / layout.cssH, layout.w / layout.cssW, layout.h / layout.cssH];
    const aspect = layout.w / Math.max(1, layout.h);
    let raf = 0;
    let start = null;
    let last = null;
    let completed = false;
    let handedOver = false;
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
        prog = fx.curve ? fx.curve(linear) : linear;
      }
      // entrata: nell'ultimo tratto la carta vera è già sotto e il disegno sfuma verso di lei,
      // così il passaggio non scatta (il disegno non è identico al pixel alla carta DOM)
      const handover = fx.kind === 'in' && !isManual ? smoothstepJs(IN_HANDOVER_START, 1, linear) : 0;
      if (handover > 0 && !handedOver) {
        handedOver = true;
        setContentMode('none');
      }
      const activeAmt = isManual
        ? (prog > 0.001 && prog < 0.999 ? 1 : 0)
        : Math.min(1, linear / 0.04) * (1 - Math.max(0, (linear - 0.9) / 0.1));
      renderer.draw({
        params: p,
        progress: prog,
        linear,
        active: activeAmt,
        done: completed,
        time: ts / 1000,
        dt,
        rect,
        aspect,
        dpr: layout.dpr,
        cardAlpha: completed && fx.kind === 'in' ? 0 : 1 - handover,
        hideCard: completed && fx.kind === 'in',
      });
      if (firstFrame) {
        firstFrame = false;
        if (fx.kind !== 'in') setContentMode('hidden');
      }
      if (!isManual && linear >= 1 && !completed) {
        completed = true;
        if (fx.kind === 'in') setContentMode('none');
        callbacksRef.current.onComplete?.();
      }
      // dopo la fine restano solo le ultime particelle: poi si libera il contesto WebGL
      if (!isManual && completed && !renderer.busy()) {
        setRun((cur) => (cur && cur.id === run.id ? null : cur));
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      // nascosto prima di rilasciare il contesto: un canvas col contesto perso compare bianco
      canvas.style.visibility = 'hidden';
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
      {/* contesto di impilamento proprio: i livelli della carta (z-index) non scavalcano il canvas */}
      <div ref={contentRef} style={{ position: 'relative', zIndex: 0, isolation: 'isolate', ...contentStyle }}>{children}</div>
      {run ? (
        <canvas
          key={run.id}
          ref={canvasRef}
          aria-hidden
          style={{
            position: 'absolute',
            left: -run.layout.left,
            top: -run.layout.top,
            width: run.layout.cssW,
            height: run.layout.cssH,
            zIndex: 1,
            pointerEvents: 'none',
          }}
        />
      ) : null}
    </div>
  );
}

/** Unisce i parametri con i default dell'effetto scartando valori non numerici dove serve un numero. */
export function resolveFxParams(effect, params) {
  const defaults = effect.defaults;
  const out = { ...defaults };
  if (!params) return out;
  for (const key of Object.keys(params)) {
    const v = params[key];
    if (v == null) continue;
    if (typeof defaults[key] === 'number') {
      const n = Number(v);
      if (Number.isFinite(n)) out[key] = n;
    } else {
      out[key] = v;
    }
  }
  return out;
}

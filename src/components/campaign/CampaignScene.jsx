import React, { createContext, useContext, useEffect, useRef, useState } from 'react';

export const Motion = createContext(null);
const PREFERENCE = 'satze_campaign_motion_v1';
const query = () => window.matchMedia?.('(prefers-reduced-motion: reduce)');
export const useCampaignMotion = () => useContext(Motion) || { enabled:false, reduced:true };
export function campaignMotionAllowed() {
  try { return localStorage.getItem(PREFERENCE) !== 'off' && !query()?.matches; }
  catch { return !query()?.matches; }
}

/** Variabili della parallasse sullo sfondo (.cs-backdrop): le legge `.cs-backdrop > img`. */
export function applyPan(backdrop, { x, y }) {
  backdrop.style.setProperty('--cs-pan-x', `${x}px`);
  backdrop.style.setProperty('--cs-pan-y', `${y}px`);
}

/** Presentation preferences never enter the run or its random seed. */
export function CampaignScene({ children, className = '' }) {
  const root = useRef(null);
  const [allowed, setAllowed] = useState(() => {
    try { return localStorage.getItem(PREFERENCE) !== 'off'; } catch { return true; }
  });
  const [reduced, setReduced] = useState(() => query()?.matches ?? false);
  const enabled = allowed && !reduced;
  useEffect(() => {
    const media = query();
    const update = () => setReduced(media?.matches ?? false);
    media?.addEventListener('change', update);
    return () => media?.removeEventListener('change', update);
  }, []);
  // Ultimo spostamento della parallasse: gli sfondi montati dopo lo applicano subito.
  const pan = useRef({ x: 0, y: 0 });
  useEffect(() => {
    const element = root.current;
    let frame = null, x = 0, y = 0;
    // Le variabili si scrivono solo sugli sfondi che le usano: scritte sulla radice della scena
    // (ereditate) obbligavano a ricalcolare gli stili di tutta la scena a ogni movimento.
    const write = (px, py) => {
      pan.current = { x: px, y: py };
      for (const backdrop of element.querySelectorAll('.cs-backdrop')) applyPan(backdrop, pan.current);
    };
    const reset = () => {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;
      write(0, 0);
    };
    const render = () => {
      frame = null;
      write(x, y);
    };
    const move = event => {
      if (!enabled || document.hidden || event.pointerType !== 'mouse') return;
      const rect = element.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      x = Math.max(-1, Math.min(1, (event.clientX - rect.left) / rect.width * 2 - 1)) * 9;
      y = Math.max(-1, Math.min(1, (event.clientY - rect.top) / rect.height * 2 - 1)) * 6;
      if (frame === null) frame = requestAnimationFrame(render);
    };
    const visibility = () => {
      element.dataset.paused = String(document.hidden);
      if (document.hidden) reset();
    };
    reset();
    visibility();
    element.addEventListener('pointermove', move);
    element.addEventListener('pointerleave', reset);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      reset();
      element.removeEventListener('pointermove', move);
      element.removeEventListener('pointerleave', reset);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, [enabled]);
  const toggle = () => setAllowed(previous => {
    try { localStorage.setItem(PREFERENCE, previous ? 'off' : 'on'); } catch { /* Works for this session. */ }
    return !previous;
  });
  return <Motion.Provider value={{ enabled, reduced, toggle, pan }}>
    <section ref={root} className={`campaign-scene ${className} ${enabled ? 'cs-motion-on' : 'cs-motion-off'}`}>{children}</section>
  </Motion.Provider>;
}

export function CampaignMotionControl() {
  const { enabled, reduced, toggle } = useContext(Motion);
  return <button aria-pressed={enabled} disabled={reduced} onClick={toggle}
    title={reduced ? 'Movimento ridotto dalle impostazioni di sistema' : 'Attiva o ferma i movimenti della scena'}>
    Animazioni: {enabled ? 'sì' : 'no'}
  </button>;
}

/**
 * Avviso → Presenza. Quando un avviso dell'Eminenza cambia la Presenza (costo dell'abilità
 * rivelata, «+1 Presenza» di un effetto o dello statico), quattro scintille partono dalla bolla
 * del costo dell'avviso e volano al contatore Presenza della carta: il numero cambia e pulsa
 * all'arrivo.
 * Fino ad allora la carta mostra il valore di prima. Solo presentazione: il valore vero resta
 * quello dello stato delle Eminenze.
 */
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { presenceNoticeDelta, stepPresenceToward } from '../../game/eminence/eminencePresenceLink.js';

/** Partenza delle scintille dopo la comparsa dell'avviso, e durata del volo (ms). */
export const PRESENCE_SPARK_DELAY_MS = 80;
export const PRESENCE_SPARK_FLIGHT_MS = 520;
const SPARKS = 4;
const SIDES = ['player', 'enemy'];

/**
 * @param {{ notices: object[], shown: Array<object|null>, live: { player: number, enemy: number } }} args
 *   notices: avvisi in coda; shown: avvisi a schermo; live: Presenza dello stato.
 * @returns {{ presence: { player: number, enemy: number }, pulse: { player: number, enemy: number }, flights: object[] }}
 */
export function useEminencePresenceLink({ notices = [], shown = [], live }) {
  const landedRef = useRef(new Set());
  const scheduledRef = useRef(new Set());
  const frozenRef = useRef({ player: null, enemy: null });
  const lastShownRef = useRef({ player: live?.player ?? 0, enemy: live?.enemy ?? 0 });
  const liveRef = useRef(live);
  const timersRef = useRef([]);
  const [pulse, setPulse] = useState({ player: 0, enemy: 0 });
  const [flights, setFlights] = useState([]);
  liveRef.current = live;

  const presence = {};
  SIDES.forEach((side) => {
    const value = live?.[side] ?? 0;
    const pending = notices.some((n) => n?.side === side && presenceNoticeDelta(n) && !landedRef.current.has(n.id));
    if (pending) {
      if (frozenRef.current[side] == null) frozenRef.current[side] = lastShownRef.current[side];
      presence[side] = frozenRef.current[side];
    } else {
      frozenRef.current[side] = null;
      presence[side] = value;
    }
  });

  useLayoutEffect(() => {
    lastShownRef.current = { player: presence.player, enemy: presence.enemy };
  });

  // gli id degli avvisi si ripetono da un round all'altro: si dimenticano quando escono dalla coda
  useEffect(() => {
    const ids = new Set(notices.map((n) => n?.id));
    [landedRef.current, scheduledRef.current].forEach((set) => {
      [...set].forEach((id) => { if (!ids.has(id)) set.delete(id); });
    });
  }, [notices]);

  const shownKey = shown.filter(Boolean).map((n) => n.id).join('|');
  useEffect(() => {
    shown.filter(Boolean).forEach((n) => {
      const delta = presenceNoticeDelta(n);
      if (!delta || landedRef.current.has(n.id) || scheduledRef.current.has(n.id)) return;
      scheduledRef.current.add(n.id);
      const side = n.side;
      const flight = { id: n.id, side, launchAt: performance.now() + PRESENCE_SPARK_DELAY_MS };
      setFlights((list) => [...list, flight]);
      timersRef.current.push(setTimeout(() => {
        landedRef.current.add(n.id);
        if (frozenRef.current[side] != null) {
          frozenRef.current[side] = stepPresenceToward(frozenRef.current[side], liveRef.current?.[side] ?? 0, delta);
        }
        setPulse((p) => ({ ...p, [side]: p[side] + 1 }));
        setFlights((list) => list.filter((f) => f !== flight));
      }, PRESENCE_SPARK_DELAY_MS + PRESENCE_SPARK_FLIGHT_MS));
    });
  }, [shownKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  return { presence, pulse, flights };
}

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function easeIn(u) { const x = clamp(u, 0, 1); return x * x; }
function bez(p0, p1, p2, u) {
  const v = 1 - u;
  return { x: v * v * p0.x + 2 * v * u * p1.x + u * u * p2.x, y: v * v * p0.y + 2 * v * u * p1.y + u * u * p2.y };
}

/** Scintille dall'avviso al contatore Presenza (coordinate della finestra, posizioni lette dal DOM). */
export function EminencePresenceSparks({ flights }) {
  const dotsRef = useRef([]);
  const flightsRef = useRef(flights);
  flightsRef.current = flights;
  const active = flights.length > 0;

  useEffect(() => {
    if (!active) return undefined;
    let raf = 0;
    const frame = () => {
      const t = performance.now();
      let di = 0;
      flightsRef.current.forEach((f) => {
        const banner = document.querySelector(`[data-em-announce="${f.side}"]`);
        const counter = document.querySelector(`.em-zone-${f.side} [data-em-presence]`);
        const ra = banner?.getBoundingClientRect();
        const rp = counter?.getBoundingClientRect();
        if (!ra?.width || !rp?.width) return;
        const fu = (t - f.launchAt) / PRESENCE_SPARK_FLIGHT_MS;
        if (fu < 0 || fu > 1.2) return;
        const to = { x: rp.left + rp.width / 2, y: rp.top + rp.height / 2 };
        // dalla bolla del costo («+1», «−2») se c'è, altrimenti dal bordo dell'avviso verso la carta
        const rc = banner.querySelector('.em-announce-cost')?.getBoundingClientRect();
        const towardRight = to.x > ra.left + ra.width / 2;
        const from = rc?.width
          ? { x: rc.left + rc.width / 2, y: rc.top + rc.height / 2 }
          : { x: towardRight ? ra.right - 10 : ra.left + 10, y: ra.top + ra.height / 2 };
        const mid = { x: (from.x + to.x) / 2, y: Math.min(from.y, to.y) - 120 };
        const color = getComputedStyle(banner).getPropertyValue('--em-ann-phase').trim() || '#e0f2fe';
        for (let q = 0; q < SPARKS && di < dotsRef.current.length; q += 1, di += 1) {
          const d = dotsRef.current[di];
          if (!d) continue;
          const uu = clamp(fu - q * 0.05, 0, 1);
          const pt = bez(from, mid, to, easeIn(uu));
          d.style.opacity = uu > 0 && uu < 1 ? String(1 - q * 0.22) : '0';
          d.style.transform = `translate(${pt.x}px, ${pt.y}px)`;
          d.style.background = q === 0 ? '#fff' : color;
          d.style.boxShadow = `0 0 12px ${color}`;
        }
      });
      for (; di < dotsRef.current.length; di += 1) if (dotsRef.current[di]) dotsRef.current[di].style.opacity = '0';
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      dotsRef.current.forEach((d) => { if (d) d.style.opacity = '0'; });
    };
  }, [active]);

  if (typeof document === 'undefined') return null;
  return createPortal(
    <div className="em-presence-sparks" aria-hidden>
      {Array.from({ length: SPARKS * 3 }, (_, i) => (
        <i key={i} ref={(el) => { dotsRef.current[i] = el; }} />
      ))}
    </div>,
    document.body,
  );
}

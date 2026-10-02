/**
 * Danno visibile: ogni PV tolto (e ogni FC aggiunta, ogni Tossina) ha il suo proiettile, in arco
 * dalla fonte al pannello — dalla carta del vincitore per lo scontro, dalla carta di chi infligge
 * per un Potere o un Bonus, dal portale per il Campo, dalla carta dell'Eminenza per i suoi
 * effetti, dal segno Tossina per il suo danno di fine turno. Le FC sono ambra, la Tossina viola.
 * Ogni impatto coincide con il punto che scende nello StatsPanel (stessi tempi di
 * duelHpPresentation). Canvas 2D a tutta scena.
 */
import React, { useEffect, useRef } from 'react';
import { HP_PROJECTILE_FLIGHT_MS } from '../../game/duel/duelHpPresentation.js';

const W = 1920;
const H = 1080;
const SC = 0.5;
const TRAIL = 6;
const IMPACT_MS = 420;
const PORTAL_COLOR = '#f5f3ec';

function rgba(hex, a) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || '');
  if (!m) return `rgba(245,243,236,${a})`;
  return `rgba(${parseInt(m[1], 16)},${parseInt(m[2], 16)},${parseInt(m[3], 16)},${a})`;
}

function bez(p0, p1, p2, u) {
  const v = 1 - u;
  return { x: v * v * p0.x + 2 * v * u * p1.x + u * u * p2.x, y: v * v * p0.y + 2 * v * u * p1.y + u * u * p2.y };
}

function rectIn(scene, el) {
  if (!scene || !el) return null;
  const rs = scene.getBoundingClientRect();
  const r = el.getBoundingClientRect();
  if (!r.width && !r.height) return null;
  const k = W / (rs.width || W);
  return { x: (r.left - rs.left) * k, y: (r.top - rs.top) * k, w: r.width * k, h: r.height * k };
}

/** Centro del numero PV (o FC) del lato `side`, in coordinate scena (1920×1080). */
function pvTarget(scene, side, stat = 'PV') {
  const sel = stat === 'FC' ? `[data-em-fc="${side}"] .satze-stats-cell__value` : `[data-em-hp="${side}"] .satze-stats-cell__value`;
  const r = rectIn(scene, scene?.querySelector(sel));
  if (!r) return side === 'enemy' ? { x: 100, y: 46 } : { x: 1800, y: 1036 };
  return { x: r.x + r.w / 2, y: r.y + r.h / 2 };
}

/** Punto di partenza del proiettile per la sua fonte. */
function originPoint(scene, origin) {
  if (origin?.card) {
    const r = rectIn(scene, scene?.querySelector(`[data-duel-card="${origin.card}"]`));
    // all'altezza dell'arte della carta
    if (r) return { x: r.x + r.w / 2, y: r.y + r.h * 0.38 };
    return origin.card === 'enemy' ? { x: 600, y: 455 } : { x: 1320, y: 455 };
  }
  if (origin?.toxin) {
    // il danno della Tossina parte dal suo segno nel pannello
    const r = rectIn(scene, scene?.querySelector(`[data-em-tox="${origin.toxin}"]`));
    if (r) return { x: r.x + r.w / 2, y: r.y + r.h / 2 };
    return pvTarget(scene, origin.toxin);
  }
  if (origin?.eminence) {
    const r = rectIn(scene, scene?.querySelector(`.em-zone-${origin.eminence} .em-card`) || scene?.querySelector(`.em-zone-${origin.eminence}`));
    if (r) return { x: r.x + r.w / 2, y: r.y + r.h / 2 };
  }
  const r = rectIn(scene, scene?.querySelector('.satze-bf-portal-disc'));
  if (r) return { x: r.x + r.w / 2, y: r.y + r.h / 2 };
  return { x: 960, y: 380 };
}

const TOXIN_COLOR = '#a855f7';
const FC_COLOR = '#fbbf24';

function colorOf(origin, colors, stat) {
  if (origin?.toxin) return TOXIN_COLOR;
  if (stat === 'FC') return FC_COLOR;
  if (origin?.card) return colors?.[origin.card] || PORTAL_COLOR;
  if (origin?.eminence) return colors?.[origin.eminence] || PORTAL_COLOR;
  return PORTAL_COLOR;
}

export function DuelHpProjectiles({ projectiles, colors }) {
  const cvRef = useRef(null);

  useEffect(() => {
    const cv = cvRef.current;
    if (!cv || !projectiles?.length) return undefined;
    const ctx = cv.getContext('2d');
    const scene = cv.parentElement;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const end = Math.max(...projectiles.map((s) => s.launch)) + HP_PROJECTILE_FLIGHT_MS + IMPACT_MS;
    // traiettoria: ogni proiettile curva un po' diversamente dagli altri della stessa fonte
    const bend = new Map();
    const lanes = projectiles.map((s) => {
      const k = `${JSON.stringify(s.origin)}>${s.target}`;
      const n = bend.get(k) ?? 0;
      bend.set(k, n + 1);
      return n;
    });
    let raf = 0;

    const frame = () => {
      const now = performance.now();
      ctx.clearRect(0, 0, cv.width, cv.height);
      ctx.save();
      ctx.scale(SC, SC);
      projectiles.forEach((s, idx) => {
        const u = (now - s.launch) / HP_PROJECTILE_FLIGHT_MS;
        const hu = (now - (s.launch + HP_PROJECTILE_FLIGHT_MS)) / IMPACT_MS;
        if (u < 0 || hu > 1) return;
        const color = colorOf(s.origin, colors, s.stat);
        const src = originPoint(scene, s.origin);
        const tgt = pvTarget(scene, s.target, s.stat);
        const lane = lanes[idx];
        const ctrl = {
          x: (src.x + tgt.x) / 2 + (lane % 2 ? -1 : 1) * lane * 20,
          y: Math.min(src.y, tgt.y) - 160 - lane * 24,
        };
        if (!reduce && u > 0 && u < 1) {
          for (let j = TRAIL; j >= 1; j -= 1) {
            const tu = u - j * 0.035;
            if (tu <= 0) continue;
            const q = bez(src, ctrl, tgt, tu * tu);
            ctx.fillStyle = rgba(color, 0.7 * (1 - j / TRAIL));
            ctx.beginPath();
            ctx.arc(q.x, q.y, (14 - j * 2) / 2, 0, Math.PI * 2);
            ctx.fill();
          }
          const q = bez(src, ctrl, tgt, u * u);
          ctx.shadowColor = color;
          ctx.shadowBlur = 28;
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(q.x, q.y, 9 * (0.6 + u * 0.6), 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
        // impatto sul numero PV
        if (hu >= 0 && hu <= 1) {
          const rr = (20 + (1 - Math.pow(1 - hu, 3)) * 110) / 2;
          ctx.strokeStyle = rgba(color, 1 - hu);
          ctx.lineWidth = 3 - hu * 2;
          ctx.shadowColor = color;
          ctx.shadowBlur = 20;
          ctx.beginPath();
          ctx.arc(tgt.x, tgt.y, rr, 0, Math.PI * 2);
          ctx.stroke();
          ctx.shadowBlur = 0;
        }
      });
      ctx.restore();
      if (now < end) raf = requestAnimationFrame(frame);
      else ctx.clearRect(0, 0, cv.width, cv.height);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      ctx.clearRect(0, 0, cv.width, cv.height);
    };
  }, [projectiles, colors?.player, colors?.enemy]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!projectiles?.length) return null;
  return (
    <canvas
      ref={cvRef}
      width={W * SC}
      height={H * SC}
      aria-hidden
      style={{ position: 'absolute', left: 0, top: 0, width: W, height: H, pointerEvents: 'none', zIndex: 40 }}
    />
  );
}

export default DuelHpProjectiles;

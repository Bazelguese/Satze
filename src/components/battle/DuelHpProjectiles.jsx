/**
 * Danno visibile: dal vincitore partono tanti proiettili quanti PV toglie, in arco
 * verso il numero PV dello sconfitto. Ogni impatto coincide con il punto che scende
 * nello StatsPanel (stessi tempi di duelHpPresentation). Canvas 2D a tutta scena.
 */
import React, { useEffect, useRef } from 'react';
import { HP_PROJECTILE_FLIGHT_MS, HP_PROJECTILE_GAP_MS } from '../../game/duel/duelHpPresentation.js';

const W = 1920;
const H = 1080;
const SC = 0.5;
const TRAIL = 6;
const IMPACT_MS = 420;

/** Centro (circa all'altezza dell'arte) della carta del vincitore nel risultato zoomato. */
const SOURCE = { enemy: { x: 600, y: 455 }, player: { x: 1320, y: 455 } };

function rgba(hex, a) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || '');
  if (!m) return `rgba(245,243,236,${a})`;
  return `rgba(${parseInt(m[1], 16)},${parseInt(m[2], 16)},${parseInt(m[3], 16)},${a})`;
}

function bez(p0, p1, p2, u) {
  const v = 1 - u;
  return { x: v * v * p0.x + 2 * v * u * p1.x + u * u * p2.x, y: v * v * p0.y + 2 * v * u * p1.y + u * u * p2.y };
}

/** Centro del numero PV del lato `side`, in coordinate scena (1920×1080). */
function pvTarget(scene, side) {
  const cell = scene?.querySelector(`[data-em-hp="${side}"] .satze-stats-cell__value`);
  if (!cell) return side === 'enemy' ? { x: 100, y: 46 } : { x: 1800, y: 1036 };
  const rs = scene.getBoundingClientRect();
  const rc = cell.getBoundingClientRect();
  const k = W / (rs.width || W);
  return { x: (rc.left + rc.width / 2 - rs.left) * k, y: (rc.top + rc.height / 2 - rs.top) * k };
}

export function DuelHpProjectiles({ projectiles, winnerColor }) {
  const cvRef = useRef(null);

  useEffect(() => {
    const cv = cvRef.current;
    if (!cv || !projectiles) return undefined;
    const ctx = cv.getContext('2d');
    const scene = cv.parentElement;
    const { t0, target, count, winner } = projectiles;
    const src = SOURCE[winner] || SOURCE.player;
    const color = winnerColor || '#f5f3ec';
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const end = t0 + (count - 1) * HP_PROJECTILE_GAP_MS + HP_PROJECTILE_FLIGHT_MS + IMPACT_MS;
    let raf = 0;

    const frame = () => {
      const now = performance.now();
      ctx.clearRect(0, 0, cv.width, cv.height);
      ctx.save();
      ctx.scale(SC, SC);
      const tgt = pvTarget(scene, target);
      for (let i = 0; i < count; i++) {
        const launch = t0 + i * HP_PROJECTILE_GAP_MS;
        const u = (now - launch) / HP_PROJECTILE_FLIGHT_MS;
        // arco: sale verso il centro della scena, alternando di poco la curva
        const ctrl = target === 'enemy'
          ? { x: 760 + i * 40, y: 300 - i * 30 }
          : { x: 1250 - i * 40, y: 380 + i * 30 };
        if (!reduce && u > 0 && u < 1) {
          for (let j = TRAIL; j >= 1; j--) {
            const tu = u - j * 0.035;
            if (tu <= 0) continue;
            const q = bez(src, ctrl, tgt, tu * tu);
            ctx.fillStyle = rgba(color, 0.7 * (1 - j / TRAIL));
            ctx.beginPath();
            ctx.arc(q.x, q.y, (14 - j * 2) / 2, 0, Math.PI * 2);
            ctx.fill();
          }
          const q = bez(src, ctrl, tgt, u * u);
          const r = 9 * (0.6 + u * 0.6);
          ctx.shadowColor = color;
          ctx.shadowBlur = 28;
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(q.x, q.y, r, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
        // impatto sul numero PV
        const hu = (now - (launch + HP_PROJECTILE_FLIGHT_MS)) / IMPACT_MS;
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
      }
      ctx.restore();
      if (now < end) raf = requestAnimationFrame(frame);
      else ctx.clearRect(0, 0, cv.width, cv.height);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      ctx.clearRect(0, 0, cv.width, cv.height);
    };
  }, [projectiles, winnerColor]);

  if (!projectiles) return null;
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

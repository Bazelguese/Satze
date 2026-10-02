/**
 * Regia dei passi del duello (fasi 1 e 5): riquadro in alto con fonte, stato ed effetto,
 * fasci dalla riga della carta verso il bersaglio (scheda VA o carta avversaria), impulso
 * attorno alla carta per le stat su sé stessa, timbro ⊘ sul bersaglio di un blocco.
 * Le posizioni si leggono dal DOM (carte, righe, schede VA) in coordinate di scena 1920×1080.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { buildDuelStepFx, currentStepFx } from '../../game/duel/duelStepFx.js';

const W = 1920;
const H = 1080;
const SC = 0.5;
const BEAM_MS = 480;
const TRAIL = 14;
const PULSE_MS = 600;
const BURST_MS = 450;
/** Il riquadro resta per l'animazione del passo (effectStepMs), poi esce: segue il respiro prima del prossimo. */
const CALLOUT_HOLD_MS = 900;

function easeIn(u) { return u * u; }
function ease(u) { return 1 - Math.pow(1 - Math.min(1, Math.max(0, u)), 3); }
function bez(p0, p1, p2, u) {
  const v = 1 - u;
  return { x: v * v * p0.x + 2 * v * u * p1.x + u * u * p2.x, y: v * v * p0.y + 2 * v * u * p1.y + u * u * p2.y };
}
function rgba(hex, a) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || '');
  if (!m) return `rgba(245,243,236,${a})`;
  return `rgba(${parseInt(m[1], 16)},${parseInt(m[2], 16)},${parseInt(m[3], 16)},${a})`;
}

/** Rettangolo di un elemento in coordinate di scena. */
function rectIn(scene, el) {
  if (!scene || !el) return null;
  const rs = scene.getBoundingClientRect();
  const r = el.getBoundingClientRect();
  if (!r.width && !r.height) return null;
  const k = W / (rs.width || W);
  return { x: (r.left - rs.left) * k, y: (r.top - rs.top) * k, w: r.width * k, h: r.height * k };
}

function cardEl(scene, side) {
  return scene?.querySelector(`[data-duel-card="${side}"]`) || null;
}

/** Punto di un riferimento: riga di carta, carta, riga della scheda VA. */
function pointOf(scene, ref) {
  if (ref.card) {
    const card = cardEl(scene, ref.card);
    const rowEl = ref.row ? card?.querySelector(`[data-footer-row="${ref.row}"]`) : null;
    const r = rectIn(scene, rowEl || card);
    if (!r) return null;
    return { x: r.x + r.w / 2, y: r.y + r.h / 2 };
  }
  if (ref.ledger) {
    const led = scene?.querySelector(`[data-va-ledger="${ref.ledger}"]`);
    const target = led?.querySelector(`[data-ledger-row="${ref.mod}"]`) || led?.querySelector('[data-ledger-total]') || led;
    const r = rectIn(scene, target);
    if (!r) return null;
    // ingresso dal lato della scheda verso il centro
    return { x: ref.ledger === 'enemy' ? r.x + r.w : r.x, y: r.y + r.h / 2 };
  }
  return null;
}

export function DuelStepFx({ battleResult, duelPhase, duelEffectStep }) {
  const list = useMemo(() => (battleResult ? buildDuelStepFx(battleResult) : []), [battleResult]);
  const cur = currentStepFx(list, duelPhase, duelEffectStep);
  const duelStamp = battleResult
    ? [battleResult.playerAgent?.id, battleResult.enemyAgent?.id, battleResult.playerAssault, battleResult.enemyAssault, battleResult.finalPlayerHP, battleResult.finalEnemyHP].join('|')
    : '';
  const curKey = cur ? `${duelStamp}:${cur.phase}:${cur.step}` : null;

  // riquadro: entra con lo step, esce poco prima del successivo
  const [leavingKey, setLeavingKey] = useState(null);
  useEffect(() => {
    if (!curKey) return undefined;
    const id = setTimeout(() => setLeavingKey(curKey), CALLOUT_HOLD_MS);
    return () => clearTimeout(id);
  }, [curKey]);
  const leaving = leavingKey != null && leavingKey === curKey;

  // fasci, impulso, timbro
  const cvRef = useRef(null);
  useEffect(() => {
    const cv = cvRef.current;
    if (!cv || !cur) return undefined;
    const ctx = cv.getContext('2d');
    const scene = cv.parentElement;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const t0 = performance.now();
    const end = Math.max(
      0,
      ...cur.beams.map((b) => b.delay + BEAM_MS * 1.35),
      cur.pulse ? 80 + 160 + PULSE_MS : 0,
      cur.burst ? cur.burst.delay + BURST_MS : 0
    );
    let raf = 0;
    const frame = () => {
      const local = performance.now() - t0;
      ctx.clearRect(0, 0, cv.width, cv.height);
      ctx.save();
      ctx.scale(SC, SC);
      if (!reduce) {
        cur.beams.forEach((bm) => {
          const p0 = pointOf(scene, bm.from);
          const p2 = pointOf(scene, bm.to);
          if (!p0 || !p2) return;
          const p1 = { x: (p0.x + p2.x) / 2, y: Math.min(p0.y, p2.y) - 200 };
          const bu = (local - bm.delay) / BEAM_MS;
          if (bu <= 0 || bu > 1.35) return;
          for (let i = TRAIL - 1; i >= 0; i -= 1) {
            const uu = bu - i * 0.035;
            if (uu <= 0 || uu >= 1) continue;
            const q = bez(p0, p1, p2, easeIn(uu));
            const fade = bu > 1.1 ? 1 - (bu - 1.1) / 0.25 : 1;
            ctx.globalAlpha = Math.max(0, (1 - i / TRAIL) * fade);
            ctx.shadowColor = bm.color;
            ctx.shadowBlur = 12;
            ctx.fillStyle = i === 0 ? '#ffffff' : bm.color;
            ctx.beginPath();
            ctx.arc(q.x, q.y, 6 * (1 - i * 0.05), 0, Math.PI * 2);
            ctx.fill();
          }
        });
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
        if (cur.pulse) {
          const r = rectIn(scene, cardEl(scene, cur.pulse.side));
          if (r) {
            for (let i = 0; i < 2; i += 1) {
              const pu = (local - 80 - i * 160) / PULSE_MS;
              if (pu <= 0 || pu >= 1) continue;
              const w = r.w * (1 + pu * 0.35);
              const h = r.h * (1 + pu * 0.25);
              ctx.strokeStyle = rgba(cur.pulse.color, 1 - pu);
              ctx.lineWidth = 2;
              ctx.shadowColor = cur.pulse.color;
              ctx.shadowBlur = 18;
              ctx.beginPath();
              ctx.roundRect(r.x + r.w / 2 - w / 2, r.y + r.h / 2 - h / 2, w, h, 14);
              ctx.stroke();
            }
            ctx.shadowBlur = 0;
          }
        }
        if (cur.burst) {
          const p = pointOf(scene, cur.burst);
          const bu = (local - cur.burst.delay) / BURST_MS;
          if (p && bu >= 0 && bu <= 1) {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate((-15 * Math.PI) / 180);
            const k = 1.8 - ease(bu / 0.3) * 0.9;
            ctx.scale(k, k);
            ctx.globalAlpha = bu < 0.6 ? 1 : 1 - (bu - 0.6) / 0.4;
            ctx.fillStyle = cur.burst.color;
            ctx.shadowColor = cur.burst.color;
            ctx.shadowBlur = 16;
            ctx.font = '800 64px "Chakra Petch", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('⊘', 0, 0);
            ctx.restore();
          }
        }
      }
      ctx.restore();
      if (local < end) raf = requestAnimationFrame(frame);
      else ctx.clearRect(0, 0, cv.width, cv.height);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      ctx.clearRect(0, 0, cv.width, cv.height);
    };
  }, [curKey]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!cur) return null;
  return (
    <>
      <canvas
        ref={cvRef}
        width={W * SC}
        height={H * SC}
        aria-hidden
        style={{ position: 'absolute', left: 0, top: 0, width: W, height: H, pointerEvents: 'none', zIndex: 44 }}
      />
      <div key={curKey} className={`satze-step-callout${leaving ? ' is-leaving' : ''}`} style={{ '--sc': cur.color }} data-step-callout>
        <div className="satze-step-callout__card">
          <div className="satze-step-callout__head">
            <div className="satze-step-callout__src">
              {cur.src} · <span className="k">{cur.k}</span>
            </div>
            <span className="satze-step-callout__tag">{cur.tag}</span>
          </div>
          {cur.eff ? <div className={`satze-step-callout__eff${cur.state === 'blocked' ? ' is-struck' : ''}`}>{cur.eff}</div> : null}
          {cur.tgt ? <div className="satze-step-callout__tgt">{cur.tgt}</div> : null}
        </div>
        {cur.subs.map((s) => (
          <div key={`${s.side}-${s.row}`} className="satze-step-callout__sub">
            <span className="satze-step-callout__tag">NON SODDISFATTO</span>
            <span>{s.text}</span>
          </div>
        ))}
      </div>
    </>
  );
}

export default DuelStepFx;

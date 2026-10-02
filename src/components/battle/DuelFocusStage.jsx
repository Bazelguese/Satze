/**
 * Conta scenica delle Focus Coin (fasi 2-4). Ogni moneta parte dalla riga FC della scheda VA,
 * sale sopra la carta e ci sbatte dentro (onde d'urto, sobbalzo della carta, contatore «×N»),
 * poi prende posto su un'orbita ellittica attorno alla base della carta, davanti o dietro;
 * l'orbita accelera a ogni moneta. Nello scontro le monete collassano nella carta e svaniscono.
 * Le posizioni si leggono dal DOM (carte, schede VA) in coordinate di scena 1920×1080.
 */
import React, { useEffect, useRef } from 'react';
import { Icon } from '../ui/Icon';
import { DUEL_VISUAL_DEFAULTS, DUEL_PHASE4_MIN_MS, computeDynamicClashVfx } from '../../config/duelVisualConfig.js';
import { FOCUS_RISE_MS, FOCUS_SLAM_MS } from './useFocusLaunches.js';
import { getDuelFocusPhasePower } from './duelVisualDisplay.js';
import { warpClashTime } from '../../game/duel/duelClashMotion.js';

const W = 1920;
const SIDES = ['enemy', 'player'];
/** Larghezza della carta a cui sono riferite le misure del mockup. */
const CARD_W = 238;
const ORBIT_RX = 196;
const ORBIT_RY = 60;
const MAX_COINS = 14;

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function ease(u) { const x = clamp(u, 0, 1); return 1 - Math.pow(1 - x, 3); }
function easeIn(u) { const x = clamp(u, 0, 1); return x * x; }
function ss(a, b, x) { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }
function pop(t, at, dur, amt = 0.35) { const d = t - at; if (d < 0 || d > dur) return 1; return 1 + amt * Math.sin((Math.PI * d) / dur); }
function hexA(hex, a) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || '');
  if (!m) return `rgba(245,243,236,${a})`;
  return `rgba(${parseInt(m[1], 16)},${parseInt(m[2], 16)},${parseInt(m[3], 16)},${a})`;
}

function rectIn(scene, el) {
  if (!scene || !el) return null;
  const rs = scene.getBoundingClientRect();
  const r = el.getBoundingClientRect();
  if (!r.width) return null;
  const k = W / (rs.width || W);
  return { x: (r.left - rs.left) * k, y: (r.top - rs.top) * k, w: r.width * k, h: r.height * k };
}

/** Angolo dell'orbita: parte lenta, accelera a ogni moneta atterrata. */
function orbitAngle(slams, t, sign) {
  if (!slams.length) return 0;
  let ang = 0;
  let prev = slams[0] - FOCUS_SLAM_MS;
  let spd = 0.9;
  for (let i = 0; i < slams.length; i += 1) {
    if (t <= slams[i]) break;
    ang += (spd * (Math.min(t, slams[i]) - prev)) / 1000;
    prev = slams[i];
    spd = 0.9 + (i + 1) * 0.55;
  }
  if (t > prev) ang += (spd * (t - prev)) / 1000;
  return ang * sign;
}

function Coin({ army, accent, refFn }) {
  return (
    <div
      ref={refFn}
      className="satze-focus-coin"
      style={{ border: `1px solid ${accent}`, backgroundColor: hexA(accent, 0.24) }}
    >
      {army ? <Icon name={army} type="army" size={24} /> : <Icon name="coin" type="cardIcon" size={24} />}
    </div>
  );
}

export function DuelFocusStage({ battleResult, duelPhase, launchesRef, accent }) {
  const refs = useRef({ enemy: {}, player: {} });
  const backRef = useRef(null);
  const frontRef = useRef(null);
  const p4StartRef = useRef(null);

  const total = {
    player: Math.min(MAX_COINS, Number(battleResult?.playerFocusUsed) || 0),
    enemy: Math.min(MAX_COINS, Number(battleResult?.enemyFocusUsed) || 0),
  };
  // POT del Calcolo (dopo gli effetti), come nella scheda VA
  const power = {
    player: battleResult ? getDuelFocusPhasePower(battleResult, true) ?? 0 : 0,
    enemy: battleResult ? getDuelFocusPhasePower(battleResult, false) ?? 0 : 0,
  };

  if (duelPhase === 4 && p4StartRef.current == null) p4StartRef.current = performance.now();
  if (duelPhase < 4) p4StartRef.current = null;

  const live = duelPhase >= 2 && duelPhase <= 4;

  useEffect(() => {
    if (!live || !battleResult) return undefined;
    const scene = frontRef.current?.parentElement;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const { clashSpeed } = computeDynamicClashVfx(battleResult);
    const dur4 = Math.max(DUEL_PHASE4_MIN_MS, Math.round(DUEL_VISUAL_DEFAULTS.phaseMs4 / (clashSpeed > 0 ? clashSpeed : 1)));
    let raf = 0;
    const frame = () => {
      const t = performance.now();
      const inClash = p4StartRef.current != null;
      // stesso tempo deformato dello scontro: le monete collassano mentre le carte si scontrano
      const u = inClash ? warpClashTime((t - p4StartRef.current) / dur4) : 0;
      const collapse = inClash ? ss(0.37, 0.445, u) : 0;
      const pull = inClash ? ss(0.395, 0.445, u) : 0;
      const vanish = inClash ? ss(0.44, 0.52, u) : 0;
      // nello scontro le monete passano sopra lo strato della sequenza Aurora (z 58)
      if (backRef.current) backRef.current.style.zIndex = inClash ? '57' : '4';
      if (frontRef.current) frontRef.current.style.zIndex = inClash ? '59' : '6';

      SIDES.forEach((side) => {
        const R = refs.current[side];
        const card = scene?.querySelector(`[data-duel-card="${side}"]`);
        const r = rectIn(scene, card);
        const n = total[side];
        const launches = launchesRef.current?.[side] || [];
        if (!r || !n) {
          if (R.orbit) R.orbit.style.opacity = '0';
          if (R.counter) R.counter.style.opacity = '0';
          (R.front || []).forEach((el) => { if (el) el.style.opacity = '0'; });
          (R.back || []).forEach((el) => { if (el) el.style.opacity = '0'; });
          return;
        }
        const sc = r.w / CARD_W;
        const cx = r.x + r.w / 2;
        const cy = r.y + r.h / 2;
        const oc = { x: cx, y: cy + 24 * sc };
        const cnt = { x: cx, y: r.y - 92 };
        const slams = launches.map((l) => l + FOCUS_SLAM_MS);
        const landed = slams.filter((s) => t >= s).length;
        const cg = n ? landed / n : 0;
        const lastSlam = landed > 0 ? slams[landed - 1] : -1e9;
        const sign = side === 'enemy' ? 1 : -1;
        const angBase = reduce ? 0 : orbitAngle(slams, t, sign);
        const fcEl = scene.querySelector(`[data-va-ledger="${side}"] [data-ledger-fc]`);
        const fr = rectIn(scene, fcEl);
        const src = fr ? { x: fr.x + fr.w / 2, y: fr.y + fr.h / 2 } : cnt;

        for (let i = 0; i < MAX_COINS; i += 1) {
          const fEl = R.front?.[i];
          const bEl = R.back?.[i];
          if (!fEl || !bEl) continue;
          const launch = launches[i];
          if (i >= n || launch == null || vanish >= 1) { fEl.style.opacity = '0'; bEl.style.opacity = '0'; continue; }
          const slot = i / n;
          const ang = (angBase + slot * Math.PI * 2 - Math.PI / 2) * (1 + collapse * 0.35);
          const rx = ORBIT_RX * sc * (1 - collapse) * (1 - pull);
          const ry = ORBIT_RY * sc * (1 - collapse) * (1 - pull);
          const ox = oc.x + Math.cos(ang) * rx;
          const oy = oc.y + Math.sin(ang) * ry;
          let front = Math.sin(ang) > 0;
          let px; let py; let scl; let vis = 1;
          const sl = launch + FOCUS_SLAM_MS;
          if (inClash) {
            px = ox; py = oy; vis = (1 - vanish) * 0.95; scl = (1 - collapse * 0.25) * (front ? 1 : 0.82);
          } else if (t < launch + FOCUS_RISE_MS) {
            const q = ease((t - launch) / FOCUS_RISE_MS);
            px = src.x + (cnt.x - src.x) * q; py = src.y + (cnt.y - src.y) * q - Math.sin(Math.PI * q) * 60;
            scl = 0.7 + q * 0.9; front = true;
          } else if (t < sl) {
            const q = easeIn((t - launch - FOCUS_RISE_MS) / (FOCUS_SLAM_MS - FOCUS_RISE_MS));
            px = cnt.x; py = cnt.y + (cy - cnt.y) * q; scl = 1.6 - q * 0.4; front = true;
          } else if (t < sl + 320) {
            const q = ease((t - sl) / 320);
            px = cx + (ox - cx) * q; py = cy + (oy - cy) * q;
            scl = 1.2 - q * (1.2 - (front ? 1 : 0.82));
            if (q < 0.5) front = true;
          } else {
            px = ox; py = oy; scl = front ? 1 : 0.82;
          }
          const el = front ? fEl : bEl;
          const other = front ? bEl : fEl;
          other.style.opacity = '0';
          el.style.opacity = String(vis);
          el.style.transform = `translate(${px}px, ${py}px) scale(${scl * sc})`;
          el.style.boxShadow = `0 0 ${8 + landed * 3}px ${accent[side]}`;
        }

        // orbita
        if (R.orbit) {
          const on = inClash ? 0 : 0.25 + 0.55 * cg;
          R.orbit.style.opacity = launches.length ? String(on) : '0';
          R.orbit.style.width = `${ORBIT_RX * 2 * sc}px`;
          R.orbit.style.height = `${ORBIT_RY * 2 * sc}px`;
          R.orbit.style.transform = `translate(${oc.x}px, ${oc.y}px) translate(-50%, -50%) scale(${1 + (1 - cg) * 0.15})`;
          R.orbit.style.boxShadow = `0 0 ${8 + cg * 26}px ${hexA(accent[side], 0.5)}`;
        }
        // contatore
        if (R.counter) {
          const show = !inClash && launches.length > 0;
          R.counter.style.opacity = show ? '1' : '0';
          R.counter.style.transform = `translate(${cnt.x}px, ${cnt.y}px) translate(-50%, -50%) scale(${reduce ? 1 : pop(t, lastSlam, 280, 0.45)})`;
          if (R.counterN && R.counterN.textContent !== String(landed)) R.counterN.textContent = String(landed);
          const f = `POT ${power[side]} × ${landed} = `;
          if (R.counterF && R.counterF.dataset.v !== f) {
            R.counterF.dataset.v = f;
            R.counterF.firstChild.textContent = f;
            R.counterF.lastChild.textContent = String(power[side] * landed);
          }
          R.counter.style.textShadow = `0 0 ${14 + cg * 30}px ${accent[side]}, 0 4px 12px #000`;
        }
        // onde d'urto dell'ultima moneta
        (R.shock || []).forEach((el, j) => {
          if (!el) return;
          const su = (t - lastSlam - j * 70) / 420;
          if (reduce || inClash || su < 0 || su > 1) { el.style.opacity = '0'; return; }
          const sz = (60 + ease(su) * (340 + j * 80)) * sc;
          el.style.width = `${sz}px`;
          el.style.height = `${sz}px`;
          el.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%)`;
          el.style.border = `${3 - su * 2}px solid ${j ? '#f5f3ec' : accent[side]}`;
          el.style.opacity = String((1 - su) * (j ? 0.6 : 1));
        });
        // sobbalzo della carta a ogni colpo (solo la carta del risultato, non quella dello scontro)
        if (card && !inClash) {
          let kick = 1;
          if (!reduce) slams.forEach((s) => { kick = Math.max(kick, pop(t, s, 200, 0.04)); });
          card.style.scale = kick > 1.0005 ? String(kick) : '';
          card.style.filter = kick > 1.0005 ? `brightness(${1 + (kick - 1) * 6})` : '';
        }
      });
      if (p4StartRef.current == null || (t - p4StartRef.current) / dur4 < 0.6) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [live, battleResult, launchesRef, accent?.player, accent?.enemy]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!live || !battleResult) return null;
  const agentOf = (side) => (side === 'player' ? battleResult.playerAgent : battleResult.enemyAgent);
  const setRef = (side, group, i) => (el) => {
    const R = refs.current[side];
    if (group === 'front' || group === 'back' || group === 'shock') {
      R[group] = R[group] || [];
      R[group][i] = el;
    } else R[group] = el;
  };

  return (
    <>
      <div ref={backRef} className="satze-focus-layer" style={{ zIndex: 4 }} aria-hidden>
        {SIDES.map((side) => (
          <React.Fragment key={side}>
            <div ref={setRef(side, 'orbit')} className="satze-focus-orbit" style={{ borderColor: hexA(accent[side], 0.55) }} />
            {Array.from({ length: MAX_COINS }, (_, i) => (
              <Coin key={i} army={agentOf(side)?.army} accent={accent[side]} refFn={setRef(side, 'back', i)} />
            ))}
          </React.Fragment>
        ))}
      </div>
      <div ref={frontRef} className="satze-focus-layer" style={{ zIndex: 6 }} aria-hidden>
        {SIDES.map((side) => (
          <React.Fragment key={side}>
            {[0, 1].map((j) => <div key={j} ref={setRef(side, 'shock', j)} className="satze-focus-shock" />)}
            {Array.from({ length: MAX_COINS }, (_, i) => (
              <Coin key={i} army={agentOf(side)?.army} accent={accent[side]} refFn={setRef(side, 'front', i)} />
            ))}
            <div ref={setRef(side, 'counter')} className="satze-focus-counter">
              <div className="satze-focus-counter__x"><small>×</small><span ref={setRef(side, 'counterN')} /></div>
              <div ref={setRef(side, 'counterF')} className="satze-focus-counter__f"><span /><b /></div>
            </div>
          </React.Fragment>
        ))}
      </div>
    </>
  );
}

export default DuelFocusStage;

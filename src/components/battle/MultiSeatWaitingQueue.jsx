// ============================================================
// Agenti in attesa nelle modalità a più posti
// ============================================================
// Mentre si gioca uno scontro, gli Agenti degli scontri successivi del turno aspettano
// dietro la posizione di partenza del loro lato, sfocati e più piccoli; più sono lontani nella
// coda, più sono indietro. Al passaggio allo scontro dopo, il primo della coda avanza al suo
// posto perdendo la sfocatura (playMultiSeatArrival), senza uscire dalla vista del duello.
// ============================================================

import React from 'react';
import { GameCard } from '../cards/GameCard';
import '../../styles/satze-multi-seat.css';

/** Posizione in coda (0 = il prossimo): spostamento verso l'esterno e in alto, scala, sfocatura. */
export function waitDepth(k) {
  return {
    dx: 150 + 74 * k,
    dy: -58 - 40 * k,
    scale: 0.8 - 0.09 * k,
    blur: 3 + 2 * k,
    opacity: Math.max(0.3, 0.72 - 0.16 * k),
  };
}

const SIDES = ['player', 'enemy'];
const ARRIVAL_MS = { advance: 900, stay: 600, swap: 850 };

function rectOf(el) {
  const r = el?.getBoundingClientRect();
  return r && r.width > 4 ? { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width } : null;
}

/** La carta visibile di un lato: la più grande fra quelle segnate `data-duel-card`. */
function fieldCardOf(side) {
  let best = null;
  for (const el of document.querySelectorAll(`[data-duel-card="${side}"] > *`)) {
    const r = rectOf(el);
    if (r && (!best || r.w > best.w) && Number(getComputedStyle(el).opacity) > 0.05) best = r;
  }
  return best;
}

/**
 * Rettangoli al clic di «Prossimo duello»: le carte in campo e le prime della coda per lato.
 * Servono da punto di partenza all'arrivo dello scontro dopo.
 */
export function readMultiSeatRects() {
  if (typeof document === 'undefined') return null;
  const out = { field: {}, wait: {} };
  for (const side of SIDES) {
    out.field[side] = fieldCardOf(side);
    out.wait[side] = rectOf(document.querySelector(`.ms-zone-${side} .ms-queue-card`));
  }
  return out;
}

/**
 * Arrivo degli Agenti nello scontro dopo, restando nella vista del duello: ogni carta parte da
 * dove era (in coda, sfocata; o in campo, anche dall'altro lato) e arriva al suo posto.
 * @param {{ player: string|null, enemy: string|null }} entry - 'advance' | 'stay' | 'swap'
 * @param {ReturnType<typeof readMultiSeatRects>} rects
 */
export function playMultiSeatArrival(entry, rects) {
  if (typeof document === 'undefined' || !rects) return;
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  for (const side of SIDES) {
    const kind = entry?.[side];
    if (!kind) continue;
    const el = document.querySelector(`.ms-zone-${side} [data-duel-card="${side}"] > *`);
    const to = rectOf(el);
    const other = side === 'player' ? 'enemy' : 'player';
    const from = kind === 'advance' ? rects.wait[side] : kind === 'swap' ? rects.field[other] : rects.field[side];
    if (!el || !to || !from || reduce || typeof el.animate !== 'function') continue;
    // la carta sta in una zona scalata: gli spostamenti vanno nelle sue unità
    const k = to.w / (el.offsetWidth || to.w);
    const dx = (from.x - to.x) / k;
    const dy = (from.y - to.y) / k;
    const s = from.w / to.w;
    const start = { transform: `translate(${dx}px, ${dy}px) scale(${s})` };
    if (kind === 'advance') {
      const d = waitDepth(0);
      Object.assign(start, { filter: `blur(${d.blur}px) brightness(0.62) saturate(0.75)`, opacity: d.opacity });
    }
    const frames = kind === 'swap'
      ? [start, { transform: `translate(${dx / 2}px, ${dy / 2 - 30}px) scale(${(s + 1) / 2 * 1.03})`, offset: 0.5 }, { transform: 'none' }]
      : [start, { transform: 'none', filter: 'none', opacity: 1 }];
    el.animate(frames, { duration: ARRIVAL_MS[kind], easing: 'cubic-bezier(0.22, 0.7, 0.2, 1)', fill: 'backwards' });
  }
}

export function MultiSeatWaitingQueue({ side, entries, cardLayout }) {
  if (!entries?.length) return null;
  const dir = side === 'enemy' ? -1 : 1;
  return (
    <div className="ms-queue" aria-hidden>
      {entries.map((e, k) => {
        const d = waitDepth(k);
        return (
          <div
            key={`${e.seatId}-${e.cardId}`}
            className="ms-queue-card"
            style={{
              zIndex: entries.length - k,
              transform: `translate(-50%, -50%) translate(${dir * d.dx}px, ${d.dy}px) scale(${d.scale})`,
              filter: `blur(${d.blur}px) brightness(0.62) saturate(0.75)`,
              opacity: d.opacity,
            }}
          >
            <GameCard cardLayout={cardLayout} agent={e.agent} />
          </div>
        );
      })}
    </div>
  );
}

import React, { useEffect, useRef, useState } from 'react';
import { ARMY_COLORS } from '../../data/armies.js';
import { inkOn } from './eminenceUi.js';
import '../../styles/em-stati.css';

/**
 * Stati che durano oltre il Duello (debito, soglia di Ancorato, Bonus d'Armata sostituito,
 * Eminenza bloccata): targhette accanto alla targa PV·FC·PR del lato che li subisce.
 * Gli stati arrivano da `buildLastingStates`. Coordinate di scena (1920×1080).
 */
function plateRect(scene, side) {
  const el = scene.querySelector(`.satze-stats-panel--${side}`);
  if (!el) return null;
  const sr = scene.getBoundingClientRect();
  const r = el.getBoundingClientRect();
  if (r.width < 4) return null;
  const k = sr.width / (scene.offsetWidth || sr.width) || 1;
  return { x: (r.left - sr.left) / k, y: (r.top - sr.top) / k, w: r.width / k, h: r.height / k };
}

const moved = (a, b) => !a !== !b || (a && (Math.abs(a.x - b.x) > 0.6 || Math.abs(a.y - b.y) > 0.6 || Math.abs(a.w - b.w) > 0.6));

export function EminenceLastingStates({ states, hidden = false }) {
  const rootRef = useRef(null);
  const [rects, setRects] = useState({ player: null, enemy: null });
  const any = Boolean(states?.player?.length || states?.enemy?.length);

  useEffect(() => {
    if (!any) return undefined;
    let raf = 0;
    let last = { player: null, enemy: null };
    const tick = () => {
      const scene = rootRef.current?.offsetParent;
      if (scene) {
        const next = { player: plateRect(scene, 'player'), enemy: plateRect(scene, 'enemy') };
        if (moved(next.player, last.player) || moved(next.enemy, last.enemy)) { last = next; setRects(next); }
      }
      raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [any]);

  if (!any) return null;

  return (
    <div ref={rootRef} className={`em-stati${hidden ? ' is-hidden' : ''}`}>
      {['enemy', 'player'].map((side) => {
        const rect = rects[side];
        const list = states[side] || [];
        if (!rect || !list.length) return null;
        // nemico: sotto la targa, allineate a sinistra · giocatore: sopra la targa, allineate a destra
        const style = side === 'enemy'
          ? { left: rect.x, top: rect.y + rect.h + 8 }
          : { left: rect.x + rect.w, top: rect.y - 8 };
        return (
          <ul key={side} className={`em-stati-list em-stati-list--${side}`} style={style}>
            {list.map((entry, i) => {
              const accent = ARMY_COLORS[entry.army]?.accent || '#f5c451';
              return (
                <li
                  key={entry.key}
                  className={`em-stati-chip em-stati-chip--${entry.kind}`}
                  style={{ '--em-t-acc': accent, '--em-t-ink': inkOn(accent), '--i': i }}
                  title={entry.text || undefined}
                >
                  <span className="em-stati-label">{entry.label}</span>
                  <span className="em-stati-word">{entry.word}</span>
                </li>
              );
            })}
          </ul>
        );
      })}
    </div>
  );
}

export default EminenceLastingStates;

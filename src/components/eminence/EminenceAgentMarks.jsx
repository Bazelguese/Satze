import React, { useEffect, useRef, useState } from 'react';
import { ARMY_COLORS } from '../../data/armies.js';
import { inkOn } from './eminenceUi.js';
import '../../styles/em-segni.css';

/**
 * Segni delle Eminenze sugli Agenti in gioco: targhette sotto la carta schierata che dicono
 * che cosa le ha cambiato un'abilità (Potere bloccato, Bonus sostituito, +2 FC temporanei…)
 * e restano per tutto il Duello. I segni arrivano da `buildAgentMarks`.
 * Coordinate di scena (1920×1080): segue la carta vera, anche mentre si muove.
 */
const ROW_LABELS = { power: 'Potere', bonus: 'Bonus', trigger: 'Trigger', agent: 'Agente' };

function cardRect(scene, side) {
  // nel Duello le carte stanno nella scena dello scontro; prima, sul tavolo
  const zone = scene.querySelector(`[data-field-agent="${side}"]`);
  const el = scene.querySelector(`[data-duel-card="${side}"]`) || zone?.querySelector('.place-card') || zone;
  if (!el) return null;
  const sr = scene.getBoundingClientRect();
  const r = el.getBoundingClientRect();
  if (r.width < 4) return null;
  const k = sr.width / (scene.offsetWidth || sr.width) || 1;
  return { x: (r.left - sr.left) / k, y: (r.top - sr.top) / k, w: r.width / k, h: r.height / k };
}

const moved = (a, b) => !a !== !b || (a && (Math.abs(a.x - b.x) > 0.6 || Math.abs(a.y - b.y) > 0.6 || Math.abs(a.w - b.w) > 0.6 || Math.abs(a.h - b.h) > 0.6));

export function EminenceAgentMarks({ marks, hidden = false }) {
  const rootRef = useRef(null);
  const [rects, setRects] = useState({ player: null, enemy: null });
  const any = Boolean(marks?.player?.length || marks?.enemy?.length);

  useEffect(() => {
    if (!any) return undefined;
    let raf = 0;
    let last = { player: null, enemy: null };
    const tick = () => {
      const scene = rootRef.current?.offsetParent;
      if (scene) {
        const next = { player: cardRect(scene, 'player'), enemy: cardRect(scene, 'enemy') };
        if (moved(next.player, last.player) || moved(next.enemy, last.enemy)) { last = next; setRects(next); }
      }
      raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [any]);

  if (!any) return null;

  return (
    <div ref={rootRef} className={`em-segni${hidden ? ' is-hidden' : ''}`}>
      {['enemy', 'player'].map((side) => {
        const rect = rects[side];
        const list = marks[side] || [];
        if (!rect || !list.length) return null;
        return (
          <ul key={side} className={`em-segni-list em-segni-list--${side}`} style={{ left: rect.x + rect.w / 2, top: rect.y + rect.h + 12, width: Math.max(340, rect.w + 150) }}>
            {list.map((mark, i) => {
              const accent = ARMY_COLORS[mark.army]?.accent || '#f5c451';
              return (
                <li
                  key={mark.key}
                  className={`em-segni-chip em-segni-chip--${mark.row}${mark.conditional ? ' is-conditional' : ''}`}
                  style={{ '--em-s-acc': accent, '--em-s-ink': inkOn(accent), '--i': i }}
                  title={`${mark.abilityName}: ${mark.text}`}
                >
                  <span className="em-segni-row">{ROW_LABELS[mark.row] || 'Agente'}</span>
                  <span className="em-segni-word">{mark.conditional ? `${mark.word} · se riesce` : mark.word}</span>
                  <span className="em-segni-from">{mark.abilityName}</span>
                </li>
              );
            })}
          </ul>
        );
      })}
    </div>
  );
}

export default EminenceAgentMarks;

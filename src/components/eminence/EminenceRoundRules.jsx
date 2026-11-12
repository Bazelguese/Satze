import React, { useEffect, useRef, useState } from 'react';
import { ARMY_COLORS } from '../../data/armies.js';
import { inkOn } from './eminenceUi.js';
import { semaforoLamp } from './eminenceEffectFx.js';
import '../../styles/em-regole.css';

/**
 * Regole del round: targa sopra il portale che tiene scritto ciò che un'abilità ha cambiato
 * per entrambi i giocatori (luce del Grande Semaforo, Silenzio) finché vale.
 * Le regole arrivano da `buildRoundRules`. Coordinate di scena (1920×1080).
 */
const LINE_COPY = {
  forced: { mark: '✓', word: 'soddisfatti', one: 'soddisfatto' },
  forbidden: { mark: '✕', word: 'non si attivano', one: 'non si attiva' },
  replaced: { mark: '→', word: 'è il trigger Potere di entrambi', one: 'è il trigger Potere di entrambi' },
};
const LAMP_ORDER = ['rosso', 'giallo', 'verde'];

function portalRect(scene, selector) {
  const el = [...scene.querySelectorAll(selector)].find((node) => node.getBoundingClientRect().width > 4);
  if (!el) return null;
  const sr = scene.getBoundingClientRect();
  const r = el.getBoundingClientRect();
  const k = sr.width / (scene.offsetWidth || sr.width) || 1;
  return { x: (r.left - sr.left + r.width / 2) / k, y: (r.top - sr.top) / k };
}

export function EminenceRoundRules({ rules, hidden = false, anchorSelector = '.satze-bf-portal' }) {
  const rootRef = useRef(null);
  const [pos, setPos] = useState(null);
  const any = Boolean(rules?.length);

  useEffect(() => {
    if (!any) return undefined;
    let raf = 0;
    let last = null;
    const tick = () => {
      const scene = rootRef.current?.offsetParent;
      const next = scene ? portalRect(scene, anchorSelector) : null;
      if (!next !== !last || (next && (Math.abs(next.x - last.x) > 0.6 || Math.abs(next.y - last.y) > 0.6))) { last = next; setPos(next); }
      raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [any, anchorSelector]);

  if (!any) return null;

  return (
    <div ref={rootRef} className={`em-regole${hidden ? ' is-hidden' : ''}`}>
      {pos && (
        <ul className="em-regole-list" style={{ left: pos.x, top: pos.y - 40 }}>
          {rules.map((rule) => {
            const accent = ARMY_COLORS[rule.army]?.accent || '#f5c451';
            const lamp = semaforoLamp(rule.abilityName);
            const lit = lamp ? String(rule.abilityName).trim().toLowerCase() : null;
            return (
              <li
                key={rule.key}
                className="em-regole-plate"
                style={{ '--em-r-acc': lamp || accent, '--em-r-ink': inkOn(lamp || accent) }}
                title={`${rule.abilityName}: ${rule.text}`}
              >
                {lamp ? (
                  <span className="em-regole-lamps" aria-hidden="true">
                    {LAMP_ORDER.map((name) => <i key={name} className={name === lit ? 'is-lit' : ''} />)}
                  </span>
                ) : (
                  <span className="em-regole-seal" aria-hidden="true" />
                )}
                <span className="em-regole-body">
                  <span className="em-regole-head">
                    <b>{rule.abilityName}</b>
                    <em>regola del round · vale per entrambi</em>
                  </span>
                  {rule.lines.map((line, i) => {
                    const copy = LINE_COPY[line.kind];
                    return (
                      <span key={i} className={`em-regole-line em-regole-line--${line.kind}`}>
                        <i>{copy.mark}</i>
                        <strong>{line.triggers.join(' · ')}</strong>
                        <span>{line.triggers.length > 1 ? copy.word : copy.one}</span>
                      </span>
                    );
                  })}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default EminenceRoundRules;

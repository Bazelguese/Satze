import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ARMY_COLORS } from '../../data/armies.js';
import { inkOn } from './eminenceUi.js';
import { targetSelector } from './eminenceTargetRequest.js';
import '../../styles/em-bersaglio.css';

/**
 * Scelta di un bersaglio direttamente sul tavolo: carta in mano o Campo nella lista.
 * Il portale resta piccolo e fa da guida; un faro isola la zona, i bersagli validi si accendono,
 * quello a fuoco (mouse o tastiera) cresce e un fascio lo lega al portale. Un clic lo sceglie
 * e le risposte compaiono accanto a lui.
 *
 * Non ridisegna carte e Campi: misura quelli veri e ci si appoggia sopra, marcandoli con
 * `data-em-pick` (legal | focus | chosen | off) perché il CSS li ingrandisca o li spenga.
 * Coordinate di scena (1920×1080).
 */
const MISSING_AFTER_FRAMES = 45;

function sceneRect(scene, el) {
  const sr = scene.getBoundingClientRect();
  const r = el.getBoundingClientRect();
  const k = sr.width / (scene.offsetWidth || sr.width) || 1;
  return { x: (r.left - sr.left) / k, y: (r.top - sr.top) / k, w: r.width / k, h: r.height / k };
}

const sameRect = (a, b) => a && b && Math.abs(a.x - b.x) < 0.6 && Math.abs(a.y - b.y) < 0.6 && Math.abs(a.w - b.w) < 0.6 && Math.abs(a.h - b.h) < 0.6;

/**
 * @param {object} props
 * @param {null|{ id: string, eminence: object, name: string, text: string, canCancel: boolean,
 *   request: ReturnType<import('./eminenceTargetRequest.js').resolveTargetRequest> }} props.pick
 * @param {(value: any, optionValue: any) => void} props.onConfirm
 * @param {() => void} [props.onCancel]
 * @param {() => void} [props.onMissing] i bersagli non sono sul tavolo: chi chiama torna al menù
 */
export function EminenceTargetPicker({ pick, onConfirm, onCancel, onMissing, anchorSelector = '.satze-bf-portal' }) {
  const rootRef = useRef(null);
  const [layout, setLayout] = useState(null);
  const [focus, setFocus] = useState(null);
  const [chosen, setChosen] = useState(null);
  const pickId = pick?.id ?? null;
  const request = pick?.request ?? null;
  const missingRef = useRef(onMissing);
  missingRef.current = onMissing;

  useLayoutEffect(() => {
    setFocus(null);
    setChosen(null);
    setLayout(null);
  }, [pickId]);

  // Misura a ogni fotogramma: mani e lista respirano, si inclinano, cambiano con la finestra.
  useEffect(() => {
    if (!request) return undefined;
    let raf = 0;
    let frames = 0;
    let last = null;
    const tick = () => {
      const scene = rootRef.current?.offsetParent;
      if (scene) {
        const targets = request.values
          .map((value) => ({ value, el: scene.querySelector(targetSelector(request, value)) }))
          .filter((t) => t.el && t.el.getBoundingClientRect().width > 2)
          .map((t) => ({ value: t.value, rect: sceneRect(scene, t.el) }));
        frames += 1;
        if (!targets.length) {
          if (frames === MISSING_AFTER_FRAMES) missingRef.current?.();
        } else {
          // la zona: tutti i fratelli dei bersagli (l'intera mano, l'intera lista)
          const first = scene.querySelector(targetSelector(request, targets[0].value));
          const side = first?.getAttribute('data-hand-side');
          const zoneEls = request.targetType === 'slot'
            ? [...scene.querySelectorAll('[data-field-slot]')]
            : (side ? [...scene.querySelectorAll(`[data-hand-side="${side}"]`)] : [first]);
          const others = zoneEls
            .filter((el) => el.getBoundingClientRect().width > 2)
            .map((el) => ({ el, rect: sceneRect(scene, el) }));
          const anchor = scene.querySelector(anchorSelector);
          const portal = anchor ? sceneRect(scene, anchor) : { x: 902, y: 420, w: 116, h: 156 };
          const next = { targets, zone: others.map((o) => o.rect), portal, sceneW: scene.offsetWidth, sceneH: scene.offsetHeight };
          const changed = !last
            || last.targets.length !== next.targets.length
            || next.targets.some((t, i) => !sameRect(t.rect, last.targets[i].rect))
            || !sameRect(next.portal, last.portal)
            || last.zone.length !== next.zone.length;
          if (changed) { last = next; setLayout(next); }
        }
      }
      raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [request, anchorSelector]);

  // Marca gli elementi veri: il CSS li ingrandisce, li accende o li spegne.
  useEffect(() => {
    const scene = rootRef.current?.offsetParent;
    if (!scene || !request || !layout) return undefined;
    const legal = new Set(layout.targets.map((t) => String(t.value)));
    const first = scene.querySelector(targetSelector(request, layout.targets[0].value));
    const side = first?.getAttribute('data-hand-side');
    const zoneEls = request.targetType === 'slot'
      ? [...scene.querySelectorAll('[data-field-slot]')]
      : (side ? [...scene.querySelectorAll(`[data-hand-side="${side}"]`)] : []);
    const marked = [];
    zoneEls.forEach((el) => {
      const value = request.targetType === 'slot' ? el.getAttribute('data-field-slot') : el.getAttribute('data-hand-agent');
      const isLegal = legal.has(String(value));
      const state = !isLegal ? 'off'
        : String(chosen) === String(value) ? 'chosen'
          : String(focus) === String(value) ? 'focus'
            : (chosen != null || focus != null) ? 'dim' : 'legal';
      el.setAttribute('data-em-pick', state);
      el.setAttribute('data-em-pick-type', request.targetType);
      marked.push(el);
    });
    return () => marked.forEach((el) => { el.removeAttribute('data-em-pick'); el.removeAttribute('data-em-pick-type'); });
  }, [request, layout, focus, chosen]);

  const confirm = useCallback((optionValue = null) => {
    if (chosen == null) return;
    onConfirm?.(chosen, optionValue);
  }, [chosen, onConfirm]);

  // Invio conferma (quando non c'è un'opzione da scegliere), Esc annulla o deseleziona.
  useEffect(() => {
    if (!request) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') {
        if (chosen != null) { event.preventDefault(); setChosen(null); } else if (pick?.canCancel) { event.preventDefault(); onCancel?.(); }
      } else if (event.key === 'Enter' && chosen != null && !request.optionKey && !event.target?.closest?.('button')) {
        event.preventDefault();
        confirm();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [request, chosen, pick?.canCancel, onCancel, confirm]);

  if (!pick || !request) return null;

  const accent = (pick.eminence && ARMY_COLORS[pick.eminence.army]?.accent) || '#f5c451';
  const isSlot = request.targetType === 'slot';
  const active = chosen ?? focus;
  const activeRect = layout?.targets.find((t) => String(t.value) === String(active))?.rect || null;
  const chosenRect = layout?.targets.find((t) => String(t.value) === String(chosen))?.rect || null;

  let spot = null;
  let beam = null;
  if (layout) {
    const rs = layout.zone.length ? layout.zone : layout.targets.map((t) => t.rect);
    const x0 = Math.min(...rs.map((r) => r.x)) - 18;
    const y0 = Math.min(...rs.map((r) => r.y)) - 18;
    const x1 = Math.max(...rs.map((r) => r.x + r.w)) + 18;
    const y1 = Math.max(...rs.map((r) => r.y + r.h)) + 18;
    spot = { left: x0, top: y0, width: x1 - x0, height: y1 - y0 };
    if (activeRect) {
      const px = layout.portal.x + layout.portal.w / 2;
      const py = layout.portal.y + layout.portal.h / 2;
      const below = activeRect.y + activeRect.h / 2 < py;
      const tx = isSlot ? activeRect.x - 22 : activeRect.x + activeRect.w / 2;
      const ty = isSlot ? activeRect.y + activeRect.h / 2 : (below ? activeRect.y + activeRect.h + 12 : activeRect.y - 12);
      beam = `M ${px.toFixed(1)} ${py.toFixed(1)} Q ${((px + tx) / 2).toFixed(1)} ${(Math.min(py, ty) - 70).toFixed(1)} ${tx.toFixed(1)} ${ty.toFixed(1)}`;
    }
  }
  const portalCx = layout ? layout.portal.x + layout.portal.w / 2 : 960;
  const portalBottom = layout ? layout.portal.y + layout.portal.h : 576;
  // la barra delle risposte: sotto la carta se la mano è in alto, sopra se è in basso; a sinistra del Campo
  let actStyle = null;
  if (chosenRect && layout) {
    const upper = chosenRect.y + chosenRect.h / 2 < layout.sceneH / 2;
    actStyle = isSlot
      ? { left: chosenRect.x - 64, top: chosenRect.y + chosenRect.h / 2 }
      : { left: chosenRect.x + chosenRect.w / 2, top: upper ? chosenRect.y + chosenRect.h + 86 : chosenRect.y - 86 };
  }

  return (
    <div
      ref={rootRef}
      className={`em-bersaglio${layout ? ' is-on' : ''}${isSlot ? ' is-slot' : ''}`}
      style={{ '--em-b-acc': accent, '--em-b-ink': inkOn(accent) }}
    >
      {spot && <div className="em-bersaglio-spot" style={spot} />}
      {layout && (
        <svg className={`em-bersaglio-beam${beam ? ' is-on' : ''}${chosen != null ? ' is-chosen' : ''}`} viewBox={`0 0 ${layout.sceneW} ${layout.sceneH}`} aria-hidden>
          <path className="em-bersaglio-beam-glow" d={beam || ''} />
          <path className="em-bersaglio-beam-line" d={beam || ''} />
        </svg>
      )}
      {layout?.targets.map((target) => {
        const isChosen = String(chosen) === String(target.value);
        const isFocus = String(focus) === String(target.value);
        const enter = () => setFocus(target.value);
        const leave = () => setFocus((v) => (String(v) === String(target.value) ? null : v));
        return (
          <button
            key={String(target.value)}
            type="button"
            className={`em-bersaglio-hot${isChosen ? ' is-chosen' : ''}${isFocus && chosen == null ? ' is-focus' : ''}${chosen != null && !isChosen ? ' is-dim' : ''}`}
            style={{ left: target.rect.x, top: target.rect.y, width: target.rect.w, height: target.rect.h }}
            aria-pressed={isChosen}
            aria-label={isSlot ? `Campo ${Number(target.value) + 1}` : `Carta ${target.value}`}
            data-em-target={String(target.value)}
            onMouseEnter={enter}
            onMouseLeave={leave}
            onFocus={enter}
            onBlur={leave}
            onClick={() => setChosen((v) => (String(v) === String(target.value) ? null : target.value))}
          >
            {isChosen && <span className="em-bersaglio-mark">{request.mark}</span>}
          </button>
        );
      })}

      {/* il portale resta acceso dentro il buio del faro: è lui che chiede la scelta */}
      {layout && (
        <span
          className="em-bersaglio-portal"
          style={{ left: layout.portal.x - 10, top: layout.portal.y - 10, width: layout.portal.w + 20, height: layout.portal.h + 20 }}
          aria-hidden
        />
      )}
      <div className="em-bersaglio-guide" style={{ left: portalCx, top: portalBottom + 58 }}>
        <div className="em-bersaglio-kicker">{pick.name}</div>
        <div className="em-bersaglio-title">{request.guide}</div>
        {/* a bersaglio scelto il testo lascia posto ai pulsanti, che possono cadergli sopra */}
        {chosen == null && <p className="em-bersaglio-text">{pick.text}</p>}
        {pick.canCancel && (
          <button type="button" className="em-bersaglio-pill" onClick={() => onCancel?.()}>Annulla</button>
        )}
      </div>

      {actStyle && (
        <div className="em-bersaglio-act" style={actStyle}>
          {request.optionKey
            ? request.options.map((option) => (
              <button key={String(option.value)} type="button" className="em-bersaglio-pill is-yes" onClick={() => confirm(option.value)}>{option.label}</button>
            ))
            : <button type="button" className="em-bersaglio-pill is-yes" onClick={() => confirm()}>Conferma</button>}
        </div>
      )}
    </div>
  );
}

export default EminenceTargetPicker;

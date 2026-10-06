import React from 'react';
import { createPortal } from 'react-dom';

/**
 * Carte in volo tra due punti dello schermo (ritorno in mano, mano → slot, slot → mano).
 * Ogni volo è una copia della carta in un portal fisso, animata con la Web Animations API
 * lungo un arco; a fine corsa sparisce e chiama onDone. Posizioni in px schermo.
 */

const CARD_W = 230;
const CARD_H = 330;
let flightSeq = 0;

/** Gestore dei voli: `launch(spec)` aggiunge un volo, il layer lo rimuove a fine animazione. */
export function useCardFlights() {
  const [flights, setFlights] = React.useState([]);
  const launch = React.useCallback((spec) => {
    flightSeq += 1;
    const id = flightSeq;
    setFlights((prev) => [...prev, { ...spec, id }]);
    return id;
  }, []);
  const done = React.useCallback((id) => {
    setFlights((prev) => prev.filter((f) => f.id !== id));
  }, []);
  return { flights, launch, done };
}

/** Centro e scala (rispetto alla carta 230×330) di un rettangolo DOM. */
export function rectToFlightPoint(rect, rot = 0) {
  return {
    cx: rect.left + rect.width / 2,
    cy: rect.top + rect.height / 2,
    scale: rect.width / CARD_W,
    rot,
  };
}

function toTransform({ cx, cy, scale = 1, rot = 0 }) {
  return `translate3d(${cx - CARD_W / 2}px, ${cy - CARD_H / 2}px, 0) rotate(${rot}deg) scale(${scale})`;
}

function Flight({ flight, onDone, renderCard }) {
  const ref = React.useRef(null);
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const { from, to, duration = 320, arc = 60, fadeOut = false, delay = 0 } = flight;
    const mid = {
      cx: (from.cx + to.cx) / 2,
      cy: (from.cy + to.cy) / 2 - arc,
      scale: ((from.scale ?? 1) + (to.scale ?? 1)) / 2,
      rot: ((from.rot ?? 0) + (to.rot ?? 0)) / 2,
    };
    const anim = el.animate(
      [
        { transform: toTransform(from), opacity: 1 },
        { transform: toTransform(mid), opacity: 1, offset: 0.5 },
        { transform: toTransform(to), opacity: fadeOut ? 0 : 1 },
      ],
      { duration, delay, easing: 'cubic-bezier(.3,.7,.25,1)', fill: 'both' },
    );
    anim.onfinish = () => onDone(flight.id);
    return () => {
      anim.onfinish = null;
      anim.cancel();
    };
  }, [flight, onDone]);

  return (
    <div
      ref={ref}
      className="satze-card-flight"
      style={{ position: 'fixed', left: 0, top: 0, width: CARD_W, height: CARD_H, pointerEvents: 'none', zIndex: 99989, willChange: 'transform, opacity' }}
    >
      <div className="satze-drag-ghost-shadow" aria-hidden />
      <div className="relative">{renderCard(flight.agent)}</div>
    </div>
  );
}

/** Layer dei voli: va montato una volta (portal su document.body). */
export function CardFlightLayer({ flights, onDone, renderCard }) {
  if (!flights.length || typeof document === 'undefined') return null;
  return createPortal(
    <>
      {flights.map((f) => (
        <Flight key={f.id} flight={f} onDone={onDone} renderCard={renderCard} />
      ))}
    </>,
    document.body,
  );
}

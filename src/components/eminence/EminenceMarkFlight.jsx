import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { addedIds, curseSlotKeys, queryFlightAnchor, normalizeFlight } from './eminenceMarkCinematic.js';

export { addedIds, curseSlotKeys };
export const EMINENCE_MARK_FLIGHT_MS = 900;
export const EMINENCE_MARK_SPAWN_MS = 760;

const EMPTY_SEEN = () => ({
  player: { prey: new Set(), fragment: new Set(), slot: new Set() },
  enemy: { prey: new Set(), fragment: new Set(), slot: new Set() },
});

function seedSeen(marks) {
  return {
    player: {
      prey: new Set(marks.playerPreyIds || []),
      fragment: new Set(marks.playerFragmentIds || []),
      slot: new Set(marks.playerSlotKeys || []),
    },
    enemy: {
      prey: new Set(marks.enemyPreyIds || []),
      fragment: new Set(marks.enemyFragmentIds || []),
      slot: new Set(marks.enemySlotKeys || []),
    },
  };
}

function collectFresh(seen, marks, playerAccent, enemyAccent) {
  const push = (side, kind, ids, accent) => (
    addedIds(seen[side][kind], ids).map((id) => ({
      id,
      kind,
      fromSide: side,
      accent,
    }))
  );
  return [
    ...push('player', 'prey', marks.playerPreyIds, playerAccent),
    ...push('player', 'fragment', marks.playerFragmentIds, playerAccent),
    ...push('player', 'slot', marks.playerSlotKeys, playerAccent),
    ...push('enemy', 'prey', marks.enemyPreyIds, enemyAccent),
    ...push('enemy', 'fragment', marks.enemyFragmentIds, enemyAccent),
    ...push('enemy', 'slot', marks.enemySlotKeys, enemyAccent),
  ];
}

function remember(marks) {
  return {
    player: {
      prey: new Set(marks.playerPreyIds || []),
      fragment: new Set(marks.playerFragmentIds || []),
      slot: new Set(marks.playerSlotKeys || []),
    },
    enemy: {
      prey: new Set(marks.enemyPreyIds || []),
      fragment: new Set(marks.enemyFragmentIds || []),
      slot: new Set(marks.enemySlotKeys || []),
    },
  };
}

function reducedMotion() {
  return typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

function flightGeometry(flight) {
  const normalized = normalizeFlight(flight);
  const from = queryFlightAnchor(normalized.from);
  const to = queryFlightAnchor(normalized.to);
  if (!from || !to) return null;
  const a = from.getBoundingClientRect();
  const b = to.getBoundingClientRect();
  const x1 = a.left + a.width * 0.5;
  const y1 = a.top + a.height * 0.5;
  const x2 = b.left + b.width * 0.5;
  const y2 = b.top + b.height * 0.5;
  const lift = Math.max(48, Math.abs(x2 - x1) * 0.16);
  const cx = (x1 + x2) / 2;
  const cy = Math.min(y1, y2) - lift;
  return {
    d: `M ${x1.toFixed(1)} ${y1.toFixed(1)} Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`,
    x2,
    y2,
    w: window.innerWidth,
    h: window.innerHeight,
  };
}

export function EminenceMarkFlight({ flight, onComplete }) {
  const [geometry, setGeometry] = useState(null);

  useLayoutEffect(() => {
    if (!flight) {
      setGeometry(null);
      return undefined;
    }
    if (reducedMotion()) {
      onComplete?.();
      return undefined;
    }
    let tries = 0;
    let raf = 0;
    let done = 0;
    const measure = () => {
      const next = flightGeometry(flight);
      if (next) {
        setGeometry(next);
        done = window.setTimeout(() => onComplete?.(), EMINENCE_MARK_FLIGHT_MS);
        return;
      }
      tries += 1;
      if (tries < 12) {
        raf = window.requestAnimationFrame(measure);
        return;
      }
      onComplete?.();
    };
    measure();
    return () => {
      window.cancelAnimationFrame(raf);
      window.clearTimeout(done);
    };
  }, [flight, onComplete]);

  if (!flight || !geometry) return null;

  const layer = (
    <div className="em-mark-flight" aria-hidden>
      <svg
        className="em-mark-flight-svg"
        width={geometry.w}
        height={geometry.h}
        viewBox={`0 0 ${geometry.w} ${geometry.h}`}
      >
        <path
          className="em-mark-flight-trail"
          d={geometry.d}
          pathLength="1"
          style={{ '--em-acc': flight.accent }}
        />
      </svg>
      <span
        className="em-mark-flight-spark"
        style={{ offsetPath: `path('${geometry.d}')`, '--em-acc': flight.accent }}
      />
      <span
        className="em-mark-flight-burst"
        style={{ left: geometry.x2, top: geometry.y2, '--em-acc': flight.accent }}
      />
    </div>
  );

  if (typeof document === 'undefined') return layer;
  return createPortal(layer, document.body);
}

/**
 * Scia e generazione solo sulla prima creazione del marchio.
 * Riaperto tavolo / nuovo round: i marchi già visti restano fermi.
 */
export function useEminencePreyFlight({
  playerPreyIds = [],
  enemyPreyIds = [],
  playerFragmentIds = [],
  enemyFragmentIds = [],
  playerSlotKeys = [],
  enemySlotKeys = [],
  playerAccent = '#c9e238',
  enemyAccent = '#c9e238',
  waitForNotice = false,
  resetKey = 0,
} = {}) {
  const marks = {
    playerPreyIds,
    enemyPreyIds,
    playerFragmentIds,
    enemyFragmentIds,
    playerSlotKeys,
    enemySlotKeys,
  };
  const seenRef = useRef(EMPTY_SEEN());
  const queueRef = useRef([]);
  const [concealed, setConcealed] = useState([]);
  const [markFlight, setMarkFlight] = useState(null);
  const [linkFlight, setLinkFlight] = useState(null);
  const linkFlightRef = useRef(null);
  linkFlightRef.current = linkFlight;
  const [landed, setLanded] = useState(null);

  useEffect(() => {
    seenRef.current = seedSeen(marks);
    queueRef.current = [];
    setConcealed([]);
    setMarkFlight(null);
    setLinkFlight(null);
    setLanded(null);
    // Solo un cambio di round azzera la coda: i marchi già presenti non si rifanno.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  useEffect(() => {
    const fresh = collectFresh(seenRef.current, marks, playerAccent, enemyAccent);
    seenRef.current = remember(marks);
    if (!fresh.length) return;
    setConcealed((prev) => [...new Set([...prev, ...fresh.map((entry) => `${entry.kind}:${entry.id}`)])]);
    queueRef.current.push(...fresh);
  }, [
    playerPreyIds,
    enemyPreyIds,
    playerFragmentIds,
    enemyFragmentIds,
    playerSlotKeys,
    enemySlotKeys,
    playerAccent,
    enemyAccent,
  ]);

  useEffect(() => {
    if (markFlight || waitForNotice || landed || !queueRef.current.length) return;
    setMarkFlight(queueRef.current.shift());
  }, [markFlight, waitForNotice, concealed, landed]);

  const linkQueueRef = useRef([]);

  const kickLink = useCallback(() => {
    if (linkFlightRef.current || !linkQueueRef.current.length) return;
    const next = linkQueueRef.current.shift();
    linkDoneRef.current = typeof next.onDone === 'function' ? next.onDone : null;
    setLinkFlight(next.flight);
  }, []);

  const onFlightComplete = useCallback(() => {
    if (linkFlightRef.current) {
      const done = linkDoneRef.current;
      linkDoneRef.current = null;
      setLinkFlight(null);
      done?.();
      window.setTimeout(() => kickLink(), 0);
      return;
    }
    setMarkFlight((current) => {
      if (!current) return null;
      const key = `${current.kind}:${current.id}`;
      setConcealed((prev) => prev.filter((entry) => entry !== key));
      setLanded(current);
      window.setTimeout(() => {
        setLanded((item) => (item && item.kind === current.kind && item.id === current.id ? null : item));
      }, EMINENCE_MARK_SPAWN_MS);
      return null;
    });
  }, [kickLink]);

  const linkDoneRef = useRef(null);
  const playLink = useCallback((flight, onDone) => {
    if (!flight) {
      onDone?.();
      return;
    }
    linkQueueRef.current.push({ flight, onDone });
    kickLink();
  }, [kickLink]);

  const incomingNow = collectFresh(seenRef.current, marks, playerAccent, enemyAccent);
  const hideKeys = (kind, ids) => (ids || []).filter((id) => !concealed.includes(`${kind}:${id}`));
  const busy = Boolean(
    markFlight
    || linkFlight
    || concealed.length
    || landed
    || queueRef.current.length
    || incomingNow.length,
  );

  return {
    markFlight: linkFlight || markFlight,
    playLink,
    preyLandId: landed?.kind === 'prey' || landed?.kind === 'fragment' ? landed.id : null,
    arrivingSlot: landed?.kind === 'slot' ? landed.id : null,
    activeKind: markFlight?.kind || landed?.kind || incomingNow[0]?.kind || queueRef.current[0]?.kind || null,
    busy,
    onFlightComplete,
    visiblePlayerPreyIds: hideKeys('prey', playerPreyIds),
    visibleEnemyPreyIds: hideKeys('prey', enemyPreyIds),
    visiblePlayerFragmentIds: hideKeys('fragment', playerFragmentIds),
    visibleEnemyFragmentIds: hideKeys('fragment', enemyFragmentIds),
    visibleHandPreyIds: (ids) => hideKeys('prey', ids),
    visibleSlotKeys: hideKeys('slot', [...playerSlotKeys, ...enemySlotKeys]),
  };
}

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { addedIds, curseSlotKeys, queryFlightAnchor, normalizeFlight } from './eminenceMarkCinematic.js';
import {
  getEminenceMarkFlightMs,
  getEminenceMarkTrailLingerMs,
} from '../../utils/eminenceSystemPreference.js';

export { addedIds, curseSlotKeys };
export const EMINENCE_MARK_FLIGHT_MS = 900;
export const EMINENCE_MARK_TRAIL_LINGER_MS = 560;
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
  const [phase, setPhase] = useState(null);

  useLayoutEffect(() => {
    if (!flight) {
      setGeometry(null);
      setPhase(null);
      return undefined;
    }
    if (reducedMotion()) {
      onComplete?.();
      return undefined;
    }
    let tries = 0;
    let raf = 0;
    let flyTimer = 0;
    let lingerTimer = 0;
    const flightMs = getEminenceMarkFlightMs() || EMINENCE_MARK_FLIGHT_MS;
    const lingerMs = getEminenceMarkTrailLingerMs() || EMINENCE_MARK_TRAIL_LINGER_MS;
    const measure = () => {
      const next = flightGeometry(flight);
      if (next) {
        next.ms = flightMs;
        setGeometry(next);
        setPhase('flying');
        flyTimer = window.setTimeout(() => {
          setPhase('lingering');
          lingerTimer = window.setTimeout(() => {
            setPhase(null);
            setGeometry(null);
            onComplete?.();
          }, lingerMs);
        }, flightMs);
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
      window.clearTimeout(flyTimer);
      window.clearTimeout(lingerTimer);
    };
  }, [flight, onComplete]);

  if (!flight || !geometry) return null;

  const layer = (
    <div
      className="em-mark-flight"
      style={{ '--em-flight-ms': `${geometry.ms || EMINENCE_MARK_FLIGHT_MS}ms` }}
      aria-hidden
    >
      <svg
        className="em-mark-flight-svg"
        width={geometry.w}
        height={geometry.h}
        viewBox={`0 0 ${geometry.w} ${geometry.h}`}
      >
        <path
          className={[
            'em-mark-flight-trail',
            phase === 'lingering' ? 'is-linger' : '',
            phase === 'flying' ? 'is-flying' : '',
          ].filter(Boolean).join(' ')}
          d={geometry.d}
          pathLength="1"
          style={{ '--em-acc': flight.accent }}
        />
      </svg>
      {phase === 'flying' && (
        <>
          <span
            className="em-mark-flight-spark"
            style={{ offsetPath: `path('${geometry.d}')`, '--em-acc': flight.accent }}
          />
          <span
            className="em-mark-flight-burst"
            style={{ left: geometry.x2, top: geometry.y2, '--em-acc': flight.accent }}
          />
        </>
      )}
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

  // Saette disabilitate: i marchi compaiono subito, senza coda/voli.
  useEffect(() => {
    seenRef.current = remember(marks);
    queueRef.current = [];
    setConcealed([]);
    setMarkFlight(null);
    setLinkFlight(null);
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

  const linkQueueRef = useRef([]);

  const kickLink = useCallback(() => {
    // no-op: saette spente
  }, []);

  const onFlightComplete = useCallback(() => {
    setMarkFlight(null);
    setLinkFlight(null);
  }, []);

  const linkDoneRef = useRef(null);
  const playLink = useCallback((_flight, onDone) => {
    onDone?.();
  }, []);

  const hideKeys = (kind, ids) => (ids || []);
  const busy = false;

  return {
    markFlight: null,
    playLink,
    preyLandId: null,
    arrivingSlot: null,
    activeKind: null,
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

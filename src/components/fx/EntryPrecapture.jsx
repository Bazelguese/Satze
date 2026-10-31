import React from 'react';
import { GameCard } from '../cards';
import { discardSharedSnapshot, hasSharedSnapshot, precaptureElement } from './captureElement.js';

/**
 * Chiave della foto d'ingresso di una carta: tutte le prop che ne cambiano l'aspetto più il
 * colore d'armata (variabili CSS --acc). Stessa chiave = stessa carta al pixel.
 */
export function entrySnapshotKey(cardProps, accent) {
  if (!cardProps?.agent) return null;
  try {
    return `entry|${accent || ''}|${JSON.stringify(cardProps)}`;
  } catch {
    return null;
  }
}

const idle = (fn) =>
  typeof requestIdleCallback === 'function' ? requestIdleCallback(fn, { timeout: 2000 }) : setTimeout(fn, 400);
const cancelIdle = (id) => (typeof cancelIdleCallback === 'function' ? cancelIdleCallback(id) : clearTimeout(id));

/**
 * Prepara, nei momenti di quiete, le foto d'ingresso delle carte che l'avversario può ancora
 * giocare: una alla volta, montata invisibile nello stesso punto della scena della carta vera
 * (stessi stili ereditati). All'ingresso <ArmyEntryFx> con la stessa chiave riusa la foto e
 * lo scontro non paga lo scatto. Se la chiave non combacia si fotografa come prima.
 *
 * items: [{ key, accent, cardProps }]. Da tenere montato per tutto il duello: una foto a
 * metà non deve perdere il suo nodo (enabled=false ferma solo le prossime).
 */
export function EntryPrecapture({ items, enabled }) {
  const nodeRef = React.useRef(null);
  /** chiave della foto in corso: se il duello si smonta a metà, il nodo staccato darebbe una foto vuota */
  const inFlightRef = React.useRef(null);
  /** chiavi la cui foto è fallita: non si riprovano in loop */
  const failedRef = React.useRef(new Set());
  const [current, setCurrent] = React.useState(null);
  const itemsRef = React.useRef(items);
  itemsRef.current = items;
  const itemsSig = enabled ? items.map((it) => it.key).join('␞') : '';

  // prossima carta senza foto
  React.useEffect(() => {
    if (current || !enabled) return;
    const next = itemsRef.current.find(
      (it) => it.key && !hasSharedSnapshot(it.key) && !failedRef.current.has(it.key)
    );
    if (next) setCurrent(next);
  }, [current, enabled, itemsSig]);

  React.useEffect(() => {
    if (!current) return undefined;
    const id = idle(() => {
      const node = nodeRef.current;
      if (!node) {
        setCurrent(null);
        return;
      }
      inFlightRef.current = current.key;
      precaptureElement(current.key, node)
        .catch(() => failedRef.current.add(current.key))
        .finally(() => {
          if (inFlightRef.current === current.key) inFlightRef.current = null;
          setCurrent(null);
        });
    });
    return () => cancelIdle(id);
  }, [current]);

  React.useEffect(
    () => () => {
      if (inFlightRef.current) discardSharedSnapshot(inFlightRef.current);
    },
    []
  );

  if (!current) return null;
  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        left: -10000,
        top: 0,
        opacity: 0,
        pointerEvents: 'none',
        '--acc-en': current.accent,
        '--acc': current.accent,
      }}
    >
      {/* stessa struttura di <ElementFx>: si fotografa il nodo interno, come all'ingresso */}
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <div ref={nodeRef} style={{ position: 'relative', zIndex: 0, isolation: 'isolate' }}>
          <GameCard {...current.cardProps} />
        </div>
      </div>
    </div>
  );
}

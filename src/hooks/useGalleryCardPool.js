import { useEffect, useState } from 'react';

function scheduleIdleWork(fn) {
  if (typeof requestIdleCallback === 'function') {
    return requestIdleCallback(fn, { timeout: 150 });
  }
  return requestAnimationFrame(() => setTimeout(fn, 0));
}

function cancelIdleWork(id) {
  if (typeof cancelIdleCallback === 'function') {
    cancelIdleCallback(id);
  } else {
    cancelAnimationFrame(id);
  }
}

/** Carte anteprima già montate in sessione (sopravvivono al cambio filtro armata). */
let sessionPoolMounted = 0;

/**
 * Pool griglia galleria: montaggio incrementale, poi solo show/hide per armata.
 */
export function useGalleryCardPool(totalCount, options = {}) {
  const batchSize = options.batchSize ?? 16;
  const enabled = options.enabled !== false;

  const [mountedCount, setMountedCount] = useState(() => {
    if (!enabled || totalCount <= 0) return 0;
    const start = Math.min(totalCount, Math.max(sessionPoolMounted, batchSize));
    sessionPoolMounted = Math.max(sessionPoolMounted, start);
    return start;
  });

  useEffect(() => {
    if (!enabled || totalCount <= 0) return undefined;

    let cancelled = false;
    let idleId = 0;

    const grow = () => {
      if (cancelled) return;
      setMountedCount((prev) => {
        if (prev >= totalCount) {
          sessionPoolMounted = totalCount;
          return prev;
        }
        const next = Math.min(totalCount, prev + batchSize);
        sessionPoolMounted = Math.max(sessionPoolMounted, next);
        if (next < totalCount) {
          idleId = scheduleIdleWork(grow);
        }
        return next;
      });
    };

    setMountedCount((prev) => {
      if (prev >= totalCount) {
        sessionPoolMounted = totalCount;
        return prev;
      }
      idleId = scheduleIdleWork(grow);
      return prev;
    });

    return () => {
      cancelled = true;
      cancelIdleWork(idleId);
    };
  }, [enabled, totalCount, batchSize]);

  const capped = enabled ? Math.min(totalCount, mountedCount) : 0;
  return {
    mountedCount: capped,
    poolComplete: capped >= totalCount,
  };
}

export function resetGalleryCardPoolSession() {
  sessionPoolMounted = 0;
}

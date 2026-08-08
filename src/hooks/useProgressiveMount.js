import { useEffect, useState } from 'react';

/**
 * Monta gli elementi a batch per non bloccare il main thread (React + carte pesanti).
 * @param {number} itemCount
 * @param {{ batchSize?: number, resetKey?: unknown }} [options]
 */
export function useProgressiveMount(itemCount, options = {}) {
  const batchSize = options.batchSize ?? 8;
  const resetKey = options.resetKey;
  const [visibleCount, setVisibleCount] = useState(() =>
    Math.min(itemCount, batchSize)
  );

  useEffect(() => {
    setVisibleCount(Math.min(itemCount, batchSize));
  }, [itemCount, batchSize, resetKey]);

  useEffect(() => {
    if (visibleCount >= itemCount) return undefined;

    let cancelled = false;
    let rafId = 0;

    const tick = () => {
      if (cancelled) return;
      setVisibleCount((prev) => {
        if (prev >= itemCount) return prev;
        return Math.min(itemCount, prev + batchSize);
      });
      if (!cancelled) {
        rafId = requestAnimationFrame(() => {
          setTimeout(tick, 0);
        });
      }
    };

    rafId = requestAnimationFrame(() => {
      setTimeout(tick, 0);
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
    };
  }, [visibleCount, itemCount, batchSize]);

  return visibleCount;
}

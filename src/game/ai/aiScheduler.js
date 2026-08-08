/** Cooperative scheduling: evita freeze UI durante calcoli IA pesanti. */

let tick = 0;

export function resetAiSchedulerTicks() {
  tick = 0;
}

/**
 * Cede il main thread periodicamente (mouse, animazioni, React).
 * @param {{ every?: number, force?: boolean }} [options]
 */
export async function aiYieldIfNeeded(options = {}) {
  const every = options.every ?? 28;
  tick += 1;
  if (!options.force && tick % every !== 0) return;

  await new Promise((resolve) => {
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => setTimeout(resolve, 0));
    } else {
      setTimeout(resolve, 0);
    }
  });
}

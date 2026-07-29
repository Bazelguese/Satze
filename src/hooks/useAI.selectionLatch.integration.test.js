/**
 * Regressione: il timer di scelta IA non deve restare latchato se l'effect
 * viene cleanup-ato prima della selezione (es. re-render / anteprima carta).
 */
import { describe, it, expect, vi } from 'vitest';

describe('AI selection latch (selectAgent)', () => {
  it('cleanup del timer non lascia un latch che impedisce la ri-schedulazione', () => {
    let aiHasSelectedAgent = false;
    let selected = null;
    const selectFn = vi.fn(() => {
      selected = { agent: { id: 1 } };
      return selected;
    });

    function scheduleSelect() {
      if (aiHasSelectedAgent) return null;
      let cancelled = false;
      const timer = setTimeout(() => {
        if (cancelled || aiHasSelectedAgent) return;
        const result = selectFn();
        if (result?.agent) {
          aiHasSelectedAgent = true;
        }
      }, 20);
      return () => {
        cancelled = true;
        clearTimeout(timer);
      };
    }

    // Primo mount: schedule
    const cleanup1 = scheduleSelect();
    // Re-render tipico (callback identity / preview): cleanup senza aver scelto
    cleanup1();
    expect(aiHasSelectedAgent).toBe(false);
    expect(selectFn).not.toHaveBeenCalled();

    // Secondo mount: deve poter ri-schedulare
    const cleanup2 = scheduleSelect();
    return new Promise((resolve) => {
      setTimeout(() => {
        expect(selectFn).toHaveBeenCalledTimes(1);
        expect(aiHasSelectedAgent).toBe(true);
        cleanup2();
        resolve();
      }, 40);
    });
  });

  it('vecchio pattern buggy: latch prima del timer + cleanup → scelta persa', () => {
    let aiHasSelectedAgent = false;
    const selectFn = vi.fn();

    function scheduleBuggy() {
      if (aiHasSelectedAgent) return null;
      aiHasSelectedAgent = true; // BUG: latch prima del timer
      const timer = setTimeout(() => {
        selectFn();
      }, 20);
      return () => clearTimeout(timer);
    }

    const cleanup1 = scheduleBuggy();
    cleanup1();
    expect(aiHasSelectedAgent).toBe(true);

    // Re-schedule bloccata dal latch
    const cleanup2 = scheduleBuggy();
    expect(cleanup2).toBeNull();

    return new Promise((resolve) => {
      setTimeout(() => {
        expect(selectFn).not.toHaveBeenCalled();
        resolve();
      }, 40);
    });
  });
});

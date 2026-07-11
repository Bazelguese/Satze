import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { shuffleArray } from '../../utils/shuffle';
import {
  SHUFFLE_DEAL_HAND_SIZE,
  SHUFFLE_DEAL_TIMING,
  deckStackOffset,
  fanSlot,
  getDealtHandIndices,
  handSlot,
} from './cardShuffleDealLayout';
import {
  resolveDeckOrigin,
  resolveRemainAnchor,
  rollShuffleFieldJitter,
  withShuffleJitter,
} from './shuffleFieldJitter';

function stackOffset(layout, index, deckSize) {
  if (layout.getDeckStackOffset) return layout.getDeckStackOffset(index, deckSize);
  return deckStackOffset(index, deckSize);
}

function buildInitialAnimatedCards(deck, layout, { hidden = false } = {}) {
  const n = deck.length;
  const origin = resolveDeckOrigin(layout);
  return deck.map((card, i) => {
    const off = stackOffset(layout, i, n);
    return {
      deckIndex: i,
      id: card.id ?? i,
      card,
      x: origin.x + off.x,
      y: origin.y + off.y,
      rot: off.rot,
      scale: 1,
      z: i,
      flipped: false,
      opacity: hidden ? 0 : 1,
    };
  });
}

function deckIndexToAnimIdx(animatedCards, deckIndex) {
  return animatedCards.findIndex((c) => c.deckIndex === deckIndex);
}

/**
 * @param {object[]} deck — carte del mazzo (10)
 * @param {ReturnType<import('./cardShuffleDealLayout').createShuffleDealLayout>} layout
 * @param {{ autoPlay?: boolean, handSize?: number, fixedFinalOrder?: number[] | null, deckIntroFadeMs?: number, deckIntroBeatMs?: number, onComplete?: (handIndices: number[]) => void }} [options]
 */
export function useCardShuffleDealAnimation(deck, layout, options = {}) {
  const {
    autoPlay = true,
    handSize = SHUFFLE_DEAL_HAND_SIZE,
    fixedFinalOrder = null,
    deckIntroFadeMs = 0,
    deckIntroBeatMs = 0,
    onComplete,
  } = options;

  const [cards, setCards] = useState(() => buildInitialAnimatedCards(deck, layout));
  const [showReplay, setShowReplay] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const timers = useRef([]);
  const completedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const orderKey = useMemo(
    () => (Array.isArray(fixedFinalOrder) ? fixedFinalOrder.join(',') : ''),
    [fixedFinalOrder]
  );

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  const after = useCallback((ms, fn) => {
    timers.current.push(setTimeout(fn, ms));
  }, []);

  const setCard = useCallback((idx, patch) => {
    setCards((prev) => {
      const next = prev.slice();
      next[idx] = { ...next[idx], ...patch };
      return next;
    });
  }, []);

  const play = useCallback(() => {
    if (!deck?.length) return;

    completedRef.current = false;
    clearTimers();
    const activeLayout = withShuffleJitter(layout, rollShuffleFieldJitter());
    const jitter = activeLayout.shuffleJitter.deck;
    const hiddenIntro = deckIntroFadeMs > 0;
    const initial = buildInitialAnimatedCards(deck, activeLayout, { hidden: hiddenIntro });
    setCards(initial);
    setShowReplay(false);
    setIsPlaying(true);

    const introOffset = hiddenIntro ? deckIntroFadeMs + deckIntroBeatMs : 0;
    if (hiddenIntro) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          initial.forEach((_, deckIndex) => {
            const animIdx = deckIndexToAnimIdx(initial, deckIndex);
            if (animIdx < 0) return;
            setCard(animIdx, { opacity: 1 });
          });
        });
      });
    }

    const deckSize = deck.length;
    const deckOrigin = resolveDeckOrigin(activeLayout);

    after(introOffset + SHUFFLE_DEAL_TIMING.fanOutMs, () => {
      deck.forEach((_, deckIndex) => {
        const animIdx = deckIndexToAnimIdx(initial, deckIndex);
        if (animIdx < 0) return;
        const slot = layout.getFanSlot
          ? layout.getFanSlot(deckIndex, deckSize)
          : fanSlot(deckIndex, deckSize, {
              stageCx: layout.stageCx,
              fanWidth: layout.fanWidth,
              archDepth: layout.fanArchDepth,
              rotSpread: layout.fanRotSpread,
              yBase: layout.yBase,
            });
        setCard(animIdx, {
          x: slot.x + jitter.x,
          y: slot.y + jitter.y,
          rot: slot.rot,
          z: 10 + deckIndex,
        });
      });
    });

    let slotOrder = deck.map((_, i) => i);
    const applyOrder = (order, delay) => {
      after(delay, () => {
        order.forEach((deckIndex, slotIdx) => {
          const animIdx = deckIndexToAnimIdx(initial, deckIndex);
          if (animIdx < 0) return;
          const slot = layout.getFanSlot
            ? layout.getFanSlot(slotIdx, deckSize)
            : fanSlot(slotIdx, deckSize, {
                stageCx: layout.stageCx,
                fanWidth: layout.fanWidth,
                archDepth: layout.fanArchDepth,
                rotSpread: layout.fanRotSpread,
                yBase: layout.yBase,
              });
          setCard(animIdx, {
            x: slot.x + jitter.x,
            y: slot.y + jitter.y,
            rot: slot.rot,
            z: 30 + slotIdx,
          });
        });
      });
    };

    let t = introOffset + SHUFFLE_DEAL_TIMING.scrambleStartMs;
    const rounds = SHUFFLE_DEAL_TIMING.scrambleRounds;

    for (let round = 0; round < rounds; round++) {
      const isLastRound = round === rounds - 1;
      if (isLastRound && Array.isArray(fixedFinalOrder) && fixedFinalOrder.length === deckSize) {
        slotOrder = fixedFinalOrder.slice();
      } else {
        slotOrder = shuffleArray(slotOrder);
      }
      applyOrder(slotOrder, t);
      t += SHUFFLE_DEAL_TIMING.scrambleRoundMs;
    }
    const finalOrder = slotOrder;

    after(t, () => {
      finalOrder.forEach((deckIndex, pos) => {
        const animIdx = deckIndexToAnimIdx(initial, deckIndex);
        if (animIdx < 0) return;
        const off = stackOffset(activeLayout, pos, deckSize);
        setCard(animIdx, {
          x: deckOrigin.x + off.x,
          y: deckOrigin.y + off.y,
          rot: off.rot,
          z: 10 - pos,
          opacity: 1,
        });
      });
    });
    t += SHUFFLE_DEAL_TIMING.restackMs;

    const remainSize = deckSize - handSize;
    const remainIndices = [];
    const lastDealMs = (handSize - 1) * SHUFFLE_DEAL_TIMING.dealStaggerMs;

    for (let k = 0; k < handSize; k++) {
      const deckIndex = finalOrder[k];
      const animIdx = deckIndexToAnimIdx(initial, deckIndex);
      after(t + k * SHUFFLE_DEAL_TIMING.dealStaggerMs, () => {
        if (animIdx < 0) return;
        const slot = layout.getHandSlot
          ? layout.getHandSlot(k, handSize)
          : handSlot(k, handSize, {
              stageCx: layout.stageCx,
              handWidth: layout.handWidth,
              archDepth: layout.handArchDepth,
              rotSpread: layout.handRotSpread,
              handY: layout.handY,
            });
        setCard(animIdx, {
          x: slot.x,
          y: slot.y,
          rot: slot.rot,
          z: 50 + k,
          flipped: layout.flipOnDeal,
          scale: layout.dealScale,
          opacity: 1,
        });
      });
    }

    // Mazzetto residuo: compare solo dopo l'ultima carta consegnata in mano.
    after(t + lastDealMs, () => {
      const remainOrigin = resolveRemainAnchor(activeLayout);
      finalOrder.slice(handSize).forEach((deckIndex, pos) => {
        const animIdx = deckIndexToAnimIdx(initial, deckIndex);
        if (animIdx < 0) return;
        remainIndices.push(animIdx);
        const off = stackOffset(activeLayout, pos, remainSize);
        setCard(animIdx, {
          x: remainOrigin.x + off.x,
          y: remainOrigin.y + off.y,
          rot: off.rot,
          z: 20 + pos,
          opacity: 1,
        });
      });
    });

    const remainExitStartMs =
      lastDealMs +
      SHUFFLE_DEAL_TIMING.moveDurationMs +
      SHUFFLE_DEAL_TIMING.remainHoldMs;

    after(t + remainExitStartMs, () => {
      const exit = layout.getDeckExitTarget?.() ?? {
        x: layout.deckPos.x,
        y: layout.deckPos.y,
        rot: layout.deckRot ?? 0,
      };
      const baseRot = layout.deckRot ?? exit.rot;
      remainIndices.forEach((animIdx, pos) => {
        const off = stackOffset(layout, pos, remainSize);
        setCard(animIdx, {
          x: exit.x + off.x,
          y: exit.y + off.y,
          rot: exit.rot + (off.rot - baseRot),
          opacity: 0,
          z: 20 + pos,
          transition: SHUFFLE_DEAL_TIMING.remainExitTransition,
        });
      });
    });

    t +=
      lastDealMs +
      SHUFFLE_DEAL_TIMING.moveDurationMs +
      SHUFFLE_DEAL_TIMING.remainHoldMs +
      SHUFFLE_DEAL_TIMING.remainExitMs;

    after(t, () => {
      if (completedRef.current) return;
      completedRef.current = true;
      setShowReplay(true);
      setIsPlaying(false);
      onCompleteRef.current?.(getDealtHandIndices(finalOrder, handSize));
    });
  }, [deck, layout, handSize, fixedFinalOrder, deckIntroFadeMs, deckIntroBeatMs, clearTimers, after, setCard]);

  useEffect(() => {
    if (!autoPlay) return undefined;
    play();
    return clearTimers;
    // Una sola esecuzione per setup stabile — evita reset timer ad ogni re-render HUD.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPlay, orderKey, deck.length, handSize, deckIntroFadeMs, deckIntroBeatMs]);

  return { cards, showReplay, play, isPlaying };
}

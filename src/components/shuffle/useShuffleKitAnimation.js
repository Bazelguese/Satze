import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BattlefieldShuffleKitController } from './BattlefieldShuffleKitController';
import { applyDeckStackPosition } from './battlefieldDealMotion';
import { buildShuffleKitGeometry } from './shuffleKitGeometry';
import { rollShuffleFieldJitter, withShuffleJitter } from './shuffleFieldJitter';
import { getDealtHandIndices } from './cardShuffleDealLayout';

function buildAnimatedCards(deck, layout, { hidden = false } = {}) {
  if (!deck?.length || !layout) return [];
  return deck.map((card, deckIndex) => {
    const tf = applyDeckStackPosition(layout, deckIndex, deckIndex, deck.length);
    return {
      deckIndex,
      id: card.id ?? deckIndex,
      card,
      x: tf.x,
      y: tf.y,
      rot: tf.rot,
      scale: tf.scale ?? 1,
      z: tf.z,
      flipped: false,
      opacity: hidden ? 0 : 1,
    };
  });
}

/** Durata stimata (ms) — solo per stime UI, non per timeout. */
export function estimateShuffleKitDurationMs(kind, deckSize = 10, handSize = 5) {
  const shuffleMs =
    kind === 'alternate'
      ? 4200
      : kind === 'wash' || kind === 'fountain'
      ? 3600
      : kind === 'pile' || kind === 'lattice'
        ? 2800
        : kind === 'overhandCut'
          ? 3200
          : 2400;
  const dealMs = 280 + (handSize - 1) * 300 + 700 + 650 + 800;
  return shuffleMs + dealMs + 1200;
}

/**
 * @param {object[]} deck
 * @param {object} layout
 * @param {{ kind: string, autoPlay?: boolean, handSize?: number, fixedFinalOrder?: number[]|null, deckIntroFadeMs?: number, deckIntroBeatMs?: number, timeScale?: number, onComplete?: (handIndices: number[]) => void, loop?: boolean }} options
 */
export function useShuffleKitAnimation(deck, layout, options = {}) {
  const {
    kind,
    autoPlay = true,
    handSize = 5,
    fixedFinalOrder = null,
    deckIntroFadeMs = 0,
    deckIntroBeatMs = 0,
    timeScale = 1,
    onComplete,
    loop = false,
  } = options;

  const geometry = useMemo(() => buildShuffleKitGeometry(layout), [layout]);
  const orderKey = useMemo(
    () => (Array.isArray(fixedFinalOrder) ? fixedFinalOrder.join(',') : ''),
    [fixedFinalOrder]
  );

  const [cards, setCards] = useState(() => buildAnimatedCards(deck, layout));
  const [showReplay, setShowReplay] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const ctlRef = useRef(null);
  const onCompleteRef = useRef(onComplete);
  const completedRef = useRef(false);
  onCompleteRef.current = onComplete;

  const setCardByDeckIndex = useCallback((deckIndex, patch) => {
    setCards((prev) => {
      const next = prev.slice();
      const idx = next.findIndex((c) => c.deckIndex === deckIndex);
      if (idx < 0) return prev;
      next[idx] = { ...next[idx], ...patch };
      return next;
    });
  }, []);

  const finish = useCallback(
    (order) => {
      if (completedRef.current) return;
      completedRef.current = true;
      setShowReplay(true);
      setIsPlaying(false);
      onCompleteRef.current?.(getDealtHandIndices(order, handSize));
    },
    [handSize]
  );

  const play = useCallback(() => {
    if (!deck?.length || !kind) return;

    completedRef.current = false;
    ctlRef.current?.cancel();
    const jitteredLayout = withShuffleJitter(layout, rollShuffleFieldJitter());
    const hiddenIntro = deckIntroFadeMs > 0;
    const introOffset = hiddenIntro ? deckIntroFadeMs + deckIntroBeatMs : 0;

    const startShuffle = ({ skipInitialRender = false } = {}) => {
      if (!skipInitialRender) {
        setCards(buildAnimatedCards(deck, jitteredLayout));
      }
      setShowReplay(false);
      setIsPlaying(true);

      const ctl = new BattlefieldShuffleKitController({
        setCard: setCardByDeckIndex,
        geometry,
        deckSize: deck.length,
        handCount: handSize,
        timeScale,
        layout: jitteredLayout,
      });
      ctlRef.current = ctl;

      const order =
        Array.isArray(fixedFinalOrder) && fixedFinalOrder.length === deck.length
          ? fixedFinalOrder.slice()
          : undefined;

      const result = ctl.play(kind, {
        order,
        onDone: () => finish(result.order),
      });
    };

    if (hiddenIntro) {
      const initial = buildAnimatedCards(deck, jitteredLayout, { hidden: true });
      setCards(initial);
      setShowReplay(false);
      setIsPlaying(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          initial.forEach((card) => {
            setCardByDeckIndex(card.deckIndex, { opacity: 1 });
          });
        });
      });
      const introTimer = setTimeout(() => startShuffle({ skipInitialRender: true }), introOffset);
      ctlRef.current = { cancel: () => clearTimeout(introTimer) };
      return;
    }

    startShuffle();
  }, [
    deck,
    layout,
    geometry,
    kind,
    handSize,
    fixedFinalOrder,
    deckIntroFadeMs,
    deckIntroBeatMs,
    timeScale,
    setCardByDeckIndex,
    finish,
  ]);

  useEffect(() => {
    if (!autoPlay) return undefined;
    play();
    return () => {
      ctlRef.current?.cancel();
      completedRef.current = false;
    };
    // Avvia una sola volta per combinazione stabile (evita cancel loop su re-render HUD).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPlay, kind, orderKey, deck.length, handSize, timeScale, deckIntroFadeMs, deckIntroBeatMs]);

  useEffect(() => {
    if (!loop || !showReplay) return undefined;
    const t = setTimeout(() => play(), 700);
    return () => clearTimeout(t);
  }, [loop, showReplay, play]);

  return { cards, showReplay, play, isPlaying };
}

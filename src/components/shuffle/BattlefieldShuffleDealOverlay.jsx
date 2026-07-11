import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CardShuffleDealStage } from './CardShuffleDealStage';
import { createBattlefieldShuffleDealLayout } from './cardShuffleDealLayout';
import {
  DUEL_DECK_INTRO_BEAT_MS,
  DUEL_DECK_INTRO_FADE_MS,
  DUEL_REVEAL_HOLD_MS,
  DUEL_REVEAL_MS,
} from './duelEntranceTiming';
import { DuelRevealVeil } from './DuelRevealVeil';
import { getShuffleStyle, pickRandomEnemyShuffleKind } from '../../utils/shuffleStylePreference';

/**
 * Overlay sull'HUD di duello reale (1920×1080).
 * Sequenza: hold → scoperta continua → fade-in mazzi → mischia & deal.
 */
export function BattlefieldShuffleDealOverlay({
  setup,
  onComplete,
  shuffleKind,
  launchRevealHoldMs = 0,
  onRevealPhaseChange,
}) {
  const playerKind = setup?.playerShuffleKind ?? shuffleKind ?? getShuffleStyle();
  const enemyKind = setup?.enemyShuffleKind ?? pickRandomEnemyShuffleKind(playerKind);
  const [entrancePhase, setEntrancePhase] = useState('hold');
  const [playerDone, setPlayerDone] = useState(false);
  const [enemyDone, setEnemyDone] = useState(false);
  const onCompleteRef = useRef(onComplete);
  const onRevealPhaseChangeRef = useRef(onRevealPhaseChange);
  onCompleteRef.current = onComplete;
  onRevealPhaseChangeRef.current = onRevealPhaseChange;

  const enemyLayout = useMemo(() => createBattlefieldShuffleDealLayout('enemy'), []);
  const playerLayout = useMemo(() => createBattlefieldShuffleDealLayout('player'), []);

  const sessionKey = setup
    ? `${setup.playerFinalOrder?.join(',')}-${setup.enemyFinalOrder?.join(',')}`
    : '';

  const holdMs = launchRevealHoldMs > 0 ? launchRevealHoldMs : DUEL_REVEAL_HOLD_MS;

  const handleRevealComplete = useCallback(() => {
    setEntrancePhase('shuffle');
  }, []);

  useEffect(() => {
    if (!setup) return undefined;

    setEntrancePhase('hold');
    setPlayerDone(false);
    setEnemyDone(false);

    const revealTimer = setTimeout(() => setEntrancePhase('reveal'), holdMs);
    const fallbackTimer = setTimeout(handleRevealComplete, holdMs + DUEL_REVEAL_MS + 80);

    return () => {
      clearTimeout(revealTimer);
      clearTimeout(fallbackTimer);
    };
  }, [setup, launchRevealHoldMs, sessionKey, holdMs, handleRevealComplete]);

  useEffect(() => {
    onRevealPhaseChangeRef.current?.(entrancePhase);
  }, [entrancePhase]);

  const handlePlayerComplete = useCallback(() => setPlayerDone(true), []);
  const handleEnemyComplete = useCallback(() => setEnemyDone(true), []);

  useEffect(() => {
    if (playerDone && enemyDone) onCompleteRef.current?.();
  }, [playerDone, enemyDone]);

  if (!setup) return null;

  const shuffleActive = entrancePhase === 'shuffle';
  const showVeil = entrancePhase === 'hold' || entrancePhase === 'reveal';

  return (
    <div
      className="pointer-events-none absolute inset-0 z-[25]"
      style={{ perspective: 1600 }}
      aria-hidden
    >
      {showVeil ? (
        <DuelRevealVeil phase={entrancePhase} onRevealComplete={handleRevealComplete} />
      ) : null}

      {shuffleActive ? (
        <>
          <CardShuffleDealStage
            key={`enemy-${enemyKind}-${sessionKey}`}
            deck={setup.enemySet}
            layout={enemyLayout}
            shuffleKind={enemyKind}
            fixedFinalOrder={setup.enemyFinalOrder}
            cardBackSrc={setup.enemyCardBack}
            onComplete={handleEnemyComplete}
            battlefield
            autoPlay
            deckIntroFadeMs={DUEL_DECK_INTRO_FADE_MS}
            deckIntroBeatMs={DUEL_DECK_INTRO_BEAT_MS}
          />
          <CardShuffleDealStage
            key={`player-${playerKind}-${sessionKey}`}
            deck={setup.playerSet}
            layout={playerLayout}
            shuffleKind={playerKind}
            fixedFinalOrder={setup.playerFinalOrder}
            cardBackSrc={setup.playerCardBack}
            onComplete={handlePlayerComplete}
            battlefield
            autoPlay
            deckIntroFadeMs={DUEL_DECK_INTRO_FADE_MS}
            deckIntroBeatMs={DUEL_DECK_INTRO_BEAT_MS}
          />
        </>
      ) : null}
    </div>
  );
}

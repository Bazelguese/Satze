import React, { useMemo } from 'react';
import { getDeckArmies } from '../../utils/deckManager';
import { CLASSIC_SHUFFLE_KIND } from '../../utils/shuffleStylePreference';
import { ShuffleDealAnimatedCard } from './ShuffleDealAnimatedCard';
import { useCardShuffleDealAnimation } from './useCardShuffleDealAnimation';
import { useShuffleKitAnimation } from './useShuffleKitAnimation';
import { CARD_TRANSITION } from './BattlefieldShuffleKitController';

function ClassicShuffleStage({
  deck,
  layout,
  fixedFinalOrder,
  cardBackSrc,
  autoPlay,
  onComplete,
  showReplayButton,
  deckIntroFadeMs,
  deckIntroBeatMs,
}) {
  const { cards, showReplay, play } = useCardShuffleDealAnimation(deck, layout, {
    autoPlay,
    fixedFinalOrder,
    onComplete,
    deckIntroFadeMs,
    deckIntroBeatMs,
  });
  const deckArmies = useMemo(
    () => getDeckArmies(deck, { fallbackArmy: deck?.[0]?.army }),
    [deck]
  );

  return (
    <>
      {cards.map((c) => (
        <ShuffleDealAnimatedCard
          key={`${c.deckIndex}-${c.id}`}
          animatedCard={c}
          deck={deck}
          deckArmies={deckArmies}
          cardBackSrc={cardBackSrc}
          cardW={layout.cardW}
          cardH={layout.cardH}
        />
      ))}
      {showReplayButton && showReplay ? (
        <ReplayButton layout={layout} onClick={play} />
      ) : null}
    </>
  );
}

function KitShuffleStage({
  deck,
  layout,
  shuffleKind,
  fixedFinalOrder,
  cardBackSrc,
  autoPlay,
  onComplete,
  showReplayButton,
  loop,
  timeScale,
  deckIntroFadeMs,
  deckIntroBeatMs,
}) {
  const { cards, showReplay, play } = useShuffleKitAnimation(deck, layout, {
    kind: shuffleKind,
    autoPlay,
    fixedFinalOrder,
    onComplete,
    loop,
    timeScale,
    deckIntroFadeMs,
    deckIntroBeatMs,
  });
  const deckArmies = useMemo(
    () => getDeckArmies(deck, { fallbackArmy: deck?.[0]?.army }),
    [deck]
  );

  return (
    <>
      {cards.map((c) => (
        <ShuffleDealAnimatedCard
          key={`${c.deckIndex}-${c.id}`}
          animatedCard={{
            ...c,
            transition: c.transition ?? CARD_TRANSITION,
          }}
          deck={deck}
          deckArmies={deckArmies}
          cardBackSrc={cardBackSrc}
          cardW={layout.cardW}
          cardH={layout.cardH}
        />
      ))}
      {showReplayButton && showReplay ? (
        <ReplayButton layout={layout} onClick={play} />
      ) : null}
    </>
  );
}

function ReplayButton({ layout, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute left-1/2 z-[70] -translate-x-1/2 rounded border border-[#34343a] bg-[rgba(245,243,236,0.06)] px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.15em] text-[#ece9e2] transition hover:border-[#f5f3ec] hover:bg-[rgba(245,243,236,0.14)]"
      style={{
        bottom: layout.side === 'player' ? 6 : 'auto',
        top: layout.side === 'enemy' ? 6 : 'auto',
      }}
    >
      Rigioca
    </button>
  );
}

/**
 * Singola zona shuffle & deal (un giocatore).
 */
export function CardShuffleDealStage({
  deck,
  layout,
  label,
  sublabel,
  shuffleKind = CLASSIC_SHUFFLE_KIND,
  fixedFinalOrder = null,
  cardBackSrc = null,
  autoPlay = true,
  onComplete,
  showReplayButton = false,
  battlefield = false,
  loop = false,
  timeScale = 1,
  deckIntroFadeMs = 0,
  deckIntroBeatMs = 0,
}) {
  const isClassic = shuffleKind === CLASSIC_SHUFFLE_KIND;
  const stageProps = {
    deck,
    layout,
    fixedFinalOrder,
    cardBackSrc,
    autoPlay,
    onComplete,
    showReplayButton,
    deckIntroFadeMs,
    deckIntroBeatMs,
  };

  return (
    <div
      className={battlefield ? 'absolute inset-0' : 'relative mx-auto'}
      style={{
        width: layout.stageWidth,
        height: layout.stageHeight,
        perspective: battlefield ? undefined : 1600,
      }}
    >
      {!battlefield && label ? (
        <div
          className="pointer-events-none absolute left-4 z-[60] text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--st-muted)]"
          style={{ top: layout.side === 'enemy' ? 'auto' : 8, bottom: layout.side === 'enemy' ? 8 : 'auto' }}
        >
          {label}
          {sublabel ? (
            <span className="mt-0.5 block text-[10px] font-normal normal-case tracking-normal text-[var(--st-text)] opacity-80">
              {sublabel}
            </span>
          ) : null}
        </div>
      ) : null}

      {isClassic ? (
        <ClassicShuffleStage {...stageProps} />
      ) : (
        <KitShuffleStage
          {...stageProps}
          shuffleKind={shuffleKind}
          loop={loop}
          timeScale={timeScale}
        />
      )}
    </div>
  );
}

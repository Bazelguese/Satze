import React from 'react';
import { ARMY_COLORS } from '../../data';
import { useEldritchFacePreference } from '../../hooks/useEldritchFacePreference';
import { CardReworkP4 } from './CardReworkP4';
import { EldritchCardFace, ELDRITCH_FRAME_W, ELDRITCH_FRAME_H } from './EldritchCardFace';

/**
 * Componente carta per la mano - dimensioni medie
 * Versione semplificata della carta per la visualizzazione in mano
 */
const HAND_SHELL_W = 144; // w-36
const HAND_SHELL_H = 208; // h-52
/** Stessa scala in larghezza della P4 (cornice Eldritch = 230 come P4). */
const HAND_WIDTH_SCALE = HAND_SHELL_W / ELDRITCH_FRAME_W;
const HAND_P4_SCALE = Math.min(HAND_WIDTH_SCALE, HAND_SHELL_H / 330);
const HAND_ELD_SCALE = HAND_WIDTH_SCALE;
const HAND_ELD_SHELL_H = Math.round(ELDRITCH_FRAME_H * HAND_ELD_SCALE);

export const HandCard = React.memo(({
  agent,
  selected,
  onClick,
  disabled,
  usedCards = [],
  fragmentCardIds = [],
  preyCardIds = [],
  onPreviewClick,
  battleOutcome = null,
  onDragStart,
  isDragging = false,
  showBonus = false,
  bonusBaseInactive = false,
  effectiveAbility = null,
  highlighted = false,
  preyArriving = false,
  cardLayout: _legacyCardLayout,
}) => {
  const { showEldritch } = useEldritchFacePreference(agent?.id);
  const isUsed = usedCards.includes(agent?.id);
  const isFragment = fragmentCardIds.includes(agent?.id);
  const isPrey = preyCardIds.includes(agent?.id);
  const hasOutcome = isUsed && Boolean(battleOutcome);
  const isWinner = battleOutcome === 'winner';
  const isLoser = battleOutcome === 'loser';
  const colors = agent ? ARMY_COLORS[agent.army] || { bg: "from-gray-800 to-gray-700", accent: "#a9a294", text: "text-gray-200" } : {};

  if (!agent) return null;

  const handleMouseDown = (e) => {
    if (onDragStart && !disabled && !isUsed) {
      onDragStart(e, agent);
    }
  };

  const handleClick = () => {
    // Preview sempre disponibile (anche per carte avversarie con disabled)
    onPreviewClick?.({ agent, showBonus });
    if (disabled || isUsed) return;
    onClick?.();
  };

  const handShellClass = showEldritch
    ? `
        group relative flex-shrink-0 flex flex-col overflow-visible bg-transparent border-0 rounded-none
        ${hasOutcome ? 'satze-hand-outcome-card transition-transform duration-300' : 'transition-transform duration-300'}
        ${selected ? 'scale-105 -translate-y-2 z-20' : ''}
        ${highlighted ? 'satze-hand-focus animate-pulse' : ''}
        ${hasOutcome && isWinner ? 'satze-card-winner' : ''}
        ${hasOutcome && isLoser ? 'satze-card-loser satze-hand-outcome-loser' : ''}
        ${isFragment ? 'satze-hand-fragment-card' : ''}
        ${isPrey ? 'satze-hand-prey-card' : ''}
        ${preyArriving ? 'is-prey-forging' : ''}
        ${disabled || isUsed ? (onPreviewClick || hasOutcome ? 'cursor-pointer hover:scale-[1.02]' : 'cursor-not-allowed opacity-60') : onDragStart ? 'hover:scale-105 hover:-translate-y-4 cursor-grab active:cursor-grabbing active:scale-95' : 'hover:scale-105 hover:-translate-y-4 cursor-pointer active:scale-95'}
        ${isDragging ? 'scale-90' : ''}
      `
    : `
        group
        w-36 h-52 rounded-xl bg-gradient-to-br ${colors.bg}
        border-2 relative flex-shrink-0
        ${hasOutcome ? 'satze-hand-outcome-card transition-transform duration-300' : 'transition-all duration-300'}
        ${selected ? 'border-yellow-400 shadow-2xl shadow-yellow-400/60 scale-105 -translate-y-2 z-20 ring-4 ring-yellow-400/30' : 'border-white/30 shadow-lg'}
        ${highlighted ? 'satze-hand-focus ring-4 ring-amber-300/80 border-amber-200 shadow-2xl shadow-amber-300/45 animate-pulse' : ''}
        ${hasOutcome && isWinner ? 'satze-card-winner' : ''}
        ${hasOutcome && isLoser ? 'satze-card-loser satze-hand-outcome-loser' : ''}
        ${isFragment ? 'satze-hand-fragment-card' : ''}
        ${isPrey ? 'satze-hand-prey-card' : ''}
        ${preyArriving ? 'is-prey-forging' : ''}
        ${disabled || isUsed ? (onPreviewClick || hasOutcome ? 'cursor-pointer hover:scale-[1.02]' : 'cursor-not-allowed opacity-60') : onDragStart ? 'hover:scale-110 hover:border-white/70 hover:-translate-y-4 hover:shadow-2xl hover:shadow-yellow-500/40 hover:ring-2 hover:ring-yellow-400/40 cursor-grab active:cursor-grabbing active:scale-95' : 'hover:scale-110 hover:border-white/70 hover:-translate-y-4 hover:shadow-2xl hover:shadow-yellow-500/40 hover:ring-2 hover:ring-yellow-400/40 cursor-pointer active:scale-95'}
        ${isDragging ? 'scale-90 shadow-2xl' : ''}
        flex flex-col overflow-hidden
      `;

  const canDrag = Boolean(onDragStart && !disabled && !isUsed);
  const canHot = Boolean(!canDrag && (onClick || onPreviewClick));

  const eldritchFaceClass = [
    'satze-eldritch-face-chrome',
    selected ? 'is-selected' : '',
    highlighted ? 'is-highlighted' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      data-drag={canDrag ? 'true' : undefined}
      data-hot={canHot ? 'true' : undefined}
      className={handShellClass}
      style={
        showEldritch
          ? { userSelect: 'none', width: HAND_SHELL_W, height: HAND_ELD_SHELL_H }
          : { userSelect: 'none' }
      }
    >
      {showEldritch ? (
        <div
          className={`absolute left-1/2 top-1/2 pointer-events-none ${eldritchFaceClass}`}
          style={{
            width: ELDRITCH_FRAME_W,
            height: ELDRITCH_FRAME_H,
            transform: `translate(-50%, -50%) scale(${HAND_ELD_SCALE})`,
          }}
        >
          <EldritchCardFace agent={agent} width={ELDRITCH_FRAME_W} />
        </div>
      ) : (
        <div
          className="absolute left-1/2 top-1/2 pointer-events-none"
          style={{
            width: 230,
            height: 330,
            transform: `translate(-50%, -50%) scale(${HAND_P4_SCALE})`,
          }}
        >
          <CardReworkP4
            agent={agent}
            showBonus={showBonus}
            bonusBaseInactive={bonusBaseInactive}
            effectiveAbility={effectiveAbility}
          />
        </div>
      )}
      {hasOutcome && isWinner && <div className="satze-hand-outcome-diamond pointer-events-none" aria-hidden />}
      {hasOutcome && isLoser && <div className="satze-hand-outcome-dim pointer-events-none" aria-hidden />}
      {hasOutcome && (
        <div className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center" aria-hidden>
          <span
            className={`satze-hand-outcome-label ${
              isWinner ? 'satze-hand-outcome-label-winner' : 'satze-hand-outcome-label-loser'
            }`}
          >
            {isWinner ? 'Trionfo' : 'Sconfitta'}
          </span>
        </div>
      )}
      {isUsed && !battleOutcome && (
        <div className="absolute inset-0 bg-gradient-to-br from-black/85 via-slate-900/90 to-black/85 flex items-center justify-center z-30 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 border-4 border-white/40 rounded-full flex items-center justify-center">
              <span className="text-white/70 text-2xl">✓</span>
            </div>
            <span className="text-white/70 font-bold text-sm tracking-wider">USATO</span>
          </div>
        </div>
      )}
      {isFragment && (
        <div className="satze-hand-fragment-mark pointer-events-none" aria-label="Frammento">
          <span className="satze-hand-fragment-shard" aria-hidden />
          <span>Frammento</span>
        </div>
      )}
      {isPrey && !isFragment && (
        <div
          className={['satze-hand-prey-mark', 'pointer-events-none', preyArriving ? 'is-arrive' : ''].filter(Boolean).join(' ')}
          aria-label="Preda"
        >
          <span className="satze-hand-prey-fang" aria-hidden />
          <span>Preda</span>
        </div>
      )}
    </div>
  );
});

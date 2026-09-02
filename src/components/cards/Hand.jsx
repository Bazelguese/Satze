import React, { useState, useEffect, useMemo } from 'react';
import { ARMY_COLORS, ARMY_GIFS, ARMY_BONUSES } from '../../data';
import { getDeckArmies, getHandAccentColor } from '../../utils/deckManager';
import { battleOutcomeKey } from '../../game/duel/duelHelpers';
import { HandCard } from './HandCard';

/**
 * Componente mano giocatore/IA
 * Visualizza le carte in mano con posizionamento assoluto e triangolo di sfondo
 * Supporta GIF armate sotto i triangoli (32-bit, in public/)
 */
export const Hand = React.memo(({ 
  hand = [], 
  usedCards = [],
  fragmentCardIds = [],
  preyCardIds = [], 
  selectedAgent, 
  onAgentSelect, 
  onPreviewClick, 
  battleOutcomes = {},
  /** 'player' | 'enemy' — chiavi esito `side:cardId` (stesso id non condivide lo stato tra le parti). */
  battleOutcomeSide = null,
  cardPositions = [],
  position = 'bottom-right', // 'bottom-right' | 'top-left'
  label = 'Mano',
  gamePhase,
  disabled = false,
  onDragStart,
  draggingCard,
  isPlayerFirst,
  enemyAgent,
  armyBonuses = {},
  isBonusTriggerSatisfied,
  armyGifUrl, // override opzionale: percorso GIF custom per questa mano
  isActive = false, // true = tocca a questo giocatore
  selectedCardRef = null, // ref da assegnare alla carta selezionata (per scroll FC)
  handCardLayout = 'reworkP4',
  hideCards = false,
  highlightedAgentId = null,
  guidedBackgroundGlow = false,
  /** Mostra triangolo zona anche senza carte (es. fase shuffleDeal). */
  showZoneShell = false,
  zoneArmy = null,
  /** Mazzo completo (10 carte) per accent/armate durante shuffleDeal. */
  zoneColorHand = null,
  /** Armate esplicite per sfondo zona (max 2), es. da shuffleDealSetup. */
  zoneArmies = null,
  /** Porta le carte sopra il velo Eminenza, così restano cliccabili (anteprima Preda). */
  elevateCards = false,
  arrivingPreyId = null,
}) => {
  const [gifError, setGifError] = useState(false);
  const army = hand?.[0]?.army ?? zoneArmy;
  const zoneArmiesResolved = useMemo(() => {
    if (zoneArmies?.length) return zoneArmies.slice(0, 2);
    if (zoneColorHand?.length) return getDeckArmies(zoneColorHand);
    if (army && army !== 'Eserciti personalizzati' && army !== 'Eserciti misti') return [army];
    return [];
  }, [zoneArmies, zoneColorHand, army]);
  const colorHand = zoneColorHand?.length
    ? zoneColorHand
    : (hand?.length
      ? hand
      : (zoneArmiesResolved.length
        ? zoneArmiesResolved.map((a) => ({ army: a }))
        : (zoneArmy ? [{ army: zoneArmy }] : [])));
  const color = getHandAccentColor(colorHand, ARMY_COLORS, position === 'top-left' ? '#818cf8' : '#2dd4bf');
  const primaryZoneArmy = zoneArmiesResolved[0] ?? (army && army !== 'Eserciti personalizzati' && army !== 'Eserciti misti' ? army : null);
  
  // Reset errore GIF quando cambia armata
  useEffect(() => {
    setGifError(false);
  }, [army, primaryZoneArmy, zoneArmiesResolved.join('|')]);
  
  if ((!hand || hand.length === 0) && !showZoneShell) return null;
  const gifSrc = armyGifUrl ?? (primaryZoneArmy && ARMY_GIFS[primaryZoneArmy]);
  const showGif = gifSrc && !gifError;
  
  const positionStyles = {
    'top-left': {
      container: { top: 0, left: 0, width: '1071px', height: '459px' },
      gradient: 'linear-gradient(135deg, {color}2B 0%, {color}14 100%)',
      clipPath: 'polygon(0 0, 100% 0, 0 100%)',
      label: { top: '12px', left: '16px' }
    },
    'bottom-right': {
      container: { bottom: 0, right: 0, width: '1071px', height: '459px' },
      gradient: 'linear-gradient(315deg, {color}2B 0%, {color}14 100%)',
      clipPath: 'polygon(100% 0, 100% 100%, 0 100%)',
      label: { bottom: '12px', right: '16px' }
    }
  };
  
  const style = positionStyles[position];
  
  return (
    <>
      {/* GIF armata sotto il triangolo (z-index 1) */}
      {showGif && (
        <>
          <div 
            className={`absolute pointer-events-none transition-opacity duration-400 overflow-hidden ${
              gamePhase === 'result' ? 'opacity-0' : ''
            }`}
            style={{
              ...style.container,
              clipPath: style.clipPath,
              zIndex: 1,
              filter: guidedBackgroundGlow
                ? `drop-shadow(0 0 16px ${color}) drop-shadow(0 0 34px ${color}) brightness(1.28) saturate(1.22)`
                : undefined,
            }}
          >
            <img
              src={gifSrc}
              alt=""
              className="w-full h-full object-cover"
              style={{ imageRendering: 'crisp-edges' }}
              onError={() => setGifError(true)}
            />
          </div>
          {/* Bordo esterno GIF - SVG stroke lungo i bordi del triangolo */}
          <svg
            className={`absolute pointer-events-none transition-opacity duration-400 ${
              gamePhase === 'result' ? 'opacity-0' : ''
            }`}
            style={{
              ...style.container,
              zIndex: 1.5,
              filter: guidedBackgroundGlow ? `drop-shadow(0 0 16px ${color}) drop-shadow(0 0 28px ${color})` : undefined,
            }}
            viewBox="0 0 1071 459"
            preserveAspectRatio="none"
          >
            {position === 'top-left' ? (
              <polygon
                points="0,0 1071,0 0,459"
                fill="none"
                stroke={`color-mix(in srgb, ${color} 55%, black)`}
                strokeWidth={guidedBackgroundGlow ? '18' : '14'}
              />
            ) : (
              <polygon
                points="1071,0 1071,459 0,459"
                fill="none"
                stroke={`color-mix(in srgb, ${color} 55%, black)`}
                strokeWidth={guidedBackgroundGlow ? '18' : '14'}
              />
            )}
          </svg>
        </>
      )}
      {/* Triangolo di sfondo (gradiente sopra la GIF) + bordo ispessito */}
      <div 
        className={`absolute pointer-events-none transition-all duration-500 ${
          gamePhase === 'result' ? 'opacity-0' : ''
        } ${isActive ? 'satze-hand-active' : ''}`}
        style={{
          ...style.container,
          background: style.gradient.replace(/{color}/g, color),
          clipPath: style.clipPath,
          zIndex: 2,
          filter: `drop-shadow(0 0 1px ${color}) drop-shadow(0 0 3px ${color})`,
        }}
      />
      {/* Particelle per mano attiva */}
      {isActive && gamePhase !== 'result' && (
        <div className="absolute pointer-events-none satze-hand-particles overflow-hidden" style={{ ...style.container, clipPath: style.clipPath, zIndex: 2.5 }}>
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white/80 satze-hand-particle"
              style={{
                width: '4px',
                height: '4px',
                left: `${15 + (i % 4) * 24}%`,
                top: `${18 + Math.floor(i / 4) * 24}%`,
                animationDelay: `${i * 0.1}s`,
              }}
            />
          ))}
        </div>
      )}
      
      {/* Container carte - z-index 8 in selectAgent per mano player */}
      <div 
        className={`absolute transition-all duration-400 ${
          gamePhase === 'result' ? 'animate-fade-out-hands pointer-events-none' : ''
        }`}
        style={{
          ...style.container,
          zIndex: elevateCards
            ? 21
            : ((gamePhase === 'selectAgent' && position === 'bottom-right') ? 8 : 4),
          pointerEvents: elevateCards ? 'auto' : undefined,
          willChange: 'transform',
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden',
          contain: 'layout style paint'
        }}
      >
        <div 
          className="text-xs text-slate-500 uppercase tracking-wider absolute"
          style={style.label}
        >
          {label}
        </div>
        
        {!hideCards && hand?.length > 0 && hand.map((agent, idx) => {
          const outcomeKey = battleOutcomeKey(battleOutcomeSide, agent.id) ?? agent.id;
          const outcome = battleOutcomes[outcomeKey] || null;
          const outcomeLowerOffset = outcome ? 20 : 0;
          const cardStyle = position === 'top-left' 
            ? {
                left: `${cardPositions[idx]?.left || 0}px`,
                top: `${(cardPositions[idx]?.top || 0) + outcomeLowerOffset}px`,
              }
            : { 
                right: `${cardPositions[idx]?.right || 0}px`, 
                bottom: `${(cardPositions[idx]?.bottom || 0) - outcomeLowerOffset}px`,
                willChange: 'transform',
                transform: 'translateZ(0)',
                backfaceVisibility: 'hidden',
              };
          
          const isSelected = selectedAgent?.id === agent.id;
          return (
            <div 
              key={agent.id}
              ref={isSelected && selectedCardRef ? selectedCardRef : undefined}
              className="absolute"
              data-hand-agent={agent.id}
              style={cardStyle}
            >
              <HandCard
                agent={agent}
                cardLayout={handCardLayout}
                selected={isSelected}
                highlighted={highlightedAgentId === agent.id}
                preyArriving={arrivingPreyId === agent.id}
                onClick={gamePhase === 'selectAgent' && (isPlayerFirst || enemyAgent) && !disabled 
                  ? () => onAgentSelect?.(agent) 
                  : undefined}
                disabled={gamePhase !== 'selectAgent' || (!isPlayerFirst && !enemyAgent) || disabled}
                usedCards={usedCards}
                fragmentCardIds={fragmentCardIds}
                preyCardIds={preyCardIds}
                onPreviewClick={onPreviewClick}
                showBonus={armyBonuses[agent?.army] && isBonusTriggerSatisfied
                  ? isBonusTriggerSatisfied(agent?.army, position === 'bottom-right', agent)
                  : false}
                bonusBaseInactive={
                  Boolean(ARMY_BONUSES[agent?.army]) && !armyBonuses?.[agent?.army]
                }
                battleOutcome={outcome}
                onDragStart={gamePhase === 'selectAgent' && (isPlayerFirst || enemyAgent) && !disabled && onDragStart
                  ? onDragStart
                  : undefined}
                isDragging={draggingCard?.id === agent.id}
              />
            </div>
          );
        })}
      </div>
    </>
  );
});
Hand.displayName = 'Hand';

import React from 'react';
import { ARMY_COLORS, ARMY_BONUSES } from '../../data';
import { getCardSprite } from '../../utils';
import { getImagePositioning } from '../../data/imagePositioning';
import { CardImage } from './CardImage';
import { CardName } from './CardName';
import { Icon } from '../ui/Icon';
import { AbilityFormatted, BonusFormattedFromString } from './AbilityFormatted';

/** Stesso schema piastra delle altre evidenziazioni footer, tinta ardesia (non attivo). */
const LEGACY_CARD_FOOTER_INACTIVE_PANEL =
  'rounded px-0 py-1 overflow-hidden bg-gradient-to-r from-slate-950/42 via-slate-900/12 to-transparent shadow-[inset_0_-12px_20px_-10px_rgba(0,0,0,0.1),0_8px_20px_-12px_rgba(0,0,0,0.12),0_0_22px_-8px_rgba(148,163,184,0.11)] origin-bottom transform-gpu';

/**
 * Componente carta principale per il duello
 * Mostra tutte le informazioni della carta con supporto per modificatori e stati
 */
export const Card = ({ 
  agent, 
  selected, 
  onClick, 
  onHover,
  onDragStart,
  isDragging = false,
  disabled, 
  small, 
  usedCards = [], 
  showBonus = false, 
  modifiedPower = null, 
  modifiedDamage = null, 
  abilityBlocked = false, 
  bonusBlocked = false, 
  showOperators = false, 
  highlightAbility = false, 
  highlightBonus = false, 
  copiedAbility = null, 
  copiedBonus = null, 
  abilityNotTriggered = false, 
  bonusNotTriggered = false,
  abilityCurrentValue = null // Per Attrizione/Escalation: valore attuale da mostrare tra parentesi
}) => {
  const isUsed = usedCards.includes(agent?.id);
  const colors = agent ? ARMY_COLORS[agent.army] || { bg: "from-gray-800 to-gray-700", accent: "#666", text: "text-gray-200" } : {};
  const armyBonus = agent ? ARMY_BONUSES[agent.army] : null;
  
  if (!agent) return null;
  
  // Determina i valori da mostrare e i colori
  const displayPower = modifiedPower !== null ? modifiedPower : agent.power;
  const displayDamage = modifiedDamage !== null ? modifiedDamage : agent.damage;
  const spriteInfo = getCardSprite(agent);
  const positioning = getImagePositioning(agent.id, agent.army);
  const objectPosition = positioning.objectPosition || 'center center';
  const imageScale = positioning.scale ?? 100;
  const containerLeft = positioning.containerLeft;
  const containerTop = positioning.containerTop;
  
  // Calcola differenze per operatori
  const powerDiff = modifiedPower !== null ? modifiedPower - agent.power : 0;
  const damageDiff = modifiedDamage !== null ? modifiedDamage - agent.damage : 0;
  
  const getPowerColor = () => {
    if (modifiedPower === null) return 'text-yellow-300';
    if (modifiedPower > agent.power) return 'text-emerald-400';
    if (modifiedPower < agent.power) return 'text-red-400';
    return 'text-yellow-300';
  };
  
  const getDamageColor = () => {
    if (modifiedDamage === null) return 'text-purple-400';
    if (modifiedDamage > agent.damage) return 'text-cyan-400';
    if (modifiedDamage < agent.damage) return 'text-orange-400';
    return 'text-purple-400';
  };
  
  // Centraggio standard come in galleria - nessun posizionamento personalizzato
  
  const handleMouseDown = (e) => {
    if (onDragStart && !disabled && !isUsed) onDragStart(e, agent);
  };

  const handleClick = () => {
    if (disabled || isUsed) return;
    onClick?.(agent);
    if (onHover && agent) onHover({ agent, showBonus: showBonus });
  };

  return (
    <div
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      className={`
        group
        ${small ? 'w-44 h-64' : 'w-56 h-80'} 
        rounded-xl bg-gradient-to-br ${colors.bg}
        border-2 transition-all duration-200 cursor-pointer relative
        ${selected ? 'border-yellow-400 shadow-xl shadow-yellow-400/40 scale-105' : 'border-white/30'}
        ${disabled || isUsed ? 'opacity-50 cursor-not-allowed' : onDragStart ? 'cursor-grab active:cursor-grabbing hover:scale-105 hover:border-white/60' : 'hover:scale-105 hover:border-white/60'}
        ${isDragging ? 'opacity-40 scale-95' : ''}
        flex flex-col overflow-hidden
      `}
    >
      {/* Full Art Sprite - centrato come sfondo */}
      <div className="absolute inset-0 flex items-center justify-center">
        <CardImage type={spriteInfo.type} palette={spriteInfo.palette} agentId={spriteInfo.agentId} size={small ? 180 : 260} objectPosition={objectPosition} scale={imageScale} containerLeft={containerLeft} containerTop={containerTop} />
      </div>
      
      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
      
      {/* Header */}
      <div className="relative z-10 px-2 py-1.5 bg-black/50 flex justify-between items-center">
        <CardName name={agent.name} small={small} />
        <span className={`${small ? 'text-[10px]' : 'text-xs'} bg-white/20 px-1.5 py-0.5 rounded text-white font-mono ml-1`}>
          L{agent.league}
        </span>
      </div>
      
      {/* Spacer per l'arte */}
      <div className="flex-1" />
      
      {/* Stats laterali */}
      <div className="absolute left-2 top-1/2 -translate-y-1/2 flex flex-col gap-1 z-10">
        <div className="bg-black/70 rounded px-2 py-1 text-center relative group">
          <div 
            key={`power-${displayPower}`}
            className={`${small ? 'text-xl' : 'text-2xl'} font-black ${getPowerColor()} drop-shadow-lg leading-none ${
              showOperators && powerDiff !== 0 ? (powerDiff > 0 ? 'animate-number-increase' : 'animate-number-decrease') : ''
            }`}
          >
            {displayPower}
          </div>
          <div className="text-[8px] text-white/60 flex items-center justify-center gap-1">
            <Icon name="sword" type="cardIcon" size={10} color="#94a3b8" /> POT
          </div>
        </div>
      </div>
      
      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-1 z-10">
        <div className="bg-black/70 rounded px-2 py-1 text-center relative group">
          <div 
            key={`damage-${displayDamage}`}
            className={`${small ? 'text-xl' : 'text-2xl'} font-black ${getDamageColor()} drop-shadow-lg leading-none ${
              showOperators && damageDiff !== 0 ? (damageDiff > 0 ? 'animate-number-increase' : 'animate-number-decrease') : ''
            }`}
          >
            {displayDamage}
          </div>
          <div className="text-[8px] text-white/60 flex items-center justify-center gap-1">
            <Icon name="explosion" type="cardIcon" size={10} color="#94a3b8" /> DAN
          </div>
          {/* Operatore +/- Danno */}
          {showOperators && damageDiff !== 0 && (
            <div className={`absolute -left-7 top-1/2 -translate-y-1/2 text-xs font-bold transition-all duration-300 ${
              damageDiff > 0 
                ? 'text-cyan-300 drop-shadow-[0_0_4px_rgba(103,232,249,0.6)]' 
                : 'text-orange-400 drop-shadow-[0_0_4px_rgba(251,146,60,0.6)]'
            }`}>
              <span className="bg-black/70 px-1.5 py-0.5 rounded border border-current/30">
                {damageDiff > 0 ? `+${damageDiff}` : damageDiff}
              </span>
            </div>
          )}
        </div>
      </div>
      
      {/* Footer con Potere e Bonus */}
      <div className="relative z-10 bg-black/40 p-2">
        {/* Potere */}
        <div className={`mb-1 relative transition-[opacity,background-color,box-shadow] duration-500 ${
          abilityBlocked ? 'opacity-50' : ''
        } ${
          copiedAbility ? 'rounded px-0 py-1 overflow-hidden bg-gradient-to-r from-emerald-950/40 via-emerald-900/12 to-transparent shadow-[inset_0_-12px_20px_-10px_rgba(0,0,0,0.1),0_8px_20px_-12px_rgba(0,0,0,0.12),0_0_22px_-8px_rgba(52,211,153,0.09)] origin-bottom transform-gpu animate-modifier-copy-panel' :
          abilityBlocked ? 'rounded px-0 py-1 overflow-hidden bg-gradient-to-r from-red-950/42 via-red-900/12 to-transparent shadow-[inset_0_-12px_20px_-10px_rgba(0,0,0,0.11),0_8px_20px_-12px_rgba(0,0,0,0.14),0_0_22px_-8px_rgba(248,113,113,0.1)] origin-bottom transform-gpu animate-modifier-highlight-panel' :
          abilityNotTriggered ? LEGACY_CARD_FOOTER_INACTIVE_PANEL :
          highlightAbility ? 'rounded px-0 py-1 overflow-hidden bg-gradient-to-r from-orange-950/40 via-orange-900/12 to-transparent shadow-[inset_0_-12px_20px_-10px_rgba(0,0,0,0.1),0_8px_20px_-12px_rgba(0,0,0,0.12),0_0_22px_-8px_rgba(251,146,60,0.09)] origin-bottom transform-gpu animate-modifier-highlight-panel' : 'rounded px-1.5 py-1'
        }`}>
          <div className={`text-[8px] uppercase font-bold flex items-center gap-1 ${
            copiedAbility ? 'text-green-300' :
            abilityBlocked ? 'text-red-400' : 
            abilityNotTriggered ? 'text-slate-500' :
            highlightAbility ? 'text-orange-300' : 'text-orange-400'
          }`}>
            {copiedAbility && <Icon name="copy" type="cardIcon" size={10} />}
            {!copiedAbility && !abilityBlocked && <Icon name="lightning" type="cardIcon" size={10} />}
            {abilityBlocked ? ' Potere Bloccato' : copiedAbility ? ' Potere Copiato' : ' Potere'}
          </div>
          <div className={`${small ? 'text-[9px]' : 'text-[10px]'} leading-tight ${
            copiedAbility ? 'text-green-200 font-semibold' :
            abilityBlocked ? 'text-red-300 line-through' : 
            abilityNotTriggered ? 'text-slate-500 font-semibold' :
            highlightAbility ? 'text-orange-200 font-semibold' : 'text-white'
          }`}>
            <AbilityFormatted
              ability={copiedAbility || agent.ability}
              options={
                copiedAbility
                  ? {}
                  : abilityCurrentValue != null
                    ? { currentValue: abilityCurrentValue }
                    : {}
              }
            />
          </div>
          {abilityBlocked && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <Icon name="block" type="cardIcon" size={28} color="#ef4444" className="opacity-30" style={{ transform: 'rotate(-15deg)' }} />
            </div>
          )}
        </div>
        
        {/* Bonus Armata */}
        <div className={`pt-1 border-t transition-[opacity,background-color,box-shadow,border-color] duration-500 group relative ${
          copiedBonus ? 'rounded px-0 py-1 overflow-hidden border-transparent bg-gradient-to-r from-emerald-950/40 via-emerald-900/12 to-transparent shadow-[inset_0_-12px_20px_-10px_rgba(0,0,0,0.1),0_8px_20px_-12px_rgba(0,0,0,0.12),0_0_22px_-8px_rgba(52,211,153,0.09)] origin-bottom transform-gpu animate-modifier-copy-panel-stagger' :
          bonusBlocked ? 'rounded px-0 py-1 overflow-hidden border-transparent bg-gradient-to-r from-red-950/42 via-red-900/12 to-transparent shadow-[inset_0_-12px_20px_-10px_rgba(0,0,0,0.11),0_8px_20px_-12px_rgba(0,0,0,0.14),0_0_22px_-8px_rgba(248,113,113,0.1)] origin-bottom transform-gpu animate-modifier-highlight-panel-stagger' :
          bonusNotTriggered ? LEGACY_CARD_FOOTER_INACTIVE_PANEL :
          highlightBonus && !copiedBonus
            ? 'border-transparent rounded px-0 py-1 overflow-hidden bg-gradient-to-r from-sky-950/40 via-sky-900/12 to-transparent shadow-[inset_0_-12px_20px_-10px_rgba(0,0,0,0.1),0_8px_20px_-12px_rgba(0,0,0,0.12),0_0_22px_-8px_rgba(56,189,248,0.09)] origin-bottom transform-gpu animate-modifier-highlight-panel-stagger'
            : showBonus && !bonusBlocked ? 'rounded px-1.5 py-1 bg-sky-500/8' : 'rounded px-1.5 py-1 border-white/10'
        } ${bonusBlocked ? 'opacity-50' : ''}`}>
          <div className={`text-[8px] uppercase font-bold flex items-center gap-1 ${
            copiedBonus ? 'text-green-300' :
            bonusBlocked ? 'text-red-400' : 
            bonusNotTriggered ? 'text-slate-500' :
            highlightBonus ? 'text-sky-300' : 'text-sky-400'
          }`}>
            {(showBonus || copiedBonus || highlightBonus) && !bonusBlocked && !bonusNotTriggered && <Icon name="check" type="cardIcon" size={10} />}
            {bonusBlocked ? ' Bonus Bloccato' : bonusNotTriggered ? ' Bonus' : showBonus ? ' Bonus' : ' Bonus'}
          </div>
          <div className={`${small ? 'text-[9px]' : 'text-[10px]'} leading-tight ${
            copiedBonus ? 'text-green-200 font-semibold' :
            bonusBlocked ? 'text-red-300 line-through' : 
            bonusNotTriggered ? 'text-slate-500 font-semibold' :
            highlightBonus ? 'text-sky-200 font-semibold' : 'text-white'
          }`}>
            <BonusFormattedFromString
              text={copiedBonus ? copiedBonus.description : armyBonus?.description || '—'}
            />
          </div>
          {bonusBlocked && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <Icon name="block" type="cardIcon" size={28} color="#ef4444" className="opacity-30" style={{ transform: 'rotate(-15deg)' }} />
            </div>
          )}
        </div>
      </div>
      
      {/* Army badge */}
      <div 
        className="relative z-10 text-[8px] text-center py-0.5 font-bold tracking-wide uppercase"
        style={{ backgroundColor: colors.accent + '60', color: '#fff' }}
      >
        {agent.army}
      </div>
      
      {/* Used overlay */}
      {isUsed && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-20">
          <span className="text-white/80 font-bold text-sm">USATO</span>
        </div>
      )}
    </div>
  );
};

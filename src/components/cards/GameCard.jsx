import React from 'react';
import { CardReworkP4 } from './CardReworkP4';

/**
 * Carta in partita / anteprima: layout ufficiale P4 (HUD fascia + cerchi POT/DAN).
 * La prop `cardLayout` è ignorata (resta per compatibilità con chiamate esistenti).
 * Memoizzata: evita di ridisegnare la carta quando le props non cambiano
 * (es. re-render per-frame della sequenza clash).
 */
export const GameCard = React.memo(function GameCard({ agent, ...rest }) {
  if (!agent) return null;

  const {
    modifiedPower = null,
    modifiedDamage = null,
    showBonus = false,
    disabled,
    usedCards = [],
    onClick,
    onHover,
    onDragStart,
    isDragging = false,
    selected,
    abilityBlocked = false,
    bonusBlocked = false,
    showOperators = false,
    highlightAbility = false,
    highlightBonus = false,
    copiedAbility = null,
    copiedBonus = null,
    copiedAbilityNotTriggered = false,
    abilityNotTriggered = false,
    bonusNotTriggered = false,
    bonusBaseInactive = false,
    abilityCurrentValue = null,
    suppressAnimations = false,
    visualStepKind = null,
    visualStepIndex = 0,
    copyAbilityAnim = false,
    copyBonusAnim = false,
    fieldMinFloorReduction = 0,
  } = rest;

  const isUsed = usedCards.includes(agent?.id);
  const displayAgent =
    modifiedPower !== null || modifiedDamage !== null
      ? {
          ...agent,
          power: modifiedPower !== null ? modifiedPower : agent.power,
          damage: modifiedDamage !== null ? modifiedDamage : agent.damage,
        }
      : agent;

  const handleMouseDown = (e) => {
    if (onDragStart && !disabled && !isUsed) onDragStart(e, agent);
  };

  const handleClick = () => {
    if (disabled || isUsed) return;
    onClick?.(agent);
    if (onHover && agent) onHover({ agent, showBonus });
  };

  return (
    <div
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      className={`inline-block select-none ${selected ? 'rounded-[14px] ring-2 ring-yellow-400 ring-offset-2 ring-offset-slate-900' : ''} ${isDragging ? 'opacity-40 scale-95 transition-transform' : ''} ${disabled || isUsed ? 'opacity-90' : ''}`}
      style={{
        cursor:
          disabled && !onHover
            ? 'not-allowed'
            : onDragStart && !disabled && !isUsed
              ? 'grab'
              : 'pointer',
      }}
    >
      <div className="pointer-events-none">
        <CardReworkP4
          agent={displayAgent}
          duelBasePower={agent.power}
          duelBaseDamage={agent.damage}
          showBonus={showBonus}
          abilityBlocked={abilityBlocked}
          bonusBlocked={bonusBlocked}
          showOperators={showOperators}
          highlightAbility={highlightAbility}
          highlightBonus={highlightBonus}
          copiedAbility={copiedAbility}
          copiedBonus={copiedBonus}
          copiedAbilityNotTriggered={copiedAbilityNotTriggered}
          abilityNotTriggered={abilityNotTriggered}
          bonusNotTriggered={bonusNotTriggered}
          bonusBaseInactive={bonusBaseInactive}
          abilityCurrentValue={abilityCurrentValue}
          suppressAnimations={suppressAnimations}
          visualStepKind={visualStepKind}
          visualStepIndex={visualStepIndex}
          copyAbilityAnim={copyAbilityAnim}
          copyBonusAnim={copyBonusAnim}
          fieldMinFloorReduction={fieldMinFloorReduction}
        />
      </div>
    </div>
  );
});

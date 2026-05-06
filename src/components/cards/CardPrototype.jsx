// ============================================
// PROTOTIPO CARTA - Molte varianti con differenze sostanziali
// API: agent (come Card/HandCard)
// ============================================

import React from 'react';
import { ARMY_COLORS, ARMY_BONUSES } from '../../data';
import { formatAbilityHelper, getCardSprite } from '../../utils';
import { getImagePositioning } from '../../data/imagePositioning';
import { CardImage } from './CardImage';
import { CardName } from './CardName';
import { AbilityFormattedFromString, BonusFormattedFromString } from './AbilityFormatted';

const LAYOUT_VARIANTS = [
  'default', 'refined', 'statsSides', 'compact', 'contrast',
  'statsTop', 'statsInline', 'fullart', 'topBar', 'horizontal',
  'pillStats', 'minimal', 'framed', 'split', 'stacked', 'inverted',
];

const POWER_COLOR = '#fde047';
const DAMAGE_COLOR = '#c084fc';
/** Titolo “Potere” (abilità): arancio. */
const ABILITY_HEADING_COLOR = '#fb923c';

export const CardPrototype = ({
  agent,
  selected = false,
  onClick,
  disabled = false,
  variant = 'default',
}) => {
  if (!agent) return null;

  const colors = ARMY_COLORS[agent.army] || { bg: 'from-gray-800 to-gray-700', accent: '#666' };
  const armyBonus = ARMY_BONUSES[agent.army];
  const spriteInfo = getCardSprite(agent);
  const positioning = getImagePositioning(agent.id, agent.army);
  const objectPosition = positioning.objectPosition || 'center center';
  const imageScale = positioning.scale ?? 100;
  const containerLeft = positioning.containerLeft;
  const containerTop = positioning.containerTop;

  const baseClasses = `
    group relative overflow-hidden rounded-lg border-2 transition-all duration-200
    bg-gradient-to-br ${colors.bg}
    ${selected ? 'border-yellow-400 shadow-xl shadow-yellow-400/40 scale-105' : 'border-white/30'}
    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105 hover:border-white/60'}
  `;

  const cardContent = {
    name: agent.name,
    league: agent.league,
    power: agent.power,
    damage: agent.damage,
    ability: formatAbilityHelper(agent.ability),
    bonus: armyBonus?.description || '—',
    army: agent.army,
  };

  const renderDefault = () => (
    <div onClick={() => !disabled && onClick?.(agent)} className={`${baseClasses} flex flex-col w-56 h-80`}>
      <div className="absolute inset-0 flex items-center justify-center">
        <CardImage type={spriteInfo.type} palette={spriteInfo.palette} agentId={spriteInfo.agentId} size={260} objectPosition={objectPosition} scale={imageScale} containerLeft={containerLeft} containerTop={containerTop} />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
      <div className="relative z-10 px-2 py-1.5 bg-black/50 flex justify-between items-center">
        <CardName name={cardContent.name} />
        <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded text-white font-mono">L{cardContent.league}</span>
      </div>
      <div className="flex-1" />
      <div className="relative z-10 px-2 pb-2 flex gap-2">
        <div className="flex-1 bg-black/70 rounded px-2 py-1 text-center">
          <span className="text-2xl font-black" style={{ color: POWER_COLOR }}>{cardContent.power}</span>
          <div className="text-[8px] text-white/60">POT</div>
        </div>
        <div className="flex-1 bg-black/70 rounded px-2 py-1 text-center">
          <span className="text-2xl font-black" style={{ color: DAMAGE_COLOR }}>{cardContent.damage}</span>
          <div className="text-[8px] text-white/60">DAN</div>
        </div>
      </div>
      <div className="relative z-10 bg-black/40 p-2 space-y-1">
        <div className="rounded px-1.5 py-1">
          <div className="text-[8px] uppercase font-bold" style={{ color: ABILITY_HEADING_COLOR }}>Potere</div>
          <div className="text-[10px] leading-tight text-white"><AbilityFormattedFromString text={cardContent.ability} /></div>
        </div>
        <div className="rounded px-1.5 py-1 border-t border-white/10">
          <div className="text-[8px] uppercase font-bold text-sky-400">Bonus</div>
          <div className="text-[10px] leading-tight text-white"><BonusFormattedFromString text={cardContent.bonus} /></div>
        </div>
      </div>
      <div className="relative z-10 text-[8px] text-center py-0.5 font-bold tracking-wide uppercase" style={{ backgroundColor: colors.accent + '60', color: '#fff' }}>
        {cardContent.army}
      </div>
    </div>
  );

  if (variant === 'default') return renderDefault();

  // --- REFINED ---
  if (variant === 'refined') {
    return (
      <div onClick={() => !disabled && onClick?.(agent)} className={`${baseClasses} flex flex-col w-56 h-80`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <CardImage type={spriteInfo.type} palette={spriteInfo.palette} agentId={spriteInfo.agentId} size={260} objectPosition={objectPosition} scale={imageScale} containerLeft={containerLeft} containerTop={containerTop} />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
        <div className="relative z-10 px-3 py-2 bg-black/40 backdrop-blur-sm flex justify-between items-center border-b border-white/10">
          <CardName name={cardContent.name} />
          <span className="text-xs font-mono font-medium text-white/90 bg-white/15 px-2 py-0.5 rounded-md">L{cardContent.league}</span>
        </div>
        <div className="flex-1" />
        <div className="relative z-10 px-3 pb-3 flex gap-3">
          <div className="flex-1 bg-black/75 rounded-lg px-3 py-2 text-center border border-white/10">
            <span className="text-2xl font-black block" style={{ color: POWER_COLOR }}>{cardContent.power}</span>
            <div className="text-[9px] text-white/70 font-medium mt-0.5">POT</div>
          </div>
          <div className="flex-1 bg-black/75 rounded-lg px-3 py-2 text-center border border-white/10">
            <span className="text-2xl font-black block" style={{ color: DAMAGE_COLOR }}>{cardContent.damage}</span>
            <div className="text-[9px] text-white/70 font-medium mt-0.5">DAN</div>
          </div>
        </div>
        <div className="relative z-10 bg-black/50 p-3 space-y-2 border-t border-white/10">
          <div className="rounded-lg px-2 py-1.5 bg-black/30">
            <div className="text-[8px] uppercase font-bold tracking-wider" style={{ color: ABILITY_HEADING_COLOR }}>Potere</div>
            <div className="text-[10px] leading-snug text-white mt-0.5"><AbilityFormattedFromString text={cardContent.ability} /></div>
          </div>
          <div className="rounded-lg px-2 py-1.5 bg-black/30 border-t border-white/5">
            <div className="text-[8px] uppercase font-bold tracking-wider text-sky-400">Bonus</div>
            <div className="text-[10px] leading-snug text-white mt-0.5"><BonusFormattedFromString text={cardContent.bonus} /></div>
          </div>
        </div>
        <div className="relative z-10 text-[8px] text-center py-1 font-bold tracking-widest uppercase rounded-b-md" style={{ backgroundColor: colors.accent + '70', color: '#fff' }}>
          {cardContent.army}
        </div>
      </div>
    );
  }

  // --- STATS SIDES ---
  if (variant === 'statsSides') {
    return (
      <div onClick={() => !disabled && onClick?.(agent)} className={`${baseClasses} flex flex-col w-56 h-80`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <CardImage type={spriteInfo.type} palette={spriteInfo.palette} agentId={spriteInfo.agentId} size={260} objectPosition={objectPosition} scale={imageScale} containerLeft={containerLeft} containerTop={containerTop} />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
        <div className="relative z-10 px-2 py-1.5 bg-black/50 flex justify-between items-center">
          <CardName name={cardContent.name} />
          <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded text-white font-mono">L{cardContent.league}</span>
        </div>
        <div className="absolute left-2 top-1/2 -translate-y-1/2 z-10">
          <div className="bg-black/75 rounded-lg px-2.5 py-1.5 text-center border border-white/20">
            <span className="text-2xl font-black block" style={{ color: POWER_COLOR }}>{cardContent.power}</span>
            <div className="text-[8px] text-white/60">POT</div>
          </div>
        </div>
        <div className="absolute right-2 top-1/2 -translate-y-1/2 z-10">
          <div className="bg-black/75 rounded-lg px-2.5 py-1.5 text-center border border-white/20">
            <span className="text-2xl font-black block" style={{ color: DAMAGE_COLOR }}>{cardContent.damage}</span>
            <div className="text-[8px] text-white/60">DAN</div>
          </div>
        </div>
        <div className="flex-1" />
        <div className="relative z-10 bg-black/40 p-2 space-y-1">
          <div className="rounded px-1.5 py-1">
            <div className="text-[8px] uppercase font-bold" style={{ color: ABILITY_HEADING_COLOR }}>Potere</div>
            <div className="text-[10px] leading-tight text-white"><AbilityFormattedFromString text={cardContent.ability} /></div>
          </div>
          <div className="rounded px-1.5 py-1 border-t border-white/10">
            <div className="text-[8px] uppercase font-bold text-sky-400">Bonus</div>
            <div className="text-[10px] leading-tight text-white"><BonusFormattedFromString text={cardContent.bonus} /></div>
          </div>
        </div>
        <div className="relative z-10 text-[8px] text-center py-0.5 font-bold tracking-wide uppercase" style={{ backgroundColor: colors.accent + '60', color: '#fff' }}>
          {cardContent.army}
        </div>
      </div>
    );
  }

  // --- COMPACT ---
  if (variant === 'compact') {
    return (
      <div onClick={() => !disabled && onClick?.(agent)} className={`${baseClasses} flex flex-col w-56 h-80`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <CardImage type={spriteInfo.type} palette={spriteInfo.palette} agentId={spriteInfo.agentId} size={260} objectPosition={objectPosition} scale={imageScale} containerLeft={containerLeft} containerTop={containerTop} />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
        <div className="relative z-10 px-2 py-1 bg-black/55 flex justify-between items-center">
          <CardName name={cardContent.name} small />
          <span className="text-[10px] bg-white/25 px-1.5 py-0.5 rounded font-mono text-white">L{cardContent.league}</span>
        </div>
        <div className="flex-1" />
        <div className="relative z-10 px-2 pb-1.5 flex gap-1.5">
          <div className="flex-1 bg-black/75 rounded-md px-1.5 py-0.5 text-center">
            <span className="text-xl font-black" style={{ color: POWER_COLOR }}>{cardContent.power}</span>
            <div className="text-[7px] text-white/60">POT</div>
          </div>
          <div className="flex-1 bg-black/75 rounded-md px-1.5 py-0.5 text-center">
            <span className="text-xl font-black" style={{ color: DAMAGE_COLOR }}>{cardContent.damage}</span>
            <div className="text-[7px] text-white/60">DAN</div>
          </div>
        </div>
        <div className="relative z-10 bg-black/45 px-2 py-1.5 space-y-0.5">
          <div>
            <div className="text-[7px] uppercase font-bold" style={{ color: ABILITY_HEADING_COLOR }}>Potere</div>
            <div className="text-[9px] leading-tight text-white"><AbilityFormattedFromString text={cardContent.ability} /></div>
          </div>
          <div className="border-t border-white/10 pt-0.5">
            <div className="text-[7px] uppercase font-bold text-sky-400">Bonus</div>
            <div className="text-[9px] leading-tight text-white"><BonusFormattedFromString text={cardContent.bonus} /></div>
          </div>
        </div>
        <div className="relative z-10 text-[7px] text-center py-0.5 font-bold tracking-wide uppercase" style={{ backgroundColor: colors.accent + '60', color: '#fff' }}>
          {cardContent.army}
        </div>
      </div>
    );
  }

  // --- CONTRAST ---
  if (variant === 'contrast') {
    return (
      <div onClick={() => !disabled && onClick?.(agent)} className={`${baseClasses} flex flex-col w-56 h-80`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <CardImage type={spriteInfo.type} palette={spriteInfo.palette} agentId={spriteInfo.agentId} size={260} objectPosition={objectPosition} scale={imageScale} containerLeft={containerLeft} containerTop={containerTop} />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/20" />
        <div className="relative z-10 px-2 py-1.5 bg-black/80 flex justify-between items-center">
          <CardName name={cardContent.name} />
          <span className="text-xs font-mono font-semibold text-white bg-black/50 px-2 py-0.5 rounded border border-white/30">L{cardContent.league}</span>
        </div>
        <div className="flex-1" />
        <div className="relative z-10 px-2 pb-2 flex gap-2">
          <div className="flex-1 bg-black/90 rounded px-2 py-1 text-center border border-white/20">
            <span className="text-2xl font-black drop-shadow-lg" style={{ color: POWER_COLOR }}>{cardContent.power}</span>
            <div className="text-[8px] text-white/90 font-medium">POT</div>
          </div>
          <div className="flex-1 bg-black/90 rounded px-2 py-1 text-center border border-white/20">
            <span className="text-2xl font-black drop-shadow-lg" style={{ color: DAMAGE_COLOR }}>{cardContent.damage}</span>
            <div className="text-[8px] text-white/90 font-medium">DAN</div>
          </div>
        </div>
        <div className="relative z-10 bg-black/85 p-2 space-y-1">
          <div className="rounded px-1.5 py-1">
            <div className="text-[8px] uppercase font-bold" style={{ color: ABILITY_HEADING_COLOR }}>Potere</div>
            <div className="text-[10px] leading-tight text-white font-medium"><AbilityFormattedFromString text={cardContent.ability} /></div>
          </div>
          <div className="rounded px-1.5 py-1 border-t border-white/20">
            <div className="text-[8px] uppercase font-bold text-sky-400">Bonus</div>
            <div className="text-[10px] leading-tight text-white font-medium"><BonusFormattedFromString text={cardContent.bonus} /></div>
          </div>
        </div>
        <div className="relative z-10 text-[8px] text-center py-0.5 font-bold tracking-wide uppercase" style={{ backgroundColor: colors.accent + '80', color: '#fff' }}>
          {cardContent.army}
        </div>
      </div>
    );
  }

  // --- STATS TOP (stats nella barra superiore) ---
  if (variant === 'statsTop') {
    return (
      <div onClick={() => !disabled && onClick?.(agent)} className={`${baseClasses} flex flex-col w-56 h-80`}>
        <div className="absolute inset-0 flex items-center justify-center pt-12">
          <CardImage type={spriteInfo.type} palette={spriteInfo.palette} agentId={spriteInfo.agentId} size={260} objectPosition={objectPosition} scale={imageScale} containerLeft={containerLeft} containerTop={containerTop} />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black/80" />
        <div className="relative z-10 px-2 py-2 bg-black/80 flex items-center justify-between shrink-0">
          <CardName name={cardContent.name} small />
          <div className="flex gap-3">
            <span className="text-lg font-black" style={{ color: POWER_COLOR }}>{cardContent.power}</span>
            <span className="text-lg font-black" style={{ color: DAMAGE_COLOR }}>{cardContent.damage}</span>
          </div>
          <span className="text-[10px] font-mono text-white/90">L{cardContent.league}</span>
        </div>
        <div className="flex-1" />
        <div className="relative z-10 bg-black/70 p-2 space-y-1">
          <div><div className="text-[7px] uppercase font-bold" style={{ color: ABILITY_HEADING_COLOR }}>Potere</div><div className="text-[9px] text-white"><AbilityFormattedFromString text={cardContent.ability} /></div></div>
          <div className="border-t border-white/10 pt-1"><div className="text-[7px] uppercase font-bold text-sky-400">Bonus</div><div className="text-[9px] text-white"><BonusFormattedFromString text={cardContent.bonus} /></div></div>
        </div>
        <div className="relative z-10 text-[7px] text-center py-0.5 font-bold uppercase" style={{ backgroundColor: colors.accent + '60', color: '#fff' }}>{cardContent.army}</div>
      </div>
    );
  }

  // --- STATS INLINE (stats sulla stessa riga del nome) ---
  if (variant === 'statsInline') {
    return (
      <div onClick={() => !disabled && onClick?.(agent)} className={`${baseClasses} flex flex-col w-56 h-80`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <CardImage type={spriteInfo.type} palette={spriteInfo.palette} agentId={spriteInfo.agentId} size={260} objectPosition={objectPosition} scale={imageScale} containerLeft={containerLeft} containerTop={containerTop} />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
        <div className="relative z-10 px-2 py-1.5 bg-black/60 flex items-center gap-2 shrink-0">
          <CardName name={cardContent.name} small className="flex-1 min-w-0" />
          <span className="text-sm font-black shrink-0" style={{ color: POWER_COLOR }}>{cardContent.power}</span>
          <span className="text-white/50">/</span>
          <span className="text-sm font-black shrink-0" style={{ color: DAMAGE_COLOR }}>{cardContent.damage}</span>
          <span className="text-[9px] font-mono text-white/80 shrink-0">L{cardContent.league}</span>
        </div>
        <div className="flex-1" />
        <div className="relative z-10 bg-black/50 p-2">
          <div className="text-[9px] text-white leading-tight"><AbilityFormattedFromString text={cardContent.ability} /></div>
          <div className="text-[8px] text-sky-400/90 mt-0.5"><BonusFormattedFromString text={cardContent.bonus} /></div>
        </div>
        <div className="relative z-10 text-[7px] text-center py-0.5 font-bold uppercase" style={{ backgroundColor: colors.accent + '60', color: '#fff' }}>{cardContent.army}</div>
      </div>
    );
  }

  // --- FULLART ---
  if (variant === 'fullart') {
    return (
      <div onClick={() => !disabled && onClick?.(agent)} className={`${baseClasses} w-56 h-80`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <CardImage type={spriteInfo.type} palette={spriteInfo.palette} agentId={spriteInfo.agentId} size={320} objectPosition={objectPosition} scale={imageScale} containerLeft={containerLeft} containerTop={containerTop} />
        </div>
      </div>
    );
  }

  // --- TOP BAR (barra sottile in alto, resto arte) ---
  if (variant === 'topBar') {
    return (
      <div onClick={() => !disabled && onClick?.(agent)} className={`${baseClasses} w-56 h-80`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <CardImage type={spriteInfo.type} palette={spriteInfo.palette} agentId={spriteInfo.agentId} size={320} objectPosition={objectPosition} scale={imageScale} containerLeft={containerLeft} containerTop={containerTop} />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-transparent to-transparent" />
        <div className="absolute top-0 left-0 right-0 z-10 px-2 py-1.5 bg-black/70 flex justify-between items-center">
          <CardName name={cardContent.name} small />
          <div className="flex gap-2 text-sm font-bold">
            <span style={{ color: POWER_COLOR }}>{cardContent.power}</span>
            <span style={{ color: DAMAGE_COLOR }}>{cardContent.damage}</span>
          </div>
          <span className="text-[9px] font-mono">L{cardContent.league}</span>
        </div>
        <div className="absolute bottom-0 left-0 right-0 z-10 px-2 py-2 bg-black/80">
          <div className="text-[9px] text-white line-clamp-2"><AbilityFormattedFromString text={cardContent.ability} /></div>
          <div className="text-[8px] text-sky-400/90 truncate"><BonusFormattedFromString text={cardContent.bonus} /></div>
          <div className="text-[7px] font-bold uppercase mt-0.5" style={{ color: colors.accent }}>{cardContent.army}</div>
        </div>
      </div>
    );
  }

  // --- HORIZONTAL (carta larga) ---
  if (variant === 'horizontal') {
    return (
      <div onClick={() => !disabled && onClick?.(agent)} className={`${baseClasses} flex w-80 h-56`}>
        <div className="w-2/5 relative shrink-0">
          <div className="absolute inset-0 flex items-center justify-center">
            <CardImage type={spriteInfo.type} palette={spriteInfo.palette} agentId={spriteInfo.agentId} size={180} objectPosition={objectPosition} scale={imageScale} containerLeft={containerLeft} containerTop={containerTop} />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />
        </div>
        <div className="flex-1 flex flex-col p-3 justify-between bg-black/50">
          <div>
            <CardName name={cardContent.name} small />
            <div className="flex gap-2 mt-1">
              <span className="text-lg font-black" style={{ color: POWER_COLOR }}>{cardContent.power}</span>
              <span className="text-lg font-black" style={{ color: DAMAGE_COLOR }}>{cardContent.damage}</span>
              <span className="text-xs font-mono text-white/80">L{cardContent.league}</span>
            </div>
          </div>
          <div>
            <div className="text-[8px] font-bold" style={{ color: ABILITY_HEADING_COLOR }}>Potere</div>
            <div className="text-[9px] text-white"><AbilityFormattedFromString text={cardContent.ability} /></div>
            <div className="text-[8px] font-bold text-sky-400 mt-0.5">Bonus</div>
            <div className="text-[9px] text-white"><BonusFormattedFromString text={cardContent.bonus} /></div>
          </div>
          <div className="text-[8px] font-bold uppercase" style={{ color: colors.accent }}>{cardContent.army}</div>
        </div>
      </div>
    );
  }

  // --- PILL STATS (stats come pillole/badge) ---
  if (variant === 'pillStats') {
    return (
      <div onClick={() => !disabled && onClick?.(agent)} className={`${baseClasses} flex flex-col w-56 h-80`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <CardImage type={spriteInfo.type} palette={spriteInfo.palette} agentId={spriteInfo.agentId} size={260} objectPosition={objectPosition} scale={imageScale} containerLeft={containerLeft} containerTop={containerTop} />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
        <div className="relative z-10 px-2 py-1.5 flex justify-between items-center">
          <CardName name={cardContent.name} small />
          <div className="flex gap-1.5">
            <span className="px-2 py-0.5 rounded-full text-xs font-black bg-black/70" style={{ color: POWER_COLOR }}>{cardContent.power}</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-black bg-black/70" style={{ color: DAMAGE_COLOR }}>{cardContent.damage}</span>
            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-mono bg-white/20 text-white">L{cardContent.league}</span>
          </div>
        </div>
        <div className="flex-1" />
        <div className="relative z-10 bg-black/50 p-2">
          <div className="text-[10px] text-white leading-tight"><AbilityFormattedFromString text={cardContent.ability} /></div>
          <div className="text-[9px] text-sky-400/90 mt-0.5"><BonusFormattedFromString text={cardContent.bonus} /></div>
        </div>
        <div className="relative z-10 text-[8px] text-center py-0.5 font-bold uppercase" style={{ backgroundColor: colors.accent + '60', color: '#fff' }}>{cardContent.army}</div>
      </div>
    );
  }

  // --- MINIMAL (solo essenziale) ---
  if (variant === 'minimal') {
    return (
      <div onClick={() => !disabled && onClick?.(agent)} className={`${baseClasses} w-56 h-80`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <CardImage type={spriteInfo.type} palette={spriteInfo.palette} agentId={spriteInfo.agentId} size={300} objectPosition={objectPosition} scale={imageScale} containerLeft={containerLeft} containerTop={containerTop} />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 z-10 px-2 py-2">
          <CardName name={cardContent.name} small />
          <div className="flex gap-2 text-sm font-black mt-0.5">
            <span style={{ color: POWER_COLOR }}>{cardContent.power}</span>
            <span style={{ color: DAMAGE_COLOR }}>{cardContent.damage}</span>
          </div>
          <div className="text-[8px] text-white/90 truncate"><AbilityFormattedFromString text={cardContent.ability} /></div>
        </div>
      </div>
    );
  }

  // --- FRAMED (arte con cornice visibile) ---
  if (variant === 'framed') {
    return (
      <div onClick={() => !disabled && onClick?.(agent)} className={`${baseClasses} flex flex-col w-56 h-80 p-2`}>
        <div className="relative flex-1 rounded-lg overflow-hidden border-2 border-amber-700/60 bg-black/50">
          <div className="absolute inset-0 flex items-center justify-center">
            <CardImage type={spriteInfo.type} palette={spriteInfo.palette} agentId={spriteInfo.agentId} size={240} objectPosition={objectPosition} scale={imageScale} containerLeft={containerLeft} containerTop={containerTop} />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>
        <div className="relative z-10 px-2 py-1.5 flex justify-between items-center mt-1">
          <CardName name={cardContent.name} small />
          <span className="text-xs font-mono text-amber-300/90">L{cardContent.league}</span>
        </div>
        <div className="flex gap-2 mt-1">
          <div className="flex-1 rounded px-2 py-1 text-center bg-amber-900/40 border border-amber-700/50">
            <span className="text-xl font-black" style={{ color: POWER_COLOR }}>{cardContent.power}</span>
            <div className="text-[7px]">POT</div>
          </div>
          <div className="flex-1 rounded px-2 py-1 text-center bg-purple-900/40 border border-purple-700/50">
            <span className="text-xl font-black" style={{ color: DAMAGE_COLOR }}>{cardContent.damage}</span>
            <div className="text-[7px]">DAN</div>
          </div>
        </div>
        <div className="text-[9px] text-white mt-1 line-clamp-2"><AbilityFormattedFromString text={cardContent.ability} /></div>
        <div className="text-[8px] font-bold uppercase mt-0.5" style={{ color: colors.accent }}>{cardContent.army}</div>
      </div>
    );
  }

  // --- SPLIT (info a sinistra, arte a destra) ---
  if (variant === 'split') {
    return (
      <div onClick={() => !disabled && onClick?.(agent)} className={`${baseClasses} flex w-56 h-80`}>
        <div className="w-2/5 flex flex-col p-2 justify-between bg-black/60 shrink-0">
          <div>
            <CardName name={cardContent.name} small />
            <span className="text-[9px] font-mono block mt-0.5">L{cardContent.league}</span>
          </div>
          <div>
            <div className="text-xl font-black" style={{ color: POWER_COLOR }}>{cardContent.power}</div>
            <div className="text-[7px]">POT</div>
            <div className="text-xl font-black mt-1" style={{ color: DAMAGE_COLOR }}>{cardContent.damage}</div>
            <div className="text-[7px]">DAN</div>
          </div>
          <div>
            <div className="text-[8px] font-bold" style={{ color: ABILITY_HEADING_COLOR }}>Potere</div>
            <div className="text-[9px] text-white leading-tight"><AbilityFormattedFromString text={cardContent.ability} /></div>
            <div className="text-[8px] font-bold text-sky-400 mt-0.5">Bonus</div>
            <div className="text-[9px] text-white leading-tight"><BonusFormattedFromString text={cardContent.bonus} /></div>
          </div>
          <div className="text-[7px] font-bold uppercase" style={{ color: colors.accent }}>{cardContent.army}</div>
        </div>
        <div className="flex-1 relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <CardImage type={spriteInfo.type} palette={spriteInfo.palette} agentId={spriteInfo.agentId} size={200} objectPosition={objectPosition} scale={imageScale} containerLeft={containerLeft} containerTop={containerTop} />
          </div>
          <div className="absolute inset-0 bg-gradient-to-l from-black/50 to-transparent" />
        </div>
      </div>
    );
  }

  // --- STACKED (sezioni ben separate con bordi) ---
  if (variant === 'stacked') {
    return (
      <div onClick={() => !disabled && onClick?.(agent)} className={`${baseClasses} flex flex-col w-56 h-80`}>
        <div className="px-2 py-1.5 bg-black/70 border-b-2 border-white/20 shrink-0">
          <div className="flex justify-between">
            <CardName name={cardContent.name} small />
            <span className="text-xs font-mono">L{cardContent.league}</span>
          </div>
        </div>
        <div className="flex-1 relative min-h-0 border-b-2 border-white/20">
          <div className="absolute inset-0 flex items-center justify-center">
            <CardImage type={spriteInfo.type} palette={spriteInfo.palette} agentId={spriteInfo.agentId} size={220} objectPosition={objectPosition} scale={imageScale} containerLeft={containerLeft} containerTop={containerTop} />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        </div>
        <div className="flex border-b-2 border-white/20 shrink-0">
          <div className="flex-1 py-2 text-center border-r border-white/20" style={{ backgroundColor: 'rgba(253,224,71,0.15)' }}>
            <span className="text-2xl font-black" style={{ color: POWER_COLOR }}>{cardContent.power}</span>
            <div className="text-[7px]">POT</div>
          </div>
          <div className="flex-1 py-2 text-center" style={{ backgroundColor: 'rgba(192,132,252,0.15)' }}>
            <span className="text-2xl font-black" style={{ color: DAMAGE_COLOR }}>{cardContent.damage}</span>
            <div className="text-[7px]">DAN</div>
          </div>
        </div>
        <div className="p-2 bg-black/60 flex-1 min-h-0 shrink-0">
          <div className="text-[9px] text-white leading-tight"><AbilityFormattedFromString text={cardContent.ability} /></div>
          <div className="text-[8px] text-sky-400/90 mt-0.5"><BonusFormattedFromString text={cardContent.bonus} /></div>
        </div>
        <div className="text-[8px] text-center py-1 font-bold uppercase" style={{ backgroundColor: colors.accent + '70', color: '#fff' }}>{cardContent.army}</div>
      </div>
    );
  }

  // --- INVERTED (footer in alto, arte in basso) ---
  if (variant === 'inverted') {
    return (
      <div onClick={() => !disabled && onClick?.(agent)} className={`${baseClasses} flex flex-col w-56 h-80`}>
        <div className="relative z-10 px-2 py-1.5 bg-black/60 flex justify-between items-center shrink-0">
          <CardName name={cardContent.name} small />
          <span className="text-xs font-mono text-white/90">L{cardContent.league}</span>
        </div>
        <div className="relative z-10 px-2 py-1.5 flex gap-2 bg-black/40">
          <div className="flex-1 rounded px-2 py-1 text-center">
            <span className="text-xl font-black" style={{ color: POWER_COLOR }}>{cardContent.power}</span>
            <div className="text-[7px]">POT</div>
          </div>
          <div className="flex-1 rounded px-2 py-1 text-center">
            <span className="text-xl font-black" style={{ color: DAMAGE_COLOR }}>{cardContent.damage}</span>
            <div className="text-[7px]">DAN</div>
          </div>
        </div>
        <div className="relative z-10 px-2 py-1 bg-black/50">
          <div className="text-[9px] text-white leading-tight line-clamp-2"><AbilityFormattedFromString text={cardContent.ability} /></div>
          <div className="text-[8px] text-sky-400/90 truncate"><BonusFormattedFromString text={cardContent.bonus} /></div>
        </div>
        <div className="flex-1 relative min-h-0">
          <div className="absolute inset-0 flex items-center justify-center">
            <CardImage type={spriteInfo.type} palette={spriteInfo.palette} agentId={spriteInfo.agentId} size={280} objectPosition={objectPosition} scale={imageScale} containerLeft={containerLeft} containerTop={containerTop} />
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/80" />
        </div>
        <div className="relative z-10 text-[8px] text-center py-0.5 font-bold uppercase" style={{ backgroundColor: colors.accent + '60', color: '#fff' }}>{cardContent.army}</div>
      </div>
    );
  }

  return renderDefault();
};

export { LAYOUT_VARIANTS };

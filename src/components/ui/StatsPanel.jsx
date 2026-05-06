import React, { useState, useEffect } from 'react';
import { PALETTE } from '../../theme/hudOratorioPalette';

/**
 * Componente pannello statistiche
 * Mostra HP, Focus Coin e Tossina (se attiva) per giocatore o IA
 */
export const StatsPanel = ({
  label,
  hp,
  focus,
  toxin = null, // { value, minHealth, source } o null
  position = 'top-left', // 'top-left' | 'bottom-right'
  gamePhase,
  className = '',
  /** Merge dopo gli stili base (es. Style Lab — skin tema) */
  styleOverride = null,
}) => {
  const [showToxinAnimation, setShowToxinAnimation] = useState(false);
  const [previousToxinValue, setPreviousToxinValue] = useState(null);
  
  // Animazione quando la tossina viene attivata, stackata o applicata
  useEffect(() => {
    if (toxin && toxin.value > 0) {
      // Se il valore è cambiato (nuova tossina o stack), anima
      if (previousToxinValue !== null && previousToxinValue !== toxin.value) {
        setShowToxinAnimation(true);
        const timer = setTimeout(() => setShowToxinAnimation(false), 1500);
        return () => clearTimeout(timer);
      }
      // Se è la prima volta che appare, anima brevemente
      else if (previousToxinValue === null) {
        setShowToxinAnimation(true);
        const timer = setTimeout(() => setShowToxinAnimation(false), 1000);
        return () => clearTimeout(timer);
      }
      setPreviousToxinValue(toxin.value);
    } else {
      setPreviousToxinValue(null);
    }
  }, [toxin?.value, previousToxinValue]);
  
  const positionStyles = {
    'top-left': { top: '16px', left: '16px' },
    'bottom-right': { bottom: '16px', right: '16px' }
  };
  
  const labelColor = position === 'top-left' ? 'text-red-400' : 'text-green-400';
  const animationClass = position === 'top-left' 
    ? 'animate-fade-out-panels' 
    : 'animate-fade-out-panels-right';
  
  // Verifica se la tossina è attiva e se può essere applicata (HP >= minHealth)
  const isToxinActive = toxin && toxin.value > 0;
  const canToxinApply = isToxinActive && hp >= toxin.minHealth;
  
  return (
    <div
      className={`absolute flex items-center gap-4 border border-slate-600/50 px-6 py-3 ${
        gamePhase === 'result' ? `${animationClass} pointer-events-none` : ''
      } ${className}`}
      style={{
        ...positionStyles[position],
        zIndex: 10,
        background: PALETTE.panelBg,
        borderColor: PALETTE.slate,
        ...(styleOverride || {}),
      }}
    >
      <span className={`${labelColor} text-sm font-bold`}>{label}</span>
      <span className="text-white font-bold text-2xl">PV {hp}</span>
      <span className="text-yellow-400 text-2xl">FC {focus}</span>
      
      {/* Badge Tossina */}
      {isToxinActive && (
        <div 
          className={`relative flex items-center gap-1 px-2 py-1 rounded-md border transition-all duration-300 ${
            canToxinApply 
              ? 'bg-purple-900/50 border-purple-500/70 text-purple-300 shadow-lg shadow-purple-500/30' 
              : 'bg-slate-700/50 border-slate-500/50 text-slate-400'
          } ${
            showToxinAnimation 
              ? 'animate-pulse scale-110 ring-2 ring-purple-400/50' 
              : ''
          }`}
          title={`Tossina ${toxin.value} (min ${toxin.minHealth} PV)${toxin.source ? ` da ${toxin.source}` : ''}${canToxinApply ? ' - Si applicherà a fine turno' : ' - Non può essere applicata (PV troppo bassi)'}`}
        >
          <span className={`text-lg leading-none transition-transform duration-300 ${
            showToxinAnimation ? 'animate-bounce' : ''
          }`}>☠️</span>
          <span className={`text-xs font-bold transition-all duration-300 ${
            showToxinAnimation ? 'text-purple-200 scale-125' : ''
          }`}>{toxin.value}</span>
          {!canToxinApply && (
            <span className="text-[8px] text-slate-500 ml-0.5">({hp} &lt; {toxin.minHealth})</span>
          )}
        </div>
      )}
    </div>
  );
};

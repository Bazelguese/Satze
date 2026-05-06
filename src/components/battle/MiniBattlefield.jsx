import React from 'react';
import { ARMY_COLORS } from '../../data';
import { FIELD_STYLES } from '../../utils/constants';

/**
 * Componente campo di battaglia compatto
 * Versione ridotta per la visualizzazione nella lista campi
 */
export const MiniBattlefield = ({ 
  field, 
  selected, 
  onClick, 
  conquered, 
  conqueredBy, 
  hidden, 
  turnsUntilReveal, 
  onHover,
  guidedHighlight = false,
}) => {
  if (hidden) {
    return (
      <div className="h-full min-h-[2rem] rounded bg-slate-800/30 border border-slate-700/50 flex items-center justify-center px-2">
        <span 
          className="text-slate-200 text-sm font-semibold text-center" 
          style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8), 0 0 1px rgba(0,0,0,0.5)' }}
        >
          🔒 Si rivela tra {turnsUntilReveal} {turnsUntilReveal === 1 ? 'turno' : 'turni'}
        </span>
      </div>
    );
  }
  
  // Colori per campo conquistato basati sull'armata
  const getConqueredStyle = () => {
    if (!conquered || !conqueredBy) return {};
    const armyColor = ARMY_COLORS[conqueredBy];
    if (!armyColor) return {};
    return {
      borderColor: armyColor.accent,
      backgroundColor: armyColor.accent + '20'
    };
  };
  
  const conqueredStyle = getConqueredStyle();
  const fieldStyle = FIELD_STYLES[field.id] || {};
  
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => onHover && onHover(field)}
      onMouseLeave={() => onHover && onHover(null)}
      className={`
        h-full min-h-[2rem] rounded px-2 py-0.5 transition-all duration-300 flex items-center relative overflow-hidden
        ${guidedHighlight ? 'animate-satze-guided-twinkle ring-2 ring-amber-300/80 shadow-[0_0_18px_rgba(251,191,36,0.45)]' : ''}
        ${conquered 
          ? 'border-2 shadow-lg' 
          : selected 
            ? 'border-2 border-yellow-400 shadow-lg shadow-yellow-400/30 ring-2 ring-yellow-400/30' 
            : onClick 
              ? 'border border-slate-600/50 hover:border-yellow-400/60 hover:shadow-md hover:shadow-yellow-400/20 cursor-pointer'
              : 'border border-slate-700/50'
        }
      `}
      style={conquered ? conqueredStyle : {}}
    >
      {/* Sfondo gradiente del campo */}
      <div 
        className="absolute inset-0 opacity-60"
        style={{ background: fieldStyle.gradient || 'linear-gradient(135deg, #1a1a2e, #2a2a4e)' }}
      />
      {/* Glow accent */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{ 
          background: `radial-gradient(ellipse at 20% 50%, ${fieldStyle.glow || 'rgba(100,100,100,0.3)'} 0%, transparent 70%)`
        }}
      />
      {/* Contenuto */}
      <div className="flex-1 min-w-0 relative z-10">
        <h3 
          className={`font-bold leading-tight truncate ${conquered ? 'text-white' : 'text-white'}`}
          style={{ 
            fontSize: '12px', 
            textShadow: '0 1px 2px rgba(0,0,0,0.9), 0 0 4px rgba(0,0,0,0.4)',
            WebkitFontSmoothing: 'antialiased',
          }}
        >
          {conquered ? '🏆 ' : ''}{field.name}
        </h3>
        <p 
          className={`leading-tight truncate mt-0.5 font-medium ${conquered ? 'text-white' : 'text-slate-200'}`}
          style={{ 
            fontSize: '10px', 
            textShadow: '0 1px 2px rgba(0,0,0,0.9), 0 0 2px rgba(0,0,0,0.5)',
            WebkitFontSmoothing: 'antialiased',
          }}
        >
          {conquered ? 'CONQUISTATO' : field.effect}
        </p>
      </div>
    </div>
  );
};

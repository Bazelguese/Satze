import React from 'react';
import { ARMY_COLORS } from '../../data';
import { FIELD_STYLES } from '../../utils/constants';
import { Icon } from '../ui';
import { PALETTE } from '../menu';

// Posizioni sulla mappa (percentuali)
const MAP_POSITIONS = [
  { left: '8%', top: '18%' },
  { left: '92%', top: '18%' },
  { left: '50%', top: '50%' },
  { left: '8%', top: '82%' },
  { left: '92%', top: '82%' },
];

/**
 * Map pin: un singolo punto sulla mappa
 */
const MapPin = ({ field, conquered, conqueredBy, selected, hidden, turnsUntilReveal, onClick, onHover, isP3rStyle }) => {
  const fieldStyle = FIELD_STYLES[field?.id] || {};
  const armyColor = conqueredBy && ARMY_COLORS[conqueredBy];  
  const accent = conquered && armyColor ? armyColor.accent : (fieldStyle.accent || '#8b7355');

  if (hidden) {
    return (
      <div
        className="absolute w-10 h-10 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center rounded-full border-2"
        style={{ 
          borderColor: 'rgba(220, 38, 38, 0.9)',
          background: 'linear-gradient(135deg, rgba(185, 28, 28, 0.6) 0%, rgba(127, 29, 29, 0.8) 100%)',
          boxShadow: 'inset 0 0 6px rgba(0,0,0,0.4), 0 2px 6px rgba(0,0,0,0.3)',
        }}
      >
        <span className="text-white font-bold drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" style={{ fontSize: '18px', lineHeight: 1 }}>
          {turnsUntilReveal}
        </span>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => onHover?.(field)}
      onMouseLeave={() => onHover?.(null)}
      className={`
        absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center
        transition-all duration-300 cursor-pointer
        ${selected ? 'scale-110' : ''}
        ${onClick ? 'hover:scale-105' : ''}
      `}
    >
      <div
        className={`
          w-10 h-10 flex items-center justify-center rounded-full
          ${selected ? 'ring-3 ring-amber-400/60 shadow-lg shadow-amber-400/40' : ''}
        `}
        style={{
          background: `radial-gradient(circle at 30% 30%, ${accent}40, ${accent}15 50%, transparent 70%)`,
          border: `2px solid ${selected ? '#fbbf24' : accent}`,
          boxShadow: conquered 
            ? `inset 0 0 12px ${accent}40, 0 2px 8px rgba(0,0,0,0.4)` 
            : `inset 0 0 8px rgba(255,255,255,0.08), 0 2px 6px rgba(0,0,0,0.3)`,
        }}
      >
        <div className="relative z-10" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))' }}>
          <Icon name={field.icon} type="cardIcon" size={18} color={conquered && armyColor ? armyColor.accent : '#e8dcc8'} />
        </div>
        {conquered && (
          <div 
            className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full flex items-center justify-center text-[6px] font-bold"
            style={{ background: accent, color: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.5)' }}
          >
            ✓
          </div>
        )}
      </div>
      <span 
        className="mt-1.5 text-[11px] font-semibold text-center max-w-[110px] px-1 relative z-10 leading-tight break-words"
        style={{ 
          color: isP3rStyle ? PALETTE.textPrimary : 'rgba(245, 230, 200, 0.95)',
          textShadow: '0 1px 2px rgba(0,0,0,0.9), 0 0 4px rgba(0,0,0,0.5)',
        }}
      >
        {field.name}
      </span>
    </div>
  );
};

/**
 * Mappa strategica con 5 ubicazioni
 */
export const BattlefieldMap = ({
  battlefields,
  conqueredFields,
  currentFieldIndex,
  revealedFields,
  gamePhase,
  isPlayerFirst,
  handleFieldSelect,
  setHoveredField,
  isP3rStyle,
}) => {
  return (
    <div
      className="relative w-full h-full min-h-[280px] overflow-hidden rounded-xl p-2"
      style={{
        background: isP3rStyle
          ? `linear-gradient(135deg, #1a1f2e 0%, #0f1419 25%, #1a2332 50%, #0d1117 75%, #151b26 100%)`
          : `linear-gradient(160deg, #2d1f0f 0%, #1a1208 30%, #3d2818 50%, #1a0f05 100%)`,
        border: isP3rStyle ? `2px solid ${PALETTE.slate}44` : '2px solid rgba(139, 90, 43, 0.6)',
        boxShadow: 'inset 0 0 60px rgba(0,0,0,0.4), 0 4px 20px rgba(0,0,0,0.5)',
      }}
    >
      {/* Texture pergamena */}
      <div 
        className="absolute inset-0 opacity-60 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          mixBlendMode: 'overlay',
        }}
      />

      {/* Contorni terreno */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" preserveAspectRatio="none">
        <defs>
          <linearGradient id="terrainGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={isP3rStyle ? PALETTE.slate : '#8b7355'} stopOpacity="0.3" />
            <stop offset="100%" stopColor={isP3rStyle ? PALETTE.slate : '#5c4033'} stopOpacity="0.1" />
          </linearGradient>
        </defs>
        <path d="M 0 60 Q 15 40 60 50 T 120 35 T 180 55 T 256 45 L 256 256 L 0 256 Z" fill="url(#terrainGrad)" />
        <path d="M 0 180 Q 80 150 150 190 T 256 170 L 256 256 L 0 256 Z" fill="url(#terrainGrad)" />
        <path d="M 0 100 Q 100 80 200 120 L 256 90 L 256 256 L 0 256 Z" fill="url(#terrainGrad)" />
      </svg>

      {/* Percorsi tra le ubicazioni (viewBox 0-100 = %) */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id="mapPathGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={isP3rStyle ? PALETTE.amber : '#d4a574'} stopOpacity="0.25" />
            <stop offset="100%" stopColor={isP3rStyle ? PALETTE.slate : '#8b7355'} stopOpacity="0.15" />
          </linearGradient>
        </defs>
        <path d="M 8 18 Q 30 10 50 50 T 92 18" fill="none" stroke="url(#mapPathGrad)" strokeWidth="0.8" strokeDasharray="2 2" strokeLinecap="round" />
        <path d="M 8 18 Q 30 35 50 50 T 92 82" fill="none" stroke="url(#mapPathGrad)" strokeWidth="0.8" strokeDasharray="2 2" strokeLinecap="round" />
        <path d="M 92 18 Q 70 35 50 50 T 8 82" fill="none" stroke="url(#mapPathGrad)" strokeWidth="0.8" strokeDasharray="2 2" strokeLinecap="round" />
        <path d="M 8 82 Q 30 65 50 50 T 92 82" fill="none" stroke="url(#mapPathGrad)" strokeWidth="0.8" strokeDasharray="2 2" strokeLinecap="round" />
      </svg>

      {/* Bussola al centro con tutte le coordinate (anello, il pin centrale resta visibile) */}
      <div 
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 flex items-center justify-center rounded-full border-2 z-0"
        style={{ 
          borderColor: isP3rStyle ? `${PALETTE.amber}99` : 'rgba(212, 165, 116, 0.8)',
          background: 'transparent',
          boxShadow: '0 0 0 2px rgba(0,0,0,0.3)',
        }}
      >
        <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-sm font-bold" style={{ color: isP3rStyle ? PALETTE.amber : '#d4a574', textShadow: '0 1px 3px #000' }}>N</span>
        <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-xs font-medium" style={{ color: isP3rStyle ? PALETTE.textSecondary : '#a78b5a', textShadow: '0 1px 2px #000' }}>S</span>
        <span className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 text-xs font-medium" style={{ color: isP3rStyle ? PALETTE.textSecondary : '#a78b5a', textShadow: '0 1px 2px #000' }}>O</span>
        <span className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 text-xs font-medium" style={{ color: isP3rStyle ? PALETTE.textSecondary : '#a78b5a', textShadow: '0 1px 2px #000' }}>E</span>
        <span className="absolute top-1 right-2 text-[9px] font-medium opacity-80" style={{ color: isP3rStyle ? PALETTE.textSecondary : '#8b7355', textShadow: '0 1px 2px #000' }}>NE</span>
        <span className="absolute top-1 left-2 text-[9px] font-medium opacity-80" style={{ color: isP3rStyle ? PALETTE.textSecondary : '#8b7355', textShadow: '0 1px 2px #000' }}>NW</span>
        <span className="absolute bottom-1 right-2 text-[9px] font-medium opacity-80" style={{ color: isP3rStyle ? PALETTE.textSecondary : '#8b7355', textShadow: '0 1px 2px #000' }}>SE</span>
        <span className="absolute bottom-1 left-2 text-[9px] font-medium opacity-80" style={{ color: isP3rStyle ? PALETTE.textSecondary : '#8b7355', textShadow: '0 1px 2px #000' }}>SW</span>
      </div>

      {/* Angoli decorativi - con padding per visibilità completa */}
      <svg className="absolute top-1 left-1 w-12 h-12 pointer-events-none" viewBox="0 0 24 24" style={{ opacity: 0.8 }}>
        <path d="M 0 0 L 24 0 L 24 4 L 4 4 L 4 24 L 0 24 Z" fill="none" stroke={isP3rStyle ? PALETTE.slate : '#8b7355'} strokeWidth="1.5" />
      </svg>
      <svg className="absolute top-1 right-1 w-12 h-12 pointer-events-none rotate-90" viewBox="0 0 24 24" style={{ opacity: 0.8 }}>
        <path d="M 0 0 L 24 0 L 24 4 L 4 4 L 4 24 L 0 24 Z" fill="none" stroke={isP3rStyle ? PALETTE.slate : '#8b7355'} strokeWidth="1.5" />
      </svg>
      <svg className="absolute bottom-6 left-1 w-12 h-12 pointer-events-none -rotate-90" viewBox="0 0 24 24" style={{ opacity: 0.8 }}>
        <path d="M 0 0 L 24 0 L 24 4 L 4 4 L 4 24 L 0 24 Z" fill="none" stroke={isP3rStyle ? PALETTE.slate : '#8b7355'} strokeWidth="1.5" />
      </svg>
      <svg className="absolute bottom-6 right-1 w-12 h-12 pointer-events-none rotate-180" viewBox="0 0 24 24" style={{ opacity: 0.8 }}>
        <path d="M 0 0 L 24 0 L 24 4 L 4 4 L 4 24 L 0 24 Z" fill="none" stroke={isP3rStyle ? PALETTE.slate : '#8b7355'} strokeWidth="1.5" />
      </svg>

      {/* Pins */}
      {battlefields.map((field, idx) => {
        const canSelectField = isPlayerFirst && 
          !(idx in conqueredFields) && 
          idx < revealedFields &&
          (gamePhase === 'selectField' || gamePhase === 'selectAgent');
        const pos = MAP_POSITIONS[idx] || MAP_POSITIONS[0];

        return (
          <div
            key={field.id}
            className="absolute -translate-x-1/2 -translate-y-1/2 z-10"
            style={{ left: pos.left, top: pos.top }}
          >
            <MapPin
              field={field}
              conquered={idx in conqueredFields}
              conqueredBy={typeof conqueredFields[idx] === 'object' ? conqueredFields[idx]?.army : conqueredFields[idx]}
              selected={currentFieldIndex === idx}
              hidden={idx >= revealedFields}
              turnsUntilReveal={idx >= revealedFields ? idx - revealedFields + 1 : 0}
              onClick={canSelectField ? () => handleFieldSelect(field) : undefined}
              onHover={setHoveredField}
              isP3rStyle={isP3rStyle}
            />
          </div>
        );
      })}
    </div>
  );
};

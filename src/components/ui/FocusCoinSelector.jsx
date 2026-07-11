// ============================================
// COMPONENTE - FocusCoinSelector
// Slider orizzontale con thumb personalizzato: simbolo armata + colori
// ============================================

import { useRef, useState, useCallback, useEffect } from 'react';
import { Icon } from './Icon';
import { ARMY_COLORS } from '../../data';
import { HUD_ORATORIO_FONT_UI } from '../../theme/hudOratorioPalette';

// Fallback per armate con nomi alternativi (es. Nati dalla Bocca -> Mounthborn)
const ARMY_COLOR_FALLBACK = { 'Nati dalla Bocca': 'Mounthborn' };

export const FocusCoinSelector = ({ value, onChange, max, reserved = 0, agent = null, accentColor = null }) => {
  const trackRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const effectiveMax = Math.max(1, max - reserved);
  const progress = effectiveMax <= 1 ? 100 : ((value - 1) / (effectiveMax - 1)) * 100;

  const army = agent?.army;
  const armyKey = ARMY_COLOR_FALLBACK[army] || army;
  const colors = ARMY_COLORS[armyKey] || ARMY_COLORS['Kethran'] || { accent: '#fbbf24' };
  const accent = accentColor || colors.accent || '#fbbf24';
  const power = agent?.power ?? 0;
  const baseAssault = power * value; // VA base = POT × FC

  const valueToPosition = useCallback((v) => {
    if (effectiveMax <= 1) return 50;
    return ((v - 1) / (effectiveMax - 1)) * 100;
  }, [effectiveMax]);

  const positionToValue = useCallback((pct) => {
    const v = Math.round(1 + (pct / 100) * (effectiveMax - 1));
    return Math.max(1, Math.min(effectiveMax, v));
  }, [effectiveMax]);

  const handleTrackClick = useCallback((e) => {
    if (!trackRef.current || effectiveMax < 1) return;
    if (e.target.closest('[data-fc-thumb]')) return; // ignora click sul thumb
    const rect = trackRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const newVal = positionToValue(x * 100);
    onChange(newVal);
  }, [effectiveMax, positionToValue, onChange]);

  const handleThumbMouseDown = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e) => {
      if (!trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const newVal = positionToValue(x * 100);
      onChange(newVal);
    };
    const onUp = () => setIsDragging(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [isDragging, positionToValue, onChange]);

  const textSharp = { textShadow: '0 1px 2px rgba(0,0,0,0.9), 0 0 1px rgba(0,0,0,1)', WebkitFontSmoothing: 'antialiased' };
  return (
    <div className="flex flex-col items-center gap-4 w-full" style={{ fontFamily: HUD_ORATORIO_FONT_UI }}>
      {/* Display FC + VA base - sopra il rail */}
      <div className="flex items-baseline justify-center gap-2 -mt-1 mb-2">
        <span className="text-xl font-black uppercase tracking-widest" style={{ color: '#fbbf24', ...textSharp }}>FC</span>
        <span className="font-black text-3xl tabular-nums" style={{ color: accent, ...textSharp }}>{value}</span>
        <span className="text-xl font-black uppercase tracking-widest" style={{ color: '#f43f5e', ...textSharp }}>VA</span>
        <span className="text-base font-mono tabular-nums font-semibold" style={{ color: accent, ...textSharp }}>{power}×{value}=</span>
        <span className="font-black text-2xl tabular-nums" style={{ color: accent, ...textSharp }}>{baseAssault}</span>
      </div>

      {/* Rail - forma a losanga, semplice e originale */}
      <div className="w-full max-w-[85%] mx-auto px-0">
        <div 
          ref={trackRef}
          role="slider"
          aria-valuemin={1}
          aria-valuemax={effectiveMax}
          aria-valuenow={value}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') onChange(Math.max(1, value - 1));
            if (e.key === 'ArrowRight' || e.key === 'ArrowUp') onChange(Math.min(effectiveMax, value + 1));
          }}
          onClick={handleTrackClick}
          className="relative h-6 flex items-center cursor-pointer select-none overflow-visible"
        >
          {/* Sfondo rail - clip-path solo qui, così il thumb non viene tagliato */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 50%, #1e293b 100%)',
              clipPath: 'polygon(0 50%, 2% 0, 98% 0, 100% 50%, 98% 100%, 2% 100%)',
              border: '2px solid #000',
              boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.5), 2px 2px 0 #000'
            }}
          />
          {/* Fill - gradiente pulito */}
          <div 
            className="absolute inset-y-0 left-0 transition-all duration-150 ease-out pointer-events-none"
            style={{
              width: `${progress}%`,
              clipPath: 'polygon(0 50%, 2% 0, 98% 0, 100% 50%, 98% 100%, 2% 100%)',
              background: `linear-gradient(90deg, ${accent}66 0%, ${accent}aa 50%, ${accent}88 100%)`,
              boxShadow: `inset 0 0 8px ${accent}30`
            }}
          />
          {/* Numeri min/max dentro il rail */}
          <span 
            className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold tabular-nums pointer-events-none z-[1]"
            style={{ color: 'rgba(203, 213, 225, 0.95)', textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}
          >
            1
          </span>
          <span 
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold tabular-nums pointer-events-none z-[1]"
            style={{ color: 'rgba(203, 213, 225, 0.95)', textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}
          >
            {effectiveMax}
          </span>
          {/* Thumb - cerchio in rilievo con simbolo armata */}
          <div
            data-fc-thumb
            onMouseDown={handleThumbMouseDown}
            className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-12 h-12 rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing z-10 transition-transform ${isDragging ? 'scale-110' : 'hover:scale-105'}`}
            style={{
              left: `${progress}%`,
              background: `radial-gradient(circle at 30% 30%, ${accent}ff, ${accent} 45%, ${accent}aa 70%, ${accent}88)`,
              border: '2px solid #000',
              boxShadow: `
                4px 4px 0 rgba(0,0,0,0.8),
                2px 2px 0 rgba(0,0,0,0.5),
                inset 0 2px 4px rgba(255,255,255,0.4),
                inset 0 -2px 4px rgba(0,0,0,0.2)
              `
            }}
          >
            <Icon 
              name={army || 'Kethran'} 
              type="army" 
              size={Math.round(48 * 0.9)} 
              color="#fff"
            />
          </div>
        </div>
      </div>

      {reserved > 0 && (
        <div 
          className="text-xs text-center px-2 py-0.5 font-medium"
          style={{ color: 'rgba(251, 191, 36, 0.95)', textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}
        >
          ⚠ {reserved} FC riservati
        </div>
      )}
    </div>
  );
};

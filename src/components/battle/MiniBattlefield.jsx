import React from 'react';
import { ARMY_COLORS } from '../../data';
import { FIELD_STYLES } from '../../utils/constants';
import { resolveFieldThumbUrl, resolvePublicAssetUrl } from '../../utils/preloadAssets';
import { FieldCurseOverlay } from './FieldCurseOverlay.jsx';

/**
 * Componente campo di battaglia compatto
 * Versione ridotta per la visualizzazione nella lista campi
 */
export const MiniBattlefield = React.memo(({ 
  field, 
  selected, 
  onClick, 
  conquered, 
  conqueredBy, 
  conqueredAccent = null,
  hidden, 
  turnsUntilReveal, 
  onHover,
  guidedHighlight = false,
  cursed = false,
  curseAccent = null,
  curseArriving = false,
}) => {
  if (hidden) {
    return (
      <div
        onClick={onClick}
        className={`h-full min-h-[2rem] rounded bg-slate-800/30 border border-slate-700/50 flex items-center justify-center px-2 relative overflow-hidden ${
          cursed ? 'satze-field-curse' : ''
        } ${
          onClick ? 'cursor-pointer hover:border-yellow-400/50' : ''
        } ${selected ? 'border-2 border-yellow-400' : ''}`}
        style={cursed && curseAccent ? { '--curse-accent': curseAccent, borderColor: curseAccent } : undefined}
      >
        {cursed && <FieldCurseOverlay accent={curseAccent} arriving={curseArriving} />}
        <span 
          className="text-slate-200 text-sm font-semibold text-center relative z-10" 
          style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8), 0 0 1px rgba(0,0,0,0.5)' }}
        >
          🔒 Si rivela tra {turnsUntilReveal} {turnsUntilReveal === 1 ? 'turno' : 'turni'}
        </span>
      </div>
    );
  }
  
  // Colore esercito (identità mazzo), non dell'agente singolo che ha vinto il duello
  const conquestAccent = conquered
    ? (conqueredAccent || ARMY_COLORS[conqueredBy]?.accent || null)
    : null;

  const getConqueredStyle = () => {
    if (!conquestAccent) return {};
    return {
      borderColor: conquestAccent,
    };
  };
  
  const conqueredStyle = getConqueredStyle();
  const fieldStyle = FIELD_STYLES[field.id] || {};
  const bgUrl = field?.bgImage ? resolveFieldThumbUrl(field.bgImage) : null;
  const bgFullUrl = field?.bgImage ? resolvePublicAssetUrl(field.bgImage) || field.bgImage : null;
  
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => onHover && onHover(field)}
      onMouseLeave={() => onHover && onHover(null)}
      className={`
        h-full min-h-[2rem] rounded px-2 py-0.5 transition-all duration-300 flex items-center relative overflow-hidden
        ${guidedHighlight ? 'animate-satze-guided-twinkle ring-2 ring-amber-300/80 shadow-[0_0_18px_rgba(251,191,36,0.45)]' : ''}
        ${cursed ? 'satze-field-curse' : ''}
        ${conquered 
          ? 'border-2 shadow-lg' 
          : selected 
            ? 'border-2 border-yellow-400 shadow-lg shadow-yellow-400/30 ring-2 ring-yellow-400/30' 
            : onClick 
              ? 'border border-slate-600/50 hover:border-yellow-400/60 hover:shadow-md hover:shadow-yellow-400/20 cursor-pointer'
              : 'border border-slate-700/50'
        }
      `}
      style={{
        ...(conquered ? conqueredStyle : {}),
        ...(cursed && curseAccent ? { '--curse-accent': curseAccent, borderColor: curseAccent } : {}),
      }}
    >
      {/* Immagine campo (fallback: gradiente) */}
      {bgUrl ? (
        <div className="absolute inset-0" style={{ opacity: conquered ? 0.85 : 1 }}>
          <img
            src={bgUrl}
            alt=""
            aria-hidden
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => {
              // Miniatura assente (campo aggiunto senza rigenerare): usa l'originale.
              const img = e.currentTarget;
              if (!bgFullUrl || img.dataset.fullFallback === '1') return;
              img.dataset.fullFallback = '1';
              img.src = bgFullUrl;
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(90deg, rgba(8,10,18,0.55) 0%, rgba(8,10,18,0.25) 55%, rgba(8,10,18,0.45) 100%)',
            }}
          />
        </div>
      ) : (
        <div
          className="absolute inset-0 opacity-60"
          style={{ background: fieldStyle.gradient || 'linear-gradient(135deg, #1a1a2e, #2a2a4e)' }}
        />
      )}
      <div 
        className="absolute inset-0 opacity-30"
        style={{ 
          background: `radial-gradient(ellipse at 20% 50%, ${fieldStyle.glow || 'rgba(100,100,100,0.3)'} 0%, transparent 70%)`
        }}
      />
      {/* Pannello colore esercito conquistatore — tra immagine e testo */}
      {conquered && conquestAccent && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            zIndex: 5,
            background: `linear-gradient(90deg, ${conquestAccent}cc 0%, ${conquestAccent}99 45%, ${conquestAccent}66 100%)`,
          }}
          aria-hidden
        />
      )}
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
      {cursed && <FieldCurseOverlay accent={curseAccent} arriving={curseArriving} />}
    </div>
  );
});
MiniBattlefield.displayName = 'MiniBattlefield';

import React from 'react';
import { ARMY_COLORS } from '../../data';
import { getCardSprite } from '../../utils';
import { getImagePositioning } from '../../data/imagePositioning';
import { CardImage } from './CardImage';
import { CardName } from './CardName';
import { CardReworkP4 } from './CardReworkP4';

/**
 * Componente carta per la mano - dimensioni medie
 * Versione semplificata della carta per la visualizzazione in mano
 */
const HAND_P4_SCALE = Math.min(144 / 230, 208 / 330);

export const HandCard = ({
  agent,
  selected,
  onClick,
  disabled,
  usedCards = [],
  onPreviewClick,
  battleOutcome = null,
  onDragStart,
  isDragging = false,
  showBonus = false,
  bonusBaseInactive = false,
  highlighted = false,
  cardLayout: _legacyCardLayout,
}) => {
  const isUsed = usedCards.includes(agent?.id);
  const colors = agent ? ARMY_COLORS[agent.army] || { bg: "from-gray-800 to-gray-700", accent: "#666", text: "text-gray-200" } : {};
  
  if (!agent) return null;
  
  const spriteInfo = getCardSprite(agent);
  const positioning = getImagePositioning(agent.id, agent.army);
  const objectPosition = positioning.objectPosition || 'center center';
  const imageScale = positioning.scale ?? 100;
  const containerLeft = positioning.containerLeft;
  const containerTop = positioning.containerTop;
  
  const handleMouseDown = (e) => {
    if (onDragStart && !disabled && !isUsed) {
      onDragStart(e, agent);
    }
  };

  // Se la carta è usata e ha un esito, mostra layout con esito
  // Stile cosmico: vittoria = aurora cyan-amber, sconfitta = dissolvenza magenta-slate
  if (isUsed && battleOutcome) {
    const isWinner = battleOutcome === 'winner';
    return (
      <div
        onClick={() => onPreviewClick?.({ agent, showBonus })}
        className={`
          group cursor-pointer
          w-36 h-52 rounded-xl bg-gradient-to-br ${colors.bg}
          border-2 transition-all duration-300 relative flex-shrink-0 shadow-2xl
          flex flex-col overflow-hidden hover:scale-[1.02]
          ${isWinner ? 'satze-card-winner' : 'satze-card-loser'}
        `}
      >
        {/* Immagine */}
        <div className="absolute inset-0 flex items-center justify-center">
          <CardImage type={spriteInfo.type} palette={spriteInfo.palette} agentId={spriteInfo.agentId} size={130} objectPosition={objectPosition} scale={imageScale} containerLeft={containerLeft} containerTop={containerTop} />
        </div>
        
        {/* Overlay cosmico */}
        <div 
          className="absolute inset-0 transition-all duration-300 pointer-events-none"
          style={isWinner ? {
            background: 'linear-gradient(135deg, rgba(212, 168, 71, 0.2) 0%, rgba(229, 228, 226, 0.1) 40%, rgba(26, 15, 58, 0.4) 100%)',
            boxShadow: 'inset 0 0 60px rgba(212, 168, 71, 0.08)'
          } : {
            background: 'linear-gradient(135deg, rgba(148, 163, 184, 0.08) 0%, rgba(10, 14, 26, 0.7) 50%, rgba(51, 65, 85, 0.5) 100%)',
            boxShadow: 'inset 0 0 40px rgba(100, 116, 139, 0.06)'
          }}
        />
        
        {/* Glow aurora per vincitrice */}
        {isWinner && (
          <div 
            className="absolute inset-0 satze-glow-aurora pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(212, 168, 71, 0.2) 0%, rgba(229, 228, 226, 0.08) 40%, transparent 70%)'
            }}
          />
        )}
        
        {/* Nome in alto */}
        <div className="relative z-10 px-2 py-1.5 bg-black/60 min-w-0">
          <CardName name={agent.name} className="block" />
        </div>
        
        {/* Esito - watermark con glow sotto e animazione */}
        <div className="flex-1 flex items-center justify-center relative z-10 pointer-events-none">
          {/* Glow sotto il testo - bianco per Trionfo, nero per Sconfitta */}
          <div
            className={`absolute inset-0 flex items-center justify-center satze-outcome-glow-pulse ${
              isWinner ? 'satze-outcome-glow-white' : 'satze-outcome-glow-black'
            }`}
          />
          <div 
            className="relative satze-outcome-text-border"
            style={{
              fontFamily: "'Cinzel', 'Georgia', serif",
              fontSize: '0.85rem',
              fontWeight: 700,
              letterSpacing: '0.25em',
              opacity: isWinner ? 0.85 : 0.75,
              color: isWinner ? '#D4A847' : '#94a3b8',
              textShadow: isWinner 
                ? '0 0 20px rgba(212, 168, 71, 0.5)' 
                : '0 0 12px rgba(148, 163, 184, 0.3)',
              transform: 'rotate(-4deg)',
              textTransform: 'uppercase'
            }}
          >
            {isWinner ? 'Trionfo' : 'Sconfitta'}
          </div>
        </div>
      </div>
    );
  }
  
  const handleClick = () => {
    // Preview sempre disponibile (anche per carte avversarie con disabled)
    onPreviewClick?.({ agent, showBonus });
    if (disabled || isUsed) return;
    onClick?.();
  };

  const handShellClass = `
        group
        w-36 h-52 rounded-xl bg-gradient-to-br ${colors.bg}
        border-2 transition-all duration-300 relative flex-shrink-0
        ${selected ? 'border-yellow-400 shadow-2xl shadow-yellow-400/60 scale-105 -translate-y-2 z-20 ring-4 ring-yellow-400/30' : 'border-white/30 shadow-lg'}
        ${highlighted ? 'ring-4 ring-amber-300/80 border-amber-200 shadow-2xl shadow-amber-300/45 animate-pulse' : ''}
        ${disabled || isUsed ? (onPreviewClick ? 'cursor-pointer opacity-90 hover:opacity-100 hover:scale-[1.02]' : 'cursor-not-allowed opacity-60') : onDragStart ? 'hover:scale-110 hover:border-white/70 hover:-translate-y-4 hover:shadow-2xl hover:shadow-yellow-500/40 hover:ring-2 hover:ring-yellow-400/40 cursor-grab active:cursor-grabbing active:scale-95' : 'hover:scale-110 hover:border-white/70 hover:-translate-y-4 hover:shadow-2xl hover:shadow-yellow-500/40 hover:ring-2 hover:ring-yellow-400/40 cursor-pointer active:scale-95'}
        ${isDragging ? 'scale-90 shadow-2xl' : ''}
        flex flex-col overflow-hidden
      `;

  return (
    <div
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      className={handShellClass}
      style={{ userSelect: 'none' }}
    >
      <div
        className="absolute left-1/2 top-1/2 pointer-events-none"
        style={{
          width: 230,
          height: 330,
          transform: `translate(-50%, -50%) scale(${HAND_P4_SCALE})`,
        }}
      >
        <CardReworkP4 agent={agent} showBonus={showBonus} bonusBaseInactive={bonusBaseInactive} />
      </div>
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
    </div>
  );
};

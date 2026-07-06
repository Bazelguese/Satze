// ============================================
// COMPONENTE - CardImage
// Visualizza l'immagine di una carta con fallback placeholder
// ============================================

import { memo, useState } from 'react';
import { CARD_IMAGES, AGENT_IMAGES } from '../../data/images';
import { Icon } from '../ui/Icon';
import { CARD_TYPE_ICONS } from '../../data/icons.jsx';
import { normalizeContainCrop } from '../../utils/imageContainPan';

const loadedImageUrls = new Set();

export const CardImage = memo(({
  type,
  palette,
  size = 64,
  agentId = null,
  objectPosition = 'center center',
  scale = 100,
  containerLeft,
  containerTop,
}) => {
  // Se è un'immagine specifica per agente, usa AGENT_IMAGES
  const imageUrl = (type === 'specific' && agentId) ? AGENT_IMAGES[agentId] : CARD_IMAGES[type];
  const [imageLoaded, setImageLoaded] = useState(() => Boolean(imageUrl && loadedImageUrls.has(imageUrl)));
  const [imageError, setImageError] = useState(false);
  
  // Colori placeholder per armata
  const placeholderColors = {
    cosmic: { bg: '#1a1035', accent: '#a78bfa', glow: '#c4b5fd' },
    babel: { bg: '#2d1a0d', accent: '#daa520', glow: '#ffd700' },
    devil: { bg: '#1a0808', accent: '#dc2626', glow: '#f87171' },
    mech: { bg: '#1e293b', accent: '#22d3ee', glow: '#67e8f9' },
    mystic: { bg: '#042f2e', accent: '#2dd4bf', glow: '#5eead4' },
    swarm: { bg: '#14220a', accent: '#84cc16', glow: '#bef264' }
  };
  
  const colors = placeholderColors[palette] || placeholderColors.cosmic;
  
  // Placeholder con icona personalizzata (mostrato se no immagine o errore)
  const Placeholder = () => {
    const iconComponent = CARD_TYPE_ICONS[type];
    return (
      <div 
        className="flex items-center justify-center rounded-lg"
        style={{ 
          width: size, 
          height: size,
          background: `radial-gradient(circle at 50% 30%, ${colors.glow}40, ${colors.bg})`
        }}
      >
        {iconComponent ? (
          <Icon 
            name={type} 
            type="cardType" 
            size={size * 0.6} 
            color={colors.accent}
          />
        ) : (
          <Icon name="question" type="cardIcon" size={size * 0.5} color={colors.accent} />
        )}
      </div>
    );
  };
  
  // Se non c'è URL o c'è stato errore, mostra placeholder
  if (!imageUrl || imageError) {
    return <Placeholder />;
  }
  
  // Se è un'immagine specifica per agente, usa aspect ratio verticale (2:3)
  const isAgentImage = type === 'specific' && agentId && AGENT_IMAGES[agentId];
  const containerHeight = isAgentImage ? Math.round(size * 1.5) : size;
  
  const scaleFactor = scale != null && scale !== 100 ? scale / 100 : 1;
  const { objectPosition: imgObjectPosition, containerLeft: panLeft, containerTop: panTop } =
    normalizeContainCrop(objectPosition, containerLeft, containerTop);
  const panTransform =
    panLeft != null || panTop != null ? `translate(${panLeft ?? '0'}, ${panTop ?? '0'})` : undefined;

  return (
    <div className="relative overflow-hidden rounded-lg" style={{ width: size, height: containerHeight }}>
      <div className="w-full h-full" style={panTransform ? { transform: panTransform } : undefined}>
        {/* Invisibile (ma con layout box) finché non carica: con display:none
            il lazy loading non partirebbe mai, perché il browser non può
            calcolare l'intersezione con il viewport. */}
        <img
          src={imageUrl}
          alt={type}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onLoad={() => {
            loadedImageUrls.add(imageUrl);
            setImageLoaded(true);
          }}
          onError={() => setImageError(true)}
          className="w-full h-full drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]"
          style={{
            imageRendering: 'auto',
            opacity: imageLoaded ? 1 : 0,
            objectFit: 'contain',
            objectPosition: imgObjectPosition,
            transform: scaleFactor !== 1 ? `scale(${scaleFactor})` : undefined,
            transformOrigin: 'center center',
          }}
        />
      </div>
      {/* Placeholder in overlay mentre carica */}
      {!imageLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Placeholder />
        </div>
      )}
    </div>
  );
});

// ============================================
// COMPONENTE - CardImage
// Visualizza l'immagine di una carta con fallback placeholder
// ============================================

import { memo, useEffect, useState } from 'react';
import { CARD_IMAGES, AGENT_IMAGES, getAgentThumbUrl } from '../../data/images';
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
  /** Sorgente thumb (stessa geometria/display); fallback automatico sul full. */
  preferThumb = false,
}) => {
  const fullUrl = (type === 'specific' && agentId) ? AGENT_IMAGES[agentId] : CARD_IMAGES[type];
  const thumbUrl = preferThumb && type === 'specific' && agentId
    ? getAgentThumbUrl(agentId)
    : null;

  const [failedThumb, setFailedThumb] = useState(false);
  const imageUrl = thumbUrl && !failedThumb ? thumbUrl : fullUrl;
  const [imageLoaded, setImageLoaded] = useState(() => Boolean(imageUrl && loadedImageUrls.has(imageUrl)));
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setFailedThumb(false);
    setImageError(false);
    const next = thumbUrl || fullUrl;
    setImageLoaded(Boolean(next && loadedImageUrls.has(next)));
  }, [agentId, preferThumb, fullUrl, thumbUrl]);

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

  if (!imageUrl || imageError) {
    return <Placeholder />;
  }

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
        <img
          key={imageUrl}
          src={imageUrl}
          alt={type}
          loading="lazy"
          decoding="async"
          fetchPriority="low"
          referrerPolicy="no-referrer"
          width={size}
          height={containerHeight}
          onLoad={() => {
            loadedImageUrls.add(imageUrl);
            setImageLoaded(true);
          }}
          onError={() => {
            if (thumbUrl && !failedThumb && imageUrl === thumbUrl && fullUrl) {
              setFailedThumb(true);
              setImageLoaded(Boolean(loadedImageUrls.has(fullUrl)));
              return;
            }
            setImageError(true);
          }}
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
      {!imageLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Placeholder />
        </div>
      )}
    </div>
  );
});

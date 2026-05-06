// ============================================
// COMPONENTE - Icon
// Renderizza icone personalizzate (SVG o immagini) invece di emoji
// ============================================

import { ARMY_ICONS, CARD_TYPE_ICONS, CARD_ICONS, FALLBACK_ICON } from '../../data/icons.jsx';

/**
 * Componente per renderizzare icone personalizzate
 * @param {string} name - Nome dell'icona (armata, tipo carta, etc.)
 * @param {string} type - Tipo: 'army', 'cardType', 'cardIcon', 'custom'
 * @param {number} size - Dimensione in pixel (default: 24)
 * @param {string} className - Classi CSS aggiuntive
 * @param {string} color - Colore per SVG (opzionale)
 */
export const Icon = ({ 
  name, 
  type = 'army', 
  size = 24, 
  className = '', 
  color = null,
  ...props 
}) => {
  // Determina quale mappa di icone usare
  let iconSource = null;
  
  if (type === 'army') {
    iconSource = ARMY_ICONS[name];
  } else if (type === 'cardType') {
    iconSource = CARD_TYPE_ICONS[name];
  } else if (type === 'cardIcon') {
    iconSource = name ? CARD_ICONS[name] : null;
  } else if (type === 'custom') {
    // Per icone custom, name è il path diretto
    iconSource = name;
  }
  
  // Se non trovata, usa fallback
  if (!iconSource) {
    iconSource = FALLBACK_ICON;
  }
  
  // PRIORITÀ 1: Se è una stringa che sembra un'immagine, renderizzala come immagine
  // Questo deve essere PRIMA del controllo dei componenti React
  if (typeof iconSource === 'string') {
    const isEmoji = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u.test(iconSource);
    const looksLikeImage = !isEmoji && (
      iconSource.endsWith('.png') || 
      iconSource.endsWith('.jpg') || 
      iconSource.endsWith('.jpeg') || 
      iconSource.endsWith('.svg') ||
      iconSource.startsWith('/') ||
      iconSource.startsWith('http://') ||
      iconSource.startsWith('https://') ||
      iconSource.startsWith('data:') ||
      iconSource.includes('/assets/') ||
      iconSource.includes('/icons/') ||
      iconSource.includes('assets/icons')
    );
    
    if (looksLikeImage) {
      return (
        <img 
          src={iconSource} 
          alt={name}
          className={className}
          style={{ 
            width: size, 
            height: size, 
            display: 'inline-block',
            objectFit: 'contain'
          }}
          {...props}
        />
      );
    }
    
    // Se è una stringa ma non un'immagine (es. emoji fallback)
    return (
      <span 
        className={className}
        style={{ fontSize: size, display: 'inline-block' }}
        {...props}
      >
        {iconSource}
      </span>
    );
  }
  
  // PRIORITÀ 2: Se è un componente SVG React (funzione o componente)
  if (typeof iconSource === 'function' || (iconSource && typeof iconSource === 'object' && iconSource.$$typeof)) {
    const IconComponent = iconSource;
    return (
      <span 
        className={className}
        style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          width: size, 
          height: size 
        }}
        {...props}
      >
        <IconComponent size={size} {...(color != null && { color })} />
      </span>
    );
  }
  
  // Se è JSX/SVG inline (oggetto React element)
  if (iconSource && typeof iconSource === 'object') {
    return (
      <span 
        className={className}
        style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          width: size, 
          height: size 
        }}
        {...props}
      >
        {iconSource}
      </span>
    );
  }
  
  // Fallback: mostra emoji originale se disponibile
  return (
    <span 
      className={className}
      style={{ fontSize: size, display: 'inline-block' }}
      {...props}
    >
      {iconSource || '❓'}
    </span>
  );
};

/**
 * Helper per ottenere solo il path/componente dell'icona senza renderizzarla
 */
export const getIcon = (name, type = 'army') => {
  if (type === 'army') {
    return ARMY_ICONS[name] || FALLBACK_ICON;
  } else if (type === 'cardType') {
    return CARD_TYPE_ICONS[name] || FALLBACK_ICON;
  } else if (type === 'cardIcon') {
    return (name && CARD_ICONS[name]) || FALLBACK_ICON;
  }
  return FALLBACK_ICON;
};

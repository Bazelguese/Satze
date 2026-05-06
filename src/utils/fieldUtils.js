// ============================================
// UTILITÀ - Gestione Campi di Battaglia
// ============================================

/**
 * Genera configurazione per effetti particellari specifici per ogni campo
 * @param {number} fieldId - ID del campo di battaglia
 * @param {Object} fieldStyle - Stile del campo con accent, glow, gradient
 * @returns {Object} - Configurazione particelle { type, className, count, shape, opacity, accent, glow? }
 */
export const generateFieldParticles = (fieldId, fieldStyle) => {
  const baseConfig = {
    count: 15,
    accent: fieldStyle.accent || '#666',
    opacity: 0.25
  };
  
  switch(fieldId) {
    case 1: // Gran Corno - Sabbia/Polvere che cade
      return {
        ...baseConfig,
        type: 'fall',
        className: 'animate-particle-fall',
        count: 20,
        shape: 'rounded-full'
      };
    case 2: // Terza Luna - Stelle luminose che fluttuano
      return {
        ...baseConfig,
        type: 'float',
        className: 'animate-particle-float',
        count: 12,
        opacity: 0.4,
        shape: 'rounded-full',
        glow: true
      };
    case 3: // Arena degli Gnomi - Scintille
      return {
        ...baseConfig,
        type: 'sparkle',
        className: 'animate-particle-sparkle',
        count: 25,
        shape: 'rounded-full',
        opacity: 0.5
      };
    case 4: // Miniera di Lacrime - Gemme che salgono
      return {
        ...baseConfig,
        type: 'rise',
        className: 'animate-particle-rise',
        count: 12,
        shape: 'rounded-full',
        opacity: 0.3
      };
    case 5: // Nido dell'Antico - Foglie che cadono
      return {
        ...baseConfig,
        type: 'fall',
        className: 'animate-particle-fall',
        count: 18,
        shape: 'rounded-full',
        opacity: 0.2
      };
    case 6: // Tempio del Monaco Pazzo - Parti magiche che spiraleggiano
      return {
        ...baseConfig,
        type: 'spiral',
        className: 'animate-particle-spiral',
        count: 10,
        shape: 'rounded-full',
        opacity: 0.35
      };
    case 7: // Dimensione Specchiata - Particelle specchiate
      return {
        ...baseConfig,
        type: 'mirror',
        className: 'animate-particle-mirror',
        count: 15,
        shape: 'rounded-full',
        opacity: 0.3
      };
    case 8: // Cripta dei Sussurri - Nebbia/Spiriti che fluttuano
      return {
        ...baseConfig,
        type: 'float',
        className: 'animate-particle-float',
        count: 10,
        opacity: 0.15,
        shape: 'rounded-full'
      };
    case 9: // Porte di Atlantide - Bolle che salgono
      return {
        ...baseConfig,
        type: 'rise',
        className: 'animate-particle-rise',
        count: 14,
        shape: 'rounded-full',
        opacity: 0.25
      };
    case 10: // Nido di Spine - Spine/Polvere che vola
      return {
        ...baseConfig,
        type: 'fall',
        className: 'animate-particle-fall',
        count: 16,
        shape: 'rounded-full',
        opacity: 0.2
      };
    case 11: // Canyon delle Lame - Scintille metalliche
      return {
        ...baseConfig,
        type: 'sparkle',
        className: 'animate-particle-sparkle',
        count: 20,
        shape: 'rounded-full',
        opacity: 0.4
      };
    case 12: // Torre d'Avorio - Polvere dorata che cade
      return {
        ...baseConfig,
        type: 'fall',
        className: 'animate-particle-fall',
        count: 12,
        shape: 'rounded-full',
        opacity: 0.3
      };
    case 13: // Fossa dei Leoni - Polvere/sabbia che vola
      return {
        ...baseConfig,
        type: 'float',
        className: 'animate-particle-float',
        count: 18,
        shape: 'rounded-full',
        opacity: 0.2
      };
    case 14: // Santuario del Silenzio - Nessuna particella
      return {
        ...baseConfig,
        type: 'none',
        className: '',
        count: 0,
        shape: 'rounded-full'
      };
    case 15: // Nexus Arcano - Energia arcuata che fluisce
      return {
        ...baseConfig,
        type: 'spiral',
        className: 'animate-particle-spiral',
        count: 12,
        shape: 'rounded-full',
        opacity: 0.4
      };
    case 16: // Voragine Infinita - Particelle risucchiate
      return {
        ...baseConfig,
        type: 'vortex',
        className: 'animate-particle-vortex',
        count: 15,
        shape: 'rounded-full',
        opacity: 0.3
      };
    case 17: // Altare del Sacrificio - Gocce/polvere rossa che cade
      return {
        ...baseConfig,
        type: 'fall',
        className: 'animate-particle-fall',
        count: 14,
        shape: 'rounded-full',
        opacity: 0.3
      };
    case 18: // Biblioteca Proibita - Lettere/pagine che fluttuano
      return {
        ...baseConfig,
        type: 'float',
        className: 'animate-particle-float',
        count: 12,
        shape: 'rounded-full',
        opacity: 0.2
      };
    default:
      return {
        ...baseConfig,
        type: 'float',
        className: 'animate-particle-float',
        count: 15,
        shape: 'rounded-full'
      };
  }
};

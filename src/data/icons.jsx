// ============================================
// CONFIGURAZIONE ICONE PERSONALIZZATE
// Sostituisce le emoji con icone SVG/immagini personalizzate
// ============================================

// Importa le icone personalizzate (PNG/SVG)
import cometIcon from '../assets/icons/icon_orizzonte.webp';

// Importa le icone SVG (verranno create come componenti React)
// Per ora usiamo placeholder - sostituisci con le tue icone personalizzate

// ============================================
// ICONE ARMATE
// ============================================

// Icona per "Figli dell'Orizzonte" (cometa)
export const IconComet = ({ size = 24, color = '#a78bfa' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L14 8L20 10L14 12L12 18L10 12L4 10L10 8L12 2Z" fill={color} stroke={color} strokeWidth="1.5"/>
    <path d="M12 2L13 6L17 7L13 8L12 12L11 8L7 7L11 6L12 2Z" fill="white" opacity="0.8"/>
  </svg>
);

// Icona per "Kethran" (tempio/colonna)
export const IconTemple = ({ size = 24, color = '#fbbf24' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="8" y="4" width="8" height="16" fill={color} stroke={color} strokeWidth="1.5"/>
    <rect x="10" y="6" width="4" height="2" fill="white" opacity="0.8"/>
    <rect x="10" y="10" width="4" height="2" fill="white" opacity="0.8"/>
    <rect x="10" y="14" width="4" height="2" fill="white" opacity="0.8"/>
    <path d="M6 20L18 20" stroke={color} strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

// Icona per "Corte Rossa" (fiamma)
export const IconFlame = ({ size = 24, color = '#f43f5e' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 20C12 20 8 16 8 12C8 10 9 8 10 7C10 9 11 11 12 12C13 11 14 9 14 7C15 8 16 10 16 12C16 16 12 20 12 20Z" fill={color}/>
    <path d="M12 18C12 18 10 15 10 13C10 12 10.5 11 11 10.5C11 11.5 11.5 12.5 12 13C12.5 12.5 13 11.5 13 10.5C13.5 11 14 12 14 13C14 15 12 18 12 18Z" fill="white" opacity="0.9"/>
  </svg>
);

// Icona per "Calibri Pesanti" (ingranaggio)
export const IconGear = ({ size = 24, color = '#94a3b8' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="3" fill={color}/>
    <path d="M12 2L12 6M12 18L12 22M22 12L18 12M6 12L2 12M19.07 4.93L16.24 7.76M7.76 16.24L4.93 19.07M19.07 19.07L16.24 16.24M7.76 7.76L4.93 4.93" 
          stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <circle cx="12" cy="12" r="7" fill="none" stroke={color} strokeWidth="1.5"/>
  </svg>
);

// Icona per "Orathai" (luna)
export const IconMoon = ({ size = 24, color = '#2dd4bf' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 12C18 15.3137 15.3137 18 12 18C8.68629 18 6 15.3137 6 12C6 8.68629 8.68629 6 12 6C12.5 6 12.98 6.06 13.44 6.17C12.84 7.19 12.5 8.36 12.5 9.5C12.5 12.5376 14.9624 15 18 15C18.14 15 18.28 14.99 18.42 14.97C17.94 16.95 16.11 18.5 14 18.5C11.5147 18.5 9.5 16.4853 9.5 14C9.5 12.89 9.84 11.81 10.44 10.83C9.5 10.06 8.36 9.5 7 9.5C4.51472 9.5 2.5 11.5147 2.5 14C2.5 16.4853 4.51472 18.5 7 18.5C8.11 18.5 9.19 18.16 10.17 17.56C11.19 18.16 12.36 18.5 13.5 18.5C16.5376 18.5 19 16.0376 19 13C19 12.86 18.99 12.72 18.97 12.58C16.95 13.06 15.5 14.89 15.5 17C15.5 19.4853 17.5147 21.5 20 21.5C20.64 21.5 21.25 21.38 21.81 21.16C21.38 20.75 21 20.36 20.66 20C20.36 19.75 20.08 19.5 19.83 19.28C19.5 19.08 19.19 18.9 18.89 18.75C18.75 18.69 18.61 18.63 18.47 18.58C18.28 18.51 18.09 18.45 17.91 18.4C17.4 18.27 16.89 18.19 16.39 18.16C16.19 18.15 16 18.14 15.81 18.14C15.14 18.14 14.5 18.25 13.89 18.44C13.25 18.64 12.64 18.92 12.08 19.25C11.92 19.33 11.75 19.42 11.58 19.5C11.42 19.58 11.25 19.66 11.08 19.73C10.75 19.86 10.42 19.97 10.08 20.06C9.75 20.14 9.42 20.2 9.08 20.25C8.75 20.3 8.42 20.33 8.08 20.36C7.75 20.38 7.42 20.39 7.08 20.39C6.75 20.39 6.42 20.38 6.08 20.36C5.75 20.33 5.42 20.3 5.08 20.25C4.75 20.2 4.42 20.14 4.08 20.06C3.75 19.97 3.42 19.86 3.08 19.73C2.92 19.66 2.75 19.58 2.58 19.5C2.42 19.42 2.25 19.33 2.08 19.25C1.64 19.08 1.22 18.89 0.83 18.67C0.67 18.58 0.5 18.5 0.33 18.42C0.17 18.33 0 18.25 0 18.25V18.25Z" fill={color}/>
    <path d="M12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8Z" fill="white" opacity="0.8"/>
  </svg>
);

// Icona per "Nati dalla Bocca" (virus/cellula)
export const IconVirus = ({ size = 24, color = '#a3e635' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="4" fill={color}/>
    <circle cx="12" cy="12" r="2" fill="white" opacity="0.9"/>
    <circle cx="6" cy="8" r="1.5" fill={color}/>
    <circle cx="18" cy="8" r="1.5" fill={color}/>
    <circle cx="6" cy="16" r="1.5" fill={color}/>
    <circle cx="18" cy="16" r="1.5" fill={color}/>
    <circle cx="8" cy="6" r="1.5" fill={color}/>
    <circle cx="16" cy="6" r="1.5" fill={color}/>
    <circle cx="8" cy="18" r="1.5" fill={color}/>
    <circle cx="16" cy="18" r="1.5" fill={color}/>
  </svg>
);

// Icona per "L'Enclave delle Scaglie" (drago)
export const IconDragon = ({ size = 24, color = '#f59e0b' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 4L14 8L18 10L14 12L12 16L10 12L6 10L10 8L12 4Z" fill={color}/>
    <path d="M8 18L10 20L12 18L14 20L16 18" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none"/>
    <circle cx="10" cy="10" r="1" fill="white"/>
    <circle cx="14" cy="10" r="1" fill="white"/>
  </svg>
);

// Icona per "Ratti della Megera" (ratto)
export const IconRat = ({ size = 24, color = '#10b981' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="12" cy="14" rx="6" ry="4" fill={color}/>
    <ellipse cx="10" cy="12" rx="2" ry="2.5" fill={color}/>
    <circle cx="9" cy="11" r="1" fill="white"/>
    <path d="M6 14L4 16M18 14L20 16" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <path d="M8 18L10 20M16 18L14 20" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

// Helper: path icone in public/ (compatibile con base: './' in Vite/Electron)
const iconPublic = (filename) => `${import.meta.env.BASE_URL}icons/${filename}`;

// Mappa delle icone per armate
export const ARMY_ICONS = {
  'Figli dell\'Orizzonte': iconPublic('Orizzonte-nobg.webp'),
  'Kethran': iconPublic('ketrhan-nobg.webp'),
  'Corte Rossa': iconPublic('corte-nobg.webp'),
  'Calibri Pesanti': iconPublic('calibri-nobg.webp'),
  'Orathai': iconPublic('orethai-nobg.webp'),
  'Nati dalla Bocca': iconPublic('Mounthborn-nobg.webp'),
  'Mounthborn': iconPublic('Mounthborn-nobg.webp'), // chiave usata in campaign/cards/armies
  'L\'Enclave delle Scaglie': iconPublic('enclave-nobg.webp'),
  'Ratti della Megera': iconPublic('ratti-nobg.webp'),
  'Patto degli Indocili': iconPublic('patto-indocili-icon.webp'),
  'Khemet': iconPublic('Khetan-nobg.webp'),
  'Apex': iconPublic('apex-nobg.png'),
  'Mascarada': iconPublic('Mascarada-nobg.png'),
};

// ============================================
// ICONE TIPI CARTA (per fallback)
// ============================================

// Icone per i vari tipi di carte (usate come fallback in CardImage)
export const IconSword = ({ size = 24, color = '#a78bfa' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L13 6L17 7L13 8L12 12L11 8L7 7L11 6L12 2Z" fill={color}/>
    <rect x="11" y="12" width="2" height="10" fill={color}/>
  </svg>
);

export const IconStar = ({ size = 24, color = '#a78bfa' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L14 8L20 10L14 12L12 18L10 12L4 10L10 8L12 2Z" fill={color}/>
  </svg>
);

export const IconGhost = ({ size = 24, color = '#a78bfa' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 4C8 4 5 7 5 11C5 15 8 18 12 18C16 18 19 15 19 11C19 7 16 4 12 4Z" fill={color}/>
    <circle cx="9" cy="10" r="1.5" fill="white"/>
    <circle cx="15" cy="10" r="1.5" fill="white"/>
    <path d="M8 14C8 14 9 16 12 16C15 16 16 14 16 14" stroke="white" strokeWidth="1.5" fill="none"/>
  </svg>
);

export const IconCrown = ({ size = 24, color = '#fbbf24' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M5 16L7 20L17 20L19 16L12 8L5 16Z" fill={color}/>
    <circle cx="8" cy="14" r="1" fill="white"/>
    <circle cx="12" cy="12" r="1" fill="white"/>
    <circle cx="16" cy="14" r="1" fill="white"/>
  </svg>
);

export const IconScroll = ({ size = 24, color = '#fbbf24' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="6" y="4" width="12" height="16" rx="1" fill={color}/>
    <path d="M8 8L16 8M8 12L16 12M8 16L14 16" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

export const IconAxe = ({ size = 24, color = '#fbbf24' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 4L12 8L10 10L6 6L8 4Z" fill={color}/>
    <rect x="10" y="10" width="8" height="2" transform="rotate(45 14 11)" fill={color}/>
    <rect x="12" y="12" width="2" height="8" fill={color}/>
  </svg>
);

export const IconDevil = ({ size = 24, color = '#f43f5e' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 4C8 4 5 7 5 11C5 13 6 15 8 16" fill={color}/>
    <path d="M12 4C16 4 19 7 19 11C19 13 18 15 16 16" fill={color}/>
    <path d="M8 18L10 20L12 18L14 20L16 18" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none"/>
    <circle cx="9" cy="10" r="1" fill="white"/>
    <circle cx="15" cy="10" r="1" fill="white"/>
  </svg>
);

export const IconRobot = ({ size = 24, color = '#94a3b8' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="6" y="6" width="12" height="12" rx="2" fill={color}/>
    <circle cx="9" cy="10" r="1.5" fill="white"/>
    <circle cx="15" cy="10" r="1.5" fill="white"/>
    <rect x="9" y="14" width="6" height="2" rx="1" fill="white"/>
  </svg>
);

export const IconWizard = ({ size = 24, color = '#2dd4bf' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L14 6L18 8L14 10L12 14L10 10L6 8L10 6L12 2Z" fill={color}/>
    <rect x="8" y="14" width="8" height="6" rx="1" fill={color}/>
  </svg>
);

export const IconCrystal = ({ size = 24, color = '#2dd4bf' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L16 8L22 10L16 12L12 18L8 12L2 10L8 8L12 2Z" fill={color}/>
    <circle cx="12" cy="10" r="2" fill="white" opacity="0.8"/>
  </svg>
);

export const IconSparkle = ({ size = 24, color = '#2dd4bf' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="2" fill={color}/>
    <path d="M12 2L12 6M12 18L12 22M2 12L6 12M18 12L22 12" stroke={color} strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export const IconSnake = ({ size = 24, color = '#a3e635' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 8C8 8 10 6 12 8C14 10 16 8 16 8" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none"/>
    <circle cx="10" cy="8" r="1.5" fill={color}/>
    <circle cx="14" cy="8" r="1.5" fill={color}/>
    <path d="M8 12C8 12 10 14 12 12C14 10 16 12 16 12" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none"/>
  </svg>
);

export const IconWolf = ({ size = 24, color = '#a3e635' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="6" fill={color}/>
    <circle cx="10" cy="11" r="1" fill="white"/>
    <circle cx="14" cy="11" r="1" fill="white"/>
    <path d="M10 14C10 14 11 16 12 16C13 16 14 14 14 14" stroke="white" strokeWidth="1.5" fill="none"/>
  </svg>
);

export const IconInsect = ({ size = 24, color = '#a3e635' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="12" cy="12" rx="6" ry="4" fill={color}/>
    <path d="M6 12L2 10M18 12L22 10" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <circle cx="9" cy="11" r="1" fill="white"/>
    <circle cx="15" cy="11" r="1" fill="white"/>
  </svg>
);

// Mappa delle icone per tipi di carte
export const CARD_TYPE_ICONS = {
  // Cosmic (Figli dell'Orizzonte)
  cosmic_hero: IconSword,
  cosmic_mage: IconStar,
  cosmic_spirit: IconGhost,
  
  // Babel (Kethran)
  babel_king: IconCrown,
  babel_priest: IconScroll,
  babel_berserker: IconAxe,
  
  // Devil (Corte Rossa)
  devil_prince: IconDevil,
  devil_imp: IconDevil, // Puoi creare una variante
  devil_demon: IconFlame,
  
  // Mech (Calibri Pesanti)
  mech_titan: IconRobot,
  mech_drone: IconRobot, // Puoi creare una variante
  mech_golem: IconGear,
  
  // Mystic (Orathai)
  mystic_arcane: IconWizard,
  mystic_oracle: IconCrystal,
  mystic_spirit: IconSparkle,
  
  // Swarm (Nati dalla Bocca)
  swarm_queen: IconSnake,
  swarm_beast: IconWolf,
  swarm_insect: IconInsect,
};

// ============================================
// ICONE UI / CARTE (type="cardIcon")
// ============================================

export const IconExplosion = ({ size = 24, color = '#f97316' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L13 8L19 9L13 10L12 16L11 10L5 9L11 8L12 2Z" fill={color}/>
    <path d="M8 14L10 18L12 14L14 18L16 14" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none"/>
  </svg>
);

export const IconBlock = ({ size = 24, color = '#ef4444' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" fill="none"/>
    <path d="M6 6L18 18" stroke={color} strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export const IconLightning = ({ size = 24, color = '#eab308' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M13 2L4 14H12L11 22L20 10H12L13 2Z" fill={color}/>
  </svg>
);

export const IconCheck = ({ size = 24, color = '#22c55e' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M5 12L10 17L19 6" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const IconClipboard = ({ size = 24, color = '#94a3b8' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="8" y="4" width="8" height="4" rx="1" stroke={color} strokeWidth="2" fill="none"/>
    <path d="M8 8H6C5 8 4 9 4 10V20C4 21 5 22 6 22H18C19 22 20 21 20 20V10C20 9 19 8 18 8H16" stroke={color} strokeWidth="2" fill="none"/>
  </svg>
);

export const IconChart = ({ size = 24, color = '#94a3b8' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 18V14H8V18H4Z" fill={color}/>
    <path d="M10 18V10H14V18H10Z" fill={color}/>
    <path d="M16 18V6H20V18H16Z" fill={color}/>
  </svg>
);

export const IconCoin = ({ size = 24, color = '#fbbf24' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="8" stroke={color} strokeWidth="2" fill="none"/>
    <path d="M12 6C8 8 6 10 6 12C6 14 8 16 12 18C16 16 18 14 18 12C18 10 16 8 12 6Z" stroke={color} strokeWidth="1.5" fill="none"/>
  </svg>
);

export const IconBook = ({ size = 24, color = '#2dd4bf' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 6C4 5 5 4 6 4H18C19 4 20 5 20 6V18C20 19 19 20 18 20H6C5 20 4 19 4 18V6Z" stroke={color} strokeWidth="2" fill="none"/>
    <path d="M4 8H20M4 12H20M4 16H12" stroke={color} strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export const IconDice = ({ size = 24, color = '#f43f5e' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="4" width="16" height="16" rx="3" stroke={color} strokeWidth="2" fill="none"/>
    <circle cx="8" cy="8" r="1.5" fill={color}/>
    <circle cx="16" cy="16" r="1.5" fill={color}/>
    <circle cx="12" cy="12" r="1.5" fill={color}/>
  </svg>
);

export const IconGlobe = ({ size = 24, color = '#22c55e' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" fill="none"/>
    <path d="M2 12H22M12 2C14.5 5 16 8.5 16 12C16 15.5 14.5 19 12 22M12 2C9.5 5 8 8.5 8 12C8 15.5 9.5 19 12 22" stroke={color} strokeWidth="2"/>
  </svg>
);

export const IconImage = ({ size = 24, color = '#94a3b8' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="3" width="18" height="18" rx="2" stroke={color} strokeWidth="2" fill="none"/>
    <circle cx="8.5" cy="8.5" r="2.5" stroke={color} strokeWidth="1.5" fill="none"/>
    <path d="M3 18L8 13L12 17L16 14L21 18" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const IconCard = ({ size = 24, color = '#f43f5e' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="4" width="20" height="16" rx="2" stroke={color} strokeWidth="2" fill="none"/>
    <path d="M2 10H22" stroke={color} strokeWidth="2"/>
  </svg>
);

export const IconTower = ({ size = 24, color = '#fbbf24' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L14 8H10L12 2Z" fill={color}/>
    <rect x="9" y="8" width="6" height="12" fill={color} stroke={color} strokeWidth="1"/>
    <path d="M6 20H18" stroke={color} strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export const IconSkull = ({ size = 24, color = '#94a3b8' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="10" r="7" stroke={color} strokeWidth="2" fill="none"/>
    <path d="M6 10C6 10 7 12 12 12C17 12 18 10 18 10" stroke={color} strokeWidth="2"/>
    <circle cx="9" cy="9" r="1.5" fill={color}/>
    <circle cx="15" cy="9" r="1.5" fill={color}/>
    <path d="M8 20C8 20 10 22 12 22C14 22 16 20 16 20" stroke={color} strokeWidth="2"/>
  </svg>
);

export const IconTarget = ({ size = 24, color = '#22c55e' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" fill="none"/>
    <circle cx="12" cy="12" r="6" stroke={color} strokeWidth="2" fill="none"/>
    <circle cx="12" cy="12" r="2" fill={color}/>
  </svg>
);

export const IconCircle = ({ size = 24, color = '#94a3b8' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" fill="none"/>
  </svg>
);

export const IconWarning = ({ size = 24, color = '#f97316' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 8V12M12 16H12.01" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <path d="M12 2L2 20H22L12 2Z" stroke={color} strokeWidth="2" strokeLinejoin="round" fill="none"/>
  </svg>
);

export const IconQuestion = ({ size = 24, color = '#94a3b8' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" fill="none"/>
    <path d="M9 9C9 7.5 10.5 6 12 6C13.5 6 15 7.5 15 9C15 10 14 11 12 12V13" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <circle cx="12" cy="16" r="1.5" fill={color}/>
  </svg>
);

// Mappa icone UI/carte (usata con type="cardIcon")
export const CARD_ICONS = {
  sword: IconSword,
  explosion: IconExplosion,
  block: IconBlock,
  copy: IconCrystal,
  lightning: IconLightning,
  check: IconCheck,
  clipboard: IconClipboard,
  chart: IconChart,
  coin: IconCoin,
  book: IconBook,
  dice: IconDice,
  globe: IconGlobe,
  image: IconImage,
  card: IconCard,
  tower: IconTower,
  skull: IconSkull,
  crown: IconCrown,
  scroll: IconScroll,
  flame: IconFlame,
  star: IconStar,
  sparkle: IconSparkle,
  target: IconTarget,
  circle: IconCircle,
  warning: IconWarning,
  question: IconQuestion,
  gear: IconGear,
  galaxy: IconStar,
  hole: IconCircle,
  sunrise: IconStar,
  mirror: IconCircle,
  wave: IconSparkle,
  rocket: IconSparkle,
  eye: IconCircle,
  horn: IconScroll,
  angry: IconDevil,
  pray: IconCrown,
  pickaxe: IconAxe,
  brick: IconBlock,
  temple: IconTower,
  ghost: IconGhost,
  dragon: IconDragon,
  virus: IconVirus,
  robot: IconRobot,
  wizard: IconWizard,
  snake: IconSnake,
  wolf: IconWolf,
  insect: IconInsect,
};

// Icona fallback (componente per cardIcon, stringa per compatibilità)
export const FALLBACK_ICON = IconQuestion;

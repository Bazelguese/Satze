// ============================================
// DATI ARMATE - Colori, Bonus, Simboli
// ============================================

// Importa le icone personalizzate
import { ARMY_ICONS } from './icons.jsx';

// Simboli mistici per ogni Armata
// NOTA: Le emoji sono state sostituite con icone personalizzate
// Usa il componente Icon con type="army" per renderizzarle
// Per compatibilità, manteniamo anche le emoji originali
export const ARMY_SYMBOLS = {
    'Figli dell\'Orizzonte': '☄️',
    'Kethran': '🏛️',
    'Corte Rossa': '🔥',
    'Calibri Pesanti': '⚙️',
    'Orathai': '🌙',
    'Mounthborn': '🦠',
    "L'Enclave delle Scaglie": '🐉',
    'Ratti della Megera': '🐀',
    'Patto degli Indocili': '🕶️',
    'Khemet': '𓂀',
    'Apex': '❄️',
    'Mascarada': '🎭'
  };

// Esporta anche le icone per uso diretto
export { ARMY_ICONS };
  
  // Accenti su asse oklch controllato — L 0.61–0.87, tinte a ≥24° di distanza.
  // `deep` (facoltativo): tinta di fondo/gradiente, non usata come accento UI.
  export const ARMY_COLORS = {
    "Figli dell'Orizzonte":    { bg: "from-purple-900 to-indigo-800", accent: "#a288fb", text: "text-purple-200" },
    "Kethran":                 { bg: "from-amber-900 to-yellow-800",  accent: "#eebf3c", text: "text-amber-200" },
    "Corte Rossa":             { bg: "from-red-900 to-rose-800",      accent: "#f8504f", text: "text-red-200" },
    "Calibri Pesanti":         { bg: "from-stone-800 to-zinc-700",    accent: "#a9a294", text: "text-stone-200" },
    "Orathai":                 { bg: "from-teal-900 to-cyan-900",     accent: "#5ad4bc", text: "text-teal-200" },
    "Mounthborn":              { bg: "from-lime-900 to-yellow-900",   accent: "#c9e238", text: "text-lime-200" },
    "L'Enclave delle Scaglie": { bg: "from-orange-900 to-amber-800",  accent: "#fb912d", text: "text-orange-200" },
    "Ratti della Megera":      { bg: "from-green-900 to-emerald-900", accent: "#40ad60", text: "text-green-200" },
    "Patto degli Indocili":    { bg: "from-fuchsia-900 to-pink-900",  accent: "#e867c3", text: "text-fuchsia-100" },
    "Khemet":                  { bg: "from-sky-900 to-cyan-900",      accent: "#26c4e8", text: "text-cyan-100" },
    "Apex":                    { bg: "from-slate-800 to-zinc-900",    accent: "#d5ecf9", text: "text-slate-100" },
    "Mascarada":               { bg: "from-blue-950 to-blue-900",     accent: "#437ef2", text: "text-blue-100", deep: "#0047AB" }
  };
  
  // Immagini armate - percorsi in public/Immagini_bg per gli sfondi sotto i triangoli delle mani
  // Immagini statiche (PNG) - meno distrazioni visive delle GIF
  export const ARMY_GIFS = {
    "Figli dell'Orizzonte": './Immagini_bg/Orizzonte_bg1.webp',
    "Kethran": './Immagini_bg/kethran_bg1.webp',
    "Corte Rossa": './Immagini_bg/CorteRossa_bg1.webp',
    "Calibri Pesanti": './Immagini_bg/Calibri_bg1.webp',
    "Orathai": './Immagini_bg/Orethai_bg1.webp',
    "Mounthborn": './Immagini_bg/Mounthborn_bg1.webp',
    "L'Enclave delle Scaglie": './Immagini_bg/Enclave_bg1.webp',
    "Ratti della Megera": './Immagini_bg/Ratti_bg1.webp',
    "Patto degli Indocili": './Immagini_bg/indocili-bg1.webp',
    "Khemet": './Immagini_bg/Khemet_bg1.webp',
    "Apex": './Immagini_bg/Apex_bg1.png',
    "Mascarada": './Immagini_bg/Mascarada_bg1.png'
  };

  // BONUS ARMATE (unico per ogni armata)
  export const ARMY_BONUSES = {
    "Figli dell'Orizzonte": {
      trigger: null,
      effects: [{ effect: "enemyAssault", value: -5, minAssault: 6 }],
      description: "-5 VA nem. (min 6)"
    },
    "Kethran": {
      trigger: "rimonta",
      effects: [{ effect: "power", value: 2 }],
      description: "Rimonta: +2 POT"
    },
    "Corte Rossa": {
      trigger: null,
      effects: [{ effect: "copyBonus", value: null }],
      description: "Copia Bonus nemico"
    },
    "Calibri Pesanti": {
      trigger: null,
      effects: [{ effect: "enemyDamage", value: -2, minDamage: 2 }],
      description: "-2 DAN nem. (min 2)"
    },
    "Orathai": {
      trigger: "reckoning",
      effects: [{ effect: "damage", value: 2 }],
      description: "Resa dei conti: +2 DAN"
    },
    "Mounthborn": {
      trigger: "imboscata",
      effects: [{ effect: "power", value: 1 }, { effect: "damage", value: 1 }],
      description: "Imboscata: +1 POT, +1 DAN"
    },
    "L'Enclave delle Scaglie": {
      trigger: "conquest",
      effects: [{ effect: "focusCoin", value: 2 }],
      description: "Conquista: +2 FC"
    },
    "Ratti della Megera": {
      trigger: "conquest",
      effects: [{ effect: "toxin", value: 1, minHealth: 10 }],
      description: "Conquista: Tossina 1 (min 10)"
    },
    "Patto degli Indocili": {
      trigger: "rinforzi",
      effects: [
        { effect: "enemyPower", value: -1, minPower: 2 },
        { effect: "enemyDamage", value: -1, minDamage: 2 }
      ],
      description: "Rinforzi: -1 POT, -1 DAN nem. (min 2)"
    },
    "Khemet": {
      trigger: "overdrive",
      effects: [{ effect: "immune", value: null }],
      description: "Overdrive: Immune"
    },
    "Apex": {
      trigger: "invasione",
      effects: [{ effect: "assaultValue", value: 5 }],
      description: "Invasione: +5 VA"
    },
    "Mascarada": {
      trigger: "opportunista",
      effects: [{ effect: "focusCoin", value: 2 }],
      description: "Opportunista: +2 FC"
    }
  };
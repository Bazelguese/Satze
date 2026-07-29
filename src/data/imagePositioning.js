// ============================================
// CONFIGURAZIONE POSIZIONAMENTO IMMAGINI
// ============================================
// 
// Questo file permette di regolare il posizionamento delle immagini delle carte
// che risultano decentrate, troppo in alto o troppo in basso.
//
// COME USARE:
// ===========
// 1. Per regolare una carta specifica, aggiungi il suo ID nella sezione 'cards'
// 2. Per regolare tutte le carte di un'armata, aggiungi l'armata nella sezione 'armies'
// 3. La configurazione per carta specifica ha priorità su quella dell'armata
//
// PARAMETRI:
// ==========
// - containerTop: sposta il container dell'immagine verticalmente
//   • Valori positivi spostano l'immagine più in basso (es: '5%', '10px')
//   • Valori negativi spostano l'immagine più in alto (es: '-5%', '-10px')
//   • Puoi usare percentuali (%) o pixel (px)
//
// - containerLeft: sposta il container dell'immagine orizzontalmente
//   • Valori positivi spostano l'immagine più a destra (es: '5%', '10px')
//   • Valori negativi spostano l'immagine più a sinistra (es: '-5%', '-10px')
//   • Utile quando objectPosition non ha effetto con objectFit: contain
//
// - objectPosition: controlla quale parte dell'immagine viene mostrata
//   • 'center center' - centra l'immagine (default)
//   • 'center top' - mostra la parte alta dell'immagine
//   • 'center bottom' - mostra la parte bassa dell'immagine
//   • 'center 30%' - mostra il 30% dall'alto dell'immagine
//   • 'center 70%' - mostra il 70% dall'alto (più in basso)
//   • '40% center' - sposta l'immagine a sinistra (per correggere immagini troppo a destra)
//   • '60% center' - sposta l'immagine a destra (per correggere immagini troppo a sinistra)
//
// ESEMPI PRATICI:
// ===============
// Immagine troppo in alto → spostala in basso:
//   401: { containerTop: '5%', objectPosition: 'center center' }
//
// Immagine troppo in basso → spostala in alto:
//   402: { containerTop: '-10%', objectPosition: 'center center' }
//
// Immagine decentrata verticalmente → mostra più la parte alta:
//   403: { containerTop: '0%', objectPosition: 'center 35%' }
//
// Immagine decentrata verticalmente → mostra più la parte bassa:
//   404: { containerTop: '0%', objectPosition: 'center 65%' }
//
// Combinazione: sposta in basso E mostra più la parte alta:
//   405: { containerTop: '8%', objectPosition: 'center 40%' }
//
// Per tutte le carte di un'armata:
//   'Calibri Pesanti': { containerTop: '-3%', objectPosition: 'center 45%' }

export const IMAGE_POSITIONING = {
  // Configurazione per armate (si applica a tutte le carte dell'armata)
  armies: {
    // 'Calibri Pesanti': {
    //   containerTop: '-5%',
    //   objectPosition: 'center center'
    // },
    // 'Figli dell\'Orizzonte': {
    //   containerTop: '0%',
    //   objectPosition: 'center 45%'
    // }
  },
  
  // Configurazione per carte specifiche (generata dal tool ritaglio; containerLeft arrotondato)
  cards: {
    101: { objectPosition: 'center 84%', scale: 107, containerLeft: '3.6%' },
    102: { objectPosition: 'center 61%', scale: 107, containerLeft: '2.4%' },
    103: { objectPosition: 'center 50%', scale: 105, containerLeft: '0.96%' },
    104: { objectPosition: 'center 100%', containerLeft: '0.72%' },
    105: { objectPosition: 'center 60%', containerLeft: '0.24%' },
    107: { objectPosition: 'center 50%', scale: 115, containerLeft: '7.44%' },
    108: { objectPosition: 'center 63%' },
    109: { objectPosition: 'center 100%', scale: 114, containerLeft: '1.92%' },
    110: { objectPosition: 'center 100%', scale: 107, containerLeft: '3.36%' },
    111: { objectPosition: 'center 81%', scale: 107, containerLeft: '2.64%' },
    113: { objectPosition: 'center 50%', scale: 108, containerLeft: '3.36%' },
    201: { objectPosition: 'center 50%', containerLeft: '2.88%' },
    202: { objectPosition: 'center 50%', scale: 116, containerLeft: '8.4%' },
    204: { objectPosition: 'center 130%', scale: 104, containerLeft: '0.96%' },
    205: { objectPosition: 'center 92%', scale: 116, containerLeft: '1.92%' },
    206: { objectPosition: 'center 125%', scale: 107, containerLeft: '1.92%' },
    209: { objectPosition: 'center 105%' },
    210: { objectPosition: 'center 150%', scale: 115, containerLeft: '0.96%' },
    211: { objectPosition: 'center 50%', scale: 110, containerLeft: '5.04%' },
    212: { objectPosition: 'center 50%', scale: 115 },
    213: { objectPosition: 'center 94%', scale: 110, containerLeft: '8.88%' },
    215: { objectPosition: 'center 150%', scale: 106 },
    216: { objectPosition: 'center 14%' },
    218: { objectPosition: 'center 150%' },
    220: { objectPosition: 'center 150%' },
    221: { objectPosition: 'center 77%', scale: 107 },
    222: { objectPosition: 'center 149%', scale: 117 },
    225: { objectPosition: 'center 58%', scale: 122 },
    226: { objectPosition: 'center 147%', scale: 106 },
    227: { objectPosition: 'center 95%', scale: 115 },
    228: { objectPosition: 'center 105%' },
    229: { objectPosition: 'center 125%' },
    230: { objectPosition: 'center 124%' },
    301: { objectPosition: 'center 122%', scale: 103 },
    302: { objectPosition: 'center 124%', scale: 108, containerLeft: '4.8%' },
    303: { objectPosition: 'center 139%', scale: 111 },
    304: { objectPosition: 'center 85%', scale: 119, containerLeft: '8.16%' },
    305: { objectPosition: 'center 95%', scale: 119, containerLeft: '10.32%' },
    306: { objectPosition: 'center 69%', scale: 109, containerLeft: '4.56%' },
    307: { objectPosition: 'center 69%', scale: 105, containerLeft: '2.4%' },
    308: { objectPosition: 'center 65%' },
    309: { objectPosition: 'center 57%', scale: 99, containerLeft: '0.72%' },
    311: { objectPosition: 'center 125%', scale: 110 },
    312: { objectPosition: 'center 64%' },
    313: { objectPosition: 'center 73%', scale: 105, containerLeft: '2.64%' },
    314: { objectPosition: 'center 83%', scale: 108, containerLeft: '-3.6%' },
    315: { objectPosition: 'center 50%', scale: 115, containerLeft: '6%' },
    318: { objectPosition: 'center 95%' },
    320: { objectPosition: 'center 150%' },
    322: { objectPosition: 'center 115%' },
    323: { objectPosition: 'center 143%' },
    325: { objectPosition: 'center 144%' },
    328: { objectPosition: 'center 68%' },
    330: { objectPosition: 'center 143%' },
    401: { objectPosition: 'center 115%', scale: 124, containerLeft: '-9.6%' },
    402: { objectPosition: 'center 150%', scale: 110, containerLeft: '4.8%' },
    403: { objectPosition: 'center 150%', scale: 106 },
    404: { objectPosition: 'center 106%', scale: 111, containerLeft: '2.64%' },
    405: { objectPosition: 'center 150%', scale: 118, containerLeft: '7.68%' },
    406: { objectPosition: 'center 84%', scale: 101, containerLeft: '1.44%' },
    407: { objectPosition: 'center 50%', containerLeft: '3.36%' },
    408: { objectPosition: 'center 131%', scale: 102, containerLeft: '0.72%' },
    409: { objectPosition: 'center 133%' },
    410: { objectPosition: 'center 50%', scale: 116, containerLeft: '9.12%' },
    411: { objectPosition: 'center 99%', scale: 105, containerLeft: '-2.4%' },
    413: { objectPosition: 'center 85%', scale: 118, containerLeft: '8.4%' },
    414: { objectPosition: 'center 77%', scale: 111, containerLeft: '5.04%' },
    415: { objectPosition: 'center 128%', scale: 112, containerLeft: '6.72%' },
    416: { objectPosition: 'center 149%' },
    418: { objectPosition: 'center 50%', scale: 150, containerLeft: '24%' },
    419: { objectPosition: 'center 78%', scale: 104, containerLeft: '2.16%' },
    420: { objectPosition: 'center 105%' },
    423: { objectPosition: 'center 93%', scale: 114, containerLeft: '-5.52%' },
    424: { objectPosition: 'center 106%', scale: 119, containerLeft: '0.96%' },
    428: { objectPosition: 'center 128%', scale: 137, containerLeft: '6%' },
    429: { objectPosition: 'center 108%', scale: 121, containerLeft: '1.44%' },
    430: { objectPosition: 'center 70%', scale: 104, containerLeft: '0.96%' },
    501: { objectPosition: 'center 50%', containerLeft: '3.36%' },
    504: { objectPosition: 'center 83%' },
    505: { objectPosition: 'center 109%' },
    506: { objectPosition: 'center 102%' },
    508: { objectPosition: 'center 86%', scale: 107, containerLeft: '4.56%' },
    509: { objectPosition: 'center 76%', scale: 105, containerLeft: '3.12%' },
    510: { objectPosition: 'center 112%' },
    511: { objectPosition: 'center 50%', containerLeft: '0.48%' },
    512: { objectPosition: 'center 120%' },
    515: { objectPosition: 'center 125%' },
    517: { objectPosition: 'center 61%' },
    518: { objectPosition: 'center 150%' },
    519: { objectPosition: 'center 56%' },
    520: { objectPosition: 'center 14%', scale: 113 },
    524: { objectPosition: 'center 117%', scale: 122 },
    525: { objectPosition: 'center 150%' },
    526: { objectPosition: 'center 150%' },
    528: { objectPosition: 'center 67%' },
    529: { objectPosition: 'center 150%' },
    530: { objectPosition: 'center 71%', scale: 115, containerLeft: '4.56%' },
    601: { objectPosition: 'center 50%', scale: 115, containerLeft: '2.88%' },
    602: { objectPosition: 'center 50%', scale: 110, containerLeft: '1.44%' },
    603: { objectPosition: 'center 65%', scale: 116, containerLeft: '4.56%' },
    604: { objectPosition: 'center 73%', scale: 111, containerLeft: '5.52%' },
    605: { objectPosition: 'center 28%', scale: 119, containerLeft: '3.6%' },
    606: { objectPosition: 'center 50%', scale: 123, containerLeft: '10.8%' },
    607: { objectPosition: 'center 50%', scale: 106 },
    609: { objectPosition: 'center 100%', scale: 112, containerLeft: '4.32%' },
    610: { objectPosition: 'center 50%', scale: 111, containerLeft: '2.88%' },
    611: { objectPosition: 'center 92%', scale: 128, containerLeft: '2.16%' },
    612: { objectPosition: 'center 50%', scale: 124, containerLeft: '7.68%' },
    613: { objectPosition: 'center 72%', scale: 127, containerLeft: '2.4%' },
    614: { objectPosition: 'center 50%', scale: 122, containerLeft: '2.16%' },
    615: { objectPosition: 'center 50%', scale: 113, containerLeft: '0.96%' },
    616: { objectPosition: 'center 150%' },
    618: { objectPosition: 'center 20%', scale: 122, containerLeft: '1.68%' },
    620: { objectPosition: 'center 50%', scale: 104, containerLeft: '1.68%' },
    623: { objectPosition: 'center 55%', scale: 110 },
    624: { objectPosition: 'center 83%', scale: 106 },
    625: { objectPosition: 'center 64%' },
    626: { objectPosition: 'center 127%' },
    627: { objectPosition: 'center 103%', scale: 113 },
    628: { objectPosition: 'center 67%' },
    629: { objectPosition: 'center -24%' },
    630: { objectPosition: 'center 65%' },
    701: { objectPosition: 'center 57%', scale: 110, containerLeft: '4.56%' },
    702: { objectPosition: 'center 59%', scale: 111, containerLeft: '5.28%' },
    703: { objectPosition: 'center 0%', scale: 110, containerLeft: '4.32%' },
    706: { objectPosition: 'center 100%', scale: 98, containerLeft: '-0.48%' },
    707: { objectPosition: 'center 70%', scale: 107, containerLeft: '3.84%' },
    709: { objectPosition: 'center 80%', scale: 105, containerLeft: '-1.68%' },
    712: { objectPosition: 'center 94%' },
    713: { objectPosition: 'center 63%', scale: 106, containerLeft: '2.4%' },
    714: { objectPosition: 'center 58%' },
    715: { objectPosition: 'center 68%' },
    721: { objectPosition: 'center 109%' },
    722: { objectPosition: 'center 115%' },
    723: { objectPosition: 'center 99%' },
    724: { objectPosition: 'center -23%', scale: 116 },
    727: { objectPosition: 'center 117%' },
    801: { objectPosition: 'center 50%', scale: 105, containerLeft: '2.64%' },
    802: { objectPosition: 'center 55%', scale: 110, containerLeft: '1.68%' },
    804: { objectPosition: 'center 50%', scale: 104, containerLeft: '3.12%' },
    805: { objectPosition: 'center 81%', scale: 109, containerLeft: '-4.56%' },
    806: { objectPosition: 'center 63%', scale: 103, containerLeft: '2.64%' },
    808: { objectPosition: 'center 98%' },
    809: { objectPosition: 'center 20%', scale: 117 },
    810: { objectPosition: 'center 100%' },
    811: { objectPosition: 'center 21%', scale: 108, containerLeft: '6.48%' },
    812: { objectPosition: 'center 100%', scale: 108, containerLeft: '2.64%' },
    813: { objectPosition: 'center 84%', scale: 107, containerLeft: '3.12%' },
    814: { objectPosition: 'center 50%', scale: 110, containerLeft: '5.28%' },
    815: { objectPosition: 'center 100%', scale: 115, containerLeft: '4.56%' },
    821: { objectPosition: 'center 146%' },
    823: { objectPosition: 'center 150%' },
    824: { objectPosition: 'center 77%' },
    825: { objectPosition: 'center 83%' },
    826: { objectPosition: 'center 150%' },
    828: { objectPosition: 'center 65%' },
    829: { objectPosition: 'center 23%' },
    902: { objectPosition: 'center 140%' },
    903: { objectPosition: 'center 115%' },
    905: { objectPosition: 'center 93%', scale: 104, containerLeft: '2.16%' },
    906: { objectPosition: 'center 103%' },
    907: { objectPosition: 'center 111%', containerLeft: '2.4%' },
    909: { objectPosition: 'center 50%', scale: 126, containerLeft: '3.6%' },
    910: { objectPosition: 'center 95%' },
    911: { objectPosition: 'center 112%' },
    912: { objectPosition: 'center 150%' },
    913: { objectPosition: 'center 98%' },
    914: { objectPosition: 'center 142%', scale: 113, containerLeft: '4.32%' },
    915: { objectPosition: 'center 131%' },
    916: { objectPosition: 'center 150%' },
    917: { objectPosition: 'center 30%', scale: 120, containerLeft: '2.4%' },
    918: { objectPosition: 'center 50%', scale: 99 },
    921: { objectPosition: 'center 125%' },
    922: { objectPosition: 'center 55%', scale: 104, containerLeft: '2.16%' },
    924: { objectPosition: 'center 42%' },
    927: { objectPosition: 'center 73%' },
    928: { objectPosition: 'center 26%' },
    929: { objectPosition: 'center 68%' },
    930: { objectPosition: 'center 137%' },
    1001: { objectPosition: 'center 46%', scale: 112 },
    1002: { objectPosition: 'center 49%', scale: 110 },
    1003: { objectPosition: 'center 92%', scale: 109 },
    1004: { objectPosition: 'center 77%' },
    1005: { objectPosition: 'center 61%', scale: 119 },
    1006: { objectPosition: 'center 93%', scale: 110 },
    1007: { objectPosition: 'center 50%', scale: 111 },
    1008: { objectPosition: 'center 100%', scale: 117 },
    1009: { objectPosition: 'center 50%', scale: 114 },
    1010: { objectPosition: 'center 32%', scale: 143, containerLeft: '3.12%' },
    1011: { objectPosition: 'center 50%', scale: 116 },
    1012: { objectPosition: 'center 50%', scale: 122, containerLeft: '4.56%' },
    1013: { objectPosition: 'center 58%', scale: 115 },
    1014: { objectPosition: 'center 50%', scale: 110 },
    1015: { objectPosition: 'center 96%', scale: 111 },
    1016: { objectPosition: 'center 50%', scale: 112 },
    1017: { objectPosition: 'center 50%', scale: 111 },
    1018: { objectPosition: 'center 50%', scale: 109 },
    1019: { objectPosition: 'center 50%', scale: 112 },
    1020: { objectPosition: 'center 50%', scale: 117 },
    1101: { objectPosition: 'center 114%' },
    1102: { objectPosition: 'center 2%' },
    1103: { objectPosition: 'center 36%' },
    1104: { objectPosition: 'center 58%' },
    1105: { objectPosition: 'center 48%' },
    1106: { objectPosition: 'center -50%', scale: 122 },
    1108: { objectPosition: 'center 45%', scale: 119 },
    1109: { objectPosition: 'center 150%', scale: 132 },
    1110: { objectPosition: 'center 140%', scale: 101 },
    1114: { objectPosition: 'center 65%' },
    1115: { objectPosition: 'center 84%' },
    1116: { objectPosition: 'center 92%' },
    1117: { objectPosition: 'center 24%', scale: 117, containerLeft: '-2.16%' },
    1118: { objectPosition: 'center 77%' },
    1122: { objectPosition: 'center 134%', scale: 112, containerLeft: '1.68%' },
    1126: { objectPosition: 'center 127%' },
    1127: { objectPosition: 'center 52%' },
    1129: { objectPosition: 'center 67%' },
  }
};

/**
 * Ottiene la configurazione di posizionamento per una carta specifica
 * @param {number} cardId - ID della carta
 * @param {string} army - Nome dell'armata
 * @returns {Object} Configurazione con containerTop e objectPosition
 */
export function getImagePositioning(cardId, army) {
  // Prima controlla se c'è una configurazione specifica per questa carta
  if (IMAGE_POSITIONING.cards[cardId]) {
    return IMAGE_POSITIONING.cards[cardId];
  }
  
  // Poi controlla se c'è una configurazione per l'armata
  if (army && IMAGE_POSITIONING.armies[army]) {
    return IMAGE_POSITIONING.armies[army];
  }
  
  // Valori di default
  return {
    containerTop: undefined, // userà il valore di default del componente
    containerLeft: undefined, // nessuno spostamento orizzontale
    objectPosition: undefined // userà il valore di default del componente
  };
}

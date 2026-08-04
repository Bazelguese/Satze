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
    101: { containerLeft: '3.6%', objectPosition: 'center 84%', scale: 107 },
    102: { containerLeft: '2.4%', objectPosition: 'center 61%', scale: 107 },
    103: { containerLeft: '0.96%', objectPosition: 'center 50%', scale: 105 },
    104: { containerLeft: '0.72%', objectPosition: 'center 100%' },
    105: { containerLeft: '0.24%', objectPosition: 'center 60%' },
    107: { containerLeft: '7.44%', objectPosition: 'center 50%', scale: 115 },
    108: { objectPosition: 'center 63%' },
    109: { containerLeft: '1.92%', objectPosition: 'center 100%', scale: 114 },
    110: { containerLeft: '3.36%', objectPosition: 'center 100%', scale: 107 },
    111: { containerLeft: '2.64%', objectPosition: 'center 81%', scale: 107 },
    113: { containerLeft: '3.36%', objectPosition: 'center 50%', scale: 108 },
    201: { containerLeft: '2.88%', objectPosition: 'center 50%' },
    202: { containerLeft: '8.4%', objectPosition: 'center 50%', scale: 116 },
    204: { containerLeft: '0.96%', objectPosition: 'center 130%', scale: 104 },
    205: { containerLeft: '1.92%', objectPosition: 'center 92%', scale: 116 },
    206: { containerLeft: '1.92%', objectPosition: 'center 125%', scale: 107 },
    209: { objectPosition: 'center 105%' },
    210: { containerLeft: '0.96%', objectPosition: 'center 150%', scale: 115 },
    211: { containerLeft: '5.04%', objectPosition: 'center 50%', scale: 110 },
    212: { objectPosition: 'center 50%', scale: 115 },
    213: { containerLeft: '8.88%', objectPosition: 'center 94%', scale: 110 },
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
    302: { containerLeft: '4.8%', objectPosition: 'center 124%', scale: 108 },
    303: { objectPosition: 'center 139%', scale: 111 },
    304: { containerLeft: '8.16%', objectPosition: 'center 85%', scale: 119 },
    305: { containerLeft: '10.32%', objectPosition: 'center 95%', scale: 119 },
    306: { containerLeft: '4.56%', objectPosition: 'center 69%', scale: 109 },
    307: { containerLeft: '2.4%', objectPosition: 'center 69%', scale: 105 },
    308: { objectPosition: 'center 65%' },
    309: { containerLeft: '0.72%', objectPosition: 'center 57%', scale: 99 },
    311: { objectPosition: 'center 125%', scale: 110 },
    312: { objectPosition: 'center 64%' },
    313: { containerLeft: '2.64%', objectPosition: 'center 73%', scale: 105 },
    314: { containerLeft: '-3.6%', objectPosition: 'center 83%', scale: 108 },
    315: { containerLeft: '6%', objectPosition: 'center 50%', scale: 115 },
    318: { objectPosition: 'center 95%' },
    320: { objectPosition: 'center 150%' },
    322: { objectPosition: 'center 115%' },
    323: { objectPosition: 'center 143%' },
    325: { objectPosition: 'center 144%' },
    328: { objectPosition: 'center 68%' },
    330: { objectPosition: 'center 143%' },
    401: { containerLeft: '-9.6%', objectPosition: 'center 115%', scale: 124 },
    402: { containerLeft: '4.8%', objectPosition: 'center 150%', scale: 110 },
    403: { objectPosition: 'center 150%', scale: 106 },
    404: { containerLeft: '2.64%', objectPosition: 'center 106%', scale: 111 },
    405: { containerLeft: '7.68%', objectPosition: 'center 150%', scale: 118 },
    406: { containerLeft: '1.44%', objectPosition: 'center 84%', scale: 101 },
    407: { containerLeft: '3.36%', objectPosition: 'center 50%' },
    408: { containerLeft: '0.72%', objectPosition: 'center 131%', scale: 102 },
    409: { objectPosition: 'center 133%' },
    410: { containerLeft: '9.12%', objectPosition: 'center 50%', scale: 116 },
    411: { containerLeft: '-2.4%', objectPosition: 'center 99%', scale: 105 },
    413: { containerLeft: '8.4%', objectPosition: 'center 85%', scale: 118 },
    414: { containerLeft: '5.04%', objectPosition: 'center 77%', scale: 111 },
    415: { containerLeft: '6.72%', objectPosition: 'center 128%', scale: 112 },
    416: { objectPosition: 'center 149%' },
    418: { containerLeft: '24%', objectPosition: 'center 50%', scale: 150 },
    419: { containerLeft: '2.16%', objectPosition: 'center 78%', scale: 104 },
    420: { objectPosition: 'center 105%' },
    423: { containerLeft: '-5.52%', objectPosition: 'center 93%', scale: 114 },
    424: { containerLeft: '0.96%', objectPosition: 'center 106%', scale: 119 },
    428: { containerLeft: '6%', objectPosition: 'center 128%', scale: 137 },
    429: { containerLeft: '1.44%', objectPosition: 'center 108%', scale: 121 },
    430: { containerLeft: '0.96%', objectPosition: 'center 70%', scale: 104 },
    501: { containerLeft: '3.36%', objectPosition: 'center 50%' },
    504: { objectPosition: 'center 83%' },
    505: { objectPosition: 'center 109%' },
    506: { objectPosition: 'center 102%' },
    508: { containerLeft: '4.56%', objectPosition: 'center 86%', scale: 107 },
    509: { containerLeft: '3.12%', objectPosition: 'center 76%', scale: 105 },
    510: { objectPosition: 'center 112%' },
    511: { containerLeft: '0.48%', objectPosition: 'center 50%' },
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
    530: { containerLeft: '4.56%', objectPosition: 'center 71%', scale: 115 },
    601: { containerLeft: '2.88%', objectPosition: 'center 50%', scale: 115 },
    602: { containerLeft: '1.44%', objectPosition: 'center 50%', scale: 110 },
    603: { containerLeft: '4.56%', objectPosition: 'center 65%', scale: 116 },
    604: { containerLeft: '5.52%', objectPosition: 'center 73%', scale: 111 },
    605: { containerLeft: '3.6%', objectPosition: 'center 28%', scale: 119 },
    606: { containerLeft: '10.8%', objectPosition: 'center 50%', scale: 123 },
    607: { objectPosition: 'center 50%', scale: 106 },
    609: { containerLeft: '4.32%', objectPosition: 'center 100%', scale: 112 },
    610: { containerLeft: '2.88%', objectPosition: 'center 50%', scale: 111 },
    611: { containerLeft: '2.16%', objectPosition: 'center 92%', scale: 128 },
    612: { containerLeft: '7.68%', objectPosition: 'center 50%', scale: 124 },
    613: { containerLeft: '2.4%', objectPosition: 'center 72%', scale: 127 },
    614: { containerLeft: '2.16%', objectPosition: 'center 50%', scale: 122 },
    615: { containerLeft: '0.96%', objectPosition: 'center 50%', scale: 113 },
    616: { objectPosition: 'center 150%' },
    618: { containerLeft: '1.68%', objectPosition: 'center 20%', scale: 122 },
    620: { containerLeft: '1.68%', objectPosition: 'center 50%', scale: 104 },
    623: { objectPosition: 'center 55%', scale: 110 },
    624: { objectPosition: 'center 83%', scale: 106 },
    625: { objectPosition: 'center 64%' },
    626: { objectPosition: 'center 127%' },
    627: { objectPosition: 'center 103%', scale: 113 },
    628: { objectPosition: 'center 67%' },
    629: { objectPosition: 'center -24%' },
    630: { objectPosition: 'center 65%' },
    701: { containerLeft: '4.56%', objectPosition: 'center 57%', scale: 110 },
    702: { containerLeft: '5.28%', objectPosition: 'center 59%', scale: 111 },
    703: { containerLeft: '4.32%', objectPosition: 'center 0%', scale: 110 },
    706: { containerLeft: '-0.48%', objectPosition: 'center 100%', scale: 98 },
    707: { containerLeft: '3.84%', objectPosition: 'center 70%', scale: 107 },
    709: { containerLeft: '-1.68%', objectPosition: 'center 80%', scale: 105 },
    712: { objectPosition: 'center 94%' },
    713: { containerLeft: '2.4%', objectPosition: 'center 63%', scale: 106 },
    714: { objectPosition: 'center 58%' },
    715: { objectPosition: 'center 68%' },
    721: { objectPosition: 'center 109%' },
    722: { objectPosition: 'center 115%' },
    723: { objectPosition: 'center 99%' },
    724: { objectPosition: 'center -23%', scale: 116 },
    727: { objectPosition: 'center 117%' },
    801: { containerLeft: '2.64%', objectPosition: 'center 50%', scale: 105 },
    802: { containerLeft: '1.68%', objectPosition: 'center 55%', scale: 110 },
    804: { containerLeft: '3.12%', objectPosition: 'center 50%', scale: 104 },
    805: { containerLeft: '-4.56%', objectPosition: 'center 81%', scale: 109 },
    806: { containerLeft: '2.64%', objectPosition: 'center 63%', scale: 103 },
    808: { objectPosition: 'center 98%' },
    809: { objectPosition: 'center 20%', scale: 117 },
    810: { objectPosition: 'center 100%' },
    811: { containerLeft: '6.48%', objectPosition: 'center 21%', scale: 108 },
    812: { containerLeft: '2.64%', objectPosition: 'center 100%', scale: 108 },
    813: { containerLeft: '3.12%', objectPosition: 'center 84%', scale: 107 },
    814: { containerLeft: '5.28%', objectPosition: 'center 50%', scale: 110 },
    815: { containerLeft: '4.56%', objectPosition: 'center 100%', scale: 115 },
    821: { objectPosition: 'center 146%' },
    823: { objectPosition: 'center 150%' },
    824: { objectPosition: 'center 77%' },
    825: { objectPosition: 'center 83%' },
    826: { objectPosition: 'center 150%' },
    828: { objectPosition: 'center 65%' },
    829: { objectPosition: 'center 23%' },
    902: { objectPosition: 'center 140%' },
    903: { objectPosition: 'center 115%' },
    905: { containerLeft: '2.16%', objectPosition: 'center 93%', scale: 104 },
    906: { objectPosition: 'center 103%' },
    907: { containerLeft: '2.4%', objectPosition: 'center 111%' },
    909: { containerLeft: '3.6%', objectPosition: 'center 50%', scale: 126 },
    910: { objectPosition: 'center 95%' },
    911: { objectPosition: 'center 112%' },
    912: { objectPosition: 'center 150%' },
    913: { objectPosition: 'center 98%' },
    914: { containerLeft: '4.32%', objectPosition: 'center 142%', scale: 113 },
    915: { objectPosition: 'center 131%' },
    916: { objectPosition: 'center 150%' },
    917: { containerLeft: '2.4%', objectPosition: 'center 30%', scale: 120 },
    918: { objectPosition: 'center 50%', scale: 99 },
    921: { objectPosition: 'center 125%' },
    922: { containerLeft: '2.16%', objectPosition: 'center 55%', scale: 104 },
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
    1010: { containerLeft: '3.12%', objectPosition: 'center 32%', scale: 143 },
    1011: { objectPosition: 'center 50%', scale: 116 },
    1012: { containerLeft: '4.56%', objectPosition: 'center 50%', scale: 122 },
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
    1117: { containerLeft: '-2.16%', objectPosition: 'center 24%', scale: 117 },
    1118: { objectPosition: 'center 77%' },
    1122: { containerLeft: '1.68%', objectPosition: 'center 134%', scale: 112 },
    1126: { objectPosition: 'center 127%' },
    1127: { objectPosition: 'center 52%' },
    1129: { objectPosition: 'center 67%' },
    1206: { objectPosition: 'center 121%' },
    1207: { containerLeft: '-0.24%', objectPosition: 'center -20%' },
    1209: { objectPosition: 'center 62%' },
    1211: { objectPosition: 'center 33%' },
    1215: { containerLeft: '3.12%', objectPosition: 'center 37%', scale: 114 },
    1217: { objectPosition: 'center 76%' },
    1220: { containerLeft: '-1.44%', objectPosition: 'center 89%', scale: 126 },
    1221: { objectPosition: 'center 125%' },
    1223: { objectPosition: 'center 59%' },
    1224: { objectPosition: 'center 62%' },
    1228: { containerLeft: '1.68%', objectPosition: 'center -11%', scale: 112 },
    1229: { objectPosition: 'center -39%' },
    1230: { containerLeft: '-0.96%', objectPosition: 'center 112%', scale: 133 },
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

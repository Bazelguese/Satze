// ============================================
// LORE & STILE delle Armate per la schermata di selezione
// ============================================
// Questo è l'UNICO file che il game designer deve modificare per
// cambiare i testi della schermata "Scegli la tua armata".
// I dati di gameplay (carte, bonus, colori) restano in /data/.
// ============================================

export const ARMY_LORE = {
  "Figli dell'Orizzonte": {
    glyph: '☄',
    bonusLabel: 'PASSIVO',
    sub: '15 CARTE • 2 ESERCITI',
    lore: "Vegliano sui confini del cielo. La loro presenza basta a dissuadere l'attacco.",
    style: 'Controllo a distanza. Riducono l\'aggressione nemica fin da turno uno.',
    keywords: ['Controllo', 'Cosmico', 'Difesa'],
    stats: { aggressione: 35, difesa: 80, tempo: 60, difficolta: 50 },
  },
  "Kethran": {
    glyph: '☥',
    bonusLabel: 'RIMONTA',
    sub: '15 CARTE • 2 ESERCITI',
    lore: 'Risorgono dalle ceneri delle proprie sconfitte. Ogni ferita è un\'opportunità.',
    style: 'Comeback. Più sei in svantaggio, più diventano pericolosi.',
    keywords: ['Rimonta', 'Sacro', 'Resilienza'],
    stats: { aggressione: 70, difesa: 55, tempo: 65, difficolta: 70 },
  },
  "Corte Rossa": {
    glyph: '🜂',
    bonusLabel: 'COPIA',
    sub: '15 CARTE • 2 ESERCITI',
    lore: 'Imitano i loro nemici. Ciò che vedono, lo diventano.',
    style: 'Adattamento. Copiano i bonus avversari e li ritorcono contro.',
    keywords: ['Mirror', 'Adattivo', 'Caos'],
    stats: { aggressione: 65, difesa: 60, tempo: 50, difficolta: 80 },
  },
  "Calibri Pesanti": {
    glyph: '⚙',
    bonusLabel: 'PASSIVO',
    sub: '15 CARTE • 2 ESERCITI',
    lore: 'Macchine forgiate per resistere. Niente penetra il loro acciaio.',
    style: 'Tank puro. Riduzione costante del danno nemico.',
    keywords: ['Tank', 'Industriale', 'Mitigazione'],
    stats: { aggressione: 40, difesa: 90, tempo: 45, difficolta: 35 },
  },
  "Orathai": {
    glyph: '🌙',
    bonusLabel: 'RESA DEI CONTI',
    sub: '15 CARTE • 2 ESERCITI',
    lore: 'Aspettano il momento giusto. Quando colpiscono, è già finita.',
    style: 'Burst tardivo. Esplodono nelle fasi finali con +DAN devastante.',
    keywords: ['Burst', 'Lunare', 'Pazienza'],
    stats: { aggressione: 75, difesa: 50, tempo: 80, difficolta: 65 },
  },
  "Mounthborn": {
    glyph: '◬',
    bonusLabel: 'IMBOSCATA',
    sub: '15 CARTE • 2 ESERCITI',
    lore: 'Si muovono nelle ombre della foresta. Quando li vedi, è troppo tardi.',
    style: 'Attacco a sorpresa. Bonus combinato POT+DAN su imboscata.',
    keywords: ['Imboscata', 'Selvaggio', 'Tattico'],
    stats: { aggressione: 75, difesa: 45, tempo: 70, difficolta: 60 },
  },
  "L'Enclave delle Scaglie": {
    glyph: '🐉',
    bonusLabel: 'CONQUISTA',
    sub: '15 CARTE • 2 ESERCITI',
    lore: 'Antichi guardiani del territorio. Ogni terra conquistata li rinforza.',
    style: 'Snowball territoriale. +Focus Coin per ogni conquista.',
    keywords: ['Conquista', 'Drago', 'Risorse'],
    stats: { aggressione: 60, difesa: 70, tempo: 55, difficolta: 55 },
  },
  "Ratti della Megera": {
    glyph: '⚗',
    bonusLabel: 'CONQUISTA',
    sub: '15 CARTE • 2 ESERCITI',
    lore: 'Avvelenano l\'aria, l\'acqua, la mente. Vincono per attrito.',
    style: 'Tossina e attrito. Vincono le partite lunghe consumando il nemico.',
    keywords: ['Veleno', 'Attrito', 'Subdolo'],
    stats: { aggressione: 55, difesa: 60, tempo: 85, difficolta: 70 },
  },
  "Patto degli Indocili": {
    glyph: '◈',
    bonusLabel: 'RINFORZI',
    sub: '15 CARTE • 2 ESERCITI',
    lore: 'Mai uniti, mai sconfitti. La debolezza altrui è la loro forza.',
    style: 'Debuff doppio. Riducono POT e DAN nemici quando arrivano i rinforzi.',
    keywords: ['Debuff', 'Anarchico', 'Soppressione'],
    stats: { aggressione: 50, difesa: 65, tempo: 70, difficolta: 75 },
  },
  "Khemet": {
    glyph: '𓂀',
    bonusLabel: 'OVERDRIVE',
    sub: '15 CARTE • 2 ESERCITI',
    lore: 'Tecnologia oltre il visibile. Quando si attivano, nulla li ferma.',
    style: 'Power spike. Immunità totale durante l\'overdrive.',
    keywords: ['Tech', 'Overdrive', 'Immunità'],
    stats: { aggressione: 80, difesa: 75, tempo: 60, difficolta: 85 },
  },
};

// Entry sintetica per "Eserciti Misti" (multi-armata)
export const MIXED_ARMIES_LORE = {
  lore: 'Coalizioni eterodosse di carte da armate diverse. Versatili, imprevedibili, difficili da pilotare.',
  style: 'Deck composti da carte provenienti da armate diverse. Massima flessibilità, nessun bonus armata.',
  keywords: ['Multi-Armata', 'Versatile', 'Avanzato'],
  stats: { aggressione: 60, difesa: 60, tempo: 60, difficolta: 90 },
};

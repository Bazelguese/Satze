// Elenco leggero degli effetti (solo nomi), per i menu del gioco: importarlo non carica
// shader né renderer. Deve restare allineato a FX_EFFECTS (lo verifica
// catalog.integration.test.js).

export const FX_CATALOG = [
  { id: 'burn', label: 'Bruciatura', kind: 'out', army: null },
  { id: 'dust', label: 'Disintegrazione', kind: 'out', army: null },
  { id: 'shatter', label: 'Frattura di luce', kind: 'out', army: null },
  { id: 'vortex', label: 'Vortice', kind: 'out', army: null },
  { id: 'materialize', label: 'Materializzazione', kind: 'in', army: null },
  { id: 'figli-domanda', label: 'La Domanda', kind: 'out', army: "Figli dell'Orizzonte" },
  { id: 'kethran-fenice', label: 'Fenice', kind: 'in', army: 'Kethran' },
  { id: 'corte-specchio', label: 'Specchio infranto', kind: 'out', army: 'Corte Rossa' },
  { id: 'calibri-pressa', label: 'Pressa', kind: 'out', army: 'Calibri Pesanti' },
  { id: 'orathai-eclissi', label: 'Eclissi', kind: 'out', army: 'Orathai' },
  { id: 'mounthborn-rovi', label: 'Rovi', kind: 'out', army: 'Mounthborn' },
  { id: 'enclave-muta', label: 'Muta', kind: 'out', army: "L'Enclave delle Scaglie" },
  { id: 'ratti-corrosione', label: 'Corrosione', kind: 'out', army: 'Ratti della Megera' },
  { id: 'patto-strappo', label: 'Strappo', kind: 'out', army: 'Patto degli Indocili' },
  { id: 'khemet-derez', label: 'Derez', kind: 'out', army: 'Khemet' },
  { id: 'apex-artigliata', label: 'Artigliata', kind: 'out', army: 'Apex' },
  { id: 'mascarada-finale', label: 'Gran finale', kind: 'out', army: 'Mascarada' },
  { id: 'concordia-consacrazione', label: 'Consacrazione', kind: 'out', army: 'Concordia di Caelion' },
];

/** Parametro URL con cui il lab apre direttamente un effetto (?cardFxLab=1&fx=<id>). */
export const FX_LAB_PARAM = 'fx';

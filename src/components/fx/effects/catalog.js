// Elenco leggero degli effetti (solo nomi), per i menu del gioco: importarlo non carica
// shader né renderer. Deve restare allineato a FX_EFFECTS (lo verifica
// catalog.integration.test.js).

export const FX_CATALOG = [
  { id: 'burn', label: 'Bruciatura', kind: 'out', army: null, role: null },
  { id: 'dust', label: 'Disintegrazione', kind: 'out', army: null, role: null },
  { id: 'shatter', label: 'Frattura di luce', kind: 'out', army: null, role: null },
  { id: 'vortex', label: 'Vortice', kind: 'out', army: null, role: null },
  { id: 'eclissi', label: 'Eclissi', kind: 'out', army: null, role: null },
  { id: 'specchio', label: 'Specchio infranto', kind: 'out', army: null, role: null },
  { id: 'derez', label: 'Derez', kind: 'out', army: null, role: null },
  { id: 'materialize', label: 'Materializzazione', kind: 'in', army: null, role: null },
  { id: 'figli-nebula', label: 'Nebula', kind: 'in', army: "Figli dell'Orizzonte", role: 'entry' },
  { id: 'figli-domanda', label: 'La Domanda', kind: 'out', army: "Figli dell'Orizzonte", role: 'defeat' },
  { id: 'kethran-fenice', label: 'Fenice', kind: 'in', army: 'Kethran', role: 'entry' },
  { id: 'kethran-mutilazione', label: 'Mutilazione', kind: 'out', army: 'Kethran', role: 'defeat' },
  { id: 'corte-fiammata', label: 'Fiammata', kind: 'in', army: 'Corte Rossa', role: 'entry' },
  { id: 'corte-contratto', label: 'Contratto consumato', kind: 'out', army: 'Corte Rossa', role: 'defeat' },
  { id: 'calibri-corazza', label: 'Corazza', kind: 'in', army: 'Calibri Pesanti', role: 'entry' },
  { id: 'calibri-pressa', label: 'Pressa', kind: 'out', army: 'Calibri Pesanti', role: 'defeat' },
  { id: 'orathai-rovi', label: 'Rovi', kind: 'out', army: 'Orathai', role: 'defeat' },
  { id: 'mounthborn-fame', label: 'Fame', kind: 'out', army: 'Mounthborn', role: 'defeat' },
  { id: 'enclave-tesoro', label: 'Tesoro', kind: 'in', army: "L'Enclave delle Scaglie", role: 'entry' },
  { id: 'enclave-muta', label: 'Muta', kind: 'out', army: "L'Enclave delle Scaglie", role: 'defeat' },
  { id: 'ratti-pozza', label: 'Pozza', kind: 'in', army: 'Ratti della Megera', role: 'entry' },
  { id: 'ratti-corrosione', label: 'Corrosione', kind: 'out', army: 'Ratti della Megera', role: 'defeat' },
  { id: 'patto-ricucitura', label: 'Ricucitura', kind: 'in', army: 'Patto degli Indocili', role: 'entry' },
  { id: 'patto-strappo', label: 'Strappo', kind: 'out', army: 'Patto degli Indocili', role: 'defeat' },
  { id: 'khemet-sigillo', label: 'Sigillo', kind: 'out', army: 'Khemet', role: 'defeat' },
  { id: 'apex-artigliata', label: 'Artigliata', kind: 'out', army: 'Apex', role: 'defeat' },
  { id: 'mascarada-finale', label: 'Gran finale', kind: 'out', army: 'Mascarada', role: 'defeat' },
  { id: 'concordia-consacrazione', label: 'Consacrazione', kind: 'out', army: 'Concordia di Caelion', role: 'defeat' },
];

/** Parametro URL con cui il lab apre direttamente un effetto (?cardFxLab=1&fx=<id>). */
export const FX_LAB_PARAM = 'fx';

/** Parametro URL con cui il lab apre la vista «Per armata» su un'armata (?cardFxLab=1&fxArmy=<armata>). */
export const FX_LAB_ARMY_PARAM = 'fxArmy';

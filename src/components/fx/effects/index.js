// Registro degli effetti su elemento: ognuno è una definizione da passare a <ElementFx effect=…>.
//
// Ogni armata ha (o avrà) due animazioni:
// - role 'entry': come entra in campo un suo agente;
// - role 'defeat': la fine che fa fare all'agente che batte (si gioca sul perdente, nel
//   colore dell'armata vincitrice).
import { burnEffect } from './burn.js';
import { dustEffect } from './dust.js';
import { shatterEffect } from './shatter.js';
import { vortexEffect } from './vortex.js';
import { materializeEffect } from './materialize.js';
import { eclipseEffect } from './eclipse.js';
import { mirrorEffect } from './mirror.js';
import { derezEffect } from './derez.js';
import { figliEffect } from './armies/figli.js';
import { kethranEffect } from './armies/kethran.js';
import { kethranSchiantoEffect } from './armies/kethranSchianto.js';
import { corteContrattoEffect } from './armies/corteContratto.js';
import { calibriEffect } from './armies/calibri.js';
import { orathaiRoviEffect } from './armies/orathaiRovi.js';
import { mounthbornFameEffect } from './armies/mounthbornFame.js';
import { enclaveEffect } from './armies/enclave.js';
import { rattiEffect } from './armies/ratti.js';
import { pattoRafficaEffect } from './armies/pattoRaffica.js';
import { khemetSigilloEffect } from './armies/khemetSigillo.js';
import { apexEffect } from './armies/apex.js';
import { mascaradaSmascheratoEffect } from './armies/mascaradaSmascherato.js';
import { concordiaEffect } from './armies/concordia.js';
import { figliCostellazioneEffect } from './armies/figliCostellazione.js';
import { corteFiammataEffect } from './armies/corteFiammata.js';
import { calibriSaldaturaEffect } from './armies/calibriSaldatura.js';
import { enclaveDoraturaEffect } from './armies/enclaveDoratura.js';
import { rattiMuffaEffect } from './armies/rattiMuffa.js';
import { pattoRicucituraEffect } from './armies/pattoRicucitura.js';
import { orathaiLinfaEffect } from './armies/orathaiLinfa.js';
import { mounthbornBrulicareEffect } from './armies/mounthbornBrulicare.js';
import { khemetEvocazioneEffect } from './armies/khemetEvocazione.js';
import { apexGeloEffect } from './armies/apexGelo.js';
import { mascaradaCoriandoliEffect } from './armies/mascaradaCoriandoli.js';
import { concordiaStendardoEffect } from './armies/concordiaStendardo.js';

export { burnEffect, dustEffect, shatterEffect, vortexEffect, materializeEffect };

/** Effetti generici (nessuna armata), per pareggi, eserciti misti o preferenze. */
export const FX_GENERIC_EFFECTS = [
  burnEffect,
  dustEffect,
  shatterEffect,
  vortexEffect,
  eclipseEffect,
  mirrorEffect,
  derezEffect,
  materializeEffect,
];

/** Effetti d'armata (campo `army` e `role`), in ordine di selezione armata. */
export const FX_ARMY_EFFECTS = [
  figliCostellazioneEffect,
  figliEffect,
  kethranEffect,
  kethranSchiantoEffect,
  corteFiammataEffect,
  corteContrattoEffect,
  calibriSaldaturaEffect,
  calibriEffect,
  orathaiLinfaEffect,
  orathaiRoviEffect,
  mounthbornBrulicareEffect,
  mounthbornFameEffect,
  enclaveDoraturaEffect,
  enclaveEffect,
  rattiMuffaEffect,
  rattiEffect,
  pattoRicucituraEffect,
  pattoRafficaEffect,
  khemetEvocazioneEffect,
  khemetSigilloEffect,
  apexGeloEffect,
  apexEffect,
  mascaradaCoriandoliEffect,
  mascaradaSmascheratoEffect,
  concordiaStendardoEffect,
  concordiaEffect,
];

export const FX_EFFECTS = [...FX_GENERIC_EFFECTS, ...FX_ARMY_EFFECTS];

export const FX_EFFECTS_BY_ID = Object.fromEntries(FX_EFFECTS.map((fx) => [fx.id, fx]));

/** Sconfitta inflitta dall'armata vincitrice (nome come in ARMY_COLORS), o null. */
export function armyDefeatFor(army) {
  return FX_ARMY_EFFECTS.find((fx) => fx.army === army && fx.role === 'defeat') || null;
}

/** Ingressi in campo dell'armata (alcune armate hanno più varianti da provare). */
export function armyEntriesFor(army) {
  return FX_ARMY_EFFECTS.filter((fx) => fx.army === army && fx.role === 'entry');
}

/** Ingresso in campo dell'armata: la variante `id` se è sua, altrimenti la prima; null se non c'è. */
export function armyEntryFor(army, id = null) {
  const list = armyEntriesFor(army);
  return (id && list.find((fx) => fx.id === id)) || list[0] || null;
}

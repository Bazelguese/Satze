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
import { kethranMutilazioneEffect } from './armies/kethranMutilazione.js';
import { corteContrattoEffect } from './armies/corteContratto.js';
import { calibriEffect } from './armies/calibri.js';
import { orathaiRoviEffect } from './armies/orathaiRovi.js';
import { mounthbornFameEffect } from './armies/mounthbornFame.js';
import { enclaveEffect } from './armies/enclave.js';
import { rattiEffect } from './armies/ratti.js';
import { pattoEffect } from './armies/patto.js';
import { khemetSigilloEffect } from './armies/khemetSigillo.js';
import { apexEffect } from './armies/apex.js';
import { mascaradaEffect } from './armies/mascarada.js';
import { concordiaEffect } from './armies/concordia.js';

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
  figliEffect,
  kethranEffect,
  kethranMutilazioneEffect,
  corteContrattoEffect,
  calibriEffect,
  orathaiRoviEffect,
  mounthbornFameEffect,
  enclaveEffect,
  rattiEffect,
  pattoEffect,
  khemetSigilloEffect,
  apexEffect,
  mascaradaEffect,
  concordiaEffect,
];

export const FX_EFFECTS = [...FX_GENERIC_EFFECTS, ...FX_ARMY_EFFECTS];

export const FX_EFFECTS_BY_ID = Object.fromEntries(FX_EFFECTS.map((fx) => [fx.id, fx]));

/** Sconfitta inflitta dall'armata vincitrice (nome come in ARMY_COLORS), o null. */
export function armyDefeatFor(army) {
  return FX_ARMY_EFFECTS.find((fx) => fx.army === army && fx.role === 'defeat') || null;
}

/** Ingresso in campo dell'armata, o null se non c'è ancora. */
export function armyEntryFor(army) {
  return FX_ARMY_EFFECTS.find((fx) => fx.army === army && fx.role === 'entry') || null;
}

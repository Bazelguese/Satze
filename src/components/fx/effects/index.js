// Registro degli effetti su elemento: ognuno è una definizione da passare a <ElementFx effect=…>.
import { burnEffect } from './burn.js';
import { dustEffect } from './dust.js';
import { shatterEffect } from './shatter.js';
import { vortexEffect } from './vortex.js';
import { materializeEffect } from './materialize.js';
import { figliEffect } from './armies/figli.js';
import { kethranEffect } from './armies/kethran.js';
import { corteRossaEffect } from './armies/corteRossa.js';
import { calibriEffect } from './armies/calibri.js';
import { orathaiEffect } from './armies/orathai.js';
import { mounthbornEffect } from './armies/mounthborn.js';
import { enclaveEffect } from './armies/enclave.js';
import { rattiEffect } from './armies/ratti.js';
import { pattoEffect } from './armies/patto.js';
import { khemetEffect } from './armies/khemet.js';
import { apexEffect } from './armies/apex.js';
import { mascaradaEffect } from './armies/mascarada.js';
import { concordiaEffect } from './armies/concordia.js';

export { burnEffect, dustEffect, shatterEffect, vortexEffect, materializeEffect };

/** Effetti generici, in ordine di menu: prima le uscite, poi le entrate. */
export const FX_GENERIC_EFFECTS = [burnEffect, dustEffect, shatterEffect, vortexEffect, materializeEffect];

/** Un effetto per armata (in ordine di selezione armata), ognuno col campo `army`. */
export const FX_ARMY_EFFECTS = [
  figliEffect,
  kethranEffect,
  corteRossaEffect,
  calibriEffect,
  orathaiEffect,
  mounthbornEffect,
  enclaveEffect,
  rattiEffect,
  pattoEffect,
  khemetEffect,
  apexEffect,
  mascaradaEffect,
  concordiaEffect,
];

export const FX_EFFECTS = [...FX_GENERIC_EFFECTS, ...FX_ARMY_EFFECTS];

export const FX_EFFECTS_BY_ID = Object.fromEntries(FX_EFFECTS.map((fx) => [fx.id, fx]));

/** Effetto caratteristico di un'armata (nome come in ARMY_COLORS), o null. */
export function armyEffectFor(army) {
  return FX_ARMY_EFFECTS.find((fx) => fx.army === army) || null;
}

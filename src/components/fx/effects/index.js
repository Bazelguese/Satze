// Registro degli effetti su elemento: ognuno è una definizione da passare a <ElementFx effect=…>.
import { burnEffect } from './burn.js';
import { dustEffect } from './dust.js';
import { shatterEffect } from './shatter.js';
import { vortexEffect } from './vortex.js';
import { materializeEffect } from './materialize.js';

export { burnEffect, dustEffect, shatterEffect, vortexEffect, materializeEffect };

/** In ordine di menu: prima le uscite, poi le entrate. */
export const FX_EFFECTS = [burnEffect, dustEffect, shatterEffect, vortexEffect, materializeEffect];

export const FX_EFFECTS_BY_ID = Object.fromEntries(FX_EFFECTS.map((fx) => [fx.id, fx]));

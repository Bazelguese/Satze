// Riscaldamento degli shader WebGL degli effetti, durante il caricamento iniziale.
//
// Ogni effetto d'armata crea il suo contesto e compila il suo programma al via: la prima
// compilazione (soprattutto su Windows, ANGLE → Direct3D) blocca il thread principale e
// cade proprio nello scontro. Il processo GPU tiene i programmi già compilati in cache
// (anche su disco), quindi compilarli qui, a schermata di caricamento, rende veloci quelli
// del duello. Un solo contesto per tutti, rilasciato alla fine.

import { FX_ARMY_EFFECTS } from './effects/index.js';
import { getFxContext, loseContext } from './glUtils.js';
import { COSMO_FS, COSMO_VS } from '../battle/duelCosmicShaders.js';

function compileCosmo(canvas) {
  // stessi attributi del contesto del duello (DuelCosmicHud)
  const gl = canvas.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: false, preserveDrawingBuffer: false });
  if (!gl) return;
  const prog = gl.createProgram();
  for (const [type, src] of [[gl.VERTEX_SHADER, COSMO_VS], [gl.FRAGMENT_SHADER, COSMO_FS]]) {
    const sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    gl.attachShader(prog, sh);
  }
  gl.linkProgram(prog);
  gl.getProgramParameter(prog, gl.LINK_STATUS);
}

/**
 * Passi da eseguire uno per frame: `step()` ne compila uno e torna false quando ha finito.
 * `release()` libera il contesto (va chiamato anche se si interrompe a metà).
 */
export function createFxShaderWarmup() {
  const jobs = [
    compileCosmo,
    ...FX_ARMY_EFFECTS.map((fx) => (canvas) => fx.createRenderer(canvas)),
  ];
  let canvas = typeof document !== 'undefined' ? document.createElement('canvas') : null;
  if (canvas) {
    canvas.width = 64;
    canvas.height = 64;
  }
  let i = 0;
  const release = () => {
    if (!canvas) return;
    const gl = getFxContext(canvas);
    canvas = null;
    if (gl) loseContext(gl);
  };
  return {
    get total() {
      return jobs.length;
    },
    step() {
      if (!canvas || i >= jobs.length) return false;
      try {
        // il renderer non serve: conta solo che il suo programma sia compilato
        jobs[i](canvas);
      } catch (err) {
        console.warn('[fx] riscaldamento shader', err);
      }
      i += 1;
      return i < jobs.length;
    },
    release,
  };
}

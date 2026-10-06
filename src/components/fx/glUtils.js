// Utilità WebGL condivise dagli effetti su elemento (bruciatura, polvere, frattura, …).

/** Normalizza un colore #rgb/#rrggbb in [r,g,b] 0-1 (fallback bianco). */
export function hexToRgb01(hex) {
  let h = String(hex || '').trim().replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const m = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})/i.exec(h);
  if (!m) return [1, 1, 1];
  return [parseInt(m[1], 16) / 255, parseInt(m[2], 16) / 255, parseInt(m[3], 16) / 255];
}

/** Contesto WebGL con alpha premoltiplicata, come serve per comporre sopra la pagina. */
export function getFxContext(canvas) {
  return canvas.getContext('webgl', {
    premultipliedAlpha: true,
    alpha: true,
    antialias: false,
    preserveDrawingBuffer: false,
  });
}

function compile(gl, type, src) {
  const sh = gl.createShader(type);
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(sh);
    gl.deleteShader(sh);
    throw new Error(`fx shader: ${log}`);
  }
  return sh;
}

/** Programma + posizioni delle uniform richieste + attributi richiesti. */
export function createProgram(gl, vs, fs, uniforms = [], attributes = []) {
  const prog = gl.createProgram();
  const v = compile(gl, gl.VERTEX_SHADER, vs);
  const f = compile(gl, gl.FRAGMENT_SHADER, fs);
  gl.attachShader(prog, v);
  gl.attachShader(prog, f);
  gl.linkProgram(prog);
  gl.deleteShader(v);
  gl.deleteShader(f);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    throw new Error(`fx program: ${gl.getProgramInfoLog(prog)}`);
  }
  const u = {};
  uniforms.forEach((n) => {
    u[n] = gl.getUniformLocation(prog, n);
  });
  const a = {};
  attributes.forEach((n) => {
    a[n] = gl.getAttribLocation(prog, n);
  });
  return { prog, u, a };
}

/** Texture lineare, bordi bloccati, alpha premoltiplicata all'upload. */
export function createSourceTexture(gl) {
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return {
    tex,
    upload(src) {
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
    },
    bind(unit = 0) {
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, tex);
    },
  };
}

/** Quad a tutto canvas (TRIANGLE_STRIP) con attributo aPos in clip space. */
export function createFullscreenQuad(gl) {
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  return {
    buf,
    draw(attrLoc) {
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.enableVertexAttribArray(attrLoc);
      gl.vertexAttribPointer(attrLoc, 2, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      gl.disableVertexAttribArray(attrLoc);
    },
  };
}

/** Vertex shader del quad: vUv con y verso il basso, come la texture (UNPACK_FLIP_Y off). */
export const QUAD_VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = vec2(aPos.x * 0.5 + 0.5, 0.5 - aPos.y * 0.5);
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

export function clearCanvas(gl, canvas) {
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);
}

/** Rilascia il contesto subito: i browser ne tengono pochi vivi alla volta. */
export function loseContext(gl) {
  gl.getExtension('WEBGL_lose_context')?.loseContext();
}

export function clamp01(x) {
  return Math.max(0, Math.min(1, x));
}

export function smoothstep(a, b, x) {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
}

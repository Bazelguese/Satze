/* Satze · Dialogue Kit — box di testo + dialoghi stile Undertale (ES module)
   v0.2 — enfasi selettiva: *parola* e {fx:parola}; emphasis:'all' per animare tutta la riga */

/** Font unico per tutti i fumetti (già self-hosted in fonts/fonts.css). */
export const DIALOGUE_FONT = {
  family: "'Chakra Petch', 'Segoe UI', system-ui, sans-serif",
  size: 24,
};

export const FONTS = {
  pixelify: { family: "'Pixelify Sans'", size: 26 },
  press2p: { family: "'Press Start 2P'", size: 15 },
  vt323: { family: "'VT323'", size: 33 },
  silkscreen: { family: "'Silkscreen'", size: 19 },
  jersey: { family: "'Jersey 10'", size: 37 },
  handjet: { family: "'Handjet'", size: 30 },
  micro5: { family: "'Micro 5'", size: 46 },
  dotgothic: { family: "'DotGothic16'", size: 25 },
  comic: { family: "'Comic Neue'", size: 26 },
  elite: { family: "'Special Elite'", size: 24 },
  rubikglit: { family: "'Rubik Glitch'", size: 24 },
  mono: { family: "'Share Tech Mono'", size: 23 },
  chakra: { family: "'Chakra Petch'", size: 24 },
  pirata: { family: "'Pirata One'", size: 31 },
  creepster: { family: "'Creepster'", size: 32 },
};

export const EFFECTS = {
  shake: 'Tremolio',
  tremor: 'Terremoto',
  wave: 'Onda',
  bounce: 'Rimbalzo',
  pulse: 'Pulsazione',
  sway: 'Dondolio',
  float: 'Fluttuo',
  glitch: 'Glitch',
  flicker: 'Sfarfallio',
  rainbow: 'Arcobaleno',
  neon: 'Neon',
};

export const ARMY = {
  orizzonte: { name: "Figli dell'Orizzonte", fx: 'wave', color: '#a78bfa' },
  corte: { name: 'Corte Rossa', fx: 'shake', color: '#f43f5e' },
  kethran: { name: 'Kethran', fx: 'pulse', color: '#fbbf24' },
  calibri: { name: 'Calibri Pesanti', fx: 'tremor', color: '#94a3b8' },
  orathai: { name: 'Orathai', fx: 'sway', color: '#2dd4bf' },
  enclave: { name: "L'Enclave delle Scaglie", fx: 'flicker', color: '#22c55e' },
  ratti: { name: 'Ratti della Megera', fx: 'glitch', color: '#a3a3a3' },
  khemet: { name: 'Khemet', fx: 'neon', color: '#eab308' },
  mounthborn: { name: 'Mounthborn', fx: 'bounce', color: '#b45309' },
  patto: { name: 'Patto degli Indocili', fx: 'sway', color: '#ef4444' },
  apex: { name: 'Apex', fx: 'pulse', color: '#f1f5f9' },
};

const STAGGER = { wave: 1, bounce: 1, pulse: 1, float: 1, rainbow: 1, neon: 1 };

const EMPHASIS_MARKUP_RE = /\*[^*]+\*|\{[a-z]+:/i;

/** @returns {boolean} */
export function hasEmphasisMarkup(text) {
  return EMPHASIS_MARKUP_RE.test(text || '');
}

/**
 * @returns {{ ch: string, fx: string|null }[]}
 */
export function tokenizeDialogueText(text, sigFx, forceAll) {
  const out = [];
  if (forceAll) {
    for (let k = 0; k < text.length; k++) out.push({ ch: text[k], fx: sigFx });
    return out;
  }
  let i = 0;
  const n = text.length;
  while (i < n) {
    const c = text[i];
    if (c === '{') {
      const close = text.indexOf('}', i);
      const colon = text.indexOf(':', i);
      if (close > -1 && colon > -1 && colon < close) {
        const fxName = text.slice(i + 1, colon).trim();
        const content = text.slice(colon + 1, close);
        for (let k = 0; k < content.length; k++) out.push({ ch: content[k], fx: fxName });
        i = close + 1;
        continue;
      }
    }
    if (c === '*') {
      const end = text.indexOf('*', i + 1);
      if (end > -1) {
        const seg = text.slice(i + 1, end);
        for (let k = 0; k < seg.length; k++) out.push({ ch: seg[k], fx: sigFx });
        i = end + 1;
        continue;
      }
    }
    out.push({ ch: c, fx: null });
    i++;
  }
  return out;
}

export function makeChar(ch, idx, fx) {
  const sp = document.createElement('span');
  sp.textContent = ch === ' ' ? '\u00a0' : ch;
  if (!fx || fx === 'static') {
    sp.className = 'sd-c';
    return sp;
  }
  sp.className = `sd-c sd-c--${fx}`;
  if (STAGGER[fx]) {
    sp.style.animationDelay = `${(-idx * 0.06).toFixed(3)}s`;
    sp.style.setProperty('--r', `${(Math.random() * 4 - 2).toFixed(1)}deg`);
  } else {
    const big = fx === 'tremor';
    sp.style.setProperty('--dx', `${((big ? 2 : 0.7) + Math.random() * (big ? 2.5 : 1.9)).toFixed(2)}px`);
    sp.style.setProperty('--dy', `${((big ? 2 : 0.7) + Math.random() * (big ? 2.5 : 1.9)).toFixed(2)}px`);
    sp.style.setProperty('--r', `${(Math.random() * (big ? 14 : 9) - (big ? 7 : 4.5)).toFixed(1)}deg`);
    sp.style.animationDelay = `${(-Math.random() * 0.25).toFixed(3)}s`;
    if (fx === 'shake') sp.style.animationDuration = `${(0.16 + Math.random() * 0.12).toFixed(3)}s`;
    if (fx === 'tremor') sp.style.animationDuration = `${(0.1 + Math.random() * 0.06).toFixed(3)}s`;
    if (big || fx === 'shake') {
      sp.style.fontSize = `calc(var(--sd-size,26px) * ${(0.82 + Math.random() * 0.5).toFixed(2)})`;
      if (Math.random() < 0.3) sp.style.fontWeight = '700';
    }
  }
  return sp;
}

function px(v) {
  return typeof v === 'number' ? `${v}px` : v;
}

export class SatzeDialogueBox {
  constructor(opts = {}) {
    this.charMs = opts.charMs || 30;
    const mount = opts.mount || document.body;

    const box = document.createElement('div');
    box.className = 'sd-box';
    const name = document.createElement('div');
    name.className = 'sd-name';
    const line = document.createElement('div');
    line.className = 'sd-line';
    const arrow = document.createElement('div');
    arrow.className = 'sd-arrow';
    arrow.textContent = '\u25bc';
    box.appendChild(name);
    box.appendChild(line);
    box.appendChild(arrow);
    mount.appendChild(box);

    this.box = box;
    this.nameEl = name;
    this.lineEl = line;
    this.arrowEl = arrow;
    this._raf = 0;
    this._toks = [];
    this._done = false;
    this._onDone = null;
    if (opts.width) box.style.width = px(opts.width);
  }

  say(o = {}) {
    const preset = o.army && ARMY[o.army] ? ARMY[o.army] : {};
    const font = o.font || DIALOGUE_FONT.family;
    const size = o.size || DIALOGUE_FONT.size;
    const fx = o.fx || preset.fx || 'shake';
    const color = o.color || preset.color || '#ffffff';
    const name = o.name != null ? o.name : preset.name || '';
    const below = o.side === 'below';

    const { box } = this;
    box.className = `sd-box${below ? ' sd-box--below' : ''}`;
    box.style.setProperty('--sd-font', font);
    box.style.setProperty('--sd-size', `${size}px`);
    box.style.setProperty('--sd-bord', color);
    box.style.setProperty('--sd-glow', `${color}55`);
    box.style.setProperty('--sd-tail', o.tail || '50%');
    if (o.x != null) box.style.left = px(o.x);
    if (o.y != null) box.style.top = px(o.y);
    if (o.width) box.style.width = px(o.width);

    this.nameEl.textContent = name;
    this.nameEl.style.color = color;
    this.nameEl.style.display = name ? '' : 'none';

    requestAnimationFrame(() => {
      box.classList.add('is-show');
    });
    const forceAll =
      o.emphasis === 'all' ||
      (o.emphasis !== 'selective' && !hasEmphasisMarkup(o.text || ''));
    this._type(o.text || '', fx, o.charMs || this.charMs, o.onDone, forceAll);
    return this;
  }

  _type(text, sigFx, charMs, onDone, forceAll) {
    cancelAnimationFrame(this._raf);
    const toks = tokenizeDialogueText(text, sigFx, forceAll);
    this._toks = toks;
    this._done = false;
    this._onDone = onDone || null;
    const line = this.lineEl;
    const arrow = this.arrowEl;
    line.textContent = '';
    arrow.style.display = 'none';
    const start = performance.now();
    const self = this;

    function step(now) {
      const n = Math.min(toks.length, Math.floor((now - start) / charMs));
      while (line.childElementCount < n) {
        const i = line.childElementCount;
        line.appendChild(makeChar(toks[i].ch, i, toks[i].fx));
      }
      if (n >= toks.length) {
        if (!self._done) {
          self._done = true;
          arrow.style.display = '';
          if (self._onDone) self._onDone();
        }
        return;
      }
      self._raf = requestAnimationFrame(step);
    }
    self._raf = requestAnimationFrame(step);
  }

  skip() {
    cancelAnimationFrame(this._raf);
    const line = this.lineEl;
    const arrow = this.arrowEl;
    const toks = this._toks || [];
    while (line.childElementCount < toks.length) {
      const i = line.childElementCount;
      line.appendChild(makeChar(toks[i].ch, i, toks[i].fx));
    }
    if (!this._done) {
      this._done = true;
      arrow.style.display = '';
      if (this._onDone) this._onDone();
    }
    return this;
  }

  isDone() {
    return this._done;
  }

  hide() {
    cancelAnimationFrame(this._raf);
    this.box.classList.remove('is-show');
    return this;
  }

  destroy() {
    cancelAnimationFrame(this._raf);
    if (this.box.parentNode) this.box.parentNode.removeChild(this.box);
  }
}

export function injectSatzeDialogueFonts() {
  // Chakra Petch è già caricato globalmente (index.html → fonts/fonts.css).
}

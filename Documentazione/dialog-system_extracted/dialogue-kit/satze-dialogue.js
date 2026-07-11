/* ============================================================
   Satze · Dialogue Kit — box di testo + dialoghi stile Undertale
   Vanilla JS, nessuna dipendenza. Espone window.SatzeDialogue.
   Uso rapido:
     SatzeDialogue.injectFonts();               // carica i Google Fonts
     const dlg = new SatzeDialogue.Box({ mount: scene });
     dlg.say({ army:'corte', name:'Araldo di Brace',
               text:'* La Corte Rossa non fa prigionieri.',
               x:'30%', y:180 });
   ============================================================ */
(function (global) {
  'use strict';

  // ---- Font disponibili (chiave -> family CSS + dimensione base consigliata) ----
  var FONTS = {
    pixelify:   { family: "'Pixelify Sans'",  size: 26 },
    press2p:    { family: "'Press Start 2P'", size: 15 },
    vt323:      { family: "'VT323'",          size: 33 },
    silkscreen: { family: "'Silkscreen'",     size: 19 },
    jersey:     { family: "'Jersey 10'",      size: 37 },
    handjet:    { family: "'Handjet'",        size: 30 },
    micro5:     { family: "'Micro 5'",        size: 46 },
    dotgothic:  { family: "'DotGothic16'",    size: 25 },
    comic:      { family: "'Comic Neue'",     size: 26 },
    elite:      { family: "'Special Elite'",  size: 24 },
    rubikglit:  { family: "'Rubik Glitch'",   size: 24 },
    mono:       { family: "'Share Tech Mono'",size: 23 },
    chakra:     { family: "'Chakra Petch'",   size: 24 },
    pirata:     { family: "'Pirata One'",     size: 31 },
    creepster:  { family: "'Creepster'",      size: 32 }
  };

  // ---- Effetti disponibili (chiave -> etichetta IT) ----
  var EFFECTS = {
    shake: 'Tremolio', tremor: 'Terremoto', wave: 'Onda', bounce: 'Rimbalzo',
    pulse: 'Pulsazione', sway: 'Dondolio', float: 'Fluttuo', glitch: 'Glitch',
    flicker: 'Sfarfallio', rainbow: 'Arcobaleno', neon: 'Neon'
  };

  // ---- Preset firmati per armata (font + effetto + colore accent) ----
  var ARMY = {
    orizzonte: { name: "Figli dell'Orizzonte", font: FONTS.pixelify.family,  size: 26, fx: 'wave',    color: '#a78bfa' },
    corte:     { name: 'Corte Rossa',          font: FONTS.press2p.family,   size: 15, fx: 'shake',   color: '#f43f5e' },
    kethran:   { name: 'Kethran',              font: FONTS.jersey.family,    size: 37, fx: 'pulse',   color: '#fbbf24' },
    calibri:   { name: 'Calibri Pesanti',      font: FONTS.mono.family,      size: 23, fx: 'tremor',  color: '#94a3b8' },
    orathai:   { name: 'Orathai',              font: FONTS.vt323.family,     size: 33, fx: 'sway',    color: '#2dd4bf' },
    enclave:   { name: "L'Enclave delle Scaglie", font: FONTS.creepster.family, size: 32, fx: 'flicker', color: '#22c55e' },
    ratti:     { name: 'Ratti della Megera',   font: FONTS.rubikglit.family, size: 24, fx: 'glitch',  color: '#a3a3a3' },
    khemet:    { name: 'Khemet',               font: FONTS.micro5.family,    size: 46, fx: 'neon',    color: '#eab308' },
    mounthborn:{ name: 'Mounthborn',           font: FONTS.jersey.family,    size: 37, fx: 'bounce',  color: '#b45309' },
    patto:     { name: 'Patto degli Indocili', font: FONTS.silkscreen.family,size: 19, fx: 'sway',    color: '#ef4444' }
  };

  // effetti con stagger basato sull'indice del carattere (ritardo progressivo)
  var STAGGER = { wave: 1, bounce: 1, pulse: 1, float: 1, rainbow: 1, neon: 1 };

  function makeChar(ch, idx, fx) {
    var sp = document.createElement('span');
    sp.className = 'sd-c sd-c--' + fx;
    sp.textContent = (ch === ' ') ? '\u00a0' : ch;
    if (STAGGER[fx]) {
      sp.style.animationDelay = (-idx * 0.06).toFixed(3) + 's';
      sp.style.setProperty('--r', (Math.random() * 4 - 2).toFixed(1) + 'deg');
    } else {
      var big = (fx === 'tremor');
      sp.style.setProperty('--dx', ((big ? 2 : 0.7) + Math.random() * (big ? 2.5 : 1.9)).toFixed(2) + 'px');
      sp.style.setProperty('--dy', ((big ? 2 : 0.7) + Math.random() * (big ? 2.5 : 1.9)).toFixed(2) + 'px');
      sp.style.setProperty('--r', (Math.random() * (big ? 14 : 9) - (big ? 7 : 4.5)).toFixed(1) + 'deg');
      sp.style.animationDelay = (-Math.random() * 0.25).toFixed(3) + 's';
      if (fx === 'shake')  sp.style.animationDuration = (0.16 + Math.random() * 0.12).toFixed(3) + 's';
      if (fx === 'tremor') sp.style.animationDuration = (0.1 + Math.random() * 0.06).toFixed(3) + 's';
      // dimensione/peso variabili (aspetto "grosso ed esagerato") solo per shake/tremor
      if (big || fx === 'shake') {
        sp.style.fontSize = 'calc(var(--sd-size,26px) * ' + (0.82 + Math.random() * 0.5).toFixed(2) + ')';
        if (Math.random() < 0.3) sp.style.fontWeight = '700';
      }
    }
    return sp;
  }

  function px(v) { return (typeof v === 'number') ? v + 'px' : v; }

  // ---- Box di dialogo ----
  function Box(opts) {
    opts = opts || {};
    this.charMs = opts.charMs || 30;
    var mount = opts.mount || document.body;

    var box = document.createElement('div'); box.className = 'sd-box';
    var name = document.createElement('div'); name.className = 'sd-name';
    var line = document.createElement('div'); line.className = 'sd-line';
    var arrow = document.createElement('div'); arrow.className = 'sd-arrow'; arrow.textContent = '\u25bc';
    box.appendChild(name); box.appendChild(line); box.appendChild(arrow);
    mount.appendChild(box);

    this.box = box; this.nameEl = name; this.lineEl = line; this.arrowEl = arrow;
    this._raf = 0; this._text = ''; this._fx = 'shake'; this._done = false; this._onDone = null;
    if (opts.width) box.style.width = px(opts.width);
  }

  Box.prototype.say = function (o) {
    o = o || {};
    var preset = (o.army && ARMY[o.army]) ? ARMY[o.army] : {};
    var font = o.font  || preset.font  || FONTS.pixelify.family;
    var size = o.size  || preset.size  || 26;
    var fx   = o.fx    || preset.fx    || 'shake';
    var color= o.color || preset.color || '#ffffff';
    var name = (o.name != null) ? o.name : (preset.name || '');
    var below = (o.side === 'below');

    var box = this.box;
    box.className = 'sd-box' + (below ? ' sd-box--below' : '');
    box.style.setProperty('--sd-font', font);
    box.style.setProperty('--sd-size', size + 'px');
    box.style.setProperty('--sd-bord', color);
    box.style.setProperty('--sd-glow', color + '55');
    box.style.setProperty('--sd-tail', o.tail || '50%');
    if (o.x != null) box.style.left = px(o.x);
    if (o.y != null) box.style.top  = px(o.y);
    if (o.width)     box.style.width = px(o.width);

    this.nameEl.textContent = name;
    this.nameEl.style.color = color;
    this.nameEl.style.display = name ? '' : 'none';

    var self = this;
    requestAnimationFrame(function () { box.classList.add('is-show'); });
    this._type(o.text || '', fx, o.charMs || this.charMs, o.onDone);
    return this;
  };

  Box.prototype._type = function (text, fx, charMs, onDone) {
    cancelAnimationFrame(this._raf);
    this._text = text; this._fx = fx; this._done = false; this._onDone = onDone || null;
    var line = this.lineEl, arrow = this.arrowEl, self = this;
    line.textContent = '';
    arrow.style.display = 'none';
    var start = performance.now();
    function step(now) {
      var n = Math.min(text.length, Math.floor((now - start) / charMs));
      while (line.childElementCount < n) {
        var i = line.childElementCount;
        line.appendChild(makeChar(text[i], i, fx));
      }
      if (n >= text.length) {
        if (!self._done) { self._done = true; arrow.style.display = ''; if (self._onDone) self._onDone(); }
        return;
      }
      self._raf = requestAnimationFrame(step);
    }
    self._raf = requestAnimationFrame(step);
  };

  // completa istantaneamente la riga in corso
  Box.prototype.skip = function () {
    cancelAnimationFrame(this._raf);
    var line = this.lineEl, text = this._text, fx = this._fx;
    while (line.childElementCount < text.length) {
      var i = line.childElementCount;
      line.appendChild(makeChar(text[i], i, fx));
    }
    if (!this._done) { this._done = true; this.arrowEl.style.display = ''; if (this._onDone) this._onDone(); }
    return this;
  };

  Box.prototype.isDone = function () { return this._done; };
  Box.prototype.hide = function () { cancelAnimationFrame(this._raf); this.box.classList.remove('is-show'); return this; };
  Box.prototype.destroy = function () { cancelAnimationFrame(this._raf); if (this.box.parentNode) this.box.parentNode.removeChild(this.box); };

  // ---- Utility: carica i Google Fonts usati dai preset ----
  function injectFonts() {
    if (document.getElementById('sd-fonts')) return;
    var l = document.createElement('link');
    l.id = 'sd-fonts';
    l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@400;600;700&family=Comic+Neue:wght@400;700&family=Creepster&family=DotGothic16&family=Handjet:wght@400;700&family=Jersey+10&family=Micro+5&family=Pirata+One&family=Pixelify+Sans:wght@400;600;700&family=Press+Start+2P&family=Rubik+Glitch&family=Share+Tech+Mono&family=Silkscreen:wght@400;700&family=Special+Elite&family=VT323&display=swap';
    document.head.appendChild(l);
  }

  global.SatzeDialogue = { Box: Box, FONTS: FONTS, EFFECTS: EFFECTS, ARMY: ARMY, injectFonts: injectFonts, makeChar: makeChar };
})(window);

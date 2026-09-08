/* ═════════════════════════════════════════════════════════════════
   SATZE · Eminenza — CELLE GENERATE A RUNTIME
   ----------------------------------------------------------------------
   Divide la carta in celle usando N layer di maschera sulla STESSA
   carta: ogni cella è un pezzo di carta+layout (arte, fascia rune,
   piede, barra armata insieme), senza duplicare il markup.

   Le keyframes vengono SCRITTE OGNI VOLTA che si riproduce il gesto:
   è così che Tessere è davvero casuale a ogni replay, invece di
   ripetere sempre lo stesso ordine.

       emCells(card, 'tessere');   // ordine sparso, nuovo ogni volta
       emCells(card, 'cenere');    // fronte diagonale + sfrangiatura

   Ritorna il nome dell'animazione da comporre con emCellsDrift /
   emCellsGather (in em-card-cells.css). A gesto finito togli la classe
   `em-cells`: i layer di maschera lasciati addosso costano un layer di
   compositing per tutta la partita.
   ═════════════════════════════════════════════════════════════════ */
(() => {
  const GRAIN = {
    tessere: { cols: 6, rows: 8, groups: 24 },
    cenere: { cols: 7, rows: 10, groups: 16 },
    kethran: { cols: 5, rows: 4, groups: 14 },
  };
  let seq = 0;
  let sheet = null;

  const getSheet = () => {
    if (!sheet) {
      const el = document.createElement('style');
      el.id = 'em-cells-runtime';
      document.head.appendChild(el);
      sheet = el;
    }
    return sheet;
  };

  window.emCells = function emCells(card, kind) {
    const g = GRAIN[kind] || GRAIN.tessere;
    const n = g.cols * g.rows;
    const cells = [];
    for (let i = 0; i < n; i++) cells.push({ i, x: i % g.cols, y: Math.floor(i / g.cols) });

    /* L'ordine: sparso per Tessere, fronte diagonale sfrangiato per
       Cenere. In entrambi i casi il caso entra a ogni chiamata. */
    let order;
    if (kind === 'cenere') {
      const span = (g.cols - 1) + (g.rows - 1);
      order = cells.map((c) => {
        const front = ((g.cols - 1 - c.x) + c.y) / span;      // da destra-alto
        const jitter = (Math.random() - 0.5) * 0.42;           // sfrangiatura
        return Math.max(0, Math.min(1, front + jitter));
      });
    } else {
      const bag = cells.map((c) => c.i);
      for (let k = bag.length - 1; k > 0; k--) {               // Fisher-Yates
        const j = Math.floor(Math.random() * (k + 1));
        [bag[k], bag[j]] = [bag[j], bag[k]];
      }
      const rank = [];
      bag.forEach((id, pos) => { rank[id] = pos / (n - 1); });
      order = cells.map((c) => rank[c.i]);
    }
    const group = order.map((v) => Math.min(g.groups - 1, Math.floor(v * g.groups)));

    const on = 'calc(' + (100 / g.cols).toFixed(4) + '% + 1px) calc(' + (100 / g.rows).toFixed(4) + '% + 1px)';
    const off = '0% 0%';
    const layers = cells.map(() => 'linear-gradient(#000,#000)').join(',');
    const pos = cells.map((c) => (
      (g.cols > 1 ? (c.x / (g.cols - 1) * 100).toFixed(4) : '50') + '% ' +
      (g.rows > 1 ? (c.y / (g.rows - 1) * 100).toFixed(4) : '50') + '%'
    )).join(',');

    const sizesAt = (step) => cells.map((c, k) => (group[k] <= step ? on : off)).join(',');
    let kf = '';
    for (let s = -1; s < g.groups; s++) {
      const t = ((s + 1) / g.groups * 92).toFixed(2) + '%';
      const list = sizesAt(s);
      kf += t + '{-webkit-mask-size:' + list + ';mask-size:' + list + '}';
    }
    const full = sizesAt(g.groups);
    kf += '100%{-webkit-mask-size:' + full + ';mask-size:' + full + '}';

    const name = 'emCells_' + kind + '_' + (++seq);
    getSheet().textContent = '@keyframes ' + name + '{' + kf + '}';

    card.style.setProperty('-webkit-mask-image', layers);
    card.style.setProperty('mask-image', layers);
    card.style.setProperty('-webkit-mask-position', pos);
    card.style.setProperty('mask-position', pos);
    card.style.setProperty('-webkit-mask-repeat', 'no-repeat');
    card.style.setProperty('mask-repeat', 'no-repeat');

    /* La maschera vive solo per la durata del gesto: appena l'animazione
       finisce si stacca e l'animazione inline si azzera, così la carta
       riprende subito il proprio riposo invece di restare ferma tagliata. */
    if (card.__emCellsOff) card.removeEventListener('animationend', card.__emCellsOff);
    const off_ = (ev) => {
      if (ev.target !== card || String(ev.animationName).indexOf('emCells') !== 0) return;
      card.removeEventListener('animationend', off_);
      card.__emCellsOff = null;
      window.emCellsClear(card);
      card.style.animation = card.__emCellsAfter || '';
      card.classList.remove('em-cells');
    };
    card.__emCellsOff = off_;
    card.addEventListener('animationend', off_);
    return name;
  };

  /* Rimette la carta intera: nessuna maschera, nessun layer in più. */
  window.emCellsClear = function emCellsClear(card) {
    for (const p of ['-webkit-mask-image', 'mask-image', '-webkit-mask-position', 'mask-position', '-webkit-mask-repeat', 'mask-repeat', '-webkit-mask-size', 'mask-size']) card.style.removeProperty(p);
  };
})();

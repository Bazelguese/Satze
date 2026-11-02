// Foto DOM più leggere, identiche al pixel (vedi captureElement.js).
//
// html-to-image copia nello stile in linea di OGNI elemento clonato tutte le proprietà calcolate
// (~330): per una carta sono ~400 KB di CSS che il browser deve poi rianalizzare, sul thread del
// gioco, quando carica l'SVG della foto. La maggior parte sono valori che il clone avrebbe
// comunque uguali:
//  - proprietà EREDITATE con lo stesso valore del genitore: il clone del genitore ha già quel
//    valore (esplicito o a sua volta ereditato), quindi il figlio lo eredita identico;
//  - proprietà NON ereditate uguali al valore predefinito del browser per quel tag: il clone
//    senza la proprietà prende proprio quel valore.
// Si tengono sempre le proprietà il cui valore predefinito dipende da altro (dimensioni del box,
// currentcolor, em del foglio di stile del browser) e quelle dove il foglio di stile del browser
// sovrascrive l'ereditarietà per quel tag (es. h1 font-size, b font-weight).
//
// Anche i font: si incorporano solo le @font-face il cui unicode-range copre almeno un carattere
// del testo fotografato. Le altre il browser non le userebbe mai per quel testo.

/**
 * Proprietà ereditate secondo Chromium
 * (third_party/blink/renderer/core/css/css_properties.json5, `inherited: true`).
 */
const INHERITED = new Set(`-webkit-border-horizontal-spacing -webkit-border-vertical-spacing -webkit-font-smoothing
-webkit-locale -webkit-rtl-ordering -webkit-ruby-position -webkit-tap-highlight-color
-webkit-text-combine -webkit-text-decorations-in-effect -webkit-text-fill-color
-webkit-text-orientation -webkit-text-security -webkit-text-stroke-color -webkit-text-stroke-width
-webkit-user-modify -webkit-writing-mode accent-color block-ellipsis border-collapse caption-side
caret-animation caret-color caret-shape clip-rule color color-interpolation
color-interpolation-filters color-rendering color-scheme cursor direction dominant-baseline
dynamic-range-limit empty-cells fill fill-opacity fill-rule font-family font-feature-settings
font-kerning font-language-override font-optical-sizing font-palette font-size font-size-adjust
font-stretch font-style font-synthesis-small-caps font-synthesis-style font-synthesis-weight
font-variant-alternates font-variant-caps font-variant-east-asian font-variant-emoji
font-variant-ligatures font-variant-numeric font-variant-position font-variation-settings
font-weight forced-color-adjust hanging-punctuation hyphenate-character hyphenate-limit-chars
hyphens image-animation image-orientation image-rendering interactivity interpolate-size
letter-spacing line-break line-height list-style-image list-style-position list-style-type
marker-end marker-mid marker-start math-depth math-shift math-style orphans overflow-wrap
paint-order pointer-events print-color-adjust quotes ruby-align ruby-overhang ruby-position
scrollbar-color shape-rendering speak stroke stroke-dasharray stroke-dashoffset stroke-linecap
stroke-linejoin stroke-miterlimit stroke-opacity stroke-width tab-size text-align text-align-last
text-anchor text-autospace text-box-edge text-combine-upright text-decoration-skip-ink
text-decoration-skip-spaces text-emphasis-color text-emphasis-position text-emphasis-style text-fit
text-indent text-justify text-orientation text-rendering text-shadow text-size-adjust
text-spacing-trim text-transform text-underline-offset text-underline-position text-wrap-mode
text-wrap-style user-select visibility white-space-collapse widows window-drag word-break
word-spacing writing-mode`.split(/\s+/));

/** Sempre copiate: il valore predefinito dipende dal box, oppure servono comunque. */
const ALWAYS_KEEP = new Set([
  'width', 'height', 'min-width', 'min-height', 'max-width', 'max-height',
  'top', 'left', 'right', 'bottom',
  'transform-origin', 'perspective-origin', 'content', 'd',
]);

/** Proprietà non ereditate dal valore predefinito dipendente da altro: si copiano sempre. */
function alwaysKeep(name, value) {
  if (ALWAYS_KEEP.has(name)) return true;
  // lo spessore calcolato vale 0 anche quando lo stile è none: nel clone con stile solid
  // (preflight di Tailwind) l'omissione darebbe 'medium'
  if (/^(border-(top|right|bottom|left)|outline|column-rule)-width$/.test(name)) return true;
  // valore iniziale currentcolor (bordi, contorno, decorazioni…): dipende dal colore del clone
  if (name !== 'background-color' && /color$/.test(name)) return true;
  // margini e padding del browser possono essere in em (p, h1…): si omette solo lo zero
  if (/^(margin|padding)-/.test(name)) return value !== '0px';
  return false;
}

let sandbox = null;
function sandboxDoc() {
  if (sandbox && sandbox.isConnected && sandbox.contentDocument) return sandbox.contentDocument;
  sandbox = document.createElement('iframe');
  sandbox.setAttribute('aria-hidden', 'true');
  sandbox.tabIndex = -1;
  sandbox.style.cssText = 'position:fixed;left:-10000px;top:0;width:0;height:0;border:0;visibility:hidden;pointer-events:none;';
  document.body.appendChild(sandbox);
  const doc = sandbox.contentDocument;
  doc.open();
  doc.write('<!DOCTYPE html><html><head></head><body></body></html>');
  doc.close();
  defaultsByTag.clear();
  return doc;
}

/** Valori calcolati del browser, per tag, in un documento senza fogli di stile. */
const defaultsByTag = new Map();
function defaultsFor(el, props) {
  const key = `${el.namespaceURI}|${el.localName}`;
  let d = defaultsByTag.get(key);
  if (d) return d;
  const doc = sandboxDoc();
  const win = doc.defaultView;
  const probe = doc.createElementNS(el.namespaceURI || 'http://www.w3.org/1999/xhtml', el.localName);
  doc.body.appendChild(probe);
  const cs = win.getComputedStyle(probe);
  const bodyCs = win.getComputedStyle(doc.body);
  const values = new Map();
  /** proprietà ereditate che il foglio di stile del browser imposta su questo tag */
  const uaInherited = new Set();
  for (const name of props) {
    const v = cs.getPropertyValue(name);
    values.set(name, v);
    if (INHERITED.has(name) && v !== bodyCs.getPropertyValue(name)) uaInherited.add(name);
  }
  probe.remove();
  d = { values, uaInherited };
  defaultsByTag.set(key, d);
  return d;
}

/**
 * Funzioni per html-to-image (opzioni `omitStyle` / `omitPseudoStyle` della copia in
 * src/vendor/html-to-image): true = il clone avrebbe comunque quel valore, non copiarlo.
 */
export function makeStyleOmitter(root, props) {
  const computed = new WeakMap();
  const cs = (el, pseudo = null) => {
    if (pseudo) return window.getComputedStyle(el, pseudo);
    let s = computed.get(el);
    if (!s) {
      s = window.getComputedStyle(el);
      computed.set(el, s);
    }
    return s;
  };
  const span = { namespaceURI: 'http://www.w3.org/1999/xhtml', localName: 'span' };
  // Il clone conserva gli attributi dell'originale, stile in linea compreso: una proprietà
  // dichiarata lì (anche via scorciatoia o var()) resterebbe col valore originale invece di
  // quello calcolato. Quelle si scrivono sempre, come prima.
  const inlineProps = new WeakMap();
  const inlineOf = (el) => {
    let set = inlineProps.get(el);
    if (!set) {
      set = new Set();
      const st = el.style;
      if (st) for (let i = 0; i < st.length; i += 1) set.add(st[i]);
      inlineProps.set(el, set);
    }
    return set;
  };

  const omitStyle = (el, name, value) => {
    if (el === root) return false; // la radice non eredita nulla dalla pagina: tutto esplicito
    const parent = el.parentElement;
    if (!parent) return false;
    if (inlineOf(el).has(name)) return false;
    if (INHERITED.has(name)) {
      if (defaultsFor(el, props).uaInherited.has(name)) return false;
      return cs(parent).getPropertyValue(name) === value;
    }
    if (alwaysKeep(name, value)) return false;
    return defaultsFor(el, props).values.get(name) === value;
  };

  // ::before / ::after: ereditano dall'elemento stesso; senza regole del browser (come uno span)
  const omitPseudoStyle = (el, pseudo, name, value) => {
    if (INHERITED.has(name)) return cs(el).getPropertyValue(name) === value;
    if (alwaysKeep(name, value)) return false;
    return defaultsFor(span, props).values.get(name) === value;
  };

  return { omitStyle, omitPseudoStyle };
}

/* ── font ─────────────────────────────────────────────────────────────────────────────── */

function parseUnicodeRange(text) {
  const ranges = [];
  for (const part of String(text).split(',')) {
    const m = part.trim().match(/^U\+([0-9A-F?]+)(?:-([0-9A-F]+))?$/i);
    if (!m) return null; // forma inattesa: la faccia si tiene
    if (m[1].includes('?')) {
      ranges.push([parseInt(m[1].replace(/\?/g, '0'), 16), parseInt(m[1].replace(/\?/g, 'F'), 16)]);
    } else {
      const a = parseInt(m[1], 16);
      ranges.push([a, m[2] ? parseInt(m[2], 16) : a]);
    }
  }
  return ranges;
}

/**
 * Caratteri che il testo fotografato può mostrare: testo, contenuti di ::before/::after,
 * varianti maiuscole/minuscole (text-transform, small-caps) e i caratteri che il browser
 * aggiunge da sé (spazio, trattino di sillabazione, puntini di sospensione).
 * null = non determinabile (contenuti generati da attr()/counter()): si tengono tutti i font.
 */
export function usedCodePoints(node) {
  const set = new Set([0x20, 0x2d, 0x2010, 0x2026]);
  const add = (str) => {
    for (const ch of str) {
      set.add(ch.codePointAt(0));
      for (const v of [ch.toUpperCase(), ch.toLowerCase()]) for (const c of v) set.add(c.codePointAt(0));
    }
  };
  add(node.textContent || '');
  const els = [node, ...node.querySelectorAll('*')];
  for (const el of els) {
    for (const pseudo of ['::before', '::after']) {
      const content = window.getComputedStyle(el, pseudo).getPropertyValue('content');
      if (!content || content === 'none' || content === 'normal') continue;
      if (/attr\(|counter/i.test(content)) return null;
      add(content.replace(/\\([0-9a-f]{1,6})\s?/gi, (_, h) => String.fromCodePoint(parseInt(h, 16))));
    }
  }
  return set;
}

/** Tiene solo le @font-face usabili per quei caratteri (le altre non verrebbero mai usate). */
export function filterFontFaces(css, codePoints) {
  if (!css || !codePoints) return css;
  const points = [...codePoints];
  return css.replace(/@font-face\s*\{[^}]*\}/g, (block) => {
    const m = block.match(/unicode-range\s*:\s*([^;}]+)/i);
    if (!m) return block;
    const ranges = parseUnicodeRange(m[1]);
    if (!ranges) return block;
    return points.some((cp) => ranges.some(([a, b]) => cp >= a && cp <= b)) ? block : '';
  });
}

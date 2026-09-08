/**
 * Satze — Ingressi carta Eminenza
 * Modulo di integrazione: mette in campo i gesti descritti in HANDOFF.md.
 *
 * Nessuna dipendenza. Va usato su una `.em-card` già montata, senza
 * toccarne il layout.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

/** Le modalità attive di default in gioco. */
export const EMINENZA_DEFAULTS = {
  ability: 'affondo',
  entry: 'armata',
  shape: 'nastro',
  art: 'profondità',
};

/**
 * Ogni armata entra come entra il suo campo.
 * Include sia slug brevi (pacchetto DS) sia nomi canonici del catalogo.
 */
export const ARMY_ENTRY = {
  Apex: 'apex',
  Mascarada: 'mascarada',
  Kethran: 'kethran',
  Mounthborn: 'mounthborn',
  Khemet: 'khemet',
  Orathai: 'orathai',
  'Corte Rossa': 'corte',
  Indocili: 'indocili',
  'Patto degli Indocili': 'indocili',
  Orizzonte: 'orizzonte',
  "Figli dell'Orizzonte": 'orizzonte',
  Ratti: 'ratti',
  'Ratti della Megera': 'ratti',
  Enclave: 'enclave',
  "L'Enclave delle Scaglie": 'enclave',
  'Calibri Pesanti': 'calibri',
};

/**
 * Gesti indipendenti dall'armata.
 * `cells` passa per il motore di celle; `layer` è una classe sul .em-layer.
 */
export const PLAIN_ENTRIES = {
  fenditura: { layer: 'em-in-fenditura', dur: 0.55 },
  compressa: { layer: 'em-in-compressa', dur: 0.55 },
  tessere: { cells: 'tessere', drift: 'emCellsDrift', dur: 0.55 },
  cenere: { cells: 'cenere', drift: 'emCellsGather', dur: 0.62 },
};

const DUR = 0.72;
const ARM_CLASS_RE = /^em-arm($|-)/;
const FX_CLASS_RE = /^em-fx-/;

function stripArmClasses(el) {
  if (!el) return;
  [...el.classList].forEach((name) => {
    if (ARM_CLASS_RE.test(name) || name === 'em-cells') el.classList.remove(name);
  });
}

function stripFxClasses(el) {
  if (!el) return;
  [...el.classList].forEach((name) => {
    if (FX_CLASS_RE.test(name) || name === 'em-arm-fx') el.classList.remove(name);
  });
  if (!el.classList.contains('em-arm-fx')) el.classList.add('em-arm-fx');
}

/** Kethran / Khemet: pezzi = copie della carta (cloneNode), non solo arte. */
function fillEffectLayer(fx, slug, card) {
  fx.innerHTML = '';
  if (!card || (slug !== 'kethran' && slug !== 'khemet')) return;

  const piece = () => {
    const c = card.cloneNode(true);
    c.className = 'em-card';
    c.style.animation = 'none';
    c.style.width = '100%';
    c.style.height = '100%';
    return c;
  };

  if (slug === 'kethran') {
    for (let i = 0; i < 20; i += 1) {
      const cx = i % 5;
      const cy = Math.floor(i / 5);
      const cell = document.createElement('span');
      cell.className = 'em-frag';
      cell.style.setProperty('--cx', String(cx));
      cell.style.setProperty('--cy', String(cy));
      cell.style.setProperty('--fx', `${Math.round((Math.random() - 0.5) * 300)}px`);
      cell.style.setProperty('--fy', `${Math.round((Math.random() - 0.5) * 210)}px`);
      cell.style.setProperty('--fr', `${((Math.random() - 0.5) * 26).toFixed(1)}deg`);
      cell.style.setProperty('--fd', `${(Math.random() * 0.16).toFixed(3)}s`);
      const inner = document.createElement('span');
      inner.className = 'em-frag-in';
      inner.style.setProperty('--cx', String(cx));
      inner.style.setProperty('--cy', String(cy));
      inner.appendChild(piece());
      cell.appendChild(inner);
      fx.appendChild(cell);
    }
    return;
  }

  for (let r = 0; r < 7; r += 1) {
    const ring = document.createElement('span');
    ring.className = 'em-ring';
    ring.style.setProperty('--r', String(r));
    ring.appendChild(piece());
    fx.appendChild(ring);
  }
}

/** Riporta carta e strato allo stato nudo (maschere/blend non sopravvivono). */
export function resetEntry(card, fx) {
  if (card) {
    if (card.__emOff) {
      card.removeEventListener('animationend', card.__emOff);
      card.__emOff = null;
    }
    stripArmClasses(card);
    card.style.animation = '';
    for (const p of [
      '--em-a-dur', '--em-a-acc', '--em-f-dur',
      '-webkit-mask-image', 'mask-image', '-webkit-mask-position', 'mask-position',
      '-webkit-mask-repeat', 'mask-repeat', '-webkit-mask-size', 'mask-size',
    ]) {
      card.style.removeProperty(p);
    }
  }
  if (fx) {
    stripFxClasses(fx);
    fx.innerHTML = '';
    fx.style.removeProperty('--em-a-dur');
    fx.style.removeProperty('--em-a-acc');
  }
}

export function resolveArmyEntrySlug(army) {
  if (!army) return 'apex';
  return ARMY_ENTRY[army] || ARMY_ENTRY[String(army).trim()] || 'apex';
}

/**
 * Riproduce l'ingresso. Ritorna la durata in ms.
 *
 * @param {HTMLElement} card  il .em-card
 * @param {HTMLElement} fx    lo strato d'effetto, FRATELLO della carta
 * @param {object} opts
 */
export function playEntry(card, fx, opts = {}) {
  const { entry = EMINENZA_DEFAULTS.entry, army, accent, layer } = opts;
  if (!card) return 0;

  resetEntry(card, fx);
  if (layer) {
    layer.classList.remove('em-in-fenditura', 'em-in-compressa');
  }
  void card.offsetWidth;

  const plain = PLAIN_ENTRIES[entry];
  const dur = opts.dur || (plain ? plain.dur : DUR);

  if (plain && plain.cells) {
    if (typeof window.emCells !== 'function') {
      console.warn('eminenzaEntry: em-cells.js non caricato; ingresso saltato');
      return 0;
    }
    card.classList.add('em-cells');
    card.style.animation = `${window.emCells(card, plain.cells)} ${dur}s linear both,`
      + `${plain.drift} ${dur}s cubic-bezier(.2,.9,.2,1) both`;
    return dur * 1000;
  }

  if (plain && plain.layer) {
    if (!layer) {
      console.warn(`eminenzaEntry: ${entry} richiede il .em-layer`);
      return 0;
    }
    layer.style.setProperty('--em-f-dur', `${dur}s`);
    layer.classList.add(plain.layer);
    window.setTimeout(() => {
      layer.classList.remove(plain.layer);
      layer.style.removeProperty('--em-f-dur');
    }, dur * 1400);
    return dur * 1000;
  }

  const slug = resolveArmyEntrySlug(army);
  for (const el of [card, fx]) {
    if (!el) continue;
    el.style.setProperty('--em-a-dur', `${dur}s`);
    if (accent) el.style.setProperty('--em-a-acc', accent);
  }
  card.classList.add('em-arm', `em-arm-${slug}`);
  if (fx) {
    // Classi SEPARATE: con em-arm-<slug> lo strato eredita le trasformazioni.
    fx.classList.add(`em-fx-${slug}`);
    fillEffectLayer(fx, slug, card);
  }

  const off = (ev) => {
    if (ev.target !== card || String(ev.animationName).indexOf('emArm') !== 0) return;
    resetEntry(card, fx);
    opts.onDone?.();
  };
  card.__emOff = off;
  card.addEventListener('animationend', off);
  return dur * 1000;
}

/**
 * Hook React: le classi arm/fx vivono in state così un re-render non le cancella.
 * Le classi vengono anche scritte subito sul DOM (layout) per non mostrare
 * un frame intero prima del gesto.
 */
export function useEminenzaEntry(opts = {}) {
  const cardRef = useRef(null);
  const fxRef = useRef(null);
  const layerRef = useRef(null);
  const optsRef = useRef(opts);
  const playGenRef = useRef(0);
  const [cardArmClass, setCardArmClass] = useState('');
  const [fxArmClass, setFxArmClass] = useState('');
  optsRef.current = opts;

  const clearArmState = useCallback(() => {
    setCardArmClass('');
    setFxArmClass('');
  }, []);

  const play = useCallback((over = {}) => {
    const merged = { ...optsRef.current, ...over };
    const card = cardRef.current;
    const fx = fxRef.current;
    const layer = merged.layer || layerRef.current;
    if (!card) return 0;

    const entry = merged.entry || EMINENZA_DEFAULTS.entry;
    const plain = PLAIN_ENTRIES[entry];
    const gen = playGenRef.current + 1;
    playGenRef.current = gen;

    resetEntry(card, fx);
    if (layer) layer.classList.remove('em-in-fenditura', 'em-in-compressa');
    clearArmState();
    void card.offsetWidth;

    const dur = merged.dur || (plain ? plain.dur : DUR);

    if (plain && plain.cells) {
      if (typeof window.emCells !== 'function') {
        console.warn('eminenzaEntry: em-cells.js non caricato; ingresso saltato');
        return 0;
      }
      setCardArmClass('em-cells');
      card.classList.add('em-cells');
      card.style.animation = `${window.emCells(card, plain.cells)} ${dur}s linear both,`
        + `${plain.drift} ${dur}s cubic-bezier(.2,.9,.2,1) both`;
      return dur * 1000;
    }

    if (plain && plain.layer) {
      if (!layer) {
        console.warn(`eminenzaEntry: ${entry} richiede il .em-layer`);
        return 0;
      }
      layer.style.setProperty('--em-f-dur', `${dur}s`);
      layer.classList.add(plain.layer);
      window.setTimeout(() => {
        if (playGenRef.current !== gen) return;
        layer.classList.remove(plain.layer);
        layer.style.removeProperty('--em-f-dur');
      }, dur * 1400);
      return dur * 1000;
    }

    const slug = resolveArmyEntrySlug(merged.army);
    const nextCardClass = `em-arm em-arm-${slug}`;
    const nextFxClass = `em-fx-${slug}`;
    setCardArmClass(nextCardClass);
    setFxArmClass(nextFxClass);

    for (const el of [card, fx]) {
      if (!el) continue;
      el.style.setProperty('--em-a-dur', `${dur}s`);
      if (merged.accent) el.style.setProperty('--em-a-acc', merged.accent);
    }
    card.classList.add('em-arm', `em-arm-${slug}`);
    if (fx) {
      fx.classList.add(`em-fx-${slug}`);
      fillEffectLayer(fx, slug, card);
    }

    if (card.__emOff) card.removeEventListener('animationend', card.__emOff);
    const off = (ev) => {
      if (ev.target !== card || String(ev.animationName).indexOf('emArm') !== 0) return;
      if (playGenRef.current !== gen) return;
      card.removeEventListener('animationend', off);
      card.__emOff = null;
      resetEntry(card, fx);
      clearArmState();
      merged.onDone?.();
    };
    card.__emOff = off;
    card.addEventListener('animationend', off);
    return dur * 1000;
  }, [clearArmState]);

  useEffect(() => () => {
    playGenRef.current += 1;
    resetEntry(cardRef.current, fxRef.current);
  }, []);

  return {
    cardRef,
    fxRef,
    layerRef,
    play,
    cardArmClass,
    fxArmClass,
  };
}

/**
 * Stile dello strato d'effetto (fratello della carta, stesso box).
 * Con shell della stessa misura della carta, `inset:0` è più robusto di right/top.
 */
export function entryLayerStyle(width, height) {
  return {
    position: 'absolute',
    inset: 0,
    width,
    height,
    borderRadius: '0 0 14px 14px',
    boxSizing: 'border-box',
    overflow: 'hidden',
    pointerEvents: 'none',
    zIndex: 10,
    '--cw': `${width}px`,
    '--ch': `${height}px`,
  };
}

export const EMINENCE_CARD_SIZE = { width: 300, height: 525 };

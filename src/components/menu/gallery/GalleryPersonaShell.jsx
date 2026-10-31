// ============================================================
// GalleryPersonaShell.jsx — guscio comune della Galleria (stile Persona)
// ============================================================
// Fondo a lastra diagonale nera + arte d'armata, halftone, titolo
// "strappato", rail armate/categorie a bandiere skew, lista inclinata
// alla Compendium e barra comandi. Le quattro sezioni (Agenti,
// Alternative, Eminenze, Campi) riempiono solo lo stage a destra.
//
// Tastiera centralizzata qui (un solo listener):
//   ↑/↓  voce precedente/successiva     ←/→  rail precedente/successiva
//   Q/E  sezione precedente/successiva  R    onReplay (se presente)
//   Esc  onBack
// ============================================================

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import GalleryTabSwitcher, { GALLERY_TAB_ORDER } from './GalleryTabSwitcher.jsx';
import { playUiClick } from '../../../audio/soundBus.js';
import { ARMY_COLORS, ARMY_GIFS, ARMY_ICONS } from '../../../data/armies.js';
import { ARMY_LORE } from '../cosmic/armyLore.js';
import { resolvePublicAssetUrl } from '../../../utils/preloadAssets.js';
import { useArrivedByCurtain } from '../../cosmic/ScreenTransition';

export function armyAccent(army, fallback = '#94a3b8') {
  return (ARMY_COLORS[army] || {}).accent || fallback;
}

export function armyGlyph(army) {
  return (ARMY_LORE[army] || {}).glyph || '◈';
}

export function armyIconUrl(army) {
  return ARMY_ICONS[army] || null;
}

/** Emblema armata; se il file manca ripiega sul glifo testuale. */
export function GalleryArmyIcon({ src, glyph, className = '' }) {
  const [broken, setBroken] = useState(false);
  if (!src || broken) {
    return glyph ? <span className={`${className} is-glyph`} aria-hidden="true">{glyph}</span> : null;
  }
  return (
    <img
      src={src}
      alt=""
      className={className}
      draggable={false}
      decoding="async"
      onError={() => setBroken(true)}
    />
  );
}

export function armyMotto(army) {
  return (ARMY_LORE[army] || {}).motto || '';
}

export function armyBgUrl(army) {
  const path = ARMY_GIFS[army];
  return path ? resolvePublicAssetUrl(path) || path : null;
}

/** Indice successivo/precedente con wrap. */
export function wrapIndex(i, delta, length) {
  if (!length) return 0;
  return (i + delta + length) % length;
}

function isTypingTarget(el) {
  if (!el) return false;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
}

export function GalleryPersonaShell({
  accent = '#f5f3eb',
  section,
  eyebrow,
  title,
  motto,
  watermark,
  bgImage,
  counterLabel,
  counterCurrent = 0,
  counterTotal = 0,
  onBack,
  galleryTab,
  onGalleryTabChange,
  agentCount,
  alternativeCount,
  fieldCount,
  eminenceCount,
  rail,
  list,
  stage,
  hints = [],
  onPrev,
  onNext,
  onRailPrev,
  onRailNext,
  onReplay,
  /** Lame d'ingresso: solo alla prima apertura, non a ogni cambio sezione. */
  playIntro = false,
}) {
  // arrivando dal menù la cortina fa già da ingresso: niente lame doppie
  const arrivedByCurtain = useArrivedByCurtain();
  const [introOn] = useState(playIntro);
  const tabCounts = {
    agents: agentCount,
    alternative: alternativeCount,
    eminences: eminenceCount,
    battlefields: fieldCount,
  };
  const tabs = GALLERY_TAB_ORDER.filter((id) => tabCounts[id] != null);

  // Ref sempre aggiornato: un solo listener per tutta la vita del guscio.
  const handlersRef = useRef({});
  handlersRef.current = { onPrev, onNext, onRailPrev, onRailNext, onReplay, onBack, onGalleryTabChange, galleryTab, tabs };

  useEffect(() => {
    const onKey = (e) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || isTypingTarget(e.target)) return;
      const h = handlersRef.current;
      const step = (fn) => {
        if (!fn) return;
        e.preventDefault();
        fn();
      };
      switch (e.key) {
        case 'ArrowUp': step(h.onPrev); break;
        case 'ArrowDown': step(h.onNext); break;
        case 'ArrowLeft': step(h.onRailPrev); break;
        case 'ArrowRight': step(h.onRailNext); break;
        case 'r': case 'R': step(h.onReplay); break;
        case 'Escape': step(h.onBack); break;
        case 'q': case 'Q': case 'e': case 'E': {
          if (!h.onGalleryTabChange || h.tabs.length < 2) return;
          const dir = e.key.toLowerCase() === 'q' ? -1 : 1;
          const i = Math.max(0, h.tabs.indexOf(h.galleryTab));
          playUiClick();
          step(() => h.onGalleryTabChange(h.tabs[(i + dir + h.tabs.length) % h.tabs.length]));
          break;
        }
        default:
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className={`gp ${rail ? '' : 'gp--norail'}`} style={{ '--accent': accent }}>
      <div className="gp-bg" aria-hidden="true">
        {bgImage && <div className="gp-bg-art" key={bgImage} style={{ backgroundImage: `url("${bgImage}")` }} />}
        <div className="gp-bg-tone" />
        <div className="gp-bg-slab" />
        <div className="gp-bg-slab-edge" />
        <div className="gp-bg-halftone" />
        <div className="gp-bg-stripes" />
      </div>

      {watermark && <div className="gp-watermark" aria-hidden="true">{watermark}</div>}

      <header className="gp-top">
        <button type="button" className="gp-back" onClick={onBack}>
          <span className="gp-back-key">ESC</span>
          <span className="gp-back-lbl">MENU</span>
        </button>
        {onGalleryTabChange && (
          <GalleryTabSwitcher
            activeTab={galleryTab}
            onTabChange={(id) => { playUiClick(); onGalleryTabChange(id); }}
            agentCount={agentCount}
            alternativeCount={alternativeCount}
            fieldCount={fieldCount}
            eminenceCount={eminenceCount}
          />
        )}
        <div className="gp-counter">
          <div className="gp-counter-lbl">{counterLabel}</div>
          <div className="gp-counter-num">
            <span className="cur">{String(counterCurrent).padStart(2, '0')}</span>
            <span className="sep">/</span>
            <span className="tot">{String(counterTotal).padStart(2, '0')}</span>
          </div>
        </div>
      </header>

      {rail && <div className="gp-rail-band">{rail}</div>}

      <div className="gp-title" key={`t-${title}`}>
        <div className="gp-title-eyebrow">
          <span className="gp-title-section">{section}</span>
          {eyebrow && <span className="gp-title-eyebrow-txt">{eyebrow}</span>}
        </div>
        <h1 className={`gp-title-text ${String(title || '').length > 17 ? 'is-long' : ''}`}>
          <span>{title}</span>
        </h1>
        {motto && <div className="gp-title-motto">{motto}</div>}
      </div>

      <div className="gp-list-col">{list}</div>

      <div className="gp-stage">{stage}</div>

      {hints.length > 0 && (
        <footer className="gp-hints">
          {hints.map((h) => (
            <span key={h.label} className="gp-hint">
              {h.keys.map((k) => <kbd key={k}>{k}</kbd>)}
              <span className="lbl">{h.label}</span>
            </span>
          ))}
        </footer>
      )}

      {introOn && !arrivedByCurtain && (
        <div className="gp-intro" aria-hidden="true">
          <span /><span /><span />
        </div>
      )}

      <GalleryPersonaStyles />
    </div>
  );
}

/**
 * Rail a bandiere skew. items: { id, label, icon?, glyph?, accent, group? }.
 * Le voci con group diverso dal precedente ricevono un separatore (groupLabel).
 */
export function PersonaRail({ items, activeId, onSelect, groupLabels = {} }) {
  const railRef = useRef(null);
  const activeRef = useRef(null);

  useLayoutEffect(() => {
    const rail = railRef.current;
    const el = activeRef.current;
    if (!rail || !el) return;
    const left = el.offsetLeft - rail.clientWidth / 2 + el.offsetWidth / 2;
    rail.scrollTo({ left: Math.max(0, left), behavior: 'smooth' });
  }, [activeId]);

  let lastGroup = items[0]?.group;
  return (
    <div className="gp-rail" role="tablist" ref={railRef}>
      <kbd className="gp-rail-key">←</kbd>
      {items.map((it) => {
        const sep = it.group !== lastGroup && groupLabels[it.group];
        lastGroup = it.group;
        const on = it.id === activeId;
        return (
          <React.Fragment key={it.id}>
            {sep && <span className="gp-rail-sep">{sep}</span>}
            <button
              type="button"
              role="tab"
              aria-selected={on}
              ref={on ? activeRef : undefined}
              className={`gp-flag ${on ? 'on' : ''}`}
              style={{ '--c': it.accent }}
              onClick={() => { if (!on) { playUiClick(); onSelect(it.id); } }}
              title={it.label}
            >
              <span className="gp-flag-in">
                {it.icon ? (
                  <GalleryArmyIcon src={it.icon} glyph={it.glyph} className="gy-ic" />
                ) : it.glyph ? (
                  <span className="gy">{it.glyph}</span>
                ) : null}
                <span className="nm">{it.label}</span>
                {it.count != null && <span className="ct">{it.count}</span>}
              </span>
            </button>
          </React.Fragment>
        );
      })}
      <kbd className="gp-rail-key">→</kbd>
    </div>
  );
}

/**
 * Lista Compendium. items: { key, number, title, sub?, meta?, accent?, thumb?, icon?, glyph? }.
 */
export function PersonaList({ items, activeIndex, onSelect, emptyLabel = 'Nessuna voce' }) {
  const listRef = useRef(null);
  const rowRefs = useRef([]);

  useLayoutEffect(() => {
    const list = listRef.current;
    const row = rowRefs.current[activeIndex];
    if (!list || !row) return;
    const top = row.offsetTop;
    const bottom = top + row.offsetHeight;
    const pad = 72;
    if (top - pad < list.scrollTop) list.scrollTo({ top: Math.max(0, top - pad), behavior: 'smooth' });
    else if (bottom + pad > list.scrollTop + list.clientHeight) {
      list.scrollTo({ top: bottom + pad - list.clientHeight, behavior: 'smooth' });
    }
  }, [activeIndex, items]);

  if (!items.length) return <div className="gp-list gp-list--empty">{emptyLabel}</div>;

  return (
    <div className="gp-list" ref={listRef} role="listbox">
      {items.map((it, i) => {
        const on = i === activeIndex;
        return (
          <button
            key={it.key}
            type="button"
            role="option"
            aria-selected={on}
            ref={(el) => { rowRefs.current[i] = el; }}
            className={`gp-row ${on ? 'on' : ''}`}
            style={{ '--c': it.accent || 'var(--accent)' }}
            onClick={() => { if (!on) { playUiClick(); onSelect(i); } }}
          >
            <span className="gp-row-shadow" aria-hidden="true" />
            <span className="gp-row-plate">
              <span className="gp-row-cursor" aria-hidden="true" />
              <span className="gp-row-num">{it.number}</span>
              {it.thumb ? (
                <span className="gp-row-thumb"><img src={it.thumb} alt="" loading="lazy" decoding="async" /></span>
              ) : it.icon ? (
                <GalleryArmyIcon src={it.icon} glyph={it.glyph} className="gp-row-icon" />
              ) : it.glyph ? (
                <span className="gp-row-glyph">{it.glyph}</span>
              ) : null}
              <span className="gp-row-text">
                <span className="gp-row-title">{it.title}</span>
                {it.sub && <span className="gp-row-sub">{it.sub}</span>}
              </span>
              {it.meta && <span className="gp-row-meta">{it.meta}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** Targa nome inclinata (bianca, testo nero) con ombra d'accento sfalsata. */
export function PersonaNamePlate({ number, name, sub, className = '' }) {
  return (
    <div className={`gp-nameplate ${className}`}>
      {number != null && <div className="gp-nameplate-num">{number}</div>}
      <div className="gp-nameplate-name"><span>{name}</span></div>
      {sub && <div className="gp-nameplate-sub">{sub}</div>}
    </div>
  );
}

/** Stella a punte con numero (POT / DAN / Presenza). */
export function PersonaStatBurst({ label, value, tone = 'accent' }) {
  return (
    <div className={`gp-burst gp-burst--${tone}`}>
      <span className="gp-burst-shape" aria-hidden="true" />
      <span className="gp-burst-val">{value ?? '—'}</span>
      <span className="gp-burst-lbl">{label}</span>
    </div>
  );
}

export const GP_STAR_CLIP = 'polygon(50% 0%, 61% 18%, 82% 8%, 80% 30%, 100% 38%, 84% 54%, 96% 74%, 74% 76%, 70% 98%, 52% 84%, 34% 100%, 28% 78%, 4% 80%, 16% 60%, 0% 42%, 20% 32%, 14% 10%, 36% 18%)';

function GalleryPersonaStyles() {
  return (
    <style>{`
      .gp {
        position: absolute; inset: 0; overflow: hidden; isolation: isolate; z-index: 2;
        background: #050507; color: #f5f3eb;
        font-family: 'Chakra Petch', sans-serif;
      }
      .gp * { box-sizing: border-box; }
      .gp kbd {
        display: inline-grid; place-items: center; min-width: 26px; height: 24px; padding: 0 6px;
        background: #f5f3eb; color: #050507; border: 0;
        font-family: 'Chakra Petch', sans-serif; font-weight: 700; font-size: 13px; line-height: 1;
        clip-path: polygon(4px 0, 100% 0, calc(100% - 4px) 100%, 0 100%);
      }

      /* ---------- Fondo ---------- */
      .gp-bg { position: absolute; inset: 0; z-index: 0; pointer-events: none; }
      .gp-bg-art {
        position: absolute; inset: -2%;
        background-size: cover; background-position: center;
        filter: brightness(0.42) saturate(1.15) contrast(1.08);
        animation: gp-bg-in .7s cubic-bezier(.2,.8,.2,1) both;
      }
      @keyframes gp-bg-in { from { opacity: 0; transform: scale(1.08) translateX(40px); } }
      .gp-bg-tone {
        position: absolute; inset: 0;
        background:
          linear-gradient(100deg, transparent 30%, color-mix(in srgb, var(--accent) 22%, transparent) 75%, transparent 100%),
          radial-gradient(ellipse at 75% 50%, transparent 30%, rgba(0,0,0,0.75) 100%);
        mix-blend-mode: normal; transition: background .4s;
      }
      .gp-bg-slab {
        position: absolute; top: -20%; bottom: -20%; left: -14%; width: 56%;
        background: #050507;
        transform: skewX(-13deg);
        box-shadow: 0 0 90px rgba(0,0,0,0.8);
      }
      .gp-bg-slab-edge {
        position: absolute; top: -20%; bottom: -20%; left: 41.2%; width: 22px;
        background: var(--accent);
        transform: skewX(-13deg);
        box-shadow: 26px 0 0 -14px #050507, 34px 0 0 -16px var(--accent);
        transition: background .35s, box-shadow .35s;
        animation: gp-edge-in .55s cubic-bezier(.2,.9,.2,1) both;
      }
      @keyframes gp-edge-in { from { transform: skewX(-13deg) translateY(-110%); } }
      .gp-bg-halftone {
        position: absolute; inset: 0; opacity: 0.32;
        background-image: radial-gradient(circle, var(--accent) 1.4px, transparent 1.8px);
        background-size: 11px 11px;
        -webkit-mask-image: linear-gradient(115deg, transparent 38%, #000 62%, transparent 100%);
        mask-image: linear-gradient(115deg, transparent 38%, #000 62%, transparent 100%);
      }
      .gp-bg-stripes {
        position: absolute; inset: 0; opacity: 0.07;
        background-image: repeating-linear-gradient(-77deg, #fff 0 2px, transparent 2px 46px);
      }

      .gp-watermark {
        position: absolute; right: -40px; bottom: -70px; z-index: 1;
        font-family: 'Chakra Petch', sans-serif; font-weight: 700;
        font-size: 300px; line-height: 0.8; letter-spacing: -0.04em; white-space: nowrap;
        color: transparent; -webkit-text-stroke: 2px color-mix(in srgb, var(--accent) 30%, transparent);
        transform: rotate(-8deg) skewX(-12deg); transform-origin: right bottom;
        pointer-events: none; user-select: none;
      }

      /* ---------- Barra alta ---------- */
      .gp-top {
        position: absolute; top: 18px; left: 40px; right: 40px; height: 60px; z-index: 20;
        display: grid; grid-template-columns: 260px 1fr 260px; align-items: center;
      }
      .gp-back {
        justify-self: start; display: inline-flex; align-items: center; gap: 12px;
        background: #050507; color: #f5f3eb; border: 0; cursor: pointer;
        padding: 10px 26px 10px 14px; transform: skewX(-14deg) rotate(-2deg);
        box-shadow: 5px 5px 0 var(--accent);
        transition: transform .15s, box-shadow .15s;
      }
      .gp-back > * { transform: skewX(14deg); }
      .gp-back:hover { transform: skewX(-14deg) rotate(-2deg) translate(-3px,-3px); box-shadow: 9px 9px 0 var(--accent); }
      .gp-back-key {
        background: #f5f3eb; color: #050507; font-weight: 700; font-size: 12px; padding: 3px 7px; letter-spacing: 0.06em;
      }
      .gp-back-lbl { font-weight: 700; font-size: 22px; letter-spacing: 0.08em; font-style: italic; }

      .gp-counter { justify-self: end; text-align: right; transform: rotate(-3deg); }
      .gp-counter-lbl {
        display: inline-block; background: #f5f3eb; color: #050507;
        font-weight: 700; font-size: 12px; letter-spacing: 0.3em; padding: 3px 10px 3px 12px;
        transform: skewX(-14deg);
      }
      .gp-counter-num { font-weight: 700; font-style: italic; line-height: 0.9; margin-top: 2px; }
      .gp-counter-num .cur { font-size: 54px; color: var(--accent); text-shadow: 4px 4px 0 #050507; transition: color .3s; }
      .gp-counter-num .sep { font-size: 34px; color: #f5f3eb; margin: 0 4px; }
      .gp-counter-num .tot { font-size: 28px; color: #f5f3eb; }

      /* ---------- Rail ---------- */
      .gp-rail-band {
        position: absolute; top: 96px; left: -40px; right: -40px; height: 64px; z-index: 15;
        background: #050507; transform: rotate(-1.4deg);
        border-top: 3px solid var(--accent); border-bottom: 1px solid color-mix(in srgb, var(--accent) 40%, transparent);
        box-shadow: 0 10px 30px rgba(0,0,0,0.6);
        transition: border-color .3s;
      }
      .gp-rail {
        height: 100%; display: flex; align-items: center; gap: 6px;
        padding: 0 80px; overflow-x: auto; overflow-y: hidden; scrollbar-width: none;
      }
      .gp-rail::-webkit-scrollbar { display: none; }
      .gp-rail-key { flex: none; opacity: 0.8; }
      .gp-rail-key:first-child { margin-right: 10px; }
      .gp-rail-key:last-child { margin-left: 10px; }
      .gp-rail-sep {
        flex: none; margin: 0 6px 0 14px; padding: 4px 10px;
        font-weight: 700; font-size: 12px; letter-spacing: 0.3em; color: #050507;
        background: #c7ad71; transform: skewX(-14deg) rotate(3deg);
      }
      .gp-flag {
        flex: none; border: 0; padding: 0; cursor: pointer; background: transparent;
        transform: skewX(-14deg); transition: transform .18s cubic-bezier(.3,1.6,.5,1);
      }
      .gp-flag-in {
        display: inline-flex; align-items: center; gap: 8px; height: 40px; padding: 0 16px;
        background: #121216; color: rgba(245,243,235,0.7);
        border-left: 4px solid var(--c);
        font-weight: 600; font-size: 14px; letter-spacing: 0.06em; text-transform: uppercase; white-space: nowrap;
        transition: background .15s, color .15s;
      }
      .gp-flag-in > * { transform: skewX(14deg); }
      .gp-flag .gy, .gp-flag .gy-ic.is-glyph { font-size: 16px; color: var(--c); line-height: 1; }
      .gp-flag img.gy-ic {
        flex: none; width: 28px; height: 28px; object-fit: contain; display: block;
        filter: drop-shadow(0 1px 2px rgba(0,0,0,0.7));
        opacity: 0.85; transition: opacity .15s;
      }
      .gp-flag:hover img.gy-ic, .gp-flag.on img.gy-ic { opacity: 1; }
      .gp-flag.on img.gy-ic { filter: drop-shadow(2px 2px 0 #050507); }
      .gp-flag .ct { font-size: 11px; opacity: 0.6; font-family: 'Share Tech Mono', monospace; }
      .gp-flag:hover { transform: skewX(-14deg) translateY(-3px); }
      .gp-flag:hover .gp-flag-in { color: #f5f3eb; background: #1c1c22; }
      .gp-flag.on { transform: skewX(-14deg) rotate(-3deg) scale(1.14); z-index: 2; margin: 0 10px; }
      .gp-flag.on .gp-flag-in {
        background: var(--c); color: #050507; font-weight: 700; border-left-color: #f5f3eb;
        box-shadow: 4px 4px 0 #f5f3eb;
      }
      .gp-flag.on .gy, .gp-flag.on .ct { color: #050507; opacity: 1; }

      /* ---------- Titolo ---------- */
      .gp-title {
        position: absolute; top: 204px; left: 52px; width: 700px; z-index: 12;
        transform: rotate(-4deg); transform-origin: left top;
        animation: gp-title-in .45s cubic-bezier(.2,1.3,.4,1) both;
      }
      @keyframes gp-title-in { from { opacity: 0; transform: rotate(-4deg) translateX(-60px) skewX(18deg); } }
      .gp-title-eyebrow { display: flex; align-items: center; gap: 10px; margin-left: 6px; }
      .gp-title-section {
        background: var(--accent); color: #050507; font-weight: 700; font-size: 14px; letter-spacing: 0.24em;
        padding: 3px 12px; transform: skewX(-14deg); transition: background .3s;
      }
      .gp-title-eyebrow-txt { font-family: 'Share Tech Mono', monospace; font-size: 12px; letter-spacing: 0.3em; color: rgba(245,243,235,0.7); }
      .gp-title-text {
        margin: 2px 0 0; font-weight: 700; font-style: italic; text-transform: uppercase;
        font-size: 66px; line-height: 0.95; letter-spacing: -0.01em; color: #f5f3eb;
        text-shadow: 5px 5px 0 var(--accent), 9px 9px 0 #050507;
        white-space: nowrap; overflow: visible;
      }
      .gp-title-text.is-long { font-size: 50px; }
      .gp-title-motto {
        display: inline-block; margin-top: 10px; margin-left: 14px;
        background: #f5f3eb; color: #050507; font-weight: 600; font-size: 15px; font-style: italic;
        padding: 4px 14px; transform: skewX(-14deg) rotate(1.5deg);
        max-width: 620px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }

      .gp--norail .gp-title { top: 120px; }
      .gp--norail .gp-list-col { top: 272px; }

      /* ---------- Lista ---------- */
      .gp-list-col { position: absolute; top: 352px; left: 30px; width: 700px; bottom: 74px; z-index: 10; }
      .gp-list {
        height: 100%; overflow-y: auto; overflow-x: hidden;
        padding: 10px 40px 40px 26px; scrollbar-width: none;
        -webkit-mask-image: linear-gradient(to bottom, transparent 0, #000 22px, #000 calc(100% - 46px), transparent 100%);
        mask-image: linear-gradient(to bottom, transparent 0, #000 22px, #000 calc(100% - 46px), transparent 100%);
      }
      .gp-list::-webkit-scrollbar { display: none; }
      .gp-list--empty { display: grid; place-items: center; font-style: italic; color: rgba(245,243,235,0.5); }
      .gp-row {
        --zz: 0px;
        position: relative; display: block; width: calc(100% - 30px); height: 52px; margin: 0 0 6px;
        padding: 0; border: 0; background: transparent; cursor: pointer; text-align: left; color: inherit;
        transform: translateX(var(--zz)); transition: transform .2s cubic-bezier(.3,1.5,.5,1);
      }
      .gp-row-plate, .gp-row-shadow {
        position: absolute; inset: 0;
        clip-path: polygon(14px 0, 100% 0, calc(100% - 14px) 100%, 0 100%);
      }
      .gp-row-shadow { background: var(--c); opacity: 0; transform: translate(0,0); transition: transform .2s, opacity .15s; }
      .gp-row-plate {
        display: flex; align-items: center; gap: 12px; padding: 0 26px 0 22px;
        background: rgba(14,14,18,0.92);
        border-left: 0; transition: background .15s, color .15s;
      }
      .gp-row-plate::before {
        content: ''; position: absolute; left: 8px; top: 0; bottom: 0; width: 4px;
        background: var(--c); transform: skewX(-15deg); opacity: 0.85;
      }
      .gp-row-cursor {
        position: absolute; left: -34px; top: 50%; width: 28px; height: 30px; margin-top: -15px;
        background: var(--c); clip-path: polygon(0 0, 100% 50%, 0 100%, 30% 50%);
        opacity: 0; transform: translateX(-12px); transition: opacity .15s, transform .2s;
      }
      .gp-row-num { flex: none; width: 46px; font-family: 'Share Tech Mono', monospace; font-size: 13px; color: var(--c); letter-spacing: 0.04em; }
      .gp-row-thumb {
        flex: none; width: 40px; height: 40px; overflow: hidden; background: #000;
        clip-path: polygon(20% 0, 100% 0, 80% 100%, 0 100%);
      }
      .gp-row-thumb img { width: 100%; height: 100%; object-fit: cover; object-position: 50% 22%; display: block; }
      .gp-row-glyph, .gp-row-icon.is-glyph { flex: none; width: 30px; text-align: center; font-size: 20px; color: var(--c); }
      img.gp-row-icon {
        flex: none; width: 40px; height: 40px; object-fit: contain; display: block;
        filter: drop-shadow(0 1px 2px rgba(0,0,0,0.8));
      }
      .gp-row.on img.gp-row-icon { filter: drop-shadow(2px 2px 0 var(--c)); }
      .gp-row-text { flex: 1; min-width: 0; display: flex; flex-direction: column; line-height: 1.1; }
      .gp-row-title {
        font-weight: 600; font-size: 19px; text-transform: uppercase; letter-spacing: 0.02em;
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }
      .gp-row-sub { font-family: 'Share Tech Mono', monospace; font-size: 11px; letter-spacing: 0.12em; opacity: 0.6; text-transform: uppercase; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .gp-row-meta { flex: none; font-weight: 700; font-size: 15px; letter-spacing: 0.04em; opacity: 0.85; }
      .gp-row:hover { transform: translateX(calc(var(--zz) + 8px)); }
      .gp-row:hover .gp-row-plate { background: rgba(32,32,40,0.96); }
      .gp-row.on { transform: translateX(calc(var(--zz) + 26px)) rotate(-1.5deg) scale(1.04); z-index: 2; }
      .gp-row.on .gp-row-shadow { opacity: 1; transform: translate(9px, 7px); }
      .gp-row.on .gp-row-plate { background: #f5f3eb; color: #050507; }
      .gp-row.on .gp-row-plate::before { background: #050507; }
      .gp-row.on .gp-row-num { color: #050507; font-weight: 700; }
      .gp-row.on .gp-row-sub { opacity: 0.75; }
      .gp-row.on .gp-row-title { font-weight: 700; }
      .gp-row.on .gp-row-cursor { opacity: 1; transform: translateX(0); animation: gp-cursor 0.9s ease-in-out infinite; }
      @keyframes gp-cursor { 50% { transform: translateX(6px); } }

      /* ---------- Stage ---------- */
      .gp-stage { position: absolute; top: 176px; left: 760px; right: 40px; bottom: 74px; z-index: 8; }

      /* ---------- Targa nome ---------- */
      .gp-nameplate { display: inline-flex; flex-direction: column; align-items: flex-end; text-align: right; transform: rotate(-3deg); }
      .gp-nameplate-num {
        background: #050507; color: var(--accent); font-family: 'Share Tech Mono', monospace; font-size: 14px;
        letter-spacing: 0.2em; padding: 3px 12px; transform: skewX(-14deg); margin-right: 18px;
      }
      .gp-nameplate-name {
        position: relative; margin-top: 4px; padding: 6px 26px 8px 30px;
        background: #f5f3eb; color: #050507;
        font-weight: 700; font-style: italic; text-transform: uppercase;
        font-size: 40px; line-height: 1; letter-spacing: -0.01em;
        clip-path: polygon(16px 0, 100% 0, calc(100% - 10px) 100%, 0 100%);
        box-shadow: none; max-width: 760px;
        filter: drop-shadow(8px 8px 0 var(--accent));
      }
      .gp-nameplate-sub {
        margin-top: 8px; margin-right: 22px; background: var(--accent); color: #050507;
        font-weight: 700; font-size: 13px; letter-spacing: 0.24em; text-transform: uppercase;
        padding: 3px 12px; transform: skewX(-14deg);
      }

      /* ---------- Stat burst ---------- */
      .gp-burst { position: relative; width: 112px; height: 112px; display: grid; place-items: center; flex: none; }
      .gp-burst-shape {
        position: absolute; inset: 0; background: #f5f3eb;
        clip-path: ${GP_STAR_CLIP};
        filter: drop-shadow(5px 5px 0 #050507);
        animation: gp-burst-spin 18s linear infinite;
      }
      .gp-burst--accent .gp-burst-shape { background: var(--accent); }
      .gp-burst--dark .gp-burst-shape { background: #050507; outline: 0; }
      @keyframes gp-burst-spin { to { transform: rotate(360deg); } }
      .gp-burst-val {
        position: relative; font-weight: 700; font-style: italic; font-size: 50px; line-height: 1; color: #050507;
        transform: rotate(-6deg) translateY(-4px);
      }
      .gp-burst--dark .gp-burst-val { color: #f5f3eb; }
      .gp-burst-lbl {
        position: absolute; bottom: 4px; left: 50%; transform: translateX(-50%) skewX(-14deg);
        background: #050507; color: #f5f3eb; font-weight: 700; font-size: 11px; letter-spacing: 0.22em; padding: 2px 8px;
      }

      /* ---------- Hint ---------- */
      .gp-hints {
        position: absolute; left: 0; right: 0; bottom: 0; height: 58px; z-index: 18;
        display: flex; align-items: center; justify-content: flex-end; gap: 26px; padding: 0 48px;
        background: linear-gradient(to top, rgba(0,0,0,0.92), rgba(0,0,0,0.6) 70%, transparent);
      }
      .gp-hint { display: inline-flex; align-items: center; gap: 5px; }
      .gp-hint .lbl { margin-left: 6px; font-weight: 700; font-size: 14px; letter-spacing: 0.16em; font-style: italic; }

      /* ---------- Intro: tre lame diagonali ---------- */
      .gp-intro { position: absolute; inset: 0; z-index: 100; pointer-events: none; overflow: hidden; }
      .gp-intro > span {
        position: absolute; top: -30%; bottom: -30%; width: 46%;
        transform: skewX(-18deg) translateX(0);
        animation: gp-blade .62s cubic-bezier(.7,0,.3,1) forwards;
      }
      .gp-intro > span:nth-child(1) { left: -8%; background: var(--accent); }
      .gp-intro > span:nth-child(2) { left: 30%; background: #050507; animation-delay: .05s; }
      .gp-intro > span:nth-child(3) { left: 68%; background: #f5f3eb; animation-delay: .1s; }
      @keyframes gp-blade { to { transform: skewX(-18deg) translateX(260%); } }

      /* ---------- Animazioni di ingresso nello stage ---------- */
      @keyframes gp-slam {
        0% { opacity: 0; transform: translate(140px, -30px) rotate(14deg) scale(1.25); }
        55% { opacity: 1; transform: translate(-10px, 4px) rotate(-7deg) scale(0.97); }
        100% { opacity: 1; transform: translate(0,0) rotate(-4deg) scale(1); }
      }
      @keyframes gp-swipe-in {
        from { opacity: 0; transform: translateX(80px) skewX(-10deg); }
        to { opacity: 1; transform: none; }
      }
      @keyframes gp-portrait-in {
        from { opacity: 0; transform: translateX(120px) scale(1.06); clip-path: polygon(100% 0, 100% 0, 100% 100%, 100% 100%); }
        to { opacity: 1; transform: none; }
      }
      .gp-anim-swipe { animation: gp-swipe-in .38s cubic-bezier(.2,1,.3,1) both; }
      .gp-anim-swipe.d1 { animation-delay: .06s; }
      .gp-anim-swipe.d2 { animation-delay: .12s; }
      .gp-anim-swipe.d3 { animation-delay: .18s; }

      /* Pannelli testo comuni nello stage */
      .gp-panel {
        position: relative; background: rgba(5,5,7,0.9); padding: 16px 22px;
        border-left: 5px solid var(--accent);
        clip-path: polygon(0 0, 100% 0, calc(100% - 14px) 100%, 0 100%);
      }
      .gp-panel-label {
        display: inline-block; margin-bottom: 8px;
        background: var(--accent); color: #050507; font-weight: 700; font-size: 12px; letter-spacing: 0.24em;
        padding: 2px 10px; transform: skewX(-14deg);
      }
      .gp-panel--light { background: #f5f3eb; color: #050507; border-left-color: #050507; }
      .gp-panel--light .gp-panel-label { background: #050507; color: #f5f3eb; }

      @media (prefers-reduced-motion: reduce) {
        .gp *, .gp *::before, .gp *::after { animation-duration: 0.001s !important; animation-delay: 0s !important; transition-duration: 0.001s !important; }
        .gp-intro { display: none; }
      }
    `}</style>
  );
}

export default GalleryPersonaShell;

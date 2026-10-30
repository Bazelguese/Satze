// ============================================
// GLOSSARIO - stile Persona (popup)
// ============================================
// Pannello nero inclinato con bordo e ombra d'accento, titolo strappato,
// ricerca a piastra, categorie a bandiere skew (filtro), voci a piastra con
// cursore: la voce aperta diventa crema con ombra del colore di categoria.
//
// Tastiera (in cattura: i tasti usati qui non arrivano alla schermata sotto):
//   ↑/↓  voce            ←/→  categoria (nella ricerca solo se vuota)
//   Invio apre/chiude il dettaglio   Esc svuota la ricerca, poi chiude
// ============================================

import { useState, useMemo, useEffect, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { GLOSSARY_TERMS, GLOSSARY_CATEGORIES } from '../data/glossary';
import { MENU_ACCENTS } from '../theme/hudOratorioPalette';
import { playUiClick } from '../audio/soundBus';

const CATEGORY_ORDER = ['concetti', 'vittoria', 'trigger', 'effetti', 'archetipi'];

const CATEGORY_COLORS = {
  amber: '#fbbf24',
  cyan: '#22d3ee',
  purple: '#a78bfa',
  emerald: '#34d399',
  green: '#4ade80',
  rose: '#fb7185',
};

/** Glifi al posto delle emoji dei dati (niente emoji nella UI principale). */
const CATEGORY_GLYPHS = {
  concetti: '◆',
  vittoria: '★',
  trigger: '◎',
  effetti: '✦',
  archetipi: '▲',
};

const ALL = 'tutti';

function normalize(str) {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // rimuove accenti
    .trim();
}

function matchesSearch(term, query) {
  if (!query) return true;
  const q = normalize(query);
  const searchable = normalize([term.term, term.abbr, term.desc].filter(Boolean).join(' '));
  return searchable.includes(q);
}

function categoryColor(cat) {
  return CATEGORY_COLORS[GLOSSARY_CATEGORIES[cat]?.color] || CATEGORY_COLORS.amber;
}

export function Glossary({ onClose, originButtonRef, zIndex = 50, variant = 'duel' }) {
  const accent = variant === 'menu' ? MENU_ACCENTS.magenta : '#a78bfa';
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(ALL);
  const [activeIndex, setActiveIndex] = useState(0);
  const [expandedKey, setExpandedKey] = useState(null);
  const [originRect, setOriginRect] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const listRef = useRef(null);
  const rowRefs = useRef([]);
  /** Scorre la lista solo per tastiera o apertura dettaglio, non al passaggio del mouse. */
  const scrollToActiveRef = useRef(false);

  useEffect(() => {
    if (originButtonRef?.current) {
      const rect = originButtonRef.current.getBoundingClientRect();
      setOriginRect({ left: rect.left, top: rect.top, width: rect.width, height: rect.height });
    } else {
      setOriginRect({ left: window.innerWidth / 2 - 100, top: window.innerHeight / 2 - 50, width: 200, height: 100 });
    }
  }, [originButtonRef]);

  useEffect(() => {
    if (originRect) {
      const id = requestAnimationFrame(() => requestAnimationFrame(() => setExpanded(true)));
      return () => cancelAnimationFrame(id);
    }
  }, [originRect]);

  // Blocca scroll body per evitare layout shift
  useEffect(() => {
    const scrollY = window.scrollY;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;
    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
      window.scrollTo(0, scrollY);
    };
  }, []);

  const searchedTerms = useMemo(() => {
    if (!search.trim()) return GLOSSARY_TERMS;
    return GLOSSARY_TERMS.filter((t) => matchesSearch(t, search));
  }, [search]);

  const counts = useMemo(() => {
    const c = { [ALL]: searchedTerms.length };
    CATEGORY_ORDER.forEach((cat) => {
      c[cat] = 0;
    });
    searchedTerms.forEach((t) => {
      c[t.category] = (c[t.category] || 0) + 1;
    });
    return c;
  }, [searchedTerms]);

  // Se la ricerca svuota la categoria scelta si mostrano tutte (il termine può stare altrove).
  const shownCategory = counts[category] ? category : ALL;

  /** Voci visibili, già nell'ordine delle categorie (indice = cursore). */
  const rows = useMemo(() => {
    const cats = shownCategory === ALL ? CATEGORY_ORDER : [shownCategory];
    const out = [];
    cats.forEach((cat) => {
      searchedTerms
        .filter((t) => t.category === cat)
        .forEach((t, i) => out.push({ ...t, key: `${cat}-${t.term}-${i}`, color: categoryColor(cat) }));
    });
    return out;
  }, [searchedTerms, shownCategory]);

  useEffect(() => {
    setActiveIndex(0);
    listRef.current?.scrollTo({ top: 0 });
  }, [search, shownCategory]);

  useLayoutEffect(() => {
    const list = listRef.current;
    const row = rowRefs.current[activeIndex];
    const wanted = scrollToActiveRef.current;
    scrollToActiveRef.current = false;
    if (!list || !row || !wanted) return;
    const pad = 36;
    if (row.offsetTop - pad < list.scrollTop) list.scrollTo({ top: Math.max(0, row.offsetTop - pad) });
    else if (row.offsetTop + row.offsetHeight + pad > list.scrollTop + list.clientHeight) {
      list.scrollTo({ top: row.offsetTop + row.offsetHeight + pad - list.clientHeight });
    }
  }, [activeIndex, expandedKey, rows]);

  const railItems = [ALL, ...CATEGORY_ORDER];

  const toggleRow = (i) => {
    const row = rows[i];
    if (!row?.detail) return;
    playUiClick();
    scrollToActiveRef.current = true;
    setActiveIndex(i);
    setExpandedKey((k) => (k === row.key ? null : row.key));
  };

  const selectCategory = (cat) => {
    if (cat === shownCategory) return;
    playUiClick();
    setCategory(cat);
  };

  const keyRef = useRef({});
  keyRef.current = { rows, activeIndex, category: shownCategory, search, onClose, toggleRow, selectCategory };

  useEffect(() => {
    const onKey = (e) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      const k = keyRef.current;
      const inInput = e.target?.tagName === 'INPUT';
      const handled = () => {
        e.preventDefault();
        e.stopPropagation();
      };
      switch (e.key) {
        case 'ArrowUp':
        case 'ArrowDown': {
          handled();
          if (!k.rows.length) return;
          const dir = e.key === 'ArrowUp' ? -1 : 1;
          scrollToActiveRef.current = true;
          setActiveIndex((i) => Math.min(k.rows.length - 1, Math.max(0, i + dir)));
          break;
        }
        case 'ArrowLeft':
        case 'ArrowRight': {
          if (inInput && k.search) return;
          handled();
          const order = [ALL, ...CATEGORY_ORDER];
          const i = order.indexOf(k.category);
          const dir = e.key === 'ArrowLeft' ? -1 : 1;
          k.selectCategory(order[(i + dir + order.length) % order.length]);
          break;
        }
        case 'Enter': {
          handled();
          k.toggleRow(k.activeIndex);
          break;
        }
        case 'Escape': {
          handled();
          if (inInput && k.search) setSearch('');
          else k.onClose?.();
          break;
        }
        default:
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, []);

  if (!originRect) return null;

  let lastCat = null;

  const content = (
    <div
      className="sgl satze-glossary-backdrop"
      onClick={onClose}
      style={{ zIndex, '--accent': accent }}
    >
      <div
        className="sgl-panel"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sgl-title"
        style={{
          transform: expanded
            ? 'translate(50vw, 50vh) translate(-50%, -50%) rotate(-1deg) scale(1)'
            : `translate(${originRect.left}px, ${originRect.top}px) scale(0.12) skewX(-12deg)`,
          opacity: expanded ? 1 : 0,
        }}
      >
        <div className="sgl-in">
          <header className="sgl-head">
            <div className="sgl-title-wrap">
              <div className="sgl-eyebrow">
                <span className="sec">ARCHIVIO</span>
                <span className="txt">REGOLE · TERMINI · EFFETTI</span>
              </div>
              <h2 id="sgl-title" className="sgl-title">GLOSSARIO</h2>
            </div>
            <div className="sgl-counter">
              <span className="cur">{String(rows.length ? activeIndex + 1 : 0).padStart(2, '0')}</span>
              <span className="sep">/</span>
              <span className="tot">{String(rows.length).padStart(2, '0')}</span>
            </div>
            <button type="button" className="sgl-close" onClick={onClose} aria-label="Chiudi glossario">
              <span className="key">ESC</span>
              <span className="lbl">CHIUDI</span>
            </button>
          </header>

          <div className="sgl-search">
            <span className="sgl-search-lbl">CERCA</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="POT, Campione, Vorace..."
              aria-label="Cerca nel glossario"
              autoFocus
            />
            {search && (
              <span className="sgl-search-count">
                {searchedTerms.length} {searchedTerms.length === 1 ? 'RISULTATO' : 'RISULTATI'}
              </span>
            )}
          </div>

          <div className="sgl-rail" role="tablist">
            {railItems.map((cat) => {
              const on = cat === shownCategory;
              const meta = GLOSSARY_CATEGORIES[cat];
              return (
                <button
                  key={cat}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  className={`sgl-flag ${on ? 'on' : ''}`}
                  style={{ '--c': cat === ALL ? '#f5f3eb' : categoryColor(cat) }}
                  disabled={!counts[cat] && !on}
                  onClick={() => selectCategory(cat)}
                >
                  <span className="sgl-flag-in">
                    {cat !== ALL && <span className="gy">{CATEGORY_GLYPHS[cat]}</span>}
                    <span className="nm">{cat === ALL ? 'Tutti' : meta.label}</span>
                    <span className="ct">{counts[cat]}</span>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="sgl-list" ref={listRef}>
            {rows.length === 0 ? (
              <div className="sgl-empty">
                <p className="t">NESSUN TERMINE TROVATO</p>
                <p className="s">Prova con altre parole (es. POT, trigger, VA)</p>
              </div>
            ) : (
              rows.map((t, i) => {
                const showGroup = shownCategory === ALL && t.category !== lastCat;
                lastCat = t.category;
                const isOpen = expandedKey === t.key;
                const isActive = i === activeIndex;
                return (
                  <div key={t.key} className="sgl-item" style={{ '--c': t.color }}>
                    {showGroup && (
                      <div className="sgl-group">
                        <span className="gy">{CATEGORY_GLYPHS[t.category]}</span>
                        {GLOSSARY_CATEGORIES[t.category].label}
                      </div>
                    )}
                    <button
                      type="button"
                      ref={(el) => {
                        rowRefs.current[i] = el;
                      }}
                      className={`sgl-row ${isActive ? 'is-active' : ''} ${isOpen ? 'is-open' : ''} ${t.detail ? '' : 'no-detail'}`}
                      aria-expanded={t.detail ? isOpen : undefined}
                      onMouseEnter={() => setActiveIndex(i)}
                      onClick={() => toggleRow(i)}
                    >
                      <span className="sgl-row-shadow" aria-hidden="true" />
                      <span className="sgl-row-plate">
                        <span className="sgl-row-cursor" aria-hidden="true" />
                        <span className="sgl-row-text">
                          <span className="sgl-row-term">
                            {t.term}
                            {t.abbr && <span className="abbr">{t.abbr}</span>}
                          </span>
                          <span className="sgl-row-desc">{t.desc}</span>
                        </span>
                        {t.detail && <span className="sgl-row-toggle" aria-hidden="true">{isOpen ? '−' : '+'}</span>}
                      </span>
                    </button>
                    {isOpen && <div className="sgl-detail">{t.detail}</div>}
                  </div>
                );
              })
            )}
          </div>

          <footer className="sgl-hints">
            <span className="sgl-hint"><kbd>↑</kbd><kbd>↓</kbd><span className="lbl">TERMINE</span></span>
            <span className="sgl-hint"><kbd>←</kbd><kbd>→</kbd><span className="lbl">CATEGORIA</span></span>
            <span className="sgl-hint"><kbd>INVIO</kbd><span className="lbl">DETTAGLIO</span></span>
            <span className="sgl-hint"><kbd>ESC</kbd><span className="lbl">CHIUDI</span></span>
          </footer>
        </div>
      </div>
      <GlossaryStyles />
    </div>
  );

  return createPortal(content, document.body);
}

function GlossaryStyles() {
  const V = '#050507';
  const T = MENU_ACCENTS.text;
  return (
    <style>{`
      .sgl {
        position: fixed; inset: 0;
        background:
          repeating-linear-gradient(-77deg, rgba(255,255,255,0.035) 0 2px, transparent 2px 46px),
          radial-gradient(circle, color-mix(in srgb, var(--accent) 40%, transparent) 1.3px, transparent 1.7px) 0 0 / 11px 11px,
          rgba(5,5,7,0.86);
        font-family: 'Chakra Petch', system-ui, sans-serif; color: ${T};
      }
      .sgl * { box-sizing: border-box; }
      .sgl kbd {
        display: inline-grid; place-items: center; min-width: 22px; height: 20px; padding: 0 5px;
        background: ${T}; color: ${V}; border: 0;
        font-family: 'Chakra Petch', sans-serif; font-weight: 700; font-size: 11px; line-height: 1;
        clip-path: polygon(3px 0, 100% 0, calc(100% - 3px) 100%, 0 100%);
      }

      .sgl-panel {
        position: fixed; left: 0; top: 0;
        width: min(780px, 92vw); height: min(86vh, 920px);
        transform-origin: 0 0;
        display: flex; flex-direction: column;
        filter: drop-shadow(12px 12px 0 var(--accent));
        transition: transform .5s cubic-bezier(.2,1.15,.4,1), opacity .2s ease-out;
      }
      .sgl-in {
        flex: 1; min-height: 0; display: flex; flex-direction: column;
        background: ${V}; border-left: 8px solid var(--accent);
        clip-path: polygon(0 0, 100% 0, calc(100% - 22px) 100%, 0 100%);
        padding: 22px 34px 0 30px;
      }

      /* ---------- Testata ---------- */
      .sgl-head { display: flex; align-items: flex-start; gap: 18px; flex: none; }
      .sgl-title-wrap { flex: 1; min-width: 0; transform: rotate(-3deg); transform-origin: left top; }
      .sgl-eyebrow { display: flex; align-items: center; gap: 10px; }
      .sgl-eyebrow .sec {
        background: var(--accent); color: ${V}; font-weight: 700; font-size: 12px; letter-spacing: 0.24em;
        padding: 3px 11px; transform: skewX(-14deg);
      }
      .sgl-eyebrow .txt {
        font-family: 'Share Tech Mono', monospace; font-size: 11px; letter-spacing: 0.26em; color: rgba(245,243,235,0.65);
        white-space: nowrap;
      }
      .sgl-title {
        margin: 4px 0 0; font-weight: 700; font-style: italic; text-transform: uppercase;
        font-size: 50px; line-height: 0.95; letter-spacing: -0.01em; color: ${T};
        text-shadow: 4px 4px 0 var(--accent), 7px 7px 0 ${V};
      }
      .sgl-counter { flex: none; margin-top: 18px; font-weight: 700; font-style: italic; line-height: 0.9; transform: rotate(-3deg); }
      .sgl-counter .cur { font-size: 40px; color: var(--accent); text-shadow: 3px 3px 0 #000; }
      .sgl-counter .sep { font-size: 24px; margin: 0 3px; }
      .sgl-counter .tot { font-size: 20px; }
      .sgl-close {
        flex: none; display: inline-flex; align-items: center; gap: 10px; margin-top: 4px;
        background: ${T}; color: ${V}; border: 0; cursor: pointer;
        padding: 7px 18px 7px 10px; transform: skewX(-14deg) rotate(-2deg);
        box-shadow: 5px 5px 0 var(--accent);
        transition: transform .15s, box-shadow .15s;
      }
      .sgl-close > * { transform: skewX(14deg); }
      .sgl-close:hover, .sgl-close:focus-visible {
        outline: none; transform: skewX(-14deg) rotate(-2deg) translate(-3px,-3px); box-shadow: 8px 8px 0 var(--accent);
      }
      .sgl-close .key { background: ${V}; color: ${T}; font-weight: 700; font-size: 11px; padding: 3px 6px; letter-spacing: 0.06em; }
      .sgl-close .lbl { font-weight: 700; font-style: italic; font-size: 16px; letter-spacing: 0.1em; }

      /* ---------- Ricerca ---------- */
      .sgl-search {
        flex: none; position: relative; display: flex; align-items: center; margin: 22px 8px 0 4px; height: 44px;
        background: #121216; border-left: 5px solid var(--accent);
        clip-path: polygon(12px 0, 100% 0, calc(100% - 12px) 100%, 0 100%);
        transition: background .15s;
      }
      .sgl-search:focus-within { background: #1c1c22; }
      .sgl-search-lbl {
        flex: none; margin-left: 14px; background: var(--accent); color: ${V};
        font-weight: 700; font-size: 12px; letter-spacing: 0.24em; padding: 3px 10px; transform: skewX(-14deg);
      }
      .sgl-search input {
        flex: 1; min-width: 0; height: 100%; padding: 0 14px; border: 0; outline: none; background: transparent;
        color: ${T}; font-family: 'Chakra Petch', sans-serif; font-size: 16px; font-weight: 600; letter-spacing: 0.03em;
      }
      .sgl-search input::placeholder { color: rgba(245,243,235,0.35); font-style: italic; font-weight: 500; }
      .sgl-search-count {
        flex: none; margin-right: 22px; font-family: 'Share Tech Mono', monospace; font-size: 11px; letter-spacing: 0.2em;
        color: var(--accent);
      }

      /* ---------- Categorie ---------- */
      .sgl-rail { flex: none; display: flex; flex-wrap: wrap; gap: 6px 4px; margin: 14px 0 4px; padding-left: 4px; }
      .sgl-flag {
        flex: none; border: 0; padding: 0; cursor: pointer; background: transparent;
        transform: skewX(-14deg); transition: transform .18s cubic-bezier(.3,1.6,.5,1);
      }
      .sgl-flag:disabled { cursor: default; opacity: 0.35; }
      .sgl-flag-in {
        display: inline-flex; align-items: center; gap: 7px; height: 32px; padding: 0 12px;
        background: #121216; color: rgba(245,243,235,0.72);
        border-left: 4px solid var(--c);
        font-weight: 600; font-size: 12.5px; letter-spacing: 0.06em; text-transform: uppercase; white-space: nowrap;
        transition: background .15s, color .15s;
      }
      .sgl-flag-in > * { transform: skewX(14deg); }
      .sgl-flag .gy { color: var(--c); font-size: 13px; line-height: 1; }
      .sgl-flag .ct { font-family: 'Share Tech Mono', monospace; font-size: 11px; opacity: 0.6; }
      .sgl-flag:not(:disabled):hover { transform: skewX(-14deg) translateY(-2px); }
      .sgl-flag:not(:disabled):hover .sgl-flag-in { background: #1c1c22; color: ${T}; }
      .sgl-flag.on { transform: skewX(-14deg) rotate(-2deg) scale(1.08); margin: 0 6px; z-index: 1; }
      .sgl-flag.on .sgl-flag-in { background: var(--c); color: ${V}; font-weight: 700; border-left-color: ${T}; box-shadow: 3px 3px 0 ${T}; }
      .sgl-flag.on .gy, .sgl-flag.on .ct { color: ${V}; opacity: 1; }

      /* ---------- Lista ---------- */
      .sgl-list {
        flex: 1; min-height: 0; overflow-y: auto; overflow-x: hidden;
        padding: 10px 26px 30px 40px; margin-left: -10px;
        scrollbar-width: thin; scrollbar-color: color-mix(in srgb, var(--accent) 60%, transparent) transparent;
        -webkit-mask-image: linear-gradient(to bottom, transparent 0, #000 14px, #000 calc(100% - 30px), transparent 100%);
        mask-image: linear-gradient(to bottom, transparent 0, #000 14px, #000 calc(100% - 30px), transparent 100%);
      }
      .sgl-empty { padding: 60px 0; text-align: center; }
      .sgl-empty .t { margin: 0 0 8px; font-weight: 700; font-style: italic; font-size: 22px; letter-spacing: 0.06em; }
      .sgl-empty .s { margin: 0; font-size: 14px; color: rgba(245,243,235,0.6); }

      .sgl-group {
        display: inline-flex; align-items: center; gap: 8px; margin: 16px 0 10px -6px;
        background: var(--c); color: ${V}; font-weight: 700; font-size: 13px; letter-spacing: 0.22em; text-transform: uppercase;
        padding: 4px 14px 4px 12px; transform: skewX(-14deg) rotate(-1.5deg);
        box-shadow: 4px 4px 0 ${T};
      }
      .sgl-item:first-child .sgl-group { margin-top: 4px; }

      .sgl-row {
        position: relative; display: block; width: 100%; margin: 0 0 6px;
        padding: 0; border: 0; background: transparent; cursor: pointer; text-align: left; color: inherit;
        outline: none; transition: transform .18s cubic-bezier(.3,1.5,.5,1);
      }
      .sgl-row.no-detail { cursor: default; }
      .sgl-row-shadow, .sgl-row-plate { clip-path: polygon(10px 0, 100% 0, calc(100% - 10px) 100%, 0 100%); }
      .sgl-row-shadow { position: absolute; inset: 0; background: var(--c); opacity: 0; transition: transform .2s, opacity .15s; }
      .sgl-row-plate {
        position: relative; display: flex; align-items: flex-start; gap: 12px; padding: 9px 22px 10px 22px;
        background: rgba(18,18,22,0.96); transition: background .15s, color .15s;
      }
      .sgl-row-plate::before {
        content: ''; position: absolute; left: 6px; top: 0; bottom: 0; width: 4px;
        background: var(--c); transform: skewX(-12deg);
      }
      .sgl-row-cursor {
        position: absolute; left: -30px; top: 50%; width: 22px; height: 24px; margin-top: -12px;
        background: var(--c); clip-path: polygon(0 0, 100% 50%, 0 100%, 30% 50%);
        opacity: 0; transform: translateX(-8px); transition: opacity .15s, transform .2s;
      }
      .sgl-row-text { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
      .sgl-row-term {
        font-weight: 700; font-style: italic; font-size: 17px; text-transform: uppercase; letter-spacing: 0.03em;
        color: var(--c); line-height: 1.1;
      }
      .sgl-row-term .abbr {
        display: inline-block; margin-left: 10px; padding: 1px 8px; vertical-align: 2px;
        background: var(--c); color: ${V}; font-style: normal; font-size: 11px; letter-spacing: 0.14em;
        transform: skewX(-14deg);
      }
      .sgl-row-desc { font-size: 14px; line-height: 1.35; color: rgba(245,243,235,0.82); }
      .sgl-row-toggle {
        flex: none; align-self: center; width: 26px; height: 26px; display: grid; place-items: center;
        font-weight: 700; font-size: 20px; line-height: 1; color: var(--c);
        border: 2px solid var(--c); transform: skewX(-14deg);
      }

      .sgl-row.is-active { transform: translateX(10px); }
      .sgl-row.is-active .sgl-row-plate { background: rgba(32,32,40,0.98); }
      .sgl-row.is-active .sgl-row-cursor { opacity: 1; transform: translateX(0); animation: sgl-cursor .9s ease-in-out infinite; }
      @keyframes sgl-cursor { 50% { transform: translateX(5px); } }

      .sgl-row.is-open { transform: translateX(10px) rotate(-0.8deg); z-index: 1; }
      .sgl-row.is-open .sgl-row-shadow { opacity: 1; transform: translate(7px, 6px); }
      .sgl-row.is-open .sgl-row-plate { background: ${T}; color: ${V}; }
      .sgl-row.is-open .sgl-row-plate::before { background: ${V}; }
      .sgl-row.is-open .sgl-row-term { color: ${V}; }
      .sgl-row.is-open .sgl-row-term .abbr { background: ${V}; color: ${T}; }
      .sgl-row.is-open .sgl-row-desc { color: rgba(5,5,7,0.82); }
      .sgl-row.is-open .sgl-row-toggle { color: ${V}; border-color: ${V}; background: var(--c); }

      .sgl-detail {
        margin: 6px 6px 14px 26px; padding: 10px 16px 12px;
        border-left: 4px solid var(--c);
        background: linear-gradient(90deg, color-mix(in srgb, var(--c) 14%, transparent), transparent 85%);
        font-size: 14px; line-height: 1.5; color: rgba(245,243,235,0.86);
        animation: sgl-detail-in .28s cubic-bezier(.2,1,.3,1) both;
      }
      @keyframes sgl-detail-in { from { opacity: 0; transform: translateX(30px) skewX(-8deg); } }

      /* ---------- Barra comandi ---------- */
      .sgl-hints {
        flex: none; display: flex; align-items: center; justify-content: flex-end; flex-wrap: wrap; gap: 8px 20px;
        min-height: 46px; padding: 8px 24px 10px 0;
        border-top: 1px solid color-mix(in srgb, var(--accent) 35%, transparent);
      }
      .sgl-hint { display: inline-flex; align-items: center; gap: 4px; }
      .sgl-hint .lbl { margin-left: 5px; font-weight: 700; font-style: italic; font-size: 12px; letter-spacing: 0.14em; }

      @media (prefers-reduced-motion: reduce) {
        .sgl *, .sgl *::before, .sgl *::after { animation-duration: 0.001s !important; animation-delay: 0s !important; transition-duration: 0.001s !important; }
      }
    `}</style>
  );
}

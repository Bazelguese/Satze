// ============================================
// GLOSSARIO - stile Persona (popup)
// ============================================
// Pannello nero inclinato con bordo e ombra d'accento, titolo che si
// decifra dalle rune delle carte, ricerca a piastra, capitoli a bandiere
// skew con la loro runa, voci a piastra con cursore: la voce aperta diventa
// crema con ombra del colore del capitolo, sigla in una stella e dettaglio
// su piastra scura. Sul fondo retino, lama d'accento e la runa del capitolo
// in filigrana; all'apertura tre lame attraversano il pannello.
//
// Tastiera (in cattura: i tasti usati qui non arrivano alla schermata sotto):
//   ↑/↓  voce            ←/→  capitolo (nella ricerca solo se vuota)
//   Invio apre/chiude il dettaglio   Esc svuota la ricerca, poi chiude
// ============================================

import { useState, useMemo, useEffect, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { GLOSSARY_TERMS, GLOSSARY_CATEGORIES } from '../data/glossary';
import { MENU_ACCENTS } from '../theme/hudOratorioPalette';
import { playSound, playUiClick } from '../audio/soundBus';
import { UI_SOUND } from '../audio/soundCatalog';
import { RuneTitle, CARD_RUNES } from './ui/RuneTitle.jsx';

const CATEGORY_ORDER = ['concetti', 'vittoria', 'trigger', 'effetti', 'archetipi'];
const ALL = 'tutti';

const CATEGORY_COLORS = {
  amber: '#fbbf24',
  cyan: '#22d3ee',
  purple: '#a78bfa',
  emerald: '#34d399',
  green: '#4ade80',
  rose: '#fb7185',
};

/** Una runa delle carte per capitolo (bandiere, intestazioni, filigrana). */
const CATEGORY_RUNE = { [ALL]: 8, concetti: 0, vittoria: 1, trigger: 2, effetti: 3, archetipi: 5 };

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
  if (cat === ALL) return MENU_ACCENTS.text;
  return CATEGORY_COLORS[GLOSSARY_CATEGORIES[cat]?.color] || CATEGORY_COLORS.amber;
}

function Rune({ index, className = '' }) {
  return (
    <svg className={`sgl-rune ${className}`} viewBox="-4 -4 8 8" aria-hidden="true">
      <path d={CARD_RUNES[index % CARD_RUNES.length]} />
    </svg>
  );
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

  // Se la ricerca svuota il capitolo scelto si mostrano tutti (il termine può stare altrove).
  const shownCategory = counts[category] ? category : ALL;

  /** Voci visibili, già nell'ordine dei capitoli (indice = cursore). */
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

  const moveTo = (i) => {
    if (i === activeIndex || i < 0 || i >= rows.length) return;
    playSound(UI_SOUND.NAVIGATE);
    setActiveIndex(i);
  };

  const selectCategory = (cat) => {
    if (cat === shownCategory) return;
    playUiClick();
    setCategory(cat);
  };

  const keyRef = useRef({});
  keyRef.current = { rows, counts, activeIndex, category: shownCategory, search, onClose, toggleRow, moveTo, selectCategory };

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
          scrollToActiveRef.current = true;
          k.moveTo(k.activeIndex + (e.key === 'ArrowUp' ? -1 : 1));
          break;
        }
        case 'ArrowLeft':
        case 'ArrowRight': {
          if (inInput && k.search) return;
          handled();
          const order = [ALL, ...CATEGORY_ORDER].filter((c) => c === ALL || c === k.category || k.counts[c]);
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
  const chapterColor = categoryColor(shownCategory);

  const content = (
    <div className="sgl satze-glossary-backdrop" onClick={onClose} style={{ zIndex, '--accent': accent }}>
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
          '--chapter': chapterColor,
        }}
      >
        <div className="sgl-in">
          <div className="sgl-deco" aria-hidden="true">
            <span className="sgl-deco-blade" />
            <span className="sgl-deco-halftone" />
            <Rune key={shownCategory} index={CATEGORY_RUNE[shownCategory]} className="sgl-deco-rune" />
          </div>

          <header className="sgl-head">
            <div className="sgl-title-wrap">
              <div className="sgl-eyebrow">
                <span className="sec">ARCHIVIO</span>
                <span className="txt">REGOLE DI GUERRA</span>
              </div>
              <h2 id="sgl-title" className="sgl-title">
                <RuneTitle text="Glossario" global={false} delay={420} stepMs={55} />
              </h2>
            </div>
            <div className="sgl-counter" aria-hidden="true">
              <span className="cur">{String(rows.length ? activeIndex + 1 : 0).padStart(2, '0')}</span>
              <span className="sep">/</span>
              <span className="tot">{String(rows.length).padStart(2, '0')}</span>
            </div>
            <button type="button" className="sgl-close" onClick={onClose} aria-label="Chiudi glossario">
              <span className="key">ESC</span>
              <span className="lbl">CHIUDI</span>
            </button>
          </header>

          <label className="sgl-search">
            <span className="sgl-search-lbl">CERCA</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="POT, Campione, Vorace…"
              aria-label="Cerca nel glossario"
              autoFocus
            />
            {search && (
              <span className="sgl-search-count">
                {searchedTerms.length} {searchedTerms.length === 1 ? 'RISULTATO' : 'RISULTATI'}
              </span>
            )}
          </label>

          <div className="sgl-rail" role="tablist" aria-label="Capitoli">
            {railItems.map((cat) => {
              const on = cat === shownCategory;
              return (
                <button
                  key={cat}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  className={`sgl-flag ${on ? 'on' : ''}`}
                  style={{ '--c': categoryColor(cat) }}
                  disabled={!counts[cat] && !on}
                  onClick={() => selectCategory(cat)}
                >
                  <span className="sgl-flag-in">
                    <Rune index={CATEGORY_RUNE[cat]} />
                    <span className="nm">{cat === ALL ? 'Tutti' : GLOSSARY_CATEGORIES[cat].label}</span>
                    <span className="ct">{counts[cat]}</span>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="sgl-list" ref={listRef} key={`${shownCategory}|${search}`}>
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
                  <div key={t.key} className="sgl-item" style={{ '--c': t.color, '--i': Math.min(i, 14) }}>
                    {showGroup && (
                      <div className="sgl-group">
                        <Rune index={CATEGORY_RUNE[t.category]} />
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
                        {t.detail && <span className="sgl-row-toggle" aria-hidden="true" />}
                      </span>
                      {isOpen && t.abbr && (
                        <span className="sgl-burst" aria-hidden="true">
                          <span>{t.abbr}</span>
                        </span>
                      )}
                    </button>
                    {isOpen && (
                      <div className="sgl-detail">
                        <span className="sgl-detail-lbl">
                          <Rune index={CATEGORY_RUNE[t.category]} />
                          DETTAGLIO
                        </span>
                        <p>{t.detail}</p>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <footer className="sgl-hints">
            <span className="sgl-hint"><kbd>↑</kbd><kbd>↓</kbd><span className="lbl">VOCE</span></span>
            <span className="sgl-hint"><kbd>←</kbd><kbd>→</kbd><span className="lbl">CAPITOLO</span></span>
            <span className="sgl-hint"><kbd>INVIO</kbd><span className="lbl">DETTAGLIO</span></span>
            <span className="sgl-hint"><kbd>ESC</kbd><span className="lbl">CHIUDI</span></span>
          </footer>

          <div className="sgl-intro" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        </div>
      </div>
      <GlossaryStyles />
    </div>
  );

  return createPortal(content, document.body);
}

const STAR_CLIP =
  'polygon(50% 0%, 61% 18%, 82% 8%, 80% 30%, 100% 38%, 84% 54%, 96% 74%, 74% 76%, 70% 98%, 52% 84%, 34% 100%, 28% 78%, 4% 80%, 16% 60%, 0% 42%, 20% 32%, 14% 10%, 36% 18%)';

function GlossaryStyles() {
  const V = '#050507';
  const T = MENU_ACCENTS.text;
  return (
    <style>{`
      .sgl {
        position: fixed; inset: 0;
        background:
          radial-gradient(circle, color-mix(in srgb, var(--accent) 38%, transparent) 1.3px, transparent 1.7px) 0 0 / 11px 11px,
          radial-gradient(ellipse at 50% 50%, rgba(5,5,7,0.55), rgba(5,5,7,0.94) 75%);
        font-family: 'Chakra Petch', system-ui, sans-serif; color: ${T};
      }
      .sgl * { box-sizing: border-box; }
      .sgl kbd {
        display: inline-grid; place-items: center; min-width: 22px; height: 20px; padding: 0 5px;
        background: ${T}; color: ${V}; border: 0;
        font-family: 'Chakra Petch', sans-serif; font-weight: 700; font-size: 11px; line-height: 1;
        clip-path: polygon(3px 0, 100% 0, calc(100% - 3px) 100%, 0 100%);
      }
      .sgl-rune { width: 1em; height: 1em; flex: none; overflow: visible; }
      .sgl-rune path { fill: none; stroke: currentColor; stroke-width: 1.5; stroke-linejoin: round; vector-effect: non-scaling-stroke; }
      .sgl .rune-title-glyph path { stroke: var(--accent); filter: drop-shadow(0 0 4px var(--accent)); }

      .sgl-panel {
        position: fixed; left: 0; top: 0;
        width: min(820px, 92vw); height: min(86vh, 920px);
        transform-origin: 0 0;
        display: flex; flex-direction: column;
        filter: drop-shadow(14px 14px 0 var(--accent));
        transition: transform .5s cubic-bezier(.2,1.15,.4,1), opacity .2s ease-out;
      }
      .sgl-in {
        position: relative; isolation: isolate; overflow: hidden;
        flex: 1; min-height: 0; display: flex; flex-direction: column;
        background: ${V}; border-left: 8px solid var(--accent);
        clip-path: polygon(0 0, 100% 0, calc(100% - 24px) 100%, 0 100%);
        padding: 22px 38px 0 30px;
      }

      /* ---------- Fondo del pannello ---------- */
      .sgl-deco { position: absolute; inset: 0; z-index: -1; pointer-events: none; }
      .sgl-deco-blade {
        position: absolute; top: -6%; right: 90px; width: 26px; height: 24%;
        background: var(--chapter); transform: skewX(-24deg);
        box-shadow: 24px 0 0 -10px ${V}, 34px 0 0 -12px ${T};
        opacity: 0.9; transition: background .35s;
        -webkit-mask-image: linear-gradient(to bottom, #000 40%, transparent);
        mask-image: linear-gradient(to bottom, #000 40%, transparent);
      }
      .sgl-deco-halftone {
        position: absolute; right: 0; bottom: 0; width: 70%; height: 55%;
        background-image: radial-gradient(circle, var(--chapter) 1.4px, transparent 1.8px);
        background-size: 11px 11px; opacity: 0.22;
        -webkit-mask-image: radial-gradient(ellipse at 100% 100%, #000, transparent 70%);
        mask-image: radial-gradient(ellipse at 100% 100%, #000, transparent 70%);
      }
      .sgl-deco-rune {
        position: absolute; right: -60px; bottom: -40px; font-size: 420px; color: var(--chapter);
        opacity: 0.09; transform: rotate(-14deg);
        animation: sgl-rune-in .5s cubic-bezier(.2,1,.3,1) both;
      }
      .sgl-deco-rune path { stroke-width: 2.5; }
      @keyframes sgl-rune-in { from { opacity: 0; transform: rotate(-40deg) scale(0.7); } }

      /* ---------- Testata ---------- */
      .sgl-head { display: flex; align-items: flex-start; gap: 18px; flex: none; }
      .sgl-title-wrap { flex: 1; min-width: 0; transform: rotate(-3deg); transform-origin: left top; }
      .sgl-eyebrow { display: flex; align-items: center; gap: 10px; }
      .sgl-eyebrow .sec {
        background: var(--accent); color: ${V}; font-weight: 700; font-size: 12px; letter-spacing: 0.24em;
        padding: 3px 11px; transform: skewX(-14deg);
      }
      .sgl-eyebrow .txt { font-family: 'Share Tech Mono', monospace; font-size: 11px; letter-spacing: 0.3em; color: rgba(245,243,235,0.6); white-space: nowrap; }
      .sgl-title {
        margin: 4px 0 0; font-weight: 700; font-style: italic; text-transform: uppercase;
        font-size: 58px; line-height: 0.95; letter-spacing: -0.01em; color: ${T};
        text-shadow: 5px 5px 0 var(--accent), 9px 9px 0 #000;
      }
      .sgl-counter { flex: none; margin-top: 20px; font-weight: 700; font-style: italic; line-height: 0.9; transform: rotate(-3deg); }
      .sgl-counter .cur { font-size: 44px; color: var(--chapter); text-shadow: 3px 3px 0 #000; transition: color .3s; }
      .sgl-counter .sep { font-size: 26px; margin: 0 3px; }
      .sgl-counter .tot { font-size: 22px; }
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
        flex: none; position: relative; display: flex; align-items: center; margin: 24px 10px 0 2px; height: 46px;
        background: ${T}; color: ${V};
        clip-path: polygon(14px 0, 100% 0, calc(100% - 14px) 100%, 0 100%);
        transform: rotate(-0.6deg);
      }
      .sgl-search-lbl {
        flex: none; margin-left: 16px; background: ${V}; color: ${T};
        font-weight: 700; font-size: 12px; letter-spacing: 0.24em; padding: 4px 11px; transform: skewX(-14deg);
      }
      .sgl-search input {
        flex: 1; min-width: 0; height: 100%; padding: 0 14px; border: 0; outline: none; background: transparent;
        color: ${V}; font-family: 'Chakra Petch', sans-serif; font-size: 17px; font-weight: 700; font-style: italic; letter-spacing: 0.02em;
      }
      .sgl-search input::placeholder { color: rgba(5,5,7,0.4); font-weight: 600; }
      .sgl-search::after {
        content: ''; position: absolute; left: 14px; right: 14px; bottom: 0; height: 4px; background: var(--accent);
        transform: scaleX(0); transform-origin: left; transition: transform .3s cubic-bezier(.2,1,.3,1);
      }
      .sgl-search:focus-within::after { transform: scaleX(1); }
      .sgl-search-count { flex: none; margin-right: 24px; font-family: 'Share Tech Mono', monospace; font-size: 11px; letter-spacing: 0.2em; }

      /* ---------- Capitoli ---------- */
      .sgl-rail { flex: none; display: flex; flex-wrap: wrap; gap: 6px 4px; margin: 16px 0 4px; padding-left: 4px; }
      .sgl-flag {
        flex: none; border: 0; padding: 0; cursor: pointer; background: transparent;
        transform: skewX(-14deg); transition: transform .18s cubic-bezier(.3,1.6,.5,1);
      }
      .sgl-flag:disabled { cursor: default; opacity: 0.3; }
      .sgl-flag-in {
        display: inline-flex; align-items: center; gap: 7px; height: 32px; padding: 0 12px;
        background: #121216; color: rgba(245,243,235,0.72);
        border-left: 4px solid var(--c);
        font-weight: 600; font-size: 12.5px; letter-spacing: 0.06em; text-transform: uppercase; white-space: nowrap;
        transition: background .15s, color .15s;
      }
      .sgl-flag-in > * { transform: skewX(14deg); }
      .sgl-flag .sgl-rune { color: var(--c); font-size: 13px; }
      .sgl-flag .ct { font-family: 'Share Tech Mono', monospace; font-size: 11px; opacity: 0.6; }
      .sgl-flag:not(:disabled):hover { transform: skewX(-14deg) translateY(-2px); }
      .sgl-flag:not(:disabled):hover .sgl-flag-in { background: #1c1c22; color: ${T}; }
      .sgl-flag:focus-visible { outline: 2px solid ${T}; outline-offset: 2px; }
      .sgl-flag.on { transform: skewX(-14deg) rotate(-2deg) scale(1.08); margin: 0 6px; z-index: 1; }
      .sgl-flag.on .sgl-flag-in { background: var(--c); color: ${V}; font-weight: 700; border-left-color: ${T}; box-shadow: 3px 3px 0 ${T}; }
      .sgl-flag.on .sgl-rune, .sgl-flag.on .ct { color: ${V}; opacity: 1; }

      /* ---------- Lista ---------- */
      .sgl-list {
        flex: 1; min-height: 0; overflow-y: auto; overflow-x: hidden;
        padding: 12px 26px 30px 40px; margin-left: -10px;
        scrollbar-width: thin; scrollbar-color: color-mix(in srgb, var(--accent) 60%, transparent) transparent;
        -webkit-mask-image: linear-gradient(to bottom, transparent 0, #000 14px, #000 calc(100% - 30px), transparent 100%);
        mask-image: linear-gradient(to bottom, transparent 0, #000 14px, #000 calc(100% - 30px), transparent 100%);
      }
      .sgl-item { animation: sgl-item-in .36s calc(var(--i) * 26ms) cubic-bezier(.2,1.2,.4,1) backwards; }
      @keyframes sgl-item-in { from { opacity: 0; transform: translateX(70px) skewX(-10deg); } }
      .sgl-empty { padding: 60px 0; text-align: center; }
      .sgl-empty .t { margin: 0 0 8px; font-weight: 700; font-style: italic; font-size: 24px; letter-spacing: 0.04em; }
      .sgl-empty .s { margin: 0; font-size: 14px; color: rgba(245,243,235,0.6); }

      .sgl-group {
        display: inline-flex; align-items: center; gap: 8px; margin: 18px 0 10px -6px;
        background: var(--c); color: ${V}; font-weight: 700; font-style: italic; font-size: 13px; letter-spacing: 0.2em; text-transform: uppercase;
        padding: 4px 14px 4px 12px; transform: skewX(-14deg) rotate(-1.5deg);
        box-shadow: 4px 4px 0 ${T};
      }
      .sgl-group > .sgl-rune { font-size: 13px; }
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
        position: relative; display: flex; align-items: center; gap: 12px; padding: 10px 22px 11px 22px;
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
        font-weight: 700; font-style: italic; font-size: 18px; text-transform: uppercase; letter-spacing: 0.02em;
        color: var(--c); line-height: 1.1;
      }
      .sgl-row-term .abbr {
        display: inline-block; margin-left: 10px; padding: 1px 8px; vertical-align: 2px;
        background: var(--c); color: ${V}; font-style: normal; font-size: 11px; letter-spacing: 0.14em;
        transform: skewX(-14deg);
      }
      .sgl-row-desc { font-size: 14px; line-height: 1.35; color: rgba(245,243,235,0.82); }
      .sgl-row-toggle {
        position: relative; flex: none; width: 24px; height: 24px; border: 2px solid var(--c); transform: skewX(-14deg);
        transition: background .15s, transform .25s cubic-bezier(.3,1.6,.5,1);
      }
      .sgl-row-toggle::before, .sgl-row-toggle::after {
        content: ''; position: absolute; left: 50%; top: 50%; width: 12px; height: 2px; margin: -1px 0 0 -6px; background: var(--c);
        transition: transform .25s;
      }
      .sgl-row-toggle::after { transform: rotate(90deg); }

      .sgl-row.is-active { transform: translateX(10px); }
      .sgl-row.is-active .sgl-row-plate { background: rgba(32,32,40,0.98); }
      .sgl-row.is-active .sgl-row-cursor { opacity: 1; transform: translateX(0); animation: sgl-cursor .9s ease-in-out infinite; }
      @keyframes sgl-cursor { 50% { transform: translateX(5px); } }

      .sgl-row.is-open { transform: translateX(10px) rotate(-1deg) scale(1.02); z-index: 1; }
      .sgl-row.is-open .sgl-row-shadow { opacity: 1; transform: translate(8px, 7px); }
      .sgl-row.is-open .sgl-row-plate { background: ${T}; color: ${V}; padding-right: 96px; }
      .sgl-row.is-open .sgl-row-plate::before { background: ${V}; }
      .sgl-row.is-open .sgl-row-term { color: ${V}; font-size: 22px; }
      .sgl-row.is-open .sgl-row-term .abbr { display: none; }
      .sgl-row.is-open .sgl-row-desc { color: rgba(5,5,7,0.82); font-weight: 600; }
      .sgl-row.is-open .sgl-row-toggle { background: ${V}; border-color: ${V}; transform: skewX(-14deg) rotate(180deg); }
      .sgl-row.is-open .sgl-row-toggle::before, .sgl-row.is-open .sgl-row-toggle::after { background: var(--c); }
      .sgl-row.is-open .sgl-row-toggle::after { transform: rotate(0deg); }

      .sgl-burst {
        position: absolute; right: 2px; top: 50%; width: 74px; height: 74px; margin-top: -37px; display: grid; place-items: center;
        animation: sgl-burst-in .35s cubic-bezier(.2,1.7,.4,1) both;
      }
      .sgl-burst::before {
        content: ''; position: absolute; inset: 0; background: ${V}; clip-path: ${STAR_CLIP};
        filter: drop-shadow(4px 4px 0 var(--c)); animation: sgl-spin 18s linear infinite;
      }
      .sgl-burst span { position: relative; font-weight: 700; font-style: italic; font-size: 18px; color: ${T}; transform: rotate(-8deg); }
      @keyframes sgl-burst-in { from { transform: scale(0) rotate(-90deg); } }
      @keyframes sgl-spin { to { transform: rotate(360deg); } }

      .sgl-detail {
        position: relative; overflow: hidden; margin: 8px 6px 16px 22px; padding: 12px 18px 14px 20px;
        background: #121216; border-left: 5px solid var(--c);
        clip-path: polygon(0 0, 100% 0, calc(100% - 12px) 100%, 0 100%);
        animation: sgl-detail-in .3s cubic-bezier(.2,1,.3,1) both;
      }
      .sgl-detail::after {
        content: ''; position: absolute; right: 0; bottom: 0; width: 40%; height: 100%; pointer-events: none;
        background-image: radial-gradient(circle, var(--c) 1.2px, transparent 1.6px); background-size: 9px 9px; opacity: 0.25;
        -webkit-mask-image: linear-gradient(90deg, transparent, #000);
        mask-image: linear-gradient(90deg, transparent, #000);
      }
      .sgl-detail-lbl {
        display: inline-flex; align-items: center; gap: 6px; margin-bottom: 8px;
        background: var(--c); color: ${V}; font-weight: 700; font-size: 11px; letter-spacing: 0.24em; padding: 2px 9px; transform: skewX(-14deg);
      }
      .sgl-detail p { position: relative; margin: 0; font-size: 15px; line-height: 1.55; color: rgba(245,243,235,0.9); }
      @keyframes sgl-detail-in { from { opacity: 0; transform: translateX(40px) skewX(-8deg); } }

      /* ---------- Barra comandi ---------- */
      .sgl-hints {
        flex: none; display: flex; align-items: center; justify-content: flex-end; flex-wrap: wrap; gap: 8px 20px;
        min-height: 46px; padding: 8px 28px 10px 0;
        border-top: 2px solid color-mix(in srgb, var(--accent) 45%, transparent);
      }
      .sgl-hint { display: inline-flex; align-items: center; gap: 4px; }
      .sgl-hint .lbl { margin-left: 5px; font-weight: 700; font-style: italic; font-size: 12px; letter-spacing: 0.14em; }

      /* ---------- Ingresso: tre lame sul pannello ---------- */
      .sgl-intro { position: absolute; inset: 0; z-index: 20; pointer-events: none; overflow: hidden; }
      .sgl-intro > span {
        position: absolute; top: -30%; bottom: -30%; width: 46%;
        transform: skewX(-18deg);
        animation: sgl-blade .58s .12s cubic-bezier(.7,0,.3,1) both;
      }
      .sgl-intro > span:nth-child(1) { left: -8%; background: var(--accent); }
      .sgl-intro > span:nth-child(2) { left: 30%; background: ${V}; animation-delay: .17s; }
      .sgl-intro > span:nth-child(3) { left: 68%; background: ${T}; animation-delay: .22s; }
      @keyframes sgl-blade { to { transform: skewX(-18deg) translateX(260%); } }

      @media (prefers-reduced-motion: reduce) {
        .sgl *, .sgl *::before, .sgl *::after { animation-duration: 0.001s !important; animation-delay: 0s !important; transition-duration: 0.001s !important; }
        .sgl-intro { display: none; }
      }
    `}</style>
  );
}

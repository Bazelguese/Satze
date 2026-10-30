// ============================================
// GLOSSARIO - libro 2.5D che si sfoglia
// ============================================
// Un libro inclinato nello spazio: a sinistra titolo, ricerca e indice, a
// destra la pagina del termine. Cambiando termine un foglio vero gira sul
// dorso (davanti la pagina vecchia, dietro l'indice); saltando lontano o
// cambiando capitolo ne girano tre di fila. All'apertura la copertina si
// solleva e si gira. Stessa palette e caratteri delle altre schermate
// (nero, crema, accento; corsivo pieno); i titoli si decifrano dalle rune
// delle carte e i segnalibri dei capitoli portano una runa.
//
// Tastiera (in cattura: i tasti usati qui non arrivano alla schermata sotto):
//   ↑/↓  termine          ←/→  capitolo (nella ricerca solo se vuota)
//   Esc  svuota la ricerca, poi chiude          Invio non fa nulla qui
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
  amber: '#e0a526',
  cyan: '#1fb5cf',
  purple: '#8b6cf0',
  emerald: '#2fb886',
  green: '#3fbf6a',
  rose: '#e8566e',
};

/** Una runa delle carte per capitolo (segnalibri e intestazioni). */
const CATEGORY_RUNE = { [ALL]: 8, concetti: 0, vittoria: 1, trigger: 2, effetti: 3, archetipi: 5 };

/** Durata di un giro di pagina (ms) e distanza tra fogli che girano insieme. */
const TURN_MS = 720;
const TURN_STAGGER_MS = 95;

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

function categoryLabel(cat) {
  return cat === ALL ? 'Tutti' : GLOSSARY_CATEGORIES[cat]?.label;
}

function rowsFor(terms, cat) {
  const cats = cat === ALL ? CATEGORY_ORDER : [cat];
  const out = [];
  cats.forEach((c) => {
    terms
      .filter((t) => t.category === c)
      .forEach((t, i) => out.push({ ...t, key: `${c}-${t.term}-${i}`, color: categoryColor(c) }));
  });
  return out;
}

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

function isNarrow() {
  return typeof window !== 'undefined' && window.matchMedia?.('(max-width: 820px)').matches;
}

function Rune({ index, className = '' }) {
  return (
    <svg className={`gb-rune ${className}`} viewBox="-4 -4 8 8" aria-hidden="true">
      <path d={CARD_RUNES[index % CARD_RUNES.length]} />
    </svg>
  );
}

/** Pagina del termine: viva sulla pagina destra, statica sulle facce dei fogli che girano. */
function TermPage({ row, live = false, prev, next, onPrev, onNext }) {
  if (!row) {
    return (
      <div className="gb-empty">
        <p className="t">Nessuna voce trovata</p>
        <p className="s">Prova con altre parole (es. POT, trigger, VA)</p>
      </div>
    );
  }
  return (
    <article className="gb-term" style={{ '--c': row.color }}>
      <div className="gb-term-top">
        <span className="gb-term-chapter">
          <Rune index={CATEGORY_RUNE[row.category]} />
          <span>{GLOSSARY_CATEGORIES[row.category].label}</span>
        </span>
        {row.abbr && (
          <span className="gb-burst">
            <span>{row.abbr}</span>
          </span>
        )}
      </div>
      <h3 className="gb-term-title">
        {live ? <RuneTitle key={row.key} text={row.term} global={false} delay={TURN_MS * 0.35} stepMs={38} /> : row.term}
      </h3>
      <p className="gb-term-desc">{row.desc}</p>
      {row.detail && <p className="gb-term-body">{row.detail}</p>}
      {live && (
        <nav className="gb-turns">
          <button type="button" disabled={!prev} onClick={onPrev}>
            {prev ? <>‹ {prev.term}</> : null}
          </button>
          <button type="button" className="next" disabled={!next} onClick={onNext}>
            {next ? <>{next.term} ›</> : null}
          </button>
        </nav>
      )}
    </article>
  );
}

/** Faccia senza testo di un foglio intermedio: solo righe sbiadite. */
function BlankPage() {
  return <div className="gb-blank" />;
}

export function Glossary({ onClose, originButtonRef, zIndex = 50, variant = 'duel' }) {
  const accent = variant === 'menu' ? MENU_ACCENTS.magenta : '#a78bfa';
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(ALL);
  const [activeIndex, setActiveIndex] = useState(0);
  /** Termine mostrato sulla pagina destra (in ritardo durante i giri all'indietro). */
  const [shownKey, setShownKey] = useState(null);
  /** Fogli che stanno girando. */
  const [leaves, setLeaves] = useState([]);
  const [originRect, setOriginRect] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const listRef = useRef(null);
  const rowRefs = useRef([]);
  const leafId = useRef(0);
  const shownTimer = useRef(0);
  /** Scorre l'indice solo per tastiera, non al clic. */
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
      window.clearTimeout(shownTimer.current);
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
  const rows = useMemo(() => rowsFor(searchedTerms, shownCategory), [searchedTerms, shownCategory]);

  // La ricerca riparte dalla prima voce, senza girare pagine.
  useEffect(() => {
    setActiveIndex(0);
    window.clearTimeout(shownTimer.current);
    setShownKey(null);
    listRef.current?.scrollTo({ top: 0 });
  }, [search]);

  useLayoutEffect(() => {
    const list = listRef.current;
    const row = rowRefs.current[activeIndex];
    const wanted = scrollToActiveRef.current;
    scrollToActiveRef.current = false;
    if (!list || !row || !wanted) return;
    const pad = 40;
    if (row.offsetTop - pad < list.scrollTop) list.scrollTo({ top: Math.max(0, row.offsetTop - pad) });
    else if (row.offsetTop + row.offsetHeight + pad > list.scrollTop + list.clientHeight) {
      list.scrollTo({ top: row.offsetTop + row.offsetHeight + pad - list.clientHeight });
    }
  }, [activeIndex, rows]);

  const active = rows[activeIndex] ?? null;
  const shown = (shownKey && rows.find((r) => r.key === shownKey)) || active;

  /**
   * Gira uno o più fogli. Avanti: il foglio porta via la pagina vecchia e
   * atterra a sinistra mostrando l'indice; sotto c'è già la nuova. Indietro:
   * un foglio parte da sinistra e atterra a destra con la nuova pagina; la
   * vecchia resta visibile finché non viene coperta.
   */
  const turnPages = (dir, fromRow, toRow, sheets) => {
    playSound(UI_SOUND.NAVIGATE);
    window.clearTimeout(shownTimer.current);
    if (prefersReducedMotion() || isNarrow()) {
      setShownKey(toRow?.key ?? null);
      return;
    }
    const n = Math.max(1, Math.min(3, sheets));
    const batch = Array.from({ length: n }, (_, k) => {
      leafId.current += 1;
      const first = k === 0;
      const last = k === n - 1;
      return {
        id: leafId.current,
        dir,
        delay: k * TURN_STAGGER_MS,
        front: dir === 'fwd' ? (first ? { row: fromRow } : null) : last ? { row: toRow } : null,
        back: dir === 'fwd' ? (last ? 'index' : null) : first ? 'index' : null,
      };
    });
    setLeaves((l) => [...l, ...batch]);
    if (dir === 'fwd') {
      setShownKey(toRow?.key ?? null);
    } else {
      setShownKey(fromRow?.key ?? null);
      shownTimer.current = window.setTimeout(
        () => setShownKey(toRow?.key ?? null),
        TURN_MS * 0.82 + (n - 1) * TURN_STAGGER_MS,
      );
    }
  };

  const goTo = (i) => {
    if (i === activeIndex || i < 0 || i >= rows.length) return;
    turnPages(i > activeIndex ? 'fwd' : 'back', shown, rows[i], Math.abs(i - activeIndex));
    setActiveIndex(i);
  };

  const selectCategory = (cat) => {
    if (cat === shownCategory) return;
    playUiClick();
    const order = [ALL, ...CATEGORY_ORDER];
    const nextRows = rowsFor(searchedTerms, cat);
    turnPages(order.indexOf(cat) > order.indexOf(shownCategory) ? 'fwd' : 'back', shown, nextRows[0], 3);
    setCategory(cat);
    setActiveIndex(0);
    listRef.current?.scrollTo({ top: 0 });
  };

  const keyRef = useRef({});
  keyRef.current = { rows, counts, activeIndex, category: shownCategory, search, onClose, goTo, selectCategory };

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
          k.goTo(k.activeIndex + (e.key === 'ArrowUp' ? -1 : 1));
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
          // Inghiottito: sotto (es. costruzione esercito) Invio salverebbe.
          handled();
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

  const progress = rows.length > 1 ? activeIndex / (rows.length - 1) : 0;
  const tabs = [ALL, ...CATEGORY_ORDER];
  const prev = rows[activeIndex - 1] ?? null;
  const next = rows[activeIndex + 1] ?? null;

  /** Pagina sinistra; `live` = quella vera (ricerca e voci cliccabili), altrimenti copia sul retro dei fogli. */
  const renderIndex = (live) => {
    let lastCat = null;
    return (
      <div className="gb-index-page">
        <h2 className="gb-title" id={live ? 'gb-title' : undefined}>
          {live ? <RuneTitle text="Glossario" global={false} delay={900} stepMs={60} /> : 'Glossario'}
        </h2>
        {live ? (
          <label className="gb-search">
            <span className="gb-search-lbl">CERCA</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="POT, Campione, Vorace…"
              aria-label="Cerca nel glossario"
              autoFocus
            />
            {search && (
              <span className="gb-search-count">
                {searchedTerms.length} {searchedTerms.length === 1 ? 'VOCE' : 'VOCI'}
              </span>
            )}
          </label>
        ) : (
          <div className="gb-search">
            <span className="gb-search-lbl">CERCA</span>
          </div>
        )}
        <div className="gb-index" ref={live ? listRef : undefined}>
          {rows.length === 0 && live ? <p className="gb-index-empty">Nessuna voce</p> : null}
          {rows.map((t, i) => {
            const showGroup = shownCategory === ALL && t.category !== lastCat;
            lastCat = t.category;
            const on = i === activeIndex;
            return (
              <div key={t.key} className="gb-index-item" style={{ '--c': t.color }}>
                {showGroup && (
                  <div className="gb-group">
                    <Rune index={CATEGORY_RUNE[t.category]} />
                    {GLOSSARY_CATEGORIES[t.category].label}
                  </div>
                )}
                {live ? (
                  <button
                    type="button"
                    ref={(el) => {
                      rowRefs.current[i] = el;
                    }}
                    className={`gb-entry ${on ? 'on' : ''}`}
                    aria-current={on ? 'true' : undefined}
                    onClick={() => goTo(i)}
                  >
                    <span className="tm">{t.term}</span>
                    {t.abbr && <span className="ab">{t.abbr}</span>}
                  </button>
                ) : (
                  <div className={`gb-entry ${on ? 'on' : ''}`}>
                    <span className="tm">{t.term}</span>
                    {t.abbr && <span className="ab">{t.abbr}</span>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderFace = (face) => {
    if (face === 'index') return renderIndex(false);
    if (face?.row) return <TermPage row={face.row} />;
    return <BlankPage />;
  };

  const content = (
    <div className="sgl satze-glossary-backdrop" onClick={onClose} style={{ zIndex, '--accent': accent }}>
      <div
        className="gb"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="gb-title"
        style={{
          transform: expanded
            ? 'translate(50vw, 50vh) translate(-50%, -50%) scale(1)'
            : `translate(${originRect.left}px, ${originRect.top}px) scale(0.12)`,
          opacity: expanded ? 1 : 0,
        }}
      >
        <button type="button" className="gb-close" onClick={onClose} aria-label="Chiudi glossario">
          <span className="key">ESC</span>
          <span className="lbl">CHIUDI</span>
        </button>

        <div className="gb-stage">
          <div className="gb-book" style={{ '--lt': `${3 + progress * 12}px`, '--rt': `${3 + (1 - progress) * 12}px` }}>
            <div className="gb-board" aria-hidden="true" />

            {/* Segnalibri dei capitoli, infilati tra le pagine */}
            <div className="gb-tabs" role="tablist" aria-label="Capitoli">
              {tabs.map((cat) => {
                const on = cat === shownCategory;
                return (
                  <button
                    key={cat}
                    type="button"
                    role="tab"
                    aria-selected={on}
                    className={`gb-tab ${on ? 'on' : ''}`}
                    style={{ '--c': categoryColor(cat) }}
                    disabled={!counts[cat] && !on}
                    onClick={() => selectCategory(cat)}
                  >
                    <Rune index={CATEGORY_RUNE[cat]} />
                    <span className="nm">{categoryLabel(cat)}</span>
                  </button>
                );
              })}
            </div>

            <div className="gb-stack gb-stack--l" aria-hidden="true" />
            <div className="gb-stack gb-stack--r" aria-hidden="true" />

            <section className="gb-page gb-left">{renderIndex(true)}</section>
            <section className="gb-page gb-right" aria-live="polite">
              <TermPage
                row={shown}
                live
                prev={prev}
                next={next}
                onPrev={() => goTo(activeIndex - 1)}
                onNext={() => goTo(activeIndex + 1)}
              />
            </section>

            {leaves.map((leaf) => (
              <div
                key={leaf.id}
                className={`gb-leaf gb-leaf--${leaf.dir}`}
                style={{ animationDelay: `${leaf.delay}ms`, animationDuration: `${TURN_MS}ms` }}
                onAnimationEnd={(e) => {
                  if (e.target !== e.currentTarget) return;
                  setLeaves((l) => l.filter((x) => x.id !== leaf.id));
                }}
                aria-hidden="true"
              >
                <div className="gb-face gb-face--front gb-page">
                  {renderFace(leaf.front)}
                  <span className="gb-shade" style={{ animationDelay: `${leaf.delay}ms`, animationDuration: `${TURN_MS}ms` }} />
                </div>
                <div className="gb-face gb-face--back gb-page">
                  {renderFace(leaf.back)}
                  <span className="gb-shade" style={{ animationDelay: `${leaf.delay}ms`, animationDuration: `${TURN_MS}ms` }} />
                </div>
              </div>
            ))}

            <div className="gb-gutter" aria-hidden="true" />

            {/* Copertina che si solleva e si gira all'apertura */}
            <div className="gb-cover" aria-hidden="true">
              <div className="gb-cover-face">
                <Rune index={8} className="gb-cover-rune" />
                <span className="gb-cover-title">Glossario</span>
              </div>
            </div>
          </div>
        </div>

        <footer className="gb-hints">
          <span className="h"><kbd>↑</kbd><kbd>↓</kbd><span className="lbl">VOCE</span></span>
          <span className="h"><kbd>←</kbd><kbd>→</kbd><span className="lbl">CAPITOLO</span></span>
          <span className="h"><kbd>ESC</kbd><span className="lbl">CHIUDI</span></span>
        </footer>
      </div>
      <GlossaryStyles />
    </div>
  );

  return createPortal(content, document.body);
}

/** Grana della carta: rumore SVG in data URI (nessun file in più). */
const PAPER_GRAIN =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 .35  0 0 0 0 .28  0 0 0 0 .2  0 0 0 .22 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")";

const STAR_CLIP =
  'polygon(50% 0%, 61% 18%, 82% 8%, 80% 30%, 100% 38%, 84% 54%, 96% 74%, 74% 76%, 70% 98%, 52% 84%, 34% 100%, 28% 78%, 4% 80%, 16% 60%, 0% 42%, 20% 32%, 14% 10%, 36% 18%)';

function GlossaryStyles() {
  const V = '#050507';
  const T = MENU_ACCENTS.text;
  return (
    <style>{`
      .sgl {
        --paper: #f3eee2; --paper-2: #e7dfcc; --ink: ${V}; --ink-soft: rgba(5,5,7,0.62);
        position: fixed; inset: 0;
        background:
          radial-gradient(circle, color-mix(in srgb, var(--accent) 34%, transparent) 1.3px, transparent 1.7px) 0 0 / 11px 11px,
          rgba(5,5,7,0.88);
        font-family: 'Chakra Petch', system-ui, sans-serif; color: ${T};
      }
      .sgl * { box-sizing: border-box; }
      .sgl kbd {
        display: inline-grid; place-items: center; min-width: 24px; height: 22px; padding: 0 6px;
        background: ${T}; color: ${V}; border: 0;
        font-family: 'Chakra Petch', sans-serif; font-weight: 700; font-size: 12px; line-height: 1;
        clip-path: polygon(4px 0, 100% 0, calc(100% - 4px) 100%, 0 100%);
      }
      .gb-rune { width: 1em; height: 1em; flex: none; overflow: visible; }
      .gb-rune path { fill: none; stroke: currentColor; stroke-width: 1.4; stroke-linejoin: round; vector-effect: non-scaling-stroke; }
      .sgl .rune-title-glyph path { stroke: var(--accent); filter: none; }

      /* ---------- Contenitore ---------- */
      .gb {
        position: fixed; left: 0; top: 0;
        width: min(1240px, 94vw); height: min(84vh, 800px);
        display: flex; flex-direction: column;
        transform-origin: 0 0;
        transition: transform .55s cubic-bezier(.2,1.1,.35,1), opacity .2s ease-out;
      }
      .gb-close {
        position: absolute; z-index: 30; top: 0; right: 10px;
        display: inline-flex; align-items: center; gap: 10px; border: 0; cursor: pointer;
        padding: 8px 20px 8px 10px; background: ${T}; color: ${V};
        transform: skewX(-14deg) rotate(-2deg); box-shadow: 5px 5px 0 var(--accent);
        transition: transform .15s, box-shadow .15s;
      }
      .gb-close > * { transform: skewX(14deg); }
      .gb-close:hover, .gb-close:focus-visible { outline: none; transform: skewX(-14deg) rotate(-2deg) translate(-3px,-3px); box-shadow: 8px 8px 0 var(--accent); }
      .gb-close .key { background: ${V}; color: ${T}; font-weight: 700; font-size: 12px; padding: 3px 7px; }
      .gb-close .lbl { font-weight: 700; font-style: italic; font-size: 18px; letter-spacing: 0.1em; }

      .gb-stage { flex: 1; min-height: 0; perspective: 3400px; perspective-origin: 50% 30%; padding: 64px 22px 10px; }
      .gb-book {
        position: relative; width: 100%; height: 100%;
        display: grid; grid-template-columns: 1fr 1fr;
        /* Libro inclinato nello spazio; dentro si disegna in ordine di documento
           (niente preserve-3d: Chrome spezzava i piani e copriva l'indice).
           I fogli e la copertina girano in prospettiva sul piano del libro. */
        perspective: 2600px;
        transform: rotateX(14deg) rotateZ(-1.2deg);
        animation: gb-settle 1.2s cubic-bezier(.2,.9,.25,1) both;
      }
      @keyframes gb-settle { from { transform: rotateX(32deg) rotateZ(-4deg) translateZ(-80px); } }

      /* Piatti della copertina sotto le pagine */
      .gb-board {
        position: absolute; inset: -16px -18px -22px; border-radius: 8px;
        background:
          linear-gradient(90deg, transparent 48.6%, rgba(255,255,255,0.05) 50%, transparent 51.4%),
          radial-gradient(ellipse at 30% 20%, #1c1c24, ${V} 70%);
        box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--accent) 70%, transparent), 0 40px 60px rgba(0,0,0,0.7), 0 10px 0 #0d0d12;
      }

      /* Spessore delle pagine (cresce a sinistra man mano che si va avanti) */
      .gb-stack { position: absolute; top: 0; bottom: 0; width: 50%;
        background: repeating-linear-gradient(0deg, #e6dfcd 0 2px, #c9bfa7 2px 3px); border-radius: 3px; }
      .gb-stack--l { left: 0; transform: translate(calc(var(--lt) * -1), calc(var(--lt) * 0.8)); transition: transform .4s; }
      .gb-stack--r { right: 0; transform: translate(var(--rt), calc(var(--rt) * 0.8)); transition: transform .4s; }

      /* ---------- Pagine ---------- */
      .gb-page {
        position: relative; min-width: 0; min-height: 0; overflow: hidden; color: var(--ink);
        background: ${PAPER_GRAIN}, linear-gradient(var(--paper), var(--paper-2));
      }
      .gb-left { border-radius: 4px 0 0 4px; padding: 34px 30px 22px 38px; background: linear-gradient(90deg, transparent 86%, rgba(40,28,10,0.2)), ${PAPER_GRAIN}, linear-gradient(var(--paper), var(--paper-2)); }
      .gb-right { border-radius: 0 4px 4px 0; padding: 34px 44px 22px 36px; background: linear-gradient(270deg, transparent 88%, rgba(40,28,10,0.2)), ${PAPER_GRAIN}, linear-gradient(var(--paper), var(--paper-2)); }
      .gb-right::after {
        content: ''; position: absolute; right: 0; bottom: 0; width: 46%; height: 42%; pointer-events: none;
        background-image: radial-gradient(circle, color-mix(in srgb, var(--accent) 55%, transparent) 1.5px, transparent 1.9px);
        background-size: 10px 10px;
        -webkit-mask-image: radial-gradient(ellipse at 100% 100%, #000, transparent 70%);
        mask-image: radial-gradient(ellipse at 100% 100%, #000, transparent 70%);
        opacity: 0.55;
      }
      .gb-gutter {
        position: absolute; top: 0; bottom: 0; left: calc(50% - 30px); width: 60px; pointer-events: none; transform: translateZ(1px);
        background: linear-gradient(90deg, transparent, rgba(30,20,8,0.28) 45%, rgba(30,20,8,0.4) 50%, rgba(30,20,8,0.28) 55%, transparent);
      }

      /* ---------- Indice ---------- */
      .gb-index-page { height: 100%; display: flex; flex-direction: column; }
      .gb-left > .gb-index-page > * { animation: gb-fade .4s .95s ease-out both; }
      @keyframes gb-fade { from { opacity: 0; } }
      .gb-title {
        flex: none; margin: 0; font-weight: 700; font-style: italic; text-transform: uppercase;
        font-size: 54px; line-height: 0.95; letter-spacing: -0.01em; color: var(--ink);
        text-shadow: 4px 4px 0 var(--accent);
        transform: rotate(-3deg); transform-origin: left center;
      }
      .gb-search {
        flex: none; display: flex; align-items: center; gap: 12px; margin: 22px 0 0; height: 40px;
        background: ${V}; color: ${T}; padding: 0 14px 0 6px;
        clip-path: polygon(10px 0, 100% 0, calc(100% - 10px) 100%, 0 100%);
      }
      .gb-search-lbl { flex: none; background: var(--accent); color: ${V}; font-weight: 700; font-size: 12px; letter-spacing: 0.22em; padding: 3px 10px; transform: skewX(-14deg); margin-left: 8px; }
      .gb-search input {
        flex: 1; min-width: 0; height: 100%; border: 0; outline: none; background: transparent; color: ${T};
        font-family: 'Chakra Petch', sans-serif; font-size: 16px; font-weight: 600;
      }
      .gb-search input::placeholder { color: rgba(245,243,235,0.4); font-style: italic; font-weight: 500; }
      .gb-search-count { flex: none; font-family: 'Share Tech Mono', monospace; font-size: 11px; letter-spacing: 0.16em; color: var(--accent); }
      .gb-index { flex: 1; min-height: 0; overflow-y: auto; overflow-x: hidden; margin-top: 12px; padding: 4px 18px 16px 4px;
        scrollbar-width: thin; scrollbar-color: rgba(5,5,7,0.3) transparent; }
      .gb-index-empty { margin: 30px 0; text-align: center; font-style: italic; color: var(--ink-soft); }
      .gb-group {
        display: flex; align-items: center; gap: 8px; margin: 16px 0 6px;
        font-weight: 700; font-size: 12px; letter-spacing: 0.22em; text-transform: uppercase;
        color: color-mix(in srgb, var(--c) 65%, var(--ink));
      }
      .gb-group .gb-rune { font-size: 14px; }
      .gb-index-item:first-child .gb-group { margin-top: 2px; }
      .gb-entry {
        position: relative; display: flex; align-items: baseline; justify-content: space-between; gap: 12px; width: 100%;
        border: 0; background: transparent; cursor: pointer; text-align: left; color: var(--ink);
        padding: 5px 12px; font-family: 'Chakra Petch', sans-serif; font-weight: 600; font-size: 16px;
        transition: transform .18s cubic-bezier(.3,1.6,.5,1), background .12s;
      }
      .gb-entry .tm { min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .gb-entry .ab { flex: none; font-family: 'Share Tech Mono', monospace; font-size: 12px; letter-spacing: 0.08em; color: var(--ink-soft); }
      .gb-entry:hover { transform: translateX(6px); }
      .gb-entry:focus-visible { outline: 2px solid var(--accent); outline-offset: -2px; }
      .gb-entry.on {
        color: ${T}; background: ${V}; font-weight: 700; font-style: italic; text-transform: uppercase; letter-spacing: 0.02em;
        transform: translateX(10px) rotate(-1deg);
        clip-path: polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%);
      }
      .gb-entry.on .ab { color: var(--c); }

      /* ---------- Pagina del termine ---------- */
      .gb-term { position: relative; z-index: 1; height: 100%; display: flex; flex-direction: column; }
      .gb-term-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; min-height: 40px; }
      .gb-term-chapter {
        display: inline-flex; align-items: center; gap: 8px;
        background: ${V}; color: var(--c); font-weight: 700; font-size: 13px; letter-spacing: 0.22em; text-transform: uppercase;
        padding: 5px 14px; transform: skewX(-14deg);
      }
      .gb-term-chapter > * { transform: skewX(14deg); }
      .gb-term-chapter .gb-rune { font-size: 15px; }
      .gb-burst { position: relative; flex: none; width: 96px; height: 96px; display: grid; place-items: center; margin: -10px -12px -40px 0; }
      .gb-burst::before { content: ''; position: absolute; inset: 0; background: ${V}; clip-path: ${STAR_CLIP}; filter: drop-shadow(5px 5px 0 var(--accent)); animation: gb-burst-spin 22s linear infinite; }
      .gb-burst span { position: relative; font-weight: 700; font-style: italic; font-size: 24px; color: ${T}; transform: rotate(-8deg); }
      @keyframes gb-burst-spin { to { transform: rotate(360deg); } }
      .gb-term-title {
        margin: 18px 96px 0 0; font-weight: 700; font-style: italic; text-transform: uppercase;
        font-size: clamp(34px, 3.6vw, 58px); line-height: 0.95; letter-spacing: -0.01em; color: var(--ink);
        text-shadow: 4px 4px 0 var(--c);
        text-wrap: balance;
      }
      .gb-term-desc {
        margin: 22px 0 0; max-width: 46ch; font-weight: 600; font-size: 20px; line-height: 1.35; color: var(--ink);
        padding-left: 14px; border-left: 5px solid var(--c);
      }
      .gb-term-body {
        flex: 1; min-height: 0; overflow-y: auto; margin: 18px 0 0; max-width: 58ch; padding-right: 6px;
        font-size: 16px; line-height: 1.62; color: rgba(5,5,7,0.86);
        scrollbar-width: thin; scrollbar-color: rgba(5,5,7,0.3) transparent;
      }
      .gb-turns { flex: none; display: flex; justify-content: space-between; gap: 16px; margin-top: 12px; padding-top: 10px; border-top: 2px solid ${V}; }
      .gb-turns button {
        border: 0; background: transparent; cursor: pointer; padding: 4px 2px; min-height: 26px; max-width: 48%;
        font-family: 'Chakra Petch', sans-serif; font-weight: 700; font-style: italic; font-size: 14px; letter-spacing: 0.06em; text-transform: uppercase;
        color: var(--ink-soft); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }
      .gb-turns button:hover:not(:disabled), .gb-turns button:focus-visible { color: var(--ink); outline: none; text-shadow: 2px 2px 0 var(--accent); }
      .gb-turns button:disabled { cursor: default; }
      .gb-turns .next { margin-left: auto; text-align: right; }
      .gb-empty { height: 100%; display: grid; place-content: center; text-align: center; }
      .gb-empty .t { margin: 0 0 6px; font-weight: 700; font-style: italic; font-size: 24px; text-transform: uppercase; }
      .gb-empty .s { margin: 0; font-size: 14px; color: var(--ink-soft); }
      .gb-blank {
        position: absolute; inset: 60px 40px 50px 36px;
        background: repeating-linear-gradient(180deg, transparent 0 22px, rgba(5,5,7,0.08) 22px 30px);
        -webkit-mask-image: linear-gradient(90deg, #000 70%, transparent);
        mask-image: linear-gradient(90deg, #000 70%, transparent);
      }

      /* ---------- Fogli che girano ---------- */
      .gb-leaf {
        position: absolute; top: 0; bottom: 0; left: 50%; width: 50%; z-index: 5;
        transform-origin: left center; transform-style: preserve-3d; pointer-events: none;
        animation-timing-function: cubic-bezier(.45,.05,.25,1); animation-fill-mode: both;
      }
      .gb-leaf--fwd { animation-name: gb-turn-fwd; }
      .gb-leaf--back { animation-name: gb-turn-back; }
      @keyframes gb-turn-fwd {
        0% { transform: translateZ(2px) rotateY(0deg) skewY(0deg); }
        50% { transform: translateZ(18px) rotateY(-90deg) skewY(-2deg); }
        100% { transform: translateZ(2px) rotateY(-180deg) skewY(0deg); }
      }
      @keyframes gb-turn-back {
        0% { transform: translateZ(2px) rotateY(-180deg) skewY(0deg); }
        50% { transform: translateZ(18px) rotateY(-90deg) skewY(2deg); }
        100% { transform: translateZ(2px) rotateY(0deg) skewY(0deg); }
      }
      .gb-face { position: absolute; inset: 0; backface-visibility: hidden; -webkit-backface-visibility: hidden; }
      .gb-face--front { border-radius: 0 4px 4px 0; padding: 34px 44px 22px 36px; }
      .gb-face--back { border-radius: 4px 0 0 4px; padding: 34px 30px 22px 38px; transform: rotateY(180deg); }
      .gb-shade { position: absolute; inset: 0; pointer-events: none; z-index: 3; animation-name: gb-shade; animation-fill-mode: both; animation-timing-function: linear; }
      .gb-face--front .gb-shade { background: linear-gradient(90deg, rgba(0,0,0,0.25), transparent 40%); }
      .gb-face--back .gb-shade { background: linear-gradient(270deg, rgba(0,0,0,0.25), transparent 40%); }
      @keyframes gb-shade { 0%, 100% { opacity: 0; } 45%, 55% { opacity: 1; } }

      /* ---------- Segnalibri ---------- */
      .gb-tabs {
        position: absolute; left: 40px; right: 240px; top: -40px; height: 46px; z-index: 0;
        display: flex; align-items: flex-end; gap: 5px;
      }
      .gb-tab {
        display: inline-flex; align-items: center; gap: 7px; height: 30px; padding: 0 12px 4px; border: 0; cursor: pointer;
        background: color-mix(in srgb, var(--c) 55%, ${V}); color: ${V};
        font-family: 'Chakra Petch', sans-serif; font-weight: 700; font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase;
        clip-path: polygon(0 0, 100% 0, 100% 100%, 50% calc(100% - 5px), 0 100%);
        transition: height .2s cubic-bezier(.3,1.6,.5,1), background .2s;
      }
      .gb-tab .gb-rune { font-size: 14px; }
      .gb-tab .nm { white-space: nowrap; }
      .gb-tab:disabled { cursor: default; opacity: 0.35; }
      .gb-tab:not(:disabled):not(.on):hover { height: 38px; background: var(--c); }
      .gb-tab.on { height: 46px; background: var(--c); }
      .gb-tab:focus-visible { outline: 2px solid ${T}; outline-offset: 2px; }

      /* ---------- Copertina ---------- */
      .gb-cover {
        position: absolute; top: -8px; bottom: -10px; left: 50%; right: -10px; z-index: 10;
        transform-origin: left center; transform-style: preserve-3d; pointer-events: none;
        animation: gb-open 1.1s .3s cubic-bezier(.55,.05,.2,1) both;
      }
      .gb-cover-face {
        position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 18px;
        border-radius: 0 8px 8px 0; backface-visibility: hidden; -webkit-backface-visibility: hidden;
        background: radial-gradient(ellipse at 40% 30%, #1d1d26, ${V} 70%);
        box-shadow: inset 0 0 0 2px var(--accent), inset 0 0 0 10px ${V}, inset 0 0 0 11px color-mix(in srgb, var(--accent) 40%, transparent);
      }
      .gb-cover-rune { font-size: 120px; color: var(--accent); filter: drop-shadow(0 0 14px var(--accent)); }
      .gb-cover-title { font-weight: 700; font-style: italic; font-size: 44px; text-transform: uppercase; color: ${T}; text-shadow: 4px 4px 0 var(--accent); }
      @keyframes gb-open {
        0% { transform: translateZ(3px) rotateY(0deg); }
        25% { transform: translateZ(24px) rotateY(-8deg); }
        100% { transform: translateZ(3px) rotateY(-180deg); }
      }

      /* ---------- Comandi ---------- */
      .gb-hints { position: relative; z-index: 2; flex: none; display: flex; align-items: center; justify-content: flex-end; gap: 22px; height: 40px; padding-right: 20px; }
      .gb-hints .h { display: inline-flex; align-items: center; gap: 4px; }
      .gb-hints .lbl { margin-left: 6px; font-weight: 700; font-style: italic; font-size: 13px; letter-spacing: 0.14em; }

      /* Schermi stretti: niente 3D, pagine una sopra l'altra */
      @media (max-width: 820px) {
        .gb { height: min(90vh, 940px); }
        .gb-stage { perspective: none; padding: 58px 10px 6px; }
        .gb-book { transform: none; animation: none; grid-template-columns: 1fr; grid-template-rows: auto minmax(0, 0.9fr) minmax(0, 1.1fr); }
        .gb-tabs { position: static; flex-wrap: wrap; height: auto; padding: 0; margin-bottom: 4px; transform: none; }
        .gb-tab.on { height: 34px; }
        .gb-stack, .gb-gutter, .gb-cover, .gb-leaf { display: none; }
        .gb-left { padding: 18px 16px 10px; border-radius: 4px 4px 0 0; }
        .gb-right { padding: 18px 16px 10px; border-radius: 0 0 4px 4px; overflow-y: auto; }
        .gb-title { font-size: 36px; }
        .gb-term { height: auto; min-height: 100%; }
        .gb-term-body { flex: none; overflow: visible; }
        .gb-left > .gb-index-page > * { animation: none; }
      }

      @media (prefers-reduced-motion: reduce) {
        .sgl *, .sgl *::before, .sgl *::after { animation-duration: 0.001s !important; animation-delay: 0s !important; transition-duration: 0.001s !important; }
        .gb-cover, .gb-leaf { display: none; }
      }
    `}</style>
  );
}

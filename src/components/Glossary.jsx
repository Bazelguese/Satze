// ============================================
// GLOSSARIO - grimorio (ispirazione Metaphor: ReFantazio)
// ============================================
// Un libro aperto: a sinistra l'indice con la ricerca, a destra la pagina
// del termine scelto. I capitoli (categorie) sono segnalibri colorati che
// spuntano dal bordo alto. All'apertura la copertina si gira sul dorso; a
// ogni cambio termine la pagina gira (avanti o indietro).
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

const CATEGORY_ORDER = ['concetti', 'vittoria', 'trigger', 'effetti', 'archetipi'];

const CATEGORY_COLORS = {
  amber: '#e0a526',
  cyan: '#1fb5cf',
  purple: '#8b6cf0',
  emerald: '#2fb886',
  green: '#3fbf6a',
  rose: '#e8566e',
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
  if (cat === ALL) return '#c9b8e8';
  return CATEGORY_COLORS[GLOSSARY_CATEGORIES[cat]?.color] || CATEGORY_COLORS.amber;
}

function categoryLabel(cat) {
  return cat === ALL ? 'Indice' : GLOSSARY_CATEGORIES[cat]?.label;
}

export function Glossary({ onClose, originButtonRef, zIndex = 50, variant = 'duel' }) {
  const accent = variant === 'menu' ? MENU_ACCENTS.magenta : '#a78bfa';
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(ALL);
  const [activeIndex, setActiveIndex] = useState(0);
  /** Ultimo giro di pagina: { n, dir } (null all'apertura, niente giro). */
  const [turn, setTurn] = useState(null);
  const [originRect, setOriginRect] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const listRef = useRef(null);
  const rowRefs = useRef([]);
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
    const pad = 40;
    if (row.offsetTop - pad < list.scrollTop) list.scrollTo({ top: Math.max(0, row.offsetTop - pad) });
    else if (row.offsetTop + row.offsetHeight + pad > list.scrollTop + list.clientHeight) {
      list.scrollTo({ top: row.offsetTop + row.offsetHeight + pad - list.clientHeight });
    }
  }, [activeIndex, rows]);

  const turnPage = (dir) => {
    playSound(UI_SOUND.NAVIGATE);
    setTurn((t) => ({ n: (t?.n ?? 0) + 1, dir }));
  };

  const goTo = (i) => {
    if (i === activeIndex || i < 0 || i >= rows.length) return;
    turnPage(i > activeIndex ? 'fwd' : 'back');
    setActiveIndex(i);
  };

  const selectCategory = (cat) => {
    if (cat === shownCategory) return;
    playUiClick();
    const order = [ALL, ...CATEGORY_ORDER];
    turnPage(order.indexOf(cat) > order.indexOf(shownCategory) ? 'fwd' : 'back');
    setCategory(cat);
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

  const active = rows[activeIndex] ?? null;
  const prev = rows[activeIndex - 1] ?? null;
  const next = rows[activeIndex + 1] ?? null;
  const tabs = [ALL, ...CATEGORY_ORDER];
  let lastCat = null;

  const content = (
    <div className="sgl satze-glossary-backdrop" onClick={onClose} style={{ zIndex, '--accent': accent }}>
      <div
        className="sgb"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sgb-title"
        style={{
          transform: expanded
            ? 'translate(50vw, 50vh) translate(-50%, -50%) rotate(-0.6deg) scale(1)'
            : `translate(${originRect.left}px, ${originRect.top}px) scale(0.12)`,
          opacity: expanded ? 1 : 0,
        }}
      >
        {/* Segnalibri dei capitoli */}
        <div className="sgb-tabs" role="tablist" aria-label="Capitoli">
          {tabs.map((cat) => {
            const on = cat === shownCategory;
            return (
              <button
                key={cat}
                type="button"
                role="tab"
                aria-selected={on}
                className={`sgb-tab ${on ? 'on' : ''}`}
                style={{ '--c': categoryColor(cat) }}
                disabled={!counts[cat] && !on}
                onClick={() => selectCategory(cat)}
              >
                <span className="gy" aria-hidden="true">{cat === ALL ? '❖' : CATEGORY_GLYPHS[cat]}</span>
                <span className="nm">{categoryLabel(cat)}</span>
              </button>
            );
          })}
        </div>

        <button type="button" className="sgb-close" onClick={onClose} aria-label="Chiudi glossario">
          <span className="key">ESC</span>
          <span className="lbl">CHIUDI</span>
        </button>

        <div className="sgb-cover">
          <span className="sgb-corner tl" aria-hidden="true" />
          <span className="sgb-corner tr" aria-hidden="true" />
          <span className="sgb-corner bl" aria-hidden="true" />
          <span className="sgb-corner br" aria-hidden="true" />

          <div className="sgb-spread">
            {/* Pagina sinistra: titolo, ricerca, indice */}
            <section className="sgb-page sgb-left">
              <header className="sgb-head">
                <div className="sgb-kicker">Archivio delle regole</div>
                <h2 id="sgb-title" className="sgb-title">Glossario</h2>
                <div className="sgb-rule" aria-hidden="true"><span>✦</span></div>
              </header>

              <label className="sgb-search">
                <span className="sgb-search-lbl">Cerca</span>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="POT, Campione, Vorace…"
                  aria-label="Cerca nel glossario"
                  autoFocus
                />
                {search && (
                  <span className="sgb-search-count">
                    {searchedTerms.length} {searchedTerms.length === 1 ? 'voce' : 'voci'}
                  </span>
                )}
              </label>

              <div className="sgb-chapter">
                <span className="sw" style={{ '--c': categoryColor(shownCategory) }} />
                {categoryLabel(shownCategory)}
              </div>

              <div className="sgb-index" ref={listRef}>
                {rows.length === 0 ? (
                  <div className="sgb-empty">
                    <p className="t">Nessuna voce trovata</p>
                    <p className="s">Prova con altre parole (es. POT, trigger, VA)</p>
                  </div>
                ) : (
                  rows.map((t, i) => {
                    const showGroup = shownCategory === ALL && t.category !== lastCat;
                    lastCat = t.category;
                    const on = i === activeIndex;
                    return (
                      <div key={t.key} className="sgb-index-item" style={{ '--c': t.color }}>
                        {showGroup && (
                          <div className="sgb-group">
                            <span className="gy">{CATEGORY_GLYPHS[t.category]}</span>
                            {GLOSSARY_CATEGORIES[t.category].label}
                          </div>
                        )}
                        <button
                          type="button"
                          ref={(el) => {
                            rowRefs.current[i] = el;
                          }}
                          className={`sgb-entry ${on ? 'on' : ''}`}
                          aria-current={on ? 'true' : undefined}
                          onClick={() => goTo(i)}
                        >
                          <span className="mk" aria-hidden="true">✦</span>
                          <span className="tm">{t.term}</span>
                          <span className="dots" aria-hidden="true" />
                          {t.abbr && <span className="ab">{t.abbr}</span>}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </section>

            <div className="sgb-spine" aria-hidden="true" />

            {/* Pagina destra: il termine */}
            <section className="sgb-page sgb-right" aria-live="polite">
              {active ? (
                <article
                  className={`sgb-leaf ${turn ? `turn-${turn.dir}` : ''}`}
                  key={`${active.key}-${turn?.n ?? 0}`}
                  data-glyph={CATEGORY_GLYPHS[active.category]}
                  style={{ '--c': active.color }}
                >
                  <div className="sgb-leaf-chapter">
                    <span className="gy">{CATEGORY_GLYPHS[active.category]}</span>
                    {GLOSSARY_CATEGORIES[active.category].label}
                  </div>
                  <div className="sgb-leaf-head">
                    <h3 className="sgb-term">{active.term}</h3>
                    {active.abbr && (
                      <span className="sgb-seal" aria-label={`Sigla ${active.abbr}`}>
                        <span>{active.abbr}</span>
                      </span>
                    )}
                  </div>
                  <p className="sgb-lead">{active.desc}</p>
                  <div className="sgb-rule sgb-rule--leaf" aria-hidden="true"><span>❖</span></div>
                  {active.detail && (
                    <p className="sgb-body">
                      <span className="sgb-initial">{active.detail.charAt(0)}</span>
                      {active.detail.slice(1)}
                    </p>
                  )}
                  <nav className="sgb-turns">
                    <button type="button" className="prev" disabled={!prev} onClick={() => goTo(activeIndex - 1)}>
                      {prev ? <>‹ {prev.term}</> : null}
                    </button>
                    <button type="button" className="next" disabled={!next} onClick={() => goTo(activeIndex + 1)}>
                      {next ? <>{next.term} ›</> : null}
                    </button>
                  </nav>
                </article>
              ) : (
                <div className="sgb-blank">Pagina bianca</div>
              )}
              {turn && <span className={`sgb-sheet sheet-${turn.dir}`} key={`sheet-${turn.n}`} aria-hidden="true" />}
            </section>
          </div>

          {/* Copertina che si apre all'avvio */}
          <div className="sgb-opening" aria-hidden="true">
            <span className="sgb-opening-face">
              <span className="sgb-opening-sigil">✦</span>
              <span className="sgb-opening-title">Glossario</span>
            </span>
          </div>

          <footer className="sgb-hints">
            <span className="h"><kbd>↑</kbd><kbd>↓</kbd><span className="lbl">VOCE</span></span>
            <span className="h"><kbd>←</kbd><kbd>→</kbd><span className="lbl">CAPITOLO</span></span>
            <span className="h"><kbd>ESC</kbd><span className="lbl">CHIUDI</span></span>
          </footer>
        </div>
      </div>
      <GlossaryStyles />
    </div>
  );

  return createPortal(content, document.body);
}

function GlossaryStyles() {
  const T = MENU_ACCENTS.text;
  return (
    <style>{`
      .sgl {
        --leather: #1c1029; --leather-2: #2a1840; --tool: #c9b8e8;
        --paper: #f1e9d8; --paper-2: #e4d8bf; --ink: #22172e; --ink-soft: rgba(34,23,46,0.72);
        position: fixed; inset: 0;
        background:
          radial-gradient(circle, color-mix(in srgb, var(--accent) 34%, transparent) 1.3px, transparent 1.7px) 0 0 / 11px 11px,
          radial-gradient(ellipse at 50% 50%, rgba(20,8,32,0.6), rgba(5,5,7,0.94) 70%);
        font-family: 'Chakra Petch', system-ui, sans-serif; color: ${T};
      }
      .sgl * { box-sizing: border-box; }
      .sgl kbd {
        display: inline-grid; place-items: center; min-width: 20px; height: 18px; padding: 0 5px;
        background: var(--tool); color: var(--leather); border: 0;
        font-family: 'Chakra Petch', sans-serif; font-weight: 700; font-size: 11px; line-height: 1;
        clip-path: polygon(3px 0, 100% 0, calc(100% - 3px) 100%, 0 100%);
      }

      /* ---------- Libro ---------- */
      .sgb {
        position: fixed; left: 0; top: 0;
        width: min(1220px, 95vw); height: min(80vh, 760px);
        transform-origin: 0 0;
        transition: transform .55s cubic-bezier(.2,1.1,.35,1), opacity .2s ease-out;
        display: flex; flex-direction: column;
      }
      .sgb-cover {
        position: relative; flex: 1; min-height: 0; display: flex; flex-direction: column;
        padding: 18px 18px 0;
        background:
          radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.06), transparent 60%),
          repeating-linear-gradient(35deg, rgba(255,255,255,0.015) 0 2px, transparent 2px 5px),
          linear-gradient(160deg, var(--leather-2), var(--leather) 60%);
        border-radius: 10px 10px 12px 12px;
        box-shadow:
          inset 0 0 0 2px color-mix(in srgb, var(--tool) 45%, transparent),
          inset 0 0 0 7px var(--leather),
          inset 0 0 0 8px color-mix(in srgb, var(--accent) 55%, transparent),
          0 30px 80px rgba(0,0,0,0.75), 14px 14px 0 color-mix(in srgb, var(--accent) 70%, transparent);
        perspective: 2200px;
      }
      .sgb-corner {
        position: absolute; width: 46px; height: 46px; z-index: 3; pointer-events: none;
        border: 2px solid var(--tool);
        clip-path: polygon(0 0, 100% 0, 100% 22%, 22% 22%, 22% 100%, 0 100%);
        background: linear-gradient(135deg, color-mix(in srgb, var(--accent) 60%, transparent), transparent 60%);
      }
      .sgb-corner.tl { left: 6px; top: 6px; }
      .sgb-corner.tr { right: 6px; top: 6px; transform: scaleX(-1); }
      .sgb-corner.bl { left: 6px; bottom: 6px; transform: scaleY(-1); }
      .sgb-corner.br { right: 6px; bottom: 6px; transform: scale(-1); }

      .sgb-spread {
        position: relative; flex: 1; min-height: 0;
        display: grid; grid-template-columns: minmax(0, 1fr) 26px minmax(0, 1.25fr);
        transform-style: preserve-3d;
      }
      .sgb-page {
        position: relative; min-width: 0; min-height: 0; color: var(--ink);
        background:
          radial-gradient(ellipse at 50% 40%, transparent 55%, rgba(120,90,50,0.16) 100%),
          linear-gradient(var(--paper), var(--paper-2));
        box-shadow: 0 2px 0 #cbbd9f, 0 4px 0 #b9aa89, 0 6px 0 #a39373;
      }
      .sgb-left {
        display: flex; flex-direction: column; padding: 26px 26px 18px 34px; border-radius: 6px 0 0 6px;
        background:
          linear-gradient(90deg, transparent 82%, rgba(60,40,20,0.22) 100%),
          radial-gradient(ellipse at 50% 40%, transparent 55%, rgba(120,90,50,0.16) 100%),
          linear-gradient(var(--paper), var(--paper-2));
      }
      .sgb-right {
        padding: 30px 40px 18px 34px; border-radius: 0 6px 6px 0; overflow: hidden;
        background:
          linear-gradient(270deg, transparent 85%, rgba(60,40,20,0.24) 100%),
          radial-gradient(ellipse at 50% 40%, transparent 55%, rgba(120,90,50,0.16) 100%),
          linear-gradient(var(--paper), var(--paper-2));
      }
      .sgb-spine {
        background: linear-gradient(90deg, rgba(60,40,20,0.35), #2a1840 30%, #120a1c 50%, #2a1840 70%, rgba(60,40,20,0.35));
        box-shadow: inset 0 0 0 1px rgba(201,184,232,0.18);
      }

      /* ---------- Segnalibri ---------- */
      .sgb-tabs {
        position: relative; z-index: 0; display: flex; flex-wrap: wrap; align-items: flex-end; gap: 4px;
        padding: 0 190px 0 40px; margin-bottom: -6px;
      }
      .sgb-tab {
        display: inline-flex; align-items: center; gap: 6px; border: 0; cursor: pointer;
        height: 34px; padding: 0 12px 6px; align-self: flex-end;
        background: color-mix(in srgb, var(--c) 72%, #1c1029); color: #120a1c;
        font-family: 'Cinzel', Georgia, serif; font-weight: 700; font-size: 12px; letter-spacing: 0.06em;
        clip-path: polygon(0 0, 100% 0, 100% 100%, 50% calc(100% - 6px), 0 100%);
        transition: height .2s cubic-bezier(.3,1.6,.5,1), background .2s, transform .2s;
        transform-origin: bottom center;
      }
      .sgb-tab .gy { font-family: 'Chakra Petch', sans-serif; font-size: 13px; }
      .sgb-tab:disabled { cursor: default; opacity: 0.35; }
      .sgb-tab:not(:disabled):not(.on):hover { height: 40px; background: var(--c); }
      .sgb-tab.on { height: 50px; background: var(--c); box-shadow: inset 0 -3px 0 rgba(0,0,0,0.18); }
      .sgb-tab:focus-visible { outline: 2px solid ${T}; outline-offset: 2px; }

      .sgb-close {
        position: absolute; z-index: 5; top: -2px; right: 18px; transform: translateY(-50%) rotate(2deg);
        display: inline-flex; align-items: center; gap: 8px; border: 0; cursor: pointer;
        padding: 6px 14px 6px 8px; background: ${T}; color: #120a1c;
        box-shadow: 4px 4px 0 var(--accent);
        transition: transform .15s, box-shadow .15s;
      }
      .sgb-close:hover, .sgb-close:focus-visible { outline: none; transform: translateY(-50%) rotate(2deg) translate(-2px,-2px); box-shadow: 7px 7px 0 var(--accent); }
      .sgb-close .key { background: #120a1c; color: ${T}; font-weight: 700; font-size: 11px; padding: 2px 6px; }
      .sgb-close .lbl { font-weight: 700; font-style: italic; font-size: 14px; letter-spacing: 0.1em; }

      /* ---------- Pagina sinistra ---------- */
      .sgb-head { text-align: center; flex: none; }
      .sgb-kicker { font-family: 'Share Tech Mono', monospace; font-size: 11px; letter-spacing: 0.32em; text-transform: uppercase; color: var(--ink-soft); }
      .sgb-title {
        margin: 4px 0 0; font-family: 'Cinzel', Georgia, serif; font-weight: 900; font-size: 42px; line-height: 1;
        letter-spacing: 0.06em; text-transform: uppercase; color: var(--ink);
        text-shadow: 2px 2px 0 color-mix(in srgb, var(--accent) 45%, transparent);
      }
      .sgb-rule {
        display: flex; align-items: center; gap: 10px; margin: 10px auto 0; width: 70%;
        color: var(--accent); font-size: 14px;
      }
      .sgb-rule::before, .sgb-rule::after { content: ''; flex: 1; height: 1px; background: linear-gradient(90deg, transparent, var(--ink-soft), transparent); }

      .sgb-search {
        flex: none; display: flex; align-items: center; gap: 10px; margin: 16px 4px 0;
        border-bottom: 2px solid var(--ink); padding: 4px 2px;
      }
      .sgb-search-lbl { font-family: 'Cinzel', Georgia, serif; font-weight: 700; font-size: 13px; letter-spacing: 0.12em; color: var(--accent); }
      .sgb-search input {
        flex: 1; min-width: 0; border: 0; outline: none; background: transparent; color: var(--ink);
        font-family: Georgia, 'Times New Roman', serif; font-style: italic; font-size: 17px;
      }
      .sgb-search input::placeholder { color: rgba(34,23,46,0.4); }
      .sgb-search:focus-within { border-bottom-color: var(--accent); }
      .sgb-search-count { flex: none; font-family: 'Share Tech Mono', monospace; font-size: 11px; letter-spacing: 0.14em; color: var(--ink-soft); }

      .sgb-chapter {
        flex: none; display: flex; align-items: center; gap: 8px; margin: 16px 4px 6px;
        font-family: 'Cinzel', Georgia, serif; font-weight: 700; font-size: 15px; letter-spacing: 0.12em; text-transform: uppercase;
      }
      .sgb-chapter .sw { width: 12px; height: 12px; background: var(--c); transform: rotate(45deg); box-shadow: 1px 1px 0 var(--ink); }

      .sgb-index {
        flex: 1; min-height: 0; overflow-y: auto; overflow-x: hidden; padding: 4px 6px 16px 2px;
        scrollbar-width: thin; scrollbar-color: rgba(34,23,46,0.35) transparent;
      }
      .sgb-group {
        display: flex; align-items: center; gap: 8px; margin: 14px 0 4px;
        font-family: 'Cinzel', Georgia, serif; font-weight: 700; font-size: 12px; letter-spacing: 0.16em; text-transform: uppercase;
        color: color-mix(in srgb, var(--c) 70%, var(--ink));
      }
      .sgb-index-item:first-child .sgb-group { margin-top: 2px; }
      .sgb-entry {
        position: relative; display: flex; align-items: baseline; gap: 8px; width: 100%;
        border: 0; background: transparent; cursor: pointer; text-align: left; color: var(--ink);
        padding: 5px 8px 5px 22px; font-family: 'Chakra Petch', sans-serif; font-weight: 600; font-size: 15px;
        transition: background .15s, color .15s, padding .2s;
      }
      .sgb-entry .mk { position: absolute; left: 4px; color: var(--c); opacity: 0; transform: scale(0.4) rotate(-90deg); transition: opacity .15s, transform .25s cubic-bezier(.3,1.6,.5,1); }
      .sgb-entry .tm { flex: none; max-width: 70%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .sgb-entry .dots { flex: 1; min-width: 12px; border-bottom: 2px dotted rgba(34,23,46,0.28); transform: translateY(-4px); }
      .sgb-entry .ab { flex: none; font-family: 'Share Tech Mono', monospace; font-size: 12px; letter-spacing: 0.08em; color: var(--ink-soft); }
      .sgb-entry:hover { background: rgba(34,23,46,0.06); }
      .sgb-entry:hover .mk { opacity: 0.6; transform: none; }
      .sgb-entry:focus-visible { outline: 2px solid var(--accent); outline-offset: -2px; }
      .sgb-entry.on {
        padding-left: 28px; padding-right: 22px; color: ${T}; background: var(--ink);
        clip-path: polygon(0 0, 100% 0, calc(100% - 12px) 50%, 100% 100%, 0 100%);
      }
      .sgb-entry.on .mk { opacity: 1; transform: none; left: 8px; animation: sgb-spin 4s linear infinite; }
      .sgb-entry.on .dots { border-bottom-color: color-mix(in srgb, var(--c) 60%, transparent); }
      .sgb-entry.on .ab { color: var(--c); }
      @keyframes sgb-spin { to { transform: rotate(360deg); } }
      .sgb-empty { padding: 40px 10px; text-align: center; }
      .sgb-empty .t { margin: 0 0 6px; font-family: 'Cinzel', Georgia, serif; font-weight: 700; font-size: 18px; }
      .sgb-empty .s { margin: 0; font-size: 14px; color: var(--ink-soft); }

      /* ---------- Pagina destra ---------- */
      .sgb-leaf { position: relative; isolation: isolate; height: 100%; display: flex; flex-direction: column; transform-origin: left center; }
      .sgb-leaf::after {
        content: attr(data-glyph); position: absolute; right: -10px; bottom: 30px; z-index: -1; pointer-events: none;
        font-size: 260px; line-height: 1; color: color-mix(in srgb, var(--c) 16%, transparent);
        transform: rotate(-12deg);
      }
      .sgb-leaf.turn-fwd { animation: sgb-in-fwd .5s .12s cubic-bezier(.2,.9,.3,1) both; }
      .sgb-leaf.turn-back { animation: sgb-in-back .5s .12s cubic-bezier(.2,.9,.3,1) both; }
      @keyframes sgb-in-fwd { from { opacity: 0; transform: translateX(26px); } }
      @keyframes sgb-in-back { from { opacity: 0; transform: translateX(-26px); } }
      .sgb-leaf-chapter {
        display: inline-flex; align-items: center; gap: 8px; align-self: flex-start;
        font-family: 'Cinzel', Georgia, serif; font-weight: 700; font-size: 12px; letter-spacing: 0.2em; text-transform: uppercase;
        color: #120a1c; background: var(--c); padding: 4px 12px;
        clip-path: polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%);
      }
      .sgb-leaf-head { display: flex; align-items: center; gap: 18px; margin-top: 14px; }
      .sgb-term {
        flex: 1; min-width: 0; margin: 0; font-family: 'Cinzel', Georgia, serif; font-weight: 900;
        font-size: clamp(30px, 3.4vw, 48px); line-height: 1.02; letter-spacing: 0.03em; text-transform: uppercase; color: var(--ink);
        text-wrap: balance;
      }
      .sgb-seal {
        flex: none; position: relative; width: 78px; height: 78px; display: grid; place-items: center;
        transform: rotate(-12deg);
        animation: sgb-seal-in .45s .35s cubic-bezier(.2,1.7,.4,1) both;
      }
      .sgb-seal::before {
        content: ''; position: absolute; inset: 0; background: var(--accent);
        clip-path: polygon(50% 0%, 61% 10%, 76% 5%, 81% 19%, 95% 24%, 92% 39%, 100% 50%, 92% 61%, 95% 76%, 81% 81%, 76% 95%, 61% 90%, 50% 100%, 39% 90%, 24% 95%, 19% 81%, 5% 76%, 8% 61%, 0% 50%, 8% 39%, 5% 24%, 19% 19%, 24% 5%, 39% 10%);
        filter: drop-shadow(2px 3px 0 rgba(34,23,46,0.45));
      }
      .sgb-seal::after { content: ''; position: absolute; inset: 14px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.45); }
      .sgb-seal span { position: relative; font-family: 'Cinzel', Georgia, serif; font-weight: 900; font-size: 19px; color: #fff; letter-spacing: 0.02em; }
      @keyframes sgb-seal-in { from { opacity: 0; transform: rotate(-60deg) scale(2.2); } }
      .sgb-lead {
        margin: 16px 0 0; max-width: 60ch; font-family: Georgia, 'Times New Roman', serif; font-style: italic;
        font-size: 19px; line-height: 1.45; color: var(--ink);
      }
      .sgb-rule--leaf { width: 100%; margin: 18px 0 14px; }
      .sgb-body {
        flex: 1; min-height: 0; overflow-y: auto; margin: 0; max-width: 62ch; padding-right: 6px;
        font-size: 16px; line-height: 1.65; color: var(--ink);
        scrollbar-width: thin; scrollbar-color: rgba(34,23,46,0.35) transparent;
      }
      .sgb-initial {
        float: left; margin: 2px 10px 0 0; padding: 6px 10px 2px; line-height: 0.9;
        font-family: 'Cinzel', Georgia, serif; font-weight: 900; font-size: 46px;
        color: var(--paper); background: var(--ink); box-shadow: 3px 3px 0 var(--c);
      }
      .sgb-turns {
        flex: none; display: flex; justify-content: space-between; gap: 16px; margin-top: 12px; padding-top: 10px;
        border-top: 1px solid rgba(34,23,46,0.2);
      }
      .sgb-turns button {
        border: 0; background: transparent; cursor: pointer; padding: 4px 2px; min-height: 26px;
        font-family: 'Cinzel', Georgia, serif; font-weight: 700; font-size: 13px; letter-spacing: 0.08em; text-transform: uppercase;
        color: var(--ink-soft); max-width: 48%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }
      .sgb-turns button:hover:not(:disabled), .sgb-turns button:focus-visible { color: var(--accent); outline: none; }
      .sgb-turns button:disabled { cursor: default; }
      .sgb-turns .next { margin-left: auto; text-align: right; }
      .sgb-blank { height: 100%; display: grid; place-items: center; font-family: 'Cinzel', Georgia, serif; color: var(--ink-soft); letter-spacing: 0.2em; text-transform: uppercase; }

      /* Foglio che gira sopra la pagina destra */
      .sgb-sheet {
        position: absolute; inset: 0; z-index: 4; pointer-events: none;
        background: linear-gradient(90deg, var(--paper-2), var(--paper) 40%, #fffaf0 70%, var(--paper-2));
        box-shadow: -10px 0 30px rgba(0,0,0,0.25);
        backface-visibility: hidden;
      }
      .sgb-sheet.sheet-fwd { transform-origin: left center; animation: sgb-sheet-fwd .55s cubic-bezier(.45,.05,.3,1) forwards; }
      .sgb-sheet.sheet-back { transform-origin: left center; animation: sgb-sheet-back .55s cubic-bezier(.45,.05,.3,1) forwards; }
      @keyframes sgb-sheet-fwd {
        0% { transform: rotateY(0deg); opacity: 1; }
        100% { transform: rotateY(-100deg); opacity: 0.2; }
      }
      @keyframes sgb-sheet-back {
        0% { transform: rotateY(-100deg); opacity: 0.2; }
        100% { transform: rotateY(0deg); opacity: 0; }
      }

      /* ---------- Copertina che si apre ---------- */
      .sgb-opening {
        position: absolute; z-index: 6; top: 18px; bottom: 44px; right: 18px; width: calc((100% - 36px - 26px) * 1.25 / 2.25 + 13px);
        transform-origin: left center; transform-style: preserve-3d; pointer-events: none;
        animation: sgb-open .9s .35s cubic-bezier(.55,.05,.25,1) forwards;
      }
      .sgb-opening-face {
        position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px;
        background: linear-gradient(160deg, var(--leather-2), var(--leather) 70%);
        box-shadow: inset 0 0 0 3px color-mix(in srgb, var(--tool) 50%, transparent), inset 0 0 0 10px var(--leather), inset 0 0 0 11px var(--accent);
        border-radius: 0 8px 8px 0;
        backface-visibility: hidden;
      }
      .sgb-opening-sigil { font-size: 64px; color: var(--accent); text-shadow: 0 0 18px var(--accent); }
      .sgb-opening-title { font-family: 'Cinzel', Georgia, serif; font-weight: 900; font-size: 34px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--tool); }
      @keyframes sgb-open { to { transform: rotateY(-180deg); } }
      /* L'indice compare quando la copertina gli passa sopra */
      .sgb-left > * { animation: sgb-left-in .35s .78s ease-out both; }
      @keyframes sgb-left-in { from { opacity: 0; } }

      /* ---------- Comandi ---------- */
      .sgb-hints {
        flex: none; display: flex; align-items: center; justify-content: center; gap: 22px; height: 44px; color: var(--tool);
      }
      .sgb-hints .h { display: inline-flex; align-items: center; gap: 4px; }
      .sgb-hints .lbl { margin-left: 5px; font-family: 'Cinzel', Georgia, serif; font-weight: 700; font-size: 12px; letter-spacing: 0.16em; }

      /* Schermi stretti: pagine una sopra l'altra */
      @media (max-width: 820px) {
        .sgb { height: min(88vh, 900px); }
        .sgb-tabs { padding: 0 8px; }
        .sgb-spread { grid-template-columns: minmax(0, 1fr); grid-template-rows: minmax(0, 0.9fr) 10px minmax(0, 1.1fr); }
        .sgb-spine { background: linear-gradient(#2a1840, #120a1c); }
        .sgb-left { padding: 16px 16px 10px; border-radius: 6px 6px 0 0; }
        .sgb-right { padding: 18px 16px 10px; border-radius: 0 0 6px 6px; overflow-y: auto; }
        .sgb-leaf { height: auto; min-height: 100%; }
        .sgb-body { flex: none; overflow: visible; }
        .sgb-kicker { display: none; }
        .sgb-title { font-size: 30px; }
        .sgb-opening { display: none; }
      }

      @media (prefers-reduced-motion: reduce) {
        .sgl *, .sgl *::before, .sgl *::after { animation-duration: 0.001s !important; animation-delay: 0s !important; transition-duration: 0.001s !important; }
        .sgb-opening, .sgb-sheet { display: none; }
      }
    `}</style>
  );
}

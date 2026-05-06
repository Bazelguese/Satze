// ============================================
// GLOSSARIO - Con barra di ricerca
// ============================================

import { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { GLOSSARY_TERMS, GLOSSARY_CATEGORIES } from '../data/glossary';
import { PALETTE, HUD_ORATORIO_FONT_UI, HUD_ORATORIO_FONT_DISPLAY } from '../theme/hudOratorioPalette';

function normalize(str) {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // rimuove accenti
    .trim();
}

function matchesSearch(term, query) {
  if (!query) return true;
  const q = normalize(query);
  const searchable = normalize([term.term, term.abbr, term.desc].filter(Boolean).join(' '));
  return searchable.includes(q);
}

export function Glossary({ onClose, originButtonRef, zIndex = 50, variant = 'duel' }) {
  const isMenu = variant === 'menu';
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [originRect, setOriginRect] = useState(null);
  const [expanded, setExpanded] = useState(false);

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

  const filteredTerms = useMemo(() => {
    if (!search.trim()) return GLOSSARY_TERMS;
    return GLOSSARY_TERMS.filter((t) => matchesSearch(t, search));
  }, [search]);

  const grouped = useMemo(() => {
    const groups = {};
    filteredTerms.forEach((t) => {
      if (!groups[t.category]) groups[t.category] = [];
      groups[t.category].push(t);
    });
    return groups;
  }, [filteredTerms]);

  const categoryOrder = ['concetti', 'vittoria', 'trigger', 'effetti'];

  if (!originRect) return null;

  const shellBorder = isMenu ? '2px solid #c026d3' : `2px solid ${PALETTE.panelEdge}`;
  const shellBg = isMenu
    ? 'linear-gradient(180deg, #0c0614 0%, #140f22 45%, #080612 100%)'
    : `linear-gradient(180deg, ${PALETTE.deepVoid} 0%, ${PALETTE.nebula} 50%, ${PALETTE.deepVoid} 100%)`;
  const shellShadow = isMenu
    ? '0 0 32px rgba(192, 38, 211, 0.35), 0 0 60px rgba(236, 72, 153, 0.12)'
    : `0 0 28px ${PALETTE.magenta}33`;
  const titleColor = isMenu ? '#ec4899' : PALETTE.amber;
  const inputRing = isMenu
    ? 'border-fuchsia-500/50 focus:border-fuchsia-400 focus:ring-1 focus:ring-fuchsia-500/40'
    : 'border-violet-500/40 focus:border-violet-300 focus:outline-none focus:ring-1 focus:ring-violet-500/35';

  const content = (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 satze-glossary-backdrop"
      onClick={onClose}
      style={{ backdropFilter: 'none', zIndex }}
    >
      <div
        className="overflow-hidden flex flex-col transition-all duration-[550ms] ease-[cubic-bezier(0.34,1.56,0.64,1)]"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          width: 'min(672px, 90vw)',
          maxWidth: '672px',
          height: '85vh',
          transformOrigin: '0 0',
          transform: expanded
            ? 'translate(50vw, 50vh) translate(-50%, -50%) scale(1)'
            : `translate(${originRect.left}px, ${originRect.top}px) scale(0.12)`,
          background: shellBg,
          border: shellBorder,
          boxShadow: shellShadow,
          fontFamily: HUD_ORATORIO_FONT_UI,
        }}
      >
        {/* Header */}
        <div
          className="flex justify-between items-center p-4 shrink-0"
          style={{
            borderBottom: `1px solid ${isMenu ? 'rgba(51, 65, 85, 0.65)' : `${PALETTE.slate}88`}`,
          }}
        >
          <h2
            className="text-xl font-bold"
            style={{
              color: titleColor,
              fontFamily: isMenu ? HUD_ORATORIO_FONT_DISPLAY : HUD_ORATORIO_FONT_DISPLAY,
              textShadow: isMenu ? '0 0 18px rgba(236, 72, 153, 0.45)' : undefined,
            }}
          >
            📖 Glossario
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-xl transition-colors"
            aria-label="Chiudi glossario"
          >
            ×
          </button>
        </div>

        {/* Barra di ricerca */}
        <div className="p-4 pb-2 shrink-0">
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cerca termini (es. POT, Imboscata, VA...)"
              className={`w-full rounded-lg border border-slate-600/50 bg-[#110b20]/95 px-4 py-3 pl-10 text-sm text-white placeholder-slate-500 focus:outline-none ${inputRing}`}
              autoFocus
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-lg">
              🔍
            </span>
          </div>
          {search && (
            <p className="text-xs text-slate-400 mt-2">
              {filteredTerms.length} {filteredTerms.length === 1 ? 'risultato' : 'risultati'}
            </p>
          )}
        </div>

        {/* Lista termini */}
        <div className="flex-1 overflow-y-auto p-4 pt-2 satze-hide-scrollbar space-y-5">
          {filteredTerms.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <p className="text-lg mb-2">Nessun termine trovato</p>
              <p className="text-sm">Prova con altre parole (es. POT, trigger, VA)</p>
            </div>
          ) : (
            categoryOrder.map((cat) => {
              const terms = grouped[cat];
              if (!terms || terms.length === 0) return null;
              const meta = GLOSSARY_CATEGORIES[cat];
              const catColors = {
                amber: { color: '#f59e0b', border: 'rgba(245, 158, 11, 0.3)' },
                cyan: { color: '#22d3ee', border: 'rgba(34, 211, 238, 0.3)' },
                purple: { color: '#a78bfa', border: 'rgba(168, 85, 247, 0.3)' },
                emerald: { color: '#34d399', border: 'rgba(16, 185, 129, 0.3)' },
                green: { color: '#4ade80', border: 'rgba(34, 197, 94, 0.3)' },
              };
              const { color, border } = catColors[meta.color] || catColors.amber;
              return (
                <div key={cat}>
                  <h3
                    className="text-sm font-bold mb-3 border-b pb-2"
                    style={{ color, borderColor: border }}
                  >
                    {meta.icon} {meta.label}
                  </h3>
                  <div className="space-y-1 text-xs">
                    {terms.map((t, i) => {
                      const id = `${cat}-${t.term}-${i}`;
                      const isExpanded = expandedId === id;
                      const hasDetail = t.detail;
                      return (
                        <div
                          key={id}
                          className={`rounded-lg border transition-colors ${
                            hasDetail ? 'cursor-pointer hover:bg-slate-800/50' : ''
                          } ${isExpanded ? (isMenu ? 'bg-slate-800/70 border-fuchsia-500/45' : 'bg-slate-800/70 border-violet-500/40') : 'border-transparent'}`}
                          onClick={() => hasDetail && setExpandedId(isExpanded ? null : id)}
                        >
                          <div className="flex gap-2 p-2 items-start">
                            <span
                              className="font-bold shrink-0"
                              style={{
                                color:
                                  meta.color === 'amber'
                                    ? '#fbbf24'
                                    : meta.color === 'cyan'
                                    ? '#22d3ee'
                                    : meta.color === 'purple'
                                    ? '#a78bfa'
                                    : '#4ade80',
                              }}
                            >
                              {t.term}
                              {t.abbr && (
                                <span className="text-slate-500 font-normal ml-1">({t.abbr})</span>
                              )}
                            </span>
                            <span className="text-slate-300 flex-1">— {t.desc}</span>
                            {hasDetail && (
                              <span className="text-slate-500 shrink-0">
                                {isExpanded ? '▼' : '▶'}
                              </span>
                            )}
                          </div>
                          {isExpanded && hasDetail && (
                            <div
                              className={`px-2 pb-3 pt-0 pl-4 border-l-2 ml-2 text-slate-400 text-xs leading-relaxed ${isMenu ? 'border-fuchsia-500/40' : 'border-violet-400/35'}`}
                            >
                              {t.detail}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}

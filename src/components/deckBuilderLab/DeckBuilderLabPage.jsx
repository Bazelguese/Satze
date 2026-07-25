// ============================================
// DECK BUILDER — costruzione esercito (Gestione Eserciti)
// ============================================

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { injectSatzeUiFonts } from '../../theme/hudOratorioPalette';
import { saveCustomDeck, loadCustomDeck, generateDeckId } from '../../utils/deckManager';
import {
  FACTIONS,
  POOLS,
  ALL_CARDS,
  DECK_SIZE,
  MAX_LEAGUE,
  TRIGGER_COLORS,
  LEAGUE_COLORS,
  TAG_TOOLTIPS,
  EFFECT_NAMES,
  isRole,
} from './deckBuilderLabData';
import {
  displayTagsForCard,
  analyzeDeck,
} from './deckBuilderLabLogic';
import { CardReworkP4 } from '../cards/CardReworkP4';
import { TagBadge } from '../cards/CardTagBadges';
import { Glossary } from '../Glossary';
import './deckBuilderLab.css';

function accentForArmy(armyName) {
  return FACTIONS.find((f) => f.name === armyName)?.accent || '#a78bfa';
}

function applyCatalogFilters(cards, filters, skip = null) {
  let list = cards;
  const { query, legaFilter, trigFilter, tagFilter, effectFilter } = filters;

  if (skip !== 'query' && query.trim()) {
    const q = query.toLowerCase();
    list = list.filter((c) => c.name.toLowerCase().includes(q));
  }
  if (skip !== 'lega' && legaFilter) list = list.filter((c) => c.league === legaFilter);
  if (skip !== 'trig' && trigFilter) list = list.filter((c) => c.trigger === trigFilter);
  if (skip !== 'tag' && tagFilter) list = list.filter((c) => c.tags?.includes(tagFilter));
  if (skip !== 'effect' && effectFilter) list = list.filter((c) => c.effect === effectFilter);

  return list;
}

function countBy(list, getKey) {
  const counts = {};
  for (const item of list) {
    const key = getKey(item);
    if (key == null || key === '') continue;
    counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
}

function Tag({ t, mini, showAsRole }) {
  const role = showAsRole ?? isRole(t);
  return (
    <span
      className={`dbl-tag${role ? ' role' : ''}${mini ? ' mini' : ''}`}
      title={TAG_TOOLTIPS[t] || t}
    >
      {t}
    </span>
  );
}

function TriggerBadge({ trigger, mini }) {
  const c = TRIGGER_COLORS[trigger] || '#94a3b8';
  return (
    <span
      className={`dbl-trig${mini ? ' mini' : ''}`}
      style={{ color: c, background: `${c}20`, borderColor: `${c}55` }}
    >
      {trigger}
    </span>
  );
}

function CardTagsToggle({ card }) {
  const [open, setOpen] = useState(false);
  const cardTags = displayTagsForCard(card);

  if (cardTags.length === 0) return null;

  const handleToggle = (e) => {
    e.stopPropagation();
    setOpen((prev) => !prev);
  };

  return (
    <div className="dbl-cc-tags-wrap">
      <button type="button" className="dbl-tag-toggle" onClick={handleToggle}>
        TAG
        <span className="dbl-tag-toggle-n">{cardTags.length}</span>
        <span className="dbl-tag-toggle-caret">{open ? '▾' : '▸'}</span>
      </button>
      {open && (
        <div className="dbl-cc-tags">
          {cardTags.map(({ tag, showAsRole }) => (
            <TagBadge key={tag} tag={tag} compact showAsRole={showAsRole} />
          ))}
        </div>
      )}
    </div>
  );
}

const CARD_P4_W = 230;
const CARD_P4_H = 330;

function CatalogCard({ card, inDeck, disabled, onClick, onHover, onLeave }) {
  const accent = accentForArmy(card.army);
  const shellRef = useRef(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const node = shellRef.current;
    if (!node) return;

    const updateScale = () => {
      const width = node.offsetWidth;
      if (width > 0) setScale(width / CARD_P4_W);
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      className={`dbl-cc${inDeck ? ' in' : ''}${disabled ? ' dis' : ''}`}
      style={{ '--c': accent }}
      onMouseEnter={(e) => onHover?.(card, e.currentTarget)}
      onMouseLeave={onLeave}
    >
      <button
        type="button"
        className="dbl-cc-card-btn"
        disabled={disabled}
        onClick={onClick}
      >
        <div className="dbl-cc-card" ref={shellRef}>
          <div
            className="dbl-cc-p4-scaler"
            style={{ transform: `translateX(-50%) scale(${scale})` }}
          >
            <CardReworkP4 agent={card} suppressAnimations />
          </div>
          {inDeck && <span className="dbl-cc-check">✓</span>}
        </div>
      </button>
      <CardTagsToggle card={card} />
    </div>
  );
}

function DetailPopover({ data }) {
  if (!data) return null;
  const { card, rect } = data;
  const accent = accentForArmy(card.army);
  const cardTags = displayTagsForCard(card);
  const W = 260;
  const right = rect.right + 12 + W < window.innerWidth;
  const left = right ? rect.right + 12 : rect.left - 12 - W;
  const top = Math.min(Math.max(12, rect.top), window.innerHeight - 340);

  return createPortal(
    <div className="dbl-detail" style={{ left, top, width: W, '--c': accent }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span
          style={{
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.14em',
            padding: '2px 7px',
            border: `1px solid ${LEAGUE_COLORS[card.league]}`,
            color: LEAGUE_COLORS[card.league],
          }}
        >
          LEGA {card.league}
        </span>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, fontFamily: "'Share Tech Mono', monospace", fontSize: 12 }}>
          <b style={{ color: '#fde047', fontSize: 17 }}>{card.pot}</b>
          <i style={{ fontStyle: 'normal', fontSize: 8, color: '#6d6b64' }}>POT</i>
          <b style={{ color: '#c084fc', fontSize: 17 }}>{card.dan}</b>
          <i style={{ fontStyle: 'normal', fontSize: 8, color: '#6d6b64' }}>DAN</i>
        </div>
      </div>
      <div style={{ fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: 16, marginBottom: 8 }}>{card.name}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <TriggerBadge trigger={card.trigger} />
        <span style={{ fontSize: 11.5, color: '#b9b6ad', lineHeight: 1.35 }}>{card.powerDesc || card.abilityText || '—'}</span>
      </div>
      <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, letterSpacing: '0.28em', color: '#6d6b64', marginBottom: 6 }}>
        TAG · SISTEMA AGENTI
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {cardTags.map(({ tag, showAsRole }) => (
          <Tag key={tag} t={tag} showAsRole={showAsRole} />
        ))}
      </div>
    </div>,
    document.body
  );
}

function DeckRow({ card, accent, onRemove }) {
  const lc = LEAGUE_COLORS[card.league] || accent;

  return (
    <div className="dbl-row" style={{ '--c': accent }}>
      <span className="dbl-row-lg" style={{ color: lc, borderColor: `${lc}80` }}>
        L{card.league}
      </span>
      <span className="dbl-row-nm" title={card.name}>
        {card.name}
      </span>
      <span className="dbl-row-st">
        <b style={{ color: '#fde047' }}>{card.pot}</b>/<b style={{ color: '#c084fc' }}>{card.dan}</b>
      </span>
      <button type="button" className="dbl-row-x" onClick={onRemove} aria-label="rimuovi">
        ✕
      </button>
    </div>
  );
}

export function DeckBuilderLabPage({ existingDeckId = null, onClose }) {
  useEffect(() => {
    injectSatzeUiFonts();
  }, []);

  const [selectedArmyKeys, setSelectedArmyKeys] = useState([FACTIONS[0].key]);
  const [deckIds, setDeckIds] = useState([]);
  const [deckName, setDeckName] = useState('');
  const [isDeckLoading, setIsDeckLoading] = useState(Boolean(existingDeckId));
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('lega');
  const [legaFilter, setLegaFilter] = useState(null);
  const [trigFilter, setTrigFilter] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [effectFilter, setEffectFilter] = useState('');
  const [detail, setDetail] = useState(null);
  const [flash, setFlash] = useState(false);
  const [showGlossary, setShowGlossary] = useState(false);

  const primaryFac = FACTIONS.find((f) => f.key === selectedArmyKeys[0]) || FACTIONS[0];
  const accent = primaryFac.accent;

  const pool = useMemo(
    () => selectedArmyKeys.flatMap((key) => POOLS[key] || []),
    [selectedArmyKeys]
  );

  const deckCards = useMemo(
    () => deckIds.map((id) => ALL_CARDS.find((c) => c.id === id)).filter(Boolean),
    [deckIds]
  );
  const analysis = useMemo(() => analyzeDeck(deckCards), [deckCards]);

  const armyCountsInDeck = useMemo(() => {
    const counts = {};
    deckCards.forEach((c) => {
      counts[c.army] = (counts[c.army] || 0) + 1;
    });
    return counts;
  }, [deckCards]);

  const activeBonuses = useMemo(
    () => Object.entries(armyCountsInDeck).filter(([, count]) => count >= 2).map(([army]) => army),
    [armyCountsInDeck]
  );

  const toggleArmy = useCallback((key) => {
    setSelectedArmyKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
    setDetail(null);
  }, []);

  useEffect(() => {
    if (!existingDeckId) return;
    const loaded = loadCustomDeck(existingDeckId);
    if (!loaded?.cards?.length) {
      setIsDeckLoading(false);
      return;
    }

    const resolved = loaded.cards
      .map((id) => ALL_CARDS.find((c) => c.id === id))
      .filter(Boolean);
    const armyKeys = [...new Set(resolved.map((c) => c.army))]
      .map((name) => FACTIONS.find((f) => f.name === name)?.key)
      .filter(Boolean);

    setDeckIds(loaded.cards);
    setDeckName(loaded.name || '');
    if (armyKeys.length > 0) setSelectedArmyKeys(armyKeys);
    setIsDeckLoading(false);
  }, [existingDeckId]);

  const allArmyKeys = useMemo(() => FACTIONS.map((f) => f.key), []);
  const allArmiesSelected = selectedArmyKeys.length === allArmyKeys.length;

  const toggleAllArmies = useCallback(() => {
    setSelectedArmyKeys((prev) => (prev.length === allArmyKeys.length ? [] : allArmyKeys));
    setDetail(null);
  }, [allArmyKeys]);

  const canAdd = useCallback(
    (card) => deckIds.includes(card.id) || (deckIds.length < DECK_SIZE && card.league <= analysis.remLeague),
    [deckIds, analysis.remLeague]
  );

  const setDeck = useCallback((ids) => {
    setDeckIds(ids);
  }, []);

  const toggle = useCallback(
    (card) => {
      if (deckIds.includes(card.id)) {
        setDeck(deckIds.filter((i) => i !== card.id));
        return;
      }
      if (!canAdd(card)) return;
      setDeck([...deckIds, card.id]);
    },
    [canAdd, deckIds, setDeck]
  );

  const clear = useCallback(() => setDeck([]), [setDeck]);

  const schiera = useCallback(() => {
    if (!analysis.legal) return;
    const name = deckName.trim() || 'Esercito personalizzato';
    const primaryArmy =
      Object.entries(armyCountsInDeck).sort((a, b) => b[1] - a[1])[0]?.[0] ||
      primaryFac.name;
    const deckData = {
      name,
      description: '',
      army: primaryArmy,
      cards: deckCards.map((c) => c.id),
    };
    const deckId = existingDeckId || generateDeckId();
    if (!saveCustomDeck(deckId, deckData)) return;
    setFlash(true);
    setTimeout(() => {
      setFlash(false);
      onClose?.();
    }, 1400);
  }, [analysis.legal, deckCards, deckName, armyCountsInDeck, primaryFac.name, existingDeckId, onClose]);

  const filterState = useMemo(
    () => ({ query, legaFilter, trigFilter, tagFilter, effectFilter }),
    [query, legaFilter, trigFilter, tagFilter, effectFilter]
  );

  const hasActiveFilters = Boolean(
    query.trim() || legaFilter || trigFilter || tagFilter || effectFilter
  );

  const clearFilters = useCallback(() => {
    setQuery('');
    setLegaFilter(null);
    setTrigFilter('');
    setTagFilter('');
    setEffectFilter('');
    setDetail(null);
  }, []);

  const armySortOrder = useMemo(() => {
    const keys = selectedArmyKeys.length > 0 ? selectedArmyKeys : FACTIONS.map((f) => f.key);
    const order = {};
    keys.forEach((key, index) => {
      const faction = FACTIONS.find((f) => f.key === key);
      if (faction) order[faction.name] = index;
    });
    return order;
  }, [selectedArmyKeys]);

  const shown = useMemo(() => {
    const list = applyCatalogFilters(pool, filterState);
    const cmp = {
      lega: (a, b) => a.league - b.league || b.pot + b.dan - (a.pot + a.dan),
      pot: (a, b) => b.pot - a.pot,
      dan: (a, b) => b.dan - a.dan,
      armata: (a, b) =>
        (armySortOrder[a.army] ?? 999) - (armySortOrder[b.army] ?? 999)
        || a.league - b.league
        || b.pot + b.dan - (a.pot + a.dan),
    }[sort];

    return list.sort(cmp);
  }, [pool, filterState, sort, armySortOrder]);

  const shownByArmy = useMemo(() => {
    if (sort !== 'armata' || shown.length === 0) return null;

    const groups = [];
    let current = null;

    for (const card of shown) {
      if (!current || current.army !== card.army) {
        current = {
          army: card.army,
          faction: FACTIONS.find((f) => f.name === card.army),
          cards: [],
        };
        groups.push(current);
      }
      current.cards.push(card);
    }

    return groups;
  }, [shown, sort]);

  const legaFilterBase = useMemo(
    () => applyCatalogFilters(pool, filterState, 'lega'),
    [pool, filterState]
  );
  const trigFilterBase = useMemo(
    () => applyCatalogFilters(pool, filterState, 'trig'),
    [pool, filterState]
  );
  const effectFilterBase = useMemo(
    () => applyCatalogFilters(pool, filterState, 'effect'),
    [pool, filterState]
  );
  const tagFilterBase = useMemo(
    () => applyCatalogFilters(pool, filterState, 'tag'),
    [pool, filterState]
  );

  const legaCounts = useMemo(
    () => countBy(legaFilterBase, (c) => c.league),
    [legaFilterBase]
  );
  const trigCounts = useMemo(
    () => countBy(trigFilterBase, (c) => c.trigger),
    [trigFilterBase]
  );
  const effectCounts = useMemo(
    () => countBy(effectFilterBase, (c) => c.effect),
    [effectFilterBase]
  );
  const tagCounts = useMemo(() => {
    const counts = {};
    for (const card of tagFilterBase) {
      for (const tag of card.tags || []) {
        counts[tag] = (counts[tag] || 0) + 1;
      }
    }
    return counts;
  }, [tagFilterBase]);

  const allTriggers = useMemo(() => [...new Set(pool.map((c) => c.trigger))].sort(), [pool]);
  const allTags = useMemo(() => [...new Set(pool.flatMap((c) => c.tags || []))].sort(), [pool]);
  const allEffects = useMemo(
    () =>
      [...new Set(pool.map((c) => c.effect).filter(Boolean))].sort((a, b) =>
        (EFFECT_NAMES[a] || a).localeCompare(EFFECT_NAMES[b] || b)
      ),
    [pool]
  );

  const headerArmies = useMemo(() => {
    const keys = selectedArmyKeys.length > 0 ? selectedArmyKeys : [primaryFac.key];
    return keys.map((key) => FACTIONS.find((f) => f.key === key)).filter(Boolean);
  }, [selectedArmyKeys, primaryFac.key]);

  const catalogLabel = useMemo(() => {
    if (selectedArmyKeys.length === 0) return 'Nessuna armata';
    if (selectedArmyKeys.length === 1) {
      return FACTIONS.find((f) => f.key === selectedArmyKeys[0])?.name || '';
    }
    return 'Armate miste';
  }, [selectedArmyKeys]);

  const showHeaderArmyIcon = selectedArmyKeys.length === 1 && headerArmies[0]?.icon;

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Enter' && analysis.legal) schiera();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [analysis.legal, schiera]);

  const ringLen = 2 * Math.PI * 26;

  if (isDeckLoading) {
    return (
      <div className="dbl-root dbl-loading" style={{ '--accent': accent }}>
        <div className="dbl-cosmic" />
        <p className="dbl-loading-txt">Caricamento esercito…</p>
      </div>
    );
  }

  return (
    <div className="dbl-root" style={{ '--accent': accent }}>
      <div className="dbl-cosmic" />
      <div className="dbl-vignette" />

      <header className="dbl-head">
        <button type="button" className="dbl-back" onClick={onClose}>
          <span className="ar">←</span>
          <span>Indietro</span>
        </button>
        <div className="dbl-head-mid">
          <div className="dbl-eyebrow" style={{ color: accent }}>
            FASE II · ARRUOLAMENTO
          </div>
          <h1 className="dbl-title">COSTRUZIONE ESERCITO</h1>
          <div className="dbl-subtitle">
            {DECK_SIZE} CARTE · MAX {MAX_LEAGUE} LEGA
          </div>
        </div>
        <div className="dbl-head-r">
          <button
            type="button"
            className="dbl-glossary-btn"
            onClick={() => setShowGlossary(true)}
          >
            GLOSSARIO
          </button>
          {showHeaderArmyIcon ? (
            <div className="dbl-head-icons">
              <img src={headerArmies[0].icon} alt="" className="dbl-head-ic" draggable={false} />
            </div>
          ) : null}
          <span className="dbl-fac-name">{catalogLabel}</span>
        </div>
      </header>

      <div className="dbl-body">
        <aside className="dbl-rail">
          <div className="dbl-rail-h">ARMATA · MULTI</div>
          <p className="dbl-rail-hint">Clicca per aggiungere o rimuovere dal catalogo</p>
          <button
            type="button"
            className={`dbl-rail-all${allArmiesSelected ? ' on' : ''}`}
            style={{ '--c': accent }}
            onClick={toggleAllArmies}
          >
            TUTTE
          </button>
          <div className="dbl-rail-list">
            {FACTIONS.map((f) => (
              <button
                key={f.key}
                type="button"
                className={`dbl-fac${selectedArmyKeys.includes(f.key) ? ' on' : ''}`}
                style={{ '--c': f.accent }}
                onClick={() => toggleArmy(f.key)}
              >
                {f.icon ? <img src={f.icon} alt="" className="dbl-fac-ic" draggable={false} /> : null}
                <span className="dbl-fac-lbl">{f.name}</span>
                <span className="dbl-fac-dot" />
              </button>
            ))}
          </div>
          {selectedArmyKeys.length === 1 && (
            <div className="dbl-bonus" style={{ borderColor: accent }}>
              <div className="dbl-bonus-h" style={{ color: accent }}>
                BONUS · {primaryFac.bonusLabel}
                <span className={`dbl-bonus-state${activeBonuses.includes(primaryFac.name) ? ' on' : ''}`}>
                  {activeBonuses.includes(primaryFac.name) ? 'ATTIVO' : '2+ CARTE'}
                </span>
              </div>
              <div className="dbl-bonus-v">{primaryFac.bonus}</div>
            </div>
          )}
          {selectedArmyKeys.length > 1 && (
            <div className="dbl-bonus dbl-bonus-multi" style={{ borderColor: accent }}>
              <div className="dbl-bonus-h" style={{ color: accent }}>BONUS · SET SELEZIONATI</div>
              {selectedArmyKeys.map((key) => {
                const f = FACTIONS.find((x) => x.key === key);
                if (!f) return null;
                return (
                  <div key={key} className="dbl-bonus-row">
                    <span className="dbl-bonus-row-name" style={{ color: f.accent }}>{f.name}</span>
                    <span className="dbl-bonus-v">{f.bonus}</span>
                  </div>
                );
              })}
            </div>
          )}
        </aside>

        <main className="dbl-pool">
          <div className="dbl-toolbar">
            <div className="dbl-search">
              <span className="dbl-search-ic">⌕</span>
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cerca carta…" />
            </div>
            <div className="dbl-filtgroup">
              <label>LEGA</label>
              {[null, 2, 3, 4, 5].map((l) => (
                <button
                  key={l ?? 'all'}
                  type="button"
                  className={`dbl-lg${legaFilter === l ? ' on' : ''}`}
                  onClick={() => setLegaFilter(l)}
                  style={
                    l && legaFilter === l
                      ? { color: LEAGUE_COLORS[l], borderColor: LEAGUE_COLORS[l] }
                      : undefined
                  }
                >
                  {l ?? '∗'}
                  <span className="dbl-filt-n">({l ? legaCounts[l] || 0 : legaFilterBase.length})</span>
                </button>
              ))}
            </div>
            <select
              className="dbl-sel"
              value={trigFilter}
              onChange={(e) => setTrigFilter(e.target.value)}
              title="Filtro trigger"
            >
              <option value="">TRIGGER · tutti ({trigFilterBase.length})</option>
              {allTriggers.map((t) => (
                <option key={t} value={t}>
                  {t} ({trigCounts[t] || 0})
                </option>
              ))}
            </select>
            <select
              className="dbl-sel"
              value={effectFilter}
              onChange={(e) => setEffectFilter(e.target.value)}
              title="Filtro effetto"
            >
              <option value="">EFFETTO · tutti ({effectFilterBase.length})</option>
              {allEffects.map((eff) => (
                <option key={eff} value={eff}>
                  {EFFECT_NAMES[eff] || eff} ({effectCounts[eff] || 0})
                </option>
              ))}
            </select>
            <select
              className="dbl-sel"
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              title="Filtro tag"
            >
              <option value="">TAG · tutti ({tagFilterBase.length})</option>
              {allTags.map((t) => (
                <option key={t} value={t}>
                  {t} ({tagCounts[t] || 0})
                </option>
              ))}
            </select>
            <button
              type="button"
              className="dbl-clear-filt"
              onClick={clearFilters}
              disabled={!hasActiveFilters}
              title="Rimuovi tutti i filtri"
            >
              AZZERA FILTRI
            </button>
            <div className="dbl-sort">
              <label>ORDINA</label>
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="lega">Lega</option>
                <option value="armata">Armata</option>
                <option value="pot">POT ↓</option>
                <option value="dan">DAN ↓</option>
              </select>
            </div>
          </div>

          <div className="dbl-grid">
            {selectedArmyKeys.length === 0 ? (
              <div className="dbl-empty">
                Seleziona almeno un&apos;armata dal pannello a sinistra
              </div>
            ) : shownByArmy ? (
              shownByArmy.map(({ army, faction, cards }) => (
                <section key={army} className="dbl-grid-group" style={{ '--c': faction?.accent || accent }}>
                  <div className="dbl-grid-group-h">
                    {faction?.icon ? (
                      <img src={faction.icon} alt="" className="dbl-grid-group-ic" draggable={false} />
                    ) : null}
                    <span>{army}</span>
                    <span className="dbl-grid-group-n">({cards.length})</span>
                  </div>
                  <div className="dbl-grid-group-inner">
                    {cards.map((c) => (
                      <CatalogCard
                        key={c.id}
                        card={c}
                        inDeck={deckIds.includes(c.id)}
                        disabled={!canAdd(c)}
                        onClick={() => toggle(c)}
                        onHover={(card, el) => setDetail({ card, rect: el.getBoundingClientRect() })}
                        onLeave={() => setDetail(null)}
                      />
                    ))}
                  </div>
                </section>
              ))
            ) : (
              shown.map((c) => (
                <CatalogCard
                  key={c.id}
                  card={c}
                  inDeck={deckIds.includes(c.id)}
                  disabled={!canAdd(c)}
                  onClick={() => toggle(c)}
                  onHover={(card, el) => setDetail({ card, rect: el.getBoundingClientRect() })}
                  onLeave={() => setDetail(null)}
                />
              ))
            )}
            {selectedArmyKeys.length > 0 && shown.length === 0 && (
              <div className="dbl-empty">Nessuna carta con questi filtri.</div>
            )}
          </div>
          <div className="dbl-pool-foot">
            <span>
              {shown.length} {shown.length === 1 ? 'carta' : 'carte'} · {catalogLabel}
            </span>
            <span>
              Clicca per arruolare · tag <b style={{ color: '#ef4444' }}>rossi</b> = Ruolo
            </span>
          </div>
        </main>

        <aside className="dbl-deck">
          <div className="dbl-deck-name">
            <input
              value={deckName}
              onChange={(e) => setDeckName(e.target.value)}
              placeholder="Nome esercito"
              spellCheck={false}
            />
          </div>

          <div className="dbl-budget">
            <div className="dbl-budget-bar">
              <div className="dbl-budget-h">
                <span>LEGA TOTALE</span>
                <em
                  style={{
                    color:
                      analysis.totalLeague > MAX_LEAGUE
                        ? '#c2473f'
                        : analysis.totalLeague >= 25
                          ? '#c9a23e'
                          : accent,
                  }}
                >
                  {analysis.totalLeague} / {MAX_LEAGUE}
                </em>
              </div>
              <div className="dbl-budget-t">
                <div
                  className="dbl-budget-f"
                  style={{
                    width: `${Math.min(100, (analysis.totalLeague / MAX_LEAGUE) * 100)}%`,
                    background:
                      analysis.totalLeague >= 25
                        ? 'linear-gradient(90deg,#4a9e78,#c9a23e)'
                        : `linear-gradient(90deg,#4a9e78,${accent})`,
                  }}
                />
              </div>
            </div>
            <div className="dbl-count">
              <svg viewBox="0 0 60 60" className="dbl-count-ring">
                <circle cx="30" cy="30" r="26" className="dbl-ring-bg" />
                <circle
                  cx="30"
                  cy="30"
                  r="26"
                  className="dbl-ring-fg"
                  style={{
                    stroke: accent,
                    strokeDasharray: ringLen,
                    strokeDashoffset: ringLen * (1 - analysis.count / DECK_SIZE),
                  }}
                />
              </svg>
              <div className="dbl-count-txt">
                <b>{analysis.count}</b>
                <i>/{DECK_SIZE}</i>
              </div>
            </div>
          </div>

          <div className="dbl-slots">
            <div className="dbl-deck-roster-h">
              <span>ESERCITO</span>
              <span>
                {analysis.count}/{DECK_SIZE}
              </span>
            </div>
            {deckCards.length === 0 ? (
              <p className="dbl-deck-empty">Nessuna carta selezionata.</p>
            ) : (
              deckCards.map((c) => (
                <DeckRow
                  key={c.id}
                  card={c}
                  accent={accentForArmy(c.army)}
                  onRemove={() => setDeck(deckIds.filter((i) => i !== c.id))}
                />
              ))
            )}
          </div>

          {activeBonuses.length > 0 && (
            <div className="dbl-deck-bonuses">
              <div className="dbl-an-h">BONUS ATTIVI</div>
              {activeBonuses.map((army) => {
                const f = FACTIONS.find((x) => x.name === army);
                return (
                  <div key={army} className="dbl-deck-bonus-row" style={{ borderColor: `${f?.accent || accent}55` }}>
                    <span style={{ color: f?.accent || accent, fontWeight: 700, fontSize: 12 }}>{army}</span>
                    <span className="dbl-bonus-v">{f?.bonus}</span>
                    <span className="dbl-bonus-count">{armyCountsInDeck[army]}×</span>
                  </div>
                );
              })}
            </div>
          )}

          <div className="dbl-advice">
            {analysis.msgs.map((m, i) => (
              <div key={i} className={`dbl-msg ${m.t}`}>
                <span>{m.t === 'ok' ? '✓' : m.t === 'warn' ? '!' : 'i'}</span>
                {m.x}
              </div>
            ))}
          </div>

          <div className="dbl-actions dbl-actions-single">
            <button type="button" className="dbl-act ghost" onClick={clear} disabled={analysis.count === 0}>
              Svuota esercito
            </button>
          </div>

          <button
            type="button"
            className={`dbl-schiera${analysis.legal ? ' ready' : ''}`}
            style={{ borderColor: accent, color: analysis.legal ? accent : undefined }}
            onClick={schiera}
            disabled={!analysis.legal}
          >
            <span>SALVA ESERCITO</span>
            <span>↵</span>
          </button>
        </aside>
      </div>

      <DetailPopover data={detail} />

      {showGlossary && (
        <Glossary variant="menu" onClose={() => setShowGlossary(false)} zIndex={10000} />
      )}

      {flash && (
        <div className="dbl-flash" style={{ '--accent': accent }}>
          <div className="dbl-flash-bg" />
          <div className="dbl-flash-txt">
            <div className="e" style={{ color: accent }}>
              ESERCITO SALVATO
            </div>
            <div className="n">{deckName}</div>
            <div className="s">
              {catalogLabel} · {analysis.count} carte · {analysis.totalLeague} Lega
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

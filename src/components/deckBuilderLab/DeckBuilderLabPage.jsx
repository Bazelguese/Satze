// ============================================
// DECK BUILDER — costruzione esercito (Gestione Eserciti)
// ============================================

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { injectSatzeUiFonts } from '../../theme/hudOratorioPalette';
import { saveCustomDeck, loadCustomDeck, generateDeckId, validateDeck } from '../../utils/deckManager';
import {
  FACTIONS,
  POOLS,
  ALL_CARDS,
  DECK_SIZE,
  MAX_LEAGUE,
  TRIGGER_COLORS,
  LEAGUE_COLORS,
  LABEL_TOOLTIPS,
  EFFECT_NAMES,
  isRole,
  ARCHETYPES,
  FOCUS_RELATIONS,
} from './deckBuilderLabData';
import {
  displayTagsForCard,
  analyzeDeck,
  cardMatchesCatalogQuery,
} from './deckBuilderLabLogic';
import { CardReworkP4 } from '../cards/CardReworkP4';
import { TagBadge } from '../cards/CardTagBadges';
import { Glossary } from '../Glossary';
import { getCardSprite } from '../../utils/cardUtils';
import { getAgentThumbUrl, getCardImageUrl } from '../../data/images';
import { ARMY_GIFS } from '../../data/armies';
import { ARMY_LORE } from '../menu/cosmic/armyLore';
import { resolvePublicAssetUrl } from '../../utils/preloadAssets';
import './deckBuilderLab.css';

function accentForArmy(armyName) {
  return FACTIONS.find((f) => f.name === armyName)?.accent || '#a78bfa';
}

function applyCatalogFilters(cards, filters, skip = null) {
  let list = cards;
  const { query, legaFilter, trigFilter, archetypeFilter, focusFilter, scalingFilter, effectFilter } = filters;

  if (skip !== 'query' && query.trim()) {
    list = list.filter((c) => cardMatchesCatalogQuery(c, query));
  }
  if (skip !== 'lega' && legaFilter) list = list.filter((c) => c.league === legaFilter);
  if (skip !== 'trig' && trigFilter) list = list.filter((c) => c.trigger === trigFilter);
  if (skip !== 'archetype' && archetypeFilter) {
    list = list.filter((c) => c.archetype === archetypeFilter || c.secondary === archetypeFilter);
  }
  if (skip !== 'focus' && focusFilter) list = list.filter((c) => c.focus === focusFilter);
  if (skip !== 'scaling' && scalingFilter === 'yes') list = list.filter((c) => c.scaling);
  if (skip !== 'scaling' && scalingFilter === 'no') list = list.filter((c) => !c.scaling);
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

function Tag({ t, mini, showAsRole, variant, kind }) {
  const resolved = kind || variant;
  const role = showAsRole ?? (resolved === 'archetype' || isRole(t));
  const kindClass =
    resolved === 'focus' ? ' focus' :
    resolved === 'scaling' ? ' scaling' :
    resolved === 'secondary' ? ' secondary' : '';
  return (
    <span
      className={`dbl-tag${role ? ' role' : ''}${kindClass}${mini ? ' mini' : ''}`}
      title={LABEL_TOOLTIPS[t] || t}
    >
      {resolved === 'secondary' ? `/ ${t}` : t}
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
        ARCH
        <span className="dbl-tag-toggle-n">{cardTags.length}</span>
        <span className="dbl-tag-toggle-caret">{open ? '▾' : '▸'}</span>
      </button>
      {open && (
        <div className="dbl-cc-tags">
          {cardTags.map(({ tag, showAsRole, variant, kind, title }) => (
            <TagBadge key={`${kind}-${tag}`} tag={tag} compact showAsRole={showAsRole} variant={variant} kind={kind} title={title} />
          ))}
        </div>
      )}
    </div>
  );
}

const CARD_P4_W = 230;

function cardThumbUrl(card) {
  const sprite = getCardSprite(card);
  const thumb = sprite?.agentId != null ? getAgentThumbUrl(sprite.agentId) : null;
  return thumb || getCardImageUrl(sprite?.type, sprite?.agentId);
}

/** Icona armata con ripiego sul glifo se il file manca. */
function ArmyIcon({ faction, className }) {
  const [broken, setBroken] = useState(false);
  if (!faction?.icon || broken) {
    return <span className={`${className} dbl-glyph`} aria-hidden="true">{ARMY_LORE[faction?.name]?.glyph || '◈'}</span>;
  }
  return (
    <img
      src={faction.icon}
      alt=""
      className={className}
      draggable={false}
      onError={() => setBroken(true)}
    />
  );
}

function CatalogCard({ card, slot, disabled, onClick, onHover, onLeave }) {
  const accent = accentForArmy(card.army);
  const shellRef = useRef(null);
  const [scale, setScale] = useState(1);
  const inDeck = slot > 0;

  useEffect(() => {
    const node = shellRef.current;
    if (!node) return undefined;

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
        aria-pressed={inDeck}
        aria-label={inDeck ? `${card.name}: togli dall'esercito` : `${card.name}: arruola`}
      >
        <span className="dbl-cc-back" aria-hidden="true" />
        <div className="dbl-cc-card" ref={shellRef}>
          <div
            className="dbl-cc-p4-scaler"
            style={{ transform: `translateX(-50%) scale(${scale})` }}
          >
            <CardReworkP4 agent={card} suppressAnimations />
          </div>
        </div>
        {inDeck && (
          <span className="dbl-cc-check" aria-hidden="true">
            <span className="burst" />
            <span className="n">{slot}</span>
          </span>
        )}
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
  const W = 300;
  const right = rect.right + 14 + W < window.innerWidth;
  const left = right ? rect.right + 14 : rect.left - 14 - W;
  const top = Math.min(Math.max(12, rect.top), window.innerHeight - 360);
  const lc = LEAGUE_COLORS[card.league] || accent;

  return createPortal(
    <div className="dbl-detail" style={{ left, top, width: W, '--c': accent, '--lc': lc }}>
      <div className="dbl-detail-top">
        <span className="dbl-detail-lg">LEGA {card.league}</span>
        <span className="dbl-detail-stats">
          <b className="pot">{card.pot}</b><i>POT</i>
          <b className="dan">{card.dan}</b><i>DAN</i>
        </span>
      </div>
      <div className="dbl-detail-name"><span>{card.name}</span></div>
      <div className="dbl-detail-army">{card.army}</div>
      <div className="dbl-detail-power">
        <TriggerBadge trigger={card.trigger} />
        <span>{card.powerDesc || card.abilityText || '—'}</span>
      </div>
      {cardTags.length > 0 && (
        <>
          <div className="dbl-detail-h">ARCHETIPO · FOCUS</div>
          <div className="dbl-detail-tags">
            {cardTags.map(({ tag, showAsRole, variant, kind }) => (
              <Tag key={`${kind}-${tag}`} t={tag} showAsRole={showAsRole} variant={variant} kind={kind} />
            ))}
          </div>
        </>
      )}
    </div>,
    document.body
  );
}

function DeckRow({
  card,
  accent,
  onRemove,
  index,
  isCover,
  onSetCover,
  isDragging,
  isDropTarget,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}) {
  const lc = LEAGUE_COLORS[card.league] || accent;
  const thumb = cardThumbUrl(card);

  return (
    <div
      className={`dbl-row${isDragging ? ' dragging' : ''}${isDropTarget ? ' drop-target' : ''}${isCover ? ' cover' : ''}`}
      style={{ '--c': accent, '--lc': lc }}
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
    >
      <span className="dbl-row-num" title="Trascina per riordinare">{String(index + 1).padStart(2, '0')}</span>
      <span className="dbl-row-thumb" aria-hidden="true">
        {thumb ? <img src={thumb} alt="" draggable={false} loading="lazy" decoding="async" /> : null}
      </span>
      <span className="dbl-row-lg">L{card.league}</span>
      <span className="dbl-row-nm" title={card.name}>
        {card.name}
      </span>
      <span className="dbl-row-st">
        <b className="pot">{card.pot}</b>/<b className="dan">{card.dan}</b>
      </span>
      <button
        type="button"
        className={`dbl-row-cover${isCover ? ' on' : ''}`}
        onClick={onSetCover}
        onMouseDown={(e) => e.stopPropagation()}
        draggable={false}
        aria-pressed={isCover}
        aria-label={isCover ? 'copertina dell\'esercito' : 'usa come copertina'}
        title={isCover ? 'Copertina dell\'esercito (clic per tornare automatica)' : 'Usa come copertina dell\'esercito'}
      >
        {isCover ? '★' : '☆'}
      </button>
      <button
        type="button"
        className="dbl-row-x"
        onClick={onRemove}
        onMouseDown={(e) => e.stopPropagation()}
        draggable={false}
        aria-label="rimuovi"
      >
        ✕
      </button>
    </div>
  );
}

const CATALOG_BATCH = 14;

function scheduleIdleWork(fn) {
  if (typeof requestIdleCallback === 'function') {
    return requestIdleCallback(fn, { timeout: 120 });
  }
  return requestAnimationFrame(() => setTimeout(fn, 0));
}

function cancelIdleWork(id) {
  if (typeof cancelIdleCallback === 'function') {
    cancelIdleCallback(id);
  } else {
    cancelAnimationFrame(id);
  }
}

export function DeckBuilderLabPage({
  existingDeckId = null,
  onClose,
  onBootProgress = null,
  onBootReady = null,
}) {
  useEffect(() => {
    injectSatzeUiFonts();
  }, []);

  const [selectedArmyKeys, setSelectedArmyKeys] = useState([FACTIONS[0].key]);
  const [deckIds, setDeckIds] = useState([]);
  const [deckName, setDeckName] = useState('');
  /** Carta copertina scelta dal giocatore; null = automatica (leader del mazzo). */
  const [coverCardId, setCoverCardId] = useState(null);
  const [isDeckLoading, setIsDeckLoading] = useState(Boolean(existingDeckId));
  const [catalogVisible, setCatalogVisible] = useState(CATALOG_BATCH);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('lega');
  const [legaFilter, setLegaFilter] = useState(null);
  const [trigFilter, setTrigFilter] = useState('');
  const [archetypeFilter, setArchetypeFilter] = useState('');
  const [focusFilter, setFocusFilter] = useState('');
  const [scalingFilter, setScalingFilter] = useState('');
  const [effectFilter, setEffectFilter] = useState('');
  const [detail, setDetail] = useState(null);
  const [flash, setFlash] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [showGlossary, setShowGlossary] = useState(false);
  const [dragIndex, setDragIndex] = useState(null);
  const [dropIndex, setDropIndex] = useState(null);
  const dragIndexRef = useRef(null);
  const bootReadySentRef = useRef(false);
  const onBootProgressRef = useRef(onBootProgress);
  const onBootReadyRef = useRef(onBootReady);
  onBootProgressRef.current = onBootProgress;
  onBootReadyRef.current = onBootReady;

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
    setCoverCardId(loaded.coverCardId ?? null);
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

  const handleRosterDragStart = useCallback((e, index) => {
    dragIndexRef.current = index;
    setDragIndex(index);
    setDropIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
    if (e.currentTarget instanceof HTMLElement) {
      e.dataTransfer.setDragImage(e.currentTarget, 24, 16);
    }
  }, []);

  const handleRosterDragOver = useCallback((e, overIndex) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const fromIndex = dragIndexRef.current;
    if (fromIndex == null || fromIndex === overIndex) {
      setDropIndex(overIndex);
      return;
    }
    setDeckIds((prev) => {
      if (fromIndex < 0 || fromIndex >= prev.length || overIndex < 0 || overIndex >= prev.length) {
        return prev;
      }
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(overIndex, 0, moved);
      return next;
    });
    dragIndexRef.current = overIndex;
    setDragIndex(overIndex);
    setDropIndex(overIndex);
  }, []);

  const handleRosterDrop = useCallback((e) => {
    e.preventDefault();
    setDragIndex(null);
    setDropIndex(null);
    dragIndexRef.current = null;
  }, []);

  const handleRosterDragEnd = useCallback(() => {
    setDragIndex(null);
    setDropIndex(null);
    dragIndexRef.current = null;
  }, []);

  const schiera = useCallback(() => {
    if (!analysis.legal) return;
    setSaveError(null);
    const cardIds = deckCards.map((c) => c.id);
    const validation = validateDeck(cardIds, ALL_CARDS);
    if (!validation.valid) {
      setSaveError(validation.error || 'Mazzo non valido');
      return;
    }
    const name = deckName.trim() || 'Esercito personalizzato';
    const primaryArmy =
      Object.entries(armyCountsInDeck).sort((a, b) => b[1] - a[1])[0]?.[0] ||
      primaryFac.name;
    const deckData = {
      name,
      description: '',
      army: primaryArmy,
      cards: deckCards.map((c) => c.id),
      ...(coverCardId != null && cardIds.includes(coverCardId) ? { coverCardId } : {}),
    };
    const deckId = existingDeckId || generateDeckId();
    if (!saveCustomDeck(deckId, deckData)) {
      setSaveError('Impossibile salvare in locale (memoria piena o browser in privato).');
      return;
    }
    setFlash(true);
    setTimeout(() => {
      setFlash(false);
      onClose?.();
    }, 1400);
  }, [analysis.legal, deckCards, deckName, coverCardId, armyCountsInDeck, primaryFac.name, existingDeckId, onClose]);

  const filterState = useMemo(
    () => ({ query, legaFilter, trigFilter, archetypeFilter, focusFilter, scalingFilter, effectFilter }),
    [query, legaFilter, trigFilter, archetypeFilter, focusFilter, scalingFilter, effectFilter]
  );

  const hasActiveFilters = Boolean(
    query.trim() || legaFilter || trigFilter || archetypeFilter || focusFilter || scalingFilter || effectFilter
  );

  const clearFilters = useCallback(() => {
    setQuery('');
    setLegaFilter(null);
    setTrigFilter('');
    setArchetypeFilter('');
    setFocusFilter('');
    setScalingFilter('');
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

  // Montaggio progressivo della griglia: evita lo spike FPS al primo ingresso.
  useEffect(() => {
    setCatalogVisible(CATALOG_BATCH);
  }, [selectedArmyKeys, filterState, sort]);

  useEffect(() => {
    if (isDeckLoading) return undefined;
    const total = shown.length;
    if (total <= 0) {
      onBootProgressRef.current?.(1);
      return undefined;
    }

    if (catalogVisible >= total) {
      onBootProgressRef.current?.(1);
      return undefined;
    }

    onBootProgressRef.current?.(catalogVisible / total);
    const idleId = scheduleIdleWork(() => {
      setCatalogVisible((prev) => Math.min(total, prev + CATALOG_BATCH));
    });
    return () => cancelIdleWork(idleId);
  }, [catalogVisible, shown.length, isDeckLoading]);

  useEffect(() => {
    if (isDeckLoading || bootReadySentRef.current) return undefined;
    // Prima batch montata + 2 frame di layout: sblocca il loading esterno.
    if (catalogVisible < Math.min(CATALOG_BATCH, Math.max(1, shown.length)) && shown.length > 0) {
      return undefined;
    }
    let cancelled = false;
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (cancelled || bootReadySentRef.current) return;
        bootReadySentRef.current = true;
        onBootReadyRef.current?.();
      });
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(id);
    };
  }, [isDeckLoading, catalogVisible, shown.length]);

  const visibleShown = useMemo(
    () => shown.slice(0, catalogVisible),
    [shown, catalogVisible]
  );

  const visibleShownByArmy = useMemo(() => {
    if (!shownByArmy) return null;
    let remaining = catalogVisible;
    const groups = [];
    for (const group of shownByArmy) {
      if (remaining <= 0) break;
      const cards = group.cards.slice(0, remaining);
      remaining -= cards.length;
      if (cards.length) groups.push({ ...group, cards });
    }
    return groups;
  }, [shownByArmy, catalogVisible]);

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
  const archetypeFilterBase = useMemo(
    () => applyCatalogFilters(pool, filterState, 'archetype'),
    [pool, filterState]
  );
  const focusFilterBase = useMemo(
    () => applyCatalogFilters(pool, filterState, 'focus'),
    [pool, filterState]
  );
  const scalingFilterBase = useMemo(
    () => applyCatalogFilters(pool, filterState, 'scaling'),
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
  const archetypeCounts = useMemo(() => {
    const counts = {};
    for (const card of archetypeFilterBase) {
      if (card.archetype) counts[card.archetype] = (counts[card.archetype] || 0) + 1;
      if (card.secondary) counts[card.secondary] = (counts[card.secondary] || 0) + 1;
    }
    return counts;
  }, [archetypeFilterBase]);
  const focusCounts = useMemo(
    () => countBy(focusFilterBase, (c) => c.focus),
    [focusFilterBase]
  );
  const scalingYesCount = useMemo(
    () => scalingFilterBase.filter((c) => c.scaling).length,
    [scalingFilterBase]
  );

  const allTriggers = useMemo(
    () => [...new Set(trigFilterBase.map((c) => c.trigger))].sort(),
    [trigFilterBase]
  );
  const allArchetypes = useMemo(
    () => ARCHETYPES.filter((a) => archetypeCounts[a]),
    [archetypeCounts]
  );
  const allFocus = useMemo(
    () => FOCUS_RELATIONS.filter((f) => focusCounts[f]),
    [focusCounts]
  );
  const allEffects = useMemo(() => {
    const keys = new Set(effectFilterBase.map((c) => c.effect).filter(Boolean));
    return [...keys].sort((a, b) =>
      (EFFECT_NAMES[a] || a).localeCompare(EFFECT_NAMES[b] || b, 'it')
    );
  }, [effectFilterBase]);

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

  if (isDeckLoading) {
    return (
      <div className="dbl-root dbl-loading" style={{ '--accent': accent }}>
        <p className="dbl-loading-txt"><span>Caricamento esercito…</span></p>
      </div>
    );
  }

  const leagueOver = analysis.totalLeague > MAX_LEAGUE;
  const leagueColor =
    leagueOver || (analysis.count === DECK_SIZE && analysis.totalLeague < MAX_LEAGUE)
      ? '#f8504f'
      : analysis.totalLeague === MAX_LEAGUE && analysis.count === DECK_SIZE
        ? '#4ade80'
        : analysis.totalLeague >= 25
          ? '#fbbf24'
          : accent;
  const bgPath = ARMY_GIFS[primaryFac.name];
  const bgUrl = bgPath ? resolvePublicAssetUrl(bgPath) || bgPath : null;
  const slotById = new Map(deckIds.map((id, i) => [id, i + 1]));
  const renderCatalogCard = (c) => (
    <CatalogCard
      key={c.id}
      card={c}
      slot={slotById.get(c.id) || 0}
      disabled={!canAdd(c)}
      onClick={() => toggle(c)}
      onHover={(card, el) => setDetail({ card, rect: el.getBoundingClientRect() })}
      onLeave={() => setDetail(null)}
    />
  );
  const bonusArmies = selectedArmyKeys
    .map((key) => FACTIONS.find((f) => f.key === key))
    .filter(Boolean);

  return (
    <div className="dbl-root" style={{ '--accent': accent }}>
      <div className="dbl-bg" aria-hidden="true">
        {bgUrl && <div className="dbl-bg-art" key={bgUrl} style={{ backgroundImage: `url("${bgUrl}")` }} />}
        <div className="dbl-bg-tone" />
        <div className="dbl-bg-halftone" />
        <div className="dbl-bg-stripes" />
      </div>

      <header className="dbl-head">
        <button type="button" className="dbl-back" onClick={onClose}>
          <span className="ar">←</span>
          <span>INDIETRO</span>
        </button>
        <div className="dbl-titleblock">
          <div className="dbl-eyebrow">
            <span className="dbl-eyebrow-tag">FASE II</span>
            <span>ARRUOLAMENTO · {DECK_SIZE} CARTE · {MAX_LEAGUE} LEGA</span>
          </div>
          <h1 className="dbl-title">COSTRUZIONE ESERCITO</h1>
        </div>
        <div className="dbl-head-r">
          <div className="dbl-fac-name">
            {showHeaderArmyIcon ? <ArmyIcon faction={headerArmies[0]} className="dbl-head-ic" /> : null}
            <span>{catalogLabel}</span>
          </div>
          <button
            type="button"
            className="dbl-glossary-btn"
            onClick={() => setShowGlossary(true)}
          >
            <span>GLOSSARIO</span>
          </button>
        </div>
      </header>

      <nav className="dbl-rail" aria-label="Armate nel catalogo">
        <span className="dbl-rail-h">ARMATE</span>
        <button
          type="button"
          className={`dbl-flag dbl-flag--all${allArmiesSelected ? ' on' : ''}`}
          style={{ '--c': '#f5f3eb' }}
          onClick={toggleAllArmies}
          aria-pressed={allArmiesSelected}
          title="Seleziona o deseleziona tutte le armate"
        >
          <span className="in"><span>TUTTE</span></span>
        </button>
        {FACTIONS.map((f) => {
          const on = selectedArmyKeys.includes(f.key);
          const inDeck = armyCountsInDeck[f.name] || 0;
          return (
            <button
              key={f.key}
              type="button"
              className={`dbl-flag${on ? ' on' : ''}`}
              style={{ '--c': f.accent }}
              onClick={() => toggleArmy(f.key)}
              aria-pressed={on}
              title={`${f.name}: ${on ? 'togli dal' : 'aggiungi al'} catalogo`}
            >
              <span className="in">
                <ArmyIcon faction={f} className="dbl-flag-ic" />
                <span className="nm">{f.name}</span>
                {inDeck > 0 && <span className="ct">{inDeck}</span>}
              </span>
            </button>
          );
        })}
      </nav>

      <main className="dbl-pool">
        <div className="dbl-toolbar">
          <div className="dbl-toolbar-row">
            <div className="dbl-search">
              <span className="dbl-search-ic">⌕</span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cerca nome, archetipo, focus, effetto…"
              />
            </div>
            <div className="dbl-filtgroup" role="group" aria-label="Filtro Lega">
              <label>LEGA</label>
              {[null, 2, 3, 4, 5].map((l) => (
                <button
                  key={l ?? 'all'}
                  type="button"
                  className={`dbl-lg${legaFilter === l ? ' on' : ''}`}
                  onClick={() => setLegaFilter(l)}
                  style={l ? { '--lc': LEAGUE_COLORS[l] } : undefined}
                  aria-pressed={legaFilter === l}
                >
                  <span>
                    {l ?? 'TUTTE'}
                    <span className="dbl-filt-n">{l ? legaCounts[l] || 0 : legaFilterBase.length}</span>
                  </span>
                </button>
              ))}
            </div>
            <div className="dbl-sort">
              <label>ORDINA</label>
              <div className="dbl-sel-wrap">
                <select value={sort} onChange={(e) => setSort(e.target.value)}>
                  <option value="lega">Lega</option>
                  <option value="armata">Armata</option>
                  <option value="pot">POT ↓</option>
                  <option value="dan">DAN ↓</option>
                </select>
              </div>
            </div>
          </div>
          <div className="dbl-toolbar-row">
            <div className={`dbl-sel-wrap${trigFilter ? ' on' : ''}`}>
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
            </div>
            <div className={`dbl-sel-wrap${effectFilter ? ' on' : ''}`}>
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
            </div>
            <div className={`dbl-sel-wrap${archetypeFilter ? ' on' : ''}`}>
              <select
                className="dbl-sel"
                value={archetypeFilter}
                onChange={(e) => setArchetypeFilter(e.target.value)}
                title="Filtro archetipo"
              >
                <option value="">ARCHETIPO · tutti ({archetypeFilterBase.length})</option>
                {allArchetypes.map((t) => (
                  <option key={t} value={t}>
                    {t} ({archetypeCounts[t] || 0})
                  </option>
                ))}
              </select>
            </div>
            <div className={`dbl-sel-wrap${focusFilter ? ' on' : ''}`}>
              <select
                className="dbl-sel"
                value={focusFilter}
                onChange={(e) => setFocusFilter(e.target.value)}
                title="Filtro rapporto col Focus"
              >
                <option value="">FOCUS · tutti ({focusFilterBase.length})</option>
                {allFocus.map((t) => (
                  <option key={t} value={t}>
                    {t} ({focusCounts[t] || 0})
                  </option>
                ))}
              </select>
            </div>
            <div className={`dbl-sel-wrap${scalingFilter ? ' on' : ''}`}>
              <select
                className="dbl-sel"
                value={scalingFilter}
                onChange={(e) => setScalingFilter(e.target.value)}
                title="Filtro Scalante"
              >
                <option value="">SCALANTE · tutti ({scalingFilterBase.length})</option>
                <option value="yes">Solo Scalanti ({scalingYesCount})</option>
                <option value="no">Senza Scalante ({scalingFilterBase.length - scalingYesCount})</option>
              </select>
            </div>
            <button
              type="button"
              className="dbl-clear-filt"
              onClick={clearFilters}
              disabled={!hasActiveFilters}
              title="Rimuovi tutti i filtri"
            >
              <span>AZZERA FILTRI</span>
            </button>
          </div>
        </div>

        {bonusArmies.length > 0 && (
          <div className="dbl-bonusbar">
            {bonusArmies.map((f) => {
              const on = activeBonuses.includes(f.name);
              return (
                <div key={f.key} className={`dbl-bonus${on ? ' on' : ''}`} style={{ '--c': f.accent }}>
                  <span className="dbl-bonus-h">
                    {bonusArmies.length > 1 ? f.name : `BONUS · ${f.bonusLabel}`}
                  </span>
                  <span className="dbl-bonus-v">{f.bonus}</span>
                  <span className={`dbl-bonus-state${on ? ' on' : ''}`}>{on ? 'ATTIVO' : '2+ CARTE'}</span>
                </div>
              );
            })}
          </div>
        )}

        <div className="dbl-grid">
          {selectedArmyKeys.length === 0 ? (
            <div className="dbl-empty">
              Seleziona almeno un&apos;armata dalla barra in alto
            </div>
          ) : visibleShownByArmy ? (
            visibleShownByArmy.map(({ army, faction, cards }) => (
              <section key={army} className="dbl-grid-group" style={{ '--c': faction?.accent || accent }}>
                <div className="dbl-grid-group-h">
                  <span className="in">
                    {faction ? <ArmyIcon faction={faction} className="dbl-grid-group-ic" /> : null}
                    <span>{army}</span>
                    <span className="dbl-grid-group-n">{cards.length}</span>
                  </span>
                </div>
                <div className="dbl-grid-group-inner">
                  {cards.map(renderCatalogCard)}
                </div>
              </section>
            ))
          ) : (
            visibleShown.map(renderCatalogCard)
          )}
          {selectedArmyKeys.length > 0 && shown.length === 0 && (
            <div className="dbl-empty">
              Nessuna carta con questi filtri. Attiva altre armate in alto o usa TUTTE, poi riprova.
            </div>
          )}
        </div>
        <div className="dbl-pool-foot">
          <span>
            <b>{shown.length}</b> {shown.length === 1 ? 'carta' : 'carte'} · {catalogLabel}
          </span>
          <span>
            Clicca per arruolare · tag <b className="role">gialli</b> = Ruolo
          </span>
        </div>
      </main>

      <aside className="dbl-deck">
        <div className="dbl-deck-tag">IL TUO ESERCITO</div>
        <div className="dbl-deck-name">
          <input
            value={deckName}
            onChange={(e) => setDeckName(e.target.value)}
            placeholder="Nome esercito"
            spellCheck={false}
            aria-label="Nome esercito"
          />
        </div>

        <div className="dbl-budget">
          <div className="dbl-budget-num" style={{ '--n': leagueColor }}>
            <span className="lbl">LEGA</span>
            <span className="val"><b>{analysis.totalLeague}</b><i>/{MAX_LEAGUE}</i></span>
          </div>
          <div className="dbl-budget-num dbl-budget-num--count" style={{ '--n': analysis.count === DECK_SIZE ? '#4ade80' : '#f5f3eb' }}>
            <span className="lbl">CARTE</span>
            <span className="val"><b>{analysis.count}</b><i>/{DECK_SIZE}</i></span>
          </div>
        </div>
        <div
          className="dbl-ticks"
          style={{ '--n': leagueColor }}
          role="meter"
          aria-label="Lega usata"
          aria-valuemin={0}
          aria-valuemax={MAX_LEAGUE}
          aria-valuenow={analysis.totalLeague}
        >
          {Array.from({ length: MAX_LEAGUE }, (_, i) => (
            <span key={i} className={i < analysis.totalLeague ? 'on' : ''} />
          ))}
          {leagueOver && <span className="over">+{analysis.totalLeague - MAX_LEAGUE}</span>}
        </div>

        <div className="dbl-slots">
          {deckCards.map((c, index) => (
            <DeckRow
              key={c.id}
              card={c}
              accent={accentForArmy(c.army)}
              index={index}
              isCover={coverCardId === c.id}
              onSetCover={() => setCoverCardId((prev) => (prev === c.id ? null : c.id))}
              isDragging={dragIndex === index}
              isDropTarget={dropIndex === index && dragIndex !== null && dragIndex !== index}
              onDragStart={handleRosterDragStart}
              onDragOver={handleRosterDragOver}
              onDrop={handleRosterDrop}
              onDragEnd={handleRosterDragEnd}
              onRemove={() => setDeck(deckIds.filter((i) => i !== c.id))}
            />
          ))}
          {Array.from({ length: Math.max(0, DECK_SIZE - deckCards.length) }, (_, i) => (
            <div key={`empty-${i}`} className="dbl-row dbl-row--empty" aria-hidden="true">
              <span className="dbl-row-num">{String(deckCards.length + i + 1).padStart(2, '0')}</span>
              <span className="dbl-row-nm">{i === 0 ? 'Scegli una carta dal catalogo' : '—'}</span>
            </div>
          ))}
        </div>

        {activeBonuses.length > 0 && (
          <div className="dbl-deck-bonuses">
            <div className="dbl-an-h">BONUS ATTIVI</div>
            {activeBonuses.map((army) => {
              const f = FACTIONS.find((x) => x.name === army);
              return (
                <div key={army} className="dbl-deck-bonus-row" style={{ '--c': f?.accent || accent }}>
                  <span className="dbl-deck-bonus-name">{army}</span>
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

        <div className="dbl-deck-foot">
          <button type="button" className="dbl-act ghost" onClick={clear} disabled={analysis.count === 0}>
            <span>Svuota</span>
          </button>
          <button
            type="button"
            className={`dbl-schiera${analysis.legal ? ' ready' : ''}`}
            onClick={schiera}
            disabled={!analysis.legal}
          >
            <span className="in">
              <span>SALVA ESERCITO</span>
              <kbd>↵</kbd>
            </span>
          </button>
        </div>
        {saveError && (
          <div className="dbl-msg warn">
            <span>!</span>
            {saveError}
          </div>
        )}
      </aside>

      <DetailPopover data={detail} />

      {showGlossary && (
        <Glossary variant="menu" onClose={() => setShowGlossary(false)} zIndex={10000} />
      )}

      {flash && (
        <div className="dbl-flash" style={{ '--accent': accent }}>
          <div className="dbl-flash-blades" aria-hidden="true"><span /><span /><span /></div>
          <div className="dbl-flash-txt">
            <div className="e">ESERCITO SALVATO</div>
            <div className="n"><span>{deckName.trim() || 'Esercito personalizzato'}</span></div>
            <div className="s">
              {catalogLabel} · {analysis.count} carte · {analysis.totalLeague} Lega
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

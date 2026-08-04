// ============================================================
// DeckSelectCinematic.jsx — Schermata "Scegli l'esercito"
// ============================================================
// Drop-in component, gemello di ArmySelectCinematic — stessa struttura,
// stesso HUD, stesso linguaggio visivo cinematic. Va mostrato DOPO la
// scelta armata (Fase II - Arruolamento).
//
// Props:
//   armyName(string|null)   nome armata scelta; null = Eserciti Personalizzati
//   onSelectDeck(deckKey)   chiamato alla conferma. Per i personalizzati il
//                           deckKey ha forma "<armySlug>::<key>"
//   onBack()                torna alla scelta armata

// Si renderizza fullscreen (position: fixed). Renderizzala al livello
// del routing, NON dentro CosmicScreenLayout o altri wrapper.
// ============================================================

import React, { useState, useEffect, useMemo } from 'react';
import { ARMY_COLORS, ARMY_BONUSES, ARMY_GIFS, ARMY_ICONS } from '../../../data/armies.js';
import { ARMY_DECKS, ARMY_SETS } from '../../../data/cards.js';
import { CARD_IMAGES, AGENT_IMAGES } from '../../../data/images.js';
import { getImagePositioning } from '../../../data/imagePositioning.js';
import { DECK_SUMMARY_BG_POSITION } from '../../../data/deckSummaryCropConfig.js';
import { normalizeContainCrop, parseObjectPositionCenterY, addVerticalPanPercent } from '../../../utils/imageContainPan.js';
import { loadCustomDecks, resolveDeckCards, getDeckVisualMeta } from '../../../utils/deckManager.js';
import { formatAbilityHelper } from '../../../utils/cardUtils.js';
import { getCardLabels, getCardClassificationById, getCardDisplayLabels } from '../../../data/cardArchetypes.js';
import { DECK_LORE } from './deckLore.js';
import { DeckConfirmTransition } from './DeckConfirmTransition.jsx';
import {
  getShuffleStyle,
  setShuffleStyle,
  SHUFFLE_STYLE_OPTIONS,
  getShuffleStyleMeta,
  CLASSIC_SHUFFLE_KIND,
} from '../../../utils/shuffleStylePreference.js';
import {
  getPlaceFxPreference,
  setPlaceFxPreference,
  DROP_PLACE_FX_OPTIONS,
  CLICK_PLACE_FX_OPTIONS,
  PLACE_FX_STYLE_OPTIONS,
  getDropPlaceFxMeta,
  getClickPlaceFxMeta,
  getPlaceFxStyleMeta,
  needsTwoFaces,
  placeFxStyleClass,
  getPlaceFxDurationMs,
} from '../../../utils/placeFxPreference.js';
import { CARD_BACK_IMAGES } from '../../../utils/cardBackPicker.js';
import { CardBack } from '../../cards/CardBack.jsx';
import { CardShuffleDealStage } from '../../shuffle/CardShuffleDealStage.jsx';
import { createBattlefieldShuffleDealLayout } from '../../shuffle/cardShuffleDealLayout.js';
import { BATTLEFIELD_VIEWPORT } from '../../../config/battlefieldHandLayout.js';

const _slug = (name) => String(name)
  .toLowerCase().replace(/['’]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

// ------------------------------------------------------------
// Adapter: costruisce la lista mazzi dal data layer reale
// ------------------------------------------------------------
function resolveArmyFromSlug(armySlug) {
  return Object.keys(ARMY_DECKS).find(
    (army) =>
      army
        .toLowerCase()
        .replace(/['’]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') === armySlug
  );
}

function resolveLeaderImage(agentId) {
  if (!agentId) return null;
  return CARD_IMAGES?.[agentId] || AGENT_IMAGES?.[agentId] || null;
}

function pickLeaderAgent(deckCards, loreLeader) {
  if (!deckCards.length) return null;
  const sorted = [...deckCards].sort((a, b) => b.league - a.league || b.power - a.power);
  if (loreLeader?.name) {
    const byName = sorted.find((c) =>
      c.name.toLowerCase().includes(String(loreLeader.name).split(',')[0].toLowerCase().slice(0, 8))
    );
    if (byName) return byName;
  }
  return sorted[0];
}

function buildDeckEntry({
  deckKey,
  rawKey,
  army,
  cardIds,
  deckDef,
  lore,
  loreArmy,
  index,
  accent,
  bg,
  bonus,
  customDeck = null,
}) {
  const deckCards = resolveDeckCards(
    customDeck || { cards: cardIds },
    ARMY_SETS
  );
  const totalLeague = deckCards.reduce((s, c) => s + (c.league || 0), 0);
  const { armies, accent: resolvedAccent, isMixed } = getDeckVisualMeta(deckCards, {
    fallbackArmy: army,
    armyColors: ARMY_COLORS,
    fallbackAccent: accent,
  });
  const armyIcons = armies.map((a) => ARMY_ICONS[a] || null);
  const leaderLore = lore.leader || {};
  const leaderAgent = pickLeaderAgent(deckCards, leaderLore);
  const leaderImg = leaderLore.img || resolveLeaderImage(leaderAgent?.id);
  const iconArmy = ARMY_ICONS[army] ? army : (leaderAgent?.army || army);
  const displayName = deckDef?.name || lore.name || rawKey;

  return {
    deckKey,
    rawKey,
    army,
    armies,
    isMixed,
    accent: resolvedAccent,
    bg,
    code: lore.code || `${(_slug(army)[0] || 'X').toUpperCase()}·${['I', 'II', 'III', 'IV', 'V', 'VI'][index] || (index + 1)}`,
    name: displayName,
    description: deckDef?.description || '',
    deckCards,
    totalLeague,
    cards: deckCards.length,
    bonus: ARMY_BONUSES[army]?.description || bonus,
    leaderAgent,
    gameOption: null,
    leader: {
      name: leaderAgent?.name || leaderLore.name || army,
      img: leaderImg,
      league: leaderAgent?.league || leaderLore.league || 5,
      power: leaderAgent?.power ?? leaderLore.power ?? 0,
      damage: leaderAgent?.damage ?? leaderLore.damage ?? 0,
    },
    armyIcon: ARMY_ICONS[iconArmy] || null,
    armyIcons,
  };
}

function buildDecks(armyName) {
  const out = [];
  const armies = armyName == null ? Object.keys(ARMY_DECKS) : [armyName];

  for (const army of armies) {
    const decksObj = ARMY_DECKS[army] || {};
    const accent = (ARMY_COLORS[army] || {}).accent || '#94a3b8';
    const bonus = ARMY_BONUSES[army] || '—';
    const bg = ARMY_GIFS[army] || null;
    const loreArmy = DECK_LORE[army] || {};

    Object.keys(decksObj).forEach((key, i) => {
      const deckDef = decksObj[key] || {};
      out.push(buildDeckEntry({
        deckKey: armyName == null ? `${_slug(army)}::${key}` : key,
        rawKey: key,
        army,
        cardIds: deckDef.cards || [],
        deckDef,
        lore: loreArmy[key] || {},
        loreArmy,
        index: i,
        accent,
        bg,
        bonus,
      }));
    });
  }
  return out;
}

/** Adapter per le opzioni costruite in satze.jsx (precostruiti, custom, campagna). */
function cleanDeckDisplayName(name) {
  return String(name)
    .replace(/^Esercito [A-Z] — /i, '')
    .replace(/^Esercito campagna \(.*\)$/i, 'Esercito campagna');
}

export function buildCinematicDecksFromGameOptions(gameDeckOptions, {
  selectedArmy,
  isMixedMode = false,
  campaignDeckIds = null,
} = {}) {
  const customDecks = loadCustomDecks();

  return gameDeckOptions.map((opt, index) => {
    let army = selectedArmy;
    let rawKey = opt.key;
    let cardIds = [];
    let deckDef = { name: opt.name, description: opt.description };

    if (opt.key === 'campaign_figli' && Array.isArray(campaignDeckIds)) {
      cardIds = campaignDeckIds;
      army = selectedArmy || "Figli dell'Orizzonte";
      rawKey = 'campaign';
      return {
        ...buildDeckEntry({
          deckKey: opt.key,
          rawKey,
          army,
          cardIds,
          deckDef: { name: cleanDeckDisplayName(opt.name), description: opt.description },
          lore: { name: cleanDeckDisplayName(opt.name), code: 'CAMP' },
          loreArmy: DECK_LORE[army] || {},
          index,
          accent: opt.accent || '#a78bfa',
          bg: ARMY_GIFS[army] || null,
          bonus: opt.meta || '—',
          customDeck: { cards: campaignDeckIds, army },
        }),
        gameOption: opt,
      };
    } else if (opt.key.startsWith('custom_')) {
      const customId = opt.key.replace('custom_', '');
      const custom = customDecks[customId];
      cardIds = custom?.cards || [];
      army = custom?.army || opt.armyLabel || selectedArmy;
      rawKey = 'custom';
      deckDef = { name: custom?.name || opt.name, description: custom?.description || opt.description };
      return {
        ...buildDeckEntry({
        deckKey: opt.key,
        rawKey,
        army,
        cardIds,
        deckDef: { ...deckDef, name: cleanDeckDisplayName(opt.name) },
        lore: { name: cleanDeckDisplayName(opt.name) },
        loreArmy: DECK_LORE[army] || {},
        index,
        accent: opt.accent || (ARMY_COLORS[army] || {}).accent || '#94a3b8',
        bg: ARMY_GIFS[army] || null,
        bonus: ARMY_BONUSES[army] || opt.meta || '—',
        customDeck: custom,
      }),
        gameOption: opt,
      };
    } else if (isMixedMode && opt.key.includes('::')) {
      const [armySlug, key] = opt.key.split('::');
      army = resolveArmyFromSlug(armySlug) || opt.armyLabel || selectedArmy;
      rawKey = key;
      cardIds = ARMY_DECKS[army]?.[key]?.cards || [];
      deckDef = ARMY_DECKS[army]?.[key] || deckDef;
    } else if (!isMixedMode && selectedArmy && ARMY_DECKS[selectedArmy]?.[opt.key]) {
      army = selectedArmy;
      rawKey = opt.key;
      cardIds = ARMY_DECKS[selectedArmy][opt.key].cards;
      deckDef = ARMY_DECKS[selectedArmy][opt.key];
    } else if (opt.armyLabel && opt.armyLabel !== 'Misto' && opt.armyLabel !== 'Campagna') {
      army = opt.armyLabel;
    }

    const loreArmy = DECK_LORE[army] || {};
    const loreKey = ['custom', 'campaign'].includes(rawKey) ? null : rawKey;
    const lore = loreKey && loreArmy[loreKey] ? loreArmy[loreKey] : {};
    const accent = opt.accent || (ARMY_COLORS[army] || {}).accent || '#94a3b8';
    const cleanName = cleanDeckDisplayName(opt.name);

    return {
      ...buildDeckEntry({
      deckKey: opt.key,
      rawKey,
      army,
      cardIds,
      deckDef: { ...deckDef, name: cleanName },
      lore: loreKey && loreArmy[loreKey] ? loreArmy[loreKey] : { name: cleanName },
      loreArmy,
      index,
      accent,
      bg: ARMY_GIFS[army] || null,
      bonus: ARMY_BONUSES[army] || opt.meta || '—',
    }),
      gameOption: opt,
    };
  });
}

/** Payload per DeckPreviewCosmic (stesso schema del vecchio DeckSelectCosmic). */
export function buildDeckPreviewPayload(deck, { selectedArmy } = {}) {
  const deckCards = deck.deckCards || [];
  const armies = deck.armies?.length
    ? deck.armies
    : [...new Set(deckCards.map((c) => c.army || deck.army).filter(Boolean))].slice(0, 2);
  const isMixed = Boolean(deck.isMixed) || armies.length >= 2;
  const safeSelected =
    selectedArmy && selectedArmy !== 'Eserciti personalizzati' && selectedArmy !== 'Eserciti misti'
      ? selectedArmy
      : null;
  const safeDeckArmy =
    deck.army &&
    deck.army !== 'Eserciti personalizzati' &&
    deck.army !== 'Eserciti misti' &&
    deck.army !== 'Misto'
      ? deck.army
      : null;
  const displayArmy =
    isMixed && armies.length >= 2
      ? armies.join(' · ')
      : (safeDeckArmy || safeSelected || armies[0] || 'Misto');

  const previewCards = deckCards.slice(0, 10).map((card) => {
    const cardArmy = card.army || safeDeckArmy || armies[0] || safeSelected;
    return {
      ...card,
      army: cardArmy,
      powerDesc: formatAbilityHelper(card.ability) || card.description || '—',
      bonusDesc: ARMY_BONUSES?.[cardArmy]?.description || '—',
      tags: getCardLabels(card.id),
      displayLabels: getCardDisplayLabels(card.id),
      ...getCardClassificationById(card.id),
    };
  });
  return {
    id: deck.deckKey,
    name: deck.name,
    description: deck.description || '',
    army: displayArmy,
    accentColor: deck.accent,
    armies,
    cards: previewCards,
    _opt: deck.gameOption || null,
  };
}

// ============================================================
// COMPONENTE PRINCIPALE
// ============================================================
export default function DeckSelectCinematic({
  armyName = null,
  gameDeckOptions = null,
  selectedArmy = null,
  isMixedMode = false,
  campaignDeckIds = null,
  variant = 'duel',
  onCreateNew,
  onSelectDeck,
  onPreviewDeck,
  onBack,
}) {
  const isManager = variant === 'manager';
  const DECKS = useMemo(() => {
    if (gameDeckOptions?.length) {
      return buildCinematicDecksFromGameOptions(gameDeckOptions, {
        selectedArmy: selectedArmy ?? armyName,
        isMixedMode,
        campaignDeckIds,
      });
    }
    return buildDecks(armyName);
  }, [armyName, gameDeckOptions, selectedArmy, isMixedMode, campaignDeckIds]);
  const total = DECKS.length;
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState('intro'); // intro -> idle -> confirming
  const [pulse, setPulse] = useState(0);
  const [shuffleKind, setShuffleKind] = useState(() => getShuffleStyle());
  const [placeFx, setPlaceFx] = useState(() => getPlaceFxPreference());
  /** Anteprima attiva: shuffle | click | drop | effects */
  const [previewMode, setPreviewMode] = useState('shuffle');

  const deck = DECKS[idx] || DECKS[0];
  const accent = deck ? deck.accent : '#a78bfa';

  // Offset lineare: ordine 01…N senza wrap (l'ultimo non compare a sinistra del primo)
  const computeOff = (i) => i - idx;

  useEffect(() => {
    const t = setTimeout(() => setPhase('idle'), 1500);
    return () => clearTimeout(t);
  }, []);

  const go = (delta) => {
    if (phase !== 'idle' || total === 0) return;
    const next = Math.max(0, Math.min(total - 1, idx + delta));
    if (next === idx) return;
    setIdx(next);
    setPulse((p) => p + 1);
  };
  const goTo = (i) => {
    if (phase !== 'idle' || i === idx) return;
    setIdx(i);
    setPulse((p) => p + 1);
  };
  const confirm = () => {
    if (phase !== 'idle' || !deck) return;
    if (isManager) {
      setPhase('confirming');
      setTimeout(() => { onSelectDeck && onSelectDeck(deck.deckKey); }, 1500);
      return;
    }
    setShuffleStyle(shuffleKind);
    setPlaceFxPreference(placeFx);
    onSelectDeck && onSelectDeck(deck.deckKey);
  };

  const pickShuffleKind = (key) => {
    setShuffleKind(key);
    setShuffleStyle(key);
  };

  const patchPlaceFx = (partial) => {
    const next = setPlaceFxPreference(partial);
    setPlaceFx(next);
  };

  const shuffleIdx = SHUFFLE_STYLE_OPTIONS.findIndex((o) => o.key === shuffleKind);
  const shuffleMeta = getShuffleStyleMeta(shuffleKind);
  const cycleShuffle = (delta) => {
    const base = shuffleIdx >= 0 ? shuffleIdx : 0;
    const next =
      (base + delta + SHUFFLE_STYLE_OPTIONS.length) % SHUFFLE_STYLE_OPTIONS.length;
    pickShuffleKind(SHUFFLE_STYLE_OPTIONS[next].key);
  };

  const cycleOption = (options, currentKey, delta, onPick) => {
    const base = Math.max(0, options.findIndex((o) => String(o.key) === String(currentKey)));
    const next = (base + delta + options.length) % options.length;
    onPick(options[next].key);
  };

  const clickMeta = getClickPlaceFxMeta(placeFx.click);
  const dropMeta = getDropPlaceFxMeta(placeFx.drop);
  const styleMeta = getPlaceFxStyleMeta(placeFx.style);

  useEffect(() => {
    const onKey = (e) => {
      if (phase !== 'idle') return;
      if (e.key === 'ArrowLeft') go(-1);
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'Enter') confirm();
      if (e.key === 'Escape' && onBack) onBack();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (!deck) {
    return (
      <div className="dsk dsk-empty">
        <DeckSelectStyles/>
        <div className="dsk-empty-msg">
          {isManager ? 'Nessun esercito personalizzato' : 'Nessun esercito disponibile'}
        </div>
        {isManager && onCreateNew && (
          <button type="button" className="dsk-schiera dsk-empty-create" onClick={onCreateNew}>
            <span className="lbl">+ CREA ESERCITO</span>
          </button>
        )}
        <button className="dsk-back" onClick={onBack}>
          <span className="ar">←</span>
          <span className="lbl">{isManager ? 'CHIUDI' : 'INDIETRO'}</span>
        </button>
      </div>
    );
  }

  const armyLabel = isManager
    ? (deck.isMixed && deck.armies?.length >= 2
      ? deck.armies.map((a) => String(a).toUpperCase()).join(' · ')
      : (deck.army ? String(deck.army).toUpperCase() : 'ESERCITI PERSONALIZZATI'))
    : (armyName == null ? 'ESERCITI PERSONALIZZATI' : String(armyName).toUpperCase());
  const eyebrowText = isManager ? 'GESTIONE ESERCITI' : 'FASE II · ARRUOLAMENTO';
  const titleText = isManager ? 'I TUOI ESERCITI' : "SCEGLI L'ESERCITO";
  const actionHint = isManager ? 'per modificare' : 'per schierare';
  const backLabel = isManager ? 'CHIUDI' : (armyName == null ? 'MENU' : 'ARMATA');
  const confirmLabel = isManager ? 'MODIFICA' : 'SCHIERA';
  const compactPager = total > 12;

  return (
    <div className={`dsk phase-${phase}`} style={{ '--accent': accent }}>
      {/* BG */}
      <div className="dsk-bg-layer">
        <div className="dsk-bg" key={`bg-${deck.army}-${pulse}`} style={{ backgroundImage: deck.bg ? `url('${deck.bg}')` : 'none' }}>
          {!deck.bg && (deck.armyIcons?.length || deck.armyIcon) && (
            <div className="dsk-bg-fallback">
              <DeckArmyEmblemGroup
                armies={deck.armies}
                armyIcons={deck.armyIcons}
                fallbackIcon={deck.armyIcon}
                fallbackArmy={deck.army}
                variant="hero"
              />
            </div>
          )}
        </div>
        <div className="dsk-bg-vignette"/>
        <div className="dsk-stars"/>
        <div className="dsk-halftone"/>
        <div className="dsk-diag"/>
      </div>

      {/* Watermark */}
      <div className="dsk-watermark">ESERCITO</div>

      {/* Top HUD */}
      <header className="dsk-top">
        <button className="dsk-back" onClick={onBack}>
          <span className="ar">←</span><span className="lbl">{backLabel}</span>
        </button>
        <div className="dsk-title-block">
          <div className="dsk-eyebrow">{eyebrowText}</div>
          <h1 className="dsk-title">{titleText}</h1>
          <div className="dsk-sub">
            {armyLabel} · {total} {total === 1 ? 'ESERCITO' : 'ESERCITI'} — <kbd>↵</kbd> {actionHint}
          </div>
        </div>
        <div className="dsk-faction">
          <div className="ft-lbl">FAZIONE</div>
          <div className="ft-name">{armyLabel}</div>
        </div>
      </header>

      {/* Nav arrows */}
      {total > 1 && phase === 'idle' && idx > 0 && (
        <button className="dsk-nav left" onClick={() => go(-1)} aria-label="prev">‹</button>
      )}
      {total > 1 && phase === 'idle' && idx < total - 1 && (
        <button className="dsk-nav right" onClick={() => go(1)} aria-label="next">›</button>
      )}

      {/* Carousel — tutte le carte montate, --off guida lo scroll */}
      <div className="dsk-stage">
        <div className="dsk-track">
          {DECKS.map((d, i) => {
            const off = computeOff(i);
            const isCenter = off === 0;
            const visible = Math.abs(off) <= 4;
            return (
              <DeckTicket
                key={d.deckKey}
                deck={d} number={i + 1} total={total}
                offset={off} isCenter={isCenter} visible={visible}
                onClick={() => !isCenter && goTo(i)}
              />
            );
          })}
        </div>
      </div>

      {/* Preferenze duello: anteprima (mischia / ingresso / effetti) + controlli */}
      {!isManager && phase === 'idle' && (
        <div className="dsk-prefstack">
          <DuelAnimPreview
            mode={previewMode}
            onModeChange={setPreviewMode}
            accent={accent}
            shuffleKind={shuffleKind}
            placeFx={placeFx}
            shuffleMeta={shuffleMeta}
            clickMeta={clickMeta}
            dropMeta={dropMeta}
            styleMeta={styleMeta}
            deckCards={deck.deckCards || []}
            card={{
              name: deck.leader?.name || deck.name,
              img: deck.leader?.img || null,
              power: deck.leader?.power ?? 0,
              damage: deck.leader?.damage ?? 0,
              army: deck.army,
            }}
          />
          <aside className="dsk-prefpanel" aria-label="Preferenze animazioni duello">
            <div className="dsk-prefpanel-head">
              <span className="eye">PREFERENZE DUELLO</span>
              <span className="hint">MISCHIA · INGRESSO</span>
            </div>
            <div className="dsk-prefpanel-rows">
              <PrefRow
                label="MISCHIA"
                meta={shuffleMeta}
                rowKey={shuffleKind}
                onPrev={() => { setPreviewMode('shuffle'); cycleShuffle(-1); }}
                onNext={() => { setPreviewMode('shuffle'); cycleShuffle(1); }}
                prevLabel="Mischia precedente"
                nextLabel="Mischia successiva"
              />
              <PrefRow
                label="CLICK"
                meta={clickMeta}
                rowKey={placeFx.click}
                onPrev={() => {
                  setPreviewMode('click');
                  cycleOption(CLICK_PLACE_FX_OPTIONS, placeFx.click, -1, (key) => patchPlaceFx({ click: key }));
                }}
                onNext={() => {
                  setPreviewMode('click');
                  cycleOption(CLICK_PLACE_FX_OPTIONS, placeFx.click, 1, (key) => patchPlaceFx({ click: key }));
                }}
                prevLabel="Ingresso click precedente"
                nextLabel="Ingresso click successivo"
              />
              <PrefRow
                label="DROP"
                meta={dropMeta}
                rowKey={placeFx.drop}
                onPrev={() => {
                  setPreviewMode('drop');
                  cycleOption(DROP_PLACE_FX_OPTIONS, placeFx.drop, -1, (key) => patchPlaceFx({ drop: key }));
                }}
                onNext={() => {
                  setPreviewMode('drop');
                  cycleOption(DROP_PLACE_FX_OPTIONS, placeFx.drop, 1, (key) => patchPlaceFx({ drop: key }));
                }}
                prevLabel="Ingresso drop precedente"
                nextLabel="Ingresso drop successivo"
              />
              <PrefRow
                label="EFFETTI"
                meta={styleMeta}
                rowKey={String(placeFx.style)}
                onPrev={() => {
                  setPreviewMode('effects');
                  cycleOption(PLACE_FX_STYLE_OPTIONS, placeFx.style, -1, (key) => patchPlaceFx({ style: key }));
                }}
                onNext={() => {
                  setPreviewMode('effects');
                  cycleOption(PLACE_FX_STYLE_OPTIONS, placeFx.style, 1, (key) => patchPlaceFx({ style: key }));
                }}
                prevLabel="Stile effetti precedente"
                nextLabel="Stile effetti successivo"
              />
            </div>
          </aside>
        </div>
      )}

      {/* Bottom: pager + selezionato + SCHIERA */}
      <div className="dsk-ctabar">
        <DeckPager idx={idx} total={total} accent={accent} onPick={goTo} compact={compactPager}/>
        <div className="dsk-ctabar-info">
          <div className="dsk-ctabar-deck">
            <span className="lbl">SELEZIONATO</span>
            <span className="name">{deck.name}</span>
          </div>
        </div>
        <div className="dsk-ctabar-actions">
          {onPreviewDeck && (
            <button type="button" className="dsk-preview" onClick={() => onPreviewDeck(deck)}>
              <span className="ic">👁</span>
              <span className="lbl">ANTEPRIMA</span>
            </button>
          )}
          {isManager && onCreateNew && (
            <button type="button" className="dsk-preview" onClick={onCreateNew}>
              <span className="ic">+</span>
              <span className="lbl">NUOVO</span>
            </button>
          )}
          <button type="button" className="dsk-schiera" onClick={confirm}>
            <span className="lbl">{confirmLabel}</span>
            <span className="arr">→</span>
            <span className="key">↵</span>
          </button>
        </div>
      </div>

      {/* Intro sigillo */}
      {phase === 'intro' && (
        <IntroSigillo
          accent={accent}
          armies={deck.armies}
          armyIcons={deck.armyIcons}
          armyIcon={deck.armyIcon}
          armyName={deck.army}
          label={isManager ? 'GESTIONE' : 'ARRUOLAMENTO'}
        />
      )}

      {/* Confirm transition */}
      {phase === 'confirming' && (
        <DeckConfirmTransition
          accent={deck.accent}
          deckName={deck.name}
          showText
          visualPhase="animate"
          variant={variant}
        />
      )}

      <div className="dsk-scanlines"/>
      <DeckSelectStyles/>
    </div>
  );
}

// ============================================================
// PORTRAIT + ICONE ARMATA
// ============================================================
/** Zoom extra per riempire il ticket; origine zoom separata dal focus cover. */
const DECK_PORTRAIT_FILL_BOOST = 1.1;

/** Bias verticale sul ritaglio ticket (più alto = ritratto più in basso). */
const DECK_PORTRAIT_Y_BIAS = 22;

/** Pan verticale extra (translate verso il basso). */
const DECK_PORTRAIT_TOP_NUDGE = 5;

function resolveDeckTicketObjectPosition(agentId, imgObjectPosition) {
  const crop = DECK_SUMMARY_BG_POSITION?.[agentId];
  if (crop) {
    const y = Math.min(78, Math.round(((crop.y ?? 28) + DECK_PORTRAIT_Y_BIAS) * 10) / 10);
    return `${crop.x ?? 50}% ${y}%`;
  }
  const cardY = parseObjectPositionCenterY(imgObjectPosition);
  const y = Math.min(60, Math.max(26, 32 + (50 - cardY) * 0.16));
  return `center ${Math.round(y * 10) / 10}%`;
}

function resolveAgentPortraitStyle(agent) {
  if (!agent) return null;
  const src = CARD_IMAGES?.[agent.id] || AGENT_IMAGES?.[agent.id] || null;
  if (!src) return null;
  const pos = getImagePositioning(agent.id, agent.army);
  const objectPosition = pos.objectPosition || 'center center';
  const scale = pos.scale ?? 100;
  const {
    objectPosition: imgObjectPosition,
    containerLeft,
    containerTop,
  } = normalizeContainCrop(objectPosition, pos.containerLeft, pos.containerTop);
  const deckObjectPosition = resolveDeckTicketObjectPosition(agent.id, imgObjectPosition);
  const deckTop = addVerticalPanPercent(containerTop, DECK_PORTRAIT_TOP_NUDGE);
  const panTransform =
    containerLeft != null || deckTop != null
      ? `translate(${containerLeft ?? '0'}, ${deckTop ?? '0'})`
      : undefined;
  const scaleFactor = (scale / 100) * DECK_PORTRAIT_FILL_BOOST;
  const scaleTransform = `scale(${scaleFactor})`;
  return {
    src,
    objectPosition: deckObjectPosition,
    panTransform,
    scaleTransform,
    transformOrigin: 'center center',
  };
}

function AgentPortrait({ agent }) {
  const style = resolveAgentPortraitStyle(agent);
  if (!style) return null;
  return (
    <div
      className="dsk-tk-portrait-wrap"
      style={style.panTransform ? { transform: style.panTransform } : undefined}
    >
      <img
        className="dsk-tk-portrait"
        src={style.src}
        alt={agent.name}
        draggable={false}
        style={{
          objectPosition: style.objectPosition,
          transform: style.scaleTransform,
          transformOrigin: style.transformOrigin,
        }}
      />
    </div>
  );
}

function ArmyIconMark({ src, size = 'md', alt = '' }) {
  if (!src) return null;
  return (
    <img
      className={`dsk-army-icon dsk-army-icon--${size}`}
      src={src}
      alt={alt}
      draggable={false}
    />
  );
}

function resolveDeckArmyIcons({ armies, armyIcons, fallbackIcon, fallbackArmy }) {
  const list = (armies || []).slice(0, 2);
  if (list.length >= 2) {
    return list.map((army, i) => ({
      army,
      src: armyIcons?.[i] || ARMY_ICONS[army] || null,
    })).filter((item) => item.src);
  }
  if (list.length === 1) {
    const src = armyIcons?.[0] || ARMY_ICONS[list[0]] || fallbackIcon;
    return src ? [{ army: list[0], src }] : [];
  }
  return fallbackIcon ? [{ army: fallbackArmy, src: fallbackIcon }] : [];
}

function DeckArmyEmblemGroup({
  armies,
  armyIcons,
  fallbackIcon,
  fallbackArmy,
  variant = 'emblem',
}) {
  const items = resolveDeckArmyIcons({ armies, armyIcons, fallbackIcon, fallbackArmy });
  if (!items.length) return null;

  if (items.length === 1) {
    return (
      <div className={`dsk-army-emblem-group dsk-army-emblem-group--${variant}`}>
        {variant === 'emblem' ? (
          <div className="dsk-tk-emblem">
            <ArmyIconMark src={items[0].src} size={variant} alt={items[0].army} />
          </div>
        ) : (
          <ArmyIconMark src={items[0].src} size={variant} alt={items[0].army} />
        )}
      </div>
    );
  }

  return (
    <div className={`dsk-army-emblem-group dsk-army-emblem-group--dual dsk-army-emblem-group--${variant}`}>
      {items.map(({ army, src }) => (
        variant === 'emblem' ? (
          <div key={army} className="dsk-tk-emblem dsk-tk-emblem--dual">
            <ArmyIconMark src={src} size="emblem-dual" alt={army} />
          </div>
        ) : (
          <ArmyIconMark
            key={army}
            src={src}
            size={variant === 'hero' ? 'hero-dual' : `${variant}-dual`}
            alt={army}
          />
        )
      ))}
    </div>
  );
}

function DeckBossTags({ cardId }) {
  const labels = getCardDisplayLabels(cardId);
  if (!labels.length) return null;

  return (
    <div className="dsk-tk-tags">
      {labels.map(({ text, kind }) => (
        <span
          key={`${kind}-${text}`}
          className={`dsk-tag${kind === 'archetype' ? ' role' : ''}${kind === 'focus' ? ' focus' : ''}${kind === 'scaling' ? ' scaling' : ''}`}
        >
          {kind === 'secondary' ? `/ ${text}` : text}
        </span>
      ))}
    </div>
  );
}

// ============================================================
// TICKET CARD
// ============================================================
function DeckTicket({ deck, number, total, offset, isCenter, visible, onClick }) {
  const L = deck.leader;
  const agent = deck.leaderAgent;
  return (
    <div
      className={`dsk-tk ${isCenter ? 'is-center' : ''} ${visible ? '' : 'is-hidden'}`}
      style={{ '--off': offset, zIndex: 20 - Math.abs(offset) }}
      onClick={onClick}
    >
      <div className="dsk-tk-inner">
        {isCenter && <>
          <div className="dsk-tk-slash tl"/>
          <div className="dsk-tk-slash br"/>
          <div className="dsk-tk-stripe"/>
          <div className="dsk-tk-rail">
            <div className="dsk-tk-rail-icon">
              <DeckArmyEmblemGroup
                armies={deck.armies}
                armyIcons={deck.armyIcons}
                fallbackIcon={deck.armyIcon}
                fallbackArmy={deck.army}
                variant="rail"
              />
            </div>
            <div className="dsk-tk-rail-tick">{String(number).padStart(2, '0')}/{String(total).padStart(2, '0')}</div>
          </div>
        </>}

        <div className="dsk-tk-num">{String(number).padStart(2, '0')}</div>

        {/* Ritratto agente (solo artwork) */}
        <div className="dsk-tk-leader">
          {deck.leaderAgent ? (
            <AgentPortrait agent={deck.leaderAgent} />
          ) : L.img ? (
            <img className="dsk-tk-portrait" src={L.img} alt={L.name} draggable={false} />
          ) : (
            <div className="dsk-tk-icon-fallback">
              <DeckArmyEmblemGroup
                armies={deck.armies}
                armyIcons={deck.armyIcons}
                fallbackIcon={deck.armyIcon}
                fallbackArmy={deck.army}
                variant="leader"
              />
            </div>
          )}
          {isCenter && <SigilloRing accent={deck.accent}/>}
          {isCenter && <div className="dsk-holo"/>}
          {isCenter && <div className="dsk-holo-ring"/>}
          {isCenter && <div className="dsk-scan"/>}
          <div className="dsk-tk-leader-grad"/>
          {isCenter && (
            <DeckArmyEmblemGroup
              armies={deck.armies}
              armyIcons={deck.armyIcons}
              fallbackIcon={deck.armyIcon}
              fallbackArmy={deck.army}
              variant="emblem"
            />
          )}
        </div>

        <div className="dsk-tk-league">L{L.league}</div>

        {/* Animated decoration layer */}
        {isCenter && <>
          <div className="dsk-tk-flash f1"/>
          <div className="dsk-tk-flash f2"/>
          <div className="dsk-tk-sparks"><span/><span/><span/><span/><span/></div>
          <div className="dsk-tk-burst" key={`burst-${deck.deckKey}`}/>
          <div className="dsk-tk-scan-v"/>
        </>}

        <div className="dsk-tk-info">
          <div className="dsk-tk-name">{deck.name}</div>
          {isCenter && agent && (
            <div className="dsk-tk-boss-block">
              <div className="dsk-tk-boss-eye">INFORMAZIONI SUL BOSS</div>
              <div className="dsk-tk-leader-name">{agent.name}</div>
              <div className="dsk-tk-statrow">
                <div className="dsk-tk-stat" style={{ '--c': 'var(--accent)' }}>
                  <span className="lbl">POT</span><span className="val">{agent.power}</span>
                </div>
                <div className="dsk-tk-stat" style={{ '--c': '#dc2626' }}>
                  <span className="lbl">DAN</span><span className="val">{agent.damage}</span>
                </div>
              </div>
              <div className="dsk-tk-tags-row">
                <DeckBossTags cardId={agent.id} />
              </div>
            </div>
          )}
        </div>

        {isCenter && <div className="dsk-corners"><span/><span/><span/><span/></div>}
      </div>
    </div>
  );
}

// ============================================================
// PAGER
// ============================================================
function PrefRow({ label, meta, rowKey, onPrev, onNext, prevLabel, nextLabel }) {
  return (
    <div className="dsk-pref-row">
      <span className="dsk-pref-lbl">{label}</span>
      <div className="dsk-pref-carousel" aria-label={label}>
        <button type="button" className="dsk-shuffle-nav" onClick={onPrev} aria-label={prevLabel}>
          ‹
        </button>
        <div className="dsk-shuffle-slide" key={rowKey}>
          <span className="sub">{meta.sub}</span>
          <span className="name">{meta.title}</span>
        </div>
        <button type="button" className="dsk-shuffle-nav" onClick={onNext} aria-label={nextLabel}>
          ›
        </button>
      </div>
    </div>
  );
}

function PlaceFxMiniCard({ card, accent, flat = false }) {
  return (
    <div
      className="dsk-fxpreview-card"
      style={{
        '--acc': accent,
        boxShadow: flat
          ? `0 0 0 1px ${accent}66`
          : `0 0 0 1px ${accent}66, 0 18px 34px rgba(0,0,0,0.6)`,
      }}
    >
      {card?.img ? (
        <img src={card.img} alt="" draggable={false} />
      ) : (
        <div className="dsk-fxpreview-card-fallback" style={{ background: `radial-gradient(circle at 40% 30%, ${accent}55, #0a0a0d 70%)` }} />
      )}
      <div className="dsk-fxpreview-card-shade" />
      <div className="dsk-fxpreview-card-top" style={{ background: `${accent}cc` }}>
        <span className="pod pot">{card?.power ?? 0}</span>
        <span className="ttl">{card?.name || 'Agente'}</span>
        <span className="pod dan">{card?.damage ?? 0}</span>
      </div>
      <div className="dsk-fxpreview-card-bot" style={{ background: accent }}>
        {card?.army || 'SATZE'}
      </div>
    </div>
  );
}

const PREVIEW_TABS = [
  { key: 'shuffle', label: 'MISCHIA' },
  { key: 'click', label: 'CLICK' },
  { key: 'drop', label: 'DROP' },
  { key: 'effects', label: 'EFFETTI' },
];

function DuelAnimPreview({
  mode,
  onModeChange,
  accent,
  shuffleKind,
  placeFx,
  shuffleMeta,
  clickMeta,
  dropMeta,
  styleMeta,
  deckCards,
  card,
}) {
  const [tick, setTick] = useState(0);
  const [shuffleTick, setShuffleTick] = useState(0);
  /** Stesso layout del duello (1920×1080): in preview viene solo scalato/croppato. */
  const shuffleLayout = useMemo(() => createBattlefieldShuffleDealLayout('player'), []);
  const previewDeck = useMemo(() => {
    if (deckCards?.length >= 10) return deckCards.slice(0, 10);
    const filler = deckCards?.[0] || { id: 'preview-0', army: card?.army || 'Kethran' };
    return Array.from({ length: 10 }, (_, i) => deckCards?.[i] || { ...filler, id: filler.id ?? `preview-${i}` });
  }, [deckCards, card?.army]);
  const cardBackSrc = CARD_BACK_IMAGES[0];
  const isClassicShuffle = shuffleKind === CLASSIC_SHUFFLE_KIND;
  // Crop sulla zona mano/mazzo giocatore (stesso palco del duello).
  const shuffleFocus = useMemo(() => {
    const deck = shuffleLayout.deckPos;
    const hand = shuffleLayout.getHandSlot(2, 5);
    return {
      x: (deck.x + hand.x) / 2,
      y: (deck.y + hand.y) / 2 - 40,
      scale: 0.36,
    };
  }, [shuffleLayout]);

  // EFFETTI: usa la posa drop (impatto più leggibile per runic/thunder/sigil/shock)
  const pose = mode === 'click' ? placeFx.click : placeFx.drop;
  const twoFaces = needsTwoFaces(pose);
  const duration = getPlaceFxDurationMs(pose);
  const caption =
    mode === 'shuffle' ? shuffleMeta
      : mode === 'click' ? clickMeta
        : mode === 'drop' ? dropMeta
          : styleMeta;

  useEffect(() => {
    if (mode === 'shuffle') return undefined;
    const t = setTimeout(() => setTick((n) => n + 1), duration + 700);
    return () => clearTimeout(t);
  }, [mode, pose, placeFx.style, tick, duration]);

  const face = <PlaceFxMiniCard card={card} accent={accent} flat={twoFaces} />;

  return (
    <div className="dsk-fxpreview" style={{ '--accent': accent, '--acc': accent }} aria-label="Anteprima animazioni duello">
      <div className="dsk-fxpreview-head">
        <div className="dsk-fxpreview-tabs" role="tablist" aria-label="Tipo anteprima">
          {PREVIEW_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={mode === tab.key}
              className={mode === tab.key ? 'on' : ''}
              onClick={() => onModeChange(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {mode !== 'shuffle' && (
          <button
            type="button"
            className="dsk-fxpreview-replay"
            onClick={() => setTick((n) => n + 1)}
            aria-label="Riproduci anteprima"
            title="Riproduci"
          >
            ↻
          </button>
        )}
      </div>

      {mode === 'shuffle' ? (
        <div className="dsk-fxpreview-stage is-shuffle">
          <div
            className="dsk-fxpreview-shuffle-world"
            style={{
              width: BATTLEFIELD_VIEWPORT.width,
              height: BATTLEFIELD_VIEWPORT.height,
              left: `calc(50% - ${shuffleFocus.x * shuffleFocus.scale}px)`,
              top: `calc(50% - ${shuffleFocus.y * shuffleFocus.scale}px)`,
              transform: `scale(${shuffleFocus.scale})`,
            }}
          >
            <CardShuffleDealStage
              key={`${shuffleKind}-${shuffleTick}`}
              deck={previewDeck}
              layout={shuffleLayout}
              shuffleKind={shuffleKind}
              cardBackSrc={cardBackSrc}
              battlefield
              autoPlay
              loop={!isClassicShuffle}
              timeScale={1}
              onComplete={
                isClassicShuffle
                  ? () => { setTimeout(() => setShuffleTick((n) => n + 1), 700); }
                  : undefined
              }
            />
          </div>
        </div>
      ) : (
        <div className={`dsk-fxpreview-stage is-place${mode === 'effects' ? ' is-effects' : ''}`}>
          <div className="dsk-fxpreview-scale">
            <React.Fragment key={`fxprev-${mode}-${pose}-${placeFx.style || 'default'}-${tick}`}>
              <div className={`place-fx fx-${pose}${placeFxStyleClass(placeFx.style)}`}>
                <div className="place-shadow" />
                <div className="place-flash" />
                <div className="place-ring" />
                <div className="place-ring b" />
                <div className="place-echo" />
                <div className="place-echo e2" />
                <div className="place-echo e3" />
                <div className="place-edge l" />
                <div className="place-edge r" />
              </div>
              <div
                className={`place-card play-${pose}`}
                style={{ width: 230, height: 330, position: 'relative', zIndex: 8 }}
              >
                {twoFaces ? (
                  <div className="place-flip-inner">
                    <div className="place-flip-face">{face}</div>
                    <div className="place-flip-face back">
                      <CardBack
                        deck={previewDeck}
                        backImage={cardBackSrc}
                        fallbackArmy={card?.army}
                        borderRadius={10}
                      />
                    </div>
                  </div>
                ) : (
                  face
                )}
              </div>
            </React.Fragment>
          </div>
        </div>
      )}

      <div className="dsk-fxpreview-caption">
        <span className="sub">{caption.sub}</span>
        <span className="name">{caption.title}</span>
      </div>
      {caption.desc && <p className="dsk-fxpreview-desc">{caption.desc}</p>}
    </div>
  );
}

function DeckPager({ idx, total, accent, onPick, compact }) {
  if (compact) {
    return (
      <div className="dsk-pager compact">
        <div className="eye">ESERCITO</div>
        <div className="num"><span style={{ color: accent }}>{String(idx + 1).padStart(2, '0')}</span><span className="sep">/</span><span className="tot">{String(total).padStart(2, '0')}</span></div>
        <div className="bar"><div className="fill" style={{ width: `${((idx + 1) / total) * 100}%`, background: accent, boxShadow: `0 0 10px ${accent}` }}/></div>
      </div>
    );
  }
  return (
    <div className="dsk-pager">
      <div className="eye">ESERCITO · {String(idx + 1).padStart(2, '0')}/{String(total).padStart(2, '0')}</div>
      <div className="dots">
        {Array.from({ length: total }).map((_, i) => (
          <button key={i} className={`dot ${i === idx ? 'on' : ''}`} onClick={() => onPick(i)} aria-label={`esercito ${i + 1}`}/>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// SIGILLO RING (dietro al ritratto)
// ============================================================
function SigilloRing({ accent }) {
  return (
    <svg className="dsk-sigillo" viewBox="0 0 400 400" width="380" height="380">
      <defs>
        <linearGradient id="dsk-sg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={accent} stopOpacity="0.7"/>
          <stop offset="100%" stopColor={accent} stopOpacity="0.1"/>
        </linearGradient>
      </defs>
      <g style={{ transformOrigin: '200px 200px' }} className="dsk-sigillo-spin">
        <circle cx="200" cy="200" r="160" fill="none" stroke="url(#dsk-sg)" strokeWidth="0.5" strokeDasharray="3 8"/>
        <circle cx="200" cy="200" r="140" fill="none" stroke={accent} strokeOpacity="0.18" strokeWidth="1"/>
        <circle cx="200" cy="200" r="120" fill="none" stroke={accent} strokeOpacity="0.4" strokeWidth="0.4" strokeDasharray="1 5"/>
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i / 12) * Math.PI * 2;
          const x = 200 + Math.cos(a) * 150;
          const y = 200 + Math.sin(a) * 150;
          const ch = ['◇','▲','✦','▽','✧','◈','✕','✺','◬','◉','✚','☩'][i];
          return <text key={i} x={x} y={y} fill={accent} fillOpacity="0.55" fontFamily="monospace" fontSize="10" textAnchor="middle" dominantBaseline="middle">{ch}</text>;
        })}
      </g>
    </svg>
  );
}

// ============================================================
// INTRO + CONFIRM
// ============================================================
function IntroSigillo({ accent, armies, armyIcons, armyIcon, armyName, label = 'ARRUOLAMENTO' }) {
  return (
    <div className="dsk-intro" style={{ '--accent': accent }}>
      <svg viewBox="0 0 800 800" width="760" height="760" className="dsk-intro-svg">
        <g className="dsk-intro-spin">
          <circle cx="400" cy="400" r="320" fill="none" stroke={accent} strokeOpacity="0.6" strokeWidth="1" strokeDasharray="2 6"/>
          <circle cx="400" cy="400" r="260" fill="none" stroke={accent} strokeOpacity="0.4" strokeWidth="0.5"/>
        </g>
        <g className="dsk-intro-spin-r">
          <circle cx="400" cy="400" r="200" fill="none" stroke={accent} strokeOpacity="0.5" strokeWidth="0.5" strokeDasharray="4 4"/>
        </g>
      </svg>
      <div className="dsk-intro-icon">
        <DeckArmyEmblemGroup
          armies={armies}
          armyIcons={armyIcons}
          fallbackIcon={armyIcon}
          fallbackArmy={armyName}
          variant="intro"
        />
      </div>
      <div className="dsk-intro-text">{label}</div>
    </div>
  );
}

// ============================================================
// STILI (scoped .dsk-)
// ============================================================
function DeckSelectStyles() {
  return (
    <style>{`
      .dsk {
        position: fixed; inset: 0;
        background: #050608; color: #f5f3eb;
        font-family: 'Chakra Petch', sans-serif;
        overflow: hidden; isolation: isolate; z-index: 1000;
      }
      .dsk * { box-sizing: border-box; }
      .dsk.phase-intro { cursor: wait; }
      .dsk kbd {
        display: inline-block; padding: 1px 6px;
        border: 1px solid color-mix(in srgb, var(--accent) 60%, rgba(255,255,255,0.3));
        margin: 0 2px; color: var(--accent); font-family: 'Share Tech Mono', monospace;
      }

      /* BG */
      .dsk-bg-layer { position: absolute; inset: 0; z-index: 0; }
      .dsk-bg {
        position: absolute; inset: -3%;
        background-size: cover; background-position: center;
        filter: brightness(0.4) saturate(1.05);
        animation: dsk-bg-in 1.1s cubic-bezier(.2,.7,.2,1);
      }
      @keyframes dsk-bg-in { from { opacity: 0; transform: scale(1.12); filter: brightness(0.08) blur(8px); } }
      .dsk-bg-fallback {
        position: absolute; inset: 0; display: grid; place-items: center;
        background: radial-gradient(circle at 50% 45%, color-mix(in srgb, var(--accent) 22%, transparent) 0%, transparent 60%), #050608;
        opacity: 0.35;
      }
      .dsk-army-icon { display: block; object-fit: contain; filter: drop-shadow(0 0 12px color-mix(in srgb, var(--accent) 45%, transparent)); }
      .dsk-army-icon--hero { width: min(42vw, 420px); height: auto; opacity: 0.55; }
      .dsk-army-icon--hero-dual { width: min(20vw, 200px); height: auto; opacity: 0.55; }
      .dsk-army-icon--intro { width: 140px; height: auto; animation: dsk-intro-icon 1.5s ease; }
      .dsk-army-icon--intro-dual { width: 96px; height: auto; animation: dsk-intro-icon 1.5s ease; }
      .dsk-army-icon--rail { width: 26px; height: auto; filter: brightness(0.15) drop-shadow(0 0 8px var(--accent)); animation: dsk-icon-pulse 2.4s ease-in-out infinite; }
      .dsk-army-icon--rail-dual { width: 20px; height: auto; filter: brightness(0.15) drop-shadow(0 0 8px var(--accent)); animation: dsk-icon-pulse 2.4s ease-in-out infinite; }
      .dsk-army-icon--emblem { width: 40px; height: auto; filter: drop-shadow(0 0 10px var(--accent)); }
      .dsk-army-icon--emblem-dual { width: 36px; height: auto; filter: drop-shadow(0 0 10px var(--accent)); }
      .dsk-army-icon--leader { width: min(72%, 220px); height: auto; opacity: 0.85; }
      .dsk-army-icon--leader-dual { width: min(38%, 120px); height: auto; opacity: 0.85; }
      .dsk-army-emblem-group--dual { display: flex; align-items: center; gap: 6px; }
      .dsk-army-emblem-group--hero.dsk-army-emblem-group--dual { gap: min(4vw, 36px); }
      .dsk-army-emblem-group--intro.dsk-army-emblem-group--dual { gap: 28px; }
      .dsk-army-emblem-group--rail.dsk-army-emblem-group--dual { flex-direction: column; gap: 8px; }
      .dsk-army-emblem-group--leader.dsk-army-emblem-group--dual { gap: 16px; justify-content: center; width: 100%; }
      .dsk-army-emblem-group--emblem { position: absolute; bottom: 16px; right: 16px; z-index: 4; }
      .dsk-army-emblem-group--emblem.dsk-army-emblem-group--dual { gap: 6px; }
      @keyframes dsk-icon-pulse { 0%,100% { transform: scale(1); opacity: 0.9; } 50% { transform: scale(1.08); opacity: 1; } }
      @keyframes dsk-intro-icon { 0% { opacity: 0; transform: scale(0.4); } 50% { opacity: 1; transform: scale(1); } 100% { opacity: 0; transform: scale(1.5); filter: blur(12px); } }
      .dsk-bg-vignette {
        position: absolute; inset: 0;
        background:
          radial-gradient(ellipse at 50% 45%, transparent 22%, rgba(0,0,0,0.78) 85%),
          linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.05) 26%, rgba(0,0,0,0.1) 58%, rgba(0,0,0,0.94) 100%);
      }
      .dsk-stars {
        position: absolute; inset: 0; opacity: 0.6;
        background-image:
          radial-gradient(1px 1px at 18% 22%, #fff 0%, transparent 100%),
          radial-gradient(1px 1px at 64% 14%, rgba(255,255,255,0.6), transparent 100%),
          radial-gradient(1.5px 1.5px at 88% 38%, #fff 0%, transparent 100%),
          radial-gradient(1px 1px at 12% 78%, rgba(255,255,255,0.5), transparent 100%),
          radial-gradient(1.5px 1.5px at 38% 92%, rgba(255,255,255,0.7), transparent 100%);
        animation: dsk-stars 120s linear infinite;
      }
      @keyframes dsk-stars { to { transform: translate(-30px,-20px); } }
      .dsk-halftone {
        position: absolute; inset: 0; opacity: 0.12;
        background-image: radial-gradient(color-mix(in srgb, var(--accent) 80%, white) 1.2px, transparent 1.4px);
        background-size: 6px 6px; mix-blend-mode: overlay; pointer-events: none;
      }
      .dsk-diag {
        position: absolute; inset: 0; opacity: 0.045;
        background-image: repeating-linear-gradient(115deg, var(--accent) 0 1px, transparent 1px 22px);
        pointer-events: none;
      }
      .dsk-watermark {
        position: absolute; top: 220px; left: -40px; right: 0; text-align: center;
        font-family: 'Cinzel', serif; font-weight: 900; font-size: 360px; line-height: 0.78;
        letter-spacing: -0.04em; color: transparent;
        -webkit-text-stroke: 2px color-mix(in srgb, var(--accent) 16%, transparent);
        transform: skewX(-8deg); user-select: none; pointer-events: none;
        z-index: 1; white-space: nowrap;
      }

      /* Top */
      .dsk-top {
        position: absolute; top: 0; left: 0; right: 0; z-index: 10;
        padding: 14px 48px 0;
        display: grid; grid-template-columns: 180px 1fr 180px; align-items: start; gap: 16px;
      }
      .dsk-back {
        display: inline-flex; align-items: center; gap: 10px;
        background: rgba(5,6,8,0.65); border: 1.5px solid color-mix(in srgb, var(--accent) 55%, rgba(255,255,255,0.18));
        color: #f5f3eb; font-family: 'Share Tech Mono', monospace;
        font-size: 11px; letter-spacing: 0.3em; text-transform: uppercase;
        padding: 11px 18px; cursor: pointer; transition: all .2s;
        clip-path: polygon(10px 0, 100% 0, calc(100% - 10px) 100%, 0 100%);
      }
      .dsk-back:hover { border-color: var(--accent); color: var(--accent); }
      .dsk-back .ar { font-size: 15px; }
      .dsk-title-block { text-align: center; }
      .dsk-eyebrow { font-family: 'Share Tech Mono', monospace; font-size: 9px; letter-spacing: 0.38em; color: var(--accent); }
      .dsk-title {
        font-family: 'Cinzel', serif; font-weight: 700; font-size: 28px; letter-spacing: 0.2em;
        margin: 6px 0 4px; text-shadow: 0 4px 24px rgba(0,0,0,0.9), 0 0 24px color-mix(in srgb, var(--accent) 25%, transparent);
      }
      .dsk-sub { font-family: 'Share Tech Mono', monospace; font-size: 9px; letter-spacing: 0.14em; color: rgba(255,255,255,0.55); text-transform: uppercase; }
      .dsk-faction { text-align: right; }
      .dsk-faction .ft-lbl { font-family: 'Share Tech Mono', monospace; font-size: 8px; letter-spacing: 0.28em; color: #94a3b8; }
      .dsk-faction .ft-name { font-family: 'Cinzel', serif; font-weight: 700; font-size: 14px; letter-spacing: 0.12em; color: var(--accent); margin-top: 2px; }

      /* Nav arrows */
      .dsk-nav {
        position: absolute; top: 56%; transform: translateY(-50%); z-index: 30;
        width: 60px; height: 80px; background: rgba(5,6,8,0.6);
        backdrop-filter: blur(6px);
        border: 1.5px solid color-mix(in srgb, var(--accent) 50%, rgba(255,255,255,0.18));
        color: var(--accent); cursor: pointer;
        font-family: 'Cinzel', serif; font-weight: 900; font-size: 40px;
        display: grid; place-items: center; transition: all .25s;
      }
      .dsk-nav.left { left: 28px; clip-path: polygon(16px 0, 100% 0, 100% 100%, 0 100%); }
      .dsk-nav.right { right: 28px; clip-path: polygon(0 0, calc(100% - 16px) 0, 100% 100%, 0 100%); }
      .dsk-nav:hover { border-color: var(--accent); box-shadow: 0 0 26px color-mix(in srgb, var(--accent) 60%, transparent); background: rgba(5,6,8,0.85); }

      /* Stage / carousel */
      .dsk-stage { position: absolute; top: 132px; left: 0; right: 0; bottom: 132px; z-index: 4; }
      .dsk-track { position: relative; width: 100%; height: 100%; perspective: 1800px; }

      .dsk-tk {
        position: absolute; left: 50%; top: 50%;
        width: 300px; height: 560px;
        transform:
          translate(-50%, -50%)
          translateX(calc(var(--off) * 340px))
          translateZ(calc(abs(var(--off)) * -220px))
          rotateY(calc(var(--off) * -16deg))
          scale(calc(1 - 0.16 * abs(var(--off))));
        opacity: calc(1 - 0.35 * abs(var(--off)));
        filter: blur(calc(abs(var(--off)) * 1.6px));
        cursor: pointer; will-change: transform;
        transition: transform 0.65s cubic-bezier(0.2,0.7,0.2,1), opacity 0.55s, filter 0.55s, width 0.65s cubic-bezier(0.2,0.7,0.2,1), height 0.65s cubic-bezier(0.2,0.7,0.2,1);
      }
      .dsk-tk.is-hidden { opacity: 0; pointer-events: none; transition: transform 0.65s cubic-bezier(0.2,0.7,0.2,1), opacity 0.35s ease-out, filter 0.55s, width 0.65s, height 0.65s; }
      .dsk-tk.is-center { width: 480px; height: 720px; z-index: 25; filter: blur(0); opacity: 1; cursor: default; }

      .dsk-tk-inner {
        position: relative; width: 100%; height: 100%;
        background: #0a0a0e; border: 1.5px solid #334155; overflow: hidden;
        clip-path: polygon(0 0, calc(100% - 40px) 0, 100% 40px, 100% 100%, 40px 100%, 0 calc(100% - 40px));
        box-shadow: 0 12px 30px rgba(0,0,0,0.7);
      }
      .dsk-tk.is-center .dsk-tk-inner {
        border-color: var(--accent);
        box-shadow: 0 0 0 1.5px var(--accent), 0 30px 80px rgba(0,0,0,0.9), 0 0 80px color-mix(in srgb, var(--accent) 55%, transparent), inset 0 0 0 5px #050608, inset 0 0 0 6px var(--accent);
      }

      .dsk-tk-slash { position: absolute; z-index: 7; pointer-events: none; }
      .dsk-tk-slash.tl { top: -2px; left: -2px; width: 120px; height: 120px; background: linear-gradient(135deg, var(--accent) 0%, var(--accent) 28%, transparent 28.5%); clip-path: polygon(0 0, 100% 0, 0 100%); }
      .dsk-tk-slash.br { bottom: -2px; right: -2px; width: 120px; height: 120px; background: linear-gradient(315deg, var(--accent) 0%, var(--accent) 28%, transparent 28.5%); clip-path: polygon(100% 100%, 100% 0, 0 100%); }

      .dsk-tk-num {
        position: absolute; top: 8%; left: -40px; right: -20px; text-align: center; z-index: 1;
        font-family: 'Cinzel', serif; font-weight: 900; font-size: 540px; line-height: 0.78; letter-spacing: -0.04em;
        color: color-mix(in srgb, var(--accent) 10%, transparent);
        -webkit-text-stroke: 2.5px color-mix(in srgb, var(--accent) 55%, transparent);
        text-shadow: 0 0 60px color-mix(in srgb, var(--accent) 30%, transparent);
        user-select: none; pointer-events: none; transform: skewX(-6deg);
        animation: dsk-num-drift 9s ease-in-out infinite;
      }
      .dsk-tk:not(.is-center) .dsk-tk-num { font-size: 360px; top: 18%; color: transparent; -webkit-text-stroke: 2px color-mix(in srgb, var(--accent) 30%, transparent); animation: none; text-shadow: none; }
      @keyframes dsk-num-drift { 0%,100% { transform: skewX(-6deg) rotate(-0.7deg); opacity: 1; } 50% { transform: skewX(-6deg) rotate(0.7deg); opacity: 0.82; } }

      .dsk-tk-stripe {
        position: absolute; inset: 0; z-index: 2; opacity: 0.14;
        background-image: repeating-linear-gradient(115deg, var(--accent) 0 2px, transparent 2px 22px);
        pointer-events: none; mix-blend-mode: overlay;
      }

      .dsk-tk-rail {
        position: absolute; top: 0; bottom: 0; left: 0; width: 44px; z-index: 8;
        background: linear-gradient(180deg, var(--accent) 0%, color-mix(in srgb, var(--accent) 70%, #050608) 100%);
        display: flex; flex-direction: column; align-items: center; padding: 16px 0;
        clip-path: polygon(0 0, 100% 0, 100% 100%, 0 calc(100% - 40px));
        box-shadow: 4px 0 14px rgba(0,0,0,0.5);
      }
      .dsk-tk-rail-icon {
        display: grid; place-items: center; width: 100%; min-height: 32px;
      }
      .dsk-tk-rail-text { margin-top: 16px; writing-mode: vertical-rl; transform: rotate(180deg); font-family: 'Share Tech Mono', monospace; font-size: 11px; letter-spacing: 0.5em; font-weight: 800; color: #050608; flex: 1; }
      .dsk-tk-rail-tick { font-family: 'Share Tech Mono', monospace; font-size: 13px; letter-spacing: 0.18em; font-weight: 800; color: #050608; writing-mode: vertical-rl; transform: rotate(180deg); margin-bottom: 16px; }

      .dsk-tk-leader { position: relative; height: 52%; overflow: hidden; background: #050608; z-index: 3; }
      .dsk-tk.is-center .dsk-tk-leader { height: 58%; margin-left: 44px; }
      .dsk-tk-portrait-wrap {
        position: absolute; inset: 0; width: 100%; height: 100%;
      }
      .dsk-tk-portrait {
        position: absolute; inset: 0; width: 100%; height: 100%;
        object-fit: cover;
        filter: contrast(1.06) saturate(1.08);
      }
      .dsk-tk.is-center .dsk-tk-portrait { animation: dsk-leader-in 0.6s cubic-bezier(.2,.7,.2,1); }
      .dsk-tk-icon-fallback {
        position: absolute; inset: 0; display: grid; place-items: center;
        background: radial-gradient(circle at 50% 40%, color-mix(in srgb, var(--accent) 18%, transparent) 0%, transparent 70%);
      }
      .dsk-tk.is-center .dsk-tk-leader img { animation: dsk-leader-in 0.6s cubic-bezier(.2,.7,.2,1); }
      @keyframes dsk-leader-in { from { opacity: 0; filter: contrast(1.05) saturate(1.1) blur(8px); } }
      .dsk-tk-leader-grad { position: absolute; inset: 0; background: linear-gradient(180deg, transparent 50%, rgba(5,6,8,0.96) 100%); z-index: 3; }
      @keyframes dsk-emblem-pulse { 0%,100% { box-shadow: 0 4px 14px rgba(0,0,0,0.6), 0 0 0 0 transparent; } 50% { box-shadow: 0 4px 14px rgba(0,0,0,0.6), 0 0 22px 6px color-mix(in srgb, var(--accent) 38%, transparent); } }
      .dsk-tk-emblem {
        position: absolute; bottom: 16px; right: 16px; z-index: 4; width: 52px; height: 52px;
        background: color-mix(in srgb, var(--accent) 18%, rgba(5,6,8,0.85)); border: 1.5px solid var(--accent);
        clip-path: polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%);
        display: grid; place-items: center; box-shadow: 0 4px 14px rgba(0,0,0,0.6);
        animation: dsk-emblem-pulse 3.2s ease-in-out infinite;
        overflow: hidden;
      }
      .dsk-army-emblem-group--emblem .dsk-tk-emblem { position: relative; bottom: auto; right: auto; }
      .dsk-tk-emblem--dual { width: 44px; height: 44px; animation-delay: 0.4s; }
      .dsk-tk-leadername {
        position: absolute; left: 14px; bottom: 16px; z-index: 4; padding: 6px 12px;
        background: rgba(5,6,8,0.85); border-left: 3px solid var(--accent);
        display: flex; flex-direction: column; max-width: 60%;
      }
      .dsk-tk-leadername .eye { font-family: 'Share Tech Mono', monospace; font-size: 9px; letter-spacing: 0.3em; color: var(--accent); font-weight: 700; }
      .dsk-tk-leadername .nm { font-family: 'Cinzel', serif; font-weight: 700; font-size: 13px; letter-spacing: 0.1em; color: #f5f3eb; text-transform: uppercase; line-height: 1.1; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

      .dsk-tk-tape {
        position: absolute; top: 14px; left: 54px; z-index: 8; padding: 6px 14px;
        background: #f5f3eb; color: #050608; font-family: 'Share Tech Mono', monospace;
        font-size: 11px; letter-spacing: 0.22em; font-weight: 800;
        transform: rotate(-3deg); box-shadow: 0 4px 10px rgba(0,0,0,0.5);
      }
      .dsk-tk:not(.is-center) .dsk-tk-tape { left: -10px; }
      .dsk-tk-league {
        position: absolute; top: 14px; right: 14px; z-index: 8; width: 56px; height: 56px;
        display: grid; place-items: center; background: var(--accent); color: #050608;
        font-family: 'Cinzel', serif; font-weight: 900; font-size: 26px;
        clip-path: polygon(50% 0, 100% 30%, 90% 100%, 10% 100%, 0 30%);
        box-shadow: 0 6px 18px rgba(0,0,0,0.6), 0 0 24px color-mix(in srgb, var(--accent) 60%, transparent);
        transform: rotate(6deg);
      }
      .dsk-tk.is-center .dsk-tk-league { width: 72px; height: 72px; font-size: 32px; top: 20px; right: 20px; animation: dsk-badge-pulse 2.6s ease-in-out infinite; }
      @keyframes dsk-badge-pulse { 0%,100% { transform: rotate(6deg) scale(1); } 50% { transform: rotate(6deg) scale(1.06); } }

      .dsk-tk-arch-banner {
        position: absolute; top: 56%; left: 44px; right: -2px; z-index: 6; height: 36px;
        background: var(--accent); color: #050608; font-family: 'Share Tech Mono', monospace; font-weight: 800;
        display: flex; align-items: center; gap: 10px; padding: 0 16px 0 22px;
        clip-path: polygon(0 0, 100% 0, calc(100% - 20px) 100%, 0 100%);
        transform: skewX(-8deg) translateY(-12px); box-shadow: 4px 4px 0 rgba(0,0,0,0.6);
        animation: dsk-banner-in 0.55s cubic-bezier(.2,.7,.2,1) backwards;
      }
      @keyframes dsk-banner-in { from { opacity: 0; transform: skewX(-8deg) translateY(-12px) translateX(-40px); } }
      .dsk-tk-arch-banner > * { transform: skewX(8deg); display: inline-block; }
      .dsk-tk-arch-banner .role { font-size: 14px; letter-spacing: 0.28em; }
      .dsk-tk-arch-banner .trig { font-size: 12px; letter-spacing: 0.3em; padding: 2px 8px; background: rgba(5,6,8,0.18); border: 1px solid rgba(5,6,8,0.4); }
      .dsk-tk-arch-banner .dot { font-size: 9px; opacity: 0.55; }
      .dsk-tk-arch-banner .dot-end { margin-left: auto; }
      .dsk-tk-arch-banner .tier { font-size: 13px; letter-spacing: 0.18em; padding: 3px 10px; background: #050608; color: var(--accent); font-weight: 900; margin-right: 4px; }
      .dsk-tk-arch-banner .tier[data-tier="S"] { background: #f5f3eb; color: #050608; }
      .dsk-tk-arch-banner .tier[data-tier="B"] { color: rgba(255,255,255,0.65); }
      .dsk-tk-arch-banner .tier[data-tier="C"] { color: rgba(255,255,255,0.4); }

      /* Decoration layer */
      .dsk-tk-runes { position: absolute; inset: 0; pointer-events: none; z-index: 5; }
      .dsk-tk-runes span { position: absolute; font-family: 'Cinzel', serif; color: var(--accent); text-shadow: 0 0 14px var(--accent); opacity: 0.55; line-height: 1; }
      .dsk-tk-runes .r1 { top: 6%; left: 14%; font-size: 18px; animation: dsk-drift-a 9s ease-in-out infinite; }
      .dsk-tk-runes .r2 { top: 20%; right: 10%; font-size: 26px; animation: dsk-drift-b 11s ease-in-out infinite; }
      .dsk-tk-runes .r3 { top: 36%; left: 8%; font-size: 14px; animation: dsk-drift-c 8s ease-in-out infinite; }
      .dsk-tk-runes .r4 { top: 12%; left: 64%; font-size: 16px; animation: dsk-drift-a 10s ease-in-out infinite reverse; }
      .dsk-tk-runes .r5 { top: 48%; right: 16%; font-size: 22px; animation: dsk-drift-b 13s ease-in-out infinite reverse; }
      .dsk-tk-runes .r6 { top: 28%; right: 26%; font-size: 12px; animation: dsk-drift-c 7s ease-in-out infinite reverse; }
      @keyframes dsk-drift-a { 0%,100% { transform: translate(0,0) rotate(0deg); opacity: 0.4; } 50% { transform: translate(8px,-14px) rotate(180deg); opacity: 0.8; } }
      @keyframes dsk-drift-b { 0%,100% { transform: translate(0,0) rotate(0deg); opacity: 0.45; } 33% { transform: translate(-10px,8px) rotate(120deg); opacity: 0.7; } 66% { transform: translate(7px,-8px) rotate(240deg); opacity: 0.55; } }
      @keyframes dsk-drift-c { 0%,100% { transform: translate(0,0) scale(1); opacity: 0.35; } 50% { transform: translate(0,-12px) scale(1.18); opacity: 0.85; } }

      .dsk-tk-flash { position: absolute; left: -10%; right: -10%; height: 1px; background: linear-gradient(90deg, transparent, var(--accent), transparent); pointer-events: none; z-index: 7; opacity: 0; }
      .dsk-tk-flash.f1 { top: 22%; transform: rotate(-3deg); animation: dsk-flash 6s 1.2s ease-in-out infinite; }
      .dsk-tk-flash.f2 { top: 64%; transform: rotate(2deg); animation: dsk-flash 7s 3.6s ease-in-out infinite; }
      @keyframes dsk-flash { 0%,88%,100% { opacity: 0; } 91% { opacity: 0.95; box-shadow: 0 0 14px var(--accent); } 94% { opacity: 0.4; } }

      .dsk-tk-sparks { position: absolute; left: 44px; bottom: 0; width: 70px; height: 100%; pointer-events: none; z-index: 6; overflow: hidden; }
      .dsk-tk-sparks span { position: absolute; width: 3px; height: 3px; background: var(--accent); border-radius: 50%; box-shadow: 0 0 8px var(--accent); bottom: 0; opacity: 0; animation: dsk-spark 4.5s linear infinite; }
      .dsk-tk-sparks span:nth-child(1) { left: 10px; animation-delay: 0s; animation-duration: 5s; }
      .dsk-tk-sparks span:nth-child(2) { left: 28px; animation-delay: 1.2s; animation-duration: 4s; }
      .dsk-tk-sparks span:nth-child(3) { left: 46px; animation-delay: 2.4s; animation-duration: 5.5s; }
      .dsk-tk-sparks span:nth-child(4) { left: 18px; animation-delay: 0.8s; animation-duration: 6s; }
      .dsk-tk-sparks span:nth-child(5) { left: 58px; animation-delay: 3.4s; animation-duration: 4.5s; }
      @keyframes dsk-spark { 0% { bottom: 0; opacity: 0; transform: translateX(0); } 10% { opacity: 1; } 90% { opacity: 0.6; transform: translateX(-10px); } 100% { bottom: 100%; opacity: 0; transform: translateX(-16px); } }

      .dsk-tk-burst {
        position: absolute; left: 50%; top: 32%; width: 240px; height: 240px;
        transform: translate(-50%,-50%) scale(0.2); border: 2px solid var(--accent); border-radius: 50%;
        opacity: 0; pointer-events: none; z-index: 8; animation: dsk-burst 1s ease-out backwards;
      }
      @keyframes dsk-burst { 0% { opacity: 0.85; transform: translate(-50%,-50%) scale(0.2); border-width: 3px; } 70% { opacity: 0.3; } 100% { opacity: 0; transform: translate(-50%,-50%) scale(2.4); border-width: 0.5px; } }

      .dsk-tk-scan-v { position: absolute; top: 10%; bottom: 10%; left: 0; width: 2px; background: linear-gradient(180deg, transparent, var(--accent), transparent); box-shadow: 0 0 14px var(--accent); pointer-events: none; z-index: 4; animation: dsk-scan-v 7s ease-in-out infinite; }
      @keyframes dsk-scan-v { 0% { left: 0%; opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { left: 100%; opacity: 0; } }

      /* Holo + sigillo + scan (portrait) */
      .dsk-holo {
        position: absolute; inset: -2px; z-index: 2; pointer-events: none; opacity: 0.4; filter: blur(3px);
        background: conic-gradient(from var(--dskang, 0deg), transparent 0deg, var(--accent) 30deg, transparent 90deg, color-mix(in srgb, var(--accent) 70%, white 30%) 180deg, transparent 240deg, var(--accent) 300deg, transparent 360deg);
        animation: dsk-holo-spin 5s linear infinite;
      }
      @property --dskang { syntax: '<angle>'; initial-value: 0deg; inherits: false; }
      @keyframes dsk-holo-spin { to { --dskang: 360deg; } }
      .dsk-holo-ring { position: absolute; inset: 10px; border: 1px solid color-mix(in srgb, var(--accent) 60%, transparent); pointer-events: none; z-index: 3; animation: dsk-ring-pulse 2.4s ease-in-out infinite; }
      @keyframes dsk-ring-pulse { 0%,100% { box-shadow: inset 0 0 0 0 var(--accent), inset 0 0 30px transparent; opacity: 0.5; } 50% { box-shadow: inset 0 0 0 0 var(--accent), inset 0 0 40px color-mix(in srgb, var(--accent) 40%, transparent); opacity: 1; } }
      .dsk-sigillo { position: absolute; left: 50%; top: 50%; transform: translate(-50%,-50%); z-index: 2; opacity: 0.85; pointer-events: none; }
      .dsk-sigillo-spin { animation: dsk-sgl-spin 60s linear infinite; transform-origin: 200px 200px; }
      @keyframes dsk-sgl-spin { to { transform: rotate(360deg); } }
      .dsk-scan { position: absolute; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, transparent, var(--accent), transparent); box-shadow: 0 0 10px var(--accent); z-index: 4; pointer-events: none; animation: dsk-scan 3.5s ease-in-out infinite; }
      @keyframes dsk-scan { 0% { top: 0; opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { top: 100%; opacity: 0; } }

      /* Info */
      .dsk-tk-info { position: relative; padding: 16px 22px 18px 60px; display: flex; flex-direction: column; gap: 10px; z-index: 4; }
      .dsk-tk:not(.is-center) .dsk-tk-info { padding: 14px 22px 18px; gap: 6px; }
      .dsk-tk:not(.is-center) .dsk-tk-arch { display: none; }
      .dsk-tk-arch { font-family: 'Share Tech Mono', monospace; font-size: 10px; letter-spacing: 0.28em; color: var(--accent); font-weight: 700; }
      .dsk-tk-name {
        font-family: 'Cinzel', serif; font-weight: 900; font-size: 18px; letter-spacing: 0.04em;
        color: #f5f3eb; line-height: 0.92; text-shadow: 2px 2px 0 var(--accent), 4px 4px 0 rgba(0,0,0,0.6);
        text-transform: uppercase; text-wrap: balance;
      }
      .dsk-tk.is-center .dsk-tk-name { font-size: 38px; letter-spacing: 0.02em; text-shadow: 4px 4px 0 var(--accent), 8px 8px 0 rgba(0,0,0,0.7); transform: skewX(-4deg); animation: dsk-info-in 0.55s 0.10s cubic-bezier(.2,.7,.2,1) backwards; }
      .dsk-tk-flavor { position: relative; font-family: 'Cinzel', serif; font-style: italic; font-size: 15px; line-height: 1.42; color: #cbd5e1; padding: 4px 12px 4px 36px; border-left: 2px solid color-mix(in srgb, var(--accent) 50%, transparent); text-wrap: pretty; animation: dsk-info-in 0.55s 0.22s cubic-bezier(.2,.7,.2,1) backwards; }
      .dsk-tk-flavor .q { position: absolute; left: 6px; top: -14px; font-family: 'Cinzel', serif; font-weight: 900; font-style: normal; font-size: 64px; line-height: 1; color: color-mix(in srgb, var(--accent) 70%, transparent); text-shadow: 0 0 18px color-mix(in srgb, var(--accent) 50%, transparent); }
      .dsk-tk-flavor .t { display: block; }
      .dsk-tk-statrow { display: flex; gap: 10px; animation: dsk-info-in 0.55s 0.34s cubic-bezier(.2,.7,.2,1) backwards; }
      .dsk-tk-stat { position: relative; flex: 1; display: flex; align-items: baseline; gap: 8px; padding: 10px 12px; background: rgba(5,6,8,0.7); border: 1px solid rgba(255,255,255,0.06); border-left: 3px solid var(--c); clip-path: polygon(0 0, 100% 0, calc(100% - 8px) 100%, 0 100%); overflow: hidden; }
      .dsk-tk-stat::after { content: ''; position: absolute; left: -100%; bottom: 0; right: 100%; height: 1px; background: linear-gradient(90deg, transparent, var(--c), transparent); box-shadow: 0 0 6px var(--c); animation: dsk-stat-sweep 3.5s ease-in-out infinite; }
      .dsk-tk-stat:nth-child(2)::after { animation-delay: 1.2s; }
      .dsk-tk-stat:nth-child(3)::after { animation-delay: 2.4s; }
      @keyframes dsk-stat-sweep { 0% { left: -100%; right: 100%; opacity: 0; } 20% { opacity: 1; } 80% { opacity: 1; } 100% { left: 100%; right: -100%; opacity: 0; } }
      .dsk-tk-stat .lbl { font-family: 'Share Tech Mono', monospace; font-size: 10px; letter-spacing: 0.3em; color: rgba(255,255,255,0.55); font-weight: 700; }
      .dsk-tk-stat .val { margin-left: auto; font-family: 'Cinzel', serif; font-weight: 900; font-size: 22px; line-height: 1; color: var(--c); text-shadow: 0 0 12px color-mix(in srgb, var(--c) 60%, transparent); }
      .dsk-tk-boss-block { display: flex; flex-direction: column; gap: 10px; margin-top: 4px; }
      .dsk-tk-boss-eye {
        font-family: 'Share Tech Mono', monospace; font-size: 9px; letter-spacing: 0.28em;
        color: var(--accent); font-weight: 700; text-transform: uppercase;
      }
      .dsk-tk-leader-name {
        font-family: 'Cinzel', serif; font-weight: 700; font-size: 14px; letter-spacing: 0.08em;
        color: #f5f3eb; text-transform: uppercase; line-height: 1.1;
      }
      .dsk-tk-tags {
        display: flex; flex-wrap: wrap; gap: 6px; justify-content: flex-start;
        animation: dsk-info-in 0.55s 0.46s cubic-bezier(.2,.7,.2,1) backwards;
      }
      .dsk-tk-tags-row { margin-top: 2px; }
      .dsk-tag {
        display: inline-block; padding: 5px 11px 5px 9px;
        background: rgba(5,6,8,0.78);
        border: 1px solid rgba(255,255,255,0.12);
        border-left: 2px solid rgba(148,163,184,0.55);
        color: rgba(226,232,240,0.88);
        font-family: 'Share Tech Mono', monospace;
        font-size: 9px; font-weight: 700; letter-spacing: 0.14em;
        text-transform: uppercase; white-space: nowrap;
        clip-path: polygon(6px 0, 100% 0, calc(100% - 6px) 100%, 0 100%);
        box-shadow: inset 0 1px 0 rgba(255,255,255,0.04);
      }
      .dsk-tag.role {
        border-left-color: var(--accent);
        border-color: color-mix(in srgb, var(--accent) 42%, rgba(255,255,255,0.1));
        color: var(--accent);
        background: color-mix(in srgb, var(--accent) 14%, rgba(5,6,8,0.88));
        text-shadow: 0 0 12px color-mix(in srgb, var(--accent) 35%, transparent);
      }
      .dsk-tag.focus {
        border-left-color: #67e8f9;
        color: #67e8f9;
        background: rgba(103,232,249,0.12);
      }
      .dsk-tag.scaling {
        border-left-color: #c084fc;
        color: #c084fc;
        background: rgba(192,132,252,0.14);
      }
      @keyframes dsk-info-in { from { opacity: 0; transform: translateY(10px); } }

      .dsk-corners { position: absolute; inset: 0; pointer-events: none; z-index: 9; }
      .dsk-corners > span { position: absolute; width: 26px; height: 26px; border: 2px solid var(--accent); }
      .dsk-corners > span:nth-child(1) { top: 4px; left: 4px; border-right: 0; border-bottom: 0; }
      .dsk-corners > span:nth-child(2) { top: 4px; right: 4px; border-left: 0; border-bottom: 0; }
      .dsk-corners > span:nth-child(3) { bottom: 4px; left: 4px; border-right: 0; border-top: 0; }
      .dsk-corners > span:nth-child(4) { bottom: 4px; right: 4px; border-left: 0; border-top: 0; }

      /* CTA bar */
      .dsk-ctabar { position: absolute; bottom: 24px; left: 48px; right: 48px; height: 90px; z-index: 12; display: grid; grid-template-columns: 240px 1fr auto; gap: 14px; align-items: center; }
      .dsk-ctabar-actions { display: flex; align-items: center; gap: 10px; justify-self: end; }
      .dsk-pager { padding: 12px 16px; background: rgba(5,6,8,0.72); border: 1.5px solid color-mix(in srgb, var(--accent) 60%, transparent); border-left: 4px solid var(--accent); clip-path: polygon(0 0, 100% 0, calc(100% - 12px) 100%, 0 100%); display: flex; flex-direction: column; gap: 6px; }
      .dsk-pager .eye { font-family: 'Share Tech Mono', monospace; font-size: 10px; letter-spacing: 0.3em; color: #94a3b8; font-weight: 700; }
      .dsk-pager .dots { display: flex; gap: 4px; flex-wrap: wrap; }
      .dsk-pager .dot { width: 18px; height: 5px; background: rgba(255,255,255,0.18); border: none; cursor: pointer; transition: all .2s; padding: 0; }
      .dsk-pager .dot:hover { background: rgba(255,255,255,0.4); }
      .dsk-pager .dot.on { background: var(--accent); box-shadow: 0 0 10px var(--accent); width: 28px; }
      .dsk-pager.compact .num { font-family: 'Cinzel', serif; font-weight: 900; font-size: 28px; line-height: 1; }
      .dsk-pager.compact .num .sep { color: rgba(255,255,255,0.25); margin: 0 4px; }
      .dsk-pager.compact .num .tot { color: rgba(255,255,255,0.5); }
      .dsk-pager.compact .bar { height: 3px; background: rgba(255,255,255,0.08); overflow: hidden; }
      .dsk-pager.compact .bar .fill { height: 100%; transition: width 0.45s cubic-bezier(.2,.7,.2,1); }

      .dsk-ctabar-info {
        padding: 12px 18px 12px 22px;
        background: rgba(5,6,8,0.86);
        border: 1.5px solid var(--accent);
        border-left: 5px solid var(--accent);
        clip-path: polygon(0 0, 100% 0, calc(100% - 14px) 100%, 0 100%);
        box-shadow: 0 0 28px color-mix(in srgb, var(--accent) 30%, transparent);
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        gap: 20px;
        min-width: 0;
      }
      .dsk-ctabar-deck {
        display: flex;
        flex-direction: column;
        min-width: 0;
        flex: 1 1 auto;
      }
      .dsk-ctabar-info .lbl { font-family: 'Share Tech Mono', monospace; font-size: 11px; letter-spacing: 0.32em; color: var(--accent); font-weight: 700; }
      .dsk-ctabar-deck .name {
        font-family: 'Cinzel', serif;
        font-weight: 800;
        font-size: 20px;
        letter-spacing: 0.1em;
        color: #f5f3eb;
        text-transform: uppercase;
        margin-top: 4px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .dsk-prefstack {
        position: absolute;
        left: 28px;
        top: 64px;
        bottom: auto;
        z-index: 14;
        width: min(460px, calc(100vw - 56px));
        max-height: calc(100% - 118px);
        overflow-x: hidden;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 8px;
        animation: dsk-pref-in .4s cubic-bezier(.2,.7,.2,1) both;
        pointer-events: none;
        scrollbar-width: thin;
        scrollbar-color: color-mix(in srgb, var(--accent) 55%, transparent) transparent;
      }
      .dsk-prefstack > * { pointer-events: auto; }
      @keyframes dsk-pref-in {
        from { opacity: 0; transform: translateY(12px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .dsk-fxpreview {
        padding: 10px 12px 12px;
        background: rgba(5,6,8,0.92);
        border: 1.5px solid color-mix(in srgb, var(--accent) 55%, rgba(255,255,255,0.12));
        border-left: 5px solid var(--accent);
        box-shadow: 0 0 28px color-mix(in srgb, var(--accent) 28%, transparent), 0 18px 40px rgba(0,0,0,0.55);
        display: flex;
        flex-direction: column;
        gap: 6px;
        flex: 0 0 auto;
      }
      .dsk-fxpreview-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
      }
      .dsk-fxpreview-tabs {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
      }
      .dsk-fxpreview-tabs button {
        padding: 5px 8px;
        background: rgba(5,6,8,0.65);
        border: 1px solid color-mix(in srgb, var(--accent) 40%, rgba(255,255,255,0.12));
        color: rgba(226,232,240,0.75);
        font-family: 'Share Tech Mono', monospace;
        font-size: 9px;
        letter-spacing: 0.14em;
        font-weight: 700;
        cursor: pointer;
        transition: all .18s;
      }
      .dsk-fxpreview-tabs button.on,
      .dsk-fxpreview-tabs button:hover {
        border-color: var(--accent);
        color: #fff;
        box-shadow: 0 0 12px color-mix(in srgb, var(--accent) 40%, transparent);
      }
      .dsk-fxpreview-replay {
        width: 28px;
        height: 28px;
        padding: 0;
        display: grid;
        place-items: center;
        background: rgba(5,6,8,0.65);
        border: 1px solid color-mix(in srgb, var(--accent) 50%, rgba(255,255,255,0.15));
        color: var(--accent);
        font-size: 16px;
        line-height: 1;
        cursor: pointer;
        transition: all .18s;
        flex: 0 0 auto;
      }
      .dsk-fxpreview-replay:hover {
        border-color: var(--accent);
        color: #fff;
        box-shadow: 0 0 12px color-mix(in srgb, var(--accent) 45%, transparent);
      }
      .dsk-fxpreview-stage {
        position: relative;
        height: 360px;
        display: grid;
        place-items: center;
        overflow: hidden;
        background:
          radial-gradient(ellipse at 50% 58%, color-mix(in srgb, var(--accent) 20%, transparent) 0%, transparent 62%),
          linear-gradient(180deg, rgba(255,255,255,0.03), transparent 40%, rgba(0,0,0,0.35));
        border: 1px solid color-mix(in srgb, var(--accent) 22%, rgba(255,255,255,0.06));
      }
      .dsk-fxpreview-stage.is-shuffle {
        height: 300px;
      }
      .dsk-fxpreview-stage.is-place,
      .dsk-fxpreview-stage.is-effects {
        height: 380px;
      }
      .dsk-fxpreview-shuffle-world {
        position: absolute;
        transform-origin: 0 0;
        pointer-events: none;
      }
      .dsk-fxpreview-scale {
        width: 230px;
        height: 330px;
        position: relative;
        transform: scale(0.48);
        transform-origin: 50% 50%;
        transform-style: flat;
      }
      .dsk-fxpreview-stage.is-effects .dsk-fxpreview-scale {
        transform: scale(0.42);
        transform-origin: 50% 50%;
      }
      .dsk-fxpreview-card {
        width: 230px;
        height: 330px;
        border-radius: 10px;
        overflow: hidden;
        position: relative;
        background: #0a0a0d;
        border: 2px solid rgba(255,255,255,0.28);
      }
      .dsk-fxpreview-card img,
      .dsk-fxpreview-card-fallback {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .dsk-fxpreview-card-shade {
        position: absolute;
        inset: 0;
        background: linear-gradient(180deg, rgba(0,0,0,0.62) 0%, transparent 22%, transparent 68%, rgba(0,0,0,0.6) 100%);
      }
      .dsk-fxpreview-card-top {
        position: absolute;
        left: 0; right: 0; top: 8px;
        height: 42px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 8px;
        gap: 6px;
        box-shadow: 0 2px 6px rgba(0,0,0,0.6);
      }
      .dsk-fxpreview-card-top .pod {
        width: 28px; height: 28px; flex: none;
        border-radius: 50%;
        background: rgba(0,0,0,0.85);
        border: 1.5px solid #fde047;
        display: grid; place-items: center;
        font-family: 'Share Tech Mono', monospace;
        font-size: 12px; font-weight: 800; color: #fde047;
      }
      .dsk-fxpreview-card-top .pod.dan { border-color: #c084fc; color: #c084fc; }
      .dsk-fxpreview-card-top .ttl {
        flex: 1;
        text-align: center;
        color: #fff;
        font-weight: 800;
        font-size: 11px;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        text-shadow: 0 1px 3px #000;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .dsk-fxpreview-card-bot {
        position: absolute;
        left: 0; right: 0; bottom: 0;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        font-size: 9px;
        font-weight: 700;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        text-shadow: 0 1px 2px rgba(0,0,0,0.8);
      }
      .dsk-fxpreview-back {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 10px;
      }
      .dsk-fxpreview-caption {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 10px;
        min-height: 18px;
      }
      .dsk-fxpreview-caption .sub {
        font-family: 'Share Tech Mono', monospace;
        font-size: 9px;
        letter-spacing: 0.22em;
        color: rgba(148,163,184,0.9);
        font-weight: 700;
      }
      .dsk-fxpreview-caption .name {
        font-family: 'Cinzel', serif;
        font-weight: 800;
        font-size: 14px;
        letter-spacing: 0.08em;
        color: #f5f3eb;
        text-transform: uppercase;
      }
      .dsk-fxpreview-desc {
        margin: 0;
        font-family: 'Share Tech Mono', monospace;
        font-size: 9px;
        line-height: 1.4;
        letter-spacing: 0.04em;
        color: rgba(203,213,225,0.8);
      }
      .dsk-prefpanel {
        position: relative;
        width: 100%;
        padding: 12px 14px 14px;
        background: rgba(5,6,8,0.9);
        border: 1.5px solid color-mix(in srgb, var(--accent) 55%, rgba(255,255,255,0.12));
        border-left: 5px solid var(--accent);
        clip-path: polygon(0 0, 100% 0, calc(100% - 16px) 100%, 0 100%);
        box-shadow: 0 0 28px color-mix(in srgb, var(--accent) 28%, transparent), 0 18px 40px rgba(0,0,0,0.55);
        display: flex;
        flex-direction: column;
        gap: 10px;
        flex: 0 0 auto;
      }
      .dsk-prefpanel-head {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 12px;
        padding-bottom: 8px;
        border-bottom: 1px solid color-mix(in srgb, var(--accent) 28%, rgba(255,255,255,0.08));
      }
      .dsk-prefpanel-head .eye {
        font-family: 'Share Tech Mono', monospace;
        font-size: 11px;
        letter-spacing: 0.32em;
        color: var(--accent);
        font-weight: 700;
      }
      .dsk-prefpanel-head .hint {
        font-family: 'Share Tech Mono', monospace;
        font-size: 9px;
        letter-spacing: 0.2em;
        color: rgba(148,163,184,0.85);
        font-weight: 700;
      }
      .dsk-prefpanel-rows {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .dsk-pref-row {
        display: grid;
        grid-template-columns: 78px 1fr;
        align-items: center;
        gap: 10px;
      }
      .dsk-pref-lbl {
        font-family: 'Share Tech Mono', monospace;
        font-size: 10px;
        letter-spacing: 0.22em;
        color: rgba(226,232,240,0.72);
        font-weight: 700;
      }
      .dsk-pref-carousel {
        display: flex;
        align-items: center;
        gap: 8px;
        justify-content: flex-end;
      }
      .dsk-shuffle-nav {
        width: 28px;
        height: 28px;
        padding: 0;
        display: grid;
        place-items: center;
        background: rgba(5,6,8,0.65);
        border: 1px solid color-mix(in srgb, var(--accent) 50%, rgba(255,255,255,0.15));
        color: var(--accent);
        font-family: 'Cinzel', serif;
        font-weight: 900;
        font-size: 20px;
        line-height: 1;
        cursor: pointer;
        transition: all .18s;
        flex: 0 0 auto;
      }
      .dsk-shuffle-nav:hover {
        border-color: var(--accent);
        box-shadow: 0 0 12px color-mix(in srgb, var(--accent) 45%, transparent);
        color: #fff;
      }
      .dsk-shuffle-slide {
        width: 168px;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 1px;
        overflow: hidden;
        animation: dsk-shuffle-in .28s cubic-bezier(.2,.7,.2,1);
      }
      @keyframes dsk-shuffle-in {
        from { opacity: 0; transform: translateX(10px); }
        to { opacity: 1; transform: translateX(0); }
      }
      .dsk-shuffle-slide .sub {
        font-family: 'Share Tech Mono', monospace;
        font-size: 9px;
        letter-spacing: 0.24em;
        color: rgba(148,163,184,0.9);
        font-weight: 700;
      }
      .dsk-shuffle-slide .name {
        font-family: 'Cinzel', serif;
        font-weight: 800;
        font-size: 15px;
        letter-spacing: 0.08em;
        color: #f5f3eb;
        text-transform: uppercase;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 100%;
      }

      .dsk-preview {
        padding: 16px 22px; background: rgba(5,6,8,0.82); cursor: pointer;
        border: 1.5px solid color-mix(in srgb, var(--accent) 55%, rgba(255,255,255,0.22));
        color: #f5f3eb; font-family: 'Share Tech Mono', monospace;
        font-size: 11px; letter-spacing: 0.22em; text-transform: uppercase;
        display: inline-flex; align-items: center; gap: 10px; transition: all .2s;
        clip-path: polygon(0 0, 100% 0, calc(100% - 12px) 100%, 0 100%);
      }
      .dsk-preview:hover { border-color: var(--accent); color: var(--accent); box-shadow: 0 0 20px color-mix(in srgb, var(--accent) 35%, transparent); }
      .dsk-preview .ic { font-size: 14px; }

      .dsk-schiera { position: relative; padding: 20px 36px; background: var(--accent); color: #050608; border: none; cursor: pointer; font-family: 'Cinzel', serif; font-weight: 900; font-size: 30px; letter-spacing: 0.2em; text-transform: uppercase; clip-path: polygon(0 0, 100% 0, calc(100% - 22px) 100%, 0 100%); transform: skewX(-8deg); box-shadow: 0 0 36px color-mix(in srgb, var(--accent) 70%, transparent), 6px 6px 0 rgba(0,0,0,0.7); display: flex; align-items: center; gap: 14px; transition: all .2s; }
      .dsk-schiera:hover { transform: skewX(-8deg) translate(-2px,-2px); box-shadow: 0 0 50px color-mix(in srgb, var(--accent) 90%, transparent), 8px 8px 0 rgba(0,0,0,0.7); }
      .dsk-schiera > * { transform: skewX(8deg); display: inline-block; }
      .dsk-schiera .arr { font-size: 24px; }
      .dsk-schiera .key { font-family: 'Share Tech Mono', monospace; font-size: 13px; padding: 3px 9px; border: 1.5px solid #050608; letter-spacing: 0.1em; font-weight: 800; }

      /* Intro */
      .dsk-intro { position: absolute; inset: 0; z-index: 50; display: grid; place-items: center; background: radial-gradient(circle at 50% 50%, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.95) 80%); animation: dsk-intro-fade 1.5s ease forwards; }
      @keyframes dsk-intro-fade { 0%,75% { opacity: 1; } 100% { opacity: 0; pointer-events: none; } }
      .dsk-intro-svg { position: absolute; animation: dsk-intro-zoom 1.5s cubic-bezier(.2,.7,.2,1); }
      @keyframes dsk-intro-zoom { 0% { transform: scale(0.2); opacity: 0; } 40% { opacity: 1; } 100% { transform: scale(1.3); opacity: 0; } }
      .dsk-intro-spin { animation: dsk-spin 6s linear infinite; transform-origin: 400px 400px; }
      .dsk-intro-spin-r { animation: dsk-spin 6s linear infinite reverse; transform-origin: 400px 400px; }
      @keyframes dsk-spin { to { transform: rotate(360deg); } }
      .dsk-intro-icon { position: relative; display: grid; place-items: center; }
      .dsk-intro-text { position: absolute; bottom: 28%; font-family: 'Share Tech Mono', monospace; font-size: 14px; letter-spacing: 0.5em; color: rgba(255,255,255,0.85); animation: dsk-intro-txt 1.5s ease; }
      @keyframes dsk-intro-txt { 0%,30% { opacity: 0; } 50% { opacity: 1; } 100% { opacity: 0; } }

      /* Scanlines + empty */
      .dsk-scanlines { position: absolute; inset: 0; pointer-events: none; z-index: 90; background: repeating-linear-gradient(to bottom, transparent 0, transparent 3px, rgba(255,255,255,0.022) 3px, rgba(255,255,255,0.022) 4px); mix-blend-mode: overlay; }
      .dsk-empty { display: grid; place-items: center; gap: 20px; }
      .dsk-empty-msg { font-family: 'Cinzel', serif; font-size: 28px; letter-spacing: 0.2em; color: #94a3b8; }
      .dsk-empty-create { margin-top: 8px; }

      @media (prefers-reduced-motion: reduce) {
        .dsk *, .dsk *::after, .dsk *::before { animation-duration: 0.001s !important; animation-iteration-count: 1 !important; }
      }
    `}</style>
  );
}

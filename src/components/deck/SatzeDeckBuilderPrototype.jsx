// ============================================
// SATZE - DECK BUILDER PROTOTYPE
// Usa dati in-game (ARMY_SETS, ARMY_COLORS, ARMY_BONUSES)
// Stile allineato a MenuScreenLayout e MenuCard
// ============================================

import React, { useState, useMemo, useCallback, useEffect } from "react";
import { ARMY_SETS, ARMY_COLORS, ARMY_BONUSES } from "../../data";
import { LEAGUE_TIER_COLORS as LEAGUE_COLORS } from "../../data/leagueColors";
import { TRIGGER_NAMES } from "../../data/triggers";
import { Icon } from "../ui";
import { Glossary } from "../Glossary";
import { HandCard } from "../cards";
import { MenuCard, MenuBackButton, PALETTE } from "../menu";
import { saveCustomDeck, loadCustomDeck, generateDeckId, resolveDeckCards } from "../../utils/deckManager";
import { getCardSprite } from "../../utils";
import { getCardImageUrl } from "../../data/images";
import { getCardTags, shouldShowTagAsRole } from "../../data/cardTags";
import { TagBadge } from "../cards/CardTagBadges";
import { IS_PUBLIC_PLAYTEST_BUILD, createSingleClickHandlers } from "../../config/buildProfile.js";

// Nomi effetti per filtro (italiano)
const EFFECT_NAMES = {
  power: "+POT",
  damage: "+DAN",
  enemyPower: "-POT nem.",
  enemyDamage: "-DAN nem.",
  assaultValue: "+VA",
  enemyAssault: "-VA nem.",
  copyPower: "Copia POT",
  copyDamage: "Copia DAN",
  copyAbility: "Copia Potere",
  copyBonus: "Copia Bonus",
  blockAbility: "Blocca Potere",
  blockBonus: "Blocca Bonus",
  immune: "Immune",
  focusCoin: "+FC",
  heal: "Cura",
  selfDamage: "-PV (a te)",
  directDamage: "Danni dir.",
  powerAndDamage: "+POT e DAN",
  escalation: "Escalation",
  attrition: "Attrition",
  inversion: "Inversione",
};

// Costruisce le carte: agent completo + campi per UI (pot, dan, powerDesc, trigger, effect, tags)
const ALL_CARDS = Object.entries(ARMY_SETS).flatMap(([army, cards]) =>
  cards.map((c) => {
    const agent = { ...c, army };
    return {
      ...agent,
      pot: c.power,
      dan: c.damage,
      powerDesc: c.description?.replace(/^Potere: /, "") || "",
      trigger: c.ability?.trigger ? (TRIGGER_NAMES[c.ability.trigger] || "Sempre") : "Sempre",
      effect: c.ability?.effect || null,
      tags: getCardTags(c.id),
    };
  })
);

// Config armate da dati gioco (Icon usa type="army" con name=armyName)
const getArmyConfig = (armyName) => {
  const colors = ARMY_COLORS[armyName];
  const bonus = ARMY_BONUSES[armyName];
  return {
    color: colors?.accent || PALETTE.amber,
    bonus: bonus?.description || "-",
  };
};

// Colori ufficiali POT/DAN come sulle carte (Card.jsx, HandCard.jsx)
const POWER_COLOR = "#fde047"; // text-yellow-300
const DAMAGE_COLOR = "#c084fc"; // text-purple-400

const MAX_CARDS = 10;
const MAX_LEAGUE = 30;

// === COMPONENTI ===
const LeaguePips = ({ league }) => (
  <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
    {Array.from({ length: league }).map((_, i) => (
      <div
        key={i}
        style={{
          width: 9,
          height: 9,
          borderRadius: "50%",
          background: LEAGUE_COLORS[league] || "#fff",
          boxShadow: `0 0 4px ${LEAGUE_COLORS[league] || "#fff"}80`,
        }}
      />
    ))}
  </div>
);

const StatBadge = ({ label, value, color, compact, tiny }) => {
  const size = tiny ? "tiny" : compact ? "compact" : "normal";
  const styles = {
    tiny: { padding: "2px 6px", borderRadius: 4, minWidth: 32, labelSize: 9, valueSize: 14 },
    compact: { padding: "4px 10px", borderRadius: 6, minWidth: 44, labelSize: 11, valueSize: 20 },
    normal: { padding: "4px 12px", borderRadius: 8, minWidth: 48, labelSize: 12, valueSize: 22 },
  };
  const s = styles[size];
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        background: `${color}18`,
        borderRadius: s.borderRadius,
        padding: s.padding,
        minWidth: s.minWidth,
      }}
    >
      <span style={{ fontSize: s.labelSize, color: `${color}aa`, fontWeight: 600, letterSpacing: 1 }}>{label}</span>
      <span style={{ fontSize: s.valueSize, fontWeight: 800, color }}>{value}</span>
    </div>
  );
};

const TriggerBadge = ({ trigger, compact }) => {
  const triggerColors = {
    Sempre: "#94a3b8",
    Imboscata: "#f97316",
    Intervento: "#06b6d4",
    Gloria: "#eab308",
    Vendetta: "#ef4444",
    Rimonta: "#10b981",
    Overdrive: "#ec4899",
    "Resa dei conti": "#8b5cf6",
    Magnanimo: "#14b8a6",
    "Ultimo desiderio": "#6b7280",
    Conquista: "#22c55e",
  };
  const c = triggerColors[trigger] || "#94a3b8";
  return (
    <span
      style={{
        fontSize: compact ? 11 : 12,
        fontWeight: 700,
        color: c,
        background: `${c}20`,
        padding: compact ? "2px 8px" : "2px 8px",
        borderRadius: compact ? 4 : 6,
        letterSpacing: 0.5,
        border: `1px solid ${c}40`,
        textTransform: "uppercase",
        whiteSpace: "nowrap",
      }}
    >
      {trigger}
    </span>
  );
};

// Griglia di selezione - layout originale (LEGA | anteprima | info | POT DAN | +/-)
const CatalogCardRow = ({ card, inDeck, onToggle, disabled, bgPositions }) => {
  const [hovered, setHovered] = useState(false);
  if (!card) return null;
  const ac = getArmyConfig(card.army).color || PALETTE.amber;
  const spriteInfo = getCardSprite(card);
  const cardImageUrl = getCardImageUrl(spriteInfo.type, spriteInfo.agentId);
  const bgCfg = bgPositions?.[card.id] ?? bgPositions?.[String(card.id)];
  const bgPosStr = typeof bgCfg === "object" && bgCfg != null
    ? `${bgCfg.x ?? 50}% ${bgCfg.y ?? 25}% / ${(bgCfg.scale ?? 100) === 100 ? "cover" : `${bgCfg.scale}%`}`
    : `center ${typeof bgCfg === "string" ? bgCfg : "25%"}/cover`;
  const activate = () => {
    if (!disabled) onToggle(card);
  };
  const dragSafeClick = IS_PUBLIC_PLAYTEST_BUILD ? createSingleClickHandlers(activate) : null;
  return (
    <div
      className="cosmic-catalog-row"
      onClick={dragSafeClick ? undefined : activate}
      {...(dragSafeClick ?? {})}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "12px 14px",
        borderRadius: 0,
        cursor: disabled && !inDeck ? "not-allowed" : "pointer",
        background: cardImageUrl
          ? `linear-gradient(90deg, rgba(10,14,26,0.92) 0%, rgba(10,14,26,0.78) 55%, rgba(10,14,26,0.68) 100%), url(${cardImageUrl}) ${bgPosStr}`
          : inDeck
            ? `linear-gradient(90deg, ${ac}25 0%, ${ac}08 100%)`
            : hovered
              ? `${PALETTE.slate}30`
              : "transparent",
        border: inDeck ? `1.5px solid ${ac}` : `1px solid ${PALETTE.slate}`,
        opacity: disabled && !inDeck ? 0.35 : 1,
        transition: "all 0.15s ease",
        transform: hovered && !disabled ? "translateX(2px)" : "none",
        boxShadow: inDeck ? `0 2px 8px #000` : "none",
      }}
    >
      <div style={{ flexShrink: 0 }}>
        <StatBadge label="LEGA" value={card.league} color={LEAGUE_COLORS[card.league] || PALETTE.slate} compact />
      </div>
      <div style={{ width: 88, height: 128, flexShrink: 0, overflow: "hidden", borderRadius: 8, border: `1px solid ${PALETTE.slate}` }} onClick={(e) => e.stopPropagation()}>
        <div style={{ transform: "scale(0.611)", transformOrigin: "top left", width: 144, height: 208 }}>
          <HandCard agent={card} disabled={true} />
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: inDeck ? PALETTE.textPrimary : PALETTE.textSecondary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{card.name}</div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 6, flexWrap: "wrap" }}>
          <TriggerBadge trigger={card.trigger} compact />
          <span style={{ fontSize: 13, color: PALETTE.textSecondary, opacity: 0.9, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {card.trigger && card.powerDesc?.startsWith(card.trigger + ": ") ? card.powerDesc.substring(card.trigger.length + 2).trim() : card.powerDesc}
          </span>
        </div>
        {card.tags?.length > 0 && (
          <div style={{ display: "flex", gap: 4, alignItems: "center", marginTop: 6, flexWrap: "wrap" }}>
            {[...new Set(card.tags)].map((t) => (
              <TagBadge key={t} tag={t} compact showAsRole={shouldShowTagAsRole(t, card.tags)} />
            ))}
          </div>
        )}
      </div>
      <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
        <StatBadge label="POT" value={card.pot} color={POWER_COLOR} compact />
        <StatBadge label="DAN" value={card.dan} color={DAMAGE_COLOR} compact />
      </div>
      <div style={{ width: 30, height: 30, borderRadius: 0, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, background: inDeck ? `${PALETTE.fire}30` : "#22c55e20", color: inDeck ? PALETTE.fire : "#22c55e", border: `1.5px solid ${inDeck ? PALETTE.fire : "#22c55e"}` }}>
        {inDeck ? "−" : "+"}
      </div>
    </div>
  );
};

// Riepilogo mazzo - layout con sfondo carta, LEGA/POT/DAN in colonna
const DeckSummaryCardRow = ({ card, onToggle, armyColor, bgPositions }) => {
  const [hovered, setHovered] = useState(false);
  if (!card) return null;
  const ac = armyColor || getArmyConfig(card.army).color || PALETTE.amber;
  const spriteInfo = getCardSprite(card);
  const cardImageUrl = getCardImageUrl(spriteInfo.type, spriteInfo.agentId);
  const bgCfg = bgPositions[card.id] ?? bgPositions[String(card.id)];
  const bgPosStr = typeof bgCfg === "object" && bgCfg != null
    ? `${bgCfg.x ?? 50}% ${bgCfg.y ?? 25}% / ${(bgCfg.scale ?? 100) === 100 ? "cover" : `${bgCfg.scale}%`}`
    : `center ${typeof bgCfg === "string" ? bgCfg : "25%"}/cover`;
  const activate = () => onToggle(card);
  const dragSafeClick = IS_PUBLIC_PLAYTEST_BUILD ? createSingleClickHandlers(activate) : null;
  return (
    <div
      className="cosmic-deck-row"
      onClick={dragSafeClick ? undefined : activate}
      {...(dragSafeClick ?? {})}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "10px 14px",
        borderRadius: 0,
        cursor: "pointer",
        background: cardImageUrl
          ? `linear-gradient(90deg, rgba(10,14,26,0.92) 0%, rgba(10,14,26,0.75) 50%, rgba(10,14,26,0.6) 100%), url(${cardImageUrl}) ${bgPosStr}`
          : `linear-gradient(90deg, ${ac}25 0%, ${ac}08 100%)`,
        border: `1.5px solid ${ac}`,
        transition: "all 0.15s ease",
        transform: hovered ? "translateX(2px)" : "none",
        boxShadow: "0 2px 8px #000",
        minHeight: 128,
        height: 128,
        overflow: "hidden",
      }}
    >
      <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", gap: 2, alignItems: "flex-start" }}>
        <StatBadge label="LEGA" value={card.league} color={LEAGUE_COLORS[card.league] || PALETTE.slate} tiny />
        <StatBadge label="POT" value={card.pot} color={POWER_COLOR} tiny />
        <StatBadge label="DAN" value={card.dan} color={DAMAGE_COLOR} tiny />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: PALETTE.textPrimary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{card.name}</div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 6, flexWrap: "nowrap" }}>
          <TriggerBadge trigger={card.trigger} compact />
          <span style={{ fontSize: 13, color: PALETTE.textSecondary, opacity: 0.9, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {card.trigger && card.powerDesc?.startsWith(card.trigger + ": ") ? card.powerDesc.substring(card.trigger.length + 2).trim() : card.powerDesc}
          </span>
        </div>
        {card.tags?.length > 0 && (
          <div style={{ display: "flex", gap: 4, alignItems: "center", marginTop: 6, flexWrap: "wrap" }}>
            {[...new Set(card.tags)].map((t) => (
              <TagBadge key={t} tag={t} compact showAsRole={shouldShowTagAsRole(t, card.tags)} />
            ))}
          </div>
        )}
      </div>
      <div style={{ width: 32, height: 32, borderRadius: 0, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, background: `${PALETTE.fire}30`, color: PALETTE.fire, border: `1.5px solid ${PALETTE.fire}` }}>
        −
      </div>
    </div>
  );
};

// Overlay di caricamento (blocca interazioni)
const DeckLoadingOverlay = () => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      zIndex: 10002,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: `linear-gradient(180deg, ${PALETTE.deepVoid} 0%, ${PALETTE.nebula} 50%, ${PALETTE.deepVoid} 100%)`,
      pointerEvents: "auto",
    }}
  >
    <div
      style={{
        fontSize: "1.25rem",
        fontWeight: 700,
        letterSpacing: "0.15em",
        color: PALETTE.textPrimary,
        marginBottom: "1.5rem",
      }}
    >
      Caricamento esercito...
    </div>
    <div style={{ display: "flex", gap: 6 }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: PALETTE.amber,
            opacity: 0.5,
            animation: `loading-dot 1.2s ease-in-out ${i * 0.15}s infinite`,
          }}
        />
      ))}
    </div>
    <style>{`
      @keyframes loading-dot {
        0%, 100% { opacity: 0.3; transform: scale(0.9); }
        50% { opacity: 1; transform: scale(1.2); }
      }
    `}</style>
  </div>
);

// === MAIN ===
export function SatzeDeckBuilderPrototype({ existingDeckId, onClose }) {
  const [deck, setDeck] = useState([]);
  const [selectedArmy, setSelectedArmy] = useState(null);
  const [leagueFilter, setLeagueFilter] = useState(null);
  const [triggerFilter, setTriggerFilter] = useState(null);
  const [effectFilter, setEffectFilter] = useState(null);
  const [tagFilter, setTagFilter] = useState(null);
  const [sortBy, setSortBy] = useState("league");
  const [showAllCards, setShowAllCards] = useState(false);
  const [showGlossary, setShowGlossary] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [deckName, setDeckName] = useState("");
  const [isDeckLoading, setIsDeckLoading] = useState(!!existingDeckId);
  const [bgPositions, setBgPositions] = useState({});

  const armies = Object.keys(ARMY_SETS);

  // Carica config ritaglio (dynamic import per evitare cache HMR)
  useEffect(() => {
    import("../../data/deckSummaryCropConfig.js").then((m) => {
      setBgPositions(m.DECK_SUMMARY_BG_POSITION || {});
    });
  }, []);

  // Carica mazzo esistente in modifica
  useEffect(() => {
    if (!existingDeckId) return;
    const loaded = loadCustomDeck(existingDeckId);
    if (!loaded?.cards?.length) {
      setIsDeckLoading(false);
      return;
    }
    const rawCards = resolveDeckCards(loaded, ARMY_SETS);
    const cards = rawCards.map((c) => ({
      ...c,
      pot: c.pot ?? c.power,
      dan: c.dan ?? c.damage,
      powerDesc: c.powerDesc ?? c.description?.replace(/^Potere: /, "") ?? "",
      trigger: c.trigger ?? (c.ability?.trigger ? (TRIGGER_NAMES[c.ability.trigger] || "Sempre") : "Sempre"),
      effect: c.effect ?? c.ability?.effect ?? null,
      tags: getCardTags(c.id),
    }));
    if (cards.length) {
      setDeck(cards);
      setDeckName(loaded.name || "");
      const armiesInDeck = [...new Set(cards.map((c) => c.army))];
      setShowAllCards(armiesInDeck.length > 1);
      if (armiesInDeck.length === 1) setSelectedArmy(armiesInDeck[0]);
    }
    setIsDeckLoading(false);
  }, [existingDeckId]);

  const totalLeague = useMemo(() => deck.reduce((s, c) => s + c.league, 0), [deck]);
  const remainingLeague = MAX_LEAGUE - totalLeague;
  const deckFull = deck.length >= MAX_CARDS;

  const armyCounts = useMemo(() => {
    const counts = {};
    deck.forEach((c) => {
      counts[c.army] = (counts[c.army] || 0) + 1;
    });
    return counts;
  }, [deck]);

  const activeBonuses = useMemo(
    () => Object.entries(armyCounts).filter(([, count]) => count >= 2).map(([army]) => army),
    [armyCounts]
  );

  const avgPot = useMemo(
    () => (deck.length ? (deck.reduce((s, c) => s + (c.pot ?? c.power ?? 0), 0) / deck.length).toFixed(1) : "0"),
    [deck]
  );
  const avgDan = useMemo(
    () => (deck.length ? (deck.reduce((s, c) => s + (c.dan ?? c.damage ?? 0), 0) / deck.length).toFixed(1) : "0"),
    [deck]
  );

  const catalogCards = useMemo(() => {
    let cards = showAllCards
      ? ALL_CARDS
      : selectedArmy
      ? ALL_CARDS.filter((c) => c.army === selectedArmy)
      : [];
    if (leagueFilter) cards = cards.filter((c) => c.league === leagueFilter);
    if (triggerFilter) cards = cards.filter((c) => c.trigger === triggerFilter);
    if (effectFilter) cards = cards.filter((c) => c.effect === effectFilter);
    if (tagFilter) cards = cards.filter((c) => c.tags?.includes(tagFilter));
    cards = [...cards].sort((a, b) => {
      if (sortBy === "league") return b.league - a.league || b.pot - a.pot;
      if (sortBy === "pot") return b.pot - a.pot;
      if (sortBy === "dan") return b.dan - a.dan;
      return 0;
    });
    return cards;
  }, [selectedArmy, leagueFilter, triggerFilter, effectFilter, tagFilter, sortBy, showAllCards]);

  const uniqueTriggers = useMemo(() => {
    const triggers = new Set();
    (showAllCards ? ALL_CARDS : selectedArmy ? ALL_CARDS.filter((c) => c.army === selectedArmy) : []).forEach((c) => triggers.add(c.trigger));
    return [...triggers].sort();
  }, [selectedArmy, showAllCards]);

  const uniqueEffects = useMemo(() => {
    const effects = new Set();
    (showAllCards ? ALL_CARDS : selectedArmy ? ALL_CARDS.filter((c) => c.army === selectedArmy) : []).forEach((c) => {
      if (c.effect) effects.add(c.effect);
    });
    return [...effects].sort((a, b) => (EFFECT_NAMES[a] || a).localeCompare(EFFECT_NAMES[b] || b));
  }, [selectedArmy, showAllCards]);

  const uniqueTags = useMemo(() => {
    const tags = new Set();
    (showAllCards ? ALL_CARDS : selectedArmy ? ALL_CARDS.filter((c) => c.army === selectedArmy) : []).forEach((c) => {
      c.tags?.forEach((t) => tags.add(t));
    });
    return [...tags].sort((a, b) => a.localeCompare(b));
  }, [selectedArmy, showAllCards]);

  const toggleCard = useCallback(
    (card) => {
      setDeck((prev) => {
        const exists = prev.find((c) => c.id === card.id);
        if (exists) return prev.filter((c) => c.id !== card.id);
        if (prev.length >= MAX_CARDS) return prev;
        if (totalLeague + card.league > MAX_LEAGUE) return prev;
        return [...prev, card];
      });
    },
    [totalLeague]
  );

  const canAdd = useCallback(
    (card) => {
      if (deck.find((c) => c.id === card.id)) return true;
      if (deckFull) return false;
      if (totalLeague + card.league > MAX_LEAGUE) return false;
      return true;
    },
    [deck, deckFull, totalLeague]
  );

  const clearDeck = () => setDeck([]);
  const openCropTool = useCallback(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    url.searchParams.set("cropTool", "1");
    window.open(url.toString(), "_blank", "noopener,noreferrer");
  }, []);

  const handleConfirmDeck = useCallback(() => {
    if (deck.length !== MAX_CARDS || totalLeague > MAX_LEAGUE) return;
    if (!existingDeckId) setDeckName("");
    setShowSaveModal(true);
  }, [deck.length, totalLeague, existingDeckId]);

  const handleSaveDeck = useCallback(() => {
    const name = deckName.trim();
    if (!name) return;
    const armyCounts = {};
    deck.forEach((c) => {
      armyCounts[c.army] = (armyCounts[c.army] || 0) + 1;
    });
    const primaryArmy = Object.entries(armyCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || Object.keys(ARMY_SETS)[0];
    const deckData = {
      name,
      description: "",
      army: primaryArmy,
      cards: deck.map((c) => c.id),
    };
    const deckId = existingDeckId || generateDeckId();
    if (saveCustomDeck(deckId, deckData)) {
      setShowSaveModal(false);
      setDeck([]);
      if (onClose) onClose();
    }
  }, [deck, deckName, onClose, existingDeckId]);

  const deckByArmy = useMemo(() => {
    const grouped = {};
    deck.forEach((c) => {
      if (!grouped[c.army]) grouped[c.army] = [];
      grouped[c.army].push(c);
    });
    Object.values(grouped).forEach((arr) => arr.sort((a, b) => b.league - a.league));
    return grouped;
  }, [deck]);

  const leaguePercent = Math.min((totalLeague / MAX_LEAGUE) * 100, 100);
  const leagueOverflow = totalLeague > MAX_LEAGUE;

  return (
    <div
      className="satze-hide-scrollbar satze-deck-builder-root cosmic-builder"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: 50,
        display: "flex",
        flexDirection: "column",
        background: `linear-gradient(180deg, ${PALETTE.deepVoid} 0%, ${PALETTE.nebula} 50%, ${PALETTE.deepVoid} 100%)`,
      }}
    >
      {isDeckLoading && <DeckLoadingOverlay />}
      {/* Titolo + barra stats + pulsanti */}
      <div className="cosmic-builder-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.75rem 1.25rem", flexShrink: 0, borderBottom: `1px solid ${PALETTE.slate}`, gap: 16 }}>
        <div style={{ minWidth: 0, flex: "0 1 auto" }}>
          <h1 className="cosmic-builder-title" style={{ margin: 0, fontSize: "clamp(1.25rem, 3vw, 1.9rem)", fontWeight: 700, letterSpacing: "0.15em", color: PALETTE.textPrimary }}>
            COSTRUZIONE ESERCITO
          </h1>
          <p className="cosmic-builder-subtitle" style={{ margin: "0.35rem 0 0", fontSize: "1.05rem", color: PALETTE.textSecondary }}>10 CARTE · MAX 30 LEGA · CAP III</p>
        </div>
        <div className="cosmic-builder-header-stats" style={{ display: "flex", alignItems: "center", gap: 18, flex: "1 1 auto", minWidth: 260 }}>
          <div style={{ flex: 1, maxWidth: 300 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 12, color: PALETTE.textSecondary, letterSpacing: 1 }}>
                LEGA TOTALE
              </span>
              <span
                style={{
                  fontSize: 16,
                  fontWeight: 800,
                  color: leagueOverflow ? PALETTE.fire : totalLeague >= 25 ? PALETTE.amber : PALETTE.textSecondary,
                }}
              >
                {totalLeague} / {MAX_LEAGUE}
              </span>
            </div>
            <div
              style={{
                height: 6,
                borderRadius: 0,
                background: PALETTE.slate,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${leaguePercent}%`,
                  background: leagueOverflow
                    ? PALETTE.fire
                    : totalLeague >= 25
                    ? `linear-gradient(90deg, #22c55e, ${PALETTE.amber})`
                    : `linear-gradient(90deg, #22c55e, ${PALETTE.cyan})`,
                  transition: "width 0.3s ease",
                }}
              />
            </div>
          </div>
          <div style={{ textAlign: "center", minWidth: 78 }}>
            <div style={{ fontSize: 12, color: PALETTE.textSecondary }}>CARTE</div>
            <div
              style={{
                fontSize: 24,
                fontWeight: 900,
                color: deckFull ? "#22c55e" : PALETTE.textSecondary,
                lineHeight: 1,
              }}
            >
              {deck.length}
              <span style={{ fontSize: 14, fontWeight: 400, color: PALETTE.textSecondary }}>/{MAX_CARDS}</span>
            </div>
          </div>
        </div>
        <div className="cosmic-builder-header-actions" style={{ display: "flex", gap: 12, alignItems: "center", flexShrink: 0 }}>
          <MenuCard
            accentColor={PALETTE.amber}
            onClick={() => setShowGlossary(true)}
            className="satze-deck-btn-small"
          >
            <span style={{ fontSize: 14, fontWeight: 700 }}>📖 GLOSSARIO</span>
          </MenuCard>
          <MenuCard accentColor={PALETTE.fire} onClick={openCropTool} className="satze-deck-btn-small">
            <span style={{ fontSize: 14, fontWeight: 700 }}>✂ RITAGLIO</span>
          </MenuCard>
          {onClose && <MenuBackButton onClick={onClose}>MENU PRINCIPALE</MenuBackButton>}
        </div>
      </div>

      <div
        className="satze-hide-scrollbar cosmic-builder-main"
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
          width: "100%",
        }}
      >
          {/* Main content */}
          <div style={{ display: "flex", flex: 1, minHeight: 0, overflow: "hidden" }}>
            {/* Left: Catalog */}
            <div
              className="cosmic-builder-catalog"
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                borderRight: `1.5px solid ${PALETTE.slate}`,
                minWidth: 0,
              }}
            >
              {/* Army selector */}
              <div
                className="cosmic-builder-catalog-toolbar"
                style={{
                  padding: "16px 20px",
                  borderBottom: `1px solid ${PALETTE.slate}`,
                  background: `${PALETTE.deepVoid}99`,
                }}
              >
                <div
                  className="cosmic-builder-armies"
                  style={{
                    display: "grid",
                    gridTemplateColumns: `repeat(${armies.length + 1}, minmax(0, 1fr))`,
                    gap: 6,
                    marginBottom: 12,
                  }}
                >
                  <MenuCard
                    accentColor={PALETTE.amber}
                    onClick={() => {
                      setShowAllCards(true);
                      setSelectedArmy(null);
                    }}
                    className="satze-deck-army-btn"
                  >
                    <span style={{ fontSize: 14, fontWeight: 700 }}>TUTTE</span>
                  </MenuCard>
                  {armies.map((name) => {
                    const cfg = getArmyConfig(name);
                    const isActive = selectedArmy === name && !showAllCards;
                    const count = armyCounts[name] || 0;
                    return (
                      <MenuCard
                        key={name}
                        accentColor={cfg.color}
                        onClick={() => {
                          setSelectedArmy(name);
                          setShowAllCards(false);
                        }}
                        className="satze-deck-army-btn"
                      >
                        <Icon name={name} type="army" size={24} color={cfg.color} />
                        <span style={{ maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 14 }}>
                          {name.split(" ")[0]}
                        </span>
                        {count > 0 && (
                          <span
                            className="cosmic-army-count"
                            style={{
                              fontSize: 11,
                              fontWeight: 800,
                              background: count >= 2 ? `${cfg.color}40` : PALETTE.slate,
                              color: count >= 2 ? cfg.color : PALETTE.textSecondary,
                              padding: "1px 6px",
                              minWidth: 18,
                              textAlign: "center",
                            }}
                          >
                            {count}
                          </span>
                        )}
                      </MenuCard>
                    );
                  })}
                </div>

                <div className="cosmic-builder-filters" style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                    <span className="cosmic-filter-label" style={{ fontSize: 12, color: PALETTE.textSecondary, marginRight: 4 }}>LEGA:</span>
                    {[null, 2, 3, 4, 5].map((l) => (
                      <button
                        key={l ?? "all"}
                        className="cosmic-filter-btn"
                        onClick={() => setLeagueFilter(l)}
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 0,
                          border: `1.5px solid ${PALETTE.slate}`,
                          cursor: "pointer",
                          fontSize: 12,
                          fontWeight: 700,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: leagueFilter === l ? (l ? `${LEAGUE_COLORS[l]}30` : PALETTE.slate) : "transparent",
                          color: leagueFilter === l ? (l ? LEAGUE_COLORS[l] : PALETTE.textPrimary) : PALETTE.textSecondary,
                        }}
                      >
                        {l ?? "∗"}
                      </button>
                    ))}
                  </div>
                  <div style={{ width: 1, height: 20, background: PALETTE.slate }} />
                  <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                    <span className="cosmic-filter-label" style={{ fontSize: 12, color: PALETTE.textSecondary, marginRight: 4 }}>ORDINA:</span>
                    {[
                      ["league", "Lega"],
                      ["pot", "POT"],
                      ["dan", "DAN"],
                    ].map(([key, label]) => (
                      <button
                        key={key}
                        className="cosmic-sort-btn"
                        onClick={() => setSortBy(key)}
                        style={{
                          padding: "4px 12px",
                          borderRadius: 0,
                          border: `1px solid ${sortBy === key ? PALETTE.amber : PALETTE.slate}`,
                          cursor: "pointer",
                          fontSize: 12,
                          fontWeight: 600,
                          background: sortBy === key ? `${PALETTE.amber}20` : "transparent",
                          color: sortBy === key ? PALETTE.amber : PALETTE.textSecondary,
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 16, alignItems: "center", marginTop: 10, flexWrap: "wrap" }}>
                  <span className="cosmic-cards-found" style={{ fontSize: 13, fontWeight: 700, color: PALETTE.amber, marginRight: 8 }}>
                    {catalogCards.length} {catalogCards.length === 1 ? "carta trovata" : "carte trovate"}
                  </span>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <span className="cosmic-filter-label" style={{ fontSize: 12, color: PALETTE.textSecondary, marginRight: 2 }}>TRIGGER:</span>
                    <select
                      className="cosmic-filter-select"
                      value={triggerFilter ?? ""}
                      onChange={(e) => setTriggerFilter(e.target.value || null)}
                      style={{
                        padding: "4px 8px",
                        borderRadius: 0,
                        border: `1px solid ${PALETTE.slate}`,
                        background: PALETTE.deepVoid,
                        color: PALETTE.textPrimary,
                        fontSize: 12,
                        cursor: "pointer",
                        minWidth: 140,
                      }}
                    >
                      <option value="">Tutti</option>
                      {uniqueTriggers.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <span className="cosmic-filter-label" style={{ fontSize: 12, color: PALETTE.textSecondary, marginRight: 2 }}>EFFETTO:</span>
                    <select
                      className="cosmic-filter-select"
                      value={effectFilter ?? ""}
                      onChange={(e) => setEffectFilter(e.target.value || null)}
                      style={{
                        padding: "4px 8px",
                        borderRadius: 0,
                        border: `1px solid ${PALETTE.slate}`,
                        background: PALETTE.deepVoid,
                        color: PALETTE.textPrimary,
                        fontSize: 12,
                        cursor: "pointer",
                        minWidth: 140,
                      }}
                    >
                      <option value="">Tutti</option>
                      {uniqueEffects.map((eff) => (
                        <option key={eff} value={eff}>{EFFECT_NAMES[eff] || eff}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <span className="cosmic-filter-label" style={{ fontSize: 12, color: PALETTE.textSecondary, marginRight: 2 }}>TAG:</span>
                    <select
                      className="cosmic-filter-select"
                      value={tagFilter ?? ""}
                      onChange={(e) => setTagFilter(e.target.value || null)}
                      style={{
                        padding: "4px 8px",
                        borderRadius: 0,
                        border: `1px solid ${PALETTE.slate}`,
                        background: PALETTE.deepVoid,
                        color: PALETTE.textPrimary,
                        fontSize: 12,
                        cursor: "pointer",
                        minWidth: 140,
                      }}
                    >
                      <option value="">Tutti</option>
                      {uniqueTags.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Army bonus banner */}
              {selectedArmy && !showAllCards && (
                <div
                  style={{
                    padding: "12px 20px",
                    background: `${getArmyConfig(selectedArmy).color}12`,
                    borderBottom: `1px solid ${getArmyConfig(selectedArmy).color}40`,
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <Icon name={selectedArmy} type="army" size={32} color={getArmyConfig(selectedArmy).color} />
                  <div>
                    <span style={{ fontSize: 13, color: PALETTE.textSecondary }}>BONUS ARMATA (2+ carte): </span>
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: activeBonuses.includes(selectedArmy)
                          ? getArmyConfig(selectedArmy).color
                          : PALETTE.textSecondary,
                      }}
                    >
                      {getArmyConfig(selectedArmy).bonus}
                    </span>
                    {activeBonuses.includes(selectedArmy) && (
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 800,
                          color: "#22c55e",
                          marginLeft: 8,
                          background: "#22c55e20",
                          padding: "2px 8px",
                          borderRadius: 0,
                        }}
                      >
                        ATTIVO
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Card list - 3 carte per riga */}
              <div
                className="cosmic-builder-grid"
                style={{
                  flex: 1,
                  overflowY: "auto",
                  padding: "12px",
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: 12,
                  alignContent: "start",
                }}
              >
                {!selectedArmy && !showAllCards ? (
                  <div
                    style={{
                      gridColumn: "1 / -1",
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      color: PALETTE.textSecondary,
                      gap: 12,
                      padding: 40,
                      minHeight: 200,
                    }}
                  >
                    <span style={{ fontSize: 18, textAlign: "center", lineHeight: 1.6 }}>
                      Seleziona un'armata per sfogliare le carte,
                      <br />
                      oppure premi <b>TUTTE</b> per la collezione completa
                    </span>
                  </div>
                ) : catalogCards.length === 0 ? (
                  <div style={{ gridColumn: "1 / -1", padding: 40, textAlign: "center", color: PALETTE.textSecondary, fontSize: 16 }}>
                    Nessuna carta trovata con questi filtri
                  </div>
                ) : (
                  catalogCards.map((card) => (
                    <CatalogCardRow
                      key={card.id}
                      card={card}
                      inDeck={!!deck.find((c) => c.id === card.id)}
                      onToggle={toggleCard}
                      disabled={!canAdd(card)}
                      bgPositions={bgPositions}
                    />
                  ))
                )}
              </div>
            </div>

            {/* Right: Deck panel */}
            <div
              className="cosmic-builder-deckpanel"
              style={{
                width: 420,
                flexShrink: 0,
                display: "flex",
                flexDirection: "column",
                background: `${PALETTE.nebula}22`,
                borderLeft: `1.5px solid ${PALETTE.slate}`,
              }}
            >
              <div
                className="cosmic-builder-deckheader"
                style={{
                  padding: "16px 20px",
                  borderBottom: `1px solid ${PALETTE.slate}`,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: 2, color: PALETTE.textSecondary }}>
                  IL TUO ESERCITO
                </div>
                {deck.length > 0 && (
                  <MenuCard accentColor={PALETTE.fire} onClick={clearDeck} className="satze-deck-btn-small">
                    <span style={{ fontSize: 13, fontWeight: 600 }}>SVUOTA</span>
                  </MenuCard>
                )}
              </div>

              {deck.length > 0 && (
                <div
                  className="cosmic-builder-deckstats"
                  style={{
                    padding: "14px 20px",
                    borderBottom: `1px solid ${PALETTE.slate}`,
                    display: "flex",
                    gap: 16,
                  }}
                >
                  <div style={{ flex: 1, textAlign: "center" }}>
                    <div style={{ fontSize: 12, color: PALETTE.textSecondary, letterSpacing: 1 }}>POT MED</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: POWER_COLOR }}>{avgPot}</div>
                  </div>
                  <div style={{ width: 1, background: PALETTE.slate }} />
                  <div style={{ flex: 1, textAlign: "center" }}>
                    <div style={{ fontSize: 12, color: PALETTE.textSecondary, letterSpacing: 1 }}>DAN MED</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: DAMAGE_COLOR }}>{avgDan}</div>
                  </div>
                  <div style={{ width: 1, background: PALETTE.slate }} />
                  <div style={{ flex: 1, textAlign: "center" }}>
                    <div style={{ fontSize: 12, color: PALETTE.textSecondary, letterSpacing: 1 }}>LEGA RIM</div>
                    <div
                      style={{
                        fontSize: 22,
                        fontWeight: 800,
                        color: remainingLeague <= 4 ? PALETTE.amber : PALETTE.textSecondary,
                      }}
                    >
                      {remainingLeague}
                    </div>
                  </div>
                </div>
              )}

              {activeBonuses.length > 0 && (
                <div style={{ padding: "12px 20px", borderBottom: `1px solid ${PALETTE.slate}` }}>
                  <div style={{ fontSize: 12, color: PALETTE.textSecondary, letterSpacing: 1, marginBottom: 8 }}>
                    BONUS ATTIVI
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {activeBonuses.map((army) => {
                      const cfg = getArmyConfig(army);
                      return (
                        <div
                          key={army}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "6px 10px",
                            borderRadius: 0,
                            background: `${cfg.color}12`,
                            border: `1px solid ${cfg.color}30`,
                          }}
                        >
                          <Icon name={army} type="army" size={26} color={cfg.color} />
                          <span style={{ fontSize: 13, fontWeight: 700, color: cfg.color }}>{cfg.bonus}</span>
                          <span style={{ fontSize: 12, color: PALETTE.textSecondary, marginLeft: "auto" }}>
                            {armyCounts[army]}×
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="cosmic-builder-decklist" style={{ flex: 1, overflowY: "auto", padding: "12px" }}>
                {deck.length === 0 ? (
                  <div
                    style={{
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      color: PALETTE.slate,
                      gap: 12,
                    }}
                  >
                    <div
                      style={{
                        width: 80,
                        height: 110,
                        borderRadius: 0,
                        border: `2px dashed ${PALETTE.slate}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 32,
                        opacity: 0.5,
                      }}
                    >
                      🃏
                    </div>
                    <span style={{ fontSize: 16 }}>Seleziona carte dal catalogo</span>
                    <span style={{ fontSize: 13, color: PALETTE.textSecondary }}>10 carte • Max 30 Lega</span>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {Object.entries(deckByArmy).map(([army, cards]) => {
                      const cfg = getArmyConfig(army);
                      return (
                        <div key={army}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              padding: "8px 14px 4px",
                            }}
                          >
                            <Icon name={army} type="army" size={26} color={cfg.color} />
                            <span
                              style={{
                                fontSize: 13,
                                fontWeight: 700,
                                letterSpacing: 1,
                                color: cfg.color,
                              }}
                            >
                              {army.toUpperCase()}
                            </span>
                            <span style={{ fontSize: 12, color: PALETTE.textSecondary }}>({cards.length})</span>
                            <div
                              style={{
                                flex: 1,
                                height: 1,
                                background: `${cfg.color}20`,
                                marginLeft: 4,
                              }}
                            />
                          </div>
                          {cards.map((card) => (
                            <DeckSummaryCardRow
                              key={card.id}
                              card={card}
                              onToggle={toggleCard}
                              armyColor={cfg.color}
                              bgPositions={bgPositions}
                            />
                          ))}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div
                className="cosmic-builder-confirmarea"
                style={{
                  padding: "16px 20px",
                  borderTop: `1.5px solid ${PALETTE.slate}`,
                  background: `${PALETTE.deepVoid}cc`,
                }}
              >
                {deck.length === MAX_CARDS && totalLeague <= MAX_LEAGUE ? (
                  <MenuCard
                    accentColor={PALETTE.amber}
                    onClick={handleConfirmDeck}
                    className="satze-deck-btn-confirm"
                  >
                    <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: 2 }}>CONFERMA ESERCITO ›</span>
                  </MenuCard>
                ) : (
                  <div style={{ textAlign: "center" }}>
                    {deck.length < MAX_CARDS && (
                      <span style={{ fontSize: 14, color: PALETTE.textSecondary }}>
                        Servono ancora <b style={{ color: PALETTE.textPrimary }}>{MAX_CARDS - deck.length}</b> carte
                      </span>
                    )}
                    {deck.length === MAX_CARDS && totalLeague > MAX_LEAGUE && (
                      <span style={{ fontSize: 14, color: PALETTE.fire, fontWeight: 600 }}>
                        ⚠️ Lega totale supera il limite di {MAX_LEAGUE}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      {showGlossary && (
        <Glossary variant="menu" onClose={() => setShowGlossary(false)} zIndex={10000} />
      )}

      {showSaveModal && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 10001,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(0,0,0,0.7)",
            }}
            onClick={() => setShowSaveModal(false)}
          >
            <div
              style={{
                background: PALETTE.deepVoid,
                border: `2px solid ${PALETTE.amber}`,
                padding: 24,
                minWidth: 320,
                maxWidth: 400,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 16, color: PALETTE.textPrimary }}>
                Salva esercito
              </div>
              <input
                type="text"
                value={deckName}
                onChange={(e) => setDeckName(e.target.value)}
                placeholder="Nome dell'esercito"
                maxLength={40}
                autoFocus
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  marginBottom: 16,
                  background: PALETTE.nebula,
                  border: `1px solid ${PALETTE.slate}`,
                  color: PALETTE.textPrimary,
                  fontSize: 14,
                }}
              />
              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                <button
                  onClick={() => setShowSaveModal(false)}
                  style={{
                    padding: "10px 20px",
                    background: "transparent",
                    border: `1px solid ${PALETTE.slate}`,
                    color: PALETTE.textSecondary,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Annulla
                </button>
                <button
                  onClick={handleSaveDeck}
                  disabled={!deckName.trim()}
                  style={{
                    padding: "10px 20px",
                    background: deckName.trim() ? PALETTE.amber : PALETTE.slate,
                    border: "none",
                    color: deckName.trim() ? "#000" : PALETTE.textSecondary,
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: deckName.trim() ? "pointer" : "not-allowed",
                  }}
                >
                  Salva e chiudi
                </button>
              </div>
            </div>
          </div>
      )}
    </div>
  );
}

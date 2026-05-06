// ============================================
// DECK SUMMARY CROP TOOL (esteso)
// Tool per configurare posizione (X,Y), scala e ritaglio delle immagini
// in tutte le sezioni: Riepilogo mazzo, Anteprima, Carta in mano,
// Agente sul campo, Agente in galleria, Layout P4 HUD (galleria rework).
// Apri con ?cropTool=1 nell'URL
// ============================================

import React, { useState, useMemo } from "react";
import { ARMY_SETS, ARMY_COLORS } from "../../data";
import { LEAGUE_TIER_COLORS as LEAGUE_COLORS } from "../../data/leagueColors";
import { getCardSprite } from "../../utils";
import { getCardImageUrl } from "../../data/images";
import { TRIGGER_NAMES } from "../../data/triggers";
import { DECK_SUMMARY_BG_POSITION as INITIAL_POSITIONS } from "../../data/deckSummaryCropConfig";
import { IMAGE_POSITIONING } from "../../data/imagePositioning";
import { CardImage } from "../cards/CardImage";
import { CardReworkP4 } from "../cards/CardReworkP4";
import { PALETTE } from "../../theme/hudOratorioPalette";
import {
  CROP_TOOL_SLIDER_MAX,
  CROP_TOOL_SLIDER_MIN,
  containerLeftPercentToSliderX,
  sliderXToContainerLeftPercent,
} from "../../utils/imageContainPan";

const POWER_COLOR = "#fde047";
const DAMAGE_COLOR = "#c084fc";
const TRIGGER_COLORS = {
  Sempre: "#94a3b8",
  Imboscata: "#f97316",
  Turbo: "#38bdf8",
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

const DEFAULTS = {
  deckSummary: { x: 50, y: 25, scale: 100 },
  objectCard: { x: 50, y: 50, scale: 100 },
};

const getArmyConfig = (armyName) => ({
  color: ARMY_COLORS[armyName]?.accent || PALETTE.amber,
});

// Carte normalizzate come nel deck builder
const ALL_CARDS = Object.entries(ARMY_SETS).flatMap(([army, cards]) =>
  cards.map((c) => ({
    ...c,
    army,
    pot: c.power,
    dan: c.damage,
    powerDesc: c.description?.replace(/^Potere: /, "") || "",
    trigger: c.ability?.trigger ? (TRIGGER_NAMES[c.ability.trigger] || "Sempre") : "Sempre",
  }))
);

// Parse deck summary config: string "25%" -> { x: 50, y: 25, scale: 100 }; object -> { x, y, scale }
const parseDeckSummaryConfig = (val) => {
  if (val == null) return DEFAULTS.deckSummary;
  if (typeof val === "object" && val.x != null) return { x: val.x ?? 50, y: val.y ?? 25, scale: val.scale ?? 100 };
  const y = typeof val === "string" ? parseInt(String(val).replace("%", ""), 10) : val;
  return { x: 50, y: isNaN(y) ? 25 : y, scale: 100 };
};

// Parse objectPosition + opzionale containerLeft (slider X nel tool ↔ translate orizzontale in CardImage)
const parseObjectPositionConfig = (cfg) => {
  if (!cfg) return DEFAULTS.objectCard;
  const op = cfg.objectPosition;
  const scale = cfg.scale ?? 100;
  let result;
  if (!op || op === "center center") {
    result = { x: 50, y: 50, scale };
  } else if (String(op).includes("top")) {
    result = { x: 50, y: 0, scale };
  } else if (String(op).includes("bottom")) {
    result = { x: 50, y: 100, scale };
  } else {
    const m = String(op).match(/(\d+)%?\s+(\d+)%?/);
    if (m) {
      result = { x: parseInt(m[1], 10), y: parseInt(m[2], 10), scale };
    } else {
      const m2 = String(op).match(/center\s+(\d+)%?/);
      if (m2) {
        result = { x: 50, y: parseInt(m2[1], 10), scale };
      } else {
        const m3 = String(op).match(/(\d+)%?\s+center/);
        if (m3) {
          result = { x: parseInt(m3[1], 10), y: 50, scale };
        } else {
          result = { ...DEFAULTS.objectCard, scale };
        }
      }
    }
  }
  const xFromLeft = containerLeftPercentToSliderX(cfg.containerLeft);
  if (xFromLeft != null) result = { ...result, x: xFromLeft };
  return result;
};

// StatBadge "tiny" - identico a DeckSummaryCardRow
const StatBadge = ({ label, value, color }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", background: `${color}18`, borderRadius: 4, padding: "2px 6px", minWidth: 32 }}>
    <span style={{ fontSize: 9, color: `${color}aa`, fontWeight: 600, letterSpacing: 1 }}>{label}</span>
    <span style={{ fontSize: 14, fontWeight: 800, color }}>{value}</span>
  </div>
);

// Dimensioni originali dai componenti reali
const DIMENSIONS = {
  deckSummary: { width: 396, height: 128 },
  card: { width: 224, height: 320 },
  handCard: { width: 144, height: 208 },
};
const CARD_IMAGE_SIZES = { card: 260, handCard: 140 };

/** Allineato all’export verso imagePositioning.js e ai blocchi CardImage del tool. */
function buildCropPreviewPositioning(obj) {
  const out = {
    objectPosition: `center ${obj.y}%`,
    scale: obj.scale,
  };
  const cl = sliderXToContainerLeftPercent(obj.x);
  if (cl != null) out.containerLeft = cl;
  return out;
}

export function DeckSummaryCropTool({ initialPositions = INITIAL_POSITIONS, onClose }) {
  const [positions, setPositions] = useState(() => {
    const init = {};
    ALL_CARDS.forEach((c) => {
      init[c.id] = parseDeckSummaryConfig(initialPositions[c.id]);
    });
    return init;
  });
  const [objectPositions, setObjectPositions] = useState(() => {
    const init = {};
    ALL_CARDS.forEach((c) => {
      init[c.id] = parseObjectPositionConfig(IMAGE_POSITIONING.cards[c.id]);
    });
    return init;
  });
  const [selectedCard, setSelectedCard] = useState(ALL_CARDS[0]?.id ?? null);
  const [armyFilter, setArmyFilter] = useState(null);
  const [copied, setCopied] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // null | 'saving' | 'ok' | { error }

  const filteredCards = useMemo(
    () => (armyFilter ? ALL_CARDS.filter((c) => c.army === armyFilter) : ALL_CARDS),
    [armyFilter]
  );

  const card = selectedCard ? ALL_CARDS.find((c) => c.id === selectedCard) : null;
  const ds = card ? (positions[card.id] ?? DEFAULTS.deckSummary) : DEFAULTS.deckSummary;
  const obj = card ? (objectPositions[card.id] ?? DEFAULTS.objectCard) : DEFAULTS.objectCard;

  const updateDeckSummary = (cardId, field, value) => {
    setPositions((p) => ({ ...p, [cardId]: { ...(p[cardId] ?? DEFAULTS.deckSummary), [field]: value } }));
  };
  const updateObjectCard = (cardId, field, value) => {
    setObjectPositions((p) => ({ ...p, [cardId]: { ...(p[cardId] ?? DEFAULTS.objectCard), [field]: value } }));
  };

  const resetDeckSummary = () => {
    if (card) setPositions((p) => ({ ...p, [card.id]: { ...DEFAULTS.deckSummary } }));
  };
  const resetObjectCard = () => {
    if (card) setObjectPositions((p) => ({ ...p, [card.id]: { ...DEFAULTS.objectCard } }));
  };

  const exportDeckSummaryConfig = () => {
    const obj = {};
    Object.entries(positions).forEach(([id, v]) => {
      const def = DEFAULTS.deckSummary;
      if (v.x !== def.x || v.y !== def.y || v.scale !== def.scale) {
        obj[Number(id)] = v.scale !== 100 ? { x: v.x, y: v.y, scale: v.scale } : { x: v.x, y: v.y };
      }
    });
    return obj;
  };

  const exportObjectPositionConfig = () => {
    const out = {};
    Object.entries(objectPositions).forEach(([id, v]) => {
      const def = DEFAULTS.objectCard;
      if (v.x !== def.x || v.y !== def.y || v.scale !== def.scale) {
        const containerLeft = sliderXToContainerLeftPercent(v.x);
        out[Number(id)] = {
          objectPosition: `center ${v.y}%`,
          ...(containerLeft ? { containerLeft } : {}),
          ...(v.scale !== 100 ? { scale: v.scale } : {}),
        };
      }
    });
    return out;
  };

  const copyAllConfig = () => {
    const dsConfig = exportDeckSummaryConfig();
    const objConfig = exportObjectPositionConfig();
    const dsJson = JSON.stringify(dsConfig, null, 2);
    const dsStr = `export const DECK_SUMMARY_BG_POSITION = ${dsJson.replace(/"(\d+)":/g, "$1:")};`;
    const objEntries = Object.entries(objConfig)
      .map(([id, v]) => {
        let line = `  ${id}: { objectPosition: "${v.objectPosition}"`;
        if (v.scale != null) line += `, scale: ${v.scale}`;
        if (v.containerLeft != null) line += `, containerLeft: '${v.containerLeft}'`;
        line += ` },`;
        return line;
      })
      .join("\n");
    const objStr = objEntries
      ? `// Posizione (X,Y) e scala - Anteprima, Carta in mano, Campo, Galleria
// Aggiungi in IMAGE_POSITIONING.cards in src/data/imagePositioning.js

${objEntries}`
      : "";
    const parts = [dsStr];
    if (objStr) parts.push("\n// ---\n\n" + objStr);
    navigator.clipboard.writeText(parts.join(""));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Costruisce il contenuto completo per salvataggio automatico
  const buildDeckSummaryFileContent = () => {
    const obj = {};
    Object.entries(positions).forEach(([id, v]) => {
      const def = DEFAULTS.deckSummary;
      obj[Number(id)] = v.scale !== 100 ? { x: v.x, y: v.y, scale: v.scale } : { x: v.x, y: v.y };
    });
    const json = JSON.stringify(obj, null, 2).replace(/"(\d+)":/g, "$1:");
    return `// ============================================
// Posizione verticale immagini nel riepilogo mazzo
// Generato dal Tool ritaglio carte (?cropTool=1)
// 0% = alto, 25% = default, 50% = centro, 75% = basso, 100% = molto basso
// ============================================

export const DECK_SUMMARY_BG_POSITION = ${json};
`;
  };

  const buildImagePositioningFileContent = () => {
    const objConfig = exportObjectPositionConfig();
    const merged = { ...IMAGE_POSITIONING.cards };
    Object.entries(objConfig).forEach(([id, v]) => {
      const nid = Number(id);
      const prev = merged[nid] || {};
      const next = { ...prev, objectPosition: v.objectPosition };
      if (v.scale != null && v.scale !== 100) next.scale = v.scale;
      else delete next.scale;
      if (v.containerLeft != null) next.containerLeft = v.containerLeft;
      else delete next.containerLeft;
      merged[nid] = next;
    });
    const serializeEntry = (id, cfg) => {
      const parts = [];
      if (cfg.containerTop != null) parts.push(`containerTop: ${typeof cfg.containerTop === "string" ? `'${cfg.containerTop}'` : cfg.containerTop}`);
      if (cfg.containerLeft != null) parts.push(`containerLeft: ${typeof cfg.containerLeft === "string" ? `'${cfg.containerLeft}'` : cfg.containerLeft}`);
      if (cfg.objectPosition != null) parts.push(`objectPosition: '${cfg.objectPosition}'`);
      if (cfg.scale != null) parts.push(`scale: ${cfg.scale}`);
      return `    ${id}: { ${parts.join(", ")} }`;
    };
    const cardsEntries = Object.entries(merged)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([id, cfg]) => serializeEntry(id, cfg))
      .join(",\n");
    const armiesEntries = Object.entries(IMAGE_POSITIONING.armies)
      .map(([k, v]) => {
        const p = [];
        if (v.containerTop != null) p.push(`containerTop: '${v.containerTop}'`);
        if (v.containerLeft != null) p.push(`containerLeft: '${v.containerLeft}'`);
        if (v.objectPosition != null) p.push(`objectPosition: '${v.objectPosition}'`);
        return `    '${k.replace(/'/g, "\\'")}': { ${p.join(", ")} }`;
      })
      .join(",\n");
    const header = `// ============================================
// CONFIGURAZIONE POSIZIONAMENTO IMMAGINI
// ============================================
// 
// Questo file permette di regolare il posizionamento delle immagini delle carte
// che risultano decentrate, troppo in alto o troppo in basso.
//
// COME USARE:
// ===========
// 1. Per regolare una carta specifica, aggiungi il suo ID nella sezione 'cards'
// 2. Per regolare tutte le carte di un'armata, aggiungi l'armata nella sezione 'armies'
// 3. La configurazione per carta specifica ha priorità su quella dell'armata
//
// PARAMETRI:
// ==========
// - containerTop: sposta il container dell'immagine verticalmente
//   • Valori positivi spostano l'immagine più in basso (es: '5%', '10px')
//   • Valori negativi spostano l'immagine più in alto (es: '-5%', '-10px')
//   • Puoi usare percentuali (%) o pixel (px)
//
// - containerLeft: sposta il container dell'immagine orizzontalmente
//   • Valori positivi spostano l'immagine più a destra (es: '5%', '10px')
//   • Valori negativi spostano l'immagine più a sinistra (es: '-5%', '-10px')
//   • Utile quando objectPosition non ha effetto con objectFit: contain
//
// - objectPosition: controlla quale parte dell'immagine viene mostrata
//   • 'center center' - centra l'immagine (default)
//   • 'center top' - mostra la parte alta dell'immagine
//   • 'center bottom' - mostra la parte bassa dell'immagine
//   • 'center 30%' - mostra il 30% dall'alto dell'immagine
//   • 'center 70%' - mostra il 70% dall'alto (più in basso)
//   • '40% center' - sposta l'immagine a sinistra (per correggere immagini troppo a destra)
//   • '60% center' - sposta l'immagine a destra (per correggere immagini troppo a sinistra)
//
// ESEMPI PRATICI:
// ===============
// Immagine troppo in alto → spostala in basso:
//   401: { containerTop: '5%', objectPosition: 'center center' }
//
// Immagine troppo in basso → spostala in alto:
//   402: { containerTop: '-10%', objectPosition: 'center center' }
//
// Immagine decentrata verticalmente → mostra più la parte alta:
//   403: { containerTop: '0%', objectPosition: 'center 35%' }
//
// Immagine decentrata verticalmente → mostra più la parte bassa:
//   404: { containerTop: '0%', objectPosition: 'center 65%' }
//
// Combinazione: sposta in basso E mostra più la parte alta:
//   405: { containerTop: '8%', objectPosition: 'center 40%' }
//
// Per tutte le carte di un'armata:
//   'Calibri Pesanti': { containerTop: '-3%', objectPosition: 'center 45%' }

export const IMAGE_POSITIONING = {
  // Configurazione per armate (si applica a tutte le carte dell'armata)
  armies: {
${armiesEntries ? armiesEntries + "\n" : ""}  },
  
  // Configurazione per carte specifiche (sovrascrive la configurazione dell'armata)
  cards: {
${cardsEntries}
  }
};

/**
 * Ottiene la configurazione di posizionamento per una carta specifica
 * @param {number} cardId - ID della carta
 * @param {string} army - Nome dell'armata
 * @returns {Object} Configurazione con containerTop e objectPosition
 */
export function getImagePositioning(cardId, army) {
  // Prima controlla se c'è una configurazione specifica per questa carta
  if (IMAGE_POSITIONING.cards[cardId]) {
    return IMAGE_POSITIONING.cards[cardId];
  }
  
  // Poi controlla se c'è una configurazione per l'armata
  if (army && IMAGE_POSITIONING.armies[army]) {
    return IMAGE_POSITIONING.armies[army];
  }
  
  // Valori di default
  return {
    containerTop: undefined, // userà il valore di default del componente
    containerLeft: undefined, // nessuno spostamento orizzontale
    objectPosition: undefined // userà il valore di default del componente
  };
}
`;
    return header;
  };

  const handleSave = async () => {
    const electronAPI = window.electronAPI;
    if (!electronAPI?.saveCropConfig) {
      setSaveStatus({ error: "Salvataggio disponibile solo in Electron (modalità sviluppo)" });
      setTimeout(() => setSaveStatus(null), 3000);
      return;
    }
    setSaveStatus("saving");
    const result = await electronAPI.saveCropConfig({
      deckSummaryContent: buildDeckSummaryFileContent(),
      imagePositioningContent: buildImagePositioningFileContent(),
    });
    if (result.ok) {
      setSaveStatus("ok");
      setTimeout(() => setSaveStatus(null), 2000);
    } else {
      setSaveStatus({ error: result.error || "Errore di salvataggio" });
      setTimeout(() => setSaveStatus(null), 4000);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100000,
        background: `linear-gradient(180deg, ${PALETTE.deepVoid} 0%, ${PALETTE.nebula} 50%, ${PALETTE.deepVoid} 100%)`,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div style={{ padding: "16px 24px", borderBottom: `1px solid ${PALETTE.slate}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
        <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800, color: PALETTE.amber }}>
          Tool ritaglio carte
        </h1>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button
            onClick={handleSave}
            disabled={saveStatus === "saving"}
            style={{
              padding: "10px 20px",
              background: saveStatus === "ok" ? "#22c55e" : saveStatus?.error ? "#ef4444" : PALETTE.cyan,
              color: "#000",
              border: "none",
              fontWeight: 700,
              cursor: saveStatus === "saving" ? "wait" : "pointer",
              fontSize: 13,
            }}
            title={!window.electronAPI?.saveCropConfig ? "Avvia con npm run electron:dev" : undefined}
          >
            {saveStatus === "saving" ? "Salvataggio..." : saveStatus === "ok" ? "✓ Salvato!" : saveStatus?.error ? "Errore" : "Salva nei file"}
          </button>
          <button onClick={copyAllConfig} style={{ padding: "10px 20px", background: copied ? "#22c55e" : PALETTE.amber, color: "#000", border: "none", fontWeight: 700, cursor: "pointer", fontSize: 13 }}>
            {copied ? "✓ Copiato!" : "Copia config"}
          </button>
          {onClose && (
            <button onClick={onClose} style={{ padding: "10px 20px", background: PALETTE.slate, color: "#fff", border: "none", fontWeight: 600, cursor: "pointer" }}>
              Chiudi
            </button>
          )}
        </div>
      </div>

      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        {/* Lista carte */}
        <div style={{ width: 320, borderRight: `1px solid ${PALETTE.slate}`, overflowY: "auto", padding: 12 }}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, color: PALETTE.textSecondary, marginRight: 8 }}>Armata:</label>
            <select value={armyFilter ?? ""} onChange={(e) => setArmyFilter(e.target.value || null)} style={{ padding: "6px 10px", background: PALETTE.deepVoid, color: "#fff", border: `1px solid ${PALETTE.slate}` }}>
              <option value="">Tutte</option>
              {[...new Set(ALL_CARDS.map((c) => c.army))].map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
          {filteredCards.map((c) => {
            const r = positions[c.id] ?? DEFAULTS.deckSummary;
            const o = objectPositions[c.id] ?? DEFAULTS.objectCard;
            return (
              <div
                key={c.id}
                onClick={() => setSelectedCard(c.id)}
                style={{
                  padding: "8px 12px",
                  marginBottom: 4,
                  background: selectedCard === c.id ? `${getArmyConfig(c.army).color}30` : "transparent",
                  border: `1px solid ${selectedCard === c.id ? getArmyConfig(c.army).color : PALETTE.slate}`,
                  cursor: "pointer",
                  fontSize: 13,
                }}
              >
                <span style={{ color: PALETTE.textSecondary, marginRight: 6 }}>{c.id}</span>
                {c.name}
                <span style={{ marginLeft: 6, fontSize: 10, color: PALETTE.textSecondary }}>
                  R:{r.x},{r.y} A:{o.x},{o.y}
                </span>
              </div>
            );
          })}
        </div>

        {/* Preview + Controlli */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: 24, overflow: "auto" }}>
          {card && (
            <>
              <div style={{ marginBottom: 20 }}>
                <h2 style={{ margin: "0 0 8px", fontSize: 1.2, color: PALETTE.textPrimary }}>{card.name}</h2>
                <p style={{ margin: 0, fontSize: 13, color: PALETTE.textSecondary }}>ID: {card.id}</p>
              </div>

              {/* Controlli Riepilogo esercito */}
              <div style={{ marginBottom: 24, padding: 16, background: `${PALETTE.amber}10`, borderRadius: 8, border: `1px solid ${PALETTE.amber}40` }}>
                <div style={{ fontSize: 13, color: PALETTE.amber, fontWeight: 700, marginBottom: 12 }}>Riepilogo esercito</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "flex-start" }}>
                  <div style={{ minWidth: 140 }}>
                    <label style={{ fontSize: 11, color: PALETTE.textSecondary }}>X ({CROP_TOOL_SLIDER_MIN}…{CROP_TOOL_SLIDER_MAX}, 50=centro)</label>
                    <input type="range" min={CROP_TOOL_SLIDER_MIN} max={CROP_TOOL_SLIDER_MAX} value={ds.x} onChange={(e) => updateDeckSummary(card.id, "x", Number(e.target.value))} style={{ width: "100%", display: "block" }} />
                    <span style={{ fontSize: 11, color: PALETTE.amber }}>{ds.x}%</span>
                  </div>
                  <div style={{ minWidth: 140 }}>
                    <label style={{ fontSize: 11, color: PALETTE.textSecondary }}>Y ({CROP_TOOL_SLIDER_MIN}…{CROP_TOOL_SLIDER_MAX}, 50=centro)</label>
                    <input type="range" min={CROP_TOOL_SLIDER_MIN} max={CROP_TOOL_SLIDER_MAX} value={ds.y} onChange={(e) => updateDeckSummary(card.id, "y", Number(e.target.value))} style={{ width: "100%", display: "block" }} />
                    <span style={{ fontSize: 11, color: PALETTE.amber }}>{ds.y}%</span>
                  </div>
                  <div style={{ minWidth: 140 }}>
                    <label style={{ fontSize: 11, color: PALETTE.textSecondary }}>Scala (50–150%)</label>
                    <input type="range" min={50} max={150} value={ds.scale} onChange={(e) => updateDeckSummary(card.id, "scale", Number(e.target.value))} style={{ width: "100%", display: "block" }} />
                    <span style={{ fontSize: 11, color: PALETTE.amber }}>{ds.scale}%</span>
                  </div>
                  <button onClick={resetDeckSummary} style={{ padding: "8px 14px", background: PALETTE.slate, color: "#fff", border: "none", fontWeight: 600, cursor: "pointer", fontSize: 12, alignSelf: "flex-end" }}>
                    Ripristina
                  </button>
                </div>
              </div>

              {/* Controlli Anteprima / Carta / Campo / Galleria */}
              <div style={{ marginBottom: 24, padding: 16, background: `${PALETTE.cyan}10`, borderRadius: 8, border: `1px solid ${PALETTE.cyan}40` }}>
                <div style={{ fontSize: 13, color: PALETTE.cyan, fontWeight: 700, marginBottom: 12 }}>Anteprima / Carta in mano / Campo / Galleria</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "flex-start" }}>
                  <div style={{ minWidth: 140 }}>
                    <label style={{ fontSize: 11, color: PALETTE.textSecondary }}>X ({CROP_TOOL_SLIDER_MIN}…{CROP_TOOL_SLIDER_MAX}, 50=centro)</label>
                    <input type="range" min={CROP_TOOL_SLIDER_MIN} max={CROP_TOOL_SLIDER_MAX} value={obj.x} onChange={(e) => updateObjectCard(card.id, "x", Number(e.target.value))} style={{ width: "100%", display: "block" }} />
                    <span style={{ fontSize: 11, color: PALETTE.cyan }}>{obj.x}%</span>
                  </div>
                  <div style={{ minWidth: 140 }}>
                    <label style={{ fontSize: 11, color: PALETTE.textSecondary }}>Y ({CROP_TOOL_SLIDER_MIN}…{CROP_TOOL_SLIDER_MAX}, 50=centro)</label>
                    <input type="range" min={CROP_TOOL_SLIDER_MIN} max={CROP_TOOL_SLIDER_MAX} value={obj.y} onChange={(e) => updateObjectCard(card.id, "y", Number(e.target.value))} style={{ width: "100%", display: "block" }} />
                    <span style={{ fontSize: 11, color: PALETTE.cyan }}>{obj.y}%</span>
                  </div>
                  <div style={{ minWidth: 140 }}>
                    <label style={{ fontSize: 11, color: PALETTE.textSecondary }}>Scala (50–150%)</label>
                    <input type="range" min={50} max={150} value={obj.scale} onChange={(e) => updateObjectCard(card.id, "scale", Number(e.target.value))} style={{ width: "100%", display: "block" }} />
                    <span style={{ fontSize: 11, color: PALETTE.cyan }}>{obj.scale}%</span>
                  </div>
                  <button onClick={resetObjectCard} style={{ padding: "8px 14px", background: PALETTE.slate, color: "#fff", border: "none", fontWeight: 600, cursor: "pointer", fontSize: 12, alignSelf: "flex-end" }}>
                    Ripristina
                  </button>
                </div>
              </div>

              {/* Anteprime */}
              <div style={{ display: "flex", flexDirection: "column", gap: 28, marginTop: 8 }}>
                {/* Riepilogo esercito */}
                <div>
                  <div style={{ fontSize: 12, color: PALETTE.amber, marginBottom: 8, fontWeight: 600 }}>
                    Riepilogo esercito — {DIMENSIONS.deckSummary.width}×{DIMENSIONS.deckSummary.height}px
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 16,
                      padding: "10px 14px",
                      width: DIMENSIONS.deckSummary.width,
                      minWidth: DIMENSIONS.deckSummary.width,
                      height: DIMENSIONS.deckSummary.height,
                      overflow: "hidden",
                      background: (() => {
                        const spriteInfo = getCardSprite(card);
                        const url = getCardImageUrl(spriteInfo.type, spriteInfo.agentId);
                        const bgSize = ds.scale === 100 ? "cover" : `${ds.scale}%`;
                        return url
                          ? `linear-gradient(90deg, rgba(10,14,26,0.92) 0%, rgba(10,14,26,0.75) 50%, rgba(10,14,26,0.6) 100%), url(${url}) ${ds.x}% ${ds.y}% / ${bgSize}`
                          : `linear-gradient(90deg, ${getArmyConfig(card.army).color}25 0%, ${getArmyConfig(card.army).color}08 100%)`;
                      })(),
                      border: `1.5px solid ${getArmyConfig(card.army).color}`,
                      boxShadow: "0 2px 8px #000",
                    }}
                  >
                    <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", gap: 2, alignItems: "flex-start" }}>
                      <StatBadge label="LEGA" value={card.league} color={LEAGUE_COLORS[card.league] || PALETTE.slate} />
                      <StatBadge label="POT" value={card.pot} color={POWER_COLOR} />
                      <StatBadge label="DAN" value={card.dan} color={DAMAGE_COLOR} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 16, fontWeight: 600, color: PALETTE.textPrimary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{card.name}</div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 6 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: TRIGGER_COLORS[card.trigger] || "#94a3b8", background: `${TRIGGER_COLORS[card.trigger] || "#94a3b8"}20`, padding: "2px 8px", borderRadius: 4 }}>{card.trigger}</span>
                        <span style={{ fontSize: 13, color: PALETTE.textSecondary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {card.trigger && card.powerDesc?.startsWith(card.trigger + ": ") ? card.powerDesc.substring(card.trigger.length + 2).trim() : card.powerDesc}
                        </span>
                      </div>
                    </div>
                    <div style={{ width: 32, height: 32, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, background: `${PALETTE.fire}30`, color: PALETTE.fire, border: `1.5px solid ${PALETTE.fire}` }}>−</div>
                  </div>
                </div>

                {/* Carte */}
                <div>
                  <div style={{ fontSize: 12, color: PALETTE.cyan, marginBottom: 12, fontWeight: 600 }}>
                    Anteprima / Carta in mano / Campo / Galleria
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 24, alignItems: "flex-start" }}>
                    {[
                      { label: "Anteprima", dim: DIMENSIONS.card, size: CARD_IMAGE_SIZES.card },
                      { label: "Carta in mano", dim: DIMENSIONS.handCard, size: CARD_IMAGE_SIZES.handCard },
                      { label: "Agente sul campo", dim: DIMENSIONS.card, size: CARD_IMAGE_SIZES.card },
                      { label: "Agente in galleria", dim: DIMENSIONS.card, size: CARD_IMAGE_SIZES.card },
                    ].map(({ label, dim, size }) => (
                      <div key={label} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <div style={{ fontSize: 11, color: PALETTE.textSecondary, marginBottom: 6 }}>{label}</div>
                        <div style={{ fontSize: 10, color: PALETTE.slate, marginBottom: 4 }}>{dim.width}×{dim.height}px</div>
                        <div style={{ width: dim.width, height: dim.height, background: "#1a1a2e", borderRadius: 12, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", border: `2px solid ${getArmyConfig(card.army).color}` }}>
                          <CardImage
                            type={getCardSprite(card).type}
                            palette={getCardSprite(card).palette}
                            agentId={getCardSprite(card).agentId}
                            size={size}
                            objectPosition={`center ${obj.y}%`}
                            scale={obj.scale}
                            containerLeft={sliderXToContainerLeftPercent(obj.x)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Layout P4 HUD — stesso componente della galleria con toggle «P4 HUD» */}
                <div>
                  <div style={{ fontSize: 12, color: PALETTE.cyan, marginBottom: 12, fontWeight: 600 }}>
                    Layout P4 HUD (galleria rework)
                  </div>
                  <div style={{ fontSize: 11, color: PALETTE.textSecondary, marginBottom: 10 }}>
                    230×330px · fascia rune / LEGA · stesso ritaglio immagine delle anteprime sopra
                  </div>
                  <div
                    style={{
                      display: "inline-flex",
                      padding: 12,
                      background: "#12121a",
                      borderRadius: 12,
                      border: `1px solid ${PALETTE.slate}`,
                      boxShadow: "0 4px 24px rgba(0,0,0,0.45)",
                    }}
                  >
                    <CardReworkP4 agent={card} positioningOverride={buildCropPreviewPositioning(obj)} />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div style={{ padding: "12px 24px", borderTop: `1px solid ${PALETTE.slate}`, fontSize: 12, color: PALETTE.textSecondary }}>
        {window.electronAPI?.saveCropConfig
          ? "«Salva nei file» scrive automaticamente in deckSummaryCropConfig.js e imagePositioning.js."
          : "«Salva nei file» funziona solo in Electron (npm run electron:dev). «Copia config» per incollare manualmente."}
      </div>
    </div>
  );
}

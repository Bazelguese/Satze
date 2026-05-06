import React, { useState, useMemo, useCallback } from "react";

// ============================================
// SATZE - DECK BUILDER PROTOTYPE
// ============================================

// === CARD DATABASE ===
const ALL_CARDS = [
  // COMETE
  { id: 101, name: "Zarkon, il Mangia Nebule", army: "Comete", league: 5, pot: 6, dan: 4, power: "-8 VA nem.", trigger: "Sempre" },
  { id: 102, name: "Tessitrice di Stelle", army: "Comete", league: 4, pot: 5, dan: 3, power: "Cura 2", trigger: "Conquista" },
  { id: 103, name: "Guardiano del Vuoto", army: "Comete", league: 4, pot: 4, dan: 4, power: "-4 VA nem.", trigger: "Resa dei conti" },
  { id: 104, name: "Stella Errante", army: "Comete", league: 3, pot: 3, dan: 3, power: "+2 FC", trigger: "Imboscata" },
  { id: 105, name: "Profeta dell'Aurora", army: "Comete", league: 3, pot: 4, dan: 2, power: "+2 POT", trigger: "Intervento" },
  { id: 106, name: "Cavaliere della Cometa", army: "Comete", league: 3, pot: 3, dan: 3, power: "3 Danni dir.", trigger: "Imboscata" },
  { id: 107, name: "Nomade Cosmico", army: "Comete", league: 2, pot: 3, dan: 1, power: "Blocca Bonus", trigger: "Sempre" },
  { id: 108, name: "Frammento d'Eternità", army: "Comete", league: 2, pot: 2, dan: 2, power: "2 Danni dir.", trigger: "Ultimo desiderio" },
  { id: 109, name: "Sentinella Astrale", army: "Comete", league: 2, pot: 3, dan: 1, power: "+3 POT", trigger: "Vendetta" },
  { id: 110, name: "Polvere di Stella", army: "Comete", league: 2, pot: 5, dan: 1, power: "-2 PV (a te)", trigger: "Conquista" },
  { id: 111, name: "Supernova Nascente", army: "Comete", league: 5, pot: 5, dan: 6, power: "+6 VA", trigger: "Gloria" },
  { id: 112, name: "Divoratore di Luce", army: "Comete", league: 4, pot: 6, dan: 3, power: "+2 DAN", trigger: "Resa dei conti" },
  { id: 113, name: "Specchio Cosmico", army: "Comete", league: 3, pot: 1, dan: 4, power: "Copia POT nem.", trigger: "Sempre" },
  { id: 114, name: "Onda d'Urto Stellare", army: "Comete", league: 3, pot: 4, dan: 3, power: "+1 POT, +1 DAN", trigger: "Gloria" },
  { id: 115, name: "Alone Protettivo", army: "Comete", league: 2, pot: 3, dan: 1, power: "-1 DAN nem. (min 3)", trigger: "Sempre" },

  // PROGENIE DI BABELE
  { id: 201, name: "Ur-Nammu il Conquistatore", army: "Progenie di Babele", league: 5, pot: 6, dan: 5, power: "+2 POT", trigger: "Magnanimo" },
  { id: 202, name: "Profeta delle Rovine", army: "Progenie di Babele", league: 4, pot: 5, dan: 4, power: "+2 DAN", trigger: "Vendetta" },
  { id: 203, name: "Araldo della Fine", army: "Progenie di Babele", league: 4, pot: 4, dan: 3, power: "2 Danni dir.", trigger: "Ultimo desiderio" },
  { id: 204, name: "Custode della Ziqqurat", army: "Progenie di Babele", league: 3, pot: 4, dan: 2, power: "Blocca Bonus", trigger: "Sempre" },
  { id: 205, name: "Sacerdote del Caos", army: "Progenie di Babele", league: 3, pot: 3, dan: 3, power: "-4 VA nem.", trigger: "Imboscata" },
  { id: 206, name: "Berserker di Babele", army: "Progenie di Babele", league: 3, pot: 4, dan: 3, power: "+1 DAN", trigger: "Vendetta" },
  { id: 207, name: "Seguace Fanatico", army: "Progenie di Babele", league: 2, pot: 3, dan: 1, power: "+2 POT", trigger: "Gloria" },
  { id: 208, name: "Costruttore Maledetto", army: "Progenie di Babele", league: 2, pot: 2, dan: 1, power: "-1 DAN nem. (min 3)", trigger: "Sempre" },
  { id: 209, name: "Ombra della Torre", army: "Progenie di Babele", league: 2, pot: 2, dan: 3, power: "+2 FC", trigger: "Gloria" },
  { id: 210, name: "Martire di Babele", army: "Progenie di Babele", league: 2, pot: 2, dan: 2, power: "3 Danni dir.", trigger: "Ultimo desiderio" },
  { id: 211, name: "Nimrod, il Primo Re", army: "Progenie di Babele", league: 5, pot: 7, dan: 3, power: "+2 DAN", trigger: "Resa dei conti" },
  { id: 212, name: "Spirito della Torre", army: "Progenie di Babele", league: 4, pot: 4, dan: 4, power: "Immune", trigger: "Rimonta" },
  { id: 213, name: "Maledizione di Babele", army: "Progenie di Babele", league: 4, pot: 2, dan: 5, power: "-3 POT nem. (min 1)", trigger: "Intervento" },
  { id: 214, name: "Pietra Angolare", army: "Progenie di Babele", league: 3, pot: 5, dan: 1, power: "-2 PV (a te)", trigger: "Conquista" },
  { id: 215, name: "Ultimo Testimone", army: "Progenie di Babele", league: 2, pot: 4, dan: 1, power: "Cura 2", trigger: "Ultimo desiderio" },

  // CORTE DEI DIAVOLI
  { id: 301, name: "Principe della Fiamma Nera", army: "Corte dei Diavoli", league: 5, pot: 7, dan: 3, power: "3 Danni dir.", trigger: "Conquista" },
  { id: 302, name: "Sussurratrice di Patti", army: "Corte dei Diavoli", league: 4, pot: 5, dan: 4, power: "Copia Potere", trigger: "Intervento" },
  { id: 303, name: "Esattore Infernale", army: "Corte dei Diavoli", league: 4, pot: 5, dan: 4, power: "-2 POT nem.", trigger: "Magnanimo" },
  { id: 304, name: "Tentatore d'Anime", army: "Corte dei Diavoli", league: 3, pot: 4, dan: 2, power: "Blocca Potere", trigger: "Sempre" },
  { id: 305, name: "Avvocato del Diavolo", army: "Corte dei Diavoli", league: 3, pot: 2, dan: 5, power: "Copia POT", trigger: "Imboscata" },
  { id: 306, name: "Giudice Corrotto", army: "Corte dei Diavoli", league: 3, pot: 3, dan: 3, power: "-5 VA nem.", trigger: "Resa dei conti" },
  { id: 307, name: "Imp del Contratto", army: "Corte dei Diavoli", league: 2, pot: 2, dan: 2, power: "-2 DAN nem. (min 2)", trigger: "Intervento" },
  { id: 308, name: "Diavoletto Ingannatore", army: "Corte dei Diavoli", league: 2, pot: 3, dan: 3, power: "+2 POT", trigger: "Imboscata" },
  { id: 309, name: "Servo delle Ombre", army: "Corte dei Diavoli", league: 2, pot: 3, dan: 2, power: "-2 POT nem.", trigger: "Imboscata" },
  { id: 310, name: "Anima Dannata", army: "Corte dei Diavoli", league: 2, pot: 3, dan: 1, power: "Cura 2", trigger: "Ultimo desiderio" },
  { id: 311, name: "Specchio dell'Anima", army: "Corte dei Diavoli", league: 5, pot: 5, dan: 4, power: "Copia Potere nem.", trigger: "Resa dei conti" },
  { id: 312, name: "Vendicatore dei Patti", army: "Corte dei Diavoli", league: 4, pot: 6, dan: 3, power: "2 Danni dir.", trigger: "Vendetta" },
  { id: 313, name: "Sabotatore Infernale", army: "Corte dei Diavoli", league: 3, pot: 2, dan: 3, power: "-3 POT nem. (min 2)", trigger: "Intervento" },
  { id: 314, name: "Demone del Rancore", army: "Corte dei Diavoli", league: 3, pot: 4, dan: 4, power: "+2 POT", trigger: "Vendetta" },
  { id: 315, name: "Spiritello Opportunista", army: "Corte dei Diavoli", league: 2, pot: 1, dan: 3, power: "+2 POT", trigger: "Intervento" },

  // LEGIONE MECCANICA
  { id: 401, name: "Titano Corazzato MK-IV", army: "Legione Meccanica", league: 5, pot: 6, dan: 6, power: "Immune", trigger: "Sempre" },
  { id: 402, name: "Nucleo di Comando", army: "Legione Meccanica", league: 4, pot: 4, dan: 5, power: "+2 POT", trigger: "Overdrive" },
  { id: 403, name: "Fortezza Mobile", army: "Legione Meccanica", league: 4, pot: 4, dan: 4, power: "+3 FC", trigger: "Overdrive" },
  { id: 404, name: "Automa Riparatore", army: "Legione Meccanica", league: 3, pot: 5, dan: 1, power: "Cura 2", trigger: "Conquista" },
  { id: 405, name: "Sentinella d'Acciaio", army: "Legione Meccanica", league: 3, pot: 5, dan: 2, power: "Blocca Potere", trigger: "Intervento" },
  { id: 406, name: "Golem di Plasma", army: "Legione Meccanica", league: 3, pot: 2, dan: 3, power: "Copia POT nem.", trigger: "Sempre" },
  { id: 407, name: "Drone Cacciatore X-9", army: "Legione Meccanica", league: 2, pot: 3, dan: 1, power: "2 Danni dir.", trigger: "Imboscata" },
  { id: 408, name: "Operaio Meccanico", army: "Legione Meccanica", league: 2, pot: 2, dan: 2, power: "+2 FC", trigger: "Intervento" },
  { id: 409, name: "Scudo Automatico", army: "Legione Meccanica", league: 2, pot: 2, dan: 1, power: "+3 POT", trigger: "Vendetta" },
  { id: 410, name: "Robot da Ricognizione", army: "Legione Meccanica", league: 2, pot: 3, dan: 2, power: "+4 VA", trigger: "Imboscata" },
  { id: 411, name: "Disruptor Finale", army: "Legione Meccanica", league: 5, pot: 4, dan: 4, power: "-12 VA nem. (min 6)", trigger: "Resa dei conti" },
  { id: 412, name: "Conquistatore d'Acciaio", army: "Legione Meccanica", league: 4, pot: 6, dan: 2, power: "+1 POT, +1 DAN", trigger: "Magnanimo" },
  { id: 413, name: "Cannone Semovente", army: "Legione Meccanica", league: 4, pot: 5, dan: 4, power: "2 Danni dir.", trigger: "Overdrive" },
  { id: 414, name: "Estrattore di Risorse", army: "Legione Meccanica", league: 3, pot: 4, dan: 3, power: "+2 FC", trigger: "Gloria" },
  { id: 415, name: "Protocollo di Emergenza", army: "Legione Meccanica", league: 3, pot: 4, dan: 1, power: "+1 POT, +1 DAN", trigger: "Rimonta" },

  // CIRCOLO MISTICO
  { id: 501, name: "Arcanista del Crepuscolo", army: "Circolo Mistico", league: 5, pot: 5, dan: 5, power: "-6 VA nem.", trigger: "Sempre" },
  { id: 502, name: "Maestro delle Rune", army: "Circolo Mistico", league: 4, pot: 5, dan: 3, power: "+3 POT", trigger: "Resa dei conti" },
  { id: 503, name: "Custode dei Segreti", army: "Circolo Mistico", league: 4, pot: 7, dan: 2, power: "Copia DAN", trigger: "Resa dei conti" },
  { id: 504, name: "Evocatore di Spiriti", army: "Circolo Mistico", league: 3, pot: 4, dan: 3, power: "Blocca Bonus", trigger: "Sempre" },
  { id: 505, name: "Oracolo Velato", army: "Circolo Mistico", league: 3, pot: 5, dan: 2, power: "+3 FC", trigger: "Conquista" },
  { id: 506, name: "Stregone di Battaglia", army: "Circolo Mistico", league: 3, pot: 5, dan: 2, power: "+2 POT", trigger: "Imboscata" },
  { id: 507, name: "Familiar Eterno", army: "Circolo Mistico", league: 2, pot: 4, dan: 1, power: "+2 POT", trigger: "Vendetta" },
  { id: 508, name: "Apprendista Mistico", army: "Circolo Mistico", league: 2, pot: 3, dan: 1, power: "Cura 2", trigger: "Sempre" },
  { id: 509, name: "Guardiano Arcano", army: "Circolo Mistico", league: 2, pot: 3, dan: 1, power: "+2 FC", trigger: "Ultimo desiderio" },
  { id: 510, name: "Spirito Guida", army: "Circolo Mistico", league: 2, pot: 2, dan: 1, power: "+3 POT", trigger: "Gloria" },
  { id: 511, name: "Arcimago del Potere Infinito", army: "Circolo Mistico", league: 5, pot: 4, dan: 4, power: "+4 POT", trigger: "Overdrive" },
  { id: 512, name: "Riflesso Arcano", army: "Circolo Mistico", league: 4, pot: 3, dan: 5, power: "Copia POT nem.", trigger: "Intervento" },
  { id: 513, name: "Fenice Mistica", army: "Circolo Mistico", league: 3, pot: 3, dan: 3, power: "+3 POT", trigger: "Rimonta" },  
  { id: 514, name: "Collettore di Essenze", army: "Circolo Mistico", league: 3, pot: 3, dan: 3, power: "+3 FC", trigger: "Conquista" },
  { id: 515, name: "Scintilla Primordiale", army: "Circolo Mistico", league: 2, pot: 1, dan: 3, power: "+3 POT", trigger: "Magnanimo" },

  // SCIAME DIVORANTE
  { id: 601, name: "Regina della Colonia", army: "Sciame Divorante", league: 5, pot: 5, dan: 5, power: "Immune", trigger: "Overdrive" },
  { id: 602, name: "Bruto Corazzato", army: "Sciame Divorante", league: 4, pot: 5, dan: 4, power: "-2 DAN nem. (min 3)", trigger: "Sempre" },
  { id: 603, name: "Parassita Cerebrale", army: "Sciame Divorante", league: 4, pot: 3, dan: 4, power: "Copia POT", trigger: "Intervento" },
  { id: 604, name: "Predatore Alfa", army: "Sciame Divorante", league: 3, pot: 4, dan: 4, power: "+1 POT, +1 DAN", trigger: "Imboscata" },
  { id: 605, name: "Divoratore di Carne", army: "Sciame Divorante", league: 3, pot: 6, dan: 1, power: "+2 DAN", trigger: "Intervento" },
  { id: 606, name: "Infestatore", army: "Sciame Divorante", league: 3, pot: 5, dan: 2, power: "2 Danni dir.", trigger: "Conquista" },
  { id: 607, name: "Locusta Assassina", army: "Sciame Divorante", league: 2, pot: 4, dan: 1, power: "-2 PV (a te)", trigger: "Conquista" },
  { id: 608, name: "Larva Tossica", army: "Sciame Divorante", league: 2, pot: 2, dan: 2, power: "-2 DAN nem. (min 1)", trigger: "Rimonta" },
  { id: 609, name: "Sciamatore", army: "Sciame Divorante", league: 2, pot: 4, dan: 2, power: "-2 PV (a te)", trigger: "Ultimo desiderio" },
  { id: 610, name: "Spina Velenosa", army: "Sciame Divorante", league: 2, pot: 1, dan: 2, power: "+2 POT", trigger: "Imboscata" },
  { id: 611, name: "Abominio Perfetto", army: "Sciame Divorante", league: 5, pot: 6, dan: 3, power: "Immune", trigger: "Resa dei conti" },
  { id: 612, name: "Divoratore di Forza", army: "Sciame Divorante", league: 4, pot: 5, dan: 2, power: "-3 POT nem. (min 3)", trigger: "Intervento" },
  { id: 613, name: "Scarabeo Furioso", army: "Sciame Divorante", league: 3, pot: 3, dan: 3, power: "+2 POT", trigger: "Vendetta" },
  { id: 614, name: "Parassita Silenziatore", army: "Sciame Divorante", league: 3, pot: 4, dan: 3, power: "Blocca Potere", trigger: "Intervento" },
  { id: 615, name: "Larva Rigenerante", army: "Sciame Divorante", league: 2, pot: 3, dan: 2, power: "Cura 2", trigger: "Vendetta" },
];

// === ARMY CONFIG ===
const ARMIES = {
  "Comete": { symbol: "☄️", color: "#60a5fa", colorDark: "#1e3a5f", bonus: "-5 VA nem. (min 6)", bonusTrigger: "Sempre" },
  "Progenie di Babele": { symbol: "🏛️", color: "#f59e0b", colorDark: "#5c3d0e", bonus: "Rimonta: +2 POT", bonusTrigger: "Rimonta" },
  "Corte dei Diavoli": { symbol: "😈", color: "#ef4444", colorDark: "#5c1414", bonus: "Copia Bonus nem.", bonusTrigger: "Sempre" },
  "Legione Meccanica": { symbol: "⚙️", color: "#a1a1aa", colorDark: "#3f3f46", bonus: "-2 DAN nem. (min 2)", bonusTrigger: "Sempre" },
  "Circolo Mistico": { symbol: "🔮", color: "#a855f7", colorDark: "#4c1d95", bonus: "+1 DAN", bonusTrigger: "Sempre" },
  "Sciame Divorante": { symbol: "🦠", color: "#22c55e", colorDark: "#14532d", bonus: "Imboscata: +1 POT, +1 DAN", bonusTrigger: "Imboscata" },
};

const LEAGUE_COLORS = {
  2: "#71717a",
  3: "#3b82f6",
  4: "#a855f7",
  5: "#f59e0b",
};

const MAX_CARDS = 10;
const MAX_LEAGUE = 30;

// === COMPONENTS ===

const LeaguePips = ({ league }) => (
  <div style={{ display: "flex", gap: 2, alignItems: "center" }}>
    {Array.from({ length: league }).map((_, i) => (
      <div key={i} style={{
        width: 7, height: 7, borderRadius: "50%",
        background: LEAGUE_COLORS[league] || "#fff",
        boxShadow: `0 0 4px ${LEAGUE_COLORS[league] || "#fff"}80`,
      }} />
    ))}
  </div>
);

const StatBadge = ({ label, value, color }) => (
  <div style={{
    display: "flex", flexDirection: "column", alignItems: "center",
    background: `${color}18`, borderRadius: 6, padding: "2px 8px",
    minWidth: 36,
  }}>
    <span style={{ fontSize: 9, color: `${color}aa`, fontWeight: 600, letterSpacing: 1 }}>{label}</span>
    <span style={{ fontSize: 16, fontWeight: 800, color }}>{value}</span>
  </div>
);

const TriggerBadge = ({ trigger }) => {
  const triggerColors = {
    "Sempre": "#94a3b8", "Imboscata": "#f97316", "Intervento": "#06b6d4",
    "Gloria": "#eab308", "Vendetta": "#ef4444", "Overdrive": "#ec4899",
    "Resa dei conti": "#8b5cf6", "Rimonta": "#10b981", "Magnanimo": "#14b8a6",
    "Ultimo desiderio": "#6b7280", "Conquista": "#22c55e",
  };
  const c = triggerColors[trigger] || "#94a3b8";
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, color: c, background: `${c}20`,
      padding: "1px 6px", borderRadius: 4, letterSpacing: 0.5,
      border: `1px solid ${c}40`, textTransform: "uppercase", whiteSpace: "nowrap",
    }}>
      {trigger}
    </span>
  );
};

const CardRow = ({ card, inDeck, onToggle, disabled, armyColor }) => {
  const [hovered, setHovered] = useState(false);
  const ac = armyColor || ARMIES[card.army]?.color || "#888";

  return (
    <div
      onClick={() => !disabled && onToggle(card)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "8px 12px", borderRadius: 8, cursor: disabled && !inDeck ? "not-allowed" : "pointer",
        background: inDeck
          ? `linear-gradient(90deg, ${ac}25 0%, ${ac}08 100%)`
          : hovered ? "rgba(255,255,255,0.04)" : "transparent",
        border: inDeck ? `1px solid ${ac}50` : "1px solid transparent",
        opacity: disabled && !inDeck ? 0.35 : 1,
        transition: "all 0.15s ease",
        transform: hovered && !disabled ? "translateX(2px)" : "none",
        position: "relative",
      }}
    >
      {/* League indicator */}
      <div style={{
        width: 28, height: 28, borderRadius: 6,
        background: `${LEAGUE_COLORS[card.league]}20`,
        border: `1.5px solid ${LEAGUE_COLORS[card.league]}60`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 13, fontWeight: 900, color: LEAGUE_COLORS[card.league],
        flexShrink: 0,
      }}>
        {card.league}
      </div>

      {/* Name + trigger */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 12.5, fontWeight: 600, color: inDeck ? "#e2e8f0" : "#cbd5e1",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>
          {card.name}
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 2 }}>
          <TriggerBadge trigger={card.trigger} />
          <span style={{ fontSize: 10, color: "#64748b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {card.power}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
        <StatBadge label="POT" value={card.pot} color="#f59e0b" />
        <StatBadge label="DAN" value={card.dan} color="#ef4444" />
      </div>

      {/* Add/Remove indicator */}
      <div style={{
        width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 14, fontWeight: 700,
        background: inDeck ? "#ef444430" : "#22c55e20",
        color: inDeck ? "#ef4444" : "#22c55e",
        border: `1px solid ${inDeck ? "#ef444450" : "#22c55e40"}`,
      }}>
        {inDeck ? "−" : "+"}
      </div>
    </div>
  );
};

// === MAIN COMPONENT ===
export default function SatzeDeckBuilder() {
  const [deck, setDeck] = useState([]);
  const [selectedArmy, setSelectedArmy] = useState(null);
  const [leagueFilter, setLeagueFilter] = useState(null);
  const [sortBy, setSortBy] = useState("league"); // league, pot, dan
  const [inspectedCard, setInspectedCard] = useState(null);
  const [showAllCards, setShowAllCards] = useState(false);

  // Computed
  const totalLeague = useMemo(() => deck.reduce((s, c) => s + c.league, 0), [deck]);
  const remainingLeague = MAX_LEAGUE - totalLeague;
  const deckFull = deck.length >= MAX_CARDS;

  const armyCounts = useMemo(() => {
    const counts = {};
    deck.forEach(c => { counts[c.army] = (counts[c.army] || 0) + 1; });
    return counts;
  }, [deck]);

  const activeBonuses = useMemo(() =>
    Object.entries(armyCounts).filter(([, count]) => count >= 2).map(([army]) => army),
  [armyCounts]);

  const avgPot = useMemo(() => deck.length ? (deck.reduce((s, c) => s + c.pot, 0) / deck.length).toFixed(1) : "0", [deck]);
  const avgDan = useMemo(() => deck.length ? (deck.reduce((s, c) => s + c.dan, 0) / deck.length).toFixed(1) : "0", [deck]);

  // Filtered cards for catalog
  const catalogCards = useMemo(() => {
    let cards = showAllCards ? ALL_CARDS : (selectedArmy ? ALL_CARDS.filter(c => c.army === selectedArmy) : []);
    if (leagueFilter) cards = cards.filter(c => c.league === leagueFilter);
    cards = [...cards].sort((a, b) => {
      if (sortBy === "league") return b.league - a.league || b.pot - a.pot;
      if (sortBy === "pot") return b.pot - a.pot;
      if (sortBy === "dan") return b.dan - a.dan;
      return 0;
    });
    return cards;
  }, [selectedArmy, leagueFilter, sortBy, showAllCards]);

  const toggleCard = useCallback((card) => {
    setDeck(prev => {
      const exists = prev.find(c => c.id === card.id);
      if (exists) return prev.filter(c => c.id !== card.id);
      if (prev.length >= MAX_CARDS) return prev;
      if (totalLeague + card.league > MAX_LEAGUE) return prev;
      return [...prev, card];
    });
  }, [totalLeague]);

  const canAdd = useCallback((card) => {
    if (deck.find(c => c.id === card.id)) return true; // can remove
    if (deckFull) return false;
    if (totalLeague + card.league > MAX_LEAGUE) return false;
    return true;
  }, [deck, deckFull, totalLeague]);

  const clearDeck = () => setDeck([]);

  const deckByArmy = useMemo(() => {
    const grouped = {};
    deck.forEach(c => {
      if (!grouped[c.army]) grouped[c.army] = [];
      grouped[c.army].push(c);
    });
    Object.values(grouped).forEach(arr => arr.sort((a, b) => b.league - a.league));
    return grouped;
  }, [deck]);

  // League bar percentage
  const leaguePercent = Math.min((totalLeague / MAX_LEAGUE) * 100, 100);
  const leagueOverflow = totalLeague > MAX_LEAGUE;

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(145deg, #0a0e17 0%, #111827 40%, #0f172a 100%)",
      color: "#e2e8f0",
      fontFamily: "'Segoe UI', -apple-system, sans-serif",
      display: "flex", flexDirection: "column",
    }}>
      {/* HEADER */}
      <div style={{
        padding: "16px 20px",
        borderBottom: "1px solid #1e293b",
        background: "linear-gradient(180deg, rgba(15,23,42,0.9) 0%, rgba(15,23,42,0.6) 100%)",
        backdropFilter: "blur(12px)",
        position: "sticky", top: 0, zIndex: 50,
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h1 style={{
              margin: 0, fontSize: 22, fontWeight: 900, letterSpacing: 3,
              background: "linear-gradient(90deg, #f59e0b, #ef4444)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              SATZE
            </h1>
            <span style={{ fontSize: 10, color: "#64748b", letterSpacing: 2, textTransform: "uppercase" }}>
              Costruzione Mazzo
            </span>
          </div>

          {/* League bar */}
          <div style={{ flex: 1, maxWidth: 300, margin: "0 24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 10, color: "#64748b" }}>LEGA TOTALE</span>
              <span style={{
                fontSize: 13, fontWeight: 800,
                color: leagueOverflow ? "#ef4444" : totalLeague >= 25 ? "#f59e0b" : "#94a3b8",
              }}>
                {totalLeague} / {MAX_LEAGUE}
              </span>
            </div>
            <div style={{
              height: 6, borderRadius: 3, background: "#1e293b",
              overflow: "hidden", position: "relative",
            }}>
              <div style={{
                height: "100%", borderRadius: 3,
                width: `${leaguePercent}%`,
                background: leagueOverflow
                  ? "#ef4444"
                  : totalLeague >= 25
                    ? "linear-gradient(90deg, #22c55e, #f59e0b)"
                    : "linear-gradient(90deg, #22c55e, #3b82f6)",
                transition: "width 0.3s ease, background 0.3s ease",
              }} />
            </div>
          </div>

          {/* Card count */}
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 10, color: "#64748b" }}>CARTE</div>
            <div style={{
              fontSize: 20, fontWeight: 900,
              color: deckFull ? "#22c55e" : "#94a3b8",
            }}>
              {deck.length}<span style={{ fontSize: 13, fontWeight: 400, color: "#475569" }}>/{MAX_CARDS}</span>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        
        {/* LEFT: CATALOG */}
        <div style={{
          flex: 1, display: "flex", flexDirection: "column",
          borderRight: "1px solid #1e293b",
          minWidth: 0,
        }}>
          {/* Army selector */}
          <div style={{
            padding: "12px 16px",
            borderBottom: "1px solid #1e293b",
            background: "rgba(15,23,42,0.5)",
          }}>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
              <button
                onClick={() => { setShowAllCards(true); setSelectedArmy(null); }}
                style={{
                  padding: "6px 12px", borderRadius: 6, border: "none", cursor: "pointer",
                  fontSize: 11, fontWeight: 700, letterSpacing: 0.5,
                  background: showAllCards ? "#334155" : "#1e293b",
                  color: showAllCards ? "#e2e8f0" : "#64748b",
                  transition: "all 0.15s ease",
                }}>
                TUTTE
              </button>
              {Object.entries(ARMIES).map(([name, army]) => {
                const isActive = selectedArmy === name && !showAllCards;
                const count = armyCounts[name] || 0;
                return (
                  <button
                    key={name}
                    onClick={() => { setSelectedArmy(name); setShowAllCards(false); }}
                    style={{
                      padding: "6px 10px", borderRadius: 6, border: "none", cursor: "pointer",
                      fontSize: 11, fontWeight: 600,
                      background: isActive ? `${army.color}25` : "#1e293b",
                      color: isActive ? army.color : "#94a3b8",
                      border: isActive ? `1px solid ${army.color}50` : "1px solid transparent",
                      transition: "all 0.15s ease",
                      display: "flex", alignItems: "center", gap: 4,
                      position: "relative",
                    }}>
                    <span>{army.symbol}</span>
                    <span style={{ maxWidth: 80, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {name.split(" ")[0]}
                    </span>
                    {count > 0 && (
                      <span style={{
                        fontSize: 9, fontWeight: 800,
                        background: count >= 2 ? `${army.color}40` : "#334155",
                        color: count >= 2 ? army.color : "#94a3b8",
                        padding: "0 4px", borderRadius: 4, minWidth: 14, textAlign: "center",
                      }}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Filters row */}
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {/* League filter */}
              <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
                <span style={{ fontSize: 9, color: "#475569", marginRight: 2 }}>LEGA:</span>
                {[null, 2, 3, 4, 5].map(l => (
                  <button key={l ?? "all"} onClick={() => setLeagueFilter(l)}
                    style={{
                      width: 22, height: 22, borderRadius: 4, border: "none", cursor: "pointer",
                      fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center",
                      background: leagueFilter === l ? (l ? `${LEAGUE_COLORS[l]}30` : "#334155") : "transparent",
                      color: leagueFilter === l ? (l ? LEAGUE_COLORS[l] : "#e2e8f0") : "#64748b",
                    }}>
                    {l ?? "∗"}
                  </button>
                ))}
              </div>

              <div style={{ width: 1, height: 16, background: "#1e293b" }} />

              {/* Sort */}
              <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
                <span style={{ fontSize: 9, color: "#475569", marginRight: 2 }}>ORDINA:</span>
                {[["league", "Lega"], ["pot", "POT"], ["dan", "DAN"]].map(([key, label]) => (
                  <button key={key} onClick={() => setSortBy(key)}
                    style={{
                      padding: "2px 8px", borderRadius: 4, border: "none", cursor: "pointer",
                      fontSize: 10, fontWeight: 600,
                      background: sortBy === key ? "#334155" : "transparent",
                      color: sortBy === key ? "#e2e8f0" : "#64748b",
                    }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Army bonus banner */}
          {selectedArmy && !showAllCards && (
            <div style={{
              padding: "8px 16px",
              background: `${ARMIES[selectedArmy].color}08`,
              borderBottom: `1px solid ${ARMIES[selectedArmy].color}20`,
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <span style={{ fontSize: 16 }}>{ARMIES[selectedArmy].symbol}</span>
              <div>
                <span style={{ fontSize: 10, color: "#64748b" }}>BONUS ARMATA (2+ carte): </span>
                <span style={{
                  fontSize: 11, fontWeight: 700,
                  color: activeBonuses.includes(selectedArmy) ? ARMIES[selectedArmy].color : "#64748b",
                }}>
                  {ARMIES[selectedArmy].bonus}
                </span>
                {activeBonuses.includes(selectedArmy) && (
                  <span style={{
                    fontSize: 9, fontWeight: 800, color: "#22c55e", marginLeft: 6,
                    background: "#22c55e20", padding: "1px 6px", borderRadius: 4,
                  }}>
                    ATTIVO
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Card list */}
          <div style={{
            flex: 1, overflowY: "auto", padding: "8px 8px",
            display: "flex", flexDirection: "column", gap: 2,
          }}>
            {!selectedArmy && !showAllCards ? (
              <div style={{
                flex: 1, display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                color: "#475569", gap: 12, padding: 40,
              }}>
                <span style={{ fontSize: 48, opacity: 0.3 }}>⚔️</span>
                <span style={{ fontSize: 14, textAlign: "center", lineHeight: 1.6 }}>
                  Seleziona un'armata per sfogliare le carte,<br/>
                  oppure premi <b>TUTTE</b> per la collezione completa
                </span>
              </div>
            ) : catalogCards.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center", color: "#475569", fontSize: 13 }}>
                Nessuna carta trovata con questi filtri
              </div>
            ) : (
              catalogCards.map(card => (
                <CardRow
                  key={card.id}
                  card={card}
                  inDeck={!!deck.find(c => c.id === card.id)}
                  onToggle={toggleCard}
                  disabled={!canAdd(card)}
                />
              ))
            )}
          </div>
        </div>

        {/* RIGHT: DECK PANEL */}
        <div style={{
          width: 340, flexShrink: 0,
          display: "flex", flexDirection: "column",
          background: "rgba(15,23,42,0.3)",
        }}>
          {/* Deck header */}
          <div style={{
            padding: "12px 16px", borderBottom: "1px solid #1e293b",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 2, color: "#94a3b8" }}>
                IL TUO MAZZO
              </div>
            </div>
            {deck.length > 0 && (
              <button onClick={clearDeck} style={{
                padding: "4px 10px", borderRadius: 4, border: "1px solid #374151",
                background: "transparent", color: "#ef4444", fontSize: 10, fontWeight: 600,
                cursor: "pointer", letterSpacing: 0.5,
              }}>
                SVUOTA
              </button>
            )}
          </div>

          {/* Stats summary */}
          {deck.length > 0 && (
            <div style={{
              padding: "10px 16px", borderBottom: "1px solid #1e293b",
              display: "flex", gap: 12,
            }}>
              <div style={{ flex: 1, textAlign: "center" }}>
                <div style={{ fontSize: 9, color: "#64748b", letterSpacing: 1 }}>POT MED</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#f59e0b" }}>{avgPot}</div>
              </div>
              <div style={{ width: 1, background: "#1e293b" }} />
              <div style={{ flex: 1, textAlign: "center" }}>
                <div style={{ fontSize: 9, color: "#64748b", letterSpacing: 1 }}>DAN MED</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#ef4444" }}>{avgDan}</div>
              </div>
              <div style={{ width: 1, background: "#1e293b" }} />
              <div style={{ flex: 1, textAlign: "center" }}>
                <div style={{ fontSize: 9, color: "#64748b", letterSpacing: 1 }}>LEGA RIM</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: remainingLeague <= 4 ? "#f59e0b" : "#94a3b8" }}>
                  {remainingLeague}
                </div>
              </div>
            </div>
          )}

          {/* Active bonuses */}
          {activeBonuses.length > 0 && (
            <div style={{
              padding: "8px 16px", borderBottom: "1px solid #1e293b",
            }}>
              <div style={{ fontSize: 9, color: "#64748b", letterSpacing: 1, marginBottom: 6 }}>BONUS ATTIVI</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {activeBonuses.map(army => (
                  <div key={army} style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "4px 8px", borderRadius: 6,
                    background: `${ARMIES[army].color}12`,
                    border: `1px solid ${ARMIES[army].color}30`,
                  }}>
                    <span style={{ fontSize: 13 }}>{ARMIES[army].symbol}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: ARMIES[army].color }}>
                      {ARMIES[army].bonus}
                    </span>
                    <span style={{ fontSize: 9, color: "#475569", marginLeft: "auto" }}>
                      {armyCounts[army]}×
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Deck cards */}
          <div style={{
            flex: 1, overflowY: "auto", padding: "8px 8px",
          }}>
            {deck.length === 0 ? (
              <div style={{
                height: "100%", display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                color: "#334155", gap: 8,
              }}>
                <div style={{
                  width: 64, height: 88, borderRadius: 8,
                  border: "2px dashed #1e293b",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 24, opacity: 0.5,
                }}>
                  🃏
                </div>
                <span style={{ fontSize: 12 }}>Seleziona carte dal catalogo</span>
                <span style={{ fontSize: 10, color: "#1e293b" }}>10 carte • Max 30 Lega</span>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {Object.entries(deckByArmy).map(([army, cards]) => (
                  <div key={army}>
                    {/* Army group header */}
                    <div style={{
                      display: "flex", alignItems: "center", gap: 6,
                      padding: "6px 12px 2px",
                    }}>
                      <span style={{ fontSize: 12 }}>{ARMIES[army]?.symbol}</span>
                      <span style={{
                        fontSize: 10, fontWeight: 700, letterSpacing: 1,
                        color: ARMIES[army]?.color || "#94a3b8",
                      }}>
                        {army.toUpperCase()}
                      </span>
                      <span style={{ fontSize: 9, color: "#475569" }}>({cards.length})</span>
                      <div style={{ flex: 1, height: 1, background: `${ARMIES[army]?.color || "#333"}20`, marginLeft: 4 }} />
                    </div>
                    {cards.map(card => (
                      <CardRow
                        key={card.id}
                        card={card}
                        inDeck={true}
                        onToggle={toggleCard}
                        disabled={false}
                        armyColor={ARMIES[army]?.color}
                      />
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Validation footer */}
          <div style={{
            padding: "12px 16px",
            borderTop: "1px solid #1e293b",
            background: "rgba(15,23,42,0.8)",
          }}>
            {deck.length === MAX_CARDS && totalLeague <= MAX_LEAGUE ? (
              <button style={{
                width: "100%", padding: "12px", borderRadius: 8, border: "none",
                background: "linear-gradient(90deg, #f59e0b, #ef4444)",
                color: "#000", fontWeight: 800, fontSize: 14, letterSpacing: 2,
                cursor: "pointer",
                boxShadow: "0 4px 20px rgba(245,158,11,0.3)",
              }}>
                CONFERMA MAZZO ⚔️
              </button>
            ) : (
              <div style={{ textAlign: "center" }}>
                {deck.length < MAX_CARDS && (
                  <span style={{ fontSize: 11, color: "#64748b" }}>
                    Servono ancora <b style={{ color: "#e2e8f0" }}>{MAX_CARDS - deck.length}</b> carte
                  </span>
                )}
                {deck.length === MAX_CARDS && totalLeague > MAX_LEAGUE && (
                  <span style={{ fontSize: 11, color: "#ef4444", fontWeight: 600 }}>
                    ⚠️ Lega totale supera il limite di {MAX_LEAGUE}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

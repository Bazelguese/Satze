/**
 * Rigenera carte/CARTE.md da src/data/cards.js (fonte canonica).
 * Uso: node scripts/generate-carte-md.mjs
 */
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { ARMY_SETS, ARMY_DECKS } from "../src/data/cards.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", "carte", "CARTE.md");

/** Allineato a src/data/armies.js ARMY_BONUSES.description */
const ARMY_BONUS_LINE = {
  "Figli dell'Orizzonte": "-5 VA nem. (min 6)",
  Kethran: "Rimonta: +2 POT",
  "Corte Rossa": "Copia Bonus nemico",
  "Calibri Pesanti": "-2 DAN nem. (min 2)",
  Orathai: "Resa dei conti: +2 DAN",
  Mounthborn: "Imboscata: +1 POT, +1 DAN",
  "L'Enclave delle Scaglie": "Conquista: +2 FC",
  "Ratti della Megera": "Conquista: Tossina 2 (min 4)",
};

/** Emoji da ARMY_SYMBOLS (armies.js) */
const ARMY_EMOJI = {
  "Figli dell'Orizzonte": "☄️",
  Kethran: "🏛️",
  "Corte Rossa": "🔥",
  "Calibri Pesanti": "⚙️",
  Orathai: "🌙",
  Mounthborn: "🦠",
  "L'Enclave delle Scaglie": "🐉",
  "Ratti della Megera": "🐀",
};

/** Temi (testi descrittivi allineati ai commenti in cards.js) */
const ARMY_THEME = {
  "Figli dell'Orizzonte": "Controllo VA, Focus Coin, cosmico",
  Kethran: "POT, vendetta, aggressività",
  "Corte Rossa": "Copia, blocco, manipolazione, patti",
  "Calibri Pesanti": "Difesa, riduzione danno, immune, resistenza",
  Orathai: "Magia, potenza arcana, equilibrio",
  Mounthborn: "DAN diretto, aggressione, sacrificio",
  "L'Enclave delle Scaglie": "Dominio, nobiltà draconica, tesori, fuoco",
  "Ratti della Megera": "Maledizioni, pestilenza, stregoneria, attrizione",
};

/** Somma leghe decrescente (es. 5+5+4+…) calcolata dai dati reali */
function leagueBreakdownPlusString(cards) {
  return [...cards]
    .map((c) => c.league)
    .sort((a, b) => b - a)
    .join("+");
}

function escapeCell(text) {
  if (text == null) return "";
  return String(text).replace(/\|/g, "\\|").replace(/\r?\n/g, " ").trim();
}

function stripPoterePrefix(description) {
  if (!description) return "";
  return description.replace(/^Potere:\s*/i, "").trim();
}

function statsForCards(cards) {
  const pots = cards.map((c) => c.power);
  const dans = cards.map((c) => c.damage);
  const avg = (arr) => (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1);
  return {
    potAvg: avg(pots),
    potMin: Math.min(...pots),
    potMax: Math.max(...pots),
    danAvg: avg(dans),
    danMin: Math.min(...dans),
    danMax: Math.max(...dans),
    legaSum: cards.reduce((s, c) => s + c.league, 0),
  };
}

function armySection(armyName, cards) {
  const theme = ARMY_THEME[armyName] ?? "";
  const emoji = ARMY_EMOJI[armyName] ?? "";
  const bonus = ARMY_BONUS_LINE[armyName] ?? "?";
  const sorted = [...cards].sort((a, b) => a.id - b.id);
  const st = statsForCards(sorted);
  const breakdown = leagueBreakdownPlusString(sorted);

  let md = `\n---\n\n## ${emoji} ${armyName}\n\n`;
  md += `**Tema:** ${theme}\n`;
  md += `**Bonus armata:** ${bonus}\n`;
  md += `**Lega totale:** ${st.legaSum} (${breakdown})\n\n`;
  md += "| # | Nome | Lega | POT | DAN | Potere | Flavour |\n";
  md += "|---|------|------|-----|-----|--------|---------|\n";

  for (const c of sorted) {
    const potere = escapeCell(stripPoterePrefix(c.description));
    const flavour = escapeCell(c.flavour ?? "");
    md += `| ${c.id} | **${escapeCell(c.name)}** | ${c.league} | ${c.power} | ${c.damage} | ${potere} | ${flavour} |\n`;
  }

  md += "\n### Statistiche armata\n\n";
  md += "| Stat | Media | Min | Max |\n|------|-------|-----|-----|\n";
  md += `| POT | ${st.potAvg} | ${st.potMin} | ${st.potMax} |\n`;
  md += `| DAN | ${st.danAvg} | ${st.danMin} | ${st.danMax} |\n`;

  return md;
}

function decksSection() {
  let md = "\n---\n\n## Mazzi precostruiti\n\n";
  md +=
    "Due mazzi per armata (A / B), 10 carte ciascuno. Definiti in `src/data/cards.js` come `ARMY_DECKS`.\n\n";

  for (const army of Object.keys(ARMY_DECKS)) {
    md += `### ${army}\n\n`;
    for (const key of ["A", "B"]) {
      const deck = ARMY_DECKS[army][key];
      md += `- **${key} — ${deck.name}:** ${deck.description}\n`;
      md += `  - ID carte: \`${deck.cards.join(", ")}\`\n`;
    }
    md += "\n";
  }
  return md;
}

let body = `# SATZE — Catalogo carte

Catalogo generato dai dati di gioco in \`src/data/cards.js\` e bonus armata da \`src/data/armies.js\`. Per modificare nome, statistiche o poteri delle carte, aggiorna il file JS — questo markdown può essere rigenerato con \`node scripts/generate-carte-md.mjs\`.

Note curate su ruoli tipici e sinergie per armata: [\`carte/CARTE_ANALISI.md\`](./CARTE_ANALISI.md).
`;

for (const armyName of Object.keys(ARMY_SETS)) {
  body += armySection(armyName, ARMY_SETS[armyName]);
}

body += decksSection();

body += `\n---\n\n*Generato automaticamente: Maggio 2026*\n`;

writeFileSync(OUT, body, "utf8");
console.log("Written", OUT);

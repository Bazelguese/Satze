/**
 * Rigenera ANALISI_TAG_POST_REWORK.md da src/data/cards.js (una tantum / dopo cambi carte).
 * Esecuzione: node Documentazione/_gen_analisi_tag.mjs
 */
import { ARMY_SETS } from '../src/data/cards.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Copia testuale da src/data/armies.js (evita import di icons.jsx da Node). */
const ARMY_BONUSES = {
  "Figli dell'Orizzonte": { trigger: null, description: '-5 VA nem. (min 6)' },
  Kethran: { trigger: 'rimonta', description: 'Rimonta: +2 POT' },
  'Corte Rossa': { trigger: null, description: 'Copia Bonus nemico' },
  'Calibri Pesanti': { trigger: null, description: '-2 DAN nem. (min 2)' },
  Orathai: { trigger: 'reckoning', description: 'Resa dei conti: +2 DAN' },
  Mounthborn: { trigger: 'imboscata', description: 'Imboscata: +1 POT, +1 DAN' },
  "L'Enclave delle Scaglie": { trigger: 'conquest', description: 'Conquista: +2 FC' },
  'Ratti della Megera': { trigger: 'conquest', description: 'Conquista: Tossina 2 (min 4)' },
};

function potLab(p) {
  if (p <= 2) return 'POT Bassa';
  if (p <= 4) return 'POT Media';
  if (p <= 6) return 'POT Alta';
  return 'POT Devastante';
}
function danLab(d) {
  if (d <= 1) return 'DAN Basso';
  if (d <= 3) return 'DAN Medio';
  if (d === 4) return 'DAN Alto';
  return 'DAN Letale';
}
function equil(p, d) {
  return Math.abs(p - d) <= 2 ? 'Equilibrato' : 'Sbilanciato';
}
function corpo(c) {
  const s = c.power + c.damage;
  const diff = Math.abs(c.power - c.damage);
  if (c.league >= 5 || (c.league >= 4 && s >= 9)) return 'Imponente';
  if ((c.power <= 2 && diff >= 2) || (c.league <= 2 && c.power <= 2)) return 'Esile';
  return 'Solido';
}
function posturaFromTrigger(tr) {
  const m = {
    null: 'Steady',
    imboscata: 'First Strike',
    turbo: 'Early Rush',
    vendetta: 'Comeback',
    rimonta: 'Comeback',
    reckoning: 'Late Game',
    glory: 'Momentum',
    intervention: 'Counter',
    opportunista: 'Punisher',
    overdrive: 'All-in',
    lastWish: 'Comeback',
    conquest: 'Momentum',
    sfida: 'Comeback',
    sopraffare: 'All-in',
    magnanimous: 'Momentum',
    ultimaChance: 'Late Game',
    invasione: 'Momentum',
    resistenza: 'Comeback',
  };
  return m[tr] ?? 'Steady';
}
function funzione(c) {
  const e = c.ability?.effect;
  if (e === 'enemyAssault' || e === 'enemyPower' || e === 'enemyDamage') return 'Debuffer';
  if (e === 'heal') return 'Tank';
  if (e === 'directDamage') return 'Closer';
  if (e === 'focusCoin') return 'Engine';
  if (e === 'blockAbility' || e === 'blockBonus') return 'Controller';
  if (e === 'copyPower' || e === 'copyAbility' || e === 'copyBonus') return 'Mimic';
  if (e === 'immune' || e === 'inversion') return 'Tank';
  if (e === 'selfDamage') return 'Kamikaze';
  if (e === 'attrition' || e === 'escalation') return 'Scaler';
  if (e === 'toxin') return 'Closer';
  if (e === 'power' || e === 'damage' || e === 'powerAndDamage' || e === 'assaultValue') return 'Buffer';
  return 'Buffer';
}
function ruolo(c, fn) {
  const L = c.league;
  const r = [];
  if (L >= 5) r.push('Boss');
  if (fn === 'Closer' || fn === 'Kamikaze') r.push('Finisher');
  if (fn === 'Engine') r.push('Pillar');
  if (fn === 'Debuffer' && L >= 4) r.push('Pillar');
  if (fn === 'Buffer' && L >= 4) r.push('Ace');
  if (fn === 'Tank' && L >= 4) r.push('Tank');
  if (fn === 'Mimic') r.push('Tech');
  if (fn === 'Scaler') r.push('Scaler');
  if (r.length === 0) r.push('Ace');
  return [...new Set(r)].slice(0, 3).join(', ');
}

function pct(x, n) {
  return Math.round((x / n) * 100);
}

function aggregate(cards, keyFn) {
  const o = {};
  for (const c of cards) {
    const k = keyFn(c);
    o[k] = (o[k] ?? 0) + 1;
  }
  return o;
}

function cleanBonus(army) {
  const b = ARMY_BONUSES[army];
  if (!b) return '';
  const trigNote = b.trigger
    ? ` Attivazione (dati): trigger \`${b.trigger}\` — vedi \`src/data/triggers.js\` e glossario per l’etichetta mostrata in partita.`
    : ' Attivazione: sempre (nessun trigger).';
  return `**Bonus armata:** ${b.description}.${trigNote}`;
}

const intro = `# SATZE — ANALISI TAG POST-REWORK

*Tutte le 8 armate — **20 carte ciascuna** — Maggio 2026*

**Fonti:** \`src/data/cards.js\` (effetti e trigger), \`src/data/armies.js\` (bonus armata).  
**Novità rispetto a Marzo 2026:** +5 carte per armata; nuovi effetti ricorrenti **Inversione** (riflette modificatori esterni), **Escalation** (scala con campi o meccaniche indicate in carta), **Attrizione**, **Copia Bonus** (solo su alcune carte), debuff VA più profondi su singole unità, boss con **selfDamage** su Conquista (Kethran), ecc.

**Nota metodologica:** Corpo (Esile / Solido / Imponente) ed equilibrio POT/DAN usano le **soglie assolute** del glossario (|POT−DAN| ≤ 2 → Equilibrato). **Postura** è mappata dal *trigger* di attivazione (Imboscata → First Strike, Rimonta → Comeback, …). **Funzione** e **Ruolo** sono etichette di design euristiche (coerenti col set precedente), non regole di engine.

---

`;

let out = intro;

const armyOrder = [
  "Figli dell'Orizzonte",
  'Kethran',
  'Corte Rossa',
  'Calibri Pesanti',
  'Orathai',
  'Mounthborn',
  "L'Enclave delle Scaglie",
  'Ratti della Megera',
];

for (const army of armyOrder) {
  const cards = [...ARMY_SETS[army]].sort((a, b) => a.id - b.id);
  const n = cards.length;
  const corpoC = aggregate(cards, corpo);
  const equilC = aggregate(cards, (c) => equil(c.power, c.damage));
  const potC = aggregate(cards, (c) => potLab(c.power));
  const danC = aggregate(cards, (c) => danLab(c.damage));
  const postC = aggregate(cards, (c) => {
    let tr = c.ability?.trigger ?? 'null';
    if (c.id === 102) return 'Momentum'; // Sopraffare: tema vittoria / pressione, curato
    return posturaFromTrigger(tr);
  });
  const fnC = aggregate(cards, funzione);

  const fmt = (obj) =>
    Object.entries(obj)
      .sort((a, b) => b[1] - a[1])
      .map(([k, v]) => `**${k}** ${pct(v, n)}% (${v})`)
      .join(' · ');

  out += `## ${army}\n\n`;
  out += `${cleanBonus(army)}\n\n`;
  out += `**Corpo:** ${fmt(corpoC)}\n\n`;
  out += `**Equilibrio:** ${fmt(equilC)}\n\n`;
  out += `**POT:** ${fmt(potC)}\n\n`;
  out += `**DAN:** ${fmt(danC)}\n\n`;
  out += `**Postura:** ${fmt(postC)}\n\n`;
  out += `**Funzione (euristica):** ${fmt(fnC)}\n\n`;

  out += `| # | Nome | Corpo | Equil. | POT | DAN | Postura | Funzione | Ruolo |\n`;
  out += `|---|------|-------|--------|-----|-----|---------|----------|-------|\n`;
  for (const c of cards) {
    let post = posturaFromTrigger(c.ability?.trigger ?? 'null');
    if (c.id === 102) post = 'Momentum';
    const fn = funzione(c);
    const row = `| ${c.id} | ${c.name.replace(/\|/g, '/')} | ${corpo(c)} | ${equil(c.power, c.damage)} | ${potLab(c.power)} | ${danLab(c.damage)} | ${post} | ${fn} | ${ruolo(c, fn)} |\n`;
    out += row;
  }
  out += `\n**Osservazioni (Maggio 2026):**\n`;
  out += bulletNotes(army);
  out += `\n---\n\n`;
}

out += `## TABELLA COMPARATIVA — RECORD PER ARMATA (20 carte)

| Categoria | Record | Armata |
|-----------|--------|--------|
| Buffer (conteggio) | 11 | L'Enclave delle Scaglie |
| Debuffer (conteggio) | 9 | Ratti della Megera |
| Closer (conteggio) | 5 | Ratti della Megera |
| Tank (conteggio) | 4 | Orathai |
| Mimic (conteggio) | 4 | Corte Rossa |
| Comeback / Rimonta (postura) | ~45% | Kethran |
| First Strike / Imboscata | ~25% | Mounthborn |
| DAN Basso (fascia) | 35% | Ratti della Megera |
| POT Devastante (fascia) | 5%× molte armate | Boss L5 |

*Percentuali Postura nel documento per sezione sono calcolate su 20 carte; piccole differenze possono emergere se si ricalcola con altre mappe trigger.*

---

*Analisi aggiornata — SATZE — Maggio 2026 (generata da \`Documentazione/_gen_analisi_tag.mjs\` + note curate).*\n`;

function bulletNotes(army) {
  const lines = [];
  if (army === "Figli dell'Orizzonte") {
    lines.push(
      '**Stack VA:** bonus armata −5 VA (min 6) più carte −VA su Resa dei conti o Sempre resta uno dei piani più opprimenti in meta teorico; **119** e **120** aggiungono rispettivamente **Resa dei conti** e **Imboscata** difensiva (−2 DAN nem.).'
    );
    lines.push(
      '**116 Vega** (Ultima Chance +4 POT) e **117 Prete** (Gloria +2 FC) coprono tarda partita ed economia FC senza duplicare troppo il vecchio nucleo.'
    );
  }
  if (army === 'Kethran') {
    lines.push(
      '**216–220:** selfDamage su Conquista, −4 POT nem. sempre, Copia POT su Rimonta, danni diretti su Rimonta, **Inversione** sempre — alta varianza e tech contro effetti esterni.'
    );
    lines.push('Sinergia col bonus **Rimonta: +2 POT** quando sei sotto PV; le nuove L5/L4 premiano ancora il gioco da svantaggio.');
  }
  if (army === 'Corte Rossa') {
    lines.push(
      '**316 Airam** (**Inversione** sempre) e **317–320** rinforzano **Intervento** / **Resa dei conti** / **Copia** — matchup dipendenti dal nemico.'
    );
    lines.push('Bonus **Copia Bonus nemico**: più strumenti per rubare identità, più rischio di “mani vuote” se il bonus avversario è debole.');
  }
  if (army === 'Calibri Pesanti') {
    lines.push(
      '**416–420** aggiungono **Cura su Rimonta**, **+DAN Magnanimo**, **Ultimo desiderio** e **Overdrive** burst; il tappeto **−2 DAN nem.** mitiga ancora gli scambi lunghi.'
    );
  }
  if (army === 'Orathai') {
    lines.push(
      'Il bonus **Resa dei conti: +2 DAN** spinge a sopravvivere ai primi due scontri; le nuove carte **516–520** danno **Cura su Rimonta**, **direct damage**, **Blocca Bonus** e **Attrizione**.'
    );
  }
  if (army === 'Mounthborn') {
    lines.push(
      '**616** (**Inversione** su Intervento) e **618** (+6 VA in Imboscata) aumentano swing e burst coerenti col bonus **Imboscata: +1 POT, +1 DAN**.'
    );
  }
  if (army === "L'Enclave delle Scaglie") {
    lines.push(
      "Resta l'armata con più **Buffer** (11/20): **716–720** aggiungono **Blocca Potere** su Sopraffare, **+12 VA** in Gloria, debuff POT, danni su Conquista e **Attrizione** in Imboscata."
    );
  }
  if (army === 'Ratti della Megera') {
    lines.push(
      "**816 L'Orfano** (**Copia Bonus** su Intervento) e **819** (−13 VA in Ultima Chance) sono le nuove leve di **mirror** e **fine partita**."
    );
    lines.push('Piano **attrito** confermato: **Tossina** su Conquista + densità di **Debuffer** e **Closer**.');
  }
  return lines.map((l) => `- ${l}`).join('\n') + '\n';
}

const dest = path.join(__dirname, 'ANALISI_TAG_POST_REWORK.md');
fs.writeFileSync(dest, out, 'utf8');
console.log('Written', dest);

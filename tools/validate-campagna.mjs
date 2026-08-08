#!/usr/bin/env node
/**
 * Validatore dati campagna SATZE
 * Uso: node validate-campagna.mjs <file-dati-atto.js> [--cards ../src/data/cards.js]
 * Exit code 1 se ci sono ERRORI (0 se solo AVVISI) → utilizzabile in CI / pre-build.
 */
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const args = process.argv.slice(2);
const actPath = args[0];
const cardsPath = args.includes('--cards') ? args[args.indexOf('--cards') + 1] : 'src/data/cards.js';
if (!actPath) { console.error('Uso: node validate-campagna.mjs <file-dati-atto.js> [--cards path]'); process.exit(2); }

// pathToFileURL: su Windows i percorsi assoluti devono essere URL file://
const { ACT } = await import(pathToFileURL(path.resolve(actPath)).href);
const { ARMY_SETS } = await import(pathToFileURL(path.resolve(cardsPath)).href);

// ---- indice carte ----
const CARDS = new Map();
for (const [army, list] of Object.entries(ARMY_SETS)) for (const c of list) CARDS.set(c.id, { ...c, army });

const errors = [], warns = [];
const E = (code, msg) => errors.push(`[${code}] ${msg}`);
const W = (code, msg) => warns.push(`[${code}] ${msg}`);

// ---- regole di dominio (dai documenti di design) ----
const POST_CLASH = new Set(['conquest', 'lastWish']);      // si risolvono dopo lo scontro
const SELF_BUFF  = new Set(['power', 'damage', 'powerAndDamage', 'assaultValue',
                            'enemyPower', 'enemyDamage', 'enemyAssault', 'blockAbility', 'blockBonus']);
const MATRICE = { triggers: ['turbo','imboscata','vendetta','invasione'],
                  effects: ['power','directDamage','focusCoin','enemyPower'] };
const CAP_EFFETTO = { power: 4, directDamage: 4, focusCoin: 3, enemyPower: 4 };
const MS = { turbo: .85, imboscata: .90, vendetta: .80, invasione: .75 };
const FCPT = { power: .50, directDamage: .50, focusCoin: .70, enemyPower: .40 };
const SOGLIE = { 2: 2.90, 3: 4.35, 4: 5.80, 5: 7.25 };
const body = (p, d) => p * .5 + d * .35;
const legaDa = v => { for (const L of [2,3,4,5]) if (v <= SOGLIE[L]) return L; return 6; };

// ---- 1. GRAFO DEI NODI ----
const nodeIds = new Set(ACT.nodes.map(n => n.id));
for (const n of ACT.nodes) {
  for (const r of n.requires || []) if (!nodeIds.has(r)) E('NODO_REQ', `${n.id} richiede "${r}" che non esiste`);
  for (const u of n.unlocks || []) if (!nodeIds.has(u)) E('NODO_UNL', `${n.id} sblocca "${u}" che non esiste`);
}
// raggiungibilità dall'ingresso
const entry = ACT.nodes.filter(n => !(n.requires || []).length).map(n => n.id);
if (!entry.length) E('NODO_ENTRY', 'Nessun nodo iniziale (tutti hanno requires)');
const seen = new Set(entry), queue = [...entry];
while (queue.length) {
  const curId = queue.shift(); // shift PRIMA del find: dentro il predicato consumerebbe più elementi
  const cur = ACT.nodes.find(n => n.id === curId);
  for (const u of cur?.unlocks || []) if (!seen.has(u)) { seen.add(u); queue.push(u); }
}
for (const n of ACT.nodes) if (!seen.has(n.id)) E('NODO_ORFANO', `${n.id} "${n.title}" non è raggiungibile dall'ingresso`);
// boss presente e raggiungibile
if (!ACT.nodes.some(n => n.type === 'boss')) E('NODO_BOSS', "L'Atto non ha un nodo boss");

// ---- 2. MISSIONI ----
const nodeHasMission = new Set();
for (const m of ACT.missions) {
  if (!nodeIds.has(m.node)) E('MIS_NODO', `${m.id} punta al nodo "${m.node}" inesistente`);
  nodeHasMission.add(m.node);
  // carte esistenti + coerenza armata
  for (const id of m.enemy?.deck || []) {
    const c = CARDS.get(id);
    if (!c) { E('MIS_CARTA', `${m.id}: carta ${id} non esiste in cards.js`); continue; }
    if (m.enemy.army && c.army !== m.enemy.army)
      W('MIS_ARMATA', `${m.id}: carta ${id} "${c.name}" è di ${c.army}, non ${m.enemy.army}`);
  }
  // taglia mazzo e Campi
  const dk = (m.enemy?.deck || []).length;
  if (dk && m.playerDeckSize && Math.abs(dk - m.playerDeckSize) > 1)
    W('MIS_TAGLIA', `${m.id}: mazzo nemico ${dk} vs giocatore ${m.playerDeckSize} (scarto >1)`);
  const minSide = Math.min(dk || 99, m.playerDeckSize || 99);
  if (m.fields > minSide) E('MIS_CAMPI', `${m.id}: ${m.fields} Campi ma il lato più piccolo ha ${minSide} carte (Campi non contendibili)`);
  if (m.fields % 2 === 0) W('MIS_PARI', `${m.id}: ${m.fields} Campi (numero pari → pareggio possibile in Dominazione)`);
  // FATTIBILITÀ ANNIENTAMENTO
  if (m.objective === 'annientamento') {
    const dmg = (m.enemy?.deck || []).map(id => CARDS.get(id)?.damage || 0).sort((a,b)=>b-a);
    const maxDanno = dmg.slice(0, m.fields).reduce((a,b)=>a+b, 0); // stima ottimistica: vince tutti gli scontri
    const life = m.enemy?.life ?? 25;
    if (maxDanno < life)
      E('MIS_ANN', `${m.id}: Annientamento impossibile — danno massimo teorico ${maxDanno} < ${life} PV nemici. Fissare "life" ridotta per la missione.`);
    else if (maxDanno < life * 1.3)
      W('MIS_ANN_STRETTO', `${m.id}: Annientamento fattibile solo vincendo quasi tutti gli scontri (${maxDanno} vs ${life} PV)`);
  }
}
for (const n of ACT.nodes) if (n.type !== 'narrativo' && !nodeHasMission.has(n.id))
  W('NODO_SENZA_MIS', `${n.id} "${n.title}" non ha missione associata`);

// ---- 3. EVENTI ----
const misIds = new Set(ACT.missions.map(m => m.id));
for (const ev of ACT.events) {
  const t = ev.trigger || {};
  if (t.type === 'afterMission' && !misIds.has(t.mission))
    E('EV_TRIGGER', `${ev.id}: si attiva dopo la missione "${t.mission}" che non esiste → evento irraggiungibile`);
  if (t.type === 'day' && ACT.dayLimit && t.day > ACT.dayLimit)
    E('EV_GIORNO', `${ev.id}: giorno ${t.day} oltre il limite dell'Atto (${ACT.dayLimit})`);
  if (ev.window) {
    const [a, b] = ev.window;
    if (a > b) E('EV_FINESTRA', `${ev.id}: finestra invertita [${a},${b}]`);
    if (ACT.dayLimit && b > ACT.dayLimit) E('EV_FINESTRA_LIM', `${ev.id}: finestra oltre il limite dell'Atto (${b} > ${ACT.dayLimit})`);
  }
  if (!ev.choices?.length) W('EV_VUOTO', `${ev.id}: nessuna scelta definita`);
  if (ev.choices?.length === 1) W('EV_MONO', `${ev.id}: una sola scelta (non è una decisione)`);
}

// ---- 4. NASCENTE: matrice, cap, soglie di Lega ----
const N = ACT.nascente || {};
let stats = { ...(N.startStats || { power: 2, damage: 2 }) };
let ability = null;
const applyAndCheck = (label) => {
  const v = body(stats.power, stats.damage) + (ability ? ability.value * FCPT[ability.effect] * MS[ability.trigger] : 0);
  const L = legaDa(v);
  if (N.leagueCap && L > N.leagueCap)
    E('NASC_LEGA', `${label}: valore ${v.toFixed(2)} → L${L}, oltre il cap dell'Atto (L${N.leagueCap}). Soglia L${N.leagueCap} = ${SOGLIE[N.leagueCap]}`);
  return { v, L };
};
for (const ev of ACT.events) for (const ch of ev.choices || []) {
  const n = ch.effect?.nascente; if (!n) continue;
  if (n.acquire) {
    const { trigger, effect, value } = n.acquire;
    if (!MATRICE.triggers.includes(trigger))
      E('NASC_MATRICE_T', `${ev.id}/"${ch.label}": trigger "${trigger}" fuori dalla matrice 4×4 (${MATRICE.triggers.join(', ')})`);
    if (!MATRICE.effects.includes(effect))
      E('NASC_MATRICE_E', `${ev.id}/"${ch.label}": effetto "${effect}" fuori dalla matrice 4×4`);
    if (POST_CLASH.has(trigger) && SELF_BUFF.has(effect))
      E('TIMING', `${ev.id}/"${ch.label}": "${trigger}" si risolve dopo lo scontro — non può modificare "${effect}"`);
    if (value !== 1) W('NASC_ACQ', `${ev.id}/"${ch.label}": acquisizione a valore ${value} (atteso 1)`);
    if (MATRICE.triggers.includes(trigger) && MATRICE.effects.includes(effect)) { ability = { trigger, effect, value }; applyAndCheck(`${ev.id} acquisizione`); }
  }
  if (n.upgrade && ability) {
    ability.value += n.upgrade;
    if (ability.value > CAP_EFFETTO[ability.effect])
      E('NASC_CAP', `${ev.id}/"${ch.label}": effetto "${ability.effect}" a ${ability.value}, oltre il cap del pool (${CAP_EFFETTO[ability.effect]})`);
    applyAndCheck(`${ev.id} potenziamento`);
  }
  if (n.stats) {
    stats = { power: stats.power + (n.stats.power || 0), damage: stats.damage + (n.stats.damage || 0) };
    const { v, L } = applyAndCheck(`${ev.id} stat`);
    if (stats.power > 7) E('NASC_POT', `${ev.id}: POT ${stats.power} oltre il cap del pool (7)`);
    if (stats.damage > 6) E('NASC_DAN', `${ev.id}: DAN ${stats.damage} oltre il cap del pool (6)`);
  }
}

// ---- report ----
const tag = errors.length ? 'FALLITA' : (warns.length ? 'CON AVVISI' : 'OK');
console.log(`\n=== Validazione ${ACT.id || actPath}: ${tag} ===`);
if (errors.length) { console.log(`\nERRORI (${errors.length}) — bloccanti:`); errors.forEach(e => console.log('  ✗ ' + e)); }
if (warns.length) { console.log(`\nAVVISI (${warns.length}) — da valutare:`); warns.forEach(w => console.log('  ⚠ ' + w)); }
if (!errors.length && !warns.length) console.log('  Nessun problema rilevato.');
console.log();
process.exit(errors.length ? 1 : 0);

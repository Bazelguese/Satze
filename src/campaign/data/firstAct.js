// Profile 0.25: provisional data, independent of the legacy balance evaluator.
import { concordiaCardById, CONCORDIA_CARDS, CONCORDIA_ARMY } from './concordia.js';
import { ARMY_SETS } from '../../data/cards.js';
import { ALL_BATTLEFIELDS } from '../../data/battlefields.js';
export const FIRST_ACT_VERSION = '0.25';
export const NASCENTE = 9001;
export const FIGLI = "Figli dell'Orizzonte";
export const TOWER_ID = 9201;
export const VARCO_ID = 9200;
export const SPECIAL_FIELDS = [
  { id: VARCO_ID, name: 'Il primo varco', description: 'Conquista: Vinci la partita.', effect: 'Conquista: Vinci la partita.', category: 'neutral', campaignOnly: true, bgImage: './campi_bg/campo-9200.webp' },
  { id: TOWER_ID, name: 'Torre del Richiamo', description: 'Staffetta è soddisfatto. Disponibilità e blocchi restano validi.', effect: 'Staffetta è soddisfatto.', category: 'special', campaignOnly: true, forceStaffetta: true, bgImage: './campi_bg/campo-9201.webp' },
];
export const campaignField = id => [...SPECIAL_FIELDS, ...ALL_BATTLEFIELDS].find(f => f.id === id);
export const codes = text => text.split(' ').map(code => {
  const c = CONCORDIA_CARDS.find(c => c.code === code);
  if (!c) throw new Error(`Codice Concordia sconosciuto: ${code}`);
  return c.id;
});
export function firstActCard(id) {
  let c = concordiaCardById(id) || Object.entries(ARMY_SETS).flatMap(([army, cards]) => cards.map(c => ({ ...c, army: c.army || army }))).find(c => c.id === id);
  if (!c) return null;
  if (c.army === CONCORDIA_ARMY) c = {...c, armyBonusOverride: {trigger:'staffetta',effects:[{effect:'power',value:1}],description:'Staffetta: +1 POT'}};
  if (c.code === 'V01' || c.code === 'V05') return { ...c, ability: { ...c.ability, trigger: 'staffetta' }, description: c.code === 'V01' ? 'Staffetta: +3 VA' : 'Staffetta: +1 DAN' };
  if (c.code === 'G03') return { ...c, league: 3, ability: { trigger: 'resistenza', effect: 'terraform', value: TOWER_ID }, description: 'Resistenza: Terraformare Torre del Richiamo' };
  return c;
}
const battle = (id, title, roster, size, opts = {}) => ({ id, node: id, title, kind: 'battle', army: CONCORDIA_ARMY, roster: codes(roster), size, required: [], fieldIds: [8, 12, 2, TOWER_ID, 4], revealRounds: [1, 1, 1, 3, 4], life: 25, focus: 18, difficulty: 'medium', winRule: 'classic', ...opts });
export const FIRST_ACT_NODES = [
  battle('I1', 'Primo contatto', 'V02', 1, { growth: 2, life: 10, focus: 10, fieldIds: [VARCO_ID], revealRounds: [1], winRule: 'varco', difficulty: 'easy', openingPlayerFirst: false }),
  battle('I2', 'Pattuglia', 'V01 V04', 2, { growth: 3, life: 10, focus: 10, fieldIds: [8, 12], revealRounds: [1, 1], winRule: 'territory', difficulty: 'easy' }),
  battle('I3', 'Presidio', 'V02 V03 V06', 3, { growth: 4, life: 10, focus: 10, fieldIds: [8, 12, 2], revealRounds: [1, 1, 1], winRule: 'territory' }),
  battle('I4', 'Posto di blocco', 'V01 V03 V04 V05', 4, { growth: 5, life: 10, focus: 10, fieldIds: [8, 12, 2, 4], revealRounds: [1, 1, 1, 3], winRule: 'territory' }),
  { id: 'E01', title: 'La prima Domanda', kind: 'event' },
  battle('I5A', 'Il deposito delle corazze', 'V01 V02 V03 V04 V05', 5, { plan: 'riserve' }),
  battle('I5B', 'La colonna dei rifornimenti', 'V01 V02 V03 V04 V05', 5, { plan: 'corazze' }),
  battle('I6', 'La seconda campana', 'V01 V02 V04 V05 G03', 5, { growth: 6 }),
  { id: 'E02', title: 'La forma dello sforzo', kind: 'event' },
  battle('F1', 'La prima frattura', 'V01', 6, { kind: 'faglia', army: 'Calibri Pesanti', roster: [407, 408, 410, 421, 404, 405], required: [405], fieldIds: [8, 12, 2, 1, 4] }),
  battle('I7', 'Il presidio interno', 'V01 V02 V04 V05 V06 G01', 6, { required: codes('G01') }),
  battle('I8', 'La livrea dell’aurora', 'V01 V02 V04 V05 G01 G03', 6, { kind: 'elite', required: codes('G01 G03'), life: 27, growth: 7, difficulty: 'hard' }),
  { id: 'E06', title: 'Prigionieri del Vallo', kind: 'event' },
  battle('I9A', 'Arena del Sole', 'V01 V02 V04 V05 G01 G02 G03', 7, { required: codes('G02 G03'), growth: 8, plan: 'tenuta' }),
  battle('I9B', 'Custodia del Vallo', 'V01 V02 V04 V05 G01 G04 G03', 7, { required: codes('G04 G03'), growth: 8, plan: 'assalto' }),
  battle('F2', 'La scala impossibile', 'V01', 8, { kind: 'faglia', optional: true, army: 'Kethran', roster: [207, 209, 210, 221, 204, 205, 206, 222], required: [204, 221], fieldIds: [8, 12, 2, 1, 4] }),
  battle('I10', 'La breccia', 'V01 V02 V04 V05 G01 G02 G03 R01', 8, { required: codes('R01 G03'), growth: 9 }),
  battle('I11', 'La guardia della corona', 'V01 V02 V04 V05 G01 G02 G03 R01 R02', 9, { kind: 'elite', required: codes('R02 G03'), life: 27, growth: 10, difficulty: 'hard' }),
  { id: 'E03', title: 'Risonanza', kind: 'event' },
  battle('I12', 'La Corona Vuota', 'V01 V02 V04 V05 G01 G02 G03 R01 R02 N01', 10, { kind: 'boss', life: 29, difficulty: 'hard', signature: codes('N01')[0], squads: [codes('N01 G03 G01 V01 V05'), codes('N01 G02 R01 R02 V04')] }),
];
export const FIRST_ACT_STAGES = [['I1'], ['I2'], ['I3'], ['I4'], ['E01'], ['I5A', 'I5B'], ['I6'], ['E02'], ['F1'], ['I7'], ['I8'], ['E06'], ['I9A', 'I9B'], ['F2'], ['I10'], ['I11'], ['E03'], ['I12']];
export const firstActNode = id => FIRST_ACT_NODES.find(n => n.id === id);
const power = (id, family, answer, trigger, effect, value, extra = {}) => ({ id, family, answer, ability: { trigger, effect, value, ...extra } });
export const POWER_PACKAGES = [
  power('C1', 'Sulla forza con cui mi impongo.', 'Prendendo l’iniziativa.', 'imboscata', 'power', 2),
  power('C2', 'Sulla forza con cui mi impongo.', 'Concentrando lo sforzo all’apertura.', 'turbo', 'assaultValue', 6),
  power('A1', 'Sulla forza di ogni colpo.', 'Quando sono io a scegliere per primo.', 'imboscata', 'damage', 2),
  power('A2', 'Sulla forza di ogni colpo.', 'Quando rischio di essere sopraffatto.', 'rimonta', 'powerAndDamage', 1),
  power('S1', 'Sui limiti che impongo al nemico.', 'Riducendone la forza prima che reagisca.', 'imboscata', 'enemyPower', -2, { minPower: 2 }),
  power('S2', 'Sui limiti che impongo al nemico.', 'Contendendogli il terreno dopo la sua avanzata.', 'resistenza', 'enemyAssault', -6, { minAssault: 5 }),
  power('G1', 'Sulla capacità di resistere.', 'Recuperando dopo una conquista nemica.', 'resistenza', 'heal', 2),
  power('G2', 'Sulla capacità di resistere.', 'Rispondendo al colpo che sta preparando.', 'intervention', 'enemyDamage', -2, { minDamage: 1 }),
  power('K1', 'Sul prezzo che faccio pagare.', 'Appena prendo l’iniziativa.', 'imboscata', 'directDamage', 2),
  power('K2', 'Sul prezzo che faccio pagare.', 'Anche quando riesce a battermi.', 'lastWish', 'directDamage', 3),
  power('F1', 'Sulle risorse per continuare.', 'Preparando subito le prossime mosse.', 'turbo', 'focusCoin', 1),
  power('F2', 'Sulle risorse per continuare.', 'Ricavando risorse dalle vittorie.', 'conquest', 'focusCoin', 2),
  power('B1', 'Sulla rottura dei loro accordi.', 'Dopo aver visto la sua scelta.', 'intervention', 'blockBonus', null),
  power('B2', 'Sulla rottura dei loro accordi.', 'Nei primi momenti dello scontro.', 'turbo', 'blockBonus', null),
  power('O1', 'Sul peso che accetto di portare.', 'Accetto il prezzo di ogni conquista.', 'conquest', 'selfDamage', 3),
];

// Validate working encounter data before committing a new run. Balancing remains separate.
export function validateFirstActData(nodes = FIRST_ACT_NODES) {
  const ids = new Set(nodes.map(n => n.id));
  if (ids.size !== nodes.length || FIRST_ACT_STAGES.flat().some(id => !ids.has(id))) throw new Error('Mappa del primo atto incompleta.');
  for (const node of nodes) {
    if (node.kind === 'event') continue;
    if (node.roster.length !== node.size || new Set(node.roster).size !== node.size) throw new Error(`${node.id}: roster non valido.`);
    if (node.roster.some(id => !Number.isFinite(firstActCard(id)?.league))) throw new Error(`${node.id}: agente o Lega assente.`);
    if (node.required.length > 5 || new Set(node.required).size !== node.required.length || node.required.some(id => !node.roster.includes(id))) throw new Error(`${node.id}: garanzie non valide.`);
    if (node.fieldIds.length !== Math.min(5,node.size) || node.revealRounds.length !== node.fieldIds.length || node.fieldIds.some(id => !campaignField(id))) throw new Error(`${node.id}: Campi incompleti.`);
    for (let round=1;round<=Math.min(5,node.size);round++) {
      if (node.revealRounds.filter(r => r<=round).length < round) throw new Error(`${node.id}: nessun Campo disponibile al round ${round}.`);
    }
    if (!Number.isFinite(node.life) || !Number.isFinite(node.focus) || node.life<=0 || node.focus<Math.min(5,node.size)) throw new Error(`${node.id}: risorse non valide.`);
    if (node.squads?.some(s => s.length!==5 || new Set(s).size!==5 || s.some(id => !node.roster.includes(id)))) throw new Error(`${node.id}: squadra non valida.`);
  }
  return true;
}

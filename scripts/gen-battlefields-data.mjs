/**
 * Genera src/data/battlefieldsData.js da CAMPI_MASTER (incollato sotto).
 * Run: node scripts/gen-battlefields-data.mjs
 */
import { writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const ICON_BY_ID = {
  1: 'wave', 2: 'moon', 3: 'sparkle', 4: 'crystal', 5: 'egg', 6: 'temple', 7: 'mirror', 8: 'ghost',
  9: 'wave', 10: 'tower', 11: 'sword', 12: 'castle', 13: 'wolf', 14: 'block', 15: 'copy', 16: 'hole',
  17: 'temple', 18: 'book', 19: 'galaxy', 20: 'circle', 21: 'sparkle', 22: 'brick', 23: 'temple',
  24: 'scroll', 25: 'imp', 26: 'flame', 27: 'hole', 28: 'lightning', 29: 'warning', 30: 'copy',
  31: 'sparkle', 32: 'mirror', 33: 'insect', 34: 'circle', 35: 'moon', 36: 'vortex', 37: 'star',
  38: 'crown', 39: 'brick', 40: 'scales', 41: 'vortex', 42: 'skull', 43: 'insect', 44: 'lightning',
  45: 'star', 46: 'wave', 47: 'scales', 48: 'insect', 49: 'circle', 50: 'bone',
  51: 'sword', 52: 'dove', 53: 'castle', 54: 'tower', 55: 'flame',
  56: 'crown', 57: 'flame', 58: 'tree', 59: 'bone', 60: 'crystal', 61: 'crown', 62: 'sword',
  63: 'dragon', 64: 'egg', 65: 'tower', 66: 'hole', 67: 'castle', 68: 'crown', 69: 'wave',
  70: 'temple', 71: 'ghost', 72: 'road', 73: 'bridge', 74: 'circle', 75: 'hole', 76: 'coin',
  77: 'block', 78: 'temple', 79: 'star', 80: 'shield', 81: 'temple', 82: 'ghost', 83: 'scroll',
};

/** @type {Array<{id:number,name:string,effect:string,category:string,rarita:string,tema:string,minTurn:number}>} */
const MASTER = [
  [1,'Gran Corno','In scontro · Entrambi · +4 POT','values','raro','generico',1],
  [2,'Altopiano delle Tre Lune','In scontro · Entrambi · −1 POT, +1 DAN','values','comune','generico',1],
  [3,'Arena degli Gnomi','Poteri annullati','limit','raro','generico',1],
  [4,'Miniera di Lacrime','Vincitore: +2 PV','conditional','comune','generico',2],
  [5,"Nido dell'Antico",'In scontro · Entrambi · −2 DAN','values','comune','generico',1],
  [6,'Tempio del Monaco Pazzo','Bonus annullati','limit','raro','generico',1],
  [7,'Sala degli Specchi','In scontro · Entrambi · POT scambiate','values','special','generico',1],
  [8,'Cripta dei Sussurri','Perdente: +1 FC','conditional','comune','generico',1],
  [9,'Porte di Atlantide','FC raddoppiati nel calcolo VA','focus','special','generico',1],
  [10,'Nido di Spine','Vincitore: -5 PV','conditional','raro','generico',1],
  [11,'Canyon delle Lame','Vincitore: +2 DAN extra','conditional','comune','generico',1],
  [12,"Torre d'Avorio",'Vincitore: +1 FC','conditional','comune','generico',1],
  [13,'Fossa dei Leoni','In scontro · Entrambi · +2 DAN','values','comune','generico',1],
  [14,'Santuario del Silenzio','Poteri e Bonus annullati','limit','special','generico',1],
  [15,'Nexus Arcano','DAN massimo = 4','limit','raro','generico',1],
  [16,'Voragine Infinita','Entrambi: -3 PV dopo lo scontro','conditional','comune','generico',2],
  [17,'Altare del Sacrificio','Perdente: 2 Danni dir. extra','conditional','comune','generico',1],
  [18,'Biblioteca Proibita','In scontro · Chi investe meno FC · +5 VA','values','special','generico',1],
  [19,'Nebulosa dei Ricordi','In scontro · Entrambi · +1 POT','values','comune',"Figli dell'Orizzonte",1],
  [20,'Orlo del Buco Nero','In scontro · Entrambi · POT e DAN invertiti','values','special',"Figli dell'Orizzonte",1],
  [21,'Cimitero di Stelle','In scontro · Entrambi · −2 VA','values','comune',"Figli dell'Orizzonte",1],
  [35,'Frammento Oscurato','In scontro · Entrambi · −2 POT, −2 DAN','values','raro',"Figli dell'Orizzonte",1],
  [36,'Il Pozzo Gravitazionale','FC investiti max 3','limit','special',"Figli dell'Orizzonte",1],
  [37,'Trono Solare','Vincitore: +1 PV','conditional','comune',"Figli dell'Orizzonte",2],
  [22,'Fondamenta della Torre','Gloria e Vendetta sempre attivi','trigger','raro','Kethran',2],
  [23,'Ziqqurat Spezzata','Perdente: +1 FC','conditional','comune','Kethran',1],
  [24,'Biblioteca delle Lingue Perdute','Blocca Potere/Bonus non funzionano','limit','raro','Kethran',1],
  [38,'Trono dei Re Caduti','Vincitore: 1 Danni dir. a sé','conditional','comune','Kethran',1],
  [39,'Mura della Sfida','Rimonta sempre attiva per entrambi','trigger','raro','Kethran',2],
  [56,'Falso idolo','Chi è sotto nei PV: +3 VA','conditional','raro','Kethran',2],
  [25,'Sala dei Contratti','Vincitore: -2 FC','conditional','comune','Corte Rossa',1],
  [26,'Trono di Cenere','In scontro · Entrambi · +1 DAN','values','comune','Corte Rossa',1],
  [27,'Fossa dei Traditori','Effetti Copia annullati','limit','raro','Corte Rossa',1],
  [40,'Tribunale dell\'Anima','Perdente: -1 FC','conditional','comune','Corte Rossa',1],
  [41,'Crocevia dei Patti','Poteri si attivano senza trigger','trigger','special','Corte Rossa',1],
  [42,'Mercato delle Anime','In scontro · Entrambi · −3 POT (min 1)','values','raro','Corte Rossa',1],
  [28,'Mura EMP','Immune non funziona','limit','raro','Calibri Pesanti',1],
  [29,'Nucleo del Reattore','Overdrive si attiva con 4 FC','trigger','raro','Calibri Pesanti',1],
  [30,'Deposito di Rottami','Perdente: +1 FC','conditional','comune','Calibri Pesanti',2],
  [43,'Firewall Centrale','DAN diretti annullati','limit','raro','Calibri Pesanti',1],
  [44,'Centrale Energetica','Overdrive: +1 DAN extra','conditional','comune','Calibri Pesanti',1],
  [57,'La Grande Forgia','Cura 1 PV a chi ha meno PV dopo lo scontro','conditional','comune','Calibri Pesanti',2],
  [31,'Convergenza delle Ley','Magnanimo sempre attivo per entrambi','trigger','raro','Orathai',1],
  [32,'Radura dell\'Anima','Annulla modificatori POT e DAN','limit','special','Orathai',1],
  [45,'Cerchio di Evocazione','Intervento sempre attivo per entrambi','trigger','raro','Orathai',1],
  [46,'Fonte del Mana','+1 FC a entrambi dopo lo scontro','conditional','comune','Orathai',2],
  [47,'Sanctum dell\'Equilibrio','In scontro · Lega più alta · −5 VA','values','raro','Orathai',1],
  [58,"L'Albero del Giudizio",'Resa dei conti sempre attiva per entrambi','trigger','raro','Orathai',1],
  [33,'Nido della Regina','In scontro · Entrambi · DAN dir. +1','values','comune','Nati dalla Bocca',1],
  [34,'Pianura Divorata','Cura 1 PV a entrambi dopo lo scontro','conditional','comune','Nati dalla Bocca',2],
  [48,'Palude Tossica','Entrambi: -1 PV dopo lo scontro','conditional','comune','Nati dalla Bocca',2],
  [49,'Alveare Abbandonato','Imboscata sempre attiva per entrambi','trigger','raro','Nati dalla Bocca',1],
  [50,'Terreno di Caccia','In scontro · Entrambi · +2 DAN','values','comune','Nati dalla Bocca',1],
  [59,'Le Grandi Fauci','Imboscata e Intervento con tempistiche invertite (Imboscata→2° giocato · Intervento→1°)','limit','raro','Nati dalla Bocca',1],
  [60,'Volta del Tesoro','+2 FC a entrambi dopo lo scontro','conditional','comune','Enclave delle Scaglie',2],
  [61,'Trono d\'Ossidiana','Gli effetti con trigger Conquista valgono doppio (entrambi)','conditional','raro','Enclave delle Scaglie',1],
  [62,'Arena delle Scaglie','Vince il duello chi ha investito più FC (ignora il VA)','focus','special','Enclave delle Scaglie',1],
  [63,'Caverna del Wyrm','POT massima = 5','limit','raro','Enclave delle Scaglie',1],
  [64,'Cova di Scaglie','L\'agente giocato per primo: +1 POT','conditional','comune','Enclave delle Scaglie',1],
  [65,'Picco del Drago Caduto','Vincitore: +1 FC e -2 PV','conditional','raro','Enclave delle Scaglie',1],
  [66,'Fogna Maestra','I "minimi" degli effetti sul campo sono ridotti di 1','limit','raro','Ratti della Megera',1],
  [67,'Reggia del Custode','FC dimezzati (per eccesso) nel calcolo VA','focus','special','Ratti della Megera',1],
  [68,'Trono della Megera','Ultimo Desiderio si attiva 2 volte (entrambi)','trigger','raro','Ratti della Megera',1],
  [69,'Lago dei Miasmi','In scontro · Chi ha più POT · −1 POT','values','comune','Ratti della Megera',1],
  [70,'Cattedrale del Decadimento','Il Bonus armata è sostituito da "Conquista: Tossina 2 (min 10)"','limit','raro','Ratti della Megera',1],
  [71,'Decadente Catrelburg','In scontro · Chi ha meno POT · +5 VA','values','raro','Ratti della Megera',1],
  [72,"L'Ultrastrada",'Turbo sempre attivo per entrambi','trigger','raro','Patto degli Indocili',1],
  [73,'Ponte dei Vandali','Turbo e Ultima Chance con tempistiche invertite','limit','raro','Patto degli Indocili',1],
  [74,'Il Circuito','Primo giocato: Potere trigger Sfida · Secondo: Sopraffare','limit','raro','Patto degli Indocili',1],
  [75,'Undicesima Megalopoli','In scontro · Entrambi · −1 POT, −3 VA','values','comune','Patto degli Indocili',1],
  [76,"L'Ultimo Distributore",'Ogni 3 FC investiti: +1 DAN','focus','comune','Patto degli Indocili',1],
  [77,'Posto di Blocco','L\'agente giocato per secondo perde il Potere','limit','raro','Patto degli Indocili',1],
  [78,'Tempio di Cobalto','In scontro · Entrambi · +4 VA','values','raro','Khemet',1],
  [79,'Camera Rituale','Overdrive: +1 POT e +1 DAN extra a entrambi','conditional','raro','Khemet',1],
  [80,'Sala dei Soulwright','Entrambe le carte sono Immune','limit','raro','Khemet',1],
  [81,'Altare dell\'Imposizione','Il DAN di ogni carta è imposto pari alla sua POT','limit','special','Khemet',1],
  [82,'Necropoli Dorata','Vincitore: cura 1 PV','conditional','comune','Khemet',2],
  [83,'Cripta dei Re-Maghi','Resistenza sempre attiva per entrambi','trigger','raro','Khemet',2],
  [51,'La Piana della Torre Caduta','Nessuno','neutral',null,'generico',1],
  [52,'Ignoto inarrivabile','Nessuno','neutral',null,'generico',1],
  [53,'Il Bastione del Nono Mondo','Nessuno','neutral',null,'generico',1],
  [54,'Il Ponte dell\'Ultimo Campione','Nessuno','neutral',null,'generico',1],
  [55,'Le Ceneri del Mondo Senza Nome','Nessuno','neutral',null,'generico',1],
];

const fields = MASTER.map(([id, name, effect, category, rarita, tema, minTurn]) => ({
  id,
  name,
  icon: ICON_BY_ID[id] || 'circle',
  effect,
  category,
  ...(rarita ? { rarita } : {}),
  tema,
  minTurn,
  flavour: '',
  bgImage: `./campi_bg/campo-${id}.png`,
}));

fields.sort((a, b) => a.id - b.id);

const out = `// AUTO-GENERATED from CAMPI_MASTER — do not edit by hand; run scripts/gen-battlefields-data.mjs
export const RAW_BATTLEFIELDS = ${JSON.stringify(fields, null, 2)};
`;

writeFileSync(join(__dirname, '../src/data/battlefieldsData.js'), out);
console.log('Wrote', fields.length, 'fields to src/data/battlefieldsData.js');

// Catalogo nemico esclusivo campagna: non entra in ARMY_SETS o nelle ricompense.
export const CONCORDIA_ARMY = 'Concordia di Caelion';
export const CONCORDIA_EMINENCE_ID = 'concordia_campane_vallo';
const rows = [
 ['V01','Scudiero del Vallo',2,3,1,'intervention','assaultValue',3,'Intervento: +3 VA'],
 ['V02','Picca delle Porte',2,2,2,'resistenza','power',2,'Resistenza: +2 POT'],
 ['V03','Balestriere delle Mura',2,3,1,'imboscata','directDamage',2,'Imboscata: 2 danni diretti'],
 ['V04','Guardia del Fossato',2,3,1,'turbo','enemyDamage',-2,'Turbo: -2 DAN nem. (min 1)',{minDamage:1}],
 ['V05','Cavaliere della Campana',2,3,2,'intervention','damage',1,'Intervento: +1 DAN'],
 ['V06','Portascudo di Caelion',2,2,2,'intervention','enemyPower',-2,'Intervento: -2 POT nem. (min 2)',{minPower:2}],
 ['G01','Portastendardo dell’Aurora',3,4,2,'conquest','focusCoin',1,'Conquista: +1 FC'],
 ['G02','Duellante del Sole Pallido',3,4,2,'sfida','power',2,'Sfida: +2 POT'],
 ['G03','Cavaliere della Seconda Campana',3,3,3,'intervention','assaultValue',4,'Intervento: +4 VA'],
 ['G04','Reliquiario Errante',3,3,2,'lastWish','heal',3,'Ultimo desiderio: Cura 3'],
 ['R01','Cavaliere della Breccia',4,5,3,'resistenza','damage',2,'Resistenza: +2 DAN'],
 ['R02','Giustiziere del Vespro',4,4,4,'intervention','enemyAssault',-5,'Intervento: -5 VA nem. (min 6)',{minAssault:6}],
 ['R03','Maresciallo della Livrea Rossa',4,5,2,'glory','power',2,'Gloria: +2 POT'],
 ['N01','Cavaliere Nero della Corona Vuota',5,5,4,'intervention','blockAbility',null,'Intervento: Blocca Potere'],
 ['N02','Custode del Primo Sole',5,5,4,'resistenza','powerAndDamage',2,'Resistenza: +2 POT, +2 DAN'],
];
export const CONCORDIA_CARDS = rows.map(([code,name,league,power,damage,trigger,effect,value,description,limits],i)=>({
 id:9101+i,code,name,league,power,damage,army:CONCORDIA_ARMY,campaignOnly:true,icon:'shield',
 livrea:{2:'verde',3:'gialla',4:'rossa',5:'nera'}[league],ability:{trigger,effect,value,...limits},description:`Potere: ${description}`,
 flavour:'La Concordia ha rifiutato la Fusione. Al suono delle campane, i Resistenti serrano le file.',
}));
const codes=Object.fromEntries(CONCORDIA_CARDS.map(c=>[c.code,c.id]));
const deck=s=>s.split(' ').map(c=>codes[c]);
export const CONCORDIA_DECKS={
 guarnigione:deck('V01 V02 V03 V04 V05 V06 G01 G02 G03 G04'),
 pattuglia:deck('V01 V02 V03 V04 V05 V06 G01 G03 R01 R03'),
 vespro:deck('V01 V02 V03 V05 V06 G02 G03 G04 R01 R02'),
 corona:deck('V01 V02 V03 V04 V05 V06 G03 G04 R02 N01'),
 sortita:deck('V01 V02 V03 V05 V06 G01 G03 R01 N01 N02'),
};
export const concordiaCardById=id=>CONCORDIA_CARDS.find(c=>c.id===id)||null;

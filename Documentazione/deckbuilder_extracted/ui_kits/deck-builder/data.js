// ============================================================
// data.js — Dati per "Creazione Esercito" (deck builder Satze)
//
// Allineato al deck builder reale del gioco (Bazelguese/Satze):
//   · SISTEMA TAG AGENTI v2 (src/data/cardTags.js): 7 categorie di tag per
//     carta — Corpo · Equilibrio · POT · DAN · Postura · Funzione · Ruolo.
//     I tag di RUOLO sono badge rossi; gli altri grigi. Tooltip per ognuno.
//   · Regole: 10 carte · MAX 30 LEGA (somma delle leghe) · lega 2–5.
//   · Trigger (postura d'attivazione) con colori dedicati.
//   · 12 carte-eroe con ritratto reale + TAG REALI da CARD_TAGS.
// I nomi/stat/tag delle carte non-eroe sono PLACEHOLDER deterministici
// e plausibili per l'anteprima, non dati di gioco reali.
// ============================================================
(function () {
  const ROOT = '../..';

  // ── Tag di Ruolo (badge rosso) — RUOLO_TAGS (cardTags.js) ──
  const RUOLO_TAGS = new Set(['Boss','Finisher','Pillar','Ace','Bomb','Anchor','Flex','Tech','Engine','Sacrifice','Filler','Tank','Scaler']);

  // ── Tooltip tag (da SISTEMA_TAG_AGENTI_v2) ──
  const TAG_TOOLTIPS = {
    Esile:'Corpo debole per la Lega. Il potere compensa.', Solido:'Corpo nella norma. Equilibrio stat/potere.', Imponente:'Corpo sopra la media. Potere debole o assente.',
    Equilibrato:'Stat bilanciate. Versatile.', Sbilanciato:'Una stat domina. Specialista.',
    'POT Bassa':'Perde la maggior parte dei duelli senza buff', 'POT Media':'Competitiva con investimento FC', 'POT Alta':'Vince molti duelli anche con poco FC', 'POT Devastante':'Domina i duelli. Raro.',
    'DAN Basso':'Vittorie poco impattanti sui PV nemici', 'DAN Medio':'Danno standard', 'DAN Alto':'Vittorie dolorose per il nemico', 'DAN Letale':'Ogni vittoria è devastante. Raro.',
    'First Strike':'Colpisci per primo. Aggressione pura.', Counter:'Reagisci al nemico. Informazione.', Momentum:'Stai vincendo. Accelera il vantaggio.', Comeback:'Stai perdendo. Recupera o resisti.', 'All-in':'Scommetti tutto su un turno.', Punisher:'Punisci azioni specifiche del nemico.', Steady:'Sempre attivo. Nessuna condizione.', 'Late Game':'Si sveglia nei turni tardi.', 'Early Rush':'Forte solo T1-2, poi solo corpo.',
    Buffer:'Potenzia la propria carta.', Debuffer:'Indebolisce la carta nemica.', Closer:'Infligge danno diretto ai PV. Ignora il duello.', Tank:'Assorbe o mitiga il danno subito.', Controller:'Neutralizza le abilità del nemico.', Mimic:'Ruba statistiche o abilità.', Engine:'Genera risorse.', Scaler:'Diventa più forte col passare dei turni.', Converter:'Trasforma i modificatori. Anti-debuff.', Kamikaze:'Si danneggia per attivare condizioni.', Vanilla:'Solo corpo. Nessun effetto da attivare.',
    Boss:"La punta dell'esercito. Lega 5, sopra curva.", Finisher:'Chiude la partita. DAN Alto o Danni dir.', Pillar:'Cuore del gameplan. La carta che vuoi giocare.', Ace:'Forte fuori piano. Piano B.', Bomb:'Alto ceiling, basso floor. Grande varianza.', Anchor:'Affidabile e costante. Bassa varianza.', Flex:'Versatile, adattabile.', Tech:'Risposta situazionale. Per matchup specifici.', Sacrifice:'Si immola per valore.', Filler:'Riempie lo slot. Corpo solido.',
  };

  // ── Trigger (postura d'attivazione) + colori (da TriggerBadge) ──
  const TRIGGER_COLORS = {
    Sempre:'#94a3b8', Imboscata:'#f97316', Intervento:'#06b6d4', Gloria:'#eab308', Vendetta:'#ef4444',
    Rimonta:'#10b981', Overdrive:'#ec4899', 'Resa dei conti':'#8b5cf6', Magnanimo:'#14b8a6', 'Ultimo desiderio':'#6b7280', Conquista:'#22c55e',
  };

  // ── Colori lega (approssimazione di LEAGUE_TIER_COLORS) ──
  const LEAGUE_COLORS = { 2:'#94a3b8', 3:'#38bdf8', 4:'#c084fc', 5:'#fbbf24' };

  // ── Armate ──
  const FACTIONS = [
    { key:'orizzonte', name:"Figli dell'Orizzonte", accent:'#a78bfa', glyph:'☄', icon:'public/icons/Orizzonte-nobg.png',
      bonusLabel:'PASSIVO', bonus:'−5 VA nem. (min 6)', keywords:['Controllo','Cosmico','Difesa'], profile:{aggressione:35,difesa:80},
      trigger:'Sempre',
      titles:['Veggente','Sentinella','Custode','Aruspice','Vessillo','Occhio'], epithets:["dell'Alba",'del Cielo',"dell'Orizzonte",'delle Comete','del Vuoto','delle Stelle'] },
    { key:'kethran', name:'Kethran', accent:'#fbbf24', glyph:'☥', icon:'public/icons/ketrhan-nobg.png',
      bonusLabel:'RIMONTA', bonus:'Rimonta: +2 POT', keywords:['Rimonta','Sacro','Resilienza'], profile:{aggressione:70,difesa:55},
      trigger:'Rimonta',
      titles:['Cavaliere','Fanciullo','Guardia','Martire','Reliquia','Coro'], epithets:['Risorto','Sacro','di Cenere','delle Ferite','del Sepolcro',"dell'Aurora"] },
    { key:'corte-rossa', name:'Corte Rossa', accent:'#f43f5e', glyph:'🜂', icon:'public/icons/corte-nobg.png',
      bonusLabel:'COPIA', bonus:'Copia Bonus nemico', keywords:['Mirror','Adattivo','Caos'], profile:{aggressione:65,difesa:60},
      trigger:'Vendetta',
      titles:['Cortigiano','Lama','Maschera','Giullare','Specchio','Duchessa'], epithets:['Specchio','Imitatrice','Cremisi','del Riflesso',"dell'Inganno",'di Sangue'] },
    { key:'calibri-pesanti', name:'Calibri Pesanti', accent:'#94a3b8', glyph:'⚙', icon:'public/icons/calibri-nobg.png',
      bonusLabel:'PASSIVO', bonus:'−2 DAN nem. (min 2)', keywords:['Tank','Industriale','Mitigazione'], profile:{aggressione:40,difesa:90},
      trigger:'Sempre',
      titles:['Corazza','Torre','Mole','Ariete','Bastione','Incudine'], epithets:['Ambulante','Semovente',"d'Acciaio",'di Ghisa','Blindata','della Fonderia'] },
    { key:'orathai', name:'Orathai', accent:'#2dd4bf', glyph:'🌙', icon:'public/icons/orethai-nobg.png',
      bonusLabel:'RESA DEI CONTI', bonus:'Resa dei conti: +2 DAN', keywords:['Burst','Lunare','Pazienza'], profile:{aggressione:75,difesa:50},
      trigger:'Resa dei conti',
      titles:['Cacciatore','Danzatrice','Falce','Vedetta','Rapace','Marea'], epithets:['Lunare','della Notte',"dell'Alta Marea",'del Plenilunio','silenzioso',"dell'Eclissi"] },
    { key:'mounthborn', name:'Mounthborn', accent:'#a3e635', glyph:'◬', icon:'public/icons/Mounthborn-nobg.png',
      bonusLabel:'IMBOSCATA', bonus:'Imboscata: +1 POT, +1 DAN', keywords:['Imboscata','Selvaggio','Tattico'], profile:{aggressione:75,difesa:45},
      trigger:'Imboscata',
      titles:['Predatore','Segugio','Tracciatore','Belva','Radice','Fronda'], epithets:["d'Ombra",'del Sottobosco','silente','delle Spore','del Fango','della Muta'] },
    { key:'enclave', name:"L'Enclave delle Scaglie", accent:'#f59e0b', glyph:'🐉', icon:'public/icons/enclave-nobg.png',
      bonusLabel:'CONQUISTA', bonus:'Conquista: +2 FC', keywords:['Conquista','Drago','Risorse'], profile:{aggressione:60,difesa:70},
      trigger:'Conquista',
      titles:['Guardiano','Vipera','Custode','Esattore','Sauro','Draconide'], epithets:['delle Scaglie','del Confine','del Tesoro',"dell'Antico Patto",'di Bronzo','del Nido'] },
    { key:'ratti', name:'Ratti della Megera', accent:'#10b981', glyph:'⚗', icon:'public/icons/ratti-nobg.png',
      bonusLabel:'CONQUISTA', bonus:'Conquista: Tossina 1 (min 10)', keywords:['Veleno','Attrito','Subdolo'], profile:{aggressione:55,difesa:60},
      trigger:'Conquista',
      titles:['Alchimista','Untore','Ratto','Distillatore','Vettore','Megera'], epithets:['della Peste','del Miasma','delle Fogne','del Contagio',"dell'Acido",'della Muffa'] },
    { key:'indocili', name:'Patto degli Indocili', accent:'#fb7185', glyph:'◈', icon:'public/icons/patto-indocili-icon.png',
      bonusLabel:'RINFORZI', bonus:'Rinforzi: −1 POT, −1 DAN nem.', keywords:['Debuff','Anarchico','Soppressione'], profile:{aggressione:50,difesa:65},
      trigger:'Intervento',
      titles:['Disertore','Ribelle','Sabotatore','Fuorilegge','Insorto','Corvo'], epithets:['Indocile','della Rivolta','senza Bandiera','del Dissenso','della Forca','dei Confini'] },
    { key:'khemet', name:'Khemet', accent:'#22d3ee', glyph:'𓂀', icon:'public/icons/Khetan-nobg.png',
      bonusLabel:'OVERDRIVE', bonus:'Overdrive: Immune', keywords:['Tech','Overdrive','Immunità'], profile:{aggressione:80,difesa:75},
      trigger:'Overdrive',
      titles:['Automa','Ierofante','Colosso','Sentinella','Nucleo','Architetto'], epithets:['di Khemet',"dell'Overdrive",'solare','del Reattore','aureo',"dell'Occhio"] },
  ];

  // ── Carte-eroe: ritratto reale + TAG REALI (CARD_TAGS di cardTags.js) ──
  const HEROES = {
    orizzonte: [
      { img:'111.png', name:"Veggente dell'Alba",     pot:6, dan:4, ability:'Veggenza: guarda 2 carte',   tags:['Imponente','Equilibrato','POT Alta','DAN Letale','Early Rush','Buffer','Boss','Bomb'] },
      { img:'101.png', name:'Sentinella del Cielo',    pot:5, dan:5, ability:'Vigilanza permanente',        tags:['Solido','Equilibrato','POT Alta','DAN Alto','Steady','Debuffer','Boss','Anchor'] },
      { img:'102.png', name:"Custode dell'Orizzonte",  pot:4, dan:6, ability:'Blocca il primo attacco',      tags:['Solido','Equilibrato','POT Alta','DAN Medio','Momentum','Engine','Pillar'] },
    ],
    kethran: [
      { img:'201.png', name:'Cavaliere Risorto',       pot:7, dan:3, ability:'Rinasce una volta per duello', tags:['Imponente','Equilibrato','POT Alta','DAN Alto','Momentum','Buffer','Boss'] },
      { img:'211.png', name:'Fanciullo Sacro',         pot:3, dan:7, ability:'Cura 2 PV a fine turno',        tags:['Solido','Sbilanciato','POT Devastante','DAN Medio','Late Game','Buffer','Boss','Finisher'] },
      { img:'202.png', name:'Guardia di Cenere',       pot:5, dan:5, ability:'Rimonta se in svantaggio',      tags:['Imponente','Equilibrato','POT Alta','DAN Alto','Comeback','Buffer','Pillar','Finisher'] },
    ],
    'corte-rossa': [
      { img:'301.png', name:'Cortigiano Specchio',     pot:5, dan:6, ability:"Copia l'ultima abilità vista",  tags:['Solido','Sbilanciato','POT Devastante','DAN Medio','Momentum','Closer','Boss','Finisher'] },
      { img:'311.png', name:'Lama Imitatrice',         pot:6, dan:4, ability:'Duplica un bonus nemico',       tags:['Esile','Equilibrato','POT Alta','DAN Alto','Late Game','Mimic','Boss'] },
    ],
    'calibri-pesanti': [
      { img:'401.png', name:'Corazza Ambulante',       pot:4, dan:8, ability:'Riduce il danno subito',        tags:['Imponente','Equilibrato','POT Alta','DAN Letale','Steady','Tank','Boss','Finisher'] },
      { img:'411.png', name:'Torre Semovente',         pot:3, dan:9, ability:'Immobile, quasi indistruttibile',tags:['Esile','Equilibrato','POT Media','DAN Alto','Momentum','Closer','Boss','Finisher'] },
    ],
    orathai: [
      { img:'501.png', name:'Cacciatore Lunare',       pot:8, dan:4, ability:'Bonus danno negli ultimi turni',tags:['Solido','Equilibrato','POT Alta','DAN Alto','Momentum','Buffer','Boss'] },
    ],
    mounthborn: [
      { img:'601.png', name:"Predatore d'Ombra",       pot:7, dan:5, ability:'Imboscata al primo scontro',    tags:['Solido','Equilibrato','POT Alta','DAN Alto','Late Game','Tank','Boss'] },
    ],
  };

  // ── vocabolario per generazione (carte non-eroe) ──
  const POSTURE  = ['First Strike','Counter','Momentum','Comeback','All-in','Punisher','Steady','Late Game','Early Rush'];
  const FUNZIONE = ['Buffer','Debuffer','Closer','Tank','Controller','Mimic','Engine','Scaler','Converter','Kamikaze'];
  const RUOLI    = ['Finisher','Pillar','Ace','Bomb','Anchor','Flex','Tech','Sacrifice'];
  const ABILITIES = [
    'Se schierata per prima: +1 POT','Ignora il primo Bonus nemico','A fine turno infligge 1 DAN dir.',
    'Non può essere bersaglio di debuff','Se in svantaggio: +2 VA','Rivela una carta della mano nemica',
    'Conquista: pesca 1 carta','Riduce di 1 il VA nemico (min 6)','Immune a Tossina',
    'Se sopravvive: +1 DAN permanente','Difende la carta adiacente','Overdrive: +3 POT per un turno',
  ];

  const corpoOf = (pot, dan) => (pot <= 3 ? 'Esile' : dan >= 7 ? 'Imponente' : 'Solido');
  const equilOf = (pot, dan) => (Math.abs(pot - dan) <= 1 ? 'Equilibrato' : 'Sbilanciato');
  const potTag  = (p) => (p <= 3 ? 'POT Bassa' : p <= 5 ? 'POT Media' : p <= 7 ? 'POT Alta' : 'POT Devastante');
  const danTag  = (d) => (d <= 3 ? 'DAN Basso' : d <= 5 ? 'DAN Medio' : d <= 7 ? 'DAN Alto' : 'DAN Letale');
  const roleOf  = (pot, dan) => (pot - dan >= 3 ? 'Assalto' : dan - pot >= 3 ? 'Difesa' : pot >= 6 && dan >= 6 ? 'Élite' : 'Supporto');
  const leagueOf = (pot, dan) => { const t = pot + dan; return t <= 7 ? 2 : t <= 9 ? 3 : t <= 11 ? 4 : 5; };

  function buildPool(fac) {
    const heroes = (HEROES[fac.key] || []).map((h, i) => ({
      id:`${fac.key}-h${i+1}`, name:h.name, pot:h.pot, dan:h.dan, ability:h.ability,
      league:5, role:roleOf(h.pot,h.dan), trigger:fac.trigger, tags:h.tags,
      img:`${ROOT}/assets/cards/${h.img}`, hero:true,
    }));
    const pool = [...heroes];
    let seed = fac.key.split('').reduce((a,c)=>a+c.charCodeAt(0),0);
    const rnd = () => { seed = (seed*1103515245 + 12345) & 0x7fffffff; return seed/0x7fffffff; };
    const used = new Set(heroes.map(h=>h.name));
    let k = 0;
    while (pool.length < 15) {
      const t = fac.titles[k % fac.titles.length];
      const e = fac.epithets[(k*3+2) % fac.epithets.length];
      let name = `${t} ${e}`;
      if (used.has(name)) name = `${t} ${e} ${['II','III','IV'][k%3]}`;
      used.add(name);
      const aggr = fac.profile.aggressione/100;
      const pot = Math.max(2, Math.min(9, Math.round(3 + rnd()*6*(0.6+aggr*0.7))));
      const dan = Math.max(2, Math.min(9, Math.round(3 + rnd()*6*(0.6+(1-aggr)*0.7))));
      const tags = [
        corpoOf(pot,dan), equilOf(pot,dan), potTag(pot), danTag(dan),
        POSTURE[Math.floor(rnd()*POSTURE.length)],
        FUNZIONE[Math.floor(rnd()*FUNZIONE.length)],
        RUOLI[Math.floor(rnd()*RUOLI.length)],
      ];
      // ~1/3 delle carte ha un secondo tag di ruolo
      if (rnd() < 0.34) { const extra = RUOLI[Math.floor(rnd()*RUOLI.length)]; if (!tags.includes(extra)) tags.push(extra); }
      pool.push({
        id:`${fac.key}-${String(pool.length+1).padStart(2,'0')}`, name, pot, dan,
        ability:ABILITIES[Math.floor(rnd()*ABILITIES.length)],
        league:leagueOf(pot,dan), role:roleOf(pot,dan),
        trigger:(rnd()<0.45 ? 'Sempre' : fac.trigger),
        tags, img:null, hero:false,
      });
      k++;
    }
    return pool;
  }

  const POOLS = {};
  FACTIONS.forEach(f => { POOLS[f.key] = buildPool(f); });

  window.SATZE_DB = {
    FACTIONS, POOLS, roleOf, leagueOf,
    RUOLO_TAGS, TAG_TOOLTIPS, TRIGGER_COLORS, LEAGUE_COLORS,
    DECK_SIZE: 10, MAX_LEAGUE: 30,
    isRole: (t) => RUOLO_TAGS.has(t),
  };
})();

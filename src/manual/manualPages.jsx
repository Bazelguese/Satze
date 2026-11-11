// ============================================================
// MANUALE SATZE — contenuto delle pagine
// ============================================================
// Ogni voce di MANUAL_PAGES è una pagina A5 del libretto. Lo stesso elenco
// alimenta il visore in gioco (ManualBook) e la stampa PDF (ManualPrint).
//
// Le parti che cambiano con il bilanciamento NON sono scritte a mano: trigger,
// effetti, bonus d'armata, stile delle armate ed Eminenze arrivano dai dati del
// gioco (glossary.js, armies.js, armyLore.js, eminences.js). Modificando quei
// file il manuale si aggiorna da solo; basta rigenerare il PDF.
//
// Le schermate sono in public/manuale/img, in JPEG perché nel PDF resta compresso (vedi scripts/manuale/README.md).
// ============================================================

import { GLOSSARY_TERMS } from '../data/glossary.js';
import { ARMY_BONUSES, ARMY_COLORS, ARMY_ICONS } from '../data/armies.js';
import { ARMY_LORE } from '../components/menu/cosmic/armyLore.js';
import { EMINENCES, EMINENCE_ARMY_ORDER, getEminenceForArmy } from '../data/eminences.js';
import { AI_DIFFICULTIES } from '../utils/aiConstants.js';
import { SATZE_VERSION } from '../config/buildProfile.js';

const IMG = './manuale/img/';
const AI_LEVELS = ['easy', 'medium', 'hard'].map((k) => AI_DIFFICULTIES[k]).filter(Boolean);

/** Nome file dello stendardo di un'armata (li genera scripts/manuale/cattura-schermate.mjs). */
export const armySlug = (name) => name.normalize('NFD').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase();

/** Armate giocabili, nell'ordine della schermata "Scegli la tua armata". */
export const MANUAL_ARMIES = Object.keys(ARMY_LORE).filter((name) => ARMY_BONUSES[name]);

const termsOf = (category) => GLOSSARY_TERMS.filter((t) => t.category === category);
const term = (name) => GLOSSARY_TERMS.find((t) => t.term.toLowerCase() === name.toLowerCase());

// ---------- mattoncini ----------
const P = ({ children, small }) => <p className={`mn-p${small ? ' mn-small' : ''}`}>{children}</p>;
const H2 = ({ children }) => <h2 className="mn-h2">{children}</h2>;
const T = ({ children }) => <span className="mn-term">{children}</span>;
const Title = ({ kicker, children, lead }) => (
  <>
    {kicker ? <p className="mn-kicker">{kicker}</p> : null}
    <h1 className="mn-h1">{children}</h1>
    {lead ? <p className="mn-lead">{lead}</p> : null}
  </>
);
const Tip = ({ label = 'Consiglio', warn, children }) => (
  <div className={`mn-tip${warn ? ' is-warn' : ''}`}>
    <span className="mn-tip-label">{label}</span>
    {children}
  </div>
);
const Dot = ({ n }) => <span className="mn-dot-inline">{n}</span>;

/** Schermata vera del gioco. dots = [[n, x%, y%], …] per i richiami numerati. */
function Fig({ src, n, caption, dots, w }) {
  return (
    <figure className="mn-fig" style={w ? { width: `${w}%`, marginLeft: 'auto', marginRight: 'auto' } : undefined}>
      <div className="mn-fig-frame">
        <img src={`${IMG}${src}`} alt={caption || ''} loading="eager" />
        {dots?.map(([k, x, y]) => (
          <span key={k} className="mn-dot" style={{ left: `${x}%`, top: `${y}%` }}>{k}</span>
        ))}
      </div>
      {caption ? (
        <figcaption>
          <b>FIG. {n}</b> — {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

function Entries({ items }) {
  return (
    <dl className="mn-entries">
      {items.map((t) => (
        <div className="mn-entry" key={t.term}>
          <dt>{t.term}</dt>
          <dd>{t.desc}</dd>
        </div>
      ))}
    </dl>
  );
}

// ---------- armate ----------
/** "Rimonta: +2 POT" → { trigger: "Rimonta", when: "Hai meno PV dell'avversario" } */
function bonusInfo(armyName) {
  const text = ARMY_BONUSES[armyName]?.description || '';
  const m = text.match(/^([^:+\-0-9][^:]*):\s*(.+)$/);
  if (!m) return { text, when: 'Sempre attivo: nessuna condizione.' };
  const t = term(m[1].trim());
  return { text, when: t ? `${t.term}: ${t.desc.charAt(0).toLowerCase()}${t.desc.slice(1)}.` : '' };
}

function ArmyBlock({ name, index }) {
  const lore = ARMY_LORE[name] || {};
  const color = ARMY_COLORS[name]?.accent || '#b3168f';
  const bonus = bonusInfo(name);
  const em = getEminenceForArmy?.(name);
  return (
    <section className="mn-army" style={{ borderColor: '#1b1622' }}>
      <div className="mn-army-banner">
        <img className="bg" src={`${IMG}stendardo-${armySlug(name)}.jpg`} alt="" />
        <span className="mn-army-num" style={{ background: color }}>ARMATA {String(index + 1).padStart(2, '0')}</span>
        <div className="mn-army-id">
          {ARMY_ICONS[name] ? <img src={ARMY_ICONS[name]} alt="" /> : null}
          <div>
            <div className="mn-army-name">{name}</div>
            {lore.motto ? <div className="mn-army-motto">«{lore.motto}»</div> : null}
          </div>
        </div>
      </div>
      <div className="mn-army-body">
        <div className="mn-army-bonus">
          <span className="tag">BONUS</span>
          <span className="txt">{bonus.text}</span>
        </div>
        {lore.synopsis ? <p className="mn-army-lore">{lore.synopsis.split('\n\n')[0]}</p> : null}
        {bonus.when ? <p><b>Quando vale.</b> {bonus.when}</p> : null}
        {lore.style ? <p><b>Come si gioca.</b> {lore.style}</p> : null}
        {em ? <p className="mn-army-meta">EMINENZA · {em.name.toUpperCase()}</p> : null}
      </div>
    </section>
  );
}

function armyPages() {
  const pages = [];
  for (let i = 0; i < MANUAL_ARMIES.length; i += 2) {
    const pair = MANUAL_ARMIES.slice(i, i + 2);
    pages.push({
      id: `armate-${i / 2 + 1}`,
      sec: 'Le armate',
      title: pair.join(' · '),
      toc: i === 0 ? 'Le dodici armate' : null,
      body: () => (
        <>
          {i === 0 ? (
            <Title kicker="Capitolo 4">Le armate</Title>
          ) : null}
          {pair.map((name, k) => <ArmyBlock key={name} name={name} index={i + k} />)}
        </>
      ),
    });
  }
  return pages;
}

// ---------- Eminenze ----------
const fmtDelta = (d) => (d > 0 ? `+${d}` : d < 0 ? `−${Math.abs(d)}` : '±0');

function EminenceBlock({ em }) {
  return (
    <section className="mn-em">
      <div className="mn-em-top">
        {ARMY_ICONS[em.army] ? <img src={ARMY_ICONS[em.army]} alt="" /> : null}
        <div className="mn-em-name">
          <span className="mn-em-army">{em.army}</span>
          {em.name}
        </div>
        <div className="mn-em-pres">PRESENZA<b>{em.initialPresence}</b></div>
      </div>
      <div className="mn-em-body">
        <p><b>Statico · {em.static?.name}.</b> {em.static?.text}</p>
        <div className="mn-em-ab">
          {em.abilities.map((a) => (
            <span key={a.id}>{a.name} <b>{fmtDelta(a.presenceDelta)}</b></span>
          ))}
        </div>
      </div>
    </section>
  );
}

function eminencePages() {
  const list = (EMINENCE_ARMY_ORDER || [])
    .map((army) => getEminenceForArmy(army))
    .filter(Boolean);
  const all = list.length ? list : Object.values(EMINENCES);
  const per = 4;
  const pages = [];
  for (let i = 0; i < all.length; i += per) {
    pages.push({
      id: `eminenze-${i / per + 2}`,
      sec: 'Meccaniche avanzate',
      title: 'Le Eminenze',
      body: () => (
        <>
          {i === 0 ? <P small>Per ogni Eminenza: Presenza iniziale, effetto Statico e abilità con la Presenza che danno (+) o che costano (−). Il testo completo di ogni abilità è in <b>Galleria → Eminenze</b>.</P> : null}
          {all.slice(i, i + per).map((em) => <EminenceBlock key={em.id} em={em} />)}
        </>
      ),
    });
  }
  return pages;
}

// ---------- pagine ----------
const triggers = termsOf('trigger');
const effects = termsOf('effetti');
const half = (arr) => Math.ceil(arr.length / 2);

const CORE_PAGES_A = [
  {
    id: 'copertina',
    kind: 'cover',
    title: 'Copertina',
    body: () => (
      <>
        <img className="mn-cover-art" src={`${IMG}copertina.jpg`} alt="" />
        <div className="mn-cover-shade" />
        <div className="mn-cover-strip"><span>MANUALE DI ISTRUZIONI</span><span>ITA</span></div>
        <img className="mn-cover-logo" src="./logo-satze.png" alt="SATZE" />
        <div className="mn-cover-title">
          <span className="k">GIOCO DI CARTE STRATEGICO</span>
          <h1>Libretto<br />di istruzioni</h1>
        </div>
        <div className="mn-cover-foot">
          <span>VERSIONE {SATZE_VERSION} · ALPHA</span>
          <span className="mn-seal">1–4 GIOCATORI<br />IA · ONLINE</span>
        </div>
      </>
    ),
  },
  {
    id: 'benvenuto',
    sec: 'Prima di giocare',
    title: 'Benvenuto',
    toc: 'Benvenuto in SATZE',
    body: () => (
      <>
        <Title kicker="Prima di giocare" lead="Grazie per aver scelto SATZE.">Benvenuto</Title>
        <P>SATZE è un gioco di carte strategico. Due comandanti si affrontano con una mano di cinque <b>Agenti</b> su cinque <b>Campi di Battaglia</b>: un Agente per turno, uno scontro per turno, cinque turni in tutto.</P>
        <P>Non si pesca e non si rimescola. Le mani sono scoperte: sai fin dall'inizio cosa può giocare l'avversario. Quello che non sai è <b>quanto è disposto a spendere</b>.</P>
        <div className="mn-stat-row">
          <div className="mn-stat"><b>25</b><span>Punti Vita</span></div>
          <div className="mn-stat"><b>18</b><span>Focus Coin</span></div>
          <div className="mn-stat"><b>5</b><span>Agenti in mano</span></div>
          <div className="mn-stat"><b>5</b><span>Turni</span></div>
        </div>
        <H2>Come usare questo libretto</H2>
        <ul className="mn-list">
          <li><b>Hai fretta?</b> Leggi il capitolo 2, <i>Le basi</i>: basta per la prima partita.</li>
          <li><b>Vuoi capire una carta?</b> I capitoli 3 e 4 spiegano trigger, effetti, Eminenze e armate.</li>
          <li><b>Cerchi un tasto?</b> Vai alla pagina <i>Comandi</i> in fondo.</li>
        </ul>
        <Tip label="Nota">
          Le figure sono schermate vere del gioco, versione {SATZE_VERSION}. Il gioco è in alpha: numeri e testi delle carte possono cambiare. In caso di dubbio fa fede il <b>Glossario</b> dentro la partita.
        </Tip>
      </>
    ),
  },
  {
    id: 'indice',
    sec: 'Prima di giocare',
    title: 'Indice',
    body: ({ toc, goTo }) => {
      const rows = [];
      let lastSec = null;
      toc.forEach((e) => {
        if (e.sec !== lastSec) {
          rows.push(<li key={`s-${e.sec}`} className="mn-toc-sec">{e.sec}</li>);
          lastSec = e.sec;
        }
        rows.push(
          <li key={e.id}>
            <button type="button" className="mn-toc-row" onClick={() => goTo?.(e.index)}>
              <span className="t">{e.label}</span><span className="d" /><span className="n">{e.index + 1}</span>
            </button>
          </li>,
        );
      });
      return (
        <>
          <Title kicker="Sommario">Indice</Title>
          <ul className="mn-toc">{rows}</ul>
        </>
      );
    },
  },

  // ───────── Capitolo 1 ─────────
  {
    id: 'menu',
    sec: 'Per cominciare',
    title: 'Il menu principale',
    toc: 'Il menu principale',
    body: () => (
      <>
        <Title kicker="Capitolo 1">Per cominciare</Title>
        <Fig src="menu.jpg" n="1" caption="Il menu principale. Frecce su/giù per scorrere, Invio per scegliere." />
        <table className="mn-tbl is-tight">
          <tbody>
            <tr><td>Partita locale</td><td>Una partita contro l'IA. È il punto di partenza.</td></tr>
            <tr><td>Campagna</td><td>La modalità storia, con tre slot di salvataggio.</td></tr>
            <tr><td>Multiplayer</td><td>Partite online con una stanza e un codice (beta).</td></tr>
            <tr><td>Gestione eserciti</td><td>Crea e modifica i tuoi eserciti di 10 carte.</td></tr>
            <tr><td>Opzioni</td><td>Schermo, grafica, interfaccia e audio.</td></tr>
            <tr><td>Tutorial</td><td>Tre percorsi guidati, di cui due sono partite vere.</td></tr>
            <tr><td>Manuale</td><td>Questo libretto, anche in PDF.</td></tr>
            <tr><td>Galleria</td><td>Tutte le carte, le Eminenze e i Campi.</td></tr>
          </tbody>
        </table>
        <P small>Su PC c'è anche <b>Esci dal gioco</b>. Alcune build di prova mostrano voci in più riservate agli sviluppatori.</P>
      </>
    ),
  },
  {
    id: 'schierare',
    sec: 'Per cominciare',
    title: 'Armata ed esercito',
    toc: 'Scegliere armata ed esercito',
    body: () => (
      <>
        <Title>Armata ed esercito</Title>
        <P>Scelta <b>Partita locale</b>, il gioco ti chiede con chi scendi in campo, in due passi.</P>
        <Fig src="armata.jpg" n="2" w={92} caption="Fase I, Schieramento. A sinistra la ruota delle armate, a destra bonus ed eserciti pronti." />
        <H2>Fase I · L'armata</H2>
        <P>Dodici armate, ognuna con 30 Agenti e un <b>Bonus Armata</b> che ne definisce lo stile. Scorri con le frecce, premi <T>S</T> per il dossier con la storia, <T>Invio</T> per schierare. La prima voce, <b>Eserciti personalizzati</b>, apre quelli costruiti da te.</P>
        <H2>Fase II · L'esercito</H2>
        <P>Un <b>esercito</b> è un mazzo di <b>10 Agenti</b> la cui somma di <b>Lega</b> fa esattamente <b>30</b>. Ogni armata ne offre di già pronti: scegline uno con ←/→ e conferma con <T>Invio</T>. <T>P</T> personalizza gli effetti.</P>
        <Tip>In partita non usi tutte e dieci le carte: ne peschi <b>cinque a caso</b>. Un buon esercito funziona con qualunque metà.</Tip>
      </>
    ),
  },
  {
    id: 'imposta',
    sec: 'Per cominciare',
    title: 'Imposta la partita',
    toc: 'Imposta la partita',
    body: () => (
      <>
        <Title>Imposta la partita</Title>
        <Fig src="imposta.jpg" n="3" caption="Il pannello prima del duello. Su/giù cambia riga, ←/→ cambia valore, Invio inizia." />
        <table className="mn-tbl is-wrap is-tight">
          <tbody>
            <tr><td>Modalità</td><td><b>Duello</b>: 1 contro 1, la partita classica. <b>2v2</b>: abbinamenti segreti, tu e un compagno IA contro due IA. <b>Re della collina</b>: tutti contro tutti.</td></tr>
            <tr><td>Formato</td><td><b>Standard</b>: Eminenze e Campi attivi. <b>No Eminenza</b>: Campi attivi, senza Eminenze. <b>Mani nude</b>: né Eminenze né effetti dei Campi.</td></tr>
            <tr><td>Nemico</td><td><b>Casuale</b> (armata ed esercito a sorpresa) oppure <b>Armata scelta</b> da te.</td></tr>
            <tr><td>Difficoltà</td><td>{AI_LEVELS.map((d, i) => (<span key={d.id}>{i ? ', ' : ''}<b>{d.name}</b> ({d.description.toLowerCase()})</span>))}.</td></tr>
          </tbody>
        </table>
        <Tip label="Prima partita">
          Scegli <b>Duello</b>, formato <b>Mani nude</b> e la difficoltà più bassa. Giocherai solo con le regole del capitolo 2: nessun effetto di Campo, nessuna Eminenza. Quando ti senti a tuo agio, passa a <b>Standard</b>.
        </Tip>
      </>
    ),
  },

  // ───────── Capitolo 2 ─────────
  {
    id: 'carta',
    sec: 'Le basi',
    title: 'La carta Agente',
    toc: 'La carta Agente',
    body: () => (
      <>
        <Title kicker="Capitolo 2">Le basi</Title>
        <H2>La carta Agente</H2>
        <div className="mn-cols" style={{ gridTemplateColumns: '292px 1fr', alignItems: 'start' }}>
          <Fig
            src="carta.jpg"
            dots={[[1, 13, 14], [2, 80, 11], [3, 46, 4.5], [4, 6, 69.5], [5, 6, 83.5], [6, 93, 86]]}
          />
          <div className="mn-small">
            <p className="mn-p"><Dot n="1" /><b>POT · Potenza.</b> Si moltiplica per i Focus Coin che investi.</p>
            <p className="mn-p"><Dot n="2" /><b>DAN · Danno.</b> I Punti Vita che togli all'avversario se vinci lo scontro.</p>
            <p className="mn-p"><Dot n="3" /><b>Nome</b> dell'Agente.</p>
            <p className="mn-p"><Dot n="4" /><b>Potere ★.</b> L'effetto della carta. Quasi sempre ha un <i>trigger</i>, cioè una condizione.</p>
            <p className="mn-p"><Dot n="5" /><b>Bonus ✠.</b> Il Bonus della sua armata.</p>
            <p className="mn-p"><Dot n="6" /><b>Lega</b>, da L2 a L5. Misura il peso della carta.</p>
          </div>
        </div>
        <H2>Come si legge un Potere</H2>
        <P>Un Potere è scritto come <T>Trigger: effetto</T>. Nella figura, «Overdrive: −8 VA nem. (min 6)» significa: <i>se investi 5 o più Focus Coin, togli 8 al Valore Assalto nemico, senza farlo scendere sotto 6</i>. Se la condizione non è soddisfatta, il Potere resta spento.</P>
        <Tip>
          Una Lega alta non è sempre un vantaggio. A parità di Valore Assalto vince la <b>Lega più bassa</b>, e al primo turno inizia chi ha in mano la somma di Lega più bassa.
        </Tip>
      </>
    ),
  },
  {
    id: 'tavolo',
    sec: 'Le basi',
    title: 'Il tavolo di gioco',
    toc: 'Il tavolo di gioco',
    body: () => (
      <>
        <Title>Il tavolo di gioco</Title>
        <Fig
          src="tavolo.jpg"
          n="4"
          caption="Lo schermo di una partita, al momento di schierare un Agente."
          dots={[[1, 21, 17], [2, 5.5, 4], [3, 50, 7], [4, 50, 45], [5, 88.5, 26], [6, 88.5, 51], [7, 78, 82], [8, 94, 96], [9, 11, 68], [10, 11, 97]]}
        />
        <div className="mn-legend">
          <div><Dot n="1" /><b>Mano avversaria.</b> Scoperta, come la tua.</div>
          <div><Dot n="2" /><b>PV e FC avversari.</b></div>
          <div><Dot n="3" /><b>Round.</b> Il turno in corso, su 5.</div>
          <div><Dot n="4" /><b>Il centro.</b> La fase del turno e i due Agenti schierati.</div>
          <div><Dot n="5" /><b>Tabellone.</b> Condizione di vittoria e i cinque Campi.</div>
          <div><Dot n="6" /><b>Log battaglia.</b> Tutto ciò che è successo, riga per riga.</div>
          <div><Dot n="7" /><b>La tua mano.</b></div>
          <div><Dot n="8" /><b>I tuoi PV e FC.</b></div>
          <div><Dot n="9" /><b>Anteprima.</b> Clicca una carta per leggerla in grande.</div>
          <div><Dot n="10" /><b>Glossario.</b> Ogni termine, sempre a portata.</div>
        </div>
        <Tip>Il disco al centro dice sempre <b>di chi è il turno</b> («Tocca a te» / «Turno nemico») e <b>cosa fare</b>. Nel dubbio, guarda lì.</Tip>
      </>
    ),
  },
  {
    id: 'vittoria',
    sec: 'Le basi',
    title: 'Come si vince',
    toc: 'Come si vince',
    body: () => (
      <>
        <Title lead="Tre strade per la vittoria. Quella attiva è scritta in alto a destra.">Come si vince</Title>
        <table className="mn-tbl is-wrap">
          <thead><tr><th>Condizione</th><th>Quando</th><th>Come</th></tr></thead>
          <tbody>
            <tr><td>Conquista</td><td>Turni 1–4</td><td>Conquista <b>3 Campi</b> su 5. Vinci un Campo vincendo lo scontro che vi si combatte.</td></tr>
            <tr><td>Supremazia</td><td>Turno 5</td><td>I Campi non bastano più: finite le carte vince chi ha <b>più PV</b>. A PV pari vince chi ha più Campi; se sono pari anche quelli è <b>pareggio</b>.</td></tr>
            <tr><td>Annientamento</td><td>Sempre</td><td>Chi è a <b>0 PV a fine turno</b> perde.</td></tr>
          </tbody>
        </table>
        <H2>La Reclamazione</H2>
        <P>Tre Campi si possono raggiungere solo al turno 3 o 4. Quando ci arrivi, il gioco ti chiede: <b>reclamare la vittoria</b> subito, oppure <b>continuare a giocare</b>. Se continui la partita prosegue e l'avversario può ancora ribaltarla. L'IA, se ci arriva lei, reclama sempre.</P>
        <Tip label="Attenzione" warn>
          L'Annientamento si controlla <b>a fine turno</b>, dopo la Tossina e dopo il controllo dei Campi. Tieni d'occhio i PV anche quando stai vincendo sul territorio.
        </Tip>
        <Fig src="fine.jpg" n="5" w={66} caption="Fine partita: qui l'IA ha conquistato tre Campi al turno 4. Dal disco si torna al Menù o si chiede la rivincita." />
      </>
    ),
  },
  {
    id: 'turno-1',
    sec: 'Le basi',
    title: 'Il turno · 1',
    toc: 'Il turno, passo per passo',
    body: () => (
      <>
        <Title lead="Ogni turno è uno scontro: un Campo, un Agente a testa.">Il turno, passo per passo</Title>
        <H2>Chi comincia</H2>
        <P>Al turno 1 ha l'<b>iniziativa</b> chi ha in mano la <b>somma di Lega più bassa</b> (a parità si tira a sorte). Poi l'iniziativa <b>si alterna</b> a ogni turno.</P>
        <H2>1 · Manovra: la scelta del Campo</H2>
        <P>Chi ha l'iniziativa sceglie su quale Campo si combatte, tra quelli <b>rivelati e non ancora conquistati</b>. Clicca il Campo sul tabellone a destra, dopo averne letto l'effetto.</P>
        <Fig src="campo.jpg" n="6" w={94} caption="Turno 2: «Tocca a te · Manovra». Il primo Campo è già conquistato, due restano coperti." />
        <H2>2 · Schieramento: la scelta degli Agenti</H2>
        <P>Chi ha l'iniziativa schiera <b>per primo</b> un Agente, a carte scoperte; poi tocca all'altro. <b>Trascina</b> la carta dalla mano al centro del tavolo. Giocare per secondi significa rispondere sapendo già chi si ha di fronte.</P>
      </>
    ),
  },
  {
    id: 'turno-2',
    sec: 'Le basi',
    title: 'Il turno · 2',
    body: () => (
      <>
        <H2>3 · Investimento: i Focus Coin</H2>
        <P>Schierato l'Agente, decidi <b>quanti Focus Coin</b> puntare su di lui: è la tua scommessa, e resta <b>segreta</b>. Muovi il cursore (o usa rotella e frecce) e premi <b>Conferma</b>.</P>
        <Fig src="investimento.jpg" n="7" w={94} caption="«Tocca a te · Investimento». Con 4 FC, un Agente con POT 5 vale 5×4 = 20, prima di Poteri e Bonus. Sotto il cursore, i 4 FC riservati." />
        <ul className="mn-list">
          <li>Devi investire <b>almeno 1 FC</b> a scontro.</li>
          <li>Devi sempre <b>tenerne 1 di riserva</b> per ogni Agente che ti resta da giocare: al turno 1, con 18 FC e quattro carte ancora in mano, il massimo è <b>14</b>. Il gioco te lo ricorda con «FC riservati».</li>
          <li>I FC spesi <b>non tornano</b>, salvo effetti che ne fanno guadagnare.</li>
        </ul>
        <H2>4 · Rivelazione ed esito</H2>
        <P>Quando entrambi hanno confermato, i Focus Coin si rivelano insieme. Si attivano Poteri e Bonus, si calcola il Valore Assalto e lo scontro si risolve. Nella schermata dell'esito: <T>S</T> salta l'animazione, <T>R</T> apre il riepilogo, <T>Invio</T> continua.</P>
      </>
    ),
  },
  {
    id: 'scontro',
    sec: 'Le basi',
    title: 'Lo scontro',
    toc: 'Lo scontro e il Valore Assalto',
    body: () => (
      <>
        <Title>Lo scontro</Title>
        <P>Vince lo scontro chi ha il <b>Valore Assalto</b> (VA) più alto. Non esiste il pareggio.</P>
        <div className="mn-formula">VA = <em>POT</em> × <em>FC</em> + modificatori</div>
        <P small>La POT è quella <b>dopo</b> gli effetti che la modificano. Il VA non scende mai sotto la POT dell'Agente, salvo un <T>(min)</T> scritto in un effetto «−VA».</P>
        <Fig src="esito.jpg" n="8" w={86} caption="Un esito vero. Ai lati, il conto del VA di ciascun Agente." />
        <Tip label="L'esempio della figura">
          <b>IA</b>: POT 5 × 5 FC = 25, meno 5 per il Bonus dei Figli dell'Orizzonte = <b>20</b>.<br />
          <b>Tu</b>: POT 5 × 3 FC = 15, più 8 per il Potere Turbo = <b>23</b>.<br />
          Vinci tu spendendo due FC in meno.
        </Tip>
        <H2>Se il VA è pari</H2>
        <ol className="mn-steps">
          <li>Vince l'Agente con la <b>Lega più bassa</b>.</li>
          <li>A parità di Lega, quello con la <b>POT finale più bassa</b>.</li>
          <li>Se è pari anche quella, vince chi ha <b>giocato per secondo</b>.</li>
        </ol>
      </>
    ),
  },
  {
    id: 'conseguenze',
    sec: 'Le basi',
    title: 'Dopo lo scontro',
    toc: 'Conseguenze e Focus Coin',
    body: () => (
      <>
        <Title>Dopo lo scontro</Title>
        <H2>Chi vince</H2>
        <ul className="mn-list">
          <li><b>Conquista il Campo.</b></li>
          <li>Infligge all'avversario il proprio <b>DAN</b>, con i suoi modificatori.</li>
          <li>Attiva gli effetti con trigger <b>Conquista</b>.</li>
        </ul>
        <H2>Chi perde</H2>
        <ul className="mn-list">
          <li>Subisce il DAN del vincitore. <b>Non</b> ne infligge.</li>
          <li>Attiva gli effetti con trigger <b>Ultimo Desiderio</b>.</li>
        </ul>
        <H2>Fine del turno</H2>
        <P>I due Agenti sono scartati, la Tossina (se c'è) fa il suo danno, si controllano le condizioni di vittoria, si <b>rivela un nuovo Campo</b> e l'iniziativa passa all'altro giocatore.</P>
        <H2>Gestire i Focus Coin</H2>
        <P>Diciotto FC per cinque scontri: in media meno di quattro a turno. La partita si decide qui.</P>
        <ul className="mn-list">
          <li><b>Perdere poco costa meno che vincere troppo.</b> Uno scontro perso con 1 FC lascia risorse per i successivi.</li>
          <li><b>Il timbro «Perfect»</b> compare quando hai vinto investendo il minimo indispensabile: né un FC in più, né uno in meno.</li>
          <li><b>5 FC</b> è una soglia: attiva <i>Overdrive</i> sulle tue carte e <i>Opportunista</i> su quelle avversarie.</li>
        </ul>
        <Tip>Guarda i FC rimasti all'avversario: sono in alto a sinistra. Chi ne ha di più all'ultimo turno, di solito, decide come finisce.</Tip>
      </>
    ),
  },
  {
    id: 'campi',
    sec: 'Le basi',
    title: 'I Campi di Battaglia',
    toc: 'I Campi di Battaglia',
    body: () => (
      <>
        <Title lead="Cinque Campi a partita, pescati da un archivio di oltre cento.">I Campi di Battaglia</Title>
        <P>All'inizio ne sono <b>rivelati tre</b>. Gli altri due si scoprono uno alla volta, a fine turno: il tabellone dice tra quanti turni. Su ogni Campo si combatte <b>una sola volta</b>.</P>
        <P>Quasi ogni Campo ha un <b>effetto</b> che vale per lo scontro che ospita. Sotto il nome trovi, in breve, <b>quando</b> agisce, <b>su chi</b> e <b>cosa</b> fa. Per esempio:</P>
        <table className="mn-tbl is-wrap is-tight">
          <thead><tr><th>Sul tabellone</th><th>Significa</th></tr></thead>
          <tbody>
            <tr><td>In scontro · Entrambi · +2 DAN</td><td>Durante lo scontro, tutti e due gli Agenti hanno 2 DAN in più.</td></tr>
            <tr><td>Post-scontro · Perdente · −1 FC</td><td>Chi perde lo scontro perde anche 1 Focus Coin.</td></tr>
            <tr><td>Regola · Agenti con la stessa Lega · Poteri disattivati</td><td>Una regola speciale: se i due Agenti hanno Lega uguale, i Poteri non funzionano.</td></tr>
          </tbody>
        </table>
        <H2>Le famiglie di Campi</H2>
        <ul className="mn-list">
          <li><b>Valori.</b> Cambiano POT o DAN degli Agenti.</li>
          <li><b>Vincolo.</b> Impongono una regola: Poteri o Bonus spenti, tetti alle statistiche.</li>
          <li><b>Condizionale.</b> Premiano o puniscono chi vince o chi perde lo scontro, in PV o FC.</li>
          <li><b>Focus.</b> Cambiano quanto contano i Focus Coin investiti.</li>
          <li><b>Innesco.</b> Forzano o modificano i trigger.</li>
          <li><b>Neutro.</b> Nessun effetto.</li>
        </ul>
        <Tip>Scegliere il Campo è un'arma. Con l'iniziativa puoi portare lo scontro dove il tuo Agente rende di più, o dove quello avversario rende di meno. Tutti i Campi sono in <b>Galleria → Campi</b>.</Tip>
      </>
    ),
  },

  // ───────── Capitolo 3 ─────────
  {
    id: 'bonus',
    sec: 'Meccaniche avanzate',
    title: 'Il Bonus Armata',
    toc: 'Il Bonus Armata',
    body: () => (
      <>
        <Title kicker="Capitolo 3">Meccaniche avanzate</Title>
        <H2>Il Bonus Armata</H2>
        <P>Ogni armata ha un Bonus, scritto su tutte le sue carte accanto al simbolo ✠. Funziona così:</P>
        <ul className="mn-list">
          <li>Si accende se tra le <b>cinque carte della mano iniziale</b> ce ne sono <b>almeno due</b> di quell'armata. Si decide all'inizio e vale per tutta la partita.</li>
          <li>Agisce solo negli scontri in cui <b>giochi un Agente di quell'armata</b>, e solo se il suo trigger è soddisfatto.</li>
          <li>Si risolve <b>dopo i Poteri</b>.</li>
          <li>In un esercito misto puoi avere più Bonus accesi, uno per armata con almeno due carte in mano.</li>
        </ul>
        <Tip label="Eccezione">Al <b>Patto degli Indocili</b> basta una sola carta in mano. In cambio il suo Bonus ha il trigger <i>Rinforzi</i>, che chiede altre due carte della stessa Lega.</Tip>
        <table className="mn-tbl is-tight">
          <thead><tr><th>Armata</th><th>Bonus</th></tr></thead>
          <tbody>
            {MANUAL_ARMIES.map((name) => (
              <tr key={name}><td>{name}</td><td style={{ fontFamily: 'var(--mn-mono)' }}>{ARMY_BONUSES[name].description}</td></tr>
            ))}
          </tbody>
        </table>
      </>
    ),
  },
  {
    id: 'trigger-1',
    sec: 'Meccaniche avanzate',
    title: 'I trigger',
    toc: 'I trigger',
    body: () => (
      <>
        <Title lead="Il trigger è la condizione che accende un Potere o un Bonus.">I trigger</Title>
        <P small>È la parola prima dei due punti. Se la condizione non è vera in quello scontro, l'effetto non si attiva.</P>
        <Entries items={triggers.slice(0, half(triggers))} />
      </>
    ),
  },
  {
    id: 'trigger-2',
    sec: 'Meccaniche avanzate',
    title: 'I trigger',
    body: () => (
      <>
        <Entries items={triggers.slice(half(triggers))} />
        <Tip label="Da ricordare">
          <b>Conquista</b> e <b>Ultimo Desiderio</b> si risolvono dopo il calcolo del VA: non cambiano chi vince lo scontro. <b>Gloria</b> e <b>Vendetta</b> al turno 1 non si attivano mai. <b>Rimonta</b> e <b>Magnanimo</b> non si attivano a PV pari.
        </Tip>
      </>
    ),
  },
  {
    id: 'effetti-1',
    sec: 'Meccaniche avanzate',
    title: 'Gli effetti',
    toc: 'Gli effetti',
    body: () => (
      <>
        <Title lead="Quello che un Potere o un Bonus fa, una volta acceso.">Gli effetti</Title>
        <P small>«nem.» indica che l'effetto colpisce l'Agente nemico. X e Y sono numeri scritti sulla carta.</P>
        <Entries items={effects.slice(0, half(effects))} />
      </>
    ),
  },
  {
    id: 'effetti-2',
    sec: 'Meccaniche avanzate',
    title: 'Gli effetti',
    body: () => (
      <>
        <Entries items={effects.slice(half(effects))} />
        <Tip label="Immune, in dettaglio">
          {term('Immune')?.detail}
        </Tip>
      </>
    ),
  },
  {
    id: 'eminenze-1',
    sec: 'Meccaniche avanzate',
    title: 'Le Eminenze',
    toc: 'Le Eminenze',
    body: () => (
      <>
        <Title lead="Nel formato Standard ogni comandante è affiancato da un'Eminenza.">Le Eminenze</Title>
        <Fig src="eminenza.jpg" n="9" w={88} caption="Inizio turno, «Comando». L'Eminenza avversaria mostra Statico e Presenza; subito dopo scegli la tua abilità." />
        <ul className="mn-list">
          <li><b>Quale Eminenza.</b> Quella dell'armata di cui hai <b>almeno 5 carte</b> nell'esercito da 10. Senza un'armata con 5 carte, giochi senza Eminenza.</li>
          <li><b>Statico.</b> Un effetto passivo, sempre attivo.</li>
          <li><b>Presenza.</b> La risorsa dell'Eminenza: parte da un valore iniziale e cambia con abilità e Statico.</li>
          <li><b>Abilità.</b> A ogni turno ne scegli una. Quelle con <b>+</b> o <b>±0</b> sono gratuite e danno Presenza; quelle con <b>−</b> la costano e si possono usare solo se ne hai abbastanza.</li>
        </ul>
        <P>La scelta è <b>segreta</b>: clicca l'abilità e clicca di nuovo per confermare. Viene rivelata più avanti nel turno, nel momento indicato sull'abilità: «Pre Campo», «Pre Agente» oppure «Generale».</P>
      </>
    ),
  },
];

const CORE_PAGES_B = [
  // ───────── Capitolo 5 ─────────
  {
    id: 'modalita',
    sec: 'Modalità e interfaccia',
    title: 'Le modalità di gioco',
    toc: 'Le modalità di gioco',
    body: () => (
      <>
        <Title kicker="Capitolo 5">Modalità e interfaccia</Title>
        <H2>Campagna</H2>
        <P>La modalità storia. Tre <b>slot di salvataggio</b> indipendenti: riprendi un cammino o iniziane uno nuovo. Le partite della campagna possono avere regole proprie.</P>
        <Fig src="campagna.jpg" n="10" w={54} caption="La scelta dello slot di salvataggio della campagna." />
        <H2>Multiplayer</H2>
        <P>Partite online, in beta. Uno dei giocatori sceglie <b>Crea stanza</b> e riceve un <b>codice di 6 caratteri</b>; l'altro sceglie <b>Entra con codice</b>. In stanza: <T>C</T> copia il codice, <T>Invio</T> segnala che sei pronto.</P>
        <Fig src="multiplayer.jpg" n="11" w={54} caption="La lobby del multiplayer." />
        <H2>2v2 e Re della collina</H2>
        <P small>Si scelgono dal pannello «Imposta la partita» della Partita locale. Non usano le Eminenze.</P>
      </>
    ),
  },
  {
    id: 'eserciti',
    sec: 'Modalità e interfaccia',
    title: 'Eserciti e Galleria',
    toc: 'Gestione eserciti e Galleria',
    body: () => (
      <>
        <Title>Gestione eserciti</Title>
        <P>Qui costruisci i tuoi eserciti. Le regole sono tre:</P>
        <ul className="mn-list">
          <li>Esattamente <b>10 Agenti</b>, ognuno una sola volta.</li>
          <li>Somma delle Leghe esattamente <b>30</b>.</li>
          <li>Puoi <b>mescolare le armate</b>. Ricorda però: il Bonus chiede due carte di quell'armata nella mano di cinque, l'Eminenza ne chiede cinque nell'esercito.</li>
        </ul>
        <Fig src="eserciti.jpg" n="12" w={64} caption="La gestione degli eserciti." />
        <H2>Galleria</H2>
        <P>L'archivio completo: <b>Agenti</b>, facce <b>alternative</b>, <b>Eminenze</b> e <b>Campi</b>. Si cambia scheda con <T>Q</T> ed <T>E</T>. È il posto giusto per studiare un'armata prima di affrontarla.</P>
        <Fig src="galleria.jpg" n="13" w={64} caption="La Galleria." />
      </>
    ),
  },
  {
    id: 'glossario',
    sec: 'Modalità e interfaccia',
    title: 'Glossario e Opzioni',
    toc: 'Glossario e Opzioni',
    body: () => (
      <>
        <Title>Il Glossario</Title>
        <P>In partita, il pulsante <b>Glossario</b> in basso a sinistra apre un dizionario con ricerca: concetti base, condizioni di vittoria, trigger, effetti, archetipi. Su/giù scorre le voci, ←/→ cambia categoria, <T>Invio</T> apre la spiegazione completa.</P>
        <Fig src="glossario.jpg" n="14" w={64} caption="Il Glossario aperto durante una partita." />
        <Title>Opzioni</Title>
        <P>Quattro categorie: <b>Schermo</b>, <b>Grafica</b>, <b>Interfaccia</b> e <b>Audio</b>. Con <T>Q</T> ed <T>E</T> cambi categoria, su/giù scegli la voce, ←/→ cambi il valore. In basso trovi sempre la spiegazione della voce selezionata.</P>
        <Fig src="opzioni.jpg" n="15" w={64} caption="La schermata delle Opzioni." />
      </>
    ),
  },
  {
    id: 'comandi',
    sec: 'Modalità e interfaccia',
    title: 'Comandi',
    toc: 'Comandi',
    body: () => (
      <>
        <Title lead="Tutto si può fare con il mouse. Questi sono i tasti.">Comandi</Title>
        <table className="mn-tbl is-wrap is-tight">
          <thead><tr><th>Dove</th><th>Tasto</th><th>Azione</th></tr></thead>
          <tbody>
            <tr><td rowSpan="2">Menu</td><td>↑ ↓</td><td>Scorri le voci</td></tr>
            <tr><td>Invio · Esc</td><td>Scegli · Torna indietro</td></tr>
            <tr><td rowSpan="2">Scelta armata</td><td>↑ ↓ · Invio</td><td>Cambia armata · Schiera</td></tr>
            <tr><td>S</td><td>Apri il dossier</td></tr>
            <tr><td rowSpan="2">Scelta esercito</td><td>← → · Invio</td><td>Cambia esercito · Conferma</td></tr>
            <tr><td>P</td><td>Personalizza</td></tr>
            <tr><td>Imposta la partita</td><td>↑ ↓ · ← → · Invio</td><td>Riga · Valore · Inizia</td></tr>
            <tr><td rowSpan="5">In partita</td><td>Clic su una carta</td><td>Anteprima in grande</td></tr>
            <tr><td>Trascina la carta</td><td>Schiera l'Agente</td></tr>
            <tr><td>Rotella · ← →</td><td>Focus Coin −1 / +1</td></tr>
            <tr><td>Clic su un Campo</td><td>Scegli il Campo</td></tr>
            <tr><td>Esc</td><td>Chiudi il dettaglio della carta</td></tr>
            <tr><td rowSpan="2">Esito</td><td>S · R</td><td>Salta · Riepilogo</td></tr>
            <tr><td>Invio</td><td>Continua</td></tr>
            <tr><td>Glossario</td><td>↑ ↓ · ← → · Invio</td><td>Voce · Categoria · Espandi</td></tr>
            <tr><td>Opzioni · Galleria</td><td>Q · E</td><td>Categoria o scheda precedente · successiva</td></tr>
            <tr><td>Stanza online</td><td>C · Invio</td><td>Copia codice · Pronto</td></tr>
            <tr><td>Manuale</td><td>← → · I · Esc</td><td>Sfoglia · Indice · Chiudi</td></tr>
          </tbody>
        </table>
      </>
    ),
  },
  {
    id: 'consigli',
    sec: 'Modalità e interfaccia',
    title: 'Consigli',
    toc: 'Dieci consigli per cominciare',
    body: () => (
      <>
        <Title lead="Dieci cose che avremmo voluto sapere alla prima partita.">Consigli</Title>
        <ol className="mn-steps">
          <li><b>Conta i Focus Coin, non le carte.</b> Diciotto per cinque scontri: ogni FC in più oggi è uno in meno domani.</li>
          <li><b>Leggi la mano avversaria.</b> È scoperta. Sapere quali Agenti gli restano dice quanto dovrà spendere.</li>
          <li><b>Scegli quali scontri perdere.</b> Perderne uno con 1 FC è spesso la mossa migliore del turno.</li>
          <li><b>Tieni d'occhio il turno 5.</b> Lì contano solo i PV: un DAN alto all'ultimo turno ribalta una partita.</li>
          <li><b>Chi gioca per secondo ha un'informazione in più.</b> Tieni un Agente con <i>Intervento</i> per quei turni.</li>
          <li><b>Il Campo è metà dello scontro.</b> Un +2 DAN a entrambi fa comodo solo a chi è sicuro di vincere.</li>
          <li><b>Attento alla soglia dei 5 FC.</b> Accende il tuo Overdrive, ma anche l'Opportunista altrui.</li>
          <li><b>La parità premia i piccoli.</b> A VA uguale vince la Lega più bassa.</li>
          <li><b>Tre Campi? Pensa prima di continuare.</b> Reclamare chiude la partita; proseguire la rimette in gioco.</li>
          <li><b>Usa il Log.</b> Se un numero non torna, lì trovi ogni modificatore, riga per riga.</li>
        </ol>
      </>
    ),
  },
  {
    id: 'appunti',
    sec: 'Modalità e interfaccia',
    title: 'Appunti',
    toc: 'Appunti',
    body: () => (
      <>
        <Title lead="Eserciti provati, abbinamenti riusciti, conti da ricordare.">Appunti</Title>
        <div className="mn-notes">{Array.from({ length: 17 }, (_, i) => <i key={i} />)}</div>
      </>
    ),
  },
  {
    id: 'quarta',
    kind: 'back',
    title: 'Quarta di copertina',
    body: () => (
      <>
        <div className="mn-cover-strip"><span>SATZE</span><span>LIBRETTO DI ISTRUZIONI</span></div>
        <div className="mn-back-body">
          <h2>Cinque carte.<br />Diciotto monete.<br />Nessun segreto,<br />tranne uno.</h2>
          <p>Le mani sono scoperte. I Campi si vedono arrivare. L'unica cosa che l'avversario non sa è quanto sei disposto a spendere per questo scontro.</p>
          <div className="mn-back-shots">
            <img src={`${IMG}tavolo.jpg`} alt="" />
            <img src={`${IMG}esito.jpg`} alt="" />
          </div>
        </div>
        <div className="mn-cover-foot">
          <span>VERSIONE {SATZE_VERSION} · ALPHA</span>
          <span>IL GLOSSARIO IN PARTITA FA SEMPRE FEDE</span>
        </div>
      </>
    ),
  },
];

/** Tutte le pagine, nell'ordine di lettura. */
export const MANUAL_PAGES = [
  ...CORE_PAGES_A,
  ...eminencePages(),
  ...armyPages(),
  ...CORE_PAGES_B,
];

/** Voci dell'indice: { id, sec, label, index }. */
export const MANUAL_TOC = MANUAL_PAGES
  .map((p, index) => (p.toc ? { id: p.id, sec: p.sec, label: p.toc, index } : null))
  .filter(Boolean);

/** Una pagina del libretto. side: 'left' | 'right' (posizione nella doppia pagina). */
export function ManualPage({ index, goTo }) {
  const page = MANUAL_PAGES[index];
  if (!page) return null;
  const side = index % 2 === 0 ? 'right' : 'left';
  const kindClass = page.kind === 'cover' ? ' is-cover' : page.kind === 'back' ? ' is-back' : '';
  const plain = !page.kind;
  return (
    <article className={`mn-page is-${side}${kindClass}`} data-page={page.id}>
      {plain ? (
        <header className="mn-head">
          <span className="mn-head-sec">{page.sec}</span>
          <span className="mn-head-title">{page.title}</span>
        </header>
      ) : null}
      {page.body({ toc: MANUAL_TOC, goTo })}
      {plain ? (
        <footer className="mn-foot">
          <span className="mn-folio">{index + 1}</span>
          <span>SATZE · LIBRETTO DI ISTRUZIONI</span>
        </footer>
      ) : null}
    </article>
  );
}

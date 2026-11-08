// ============================================
// GUIDA DEL GIOCO · forum #guida (un post per argomento, sola lettura)
// Fonte: il codice del gioco (src/game, src/data, Codice/satze.jsx), verificato il 2026-11-08
// sulla versione 0.1.0. Dove i documenti in Documentazione/ o i testi in gioco non coincidono
// con il codice, vale il codice.
// Ogni post: { titolo (max 100 caratteri), messaggi: [testi da max 2000 caratteri] }.
// ============================================

export function guida(cfg) {
  const v = cfg.versione;
  return [
    {
      titolo: '📖 Indice e legenda',
      messaggi: [
        `# Guida di SATZE · v${v}
Regolamento e riferimento tecnico della build di playtest. Un post per argomento, da leggere in quest'ordine:

1. Partita e mazzo
2. La carta Agente
3. Il round passo per passo
4. Lo scontro: VA, vincitore, danno
5. Vittoria e sconfitta
6. Trigger
7. Effetti
8. Bonus Armata e le 12 armate
9. Campi: come funzionano
10. Campi: elenco completo
11. Eminenze: come funzionano
12. Eminenze: elenco completo
13. Modalità, formati e IA
14. 2v2 ad abbinamenti segreti
15. Re della collina
16. Multiplayer online
17. Eserciti, Tutorial, Galleria, Opzioni
18. Limiti noti di questa build

## Stato delle funzioni
- ✅ **Stabile**: Duello 1v1 e regole base, Campi, 2v2, Re della collina, Multiplayer.
- 🧪 **In test, non bilanciato**: **Eminenze**. Sono una meccanica secondaria: le regole possono cambiare e i valori non sono ancora bilanciati.
- ✏️ **In bozza**: stili grafici alternativi delle carte **Eldritch** e **Arcana**.
- 📝 **Testi provvisori**: i **testi descrittivi delle carte** (flavour text) e le **informazioni nelle schermate delle armate** sono segnaposto. Non descrivono le regole: per quelle vale questa guida.
- 🚧 **Non giocabile**: **Campagna**. È visibile nel menu ma è in via di definizione.

## Note
- La guida descrive il comportamento reale del gioco. Se il Glossario o il Tutorial in gioco dicono una cosa diversa, vale la guida: segnalalo in <#bug> con il tag **regole / effetti**.
- Abbreviazioni: **PV** punti vita · **FC** Focus Coin · **POT** Potenza · **DAN** Danno · **VA** Valore Assalto · **nem.** nemico.`,
      ],
    },

    {
      titolo: '1 · Partita e mazzo',
      messaggi: [
        `# Partita e mazzo
## Risorse di ogni giocatore
- **25 PV**. Le cure non superano 25.
- **18 FC** per tutta la partita. Non si ricaricano: si recuperano solo con effetti "+X FC".

## Esercito (mazzo)
- Esattamente **10 carte**, con **somma delle Leghe esattamente 30**.
- Ogni carta **al massimo una volta**.
- Si possono **mescolare carte di armate diverse**.
- Ogni armata ha 30 carte disponibili (360 in tutto) e 3 eserciti precostruiti (il Patto degli Indocili ne ha 5).

## Mano
- A inizio partita si pescano a caso **5 carte** delle 10 dell'esercito. Le altre 5 non entrano in gioco.
- Quella è la mano per tutta la partita: **niente pescate, niente mulligan, niente scarti**.
- Ogni carta giocata viene usata una sola volta.
- **La mano dell'avversario è visibile**, e lo è anche la sua riserva di FC. Restano nascosti i FC che investe in ogni scontro, fino alla rivelazione.

## Campi di battaglia
- Ogni partita ha **5 Campi**: **3 scoperti** all'inizio, **1 in più** alla fine di ogni round.
- Dettagli nei post sui Campi.

## Iniziativa
- **Round 1**: ha l'iniziativa chi ha la **somma delle Leghe più bassa** nella mano di 5. A parità si decide a caso.
- Poi l'iniziativa **si alterna ogni round**.
- Chi ha l'iniziativa sceglie il Campo e schiera per primo.

## Durata
- Al massimo **5 round**, uno scontro per round. Dopo il 5° round le carte sono finite.`,
      ],
    },

    {
      titolo: '2 · La carta Agente',
      messaggi: [
        `# La carta Agente
- **Nome** e illustrazione.
- **POT (Potenza)**: il cerchio a un lato del nome. Moltiplica i FC investiti (vedi VA).
- **DAN (Danno)**: il cerchio all'altro lato del nome. Sono i PV che togli all'avversario **se vinci** lo scontro.
- **Barra dell'armata** in basso: nome dell'armata e **Lega**, da **L2** a **L5**.

## A cosa serve la Lega
- Calcolare chi ha l'iniziativa al round 1.
- Spareggio a parità di VA: vince la **Lega più bassa**.
- I trigger **Sfida**, **Sopraffare**, **Alleato** e **Rinforzi**.
- Il limite di 30 dell'esercito.

## ★ Potere
- Formato **Trigger: effetto**, ad esempio "Imboscata: +2 POT".
- Se il trigger non è soddisfatto, il Potere non fa nulla.
- Senza trigger (o con "Sempre:") il Potere è **sempre attivo**.

## ✠ Bonus
- È il **Bonus Armata** dell'armata della carta: vedi il post 8.

## Archetipi e rapporto col Focus
- Etichette come Campione, Soffocatore, Vorace o Predatore servono solo a leggere e filtrare le carte. **Non cambiano le regole.**`,
      ],
    },

    {
      titolo: '3 · Il round passo per passo',
      messaggi: [
        `# Il round passo per passo
1. **Scelta del Campo.** La fa **solo chi ha l'iniziativa**, tra i Campi scoperti e non ancora conquistati. Si può cambiare finché gli Agenti non sono confermati.
2. **Schieramento del primo giocatore.** Sceglie l'Agente e quanti FC investire, poi conferma. L'Agente diventa **pubblico**, i FC restano **nascosti**.
3. **Schieramento del secondo giocatore.** Può schierare solo dopo il primo: **vede l'Agente avversario ma non i suoi FC**.
4. **Rivelazione e risoluzione** dello scontro (post 4).
5. **Fine round**, in quest'ordine:
   - danni dello scontro;
   - **Tossina** (se attiva);
   - il vincitore **conquista** il Campo;
   - si scopre un nuovo Campo;
   - controllo della vittoria (post 5);
   - l'iniziativa passa all'altro giocatore.

## Quanti FC si possono investire
- **Minimo 1** per scontro.
- **Massimo**: la tua riserva meno 1 FC per ogni altra carta che ti resta in mano. Devi sempre poter investire almeno 1 FC negli scontri successivi.
- Esempio al round 1: 18 FC, 4 carte che restano dopo questa → massimo **14**.
- I FC investiti si **spendono comunque**, che tu vinca o perda.

Con le Eminenze attive (formato Standard) a ogni round si aggiunge la scelta segreta di un'abilità: vedi il post 11.`,
      ],
    },

    {
      titolo: '4 · Lo scontro: VA, vincitore, danno',
      messaggi: [
        `# Lo scontro
## Valore Assalto
**VA = POT × FC investiti + modificatori di VA**
- Il VA non scende mai sotto la **POT attuale** dell'Agente, cioè dopo gli effetti.
- Un effetto "−X VA nem. (min Y)" sostituisce quel minimo con Y. Se ci sono più minimi vale il più basso; se il VA è già sotto Y l'effetto non fa nulla.

## Chi vince
1. Il **VA più alto**.
2. A parità di VA: la **Lega più bassa**.
3. Poi la **POT finale più bassa**.
4. Poi **chi ha giocato per secondo**.

Lo scontro non finisce mai in parità. Alcuni Campi cambiano il criterio (ad esempio vince chi ha più FC, POT o DAN finale).

## Danno
- **Solo il vincitore** infligge danno: il **suo DAN finale** ai PV del perdente. Il perdente non infligge DAN.
- I PV non scendono sotto 0.
- I **Danni diretti** colpiscono durante lo scontro, qualunque sia l'esito.
- Il vincitore **conquista il Campo** (salvo effetti che lo distruggono o annullano la conquista).

## Ordine di risoluzione
1. Si calcola **Immune**.
2. Effetti del Campo che preparano lo scontro.
3. **Blocca Potere / Blocca Bonus**, prima di ogni altro effetto. Due blocchi opposti si applicano entrambi.
4. **Inversione**.
5. **Poteri**, prima quello di chi ha l'iniziativa.
6. **Bonus Armata**, nello stesso ordine.
7. Effetti tardivi del Campo.
8. Calcolo del **VA** e del vincitore.
9. **Conquista** e **Ultimo desiderio**: si risolvono dopo l'esito, quindi non cambiano il VA.
10. Danno, effetti del Campo dopo lo scontro, sottrazione dei FC investiti.

## PERFECT
Timbro grafico: compare quando il vincitore ha investito il minimo indispensabile (con 1 FC in meno avrebbe perso). Non dà nessun bonus.`,
      ],
    },

    {
      titolo: '5 · Vittoria e sconfitta',
      messaggi: [
        `# Vittoria e sconfitta
I controlli si fanno **a fine round**, dopo la Tossina.

## Conquista territoriale (round 1-4)
- Vince chi ha **3 Campi** su 5.
- **Reclamazione**: se arrivi a 3 Campi al round 3 o 4, il gioco ti chiede se **reclamare la vittoria** subito o **continuare**.
- Se è l'**IA** ad arrivare a 3 Campi, vince subito. Online la scelta spetta al giocatore che ha i 3 Campi.

## Supremazia (round 5)
- Al round 5 non si vince più per Campi.
- Finite le carte vince chi ha **più PV**. A parità di PV vince chi ha **più Campi**. Altrimenti è **pareggio**.

## Annientamento
- Chi arriva a **0 PV** perde. Il controllo avviene a fine round, non a metà scontro.`,
      ],
    },

    {
      titolo: '6 · Trigger',
      messaggi: [
        `# Trigger
La condizione prima dei due punti in un Potere o in un Bonus. Tra parentesi quante carte lo usano.

**Turno e iniziativa**
- **Imboscata** (37): hai l'iniziativa in questo round.
- **Intervento** (29): giochi per secondo.
- **Turbo** (17): round 1 o 2.
- **Ultima Chance** (10): round 5.
- **Resa dei conti** (22): entrambi avete giocato almeno 3 carte, contando quella attuale (cioè dal 3° scontro).

**Scontro precedente**
- **Gloria** (23): hai vinto lo scontro precedente. Mai al round 1.
- **Vendetta** (26): hai perso lo scontro precedente. Mai al round 1.

**PV e Campi**
- **Rimonta** (20): hai meno PV dell'avversario.
- **Magnanimo** (13): hai più PV dell'avversario. I PV si leggono quando l'Agente viene schierato.
- **Invasione** (16): hai già conquistato almeno 1 Campo.
- **Resistenza** (20): l'avversario ha già conquistato almeno 1 Campo.

**Lega**
- **Sfida** (16): la Lega del tuo Agente è **minore** di quella nemica.
- **Sopraffare** (11): la Lega del tuo Agente è **maggiore** di quella nemica.
- **Alleato** (22): nella tua mano iniziale c'era almeno **1 altra** carta della stessa Lega. Contano anche quelle già giocate.
- **Rinforzi** (solo Bonus del Patto): almeno **2 altre** carte della stessa Lega nella mano iniziale.

**FC**
- **Overdrive** (20): hai **5 o più FC** sull'Agente, contando quelli temporanei. Da solo non fa nulla: serve un effetto che lo usi.
- **Opportunista** (12): l'avversario ha investito **5 o più FC** reali (i FC temporanei non contano).

**Esito** (si risolvono dopo il calcolo del VA)
- **Conquista** (15): vinci questo scontro.
- **Ultimo desiderio** (14): perdi questo scontro.

**Nessun trigger / Sempre** (17): il Potere è sempre attivo.`,
      ],
    },

    {
      titolo: '7 · Effetti',
      messaggi: [
        `# Effetti
Il testo dopo i due punti.

**Statistiche**
- **+X POT / +X DAN**: aumenta la POT o il DAN del tuo Agente.
- **+X VA**: aggiunge X al VA dopo la moltiplicazione POT × FC.
- **−X POT / −X DAN / −X VA nem. (min Y)**: riduce la statistica nemica senza portarla sotto Y.
  - Senza "(min)" la POT nemica non scende sotto 1 e il DAN sotto 0.
  - Più riduzioni si applicano una alla volta, ciascuna col proprio minimo.
- **Attrizione X [stat]**: +X per ogni carta che hai già giocato (esclusa quella attuale). Al round 1 vale 0.
- **Escalation X [stat]**: +X per ogni Campo che avevi conquistato all'inizio dello scontro.

**Risorse e PV**
- **+X FC**: aggiunge X FC alla tua riserva.
- **Cura X**: +X PV, mai oltre 25. Avviene prima del danno dello scontro.
- **X Danni dir.**: l'avversario perde X PV durante lo scontro, qualunque sia l'esito.
- **−X PV**: perdi tu X PV.
- **Tossina X (min Y)**: a fine round il bersaglio perde X PV ma non scende sotto Y. Quando arriva a Y la Tossina si spegne.
  - La prima perdita avviene già alla fine del round in cui viene applicata.
  - Se viene riapplicata mentre è attiva, sale di +1.`,
        `**Copia e imposizione**
- **Copia POT / Copia DAN**: la tua POT o il tuo DAN diventano uguali a quelli nemici in quel momento.
- **Imponi POT / Imponi DAN**: la POT o il DAN nemici diventano uguali ai tuoi in quel momento.
- **Copia Potere**: esegui il Potere nemico come se fosse tuo, solo se il suo trigger è soddisfatto dal tuo lato.
- **Copia Bonus**: usi il Bonus Armata nemico, se il nemico lo ha attivo.

**Blocchi e protezioni**
- **Blocca Potere**: il Potere nemico non si attiva. Si applica prima di tutti gli altri Poteri. Due Blocca Potere opposti si applicano entrambi.
- **Blocca Bonus**: il Bonus Armata nemico non si attiva in questo scontro.
- **Immune**: annulla −POT, −DAN e −VA nemici, gli Imponi e i malus dei Campi. **Non** annulla i Blocca, i Danni diretti e la Tossina.
- **Inversione**: si attiva prima degli altri Poteri.
  - Le riduzioni nemiche di POT, DAN e VA diventano bonus per te.
  - I modificatori del Campo su di te si capovolgono.
  - Non agisce su Imponi, Copia, Danni diretti e Tossina.

**FC temporanei** (solo da Eminenze)
- Valgono per il VA e per Overdrive.
- Non contano per Opportunista e non si tolgono dalla riserva.`,
      ],
    },

    {
      titolo: '8 · Bonus Armata e le 12 armate',
      messaggi: [
        `# Bonus Armata
- Si attiva se nella **mano iniziale** ci sono **almeno 2 carte** di quell'armata. Lo stato resta fisso per tutta la partita.
- **Eccezione Patto degli Indocili**: basta 1 carta, ma il suo Bonus ha trigger Rinforzi.
- Vale solo quando giochi un Agente di **quell'armata**, se il trigger del Bonus è soddisfatto.
- Si risolve **dopo i Poteri**.

# Le 12 armate
- **Figli dell'Orizzonte** · Bonus *−5 VA nem. (min 6)* · Controllo del VA: riducono quello avversario e alzano il proprio; economia di FC, blocchi.
- **Kethran** · *Rimonta: +2 POT* · Crescono quando sono in svantaggio: Vendetta e Ultimo desiderio, conquiste pagate in PV.
- **Corte Rossa** · *Copia Bonus nemico* · Reattiva, gioca bene per seconda (Intervento): copie, Blocca Potere, riduzioni di POT.
- **Calibri Pesanti** · *−2 DAN nem. (min 2)* · Difensiva con picchi in Overdrive; Resistenza, cure, Immune.
- **Orathai** · *Resa dei conti: +2 DAN* · Sostegno e vantaggio in PV: Magnanimo, cure, Alleato, rendita di FC.
- **Mounthborn (Nati dalla Bocca)** · *Imboscata: +1 POT, +1 DAN* · Sciame aggressivo: Imboscata e Intervento, Danni diretti.
- **L'Enclave delle Scaglie** · *Conquista: +2 FC* · Effetto valanga: tanti +POT, Gloria, Sfida sulle carte di Lega bassa.
- **Ratti della Megera** · *Conquista: Tossina 1 (min 10)* · Logoramento: riduzioni di POT e VA, Tossine.
- **Patto degli Indocili** · *Rinforzi: −1 POT, −1 DAN nem. (min 2)* · Nessuna carta di Lega 5; Turbo, Opportunista, malus combinati. Gli eserciti B-E mescolano altre armate.
- **Khemet** · *Overdrive: Immune* · Sigilli e Imponi DAN, grandi bonus di VA a condizione.
- **Apex** · *Invasione: +5 VA* · Caccia territoriale: Conquista, Gloria, Alleato, Leghe 5 pesanti.
- **Mascarada** · *Opportunista: +2 FC* · Lotta libera: Gloria, Overdrive, Vendetta, Opportunista, Rimonta.`,
      ],
    },

    {
      titolo: '9 · Campi: come funzionano',
      messaggi: [
        `# Campi di battaglia
## Estrazione
- Ogni partita ha **5 Campi**, estratti a caso in base alla rarità: **comune**, **raro**, **speciale**.
  - Al massimo **1 speciale** per partita, e solo negli ultimi due posti.
  - Alcuni Campi non possono uscire nei primi 3 posti: sono quelli segnati **T2** nell'elenco.
- **3 scoperti** all'inizio, **1 in più** alla fine di ogni round.

## Scelta e conquista
- **Chi ha l'iniziativa** sceglie su quale Campo si combatte, tra quelli scoperti e non conquistati.
- L'effetto di un Campo vale **solo nello scontro giocato su quel Campo**.
- Chi vince lo scontro **conquista** il Campo: 3 Campi conquistati danno la vittoria nei round 1-4.

## Quando agisce un Campo
L'etichetta all'inizio dell'effetto lo dice:
- **Regola**: cambia una regola per tutto lo scontro.
- **In scontro**: modifica le statistiche prima del VA. Gli Agenti Immune ignorano i malus.
- **Calcolo VA**: agisce sul calcolo del VA.
- **Conquista**: colpisce **chi vince** e conquista.
- **Ultimo Desiderio**: colpisce **chi perde**.
- **Post-scontro**: si applica dopo lo scontro, al perdente, al vincitore o a entrambi.

## Formato Mani nude
- Si usano solo i **5 Campi neutri**, senza effetti, tutti scoperti dall'inizio.`,
      ],
    },

    {
      titolo: '10 · Campi: elenco completo',
      messaggi: [
        `# Campi · elenco (121)
Formato: **Nome** — effetto · rarità (c comune, r raro, s speciale) · **T2** = non esce nei primi 3 posti.

**Generici (1/2)**
- **Gran Corno** — In scontro · Entrambi · +4 POT · r
- **Altopiano delle Tre Lune** — In scontro · Entrambi · −1 POT, +1 DAN · c
- **Arena degli Gnomi** — Regola · Poteri disattivati · r
- **Miniera di Lacrime** — Conquista · +2 PV · c · T2
- **Nido dell'Antico** — In scontro · Entrambi · −2 DAN · c
- **Tempio del Monaco Pazzo** — Regola · Bonus disattivati · r
- **Sala degli Specchi** — In scontro · Entrambi · POT scambiate · s
- **Cripta dei Sussurri** — Post-scontro · Perdente · +1 FC · c
- **Porte di Atlantide** — Calcolo VA · Entrambi · FC ×2 · s
- **Nido di Spine** — Conquista · −5 PV · r
- **Canyon delle Lame** — Ultimo Desiderio · −2 PV · c
- **Torre d'Avorio** — Conquista · +1 FC · c
- **Fossa dei Leoni** — In scontro · Entrambi · +2 DAN · c
- **Santuario del Silenzio** — Regola · Poteri e Bonus disattivati · s
- **Nexus Arcano** — Regola · DAN max 4 · r
- **Voragine Infinita** — Post-scontro · Entrambi · −3 PV · c · T2
- **Altare del Sacrificio** — Conquista · −2 PV · c
- **Biblioteca Proibita** — In scontro · Chi investe meno FC · +5 VA · s
- **Baia delle Navi Spezzate** — In scontro · Chi ha meno PV · +4 VA · c · T2
- **Fossa delle Reclute** — In scontro · Agente con Lega più bassa · +1 POT · r
- **Sala delle Volte Fratturate** — In scontro · Agente con DAN più alto · −4 VA · c
- **Trincee del Ferro Morto** — In scontro · Agente con POT base + DAN base più bassi · +5 VA · r
- **Tribunale delle Insegne Gemelle** — Regola · Agenti con la stessa Lega · Poteri disattivati · r
- **Breccia di Rocca Vesta** — In scontro · 1° giocato +3 VA · 2° giocato +1 DAN · r`,
        `**Generici (2/2)**
- **Lizza del Palazzo d'Onice** — Regola · Entrambi · DAN = Lega · s
- **Arena del Banco Rosso** — Post-scontro · Perdente · +1 FC ogni 2 FC investiti, max 3 · s
- **Piana del Vetro Nero** — Regola · Modificatori positivi di POT disattivati · r
- **Fossa delle Catene** — Regola · POT e DAN entro ±2 dal valore base · s
- **Valico della Guardia** — Regola · FC investibili max = Lega dell'Agente · s
- **Ponte dei Tre Piloni** — In scontro · Chi investe esattamente 3 FC · +4 VA · r
- **Faro di Vetta Grigia** — In scontro · 2° giocato · +3 VA · r
- **Terme di Karsil** — Post-scontro · Vincitore · Cura 2 PV · c · T2
- **Osservatorio delle Braci** — In scontro · Chi ha meno Campi conquistati · +5 VA · r
- **Piazza del Monolite** — Regola · Agenti con la stessa Lega · +1 DAN · c
- **Porto della Catena** — Post-scontro · Vincitore · +1 FC · c
- **Bastione di Frontiera** — In scontro · 1° giocato · +3 VA · r
- **Ponte di Roccaferma** — Regola · Vince il DAN finale più alto (parità → VA più alto) · s
- **Nodo dei Segnali** — Regola · Bonus Armata disattivati · r
- **Cascate di Vetro** — Regola · Modificatori positivi di DAN disattivati · r
- **Gola dei Venti Rossi** — In scontro · Chi ha meno PV · +4 VA · c · T2
- **Foresta Pietrificata** — Regola · POT finale massimo 7 · r
- **Lago delle Sette Lune** — Post-scontro · Perdente · +1 FC e +1 PV · r

**Neutri** (solo Mani nude, nessun effetto): La Piana della Torre Caduta · Ignoto inarrivabile · Il Bastione del Nono Mondo · Il Ponte dell'Ultimo Campione · Le Ceneri del Mondo Senza Nome

**Figli dell'Orizzonte**
- **Nebulosa dei Ricordi** — In scontro · Entrambi · +1 POT · c
- **Orlo del Buco Nero** — In scontro · Entrambi · POT e DAN invertiti · s
- **Cimitero di Stelle** — In scontro · Entrambi · −2 VA · c
- **Frammento Oscurato** — In scontro · Entrambi · −2 POT, −2 DAN · r
- **Il Pozzo Gravitazionale** — Regola · FC investiti max 3 · s
- **Trono Solare** — Conquista · +1 PV · c · T2`,
        `**Kethran**
- **Fondamenta della Torre** — Gloria e Vendetta sempre attivi · r · T2
- **Ziqqurat Spezzata** — Post-scontro · Perdente +1 FC · Conquista −1 FC · c
- **Biblioteca delle Lingue Perdute** — Regola · Effetti Blocca disattivati · r
- **Trono dei Re Caduti** — Conquista · −1 PV (Danni dir.) · c
- **Mura della Sfida** — Regola · Rimonta sempre attivo · r · T2
- **Falso idolo** — Rimonta · +3 VA · r · T2

**Corte Rossa**
- **Sala dei Contratti** — Conquista · −2 FC · c
- **Trono di Cenere** — In scontro · Entrambi · +1 DAN · c
- **Fossa dei Traditori** — Regola · Copia Bonus disattivata · r
- **Tribunale dell'Anima** — Post-scontro · Perdente · −1 FC · c
- **Crocevia dei Patti** — Regola · Poteri sempre attivi (senza trigger) · s
- **Mercato delle Anime** — In scontro · Entrambi · −3 POT (min 1) · r

**Calibri Pesanti**
- **Mura EMP** — Regola · Immune disattivato · r
- **Nucleo del Reattore** — Regola · Overdrive con 4 FC · r
- **Deposito di Rottami** — Post-scontro · Perdente · +2 FC · c · T2
- **Firewall Centrale** — Regola · Danni dir. disattivati · r
- **Centrale Energetica** — Overdrive · +1 DAN · c
- **La Grande Forgia** — Post-scontro · Chi ha meno PV · +1 PV · c · T2`,
        `**Orathai**
- **Convergenza delle Ley** — Regola · Magnanimo sempre attivo · r
- **Radura dell'Anima** — Regola · Modificatori POT/DAN disattivati · s
- **Cerchio di Evocazione** — Regola · Intervento sempre attivo · r
- **Fonte del Mana** — Post-scontro · Entrambi · +1 FC · c · T2
- **Sanctum dell'Equilibrio** — In scontro · Lega più alta · −5 VA · r
- **L'Albero del Giudizio** — Regola · Resa dei conti sempre attivo · r

**Nati dalla Bocca (Mounthborn)**
- **Nido della Regina** — In scontro · Entrambi · Danni dir. +1 · c
- **Pianura Divorata** — Post-scontro · Entrambi · +1 PV · c · T2
- **Palude Tossica** — Post-scontro · Entrambi · −1 PV · c · T2
- **Alveare Abbandonato** — Regola · Imboscata sempre attivo · r
- **Terreno di Caccia** — In scontro · Entrambi · +2 DAN · c
- **Le Grandi Fauci** — Regola · Imboscata ↔ Intervento invertiti · r`,
        `**L'Enclave delle Scaglie**
- **Volta del Tesoro** — Post-scontro · Entrambi · +2 FC · c · T2
- **Trono d'Ossidiana** — Regola · Effetti Conquista ×2 · r
- **Arena delle Scaglie** — Regola · Vince chi investe più FC (ignora il VA) · s
- **Caverna del Wyrm** — Regola · POT max 5 · r
- **Cova di Scaglie** — Imboscata · +1 POT · c
- **Picco del Drago Caduto** — Conquista · +1 FC, −2 PV · r

**Ratti della Megera**
- **Fogna Maestra** — Regola · Minimi degli effetti −1 (es. min 5 → 4) · r
- **Reggia del Custode** — Calcolo VA · Entrambi · FC ÷2 (per eccesso) · s
- **Trono della Megera** — Regola · Ultimo Desiderio ×2 · r
- **Lago dei Miasmi** — In scontro · Chi ha più POT · −1 POT · c
- **Cattedrale del Decadimento** — Regola · Bonus → Conquista: Tossina 2 (min 10) · r
- **Decadente Catrelburg** — In scontro · Chi ha meno POT · +5 VA · r

**Patto degli Indocili**
- **L'Ultrastrada** — Regola · Turbo sempre attivo · r
- **Ponte dei Vandali** — Regola · Ultima Chance ↔ Turbo invertiti · r
- **Il Circuito** — Regola · Potere del 1° giocato: Sfida · del 2°: Sopraffare · r
- **Undicesima Megalopoli** — In scontro · Entrambi · −1 POT, −3 VA · c
- **L'Ultimo Distributore** — In scontro · Entrambi · +1 DAN ogni 3 FC propri · c
- **Posto di Blocco** — Regola · Potere del 2° giocato disattivato · r

**Khemet**
- **Tempio di Cobalto** — In scontro · Entrambi · +4 VA · r
- **Camera Rituale** — Overdrive · +1 POT, +1 DAN · r
- **Sala dei Soulwright** — Regola · Entrambi Immune · r
- **Altare dell'Imposizione** — Regola · Entrambi · DAN = POT · s
- **Necropoli Dorata** — Conquista · +1 PV · c · T2
- **Cripta dei Re-Maghi** — Regola · Resistenza sempre attivo · r · T2`,
        `**Apex**
- **Cimitero dei Colossi** — In scontro · Agente con Lega più alta · +5 VA · r
- **Tana dei Tagliagole** — Regola · Vince la POT finale più alta (parità → VA più alto) · s
- **Valle degli Infiniti Denti** — Regola · Modificatori di VA ×2 · s
- **Canyon Ghiacciato** — In scontro · Chi ha meno Campi conquistati · −1 POT · c · T2
- **Vulcano Dormiente Innevato** — Regola · Invasione sempre attivo · r
- **Meridiano del Sole Verde** — Regola · Bonus → Invasione: +2 POT, +1 DAN · r

**Mascarada**
- **Grande Arena di Ilesca** — Regola · Effetti Overdrive disattivati · r
- **Anello di Kintaba** — Regola · Tossina disattivata · r
- **Foro di Khorai** — Calcolo VA · Entrambi · massimo 6 FC conteggiati · s
- **Corte di Akitsuna** — In scontro · Agente con Potere o Bonus disattivato · +1 POT · r
- **Tribuna Nera di Vargard** — Regola · Copia ↔ Imponi · r
- **Viale delle Delegazioni** — Conquista · se gli FC totali spesi sono più di 10, entrambi +1 FC · c
- **Galleria Bellacqua** — Regola · Bonus Armata scambiati tra gli Agenti · s
- **Anfiteatro di Morrowgate** — Regola · Effetti Conquista disattivati · r

Tutti i Campi si consultano anche in gioco: **Galleria → Campi**.`,
      ],
    },

    {
      titolo: '11 · Eminenze: come funzionano 🧪',
      messaggi: [
        `# Eminenze · 🧪 in test, non bilanciate
Meccanica **secondaria e sperimentale**: regole e valori possono cambiare tra una build e l'altra. Ci sono solo nel **Duello** in formato **Standard**.

## Che cos'è
- La figura sotto cui combatte l'armata. Sta **fuori dal mazzo**: non si schiera e non ha POT, DAN o VA.
- Ha tre parti:
  - **Presenza iniziale**;
  - uno **Statico**, una regola sempre attiva;
  - **3 abilità attive** (la Corte Rossa ne ha 4).
- **Presenza**: risorsa pubblica, resta da un round all'altro, non ha massimo e non scende sotto 0. Si guadagna con le abilità "+N" e con gli Statici, si spende con le abilità "−N".

## Quale Eminenza ricevi
- Non si sceglie: la decide il **mazzo**.
- Ricevi l'Eminenza dell'armata con **almeno 5 carte** nel tuo esercito di 10. Se ce ne sono due a pari merito (5-5), vale l'ordine alfabetico interno delle armate.
- Un esercito senza 5 carte della stessa armata gioca **senza Eminenza**.
- Gli eserciti precostruiti B-E del Patto degli Indocili ricevono l'Eminenza dell'altra armata del mix: B La Fame, C Sanguinaccio, D L'Enclave dell'Ascensione, E Il Primo Canto.`,
        `## Il round con le Eminenze
1. **Scelta segreta.** A inizio round ogni giocatore sceglie **esattamente una** abilità; non si può passare.
   - Un'abilità "−N" si può scegliere solo se hai almeno N Presenza in quel momento.
   - Le abilità "+N" e "+0" sono sempre disponibili.
   - Se c'è una sola abilità valida, il gioco la sceglie da solo.
2. **Rivelazione.** L'abilità resta coperta fino all'ultimo momento utile:
   - **Prima del Campo**: tutte le abilità Khemet.
   - **Prima dell'Agente**: Gorgoglio (Mounthborn), Debito (Corte Rossa), Ascesa / Declassamento (Enclave).
   - **Generale**: dopo che Campo, Agenti e FC sono confermati, per tutte le altre.
   - Se un momento di rivelazione passa senza che tu riveli niente, l'avversario può dedurre che non hai scelto quelle abilità.
3. **Pagamento.** Alla rivelazione si applica il ±N di Presenza. Gli effetti si risolvono in ordine di iniziativa, subito o nel momento indicato dal testo.

## Eccezioni
- **Mascarada**: gli Agenti si scelgono e si rivelano **prima** del Campo.
- **Mounthborn**: all'inizio della partita sceglie la prima Preda.
- **Corte Rossa**: non può scegliere la stessa abilità due round di fila. Alcune sue abilità propongono all'avversario un **Affare**, con le scelte Accetta / Rifiuta oppure Primo / Secondo.

## Cosa vede l'avversario
Eminenza, Statico, testi e costi, Presenza e i segnalini (Preda, Frammento, Debito, Maledizioni). La scelta resta coperta fino alla rivelazione.

Non disponibili in 2v2, Re della collina e Multiplayer online.`,
      ],
    },

    {
      titolo: '12 · Eminenze: elenco completo 🧪',
      messaggi: [
        `# Eminenze · elenco
🧪 In test, non bilanciate. Formato: **Statico**, poi le abilità con il loro costo in Presenza. I testi sono quelli del gioco.

**Apex — Il Sole Verde** (Presenza iniziale 3)
- Statico *Cataclisma Verde*: all'inizio del round 5 lo slot aperto diventa il Meridiano del Sole Verde.
- **+1 Furia**: il tuo Agente ottiene +1 POT. Perdi 2 PV.
- **−2 Disprezzo**: il tuo Agente ignora gli effetti del Campo in questo scontro.
- **−4 Ora Verde**: il tuo Agente ottiene Potere: +2 POT, +2 DAN.

**Patto degli Indocili — Il Grande Semaforo** (0)
- Statico *Multa per eccesso di Caos*: se alla fine dello scontro sono stati giocati almeno 8 FC, +2 Presenza.
- **+1 Verde**: tutti i trigger seguono le condizioni normali.
- **+0 Giallo**: Imboscata e Turbo sono soddisfatti in questo round.
- **−2 Rosso**: Imboscata e Turbo non possono attivarsi; Intervento e Ultima Chance sono soddisfatti. Vale per entrambi.

**Mascarada — L'Organizzatore degli Incontri** (1)
- Statico *Organizzazione Impeccabile*: gli Agenti vengono scelti e resi noti prima del Campo.
- **+0 Scommessa**: pronostica in segreto l'esito (vittoria tua / avversaria / pareggio). Se indovini, +2 Presenza.
- **−2 Maschere Invertite**: Gloria vale anche come Vendetta e viceversa; Conquista anche come Ultimo Desiderio e viceversa.
- **−4 Incontro Truccato**: il trigger del tuo Agente è soddisfatto e il suo Potere non può essere bloccato (non vale per Conquista e Ultimo Desiderio).

**Kethran — L'Altare della Ricomposizione** (2)
- Statico *Ricomposizione*: quando il tuo Agente perde, diventa un Frammento; ogni Frammento ottenuto dà +1 Presenza.
- **+1 Sacrificio**: perdi 2 PV e ottieni Presenza. Ogni Sacrificio successivo costa 1 PV in più e dà 1 Presenza in più.
- **−1 Elogio al trionfo**: se il tuo Agente vince, diventa un Frammento.
- **−2 Innesto**: scegli un Frammento; il Potere del tuo Agente può attivarsi con il proprio trigger o con quello del Frammento (che viene consumato).`,
        `**Mounthborn — La Fame** (1)
- Statico *Istinto Predatorio*: all'inizio della partita scegli un Agente nemico, che diventa **Preda**. Quando viene schierata una Preda, il Bonus del tuo Agente è attivo.
- **+0 Gorgoglio terrificante** (prima dell'Agente): un Agente nemico non schierato diventa Preda. Se una Preda viene schierata in questo round, +2 Presenza.
- **−2 Frenesia della Fame**: un Agente nemico non schierato diventa Preda per il resto della partita. Se una Preda è schierata in questo round, Potere e Bonus del tuo Agente non possono essere bloccati.
- **−2 Cannibalismo**: se perdi lo scontro contro una Preda, Cura 3 PV.

**Khemet — Il Castello dei Sigillatori** (2 · tutte rivelate prima del Campo)
- Statico *Cattura-Energia*: quando il tuo Agente attiva Overdrive, +2 Presenza.
- **+2 Devozione al cervello**: il tuo Agente scambia il trigger del Potere con quello del Bonus.
- **−2 Maledizione della Fama**: scegli uno slot; per il resto della partita gli Agenti schierati lì subiscono −VA pari alla loro Lega.
- **−3 Maledizione del Cosmo**: scegli uno slot; per il resto della partita gli Agenti schierati lì subiscono −1 POT, −1 DAN, −1 VA.
- Le Maledizioni appartengono allo slot e valgono per entrambi i giocatori.

**Orathai — Il Primo Canto** (1)
- Statico *Risonanza*: se entrambi gli Agenti soddisfano il trigger del Potere, +1 Presenza.
- **+0 Tacet**: se uno dei due Agenti non soddisfa il trigger del Potere, +2 Presenza.
- **−2 Contrappunto**: il tuo Agente è immune ai Blocca; se il tuo Agente non soddisfa il trigger del Potere, non lo soddisfa nemmeno quello avversario.
- **−3 Silenzio**: il trigger del Potere di entrambi gli Agenti diventa Magnanimo.`,
        `**Corte Rossa — Sanguinaccio, il Registro** (1 · 4 abilità, mai la stessa due round di fila)
- Statico *Pagare i Debiti*: ogni volta che un giocatore perde PV per una causa diversa dal normale DAN della sconfitta, +1 Presenza (conta l'evento, non i PV).
- **+0 Accordo Unilaterale**: all'avversario si propone l'Affare «Perdi 2 PV; in questo scontro il tuo Agente riceve 1 FC temporaneo». Se rifiuta, l'effetto si risolve come se l'avessi accettato tu.
- **+1 Debito** (prima dell'Agente): scegli un Agente non schierato, tuo o avversario. Il suo trigger diventa Debito: chi lo schiera perde 2 PV, poi il Potere si attiva.
- **−2 Salasso**: l'avversario sceglie tra «Perdi 3 PV; +2 Presenza» e «Perdi 3 Presenza; Cura 2 PV».
- **−4 Brutto Affare**: uno dei due Agenti confermati riceve 2 FC temporanei. A fine partita il suo giocatore perde PV pari a metà della POT finale registrata, arrotondata per eccesso.

**Figli dell'Orizzonte — La Domanda Senza Fine** (2)
- Statico *Ancorato*: il tuo Agente è Ancorato se hai investito almeno 6 − Lega FC reali (Lega 5: 1, Lega 4: 2, Lega 3: 3, Lega 2: 4), più gli aumenti di Deriva. A fine scontro, se era Ancorato, +1 Presenza.
- **+1 Deriva**: il requisito di Ancorato sale di 1, per il resto della partita.
- **−2 Leggerezza**: se il tuo Agente è Ancorato, il suo trigger è soddisfatto.
- **−3 Risposta**: se il tuo Agente è Ancorato, è anche Immune.`,
        `**Ratti della Megera — Bella Malelabbra** (1)
- Statico *Male Crescente*: quando schieri l'Agente con la Lega più bassa tra quelli che ti restano (parità compresa), +1 Presenza.
- **+0 Sussurro**: se durante lo scontro almeno un Agente subisce una riduzione di POT, DAN o VA, +1 Presenza.
- **−2 Veleno**: il Bonus Armata del tuo Agente è bloccato; applichi Tossina 1 (min 10) all'avversario.
- **−3 Spezzacuore**: a inizio scontro rimuovi la Tossina dall'avversario; il Bonus del tuo Agente diventa «X Danni diretti», con X = Tossina rimossa ×2.

**L'Enclave delle Scaglie — L'Enclave dell'Ascensione** (1)
- Statico *Accumulo*: quando investi almeno 3 FC reali, +1 Presenza.
- **+1 Rinuncia al Privilegio**: il Bonus Armata del tuo Agente è bloccato in questo scontro.
- **−1 Ascesa / Declassamento** (prima dell'Agente): scegli pubblicamente un tuo Agente non schierato e alza o abbassa la sua Lega di 1 per questo round.
- **−3 Ascensione**: Sfida e Sopraffare del tuo Agente sono soddisfatti anche a Leghe uguali; a parità di VA vince il tuo lato.

**Calibri Pesanti — Il Comando dei Quattro Fronti** (2)
- Statico *Tenere la Linea*: se il DAN finale dell'Agente nemico è 2 o meno, +1 Presenza.
- **0 Guerra d'Attrito**: ottieni 1 FC nella riserva. Il costo in Presenza aumenta con le vittorie (fino a −4).
- **−2 Protocollo di Contenimento**: dopo i Bonus registri il DAN del tuo Agente come X; il suo DAN diventa 0 e l'avversario subisce X/2 Danni diretti (per eccesso). Se vinci, +2 Presenza.
- **−4 Protocollo Terra Bruciata**: se perdi, il Campo viene distrutto prima della Conquista: nessuno lo conquista e nessun effetto Conquista si attiva.`,
      ],
    },

    {
      titolo: '13 · Modalità, formati e IA',
      messaggi: [
        `# Modalità, formati e IA
## Come si avvia una partita locale
**Partita locale** → armata → esercito → popup **Imposta la partita**. Il popup ricorda le ultime scelte. Da tastiera: ↑↓ cambia voce, ←→ cambia valore, Invio inizia, Esc chiude.

## Modalità
- **Duello**: 1 contro 1. È il gioco base descritto nei post 1-5.
- **2v2**: ad abbinamenti segreti, due squadre da due (post 14).
- **Re della collina**: tutti contro tutti, 3 o 4 giocatori (post 15).

In locale gli altri posti sono IA. Online tutte e tre le modalità si giocano con altre persone (post 16).

## Formati
- **Standard**: Eminenze e Campi attivi. Solo nel Duello, anche online.
- **No Eminenza**: Campi attivi, senza Eminenze.
- **Mani nude**: niente Eminenze ed effetti dei Campi; si usano i 5 Campi neutri, tutti scoperti. Nel 2v2, che ha 10 Campi, ogni Campo neutro compare due volte.

## Avversario (Duello)
- **Casuale**: armata diversa dalla tua, esercito precostruito a caso.
- **Armata scelta**: scegli l'armata nemica; l'esercito resta casuale.

## Difficoltà
- **Senza occhi** (Facile): gioca correttamente, ma pianifica poco e sbaglia tatticamente.
- **Mezzo ubriaco** (Normale, predefinita): valuta trigger, Campi e risorse in modo equilibrato.
- **Sfavorito** (Difficile): analizza le risposte visibili, conserva risorse e punisce gli errori.

L'IA del Duello non vede i FC che investi. Nel 2v2 e nel Re della collina le IA usano una logica più semplice e scelgono il Campo a caso tra quelli validi.`,
      ],
    },

    {
      titolo: '14 · 2v2 ad abbinamenti segreti',
      messaggi: [
        `# 2v2 ad abbinamenti segreti
In locale: tu e un compagno IA contro due IA. Online anche con altre persone (post 16). Formati: No Eminenza e Mani nude.

## Risorse
- **50 PV di squadra**, condivisi (massimo 50).
- **18 FC a testa**, mano di 5 carte; vale la riserva minima di 1 FC per carta rimasta.
- **10 Campi**: 6 scoperti all'inizio, 2 in più a ogni turno.

## Turno
- **Chi apre**: al turno 1 la squadra con meno Lega totale nelle due mani (a parità, sorteggio). Poi si alterna.
- **Apertura**: ognuno dei due sceglie Campo (diversi tra loro), Agente e FC. Agenti e Campi diventano pubblici, i FC no.
- **Risposta**, il "segreto": chi risponde vede gli Agenti avversari ma non i FC, e sceglie Agenti, FC e **disposizione**:
  - **Diretta**: il primo contro il primo, il secondo contro il secondo.
  - **Incrociata**: il primo contro il secondo, il secondo contro il primo.
- Poi si rivela tutto insieme.

## Risoluzione
- Ogni fronte è un Duello 1v1 sul proprio Campo; l'Agente di chi apre ha l'iniziativa.
- I fronti leggono i PV di inizio turno; le variazioni si sommano alla fine.
- Le Tossine colpiscono i PV di squadra con soglia raddoppiata.

## Il compagno IA
- Propone carta, FC e Campo: sul tavolo appare come **proposta**, con una frase che la spiega.
- Puoi **consigliargli** una carta, un Campo (in apertura) e un investimento basso, medio o alto. Li accetta secondo il suo carattere: **Stratega** 70%, **Assaltatore** 50%, **Custode** 80%, **Calcolatore** 60%.
- In risposta la disposizione la decidi tu, nel pannello Fronti.
- **Online** niente consigli. In due persone ognuno sceglie la sua carta; se aprite sullo stesso Campo, il secondo lo cambia. Disposizione e reclamo li decide il primo della squadra.

## Fine partita
- **Turni 1-4**: vince la squadra con **5 Campi**. Ai turni 3-4 puoi reclamare o continuare; la squadra avversaria reclama sempre.
- **Turno 5**: più PV, poi più Campi, poi pareggio.
- **Annientamento**: squadra a 0 PV. Se entrambe arrivano a 0, pareggio.`,
      ],
    },

    {
      titolo: '15 · Re della collina',
      messaggi: [
        `# Re della collina
Tutti contro tutti, **3 o 4 giocatori**. In locale sei tu contro 2 o 3 IA; online gli altri posti possono essere persone (post 16). Formati: No Eminenza e Mani nude.

## Risorse
- **25 PV** e **18 FC** a testa.
- **5 Campi**: 3 scoperti, 1 in più a ogni contesa. Si gioca su 5 contese.

## La contesa
- Ogni contesa si gioca su **un solo Campo**. L'ordine iniziale è sorteggiato; poi apre il giocatore successivo ancora in gioco.
- **Posa in sequenza**: chi apre sceglie Campo, Agente e FC; gli altri, in ordine, Agente e FC. Si vedono le carte già posate, non gli investimenti.
- **Catena di scontri**: il primo è "sulla collina". Chi vince resta, con lo **stesso Agente e lo stesso investimento** (pagato una sola volta), e affronta il successivo.
  - Ogni scontro infligge il DAN a chi perde.
  - Il trigger Conquista scatta solo nello scontro finale.
- A **0 PV** si viene eliminati subito. L'ultimo rimasto conquista il Campo.

## Fine partita
- Vince l'ultimo giocatore in vita.
- **Contese 1-4**: vince chi ha **3 Campi**. Alle contese 3-4 si può reclamare o continuare; le IA reclamano sempre.
- **Contesa 5**: più PV tra i vivi, poi più Campi, altrimenti vittoria condivisa.
- Se **vieni eliminato**, la tua partita finisce subito con una sconfitta.`,
      ],
    },

    {
      titolo: '16 · Multiplayer online (beta)',
      messaggi: [
        `# Multiplayer online · beta
Serve la connessione a internet. Sono ammessi anche gli eserciti personalizzati.

## Stanza
1. **Multiplayer** → inserisci un nome (massimo 20 caratteri).
2. **Crea stanza**: ricevi un codice di **6 caratteri** da mandare agli altri, ad esempio in <#cerco-partita>.
3. Oppure **Entra con codice**. Errori possibili: "Stanza non trovata" e "Stanza già piena". Una stanza ospita fino a **4 persone**.
4. Ognuno sceglie armata ed esercito. L'host sceglie modalità, formato e difficoltà dell'IA; gli altri le vedono.

## Modalità
- **Duello**: 2 persone. Formati Standard (con Eminenze 🧪), No Eminenza o Mani nude. La partita parte quando entrambi siete pronti. A fine partita: **rivincita** con lo stesso esercito, oppure cambio di esercito.
- **2v2**: da 2 a 4 persone; i posti vuoti li gioca l'IA. Squadre in ordine di ingresso: host e terzo contro secondo e quarto.
- **Re della collina**: da 2 a 4 persone, tavolo da 3 o 4; i posti vuoti li gioca l'IA.

2v2 e Re della collina: No Eminenza o Mani nude. Quando tutti sono pronti l'host preme **Avvia partita**. A fine partita si torna al menu: per giocarne un'altra serve una nuova stanza.

## Disconnessioni
- **Se cade la tua connessione**: c'è un tentativo automatico di riconnessione, poi il riquadro "Connessione persa" con **Riconnetti** o **Abbandona**. Al rientro la partita riprende da dove era.
- **Se cade quella di un altro**: vedi "In attesa". Il server aspetta fino a **5 minuti**; se l'host non torna la stanza si chiude.
- Nel Duello, dopo un crash, la lobby può proporre **"Partita in sospeso"**. Nel 2v2 e nel Re della collina no: se qualcuno chiude il gioco o esce dalla stanza, la partita non può continuare.`,
      ],
    },

    {
      titolo: '17 · Eserciti, Tutorial, Galleria, Opzioni',
      messaggi: [
        `# Gestione eserciti
- **Precostruiti**: 3 per armata (A, B, C), 5 per il Patto (A-E). Non si modificano.
- **Personalizzati**: dal costruttore.
  - Esattamente **10 carte** e **Lega totale esattamente 30**: finché non è così, il tasto per schierare resta spento.
  - Ogni carta al massimo una volta; si possono mescolare armate.
  - Serve un nome per salvare.
  - Filtri per Lega, trigger, effetto, archetipo, Focus e scalabilità; ordinamento per Lega, POT o DAN.
- Gli eserciti personalizzati restano **solo su questo PC** e si trovano in **Eserciti Personalizzati** nella scelta dell'armata.
- Per avere un'Eminenza nel formato Standard servono almeno 5 carte della stessa armata.

# Tutorial
- **Breve** (3-5 minuti): schede su basi, carta Agente, vittoria, VA, turno, esempio di scontro.
- **Introduttivo** (6-8 minuti): partita guidata Calibri Pesanti contro Kethran. Round 1-3 guidati, 4-5 liberi.
- **Avanzato** (10-12 minuti): FC, tempi dei trigger e chiusura al round 5. Consigliato dopo l'Introduttivo.

# Galleria
- **Agenti**: tutte le carte.
- **Alternative**: illustrazioni alternative di alcune carte, negli stili **Eldritch** e **Arcana**. ✏️ **Stili in bozza**: grafica non definitiva.
- **Eminenze**: le 12 Eminenze.
- **Campi**: i 121 Campi.
- Comandi: Q / E cambiano sezione, le frecce scorrono.

# Opzioni
- **Schermo**: finestra, schermo intero o senza bordi; risoluzione; limite di frame rate.
- **Grafica**: qualità degli effetti, velocità del duello (0,75 / 1 / 2 / 3×), riduzione delle animazioni, transizioni.
- **Interfaccia**: scala dell'interfaccia e del cursore.
- **Audio**: ⚠️ **il gioco parte senza audio**. Attivalo da qui.

# Campagna
🚧 **In via di definizione, non giocabile.** È visibile nel menu solo come anteprima.`,
      ],
    },

    {
      titolo: '18 · Limiti noti di questa build',
      messaggi: [
        `# Limiti noti · v${v}
Già noti, non serve segnalarli di nuovo.

- **Eminenze** 🧪: in test e non bilanciate. Alcuni testi possono non corrispondere esattamente all'effetto. In questo caso segnalalo, citando l'Eminenza e cosa è successo.
- **Multiplayer**: 2v2 e Re della collina online sono senza Eminenze e senza rivincita; se qualcuno lascia la partita, non si può continuare.
- **Eserciti personalizzati**: dall'interfaccia non si possono eliminare.
- **Tutorial breve**: usa carte d'esempio che non esistono nel gioco. Se qualcosa nel gioco non torna con questa guida, segnalalo: vale la guida.
- **Testi provvisori** 📝: i testi descrittivi delle carte (flavour text) e le informazioni nelle schermate delle armate sono segnaposto. Alcune descrizioni lì non sono corrette: ad esempio Rimonta e Resa dei conti (quelle giuste sono nel post 6) e "nessun bonus armata" per gli eserciti personalizzati, che invece il Bonus ce l'hanno.
- **Campagna** 🚧 e **stili Eldritch / Arcana** ✏️: in bozza, fuori dal test.
- Non serve segnalare refusi o incongruenze nei testi provvisori.`,
      ],
    },
  ];
}

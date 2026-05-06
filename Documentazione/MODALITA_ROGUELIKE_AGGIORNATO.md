# MODALITÀ ROGUELIKE - SATZE

## PANORAMICA

Modalità single-player con progressione a run, costruzione mazzo incrementale, e meta-progressione tra le run. Stile Slay the Spire adattato al sistema di combattimento di SATZE.

---

## AVATAR

### Creazione Iniziale

L'Avatar è la carta protagonista, unica nel suo genere. Inizia come **Lega 2** con bonus speciale **Gregario**.

### Step 1: Scelta POT/DAN

Il giocatore riceve 3 opzioni, una per pool:

**Pool Mediocre (POT+DAN ≤3)**
| POT | DAN |
|-----|-----|
| 2 | 1 |
| 1 | 2 |
| 1 | 1 |

**Pool Medio (POT+DAN =4)**
| POT | DAN |
|-----|-----|
| 2 | 2 |
| 3 | 1 |
| 1 | 3 |

**Pool Forte (POT+DAN ≥5)**
| POT | DAN |
|-----|-----|
| 3 | 2 |
| 2 | 3 |
| 4 | 1 |
| 1 | 4 |
| 3 | 3 |

### Step 2: Scelta Potere

In base al corpo scelto:

| Corpo | Poteri proposti |
|-------|-----------------|
| Mediocre | 1 Debole + 1 Medio + 1 Forte |
| Medio | 1 Debole + 2 Medio |
| Forte | 2 Debole + 1 Medio |

### Step 3: Scelta Trigger

In base a corpo + potere scelti:

| Combinazione | Trigger proposti |
|--------------|------------------|
| Corpo debole + Potere forte | 1 Alta affidabilità + 1 Media + 1 Bassa |
| Combinazione media | 1 Alta affidabilità + 2 Media |
| Corpo forte + Potere debole | 2 Alta affidabilità + 1 Media |

**Pool Alta affidabilità (molt. 0.8-1.0)**
- Conquista, Intervento, Gloria, Vendetta, Imboscata

**Pool Media affidabilità (molt. 0.5-0.7)**
- Sfida, Resa dei conti, Overdrive, Opportunista, Invasione, Resistenza

**Pool Bassa affidabilità (molt. 0.3-0.4)**
- Rimonta, Magnanimo, Ultima Chance, Turbo

### Step 4: Bonus (automatico)

**Gregario**: Copia il bonus armata della fazione con **più** carte in mano.
- Fissato a inizio partita (turno 1)
- In caso di parità: sceglie quella con Lega maggiore
- Se l'Avatar è l'unica carta: nessun bonus

---

## STRUTTURA RUN

### Setup Iniziale

- 4 armate estratte casualmente a inizio run
- PV iniziali: **30**
- L'Avatar parte Lega 2

---

### Zona 1: Reclutamento

**Narrativa:** L'Avatar vaga solitario nelle terre selvagge, reclutando seguaci prima di attaccare un avamposto.

| Elemento | Valore |
|----------|--------|
| Nodi totali | 12 |
| Duelli | 7 |
| Boss Elite | 0 |
| Eventi | 4 |
| Boss fine zona | Avamposto (Lega 3) |
| Scelta | 4 diramazioni (una per armata) |
| Agenti disponibili | Tutte e 4 le armate estratte |
| Mazzo max | 5 carte |

**Evento iniziale:** Proposta di 3 agenti (uno per ogni armata diversa tra quelle iniziali), si ripete due volte → giocatore parte con Avatar + 2 agenti.

**Combattimento Zona 1:**
| Elemento | Valore |
|----------|--------|
| Zone di scontro | 3 |
| Condizione vittoria | 2 zone (turni 1-2), poi più PV (turno 3) |
| FC iniziali | 12 (reset ogni scontro) |
| Carte giocatore | Min 3 (Avatar + 2) |
| Carte nemico | 3 agenti Lega 2 |
| Danno in caso di sconfitta | Somma Leghe carte nemiche |
| Temi luoghi | Piccoli, quotidiani ("Locanda della capra ubriaca") |

---

### Zona 2: Prima Conquista

**Narrativa:** L'Avatar guida un'armata, conquista città fino alla capitale della prima armata scelta.

| Elemento | Valore |
|----------|--------|
| Nodi totali | 17 |
| Duelli | 7 |
| Boss Elite | 2 |
| Eventi | 8 (di cui 3 con duello) |
| Boss fine zona | Capitale (Lega 4) |
| Scelta | 3 armate rimanenti |
| Agenti disponibili | Solo prima armata scelta |
| Mazzo max | 10 carte |

**Combattimento Zona 2-3:**
| Elemento | Valore |
|----------|--------|
| Campi di battaglia | 5 |
| Condizione vittoria | 3 campi (turni 1-4), poi più PV (turno 5+) |
| FC iniziali | 18 (reset ogni scontro) |
| Carte giocatore | Max 10 |
| Carte nemico | 3-5 agenti (scala con difficoltà) |
| Temi luoghi | Guerra, assedi ("Ai piedi delle mura") |

---

### Zona 3: Seconda Conquista

**Narrativa:** L'Avatar attacca la seconda armata scelta.

| Elemento | Valore |
|----------|--------|
| Nodi totali | 17 |
| Duelli | 7 |
| Boss Elite | 2 |
| Eventi | 8 (di cui 3 con duello) |
| Boss fine zona | Capitale (Lega 5) |
| Agenti disponibili | Solo seconda armata scelta |
| Mazzo max | 10 carte |

---

### Zona 4: Difesa

**Narrativa:** Dopo due conquiste, le due armate rimanenti dichiarano guerra. L'Avatar difende la capitale conquistata.

| Elemento | Valore |
|----------|--------|
| PV giocatore | **50** |
| FC | 18 (reset ogni scontro) |
| Zone d'Assedio | 5 (iniziano conquistate) |
| Condizione sconfitta | 0 PV oppure 0 zone d'assedio |
| Duelli | ~6-7 |
| Eventi | 3-4 |
| Attaccanti | 2 armate rimanenti + armate casuali (escluse le 4 iniziali) |
| Boss finale | Avatar nemico (Lega 6) |

**Danno post-scontro:**
| Risultato | Danno subito |
|-----------|--------------|
| Vittoria | Somma Leghe nemiche / 2 (arrotondato per difetto) |
| Sconfitta | Somma Leghe nemiche |

---

## ZONE D'ASSEDIO (Zona 4)

Le Zone d'Assedio sostituiscono i campi di battaglia standard nella Zona 4.

### Stati delle Zone

| Stato | Come si raggiunge |
|-------|-------------------|
| Conquistata | Inizio / 2 vittorie di fila da neutrale |
| Neutrale | 1 vittoria da persa |
| Persa | 1 sconfitta da conquistata o neutrale |

### Le 5 Zone d'Assedio

| Zona | Bonus se conquistata | Malus se persa |
|------|---------------------|----------------|
| Mura Esterne | +1 POT a tutte le carte | -1 POT a tutte le carte |
| Bastione | -2 DAN nemico (min 1) | +1 DAN a tutte le carte nemiche |
| Armeria | +1 DAN a tutte le carte | -1 DAN a tutte le carte |
| Riserve | +2 FC Max | -2 FC Max |
| Piazza Centrale | Immune all'Avatar | Poteri dell'Avatar disattivati |

---

## PROGRESSIONE AVATAR

### Aumenti Lega

| Momento | Aumento Lega | Avatar diventa |
|---------|--------------|----------------|
| Start | - | Lega 2 |
| Boss Zona 1 | +1 | Lega 3 |
| Boss Zona 2 | +1 | Lega 4 |
| Boss Zona 3 | +1 | Lega 5 |
| 3 Boss Elite | +1 | Lega 6 |

### Soglie Corpo per Lega

| Lega | Mediocre | Medio | Forte |
|------|----------|-------|-------|
| 2 | ≤3 | =4 | ≥5 |
| 3 | ≤5 | =6 | ≥7 |
| 4 | ≤7 | =8 | ≥9 |
| 5 | ≤9 | =10 | ≥11 |
| 6 (Epica) | ≤11 | =12 | ≥13 |
| 7 (Epica) | ≤13 | =14 | ≥15 |

### Meccanica Aumento Lega

1. L'Avatar passa alla Lega successiva
2. Vengono proposte 3 combinazioni POT/DAN
3. La categoria corpo (mediocre/medio/forte) **resta fissa**
4. Le stats scalano con le soglie della nuova Lega

### Stats Permanenti da Eventi

Le stats bonus da eventi si accumulano e si sommano alle stats base scelte.

**Esempio:**
| Situazione | Risultato |
|------------|-----------|
| Avatar base | 3/3 |
| Evento +1 POT permanente | → 4/3 effettivo |
| Aumento Lega, sceglie 4/5 | → 5/5 effettivo (4+1 / 5) |
| Altro evento +1 DAN | → 5/6 effettivo |

---

## BOSS ELITE

| Zona | Quantità | Lega |
|------|----------|------|
| 1 | 0 | - |
| 2 | 2 | Lega 4 |
| 3 | 2 | Lega 5 |

### Struttura

- Mini-mazzo + regola speciale
- Versioni potenziate di agenti esistenti delle armate
- Identità unica per ogni Boss Elite (da definire singolarmente)

### Pool Regole Speciali (proposte)

| Regola | Effetto |
|--------|---------|
| Iniziativa | Inizia sempre per primo |
| Veterano | Gloria sempre attiva |
| Vendicativo | Vendetta sempre attiva |
| Corazzato | -1 DAN subito (min 1) |
| Feroce | +1 DAN a tutte le carte |
| Comandante | +1 POT a tutte le carte |
| Ricco | +2 FC Max |
| Disperato | Rimonta sempre attiva |

### Ricompense

- Conteggio per +1 Lega (ogni 3 Boss Elite)
- Casuale tra:
  - Artefatto garantito
  - Scelta agente generosa
  - Evento Generoso/Illuminante garantito

---

## BOSS FINE ZONA

| Zona | Boss | Lega |
|------|------|------|
| 1 | Avamposto | 3 |
| 2 | Capitale prima armata | 4 |
| 3 | Capitale seconda armata | 5 |
| 4 | Avatar nemico | 6 |

### Avatar Nemico (Boss Finale)

- Generato con le stesse regole del player
- Molto più generoso nelle proposte
- Obbligatoriamente Lega 6
- Corpo eccezionale (valore forte)

---

## EVENTI NARRATIVI

### Categorie e Probabilità

| Categoria | Effetto | Probabilità | Quantità |
|-----------|---------|-------------|----------|
| Maledizioni | Molto negativo | 5% | 5 |
| Presagi | Negativo | 15% | 10 |
| Neutrali | Standard | 50% | 20 |
| Generosi | Positivo | 25% | 15 |
| Illuminanti | Molto positivo | 5% | 5 |
| **Totale** | | **100%** | **55** |

Stesse probabilità per tutte le zone. La rarità è nascosta finché il giocatore non seleziona il nodo evento.

---

### MALEDIZIONI (molto negativi)

Tono cupo, conseguenze pesanti, spesso senza scelta.

---

**M01 - Il Prezzo del Sangue** *(Universale)*
> *Un mendicante cieco ti blocca il cammino. "Ho visto il tuo futuro," gracchia. "Pagherai per ogni vittoria con la tua stessa carne." Prima che tu possa rispondere, svanisce. Le sue parole ti perseguitano.*

**Effetto:** Per il resto della run, ogni vittoria ti costa 1 PV.

---

**M02 - La Maledizione del Traditore** *(Universale)*
> *Tra le rovine trovi il corpo di un comandante, pugnalato alle spalle dai suoi stessi uomini. Mentre lo superi, senti un sussurro gelido: "Anche i tuoi ti abbandoneranno."*

**Effetto:** Perdi l'agente con Lega più alta dal tuo mazzo. Se hai solo l'Avatar, -2 POT permanente all'Avatar.

---

**M03 - L'Ombra Famelica** *(Zona 2-3-4)*
> *Una creatura d'ombra ti segue da giorni. Non attacca mai, ma ogni notte la senti nutrirsi... di qualcosa. Al mattino ti svegli sempre più debole.*

**Effetto:** -1 POT e -1 DAN permanenti all'Avatar.

---

**M04 - Il Patto Infranto** *(Zona 2-3-4)*
> *Un demone appare nei tuoi sogni. "Avevi promesso," sibila. "Ora pagherai." Ti svegli urlando. Il marchio sulla tua mano brucia.*

**Effetto:** Ottieni l'artefatto "Marchio del Debole" (-1 POT a tutte le carte).

---

**M05 - La Fonte Avvelenata** *(Zona 1-2)*
> *Assetato, bevi da una fonte nascosta. L'acqua ha un sapore strano. Troppo tardi ti accorgi dei cadaveri di animali nascosti tra i cespugli.*

**Effetto:** -5 PV e -2 FC Max per i prossimi 3 scontri.

---

### PRESAGI (negativi)

Tono minaccioso, spesso scelte difficili tra due mali.

---

**P01 - Il Mercante Disperato** *(Universale)*
> *Un mercante ti implora di comprare la sua merce. "È tutto ciò che ho!" I suoi occhi sono troppo lucidi, il suo sorriso troppo largo. Qualcosa non va.*

**Scelta A:** Compra qualcosa → Perdi 3 FC Max permanenti, ottieni un agente casuale Lega 2
**Scelta B:** Rifiuta e vai via → Il mercante ti maledice: -1 DAN all'Avatar

---

**P02 - La Strada Pericolosa** *(Universale)*
> *Due strade si aprono davanti a te. Una attraversa una palude fetida, l'altra costeggia un precipizio. Nessuna sembra sicura.*

**Scelta A:** La palude → -3 PV, ma trovi un artefatto casuale (Neutrale)
**Scelta B:** Il precipizio → Perdi l'agente con Lega più bassa, ma guadagni +2 FC Max

---

**P03 - Il Villaggio Silenzioso** *(Zona 1)*
> *Entri in un villaggio deserto. Il cibo è ancora caldo nelle case, ma non c'è anima viva. Poi senti un rumore dal pozzo...*

**Scelta A:** Investiga il pozzo → Combatti un nemico Lega 3, se vinci ottieni 2 agenti Lega 2
**Scelta B:** Fuggi immediatamente → -2 PV, nessun altro effetto

---

**P04 - Il Compagno Ferito** *(Zona 2-3)*
> *Uno dei tuoi agenti è gravemente ferito. Il guaritore scuote la testa: "Posso salvarlo, ma ci vorrà tempo. O posso... alleviare le sue sofferenze."*

**Scelta A:** Salvalo → L'agente resta, ma -1 POT permanente a quella carta
**Scelta B:** Lascialo andare → Perdi l'agente, ma +1 DAN permanente all'Avatar (eredita la sua forza)

---

**P05 - La Tempesta Innaturale** *(Zona 2-3-4)*
> *Il cielo si oscura. Fulmini viola squarciano le nubi. Questa non è una tempesta normale.*

**Effetto:** Prossimo scontro: -2 POT a tutte le tue carte.

---

**P06 - Il Messaggero Nero** *(Zona 2-3)*
> *Un corvo ti porta un messaggio: "Sappiamo dove sei. Stiamo arrivando." Il sigillo è di un'armata nemica.*

**Effetto:** Prossimi 2 scontri: i nemici hanno +1 POT.

---

**P07 - L'Offerta Sospetta** *(Universale)*
> *Uno straniero incappucciato ti offre una fiala luminosa. "Ti renderà più forte," promette. Ma il suo sorriso è inquietante.*

**Scelta A:** Bevi la fiala → 50% +2 POT permanente all'Avatar, 50% -2 POT permanente all'Avatar
**Scelta B:** Rifiuta → Lo straniero scompare. Nessun effetto.

---

**P08 - Il Tributo** *(Zona 2-3-4)*
> *Gli abitanti del villaggio conquistato si inchinano. "Prendetevi ciò che volete, ma risparmiateci." Ti offrono tutto ciò che hanno.*

**Scelta A:** Accetta il tributo → +3 FC Max, ma perdi 1 agente casuale (diserzione per disgusto)
**Scelta B:** Rifiuta con onore → Nessun effetto immediato, ma il prossimo evento sarà Generoso

---

**P09 - L'Eco della Sconfitta** *(Zona 3-4)*
> *Nei tuoi sogni rivivi ogni battaglia persa. Ogni errore. Ogni morte. Ti svegli esausto, dubitando di te stesso.*

**Effetto:** -1 POT all'Avatar per i prossimi 2 scontri.

---

**P10 - Il Prezzo della Vittoria** *(Zona 4)*
> *Le mura della città mostrano i segni dell'assedio. Un anziano ti fissa con odio: "Hai vinto, ma a che prezzo? Guarda cosa hai fatto."*

**Effetto:** Perdi 1 Zona d'Assedio a tua scelta.

---

### NEUTRALI (standard)

Scelte rischio/ricompensa, tono vario.

---

**N01 - Il Bivio del Mercante** *(Universale)*
> *Un mercante itinerante ha allestito il suo banchetto. "Compro e vendo di tutto," annuncia. "Ma non faccio credito."*

**Scelta A:** Compra un agente → Perdi 2 FC Max, scegli 1 agente tra 3 proposti (Lega = Zona attuale)
**Scelta B:** Vendi un agente → Perdi 1 agente a scelta, guadagni +3 FC Max
**Scelta C:** Vai via → Nessun effetto

---

**N02 - L'Arena Clandestina** *(Zona 1-2)*
> *In una taverna scopri un'arena segreta. "Vuoi combattere?" chiede l'organizzatore. "Se vinci, il premio è sostanzioso."*

**Scelta A:** Combatti → Scontro extra contro nemico Lega +1 rispetto alla zona. Vittoria: +2 agenti. Sconfitta: -3 PV.
**Scelta B:** Scommetti → Perdi 2 FC Max. 60% ne guadagni 5, 40% perdi tutto.
**Scelta C:** Declina → Nessun effetto

---

**N03 - Il Santuario Abbandonato** *(Universale)*
> *Tra le rovine trovi un santuario a una divinità dimenticata. L'altare è ancora intatto. Forse una preghiera...*

**Scelta A:** Prega per forza → +1 POT permanente all'Avatar, ma -2 PV
**Scelta B:** Prega per resistenza → +3 PV, ma -1 DAN all'Avatar per 2 scontri
**Scelta C:** Non disturbare gli dei → Nessun effetto

---

**N04 - Il Disertore** *(Zona 2-3)*
> *Un soldato nemico si arrende. "Sono stanco di combattere per loro. Prendimi con te." Sembra sincero, ma potrebbe essere una spia.*

**Scelta A:** Accettalo → Ottieni 1 agente dell'armata nemica (Lega 3), ma 20% che tradisca nel prossimo scontro (-3 POT a te)
**Scelta B:** Rifiuta → Nessun effetto
**Scelta C:** Interrogalo → Non ottieni l'agente, ma +2 FC nel prossimo scontro (informazioni)

---

**N05 - La Forgia Antica** *(Zona 2-3)*
> *Trovi una forgia ancora funzionante. Il fabbro fantasma ti osserva: "Posso migliorare le tue armi, ma il fuoco richiede sacrificio."*

**Scelta A:** Migliora l'Avatar → +1 DAN permanente all'Avatar, perdi 1 agente
**Scelta B:** Migliora un agente → +1 POT e +1 DAN a un agente a scelta
**Scelta C:** Vai via → Nessun effetto

---

**N06 - Il Ponte Crollato** *(Universale)*
> *Il ponte è distrutto. Puoi guadare il fiume in piena o fare una lunga deviazione.*

**Scelta A:** Guada il fiume → 70% passi senza problemi, 30% perdi 1 agente casuale
**Scelta B:** Deviazione → Nessun rischio, ma il prossimo scontro i nemici hanno +1 POT (ti hanno visto arrivare)

---

**N07 - Il Campo di Battaglia** *(Zona 2-3-4)*
> *Attraversi un campo di battaglia recente. Tra i cadaveri potresti trovare equipaggiamento utile... ma anche sopravvissuti ostili.*

**Scelta A:** Perquisici i cadaveri → 50% trovi artefatto Neutrale, 50% scontro extra
**Scelta B:** Passa oltre rapidamente → Nessun effetto

---

**N08 - L'Alchimista Pazzo** *(Universale)*
> *Un alchimista ti offre le sue pozioni sperimentali. "Funzionano! Probabilmente. Quasi sempre."*

**Scelta A:** Pozione rossa → +2 POT all'Avatar per 2 scontri, poi -1 POT per 1 scontro
**Scelta B:** Pozione blu → +4 FC Max per 2 scontri, poi -2 FC Max per 1 scontro
**Scelta C:** No grazie → Nessun effetto

---

**N09 - Il Prigioniero** *(Zona 2-3)*
> *Nelle segrete del castello conquistato trovi un prigioniero. "Liberami e ti sarò utile," dice. Le sue catene portano simboli arcani.*

**Scelta A:** Liberalo → Ottieni agente Lega 4, ma prossimo evento ha +20% di essere Presagio
**Scelta B:** Lascialo → Nessun effetto
**Scelta C:** Interrogalo → Scopri la posizione di un tesoro: +1 artefatto Neutrale

---

**N10 - Il Contratto** *(Zona 2-3-4)*
> *Un messaggero ti porta un'offerta da un signore della guerra vicino. "Alleanza temporanea. Ti conviene."*

**Scelta A:** Accetta → +3 FC Max e +1 agente Lega 3, ma devi affrontare un Boss Elite extra
**Scelta B:** Rifiuta → Nessun effetto

---

**N11 - Il Rifugio Nascosto** *(Universale)*
> *Trovi una grotta nascosta, perfetta per riposare. Ma qualcosa si muove nell'oscurità...*

**Scelta A:** Riposa comunque → Cura 5 PV, ma 30% di scontro durante la notte
**Scelta B:** Esplora prima → Scontro garantito, ma se vinci +1 artefatto Generoso
**Scelta C:** Trova un altro posto → Cura 2 PV, nessun rischio

---

**N12 - Il Vecchio Veterano** *(Zona 1)*
> *Un vecchio guerriero osserva il tuo allenamento. "Non male, ragazzo. Ma posso insegnarti qualcosa."*

**Scelta A:** Accetta il suo insegnamento → +1 POT permanente all'Avatar, perdi il prossimo evento
**Scelta B:** Rifiuta cortesemente → Nessun effetto

---

**N13 - La Carovana** *(Zona 1-2)*
> *Una carovana di mercanti chiede protezione. "Ti pagheremo bene, ma la strada è pericolosa."*

**Scelta A:** Scortali → Scontro extra, se vinci +2 agenti e +2 FC Max
**Scelta B:** Rifiuta → Nessun effetto

---

**N14 - Il Duello d'Onore** *(Zona 2-3)*
> *Un campione nemico ti sfida a duello singolo. "Solo tu e io. Niente eserciti."*

**Scelta A:** Accetta → Solo l'Avatar combatte. Se vinci: +2 POT permanente. Se perdi: -2 POT permanente.
**Scelta B:** Rifiuta → -1 morale: prossimo scontro le tue carte hanno -1 POT

---

**N15 - La Biblioteca in Rovina** *(Zona 2-3)*
> *Tra i libri bruciati trovi alcuni tomi ancora leggibili. Potrebbero contenere conoscenze preziose.*

**Scelta A:** Studia i tomi di guerra → +1 POT all'Avatar, perdi tempo (nemici +1 carta prossimo scontro)
**Scelta B:** Studia i tomi arcani → Cambia il trigger dell'Avatar (nuova proposta di 3)
**Scelta C:** Non hai tempo → Nessun effetto

---

**N16 - L'Oracolo Cieco** *(Universale)*
> *Una vecchia cieca ti ferma. "Vedo due futuri davanti a te. Scegli."*

**Scelta A:** Il futuro di gloria → Prossimi 2 scontri: +2 POT, poi 1 scontro: -3 POT
**Scelta B:** Il futuro di resistenza → +5 PV ora, -2 PV dopo ogni scontro per 3 scontri

---

**N17 - Il Tradimento** *(Zona 3-4)*
> *Uno dei tuoi capitani viene trovato a comunicare con il nemico. Le prove sono schiaccianti.*

**Scelta A:** Giustizialo pubblicamente → Perdi 1 agente Lega 3+, ma +2 POT a tutti per 2 scontri (morale)
**Scelta B:** Esilialo → Perdi 1 agente Lega 3+, nessun bonus
**Scelta C:** Usalo come doppio agente → Tieni l'agente, ma 30% che riveli info: nemici +2 POT prossimo scontro

---

**N18 - La Tregua** *(Zona 3-4)*
> *Un messaggero nemico propone una tregua temporanea. "Abbiamo un nemico comune."*

**Scelta A:** Accetta → Salta il prossimo scontro, ma il successivo i nemici hanno +2 carte
**Scelta B:** Rifiuta → Nessun effetto

---

**N19 - Il Monolite** *(Universale)*
> *Un monolite nero si erge in mezzo al nulla. Emana un'energia strana. Toccare o non toccare?*

**Scelta A:** Toccalo → Effetto casuale: 25% +2 POT Avatar, 25% -2 POT Avatar, 25% +1 artefatto, 25% -1 agente
**Scelta B:** Ignoralo → Nessun effetto

---

**N20 - L'Ultimo Desiderio** *(Zona 2-3-4)*
> *Un soldato morente ti afferra. "La mia famiglia... promettimi che li proteggerai." I suoi occhi implorano.*

**Scelta A:** Prometti → Perdi 2 FC Max (risorse per la famiglia), ma l'universo ti ricompensa: prossimo evento Generoso garantito
**Scelta B:** Menti → Nessun costo, ma prossimo evento Presagio garantito
**Scelta C:** Silenzio → Nessun effetto

---

### GENEROSI (positivi)

Tono speranzoso, ricompense concrete.

---

**G01 - Il Maestro d'Armi** *(Universale)*
> *Un leggendario maestro d'armi si offre di addestrarti. "Ho visto il tuo potenziale," dice. "Lascia che ti aiuti a realizzarlo."*

**Effetto:** +1 POT e +1 DAN permanenti all'Avatar.

---

**G02 - Il Tesoro Nascosto** *(Universale)*
> *Seguendo una vecchia mappa, trovi un tesoro sepolto. Monete d'oro, gemme... e qualcosa di più prezioso.*

**Scelta A:** Prendi l'oro → +4 FC Max permanenti
**Scelta B:** Prendi l'artefatto → Ottieni artefatto Generoso

---

**G03 - L'Alleato Inaspettato** *(Zona 2-3)*
> *Un potente guerriero si unisce alla tua causa. "La tua battaglia è giusta. Combatterò al tuo fianco."*

**Effetto:** Ottieni 1 agente Lega 4 a tua scelta tra 3 proposti.

---

**G04 - La Benedizione del Santuario** *(Universale)*
> *Il santuario risplende al tuo passaggio. Una voce antica sussurra: "Sei degno."*

**Scelta A:** Benedizione di forza → +2 POT permanente all'Avatar
**Scelta B:** Benedizione di resistenza → +5 PV Max permanenti
**Scelta C:** Benedizione di prosperità → +3 FC Max permanenti

---

**G05 - Il Reclutamento di Massa** *(Zona 1)*
> *La voce delle tue imprese si è sparsa. Decine di volontari vogliono unirsi a te.*

**Effetto:** Ottieni 3 agenti Lega 2 a tua scelta.

---

**G06 - La Forgia Divina** *(Zona 2-3-4)*
> *Trovi una forgia alimentata da fuoco divino. Il fabbro celeste ti sorride: "Oggi forgio gratuitamente."*

**Effetto:** +1 POT e +1 DAN a un agente a tua scelta. L'agente diventa "Benedetto" (immune ai debuff).

---

**G07 - La Visione** *(Universale)*
> *In sogno vedi il campo di battaglia futuro. Ogni mossa nemica, ogni debolezza.*

**Effetto:** Prossimi 3 scontri: vedi le carte nemiche prima di scegliere la tua.

---

**G08 - Il Guaritore Errante** *(Universale)*
> *Un guaritore mistico si offre di curare le tue ferite. "Non voglio nulla in cambio. Solo che tu vinca."*

**Effetto:** Cura tutti i PV. Se sei già al massimo, +5 PV Max.

---

**G09 - L'Armeria Segreta** *(Zona 2-3)*
> *Dietro un muro crollato scopri un'armeria intatta, piena di equipaggiamento di qualità superiore.*

**Effetto:** +1 DAN a tutte le carte del mazzo.

---

**G10 - Il Campione Redento** *(Zona 3-4)*
> *Un ex campione nemico si inginocchia davanti a te. "Mi hai sconfitto con onore. Ora servo te."*

**Effetto:** Ottieni 1 agente Lega 5 dell'armata nemica.

---

**G11 - La Fonte Miracolosa** *(Universale)*
> *Una fonte di acqua cristallina brilla di luce propria. Un sorso e ti senti rinato.*

**Effetto:** Cura 10 PV e rimuovi tutti gli effetti negativi temporanei.

---

**G12 - Il Tributo dei Conquistati** *(Zona 2-3-4)*
> *Le città conquistate inviano tributi in segno di lealtà. Oro, soldati, e artefatti antichi.*

**Scelta A:** Soldati → Ottieni 2 agenti Lega 3
**Scelta B:** Oro → +5 FC Max
**Scelta C:** Artefatti → Ottieni 2 artefatti Neutrali

---

**G13 - L'Ispirazione** *(Zona 2-3-4)*
> *Le tue truppe ti guardano con ammirazione. Il loro morale è alle stelle.*

**Effetto:** +1 POT a tutte le carte per i prossimi 3 scontri.

---

**G14 - Il Patto Vantaggioso** *(Zona 2-3)*
> *Un'entità misteriosa ti offre un patto. Stranamente, sembra essere tutto a tuo favore.*

**Effetto:** Scegli: +2 POT permanente all'Avatar OPPURE +2 DAN permanente all'Avatar OPPURE +1 Lega all'Avatar (con scelta stats).

---

**G15 - La Ritirata Nemica** *(Zona 3-4)*
> *Gli esploratori riferiscono: l'armata nemica si sta ritirando. Hai tempo per prepararti.*

**Effetto:** Salta il prossimo scontro. +2 PV, +2 FC Max, e scegli 1 agente tra 3 proposti.

---

### ILLUMINANTI (molto positivi)

Tono epico, ricompense eccezionali.

---

**I01 - L'Ascensione** *(Zona 3-4)*
> *Una luce accecante ti avvolge. Senti il potere cosmico fluire in te. Quando riapri gli occhi, sei... di più.*

**Effetto:** +1 Lega all'Avatar con scelta stats. Se già Lega 5+, +2 POT e +2 DAN permanenti.

---

**I02 - Il Dono degli Dei** *(Zona 2-3-4)*
> *Gli dei stessi hanno preso nota delle tue imprese. Un raggio di luce scende dal cielo, portando un dono.*

**Effetto:** Ottieni l'artefatto "Corona del Comando" (inizi sempre per primo) + cura completa PV.

---

**I03 - L'Esercito dei Caduti** *(Zona 4)*
> *Gli spiriti di tutti i guerrieri caduti sotto il tuo comando si alzano. "Non ti abbandoneremo," dicono in coro.*

**Effetto:** Per il resto della Zona 4: quando perdi un agente in battaglia, resta nel mazzo con 1 POT e 1 DAN.

---

**I04 - La Rivelazione** *(Zona 2-3-4)*
> *In un momento di chiarezza assoluta, comprendi tutto. Il nemico, te stesso, il destino.*

**Effetto:** Scegli il trigger e il potere dell'Avatar tra tutti quelli disponibili (senza restrizioni di bilanciamento).

---

**I05 - Il Campione Leggendario** *(Zona 3-4)*
> *Una figura leggendaria emerge dalla nebbia. "Il tuo destino è intrecciato col mio," dice. "Combatterò al tuo fianco fino alla fine."*

**Effetto:** Ottieni un agente Lega 5 unico con stats 7/6, Immune, e trigger "Sempre".

---

## ARTEFATTI

### Caratteristiche

- Permanenti per tutta la run
- Senza limite di slot (per ora)
- Effetti globali valgono anche per carte acquisite dopo

### Come si ottengono

- Eventi
- Ricompensa Boss
- Nodi artefatto dedicati

### Maledizioni (molto negativi)

| Artefatto | Effetto |
|-----------|---------|
| Catene dell'Esitazione | Inizi sempre per secondo |
| Sigillo della Povertà | -2 FC Max permanente |
| Marchio del Debole | -1 POT a tutte le carte |
| Peso dell'Armata | -1 DAN a tutte le carte |
| Eco della Sconfitta | Vendetta dei nemici sempre attiva |
| Maschera Incrinata | Il tuo Gregario non funziona |

### Presagi (negativi)

| Artefatto | Effetto |
|-----------|---------|
| Amuleto Corrotto | -1 FC Max permanente |
| Lama Spuntata | -1 DAN all'Avatar |
| Scudo Incrinato | -1 POT all'Avatar |
| Ombra del Dubbio | Gloria del giocatore non si attiva |
| Moneta Falsa | Ogni 5 FC spesi, il nemico guadagna 1 FC |
| Stendardo Sbiadito | Bonus armata attivo solo se 3+ carte dell'armata in mano |

### Neutrali (standard)

| Artefatto | Effetto |
|-----------|---------|
| Bilancia del Fato | A inizio scontro, 50% di iniziare primo o secondo |
| Dado del Caos | +2/-2 VA casuale ogni scontro |
| Specchio Opaco | Copia il trigger dell'agente nemico (sostituisce il tuo) |
| Anello dello Scambio | Puoi scambiare POT e DAN dell'Avatar a inizio scontro |
| Talismano del Rischio | +3 POT ma -2 DAN a tutte le carte |
| Contratto Vincolante | +1 FC Max, ma non puoi scartare agenti |

### Generosi (positivi)

| Artefatto | Effetto |
|-----------|---------|
| Amuleto Lucente | +1 FC Max permanente |
| Lama Affilata | +1 DAN all'Avatar |
| Scudo Rinforzato | +1 POT all'Avatar |
| Stendardo della Vittoria | Gloria del giocatore: +1 POT aggiuntivo |
| Moneta Fortunata | Ogni 5 FC spesi guadagni 1 FC |
| Emblema dell'Armata | Bonus armata attivo anche con 1 sola carta dell'armata in mano |

### Illuminanti (molto positivi)

| Artefatto | Effetto |
|-----------|---------|
| Corona del Comando | Inizi sempre per primo |
| Tesoro Infinito | +2 FC Max permanente |
| Cuore del Titano | +1 POT a tutte le carte |
| Furia Ancestrale | +1 DAN a tutte le carte |
| Aura del Conquistatore | Conquista del giocatore: +2 DAN diretto aggiuntivo |
| Essenza Doppia | Gregario copia entrambi i bonus armata in mano (se presenti) |
| Sigillo dell'Immunità | L'Avatar è Immune ai debuff da eventi/artefatti negativi |

---

## META-PROGRESSIONE

### Valuta Persistente: Frammenti di Gloria

| Azione | Frammenti |
|--------|-----------|
| Duello vinto | 1 |
| Boss Elite sconfitto | 5 |
| Boss Zona sconfitto | 10 |
| Boss Finale sconfitto (vittoria) | 25 |
| Prima vittoria con un'armata | 15 |
| Avatar raggiunge Lega 5 | 10 |
| Avatar raggiunge Lega 6 | 20 |
| Run completata senza Maledizioni | 10 |

### Sblocchi - Contenuti

| Costo | Sblocco |
|-------|---------|
| 10 | Nuovo artefatto aggiunto al pool |
| 15 | Nuovo evento aggiunto al pool |
| 20 | Nuova carta Lega 2-3 aggiunta al pool |
| 30 | Nuova carta Lega 4 aggiunta al pool |
| 50 | Nuova carta Lega 5 aggiunta al pool |

### Sblocchi - Opzioni di Partenza

| Costo | Sblocco |
|-------|---------|
| 25 | Inizia con 1 artefatto casuale (Neutrale) |
| 40 | Inizia con 1 artefatto casuale (Generoso) |
| 50 | +1 POT o +1 DAN permanente all'Avatar a inizio run |
| 75 | Inizia con 1 agente extra a scelta |
| 100 | Scegli 1 delle 4 armate estratte a inizio run |

### Sblocchi - Difficoltà

| Difficoltà | Requisito | Modifiche |
|------------|-----------|-----------|
| Normale | Default | - |
| Difficile | 1 vittoria | Nemici +1 POT, -1 FC Max |
| Brutale | Vittoria in Difficile | Nemici +1 POT +1 DAN, -2 FC Max, eventi negativi +10% |
| Impossibile | Vittoria in Brutale | Nemici +2 POT +1 DAN, -3 FC Max, no eventi Illuminanti |

### Sblocchi - Lore

| Trigger | Sblocco |
|---------|---------|
| Prima run | Introduzione al mondo |
| Vittoria Zona 1 | Storia dell'armata sconfitta |
| Vittoria completa | Epilogo Avatar |
| Vittoria con ogni armata (8) | Storia segreta dei Giocatori |
| 50 run totali | Origini dell'Avatar |

### Sblocchi - Avatar Alternativi

| Costo | Sblocco |
|-------|---------|
| 100 | Avatar con bonus partenza diverso (non Gregario) |
| 150 | Avatar che parte Lega 3 (ma Boss Finale Lega 7) |
| 200 | Avatar con potere fisso potente ma trigger fisso difficile |

---

## POOL AGENTI ROGUELIKE

Pool separato dagli agenti normali, usati dai nemici durante la run.

### Struttura per Zona

| Zona | Bonus Armata | Complessità | Temi |
|------|--------------|-------------|------|
| 1 | No | Semplice | Banditi, reietti, mostri minori, creature ferite |
| 2 | Mix | Media | Soldati, creature pericolose, guerrieri |
| 3 | Mix | Media | Soldati, creature pericolose, guerrieri |
| 4 | Sì | Complessa | Invasori, assedianti, campioni nemici |

### Quantità prevista

| Zona | Generici | Per Armata | Totale |
|------|----------|------------|--------|
| 1 | ~33 | 0 | ~33 |
| 2-3 | ~23 | ~56 (8×7) | ~79 |
| 4 | 0 | ~48 (8×6) | ~48 |
| **Totale** | ~56 | ~104 | **~160** |

### Esempi Zona 1 (Lega 2)

| Nome | POT | DAN | Trigger | Potere |
|------|-----|-----|---------|--------|
| Popolano Arrabbiato | 2 | 1 | Vendetta | +1 POT |
| Bandito della Strada | 2 | 2 | Imboscata | +1 POT |
| Reietto Disperato | 1 | 2 | Rimonta | +2 POT |
| Ladro di Polli | 3 | 1 | Imboscata | +1 FC |
| Mendicante Furioso | 1 | 1 | Vendetta | +2 POT |
| Guardia Corrotta | 2 | 2 | Intervento | +1 DAN |
| Mercenario Ubriaco | 3 | 1 | - | - |
| Cacciatore di Taglie | 2 | 2 | Gloria | +1 DAN |
| Brigante Solitario | 2 | 1 | Imboscata | +1 DAN |
| Contrabbandiere | 1 | 2 | Conquista | +2 FC |
| Lupo Ferito | 3 | 1 | Rimonta | +1 POT |
| Cinghiale Inferocito | 2 | 2 | Vendetta | +1 POT |
| Ratto Gigante | 1 | 1 | Imboscata | +2 POT |
| Pipistrello Rabbioso | 1 | 2 | Intervento | +1 POT |
| Ragno Velenoso | 2 | 1 | Conquista | 1 Danni dir. |
| Serpente delle Fogne | 1 | 2 | Imboscata | 1 Danni dir. |
| Goblin Affamato | 2 | 1 | Gloria | +1 POT |
| Goblin Esploratore | 1 | 2 | Imboscata | +1 DAN |
| Scheletro Risvegliato | 2 | 2 | - | -1 DAN nem. (min 1) |

*(Lista completa da espandere)*

---

## EFFETTI AVATAR - TABELLE DI BILANCIAMENTO

### BUFF (potenziamento proprio)

**+X POT**
| X | Valore FC | Categoria |
|---|-----------|-----------|
| 1 | 0.50 | Debole |
| 2 | 1.00 | Medio |
| 3 | 1.50 | Forte |
| 4 | 2.00 | Forte |

**+X DAN**
| X | Valore FC | Categoria |
|---|-----------|-----------|
| 1 | 0.35 | Debole |
| 2 | 0.70 | Debole |
| 3 | 1.05 | Medio |
| 4 | 1.40 | Forte |

**+X VA**
| X | Valore FC | Categoria |
|---|-----------|-----------|
| 1 | 0.28 | Debole |
| 2 | 0.56 | Debole |
| 3 | 0.84 | Medio |
| 4 | 1.12 | Medio |
| 5 | 1.40 | Forte |

**+X FC**
| X | Valore FC | Categoria |
|---|-----------|-----------|
| 1 | 0.70 | Debole |
| 2 | 1.40 | Forte |
| 3 | 2.10 | Forte |

**Cura X**
| X | Valore FC | Categoria |
|---|-----------|-----------|
| 1 | 0.20 | Debole |
| 2 | 0.40 | Debole |
| 3 | 0.60 | Debole |
| 4 | 0.80 | Medio |

### DANNO DIRETTO

**X Danni dir.**
| X | Valore FC | Categoria |
|---|-----------|-----------|
| 1 | 0.50 | Debole |
| 2 | 1.00 | Medio |
| 3 | 1.50 | Forte |

### DEBUFF (applicati al nemico)

**-X POT nem. (min Y)**

X: 1-4 | Y: 1-4

| X | Y=1 | Y=2 | Y=3 | Y=4 |
|---|-----|-----|-----|-----|
| 1 | 0.45 (D) | 0.40 (D) | 0.35 (D) | 0.30 (D) |
| 2 | 0.90 (M) | 0.80 (M) | 0.70 (M) | 0.60 (D) |
| 3 | 1.35 (F) | 1.20 (F) | 1.05 (M) | 0.90 (M) |
| 4 | 1.80 (F) | 1.60 (F) | 1.40 (F) | 1.20 (M) |

*(D = Debole, M = Medio, F = Forte)*

**-X DAN nem. (min Y)**

X: 1-4 | Y: 1-4

| X | Y=1 | Y=2 | Y=3 | Y=4 |
|---|-----|-----|-----|-----|
| 1 | 0.32 (D) | 0.28 (D) | 0.25 (D) | 0.21 (D) |
| 2 | 0.63 (D) | 0.56 (D) | 0.49 (D) | 0.42 (D) |
| 3 | 0.95 (M) | 0.84 (M) | 0.74 (M) | 0.63 (D) |
| 4 | 1.26 (F) | 1.12 (M) | 0.98 (M) | 0.84 (M) |

**-X VA nem. (min Y)**

Minimi disponibili per Avatar: Y = 4, 5, 6, 7, 8

| X | Y=4 | Y=5 | Y=6 | Y=7 | Y=8 |
|---|-----|-----|-----|-----|-----|
| 2 | 0.39 (D) | 0.34 (D) | 0.28 (D) | - | - |
| 3 | 0.59 (D) | 0.51 (D) | 0.46 (D) | - | - |
| 4 | 0.78 (M) | 0.67 (M) | - | - | - |
| 5 | 0.98 (M) | - | - | - | - |
| 6 | 1.51 (F) | 1.34 (F) | - | - | - |
| 8 | 2.02 (F) | - | - | - | - |

---

## GESTIONE MAZZO

### Post-Scontro (Duello vinto)

1. Vedere 1-2 carte proposte (dell'armata corrente)
2. Decidere se accettare una carta (o nessuna)
3. Se il mazzo è pieno, può scartare 1 carta esistente per fare spazio

**Note:**
- L'Avatar non è mai scartabile
- Dopo una sconfitta: nessuna proposta, nessuno scarto
- Limite mazzo: 5 carte (Zona 1), 10 carte (Zona 2-3-4)

---

## DA DEFINIRE

- [x] ~~Boss Elite singoli~~ - COMPLETATO (16 Boss, 2 per armata, con Zone di Duello uniche)
- [x] ~~Pool completo agenti roguelike~~ - COMPLETATO (160 agenti totali)
- [x] ~~Lista completa eventi per categoria~~ - COMPLETATO (55 eventi)
- [x] ~~Boss fine zona (Avamposto, Capitali)~~ - COMPLETATO (8 Comandanti + 8 Re/Regine + 40 campi)
- [x] ~~Boss finale Zona 4~~ - COMPLETATO (base, da espandere)
- [x] ~~Difficoltà - scaling nemici~~ - COMPLETATO

---

## SISTEMA DIFFICOLTÀ

### Livelli di Difficoltà

| Difficoltà | Requisito | Nemici | FC Max | Eventi | Carte Nemico |
|------------|-----------|--------|--------|--------|--------------|
| Normale | Default | Base | 18 | Standard | Base |
| Difficile | 1 vittoria | +1 POT | 17 | Standard | +1 carta |
| Brutale | Vittoria in Difficile | +1 POT, +1 DAN | 16 | Negativi +10% | +1 carta |
| Impossibile | Vittoria in Brutale | +2 POT, +1 DAN | 15 | No Illuminanti | +2 carte |

### Carte Nemico per Zona (Difficoltà Normale)

| Zona | Carte Nemico |
|------|--------------|
| 1 | 3 |
| 2-3 | 4-5 |
| 4 | 5 |

*In difficoltà superiori, aggiungere il bonus carte indicato sopra.*

### PV Giocatore (tutte le difficoltà)

| Zona | PV |
|------|-----|
| 1-3 | 30 |
| 4 | 50 |

### Note

- Stats nemici fisse per Lega (no scaling progressivo durante la run)
- Modificatori aggiuntivi da definire in futuro

---

## BOSS FINALE ZONA 4 - AVATAR NEMICO

### Struttura Base

| Elemento | Valore |
|----------|--------|
| Lega | 6 (Epica) |
| POT | 7 |
| DAN | 7 |
| Mazzo | 5 carte (Avatar + 4 copie di sé) |
| Campi | Neutrali (nessun effetto) |
| Potere | *Da definire* |

### Note

- Dettagli su identità, meccaniche speciali e campi unici da decidere in futuro
- Per ora funziona come boss generico Lega 6 con stats eccezionali

---

## BOSS FINE ZONA - COMPLETI

### Struttura

| Elemento | Valore |
|----------|--------|
| Mazzo | 5 carte (1 Boss + 4 accompagnatori) |
| Accompagnatori | Pescati dal pool roguelike dell'armata |
| Campi | 5 per armata, condivisi tra Comandante e Re |
| Meccaniche | Solo stats/poteri potenziati |
| Ricompensa | +1 Lega Avatar |

### Progressione

| Zona | Boss | Lega |
|------|------|------|
| 1 | Comandante Avamposto | 3 |
| 2 | Re/Regina Capitale | 4 |
| 3 | Re/Regina Capitale | 5 |
| 4 | Avatar nemico | 6 |

---

## CAMPI TEMATICI PER ARMATA

### ☄️ COMETE

| Campo | Effetto |
|-------|---------|
| Frammento Orbitante | -2 VA a entrambi |
| Coda della Cometa | Gloria: +1 DAN aggiuntivo |
| Campo di Detriti | Imboscata disattivata |
| Nucleo Ghiacciato | Il vincitore recupera 1 FC |
| Osservatorio Stellare | +1 POT a chi ha meno FC |

### 🏛️ PROGENIE DI BABELE

| Campo | Effetto |
|-------|---------|
| Gradini della Ziqqurat | Rimonta: +1 POT aggiuntivo |
| Rovine Ancestrali | Vendetta sempre attiva |
| Sala del Trono Antico | +1 POT a entrambi |
| Biblioteca Perduta | Resa dei conti: +1 POT aggiuntivo |
| Altare dei Re | Il vincitore cura 1 PV |

### 😈 CORTE DEI DIAVOLI

| Campo | Effetto |
|-------|---------|
| Sala dei Contratti | Intervento: copia anche DAN base |
| Trono di Cenere | Vendetta: +1 DAN aggiuntivo |
| Specchio Infernale | Chi perde copia il potere del vincitore (prossimo turno) |
| Pozzo delle Anime | -1 PV a entrambi a fine duello |
| Camera delle Tentazioni | Chi investe più FC guadagna +2 POT |

### ⚙️ LEGIONE MECCANICA

| Campo | Effetto |
|-------|---------|
| Linea di Produzione | Overdrive si attiva a 4 FC |
| Deposito Munizioni | +1 DAN a entrambi |
| Sala Comandi | Conquista: +1 FC aggiuntivo |
| Hangar Principale | -1 DAN subito da entrambi (min 1) |
| Reattore Centrale | Il vincitore guadagna +2 FC |

### 🔮 CIRCOLO MISTICO

| Campo | Effetto |
|-------|---------|
| Cerchio di Evocazione | Resa dei conti sempre attiva |
| Torre dell'Oracolo | Chi gioca secondo vede la carta avversaria |
| Biblioteca Arcana | +2 POT a chi ha meno POT base |
| Nexus di Potere | Overdrive: +2 POT aggiuntivo |
| Santuario Velato | Blocca Potere disattivato |

### 🐛 SCIAME DIVORANTE

| Campo | Effetto |
|-------|---------|
| Nido Sotterraneo | Imboscata: +1 POT aggiuntivo |
| Tunnel di Caccia | Chi perde subisce 1 Danni dir. |
| Camera della Covata | Intervento: copia anche POT |
| Fossa dei Resti | Il perdente perde 1 FC |
| Cuore dello Sciame | -1 DAN nemico (min 1) |

### 🐉 ENCLAVE DELLE SCAGLIE

| Campo | Effetto |
|-------|---------|
| Tana del Drago | Gloria: +2 POT aggiuntivo |
| Nido delle Uova | Intervento: +2 POT aggiuntivo |
| Sala del Tesoro | Il vincitore guadagna +3 FC |
| Picco Vulcanico | +1 DAN a entrambi |
| Trono di Scaglie | Conquista: +2 FC aggiuntivo |

### 🐀 RATTI DELLA MEGERA

| Campo | Effetto |
|-------|---------|
| Fogne Infette | Tossina ignora "minimo" |
| Laboratorio della Peste | Conquista: Tossina +1 aggiuntivo |
| Tana della Megera | Debuff POT: -1 aggiuntivo |
| Magazzino Avvelenato | -1 POT a entrambi |
| Altare del Contagio | Il perdente subisce Tossina 1 |

---

## COMANDANTI AVAMPOSTO (Lega 3)

### ☄️ COMETE - Sentinella dell'Avamposto Stellare
| POT | DAN | Potere |
|-----|-----|--------|
| 5 | 3 | Imboscata: -4 VA nem. |

### 🏛️ PROGENIE DI BABELE - Custode della Prima Torre
| POT | DAN | Potere |
|-----|-----|--------|
| 5 | 4 | Vendetta: +2 POT |

### 😈 CORTE DEI DIAVOLI - Esattore del Confine
| POT | DAN | Potere |
|-----|-----|--------|
| 4 | 4 | Intervento: Copia Potere nem. |

### ⚙️ LEGIONE MECCANICA - Unità di Difesa Perimetrale
| POT | DAN | Potere |
|-----|-----|--------|
| 4 | 5 | Conquista: +2 FC |

### 🔮 CIRCOLO MISTICO - Guardiano della Soglia
| POT | DAN | Potere |
|-----|-----|--------|
| 5 | 3 | Resa dei conti: +3 POT |

### 🐛 SCIAME DIVORANTE - Cacciatore di Frontiera
| POT | DAN | Potere |
|-----|-----|--------|
| 4 | 4 | Imboscata: +2 POT |

### 🐉 ENCLAVE DELLE SCAGLIE - Drago Guardiano
| POT | DAN | Potere |
|-----|-----|--------|
| 5 | 4 | Gloria: +2 POT |

### 🐀 RATTI DELLA MEGERA - Infestatore di Confine
| POT | DAN | Potere |
|-----|-----|--------|
| 4 | 4 | Conquista: Tossina 2 (min 3) |

---

## RE/REGINE CAPITALE (Lega 4 e 5)

### ☄️ COMETE - Sovrano del Vuoto

**Lega 4**
| POT | DAN | Potere |
|-----|-----|--------|
| 6 | 4 | -6 VA nem. (sempre) |

**Lega 5**
| POT | DAN | Potere |
|-----|-----|--------|
| 7 | 5 | -8 VA nem. (sempre) |

---

### 🏛️ PROGENIE DI BABELE - Erede di Nimrod

**Lega 4**
| POT | DAN | Potere |
|-----|-----|--------|
| 6 | 5 | Resa dei conti: +2 DAN |

**Lega 5**
| POT | DAN | Potere |
|-----|-----|--------|
| 7 | 5 | Resa dei conti: +3 DAN |

---

### 😈 CORTE DEI DIAVOLI - Arciduca dei Patti

**Lega 4**
| POT | DAN | Potere |
|-----|-----|--------|
| 5 | 5 | Intervento: Copia Potere + Copia Bonus |

**Lega 5**
| POT | DAN | Potere |
|-----|-----|--------|
| 6 | 5 | Intervento: Copia Potere + Copia Bonus + Copia POT |

---

### ⚙️ LEGIONE MECCANICA - Processore Supremo

**Lega 4**
| POT | DAN | Potere |
|-----|-----|--------|
| 5 | 6 | Overdrive: +3 POT |

**Lega 5**
| POT | DAN | Potere |
|-----|-----|--------|
| 6 | 6 | Overdrive: +4 POT |

---

### 🔮 CIRCOLO MISTICO - Arconte del Sapere

**Lega 4**
| POT | DAN | Potere |
|-----|-----|--------|
| 6 | 4 | Resa dei conti: +4 POT |

**Lega 5**
| POT | DAN | Potere |
|-----|-----|--------|
| 6 | 5 | Resa dei conti: +5 POT |

---

### 🐛 SCIAME DIVORANTE - Regina Progenitrice

**Lega 4**
| POT | DAN | Potere |
|-----|-----|--------|
| 5 | 5 | Conquista: -2 DAN nem. (min 1) |

**Lega 5**
| POT | DAN | Potere |
|-----|-----|--------|
| 6 | 6 | Conquista: -3 DAN nem. (min 1) |

---

### 🐉 ENCLAVE DELLE SCAGLIE - Signore della Covata

**Lega 4**
| POT | DAN | Potere |
|-----|-----|--------|
| 6 | 5 | Gloria: +3 POT |

**Lega 5**
| POT | DAN | Potere |
|-----|-----|--------|
| 7 | 5 | Gloria: +4 POT |

---

### 🐀 RATTI DELLA MEGERA - La Megera

**Lega 4**
| POT | DAN | Potere |
|-----|-----|--------|
| 5 | 5 | Conquista: Tossina 3 (min 2), -2 POT nem. (min 2) |

**Lega 5**
| POT | DAN | Potere |
|-----|-----|--------|
| 6 | 5 | Conquista: Tossina 4 (min 2), -3 POT nem. (min 1) |

---

### RIEPILOGO BOSS FINE ZONA

| Armata | Comandante (L3) | Re/Regina | Campi |
|--------|-----------------|-----------|-------|
| ☄️ Comete | Sentinella dell'Avamposto Stellare | Sovrano del Vuoto | 5 |
| 🏛️ Progenie | Custode della Prima Torre | Erede di Nimrod | 5 |
| 😈 Corte | Esattore del Confine | Arciduca dei Patti | 5 |
| ⚙️ Legione | Unità di Difesa Perimetrale | Processore Supremo | 5 |
| 🔮 Circolo | Guardiano della Soglia | Arconte del Sapere | 5 |
| 🐛 Sciame | Cacciatore di Frontiera | Regina Progenitrice | 5 |
| 🐉 Enclave | Drago Guardiano | Signore della Covata | 5 |
| 🐀 Ratti | Infestatore di Confine | La Megera | 5 |

---

## BOSS ELITE - COMPLETI

16 Boss Elite totali (2 per armata): 1 Lega 4 (Zona 2) + 1 Lega 5 (Zona 3).
Versioni potenziate di agenti esistenti con zone di duello uniche.

---

### ☄️ COMETE

**Zarkon, l'Eterno (Lega 4)**
| POT | DAN | Potere |
|-----|-----|--------|
| 7 | 5 | -10 VA nem. (sempre) |

Mini-mazzo: Zarkon l'Eterno + Guardiano del Vuoto + Specchio Cosmico

**Zona di Duello: Cuore della Nebulosa**
> -3 VA a entrambi i giocatori. Il vincitore recupera 2 FC.

---

**Supernova Suprema (Lega 5)**
| POT | DAN | Potere |
|-----|-----|--------|
| 6 | 7 | Gloria: +8 VA |

Mini-mazzo: Supernova Suprema + Onda d'Urto Stellare + Cavaliere della Cometa + Sentinella Astrale

**Zona di Duello: Orizzonte degli Eventi**
> Gloria sempre attiva per entrambi. Chi perde subisce +1 DAN.

---

### 🏛️ PROGENIE DI BABELE

**Nimrod, Re dei Re (Lega 4)**
| POT | DAN | Potere |
|-----|-----|--------|
| 8 | 4 | Resa dei conti: +3 DAN |

Mini-mazzo: Nimrod Re dei Re + Profeta delle Rovine + Spirito della Torre

**Zona di Duello: Cima della Ziqqurat**
> Rimonta sempre attiva per entrambi. Il vincitore cura 1 PV.

---

**Ur-Nammu, il Divino (Lega 5)**
| POT | DAN | Potere |
|-----|-----|--------|
| 7 | 6 | Magnanimo: +3 POT |

Mini-mazzo: Ur-Nammu il Divino + Berserker di Babele + Custode della Ziqqurat + Sacerdote del Caos

**Zona di Duello: Trono dei Re Antichi**
> +2 POT a entrambi. Ultimo Desiderio sempre attivo per entrambi.

---

### 😈 CORTE DEI DIAVOLI

**Sussurratrice Suprema (Lega 4)**
| POT | DAN | Potere |
|-----|-----|--------|
| 6 | 5 | Intervento: Copia Potere + Copia Bonus |

Mini-mazzo: Sussurratrice Suprema + Specchio dell'Anima + Tentatore d'Anime

**Zona di Duello: Sala dei Patti**
> Intervento sempre attivo per entrambi. Chi gioca per primo perde 1 FC.

---

**Principe dell'Abisso (Lega 5)**
| POT | DAN | Potere |
|-----|-----|--------|
| 8 | 4 | Conquista: 4 Danni dir. |

Mini-mazzo: Principe dell'Abisso + Vendicatore dei Patti + Demone del Rancore + Esattore Infernale

**Zona di Duello: Fornace della Fiamma Nera**
> Vendetta sempre attiva per entrambi. +1 DAN a entrambi.

---

### ⚙️ LEGIONE MECCANICA

**Nucleo Centrale (Lega 4)**
| POT | DAN | Potere |
|-----|-----|--------|
| 5 | 6 | Overdrive: +3 POT |

Mini-mazzo: Nucleo Centrale + Fortezza Mobile + Cannone Semovente

**Zona di Duello: Fabbrica di Guerra**
> Overdrive si attiva a 4 FC invece di 5. Il vincitore guadagna +2 FC.

---

**Titano MK-V (Lega 5)**
| POT | DAN | Potere |
|-----|-----|--------|
| 7 | 7 | Immune |

Mini-mazzo: Titano MK-V + Sentinella d'Acciaio + Conquistatore d'Acciaio + Golem di Plasma

**Zona di Duello: Hangar del Titano**
> -1 DAN subito da entrambi (min 1). Blocca Potere disattivato.

---

### 🔮 CIRCOLO MISTICO

**Maestro Supremo (Lega 4)**
| POT | DAN | Potere |
|-----|-----|--------|
| 6 | 4 | Resa dei conti: +4 POT |

Mini-mazzo: Maestro Supremo + Stregone di Battaglia + Oracolo Velato

**Zona di Duello: Biblioteca delle Rune**
> Resa dei conti sempre attiva per entrambi. Copia POT disattivato.

---

**Arcimago Trascendente (Lega 5)**
| POT | DAN | Potere |
|-----|-----|--------|
| 5 | 5 | Overdrive: +5 POT |

Mini-mazzo: Arcimago Trascendente + Custode dei Segreti + Riflesso Arcano + Evocatore di Spiriti

**Zona di Duello: Nexus del Potere**
> Entrambi iniziano con +2 FC. Chi investe più FC guadagna +2 POT.

---

### 🐛 SCIAME DIVORANTE

**Bruto Alpha (Lega 4)**
| POT | DAN | Potere |
|-----|-----|--------|
| 6 | 5 | -3 DAN nem. (min 2) |

Mini-mazzo: Bruto Alpha + Predatore Alfa + Parassita Cerebrale

**Zona di Duello: Nido Primordiale**
> Imboscata sempre attiva per entrambi. Il perdente subisce 1 Danni dir.

---

**Regina Madre (Lega 5)**
| POT | DAN | Potere |
|-----|-----|--------|
| 6 | 6 | Overdrive: Immune |

Mini-mazzo: Regina Madre + Abominio Perfetto + Divoratore di Forza + Infestatore

**Zona di Duello: Camera della Regina**
> Conquista sempre attiva per entrambi. Chi perde perde anche 2 FC.

---

### 🐉 ENCLAVE DELLE SCAGLIE

**Signore delle Fiamme (Lega 4)**
| POT | DAN | Potere |
|-----|-----|--------|
| 6 | 5 | Conquista: +4 FC |

Mini-mazzo: Signore delle Fiamme + Cavaliere Draconico + Custode delle Uova

**Zona di Duello: Tana del Fuoco**
> Conquista sempre attiva per entrambi. +1 Danni dir. al vincitore.

---

**Imperatore dei Draghi (Lega 5)**
| POT | DAN | Potere |
|-----|-----|--------|
| 7 | 6 | Gloria: +5 POT |

Mini-mazzo: Imperatore dei Draghi + Guardiano della Covata + Sacerdote del Fuoco + Scaglia Veterana

**Zona di Duello: Trono di Ossidiana**
> Gloria sempre attiva per entrambi. +2 POT a entrambi.

---

### 🐀 RATTI DELLA MEGERA

**Untore Supremo (Lega 4)**
| POT | DAN | Potere |
|-----|-----|--------|
| 5 | 5 | Conquista: Tossina 4 (min 3) |

Mini-mazzo: Untore Supremo + Portatore di Rovina + Sabotatore d'Élite

**Zona di Duello: Fogne della Peste**
> Tossina ignora "minimo" per entrambi. -1 POT a entrambi.

---

**Megera Incarnata (Lega 5)**
| POT | DAN | Potere |
|-----|-----|--------|
| 7 | 5 | Resa dei conti: -5 POT nem. (min 1), Tossina 3 (min 3) |

Mini-mazzo: Megera Incarnata + Flagello della Peste + Maestro Assassino + Portatore di Rovina

**Zona di Duello: Altare della Megera**
> Debuff POT non hanno minimo. Chi perde subisce Tossina 2.

---

### RIEPILOGO ZONE DI DUELLO BOSS ELITE

| Boss | Zona | Effetto Principale |
|------|------|-------------------|
| Zarkon, l'Eterno | Cuore della Nebulosa | -3 VA entrambi, vincitore +2 FC |
| Supernova Suprema | Orizzonte degli Eventi | Gloria sempre attiva, perdente +1 DAN |
| Nimrod, Re dei Re | Cima della Ziqqurat | Rimonta sempre attiva, vincitore cura 1 |
| Ur-Nammu, il Divino | Trono dei Re Antichi | +2 POT entrambi, Ultimo Desiderio attivo |
| Sussurratrice Suprema | Sala dei Patti | Intervento sempre attivo, primo -1 FC |
| Principe dell'Abisso | Fornace della Fiamma Nera | Vendetta sempre attiva, +1 DAN entrambi |
| Nucleo Centrale | Fabbrica di Guerra | Overdrive a 4 FC, vincitore +2 FC |
| Titano MK-V | Hangar del Titano | -1 DAN entrambi, Blocca Potere off |
| Maestro Supremo | Biblioteca delle Rune | Resa dei conti attiva, Copia POT off |
| Arcimago Trascendente | Nexus del Potere | +2 FC entrambi, chi investe più +2 POT |
| Bruto Alpha | Nido Primordiale | Imboscata sempre attiva, perdente 1 Danni dir. |
| Regina Madre | Camera della Regina | Conquista sempre attiva, perdente -2 FC |
| Signore delle Fiamme | Tana del Fuoco | Conquista sempre attiva, vincitore 1 Danni dir. |
| Imperatore dei Draghi | Trono di Ossidiana | Gloria sempre attiva, +2 POT entrambi |
| Untore Supremo | Fogne della Peste | Tossina no minimo, -1 POT entrambi |
| Megera Incarnata | Altare della Megera | Debuff POT no minimo, perdente Tossina 2 |

---

## POOL AGENTI ROGUELIKE - COMPLETO (160 agenti)

### RIEPILOGO TOTALE

| Zona | Lega 2 | Lega 3 | Lega 4 | Lega 5 | Totale |
|------|--------|--------|--------|--------|--------|
| Zona 1 | 30 | 3 | - | - | 33 |
| Zona 2-3 | 10 | 42 | 27 | - | 79 |
| Zona 4 | - | 8 | 24 | 16 | 48 |
| **Totale** | **40** | **53** | **51** | **16** | **160** |

---

### ZONA 1: RECLUTAMENTO (33 agenti)

**Caratteristiche:** Nessun bonus armata, poteri semplici
**Temi:** Banditi, reietti, mostri minori, creature ferite/deboli

#### Banditi e Fuorilegge (Lega 2)

| # | Nome | POT | DAN | Trigger | Potere |
|---|------|-----|-----|---------|--------|
| R001 | Bandito della Strada | 2 | 2 | Imboscata | +1 POT |
| R002 | Brigante Solitario | 2 | 1 | Imboscata | +1 DAN |
| R003 | Ladro di Polli | 3 | 1 | Imboscata | +1 FC |
| R004 | Contrabbandiere | 1 | 2 | Conquista | +2 FC |
| R005 | Tagliaborse | 2 | 1 | Gloria | +2 FC |
| R006 | Ricettatore | 1 | 2 | Conquista | +1 FC |
| R007 | Predone di Strada | 3 | 2 | - | - |
| R008 | Fuorilegge Disperato | 2 | 2 | Rimonta | +2 POT |
| R009 | Cacciatore di Taglie | 2 | 2 | Gloria | +1 DAN |
| R010 | Sicario Fallito | 2 | 3 | Imboscata | -1 PV (a te) |

#### Reietti e Popolani (Lega 2)

| # | Nome | POT | DAN | Trigger | Potere |
|---|------|-----|-----|---------|--------|
| R011 | Popolano Arrabbiato | 2 | 1 | Vendetta | +1 POT |
| R012 | Mendicante Furioso | 1 | 1 | Vendetta | +2 POT |
| R013 | Reietto Disperato | 1 | 2 | Rimonta | +2 POT |
| R014 | Guardia Corrotta | 2 | 2 | Intervento | +1 DAN |
| R015 | Mercenario Ubriaco | 3 | 1 | - | - |
| R016 | Contadino Impazzito | 2 | 1 | Vendetta | +1 DAN |
| R017 | Esiliato Rancoroso | 1 | 2 | Vendetta | +1 POT |
| R018 | Fabbro in Rovina | 2 | 2 | Intervento | +1 POT |
| R019 | Boia Ritirato | 3 | 2 | - | - |
| R020 | Disertore | 2 | 1 | Rimonta | +1 POT, +1 DAN |

#### Creature Minori e Ferite (Lega 2)

| # | Nome | POT | DAN | Trigger | Potere |
|---|------|-----|-----|---------|--------|
| R021 | Lupo Ferito | 3 | 1 | Rimonta | +1 POT |
| R022 | Cinghiale Inferocito | 2 | 2 | Vendetta | +1 POT |
| R023 | Ratto Gigante | 1 | 1 | Imboscata | +2 POT |
| R024 | Pipistrello Rabbioso | 1 | 2 | Intervento | +1 POT |
| R025 | Ragno Velenoso | 2 | 1 | Conquista | 1 Danni dir. |
| R026 | Serpente delle Fogne | 1 | 2 | Imboscata | 1 Danni dir. |
| R027 | Goblin Affamato | 2 | 1 | Gloria | +1 POT |
| R028 | Goblin Esploratore | 1 | 2 | Imboscata | +1 DAN |
| R029 | Scheletro Risvegliato | 2 | 2 | - | -1 DAN nem. (min 1) |
| R030 | Orso Zoppo | 3 | 2 | Rimonta | -1 PV (a te) |

#### Nemici Rari (Lega 3)

| # | Nome | POT | DAN | Trigger | Potere |
|---|------|-----|-----|---------|--------|
| R031 | Capo dei Banditi | 4 | 3 | Gloria | +1 POT, +1 DAN |
| R032 | Orco Esiliato | 4 | 2 | Vendetta | +2 POT |
| R033 | Bestia della Palude | 3 | 3 | Imboscata | 2 Danni dir. |

---

### ZONA 2-3: CONQUISTE (79 agenti)

**Caratteristiche:** Mix bonus armata, complessità media
**Temi:** Soldati, creature pericolose, guerrieri

#### Generici Senza Armata

**Lega 2 (10)**

| # | Nome | POT | DAN | Trigger | Potere |
|---|------|-----|-----|---------|--------|
| R034 | Soldato Semplice | 2 | 2 | - | - |
| R035 | Arciere di Leva | 2 | 1 | Imboscata | +1 DAN |
| R036 | Guardia Cittadina | 2 | 2 | Intervento | +1 POT |
| R037 | Mercenario | 3 | 2 | Gloria | +1 FC |
| R038 | Esploratore | 2 | 1 | Imboscata | +1 POT |
| R039 | Miliziano | 1 | 2 | Vendetta | +1 POT |
| R040 | Cavaliere Novizio | 3 | 1 | Gloria | +1 POT |
| R041 | Spadaccino | 2 | 2 | Intervento | +1 DAN |
| R042 | Balestriere | 1 | 3 | Imboscata | +1 POT |
| R043 | Scudiero | 2 | 1 | Intervento | +1 POT, +1 DAN |

**Lega 3 (10)**

| # | Nome | POT | DAN | Trigger | Potere |
|---|------|-----|-----|---------|--------|
| R044 | Veterano | 4 | 3 | - | - |
| R045 | Capitano della Guardia | 4 | 2 | Gloria | +1 POT, +1 DAN |
| R046 | Cavaliere | 3 | 3 | Gloria | +1 POT |
| R047 | Berserker | 3 | 4 | Vendetta | +1 POT |
| R048 | Arciere d'Élite | 3 | 2 | Imboscata | 2 Danni dir. |
| R049 | Duellante | 4 | 2 | Intervento | +1 POT |
| R050 | Comandante | 3 | 3 | Conquista | +2 FC |
| R051 | Guardia del Corpo | 4 | 3 | Intervento | -1 DAN nem. (min 1) |
| R052 | Assassino | 3 | 3 | Imboscata | +2 POT |
| R053 | Mago di Battaglia | 3 | 2 | Resa dei conti | +2 POT |

**Lega 4 (3)**

| # | Nome | POT | DAN | Trigger | Potere |
|---|------|-----|-----|---------|--------|
| R054 | Campione | 5 | 4 | Gloria | +1 POT, +1 DAN |
| R055 | Generale | 4 | 4 | Conquista | +3 FC |
| R056 | Arcimago Mercenario | 4 | 3 | Resa dei conti | +3 POT |

#### ☄️ COMETE (7 agenti)

**Lega 3 (4)**

| # | Nome | POT | DAN | Trigger | Potere |
|---|------|-----|-----|---------|--------|
| R057 | Sentinella Stellare | 4 | 3 | Intervento | -3 VA nem. |
| R058 | Cavaliere della Cometa | 4 | 2 | Gloria | +1 POT |
| R059 | Guardiano del Vuoto | 3 | 3 | - | -4 VA nem. (sempre) |
| R060 | Specchio Cosmico | 3 | 3 | Intervento | Copia POT nem. |

**Lega 4 (3)**

| # | Nome | POT | DAN | Trigger | Potere |
|---|------|-----|-----|---------|--------|
| R061 | Onda d'Urto Stellare | 5 | 4 | Conquista | 2 Danni dir. |
| R062 | Tessitore di Stelle | 4 | 4 | Resa dei conti | -5 VA nem. |
| R063 | Frammentatore | 5 | 3 | Gloria | +2 POT |

#### 🏛️ PROGENIE DI BABELE (7 agenti)

**Lega 3 (4)**

| # | Nome | POT | DAN | Trigger | Potere |
|---|------|-----|-----|---------|--------|
| R064 | Custode della Ziqqurat | 4 | 3 | Intervento | +1 POT |
| R065 | Profeta delle Rovine | 3 | 3 | Resa dei conti | +2 POT |
| R066 | Berserker di Babele | 4 | 2 | Vendetta | +2 POT |
| R067 | Spirito della Torre | 3 | 3 | Rimonta | +2 POT |

**Lega 4 (3)**

| # | Nome | POT | DAN | Trigger | Potere |
|---|------|-----|-----|---------|--------|
| R068 | Sacerdote del Caos | 5 | 3 | Resa dei conti | +2 DAN |
| R069 | Campione di Nimrod | 5 | 4 | Vendetta | +1 POT, +1 DAN |
| R070 | Evocatore di Giganti | 4 | 4 | Magnanimo | +3 POT |

#### 😈 CORTE DEI DIAVOLI (7 agenti)

**Lega 3 (4)**

| # | Nome | POT | DAN | Trigger | Potere |
|---|------|-----|-----|---------|--------|
| R071 | Tentatore d'Anime | 3 | 3 | Intervento | Copia Potere nem. |
| R072 | Specchio dell'Anima | 4 | 2 | Intervento | Copia Bonus nem. |
| R073 | Demone del Rancore | 4 | 3 | Vendetta | +1 DAN |
| R074 | Esattore Infernale | 3 | 3 | Conquista | 2 Danni dir. |

**Lega 4 (3)**

| # | Nome | POT | DAN | Trigger | Potere |
|---|------|-----|-----|---------|--------|
| R075 | Vendicatore dei Patti | 5 | 4 | Vendetta | +2 POT |
| R076 | Principe Minore | 4 | 4 | Conquista | 3 Danni dir. |
| R077 | Corruttore | 5 | 3 | Intervento | Copia Potere + Copia Bonus |

#### ⚙️ LEGIONE MECCANICA (7 agenti)

**Lega 3 (4)**

| # | Nome | POT | DAN | Trigger | Potere |
|---|------|-----|-----|---------|--------|
| R078 | Sentinella d'Acciaio | 4 | 3 | Intervento | +1 POT |
| R079 | Cannone Semovente | 3 | 4 | Conquista | 2 Danni dir. |
| R080 | Fortezza Mobile | 4 | 2 | - | -2 DAN nem. (min 1) |
| R081 | Golem di Plasma | 3 | 3 | Overdrive | +2 POT |

**Lega 4 (3)**

| # | Nome | POT | DAN | Trigger | Potere |
|---|------|-----|-----|---------|--------|
| R082 | Conquistatore d'Acciaio | 5 | 4 | Conquista | +2 FC |
| R083 | Nucleo Minore | 4 | 4 | Overdrive | +2 POT |
| R084 | Devastatore | 5 | 3 | Conquista | 3 Danni dir. |

#### 🔮 CIRCOLO MISTICO (7 agenti)

**Lega 3 (4)**

| # | Nome | POT | DAN | Trigger | Potere |
|---|------|-----|-----|---------|--------|
| R085 | Stregone di Battaglia | 4 | 2 | Resa dei conti | +2 POT |
| R086 | Oracolo Velato | 3 | 3 | Intervento | +2 POT |
| R087 | Incantatore | 3 | 3 | Intervento | +2 POT |
| R088 | Guardiano Runico | 4 | 3 | - | Blocca Bonus |

**Lega 4 (3)**

| # | Nome | POT | DAN | Trigger | Potere |
|---|------|-----|-----|---------|--------|
| R089 | Stregone di Guerra | 5 | 3 | Imboscata | +3 POT |
| R090 | Arciere Mistico | 4 | 4 | Imboscata | 3 Danni dir. |
| R091 | Maestro Elementale | 5 | 4 | Resa dei conti | -4 VA nem. |

#### 🐛 SCIAME DIVORANTE (7 agenti)

**Lega 3 (4)**

| # | Nome | POT | DAN | Trigger | Potere |
|---|------|-----|-----|---------|--------|
| R092 | Cacciatore dello Sciame | 4 | 3 | Imboscata | +1 POT |
| R093 | Parassita Maggiore | 3 | 3 | Intervento | Copia POT nem. |
| R094 | Divoratore | 4 | 2 | Conquista | 2 Danni dir. |
| R095 | Larva Corazzata | 4 | 3 | Vendetta | +1 POT |

**Lega 4 (3)**

| # | Nome | POT | DAN | Trigger | Potere |
|---|------|-----|-----|---------|--------|
| R096 | Predatore Supremo | 5 | 4 | Imboscata | +2 POT |
| R097 | Infestatore d'Élite | 5 | 3 | Conquista | 3 Danni dir. |
| R098 | Bruto dello Sciame | 5 | 4 | - | -2 DAN nem. (min 2) |

#### 🐉 ENCLAVE DELLE SCAGLIE (7 agenti)

**Lega 3 (4)**

| # | Nome | POT | DAN | Trigger | Potere |
|---|------|-----|-----|---------|--------|
| R099 | Cavaliere Draconico | 4 | 3 | Gloria | +1 POT |
| R100 | Custode delle Uova | 3 | 3 | Intervento | +2 POT |
| R101 | Scaglia Veterana | 4 | 2 | Conquista | +2 FC |
| R102 | Sputafuoco | 3 | 3 | Imboscata | 2 Danni dir. |

**Lega 4 (3)**

| # | Nome | POT | DAN | Trigger | Potere |
|---|------|-----|-----|---------|--------|
| R103 | Guardiano della Covata | 5 | 4 | Intervento | +2 POT |
| R104 | Sacerdote del Fuoco | 4 | 4 | Conquista | +3 FC |
| R105 | Drago Giovane | 5 | 3 | Gloria | +2 DAN |

#### 🐀 RATTI DELLA MEGERA (7 agenti)

**Lega 3 (4)**

| # | Nome | POT | DAN | Trigger | Potere |
|---|------|-----|-----|---------|--------|
| R106 | Portatore di Rovina | 3 | 3 | Conquista | Tossina 2 (min 3) |
| R107 | Sabotatore d'Élite | 4 | 2 | Imboscata | -3 POT nem. (min 2) |
| R108 | Assassino delle Fogne | 4 | 3 | Imboscata | +1 DAN |
| R109 | Appestato | 3 | 2 | Vendetta | Tossina 2 (min 4) |

**Lega 4 (3)**

| # | Nome | POT | DAN | Trigger | Potere |
|---|------|-----|-----|---------|--------|
| R110 | Untore | 4 | 4 | Conquista | Tossina 3 (min 3) |
| R111 | Maestro Assassino | 5 | 3 | Imboscata | -4 POT nem. (min 1) |
| R112 | Flagello Pestilente | 5 | 4 | Vendetta | Tossina 2 (min 3) |

---

### ZONA 4: DIFESA (48 agenti)

**Caratteristiche:** Tutti con bonus armata, complessità alta
**Temi:** Invasori, assedianti, campioni nemici

#### ☄️ COMETE (6)

**Lega 3 (1)**

| # | Nome | POT | DAN | Trigger | Potere |
|---|------|-----|-----|---------|--------|
| R113 | Esploratore del Vuoto | 4 | 3 | Imboscata | -4 VA nem. |

**Lega 4 (3)**

| # | Nome | POT | DAN | Trigger | Potere |
|---|------|-----|-----|---------|--------|
| R114 | Distruttore Stellare | 5 | 4 | Conquista | 3 Danni dir. |
| R115 | Signore delle Comete | 5 | 3 | Resa dei conti | -6 VA nem. |
| R116 | Divoratore di Mondi | 4 | 5 | Gloria | +2 POT, +1 DAN |

**Lega 5 (2)**

| # | Nome | POT | DAN | Trigger | Potere |
|---|------|-----|-----|---------|--------|
| R117 | Araldo del Vuoto | 6 | 4 | Resa dei conti | -8 VA nem. |
| R118 | Annientatore Cosmico | 5 | 5 | Conquista | 4 Danni dir. |

#### 🏛️ PROGENIE DI BABELE (6)

**Lega 3 (1)**

| # | Nome | POT | DAN | Trigger | Potere |
|---|------|-----|-----|---------|--------|
| R119 | Avanguardia Ancestrale | 4 | 3 | Vendetta | +2 POT |

**Lega 4 (3)**

| # | Nome | POT | DAN | Trigger | Potere |
|---|------|-----|-----|---------|--------|
| R120 | Titano di Babele | 5 | 4 | Rimonta | +3 POT |
| R121 | Profeta del Caos | 5 | 3 | Resa dei conti | +3 DAN |
| R122 | Devastatore Ancestrale | 4 | 5 | Vendetta | +2 POT |

**Lega 5 (2)**

| # | Nome | POT | DAN | Trigger | Potere |
|---|------|-----|-----|---------|--------|
| R123 | Campione dei Re | 6 | 5 | Resa dei conti | +2 POT, +2 DAN |
| R124 | Signore della Torre | 5 | 5 | Magnanimo | +4 POT |

#### 😈 CORTE DEI DIAVOLI (6)

**Lega 3 (1)**

| # | Nome | POT | DAN | Trigger | Potere |
|---|------|-----|-----|---------|--------|
| R125 | Emissario Infernale | 4 | 3 | Intervento | Copia Potere nem. |

**Lega 4 (3)**

| # | Nome | POT | DAN | Trigger | Potere |
|---|------|-----|-----|---------|--------|
| R126 | Esecutore dei Patti | 5 | 4 | Vendetta | +2 POT, +1 DAN |
| R127 | Tormentatore | 5 | 3 | Conquista | 4 Danni dir. |
| R128 | Corruttore Supremo | 4 | 4 | Intervento | Copia Potere + Copia Bonus |

**Lega 5 (2)**

| # | Nome | POT | DAN | Trigger | Potere |
|---|------|-----|-----|---------|--------|
| R129 | Arciduca dell'Abisso | 6 | 4 | Conquista | 5 Danni dir. |
| R130 | Signore dei Patti | 5 | 5 | Intervento | Copia tutto (POT, Potere, Bonus) |

#### ⚙️ LEGIONE MECCANICA (6)

**Lega 3 (1)**

| # | Nome | POT | DAN | Trigger | Potere |
|---|------|-----|-----|---------|--------|
| R131 | Unità d'Assalto | 4 | 3 | Conquista | +2 FC |

**Lega 4 (3)**

| # | Nome | POT | DAN | Trigger | Potere |
|---|------|-----|-----|---------|--------|
| R132 | Colosso d'Acciaio | 5 | 4 | - | -3 DAN nem. (min 1) |
| R133 | Cannone Imperiale | 4 | 5 | Conquista | 4 Danni dir. |
| R134 | Nucleo di Comando | 5 | 3 | Overdrive | +3 POT |

**Lega 5 (2)**

| # | Nome | POT | DAN | Trigger | Potere |
|---|------|-----|-----|---------|--------|
| R135 | Titano Corazzato | 6 | 5 | - | Immune |
| R136 | Devastatore Supremo | 5 | 6 | Conquista | 5 Danni dir. |

#### 🔮 CIRCOLO MISTICO (6)

**Lega 3 (1)**

| # | Nome | POT | DAN | Trigger | Potere |
|---|------|-----|-----|---------|--------|
| R137 | Evocatore di Spiriti | 4 | 3 | Resa dei conti | +2 POT |

**Lega 4 (3)**

| # | Nome | POT | DAN | Trigger | Potere |
|---|------|-----|-----|---------|--------|
| R138 | Custode dei Segreti | 5 | 3 | Overdrive | +3 POT |
| R139 | Riflesso Arcano | 4 | 4 | Intervento | Copia POT + Copia Potere |
| R140 | Distruttore Mistico | 5 | 4 | Resa dei conti | -5 VA nem. |

**Lega 5 (2)**

| # | Nome | POT | DAN | Trigger | Potere |
|---|------|-----|-----|---------|--------|
| R141 | Arcimago del Potere | 5 | 5 | Overdrive | +5 POT |
| R142 | Signore delle Rune | 6 | 4 | Resa dei conti | -6 VA nem., +2 POT |

#### 🐛 SCIAME DIVORANTE (6)

**Lega 3 (1)**

| # | Nome | POT | DAN | Trigger | Potere |
|---|------|-----|-----|---------|--------|
| R143 | Predatore Alfa | 4 | 3 | Imboscata | +2 POT |

**Lega 4 (3)**

| # | Nome | POT | DAN | Trigger | Potere |
|---|------|-----|-----|---------|--------|
| R144 | Parassita Cerebrale | 5 | 3 | Intervento | Copia POT + Copia Potere |
| R145 | Divoratore di Forza | 5 | 4 | Conquista | 3 Danni dir. |
| R146 | Abominio Perfetto | 4 | 5 | Vendetta | +2 POT, +1 DAN |

**Lega 5 (2)**

| # | Nome | POT | DAN | Trigger | Potere |
|---|------|-----|-----|---------|--------|
| R147 | Regina della Colonia | 6 | 5 | Overdrive | Immune |
| R148 | Titano dello Sciame | 5 | 6 | Imboscata | +3 POT |

#### 🐉 ENCLAVE DELLE SCAGLIE (6)

**Lega 3 (1)**

| # | Nome | POT | DAN | Trigger | Potere |
|---|------|-----|-----|---------|--------|
| R149 | Drago Adulto | 4 | 3 | Conquista | +3 FC |

**Lega 4 (3)**

| # | Nome | POT | DAN | Trigger | Potere |
|---|------|-----|-----|---------|--------|
| R150 | Signore del Fuoco | 5 | 4 | Gloria | +2 POT |
| R151 | Distruttore Draconico | 5 | 3 | Conquista | 4 Danni dir. |
| R152 | Campione Scaglioso | 4 | 5 | Gloria | +2 DAN |

**Lega 5 (2)**

| # | Nome | POT | DAN | Trigger | Potere |
|---|------|-----|-----|---------|--------|
| R153 | Drago Antico | 6 | 5 | Gloria | +3 POT |
| R154 | Imperatore delle Fiamme | 5 | 6 | Conquista | +4 FC, 3 Danni dir. |

#### 🐀 RATTI DELLA MEGERA (6)

**Lega 3 (1)**

| # | Nome | POT | DAN | Trigger | Potere |
|---|------|-----|-----|---------|--------|
| R155 | Avanguardia Pestilente | 4 | 3 | Conquista | Tossina 2 (min 3) |

**Lega 4 (3)**

| # | Nome | POT | DAN | Trigger | Potere |
|---|------|-----|-----|---------|--------|
| R156 | Portatore di Morte | 5 | 4 | Conquista | Tossina 3 (min 2) |
| R157 | Assassino della Megera | 5 | 3 | Imboscata | -4 POT nem. (min 1) |
| R158 | Corruttore di Terre | 4 | 4 | Vendetta | Tossina 3 (min 3) |

**Lega 5 (2)**

| # | Nome | POT | DAN | Trigger | Potere |
|---|------|-----|-----|---------|--------|
| R159 | Flagello della Peste | 6 | 4 | Conquista | Tossina 4 (min 2) |
| R160 | Re dei Ratti | 6 | 5 | Resa dei conti | -5 POT nem. (min 1), Tossina 2 (min 3) |

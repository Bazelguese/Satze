# SATZE — Intesa e Asse

Meccaniche cross-armata. Ondata di riferimento: **"Il Nemico del Mio Nemico"**.
Sostituisce integralmente `LEGAME.md` (v1 "gate agente" e v2 "Legame/Legame Profondo").

---

## 1. Nomenclatura

| Vecchio nome | Nome definitivo | Soglia |
|---|---|---|
| Legame | **Intesa: X** | ≥1 carta di X in mano iniziale |
| Legame Profondo | **Asse: X** | ≥2 carte casa **e** ≥2 carte di X in mano iniziale |

Registro militare-diplomatico: l'*intesa* è l'accordo informale, anche tacito o segreto;
l'*asse* è il blocco vincolante. La gradazione si spiega da sola.
Collisioni verificate: "Asse" 0 occorrenze nel progetto; "intesa" solo come nome comune
(2 occorrenze); esclusi "Fronte" (identità Calibri) e "Coalizione" (entità lore Kethran).

---

## 2. Regole (testo giocatore)

> **Intesa (Nome armata)** — Questa carta ottiene il suo Bonus Armata se la tua mano
> iniziale contiene almeno 1 carta di quell'armata, invece della normale soglia di
> 2 carte della sua armata. Il risultato resta fisso per tutta la partita.

> **Asse (Nome armata)** — Questa carta ottiene il suo Bonus Armata se la tua mano
> iniziale contiene almeno 2 carte della sua armata (questa inclusa) **e** almeno
> 2 carte dell'armata indicata. Il risultato resta fisso per tutta la partita.

In entrambi i casi:

- il **potere** della carta funziona sempre, come ogni carta di SATZE — nessun potere
  del gioco è disattivabile per un'intera partita;
- il gate governa **solo il Bonus Armata di quella carta**;
- la carta conta come armata **casa** per tutti i conteggi (inclusa la propria soglia
  Asse); non conta mai come partner;
- le mani sono pubbliche (Regole: "Gli Agenti sono sempre visibili. Solo i FC sono
  segreti"), quindi lo stato di Intesa/Asse è noto a entrambi dal turno zero.

**Perché l'Asse ha la doppia soglia:** con la sola soglia "2+ partner", nel build splash
9+1 la condizione sarebbe matematicamente garantita e le statistiche piene sarebbero
gratis. La doppia soglia obbliga a impegnare entrambe le armate nel mazzo: è questo il
costo che compra la curva piena.

---

## 3. Probabilità (ipergeometrica, mano 5 da mazzo 10, condizionata alla pescata)

### Intesa (≥1 partner)

| Carte partner nel mazzo | Intesa attiva |
|---|---|
| 1 | 44,4% |
| 2 | 69,8% |
| 3 | 84,1% |
| 5 (build 5+5) | 99,2% |
| 9 (splash 9+1) | 100% |

### Asse (2+2, la carta conta se stessa come casa)

| Mazzo (casa+partner) | Asse attivo | Per partita (×50% pescata) |
|---|---|---|
| 3+7 | 72,2% | 36% |
| **4+6 (ottimo)** | **83,3%** | **42%** |
| 5+5 | 79,4% | 40% |
| 6+4 | 63,5% | 32% |
| 7+3 | 40,5% | 20% |

Il build ottimale è **4+6** (pacchetto casa sottile in guscio partner): la carta copre
da sola metà della soglia casa. FN di riferimento per il pricing: **~83%** (Asse),
**~100%** (Intesa nel contesto per cui è costruita).
Assunto: mazzi a due armate; carte di una terza armata non contano per nessuna soglia.

---

## 4. Trigger

Gate e trigger del bonus lavorano in **AND**:

1. **Intesa/Asse** — "il bonus di questa carta esiste in questa partita?" (mano iniziale, fisso)
2. **Trigger del bonus** (se presente) — "in questo duello il bonus parte?" (regole usuali)

Caso notevole — **Bonus Patto (Rinforzi)**: *Rinforzi = 2+ carte della stessa Lega in
mano*. Una carta Patto con Intesa ha quindi **doppia dipendenza dalla mano** (Intesa +
Rinforzi in AND). Con l'Impresario (L3) in un mazzo Kethran con 3 altri L3, Rinforzi è
attivo ~88% delle volte in cui lo peschi: la doppia condizione resta ampiamente giocabile,
ma va dichiarata in fase di costing.

I trigger del **potere** non interagiscono mai col gate.

---

## 5. Interazioni

- **Blocca Bonus** — blocca il bonus dell'agente avversario del duello, come da regola
  generale. Nessun caso speciale.
- **Blocca Potere** — normale: i poteri delle carte Intesa/Asse sono poteri come gli altri.
- **Copia Bonus** — copia il bonus dell'agente nemico *se attivo per lui*: contro una
  Intesa/Asse col gate non soddisfatto non trova nulla.
- **Conquista / Ultimo Desiderio / Tossina** — regole usuali, nessuna deroga.

---

## 6. Pricing

| | Intesa | Asse |
|---|---|---|
| Statline | **-1** vs comparabile più vicina | **curva piena** |
| Potere | Fascia normale della Lega | Ammessa fascia alta |
| FN bonus di riferimento | ~100% (contesto splash/5+5) | ~83% (build 4+6) |
| Ruolo | Carta di struttura | Chase / vetrina |

**Vincoli (ereditati dal roster, verificati su 201 carte):**

1. Danno diretto **sempre** dietro trigger (0 precedenti incondizionati).
2. Trigger ed effetto del potere dall'identità dell'armata **casa**.
3. Solo primitive implementate nel motore (niente Imponi fino a implementazione).
4. **Mai** corpi Asse con casa nelle armate dai bonus always-on più forti
   (Figli: -5 VA perm.; Calibri: -2 DAN perm.): payload permanente + corpo pieno
   è la ricetta del power creep.
5. Rilascio: le Asse escono **una per ondata**, mai in blocco.

---

## 7. Schema dati e motore

```js
// Intesa
{ id: 321, name: "Broker di Kyrath", army: "Corte Rossa", league: 3,
  power: 3, damage: 2, icon: "clipboard",
  intesa: "Calibri Pesanti",
  ability: { trigger: "vendetta", effect: "directDamage", value: 2 } }

// Asse
{ id: 322, name: "Sethis, l'Esattrice delle Ere", army: "Corte Rossa", league: 5,
  power: 6, damage: 5, icon: "snake",
  asse: "L'Enclave delle Scaglie",
  ability: { trigger: "opportunista", effect: "enemyPower", value: -4, minPower: 3 } }
```

La presenza del campo `intesa` o `asse` identifica il tier (mutuamente esclusivi).
Il bonus resta `ARMY_BONUSES[army]`, mai duplicato nel JSON.

```js
// A inizio partita (il gate si valuta solo per carte pescate: le altre non si giocano)
const countArmy = (hand, a) => hand.filter(c => c.army === a).length;

function bonusEligible(card, openingHand) {
  if (card.intesa) return countArmy(openingHand, card.intesa) >= 1;
  if (card.asse)   return countArmy(openingHand, card.army) >= 2
                       && countArmy(openingHand, card.asse) >= 2;
  return armyBonusActive[card.army];   // soglia standard 2+
}
// Nel duello: se bonusEligible, si applica l'eventuale trigger del bonus (AND).
```

UI: badge Intesa/Asse ✅/❌ sulla carta, visibile a entrambi dal turno zero.

---

## 8. Ondata "Il Nemico del Mio Nemico" — 8 Intesa + 3 Asse

Formato per ogni carta: **Lore** (soggetto = identità dell'armata casa; il tier dà il
contesto del contatto) + **Meccanica** (potere ancorato a una carta esistente citata;
payload = perché il bonus casa vale l'importazione nel partner).

Home coperte: 9/10. **Khemet rinviata a ondata 2**: bonus Overdrive: Immune confermato
com'è, ma renderlo portabile lo trasforma in un "all-in sicuro" generico sui FC —
si valuta coi dati del playtest dell'ondata 1.

---

### INTESA

#### 8.1 Broker di Kyrath — Corte Rossa → Intesa (Calibri Pesanti) · L3 · 3/2

```js
{ id: 321, name: "Broker di Kyrath", army: "Corte Rossa", league: 3, power: 3, damage: 2,
  icon: "clipboard", intesa: "Calibri Pesanti",
  ability: { trigger: "vendetta", effect: "directDamage", value: 2 },
  description: "Potere: Vendetta: 2 Danni dir. — Intesa (Calibri Pesanti)" }
```

**Lore.** Soggetto = Corte pura: registra ed esige. Il contratto è quello tra la Corte e
i sopravvissuti di Kyrath; l'Intesa dà il contesto — opera dove vive il debito.
*"Non forgia e non combatte: registra il contratto tra la Corte e i sopravvissuti di
Kyrath. Quando la riscossione fallisce, fa parlare l'acciaio."*
**Meccanica.** Potere ancorato a 312 (Artigiano Velithari, L4 6/3, stesso potere):
qui -1 Lega e statline 5. Payload: **Copia Bonus** nei mazzi Calibri — un'armata
difensiva guadagna l'accesso al bonus nemico, strumento che non potrà mai avere.

#### 8.2 Enkidu, il Reclamato — Kethran → Intesa (Corte Rossa) · L3 · 3/2

```js
{ id: 221, name: "Enkidu, il Reclamato", army: "Kethran", league: 3, power: 3, damage: 2,
  icon: "scroll", intesa: "Corte Rossa",
  ability: { trigger: "vendetta", effect: "power", value: 2 },
  description: "Potere: Vendetta: +2 POT — Intesa (Corte Rossa)" }
```

**Lore.** Soggetto = ricomposizione Kethran: dopo uno scontro dell'Avvicinamento si è
ricostruito coi frammenti di un Esattore abbattuto. L'Intesa dà il contesto: quei pezzi
erano sotto contratto, e ciò che è firmato resta della Corte — Enkidu non ha firmato
nulla, è stato *reclamato*. Combatte al loro fianco per saldare un debito incarnato.
**Meccanica.** Potere ancorato a 818 (Mangiamore, L3 3/3, stesso potere): statline 5.
Payload: **Rimonta +2 POT** nei mazzi Corte — l'armata della manipolazione scambia
tempo nei primi duelli e le manca il muscolo di chiusura da dietro.

#### 8.3 Il Conta-Monete — Ratti della Megera → Intesa (L'Enclave delle Scaglie) · L2 · 2/2

```js
{ id: 821, name: "Il Conta-Monete", army: "Ratti della Megera", league: 2, power: 2, damage: 2,
  icon: "coin", intesa: "L'Enclave delle Scaglie",
  ability: { trigger: "opportunista", effect: "enemyPower", value: -2, minPower: 2 },
  description: "Potere: Opportunista: -2 POT nem. (min 2) — Intesa (L'Enclave delle Scaglie)" }
```

**Lore.** Soggetto = la spia della Megera (linea di 807), infiltrata dove l'oro abbonda.
*"L'Enclave conta il tesoro ogni notte. Nessuno conta lui. Ogni moneta che le sue zampe
toccano torna al mucchio con un dono in più — e la muffa, nell'oro, è paziente quanto
la Megera."*
**Meccanica.** Debuff Opportunista già nel nucleo Ratti (817): statline 4 contro il 5
di 309. Payload: **Conquista: Tossina 2 (min 4)** nei mazzi Enclave — bonus casa e
bonus partner sono *entrambi* su Conquista: il piano di gioco Enclave (vincere spesso)
alimenta i due payload con la stessa azione. La coppia meccanicamente più elegante
dell'ondata.

#### 8.4 Il Divoratore di Domande — Mounthborn → Intesa (Figli dell'Orizzonte) · L3 · 4/2

```js
{ id: 621, name: "Il Divoratore di Domande", army: "Mounthborn", league: 3, power: 4, damage: 2,
  icon: "brain", intesa: "Figli dell'Orizzonte",
  ability: { trigger: "intervention", effect: "damage", value: 2 },
  description: "Potere: Intervento: +2 DAN — Intesa (Figli dell'Orizzonte)" }
```

**Lore.** Soggetto = la Fame che divora conoscenza (linea del Divoratore di Menti, 603).
*"Ha divorato un Leggero, e con la carne ha ingoiato la Domanda. Ora essa gli rosicchia
lo stomaco dall'interno — e l'unica risposta che la Fame conosce è mangiarne ancora."*
**Meccanica.** Potere ancorato a 605 (Il Sempre Affamato, L3 6/1, stesso potere):
statline 6. Payload: **Imboscata +1/+1** nei mazzi Figli — un'armata di puro controllo
VA guadagna un asse aggressivo di sequenza che oggi non possiede.

#### 8.5 Prototipo Simbionte S-2 — Calibri Pesanti → Intesa (Mounthborn) · L2 · 3/1

```js
{ id: 421, name: "Prototipo Simbionte S-2", army: "Calibri Pesanti", league: 2, power: 3, damage: 1,
  icon: "gear", intesa: "Mounthborn",
  ability: { trigger: "vendetta", effect: "heal", value: 2 },
  description: "Potere: Vendetta: Cura 2 — Intesa (Mounthborn)" }
```

**Lore.** Soggetto = la dottrina del Raccoglitore (414): "pezzi sono pezzi", portata
alle estreme conseguenze. *"Mandato a studiare lo sciame, tornò placcato di chitina.
I tecnici hanno smesso di chiedersi dove finisca la macchina e dove cominci l'insetto.
Chiedono solo che regga."*
**Meccanica.** Potere ancorato a 404 (Tecnico di Prima Linea, L3 5/1): -1 Lega,
statline 4. Payload: **-2 DAN nem. permanente** nei mazzi Mounthborn — l'armata del
sacrificio (selfDamage diffuso) è quella che monetizza di più la riduzione danni.

#### 8.6 L'Impresario della Fossa — Patto degli Indocili → Intesa (Kethran) · L3 · 3/3

```js
{ id: 922, name: "L'Impresario della Fossa", army: "Patto degli Indocili", league: 3, power: 3, damage: 3,
  icon: "card", intesa: "Kethran",
  ability: { trigger: "intervention", effect: "focusCoin", value: 2 },
  description: "Potere: Intervento: +2 FC — Intesa (Kethran)" }
```

**Lore.** Soggetto = Patto puro: la Fossa, il giro, la percentuale (linea di Brutus e
del Predone). L'Intesa dà il contesto: i combattenti perfetti sono i Kethran — si
ricompongono dopo ogni incontro. Nessun campione da rimpiazzare, nessun funerale da
pagare. Non è alleanza: è *business*.
**Meccanica.** Potere ancorato a 908 (Contrabbandiere di Fortuna, L3 4/3, stesso
potere): statline 6. Payload: **Rinforzi -1/-1 nem. (min 2)** nei mazzi Kethran —
scambi aggressivi che monetizzano la rasatura delle statistiche. Nota di costing:
doppia dipendenza dalla mano (Intesa + Rinforzi, §4), Rinforzi ~88% con 3 altri L3.

#### 8.7 L'Ancorato al Canto — Figli dell'Orizzonte → Intesa (Orathai) · L3 · 3/2

```js
{ id: 121, name: "L'Ancorato al Canto", army: "Figli dell'Orizzonte", league: 3, power: 3, damage: 2,
  icon: "wave", intesa: "Orathai",
  ability: { trigger: "reckoning", effect: "enemyAssault", value: -4, minAssault: 4 },
  description: "Potere: Resa dei conti: -4 VA nem. (min 4) — Intesa (Orathai)" }
```

**Lore.** Soggetto = l'ancoraggio, il gesto fondativo dei Figli (Sorethal): la materia
attutisce la Domanda. La sua àncora è un legno del bosco che canta — e il canto la
attutisce meglio di qualsiasi reliquia muta. L'Intesa dà il contesto: torna nel bosco
perché l'àncora, lontana dalle radici, lentamente tace.
**Meccanica.** Potere ancorato a 119 (Vittima della Domanda, L3 3/3, stesso potere):
statline 5. Payload: **-5 VA nem. permanente** nei mazzi Orathai — l'armata del
logoramento guadagna pressione da duello costante; payload forte, per questo su corpo
Intesa conservativo e mai su Asse (vincolo §6.4).

#### 8.8 La Radice nel Marcio — Orathai → Intesa (Ratti della Megera) · L3 · 4/2

```js
{ id: 521, name: "La Radice nel Marcio", army: "Orathai", league: 3, power: 4, damage: 2,
  icon: "sparkle", intesa: "Ratti della Megera",
  ability: { trigger: "vendetta", effect: "heal", value: 2 },
  description: "Potere: Vendetta: Cura 2 — Intesa (Ratti della Megera)" }
```

**Lore.** Soggetto = Orathai puro: il bosco ricicla, il marcio è fertile (linea del
Canto della Cenere, 513). L'Intesa dà il contesto: le fogne della Megera sono il
terreno più ricco che il bosco abbia mai assaggiato — e c'è già un ponte nel canone,
la Sciamana Corrotta (819), la donna che studiò le piante finché ne divenne una.
La radice beve dove la Megera maledice.
**Meccanica.** Potere identico a 513 (Canto della Cenere, L3 5/2): statline 6.
Payload: **Resa dei conti +2 DAN** nei mazzi Ratti — è il matrimonio più funzionale
dell'ondata dopo il Conta-Monete: i Ratti rasano il POT nemico di mestiere, cioè
*fabbricano parità*, e ogni parità fabbricata accende il bonus importato.

---

### ASSE (rilascio: una per ondata)

#### 8.9 Sethis, l'Esattrice delle Ere — Corte Rossa → Asse (L'Enclave delle Scaglie) · L5 · 6/5

```js
{ id: 322, name: "Sethis, l'Esattrice delle Ere", army: "Corte Rossa", league: 5, power: 6, damage: 5,
  icon: "snake", asse: "L'Enclave delle Scaglie",
  ability: { trigger: "opportunista", effect: "enemyPower", value: -4, minPower: 3 },
  description: "Potere: Opportunista: -4 POT nem. (min 3) — Asse (L'Enclave delle Scaglie)" }
```

**Lore.** Soggetto = la riscossione al suo apice. Ere fa un giovane drago firmò per il
suo primo tesoro; i draghi vivono a lungo, i contratti della Corte di più. Lei esige il
debito più antico del registro, e opera dentro l'Enclave perché è lì che il debito vive
e matura interessi. L'Asse è letterale: metà del mazzo è il suo distretto di riscossione.
**Meccanica.** Potere = famiglia dell'Esattore Infernale (303, L4 5/4, identico): lei è
la versione anziana, su corpo L5 pieno (statline 11; range L5: Airam 11, Patriarca 12).
Payload: **Copia Bonus** nei mazzi Enclave. Curva piena + potere di fascia alta,
pagati dalla doppia soglia (~83% nel build 4+6).

#### 8.10 Naram-Sin, l'Alveare Coronato — Kethran → Asse (Mounthborn) · L4 · 6/4

```js
{ id: 222, name: "Naram-Sin, l'Alveare Coronato", army: "Kethran", league: 4, power: 6, damage: 4,
  icon: "crown", asse: "Mounthborn",
  ability: { trigger: "vendetta", effect: "damage", value: 2 },
  description: "Potere: Vendetta: +2 DAN — Asse (Mounthborn)" }
```

**Lore.** Soggetto = ricomposizione regale (linea di Ur-Nammu): si è ricostruito con
pezzi dello sciame che non hanno mai smesso di avere fame. Non li comanda — negozia,
ogni giorno. Finora ha sempre vinto lui.
**Meccanica.** Potere = Profeta delle Rovine (202, L4 5/4, identico) con +1 statline,
pagato dall'Asse. Payload: **Rimonta +2 POT** nei mazzi Mounthborn — coi loro
selfDamage sono l'armata che gioca da dietro più spesso di tutte: il bonus importato
più vivo possibile.

#### 8.11 Il Collezionista di Debiti — L'Enclave delle Scaglie → Asse (Corte Rossa) · L4 · 6/4

```js
{ id: 721, name: "Il Collezionista di Debiti", army: "L'Enclave delle Scaglie", league: 4, power: 6, damage: 4,
  icon: "coin", asse: "Corte Rossa",
  ability: { trigger: "glory", effect: "power", value: 3 },
  description: "Potere: Gloria: +3 POT — Asse (Corte Rossa)" }
```

**Lore.** Soggetto = avidità draconica pura, portata alla sua conclusione logica: il
tesoro definitivo non è l'oro — sono i contratti della Corte. Brillano meno, fruttano
per sempre. Speculare a Sethis: le due carte sono le due sponde dello stesso affare.
**Meccanica.** Potere = Araldo della Fiamma (715, L3 3/4, identico) promosso a L4 su
corpo pieno (statline 10; range L4 Enclave: 702 8, 713 6, 717 8 — sopra, pagato
dall'Asse). Payload: **Conquista +2 FC** nei mazzi Corte — economia per l'armata che
spende di più in manipolazione.

---

## 9. Checklist nuove carte Intesa/Asse

1. **Soggetto = identità casa; il tier dà solo il contesto del contatto.**
2. **Payload prima di tutto** — il bonus casa deve valere l'importazione nel partner.
3. **Potere** ancorato a una carta esistente citata; danno diretto solo dietro trigger.
4. **Curva**: Intesa -1, Asse piena; mai Asse con casa dai bonus always-on forti.
5. **Direzione dichiarata**: splash / 5+5 (Intesa) o 4+6 (Asse).
6. **Validazione Midjourney prima del lock** di lore e statistiche definitive.

---

## 10. Riepilogo in una riga

**Intesa: X = bonus attivo con ≥1 carta di X in apertura (statline -1). Asse: X =
bonus attivo con 2+2 in apertura (curva piena, ~83% nel build 4+6). Il potere non è
mai coinvolto; tutto pubblico dal turno zero; una Asse per ondata.**

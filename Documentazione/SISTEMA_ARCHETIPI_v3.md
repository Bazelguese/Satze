# SATZE — SISTEMA ARCHETIPI

*Tassonomia carte — sostituisce integralmente `SISTEMA_TAG_AGENTI_v2.md`*  
*Versione 3.3 — Agosto 2026*  
*Derivato da `Bazelguese/Satze@main`: 330 carte, 11 Armate, 25 effetti, 19 trigger più l'assenza di trigger*

---

## 1. COSA CLASSIFICA QUESTO SISTEMA

Ogni carta riceve **due etichette obbligatorie e due flag opzionali**, tutte derivate automaticamente dai dati. Nessuna assegnazione manuale, nessun intervento del designer.

```
Archetipo [/ Archetipo secondario]  ·  Rapporto col Focus  [· Scalante]
```

Esempi reali dal pool:

- `Vega, il Sofferente` → **Campione · Vorace**
- `Chimera` → **Soffocatore / Assaltatore · Predatore**
- `Cometa alla Deriva` → **Assaltatore · Indifferente · Scalante**
- `Eco Svanente` → **Sabotatore · Indifferente**
- `Crepuscolo, l'Assassino di Soli` → **Colosso / Campione · Indifferente**

Lega, POT e DAN **non** ricevono etichette: sono già numeri stampati sulla carta. Nel deck builder diventano filtri a intervallo.

### Perché il sistema v2 è stato abbandonato

Il v2 assegnava 6 tag da categorie ortogonali. Misurato sul pool reale produceva **159 combinazioni distinte su 181 carte, con 141 carte a combinazione unica**: non una tassonomia, un identificatore. Quattro delle sei dimensioni (Corpo, Equilibrio, POT assoluta, DAN assoluta) erano funzioni deterministiche di tre numeri già visibili — informazione aggiunta pari a zero. La sesta (Ruolo) era manuale e risultava tarata su bonus armata obsoleti in 5 Armate su 8.

### Perché l'asse "Profilo operativo" è stato abbandonato

Una versione intermedia di questo documento raggruppava i 19 trigger in 10 profili temporali. Misurata, **5 profili su 10 erano 1:1 con un singolo trigger**: `Agguato`=Imboscata, `Risposta`=Intervento, `Coesione`=Rinforzi, `Furia`=Turbo, `Costante`=nessun trigger. **103 carte su 330 (31%)** portavano un badge che era un sinonimo di una parola già stampata sulla carta — esattamente il difetto contestato al v2, reintrodotto in un asse nuovo. Il rapporto di compressione lo confermava: asse Archetipo 3.1×, asse Profilo 1.9×.

Il timing **non è stato sostituito con un sinonimo migliore, è stato eliminato**. Il trigger è stampato sulla carta e filtrabile esattamente nel deck builder: non serve un secondo vocabolario per dire la stessa cosa. L'unica informazione temporale che sopravvive è il flag `Scalante`, perché non corrisponde a nessuna parola stampata ed è la variabile che ha prodotto il primo fallimento documentato di composizione (Arsenale della Nebula).

---

## 2. ASSE 1 — ARCHETIPO

> **Qual è il contributo principale di questa carta al piano di gioco?**

| Archetipo | Domanda a cui risponde | Carte | % |
|---|---|---:|---:|
| **Campione** | Come vinco questo scontro? | 94 | 28.5 |
| **Assaltatore** | Quanto male farà la mia vittoria? | 58 | 17.6 |
| **Soffocatore** | Come indebolisco l'assalto nemico? | 50 | 15.2 |
| **Sabotatore** | Come disattivo o manipolo i Poteri nemici? | 40 | 12.1 |
| **Carnefice** | Come tolgo PV oltre al DAN normale? | 36 | 10.9 |
| **Guardiano** | Come limito o recupero le perdite? | 24 | 7.3 |
| **Catalizzatore** | Come alimento le giocate successive? | 18 | 5.5 |
| **Colosso** | Quale minaccia autonoma posso schierare? | 10 | 3.0 |

### Campione — 94 carte

Vince lo scontro corrente potenziando o preservando la propria efficacia combattiva.

**Effetti:** +POT · +VA · Copia POT · Immune · Attrizione/Escalation su POT o VA

*Esempi:* L'Eco del Primo Sole (L5 5/5, Turbo: +8 VA) · Vega, il Sofferente (L5 4/5, Ultima Chance: +4 POT) · Condensato per la Guerra (L3 1/4, Attrizione 1 POT)

### Assaltatore — 58 carte

Trasforma la vittoria in una conseguenza più pesante sui PV.

**Effetti:** +DAN · +POT e DAN · Copia DAN · Attrizione/Escalation su DAN o POT e DAN

*Esempi:* Prete dell'Ancora (L4 5/2, Alleato: +3 DAN) · Il Portatore della Campana (L3 4/3, Gloria: +1 POT, +1 DAN) · Cometa alla Deriva (L3 5/1, Escalation: +1 DAN)

### Soffocatore — 50 carte

Riduce la capacità numerica dell'avversario di vincere lo scontro.

**Effetti:** -POT nem. · -VA nem. · -POT e DAN nem. · Imponi POT

*Esempi:* Sorethal, il Primo Ancorante (L5 6/4, Overdrive: -8 VA nem. (min 6)) · Portatore della Domanda (L4 4/4, Resa dei conti: -8 VA nem. (min 8)) · Vittima della Domanda (L3 3/3, Resa dei conti: -6 VA nem. (min 6))

### Sabotatore — 40 carte

Interviene sul livello delle abilità. Mai sui valori numerici.

**Effetti:** Blocca Potere · Blocca Bonus · Copia Potere · Copia Bonus · Inversione

*Esempi:* Serath, Che Mangia il Dopo (L4 5/3, Resa dei conti: Blocca Potere) · Eco Svanente (L2 3/1, Blocca Bonus) · Astronave da Guerra della Nebula (L5 6/3, Imboscata: Blocca Bonus)

### Carnefice — 36 carte

Sottrae PV senza dipendere interamente dal DAN normale dello scontro.

**Effetti:** Danni diretti · Tossina · Attrizione su danni diretti

*Esempi:* Richiamante dell'Ordine (L4 5/3, Turbo: 2 Danni dir.) · Leggero Richiamato (L2 3/1, Ultima Chance: 4 Danni dir.) · Araldo della Fine (L4 4/3, Gloria: 3 Danni dir.)

### Guardiano — 25 carte

Protegge i PV o riduce le conseguenze della sconfitta.

**Effetti:** Cura · -DAN nem. · Imponi DAN

*Esempi:* Richiamato Smantellato (L2 3/1, Imboscata: -2 DAN nem. (min 3)) · Pesante Centenario (L3 3/3, Intervento: -2 DAN nem. (min 2)) · Ultimo Testimone (L2 3/1, Ultimo desiderio: Cura 2)

### Catalizzatore — 18 carte

Genera o recupera risorse che alimentano le giocate successive.

**Effetti:** +FC

*Esempi:* Tessitrice della Trama (L4 4/3, Sopraffare: +2 FC) · Cartografo del Vuoto (L3 3/3, Opportunista: +3 FC) · Vethan, Guerriero per un Giorno (L2 3/1, Conquista: +2 FC)

### Colosso — 10 carte

Il Potere è un costo netto puro: il beneficio acquistato è il corpo della carta.

**Effetti:** -PV a te · *(eccezione)* Vor-Em (Imponi DAN): override primario su corpo

*Esempi:* Il Primo Mattone (L3 5/1, Conquista: -2 PV (a te)) · Crepuscolo, l'Assassino di Soli (L5 7/3, Conquista: -4 PV (a te)) · Vor-Em, colui che può sapere (L4 5/6, Imponi DAN)

### Regole di confine

**Sabotatore vs Soffocatore.** Il Sabotatore manipola Poteri e Bonus. Il Soffocatore manipola numeri. Nessuna eccezione: `Imponi POT` è un'assegnazione numerica (`state.ePower = state.pPower`) e appartiene al Soffocatore malgrado la parentela concettuale con Copia Potere.

**Copia vs Imponi.** Sono la stessa assegnazione con direzione invertita, verificata in `src/game/duel/duelApplyEffect.js`. La direzione determina l'archetipo:

| Effetto | Motore | Archetipo |
|---|---|---|
| Copia POT | `state.pPower = state.ePower` | Campione |
| Copia DAN | `state.pDamage = state.eDamage` | Assaltatore |
| Imponi POT | `state.ePower = state.pPower` | Soffocatore |
| Imponi DAN | `state.eDamage = state.pDamage` | Guardiano |

**Colosso.** Si applica solo quando il Potere è un costo *puro*. Se un Potere futuro contenesse insieme beneficio e costo (es. `+4 VA, -1 PV a te`), la carta si classifica sul beneficio principale e riceve `Sacrificio` come sottoproprietà d'analisi.

**Attrizione ed Escalation non hanno un archetipo proprio.** Descrivono *come cresce* un effetto, non *cosa produce*. `Attrizione 1 POT` e `+1 POT` fanno lo stesso lavoro. L'archetipo si deriva dal campo `stat`; la crescita diventa il flag `Scalante`. Tutte e 23 le carte scalanti del pool hanno `stat` esplicito: nessun caso scoperto.

**Il Bonus Armata non entra mai nella derivazione.** L'archetipo si legge esclusivamente dal Potere stampato. Una carta Khemet che riceve Immune dal bonus `Overdrive: Immune` mantiene il proprio archetipo naturale. In caso contrario Blocca Bonus cambierebbe retroattivamente l'identità della carta.

---

## 3. ARCHETIPO SECONDARIO (flag opzionale)

> **Questa carta fa un secondo lavoro che il Potere non dichiara?**

**66 carte su 330 (20%) hanno un archetipo secondario. 264 (80%) non ce l'hanno.** *(Vor-Em resta con secondario Assaltatore dopo l'override a Colosso.)*

Non è un secondo asse: è un flag sparso. La UI deve prevedere lo slot vuoto come caso normale, non come eccezione.

### Due sorgenti

**a) Effetto a doppia componente.** Il Potere produce due risultati che appartengono ad archetipi diversi.

| Effetto | Primario | Secondario | Carte |
|---|---|---|---:|
| `+X POT, +X DAN` | Assaltatore | Campione | 33 |
| `-X POT, -X DAN nem.` | Soffocatore | Guardiano | 7 |

**b) Corpo notevole in una dimensione che il Potere non copre.** Se POT o DAN supera di **2** la mediana della propria Lega in una dimensione che l'archetipo primario non rappresenta, la carta fa un secondo lavoro con le sole statistiche.

| Lega | Mediana POT | Mediana DAN | Carte |
|:-:|:-:|:-:|---:|
| 2 | 3 | 2 | 78 |
| 3 | 4 | 2 | 111 |
| 4 | 5 | 3 | 101 |
| 5 | 5.5 | 3.5 | 40 |

**Le mediane sono congelate.** Costituiscono le soglie della tassonomia v3.3 e **non vengono ricalcolate automaticamente a ogni espansione**: altrimenti aggiungere carte nuove cambierebbe l'archetipo secondario di carte vecchie che nessuno ha toccato. Si aggiornano soltanto con una nuova versione del sistema, e l'aggiornamento è un atto deliberato con diff verificabile.

*Esempio:* `Nidhogg` è L3 **2/4** con `Invasione: +3 POT`. Il Potere lo classifica Campione, ma il corpo ha DAN 4 su una mediana di 2: se vince, fa male da solo. → **Campione / Assaltatore**.

### Eccezione Colosso

Per il Colosso la soglia scende a **mediana +1**, perché il corpo *è* il beneficio acquistato: applicare la soglia ordinaria lasciava i Colossi senza secondario, proprio nella classe dove le statistiche contano di più. Con la soglia corretta tutti i Colossi ricevono un secondario coerente.

**Regola di parità:** se POT e DAN superano entrambi la soglia dello stesso margine, vince **Campione**, perché è la POT a determinare se il DAN arriva a destinazione. È il caso di `Terrore Cremisi` (L4 6/4, mediane 5/3: entrambi a +1) → **Colosso / Campione**.

| Colosso | Lega | POT/DAN | Secondario |
|---|:-:|:-:|---|
| Il Primo Mattone | 3 | 5/1 | Campione |
| Crepuscolo, l'Assassino di Soli | 5 | 7/3 | Campione |
| Prototipo Instabile | 3 | 5/3 | Campione |
| Larva Esplosiva | 2 | 4/1 | Campione |
| Il Nido Ambulante | 2 | 4/2 | Campione |
| Mala-Kor, il Campione dell'Esterno | 3 | 5/3 | Campione |
| Prigioniero Khemet | 2 | 4/2 | Campione |
| Veterano finito | 2 | 4/1 | Campione |
| Terrore Cremisi | 4 | 6/4 | Campione |
| Vor-Em, colui che può sapere | 4 | 5/6 | Assaltatore |

### Distribuzione

| Coppia | Carte |
|---|---:|
| Assaltatore / Campione | 35 |
| Campione / Assaltatore | 11 |
| Colosso / Campione | 9 |
| Soffocatore / Guardiano | 7 |
| Soffocatore / Assaltatore | 3 |
| Colosso / Assaltatore | 1 |

---

## 4. ASSE 2 — RAPPORTO COL FOCUS

> **Come reagisce questo Potere ai Focus Coin investiti, e da chi?**

Il VA si calcola moltiplicando la POT per i FC investiti. Nessuna carta dichiara questa relazione, ma cambia radicalmente cosa la carta chiede al giocatore: `+3 POT` vale +3 VA con 1 FC e **+15 VA con 5 FC**; `+8 VA` vale 8 in entrambi i casi.

La distinzione decisiva non è però soltanto *se* un Potere scala, ma **con i Focus di chi**.

| Rapporto | Significato | Effetti | Carte | % |
|---|---|---|---:|---:|
| **Vorace** | Il rendimento cresce con i FC che investi **tu**. Per esprimersi vuole essere finanziata. | +POT, +POT e DAN, Copia POT | 98 | 29.7 |
| **Predatore** | Il rendimento cresce con i FC che investe **l'avversario**. Punisce la puntata alta altrui e ti consente di puntare meno. | -POT nem., -POT e DAN nem., Imponi POT | 33 | 10.0 |
| **Indifferente** | Il rendimento non cambia in base ai FC di nessuno. | +VA, -VA nem., +DAN, Cura, -DAN nem., Danni diretti, Tossina, Immune, blocchi, copie di Potere/Bonus, Inversione, -PV a te | 181 | 54.8 |
| **Prodigo** | Genera o restituisce Focus. | +FC | 18 | 5.5 |

### Perché Vorace e Predatore non possono stare insieme

Una riduzione di 3 POT toglie 3 VA se l'avversario punta 1 FC e **15 VA se ne punta 5**. Scala, quindi — ma con i Focus di *lui*, non i tuoi. Un mazzo Soffocatore è progettato proprio per vincere con puntate contenute: classificarlo insieme ai Campioni `+POT` produrrebbe un errore diretto nell'avviso sul fabbisogno di Focus, segnalando come dispendioso il mazzo che meno lo è.

C'è una seconda differenza, che riguarda il bluff: **il rendimento di una carta Vorace lo decidi tu, quello di una Predatrice lo decide l'avversario.** Una carta Vorace ha un rendimento controllabile ma costoso; una Predatrice ha un rendimento economico ma incerto — vale molto contro chi punta alto, poco contro chi si trattiene. È una variabile del sistema di bluff, non solo dell'economia.

### Dove quest'asse porta informazione

**5 archetipi su 8 hanno un rapporto col Focus costante**: l'etichetta è prevedibile leggendo l'archetipo.

| Archetipo | Carte | L'asse aggiunge informazione? | Distribuzione |
|---|---:|---|---|
| Campione | 94 | **sì** | Vorace 65, Indifferente 29 |
| Assaltatore | 58 | **sì** | Vorace 33, Indifferente 25 |
| Soffocatore | 50 | **sì** | Predatore 33, Indifferente 17 |
| Sabotatore | 40 | no — sempre Indifferente | Indifferente 40 |
| Carnefice | 36 | no — sempre Indifferente | Indifferente 36 |
| Guardiano | 24 | no — sempre Indifferente | Indifferente 24 |
| Catalizzatore | 18 | no — sempre Prodigo | Prodigo 18 |
| Colosso | 10 | no — sempre Indifferente | Indifferente 10 |

**202 carte su 330 (61%)** ricevono dall'asse un'informazione non deducibile dall'archetipo. Le altre 128 portano un'etichetta ridondante.

Questa ridondanza **non è un difetto della scelta a 4 classi**: è stata misurata anche sulla versione a 5 classi (`Vorace / Sobrio / Obliquo / Inflessibile / Prodigo`) e il risultato è identico — 128 carte deterministiche in entrambi gli schemi. Le tre classi insensibili ai Focus si distinguevano soltanto per *tipo di effetto*, cioè lungo una dimensione già coperta dall'Archetipo. Collassarle in `Indifferente` non perde informazione: rimuove una duplicazione.

Il prezzo è che `Indifferente` copre il 54.8% del pool. È la classe più concentrata del sistema, e va accettata per quello che è: **una classe di riposo**, non una categoria descrittiva. Dice "i Focus non c'entrano", e nient'altro — il resto lo dicono l'Archetipo e il testo del Potere. 🔶

### Lettura d'Armata

| Armata | Bonus | Rapporto col Focus |
|---|---|---|
| Figli dell'Orizzonte | -5 VA nem. (min 6) | Indifferente 17, Vorace 9, Prodigo 3 |
| Kethran | Rimonta: +2 POT | Indifferente 16, Vorace 10, Predatore 3 |
| Corte Rossa | Copia Bonus nemico | Indifferente 18, Vorace 7, Predatore 5 |
| Calibri Pesanti | -2 DAN nem. (min 2) | Indifferente 17, Vorace 8, Prodigo 3 |
| Orathai | Resa dei conti: +2 DAN | Indifferente 15, Vorace 12, Prodigo 3 |
| Mounthborn | Imboscata: +1 POT, +1 DAN | Indifferente 17, Vorace 11, Predatore 2 |
| L'Enclave delle Scaglie | Conquista: +2 FC | Vorace 16, Indifferente 10, Prodigo 2 |
| Ratti della Megera | Conquista: Tossina 1 (min 10) | Indifferente 21, Predatore 7, Vorace 2 |
| Patto degli Indocili | Rinforzi: -1 POT, -1 DAN nem. (min 2) | Indifferente 17, Vorace 7, Predatore 5 |
| Khemet | Overdrive: Immune | Indifferente 15, Vorace 9, Prodigo 3 |
| Apex | Invasione: +5 VA | Indifferente 18, Vorace 7, Predatore 3 |

---

## 5. FLAG SCALANTE

> **Questa carta ha bisogno che la partita avanzi per rendere?**

**23 carte** — effetti `attrition` ed `escalation`.

Verificato in `duelApplyEffect.js`:

```
escalation → value × ctx.playerFieldsConquered     (Campi conquistati)
attrition  → value × countAttritionPriorCards()    (carte già giocate)
```

| Turno | 1 | 2 | 3 | 4 | 5 |
|---|---:|---:|---:|---:|---:|
| Moltiplicatore Attrizione | 0 | 1 | 2 | 3 | 4 |
| `Attrizione 1 POT` rende | +0 | +1 | +2 | +3 | +4 |

Al turno 1 una carta Attrizione vale **esattamente il proprio corpo**. È lì che si misura la rigidità:

| Carta | Lega | POT/DAN | Corpo vs curva | Potere |
|---|:-:|:-:|:-:|---|
| Il Soffocatore Silente | 2 | 1/1 | 2 vs 4 | Attrizione 1 POT |
| Collezionista di Spade | 4 | 2/1 | 3 vs 8 | Attrizione 1 POT, 1 DAN |
| Larva Parassita | 2 | 2/2 | 4 vs 4 | Vendetta: Attrizione 1 POT |
| Foderi Neri | 2 | 2/2 | 4 vs 4 | Imboscata: Attrizione 1 POT |

`Collezionista di Spade` è il caso estremo: Lega 4 con corpo 3 su una curva di 8. Giocata al turno 1 è una carta quasi vuota; è **strutturalmente obbligata** ai turni tardi. Due carte di questo profilo nello stesso mazzo si contendono la stessa finestra.

---

## 6. FUNZIONE DI DERIVAZIONE

```javascript
const MAP_EFFECT = {
  copyDamage: 'Assaltatore',
  damage: 'Assaltatore',
  powerAndDamage: 'Assaltatore',
  assaultValue: 'Campione',
  copyPower: 'Campione',
  immune: 'Campione',
  power: 'Campione',
  directDamage: 'Carnefice',
  toxin: 'Carnefice',
  focusCoin: 'Catalizzatore',
  selfDamage: 'Colosso',
  enemyDamage: 'Guardiano',
  heal: 'Guardiano',
  imponiDamage: 'Guardiano',
  blockAbility: 'Sabotatore',
  blockBonus: 'Sabotatore',
  copyAbility: 'Sabotatore',
  copyBonus: 'Sabotatore',
  inversion: 'Sabotatore',
  enemyAssault: 'Soffocatore',
  enemyPower: 'Soffocatore',
  enemyPowerAndDamage: 'Soffocatore',
  imponiPower: 'Soffocatore',
};

const MAP_STAT = {
  power: 'Campione',
  assaultValue: 'Campione',
  damage: 'Assaltatore',
  powerAndDamage: 'Assaltatore',
  directDamage: 'Carnefice',
};

const MAP_ECONOMY = {
  copyPower: 'Vorace',
  power: 'Vorace',
  powerAndDamage: 'Vorace',
  enemyPower: 'Predatore',
  enemyPowerAndDamage: 'Predatore',
  imponiPower: 'Predatore',
  focusCoin: 'Prodigo',
};

// mediane POT/DAN per Lega, misurate sul pool di 330 carte
const MEDIAN = { 2: [3, 2], 3: [4, 2], 4: [5, 3], 5: [5.5, 3.5] };
const SCALING = ['attrition', 'escalation'];

// chiave di derivazione: per le carte scalanti si legge `stat`, altrimenti `effect`
function derivationKey({ effect, stat }) {
  return SCALING.includes(effect) ? stat : effect;
}

export function getArchetype(card) {
  const { effect, stat } = card.ability;
  return SCALING.includes(effect) ? MAP_STAT[stat] : MAP_EFFECT[effect];
}

export function getEconomy(card) {
  // gli effetti non mappati sono insensibili ai FC
  return MAP_ECONOMY[derivationKey(card.ability)] ?? 'Indifferente';
}

export function isScaling(card) {
  return SCALING.includes(card.ability.effect);
}

export function getSecondaryArchetype(card) {
  const primary = getArchetype(card);
  const key = derivationKey(card.ability);
  const [medPow, medDam] = MEDIAN[card.league];

  // a) effetto a doppia componente
  if (key === 'powerAndDamage') return 'Campione';
  if (key === 'enemyPowerAndDamage') return 'Guardiano';

  // b) corpo notevole — soglia ridotta per il Colosso, il cui corpo E' il beneficio
  const delta = primary === 'Colosso' ? 1 : 2;
  const bigPow = card.power >= medPow + delta;
  const bigDam = card.damage >= medDam + delta;

  if (primary === 'Colosso' && bigPow && bigDam) {
    return (card.power - medPow) >= (card.damage - medDam) ? 'Campione' : 'Assaltatore';
  }
  if (bigDam && !['Assaltatore', 'Carnefice'].includes(primary)) return 'Assaltatore';
  if (bigPow && primary !== 'Campione') return 'Campione';
  return null;
}
```

---

## 7. IDENTITÀ D'ARMATA

La distribuzione degli archetipi per Armata è un'impronta identitaria e un test di design: un'Armata la cui distribuzione è piatta non ha identità meccanica.

| Armata | Classi coperte | Archetipi dominanti |
|---|---:|---|
| Figli dell'Orizzonte | 7/8 | Campione 10, Assaltatore 6, Soffocatore 4 |
| Kethran | 8/8 | Assaltatore 9, Campione 6, Soffocatore 4 |
| Corte Rossa | 6/8 | Sabotatore 9, Soffocatore 7, Campione 5 |
| Calibri Pesanti | 8/8 | Campione 10, Carnefice 6, Catalizzatore 3 |
| Orathai | 6/8 | Campione 15, Guardiano 4, Carnefice 4 |
| Mounthborn | 7/8 | Assaltatore 10, Campione 6, Carnefice 5 |
| L'Enclave delle Scaglie | 6/8 | Campione 13, Assaltatore 6, Soffocatore 4 |
| Ratti della Megera | 6/8 | Soffocatore 10, Carnefice 6, Campione 5 |
| Patto degli Indocili | 7/8 | Campione 7, Soffocatore 7, Assaltatore 5 |
| Khemet | 7/8 | Campione 10, Assaltatore 6, Colosso 2 |
| Apex | 8/8 | Campione 7, Assaltatore 7, Soffocatore 4 |

---

## 8. CATALOGO COMPLETO

*330 carte — 11 Armate — derivazione automatica, nessuna assegnazione manuale*

### Figli dell'Orizzonte

**Bonus Armata:** -5 VA nem. (min 6)

| # | Nome | L | POT/DAN | Potere | Archetipo | Focus | Scal. |
|---:|---|:-:|:-:|---|---|---|:-:|
| 101 | Sorethal, il Primo Ancorante | 5 | 6/4 | Overdrive: -8 VA nem. (min 6) | **Soffocatore** | Indifferente |  |
| 111 | L'Eco del Primo Sole | 5 | 5/5 | Turbo: +8 VA | **Campione** | Indifferente |  |
| 116 | Vega, il Sofferente | 5 | 4/5 | Ultima Chance: +4 POT | **Campione** | Vorace |  |
| 130 | Astronave da Guerra della Nebula | 5 | 6/3 | Imboscata: Blocca Bonus | **Sabotatore** | Indifferente |  |
| 102 | Tessitrice della Trama | 4 | 4/3 | Sopraffare: +2 FC | **Catalizzatore** | Prodigo |  |
| 103 | Portatore della Domanda | 4 | 4/4 | Resa dei conti: -8 VA nem. (min 8) | **Soffocatore** | Indifferente |  |
| 105 | Richiamante dell'Ordine | 4 | 5/3 | Turbo: 2 Danni dir. | **Carnefice** | Indifferente |  |
| 112 | Serath, Che Mangia il Dopo | 4 | 5/3 | Resa dei conti: Blocca Potere | **Sabotatore** | Indifferente |  |
| 117 | Prete dell'Ancora | 4 | 5/2 | Alleato: +3 DAN | **Assaltatore** | Indifferente |  |
| 126 | Collezionista di Spade | 4 | 2/1 | Attrizione 1 POT, 1 DAN | **Assaltatore** / Campione | Vorace | ● |
| 127 | Arsenale Vivente | 4 | 2/4 | Resistenza: +12 VA | **Campione** | Indifferente |  |
| 128 | Divoramenti | 4 | 4/3 | Imboscata: +2 POT | **Campione** | Vorace |  |
| 129 | O-Etemorp | 4 | 5/2 | Rimonta: +3 DAN | **Assaltatore** | Indifferente |  |
| 104 | Cartografo del Vuoto | 3 | 3/3 | Opportunista: +3 FC | **Catalizzatore** | Prodigo |  |
| 106 | Condensato per la Guerra | 3 | 1/4 | Attrizione 1 POT | **Campione** / Assaltatore | Vorace | ● |
| 113 | L'Ultimo Specchio di Oris | 3 | 1/4 | Resistenza: Copia POT nem. | **Campione** / Assaltatore | Vorace |  |
| 114 | Il Portatore della Campana | 3 | 4/3 | Gloria: +1 POT, +1 DAN | **Assaltatore** / Campione | Vorace |  |
| 118 | Cometa alla Deriva | 3 | 5/1 | Escalation: +1 DAN | **Assaltatore** | Indifferente | ● |
| 119 | Vittima della Domanda | 3 | 3/3 | Resa dei conti: -6 VA nem. (min 6) | **Soffocatore** | Indifferente |  |
| 122 | Nidhogg | 3 | 2/4 | Invasione: +3 POT | **Campione** / Assaltatore | Vorace |  |
| 123 | Pesante Centenario | 3 | 3/3 | Intervento: -2 DAN nem. (min 2) | **Guardiano** | Indifferente |  |
| 124 | Timoniere del Vuoto | 3 | 4/2 | Intervento: +5 VA | **Campione** | Indifferente |  |
| 125 | Satellite della Nebula | 3 | 5/1 | Imboscata: +2 DAN | **Assaltatore** | Indifferente |  |
| 107 | Eco Svanente | 2 | 3/1 | Blocca Bonus | **Sabotatore** | Indifferente |  |
| 108 | Leggero Richiamato | 2 | 3/1 | Ultima Chance: 4 Danni dir. | **Carnefice** | Indifferente |  |
| 109 | Naela, la Prima Sognatrice | 2 | 3/1 | Rimonta: +2 POT | **Campione** | Vorace |  |
| 110 | Ashara, la Volontaria | 2 | 2/2 | Imboscata: +2 POT | **Campione** | Vorace |  |
| 115 | Vethan, Guerriero per un Giorno | 2 | 3/1 | Conquista: +2 FC | **Catalizzatore** | Prodigo |  |
| 120 | Richiamato Smantellato | 2 | 3/1 | Imboscata: -2 DAN nem. (min 3) | **Guardiano** | Indifferente |  |
| 121 | Fine del Pensiero | 2 | 1/3 | Ultima Chance: Imponi POT | **Soffocatore** | Predatore |  |

### Kethran

**Bonus Armata:** Rimonta: +2 POT

| # | Nome | L | POT/DAN | Potere | Archetipo | Focus | Scal. |
|---:|---|:-:|:-:|---|---|---|:-:|
| 201 | Ur-Nammu il Conquistatore | 5 | 6/5 | Magnanimo: +2 POT | **Campione** | Vorace |  |
| 211 | Nimrod, il Primo Re | 5 | 5/3 | Resa dei conti: +2 POT, +2 DAN | **Assaltatore** / Campione | Vorace |  |
| 216 | Crepuscolo, l'Assassino di Soli | 5 | 7/3 | Conquista: -4 PV (a te) | **Colosso** / Campione | Indifferente |  |
| 230 | Vicario Berakol, Maestro della Ricomposizione | 5 | 4/4 | Vendetta: +2 POT, +2 DAN | **Assaltatore** / Campione | Vorace |  |
| 202 | Profeta delle Rovine | 4 | 4/3 | Vendetta: +2 DAN | **Assaltatore** | Indifferente |  |
| 203 | Araldo della Fine | 4 | 4/3 | Gloria: 3 Danni dir. | **Carnefice** | Indifferente |  |
| 212 | Spirito della Spira | 4 | 4/4 | Sopraffare: Immune | **Campione** | Indifferente |  |
| 213 | Eco del Tradimento | 4 | 2/5 | Escalation 2 POT | **Campione** / Assaltatore | Vorace | ● |
| 217 | Chimera | 4 | 2/5 | Sempre: -4 POT nem. (min 3) | **Soffocatore** / Assaltatore | Predatore |  |
| 226 | Centauro Rivoltante | 4 | 4/5 | Gloria: -2 POT nem. (min 3) | **Soffocatore** / Assaltatore | Predatore |  |
| 227 | Tagliapietre | 4 | 5/3 | Vendetta: -3 DAN nem. (min 1) | **Guardiano** | Indifferente |  |
| 228 | Verme Plotone | 4 | 5/1 | Intervento: 2 Danni dir. | **Carnefice** | Indifferente |  |
| 229 | Titano di Carne | 4 | 5/3 | Overdrive: +1 POT, +1 DAN | **Assaltatore** / Campione | Vorace |  |
| 204 | Custode della Ziqqurat | 3 | 4/2 | Blocca Bonus | **Sabotatore** | Indifferente |  |
| 205 | Sacerdote della Ricomposizione | 3 | 3/3 | Sfida: +2 POT | **Campione** | Vorace |  |
| 206 | Berserker della Spira | 3 | 4/3 | Vendetta: +1 POT, +1 DAN | **Assaltatore** / Campione | Vorace |  |
| 214 | Il Primo Mattone | 3 | 5/1 | Conquista: -2 PV (a te) | **Colosso** / Campione | Indifferente |  |
| 218 | Frammento del Conquistatore | 3 | 2/3 | Rimonta: Copia POT nem. | **Campione** | Vorace |  |
| 219 | La Marea Composita | 3 | 3/3 | Resa dei conti: +3 DAN | **Assaltatore** | Indifferente |  |
| 222 | La Luccicante | 3 | 3/2 | Ultimo desiderio: +2 FC | **Catalizzatore** | Prodigo |  |
| 223 | Angelo Ricomposto | 3 | 3/4 | Alleato: Imponi POT | **Soffocatore** / Assaltatore | Predatore |  |
| 224 | Cacciatore di Normoformi | 3 | 4/2 | Imboscata: +2 DAN | **Assaltatore** | Indifferente |  |
| 225 | Guardiano dell'Altare della Ricomposizione | 3 | 4/1 | Imboscata: Blocca Potere | **Sabotatore** | Indifferente |  |
| 207 | Seguace Fanatico | 2 | 3/1 | Gloria: +2 POT | **Campione** | Vorace |  |
| 208 | Costruttore Maledetto | 2 | 3/2 | Imboscata: Escalation 1 DAN | **Assaltatore** | Indifferente | ● |
| 209 | Ombra della Spira | 2 | 2/3 | Resistenza: -6 VA nem. (min 5) | **Soffocatore** | Indifferente |  |
| 210 | Martire della Spira | 2 | 2/2 | Ultimo desiderio: 3 Danni dir. | **Carnefice** | Indifferente |  |
| 215 | Ultimo Testimone | 2 | 3/1 | Ultimo desiderio: Cura 2 | **Guardiano** | Indifferente |  |
| 220 | Mezzanotte, il Mai Nato | 2 | 3/2 | Inversione | **Sabotatore** | Indifferente |  |
| 221 | Glauson il Secondo Architetto | 2 | 2/2 | Rimonta: +1 POT, +1 DAN | **Assaltatore** / Campione | Vorace |  |

### Corte Rossa

**Bonus Armata:** Copia Bonus nemico

| # | Nome | L | POT/DAN | Potere | Archetipo | Focus | Scal. |
|---:|---|:-:|:-:|---|---|---|:-:|
| 301 | Vaelith Sorn, il Primo | 5 | 7/3 | Conquista: 3 Danni dir. | **Carnefice** | Indifferente |  |
| 311 | Generale Karthessi | 5 | 5/4 | Resa dei conti: Copia Potere nem. | **Sabotatore** | Indifferente |  |
| 316 | Airam, la Confortatrice | 5 | 5/4 | Sempre: Inversione | **Sabotatore** | Indifferente |  |
| 330 | Alira l'Usuraia di Corone | 5 | 8/1 | Invasione: Copia DAN | **Assaltatore** / Campione | Indifferente |  |
| 302 | L'Estrattrice | 4 | 4/3 | Intervento: Copia Potere | **Sabotatore** | Indifferente |  |
| 303 | Esattore Infernale | 4 | 5/4 | Opportunista: -4 POT nem. (min 3) | **Soffocatore** | Predatore |  |
| 312 | Artigiano Velithari | 4 | 5/3 | Vendetta: 2 Danni dir. | **Carnefice** | Indifferente |  |
| 317 | Banditore di Schiavi | 4 | 6/2 | Intervento: Blocca Potere | **Sabotatore** | Indifferente |  |
| 318 | Fratello del Banditore di Schiavi | 4 | 6/2 | Resa dei conti: 2 Danni dir. | **Carnefice** | Indifferente |  |
| 326 | Sigillatore dei Vili Affari | 4 | 5/3 | Alleato: Blocca Potere | **Sabotatore** | Indifferente |  |
| 327 | Intrattenitore di Corte | 4 | 5/4 | Sopraffare: +2 POT | **Campione** | Vorace |  |
| 328 | La Clausola di Revoca | 4 | 4/4 | Intervento: -3 POT nem. (min 2) | **Soffocatore** | Predatore |  |
| 329 | Nosterafu il Contabile | 4 | 5/3 | Resa dei conti: -6 VA nem. (min 5) | **Soffocatore** | Indifferente |  |
| 304 | Tentatore d'Anime | 3 | 4/2 | Imboscata: Blocca Potere | **Sabotatore** | Indifferente |  |
| 305 | Avvocato del Diavolo | 3 | 2/4 | Imboscata: Copia POT | **Campione** / Assaltatore | Vorace |  |
| 306 | Giudice Corrotto | 3 | 4/3 | Vendetta: Blocca Bonus | **Sabotatore** | Indifferente |  |
| 313 | Dammeri Spezzato | 3 | 2/3 | Invasione: -3 POT nem. (min 2) | **Soffocatore** | Predatore |  |
| 314 | Debitore Trasformato | 3 | 4/3 | Vendetta: +1 POT, +1 DAN | **Assaltatore** / Campione | Vorace |  |
| 319 | Investigatore Demoniaco | 3 | 4/1 | Resa dei conti: Blocca Potere | **Sabotatore** | Indifferente |  |
| 322 | Il Postillatore | 3 | 3/1 | Rimonta: -10 VA nem. (min 8) | **Soffocatore** | Indifferente |  |
| 323 | Phimesto | 3 | 4/2 | Alleato: Blocca Bonus | **Sabotatore** | Indifferente |  |
| 324 | Litilis la Mutevole | 3 | 5/1 | Intervento: Copia DAN | **Assaltatore** | Indifferente |  |
| 325 | Gemelli Samsara | 3 | 4/3 | Gloria: -2 POT nem. (min 2) | **Soffocatore** | Predatore |  |
| 307 | Archivista degli Obblighi | 2 | 2/2 | Intervento: -2 DAN nem. (min 2) | **Guardiano** | Indifferente |  |
| 308 | Messaggero Burlone | 2 | 2/3 | Imboscata: +2 POT | **Campione** | Vorace |  |
| 309 | Ombra del Creditore | 2 | 3/2 | Imboscata: -2 POT nem. (min 2) | **Soffocatore** | Predatore |  |
| 310 | Anima Dannata | 2 | 3/1 | Sfida: +1 POT, +1 DAN | **Assaltatore** / Campione | Vorace |  |
| 315 | Larva della Corte | 2 | 1/3 | Intervento: +2 POT | **Campione** | Vorace |  |
| 320 | Messaggero Nefasto | 2 | 3/1 | Intervento: 2 Danni dir. | **Carnefice** | Indifferente |  |
| 321 | Raccogli Firme | 2 | 3/1 | Alleato: +2 POT | **Campione** | Vorace |  |

### Calibri Pesanti

**Bonus Armata:** -2 DAN nem. (min 2)

| # | Nome | L | POT/DAN | Potere | Archetipo | Focus | Scal. |
|---:|---|:-:|:-:|---|---|---|:-:|
| 401 | Titano Corazzato MK-IV | 5 | 5/6 | Resa dei conti: Immune | **Campione** / Assaltatore | Indifferente |  |
| 411 | Protocollo Cenere | 5 | 4/4 | Sopraffare: 4 Danni dir. | **Carnefice** | Indifferente |  |
| 416 | Il Chirurgo | 5 | 7/2 | Rimonta: Cura 3 | **Guardiano** | Indifferente |  |
| 430 | Obice Campione | 5 | 4/6 | Overdrive: Escalation +10 VA | **Campione** / Assaltatore | Indifferente | ● |
| 402 | Nucleo di Comando Nord | 4 | 5/3 | Overdrive: +2 POT | **Campione** | Vorace |  |
| 403 | Bastione Ambulante | 4 | 4/4 | Overdrive: +3 FC | **Catalizzatore** | Prodigo |  |
| 412 | Pugno del Fronte Ovest | 4 | 6/2 | Magnanimo: +1 POT, +1 DAN | **Assaltatore** / Campione | Vorace |  |
| 413 | Cannone Semovente | 4 | 5/3 | Overdrive: 3 Danni dir. | **Carnefice** | Indifferente |  |
| 417 | Santo Motore | 4 | 5/4 | Alleato: +8 VA | **Campione** | Indifferente |  |
| 426 | Spargifuoco | 4 | 4/3 | Resistenza: -12 VA nem. (min 8) | **Soffocatore** | Indifferente |  |
| 427 | K-13.4 | 4 | 5/2 | Resa dei conti: -1 POT, -1 DAN nem. (min 3) | **Soffocatore** / Guardiano | Predatore |  |
| 428 | Bombardiere Ali Argentee | 4 | 4/4 | Resistenza: Escalation 2 POT | **Campione** | Vorace | ● |
| 429 | Divora-bossoli | 4 | 5/2 | Resistenza: Attrizione 1 Danni dir. | **Carnefice** | Indifferente | ● |
| 404 | Tecnico di Prima Linea | 3 | 4/1 | Vendetta: Cura 2 | **Guardiano** | Indifferente |  |
| 405 | Guardiano di Settore | 3 | 4/2 | Sfida: Blocca Potere | **Sabotatore** | Indifferente |  |
| 406 | Analista da Combattimento | 3 | 2/3 | Attrizione 1 POT | **Campione** | Vorace | ● |
| 414 | Raccoglitore del Campo | 3 | 4/3 | Gloria: +2 FC | **Catalizzatore** | Prodigo |  |
| 415 | Protocollo di Emergenza | 3 | 4/1 | Resistenza: +1 POT, +1 DAN | **Assaltatore** / Campione | Vorace |  |
| 418 | Morto che Vola | 3 | 3/3 | Ultimo desiderio: 2 Danni dir. | **Carnefice** | Indifferente |  |
| 422 | Guardia del Centralino | 3 | 4/2 | Invasione: 2 Danni dir. | **Carnefice** | Indifferente |  |
| 423 | Prototipo Instabile | 3 | 5/3 | Ultimo desiderio: -4 PV (a te) | **Colosso** / Campione | Indifferente |  |
| 424 | Protocollo Silenzio | 3 | 4/3 | Vendetta: -2 POT nem. (min 2) | **Soffocatore** | Predatore |  |
| 425 | Punitore di Settore | 3 | 4/2 | Invasione: Blocca Bonus | **Sabotatore** | Indifferente |  |
| 407 | Drone Cacciatore X-9 | 2 | 3/1 | Imboscata: 2 Danni dir. | **Carnefice** | Indifferente |  |
| 408 | Operaio Meccanico | 2 | 2/2 | Alleato: -2 DAN nem. (min 2) | **Guardiano** | Indifferente |  |
| 409 | Occhio del Fronte Est | 2 | 2/1 | Vendetta: +2 POT | **Campione** | Vorace |  |
| 410 | Orecchio del Fronte Sud | 2 | 3/2 | Ultimo desiderio: +2 FC | **Catalizzatore** | Prodigo |  |
| 419 | K-9.1 | 2 | 3/2 | Ultima Chance: +3 POT | **Campione** | Vorace |  |
| 420 | Sistema Balistico Poco Accurato | 2 | 2/2 | Overdrive: +3 POT | **Campione** | Vorace |  |
| 421 | Trenobomba | 2 | 3/1 | Turbo: +6 VA | **Campione** | Indifferente |  |

### Orathai

**Bonus Armata:** Resa dei conti: +2 DAN

| # | Nome | L | POT/DAN | Potere | Archetipo | Focus | Scal. |
|---:|---|:-:|:-:|---|---|---|:-:|
| 501 | Voce della Fine | 5 | 5/4 | Gloria: +2 POT | **Campione** | Vorace |  |
| 511 | La Tempesta Cava | 5 | 6/2 | Overdrive: +12 VA | **Campione** | Indifferente |  |
| 516 | Il Coro | 5 | 5/3 | Vendetta: Cura 3 | **Guardiano** | Indifferente |  |
| 530 | Il Dio Cadavere | 5 | 4/4 | Attrizione 1 POT | **Campione** | Vorace | ● |
| 502 | Radice dei Caduti | 4 | 5/3 | Resistenza: +2 FC | **Catalizzatore** | Prodigo |  |
| 503 | L'Eco Vivente | 4 | 6/2 | Magnanimo: +2 DAN | **Assaltatore** | Indifferente |  |
| 512 | Il Parassita Armonico | 4 | 3/4 | Intervento: Copia POT nem. | **Campione** | Vorace |  |
| 517 | La Radice del Rancore | 4 | 5/3 | Resa dei conti: 2 Danni dir. | **Carnefice** | Indifferente |  |
| 518 | Il Custode del Silenzio | 4 | 5/2 | Magnanimo: Blocca Bonus | **Sabotatore** | Indifferente |  |
| 526 | Regalità Baritonale | 4 | 4/3 | Alleato: +3 POT | **Campione** | Vorace |  |
| 527 | Beatitudine | 4 | 6/1 | Imboscata: -2 DAN nem. (min 1) | **Guardiano** | Indifferente |  |
| 528 | Ritualista del Fuoco | 4 | 5/2 | Vendetta: +2 POT | **Campione** | Vorace |  |
| 529 | Il Custode del Rumore | 4 | 4/4 | Turbo: +2 POT | **Campione** | Vorace |  |
| 504 | La Spina nel Bosco | 3 | 4/3 | Alleato: Blocca Bonus | **Sabotatore** | Indifferente |  |
| 505 | L'Albero della Linfa d'Oro | 3 | 4/1 | Conquista: +3 FC | **Catalizzatore** | Prodigo |  |
| 506 | Il Cacciatore Paziente | 3 | 5/1 | Imboscata: +2 POT | **Campione** | Vorace |  |
| 513 | Il Canto della Cenere | 3 | 4/1 | Vendetta: Cura 2 | **Guardiano** | Indifferente |  |
| 514 | L'Albero dei Trofei | 3 | 3/3 | Invasione: +2 POT | **Campione** | Vorace |  |
| 519 | L'Occhio del Bosco | 3 | 4/2 | Imboscata: +2 DAN | **Assaltatore** | Indifferente |  |
| 522 | Protettore degli Animali | 3 | 4/2 | Alleato: +7 VA | **Campione** | Indifferente |  |
| 523 | Bombarda-latrati | 3 | 4/1 | Intervento: 2 Danni dir. | **Carnefice** | Indifferente |  |
| 524 | Sylwajuck l'Estremo | 3 | 3/4 | Magnanimo: +3 POT | **Campione** / Assaltatore | Vorace |  |
| 525 | Protettore dei Protettori | 3 | 5/1 | Resistenza: Immune | **Campione** | Indifferente |  |
| 507 | Il Germoglio Ostinato | 2 | 3/1 | Sfida: Tossina 1 (min 18) | **Carnefice** | Indifferente |  |
| 508 | Il Muschio Curativo | 2 | 3/1 | Resistenza: Cura 2 | **Guardiano** | Indifferente |  |
| 509 | Il Seme Finale | 2 | 3/1 | Ultimo desiderio: +2 FC | **Catalizzatore** | Prodigo |  |
| 510 | La Guida del Bosco | 2 | 2/1 | Gloria: +3 POT | **Campione** | Vorace |  |
| 515 | Il Fiore della Vittoria | 2 | 1/3 | Magnanimo: +3 POT | **Campione** | Vorace |  |
| 520 | Il Soffocatore Silente | 2 | 1/1 | Attrizione 1 POT | **Campione** | Vorace | ● |
| 521 | Orathai Vorace | 2 | 2/2 | Alleato: 3 Danni dir. | **Carnefice** | Indifferente |  |

### Mounthborn

**Bonus Armata:** Imboscata: +1 POT, +1 DAN

| # | Nome | L | POT/DAN | Potere | Archetipo | Focus | Scal. |
|---:|---|:-:|:-:|---|---|---|:-:|
| 601 | Regina della Colonia | 5 | 6/4 | Resa dei conti: Immune | **Campione** | Indifferente |  |
| 611 | L'Evoluzione Finale | 5 | 6/3 | Turbo: +1 POT, +1 DAN | **Assaltatore** / Campione | Vorace |  |
| 616 | Guardia Reale della Guglia | 5 | 5/4 | Intervento: -4 POT nem. (min 3) | **Soffocatore** | Predatore |  |
| 630 | Insetto della Guerra | 5 | 5/3 | Rimonta: +2 POT, +2 DAN | **Assaltatore** / Campione | Vorace |  |
| 602 | Bruto Corazzato | 4 | 4/3 | Vendetta: Escalation 1 DAN | **Assaltatore** | Indifferente | ● |
| 603 | Divoratore di Menti | 4 | 3/4 | Intervento: Copia POT | **Campione** | Vorace |  |
| 612 | Vedova Viola | 4 | 5/2 | Intervento: -3 POT nem. (min 3) | **Soffocatore** | Predatore |  |
| 617 | Scolopendra Ossea | 4 | 5/1 | Rimonta: +1 POT, +1 DAN | **Assaltatore** / Campione | Vorace |  |
| 618 | Il Flagello Chitinoso | 4 | 4/3 | Imboscata: +6 VA | **Campione** | Indifferente |  |
| 626 | Famelica Bastarda | 4 | 4/4 | Resa dei conti: +1 POT, +1 DAN | **Assaltatore** / Campione | Vorace |  |
| 627 | Principe Formica | 4 | 5/3 | Magnanimo: Blocca Potere | **Sabotatore** | Indifferente |  |
| 628 | Mangia Incendi | 4 | 5/3 | Sopraffare: +2 DAN | **Assaltatore** | Indifferente |  |
| 629 | Dominatrice dei Cieli | 4 | 4/3 | Overdrive: 3 Danni dir. | **Carnefice** | Indifferente |  |
| 604 | L'Apripista | 3 | 4/2 | Imboscata: +1 POT, +1 DAN | **Assaltatore** / Campione | Vorace |  |
| 605 | Il Sempre Affamato | 3 | 6/1 | Intervento: +2 DAN | **Assaltatore** / Campione | Indifferente |  |
| 606 | Il Seminatore di Rovina | 3 | 4/1 | Conquista: 2 Danni dir. | **Carnefice** | Indifferente |  |
| 613 | Il Corno Vendicativo | 3 | 3/3 | Rimonta: +2 POT | **Campione** | Vorace |  |
| 614 | L'Interrutore | 3 | 4/2 | Intervento: Blocca Potere | **Sabotatore** | Indifferente |  |
| 619 | Il Bombardiere della Colonia | 3 | 4/2 | Vendetta: 2 Danni dir. | **Carnefice** | Indifferente |  |
| 622 | Moscouter | 3 | 4/2 | Alleato: -6 VA nem. (min 8) | **Soffocatore** | Indifferente |  |
| 623 | Parassita Suicida | 3 | 3/2 | Imboscata: 2 Danni dir. | **Carnefice** | Indifferente |  |
| 624 | Maledizione Insettiforme | 3 | 4/2 | Invasione: -8 VA nem. (min 10) | **Soffocatore** | Indifferente |  |
| 625 | Matriarca Gentile | 3 | 4/3 | Gloria: Cura 2 | **Guardiano** | Indifferente |  |
| 607 | Larva Esplosiva | 2 | 4/1 | Imboscata: -2 PV (a te) | **Colosso** / Campione | Indifferente |  |
| 608 | Larva Parassita | 2 | 2/2 | Vendetta: Attrizione 1 POT | **Campione** | Vorace | ● |
| 609 | Il Nido Ambulante | 2 | 4/2 | Ultimo desiderio: -3 PV (a te) | **Colosso** / Campione | Indifferente |  |
| 610 | L'Ago Nascosto | 2 | 1/2 | Imboscata: +2 POT | **Campione** | Vorace |  |
| 615 | Zanzara Furiosa | 2 | 3/2 | Sfida: 2 Danni dir. | **Carnefice** | Indifferente |  |
| 620 | Mangiaossa | 2 | 3/1 | Invasione: +1 POT, +1 DAN | **Assaltatore** / Campione | Vorace |  |
| 621 | Ape Ignobile | 2 | 3/1 | Alleato: +1 POT, +1 DAN | **Assaltatore** / Campione | Vorace |  |

### L'Enclave delle Scaglie

**Bonus Armata:** Conquista: +2 FC

| # | Nome | L | POT/DAN | Potere | Archetipo | Focus | Scal. |
|---:|---|:-:|:-:|---|---|---|:-:|
| 701 | Patriarca dell'Enclave | 5 | 7/3 | Invasione: +1 POT, +1 DAN | **Assaltatore** / Campione | Vorace |  |
| 711 | Drago Antico Addormentato | 5 | 6/4 | Rimonta: Immune | **Campione** | Indifferente |  |
| 716 | Tiranno del Sottosuolo | 5 | 6/3 | Sopraffare: Blocca Potere | **Sabotatore** | Indifferente |  |
| 730 | Imperatore Purpureo | 5 | 5/4 | Resistenza: -3 POT nem. (min 4) | **Soffocatore** | Predatore |  |
| 702 | Custode del Tesoro | 4 | 4/3 | Imboscata: Escalation 1 POT, 1 DAN | **Assaltatore** / Campione | Vorace | ● |
| 703 | Cavaliere del Wyrm | 4 | 5/2 | Turbo: +1 POT, +1 DAN | **Assaltatore** / Campione | Vorace |  |
| 712 | Piromante della Corte | 4 | 6/1 | Conquista: 3 Danni dir. | **Carnefice** | Indifferente |  |
| 713 | Divoratore d'Oro | 4 | 3/3 | Overdrive: +2 POT, +2 DAN | **Assaltatore** / Campione | Vorace |  |
| 717 | Dracoltoio | 4 | 3/4 | Gloria: +12 VA | **Campione** | Indifferente |  |
| 726 | Giallotuono | 4 | 5/4 | Sfida: +3 POT | **Campione** | Vorace |  |
| 727 | Crystallimux | 4 | 4/2 | Intervento: Copia Bonus | **Sabotatore** | Indifferente |  |
| 728 | Generalissimo | 4 | 5/3 | Alleato: -8 VA nem. (min 5) | **Soffocatore** | Indifferente |  |
| 729 | Prossimo all'Ascensione | 4 | 4/2 | Resa dei conti: +2 POT, +2 DAN | **Assaltatore** / Campione | Vorace |  |
| 704 | Guardiano della Tana | 3 | 4/3 | Resistenza: Blocca Potere | **Sabotatore** | Indifferente |  |
| 705 | Predatore Alato | 3 | 4/2 | Imboscata: +2 POT | **Campione** | Vorace |  |
| 714 | Incantatore di Scaglie | 3 | 3/3 | Invasione: +2 FC | **Catalizzatore** | Prodigo |  |
| 715 | Araldo della Fiamma | 3 | 2/3 | Gloria: +3 POT | **Campione** | Vorace |  |
| 718 | Nobili Viola | 3 | 3/2 | Gloria: -3 POT nem. (min 3) | **Soffocatore** | Predatore |  |
| 719 | Coboldo Irrequieto | 3 | 4/1 | Conquista: 3 Danni dir. | **Carnefice** | Indifferente |  |
| 722 | Praticante dell'Ascensione | 3 | 3/3 | Magnanimo: +6 VA | **Campione** | Indifferente |  |
| 723 | Fanatico di Gioielli | 3 | 3/1 | Gloria: Attrizione 1 POT | **Campione** | Vorace | ● |
| 724 | Macellai da Campo | 3 | 4/1 | Intervento: -5 VA nem. (min 9) | **Soffocatore** | Indifferente |  |
| 725 | Rossofiamma | 3 | 3/2 | Sfida: +3 POT | **Campione** | Vorace |  |
| 706 | Draghetto Famelico | 2 | 3/1 | Overdrive: +2 POT | **Campione** | Vorace |  |
| 707 | Scaglia Errante | 2 | 2/2 | Vendetta: +2 POT | **Campione** | Vorace |  |
| 708 | Servo del Tesoro | 2 | 3/2 | Ultimo desiderio: +2 FC | **Catalizzatore** | Prodigo |  |
| 709 | Sputafuoco Giovane | 2 | 3/1 | Resa dei conti: +1 POT, +1 DAN | **Assaltatore** / Campione | Vorace |  |
| 710 | Uovo di Drago | 2 | 1/4 | Ultima Chance: +3 POT | **Campione** / Assaltatore | Vorace |  |
| 720 | Foderi Neri | 2 | 2/2 | Imboscata: Attrizione 1 POT | **Campione** | Vorace | ● |
| 721 | Re Carbone | 2 | 2/1 | Sfida: +3 POT | **Campione** | Vorace |  |

### Ratti della Megera

**Bonus Armata:** Conquista: Tossina 1 (min 10)

| # | Nome | L | POT/DAN | Potere | Archetipo | Focus | Scal. |
|---:|---|:-:|:-:|---|---|---|:-:|
| 801 | La Megera Eterna | 5 | 5/3 | Blocca Potere | **Sabotatore** | Indifferente |  |
| 811 | Flagello della Colonia | 5 | 4/3 | Resa dei conti: -4 POT nem. (min 2) | **Soffocatore** | Predatore |  |
| 816 | L'Orfano | 5 | 7/1 | Intervento: Copia Bonus | **Sabotatore** | Indifferente |  |
| 830 | Il Quarto Marito | 5 | 6/3 | Magnanimo: Attrizione 1 DAN | **Assaltatore** | Indifferente | ● |
| 802 | Dott. Rancido | 4 | 5/2 | Intervento: -10 VA nem. (min 4) | **Soffocatore** | Indifferente |  |
| 803 | Strega del Crepuscolo | 4 | 4/3 | Gloria: -3 POT nem. (min 2) | **Soffocatore** | Predatore |  |
| 812 | Sciamano dei Miasmi | 4 | 5/3 | Imboscata: -3 DAN nem. (min 1) | **Guardiano** | Indifferente |  |
| 813 | Ser Rathreus | 4 | 5/2 | Rimonta: +3 POT | **Campione** | Vorace |  |
| 817 | Aborto che Cammina | 4 | 6/2 | Opportunista: -2 POT nem. (min 3) | **Soffocatore** | Predatore |  |
| 826 | Principessa di Birgherund | 4 | 4/1 | Alleato: -4 POT nem. (min 1) | **Soffocatore** | Predatore |  |
| 827 | Cane da Guardia Reale | 4 | 5/2 | Resistenza: Blocca Bonus | **Sabotatore** | Indifferente |  |
| 828 | Suora della Campa Fetida | 4 | 5/3 | Ultimo desiderio: Cura 3 | **Guardiano** | Indifferente |  |
| 829 | Carrozziere Fantasma | 4 | 6/2 | Invasione: +6 VA | **Campione** | Indifferente |  |
| 804 | Untore Silenzioso | 3 | 4/2 | Opportunista: Tossina 1 (min 10) | **Carnefice** | Indifferente |  |
| 805 | Grillo Parlante | 3 | 4/1 | Intervento: -3 POT nem. (min 2) | **Soffocatore** | Predatore |  |
| 814 | Divoratore di Speranza | 3 | 5/1 | Ultimo desiderio: Tossina 1 (min 10) | **Carnefice** | Indifferente |  |
| 815 | Il Gondoliere | 3 | 4/2 | Intervento: Blocca Bonus | **Sabotatore** | Indifferente |  |
| 818 | Mangiamore | 3 | 3/3 | Vendetta: +2 POT | **Campione** | Vorace |  |
| 819 | Lettrice di Radici | 3 | 3/3 | Ultima Chance: -13 VA nem. (min 5) | **Soffocatore** | Indifferente |  |
| 822 | Prete delle Malelabbra | 3 | 4/3 | Alleato: Tossina 1 (min 15) | **Carnefice** | Indifferente |  |
| 823 | Principe non più così Azzurro | 3 | 4/3 | Invasione: -2 DAN nem. (min 1) | **Guardiano** | Indifferente |  |
| 824 | Camelo di T | 3 | 3/2 | Sfida: +10 VA | **Campione** | Indifferente |  |
| 825 | Maledizione Vivente: Ira | 3 | 4/2 | Rimonta: -1 POT, -1 DAN nem. (min 3) | **Soffocatore** / Guardiano | Predatore |  |
| 806 | L'Innumerevole | 2 | 3/1 | Ultima Chance: Tossina 1 (min 10) | **Carnefice** | Indifferente |  |
| 807 | Spia della Megera | 2 | 3/1 | Imboscata: -6 VA nem. (min 5) | **Soffocatore** | Indifferente |  |
| 808 | Rigattiere Ossuto | 2 | 3/2 | Ultimo desiderio: 2 Danni dir. | **Carnefice** | Indifferente |  |
| 809 | Omuncolo | 2 | 2/2 | Resa dei conti: -2 POT nem. (min 1) | **Soffocatore** | Predatore |  |
| 810 | Ratto Moribondo | 2 | 3/2 | Opportunista: 2 Danni dir. | **Carnefice** | Indifferente |  |
| 820 | Yata, lo Scalpo Alato | 2 | 3/1 | Turbo: +7 VA | **Campione** | Indifferente |  |
| 821 | Bardo Sedotto | 2 | 3/1 | Gloria: -2 DAN nem. (min 1) | **Guardiano** | Indifferente |  |

### Patto degli Indocili

**Bonus Armata:** Rinforzi: -1 POT, -1 DAN nem. (min 2)

| # | Nome | L | POT/DAN | Potere | Archetipo | Focus | Scal. |
|---:|---|:-:|:-:|---|---|---|:-:|
| 901 | Brutus, Campione della Fossa | 4 | 5/3 | Sopraffare: +1 POT, +1 DAN | **Assaltatore** / Campione | Vorace |  |
| 902 | Elysium, L'Immortale | 4 | 4/2 | Overdrive: Cura 3 | **Guardiano** | Indifferente |  |
| 903 | KMD-30 | 4 | 4/4 | Turbo: +9 VA | **Campione** | Indifferente |  |
| 904 | Mr. Cavalca Via | 4 | 6/1 | Ultimo desiderio: 3 Danni dir. | **Carnefice** | Indifferente |  |
| 905 | Napoleone VII | 4 | 5/4 | Sfida: Blocca Potere | **Sabotatore** | Indifferente |  |
| 906 | Magnum l'Intrepido | 4 | 4/3 | Intervento: -2 POT nem. (min 4) | **Soffocatore** | Predatore |  |
| 907 | G.G.B. | 4 | 5/3 | Imboscata: -5 VA nem. (min 6) | **Soffocatore** | Indifferente |  |
| 927 | Bosozu, l'incendia-asfalto | 4 | 4/3 | Alleato: 3 Danni dir. | **Carnefice** | Indifferente |  |
| 928 | Il Multatore del Grande Semaforo | 4 | 6/2 | Opportunista: Blocca Potere | **Sabotatore** | Indifferente |  |
| 929 | King | 4 | 5/4 | Resistenza: -2 DAN nem. (min 2) | **Guardiano** | Indifferente |  |
| 930 | Dottor. Strada, CEO della Strade Enterprises | 4 | 4/4 | Rimonta: -2 POT, -2 DAN nem. (min 3) | **Soffocatore** / Guardiano | Predatore |  |
| 908 | Contrabbandiere di Fortuna | 3 | 4/3 | Intervento: +2 FC | **Catalizzatore** | Prodigo |  |
| 909 | Giustiziere Errante | 3 | 5/1 | Vendetta: +2 DAN | **Assaltatore** | Indifferente |  |
| 910 | Cyber May Punk | 3 | 4/1 | Attrizione 1 DAN | **Assaltatore** | Indifferente | ● |
| 911 | Vandalo dell'Ultrastrada | 3 | 4/2 | Sfida: -1 POT, -1 DAN nem. (min 2) | **Soffocatore** / Guardiano | Predatore |  |
| 912 | Repressore | 3 | 3/3 | Resistenza: +2 POT | **Campione** | Vorace |  |
| 913 | Wraith dei Tunnel | 3 | 4/2 | Turbo: +6 VA | **Campione** | Indifferente |  |
| 914 | Il Controllore | 3 | 2/3 | Imboscata: -12 VA nem. (min 10) | **Soffocatore** | Indifferente |  |
| 923 | Artista dell'Ultrastrada | 3 | 3/2 | Alleato: Copia Potere | **Sabotatore** | Indifferente |  |
| 924 | Vigile del Grande Semaforo | 3 | 4/2 | Opportunista: 4 Danni dir. | **Carnefice** | Indifferente |  |
| 925 | Ultramezzo da Guerriglia | 3 | 3/2 | Overdrive: Attrizione 1 POT | **Campione** | Vorace | ● |
| 926 | Mulo | 3 | 4/2 | Turbo: Blocca Bonus | **Sabotatore** | Indifferente |  |
| 915 | Predone della Fossa | 2 | 3/1 | Turbo: +1 POT, +1 DAN | **Assaltatore** / Campione | Vorace |  |
| 916 | Regolatore di Debiti | 2 | 2/1 | Ultima Chance: +9 VA | **Campione** | Indifferente |  |
| 917 | Piromane dell'Ultrastrada | 2 | 3/1 | Escalation 1 POT, 1 DAN | **Assaltatore** / Campione | Vorace | ● |
| 918 | Picchiatore di Infami | 2 | 2/3 | Rimonta: +2 POT | **Campione** | Vorace |  |
| 919 | Milizia del Grande Semaforo | 2 | 2/2 | Opportunista: +3 POT | **Campione** | Vorace |  |
| 920 | John, l'Idraulico | 2 | 3/1 | Intervento: Blocca Bonus | **Sabotatore** | Indifferente |  |
| 921 | Lisa, la Promessa di Ferro | 2 | 3/2 | Sfida: Imponi POT | **Soffocatore** | Predatore |  |
| 922 | Schiavisti della Fossa | 2 | 2/2 | Invasione: -1 POT, -1 DAN nem. (min 3) | **Soffocatore** / Guardiano | Predatore |  |

### Khemet

**Bonus Armata:** Overdrive: Immune

| # | Nome | L | POT/DAN | Potere | Archetipo | Focus | Scal. |
|---:|---|:-:|:-:|---|---|---|:-:|
| 1001 | Xer-Thael, Architetto dell'anima | 5 | 5/3 | Overdrive: +2 POT, +2 DAN | **Assaltatore** / Campione | Vorace |  |
| 1002 | Zor-Amun, Naufrago dell'irrazionale | 5 | 7/2 | Resistenza: Imponi DAN | **Guardiano** | Indifferente |  |
| 1003 | Maq-Reth, Padrone delle calamità | 5 | 5/4 | Resistenza: +3 FC | **Catalizzatore** | Prodigo |  |
| 1030 | Ashigotte, il primo maestro | 5 | 6/3 | Overdrive: Blocca Potere | **Sabotatore** | Indifferente |  |
| 1004 | Vel-Khar, il sigillatore | 4 | 5/2 | Turbo: Blocca Potere | **Sabotatore** | Indifferente |  |
| 1005 | Seth-Amon, il fattucchiere | 4 | 4/4 | Vendetta: +2 POT | **Campione** | Vorace |  |
| 1006 | Vor-Em, colui che può sapere | 4 | 5/6 | Imponi DAN | **Colosso** / Assaltatore | Indifferente |  |
| 1007 | Iskaar-Taal, Capo delle forze di contenimento | 4 | 4/5 | Sfida: +12 VA | **Campione** / Assaltatore | Indifferente |  |
| 1008 | Myrkrun-Khal, Arconte della non-morte | 4 | 6/1 | Intervento: Copia DAN | **Assaltatore** | Indifferente |  |
| 1026 | Aesimojof, arconte del clima | 4 | 6/1 | Resa dei conti: Imponi DAN | **Guardiano** | Indifferente |  |
| 1027 | Jahma-Ferezev, astrologo dell'orrore | 4 | 6/1 | Resa dei conti: Attrizione 1 DAN | **Assaltatore** | Indifferente | ● |
| 1028 | Gar'Zet-Zal, Comandante dei Magus | 4 | 4/3 | Imboscata: Attrizione 1 POT | **Campione** | Vorace | ● |
| 1029 | Maju-Label'la, magister del controllo | 4 | 5/3 | Sopraffare: -2 POT nem. (min 2) | **Soffocatore** | Predatore |  |
| 1009 | Kah-Sef, Maestro runico | 3 | 4/2 | Rimonta: +2 FC | **Catalizzatore** | Prodigo |  |
| 1010 | Neb-Ra, il guardabisso | 3 | 4/2 | Intervento: -2 POT nem. (min 2) | **Soffocatore** | Predatore |  |
| 1011 | Ifret-Anhur, signora dei felini del caos | 3 | 4/3 | Rimonta: +3 DAN | **Assaltatore** | Indifferente |  |
| 1012 | Saqir-Mor, l'assorbi anima | 3 | 2/4 | Overdrive: Copia POT | **Campione** / Assaltatore | Vorace |  |
| 1013 | Mala-Kor, il Campione dell'Esterno | 3 | 5/3 | Conquista: -4 PV (a te) | **Colosso** / Campione | Indifferente |  |
| 1014 | Iseth-Vor, signore dei canidi dell'ordine | 3 | 3/3 | Magnanimo: +3 POT | **Campione** | Vorace |  |
| 1022 | Bazif-shu'r, scriba delle formule minori di contenimento | 3 | 4/2 | Gloria: Blocca Bonus | **Sabotatore** | Indifferente |  |
| 1023 | Hekwa-sew, lo scultore osseo | 3 | 4/2 | Invasione: +1 POT, +1 DAN | **Assaltatore** / Campione | Vorace |  |
| 1024 | Nejiro-sa'er, la bestia magica | 3 | 4/3 | Imboscata: +6 VA | **Campione** | Indifferente |  |
| 1025 | Cerjekarauhul, collaudatore del tempo | 3 | 3/2 | Ultima Chance: +12 VA | **Campione** | Indifferente |  |
| 1015 | Akh-Sefer, l'Inverno nero | 2 | 3/2 | Turbo: +2 POT | **Campione** | Vorace |  |
| 1016 | Kaal-Enf, impronta della Luna | 2 | 2/2 | Rimonta: Imponi POT | **Soffocatore** | Predatore |  |
| 1017 | Qeb-Aru, Il Magister | 2 | 3/1 | Imboscata: +1 POT, +1 DAN | **Assaltatore** / Campione | Vorace |  |
| 1018 | Prigioniero Khemet | 2 | 4/2 | Conquista: -5 PV (a te) | **Colosso** / Campione | Indifferente |  |
| 1019 | Suiel-Herac, la smantellatrice | 2 | 3/1 | Sfida: +6 VA | **Campione** | Indifferente |  |
| 1020 | Ekon-Det, emissario delle piume | 2 | 2/2 | Intervento: +2 POT | **Campione** | Vorace |  |
| 1021 | Alaz-Kahem, l'alchimista del sangue | 2 | 3/1 | Magnanimo: +2 FC | **Catalizzatore** | Prodigo |  |

### Apex

**Bonus Armata:** Invasione: +5 VA

| # | Nome | L | POT/DAN | Potere | Archetipo | Focus | Scal. |
|---:|---|:-:|:-:|---|---|---|:-:|
| 1127 | Domatore dei taglia-gole | 5 | 6/3 | Vendetta: +3 DAN | **Assaltatore** | Indifferente |  |
| 1128 | Bravo, il merita-nome | 5 | 6/4 | Opportunista: +3 FC | **Catalizzatore** | Prodigo |  |
| 1129 | Primarca del gelo | 5 | 3/5 | Imboscata: -3 POT, -3 DAN nem. (min 3) | **Soffocatore** / Guardiano | Predatore |  |
| 1130 | Volontà del Sole Verde | 5 | 7/5 | Gloria: Blocca Bonus | **Sabotatore** | Indifferente |  |
| 1118 | Capocaccia | 4 | 5/3 | Gloria: +2 POT | **Campione** | Vorace |  |
| 1119 | Scagliabraci | 4 | 3/4 | Imboscata: +9 VA | **Campione** | Indifferente |  |
| 1120 | Domafuoco | 4 | 5/2 | Ultima Chance: -2 POT, -2 DAN nem. (min 3) | **Soffocatore** / Guardiano | Predatore |  |
| 1121 | Pioggia notturna | 4 | 6/2 | Alleato: Blocca Bonus | **Sabotatore** | Indifferente |  |
| 1122 | Terrore Cremisi | 4 | 6/4 | Conquista: -5 PV (a te) | **Colosso** / Campione | Indifferente |  |
| 1123 | Dissuasore di turisti | 4 | 4/4 | Invasione: Blocca Potere | **Sabotatore** | Indifferente |  |
| 1124 | Senzariposo | 4 | 4/3 | Resistenza: -3 POT nem. (min 3) | **Soffocatore** | Predatore |  |
| 1125 | Campione dell'Ora Verde | 4 | 5/2 | Conquista: Cura 4 | **Guardiano** | Indifferente |  |
| 1126 | Picchiagranchi | 4 | 6/1 | Sopraffare: 3 Danni dir. | **Carnefice** | Indifferente |  |
| 1108 | Capobranco per un Giorno | 3 | 4/2 | Gloria: +2 POT | **Campione** | Vorace |  |
| 1109 | Scorticatore delle Spoglie | 3 | 3/3 | Vendetta: +2 DAN | **Assaltatore** | Indifferente |  |
| 1110 | Chiamavalanghe | 3 | 4/2 | Alleato: +6 VA | **Campione** | Indifferente |  |
| 1111 | Svuotanidi | 3 | 4/2 | Turbo: -6 VA nem. (min 6) | **Soffocatore** | Indifferente |  |
| 1112 | Leggiossa | 3 | 3/3 | Imboscata: Copia Bonus | **Sabotatore** | Indifferente |  |
| 1113 | Strappazanne | 3 | 5/1 | Sopraffare: +2 DAN | **Assaltatore** | Indifferente |  |
| 1114 | Cavalca-belve | 3 | 4/1 | Overdrive: +2 POT, +2 DAN | **Assaltatore** / Campione | Vorace |  |
| 1115 | Veterano della tana | 3 | 3/3 | Rimonta: +3 POT | **Campione** | Vorace |  |
| 1116 | Rompilame | 3 | 4/2 | Vendetta: -3 DAN nem. (min 1) | **Guardiano** | Indifferente |  |
| 1117 | Cavalca-fauci novizio | 3 | 4/1 | Attrizione 1 DAN | **Assaltatore** | Indifferente | ● |
| 1101 | Sentinella della tundra | 2 | 3/1 | Turbo: +5 VA | **Campione** | Indifferente |  |
| 1102 | Restauratore di trofei | 2 | 2/2 | Imboscata: +2 POT | **Campione** | Vorace |  |
| 1103 | Veterano finito | 2 | 4/1 | Conquista: -3 PV (a te) | **Colosso** / Campione | Indifferente |  |
| 1104 | Cacciatore ubriaco | 2 | 2/3 | Opportunista: +2 FC | **Catalizzatore** | Prodigo |  |
| 1105 | Cavalca-tagliagole | 2 | 3/2 | Resistenza: +1 POT, +1 DAN | **Assaltatore** / Campione | Vorace |  |
| 1106 | Zanna Corta, l'abile lanciere | 2 | 3/2 | Sfida: +1 POT, +1 DAN | **Assaltatore** / Campione | Vorace |  |
| 1107 | Delinquenti pianta-trappole | 2 | 2/3 | Alleato: -2 DAN nem. (min 1) | **Guardiano** | Indifferente |  |

---

## 9. NOTE DI IMPLEMENTAZIONE

### Modello dati vs carta visibile

Sono due cose diverse e vanno tenute separate.

**Nei dati, ogni carta ha sempre quattro campi.** Il sistema resta completo, filtrabile e utilizzabile dall'analizzatore di mazzi:

```
archetipo            obbligatorio
rapportoFocus        obbligatorio
archetipoSecondario  opzionale (null nell'80% dei casi)
scalante             booleano
```

**Sulla carta, il Rapporto col Focus si mostra solo dove varia.**

```
Archetipo [/ Secondario] [· Focus, solo se rilevante] [· Scalante]
```

| Archetipo | Badge Focus | Motivo |
|---|---|---|
| Campione | **mostrato** | varia: Vorace o Indifferente |
| Assaltatore | **mostrato** | varia: Vorace o Indifferente |
| Soffocatore | **mostrato** | varia: Predatore o Indifferente |
| Sabotatore | nascosto | sempre Indifferente |
| Carnefice | nascosto | sempre Indifferente |
| Guardiano | nascosto | sempre Indifferente |
| Colosso | nascosto | sempre Indifferente |
| Catalizzatore | nascosto | sempre Prodigo — ripeterebbe la definizione dell'archetipo |

**202 carte mostrano il badge, 128 no.** Scrivere *Sabotatore · Indifferente* non insegna nulla; *Catalizzatore · Prodigo* ripete quasi la definizione dell'archetipo. Il dato resta nei filtri e nel tooltip.

La lettura non uniforme non è un difetto purché l'interfaccia comunichi che i badge oltre al primo sono **proprietà notevoli**, non campi obbligatori da riempire. La formula onesta è: **un'identità obbligatoria e fino a tre qualificatori.**

### Gerarchia visiva

Quattro badge testuali di pari peso riprodurrebbero il difetto del vecchio sistema. La gerarchia consigliata:

| Livello | Elemento | Resa |
|---:|---|---|
| 1 | Archetipo | badge principale, nome completo |
| 2 | Secondario | nome minore dopo una barra |
| 3 | Rapporto col Focus | icona con tooltip, solo sulle classi variabili |
| 4 | Scalante | icona distinta |

Esempi di resa:

| Carta | Sulla carta |
|---|---|
| `Vega, il Sofferente` | CAMPIONE · Vorace |
| `L'Eco del Primo Sole` | CAMPIONE · Indifferente |
| `Chimera` | SOFFOCATORE / Assaltatore · Predatore |
| `Eco Svanente` | SABOTATORE |
| `Vethan, Guerriero per un Giorno` | CATALIZZATORE |
| `Cometa alla Deriva` | ASSALTATORE · Indifferente · Scalante |

**Nessun badge per Lega, POT e DAN**: sono già numeri stampati. **Nessun badge per il trigger**: è già scritto nel Potere.

### Attenzione: `Indifferente · Scalante`

**8 carte** mostrerebbero i due badge insieme — `Cometa alla Deriva`, `Bruto Corazzato`, `Cyber May Punk`, `Obice Campione` e altre. Le due parole sono entrambe corrette ma si riferiscono ad assi diversi: `Indifferente` significa *non cresce con i Focus*, `Scalante` significa *cresce con i turni*. Un giocatore che legge "indifferente" accanto a "scalante" può ragionevolmente pensare a una contraddizione. 🔶

Se la coppia risulta confusa nei test, la soluzione non è cambiare la tassonomia ma la resa: rendere il badge Focus un'icona muta con tooltip (livello 3 della gerarchia) elimina il conflitto visivo tra due parole senza toccare i dati.

**Deck builder.** Filtri per Archetipo (8), Rapporto col Focus (4), Scalante (booleano), più intervalli su Lega, POT e DAN — uno slider `POT ≥ 5` è più leggibile di un'etichetta `POT Alta`, perché non richiede di ricordare dove cade la soglia. Il trigger resta filtrabile separatamente con i suoi 18 valori esatti.

**Avvisi di composizione.** Nessuno di questi è un rapporto universale: **dipendono dal piano di vittoria**, e le soglie appartengono al documento successivo (*Anatomia di un esercito SATZE*).

- **Congestione delle finestre tardive.** `Scalante` è una delle cause, insieme ai trigger `Resa dei conti` e `Ultima Chance`. Il controllo pesa quante carte competono per il quarto e quinto turno e quante restano accettabili se giocate prima.
- **Pressione sui PV insufficiente rispetto al piano dichiarato.** Non "assenza di Carnefice": il Carnefice è *un* modo di arrivare all'Annientamento, non un requisito. Il calcolo considera insieme Carnefici, Assaltatori, DAN naturale, affidabilità nel vincere gli scontri, Tossina e Bonus Armata.
- **Squilibrio funzionale rispetto al piano.** Conquista: troppi Assaltatori e pochi strumenti per vincere gli scontri. Annientamento: molti Campioni ma pressione PV insufficiente. Supremazia: poca capacità di proteggere o creare un vantaggio di PV.
- **Domanda attesa di Focus superiore alle risorse disponibili.** Nuovo, abilitato dall'asse Rapporto col Focus. Non è la formula automatica "maggioranza Vorace senza Prodigo": `+1 POT` e `+4 POT` sono entrambi Voraci ma hanno fabbisogni diversi. Il calcolo deve considerare quante Voraci entrano nella mano da 5, quante richiedono davvero 4-5 FC e quante sono già valide con 2-3, il numero e l'affidabilità dei Prodighi, il Bonus Armata, e la presenza di carte Predatrici o Indifferenti giocabili con puntate basse.
- **Dipendenza da uno stato che il mazzo non sa procurarsi.** Troppe carte che richiedono di essere in vantaggio senza strumenti per ottenere la prima vittoria; troppe che richiedono svantaggio in un mazzo che tende a stare avanti; troppa `Alleato`/`Rinforzi` con concentrazione di Lega insufficiente.

---

## 10. COSTANTI MISURATE

*Verificate su `REGOLE_Rework.md` e `triggerLogic.js`. Servono a fissare soglie non arbitrarie in* Anatomia di un esercito SATZE.

**Il mazzo è 10 carte, ma la mano è 5.** Metà del mazzo non entra in partita. Ogni soglia va calcolata sulla mano attesa, non sul mazzo.

**L'ordine di gioco non è casuale.** Al turno 1 va primo chi ha la Lega totale più bassa tra le 5 carte in mano (parità: casuale); poi l'ordine si inverte a ogni turno. `Imboscata` e `Intervento` non sono quindi stati "non garantiti": sono **parzialmente pilotabili dalla Lega del mazzo**. Un mazzo a Lega bassa tende a essere primo ai turni 1-3-5, uno a Lega alta ai turni 2-4. È una leva di costruzione, non una moneta.

**`Alleato` e `Rinforzi` hanno probabilità calcolabili esattamente** (mano 5 su mazzo 10). Alleato richiede 1 altra carta della stessa Lega; Rinforzi ne richiede 2 (usato dal Bonus del Patto degli Indocili, lettura per-carta).

| k (stessa Lega nel mazzo) | P(Alleato) | P(Rinforzi) |
|---:|---:|---:|
| 2 | 44.4% | 0.0% |
| 3 | 72.2% | 16.7% |
| 4 | 88.1% | 40.5% |
| 5 | 96.0% | 64.3% |
| 6 | 99.2% | 83.3% |
| 7 | ~100% | 95.2% |

Vedi `RINFORZI_E_ALLEATO.md` per la riprezzatura del Bonus Patto e le linee guida di design.

**Congestione tardiva nel pool:** 23 carte `Scalante` più 29 con trigger `Resa dei conti`/`Ultima Chance` — **52 carte distinte su 330 (15.8%)** competono per i turni finali.

---

## 11. QUESTIONI APERTE

**Vor-Em, colui che può sapere** (Khemet, L4, 5/6, Imponi DAN, nessun trigger). Classificato **Colosso / Assaltatore** per override (corpo come contributo principale; `imponiDamage` resterebbe Guardiano). Meccanicamente Imponi DAN con DAN 6 **alza il DAN nemico nel 99% dei matchup**. Fix concordato sul bilanciamento: mantenere l'effetto e abbassare il DAN, valore da definire. Fino ad allora, fuori dai mazzi precostruiti. 🔶

**Campione al 28.5%.** È la classe più concentrata del sistema. Non si divide ora — la funzione primaria è unica. L'asse Economia ne cattura già la frattura interna senza spaccare l'archetipo: le carte `Campione · Vorace` (+POT, Copia POT) e `Campione · Indifferente` (+VA, Immune) hanno curve di rendimento opposte pur svolgendo lo stesso lavoro. Se un giorno la divisione servisse davvero, è lungo questa linea che va fatta — non su Immune. 🔶

**Immune.** 5 carte come Potere individuale, ma è anche il Bonus Armata di Khemet. Se in futuro si diffondesse come Potere stampato, la fusione con Campione andrebbe riconsiderata. 🔶

**`Indifferente` al 54.8%.** È una classe di riposo, non una categoria descrittiva. Una versione precedente la spaccava in `Sobrio` / `Obliquo` / `Inflessibile`, ma quelle tre si distinguevano per tipo di effetto — dimensione già coperta dall'Archetipo — e la misura ha confermato ridondanza identica (128 carte deterministiche in entrambi gli schemi). Se un giorno dovesse essere riaperta, serve un criterio economico vero, non una ri-descrizione dell'effetto. 🔶

**L'etichetta Rapporto col Focus è ridondante per 128 carte** (Sabotatore, Carnefice, Guardiano, Colosso → sempre Indifferente; Catalizzatore → sempre Prodigo). Opzione da valutare in fase di UI: mostrare il badge **solo dove varia** — Campione, Assaltatore, Soffocatore — trattandolo come flag opzionale al pari del secondario e di Scalante. Renderebbe il sistema *un archetipo obbligatorio più tre flag*, che è la descrizione onesta di ciò che è. Costo: lettura non uniforme fra carte. 🔶

**Localizzazione inglese.** 12 nomi da tradurre (8 archetipi + 4 rapporti col Focus), ma vanno decisi **insieme ai 18 nomi dei trigger**, come glossario unico. Tradurre separatamente Vendetta, Rimonta, Resistenza e Sfida rischia di produrre termini inglesi semanticamente sovrapposti. L'inglese deve preservare le distinzioni meccaniche, non essere soltanto evocativo. 🔶

---

*Sistema Archetipi — SATZE — Versione 3.3 — 330 carte verificate su `Bazelguese/Satze@main`*
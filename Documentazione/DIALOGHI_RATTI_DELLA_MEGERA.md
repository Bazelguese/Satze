# Dialoghi — Ratti della Megera (20/20)

*Voce, lore e frasi carta per carta, stile Magic/Hearthstone: implica, non spiegare.*
*Timing allineato a `DUELLO_FASI_SCHEMA_COMPLETO.md` (luglio 2026).*
*In coda: changelog di propagazione (rinomine, fix trigger, cambi stat) da applicare al repo.*

---

## Bussola dell'armata (canon emerso in questa sessione)

- **"Ratti" è metaforico** — le creature non sono ratti letterali: spaziano da umani corrotti (cavalieri, profumieri, ballerini) a mostri. Vale per nomi e art.
- **Registro: fiaba luminosa corrotta dal Marchio.** Regni, cavalieri, cortei — *sporcati*. Non horror diretto: il dolce che marcisce.
- **Amore malato = amore inseparabile dall'odio.** La Megera chiude su *"il mio odio vivrà oltre me"*; L'Orfano è *"figlio dell'odio della Megera"*. Le due facce della stessa corruzione.
- **"I figli della Megera"** — sotto-famiglia deliberata sullo stesso bisogno materno, differenziata per immagine: **L'Orfano** (attesa) · **Omuncolo** (volo) · **Aborto che Cammina** (freddo/ritorno).
- **Densità dialogo per scontro:** ~2–3 battute corte. Entrata all'ingresso (attesa avversario); poi UNA in `duelPhase 1` con priorità `constatazione > trigger` (solo trigger preVa); l'esito suona sempre in `duelPhase 5`, e se lì converge un trigger postVa la riga è una sola (variante ramificata). Silenzio mentre scegli i FC (bluff).
- **Markup:** `*parola*` = effetto firma (glitch, per i Ratti) · `*FRASE!*` = tutta animata · `{fx:parola}` = override.

---

## Timing (agganciato a `DUELLO_FASI_SCHEMA_COMPLETO.md`)

Le battute vivono nella **timeline UI** (`duelPhase 0–6`), non nel motore:

| Evento | `duelPhase` | Note |
|---|---|---|
| entrata | 0 · Schieramento | pre-reveal |
| constatazione · trigger preVa | 1 · Poteri e bonus | priorità `constatazione > trigger` |
| trigger FC-dipendente (Opportunista) | **≥ 2** | le monete FC compaiono solo in phase 2: prima non si può citarne l'esistenza |
| trigger postVa (Ultimo Desiderio) · vince/perde | 5 · Risultato | riga unica: variante `esito + trigger` |

**Carte con timing speciale in questa armata:**
- **804, 810, 817** (Opportunista) → riga trigger da `duelPhase ≥ 2`.
- **808, 814** (Ultimo Desiderio, postVa) → il trigger *è* la perdita: niente riga trigger autonoma a metà scontro, la battuta si fonde con `perde` (vedi schede).
- **816** (Copia Bonus) → la riga parte in phase 1, **ma** se il bonus copiato è postVa (Enclave delle Scaglie, Ratti della Megera → Conquista) la copia risolve in R10: in quel caso la riga slitta in phase 5.
- **Bonus armata Ratti = Conquista (postVa):** eventuali future battute legate al bonus vanno in phase 5, mai in phase 1.

---

## Le 20 carte

### 801 · La Megera Eterna — L5 · 6/4 · Blocca Potere (Sempre)
**Lore:** *"Non lancia maledizioni. È la maledizione." — Ultimo appunto di uno studioso scomparso*
- Entrata: *"Sono il sale della terra."*
- Constatazione 1 (nemico Ratti della Megera): *"COME OSI VOLTARMI LE SPALLE!"*
- Constatazione 2 (nemico senza stack di Tossina): *"Sarò la tua prima volta."*
- Blocca Potere: *"Pensavi di essere speciale, eh?"* — *phase 1, primissima riga possibile (il block risolve in R3, prima dei poteri)*
- Vince: *"Come sempre, per sempre."*
- Perde: *"Il mio odio vivrà oltre me."*
- *Priorità: Ratti + senza Tossina → vince la Constatazione 1.*

### 802 · Dott. Rancido — L4 · 5/2 · Intervento: −10 VA nem. (min 4)   ← *era Portatore di Peste*
**Lore:** *"È il male che segue l'uomo o viceversa? Il dottore cerca ancora la sua risposta, paziente dopo paziente."*
- Entrata: *"So cosa ti farebbe bene..."*
- Constatazione (POT nem. > 5): *"Tutta quella forza sarà vana."*
- Vince: *"Esperimento fallito, cavia morta."*
- Perde: *"Sono stato abbandonato, sia dall'amore che dalla scienza."*

### 803 · Strega del Crepuscolo — L4 · 4/3 · Gloria: −3 POT nem. (min 2)
**Lore:** *"Aspetta che il sole tramonti. Aspetta che tu sia sicuro di vincere. Poi sussurra, e tutto cambia."*
- Entrata: *"Fa' pure. Goditi il tuo momento."*
- Constatazione (nemico Khemet): *"La vostra magia... voglio saperne di più."* — *riga dormiente finché Khemet non è nel gioco*
- Trigger (Gloria): *"Pensavi che la notte avrebbe portato consiglio?"*
- Vince: *"Lei ha sussurrato al mio orecchio, non al tuo."*
- Perde: *"Il sole sorge ancora. Per ora."*

### 804 · Untore Silenzioso — L3 · 4/2 · Opportunista: Tossina 1 (min 10)
**Lore:** *"Portava il sorriso ovunque danzasse, le folle lo amavano, il suo nome era rinomato; abbandonò la fama in favore di un bacio altrimenti impossibile. Non si è mai pentito, perché non ha mai parlato."*
- Entrata · Constatazione · Vince · Perde: *"..."* (muto)
- Trigger (Opportunista/Tossina, `duelPhase ≥ 2`): *"Smetterai di parlare anche tu."* — *unica riga in cui parla*

### 805 · Grillo Parlante — L3 · 4/1 · Intervento: −3 POT nem. (min 2)   ← *era Ratto delle Ombre*
**Lore:** *"Dal momento in cui incroci il suo sguardo, sarà per sempre nella tua vita. Non importa cosa accada, cosa tu stia facendo: lui ti raggiungerà. Nei sogni, negli incubi, per strada."*
- Entrata: *"Pss..."*
- Constatazione (POT nem. ≤ 2): *"Che spreco."*
- Trigger (Intervento): *"Hai mai smesso di credere nel libero arbitrio?"*
- Vince: *"Ci rivediamo ancora."*
- Perde: *"Sogni d'oro, ci vedremo lì."*

### 806 · L'Innumerevole — L2 · 3/1 · Ultima Chance: Tossina 1 (min 10)   ← *era Ratto Infetto*
**Lore:** *"Uno non è niente. Dieci non sono niente. Ma non sono mai uno, e non sono mai dieci."*
- Entrata: *"..."*
- Trigger (Ultima Chance): *"...sono rimasto solo io..."*
- Vince + trigger: *"...E ORA SARÀ TUTTA PER ME!"*
- Vince senza trigger: *"...n-non me lo aspettavo."*
- Perde + trigger: *"...dovevo stare zitto."*
- Perde senza trigger: *"..."*

### 807 · Spia della Megera — L2 · 4/1 · Imboscata: −6 VA nem. (min 5)
**Lore:** *"Tanti sono gli occhi quanto la paranoia della sua creatrice."*
- Entrata: *"Cosa fai?"*
- Constatazione (nemico buffato a POT/DAN): *"Pensi di essere furbo?"*
- Trigger (Imboscata): *"Sorpresa."*
- Vince: *"Spero abbia goduto nel vederti fallire."*
- Perde: *"N-no! Non g-guardare!"*

### 808 · Rigattiere Ossuto — L2 · 3/2 · Ultimo Desiderio: 2 Danni dir.   ← *era Portatore di Ossa*
**Lore:** *"Gli ha chiesto di costruire un ponte per lei, e lui iniziò con il legno. Quando finì il legno usò la pietra. Quando finì la pietra usò i cadaveri dei suoi cari. Quando finì i cadaveri, coprì tutto con la sua stessa pelle. Quando finì la pelle, lo riempì d'ossa — ma le ossa non sono mai finite."*
- Entrata: *"Puoi darmi un metacarpo?"*
- Constatazione (nemico L5): *"S-se non vuoi fa lo stesso."*
- Vince: *"Il ponte è cedevole ultimamente."*
- Perde + trigger (Ultimo Desiderio, `duelPhase 5`): *"Te ne pentirai!"*
- Perde (potere bloccato — unico caso senza trigger): *"I-il suo ponte... ha bisogno di m-me."*

### 809 · Omuncolo — L2 · **2/2** · Resa dei conti: −2 POT nem. (min 1)   ← *era Larva Strisciante* ⚙️
**Lore:** *"Sua madre è morta prima che potesse vederlo strisciare, e spera che un giorno possa volare fino a lei."*
- Entrata: *"Guardami strisciare."*
- Constatazione (POT nem. alta): *"Non ti serve tutta questa forza."*
- Trigger (Resa dei conti): *"Cresco. Tu no."*
- Vince: *"Devo ancora crescere."*
- Perde: *"Non so ancora... volare."*

### 810 · Ratto Moribondo — L2 · 3/2 · Opportunista: 2 Danni dir.   ⚠️ *nome/concetto disallineati*
**Lore:** *"Vive della paura degli altri: più si agitano, più si impegnano, più i suoi denti affondano. Non sopporta che la sua bella venga disturbata."*
- Entrata: *"Shh, sta dormendo."*
- Trigger (Opportunista, `duelPhase ≥ 2`): *"HO DETTO SILENZIOOOOOO"*
- Vince: *"Muori silenziosamente."*
- Perde: *"NON LA SVEGLIARE"*
- *Constatazione lasciata vuota (opzionale: "Fai troppo rumore." vs nemico aggressivo).*

### 811 · Flagello della Colonia — L5 · 6/4 · Resa dei conti: −4 POT nem. (min 2)
**Lore:** *"Dopo di lui, restano gusci. In piedi, ancora caldi. Una creatura del genere non può nascere dall'odio di un singolo."*
- Entrata: *"Cosa resta, quando ho preso tutto?"* / *"Dove l'avete nascosta?"*
- Constatazione (POT nem. > 3, dopo Fase 3): *"Resisti… sarà più divertente."*
- Trigger (Resa dei conti): *"Fame…"*
- Vince: *"Meglio di una cena a Candleburg."*
- Perde: *"Tornerò e farà più male."* / *"La colonia non conta i suoi ratti."*

### 812 · Sciamano dei Miasmi — L4 · 5/3 · Imboscata: −3 DAN nem. (min 1)
**Lore:** *"Era un profumiere, poi la Megera lo baciò e il suo naso non fu più lo stesso."*
- Entrata: *"Inspira a pieni polmoni l'odore dell'amore."*
- Constatazione (nemico DAN alto): *"Minaccioso..."*
- Trigger (Imboscata): *"...ti ho già riempito i polmoni."*
- Vince: *"Nessuna vittoria è tale senza di lei..."*
- Perde: *"I miei fiori... i miei funghi... i miei ricordi..."*

### 813 · Ser Rathreus — L4 · 5/2 · **Rimonta: +3 POT**   ← *era Ratto Gigante* ⚙️
**Lore:** *«Tradì il suo re per lei. Ora uccide chiunque non sia lei.» — cronaca di Birgherund*
- Entrata: *"La mia spada ha sempre sete."*
- Constatazione (POT nem. ≥ 5): *"Un altro trofeo in arrivo."*
- Trigger (Rimonta): *"Più affondo, più mi rialzo. Per lei."*
- Vince: *"Un altro sacco di carne."*
- Perde: *"..."*

### 814 · Divoratore di Speranza — L3 · 5/1 · Ultimo Desiderio: Tossina 1 (min 10)
**Lore:** *"Puoi ucciderlo. Tutti possono ucciderlo. Ma il veleno nel suo ultimo respiro ti seguirà per sempre."*
- Entrata: *"Uccidimi. Ti prego."*
- Constatazione (POT nem. alta): *"Tanta speranza da divorare."*
- Vince: *"Non dovevo vincere io. Che imbarazzo."*
- Perde + trigger (Ultimo Desiderio, `duelPhase 5`): *"Ecco... il mio ultimo respiro. Tienilo."* / *"Mi hai ucciso. Ora sei tu a portarmi."*
- Perde (potere bloccato): ⚠️ **slot aperto** — entrambe le righe esistenti promettono la Tossina, che nel caso bloccato non parte; serve una variante o si accetta l'incoerenza (caso raro).

### 815 · Il Gondoliere — L3 · 4/2 · Intervento: Blocca Bonus   ← *era Custode della Fogna*
**Lore:** *"Fu re di Aldmere, poi gondoliere. La corona non la depose mai: un re resta re, anche laggiù. Smise per primo di veder la luce del sole, un'altra bellezza competeva per quel posto. Portò ogni suo collega sott'acqua finché non rimase più nessuno che potesse fare la sua stessa scoperta."*
- Entrata: *"Solo una moneta, dai."*
- Trigger (Intervento/Blocca Bonus): *"Quello lascialo lì."*
- Vince: *"Non sarai solo, non temere."*
- Perde: *"No, non puoi vederla!"*

### 816 · L'Orfano — L5 · 7/1 · Intervento: Copia Bonus
**Lore:** *"È la solitudine a creare il mostro o è il mostro a creare solitudine? Diecimila lacrime non bastano per scoprire la risposta, ma basta un suo urlo per scacciar via ogni domanda."*
- Entrata: *"Sei tu la mamma?"* / *"Giochiamo?"*
- Constatazione (nemico Ratti della Megera): *"Anche tu aspetti la mamma?"*
- Copia Bonus: *"Anch'io voglio essere così. Come te."* — *phase 1; se il bonus copiato è postVa (Enclave, Ratti → Conquista) la copia risolve in R10 e la riga slitta in phase 5*
- Vince: *"Adesso mi vuoi bene?"*
- Perde: *"...non te ne andare."* / *"Mamma?"*

### 817 · Aborto che Cammina — L4 · 6/2 · Opportunista: −2 POT nem. (min 3)   ❓ *nome aperto*
**Lore:** *"Cerca un caldo che non ha mai conosciuto. Lo cerca dentro di te."*
- Entrata: *"Ho freddo. Da sempre."*
- Constatazione (POT nem. ≥ 5): *"Tu sei caldo, dentro?"*
- Trigger (Opportunista, `duelPhase ≥ 2`): *"Reagite tutti nella stessa maniera."*
- Vince + trigger: *"Mmmmh... tiepido."*
- Vince senza trigger: *"Ancora freddo. Perché?"*
- Perde: *"Torno... dov'ero prima."*

### 818 · Mangiamore — L3 · 3/3 · **Vendetta: +2 POT**   ⚙️ *(fix trigger key)*
**Lore:** *"Ti riconosce. È questo il problema."*
- Entrata: *"...tu... non sei come loro..."*
- Trigger (Vendetta): *"PERCHÉ È SUCCESSO?"*
- Vince: *"...infatti non hai il loro sapore."*
- Vince + trigger: *"IL DOLORE NON È ABBASTANZA."*
- Perde: *"...infatti non ho vinto."*

### 819 · Lettrice di Radici — L3 · 3/3 · Ultima Chance: −13 VA nem. (min 5)   ← *era Sciamana Corrotta*
**Lore:** *"Ebbe fede nella natura, ma non sapeva distinguere ciò che risiedeva sotto terra per protezione da chi vi risiedeva per esilio."*
- Entrata: *"Muori, e ciba il terreno."*
- Trigger (Ultima Chance): *"Assisti al miracolo delle radici."*
- Vince: *"La terra reclama il suo pasto..."*
- Perde: *"Torno... alla terra..."*

### 820 · Yata, lo Scalpo Alato — L2 · 3/1 · Turbo: +5 VA (T1–T2)
**Lore:** *"Spiava le belle donne del paese, nascosto nei giunchi degli specchi d'acqua dove si lavavano. La sua curiosità divenne un'ossessione che lo deformò fino a fargli spiccare il volo: la punizione per aver sbirciato l'essere sbagliato."*
- Entrata: *"Dove? DOVE?"*
- Constatazione (nemico con Turbo attivo): *"PRIMA IO!"*
- Trigger (Turbo): *"DOVE? DOVE?!"*
- Vince: *"Do-ve?"*
- Perde: *"Non qui..."*

---

## Changelog di propagazione (da applicare al repo)

### A) Rinomine — `name` in `cards.js` + file citanti
Legenda: **(P)** = passo in **prosa** che descrive il vecchio concetto → **riscrittura**, non solo swap.

| id | Vecchio → Nuovo | File da aggiornare |
|---|---|---|
| 802 | Portatore di Peste → **Dott. Rancido** | WORLDBUILDING_DESIGN **(P)**, CARTE, SISTEMA_TAG_AGENTI_v2, CARTE_ANALISI |
| 805 | Ratto delle Ombre → **Grillo Parlante** | CARTE, SISTEMA_TAG_AGENTI_v2, CARTE_ANALISI |
| 806 | Ratto Infetto → **L'Innumerevole** | CARTE, SISTEMA_TAG_AGENTI_v2, CARTE_ANALISI |
| 808 | Portatore di Ossa → **Rigattiere Ossuto** | WORLDBUILDING_DESIGN, CARTE, SISTEMA_TAG_AGENTI_v2, CARTE_ANALISI |
| 809 | Larva Strisciante → **Omuncolo** | WORLDBUILDING_DESIGN **(P)**, CARTE, SISTEMA_TAG_AGENTI_v2, CARTE_ANALISI, TRATTATO_OSSERVATORE **(P)** |
| 813 | Ratto Gigante → **Ser Rathreus** | WORLDBUILDING_DESIGN **(P)**, CARTE, FRAMEWORK_IDENTITA_ARMATE, FRAMEWORK_IDENTITA_ARMATE_v2, SISTEMA_TAG_AGENTI_v2, MODALITA_ROGUELIKE_AGGIORNATO, CARTE_ANALISI, IDENTITA_ARMATE, TRATTATO_OSSERVATORE **(P)** |
| 815 | Custode della Fogna → **Il Gondoliere** | WORLDBUILDING_DESIGN **(P)**, CARTE, SISTEMA_TAG_AGENTI_v2, CARTE_ANALISI, TRATTATO_OSSERVATORE **(P)** |
| 819 | Sciamana Corrotta → **Lettrice di Radici** | *solo `cards.js`* |

### B) Fix meccanici in `cards.js`
- **813 Ser Rathreus** — `description` "Vendetta: +3 POT" → **"Rimonta: +3 POT"** (la trigger key `rimonta` era già corretta; incoerente la description). Icona `rat` → **cavaliere** (concetto cambiato).
- **818 Mangiamore** — trigger key `rimonta` → **`vendetta`** (la description "Vendetta" era già corretta; incoerente il codice).
- **809 Omuncolo** — cambio completo: stat **1/1 → 2/2**; ability `{ trigger:"rimonta", effect:"enemyDamage", value:-2, minDamage:3 }` → **`{ trigger:"reckoning", effect:"enemyPower", value:-2, minPower:1 }`**; description → **"Resa dei conti: −2 POT nem. (min 1)"**. Ricategorizzare: CARTE_ANALISI **Debuff DAN → Debuff POT**; SISTEMA_TAG **1/1 → 2/2**. ⚠️ **Da ripassare nel modello di bilanciamento** (cambia archetipo).

### C) Icone da rivedere (opzionale)
- **813** `rat` → cavaliere · **815** `temple` → acqua/luna · **810** `rat` (ok se tieni il nome).

---

## Canon nuovo da tracciare
- **Luoghi:** Birgherund (regno di Rathreus) · Candleburg (citato dal Flagello) · Aldmere (regno del Gondoliere).
- **Nomi propri:** Ser Rathreus · Yata.
- **Fili aperti (da decidere):** la *"bellezza sott'acqua"* (Gondoliere) e la *"madre"* (Omuncolo) = la Megera, o restano mistero?

## Punti ancora aperti
1. **817** nome: *Aborto che Cammina* (shock) vs *Il Mai Nato* (fiaba-corrotta). La lore è già obliqua; manca solo la decisione sul nome.
2. **810** nome: *Ratto Moribondo* non combacia più col concetto (guardiano/silenzio). Tenere o rinominare (*Il Guardiano del Sonno* / *Ninnananna*)?
3. **809** ribilanciamento dopo il cambio stat/effetto.

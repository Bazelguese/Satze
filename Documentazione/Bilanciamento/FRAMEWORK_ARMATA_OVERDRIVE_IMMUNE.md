# SATZE — FRAMEWORK ARMATA: OVERDRIVE IMMUNE

Documento dedicato alla pianificazione della nuova armata con bonus `overdrive: immune`.

---

## Obiettivo

Definire un framework bilanciato prima della progettazione carte.

---

## Identita ufficiale armata

- Nome armata (working canon): **Khemet**
- Nome liturgico esteso (lore): **Khemet Adralmanik-Nekh'Thur Azrakael Vorem-Shaat, Trono delle Nove Ceneri e Custode del Sigillo Abissale**
- Bonus armata: `Overdrive: Immune`
- Fantasia di gioco: cabala magica dominante, tecnica e rituale, che converte il mid game in finestre di pressione protetta.

---

## Vincoli meccanici confermati (motore reale)

- `overdrive` si attiva quando `focusCoins >= 5` (soglia campo variabile possibile).
- Il bonus armata viene applicato nelle fasi bonus pre-esito; quindi `immune` entra come finestra tattica nel duello.
- `immune` blocca soprattutto debuff stat al bersaglio (`enemyPower`, `enemyDamage`, `enemyAssault`), ma non annulla automaticamente tutto (es. `directDamage` resta linea di counterplay).
- Trigger post-duello (`conquest`, `lastWish`) non sono il core consigliato per una armata centrata su Overdrive.

---

## Nuovo effetto in valutazione: Imponi (proposta critica)

Obiettivo effetto:
- introdurre un effetto "set" con valore difensivo e drawback naturale per corpi fuori curva.

Nomenclatura consigliata:
- UI/design: **Imponi**
- Chiavi tecniche consigliate (se implementato): `imponiPower`, `imponiDamage`

Semantica proposta V1:
- `imponiDamage`: imposta i DAN nemici uguali ai DAN correnti dell'utilizzatore.
- `imponiPower`: imposta la POT nemica uguale alla POT corrente dell'utilizzatore.
- timing: fase abilita principali pre-esito, con valore corrente al momento dell'attivazione.

Interazioni da fissare prima dell'implementazione:
1. Se entrambi i giocatori usano Imponi nello stesso turno, ordine deterministico (consigliato: ordine naturale di risoluzione abilita).
2. `immune`: consigliato blocchi Imponi, per coerenza con altri effetti ostili.
3. `inversion`: consigliato NON converta Imponi (e un "set", non un modificatore +/-).
4. Nessuna persistenza cross-turno: effetto solo nel duello corrente.

Uso design consigliato in questa armata:
- 2-3 carte totali con Imponi, principalmente come strumento situazionale o drawback.
- ideale su corpi estremi (es. alta DAN o alta POT fuori curva) per creare rischio reale.

---

## Spec finale bloccata — Imponi (V1)

Questa specifica e approvata per la fase design/prototipo:

1. Nomi effetto:
   - `imponiPower`
   - `imponiDamage`
2. Semantica:
   - `imponiPower`: imposta la POT nemica uguale alla POT corrente dell'utilizzatore.
   - `imponiDamage`: imposta i DAN nemici uguali ai DAN correnti dell'utilizzatore.
3. Timing:
   - risoluzione in fase abilita principali pre-esito (non post-duello).
4. Interazioni:
   - bloccabile da `immune`;
   - non convertito da `inversion`;
   - nessuna persistenza cross-turno.
5. Regola simultaneita:
   - se entrambi attivano Imponi nello stesso turno, vale l'ordine naturale di risoluzione abilita del motore.

---

## Identita armata (3 assi)

1. **Ritmo:** mid-game spike su turni a 5+ FC, non dominio continuo.
2. **Resilienza:** immune come finestra di protezione condizionale, non stato permanente.
3. **Chiusura:** pressione controllata con 1-2 turni chiave, evitando lock non interattivi.

---

## Struttura set (vincolo hard)

Il set completo segue lo standard SATZE da 20 carte:

- 3 carte L5
- 5 carte L4
- 6 carte L3
- 6 carte L2

Distribuzione obiettivo per ruolo:
- L5: 1 pillar spike, 1 tech/control, 1 engine/value
- L4: nucleo convergente Overdrive + primi strumenti situazionali
- L3: ossatura tattica e consistenza trigger
- L2: rete di supporto, utility e counterplay

---

## Matrice trigger target (framework)

| Classe | Trigger target | Nota |
|--------|----------------|------|
| Convergente forte | `overdrive` | asse primario: finestra di potenza e protezione |
| Convergente secondario | `resistenza` | asse reattivo: fallback quando si subisce pressione |
| Situazionale | `reckoning`, `rimonta`, `sopraffare`, `ultimaChance` | utili in sottopiani o timing specifici |
| Asso | `imboscata`, `conquest`, `glory`, `magnanimous` | aprono linee alternative ma fuori asse principale |

Target distribuzione (20 carte):
- Convergenti: 8-10
- Situazionali: 6-8
- Asso: 3-5
- Neutre (sempre): 1-2

---

## Matrice effect target (framework)

| Classe | Effect target | Vincolo |
|--------|---------------|---------|
| Convergente forte | `power`, `powerAndDamage`, `focusCoin` | valorizzano i turni Overdrive senza auto-win |
| Situazionale | `directDamage`, `blockAbility`, `enemyDamage`, `heal`, `imponiPower/imponiDamage` | strumenti di tempo, rifinitura o drawback controllato |
| Asso | `copyPower`, `inversion`, `assaultValue` alto | da usare con parsimonia per evitare swing eccessivi e drift identitario |

Target distribuzione (20 carte):
- Power scaling (`power` / `powerAndDamage`): 5-7
- Economia (`focusCoin`): 2-3
- Difesa/tempo (`heal`, `enemyDamage`, `blockAbility`): 4-6
- Chiusura (`directDamage`, `assaultValue`): 2-4
- Imponi (`imponiPower` / `imponiDamage`): 2-3 (inclusi nella quota situazionale)

---

## Target bilanciamento (aggancio al sistema completo)

Per mantenere coerenza con `SISTEMA_BILANCIAMENTO_COMPLETO.md`:

- usare sempre doppia lettura: **Valore Effettivo** + **Valore Potenziale**
- includere sempre il contributo medio del bonus armata:
  - `Immune = 2.00 FC`
  - trigger `Overdrive = 0.5`
  - quindi **BonusEff medio = 1.00 FC**

Range consigliati (prima passata design):

- L5: EffEff target `1.18 - 1.28` (picchi fino a `~1.32` solo su 1 carta asso monitorata)
- L4: EffEff target `1.20 - 1.30`
- L3: EffEff target `1.22 - 1.34`
- L2: EffEff target `1.18 - 1.32`

Regola pratica:
- se una carta supera stabilmente il range e ha trigger convergente, ridurre body o valore effetto;
- se resta sotto range ma con buon design qualitativo, valutare buff leggero al body prima di alzare burst.

---

## Idea lore guida (canon attuale)

### Premessa narrativa

I Khemet sono una cabala di maghi in armatura gotico-egizia, nati come tradizione elementale e ascesi alla manipolazione della realta dopo il contatto con il Giocatore. Nei testi rituali sono invocati come "Khemet Adralmanik-Nekh'Thur Azrakael Vorem-Shaat, Trono delle Nove Ceneri e Custode del Sigillo Abissale". Non sono una setta in rovina: sono un potere dominante che governa tramite ricerca arcana, evocazione e riscrittura della materia.

### Tema centrale

- Dottrina: "non controllo ma ricerca" — ogni scontro e un esperimento rituale.
- L'Overdrive rappresenta il momento in cui il rituale entra in piena risonanza e rende il soggetto immune ai debuff stat.
- L'Immune non e invulnerabilita assoluta: e dominio temporaneo della forma, con counterplay su linee non bloccate (es. danno diretto).

### Tono e estetica suggeriti

- gotico-egizio magico, armature blu profondo, iconografia teocratica, architettura rituale;
- presenza austera e dominante, non predatoria/decadente;
- linguaggio alto, dogmatico, orientato a legge arcana e conseguenza cosmica.

### Traduzione meccanica della lore

- prevalenza di trigger convergenti con gerarchia: `overdrive` primario, `resistenza` secondario;
- uso situazionale di Imponi come tecnica di dominio locale, non come lock permanente;
- chiusura su 1-2 turni chiave, non su snowball continuo.

---

## Regole hard anti-abuso (specifiche armata)

1. Max 1 fonte forte di protezione per carta (no stacking difensivo multiplo sullo stesso pezzo).
2. Le carte `overdrive` ad alto impatto non devono essere forti anche fuori soglia FC.
3. Evitare combinazioni che chiudono la partita senza interazione (`overdrive` + burst troppo alto + protezione totale).
4. Limitare `focusCoin` su trigger molto tardivi (evitare dead value sistematico).
5. Mantenere almeno 3-4 carte con counterplay evidente per l'avversario (finestre quando Overdrive non e attivo).
6. Imponi non deve diventare lock tool: max 1 Imponi "alto impatto" in lega 4-5, gli altri solo tech/drawback.
7. Evitare stack di Imponi con burst non interattivo nella stessa carta (es. Imponi + danno diretto alto).

---

## Rischi meta da monitorare in playtest

- Picchi troppo netti nei turni 5+ FC (winrate swing).
- Matchup oppressivi contro armate debuff-centriche se immune e troppo frequente.
- Curva FC troppo lineare (armata che "aspetta" senza decisioni reali).
- Perdita di identita se troppe carte asso scollegate da Overdrive.
- Ambiguita percepita su Imponi (ordine risoluzione / interazione con immune) se non spiegata bene in log/tooltip.

---

## Checklist pre-carta (obbligatoria per questa armata)

1. Trigger in fase utile (pre/post corretto).
2. Impatto reale nella fase (non valore fittizio).
3. Spendibilita entro i round reali (5 round standard).
4. Coerenza con asse Overdrive: immune (convergente / situazionale / asso).
5. Presenza di counterplay e rischio meta dichiarato.
6. Se usa Imponi: chiarire tipo (Power o Damage), ordine di risoluzione e se e bloccabile da immune.

---

## Prossimo step consigliato

Mini-set 6-8 carte prototipo per validare il framework in playtest prima del set completo da 20.

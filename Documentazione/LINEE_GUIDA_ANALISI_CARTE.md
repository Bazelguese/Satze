# LINEE GUIDA ANALISI CARTE SATZE (VERSIONE AFFIDABILE)

Documento operativo per usare l'IA nella creazione e valutazione carte senza errori logici.

---

## 1) FONTI CANONICHE (ORDINE OBBLIGATORIO)

Prima di proporre o valutare una carta, leggere SEMPRE:

1. `src/data/cards.js` (stato reale delle carte)
2. `src/data/armies.js` (bonus armata reali)
3. `src/game/triggerLogic.js` (verita del motore su quando i trigger sono attivi)
4. `src/data/gameMechanicsFramework.js` (chiavi trigger/effect supportate)
5. `Documentazione/Bilanciamento/FRAMEWORK_IDENTITA_ARMATE_v2.md` (distribuzione reale snapshot dati)
6. `Documentazione/Bilanciamento/SISTEMA_BILANCIAMENTO_COMPLETO.md` (modello teorico)

Nota: i file documentali sono supporto. In caso di conflitto vince sempre il codice in `src/`.

---

## 2) TRIGGER SUPPORTATI E SIGNIFICATO ESATTO

Usare solo queste chiavi (`ability.trigger`):

| Trigger key | Significato reale |
|-------------|-------------------|
| `imboscata` | sei il primo a scegliere |
| `intervention` | sei il secondo a scegliere |
| `glory` | hai vinto lo scontro precedente |
| `vendetta` | hai perso lo scontro precedente |
| `overdrive` | spendi 5+ FC nel turno |
| `reckoning` | entrambi hanno giocato almeno 3 carte |
| `rimonta` | hai meno PV del nemico |
| `magnanimous` | hai piu PV del nemico |
| `lastWish` | perdi questo scontro |
| `conquest` | vinci questo scontro |
| `opportunista` | il nemico spende 5+ FC nel turno |
| `sfida` | tua Lega < Lega nemica |
| `sopraffare` | tua Lega > Lega nemica |
| `invasione` | hai conquistato almeno 1 campo |
| `resistenza` | il nemico ha conquistato almeno 1 campo |
| `turbo` | round 1 o 2 |
| `ultimaChance` | round 5+ |

Attenzione: il motore puo forzare trigger sempre attivi tramite modificatori campo (`fieldModifiers`).

---

## 3) EFFETTI SUPPORTATI

Usare solo queste chiavi (`ability.effect`):

`power`, `damage`, `enemyPower`, `enemyDamage`, `assaultValue`, `enemyAssault`, `copyPower`, `copyDamage`, `copyAbility`, `copyBonus`, `blockAbility`, `blockBonus`, `immune`, `focusCoin`, `heal`, `selfDamage`, `directDamage`, `powerAndDamage`, `escalation`, `attrition`, `inversion`, `toxin`.

Se un effetto non e in questa lista, la proposta e invalida.

---

## 4) REGOLA DI COMPATIBILITA TRIGGER (PRECISA)

Due trigger sono compatibili se possono essere veri nello stesso turno per la stessa carta.

Esempi corretti:
- `vendetta` + `imboscata`: compatibili (T-1 vs turno corrente)
- `glory` + `imboscata`: compatibili
- `rimonta` + `imboscata`: compatibili
- `opportunista` + `intervention`: compatibili
- `turbo` + `sfida`: compatibili

Incompatibili:
- `imboscata` vs `intervention`
- `glory` vs `vendetta`
- `rimonta` vs `magnanimous`
- `conquest` vs `lastWish`
- `sfida` vs `sopraffare`

---

## 5) BONUS ARMATA (REGOLA REALE)

- Il bonus armata si attiva per una armata se nella mano iniziale (5 carte) ci sono almeno 2 carte di quella armata.
- Questo stato e calcolato in `calcInitialBonuses` e resta valido in partita.
- Il bonus non dipende dal trigger della carta giocata: dipende dal proprio trigger bonus e dal contesto del turno.
- In risoluzione duello, il trigger del bonus viene verificato con `checkTrigger`.

Implica:
- Una carta con trigger `vendetta` puo ricevere bonus `imboscata` se in quel turno giochi per primo e il bonus armata e attivo.

---

## 6) PROCEDURA OBBLIGATORIA PER PROPORRE UNA NUOVA CARTA

1. **Validita tecnica**
   - Trigger e effect devono esistere nelle liste ufficiali.
   - Nessuna chiave legacy (`turboRound`, `ambush`, ecc.).

2. **Check duplicati nel pool reale**
   - Verificare in `src/data/cards.js` se nella stessa armata esiste gia combinazione simile trigger+effect+lega.

3. **Coerenza con identita armata**
   - Confrontare con `FRAMEWORK_IDENTITA_ARMATE_v2.md` (snapshot reale + target design).
   - Specificare se la carta e convergente, asso o neutra.

4. **Valutazione teorica**
   - Usare il modello in `SISTEMA_BILANCIAMENTO_COMPLETO.md` (efficienza effettiva e potenziale).
   - Trattare i range come guida, non come regola assoluta.

5. **Valutazione pratica**
   - Frequenza attivazione trigger prevista.
   - Delta PV reale (danno, cura, selfDamage, toxin).
   - Interazioni critiche (block/copy/inversion, bonus armata, late game).

6. **Rischio di meta**
   - Segnalare se la carta e hard counter, snowball, o alta varianza matchup.

---

## 7) OUTPUT STANDARD CHE L'IA DEVE PRODURRE

Ogni proposta carta deve includere:

1. Dati carta (Lega, POT, DAN, trigger, effect, value/stat/min).
2. Verifica tecnica (chiavi valide, compatibilita trigger/bonus).
3. Posizionamento armata (convergente/asso/neutro + motivo).
4. Stima bilanciamento:
   - Efficienza effettiva
   - Efficienza potenziale
   - Frequenza attivazione stimata
5. Rischi e mitigazioni (se fuori curva, dire perche e accettabile o come nerfare).

Se manca uno di questi punti, la proposta non e completa.

---

## 8) ERRORI DA EVITARE (BLOCCANTI)

- Usare file non canonici al posto di `src/data/cards.js`.
- Inventare trigger/effect non supportati.
- Trattare i range teorici come legge rigida.
- Dichiarare incompatibilita trigger senza analisi temporale.
- Valutare la carta ignorando bonus armata e contesto reale di attivazione.

---

Versione pensata per uso IA in design assistito: priorita a precisione tecnica, coerenza col motore e ripetibilita del ragionamento.

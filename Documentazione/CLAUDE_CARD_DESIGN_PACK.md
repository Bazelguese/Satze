# SATZE — CLAUDE CARD DESIGN PACK

Questo documento e pensato per essere dato a Claude come contesto operativo unico.

---

## Obiettivo

Supportare design e analisi carte SATZE con massima precisione tecnica, evitando drift tra documentazione e codice.

---

## Priorita fonti (ordine vincolante)

In caso di conflitto, vale la fonte con priorita piu alta.

1. `src/data/cards.js`
2. `src/data/armies.js`
3. `src/game/triggerLogic.js`
4. `src/data/gameMechanicsFramework.js`
5. `Documentazione/LINEE_GUIDA_ANALISI_CARTE.md`
6. `Documentazione/Bilanciamento/FRAMEWORK_IDENTITA_ARMATE_v2.md`
7. `Documentazione/Bilanciamento/SISTEMA_BILANCIAMENTO_COMPLETO.md`

---

## Vincoli tecnici non negoziabili

### Trigger ammessi (`ability.trigger`)

`imboscata`, `intervention`, `glory`, `vendetta`, `rimonta`, `overdrive`, `reckoning`, `magnanimous`, `lastWish`, `conquest`, `opportunista`, `sfida`, `sopraffare`, `invasione`, `resistenza`, `turbo`, `ultimaChance`.

### Effect ammessi (`ability.effect`)

`power`, `damage`, `enemyPower`, `enemyDamage`, `assaultValue`, `enemyAssault`, `copyPower`, `copyDamage`, `copyAbility`, `copyBonus`, `blockAbility`, `blockBonus`, `immune`, `focusCoin`, `heal`, `selfDamage`, `directDamage`, `powerAndDamage`, `escalation`, `attrition`, `inversion`, `toxin`.

### Legacy da NON usare

- `turboRound`
- `ambush`

Nota migrazione storica:
- `turbo` (legacy) -> `imboscata`
- `ambush` -> `vendetta`
- `vendetta` (legacy semantica) -> `rimonta`
- `turboRound` -> `turbo`

---

## Regole di ragionamento obbligatorie

1. **Codice sopra documentazione**
   - Se un file doc dice A e il codice dice B, usare B.

2. **Validation meccanica prima del bilanciamento (OBBLIGATORIA)**
   - Prima di dire se una carta "va bene", verificare sempre in questo ordine:
     1) timing trigger (pre-duello o post-duello),
     2) bersaglio effettivo (cosa puo ancora essere modificato in quella fase),
     3) spendibilita del valore entro il match reale.
   - Solo dopo fare valutazione convergenza/asso e bilanciamento.

3. **Regole hard di fase**
   - Se il trigger e post-duello (`conquest`, `lastWish`), non considerare validi come valore reale i debuff stat del duello appena finito (`enemyPower`, `enemyDamage`, `enemyAssault`) salvo persistenza esplicita.
   - Con modalita standard a 5 round (`maxRounds: 5`), economia molto tardiva su `ultimaChance` (`round >= 5`) tende a essere dead value se non spendibile nello stesso round.
   - Non approvare mai una carta senza dichiarare esplicitamente: fase, impatto reale, vincolo round.

4. **Compatibilita trigger**
   - Verificare compatibilita temporale nel turno, non solo per nome.
   - Esempi incompatibili: `imboscata` vs `intervention`, `glory` vs `vendetta`, `rimonta` vs `magnanimous`, `conquest` vs `lastWish`.

5. **Bonus armata**
   - Stato bonus iniziale: attivo per un'armata se in mano iniziale ci sono almeno 2 carte di quell'armata.
   - Attivazione in duello: dipende dal trigger del bonus verificato con `checkTrigger`.
   - Il trigger della carta e il trigger del bonus sono separati.

6. **No invenzioni**
   - Non proporre chiavi trigger/effect fuori lista.
   - Non inventare meccaniche non presenti.

7. **Controllo duplicati**
   - Prima di proporre una carta, confrontare con `src/data/cards.js` per evitare cloni (soprattutto stesso trigger+effect+lega nella stessa armata).

---

## Procedura richiesta quando proponi una carta

Per ogni proposta, esegui nell'ordine:

1. Verifica fase/timing (pre o post-duello).
2. Verifica impatto reale in quella fase.
3. Verifica spendibilita del valore entro i round reali.
4. Verifica tecnica (chiavi valide, no legacy).
5. Compatibilita trigger/bonus.
6. Coerenza con identita armata (convergente/asso/neutro).
7. Stima bilanciamento:
   - Efficienza effettiva
   - Efficienza potenziale
   - Frequenza attivazione attesa
8. Rischi meta (snowball, hard counter, alta varianza, lock di risorse).
9. Mitigazioni (nerf proposto, trigger alternativo, valore alternativo, lega alternativa).

---

## Formato output obbligatorio

Quando rispondi con una nuova carta, usa SEMPRE:

1. **Scheda carta**
   - Nome
   - Armata
   - Lega
   - POT / DAN
   - Trigger
   - Effect
   - value / stat / min (se applicabili)

2. **Validazione tecnica**
   - Trigger valido: SI/NO
   - Effect valido: SI/NO
   - Fase trigger: pre/post
   - Impatto reale in fase: SI/NO + motivo
   - Spendibilita valore entro match: SI/NO + motivo
   - Compatibilita trigger-bonus armata: SI/NO + motivo

3. **Analisi identita**
   - Convergente / Asso / Neutro
   - Motivazione sintetica

4. **Analisi bilanciamento**
   - Efficienza effettiva (stima)
   - Efficienza potenziale (stima)
   - Delta tra effettivo e potenziale
   - Frequenza attivazione stimata

5. **Rischi**
   - Elenco puntuale dei rischi

6. **Mitigazione consigliata**
   - Una modifica minima per migliorare il bilanciamento, se necessaria

---

## Prompt breve pronto all'uso

Copia questo testo quando chiedi a Claude di proporre o analizzare carte:

"Usa SATZE con priorita fonti: cards.js, armies.js, triggerLogic.js, gameMechanicsFramework.js, poi documentazione. Prima del bilanciamento fai validation meccanica obbligatoria: fase trigger, impatto reale in fase, spendibilita valore entro i round reali. Non inventare trigger/effect fuori whitelist. Per ogni carta proposta restituisci: scheda completa, validazione tecnica, analisi identita armata, stima effettivo/potenziale, rischi, mitigazione."

---

Fine pacchetto.

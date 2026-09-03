# SATZE — Handoff tecnico per Cursor: sistema scintille / targeting Eminenza

> Basato sul codice reale del repository `Bazelguese/Satze`, branch `main`, commit ispezionato
> `f5419985a56c4cab07dd1713e17b6a0f3669fe9e`, e sulla guida di design
> `Documentazione/SATZE_EMINENZA_CINEMATIC_GUIDE.md`.

## Istruzione principale

Rifinisci il sistema di scintille esistente. **Non riscriverlo e non sostituire il renderer.**
L'architettura attuale è corretta: il motore emette notice, `resolveNoticeCinematics` traduce
primitive + fase in ricette pure, `EminenceMarkFlight` disegna. Va conservata.

Il vincolo architetturale resta quello del sottosistema Eminenza:

> **Nessun ramo `if (eminenceId === '…')`, né in `eminenceCinematics.js` né in React.**
> Ogni differenziazione deve derivare da primitive, target, fase o da una chiave dichiarata nel
> catalogo dati.

In caso di conflitto:

1. per l'architettura prevale il codice esistente;
2. per le regole visive prevale questo documento;
3. se serve una decisione di design non presente qui, non improvvisarla: lascia il punto di
   estensione e segnalalo.

Prima di modificare, leggi integralmente:

- `src/game/eminence/eminenceCinematics.js`
- `src/game/eminence/eminenceCinematics.test.js`
- `src/game/eminence/eminenceAnnouncements.js` (produzione dei `payoffs`)
- `src/components/eminence/EminenceMarkFlight.jsx`
- `src/components/eminence/eminenceMarkCinematic.js`
- `src/styles/satze-eminenza.css`, righe ~676–731
- `Documentazione/SATZE_EMINENZA_CINEMATIC_GUIDE.md`

---

## 1. Diagnosi — cosa non va oggi

Sette difetti verificati sul codice. Le fasi sotto li risolvono in ordine di resa.

| # | Difetto | Dove |
|---|---|---|
| 1 | Nessun audio nel progetto | nessuna dipendenza, nessun `new Audio` / `AudioContext` |
| 2 | Durata volo fissa a 900 ms indipendente dalla distanza | `EMINENCE_MARK_FLIGHT_MS`, `.9s` in tre keyframe CSS |
| 3 | Il bersaglio non reagisce all'arrivo | `landed` è esposto solo per prey/fragment/slot |
| 4 | `LINK_AGENT` copre 13 primitive con un solo arco | `AGENT_PRIMITIVES` in `eminenceCinematics.js` |
| 5 | Tre primitive non producono alcuna cue | `COMPOSE_ABILITY`, `REGISTER_END_MATCH_DEBT`, `BLOCK_EMINENCE` |
| 6 | Le abilità `PRE_AGENT` perdono l'arco | guardia `&& agentReady` in `cueFromPayoff` |
| 7 | Voli strettamente serializzati, nessun tetto di durata | `playFrom` in `playNoticeCinematics` |

Difetto minore: in `flightGeometry` il controllo della Bézier è sempre
`cy = Math.min(y1, y2) - lift`, quindi ogni arco si inarca verso l'alto anche quando il volo scende.

---

## 2. Fase 1 — Cinetica del volo

### 2.1 Durata proporzionale alla distanza

Sostituisci la costante fissa con una funzione pura, esportata e testabile.

```js
// EminenceMarkFlight.jsx
export const FLIGHT_MIN_MS = 220;
export const FLIGHT_MAX_MS = 520;
const FLIGHT_PX_PER_MS = 2.6;

export function flightDurationMs(distancePx) {
  const raw = distancePx / FLIGHT_PX_PER_MS;
  return Math.round(Math.min(FLIGHT_MAX_MS, Math.max(FLIGHT_MIN_MS, raw)));
}
```

`flightGeometry` calcola già `x1,y1,x2,y2`: restituisci anche `len` (lunghezza della corda) e
`ms = flightDurationMs(len)`.

Il CSS ha `.9s` cablato in `.em-mark-flight-trail`, `.em-mark-flight-spark` e nel delay di
`.em-mark-flight-burst`. Parametrizzali:

```css
.em-mark-flight{ --em-flight-ms:360ms; }
.em-mark-flight-trail{ animation-duration:var(--em-flight-ms); }
.em-mark-flight-spark{ animation-duration:var(--em-flight-ms); }
.em-mark-flight-burst{
  animation-delay:calc(var(--em-flight-ms) * 0.92);
  animation-duration:180ms;
}
```

Il componente scrive `style={{ '--em-flight-ms': `${geometry.ms}ms` }}` sul contenitore e usa lo
stesso valore per il `setTimeout` di `onComplete`. Le due sorgenti di verità attuali (JS a 900,
CSS a .9s) devono diventare una sola.

`EMINENCE_MARK_FLIGHT_MS` resta esportato per retrocompatibilità ma smette di governare la durata:
verifica gli import prima di rimuoverlo.

### 2.2 Curvatura coerente con la direzione

L'arco deve inarcarsi perpendicolarmente alla direzione di percorrenza, non sempre verso l'alto.

```js
const dx = x2 - x1, dy = y2 - y1;
const len = Math.hypot(dx, dy) || 1;
const bow = Math.min(120, Math.max(36, len * 0.16));
// normale alla corda; il segno decide da che parte si inarca
const nx = -dy / len, ny = dx / len;
const sign = flight.from?.side === 'player' ? -1 : 1;
const cx = (x1 + x2) / 2 + nx * bow * sign;
const cy = (y1 + y2) / 2 + ny * bow * sign;
```

---

## 3. Fase 2 — Impatto sul bersaglio

Oggi `.em-mark-flight-burst` è un overlay disegnato sulle coordinate d'arrivo: **l'elemento
bersaglio non cambia stato**. La reazione esiste solo per i marchi, via `preyLandId` e
`arrivingSlot` in `useEminencePreyFlight`.

Generalizzala a ogni ancora, senza propagare nuovi props attraverso l'albero React.

In `EminenceMarkFlight`, quando il volo raggiunge il termine, l'elemento risolto da
`queryFlightAnchor(normalized.to)` riceve un attributo per 180 ms:

```js
target.setAttribute('data-em-impact', recipeOrValence);
window.setTimeout(() => target.removeAttribute('data-em-impact'), 180);
```

Una sola regola CSS, valida per tutte le ancore:

```css
[data-em-impact]{
  animation:emImpactPunch 180ms cubic-bezier(.2,.9,.25,1);
  will-change:transform,filter;
}
@keyframes emImpactPunch{
  0%{transform:scale(1)}
  38%{transform:scale(1.055); filter:brightness(1.5)}
  100%{transform:scale(1); filter:none}
}
@media (prefers-reduced-motion:reduce){ [data-em-impact]{animation:none} }
```

**Attenzione:** `data-em-hp` e `data-em-presence` sono contatori numerici. Sul loro impatto il
numero deve cambiare *in quel momento*, non prima. Se l'HUD aggiorna il valore alla ricezione del
notice, l'arco arriva su un numero già cambiato e l'impatto perde causalità. Verifica l'ordine e,
se serve, ritarda l'aggiornamento del contatore fino al callback di atterraggio.

---

## 4. Fase 3 — Vocabolario delle scintille

### 4.1 Split di `LINK_AGENT` per valenza

`AGENT_PRIMITIVES` contiene tredici primitive che producono tutte lo stesso arco. Poiché la
scintilla è il canale più veloce dei tre (badge / testo / scintilla), il giocatore esperto la legge
al posto del testo e resta sotto-informato.

Non splittare per primitiva — sarebbe una tabella da mantenere a ogni aggiunta. Splitta per
**valenza**, che `cueFromPayoff` può già derivare da `prim` più `dest`:

```js
export const CINEMATIC_RECIPES = {
  // …esistenti…
  LINK_AGENT_BUFF:    'LINK_AGENT_BUFF',     // migliora il bersaglio
  LINK_AGENT_DEBUFF:  'LINK_AGENT_DEBUFF',   // peggiora il bersaglio
  LINK_AGENT_CONTROL: 'LINK_AGENT_CONTROL',  // riscrive le regole del bersaglio
};
```

Classificazione:

| Valenza | Primitive |
|---|---|
| `BUFF` | `MODIFY_STAT` con `delta > 0`, `GRANT_TEMPORARY_FOCUS`, `HEAL_HP`, `SET_ARMY_BONUS_STATE` con `forcedActive` |
| `DEBUFF` | `MODIFY_STAT` con `delta < 0`, `APPLY_TOXIN`, `LOSE_HP`, `SET_ARMY_BONUS_STATE` con `suppressed`, `SUPPRESS_CONQUEST` |
| `CONTROL` | `FORCE_TRIGGER`, `FORBID_TRIGGER`, `REPLACE_TRIGGER`, `ALIAS_TRIGGER`, `UNBLOCKABLE_POWER`, `MODIFY_LEAGUE`, `MODIFY_ANCHORED_THRESHOLD`, `COMPOSE_ABILITY` |

`MODIFY_STAT` e `SET_ARMY_BONUS_STATE` si classificano dal segmento, non dalla primitiva: la
funzione di classificazione riceve il payoff completo.

`LINK_AGENT` resta come alias della valenza `CONTROL` finché i test esistenti non sono migrati.

Differenziazione visiva minima, tutta in CSS sull'attributo `data-em-impact`:
BUFF risale verso il bersaglio con burst pieno; DEBUFF ha traiettoria più piatta e burst che
implode invece di espandersi; CONTROL ha scia tratteggiata e nessun burst, solo un flash sul
bersaglio.

### 4.2 Primitive oggi silenziose

`cueFromPayoff` restituisce `null` per `COMPOSE_ABILITY`, `REGISTER_END_MATCH_DEBT` e
`BLOCK_EMINENCE`. Le prime due sono le giocate più costose di due Eminenze: Opera Composita spende
4 Presenza e consuma due Frammenti, Debito Eterno registra una perdita PV differita a Fine Scontro.
Oggi non disegnano nulla.

- `COMPOSE_ABILITY` → `LINK_AGENT_CONTROL` verso `field-agent` del lato proprietario.
- `REGISTER_END_MATCH_DEBT` → nuova ricetta `DEBT_BIND`, volo `card` → `field-agent` del lato
  bersagliato, con **marchio persistente** sul bersaglio fino a Fine Scontro. L'effetto è differito
  di più round: un volo che sparisce non basta, serve un segno che resti.
- `BLOCK_EMINENCE` → nuova ricetta `EMINENCE_SEAL`, volo `card` → `card` del lato bersagliato, con
  la carta Eminenza colpita che entra in stato spento fino a fine round successivo.

`MARK_CARD` continua a restituire `null`: i marchi sono animati dal percorso `MARK_SPAWN` in
`useEminencePreyFlight`. Non toccarlo.

### 4.3 Ancora `hand` per le abilità `PRE_AGENT`

In `cueFromPayoff`:

```js
if (AGENT_PRIMITIVES.has(prim) && agentReady) { … }
```

Quando l'Agente non è ancora schierato la funzione restituisce `null`. Ma Enclave −1
(`MODIFY_LEAGUE`) e Corte Rossa −3 Debito (`REPLACE_TRIGGER`) bersagliano **per definizione** una
carta non ancora schierata: sono `PRE_AGENT`. Entrambe perdono l'arco.

L'ancora `hand` esiste già in `queryFlightAnchor` e cerca `[data-hand-agent="…"]`. Aggiungi il ramo:

```js
if (AGENT_PRIMITIVES.has(prim) && !agentReady) {
  const cardId = payoff?.params?.cardId ?? notice.params?.cardId ?? null;
  if (cardId == null) return null;
  return {
    recipe: valenceRecipe(payoff),
    flight: { accent, from: { type: 'card', side }, to: { type: 'hand', id: cardId } },
  };
}
```

Verifica che le carte in mano espongano davvero `data-hand-agent` su **entrambi** i lati: Corte −3
può bersagliare un Agente avversario. Se il rail nemico non lo espone, aggiungilo — è un attributo,
non informazione nascosta, perché le mani sono già pubbliche (spec §14).

---

## 5. Fase 4 — Coreografia e budget

`playNoticeCinematics` esegue i voli in stretta serie: `playFrom(index)` chiama `playFrom(index+1)`
solo alla fine del precedente. Con Apex Furia (due cue), più lo Statico, più il lato nemico che
rivela nello stesso gate, il round 5 diventa una sequenza lunga.

Due regole:

**Sfalsamento invece di serializzazione.** Due cue che non condividono la destinazione partono a
90–120 ms di distanza e si sovrappongono. Restano serializzate solo le cue con la **stessa ancora
di destinazione**, perché due impatti simultanei sullo stesso elemento si annullano visivamente.

**Tetto per beat.** Costante `CINEMATIC_BEAT_BUDGET_MS = 1200`. Il player somma le durate
pianificate; superato il tetto, le cue rimanenti non vengono eliminate ma **collassate** in un
singolo `PRESENCE_PULSE` o in un impatto riassuntivo sul bersaglio più frequente. Non saltare
silenziosamente cue: un effetto che si applica senza alcun segnale è peggio di un segnale
compresso.

Le regole UX già documentate al §7 della guida restano vincolanti: `holdAnnounce` non anticipa il
testo, `waitFor: field-agent` attende la fine dell'ingresso, `prefers-reduced-motion` salta tutto,
un mancato non produce arco, e a parità di beat vale l'ordine di iniziativa.

---

## 6. Fase 5 — Audio

Non esiste audio nel progetto. È il divario più grande rispetto a un riferimento come MTG Arena, e
il più economico: una scintilla senza suono viene percepita come un glitch dell'interfaccia.

Requisiti:

- nessuna dipendenza pesante; `HTMLAudioElement` con pool di istanze preallocate è sufficiente per
  clip brevi;
- **una clip per ricetta**, indicizzata dall'enum `CINEMATIC_RECIPES`. Nessuna clip per Eminenza:
  vale lo stesso vincolo architetturale del resto del sistema;
- ogni volo ha due beat: *partenza* al lancio, *impatto* al callback di atterraggio. L'impatto è il
  suono che porta il peso, la partenza è solo un whoosh breve;
- rispetta `prefers-reduced-motion` disattivando le clip di movimento ma **non** quelle di impatto:
  un utente che ha disattivato le animazioni ha più bisogno del segnale audio, non meno;
- impostazione volume/mute persistita in `localStorage`, stesso schema di
  `overdriveEffectPreference.js`;
- se due impatti cadono nello stesso frame, riproduci una sola clip: il layering di clip identiche
  produce clipping.

---

## 7. Fase 6 — Momenti autoriali

Il livello generico non deve coprire tutto. Quattro eventi meritano un trattamento scritto a mano
perché capitano al massimo una volta per Scontro:

| Evento | Eminenza |
|---|---|
| Ora Verde al round 5 | Apex, Statico |
| Protocollo Terra Bruciata | Calibri Pesanti, −4 |
| Opera Composita | Kethran, −4 |
| Debito Eterno | Corte Rossa, −4 |

**Implementazione obbligata:** una chiave opzionale `cinematic` sul **segmento** nel catalogo
`src/data/eminences.js`, che nomina una ricetta.

```js
{
  timing: EFFECT_TIMINGS.ROUND_START,
  primitive: P.REPLACE_FIELD,
  target: T.GLOBAL,
  fieldId: 89,
  condition: { roundNumber: 5 },
  cinematic: 'ORA_VERDE',   // ← override dichiarativo
}
```

`resolveNoticeCinematics` legge `payoff.cinematic` e, se presente e registrata, la usa al posto
della ricetta derivata. Resta **dato**, non logica: nessun `if` sull'id dell'Eminenza nel motore né
in React. Una ricetta override non registrata deve degradare sulla ricetta derivata, non lanciare.

---

## 8. Test

Estendi `src/game/eminence/eminenceCinematics.test.js`:

- `flightDurationMs` è monotona e resta dentro `[FLIGHT_MIN_MS, FLIGHT_MAX_MS]`;
- `MODIFY_STAT` con `delta` positivo produce `LINK_AGENT_BUFF`, con `delta` negativo
  `LINK_AGENT_DEBUFF`;
- `SET_ARMY_BONUS_STATE` con `suppressed` è DEBUFF, con `forcedActive` è BUFF;
- `COMPOSE_ABILITY`, `REGISTER_END_MATCH_DEBT` e `BLOCK_EMINENCE` producono una cue non nulla;
- una primitiva Agente con `agentReady: false` e un `cardId` nei params produce un volo verso
  `{ type: 'hand', id: cardId }`;
- la stessa senza `cardId` restituisce `null` (nessuna regressione);
- due cue con destinazione diversa vengono sfalsate, due con la stessa destinazione restano
  serializzate;
- oltre `CINEMATIC_BEAT_BUDGET_MS` le cue eccedenti vengono collassate e **non** scartate;
- un segmento con `cinematic` non registrata degrada sulla ricetta derivata;
- `outcome: 'miss'` continua a produrre solo `MISS_DIM`, senza arco;
- nessun file sotto `src/game/eminence/` e `src/components/eminence/` contiene un confronto
  letterale con un id di Eminenza — test di lint architetturale, da aggiungere.

Aggiorna `Documentazione/SATZE_EMINENZA_CINEMATIC_GUIDE.md` nella stessa PR. Due punti sono già
divergenti dal codice e vanno sanati: `VERIFY_LINK` è dichiarata in `CINEMATIC_RECIPES` ma marcata
«non usato», e la guida afferma «un volo per avviso (v1)» mentre `playNoticeCinematics` già
concatena più voli.

---

## 9. Ordine di consegna

Ogni fase è autonoma e rilasciabile da sola.

1. **Fase 1 — cinetica.** Nessuna dipendenza. Effetto immediato e visibile.
2. **Fase 2 — impatto.** Dipende dalla 1 per la sincronizzazione del delay del burst.
3. **Fase 3 — vocabolario.** Indipendente dalle prime due, ma dopo la 2 il beneficio si vede.
4. **Fase 4 — coreografia.** Richiede le durate variabili della 1 per calcolare il budget.
5. **Fase 5 — audio.** Richiede l'enum stabilizzato dalla 3.
6. **Fase 6 — momenti autoriali.** Ultima: è la sola che tocca `src/data/eminences.js`.

Non accorpare la Fase 3 alla Fase 6. Il rischio concreto di questo lavoro è che il trattamento
autoriale venga usato per tappare i buchi del livello generico, che è esattamente come si costruisce
un sistema che non scala alle prossime Eminenze.

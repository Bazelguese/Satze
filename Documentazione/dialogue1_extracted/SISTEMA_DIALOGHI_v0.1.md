# SISTEMA DIALOGHI — v0.1

*Logica di scrittura e selezione dei dialoghi delle carte. Pilota: Corte Rossa.*
*Febbraio 2026 — riusabile per tutte e 10 le armate.*

---

## 0. Due layer distinti

| Layer | File | Cosa fa |
|---|---|---|
| **Presentazione** | `satze-dialogue.js` / `.css` | *Come* si vede la battuta: font+effetto+colore firmati per armata, typewriter, codina. |
| **Contenuto** | `dialoghi-<armata>.js` + questo doc | *Cosa* dice, *quando*, *quale* riga si pesca. |

Il `flavour` in `cards.js` è **narrazione in terza persona** (il narratore). I dialoghi sono **l'agente che parla in prima persona, nel momento**. Non ricopiano il flavour.

**Regola di qualità:** la battuta migliore commenta la *meccanica* della carta. Karthessi copia il Potere → "lo indosso io". Il Giudice Blocca Bonus → "la tua armata perde ogni diritto". Se una riga potrebbe stare su qualsiasi carta, non è ancora abbastanza specifica.

---

## 1. Eventi di dialogo

Tre livelli. Il **budget di varianti è inverso alla frequenza**: tante righe dove l'evento capita spesso, una sola dove capita di rado.

| Evento | Freq. | Varianti | Registro tipico | Sicurezza |
|---|---|---|---|---|
| **CORE — ogni carta** | | | | |
| `entrata` | altissima | 2–4 | carattere / comico | pre-reveal, sempre sicuro |
| `vince` | alta | 1–2 | carattere / comico | post-reveal |
| `perde` | alta | 1–2 | comico / carattere | post-reveal |
| `morte` | bassa | 1 | carattere | rara → 1 basta |
| **ESTESO — carte che lo meritano** | | | | |
| `triggerAttivato` | media | 1–2 | carattere | aggancia dialogo↔meccanica |
| `statNemico.*` | media | 1 per fascia | stat | reveal (stat nemiche pubbliche) |
| `lore` | rarissima | 1 (`once`) | lore | non si ripete in partita |
| **FIRMA — poche carte** | | | | |
| `reattivo.*` | rara | 1 per coppia | reattivo | solo accoppiamenti scelti |

Investimento FC alto come evento è possibile **solo post-reveal** (altrimenti svela informazione segreta e rompe il bluff). Nel pilota non l'ho usato: `vince`/`perde` già coprono l'esito.

---

## 2. Registri e mappatura sulla frequenza

Cinque registri (`r`): `carattere`, `comico`, `lore`, `reattivo`, `stat`.

- **carattere / comico** → righe frequenti (entrata, vince, perde). Sono brevi e reggono i replay.
- **lore** → solo dove la frequenza è bassa (`lore` con `once:true`). Una nozione la spendi *una* volta: se la metti sull'entrata, dopo tre partite la mutano.
- **comico Corte** = ironia legalese/nera (l'Avvocato "c'è questa clausola…", l'Archivista "specialmente se l'hai dimenticato"), mai slapstick. Protegge il dark fantasy e non fa trapelare i Giocatori.

La voce di ogni armata si **deriva** dai suoi `LORE_*.md` (epigrafi + prosa), non si inventa. Corte Rossa: contrattuale, parassitaria, elegante-marcescente, perdita del nome/identità, "firmò", fame → demone, inevitabilità del debito.

---

## 3. Reazione alle stat nemiche

Gli Agenti sono **sempre visibili** (solo i FC sono segreti): reagire alle stat nemiche è informazione pubblica, non tocca il bluff. Per evitare l'esplosione combinatoria si reagisce a **fasce**, non a valori esatti, e solo dove la voce ha qualcosa da dire.

| Fascia | Soglia | Chiave |
|---|---|---|
| Colosso | POT ≥ 6 | `statNemico.colosso` |
| Fragile | POT ≤ 2 | `statNemico.fragile` |
| Spinato | DAN ≥ 5 | `statNemico.spinato` |

Fasce estendibili in v0.2 (es. *blindato* = DAN alto + POT bassa, *pari mio*). Una carta reagisce solo alle fasce coerenti col suo carattere (la Larva ha fame davanti al Colosso; Karthessi non ha *niente da copiare* davanti al Fragile).

---

## 4. In quali fasi del duello far parlare

Mappa sulle 7 fasi reali del regolamento. **Principio guida: silenzio assoluto mentre TU scegli i FC** — è la scelta di bluff, il momento cognitivo più importante; una carta che chiacchiera lì distrae dal calcolo. Il tempo morto da riempire è l'attesa mentre decide *l'avversario*.

| Fase | Chi decide | Parla? | Evento |
|---|---|---|---|
| Pre-turno (campo) | nessuno | raro | (ambientale, futuro) |
| Fase 1/2 — **tu** scegli FC | tu (attivo) | **no** | — proteggi il bluff |
| Fase 1/2 — **avversario** sceglie | l'altro | **sì** | `entrata` + idle d'attesa |
| Reveal FC (fine Fase 2) | nessuno | **sì** | `statNemico.*` (ora tutto pubblico) |
| Fase 3 — Poteri/Trigger | nessuno | **sì** | `triggerAttivato` |
| Fase 5 — esito scontro | nessuno | **sì** | `vince` / `perde` |
| Fase 7 — scarto Agenti | nessuno | **sì** | `morte` |

---

## 5. Selezione della riga

1. **Priorità per specificità:** `reattivo` > `statNemico` > `triggerAttivato` > core (`entrata`/`vince`/`perde`). L'evento più raro e specifico "ruba il microfono" alla riga generica.
2. **Random pesato** dentro al pool, con **anti-ripetizione immediata** (non ripescare l'ultima usata su quella carta).
3. **`once`** (lore): flag "già vista", non si ripete nella partita.
4. **Soppressione anti-spam:** una carta parla **al massimo una volta per scontro**; il resto è tagliato per priorità. Con "molti eventi" senza questa regola il box non sta mai zitto.

---

## 6. Convenzione markup (enfasi selettiva)

Testo **fermo** di default. Si anima solo ciò che marchi:

| Sintassi | Effetto |
|---|---|
| `*parola*` | la parola prende l'**effetto firma** dell'armata (Corte = `shake`) |
| `*frase intera!*` | tutta la frase animata (esclamazioni) |
| `{fx:parola}` | override con un effetto diverso, es. `{glitch:copiare}`, `{flicker:clausola}` |

Le esclamazioni sono **esplicite** (`*...*`), non auto-rilevate sul `!`: così tieni il controllo del ritmo (un'esclamazione può anche restare fredda). Retro-compat: `say({ emphasis:'all' })` anima tutta la riga (comportamento vecchio del kit).

Richiede il kit `satze-dialogue.js` **v0.2** (parser incluso). Verificato su `*firma*`, `{glitch:…}`, frase intera, testo puro.

---

## 7. Schema dati

```js
id: {
  entrata:  [ { t:"...", r:"carattere" }, ... ],   // t = testo (con markup), r = registro
  vince:    [ { t:"...", r:"carattere" } ],
  perde:    [ { t:"...", r:"comico" } ],
  triggerAttivato: [ { t:"...", r:"carattere" } ],
  statNemico: { colosso:[...], fragile:[...], spinato:[...] },
  reattivo:   { "Kethran":[...] },                 // chiave = nome armata da cards.js
  lore:     [ { t:"...", r:"lore", once:true } ],
  morte:    [ { t:"...", r:"carattere" } ]
}
// riga: { t, r, once?, fx? }   fx = override effetto sull'intera riga (opzionale)
```

Consumo col kit: risolto l'evento e pescata la riga, `box.say({ army:'corte', name: card.name, text: riga.t, x, y })`. Font/effetto-firma/colore arrivano dal preset `ARMY`; il markup nel testo fa il resto.

---

## 8. Budget per Lega (scala con l'importanza)

Non ogni carta merita il set completo: le giochi con peso e frequenza diversi.

| Lega | Righe indicative | Note |
|---|---|---|
| L5 | 10–14 | reggono lore + reattivo + più entrata |
| L4 | 9–11 | |
| L3 | 7–9 | |
| L2 | 6–8 | filler: set snello |

Pilota Corte: 20 carte, ~149 righe totali.

---

## 9. Stato

- **Fatto:** Corte Rossa (20 carte) → `dialoghi-corte.js`. Kit v0.2 con enfasi selettiva. Demo.
- **Corretto in corso d'opera:** *Mr. Cavalca Via* e *Piromante della Corte* non sono carte Corte (rispettivamente Patto e Enclave) — rimosse dal pilota. Trigger *Intervento* = giochi **secondo**, *Imboscata* = giochi **primo** (Larva riscritta di conseguenza).
- **Prossimo:** validare tono/ritmo in partita reale, poi seconda armata. Candidata forte: **Ratti della Megera** (voce glitch/scheming, firma già `glitch` nel kit) per testare un registro opposto alla Corte.
- **Aperto (v0.2):** fasce stat aggiuntive; regola di soppressione da implementare nel motore; eventuale evento `investimentoFC` post-reveal.

# SATZE — SISTEMA TAG AGENTI

*Documento di design: tassonomia e classificazione carte*
*Versione 2.0 — Marzo 2026*

---

## PANORAMICA

Ogni agente riceve tag da **6 categorie ortogonali**. Le prime 5 sono automatiche (derivate dalle stat e dal potere della carta). La sesta (Ruolo) è assegnata manualmente in base al contesto nel gameplan.

Una carta tipica avrà 5-8 tag. Esempio:
> **Nimrod, il Primo Re** — Lega 5, POT 7, DAN 3
> Resa dei conti: +2 DAN
> `Solido` `Sbilanciato` `POT Devastante` `DAN Medio` `Late Game` `Buffer` **`Boss`** **`Finisher`**

---

## CATEGORIA 1 — CORPO

*Quanto è forte il fisico della carta rispetto alla sua Lega?*

Derivazione automatica: POT + DAN confrontato con Lega × 2.

| Tag | Soglia | Significato per il giocatore |
|-----|--------|------------------------------|
| **Esile** | ≤ Lega×2 − 1 | Corpo debole per la Lega. Il potere compensa. |
| **Solido** | = Lega×2 | Corpo nella norma. Equilibrio stat/potere. |
| **Imponente** | ≥ Lega×2 + 1 | Corpo sopra la media. Potere debole o assente. |

### Soglie per Lega

| Lega | Esile | Solido | Imponente |
|------|-------|--------|-----------|
| 2 | ≤ 3 | 4 | ≥ 5 |
| 3 | ≤ 5 | 6 | ≥ 7 |
| 4 | ≤ 7 | 8 | ≥ 9 |
| 5 | ≤ 9 | 10 | ≥ 11 |

### Principio di design

Esile → può avere potere forte. Imponente → potere debole o assente. Solido → bilanciato. Eccezioni: carte Lega 5 flagship sono intenzionalmente sopra curva (Imponente + potere forte).

---

## CATEGORIA 2 — EQUILIBRIO

*Come sono distribuite le stat tra Potenza e Danno?*

Derivazione automatica: |POT − DAN|.

| Tag | Soglia | Significato per il giocatore |
|-----|--------|------------------------------|
| **Equilibrato** | |POT − DAN| ≤ 2 | Stat bilanciate. Versatile. |
| **Sbilanciato** | |POT − DAN| ≥ 3 | Una stat domina. Specialista. |

### Nota di design

Le carte sbilanciate tendono ad avere stat totali leggermente più alte come compensazione. Una carta 5/1 (sbilanciata, totale 6) è comune a Lega 3, dove il Solido è 6 — ma quella carta vince tanti duelli con POT 5 e fa pochissimo danno con DAN 1. Lo sbilanciamento è un tradeoff, non un difetto.

---

## CATEGORIA 3 — STAT ASSOLUTE

*Quanto è alta ogni singola statistica in termini assoluti?*

Derivazione automatica per ciascuna stat.

### Potenza (POT)

POT è la stat "gateway" — determina chi vince il duello.

| Tag | Soglia | Significato |
|-----|--------|-------------|
| **POT Bassa** | 1–2 | Perde la maggior parte dei duelli senza buff |
| **POT Media** | 3–4 | Competitiva con investimento FC |
| **POT Alta** | 5–6 | Vince molti duelli anche con poco FC |
| **POT Devastante** | 7+ | Domina i duelli. Raro. |

### Danno (DAN)

DAN determina quanti PV perde il perdente.

| Tag | Soglia | Significato |
|-----|--------|-------------|
| **DAN Basso** | 1–2 | Vittorie poco impattanti sui PV nemici |
| **DAN Medio** | 3 | Danno standard |
| **DAN Alto** | 4–5 | Vittorie dolorose per il nemico |
| **DAN Letale** | 6+ | Ogni vittoria è devastante. Raro. |

### Interazione con Equilibrio

Se una carta è Sbilanciata, una stat sarà necessariamente alta e l'altra bassa. I tag assoluti rendono esplicito *quale* stat domina:
- `Sbilanciato` + `POT Alta` + `DAN Basso` = "Vince tanto, fa poco male" (Tank naturale)
- `Sbilanciato` + `POT Bassa` + `DAN Alto` = "Perde spesso, ma quando vince fa malissimo" (Glass cannon)

---

## CATEGORIA 4 — POSTURA

*In quale situazione la carta dà il meglio?*

Derivazione automatica dal trigger.

| Tag | Trigger associati | Significato per il giocatore |
|-----|-------------------|------------------------------|
| **First Strike** | Imboscata | Colpisci per primo. Aggressione pura. |
| **Counter** | Intervento | Reagisci al nemico. Informazione. |
| **Momentum** | Gloria, Conquista, Magnanimo, Invasione, Sopraffare | Stai vincendo. Accelera il vantaggio. |
| **Comeback** | Vendetta, Ultimo Desiderio, Rimonta, Resistenza, Sfida | Stai perdendo. Recupera o resisti. |
| **All-in** | Overdrive | Scommetti tutto su un turno. |
| **Punisher** | Opportunista | Punisci azioni specifiche del nemico. |
| **Steady** | Sempre | Sempre attivo. Nessuna condizione. |
| **Late Game** | Resa dei conti, Ultima Chance | Si sveglia nei turni tardi. |
| **Early Rush** | Turbo | Forte solo T1-2, poi solo corpo. |

### Posture composte

Alcune carte possono avere posture multiple se il trigger e il bonus armata puntano in direzioni diverse (carte asso). In quel caso si taggano entrambe:
- Carta Sciame con trigger Intervento: `Counter` (dal trigger) ma bonus Imboscata favorisce `First Strike`. I tag riflettono solo il trigger della carta stessa, non il bonus armata.

### Nota: Sfida dentro Comeback

Sfida (Lega inferiore alla nemica) è classificata come Comeback perché meccanicamente premia il giocare "sotto peso". Non richiede di essere sotto PV, ma la filosofia è la stessa: sei in una posizione apparentemente svantaggiata e ne trai valore.

---

## CATEGORIA 5 — FUNZIONE

*Cosa fa meccanicamente il potere della carta?*

Derivazione automatica dall'effetto. Una carta può avere **più tag funzione** se il potere ha più componenti (es. "+1 POT, +1 DAN" = `Buffer`; "2 Danni dir." = `Closer`).

| Tag | Effetti associati | Significato per il giocatore |
|-----|-------------------|------------------------------|
| **Buffer** | +POT, +DAN, +VA | Potenzia la propria carta. |
| **Debuffer** | -POT nem., -DAN nem., -VA nem. | Indebolisce la carta nemica. |
| **Closer** | DAN diretto, Tossina | Infligge danno diretto ai PV. Ignora il duello. |
| **Tank** | Immune, Cura, -DAN nem. (su sé stessi) | Assorbe o mitiga il danno subito. |
| **Controller** | Blocca Potere, Blocca Bonus | Neutralizza le abilità del nemico. |
| **Mimic** | Copia POT, Copia DAN, Copia Potere | Ruba statistiche o abilità. |
| **Engine** | +FC | Genera risorse. |
| **Scaler** | Escalation, Attrizione | Diventa più forte col passare dei turni/conquiste. |
| **Converter** | Inversione | Trasforma i modificatori. Anti-debuff. |
| **Kamikaze** | -PV a te | Si danneggia per attivare condizioni o generare valore. |
| **Vanilla** | Nessun potere | Solo corpo. Nessun effetto da attivare. |

### Chiarimenti

**Debuffer vs Tank:** -DAN nem. (riduce il danno dell'avversario) è classificato `Debuffer` quando il potere modifica la stat nemica in modo offensivo (nell'ambito di una suite di debuff come i Ratti). Ma sulle carte Calibri dove il bonus armata è -2 DAN nem., l'effetto è difensivo — il contesto è mitigazione, non indebolimento. Per i tag, ci si basa sull'**intento primario**: se la carta è parte di un kit debuff → `Debuffer`. Se è protezione passiva → `Tank`.

**Buffer con componenti multiple:** "+1 POT, +1 DAN" è un singolo tag `Buffer`, non due.

**Closer + Buffer:** Una carta con "+2 POT" e "2 Danni dir." prende sia `Buffer` che `Closer`.

---

## CATEGORIA 6 — RUOLO

*Perché metti questa carta nel deck?*

Assegnazione **manuale** da parte del designer. Riflette la funzione strategica della carta nell'economia di un deck da 10 carte. Una carta può avere **1-2 tag ruolo**.

| Tag | Significato | Criteri tipici |
|-----|-------------|----------------|
| **Boss** | La punta del deck | Lega 5, sopra curva. La carta su cui costruisci la strategia. |
| **Finisher** | Chiude la partita | DAN Alto/Letale, oppure Danni dir. forte. Lo giochi per uccidere. |
| **Pillar** | Cuore del gameplan | Trigger convergente puro, massimo beneficio dal bonus armata. La carta che *vuoi* giocare ogni partita. |
| **Ace** | Forte fuori piano | Trigger o effetto in tensione col gameplan. Non si allinea al bonus armata, ma funziona dove le carte convergenti no. Piano B. |
| **Bomb** | Alto ceiling, basso floor | Grande divario tra Efficienza e Potenziale. Devastante se il trigger si attiva, mediocre altrimenti. |
| **Anchor** | Affidabile e costante | Trigger Sempre o alta affidabilità, bassa varianza. La carta che non ti delude mai. |
| **Flex** | Versatile, adattabile | Funziona in più piani. Buona in molte situazioni, eccellente in nessuna. |
| **Tech** | Risposta situazionale | Forte in certi matchup, debole in altri. Blocca Potere, Blocca Bonus, Inversione. La metti nel deck per un motivo specifico. |
| **Engine** | Genera valore nel tempo | +FC, Attrizione, Escalation. Non vince da sola, ma alimenta il resto del deck. |
| **Sacrifice** | Si immola per valore | Auto-danno, Ultimo Desiderio come piano primario. Perde il duello di proposito per generare vantaggio. |
| **Filler** | Riempie lo slot | Corpo solido, nessun ruolo speciale. Quando hai 9 carte buone e serve la decima. |

### Differenza tra Funzione e Ruolo

La **Funzione** descrive il *cosa* (meccanica). Il **Ruolo** descrive il *perché* (strategia).

Esempio:
- Sentinella Astrale (Comete, Lega 2, Vendetta: +3 POT): Funzione = `Buffer`. Ruolo = `Bomb` (Eff 1.76, Pot 2.81 — enorme varianza).
- Golem di Plasma (Calibri, Lega 3, Sempre: Copia POT): Funzione = `Mimic`. Ruolo = `Anchor` (Sempre = attivo ogni turno, affidabile).

### Pillar vs Ace

La distinzione chiave: un **Pillar** lavora *con* il bonus armata (trigger convergente + effetto convergente). Un **Ace** lavora *contro* il gameplan (trigger o effetto non convergente) ma crea opzioni alternative. I Pillar sono il piano A. Gli Ace sono il piano B.

---

## DERIVAZIONE AUTOMATICA

```
1. CORPO (da POT + DAN vs Lega)
   POT + DAN ≤ Lega×2 − 1 → Esile
   POT + DAN = Lega×2 → Solido
   POT + DAN ≥ Lega×2 + 1 → Imponente

2. EQUILIBRIO (da |POT − DAN|)
   |POT − DAN| ≤ 2 → Equilibrato
   |POT − DAN| ≥ 3 → Sbilanciato

3. STAT ASSOLUTE (da POT e DAN)
   POT 1-2 → POT Bassa | 3-4 → POT Media | 5-6 → POT Alta | 7+ → POT Devastante
   DAN 1-2 → DAN Basso | 3 → DAN Medio | 4-5 → DAN Alto | 6+ → DAN Letale

4. POSTURA (dal trigger)
   Imboscata → First Strike
   Intervento → Counter
   Gloria/Conquista/Magnanimo/Invasione/Sopraffare → Momentum
   Vendetta/Ultimo Desiderio/Rimonta/Resistenza/Sfida → Comeback
   Overdrive → All-in
   Opportunista → Punisher
   Sempre → Resa dei conti/Ultima Chance → Late Game
   Turbo → Early Rush

5. FUNZIONE (dall'effetto)
   +POT/+DAN/+VA → Buffer
   -POT/-DAN/-VA nem. → Debuffer
   Danni dir./Tossina → Closer
   Immune/Cura/-DAN nem.(difensivo) → Tank
   Blocca Potere/Blocca Bonus → Controller
   Copia POT/DAN/Potere → Mimic
   +FC → Engine
   Escalation/Attrizione → Scaler
   Inversione → Converter
   -PV a te → Kamikaze
   Nessun potere → Vanilla
```

### Tag manuali (categoria 6)

Assegnati dal designer carta per carta. Linee guida:

| Domanda | Se sì → Tag |
|---------|------------|
| È Lega 5 e sopra curva? | `Boss` |
| La metti nel deck per uccidere? | `Finisher` |
| È il cuore del piano dell'armata? | `Pillar` |
| Il trigger o l'effetto è in tensione col gameplan/bonus armata? | `Ace` |
| Ha varianza Eff/Pot > 0.8? | `Bomb` |
| Ha trigger Sempre o alta affidabilità + bassa varianza? | `Anchor` |
| Funziona in 3+ matchup diversi senza eccellere? | `Flex` |
| La metti per un matchup specifico? | `Tech` |
| Genera valore incrementale nel tempo? | `Engine` |
| Si immola di proposito? | `Sacrifice` |
| Niente di speciale, riempie il deck? | `Filler` |

---

## NOTE PER L'IMPLEMENTAZIONE UI

### Visualizzazione tag

Tutti i tag appaiono come badge **grigi** tranne il tag Ruolo (Categoria 6) che è **rosso**.

| Categoria | Colore | Posizione |
|-----------|--------|-----------|
| Corpo | Grigio | Sotto le stat |
| Equilibrio | Grigio | Accanto a Corpo |
| Stat Assolute (POT/DAN) | Grigio | Accanto ai numeri |
| Postura | Grigio | Accanto al trigger |
| Funzione | Grigio | Accanto al potere |
| **Ruolo** | **Rosso** | **In alto, badge prominente** |

### Filtri deck builder

Il sistema di tag abilita filtri potenti nel deck builder:
- "Mostrami tutte le carte `Comeback` + `Buffer`" → le carte che ti potenziano quando stai perdendo
- "Mostrami tutte le carte `Imponente`" → i muri con corpo grosso
- "Mostrami tutte le carte `Tech`" → le risposte situazionali

### Tooltip

Ogni tag dovrebbe avere un tooltip breve al mouse-over con la spiegazione da questo documento.

---

## CATALOGO COMPLETO TAG PER CARTA

*120 carte — 8 armate — Post-rework Marzo 2026*

Legenda colonne: **C** = Corpo, **E** = Equilibrio, **P** = POT, **D** = DAN, **Post.** = Postura, **Funz.** = Funzione, **Ruolo** = Ruolo (rosso in-game)

---

### FIGLI DELL'ORIZZONTE

**Bonus:** Sempre: -2 VA nem.

| # | Nome | L | POT/DAN | C | E | P | D | Post. | Funz. | Ruolo |
|---|------|---|---------|---|---|---|---|-------|-------|-------|
| 101 | Sorethal, il Primo Ancorante | 5 | 6/4 | Solido | Equilibrato | Alta | Alto | Steady | Debuffer | Boss, Anchor |
| 111 | L'Eco del Primo Sole | 5 | 5/6 | Imponente | Equilibrato | Alta | Letale | Early Rush | Buffer | Boss, Bomb |
| 102 | Tessitrice della Trama | 4 | 5/3 | Solido | Equilibrato | Alta | Medio | Momentum | Engine | Pillar |
| 103 | Portatore della Domanda | 4 | 4/4 | Solido | Equilibrato | Media | Alto | Late Game | Debuffer | Pillar |
| 105 | Richiamante dell'Ordine | 4 | 5/3 | Solido | Equilibrato | Alta | Medio | Early Rush | Closer | Ace, Finisher |
| 112 | Serath, Che Mangia il Dopo | 4 | 6/3 | Imponente | Sbilanciato | Alta | Medio | Late Game | Controller | Pillar, Tech |
| 104 | Cartografo del Vuoto | 3 | 3/3 | Solido | Equilibrato | Media | Medio | Punisher | Engine | Pillar |
| 106 | Condensato per la Guerra | 3 | 1/4 | Esile | Sbilanciato | Bassa | Alto | Steady | Scaler | Engine, Anchor |
| 113 | L'Ultimo Specchio di Oris | 3 | 1/4 | Esile | Sbilanciato | Bassa | Alto | Steady | Mimic | Anchor, Tech |
| 114 | Il Portatore della Campana | 3 | 4/3 | Imponente | Equilibrato | Media | Medio | Momentum | Buffer | Pillar |
| 107 | Eco Svanente | 2 | 3/1 | Solido | Equilibrato | Media | Basso | Steady | Controller | Anchor, Tech |
| 108 | Leggero Richiamato | 2 | 3/1 | Solido | Equilibrato | Media | Basso | Late Game | Closer | Ace, Finisher |
| 109 | Naela, la Prima Sognatrice | 2 | 3/1 | Solido | Equilibrato | Media | Basso | Comeback | Buffer | Ace, Bomb |
| 110 | Ashara, la Volontaria | 2 | 2/2 | Solido | Equilibrato | Bassa | Basso | First Strike | Buffer | Ace, Bomb |
| 115 | Vethan, Guerriero per un Giorno | 2 | 3/1 | Solido | Equilibrato | Media | Basso | Momentum | Engine | Pillar |

---

### KETHRAN

**Bonus:** Vendetta: +1 POT

| # | Nome | L | POT/DAN | C | E | P | D | Post. | Funz. | Ruolo |
|---|------|---|---------|---|---|---|---|-------|-------|-------|
| 201 | Ur-Nammu il Conquistatore | 5 | 6/5 | Imponente | Equilibrato | Alta | Alto | Momentum | Buffer | Boss |
| 211 | Nimrod, il Primo Re | 5 | 7/3 | Solido | Sbilanciato | Devastante | Medio | Late Game | Buffer | Boss, Finisher |
| 202 | Profeta delle Rovine | 4 | 5/4 | Imponente | Equilibrato | Alta | Alto | Comeback | Buffer | Pillar, Finisher |
| 203 | Araldo della Fine | 4 | 4/3 | Esile | Equilibrato | Media | Medio | Comeback | Closer | Sacrifice, Finisher |
| 212 | Spirito della Spira | 4 | 4/4 | Solido | Equilibrato | Media | Alto | Comeback | Tank | Ace, Tech |
| 213 | Eco del Tradimento | 4 | 2/5 | Esile | Sbilanciato | Bassa | Alto | Momentum | Buffer, Scaler | Ace, Scaler |
| 204 | Custode della Ziqqurat | 3 | 4/2 | Solido | Equilibrato | Media | Basso | Steady | Controller | Anchor, Tech |
| 205 | Sacerdote della Ricomposizione | 3 | 3/3 | Solido | Equilibrato | Media | Medio | Comeback | Buffer | Ace |
| 206 | Berserker della Spira | 3 | 4/3 | Imponente | Equilibrato | Media | Medio | Comeback | Buffer | Pillar |
| 214 | Il Primo Mattone | 3 | 5/1 | Solido | Sbilanciato | Alta | Basso | Momentum | Kamikaze | Sacrifice |
| 207 | Seguace Fanatico | 2 | 3/1 | Solido | Equilibrato | Media | Basso | Momentum | Buffer | Ace, Bomb |
| 208 | Costruttore Maledetto | 2 | 2/1 | Esile | Equilibrato | Bassa | Basso | Comeback | Buffer | Pillar |
| 209 | Ombra della Spira | 2 | 2/3 | Imponente | Equilibrato | Bassa | Medio | Momentum | Engine | Ace |
| 210 | Martire della Spira | 2 | 2/2 | Solido | Equilibrato | Bassa | Basso | Comeback | Closer | Sacrifice, Finisher |
| 215 | Ultimo Testimone | 2 | 4/1 | Imponente | Sbilanciato | Media | Basso | Comeback | Tank | Sacrifice, Tank |

---

### CALIBRI PESANTI

**Bonus:** Sempre: -2 DAN nem. (min 2)

| # | Nome | L | POT/DAN | C | E | P | D | Post. | Funz. | Ruolo |
|---|------|---|---------|---|---|---|---|-------|-------|-------|
| 401 | Titano Corazzato MK-IV | 5 | 6/6 | Imponente | Equilibrato | Alta | Letale | Steady | Tank | Boss, Finisher |
| 411 | Protocollo Cenere | 5 | 4/4 | Esile | Equilibrato | Media | Alto | Momentum | Closer | Boss, Finisher |
| 402 | Nucleo di Comando Nord | 4 | 4/5 | Imponente | Equilibrato | Media | Alto | All-in | Buffer | Pillar |
| 403 | Bastione Ambulante | 4 | 4/4 | Solido | Equilibrato | Media | Alto | All-in | Engine | Pillar |
| 412 | Pugno del Fronte Ovest | 4 | 6/2 | Solido | Sbilanciato | Alta | Basso | Momentum | Buffer | Ace |
| 413 | Cannone Semovente | 4 | 5/4 | Imponente | Equilibrato | Alta | Alto | All-in | Closer | Pillar, Finisher |
| 404 | Tecnico di Prima Linea | 3 | 5/1 | Solido | Sbilanciato | Alta | Basso | Comeback | Tank | Ace, Tank |
| 405 | Guardiano di Settore | 3 | 5/2 | Imponente | Sbilanciato | Alta | Basso | Comeback | Controller | Ace, Tech |
| 406 | Analista da Combattimento | 3 | 2/3 | Esile | Equilibrato | Bassa | Medio | Steady | Scaler | Engine, Anchor |
| 414 | Raccoglitore del Campo | 3 | 4/3 | Imponente | Equilibrato | Media | Medio | Momentum | Engine | Ace |
| 415 | Protocollo di Emergenza | 3 | 4/1 | Esile | Sbilanciato | Media | Basso | Comeback | Buffer | Pillar |
| 407 | Drone Cacciatore X-9 | 2 | 3/1 | Solido | Equilibrato | Media | Basso | First Strike | Closer | Ace, Finisher |
| 408 | Operaio Meccanico | 2 | 2/2 | Solido | Equilibrato | Bassa | Basso | Steady | Debuffer | Anchor |
| 409 | Occhio del Fronte Est | 2 | 2/1 | Esile | Equilibrato | Bassa | Basso | Comeback | Buffer | Ace, Bomb |
| 410 | Orecchio del Fronte Sud | 2 | 3/2 | Imponente | Equilibrato | Media | Basso | Comeback | Engine | Sacrifice |

---

### CORTE ROSSA

**Bonus:** Intervento: -2 POT nem. (min 2)

| # | Nome | L | POT/DAN | C | E | P | D | Post. | Funz. | Ruolo |
|---|------|---|---------|---|---|---|---|-------|-------|-------|
| 301 | Vaelith Sorn, il Primo | 5 | 7/3 | Solido | Sbilanciato | Devastante | Medio | Momentum | Closer | Boss, Finisher |
| 311 | Generale Karthessi | 5 | 5/4 | Esile | Equilibrato | Alta | Alto | Late Game | Mimic | Boss |
| 302 | L'Estrattrice | 4 | 5/4 | Imponente | Equilibrato | Alta | Alto | Counter | Mimic | Pillar |
| 303 | Esattore Infernale | 4 | 5/4 | Imponente | Equilibrato | Alta | Alto | Punisher | Debuffer | Pillar |
| 312 | Artigiano Velithari | 4 | 6/3 | Imponente | Sbilanciato | Alta | Medio | Comeback | Closer | Ace, Finisher |
| 304 | Tentatore d'Anime | 3 | 4/2 | Solido | Equilibrato | Media | Basso | Steady | Controller | Anchor, Tech |
| 305 | Avvocato del Diavolo | 3 | 2/5 | Imponente | Sbilanciato | Bassa | Alto | First Strike | Mimic | Ace |
| 306 | Giudice Corrotto | 3 | 3/3 | Solido | Equilibrato | Media | Medio | Late Game | Controller | Pillar, Tech |
| 313 | Dammeri Spezzato | 3 | 2/3 | Esile | Equilibrato | Bassa | Medio | Counter | Debuffer | Pillar |
| 314 | Debitore Trasformato | 3 | 4/4 | Imponente | Equilibrato | Media | Alto | Comeback | Buffer | Ace |
| 307 | Archivista degli Obblighi | 2 | 2/2 | Solido | Equilibrato | Bassa | Basso | Counter | Debuffer | Pillar |
| 308 | Messaggero Burlone | 2 | 3/3 | Imponente | Equilibrato | Media | Medio | First Strike | Buffer | Ace |
| 309 | Ombra del Creditore | 2 | 3/2 | Imponente | Equilibrato | Media | Basso | First Strike | Debuffer | Pillar |
| 310 | Anima Dannata | 2 | 3/1 | Solido | Equilibrato | Media | Basso | Comeback | Buffer | Ace |
| 315 | Larva della Corte | 2 | 1/3 | Solido | Equilibrato | Bassa | Medio | Counter | Buffer | Pillar |

---

### ORATHAI

**Bonus:** +1 DAN [Sempre]

| # | Nome | L | POT/DAN | C | E | P | D | Post. | Funz. | Ruolo |
|---|------|---|---------|---|---|---|---|-------|-------|-------|
| 501 | Voce della Fine | 5 | 5/5 | Solido | Equilibrato | Alta | Alto | Momentum | Buffer | Boss |
| 511 | La Tempesta Cava | 5 | 6/2 | Esile | Sbilanciato | Alta | Basso | All-in | Buffer | Boss, Bomb |
| 502 | Radice dei Caduti | 4 | 5/3 | Solido | Equilibrato | Alta | Medio | Momentum | Engine | Pillar |
| 503 | L'Eco Vivente | 4 | 7/2 | Imponente | Sbilanciato | Devastante | Basso | Momentum | Buffer | Pillar, Finisher |
| 512 | Il Parassita Armonico | 4 | 3/5 | Solido | Equilibrato | Media | Alto | Counter | Mimic | Ace |
| 504 | La Spina nel Bosco | 3 | 4/3 | Imponente | Equilibrato | Media | Medio | Steady | Controller | Anchor, Tech |
| 505 | L'Albero della Linfa d'Oro | 3 | 5/2 | Imponente | Sbilanciato | Alta | Basso | Momentum | Engine | Pillar |
| 506 | Il Cacciatore Paziente | 3 | 5/2 | Imponente | Sbilanciato | Alta | Basso | First Strike | Buffer | Ace |
| 513 | Il Canto della Cenere | 3 | 5/2 | Imponente | Sbilanciato | Alta | Basso | Comeback | Tank | Ace, Tank |
| 514 | L'Albero dei Trofei | 3 | 3/3 | Solido | Equilibrato | Media | Medio | Momentum | Tank | Pillar, Tank |
| 507 | Il Germoglio Ostinato | 2 | 4/1 | Imponente | Sbilanciato | Media | Basso | Comeback | Closer | Ace |
| 508 | Il Muschio Curativo | 2 | 3/1 | Solido | Equilibrato | Media | Basso | Steady | Tank | Anchor, Tank |
| 509 | Il Seme Finale | 2 | 3/1 | Solido | Equilibrato | Media | Basso | Comeback | Engine | Sacrifice |
| 510 | La Guida del Bosco | 2 | 2/1 | Esile | Equilibrato | Bassa | Basso | Early Rush | Buffer | Ace, Bomb |
| 515 | Il Fiore della Vittoria | 2 | 1/3 | Solido | Equilibrato | Bassa | Medio | Momentum | Buffer | Pillar, Bomb |

---

### NATI DALLA BOCCA

**Bonus:** Imboscata: +1 POT, +1 DAN [Sempre]

| # | Nome | L | POT/DAN | C | E | P | D | Post. | Funz. | Ruolo |
|---|------|---|---------|---|---|---|---|-------|-------|-------|
| 601 | Regina della Colonia | 5 | 6/4 | Solido | Equilibrato | Alta | Alto | Late Game | Tank | Boss |
| 611 | L'Evoluzione Finale | 5 | 6/3 | Esile | Sbilanciato | Alta | Medio | Early Rush | Buffer | Boss, Bomb |
| 602 | Bruto Corazzato | 4 | 5/4 | Imponente | Equilibrato | Alta | Alto | Momentum | Scaler | Pillar, Scaler |
| 603 | Divoratore di Menti | 4 | 3/4 | Esile | Equilibrato | Media | Alto | Counter | Mimic | Ace |
| 612 | Vedova Viola | 4 | 5/2 | Esile | Sbilanciato | Alta | Basso | Counter | Debuffer | Ace |
| 604 | L'Apripista | 3 | 4/4 | Imponente | Equilibrato | Media | Alto | First Strike | Buffer | Pillar |
| 605 | Il Sempre Affamato | 3 | 6/1 | Imponente | Sbilanciato | Alta | Basso | Counter | Buffer | Ace |
| 606 | Il Seminatore di Rovina | 3 | 5/2 | Imponente | Sbilanciato | Alta | Basso | Momentum | Closer | Pillar, Finisher |
| 613 | Il Corno Vendicativo | 3 | 3/3 | Solido | Equilibrato | Media | Medio | Comeback | Buffer | Ace |
| 614 | L'Interrutore | 3 | 4/3 | Imponente | Equilibrato | Media | Medio | First Strike | Controller | Pillar, Tech |
| 607 | Larva Esplosiva | 2 | 4/1 | Imponente | Sbilanciato | Media | Basso | First Strike | Kamikaze | Pillar |
| 608 | Larva Parassita | 2 | 2/2 | Solido | Equilibrato | Bassa | Basso | Late Game | Scaler | Pillar, Scaler |
| 609 | Il Nido Ambulante | 2 | 4/2 | Imponente | Equilibrato | Media | Basso | Comeback | Kamikaze | Sacrifice |
| 610 | L'Ago Nascosto | 2 | 1/2 | Esile | Equilibrato | Bassa | Basso | First Strike | Buffer | Pillar, Bomb |
| 615 | Zanzara Furiosa | 2 | 3/2 | Imponente | Equilibrato | Media | Basso | Comeback | Closer | Ace, Finisher |

---

### ENCLAVE DELLE SCAGLIE

**Bonus:** Conquista: +2 FC

| # | Nome | L | POT/DAN | C | E | P | D | Post. | Funz. | Ruolo |
|---|------|---|---------|---|---|---|---|-------|-------|-------|
| 701 | Patriarca dell'Enclave | 5 | 7/5 | Imponente | Equilibrato | Devastante | Alto | Momentum | Buffer | Boss |
| 711 | Drago Antico Addormentato | 5 | 6/4 | Solido | Equilibrato | Alta | Alto | Comeback | Tank | Boss, Tank |
| 702 | Custode del Tesoro | 4 | 5/3 | Solido | Equilibrato | Alta | Medio | First Strike | Scaler | Pillar, Scaler |
| 703 | Cavaliere del Wyrm | 4 | 4/3 | Esile | Equilibrato | Media | Medio | Early Rush | Buffer | Ace |
| 712 | Piromante della Corte | 4 | 6/1 | Esile | Sbilanciato | Alta | Basso | Momentum | Closer | Pillar, Finisher |
| 713 | Divoratore d'Oro | 4 | 3/3 | Esile | Equilibrato | Media | Medio | All-in | Buffer | Ace, Bomb |
| 704 | Guardiano della Tana | 3 | 5/2 | Imponente | Sbilanciato | Alta | Basso | Counter | Controller | Ace, Tech |
| 705 | Predatore Alato | 3 | 4/3 | Imponente | Equilibrato | Media | Medio | First Strike | Buffer | Pillar |
| 714 | Incantatore di Scaglie | 3 | 4/2 | Solido | Equilibrato | Media | Basso | Momentum | Buffer | Pillar |
| 715 | Araldo della Fiamma | 3 | 3/4 | Imponente | Equilibrato | Media | Alto | Momentum | Buffer | Pillar, Bomb |
| 706 | Draghetto Famelico | 2 | 3/2 | Imponente | Equilibrato | Media | Basso | All-in | Buffer | Pillar, Bomb |
| 707 | Scaglia Errante | 2 | 2/2 | Solido | Equilibrato | Bassa | Basso | Late Game | Buffer | Ace |
| 708 | Servo del Tesoro | 2 | 2/1 | Esile | Equilibrato | Bassa | Basso | Comeback | Engine | Sacrifice |
| 709 | Sputafuoco Giovane | 2 | 3/1 | Solido | Equilibrato | Media | Basso | Late Game | Buffer | Pillar |
| 710 | Uovo di Drago | 2 | 1/2 | Esile | Equilibrato | Bassa | Basso | Late Game | Buffer | Ace, Bomb |

---

### RATTI DELLA MEGERA

**Bonus:** Conquista: Tossina 2 (min 4)

| # | Nome | L | POT/DAN | C | E | P | D | Post. | Funz. | Ruolo |
|---|------|---|---------|---|---|---|---|-------|-------|-------|
| 801 | La Megera | 5 | 6/4 | Solido | Equilibrato | Alta | Alto | Steady | Controller | Boss, Anchor |
| 811 | Flagello della Megera | 5 | 6/3 | Esile | Sbilanciato | Alta | Medio | First Strike | Debuffer | Boss |
| 802 | Portatore di Peste | 4 | 5/2 | Esile | Sbilanciato | Alta | Basso | Counter | Debuffer | Pillar |
| 803 | Strega della Megera | 4 | 4/3 | Esile | Equilibrato | Media | Medio | Momentum | Debuffer | Ace |
| 812 | Sciamano Corrotto | 4 | 4/4 | Solido | Equilibrato | Media | Alto | Counter | Debuffer | Pillar |
| 813 | Ratto Gigante | 4 | 5/2 | Esile | Sbilanciato | Alta | Basso | Comeback | Buffer | Ace, Bomb |
| 804 | Untore Silenzioso | 3 | 4/2 | Solido | Equilibrato | Media | Basso | Punisher | Closer | Pillar |
| 805 | Ratto delle Ombre | 3 | 4/1 | Esile | Sbilanciato | Media | Basso | Counter | Debuffer | Pillar |
| 814 | Divoratore di Speranza | 3 | 5/1 | Solido | Sbilanciato | Alta | Basso | Comeback | Closer | Sacrifice |
| 815 | Custode della Fogna | 3 | 4/2 | Solido | Equilibrato | Media | Basso | Counter | Controller | Pillar, Tech |
| 806 | Ratto Infetto | 2 | 3/1 | Solido | Equilibrato | Media | Basso | Late Game | Closer | Pillar |
| 807 | Spia della Megera | 2 | 4/1 | Imponente | Sbilanciato | Media | Basso | First Strike | Debuffer | Pillar |
| 808 | Portatore di Ossa | 2 | 3/2 | Imponente | Equilibrato | Media | Basso | Comeback | Closer | Sacrifice, Finisher |
| 809 | Larva Strisciante | 2 | 1/1 | Esile | Equilibrato | Bassa | Basso | Comeback | Debuffer | Sacrifice |
| 810 | Ratto Moribondo | 2 | 3/2 | Imponente | Equilibrato | Media | Basso | Punisher | Closer | Pillar, Finisher |

---

*Sistema Tag Agenti — SATZE — Versione 2.0 — Marzo 2026*

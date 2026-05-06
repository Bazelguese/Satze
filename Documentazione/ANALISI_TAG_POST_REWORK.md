# SATZE — ANALISI TAG POST-REWORK

*Tutte le 8 armate — **20 carte ciascuna** — Maggio 2026*

**Fonti:** `src/data/cards.js` (effetti e trigger), `src/data/armies.js` (bonus armata).  
**Novità rispetto a Marzo 2026:** +5 carte per armata; nuovi effetti ricorrenti **Inversione** (riflette modificatori esterni), **Escalation** (scala con campi o meccaniche indicate in carta), **Attrizione**, **Copia Bonus** (solo su alcune carte), debuff VA più profondi su singole unità, boss con **selfDamage** su Conquista (Kethran), ecc.

**Nota metodologica:** Corpo (Esile / Solido / Imponente) ed equilibrio POT/DAN usano le **soglie assolute** del glossario (|POT−DAN| ≤ 2 → Equilibrato). **Postura** è mappata dal *trigger* di attivazione (Imboscata → First Strike, Rimonta → Comeback, …). **Funzione** e **Ruolo** sono etichette di design euristiche (coerenti col set precedente), non regole di engine.

---

## Figli dell'Orizzonte

**Bonus armata:** -5 VA nem. (min 6). Attivazione: sempre (nessun trigger).

**Corpo:** **Solido** 65% (13) · **Imponente** 20% (4) · **Esile** 15% (3)

**Equilibrio:** **Equilibrato** 75% (15) · **Sbilanciato** 25% (5)

**POT:** **POT Media** 55% (11) · **POT Alta** 30% (6) · **POT Bassa** 15% (3)

**DAN:** **DAN Medio** 40% (8) · **DAN Basso** 30% (6) · **DAN Alto** 20% (4) · **DAN Letale** 10% (2)

**Postura:** **Steady** 25% (5) · **Late Game** 25% (5) · **Momentum** 20% (4) · **Early Rush** 10% (2) · **First Strike** 10% (2) · **Punisher** 5% (1) · **Comeback** 5% (1)

**Funzione (euristica):** **Buffer** 25% (5) · **Debuffer** 20% (4) · **Engine** 20% (4) · **Closer** 10% (2) · **Scaler** 10% (2) · **Controller** 10% (2) · **Mimic** 5% (1)

| # | Nome | Corpo | Equil. | POT | DAN | Postura | Funzione | Ruolo |
|---|------|-------|--------|-----|-----|---------|----------|-------|
| 101 | Sorethal, il Primo Ancorante | Imponente | Equilibrato | POT Alta | DAN Alto | Steady | Debuffer | Boss, Pillar |
| 102 | Tessitrice della Trama | Solido | Equilibrato | POT Alta | DAN Medio | Momentum | Engine | Pillar |
| 103 | Portatore della Domanda | Solido | Equilibrato | POT Media | DAN Alto | Late Game | Debuffer | Pillar |
| 104 | Cartografo del Vuoto | Solido | Equilibrato | POT Media | DAN Medio | Punisher | Engine | Pillar |
| 105 | Richiamante dell'Ordine | Solido | Equilibrato | POT Alta | DAN Medio | Early Rush | Closer | Finisher |
| 106 | Condensato per la Guerra | Esile | Sbilanciato | POT Bassa | DAN Alto | Steady | Scaler | Scaler |
| 107 | Eco Svanente | Solido | Equilibrato | POT Media | DAN Basso | Steady | Controller | Ace |
| 108 | Leggero Richiamato | Solido | Equilibrato | POT Media | DAN Basso | Late Game | Closer | Finisher |
| 109 | Naela, la Prima Sognatrice | Solido | Equilibrato | POT Media | DAN Basso | Comeback | Buffer | Ace |
| 110 | Ashara, la Volontaria | Esile | Equilibrato | POT Bassa | DAN Medio | First Strike | Buffer | Ace |
| 111 | L'Eco del Primo Sole | Imponente | Equilibrato | POT Alta | DAN Letale | Early Rush | Buffer | Boss, Ace |
| 112 | Serath, Che Mangia il Dopo | Imponente | Sbilanciato | POT Alta | DAN Medio | Late Game | Controller | Ace |
| 113 | L'Ultimo Specchio di Oris | Esile | Sbilanciato | POT Bassa | DAN Alto | Steady | Mimic | Tech |
| 114 | Il Portatore della Campana | Solido | Equilibrato | POT Media | DAN Medio | Momentum | Buffer | Ace |
| 115 | Vethan, Guerriero per un Giorno | Solido | Equilibrato | POT Media | DAN Basso | Momentum | Engine | Pillar |
| 116 | Vega, il Sofferente | Imponente | Equilibrato | POT Media | DAN Letale | Late Game | Buffer | Boss, Ace |
| 117 | Prete dell'Ancora | Solido | Sbilanciato | POT Alta | DAN Medio | Momentum | Engine | Pillar |
| 118 | Cometa alla Deriva | Solido | Sbilanciato | POT Media | DAN Basso | Steady | Scaler | Scaler |
| 119 | Vittima della Domanda | Solido | Equilibrato | POT Media | DAN Medio | Late Game | Debuffer | Ace |
| 120 | Richiamato Smantellato | Solido | Equilibrato | POT Media | DAN Basso | First Strike | Debuffer | Ace |

**Osservazioni (Maggio 2026):**
- **Stack VA:** bonus armata −5 VA (min 6) più carte −VA su Resa dei conti o Sempre resta uno dei piani più opprimenti in meta teorico; **119** e **120** aggiungono rispettivamente **Resa dei conti** e **Imboscata** difensiva (−2 DAN nem.).
- **116 Vega** (Ultima Chance +4 POT) e **117 Prete** (Gloria +2 FC) coprono tarda partita ed economia FC senza duplicare troppo il vecchio nucleo.

---

## Kethran

**Bonus armata:** Rimonta: +2 POT. Attivazione (dati): trigger `vendetta` — vedi `src/data/triggers.js` e glossario per l'etichetta mostrata in partita.

**Corpo:** **Solido** 55% (11) · **Esile** 25% (5) · **Imponente** 20% (4)

**Equilibrio:** **Equilibrato** 70% (14) · **Sbilanciato** 30% (6)

**POT:** **POT Media** 45% (9) · **POT Bassa** 30% (6) · **POT Alta** 20% (4) · **POT Devastante** 5% (1)

**DAN:** **DAN Medio** 55% (11) · **DAN Basso** 20% (4) · **DAN Letale** 15% (3) · **DAN Alto** 10% (2)

**Postura:** **Comeback** 50% (10) · **Momentum** 25% (5) · **Steady** 20% (4) · **Late Game** 5% (1)

**Funzione (euristica):** **Buffer** 35% (7) · **Closer** 15% (3) · **Tank** 15% (3) · **Kamikaze** 10% (2) · **Controller** 5% (1) · **Engine** 5% (1) · **Scaler** 5% (1) · **Debuffer** 5% (1) · **Mimic** 5% (1)

| # | Nome | Corpo | Equil. | POT | DAN | Postura | Funzione | Ruolo |
|---|------|-------|--------|-----|-----|---------|----------|-------|
| 201 | Ur-Nammu il Conquistatore | Imponente | Equilibrato | POT Alta | DAN Letale | Momentum | Buffer | Boss, Ace |
| 202 | Profeta delle Rovine | Imponente | Equilibrato | POT Alta | DAN Alto | Comeback | Buffer | Ace |
| 203 | Araldo della Fine | Solido | Equilibrato | POT Media | DAN Medio | Comeback | Closer | Finisher |
| 204 | Custode della Ziqqurat | Solido | Equilibrato | POT Media | DAN Medio | Steady | Controller | Ace |
| 205 | Sacerdote della Ricomposizione | Solido | Equilibrato | POT Media | DAN Medio | Comeback | Buffer | Ace |
| 206 | Berserker della Spira | Solido | Equilibrato | POT Media | DAN Medio | Comeback | Buffer | Ace |
| 207 | Seguace Fanatico | Solido | Equilibrato | POT Media | DAN Basso | Momentum | Buffer | Ace |
| 208 | Costruttore Maledetto | Esile | Equilibrato | POT Bassa | DAN Basso | Comeback | Buffer | Ace |
| 209 | Ombra della Spira | Esile | Equilibrato | POT Bassa | DAN Medio | Momentum | Engine | Pillar |
| 210 | Martire della Spira | Esile | Equilibrato | POT Bassa | DAN Medio | Comeback | Closer | Finisher |
| 211 | Nimrod, il Primo Re | Imponente | Sbilanciato | POT Devastante | DAN Medio | Late Game | Buffer | Boss, Ace |
| 212 | Spirito della Spira | Solido | Equilibrato | POT Media | DAN Alto | Comeback | Tank | Tank |
| 213 | Eco del Tradimento | Esile | Sbilanciato | POT Bassa | DAN Letale | Steady | Scaler | Scaler |
| 214 | Il Primo Mattone | Solido | Sbilanciato | POT Alta | DAN Basso | Momentum | Kamikaze | Finisher |
| 215 | Ultimo Testimone | Solido | Sbilanciato | POT Media | DAN Basso | Comeback | Tank | Ace |
| 216 | Crepuscolo, l'Assassino di Soli | Imponente | Sbilanciato | POT Alta | DAN Medio | Momentum | Kamikaze | Boss, Finisher |
| 217 | Chimera | Esile | Sbilanciato | POT Bassa | DAN Letale | Steady | Debuffer | Pillar |
| 218 | Frammento del Conquistatore | Solido | Equilibrato | POT Bassa | DAN Medio | Comeback | Mimic | Tech |
| 219 | La Marea Composita | Solido | Equilibrato | POT Media | DAN Medio | Comeback | Closer | Finisher |
| 220 | Mezzanotte, il Mai Nato | Solido | Equilibrato | POT Media | DAN Medio | Steady | Tank | Ace |

**Osservazioni (Maggio 2026):**
- **216–220:** selfDamage su Conquista, −4 POT nem. sempre, Copia POT su Rimonta, danni diretti su Rimonta, **Inversione** sempre — alta varianza e tech contro effetti esterni.
- Sinergia col bonus **Rimonta: +2 POT** quando sei sotto PV; le nuove L5/L4 premiano ancora il gioco da svantaggio.

---

## Corte Rossa

**Bonus armata:** Copia Bonus nemico. Attivazione: sempre (nessun trigger).

**Corpo:** **Solido** 55% (11) · **Imponente** 30% (6) · **Esile** 15% (3)

**Equilibrio:** **Equilibrato** 70% (14) · **Sbilanciato** 30% (6)

**POT:** **POT Media** 40% (8) · **POT Alta** 35% (7) · **POT Bassa** 20% (4) · **POT Devastante** 5% (1)

**DAN:** **DAN Medio** 55% (11) · **DAN Alto** 20% (4) · **DAN Basso** 15% (3) · **DAN Letale** 10% (2)

**Postura:** **Counter** 30% (6) · **Comeback** 20% (4) · **First Strike** 15% (3) · **Late Game** 15% (3) · **Steady** 10% (2) · **Momentum** 5% (1) · **Punisher** 5% (1)

**Funzione (euristica):** **Closer** 20% (4) · **Mimic** 20% (4) · **Debuffer** 20% (4) · **Buffer** 20% (4) · **Controller** 15% (3) · **Tank** 5% (1)

| # | Nome | Corpo | Equil. | POT | DAN | Postura | Funzione | Ruolo |
|---|------|-------|--------|-----|-----|---------|----------|-------|
| 301 | Vaelith Sorn, il Primo | Imponente | Sbilanciato | POT Devastante | DAN Medio | Momentum | Closer | Boss, Finisher |
| 302 | L'Estrattrice | Imponente | Equilibrato | POT Alta | DAN Alto | Counter | Mimic | Tech |
| 303 | Esattore Infernale | Imponente | Equilibrato | POT Alta | DAN Alto | Punisher | Debuffer | Pillar |
| 304 | Tentatore d'Anime | Solido | Equilibrato | POT Media | DAN Medio | Steady | Controller | Ace |
| 305 | Avvocato del Diavolo | Esile | Sbilanciato | POT Bassa | DAN Letale | First Strike | Mimic | Tech |
| 306 | Giudice Corrotto | Solido | Equilibrato | POT Media | DAN Medio | Late Game | Controller | Ace |
| 307 | Archivista degli Obblighi | Esile | Equilibrato | POT Bassa | DAN Medio | Counter | Debuffer | Ace |
| 308 | Messaggero Burlone | Solido | Equilibrato | POT Media | DAN Medio | First Strike | Buffer | Ace |
| 309 | Ombra del Creditore | Solido | Equilibrato | POT Media | DAN Medio | First Strike | Debuffer | Ace |
| 310 | Anima Dannata | Solido | Equilibrato | POT Media | DAN Basso | Comeback | Buffer | Ace |
| 311 | Generale Karthessi | Imponente | Equilibrato | POT Alta | DAN Alto | Late Game | Mimic | Boss, Tech |
| 312 | Artigiano Velithari | Imponente | Sbilanciato | POT Alta | DAN Medio | Comeback | Closer | Finisher |
| 313 | Dammeri Spezzato | Solido | Equilibrato | POT Bassa | DAN Medio | Counter | Debuffer | Ace |
| 314 | Debitore Trasformato | Solido | Equilibrato | POT Media | DAN Alto | Comeback | Buffer | Ace |
| 315 | Larva della Corte | Esile | Equilibrato | POT Bassa | DAN Medio | Counter | Buffer | Ace |
| 316 | Airam, la Confortatrice | Imponente | Equilibrato | POT Alta | DAN Letale | Steady | Tank | Boss, Tank |
| 317 | Banditore di Schiavi | Solido | Sbilanciato | POT Alta | DAN Medio | Counter | Controller | Ace |
| 318 | Fratello del Banditore di Schiavi | Solido | Sbilanciato | POT Alta | DAN Medio | Late Game | Closer | Finisher |
| 319 | Investigatore Demoniaco | Solido | Sbilanciato | POT Media | DAN Basso | Comeback | Mimic | Tech |
| 320 | Messaggero Nefasto | Solido | Equilibrato | POT Media | DAN Basso | Counter | Closer | Finisher |

**Osservazioni (Maggio 2026):**
- **316 Airam** (**Inversione** sempre) e **317–320** rinforzano **Intervento** / **Resa dei conti** / **Copia** — matchup dipendenti dal nemico.
- Bonus **Copia Bonus nemico**: più strumenti per rubare identità, più rischio di “mani vuote” se il bonus avversario è debole.

---

## Calibri Pesanti

**Bonus armata:** -2 DAN nem. (min 2). Attivazione: sempre (nessun trigger).

**Corpo:** **Solido** 60% (12) · **Imponente** 25% (5) · **Esile** 15% (3)

**Equilibrio:** **Equilibrato** 70% (14) · **Sbilanciato** 30% (6)

**POT:** **POT Media** 45% (9) · **POT Alta** 30% (6) · **POT Bassa** 20% (4) · **POT Devastante** 5% (1)

**DAN:** **DAN Medio** 55% (11) · **DAN Basso** 20% (4) · **DAN Alto** 15% (3) · **DAN Letale** 10% (2)

**Postura:** **Comeback** 30% (6) · **All-in** 25% (5) · **Steady** 15% (3) · **Momentum** 15% (3) · **First Strike** 10% (2) · **Late Game** 5% (1)

**Funzione (euristica):** **Buffer** 35% (7) · **Closer** 20% (4) · **Tank** 15% (3) · **Engine** 15% (3) · **Controller** 5% (1) · **Scaler** 5% (1) · **Debuffer** 5% (1)

| # | Nome | Corpo | Equil. | POT | DAN | Postura | Funzione | Ruolo |
|---|------|-------|--------|-----|-----|---------|----------|-------|
| 401 | Titano Corazzato MK-IV | Imponente | Equilibrato | POT Alta | DAN Letale | Steady | Tank | Boss, Tank |
| 402 | Nucleo di Comando Nord | Imponente | Equilibrato | POT Media | DAN Letale | All-in | Buffer | Ace |
| 403 | Bastione Ambulante | Solido | Equilibrato | POT Media | DAN Alto | All-in | Engine | Pillar |
| 404 | Tecnico di Prima Linea | Solido | Sbilanciato | POT Alta | DAN Basso | First Strike | Tank | Ace |
| 405 | Guardiano di Settore | Solido | Sbilanciato | POT Alta | DAN Medio | Comeback | Controller | Ace |
| 406 | Analista da Combattimento | Solido | Equilibrato | POT Bassa | DAN Medio | Steady | Scaler | Scaler |
| 407 | Drone Cacciatore X-9 | Solido | Equilibrato | POT Media | DAN Basso | First Strike | Closer | Finisher |
| 408 | Operaio Meccanico | Esile | Equilibrato | POT Bassa | DAN Medio | Steady | Debuffer | Ace |
| 409 | Occhio del Fronte Est | Esile | Equilibrato | POT Bassa | DAN Basso | Comeback | Buffer | Ace |
| 410 | Orecchio del Fronte Sud | Solido | Equilibrato | POT Media | DAN Medio | Comeback | Engine | Pillar |
| 411 | Protocollo Cenere | Imponente | Equilibrato | POT Media | DAN Alto | All-in | Closer | Boss, Finisher |
| 412 | Pugno del Fronte Ovest | Solido | Sbilanciato | POT Alta | DAN Medio | Momentum | Buffer | Ace |
| 413 | Cannone Semovente | Imponente | Equilibrato | POT Alta | DAN Alto | All-in | Closer | Finisher |
| 414 | Raccoglitore del Campo | Solido | Equilibrato | POT Media | DAN Medio | Momentum | Engine | Pillar |
| 415 | Protocollo di Emergenza | Solido | Sbilanciato | POT Media | DAN Basso | Comeback | Buffer | Ace |
| 416 | Il Chirurgo | Imponente | Sbilanciato | POT Devastante | DAN Medio | Comeback | Tank | Boss, Tank |
| 417 | Santo Motore | Solido | Sbilanciato | POT Alta | DAN Medio | Momentum | Buffer | Ace |
| 418 | Morto che Vola | Solido | Equilibrato | POT Media | DAN Medio | Comeback | Closer | Finisher |
| 419 | K-9.1 | Solido | Equilibrato | POT Media | DAN Medio | Late Game | Buffer | Ace |
| 420 | Sistema Balistico Poco Accurato | Esile | Equilibrato | POT Bassa | DAN Medio | All-in | Buffer | Ace |

**Osservazioni (Maggio 2026):**
- **416–420** aggiungono **Cura su Rimonta**, **+DAN Magnanimo**, **Ultimo desiderio** e **Overdrive** burst; il tappeto **−2 DAN nem.** mitiga ancora gli scambi lunghi.

---

## Orathai

**Bonus armata:** Resa dei conti: +2 DAN. Attivazione (dati): trigger `reckoning` — vedi `src/data/triggers.js` e glossario per l’etichetta mostrata in partita.

**Corpo:** **Solido** 60% (12) · **Imponente** 25% (5) · **Esile** 15% (3)

**Equilibrio:** **Equilibrato** 55% (11) · **Sbilanciato** 45% (9)

**POT:** **POT Alta** 45% (9) · **POT Media** 35% (7) · **POT Bassa** 15% (3) · **POT Devastante** 5% (1)

**DAN:** **DAN Medio** 65% (13) · **DAN Basso** 25% (5) · **DAN Letale** 10% (2)

**Postura:** **Momentum** 40% (8) · **Comeback** 20% (4) · **Steady** 15% (3) · **First Strike** 10% (2) · **All-in** 5% (1) · **Counter** 5% (1) · **Late Game** 5% (1)

**Funzione (euristica):** **Buffer** 35% (7) · **Tank** 20% (4) · **Engine** 15% (3) · **Controller** 10% (2) · **Closer** 10% (2) · **Mimic** 5% (1) · **Scaler** 5% (1)

| # | Nome | Corpo | Equil. | POT | DAN | Postura | Funzione | Ruolo |
|---|------|-------|--------|-----|-----|---------|----------|-------|
| 501 | Voce della Fine | Imponente | Equilibrato | POT Alta | DAN Letale | Momentum | Buffer | Boss, Ace |
| 502 | Radice dei Caduti | Solido | Equilibrato | POT Alta | DAN Medio | Momentum | Engine | Pillar |
| 503 | L'Eco Vivente | Imponente | Sbilanciato | POT Devastante | DAN Medio | Momentum | Buffer | Ace |
| 504 | La Spina nel Bosco | Solido | Equilibrato | POT Media | DAN Medio | Steady | Controller | Ace |
| 505 | L'Albero della Linfa d'Oro | Solido | Sbilanciato | POT Alta | DAN Medio | Momentum | Engine | Pillar |
| 506 | Il Cacciatore Paziente | Solido | Sbilanciato | POT Alta | DAN Medio | First Strike | Buffer | Ace |
| 507 | Il Germoglio Ostinato | Solido | Sbilanciato | POT Media | DAN Basso | Comeback | Closer | Finisher |
| 508 | Il Muschio Curativo | Solido | Equilibrato | POT Media | DAN Basso | Steady | Tank | Ace |
| 509 | Il Seme Finale | Solido | Equilibrato | POT Media | DAN Basso | Comeback | Engine | Pillar |
| 510 | La Guida del Bosco | Esile | Equilibrato | POT Bassa | DAN Basso | Momentum | Buffer | Ace |
| 511 | La Tempesta Cava | Imponente | Sbilanciato | POT Alta | DAN Medio | All-in | Buffer | Boss, Ace |
| 512 | Il Parassita Armonico | Solido | Equilibrato | POT Media | DAN Letale | Counter | Mimic | Tech |
| 513 | Il Canto della Cenere | Solido | Sbilanciato | POT Alta | DAN Medio | Comeback | Tank | Ace |
| 514 | L'Albero dei Trofei | Solido | Equilibrato | POT Media | DAN Medio | Momentum | Tank | Ace |
| 515 | Il Fiore della Vittoria | Esile | Equilibrato | POT Bassa | DAN Medio | Momentum | Buffer | Ace |
| 516 | Il Coro | Imponente | Sbilanciato | POT Alta | DAN Medio | Comeback | Tank | Boss, Tank |
| 517 | La Radice del Rancore | Solido | Sbilanciato | POT Alta | DAN Medio | Late Game | Closer | Finisher |
| 518 | Il Custode del Silenzio | Imponente | Sbilanciato | POT Alta | DAN Medio | Momentum | Controller | Ace |
| 519 | L'Occhio del Bosco | Solido | Equilibrato | POT Media | DAN Medio | First Strike | Buffer | Ace |
| 520 | Il Soffocatore Silente | Esile | Equilibrato | POT Bassa | DAN Basso | Steady | Scaler | Scaler |

**Osservazioni (Maggio 2026):**
- Il bonus **Resa dei conti: +2 DAN** spinge a sopravvivere ai primi due scontri; le nuove carte **516–520** danno **Cura su Rimonta**, **direct damage**, **Blocca Bonus** e **Attrizione**.

---

## Mounthborn

**Bonus armata:** Imboscata: +1 POT, +1 DAN. Attivazione (dati): trigger `turbo` — vedi `src/data/triggers.js` e glossario per l’etichetta mostrata in partita.

**Corpo:** **Solido** 70% (14) · **Imponente** 20% (4) · **Esile** 10% (2)

**Equilibrio:** **Equilibrato** 70% (14) · **Sbilanciato** 30% (6)

**POT:** **POT Media** 50% (10) · **POT Alta** 40% (8) · **POT Bassa** 10% (2)

**DAN:** **DAN Medio** 65% (13) · **DAN Alto** 20% (4) · **DAN Basso** 15% (3)

**Postura:** **First Strike** 25% (5) · **Comeback** 25% (5) · **Counter** 20% (4) · **Momentum** 15% (3) · **Late Game** 10% (2) · **Early Rush** 5% (1)

**Funzione (euristica):** **Buffer** 40% (8) · **Closer** 15% (3) · **Tank** 10% (2) · **Scaler** 10% (2) · **Kamikaze** 10% (2) · **Mimic** 5% (1) · **Debuffer** 5% (1) · **Controller** 5% (1)

| # | Nome | Corpo | Equil. | POT | DAN | Postura | Funzione | Ruolo |
|---|------|-------|--------|-----|-----|---------|----------|-------|
| 601 | Regina della Colonia | Imponente | Equilibrato | POT Alta | DAN Alto | Late Game | Tank | Boss, Tank |
| 602 | Bruto Corazzato | Imponente | Equilibrato | POT Alta | DAN Alto | Momentum | Scaler | Scaler |
| 603 | Divoratore di Menti | Solido | Equilibrato | POT Media | DAN Alto | Counter | Mimic | Tech |
| 604 | L'Apripista | Solido | Equilibrato | POT Media | DAN Alto | First Strike | Buffer | Ace |
| 605 | Il Sempre Affamato | Solido | Sbilanciato | POT Alta | DAN Basso | Counter | Buffer | Ace |
| 606 | Il Seminatore di Rovina | Solido | Sbilanciato | POT Alta | DAN Medio | Momentum | Closer | Finisher |
| 607 | Larva Esplosiva | Solido | Sbilanciato | POT Media | DAN Basso | First Strike | Kamikaze | Finisher |
| 608 | Larva Parassita | Esile | Equilibrato | POT Bassa | DAN Medio | Late Game | Scaler | Scaler |
| 609 | Il Nido Ambulante | Solido | Equilibrato | POT Media | DAN Medio | Comeback | Kamikaze | Finisher |
| 610 | L'Ago Nascosto | Esile | Equilibrato | POT Bassa | DAN Medio | First Strike | Buffer | Ace |
| 611 | L'Evoluzione Finale | Imponente | Sbilanciato | POT Alta | DAN Medio | Early Rush | Buffer | Boss, Ace |
| 612 | Vedova Viola | Solido | Sbilanciato | POT Alta | DAN Medio | Counter | Debuffer | Pillar |
| 613 | Il Corno Vendicativo | Solido | Equilibrato | POT Media | DAN Medio | Comeback | Buffer | Ace |
| 614 | L'Interrutore | Solido | Equilibrato | POT Media | DAN Medio | First Strike | Controller | Ace |
| 615 | Zanzara Furiosa | Solido | Equilibrato | POT Media | DAN Medio | Comeback | Closer | Finisher |
| 616 | Guardia Reale della Guglia | Imponente | Sbilanciato | POT Alta | DAN Medio | Counter | Tank | Boss, Tank |
| 617 | Scolopendra Ossea | Solido | Equilibrato | POT Alta | DAN Medio | Comeback | Buffer | Ace |
| 618 | Il Flagello Chitinoso | Solido | Equilibrato | POT Media | DAN Medio | First Strike | Buffer | Ace |
| 619 | Il Bombardiere della Colonia | Solido | Equilibrato | POT Media | DAN Medio | Comeback | Closer | Finisher |
| 620 | Mangiaossa | Solido | Equilibrato | POT Media | DAN Basso | Momentum | Buffer | Ace |

**Osservazioni (Maggio 2026):**
- **616** (**Inversione** su Intervento) e **618** (+6 VA in Imboscata) aumentano swing e burst coerenti col bonus **Imboscata: +1 POT, +1 DAN**.

---

## L'Enclave delle Scaglie

**Bonus armata:** Conquista: +2 FC. Attivazione (dati): trigger `conquest` — vedi `src/data/triggers.js` e glossario per l’etichetta mostrata in partita.

**Corpo:** **Solido** 65% (13) · **Esile** 20% (4) · **Imponente** 15% (3)

**Equilibrio:** **Equilibrato** 80% (16) · **Sbilanciato** 20% (4)

**POT:** **POT Media** 45% (9) · **POT Alta** 30% (6) · **POT Bassa** 20% (4) · **POT Devastante** 5% (1)

**DAN:** **DAN Medio** 60% (12) · **DAN Basso** 20% (4) · **DAN Alto** 15% (3) · **DAN Letale** 5% (1)

**Postura:** **Momentum** 35% (7) · **First Strike** 15% (3) · **All-in** 15% (3) · **Late Game** 15% (3) · **Comeback** 10% (2) · **Early Rush** 5% (1) · **Counter** 5% (1)

**Funzione (euristica):** **Buffer** 55% (11) · **Scaler** 10% (2) · **Controller** 10% (2) · **Closer** 10% (2) · **Engine** 5% (1) · **Tank** 5% (1) · **Debuffer** 5% (1)

| # | Nome | Corpo | Equil. | POT | DAN | Postura | Funzione | Ruolo |
|---|------|-------|--------|-----|-----|---------|----------|-------|
| 701 | Patriarca dell'Enclave | Imponente | Equilibrato | POT Devastante | DAN Letale | Momentum | Buffer | Boss, Ace |
| 702 | Custode del Tesoro | Solido | Equilibrato | POT Alta | DAN Medio | First Strike | Scaler | Scaler |
| 703 | Cavaliere del Wyrm | Solido | Equilibrato | POT Alta | DAN Medio | Early Rush | Buffer | Ace |
| 704 | Guardiano della Tana | Solido | Sbilanciato | POT Alta | DAN Medio | Counter | Controller | Ace |
| 705 | Predatore Alato | Solido | Equilibrato | POT Media | DAN Medio | First Strike | Buffer | Ace |
| 706 | Draghetto Famelico | Solido | Equilibrato | POT Media | DAN Medio | All-in | Buffer | Ace |
| 707 | Scaglia Errante | Esile | Equilibrato | POT Bassa | DAN Medio | Late Game | Buffer | Ace |
| 708 | Servo del Tesoro | Esile | Equilibrato | POT Bassa | DAN Basso | Comeback | Engine | Pillar |
| 709 | Sputafuoco Giovane | Solido | Equilibrato | POT Media | DAN Basso | Late Game | Buffer | Ace |
| 710 | Uovo di Drago | Esile | Equilibrato | POT Bassa | DAN Medio | Late Game | Buffer | Ace |
| 711 | Drago Antico Addormentato | Imponente | Equilibrato | POT Alta | DAN Alto | Comeback | Tank | Boss, Tank |
| 712 | Piromante della Corte | Solido | Sbilanciato | POT Alta | DAN Basso | Momentum | Closer | Finisher |
| 713 | Divoratore d'Oro | Solido | Equilibrato | POT Media | DAN Medio | All-in | Buffer | Ace |
| 714 | Incantatore di Scaglie | Solido | Equilibrato | POT Media | DAN Medio | Momentum | Buffer | Ace |
| 715 | Araldo della Fiamma | Solido | Equilibrato | POT Media | DAN Alto | Momentum | Buffer | Ace |
| 716 | Tiranno del Sottosuolo | Imponente | Sbilanciato | POT Alta | DAN Medio | All-in | Controller | Boss |
| 717 | Dracoltoio | Solido | Equilibrato | POT Media | DAN Alto | Momentum | Buffer | Ace |
| 718 | Nobili Viola | Solido | Equilibrato | POT Media | DAN Medio | Momentum | Debuffer | Ace |
| 719 | Coboldo Irrequieto | Solido | Sbilanciato | POT Media | DAN Basso | Momentum | Closer | Finisher |
| 720 | Foderi Neri | Esile | Equilibrato | POT Bassa | DAN Medio | First Strike | Scaler | Scaler |

**Osservazioni (Maggio 2026):**
- Resta l'armata con più **Buffer** (11/20): **716–720** aggiungono **Blocca Potere** su Sopraffare, **+12 VA** in Gloria, debuff POT, danni su Conquista e **Attrizione** in Imboscata.

---

## Ratti della Megera

**Bonus armata:** Conquista: Tossina 2 (min 4). Attivazione (dati): trigger `conquest` — vedi `src/data/triggers.js` e glossario per l’etichetta mostrata in partita.

**Corpo:** **Solido** 80% (16) · **Imponente** 15% (3) · **Esile** 5% (1)

**Equilibrio:** **Equilibrato** 65% (13) · **Sbilanciato** 35% (7)

**POT:** **POT Media** 55% (11) · **POT Alta** 35% (7) · **POT Bassa** 5% (1) · **POT Devastante** 5% (1)

**DAN:** **DAN Medio** 55% (11) · **DAN Basso** 35% (7) · **DAN Alto** 10% (2)

**Postura:** **Comeback** 25% (5) · **Counter** 20% (4) · **Punisher** 15% (3) · **Late Game** 15% (3) · **First Strike** 10% (2) · **Steady** 5% (1) · **Momentum** 5% (1) · **Early Rush** 5% (1)

**Funzione (euristica):** **Debuffer** 45% (9) · **Closer** 25% (5) · **Buffer** 15% (3) · **Controller** 10% (2) · **Mimic** 5% (1)

| # | Nome | Corpo | Equil. | POT | DAN | Postura | Funzione | Ruolo |
|---|------|-------|--------|-----|-----|---------|----------|-------|
| 801 | La Megera Eterna | Imponente | Equilibrato | POT Alta | DAN Alto | Steady | Controller | Boss |
| 802 | Portatore di Peste | Solido | Sbilanciato | POT Alta | DAN Medio | Counter | Debuffer | Pillar |
| 803 | Strega del Crepuscolo | Solido | Equilibrato | POT Media | DAN Medio | Momentum | Debuffer | Pillar |
| 804 | Untore Silenzioso | Solido | Equilibrato | POT Media | DAN Medio | Punisher | Closer | Finisher |
| 805 | Ratto delle Ombre | Solido | Sbilanciato | POT Media | DAN Basso | Counter | Debuffer | Ace |
| 806 | Ratto Infetto | Solido | Equilibrato | POT Media | DAN Basso | Late Game | Closer | Finisher |
| 807 | Spia della Megera | Solido | Sbilanciato | POT Media | DAN Basso | First Strike | Debuffer | Ace |
| 808 | Portatore di Ossa | Solido | Equilibrato | POT Media | DAN Medio | Comeback | Closer | Finisher |
| 809 | Larva Strisciante | Esile | Equilibrato | POT Bassa | DAN Basso | Comeback | Debuffer | Ace |
| 810 | Ratto Moribondo | Solido | Equilibrato | POT Media | DAN Medio | Punisher | Closer | Finisher |
| 811 | Flagello della Colonia | Imponente | Equilibrato | POT Alta | DAN Alto | Late Game | Debuffer | Boss, Pillar |
| 812 | Sciamano dei Miasmi | Solido | Equilibrato | POT Alta | DAN Medio | First Strike | Debuffer | Pillar |
| 813 | Ratto Gigante | Solido | Sbilanciato | POT Alta | DAN Medio | Comeback | Buffer | Ace |
| 814 | Divoratore di Speranza | Solido | Sbilanciato | POT Alta | DAN Basso | Comeback | Closer | Finisher |
| 815 | Custode della Fogna | Solido | Equilibrato | POT Media | DAN Medio | Counter | Controller | Ace |
| 816 | L'Orfano | Imponente | Sbilanciato | POT Devastante | DAN Basso | Counter | Mimic | Boss, Tech |
| 817 | Aborto che Cammina | Solido | Sbilanciato | POT Alta | DAN Medio | Punisher | Debuffer | Pillar |
| 818 | Mangiamore | Solido | Equilibrato | POT Media | DAN Medio | Comeback | Buffer | Ace |
| 819 | Sciamana Corrotta | Solido | Equilibrato | POT Media | DAN Medio | Late Game | Debuffer | Ace |
| 820 | Yata, lo Scalpo Alato | Solido | Equilibrato | POT Media | DAN Basso | Early Rush | Buffer | Ace |

**Osservazioni (Maggio 2026):**
- **816 L'Orfano** (**Copia Bonus** su Intervento) e **819** (−13 VA in Ultima Chance) sono le nuove leve di **mirror** e **fine partita**.
- Piano **attrito** confermato: **Tossina** su Conquista + densità di **Debuffer** e **Closer**.

---

## TABELLA COMPARATIVA — RECORD PER ARMATA (20 carte)

| Categoria | Record | Armata |
|-----------|--------|--------|
| Buffer (conteggio) | 11 | L'Enclave delle Scaglie |
| Debuffer (conteggio) | 9 | Ratti della Megera |
| Closer (conteggio) | 5 | Ratti della Megera |
| Tank (conteggio) | 4 | Orathai |
| Mimic (conteggio) | 4 | Corte Rossa |
| Comeback / Rimonta (postura) | ~45% | Kethran |
| First Strike / Imboscata | ~25% | Mounthborn |
| DAN Basso (fascia) | 35% | Ratti della Megera |
| POT Devastante (fascia) | 5%× molte armate | Boss L5 |

*Percentuali Postura nel documento per sezione sono calcolate su 20 carte; piccole differenze possono emergere se si ricalcola con altre mappe trigger.*

---

*Analisi aggiornata — SATZE — Maggio 2026 (generata da `Documentazione/_gen_analisi_tag.mjs` + note curate).*

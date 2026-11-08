# SATZE su Steam: preparazione della pagina dello store

**Stato:** bozza di lavoro, 8 novembre 2026
**Ambito:** checklist e tempistiche, testi della pagina (IT/EN), grafiche e capsule. L'integrazione tecnica con Steamworks (SDK, depot, obiettivi) è esclusa.

Le regole di Steam sono state lette l'8 novembre 2026 sulle pagine ufficiali di Steamworks, citate accanto a ogni punto. Valve le aggiorna spesso: prima di ogni passaggio conviene ricontrollare la pagina indicata. I dati sul gioco sono stati verificati nel codice del repo (vedi §5).

---

## 1. Decisioni ancora aperte

Prima di compilare la pagina servono queste scelte. Le indicazioni del documento cambiano in base alla risposta.

1. **Lingua del gioco.** Oggi il gioco è **solo in italiano**: non c'è un sistema di traduzione e l'installer è configurato per `it_IT`. Steam ricava le lingue supportate dalle impostazioni del gioco, non dalla pagina ([localization](https://partner.steamgames.com/doc/store/localization)). Una pagina in inglese è possibile, ma chi la legge vedrà che il gioco non supporta la sua lingua. Le strade possibili sono due:
   - tradurre il gioco in inglese prima dell'uscita;
   - uscire in italiano, dichiarandolo chiaramente nella pagina inglese (la bozza in §3 lo fa già).
2. **Tipo di uscita.** Le opzioni sono in §2.3.
3. **Campagna.** Steam chiede di togliere da descrizione, screenshot e trailer tutto ciò che è incompleto o solo pianificato ([review process](https://partner.steamgames.com/doc/store/review_process)). La Campagna oggi è un'anteprima, quindi va decisa una delle due cose:
   - esce insieme al gioco, e allora si può citare;
   - resta fuori dalla pagina.
4. **Multiplayer online.** Al momento della revisione Steam chiede le informazioni per provare il multigiocatore ([annuncio del 3/11/2026](https://steamcommunity.com/groups/steamworks/announcements/detail/696528162820984746)). Il server `satze-ws.fly.dev` deve quindi restare acceso e sostenibile anche dopo l'uscita. Va deciso se il multiplayer va in pagina come funzione piena o come "beta".
5. **Forma con cui ti registri** (persona fisica o società) e aspetti fiscali italiani. Vedi §2.1: per la parte fiscale italiana serve un commercialista, perché Steam documenta solo la parte statunitense.

---

## 2. Checklist e tempistiche

### 2.1 Account Steamworks (Steam Direct)

- [ ] **Registrazione su Steamworks** con firma elettronica di NDA e Steam Distribution Agreement ([onboarding](https://partner.steamgames.com/doc/gettingstarted/onboarding)).
- [ ] **Nome legale e forma.** Se possiedi il gioco come persona fisica, indica "Sole Proprietorship" e il tuo nome e cognome legali. Non sono ammessi nomi d'arte o "d/b/a" (stessa pagina).
- [ ] **Dati bancari.** L'intestatario del conto deve coincidere con il nome legale indicato (stessa pagina).
- [ ] **Questionario fiscale USA.** Per chi risiede in un Paese con trattato fiscale con gli USA servono le informazioni del modulo W-8BEN. La verifica da parte di un servizio esterno può richiedere **fino a 30 giorni** (stessa pagina).
- [ ] **Quota Steam Direct: 100 USD per gioco.** Non è rimborsabile, ma la recuperi quando il gioco supera 1.000 USD di ricavi lordi rettificati ([appfee](https://partner.steamgames.com/doc/gettingstarted/appfee)).
- [ ] **Attesa minima di 21 giorni** tra il pagamento della quota e la possibilità di pubblicare il gioco ([steamdirect](https://partner.steamgames.com/steamdirect)).

Tempo indicato da Valve per tutte le pratiche: **15-30 giorni** ([steamdirect](https://partner.steamgames.com/steamdirect)).

> ⚠️ Per la parte fiscale italiana (partita IVA o meno, dichiarazione dei ricavi esteri) Steam non dà indicazioni: è da chiedere a un commercialista prima di registrarsi.

### 2.2 Pagina, revisioni e uscita

- [ ] **Compilare la pagina** in Store Presence: testi, grafiche, tag, lingue e questionario sui contenuti (vedi sotto e §3-§4).
- [ ] **Questionario sui contenuti.** Le tre sezioni vanno completate tutte prima della revisione ([content survey](https://partner.steamgames.com/doc/gettingstarted/contentsurvey)):
  1. contenuti generali, da cui derivano le classificazioni per età;
  2. contenuti per adulti;
  3. **IA generativa**: obbligatoria per SATZE, vedi §2.4.
- [ ] **Almeno 5 tag** prima dell'uscita, consigliati fino a 20 ([tags](https://partner.steamgames.com/doc/store/tags)). Una proposta è in §3.4.
- [ ] **Revisione della pagina.** Di solito richiede 3-5 giorni lavorativi; Valve consiglia di inviarla **almeno 7 giorni lavorativi prima** della data voluta ([review process](https://partner.steamgames.com/doc/store/review_process)).
- [ ] **Pagina "Prossimamente" visibile per almeno 2 settimane** prima dell'uscita ([coming soon](https://partner.steamgames.com/doc/store/coming_soon)). La regola vale anche per l'Accesso anticipato.
- [ ] **Revisione della build.** Di solito richiede 3-5 giorni lavorativi, ma conviene pianificarne almeno 7. **Al momento Valve dichiara ritardi fino a 12 giorni lavorativi** ([annuncio del 3/11/2026](https://steamcommunity.com/groups/steamworks/announcements/detail/696528162820984746)).
- [ ] **Nuovi punti della checklist** dallo stesso annuncio:
  - giocare almeno 5 minuti avviando il gioco da Steam, entro i 7 giorni precedenti l'invio;
  - dichiarare quali redistribuibili servono (o che non ne servono);
  - controlli su obiettivi e Steam Cloud, se attivati.
- [ ] **Data di uscita.** Si può mostrare la data completa, il mese, il trimestre, l'anno o solo "Prossimamente". Quando mancano meno di 14 giorni, per cambiarla bisogna contattare Valve ([release dates](https://partner.steamgames.com/doc/store/release_dates)).
- [ ] **Uscita.** L'uscita non è automatica: bisogna premere "Release App" ([releasing](https://partner.steamgames.com/doc/store/releasing)).

**Quando pubblicare la pagina.** Valve consiglia di farlo appena sei pronto a parlare del gioco in pubblico. Secondo Valve una pagina online a lungo non ha controindicazioni, a meno che il gioco non cambi molto nel frattempo. Chi aggiunge il gioco alla lista desideri due anni prima ha le stesse probabilità di comprarlo di chi lo aggiunge due settimane prima ([coming soon](https://partner.steamgames.com/doc/store/coming_soon)).

### 2.3 Tipo di uscita: le opzioni

| Opzione | Cosa chiede Steam | Pro per SATZE | Contro per SATZE |
|---|---|---|---|
| **Pagina "Prossimamente" + uscita più avanti** | Pagina pubblica per almeno 2 settimane prima dell'uscita | Raccogli liste desideri mentre finisci il playtest. È compatibile con le altre opzioni. | Nessun ricavo nel frattempo. Il gioco non deve cambiare troppo rispetto alla pagina. |
| **Accesso anticipato** | Il gioco deve essere giocabile all'acquisto. Niente promesse di date o funzioni future, prezzo non superiore a quello su altri store, Q&A dedicato ([earlyaccess](https://partner.steamgames.com/doc/store/earlyaccess)) | Il gioco è già giocabile e la Campagna in arrivo darebbe un motivo concreto all'Accesso anticipato. | Valve sconsiglia di usarlo solo per finanziare lo sviluppo. Il gioco è solo in italiano. |
| **Demo gratuita / Steam Next Fest** | Per la Next Fest: pagina del gioco pubblicata e pubblica, demo giocabile all'inizio del festival, uscita del gioco dopo il festival. Ogni gioco partecipa a una sola edizione ([nextfest](https://partner.steamgames.com/doc/marketing/upcoming_events/nextfest)). | Grande visibilità e riscontri dai giocatori. Il Duello Standard è già una buona demo. | La demo è un'app separata con pagina o asset propri ([demos](https://partner.steamgames.com/doc/store/application/demos)). |
| **Steam Playtest** | App collegata, con iscrizione dalla pagina del gioco e accessi a ondate o aperti ([playtest](https://partner.steamgames.com/doc/features/playtest)) | Prosegue il playtest attuale (Discord + Google Drive) direttamente su Steam. | Serve comunque la pagina del gioco. |

**Date ufficiali delle prossime Next Fest:**

- **Febbraio 2027** ([feb_2027](https://partner.steamgames.com/doc/marketing/upcoming_events/nextfest/feb_2027)):
  - iscrizione entro il **10 gennaio 2027**;
  - tutto inviato in revisione entro il **1° febbraio**;
  - festival dal **22 febbraio al 1° marzo 2027**.
- **Giugno 2027** ([june_2027](https://partner.steamgames.com/doc/marketing/upcoming_events/nextfest/june_2027)):
  - iscrizione entro il **25 aprile 2027**;
  - tutto inviato in revisione entro il **24 maggio**;
  - festival dal **14 al 21 giugno 2027**.

> Partendo oggi (8/11/2026), febbraio 2027 è **molto stretto**: servono fino a 30 giorni per l'account e circa 7 giorni lavorativi per la revisione della pagina, e la pagina deve essere pubblica prima del festival. Inoltre a fine dicembre ci sono le feste. **Giugno 2027 è realistico** e lascia il tempo per decidere sulla traduzione.

### 2.4 Da sistemare nel repo prima di inviare

- [ ] **Dichiarazione sull'IA (contenuti pre-generati).** Steam chiede di dichiarare i contenuti creati con l'IA che finiscono nel gioco e vengono visti o ascoltati dai giocatori: grafica, suoni, testi, traduzioni ([content survey](https://partner.steamgames.com/doc/gettingstarted/contentsurvey)). Nel repo ci sono tracce esplicite:
  - prompt Midjourney: `PROMPT_ICONE_COPYPASTE.txt`, `src/assets/icons/PROMPT_MIDJOURNEY.md`;
  - file con nomi in stile Midjourney in `public/icons/`;
  - un'immagine ChatGPT in `public/Immagini_bg/`, indicata anche come sorgente del logo in `scripts/process-brand-logo.mjs`;
  - illustrazioni "generate da imagegen" in `public/card-images/eldritch/`;
  - suoni ElevenLabs in `src/audio/soundCatalog.js`.

  La dichiarazione apparirà sulla pagina dello store. In revisione Valve controlla anche che il contenuto non violi diritti altrui.
- [ ] **Licenze dei font.** Per una vendita commerciale conviene avere nel gioco i file di licenza:
  - Chakra Petch, Cinzel e Share Tech Mono sono self-hosted, ma senza licenza nel repo;
  - per `alfa-display.otf`, `alfa-body.otf` e `Arcana-Roman-Bold.woff` mancano origine e licenza;
  - la Campagna scarica font da Google a ogni avvio (vedi `Documentazione/FONT.md` §6).
- [ ] **Origine dei suoni** in `public/audio/sfx/*.wav`: non è documentata.
- [ ] **Requisiti di sistema.** La build deve avviarsi su ogni sistema operativo indicato in pagina ([review process](https://partner.steamgames.com/doc/store/review_process)). Oggi la build è **solo Windows x64**.

---

## 3. Testi della pagina (bozze)

Regole di Steam per i testi ([description](https://partner.steamgames.com/doc/store/page/description)):

- descrizione breve in solo testo, al massimo "qualche centinaio di caratteri" (il limite esatto si vede nell'editor);
- niente frasi legate al tempo ("Disponibile ora", date);
- niente link nella descrizione;
- per i giocatori nuovi conviene evitare il gergo interno.

La lingua di riserva della pagina è l'inglese ([localization](https://partner.steamgames.com/doc/store/localization)).

> Nelle bozze uso solo numeri verificati nel codice: 12 armate, 360 carte, 121 campi di battaglia, 12 Eminenze. La Campagna e la Collezione/buste **non** sono citate (vedi §1.3).

### 3.1 Descrizione breve

**IT (311 caratteri)**
> Un gioco di carte strategico fatto di puntate segrete. Scegli un Agente, punta in segreto i tuoi Focus Coin e conquista i campi di battaglia di mondi lontani. Dodici armate, ognuna con la propria Eminenza, combattono la Grande Guerra per conto di entità cosmiche che vogliono solo dimostrare chi è il più abile.

**EN (289 caratteri)**
> A strategy card game of secret bids. Pick an Agent, secretly commit your Focus Coins and seize the battlefields of distant worlds. Twelve armies, each fighting under its own Eminence, wage the Great War on behalf of cosmic entities who only want to prove which of them is the most skilled.

### 3.2 Informazioni sul gioco

**IT**

> **Una guerra che nessuno sa di combattere**
> Sopra i mondi esistono i Giocatori: volontà cosmiche fuori dal tempo, che per ere hanno rispettato un patto di non interferenza. Poi l'orgoglio ha preso il sopravvento. Oggi i Giocatori si sfidano attraverso gli eserciti dei mondi, e i loro campioni, gli Agenti, combattono senza sapere di essere pedine.
>
> **Ogni scontro è una scommessa**
> A ogni turno si sceglie un Agente e si puntano in segreto i Focus Coin. Le puntate si rivelano insieme: la forza dell'Agente moltiplicata per i Focus Coin decide chi conquista il campo di battaglia. I Focus Coin spesi non tornano più: ogni puntata è una risorsa in meno per il resto della partita.
>
> **Caratteristiche**
> - **12 armate** con identità, bonus e stile di gioco propri: imboscate, logoramento col veleno, rimonte, specchi che copiano il nemico…
> - **360 carte** e **121 campi di battaglia** con effetti che cambiano lo scontro.
> - **12 Eminenze**: la creatura, il luogo o il rito sotto cui combatte ogni armata, con abilità scelte in segreto per bluffare.
> - **Mazzi da 10 carte** da costruire, anche mescolando armate diverse.
> - **Duello** in tre formati (Standard, No Eminenza, Mani nude), **2v2 ad abbinamenti segreti** e **Re della collina** da 3-4 giocatori contro l'IA, con tre livelli di difficoltà.
> - **Multiplayer online 1 contro 1** con stanze a codice. *(Da confermare: beta o funzione piena, vedi §1.4.)*
> - **Tre tutorial** e una galleria di carte, Eminenze e campi.

**EN**

> **A war no one knows they are fighting**
> Above the worlds exist the Players: cosmic wills beyond time, who for ages kept a pact never to interfere with one another. Then pride took over. Now the Players clash through the armies of the worlds, and their champions, the Agents, fight without knowing they are pawns.
>
> **Every clash is a wager**
> Each turn you pick an Agent and secretly commit Focus Coins. Bids are revealed together: the Agent's strength times the coins committed decides who conquers the battlefield. Spent coins never come back, so every bid costs you for the rest of the match.
>
> **Features**
> - **12 armies**, each with its own identity, bonus and playstyle: ambushes, poison attrition, comebacks, mirrors that copy the enemy…
> - **360 cards** and **121 battlefields** whose effects reshape every clash.
> - **12 Eminences**: the creature, place or rite each army fights under, with secretly chosen abilities built for bluffing.
> - **Build 10-card decks**, mixing armies if you like.
> - **Duel** in three formats (Standard, No Eminence, Bare Hands), **2v2 with secret pairings** and **King of the Hill** for 3-4 players against the AI, with three difficulty levels.
> - **Online 1v1 multiplayer** with room codes. *(To be confirmed: beta or full feature, see §1.4.)*
> - **Three tutorials** and a gallery of cards, Eminences and battlefields.
>
> *Note: SATZE is currently available in Italian only.* (Da tenere solo se il gioco esce senza traduzione, vedi §1.1.)

> I nomi dei formati in inglese ("No Eminence", "Bare Hands") e "Players/Agents/Eminences" vanno allineati a quelli che userà un'eventuale traduzione del gioco.

### 3.3 Frasi delle armate per immagini o GIF

I motti esistono già in `src/components/menu/cosmic/armyLore.js`, per esempio:

- Corte Rossa: «Ciò che vedi, lo diventi.»
- Orathai: «Aspetta. Poi finisci.»
- Patto degli Indocili: «Mai uniti. Mai sconfitti.»

Le immagini nella descrizione devono pesare meno di 5 MB ciascuna e meno di 15 MB in tutto. Il testo dentro le immagini va rifatto per ogni lingua, quindi conviene usare immagini senza scritte ([description](https://partner.steamgames.com/doc/store/page/description)).

### 3.4 Tag proposti

Tutti i tag sono stati verificati nell'elenco ufficiale di Steam ([populartags](https://store.steampowered.com/tagdata/populartags/english)). L'ordine conta per il peso ([tags](https://partner.steamgames.com/doc/store/tags)).

1. Card Battler (Battaglie con carte)
2. Strategy (Strategia)
3. Card Game (Giochi di carte)
4. Turn-Based Strategy (Strategia a turni)
5. Deckbuilding (Costruzione di mazzi)
6. Turn-Based Tactics (Tattica a turni)
7. Dark Fantasy (Fantasy dark)
8. PvP
9. Multiplayer (Multigiocatore)
10. Singleplayer (Giocatore singolo)
11. Psychological (Psicologici): per il bluff delle puntate segrete
12. Lore-Rich (Ricchi di storia)
13. Lovecraftian (Ispirati da Lovecraft): da tenere solo se le carte Eldritch restano nel gioco
14. Team-Based (A squadre): per il 2v2
15. PvE
16. Competitive (Competitivi)
17. Fantasy
18. Indie
19. Tactical (Tattici)
20. 2D

**Da evitare:**
- "Hand-drawn", perché l'arte è in gran parte generata con IA;
- "Great Soundtrack", perché il gioco non ha musica;
- "Local Multiplayer", perché le partite locali sono contro l'IA;
- "Roguelike Deckbuilder", perché la modalità non è implementata;
- "Trading Card Game", perché la collezione e le buste non sono raggiungibili nel gioco.

---

## 4. Grafiche e capsule

### 4.1 Regole sui contenuti delle capsule

Le capsule possono contenere solo **arte del gioco, nome del gioco ed eventuale sottotitolo ufficiale**. Non sono ammessi ([rules](https://partner.steamgames.com/doc/store/assets/rules), in vigore dal 1/9/2022):

- voti o recensioni;
- premi;
- scritte su sconti;
- inviti all'azione ("Aggiungi alla lista desideri");
- altro testo.

Il logo deve essere leggibile e tutte le capsule devono essere adatte a un pubblico PG-13. Se usi il sottotitolo "La Grande Guerra", deve essere ufficiale e coerente in tutte le capsule.

### 4.2 Elenco delle immagini

Fonti: [standard](https://partner.steamgames.com/doc/store/assets/standard), [libraryassets](https://partner.steamgames.com/doc/store/assets/libraryassets), [community](https://partner.steamgames.com/doc/store/assets/community). Steam fornisce anche i modelli da scaricare.

| Immagine | Misura | Obbl. | Regole | Da cosa partire nel repo |
|---|---|---|---|---|
| Header capsule | 920×430 | Sì | Arte + logo, nessun altro testo | Un fondale di `public/campi_bg` (3376×1440) + logo |
| Small capsule | 462×174 | Sì | Il logo deve restare leggibile anche a 120×45: deve occupare quasi tutta l'immagine | Logo su fondo semplice |
| Main capsule | 1232×706 | Sì | Come la header | Fondale `campi_bg` + logo |
| Vertical capsule | 748×896 | Sì | Come la header | Arte delle Eminenze (1680×2880) o degli Agenti (1792×2688) |
| Screenshot | min 1920×1080, 16:9 | Sì, almeno 5 | Vedi §4.3 | Da catturare dal gioco |
| Page background | 1438×810 | No | Discreto, poco luminoso | Fondale scuro di `campi_bg` |
| Library capsule | 600×900 | Sì | Logo + eventuale sottotitolo, nient'altro | Come la vertical |
| Library header | 920×430 | Sì | Se manca, Steam usa la header capsule | Come la header capsule |
| Library hero | 3840×1240 | Non indicato | **Nessuna scritta**; contenuto importante nell'area sicura centrale di 860×380 | ⚠️ I fondali più grandi sono 3376 px di larghezza: vanno ingranditi o ricomposti |
| Library logo | PNG trasparente, 1280 di larghezza e/o 720 di altezza | Sì | Solo il logotipo | `public/logo-satze.png` (1536×1024, trasparente) da rifilare |
| Icona community | 184×184 JPG | | Visibile da "Prossimamente" in poi | Emblema o logo |
| Icona del collegamento | 256×256 o 512×512, ICO/PNG | | | Emblema o logo |

> ⚠️ **Logo.** `scripts/process-brand-logo.mjs` cita come sorgente un'immagine ChatGPT. Il logo comparirà su tutte le capsule, quindi va incluso nella dichiarazione sull'IA. Conviene anche valutare se rifinirlo a mano.
>
> ⚠️ `public/logo-satze-master.png` in realtà è un JPEG senza trasparenza: non va bene come library logo.

### 4.3 Screenshot

- Almeno 5, a 1920×1080 o più, in 16:9 ([standard](https://partner.steamgames.com/doc/store/assets/standard)).
- Novità del 3/11/2026: gli screenshot hanno ora delle **categorie**. Si possono caricare anche menu, concept art e scene, se sono categorizzate. Ne servono comunque **5 della categoria "gameplay"**, e restano vietate le scritte promozionali ([annuncio](https://steamcommunity.com/groups/steamworks/announcements/detail/696528162820984746)).
- Almeno 4 vanno segnati come adatti a tutte le età.

**Momenti da catturare:**

1. la rivelazione delle puntate in un Duello;
2. l'annuncio di un'Eminenza;
3. un VS di inizio partita;
4. il tavolo del 2v2;
5. un Re della collina a 4;
6. il costruttore di mazzi (Gestione eserciti);
7. la galleria.

Vanno catturati da una **build pubblica**, senza la scritta "ALPHA · NON DISTRIBUIRE" e senza la dicitura PLAYTEST, se all'uscita non ci sarà.

### 4.4 Trailer

Formato consigliato ([trailer](https://partner.steamgames.com/doc/store/trailer)):

- fino a 1920×1080, 30 o 60 fps;
- MP4 con video H.264 e audio AAC.

Non ho trovato una regola che renda obbligatorio il trailer per la pagina del gioco. È però richiesto per la pagina separata di una demo, e serve un trailer pubblico per essere considerati nel trailer ufficiale della Next Fest ([nextfest](https://partner.steamgames.com/doc/marketing/upcoming_events/nextfest)).

---

## 5. Fonti dei dati sul gioco

| Dato | Fonte |
|---|---|
| 12 armate, 360 carte | `src/data/cards.js` (`ARMY_SETS`, `ALL_AGENTS`) |
| 121 campi di battaglia | `src/data/battlefieldsData.js` (`RAW_BATTLEFIELDS`) |
| 12 Eminenze implementate | `src/data/eminences.js` (`IMPLEMENTED_EMINENCE_IDS`) |
| Modalità e formati | `Codice/satze.jsx` (menu), `src/data/gameModes.js`, `src/components/menu/cosmic/DifficultySelectPopup.jsx` |
| Tre difficoltà dell'IA | `src/utils/aiConstants.js` |
| Tre tutorial | `src/components/tutorial/TutorialSteps.jsx` |
| Ambientazione | `Documentazione/WORLDBUILDING_DESIGN.md` |
| Lingua (solo italiano) | `index.html` (`lang="it"`), `electron-builder.public-installer.json` |
| Piattaforma (Windows x64) | script `electron:*` in `package.json` |

> Il `README.md` parla ancora di "6 armate": è un dato superato.

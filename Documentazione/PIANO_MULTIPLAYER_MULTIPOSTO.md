# Piano: 2v2 e Re della collina online (con IA nei posti vuoti)

Stato: piano di lavoro (2026-11-08). Riferimenti `file:riga` al momento della stesura.

## 0. Vincoli emersi dal codice
- **Server = relay a 2 posti** (`server/index.mjs:21-31` host/guest; `:312` inoltra "all'altro"; `:338-384` disconnessioni). Il Dockerfile copia solo `server/index.mjs`: il server resta un file solo.
- **Il client ignora i messaggi del server che non conosce** (`satze.jsx` listener ~1657-1720; `MultiplayerLobby.jsx:17-37` rifiuta solo `error`): si possono aggiungere tipi e campi senza rompere il client già distribuito.
- **Pericolo:** a `peer_left` il client chiude la sessione (`satze.jsx:1661`). In una stanza da 4 l'uscita di un ospite NON deve mandare `peer_left`.
- Il Duello 1v1 manda già i FC in chiaro prima del reveal (`peer_move`): stesso livello di fiducia accettabile tra amici.
- **L'rng dell'hook è mischiato alla UI** (`useMultiSeatDuel.js`: `thinkMs` :98, proposte del compagno, `advise` :926, investimento ricalcolato :362-371): un lockstep con IA replicata divergerebbe.
- La prospettiva cambia come si calcola uno scontro, non chi vince (`teamDuel.js:261`, `kingOfHill.js:203`; test `teamDuel.integration.test.js:303`, `kingOfHill.integration.test.js:276` solo con carte semplici).
- Setup: `createTeamDuelMatch` usa rng solo per lo spareggio d'apertura; `createKothMatch` mescola `initialOrder` se non passato.
- La conferma multi-posto gira prima dei rami online (`satze.jsx:3777-3782`); `startOnlineMatch` forza `aiDifficulty='multiplayer'` (attiva i percorsi 1v1, `isOnlinePvP`): il multi-posto online NON deve impostarlo.

## 1. Server: stanze fino a 4 (compatibile)
- Stanza `{ capacity: 2|4, slots: [{ws,name,secret,timer}|null] }`, slot 0 = host.
- `create_room` con `maxPlayers` opzionale (default 2 = comportamento attuale); risposta `room_created` con `slot: 0, capacity` (capacity assente ⇒ server vecchio ⇒ client disattiva il multi-posto: "server da aggiornare").
- `join_room`: primo slot senza secret; errore "Stanza già piena"; risposta `joined {playerId:'guest', slot, capacity, reconnectSecret}` (ruolo resta 'guest' per tutti i non-host).
- `reconnect`: trova lo slot dal secret (`slot` solo suggerimento); risposta `reconnected {role, slot}`.
- `relay`: senza `to` → a tutti gli altri connessi (identico al 2 posti); `to: number[]` mirato. Il server timbra `from` ('host'|'guest') e `fromSlot` (fidarsi solo di questo).
- Eventi: stanze da 2 invariati; stanze da 4: `room_members {members:[{slot,name,connected}]}` a ogni cambio; `peer_left` solo alla chiusura della stanza (host esce o scade la sua grazia).
- Grazia di 5 minuti per slot. Persistenza `{capacity, slots:[{name,secret}|null]}`; il loader accetta anche il vecchio `{hostSecret, guestSecret}` (il volume fly `/app/data/rooms.json` sopravvive al deploy).
- ~120 righe. Deploy: `fly deploy` (lo fa Davide). Il client nuovo deve funzionare col server vecchio (solo Duello).

## 2. Architettura: l'host ordina le mosse, ogni client esegue il motore
1. Un controllore per posto: umano → il suo client; compagno IA di un umano (2v2) → il client di quell'umano (UX proposte/consigli locale, la coppia si invia insieme come `teamHumanConfirm` :474-482); altri posti IA → sequencer dell'host sullo stato canonico.
2. I controllori mandano `ms_intent`; il **sequencer** dell'host valida applicandolo al match canonico e trasmette `ms_log {seq, entry, hash}`.
3. Ogni client (host compreso, in loopback) applica le voci in ordine di `seq` al proprio motore con la propria prospettiva (`perspectiveTeam`/`perspectiveSeatId`).
4. Si sincronizzano azioni concrete, mai stato casuale dopo il setup.
5. Hash indipendente dalla prospettiva (PV squadra; per posto focus, hp, usedCardIds, toxin, previousResult, conquests, eliminated; conqueredFields; fase; round). Se diverso: `ms_desync` → l'host risponde `ms_snapshot`. Loggato in telemetria.

Voci di log: `td_open {round, deployments:{X1:{cardId,fieldIndex,focus},X2}}` → `submitOpeningDeploy`; `td_respond {round, deployments, pairing}` → `submitResponseDeploy`; `koth_commit {round, seatId, cardId, investment, fieldIndex}` → `submitCommit`; `claim {round, decision}` → `resolveClaim`. `advanceAfterRound`/`advanceAfterContest` sono deterministici e li chiama ogni client dopo la presentazione. Voci arrivate presto: coda finché l'hook non è nello stadio giusto.

Input umani: apertura 2v2 = intent con i posti che controllo (l'host unisce i due posti della squadra; stesso Campo per due umani → `ms_reject` al secondo; la UI oscura il Campo del compagno). Risposta 2v2: stessa unione, `pairing` dal capitano (primo umano della squadra). Info tra compagni umani: `ms_team_note` mirato. Consigli: solo verso compagni IA. Re della collina: un intent per posa, l'host controlla `currentCommitter`. Reclami: capitano (2v2) o controllore del posto (RdC); squadra tutta IA → auto-reclamo come :558.

Hook (`src/hooks/useMultiSeatDuel.js`): sostituire `HUMAN_TEAM_SEAT`/`HUMAN_KOTH_SEAT` (:73-74) e 'A2','B1','B2','A','B' cablati con `me, myTeam, foeTeam, mate, foes` (teamBoard 173-198, mapTeamResult 200-204, mapKothResult 206-219, finishWith 325-345, mateFocusFor/mateThinks 354-360/403-425, teamBeginTurn 426, teamHumanConfirm 456-504, teamAfterScontro 554, KotH 608-724, advise 907-949, view.mateTrust 1062). Mappa `controllers` {seatId: 'local-human'|'local-ai'|'remote'|'host-ai'}; ogni mutazione via `dispatch(action)` (locale: immediata; online: invia l'intent e prosegue da `onLogEntry`). `armOnline({pkg, localSlot, isHost, net})`; `init` (:729-784) dal pacchetto.

Modulo puro nuovo `src/game/multiSeat/onlineSession.js`: `buildMatchPackage(config, readies, seed)` (mulberry32; mani umane da `deckCardIds`; mazzi IA con `pickAiArmyDeck`; Campi con `selectBattlefields` — 10 nel 2v2; `initialOrder` fisso per RdC; `{proto:1, kind, fieldMode, seed, battlefieldIds, initialOrder, seats:[{id, team, name, army, deckKey, deckCardIds, handIds, controller}]}`), `matchFromPackage(pkg, localSeatId)`, `requiredInputs`, `applyEntry`, `stateHash`, `class HostSequencer`, `seatControllers(pkg, localSlot)`.

Animazione di distribuzione: `beginSeededDeal(payload, {aiDifficulty})` estratto da `startOnlineMatch` in `useGameFlow.js`.

satze.jsx: inoltrare `p.type.startsWith('ms_')` con `fromSlot` a `multiSeatNetRef`; gli effetti di avvio Duello (~1871-1930) solo se `roomConfig.mode === 'duel'`; `sendRelay(roomCode, payload, to?)` (`multiplayer.js:145`); `slot` in sessione/riconnessione (`multiplayerReconnect.js`).

Riconnessione: ospite manda `ms_resync_req {lastSeq}` → host `ms_resync {pkg, config, entries}` mirato; replay senza animazioni. L'host salva pacchetto+log in localStorage; se lo perde lo chiede a un ospite. Host disconnesso: pausa fino a 5 minuti (migrazione dell'host rimandata).

## 3. Lobby
Flusso invariato: lobby → armata → esercito → `onlineDeckReady` diventa la **schermata stanza** (`src/components/multiplayer/OnlineRoomPanel.jsx`): membri (nome, esercito, pronto, connesso); controlli host trasmessi con `ms_lobby {rev, config}`: Modalità (Duello: esattamente 2 membri, percorso `deck_ready`/`match_start` invariato; 2v2; Re della collina), Formato (`MATCH_FORMATS`), giocatori 3/4, mappa posti 2v2 (default host A1, slot1 B1, slot2 A2, slot3 B2; scambiabili), difficoltà IA e carattere del compagno IA. Ospiti: `ms_ready {army, deckKey, deckCardIds, deckName, ready}`; host "Avvia" quando tutti pronti → `ms_start {pkg}`. `ms_hello {proto:1}`. Fine partita: "Torna alla stanza" (`ms_back_to_room`).

## 4. Ambito
Dentro: server; 2v2 con 2-4 umani in qualsiasi disposizione; RdC con 2-4 umani + IA; sequencer per le IA senza padrone; hash e resync; ritorno alla stanza; eliminato in RdC vede la sconfitta. Consigliato: "Affida all'IA" per un ospite assente > 60 s (`ms_controller`).
Rimandati: commit-reveal e redazione per squadra; migrazione host; spettatori; timer di turno; consigli/chat tra umani; rivincita istantanea; Eminenze nel multi-posto.

## 5. Test (senza browser)
1. `src/game/multiSeat/onlineSession.integration.test.js`: stesso seme → stesso pacchetto; `matchFromPackage` da ogni prospettiva → stesso `stateHash`; il sequencer rifiuta round/fase sbagliati, Campo non disponibile, compagni sullo stesso Campo, posto non di turno, investimento illegale, reclamo non dovuto.
2. `src/game/multiSeat/onlineSim.integration.test.js`: relay in memoria (ordine per mittente, interleaving casuale, ritardi), N client headless, "umani" giocati da `aiOpeningDeploy`/`aiResponsePlan`/`aiCommit` con rng indipendenti; ~200 semi × {2v2 con 2/3/4 umani in tutte le disposizioni, RdC 3 e 4 con 2-4 umani} × {classic, bareHands}; hash uguali dopo ogni `seq`, risultati finali uguali, nessun deadlock; disconnessione + `ms_resync` a metà partita.
3. **Proprietà di prospettiva (rischio principale, da fare per primo):** con mani reali da `ARMY_DECKS` e Campi reali, `resolveSeatDuel` nei due versi → vincitore, PV, FC, tossine, `fieldDestroyed`/`skipConquest` speculari.
4. `server/index.test.mjs` (`node --test`, `ws` in node_modules): server su PORT casuale con `SATZE_ROOMS_DIR` temporanea e `SATZE_RECONNECT_GRACE_MS=300`; flusso legacy; flusso a 4 posti; riavvio su `rooms.json` legacy. Script `test:server`.

## 6. Rischi
Esiti non speculari con abilità complesse (test 3, hash, snapshot); regressioni locali dell'hook (dispatch sincrono in locale + prova manuale); ordine della coda di presentazione; versioni miste (`capacity`, `proto`); file stanze persistito; refresh dell'host.

## 7. Ordine di lavoro
1. Test di prospettiva (3) e correzioni del motore.
2. `onlineSession.js` + test 1 e 2.
3. Server + test 4 → `fly deploy`.
4. Trasporto client (`sendRelay` con `to`, slot, rilevamento `capacity`, `create_room` con `maxPlayers: 4`).
5. Generalizzazione dell'hook, ancora solo locale; verifica che le modalità locali non cambino.
6. Hook online (`armOnline`, `onLogEntry`, attesa, note di squadra, reclami) + `beginSeededDeal`.
7. Schermata stanza `OnlineRoomPanel.jsx`.
8. Resync, persistenza host, "Affida all'IA".
9. Prova manuale: quattro schede contro `npm run server` locale, poi fly.

# Multiplayer a distanza (come un gioco online)

Due giocatori devono connettersi **allo stesso server WebSocket**. L’exe o il sito sono solo **client**: il server gira da parte sua (cloud o PC con IP pubblico).

## 1. Cosa serve

| Componente | Ruolo |
|------------|--------|
| **Server** `server/index.mjs` | Tiene le stanze e inoltra i messaggi tra i due client. |
| **Stesso URL per tutti** | Ogni client deve usare `ws://` o `wss://` che punta a **quel** server. |

## 2. Come imposti l’URL sul client (senza ricompilare ogni volta)

### Gioco in Electron (file .exe)

1. Copia `multiplayer.json.example` dalla cartella di installazione (accanto alle risorse) e rinominalo **`multiplayer.json`**.
2. Metti il file in **una** di queste posizioni (la prima trovata vince):
   - **Cartella dell’eseguibile** `SATZE.exe` (stesso livello dell’exe)
   - Oppure `%APPDATA%\SATZE\multiplayer.json`

Contenuto:

```json
{
  "wsUrl": "wss://satze-ws.onrender.com"
}
```

Usa **`wss://`** se il server è dietro HTTPS (consigliato in Internet).  
Usa **`ws://`** solo in LAN o in test locali.

### Gioco nel browser (build Vite / hosting statico)

Modifica **`public/satze-multiplayer.json`** prima del build, oppure il file copiato in **`dist/`** dopo il build:

```json
{
  "wsUrl": "wss://tuo-server.fly.dev"
}
```

Se `wsUrl` è vuoto, si usano `.env` (`VITE_MULTIPLAYER_URL`) e infine il fallback locale.

**Nota:** se il sito è servito in **HTTPS**, il browser richiede **`wss://`** verso il server (non `ws://` verso Internet), salvo eccezioni di policy.

## 3. Mettere il server in cloud (consigliato)

### Opzione A — Docker ovunque

Nella root del progetto:

```bash
docker build -t satze-ws .
docker run -p 3847:3847 -e PORT=3847 -e HOST=0.0.0.0 satze-ws
```

Su **Railway**, **Render**, **Fly.io**, **DigitalOcean App Platform**: collega il repo, scegli **Dockerfile**, lascia che la piattaforma imposti **`PORT`**. L’URL pubblico te lo dà il provider (es. `wss://…` dietro al loro proxy TLS).

### Opzione B — Render

È presente `render.yaml`: collega il repository a Render e crea un Web Service da Docker.

### Opzione C — Fly.io

```bash
fly launch
fly deploy
```

Aggiorna `fly.toml` se cambia regione o nome app. Il server legge `PORT` automaticamente.

### TLS (wss://)

In produzione quasi sempre:

- Il provider termina **HTTPS/WSS** sul bordo.
- Tu punti il client a `wss://hostname` che espone il servizio.

Se ospiti solo il processo Node senza TLS, puoi mettere **Caddy** o **Nginx** davanti che fa proxy WebSocket verso `localhost:PORT`.

Esempio Caddy:

```caddy
satze-ws.tuodominio.it {
    reverse_proxy localhost:3847
}
```

## 4. Sviluppo locale

```bash
npm run dev
```

Avvia insieme server WebSocket e Vite. Il file `.env` può contenere:

```env
VITE_MULTIPLAYER_URL=ws://127.0.0.1:3847
```

## 5. Checklist “gioco con un amico”

1. Deploy del server (o PC sempre acceso + port forwarding **3847** TCP e IP pubblico — sconsigliato per semplicità).
2. URL finale tipo `wss://…` messo in **`multiplayer.json`** (exe) o **`satze-multiplayer.json`** (web).
3. Entrambi usano **lo stesso** URL e la **stessa build** del gioco (o build compatibili).
4. Un giocatore **crea stanza**, l’altro **inserisce il codice** a 6 caratteri.

## 6. Riconnessione

- Il server assegna a ogni giocatore un **`reconnectSecret`** (in `room_created` / `joined`). Il client lo salva in **`sessionStorage`** e può riconnettere la WebSocket con il messaggio **`reconnect`** (stesso `roomCode` e `role`).
- In partita, se cadi tu: overlay **«Riconnetti»**. Se cade l’avversario: messaggio **in attesa** finché non torna (`peer_rejoined`).
- Se l’**host** resta assente più a lungo di **`SATZE_RECONNECT_GRACE_MS`** (millisecondi, default **120000**), la stanza viene chiusa e l’ospite riceve **`peer_left`** (come uscita definitiva).
- Se l’ospite è solo temporaneamente disconnesso, **nessun altro** può entrare con `join_room` nella stessa stanza (fino a riconnessione o nuova stanza).

## 7. Limiti attuali

- Stanza **massimo 2 giocatori** (host + ospite).
- **Nessun account** / matchmaking globale: solo codice stanza (come molti indie).
- Il server **non** valida le mosse di gioco (anti-cheat minimo); per un titolo competitivo servirebbe logica autoritativa lato server in un secondo momento.

/**
 * Ruolo Playtester con una reazione su Discord.
 *
 * Il bot resta collegato al gateway di Discord e ascolta le reazioni nel canale d'ingresso
 * (#inizia-qui): chi clicca l'emoji su un messaggio del bot riceve il ruolo, chi la toglie lo perde.
 * All'avvio (e a ogni nuova sessione) riallinea: dà il ruolo a chi ha reagito mentre il bot era spento.
 *
 * Variabili d'ambiente (senza token il bot non parte e il server multiplayer funziona come sempre):
 *   DISCORD_BOT_TOKEN      — token del bot (segreto: su Fly con `fly secrets set`, mai nel repository).
 *   SATZE_RUOLI_SERVER     — id del server Discord.
 *   SATZE_RUOLI_CANALE     — id del canale d'ingresso.
 *   SATZE_RUOLI_RUOLO      — id del ruolo da assegnare.
 *   SATZE_RUOLI_EMOJI      — emoji da cliccare (default 🎮).
 *
 * Usa solo `ws` (già dipendenza del server) e fetch: niente discord.js nell'immagine.
 */
import WebSocket from 'ws';

const INTENTO_REAZIONI = 1 << 10; // GUILD_MESSAGE_REACTIONS: non privilegiato
const CHIUSURE_FATALI = new Set([4004, 4010, 4011, 4012, 4013, 4014]);
const OP = { DISPATCH: 0, HEARTBEAT: 1, IDENTIFY: 2, RESUME: 6, RECONNECT: 7, INVALID: 9, HELLO: 10, ACK: 11 };

/** Configurazione dalle variabili d'ambiente; null se manca qualcosa (bot spento). */
export function configDaAmbiente(env = process.env) {
  const token = env.DISCORD_BOT_TOKEN?.trim();
  if (!token) return null;
  const cfg = {
    token,
    serverId: env.SATZE_RUOLI_SERVER?.trim(),
    canaleId: env.SATZE_RUOLI_CANALE?.trim(),
    ruoloId: env.SATZE_RUOLI_RUOLO?.trim(),
    emoji: env.SATZE_RUOLI_EMOJI?.trim() || '🎮',
  };
  const nomi = { serverId: 'SATZE_RUOLI_SERVER', canaleId: 'SATZE_RUOLI_CANALE', ruoloId: 'SATZE_RUOLI_RUOLO' };
  const mancanti = Object.keys(nomi).filter((k) => !cfg[k]).map((k) => nomi[k]);
  if (mancanti.length) throw new Error(`ruoli Discord: mancano ${mancanti.join(', ')}`);
  return cfg;
}

/**
 * Avvia il bot. Restituisce `{ ferma }`.
 * `opzioni` (per i test): gatewayUrl, apiBase, fetch, log, attesa (ms tra due chiamate di riallineamento).
 */
export function avviaRuoliDiscord(cfg, opzioni = {}) {
  const gatewayUrl = opzioni.gatewayUrl ?? 'wss://gateway.discord.gg/?v=10&encoding=json';
  const apiBase = opzioni.apiBase ?? 'https://discord.com/api/v10';
  const fetchFn = opzioni.fetch ?? fetch;
  const log = opzioni.log ?? ((m) => console.log(`[ruoli Discord] ${m}`));
  const attesa = opzioni.attesa ?? 300;

  let ws = null;
  let battito = null;
  let primoBattito = null;
  let ackRicevuto = true;
  let seq = null;
  let sessione = null;
  let urlRipresa = null;
  let botId = null;
  let fermato = false;
  let tentativi = 0;
  let timerRiconnessione = null;

  const pausa = (ms) => new Promise((ok) => setTimeout(ok, ms));

  async function api(metodo, percorso, motivo) {
    for (let prova = 0; prova < 5; prova++) {
      const r = await fetchFn(`${apiBase}${percorso}`, {
        method: metodo,
        headers: {
          Authorization: `Bot ${cfg.token}`,
          'User-Agent': 'DiscordBot (satze-ws, 1.0)',
          ...(motivo ? { 'X-Audit-Log-Reason': encodeURIComponent(motivo) } : {}),
        },
      });
      if (r.status === 429) {
        const corpo = await r.json().catch(() => ({}));
        await pausa(Math.ceil((corpo.retry_after ?? 1) * 1000));
        continue;
      }
      if (r.status === 204) return null;
      const corpo = await r.json().catch(() => null);
      if (!r.ok) {
        const e = new Error(`${metodo} ${percorso} → ${r.status} ${corpo?.message ?? ''}`.trim());
        e.status = r.status;
        e.codice = corpo?.code;
        throw e;
      }
      return corpo;
    }
    throw new Error(`${metodo} ${percorso}: troppi limiti di frequenza`);
  }

  const percorsoRuolo = (utente) => `/guilds/${cfg.serverId}/members/${utente}/roles/${cfg.ruoloId}`;

  async function cambiaRuolo(utente, dai) {
    try {
      await api(dai ? 'PUT' : 'DELETE', percorsoRuolo(utente), dai ? 'Reazione nel canale d\'ingresso' : 'Reazione tolta');
      log(`${dai ? '+' : '−'} ruolo a ${utente}`);
    } catch (e) {
      // 50013: il ruolo del bot è sotto quello da assegnare, o manca il permesso Gestire i ruoli.
      const consiglio = e.codice === 50013 ? ' (sposta il ruolo del bot sopra Playtester in Impostazioni server → Ruoli)' : '';
      log(`! non riesco a ${dai ? 'dare' : 'togliere'} il ruolo a ${utente}: ${e.message}${consiglio}`);
    }
  }

  const emojiGiusta = (emoji) => !emoji?.id && emoji?.name === cfg.emoji;

  /** Dà il ruolo a chi ha già reagito (anche mentre il bot era spento). */
  async function riallinea() {
    try {
      const messaggi = await api('GET', `/channels/${cfg.canaleId}/messages?limit=50`);
      const miei = messaggi.filter((m) => m.author?.id === botId && m.reactions?.some((r) => emojiGiusta(r.emoji)));
      const utenti = new Set();
      for (const m of miei) {
        let dopo = null;
        for (;;) {
          const pagina = await api('GET', `/channels/${cfg.canaleId}/messages/${m.id}/reactions/${encodeURIComponent(cfg.emoji)}?limit=100${dopo ? `&after=${dopo}` : ''}`);
          for (const u of pagina) if (!u.bot && u.id !== botId) utenti.add(u.id);
          if (pagina.length < 100) break;
          dopo = pagina.at(-1).id;
        }
      }
      for (const u of utenti) {
        await cambiaRuolo(u, true);
        await pausa(attesa);
      }
      log(`riallineamento: ${utenti.size} reazioni controllate`);
    } catch (e) {
      log(`! riallineamento non riuscito: ${e.message}`);
    }
  }

  function gestisciEvento(tipo, d) {
    if (tipo === 'READY') {
      botId = d.user.id;
      sessione = d.session_id;
      urlRipresa = d.resume_gateway_url ? `${d.resume_gateway_url}/?v=10&encoding=json` : null;
      tentativi = 0;
      log(`collegato come ${d.user.username}`);
      void riallinea();
      return;
    }
    if (tipo === 'RESUMED') {
      tentativi = 0;
      return;
    }
    if (tipo !== 'MESSAGE_REACTION_ADD' && tipo !== 'MESSAGE_REACTION_REMOVE') return;
    if (d.guild_id !== cfg.serverId || d.channel_id !== cfg.canaleId || !emojiGiusta(d.emoji)) return;
    if (d.user_id === botId) return;
    // Solo le reazioni sui messaggi del bot (il campo manca nelle rimozioni).
    if (tipo === 'MESSAGE_REACTION_ADD') {
      if (d.member?.user?.bot) return;
      if (d.message_author_id && d.message_author_id !== botId) return;
    }
    void cambiaRuolo(d.user_id, tipo === 'MESSAGE_REACTION_ADD');
  }

  function invia(op, d) {
    if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ op, d }));
  }

  function fermaBattito() {
    if (battito) clearInterval(battito);
    if (primoBattito) clearTimeout(primoBattito);
    battito = null;
    primoBattito = null;
  }

  function collega(riprendi) {
    if (fermato) return;
    const url = riprendi && urlRipresa ? urlRipresa : gatewayUrl;
    const socket = new WebSocket(url);
    ws = socket;
    socket.on('message', (raw) => {
      let p;
      try { p = JSON.parse(String(raw)); } catch { return; }
      if (p.s != null) seq = p.s;
      switch (p.op) {
        case OP.HELLO: {
          fermaBattito();
          ackRicevuto = true;
          const intervallo = p.d.heartbeat_interval;
          primoBattito = setTimeout(() => invia(OP.HEARTBEAT, seq), Math.floor(intervallo * Math.random()));
          battito = setInterval(() => {
            if (!ackRicevuto) {
              // Nessuna risposta all'ultimo battito: connessione morta.
              socket.terminate();
              return;
            }
            ackRicevuto = false;
            invia(OP.HEARTBEAT, seq);
          }, intervallo);
          if (riprendi && sessione) invia(OP.RESUME, { token: cfg.token, session_id: sessione, seq });
          else invia(OP.IDENTIFY, { token: cfg.token, intents: INTENTO_REAZIONI, properties: { os: 'linux', browser: 'satze-ws', device: 'satze-ws' } });
          break;
        }
        case OP.ACK:
          ackRicevuto = true;
          break;
        case OP.HEARTBEAT:
          invia(OP.HEARTBEAT, seq);
          break;
        case OP.RECONNECT:
          socket.close(4900);
          break;
        case OP.INVALID:
          if (!p.d) { sessione = null; seq = null; }
          setTimeout(() => socket.close(4900), 1000 + Math.random() * 4000);
          break;
        case OP.DISPATCH:
          gestisciEvento(p.t, p.d);
          break;
        default:
      }
    });
    socket.on('error', (e) => log(`! errore di connessione: ${e.message}`));
    socket.on('close', (codice) => {
      fermaBattito();
      if (ws === socket) ws = null;
      if (fermato) return;
      if (CHIUSURE_FATALI.has(codice)) {
        log(`! Discord ha chiuso la connessione (${codice}): controlla il token. Il bot dei ruoli resta spento.`);
        return;
      }
      // Sessione scaduta o sequenza non valida: si riparte da capo invece di riprendere.
      if (codice === 4007 || codice === 4009) { sessione = null; seq = null; }
      tentativi += 1;
      const ritardo = Math.min(60000, 1000 * 2 ** Math.min(tentativi, 6));
      timerRiconnessione = setTimeout(() => collega(Boolean(sessione)), ritardo);
    });
  }

  collega(false);
  return {
    ferma() {
      fermato = true;
      fermaBattito();
      if (timerRiconnessione) clearTimeout(timerRiconnessione);
      ws?.close(1000);
    },
  };
}

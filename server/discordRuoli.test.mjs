// Bot del ruolo Playtester contro un gateway Discord finto (node --test server/discordRuoli.test.mjs).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { WebSocketServer } from 'ws';
import { avviaRuoliDiscord, configDaAmbiente } from './discordRuoli.mjs';

const CFG = { token: 'tok', serverId: 'G', canaleId: 'C', ruoloId: 'R', emoji: '🎮' };
const BOT = 'B0T';

/** Gateway finto: registra i payload ricevuti e permette di inviare eventi. */
async function gatewayFinto() {
  const wss = new WebSocketServer({ port: 0 });
  await new Promise((ok) => wss.once('listening', ok));
  const ricevuti = [];
  const connessioni = [];
  let attesa = null;
  wss.on('connection', (ws) => {
    connessioni.push(ws);
    ws.on('message', (raw) => {
      const p = JSON.parse(String(raw));
      if (p.op === 1) { ws.send(JSON.stringify({ op: 11 })); return; }
      ricevuti.push(p);
      attesa?.();
    });
    ws.send(JSON.stringify({ op: 10, d: { heartbeat_interval: 60000 } }));
  });
  let s = 0;
  return {
    url: `ws://127.0.0.1:${wss.address().port}`,
    ricevuti,
    connessioni,
    evento(t, d) { connessioni.at(-1).send(JSON.stringify({ op: 0, s: ++s, t, d })); },
    async aspetta(cond, ms = 5000) {
      const fine = Date.now() + ms;
      while (!cond()) {
        if (Date.now() > fine) throw new Error('timeout');
        await new Promise((ok) => { attesa = ok; setTimeout(ok, 20); });
      }
    },
    chiudi: () => new Promise((ok) => { for (const c of wss.clients) c.terminate(); wss.close(ok); }),
  };
}

/** API finta: messaggi del canale e reazioni; registra le modifiche ai ruoli. */
function apiFinta({ messaggi = [], reazioni = {} } = {}) {
  const chiamate = [];
  const fetch = async (url, { method }) => {
    const percorso = url.replace('http://api', '');
    chiamate.push(`${method} ${percorso}`);
    const json = (corpo, status = 200) => ({ status, ok: status < 400, json: async () => corpo });
    if (method === 'GET' && percorso.startsWith('/channels/C/messages?')) return json(messaggi);
    const r = percorso.match(/^\/channels\/C\/messages\/(\w+)\/reactions\//);
    if (method === 'GET' && r) return json(reazioni[r[1]] ?? []);
    if (percorso.includes('/roles/')) return { status: 204, ok: true, json: async () => null };
    return json({ message: 'non trovato' }, 404);
  };
  return { fetch, chiamate, ruoli: () => chiamate.filter((c) => c.includes('/roles/')) };
}

const ready = { user: { id: BOT, username: 'Satze setup' }, session_id: 'S1', resume_gateway_url: null };

test('configurazione: senza token il bot resta spento, senza id è un errore', () => {
  assert.equal(configDaAmbiente({}), null);
  assert.throws(() => configDaAmbiente({ DISCORD_BOT_TOKEN: 'x' }), /SATZE_RUOLI_SERVER/);
  assert.deepEqual(
    configDaAmbiente({ DISCORD_BOT_TOKEN: 'x', SATZE_RUOLI_SERVER: 'G', SATZE_RUOLI_CANALE: 'C', SATZE_RUOLI_RUOLO: 'R' }),
    { token: 'x', serverId: 'G', canaleId: 'C', ruoloId: 'R', emoji: '🎮' },
  );
});

test('si identifica, riallinea le reazioni già presenti e segue quelle nuove', async () => {
  const gw = await gatewayFinto();
  const api = apiFinta({
    messaggi: [
      { id: 'M1', author: { id: BOT }, reactions: [{ emoji: { id: null, name: '🎮' } }] },
      { id: 'M2', author: { id: 'altro' }, reactions: [{ emoji: { id: null, name: '🎮' } }] },
    ],
    reazioni: { M1: [{ id: BOT, bot: true }, { id: 'U1' }, { id: 'U2' }], M2: [{ id: 'U9' }] },
  });
  const bot = avviaRuoliDiscord(CFG, { gatewayUrl: gw.url, apiBase: 'http://api', fetch: api.fetch, log: () => {}, attesa: 0 });
  try {
    await gw.aspetta(() => gw.ricevuti.some((p) => p.op === 2));
    const identify = gw.ricevuti.find((p) => p.op === 2);
    assert.equal(identify.d.token, 'tok');
    assert.equal(identify.d.intents, 1024);

    gw.evento('READY', ready);
    await gw.aspetta(() => api.ruoli().length === 2);
    assert.deepEqual(api.ruoli(), ['PUT /guilds/G/members/U1/roles/R', 'PUT /guilds/G/members/U2/roles/R']);
    assert.ok(!api.chiamate.some((c) => c.includes('/M2/')), 'i messaggi di altri non contano');

    const base = { guild_id: 'G', channel_id: 'C', message_id: 'M1', emoji: { id: null, name: '🎮' }, message_author_id: BOT };
    gw.evento('MESSAGE_REACTION_ADD', { ...base, emoji: { id: null, name: '👍' }, user_id: 'X1' });
    gw.evento('MESSAGE_REACTION_ADD', { ...base, channel_id: 'ALTRO', user_id: 'X2' });
    gw.evento('MESSAGE_REACTION_ADD', { ...base, message_author_id: 'altro', user_id: 'X3' });
    gw.evento('MESSAGE_REACTION_ADD', { ...base, user_id: 'X4', member: { user: { bot: true } } });
    gw.evento('MESSAGE_REACTION_ADD', { ...base, user_id: 'U3', member: { user: { bot: false } } });
    gw.evento('MESSAGE_REACTION_REMOVE', { ...base, message_author_id: undefined, user_id: 'U1' });
    await gw.aspetta(() => api.ruoli().length === 4);
    assert.deepEqual(api.ruoli().slice(2), ['PUT /guilds/G/members/U3/roles/R', 'DELETE /guilds/G/members/U1/roles/R']);
  } finally {
    bot.ferma();
    await gw.chiudi();
  }
});

test('dopo una caduta riprende la sessione; con un token rifiutato si ferma', async () => {
  const gw = await gatewayFinto();
  const api = apiFinta();
  const righe = [];
  const bot = avviaRuoliDiscord(CFG, { gatewayUrl: gw.url, apiBase: 'http://api', fetch: api.fetch, log: (m) => righe.push(m), attesa: 0 });
  try {
    await gw.aspetta(() => gw.ricevuti.some((p) => p.op === 2));
    gw.evento('READY', ready);
    gw.evento('MESSAGE_REACTION_ADD', { guild_id: 'G', channel_id: 'C', message_id: 'M1', emoji: { name: '🎮' }, user_id: 'U1', message_author_id: BOT });
    await gw.aspetta(() => api.ruoli().length === 1);

    gw.connessioni.at(-1).close(4000);
    await gw.aspetta(() => gw.ricevuti.some((p) => p.op === 6), 8000);
    const resume = gw.ricevuti.find((p) => p.op === 6);
    assert.deepEqual(resume.d, { token: 'tok', session_id: 'S1', seq: 2 });

    const connessioni = gw.connessioni.length;
    gw.connessioni.at(-1).close(4004);
    await new Promise((ok) => setTimeout(ok, 2500));
    assert.equal(gw.connessioni.length, connessioni, 'con 4004 non si ricollega');
    assert.ok(righe.some((r) => r.includes('4004')));
  } finally {
    bot.ferma();
    await gw.chiudi();
  }
});

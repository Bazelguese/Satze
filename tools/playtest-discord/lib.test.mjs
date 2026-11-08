// Test con un server Discord finto: verificano la logica senza collegarsi a Discord.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ChannelType, PermissionFlagsBits as P } from 'discord.js';
import { allestisci, verificaContenuti, unisciTag, collegaCanali, permessiPer } from './lib.mjs';
import { STRUTTURA } from './contenuti.mjs';

const BOT = 'bot-1';
const CFG = { versione: '0.1.0', linkDownload: '', linkSondaggio: '', idDev: '', idPlaytester: [] };

class Cache extends Map {
  find(fn) {
    for (const v of this.values()) if (fn(v)) return v;
    return undefined;
  }
}

function serverFinto({ forumVietati = false } = {}) {
  let prossimoId = 100;
  let orologio = 0;
  const nuovoId = () => String(prossimoId++);
  const conteggi = { ruoliCreati: 0, canaliCreati: 0, messaggiInviati: 0, messaggiModificati: 0, messaggiCancellati: 0 };

  const ruoli = new Cache();
  const canali = new Cache();

  function canaleFinto(opts) {
    const messaggi = new Cache();
    const canale = {
      id: nuovoId(),
      name: opts.name,
      type: opts.type,
      parentId: opts.parent?.id ?? null,
      topic: opts.topic ?? null,
      availableTags: (opts.availableTags ?? []).map((t) => ({ ...t, id: t.id ?? nuovoId() })),
      permissionOverwrites: opts.permissionOverwrites,
      messaggi,
      async edit(o) {
        if (o.availableTags) o = { ...o, availableTags: o.availableTags.map((t) => ({ ...t, id: t.id ?? nuovoId() })) };
        Object.assign(canale, o);
        return canale;
      },
      messages: { fetch: async () => messaggi },
      async send({ content }) {
        conteggi.messaggiInviati++;
        const m = {
          id: nuovoId(),
          content,
          author: { id: BOT },
          createdTimestamp: ++orologio,
          async edit({ content: c }) { conteggi.messaggiModificati++; m.content = c; return m; },
          async delete() { conteggi.messaggiCancellati++; messaggi.delete(m.id); },
        };
        messaggi.set(m.id, m);
        return m;
      },
    };
    return canale;
  }

  const membri = new Map();
  const guild = {
    roles: {
      cache: ruoli,
      everyone: { id: 'everyone' },
      async fetch() {},
      async create(o) {
        conteggi.ruoliCreati++;
        const r = { id: nuovoId(), name: o.name };
        ruoli.set(r.id, r);
        return r;
      },
    },
    channels: {
      cache: canali,
      async fetch() {},
      async create(o) {
        if (forumVietati && o.type === ChannelType.GuildForum) throw new Error('Forum non disponibili');
        conteggi.canaliCreati++;
        const c = canaleFinto(o);
        canali.set(c.id, c);
        return c;
      },
    },
    members: {
      async fetch(id) {
        if (!membri.has(id)) {
          const assegnati = new Map();
          membri.set(id, {
            user: { username: `utente${id}` },
            roles: { cache: assegnati, add: async (r) => assegnati.set(r.id, r) },
          });
        }
        return membri.get(id);
      },
    },
  };
  return { guild, conteggi, canali, membri };
}

const muto = () => {};
const canaleDiNome = (canali, nome) => [...canali.values()].find((c) => c.name === nome);
const totaleCanali = STRUTTURA.reduce((n, g) => n + 1 + g.canali.length, 0);

test('i contenuti rispettano i limiti di Discord', () => {
  assert.deepEqual(verificaContenuti(CFG), []);
  assert.deepEqual(verificaContenuti({ ...CFG, linkDownload: 'https://drive.google.com/x', linkSondaggio: 'https://forms.gle/x' }), []);
});

test('primo avvio: crea ruoli, categorie, canali e messaggi con i link ai canali', async () => {
  const { guild, conteggi, canali } = serverFinto();
  const { avvisi } = await allestisci(guild, BOT, CFG, muto);
  assert.equal(conteggi.ruoliCreati, 2);
  assert.equal(conteggi.canaliCreati, totaleCanali);
  assert.deepEqual(avvisi, []);

  const benvenuto = canaleDiNome(canali, 'benvenuto');
  const download = canaleDiNome(canali, 'download');
  const testo = [...benvenuto.messaggi.values()].map((m) => m.content).join('\n');
  assert.ok(testo.includes(`<#${download.id}>`), 'il link a #download punta al canale vero');
  assert.ok(!/<#[a-z]/.test(testo), 'nessun <#nome> rimasto senza id');

  const bug = canaleDiNome(canali, 'bug');
  assert.equal(bug.type, ChannelType.GuildForum);
  assert.ok(bug.topic.includes('Versione:'));
  assert.ok(bug.availableTags.find((t) => t.name === 'risolto').moderated, 'solo il dev mette "risolto"');
});

test('secondo avvio: non duplica niente', async () => {
  const { guild, conteggi } = serverFinto();
  await allestisci(guild, BOT, CFG, muto);
  const prima = { ...conteggi };
  await allestisci(guild, BOT, CFG, muto);
  assert.equal(conteggi.ruoliCreati, prima.ruoliCreati);
  assert.equal(conteggi.canaliCreati, prima.canaliCreati);
  assert.equal(conteggi.messaggiInviati, prima.messaggiInviati);
  assert.equal(conteggi.messaggiModificati, 0);
});

test('aggiungere il link del sondaggio modifica solo quel messaggio', async () => {
  const { guild, conteggi, canali } = serverFinto();
  await allestisci(guild, BOT, CFG, muto);
  const inviati = conteggi.messaggiInviati;
  await allestisci(guild, BOT, { ...CFG, linkSondaggio: 'https://forms.gle/prova' }, muto);
  assert.equal(conteggi.messaggiInviati, inviati);
  assert.equal(conteggi.messaggiModificati, 1);
  const annunci = [...canaleDiNome(canali, 'annunci').messaggi.values()];
  assert.ok(annunci.at(-1).content.includes('https://forms.gle/prova'));
});

test('i messaggi scritti da altri restano dove sono', async () => {
  const { guild, conteggi, canali } = serverFinto();
  await allestisci(guild, BOT, CFG, muto);
  const benvenuto = canaleDiNome(canali, 'benvenuto');
  benvenuto.messaggi.set('altrui', { id: 'altrui', author: { id: 'davide' }, content: 'ciao', createdTimestamp: 999 });
  await allestisci(guild, BOT, CFG, muto);
  assert.ok(benvenuto.messaggi.has('altrui'));
  assert.equal(conteggi.messaggiCancellati, 0);
});

test('se i forum non si possono creare ripiega su canali di testo e avvisa', async () => {
  const { guild, canali } = serverFinto({ forumVietati: true });
  const { avvisi } = await allestisci(guild, BOT, CFG, muto);
  assert.equal(avvisi.length, 3);
  const bug = canaleDiNome(canali, 'bug');
  assert.equal(bug.type, ChannelType.GuildText);
  assert.ok([...bug.messaggi.values()][0].content.includes('Versione:'));
});

test('assegna i ruoli agli id indicati', async () => {
  const { guild, membri } = serverFinto();
  await allestisci(guild, BOT, { ...CFG, idDev: '1', idPlaytester: ['2', '3'] }, muto);
  const nomi = (id) => [...membri.get(id).roles.cache.values()].map((r) => r.name);
  assert.deepEqual(nomi('1'), ['Dev Satze']);
  assert.deepEqual(nomi('2'), ['Playtester']);
  assert.deepEqual(nomi('3'), ['Playtester']);
});

test('permessi: info in sola lettura, dev privato, tutto nascosto a chi non è nel playtest', () => {
  const ids = { everyoneId: 'e', devId: 'd', playtesterId: 'p' };
  const lettura = permessiPer('lettura', ids);
  assert.ok(lettura.find((o) => o.id === 'e').deny.includes(P.ViewChannel));
  const pt = lettura.find((o) => o.id === 'p');
  assert.ok(pt.allow.includes(P.ViewChannel) && pt.deny.includes(P.SendMessages));
  assert.ok(permessiPer('feedback', ids).find((o) => o.id === 'p').allow.includes(P.SendMessages));
  assert.equal(permessiPer('privato', ids).find((o) => o.id === 'p'), undefined);
});

test('unisciTag conserva gli id dei tag esistenti e quelli aggiunti a mano', () => {
  const esistenti = [{ id: '7', name: 'crash' }, { id: '8', name: 'mio tag' }];
  const uniti = unisciTag(esistenti, [{ name: 'crash' }, { name: 'IA' }]);
  assert.deepEqual(uniti.map((t) => [t.name, t.id]), [['crash', '7'], ['IA', undefined], ['mio tag', '8']]);
});

test('collegaCanali lascia stare i canali che non conosce', () => {
  const ids = new Map([['bug', '42']]);
  assert.equal(collegaCanali('vai in <#bug> o <#boh>', ids), 'vai in <#42> o <#boh>');
});

test('inFormatoApi converte permessi, tag e reazione nel formato di Discord', async () => {
  const { inFormatoApi } = await import('./discordRest.mjs');
  const api = inFormatoApi({
    name: 'bug',
    type: ChannelType.GuildForum,
    parent: { id: '9' },
    permissionOverwrites: [{ id: 'e', deny: [P.ViewChannel] }, { id: 'p', allow: [P.ViewChannel, P.SendMessages] }],
    availableTags: [{ id: '5', name: 'crash', emoji: { id: null, name: '💥' }, moderated: false }, { name: 'nuovo', emoji: null }],
    defaultReactionEmoji: { id: null, name: '👍' },
  });
  assert.equal(api.parent_id, '9');
  assert.deepEqual(api.permission_overwrites[0], { id: 'e', type: 0, allow: '0', deny: P.ViewChannel.toString() });
  assert.equal(api.permission_overwrites[1].allow, (P.ViewChannel | P.SendMessages).toString());
  assert.deepEqual(api.available_tags[0], { id: '5', name: 'crash', moderated: false, emoji_id: null, emoji_name: '💥' });
  assert.equal(api.available_tags[1].id, undefined);
  assert.deepEqual(api.default_reaction_emoji, { emoji_id: null, emoji_name: '👍' });
  assert.equal('topic' in inFormatoApi({ name: 'x' }), false, 'i campi assenti non vengono mandati');
});

// ============================================
// Logica di allestimento del server di playtest.
// Idempotente: rilanciata, aggiorna ciò che ha creato e non duplica niente.
// Non cancella mai canali, ruoli o messaggi che non ha creato lei.
// ============================================

import { ChannelType, PermissionFlagsBits as P, SortOrderType, ForumLayoutType } from 'discord.js';
import { STRUTTURA, RUOLI, messaggi, lineeGuida, post as postDelForum } from './contenuti.mjs';

export const LIMITI = {
  messaggio: 2000,
  descrizioneTesto: 1024,
  lineeGuidaForum: 4096,
  nomeTag: 20,
  tagPerForum: 20,
  titoloPost: 100,
};

const TIPI = {
  testo: ChannelType.GuildText,
  forum: ChannelType.GuildForum,
  vocale: ChannelType.GuildVoice,
};

const LEGGERE = [P.ViewChannel, P.ReadMessageHistory, P.AddReactions];
const SCRIVERE = [P.SendMessages, P.SendMessagesInThreads, P.AttachFiles, P.EmbedLinks];
const PARLARE = [P.Connect, P.Speak, P.Stream, P.UseVAD];

/** Permessi della categoria (e dei suoi canali) in base al tipo di accesso. */
export function permessiPer(accesso, { everyoneId, devId, playtesterId }) {
  const permessi = [
    { id: everyoneId, deny: [P.ViewChannel] },
    { id: devId, allow: [...LEGGERE, ...SCRIVERE, ...PARLARE, P.ManageMessages, P.ManageThreads, P.MentionEveryone] },
  ];
  if (accesso === 'lettura') {
    permessi.push({
      id: playtesterId,
      allow: LEGGERE,
      deny: [P.SendMessages, P.SendMessagesInThreads, P.CreatePublicThreads, P.CreatePrivateThreads],
    });
  } else if (accesso === 'feedback') {
    permessi.push({ id: playtesterId, allow: [...LEGGERE, ...SCRIVERE] });
  } else if (accesso === 'libero') {
    permessi.push({ id: playtesterId, allow: [...LEGGERE, ...SCRIVERE, ...PARLARE] });
  } else if (accesso !== 'privato') {
    throw new Error(`Accesso sconosciuto: ${accesso}`);
  }
  return permessi;
}

/** Discord scrive i nomi dei canali di testo e dei forum in minuscolo e con i trattini. */
export function nomeDiscord(nome, tipo) {
  if (tipo === 'vocale') return nome;
  return nome.toLowerCase().trim().replace(/\s+/g, '-');
}

function tagDesiderati(canale) {
  return (canale.tag ?? []).map((t) => ({
    name: t.nome,
    emoji: t.emoji ? { id: null, name: t.emoji } : null,
    moderated: Boolean(t.soloDev),
  }));
}

/** Tiene gli id dei tag già esistenti (così i post già etichettati non perdono il tag) e aggiunge i mancanti. */
export function unisciTag(esistenti, desiderati) {
  const perNome = new Map((esistenti ?? []).map((t) => [t.name, t]));
  const risultato = desiderati.map((t) => {
    const vecchio = perNome.get(t.name);
    perNome.delete(t.name);
    return vecchio ? { ...t, id: vecchio.id } : t;
  });
  // I tag aggiunti a mano restano, finché c'è posto.
  for (const t of perNome.values()) {
    if (risultato.length < LIMITI.tagPerForum) risultato.push(t);
  }
  return risultato;
}

/** Sostituisce `<#nome-canale>` con il link vero al canale. */
export function collegaCanali(testo, idPerNome) {
  return testo.replace(/<#([a-z0-9-]+)>/g, (intero, nome) => (idPerNome.has(nome) ? `<#${idPerNome.get(nome)}>` : intero));
}

/** Controlli che si possono fare senza Discord: lunghezze e limiti. Restituisce gli errori trovati. */
export function verificaContenuti(cfg) {
  const errori = [];
  const testi = messaggi(cfg);
  const guide = lineeGuida(cfg);
  for (const gruppo of STRUTTURA) {
    for (const c of gruppo.canali) {
      const dove = `#${nomeDiscord(c.nome, c.tipo)}`;
      if (!(c.tipo in TIPI)) errori.push(`${dove}: tipo sconosciuto "${c.tipo}"`);
      if (c.descrizione && c.descrizione.length > LIMITI.descrizioneTesto) errori.push(`${dove}: descrizione oltre ${LIMITI.descrizioneTesto} caratteri`);
      if (c.messaggi) {
        const lista = testi[c.messaggi];
        if (!lista) errori.push(`${dove}: messaggi "${c.messaggi}" non trovati`);
        else lista.forEach((m, i) => {
          if (m.length > LIMITI.messaggio) errori.push(`${dove}: il messaggio ${i + 1} ha ${m.length} caratteri (max ${LIMITI.messaggio})`);
        });
      }
      if (c.post) {
        const lista = postDelForum(cfg)[c.post];
        if (!lista?.length) errori.push(`${dove}: post "${c.post}" non trovati`);
        else lista.forEach((p) => {
          if (!p.titolo || p.titolo.length > LIMITI.titoloPost) errori.push(`${dove}: titolo del post "${p.titolo}" vuoto o oltre ${LIMITI.titoloPost} caratteri`);
          p.messaggi.forEach((m, i) => {
            if (m.length > LIMITI.messaggio) errori.push(`${dove} › ${p.titolo}: il messaggio ${i + 1} ha ${m.length} caratteri (max ${LIMITI.messaggio})`);
          });
        });
      }
      if (c.tipo === 'forum') {
        const guida = guide[c.lineeGuida];
        if (!guida) errori.push(`${dove}: linee guida "${c.lineeGuida}" non trovate`);
        else if (guida.length > LIMITI.lineeGuidaForum) errori.push(`${dove}: linee guida oltre ${LIMITI.lineeGuidaForum} caratteri`);
        if ((c.tag ?? []).length > LIMITI.tagPerForum) errori.push(`${dove}: più di ${LIMITI.tagPerForum} tag`);
        for (const t of c.tag ?? []) {
          if (t.nome.length > LIMITI.nomeTag) errori.push(`${dove}: il tag "${t.nome}" supera ${LIMITI.nomeTag} caratteri`);
        }
      }
    }
  }
  return errori;
}

async function trovaOCreaRuolo(guild, { nome, colore }, opzioni, log) {
  const esistente = guild.roles.cache.find((r) => r.name === nome);
  if (esistente) {
    log(`  = ruolo ${nome} (già presente)`);
    return esistente;
  }
  const ruolo = await guild.roles.create({ name: nome, colors: { primaryColor: colore }, ...opzioni, reason: 'Playtest SATZE' });
  log(`  + ruolo ${nome}`);
  return ruolo;
}

async function trovaOCreaCanale(guild, { nome, tipo, parent, permessi, extra }, log) {
  const esistente = guild.channels.cache.find(
    (c) => c.name === nome && c.type === tipo && (parent ? c.parentId === parent.id : true),
  );
  if (esistente) {
    await esistente.edit({ ...extra, permissionOverwrites: permessi, reason: 'Playtest SATZE' });
    log(`  = ${etichetta(tipo)} ${nome} (aggiornato)`);
    return esistente;
  }
  const creato = await guild.channels.create({
    name: nome,
    type: tipo,
    parent: parent ?? undefined,
    permissionOverwrites: permessi,
    ...extra,
    reason: 'Playtest SATZE',
  });
  log(`  + ${etichetta(tipo)} ${nome}`);
  return creato;
}

function etichetta(tipo) {
  if (tipo === ChannelType.GuildCategory) return 'categoria';
  if (tipo === ChannelType.GuildForum) return 'forum';
  if (tipo === ChannelType.GuildVoice) return 'vocale';
  return 'canale';
}

/**
 * Allinea i messaggi del bot in un canale ai testi voluti.
 * Stesso numero di messaggi → li modifica; numero diverso → cancella i suoi e li ripubblica.
 * I messaggi scritti da altri non vengono toccati.
 */
async function sincronizzaMessaggi(canale, testi, botId, log) {
  const recenti = await canale.messages.fetch({ limit: 100 });
  const miei = [...recenti.values()]
    .filter((m) => m.author?.id === botId)
    .sort((a, b) => a.createdTimestamp - b.createdTimestamp);
  const nessunaMenzione = { parse: [] };

  if (miei.length === testi.length) {
    let cambiati = 0;
    for (let i = 0; i < testi.length; i++) {
      if (miei[i].content !== testi[i]) {
        await miei[i].edit({ content: testi[i], allowedMentions: nessunaMenzione });
        cambiati++;
      }
    }
    log(`    ${cambiati ? `✎ ${cambiati} messaggi aggiornati` : '= messaggi già aggiornati'} in #${canale.name}`);
    return;
  }
  for (const m of miei) await m.delete();
  for (const testo of testi) await canale.send({ content: testo, allowedMentions: nessunaMenzione });
  log(`    ✉ ${testi.length} messaggi pubblicati in #${canale.name}`);
}

/**
 * Allinea i post del bot in un forum di sola lettura (es. la guida).
 * Stessi titoli nello stesso ordine e stesso numero di messaggi → modifica i testi.
 * Qualsiasi cambio di struttura → cancella i post del bot e li ricrea, così l'ordine resta quello di lettura.
 * I post sono creati dall'ultimo al primo: il forum li ordina per data di creazione, dal più recente.
 */
async function sincronizzaPost(forum, posts, botId, collega, log) {
  const esistenti = (await forum.threads.fetchAll()).filter((t) => t.ownerId === botId);
  const perTitolo = new Map(esistenti.map((t) => [t.name, t]));

  let strutturaUguale = esistenti.length === posts.length && posts.every((p) => perTitolo.has(p.titolo));
  const messaggiPerPost = new Map();
  if (strutturaUguale) {
    for (const p of posts) {
      const t = perTitolo.get(p.titolo);
      if (t.archived) await t.edit({ archived: false });
      const miei = [...(await t.messages.fetch({ limit: 100 })).values()]
        .filter((m) => m.author?.id === botId)
        .sort((a, b) => a.createdTimestamp - b.createdTimestamp);
      if (miei.length !== p.messaggi.length) { strutturaUguale = false; break; }
      messaggiPerPost.set(p.titolo, miei);
    }
  }

  if (strutturaUguale) {
    let cambiati = 0;
    for (const p of posts) {
      const miei = messaggiPerPost.get(p.titolo);
      for (let i = 0; i < p.messaggi.length; i++) {
        const testo = collega(p.messaggi[i]);
        if (miei[i].content !== testo) { await miei[i].edit({ content: testo }); cambiati++; }
      }
      await perTitolo.get(p.titolo).edit({ locked: true });
    }
    log(`    ${cambiati ? `✎ ${cambiati} messaggi aggiornati` : '= post già aggiornati'} in #${forum.name}`);
    return;
  }

  for (const t of esistenti) await t.delete();
  for (const p of [...posts].reverse()) {
    const [primo, ...altri] = p.messaggi.map(collega);
    const t = await forum.threads.create({ name: p.titolo, content: primo });
    for (const testo of altri) await t.send({ content: testo });
    await t.edit({ locked: true });
  }
  log(`    ✉ ${posts.length} post pubblicati in #${forum.name}`);
}

async function assegnaRuolo(guild, userId, ruolo, log) {
  try {
    const membro = await guild.members.fetch(userId);
    if (membro.roles.cache.has(ruolo.id)) {
      log(`  = ${membro.user.username} ha già ${ruolo.name}`);
      return;
    }
    await membro.roles.add(ruolo, 'Playtest SATZE');
    log(`  + ${ruolo.name} a ${membro.user.username}`);
  } catch (e) {
    log(`  ! non riesco ad assegnare ${ruolo.name} a ${userId}: ${e.message}`);
  }
}

/**
 * Allestisce il server. `guild` è la Guild di discord.js, `botId` l'id del bot.
 * @returns {Promise<{ canali: Map<string, string>, avvisi: string[] }>}
 */
export async function allestisci(guild, botId, cfg, log = console.log) {
  const avvisi = [];
  await guild.roles.fetch();
  await guild.channels.fetch();

  log('Ruoli');
  const dev = await trovaOCreaRuolo(guild, RUOLI.dev, { hoist: true, mentionable: false }, log);
  const playtester = await trovaOCreaRuolo(guild, RUOLI.playtester, { hoist: true, mentionable: true }, log);
  const ids = { everyoneId: guild.roles.everyone.id, devId: dev.id, playtesterId: playtester.id };

  const guide = lineeGuida(cfg);
  const testi = messaggi(cfg);
  const idPerNome = new Map();
  const conMessaggi = [];
  const conPost = [];

  for (const gruppo of STRUTTURA) {
    log(`\n${gruppo.categoria}`);
    const permessi = permessiPer(gruppo.accesso, ids);
    const categoria = await trovaOCreaCanale(guild, { nome: gruppo.categoria, tipo: ChannelType.GuildCategory, permessi }, log);

    for (const c of gruppo.canali) {
      const nome = nomeDiscord(c.nome, c.tipo);
      let canale;
      if (c.tipo === 'forum') {
        const esistente = guild.channels.cache.find((x) => x.name === nome && x.type === ChannelType.GuildForum && x.parentId === categoria.id);
        const extra = {
          topic: guide[c.lineeGuida],
          availableTags: unisciTag(esistente?.availableTags, tagDesiderati(c)),
          defaultReactionEmoji: c.reazione ? { id: null, name: c.reazione } : null,
          defaultSortOrder: c.ordinaPerCreazione ? SortOrderType.CreationDate : SortOrderType.LatestActivity,
          defaultForumLayout: ForumLayoutType.ListView,
        };
        try {
          canale = await trovaOCreaCanale(guild, { nome, tipo: ChannelType.GuildForum, parent: categoria, permessi, extra }, log);
        } catch (e) {
          // Alcuni server non possono creare forum: ripiego su un canale di testo.
          const avviso = `#${nome}: non sono riuscito a creare un forum (${e.message}); creo un canale di testo normale.`;
          avvisi.push(avviso);
          log(`  ! ${avviso}`);
          canale = await trovaOCreaCanale(guild, {
            nome,
            tipo: ChannelType.GuildText,
            parent: categoria,
            permessi,
            extra: { topic: guide[c.lineeGuida].slice(0, LIMITI.descrizioneTesto) },
          }, log);
          conMessaggi.push({ canale, testi: [guide[c.lineeGuida]] });
        }
      } else {
        const extra = c.tipo === 'testo' && c.descrizione ? { topic: c.descrizione } : {};
        canale = await trovaOCreaCanale(guild, { nome, tipo: TIPI[c.tipo], parent: categoria, permessi, extra }, log);
      }
      idPerNome.set(nome, canale.id);
      if (c.messaggi) conMessaggi.push({ canale, testi: testi[c.messaggi] });
      if (c.post) {
        const lista = postDelForum(cfg)[c.post];
        if (canale.type === ChannelType.GuildForum) conPost.push({ canale, posts: lista });
        // Senza forum: un messaggio per post, in ordine, con il titolo in testa.
        else conMessaggi.push({ canale, testi: lista.flatMap((p) => p.messaggi.map((m, i) => (i === 0 ? `# ${p.titolo}\n${m}` : m))) });
      }
    }
  }

  log('\nMessaggi');
  for (const { canale, testi: lista } of conMessaggi) {
    await sincronizzaMessaggi(canale, lista.map((t) => collegaCanali(t, idPerNome)), botId, log);
  }
  for (const { canale, posts } of conPost) {
    await sincronizzaPost(canale, posts, botId, (t) => collegaCanali(t, idPerNome), log);
  }

  const idDev = cfg.idDev?.trim();
  const idPlaytester = (cfg.idPlaytester ?? []).map((x) => String(x).trim()).filter(Boolean);
  if (idDev || idPlaytester.length) {
    log('\nRuoli ai membri');
    if (idDev) await assegnaRuolo(guild, idDev, dev, log);
    for (const id of idPlaytester) await assegnaRuolo(guild, id, playtester, log);
  }

  return { canali: idPerNome, avvisi };
}

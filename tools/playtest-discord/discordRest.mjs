// ============================================
// Accesso a Discord via API REST (niente connessione gateway).
// Espone un oggetto "guild" con la stessa forma che usa lib.mjs,
// così la logica resta una sola e i test con il server finto valgono anche qui.
// ============================================

const API = 'https://discord.com/api/v10';

class Cache extends Map {
  find(fn) {
    for (const v of this.values()) if (fn(v)) return v;
    return undefined;
  }
}

export function creaClient(token) {
  async function chiama(metodo, percorso, corpo, motivo) {
    for (let tentativo = 0; tentativo < 5; tentativo++) {
      const headers = { Authorization: `Bot ${token}`, 'User-Agent': 'DiscordBot (satze-playtest-setup, 1.0)' };
      if (corpo !== undefined) headers['Content-Type'] = 'application/json';
      if (motivo) headers['X-Audit-Log-Reason'] = encodeURIComponent(motivo);
      const r = await fetch(API + percorso, { method: metodo, headers, body: corpo === undefined ? undefined : JSON.stringify(corpo) });
      if (r.status === 429) {
        const info = await r.json().catch(() => ({}));
        await new Promise((ok) => setTimeout(ok, Math.ceil((info.retry_after ?? 1) * 1000) + 100));
        continue;
      }
      if (r.status === 204) return null;
      const dati = await r.json().catch(() => null);
      if (!r.ok) {
        const dettagli = dati?.errors ? ` ${JSON.stringify(dati.errors)}` : '';
        const err = new Error(`${metodo} ${percorso} → ${r.status} ${dati?.message ?? ''}${dettagli}`);
        err.status = r.status;
        throw err;
      }
      return dati;
    }
    throw new Error(`${metodo} ${percorso}: troppi limiti di frequenza, riprova fra poco`);
  }
  return { chiama };
}

const somma = (flag = []) => flag.reduce((tot, f) => tot | BigInt(f), 0n).toString();

/** Converte le opzioni in stile discord.js che usa lib.mjs nel formato dell'API. */
export function inFormatoApi(o) {
  const api = {};
  if (o.name !== undefined) api.name = o.name;
  if (o.type !== undefined) api.type = o.type;
  if (o.parent !== undefined) api.parent_id = o.parent?.id ?? o.parent ?? null;
  if (o.topic !== undefined) api.topic = o.topic;
  if (o.permissionOverwrites !== undefined) {
    api.permission_overwrites = o.permissionOverwrites.map((p) => ({ id: p.id, type: 0, allow: somma(p.allow), deny: somma(p.deny) }));
  }
  if (o.availableTags !== undefined) {
    api.available_tags = o.availableTags.map((t) => ({
      ...(t.id ? { id: t.id } : {}),
      name: t.name,
      moderated: Boolean(t.moderated),
      emoji_id: t.emoji?.id ?? null,
      emoji_name: t.emoji?.name ?? null,
    }));
  }
  if (o.defaultReactionEmoji !== undefined) {
    api.default_reaction_emoji = o.defaultReactionEmoji ? { emoji_id: o.defaultReactionEmoji.id ?? null, emoji_name: o.defaultReactionEmoji.name ?? null } : null;
  }
  if (o.defaultSortOrder !== undefined) api.default_sort_order = o.defaultSortOrder;
  if (o.defaultForumLayout !== undefined) api.default_forum_layout = o.defaultForumLayout;
  return api;
}

export function creaGuild({ chiama }, guildId) {
  const ruoli = new Cache();
  const canali = new Cache();

  function messaggio(canaleId, m) {
    return {
      id: m.id,
      content: m.content,
      author: { id: m.author?.id },
      createdTimestamp: Date.parse(m.timestamp),
      edit: ({ content }) => chiama('PATCH', `/channels/${canaleId}/messages/${m.id}`, { content, allowed_mentions: { parse: [] } }),
      delete: () => chiama('DELETE', `/channels/${canaleId}/messages/${m.id}`),
    };
  }

  function canale(c) {
    const oggetto = {
      aggiorna(dati) {
        Object.assign(oggetto, {
          id: dati.id,
          name: dati.name,
          type: dati.type,
          parentId: dati.parent_id ?? null,
          topic: dati.topic ?? null,
          availableTags: (dati.available_tags ?? []).map((t) => ({
            id: t.id,
            name: t.name,
            moderated: t.moderated,
            emoji: t.emoji_id || t.emoji_name ? { id: t.emoji_id, name: t.emoji_name } : null,
          })),
        });
      },
      async edit(o) {
        oggetto.aggiorna(await chiama('PATCH', `/channels/${oggetto.id}`, inFormatoApi(o), o.reason));
        return oggetto;
      },
      messages: {
        async fetch() {
          const lista = await chiama('GET', `/channels/${oggetto.id}/messages?limit=100`);
          return new Cache(lista.map((m) => [m.id, messaggio(oggetto.id, m)]));
        },
      },
      async send({ content }) {
        return messaggio(oggetto.id, await chiama('POST', `/channels/${oggetto.id}/messages`, { content, allowed_mentions: { parse: [] } }));
      },
    };
    oggetto.aggiorna(c);
    return oggetto;
  }

  return {
    id: guildId,
    roles: {
      cache: ruoli,
      everyone: { id: guildId },
      async fetch() {
        ruoli.clear();
        for (const r of await chiama('GET', `/guilds/${guildId}/roles`)) ruoli.set(r.id, { id: r.id, name: r.name, permissions: BigInt(r.permissions) });
      },
      async create(o) {
        const r = await chiama('POST', `/guilds/${guildId}/roles`, {
          name: o.name,
          color: o.colors?.primaryColor ?? o.color ?? 0,
          hoist: Boolean(o.hoist),
          mentionable: Boolean(o.mentionable),
        }, o.reason);
        const ruolo = { id: r.id, name: r.name, permissions: BigInt(r.permissions) };
        ruoli.set(ruolo.id, ruolo);
        return ruolo;
      },
    },
    channels: {
      cache: canali,
      async fetch() {
        canali.clear();
        for (const c of await chiama('GET', `/guilds/${guildId}/channels`)) canali.set(c.id, canale(c));
      },
      async create(o) {
        const c = canale(await chiama('POST', `/guilds/${guildId}/channels`, inFormatoApi(o), o.reason));
        canali.set(c.id, c);
        return c;
      },
    },
    members: {
      async fetch(userId) {
        const m = await chiama('GET', `/guilds/${guildId}/members/${userId}`);
        return {
          user: { username: m.user?.global_name || m.user?.username },
          roles: {
            cache: new Map(m.roles.map((id) => [id, true])),
            add: (ruolo) => chiama('PUT', `/guilds/${guildId}/members/${userId}/roles/${ruolo.id}`, undefined, 'Playtest SATZE'),
          },
        };
      },
    },
  };
}

/** true se il bot è amministratore (o proprietario) del server. */
export async function botEAmministratore({ chiama }, guildId) {
  const io = await chiama('GET', '/users/@me');
  const server = await chiama('GET', `/guilds/${guildId}`);
  if (server.owner_id === io.id) return { io, server, ok: true };
  const membro = await chiama('GET', `/guilds/${guildId}/members/${io.id}`);
  const ruoli = await chiama('GET', `/guilds/${guildId}/roles`);
  const miei = new Set([guildId, ...membro.roles]);
  const permessi = ruoli.filter((r) => miei.has(r.id)).reduce((tot, r) => tot | BigInt(r.permissions), 0n);
  return { io, server, ok: (permessi & 8n) === 8n };
}

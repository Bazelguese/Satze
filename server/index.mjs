/**
 * Server WebSocket SATZE — stanze a codice, relay tra i client, riconnessione con token.
 *
 * Stanze da 2 posti (Duello, comportamento storico) o fino a 4 (2v2, Re della collina).
 * Il posto 0 è l'host (chi crea la stanza). Nelle stanze da 2 i messaggi sono identici a
 * quelli di sempre, così i client già distribuiti continuano a funzionare.
 *
 * Variabili d'ambiente:
 *   PORT o SATZE_WS_PORT — porta (default 3847).
 *   HOST — bind (default 0.0.0.0).
 *   SATZE_RECONNECT_GRACE_MS — attesa del ritorno di un giocatore disconnesso (default 300000 = 5 minuti).
 *   SATZE_ROOMS_DIR — cartella del file stanze persistito (default ./data).
 */
import http from 'http';
import { randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { WebSocketServer } from 'ws';

const PORT = Number(process.env.PORT || process.env.SATZE_WS_PORT || 3847);
const HOST = process.env.HOST || '0.0.0.0';
const RECONNECT_GRACE_MS = Number(process.env.SATZE_RECONNECT_GRACE_MS || 300000);
const ROOMS_DIR = process.env.SATZE_ROOMS_DIR || join(process.cwd(), 'data');
const ROOMS_FILE = join(ROOMS_DIR, 'rooms.json');
const MAX_CAPACITY = 4;

/**
 * @typedef {{ ws: import('ws').WebSocket | null, name: string, secret: string, timer: ReturnType<typeof setTimeout> | null }} Slot
 * @type {Map<string, { capacity: number, slots: Array<Slot | null> }>}
 */
const rooms = new Map();

const roleOf = (slot) => (slot === 0 ? 'host' : 'guest');
const isOpen = (ws) => Boolean(ws && ws.readyState === 1);

function persistRooms() {
  try {
    mkdirSync(ROOMS_DIR, { recursive: true });
    const data = {};
    for (const [code, room] of rooms) {
      data[code] = {
        capacity: room.capacity,
        slots: room.slots.map((s) => (s ? { name: s.name, secret: s.secret } : null)),
      };
    }
    writeFileSync(ROOMS_FILE, JSON.stringify(data));
  } catch (e) {
    console.warn('[SATZE] persist rooms:', e.message);
  }
}

/** Accetta sia il formato a posti sia quello storico { hostSecret, guestSecret }. */
function loadPersistedRooms() {
  try {
    if (!existsSync(ROOMS_FILE)) return;
    const data = JSON.parse(readFileSync(ROOMS_FILE, 'utf8'));
    for (const [code, snap] of Object.entries(data)) {
      let capacity;
      let slots;
      if (Array.isArray(snap?.slots)) {
        capacity = Math.min(MAX_CAPACITY, Math.max(2, Number(snap.capacity) || snap.slots.length || 2));
        slots = Array.from({ length: capacity }, (_, i) => {
          const s = snap.slots[i];
          return s?.secret ? { ws: null, name: s.name || (i === 0 ? 'Host' : 'Avversario'), secret: s.secret, timer: null } : null;
        });
      } else if (snap?.hostSecret) {
        capacity = 2;
        slots = [
          { ws: null, name: snap.hostName || 'Host', secret: snap.hostSecret, timer: null },
          snap.guestSecret ? { ws: null, name: snap.guestName || 'Avversario', secret: snap.guestSecret, timer: null } : null,
        ];
      } else {
        continue;
      }
      if (!slots[0]) continue;
      rooms.set(code, { capacity, slots });
    }
    if (rooms.size > 0) {
      console.log(`[SATZE] Ripristinate ${rooms.size} stanze da disco`);
    }
  } catch (e) {
    console.warn('[SATZE] load rooms:', e.message);
  }
}

function genRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  if (rooms.has(code)) return genRoomCode();
  return code;
}

function genReconnectSecret() {
  return randomBytes(24).toString('base64url');
}

/** @param {import('ws').WebSocket} ws */
function safeSend(ws, obj) {
  if (isOpen(ws)) {
    try {
      ws.send(JSON.stringify(obj));
    } catch (_) {
      /* ignore */
    }
  }
}

function clearSlotTimer(slot) {
  if (slot?.timer) {
    clearTimeout(slot.timer);
    slot.timer = null;
  }
}

/** Invia a tutti i posti connessi tranne `exceptIndex`. */
function broadcast(room, obj, exceptIndex = -1) {
  room.slots.forEach((s, i) => {
    if (i !== exceptIndex && s) safeSend(s.ws, obj);
  });
}

/** Solo stanze da più di 2: elenco aggiornato dei posti. */
function sendMembers(room) {
  if (room.capacity <= 2) return;
  const members = room.slots
    .map((s, slot) => (s ? { slot, name: s.name, connected: isOpen(s.ws) } : null))
    .filter(Boolean);
  broadcast(room, { type: 'room_members', capacity: room.capacity, members });
}

function closeRoom(roomCode, { notify = true } = {}) {
  const room = rooms.get(roomCode);
  if (!room) return;
  for (const s of room.slots) clearSlotTimer(s);
  if (notify) broadcast(room, { type: 'peer_left' }, 0);
  rooms.delete(roomCode);
  persistRooms();
}

const server = http.createServer((_req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end('SATZE multiplayer server OK\n');
});

const wss = new WebSocketServer({ server });

/** Keepalive protocollo WS: evita timeout proxy Fly durante partite lunghe. */
const WS_PING_MS = 25000;
const wsKeepalive = setInterval(() => {
  for (const ws of wss.clients) {
    const sock = ws;
    if (sock.isAlive === false) {
      sock.terminate();
      continue;
    }
    sock.isAlive = false;
    sock.ping();
  }
}, WS_PING_MS);

wss.on('close', () => clearInterval(wsKeepalive));

wss.on('connection', (ws) => {
  ws.isAlive = true;
  ws.on('pong', () => {
    ws.isAlive = true;
  });
  /** @type {{ roomCode: string | null, slot: number | null }} */
  const client = { roomCode: null, slot: null };

  ws.on('message', (raw) => {
    let msg;
    try {
      msg = JSON.parse(String(raw));
    } catch {
      safeSend(ws, { type: 'error', message: 'JSON non valido' });
      return;
    }

    switch (msg.type) {
      case 'create_room': {
        const roomCode = genRoomCode();
        const capacity = Math.min(MAX_CAPACITY, Math.max(2, Number(msg.maxPlayers) || 2));
        const secret = genReconnectSecret();
        const slots = Array.from({ length: capacity }, () => null);
        slots[0] = { ws, name: msg.playerName || 'Host', secret, timer: null };
        rooms.set(roomCode, { capacity, slots });
        client.roomCode = roomCode;
        client.slot = 0;
        safeSend(ws, {
          type: 'room_created',
          roomCode,
          playerId: 'host',
          reconnectSecret: secret,
          slot: 0,
          capacity,
        });
        sendMembers(rooms.get(roomCode));
        persistRooms();
        break;
      }

      case 'join_room': {
        const roomCode = String(msg.roomCode || '').toUpperCase().trim();
        const room = rooms.get(roomCode);
        if (!room) {
          safeSend(ws, { type: 'error', message: 'Stanza non trovata' });
          return;
        }
        const free = room.slots.findIndex((s, i) => i > 0 && !s);
        if (free < 0) {
          // Tutti i posti hanno un titolare: connesso (piena) o in attesa del suo ritorno.
          const waiting = room.slots.some((s, i) => i > 0 && s && !isOpen(s.ws));
          safeSend(ws, {
            type: 'error',
            message: waiting && room.capacity === 2
              ? "Stanza in attesa del ritorno dell'ospite. Riprova più tardi o crea un'altra stanza."
              : 'Stanza già piena',
          });
          return;
        }
        const secret = genReconnectSecret();
        const name = msg.playerName || 'Avversario';
        room.slots[free] = { ws, name, secret, timer: null };
        client.roomCode = roomCode;
        client.slot = free;
        safeSend(ws, {
          type: 'joined',
          roomCode,
          playerId: 'guest',
          reconnectSecret: secret,
          slot: free,
          capacity: room.capacity,
        });
        if (room.capacity === 2) {
          safeSend(room.slots[0]?.ws, { type: 'peer_joined', playerName: name });
        } else {
          broadcast(room, { type: 'peer_joined', playerName: name, slot: free }, free);
          sendMembers(room);
        }
        persistRooms();
        break;
      }

      case 'reconnect': {
        const roomCode = String(msg.roomCode || '').toUpperCase().trim();
        const room = rooms.get(roomCode);
        if (!room) {
          safeSend(ws, { type: 'error', message: 'Stanza non trovata' });
          return;
        }
        const secret = msg.secret;
        const slot = room.slots.findIndex((s) => s && secret && s.secret === secret);
        if (slot < 0) {
          safeSend(ws, { type: 'error', message: 'Riconnessione non valida' });
          break;
        }
        const s = room.slots[slot];
        clearSlotTimer(s);
        s.ws = ws;
        client.roomCode = roomCode;
        client.slot = slot;
        safeSend(ws, { type: 'reconnected', roomCode, role: roleOf(slot), slot, capacity: room.capacity });
        broadcast(room, { type: 'peer_rejoined', role: roleOf(slot), slot }, slot);
        sendMembers(room);
        persistRooms();
        break;
      }

      /** Uscita volontaria (menu / fine partita): libera subito il posto. */
      case 'leave_room': {
        const roomCode = String(msg.roomCode || client.roomCode || '').toUpperCase().trim();
        const room = rooms.get(roomCode);
        if (!room || !client.roomCode || client.roomCode !== roomCode || client.slot == null) {
          break;
        }
        const slot = client.slot;
        client.roomCode = null;
        client.slot = null;
        if (slot === 0) {
          closeRoom(roomCode);
          break;
        }
        clearSlotTimer(room.slots[slot]);
        room.slots[slot] = null;
        if (room.capacity === 2) {
          safeSend(room.slots[0]?.ws, { type: 'peer_left' });
        } else {
          // Nelle stanze grandi l'uscita di un ospite non chiude la sessione degli altri.
          broadcast(room, { type: 'member_left', slot });
          sendMembers(room);
        }
        persistRooms();
        break;
      }

      case 'relay': {
        const roomCode = String(msg.roomCode || '').toUpperCase().trim();
        const room = rooms.get(roomCode);
        if (!room || client.roomCode !== roomCode || client.slot == null) {
          safeSend(ws, { type: 'error', message: 'Stanza non valida' });
          return;
        }
        const out = { type: 'relay', from: roleOf(client.slot), fromSlot: client.slot, payload: msg.payload };
        if (Array.isArray(msg.to)) {
          for (const target of msg.to) {
            if (Number.isInteger(target) && target !== client.slot) safeSend(room.slots[target]?.ws, out);
          }
        } else {
          broadcast(room, out, client.slot);
        }
        break;
      }

      case 'ping':
        safeSend(ws, { type: 'pong', t: msg.t });
        break;

      default:
        safeSend(ws, { type: 'error', message: `Tipo sconosciuto: ${msg.type}` });
    }
  });

  ws.on('close', () => {
    if (!client.roomCode || client.slot == null) return;
    const roomCode = client.roomCode;
    const slot = client.slot;
    const room = rooms.get(roomCode);
    if (!room) return;
    const s = room.slots[slot];
    if (!s || s.ws !== ws) return; // già sostituito da una riconnessione
    s.ws = null;
    broadcast(room, { type: 'peer_disconnected', who: roleOf(slot), slot }, slot);
    sendMembers(room);
    clearSlotTimer(s);
    s.timer = setTimeout(() => {
      const r = rooms.get(roomCode);
      const cur = r?.slots[slot];
      if (!r || !cur || cur.ws) return;
      cur.timer = null;
      if (slot === 0) {
        // L'host non è tornato: la stanza si chiude per tutti.
        closeRoom(roomCode);
        return;
      }
      // Dopo l'attesa si libera il posto: altrimenti nessuno può più entrare col codice.
      r.slots[slot] = null;
      if (r.capacity > 2) {
        broadcast(r, { type: 'member_left', slot });
        sendMembers(r);
      }
      persistRooms();
    }, RECONNECT_GRACE_MS);
    persistRooms();
  });
});

loadPersistedRooms();

server.listen(PORT, HOST, () => {
  console.log(`[SATZE] WebSocket in ascolto su ws://${HOST === '0.0.0.0' ? '0.0.0.0 (tutte le interfacce)' : HOST}:${PORT}`);
});

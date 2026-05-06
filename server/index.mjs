/**
 * Server WebSocket SATZE — stanze a codice, relay tra due client, riconnessione con token.
 *
 * Variabili d'ambiente:
 *   PORT o SATZE_WS_PORT — porta (default 3847).
 *   HOST — bind (default 0.0.0.0).
 *   SATZE_RECONNECT_GRACE_MS — dopo disconnessione host, secondi prima di chiudere la stanza per l'ospite (default 120000).
 */
import http from 'http';
import { randomBytes } from 'node:crypto';
import { WebSocketServer } from 'ws';

const PORT = Number(process.env.PORT || process.env.SATZE_WS_PORT || 3847);
const HOST = process.env.HOST || '0.0.0.0';
const RECONNECT_GRACE_MS = Number(process.env.SATZE_RECONNECT_GRACE_MS || 120000);

/** @type {Map<string, {
 *   host: import('ws').WebSocket | null,
 *   guest: import('ws').WebSocket | null,
 *   hostName?: string,
 *   guestName?: string,
 *   hostSecret: string,
 *   guestSecret: string | null,
 *   hostDisconnectTimer: ReturnType<typeof setTimeout> | null,
 * }>} */
const rooms = new Map();

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
  if (ws && ws.readyState === 1) {
    try {
      ws.send(JSON.stringify(obj));
    } catch (_) {
      /* ignore */
    }
  }
}

const server = http.createServer((_req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end('SATZE multiplayer server OK\n');
});

const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  /** @type {{ roomCode: string | null, role: 'host' | 'guest' | null }} */
  const client = { roomCode: null, role: null };

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
        const hostSecret = genReconnectSecret();
        rooms.set(roomCode, {
          host: ws,
          guest: null,
          hostName: msg.playerName || 'Host',
          guestName: undefined,
          hostSecret,
          guestSecret: null,
          hostDisconnectTimer: null,
        });
        client.roomCode = roomCode;
        client.role = 'host';
        safeSend(ws, {
          type: 'room_created',
          roomCode,
          playerId: 'host',
          reconnectSecret: hostSecret,
        });
        break;
      }

      case 'join_room': {
        const roomCode = String(msg.roomCode || '').toUpperCase().trim();
        const room = rooms.get(roomCode);
        if (!room) {
          safeSend(ws, { type: 'error', message: 'Stanza non trovata' });
          return;
        }
        if (room.guest) {
          safeSend(ws, { type: 'error', message: 'Stanza già piena' });
          return;
        }
        if (room.guestSecret && !room.guest) {
          safeSend(ws, {
            type: 'error',
            message: "Stanza in attesa del ritorno dell'ospite. Riprova più tardi o crea un'altra stanza.",
          });
          return;
        }
        const guestSecret = genReconnectSecret();
        room.guest = ws;
        room.guestSecret = guestSecret;
        room.guestName = msg.playerName || 'Avversario';
        client.roomCode = roomCode;
        client.role = 'guest';
        safeSend(ws, {
          type: 'joined',
          roomCode,
          playerId: 'guest',
          reconnectSecret: guestSecret,
        });
        safeSend(room.host, {
          type: 'peer_joined',
          playerName: room.guestName,
        });
        break;
      }

      case 'reconnect': {
        const roomCode = String(msg.roomCode || '').toUpperCase().trim();
        const room = rooms.get(roomCode);
        if (!room) {
          safeSend(ws, { type: 'error', message: 'Stanza non trovata' });
          return;
        }
        const role = msg.role;
        const secret = msg.secret;
        if (role === 'host' && secret === room.hostSecret) {
          if (room.hostDisconnectTimer) {
            clearTimeout(room.hostDisconnectTimer);
            room.hostDisconnectTimer = null;
          }
          room.host = ws;
          client.roomCode = roomCode;
          client.role = 'host';
          safeSend(ws, { type: 'reconnected', roomCode, role: 'host' });
          if (room.guest && room.guest.readyState === 1) {
            safeSend(room.guest, { type: 'peer_rejoined', role: 'host' });
          }
          break;
        }
        if (role === 'guest' && room.guestSecret && secret === room.guestSecret) {
          room.guest = ws;
          client.roomCode = roomCode;
          client.role = 'guest';
          safeSend(ws, { type: 'reconnected', roomCode, role: 'guest' });
          if (room.host && room.host.readyState === 1) {
            safeSend(room.host, { type: 'peer_rejoined', role: 'guest' });
          }
          break;
        }
        safeSend(ws, { type: 'error', message: 'Riconnessione non valida' });
        break;
      }

      case 'relay': {
        const roomCode = String(msg.roomCode || '').toUpperCase().trim();
        const room = rooms.get(roomCode);
        if (!room) {
          safeSend(ws, { type: 'error', message: 'Stanza non valida' });
          return;
        }
        const peer = ws === room.host ? room.guest : room.host;
        if (peer && peer.readyState === 1) {
          safeSend(peer, {
            type: 'relay',
            from: client.role,
            payload: msg.payload,
          });
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
    if (!client.roomCode) return;
    const roomCode = client.roomCode;
    const room = rooms.get(roomCode);
    if (!room) return;

    if (client.role === 'host') {
      if (room.host === ws) {
        room.host = null;
      }
      if (room.guest && room.guest.readyState === 1) {
        safeSend(room.guest, { type: 'peer_disconnected', who: 'host' });
      }
      if (room.hostDisconnectTimer) {
        clearTimeout(room.hostDisconnectTimer);
        room.hostDisconnectTimer = null;
      }
      room.hostDisconnectTimer = setTimeout(() => {
        const r = rooms.get(roomCode);
        if (!r) return;
        if (!r.host) {
          if (r.guest && r.guest.readyState === 1) {
            safeSend(r.guest, { type: 'peer_left' });
          }
          rooms.delete(roomCode);
        }
      }, RECONNECT_GRACE_MS);
      return;
    }

    if (client.role === 'guest') {
      if (room.guest === ws) {
        room.guest = null;
      }
      if (room.host && room.host.readyState === 1) {
        safeSend(room.host, { type: 'peer_disconnected', who: 'guest' });
      }
    }
  });
});

server.listen(PORT, HOST, () => {
  console.log(`[SATZE] WebSocket in ascolto su ws://${HOST === '0.0.0.0' ? '0.0.0.0 (tutte le interfacce)' : HOST}:${PORT}`);
});

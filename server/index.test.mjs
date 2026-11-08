// Test del server multiplayer con client WebSocket veri (node --test server/index.test.mjs).
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import WebSocket from 'ws';

const qui = dirname(fileURLToPath(import.meta.url));
const processi = [];
after(() => processi.forEach((p) => p.kill()));

async function avviaServer({ roomsDir = mkdtempSync(join(tmpdir(), 'satze-rooms-')), grace = 400 } = {}) {
  const port = 20000 + Math.floor(Math.random() * 20000);
  const p = spawn(process.execPath, [join(qui, 'index.mjs')], {
    env: { ...process.env, PORT: String(port), HOST: '127.0.0.1', SATZE_ROOMS_DIR: roomsDir, SATZE_RECONNECT_GRACE_MS: String(grace) },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  processi.push(p);
  await new Promise((ok, ko) => {
    p.stdout.on('data', (d) => { if (String(d).includes('in ascolto')) ok(); });
    p.on('exit', (c) => ko(new Error(`server uscito ${c}`)));
  });
  return { port, roomsDir, stop: () => new Promise((ok) => { p.once('exit', ok); p.kill(); }) };
}

function client(port) {
  const ws = new WebSocket(`ws://127.0.0.1:${port}`);
  const coda = [];
  const attese = [];
  ws.on('message', (raw) => {
    const m = JSON.parse(String(raw));
    const i = attese.findIndex((a) => a.filtro(m));
    if (i >= 0) attese.splice(i, 1)[0].ok(m);
    else coda.push(m);
  });
  const aperto = new Promise((ok) => ws.once('open', ok));
  return {
    ws,
    aperto,
    send: (m) => ws.send(JSON.stringify(m)),
    /** Prossimo messaggio che soddisfa il filtro (anche già arrivato). */
    aspetta(filtro, ms = 2000) {
      const f = typeof filtro === 'string' ? (m) => m.type === filtro : filtro;
      const i = coda.findIndex(f);
      if (i >= 0) return Promise.resolve(coda.splice(i, 1)[0]);
      return new Promise((ok, ko) => {
        const t = setTimeout(() => ko(new Error(`timeout in attesa di ${filtro}`)), ms);
        attese.push({ filtro: f, ok: (m) => { clearTimeout(t); ok(m); } });
      });
    },
    nulla(filtro, ms = 300) {
      const f = typeof filtro === 'string' ? (m) => m.type === filtro : filtro;
      return new Promise((ok, ko) => setTimeout(() => (coda.some(f) ? ko(new Error(`ricevuto ${filtro} inatteso`)) : ok()), ms));
    },
    chiudi: () => ws.close(),
  };
}

test('stanza da 2: flusso storico invariato', async () => {
  const { port } = await avviaServer();
  const host = client(port); await host.aperto;
  host.send({ type: 'create_room', playerName: 'Davide' });
  const creata = await host.aspetta('room_created');
  assert.equal(creata.playerId, 'host');
  assert.equal(creata.capacity, 2);

  const ospite = client(port); await ospite.aperto;
  ospite.send({ type: 'join_room', roomCode: creata.roomCode, playerName: 'Luca' });
  const entrato = await ospite.aspetta('joined');
  assert.equal(entrato.playerId, 'guest');
  assert.equal((await host.aspetta('peer_joined')).playerName, 'Luca');

  host.send({ type: 'relay', roomCode: creata.roomCode, payload: { type: 'peer_move', x: 1 } });
  const r1 = await ospite.aspetta('relay');
  assert.equal(r1.from, 'host');
  assert.deepEqual(r1.payload, { type: 'peer_move', x: 1 });
  ospite.send({ type: 'relay', roomCode: creata.roomCode, payload: { y: 2 } });
  assert.equal((await host.aspetta('relay')).from, 'guest');

  const terzo = client(port); await terzo.aperto;
  terzo.send({ type: 'join_room', roomCode: creata.roomCode });
  assert.equal((await terzo.aspetta('error')).message, 'Stanza già piena');

  // L'ospite cade e torna col suo token (il client vecchio manda anche role).
  ospite.chiudi();
  assert.equal((await host.aspetta('peer_disconnected')).who, 'guest');
  const ritorno = client(port); await ritorno.aperto;
  ritorno.send({ type: 'reconnect', roomCode: creata.roomCode, role: 'guest', secret: entrato.reconnectSecret });
  assert.equal((await ritorno.aspetta('reconnected')).role, 'guest');
  assert.equal((await host.aspetta('peer_rejoined')).role, 'guest');

  // L'host esce: l'ospite riceve peer_left.
  host.send({ type: 'leave_room', roomCode: creata.roomCode });
  await ritorno.aspetta('peer_left');
  [host, terzo, ritorno].forEach((c) => c.chiudi());
});

test('stanza da 4: posti, broadcast, messaggi mirati, uscite che non chiudono la stanza', async () => {
  const { port } = await avviaServer();
  const host = client(port); await host.aperto;
  host.send({ type: 'create_room', playerName: 'H', maxPlayers: 4 });
  const creata = await host.aspetta('room_created');
  assert.equal(creata.capacity, 4);
  const ospiti = [];
  for (const nome of ['A', 'B', 'C']) {
    const c = client(port); await c.aperto;
    c.send({ type: 'join_room', roomCode: creata.roomCode, playerName: nome });
    c.entrato = await c.aspetta('joined');
    ospiti.push(c);
  }
  assert.deepEqual(ospiti.map((c) => c.entrato.slot), [1, 2, 3]);
  const membri = await host.aspetta((m) => m.type === 'room_members' && m.members.length === 4);
  assert.deepEqual(membri.members.map((m) => m.name), ['H', 'A', 'B', 'C']);

  const quinto = client(port); await quinto.aperto;
  quinto.send({ type: 'join_room', roomCode: creata.roomCode });
  assert.equal((await quinto.aspetta('error')).message, 'Stanza già piena');

  // Broadcast da un ospite: arriva a tutti gli altri, con fromSlot.
  ospiti[1].send({ type: 'relay', roomCode: creata.roomCode, payload: { k: 'tutti' } });
  for (const c of [host, ospiti[0], ospiti[2]]) assert.equal((await c.aspetta('relay')).fromSlot, 2);
  await ospiti[1].nulla('relay');

  // Messaggio mirato: solo al posto 3.
  host.send({ type: 'relay', roomCode: creata.roomCode, payload: { k: 'solo3' }, to: [3] });
  assert.equal((await ospiti[2].aspetta('relay')).payload.k, 'solo3');
  await ospiti[0].nulla('relay');

  // Un ospite cade: gli altri vedono il posto disconnesso, poi torna col token.
  ospiti[0].chiudi();
  await host.aspetta((m) => m.type === 'room_members' && m.members.some((x) => x.slot === 1 && !x.connected));
  const torna = client(port); await torna.aperto;
  torna.send({ type: 'reconnect', roomCode: creata.roomCode, secret: ospiti[0].entrato.reconnectSecret });
  assert.equal((await torna.aspetta('reconnected')).slot, 1);

  // Un ospite esce: niente peer_left per gli altri, il posto si libera.
  ospiti[2].send({ type: 'leave_room', roomCode: creata.roomCode });
  assert.equal((await host.aspetta('member_left')).slot, 3);
  await ospiti[1].nulla('peer_left');
  const nuovo = client(port); await nuovo.aperto;
  nuovo.send({ type: 'join_room', roomCode: creata.roomCode, playerName: 'D' });
  assert.equal((await nuovo.aspetta('joined')).slot, 3);

  // Scade l'attesa di un ospite caduto: il posto si libera.
  torna.chiudi();
  assert.equal((await host.aspetta('member_left', 3000)).slot, 1);

  // L'host esce: la stanza si chiude per tutti.
  host.send({ type: 'leave_room', roomCode: creata.roomCode });
  await ospiti[1].aspetta('peer_left');
  await nuovo.aspetta('peer_left');
  [host, ospiti[1], quinto, nuovo].forEach((c) => c.chiudi());
});

test('riavvio: il file stanze nel formato storico viene ricaricato', async () => {
  const roomsDir = mkdtempSync(join(tmpdir(), 'satze-rooms-'));
  writeFileSync(join(roomsDir, 'rooms.json'), JSON.stringify({
    ABC234: { hostName: 'Davide', guestName: 'Luca', hostSecret: 'segreto-host', guestSecret: 'segreto-ospite' },
  }));
  const { port } = await avviaServer({ roomsDir, grace: 5000 });
  const host = client(port); await host.aperto;
  host.send({ type: 'reconnect', roomCode: 'ABC234', role: 'host', secret: 'segreto-host' });
  assert.equal((await host.aspetta('reconnected')).role, 'host');
  const ospite = client(port); await ospite.aperto;
  ospite.send({ type: 'reconnect', roomCode: 'ABC234', role: 'guest', secret: 'segreto-ospite' });
  assert.equal((await ospite.aspetta('reconnected')).role, 'guest');
  host.send({ type: 'relay', roomCode: 'ABC234', payload: { ok: true } });
  assert.equal((await ospite.aspetta('relay')).payload.ok, true);
  host.chiudi(); ospite.chiudi();
});

#!/usr/bin/env node
// Allestisce il server Discord del playtest di SATZE.
//
//   npm run anteprima   → controlla testi e limiti, senza collegarsi a Discord
//   npm run setup       → crea ciò che manca e aggiorna i messaggi dello script
//   npm run setup -- --aggiorna-canali  → riapplica anche permessi, descrizioni e tag dei canali esistenti
//
// Lo script non annulla le modifiche fatte a mano: non modifica i canali che esistono già
// e non ricrea quelli cancellati (li ricorda in stato.json).
//
// Istruzioni complete nel README.md di questa cartella.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { STRUTTURA } from './contenuti.mjs';
import { verificaContenuti, nomeDiscord } from './lib.mjs';

const qui = dirname(fileURLToPath(import.meta.url));
const percorsoConfig = join(qui, 'config.json');
const anteprima = process.argv.includes('--anteprima');
const aggiornaCanali = process.argv.includes('--aggiorna-canali');
const percorsoStato = join(qui, 'stato.json');

function esci(messaggio) {
  console.error(`\n✖ ${messaggio}\n`);
  process.exit(1);
}

function leggiConfig() {
  if (!existsSync(percorsoConfig)) {
    if (anteprima) {
      console.log('(config.json non trovato: uso i valori di config.example.json)\n');
      return JSON.parse(readFileSync(join(qui, 'config.example.json'), 'utf8'));
    }
    esci('Manca config.json. Copia config.example.json in config.json e compilalo (vedi README.md).');
  }
  try {
    return JSON.parse(readFileSync(percorsoConfig, 'utf8'));
  } catch (e) {
    esci(`config.json non è un JSON valido: ${e.message}`);
  }
}

const cfg = leggiConfig();
if (!cfg.versione) esci('In config.json manca "versione" (es. "0.1.0").');

const errori = verificaContenuti(cfg);
if (errori.length) esci(`Problemi nei contenuti:\n  - ${errori.join('\n  - ')}`);

if (anteprima) {
  const icone = { testo: '#', forum: '🗂', vocale: '🔊' };
  console.log('Struttura che verrà creata:\n');
  for (const g of STRUTTURA) {
    console.log(`${g.categoria}   [accesso: ${g.accesso}]`);
    for (const c of g.canali) {
      const tag = c.tag ? `  (${c.tag.length} tag)` : '';
      console.log(`   ${icone[c.tipo]} ${nomeDiscord(c.nome, c.tipo)}${tag}`);
    }
  }
  console.log(`\nVersione: ${cfg.versione}`);
  console.log(`Link download: ${cfg.linkDownload || '(vuoto: verrà scritto "in arrivo")'}`);
  console.log(`Link sondaggio: ${cfg.linkSondaggio || '(vuoto: verrà scritto "arriva a fine ciclo")'}`);
  console.log('\n✔ Contenuti a posto. Quando sei pronto: npm run setup\n');
  process.exit(0);
}

if (!cfg.token || cfg.token.startsWith('INCOLLA')) esci('In config.json manca il token del bot.');
if (!cfg.idServer || cfg.idServer.startsWith('INCOLLA')) esci("In config.json manca l'id del server (idServer).");

const { creaClient, creaGuild, botEAmministratore } = await import('./discordRest.mjs');
const { allestisci } = await import('./lib.mjs');

const client = creaClient(cfg.token);

let verifica;
try {
  verifica = await botEAmministratore(client, cfg.idServer);
} catch (e) {
  if (e.status === 401) esci('Discord non accetta il token: controllalo in config.json.');
  if (e.status === 403 || e.status === 404) esci("Il bot non vede il server indicato in idServer. L'hai invitato con il link del README?");
  esci(`Non riesco a parlare con Discord: ${e.message}`);
}
if (!verifica.ok) esci('Il bot non ha il permesso Amministratore su questo server. Reinvitalo con il link del README (permissions=8).');

console.log(`Server: ${verifica.server.name}\n`);
try {
  const guild = creaGuild(client, cfg.idServer);
  // Registro di ciò che lo script ha creato su questo server: serve a non ricreare ciò che è stato cancellato a mano.
  const archivio = existsSync(percorsoStato) ? JSON.parse(readFileSync(percorsoStato, 'utf8')) : {};
  const { avvisi, stato } = await allestisci(guild, verifica.io.id, cfg, console.log, {
    stato: archivio[cfg.idServer],
    aggiornaCanali,
  });
  archivio[cfg.idServer] = stato;
  writeFileSync(percorsoStato, JSON.stringify(archivio, null, 2));
  console.log('\n✔ Fatto.');
  if (avvisi.length) console.log(`\nAvvisi:\n  - ${avvisi.join('\n  - ')}`);
  console.log('\nOra puoi togliere il bot dal server (vedi README, ultimo passo).\n');
} catch (e) {
  console.error(e);
  esci(`Qualcosa è andato storto: ${e.message}\nPuoi rilanciare lo script: riprende da dove si è fermato senza duplicare niente.`);
}

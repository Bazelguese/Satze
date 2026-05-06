#!/usr/bin/env node

/**
 * Estrae le immagini da src/data/images.js (base64) e le scrive in public/card-images/.
 * Eseguire UNA VOLTA prima di sostituire images.js con la versione solo-path.
 *
 * Uso: node scripts/extract-images-to-public.js [path-images.js]
 * Se path non specificato, usa src/data/images.js
 */

import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const DEFAULT_SOURCE = path.join(rootDir, 'src', 'data', 'images.js');
const OUT_TYPES = path.join(rootDir, 'public', 'card-images', 'types');
const OUT_AGENTS = path.join(rootDir, 'public', 'card-images', 'agents');

// Regex: chiave (nome o numero) : 'data:image/TIPO;base64,DATI'
const RE_ENTRY = /^\s*(\w+):\s*'data:image\/(\w+);base64,([^']+)'/;

function isNumericKey(key) {
  return /^\d+$/.test(key);
}

function getExtension(mime) {
  const ext = mime?.toLowerCase();
  if (ext === 'png') return 'png';
  if (ext === 'webp') return 'webp';
  if (ext === 'jpeg' || ext === 'jpg') return 'jpg';
  return 'webp';
}

async function extractFile(sourcePath) {
  if (!fs.existsSync(sourcePath)) {
    console.error('File non trovato:', sourcePath);
    process.exit(1);
  }

  [OUT_TYPES, OUT_AGENTS].forEach((dir) => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });

  const rl = readline.createInterface({
    input: fs.createReadStream(sourcePath, { encoding: 'utf8' }),
    crlfDelay: Infinity,
  });

  let countTypes = 0;
  let countAgents = 0;
  let inCardImages = false;
  let inAgentImages = false;

  for await (const line of rl) {
    if (line.includes('export const CARD_IMAGES = {')) {
      inCardImages = true;
      inAgentImages = false;
      continue;
    }
    if (line.includes('export const AGENT_IMAGES = {')) {
      inCardImages = false;
      inAgentImages = true;
      continue;
    }
    if (inCardImages && line.trim().startsWith('};')) inCardImages = false;
    if (inAgentImages && line.trim().startsWith('};')) inAgentImages = false;

    const m = line.match(RE_ENTRY);
    if (!m) continue;

    const [, key, mime, b64] = m;
    const ext = getExtension(mime);
    const buffer = Buffer.from(b64, 'base64');

    if (inAgentImages || isNumericKey(key)) {
      const outPath = path.join(OUT_AGENTS, `${key}.${ext}`);
      fs.writeFileSync(outPath, buffer);
      countAgents++;
      if (countAgents <= 3) console.log('  agents/', key + '.' + ext);
    } else if (inCardImages) {
      const outPath = path.join(OUT_TYPES, `${key}.${ext}`);
      fs.writeFileSync(outPath, buffer);
      countTypes++;
      console.log('  types/', key + '.' + ext);
    }
  }

  console.log('\nEstrazione completata.');
  console.log('  types:  ', countTypes, 'file');
  console.log('  agents: ', countAgents, 'file');
}

const sourcePath = process.argv[2] || DEFAULT_SOURCE;
console.log('Sorgente:', sourcePath);
console.log('Destinazione: public/card-images/{types|agents}\n');
extractFile(sourcePath).catch((err) => {
  console.error(err);
  process.exit(1);
});

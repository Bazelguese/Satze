#!/usr/bin/env node

/**
 * Converte le immagini delle carte da carte/Immagini/ in WebP ottimizzato
 * (max 512px, q80) in public/card-images/agents/.
 * Il file src/data/images.js usa solo i path: non viene più modificato.
 *
 * Uso: node scripts/update-card-images.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const IMAGES_DIR = path.join(rootDir, 'carte', 'Immagini');
const AGENTS_DIR = path.join(rootDir, 'public', 'card-images', 'agents');

function extractCardId(filename) {
  const match = filename.match(/^(\d+)\.(png|jpg|jpeg|webp)$/i);
  return match ? match[1] : null;
}

async function main() {
  console.log('🖼️  Aggiornamento immagini carte (WebP in public/card-images/agents/)\n');

  if (!fs.existsSync(IMAGES_DIR)) {
    console.error(`❌ La cartella ${IMAGES_DIR} non esiste!`);
    process.exit(1);
  }

  if (!fs.existsSync(AGENTS_DIR)) {
    fs.mkdirSync(AGENTS_DIR, { recursive: true });
    console.log(`📁 Creata cartella ${AGENTS_DIR}\n`);
  }

  const files = fs.readdirSync(IMAGES_DIR)
    .filter((file) => /\.(png|jpg|jpeg|webp)$/i.test(file))
    .sort();

  if (files.length === 0) {
    console.log('⚠️  Nessun file immagine in carte/Immagini/');
    process.exit(0);
  }

  let copied = 0;
  for (const file of files) {
    const id = extractCardId(file);
    if (!id) {
      console.log(`⚠️  Ignorato ${file} (nome deve essere ID.png, es. 101.png)`);
      continue;
    }

    const srcPath = path.join(IMAGES_DIR, file);
    const destPath = path.join(AGENTS_DIR, `${id}.webp`);

    try {
      await sharp(srcPath)
        .resize({ width: 512, height: 512, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(destPath);
      copied++;
      if (copied <= 5) console.log(`  ${file} → agents/${id}.webp`);
    } catch (err) {
      console.error(`❌ Errore convertendo ${file}:`, err.message);
    }
  }

  console.log(`\n✅ Convertiti ${copied} file in public/card-images/agents/`);
}

main();

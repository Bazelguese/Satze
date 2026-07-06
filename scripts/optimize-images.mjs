/**
 * Converte le immagini pesanti di public/ in WebP ridimensionato:
 *  - public/card-images/agents/*.png  -> .webp (max 512px lato lungo, q80)
 *  - public/campi_bg/*.png            -> .webp (dimensione originale, q75)
 *
 * I PNG originali vengono spostati in originals_png/ (fuori da public/,
 * cosi' non finiscono nella build) come copia di sicurezza.
 *
 * Run: node scripts/optimize-images.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const backupRoot = path.join(rootDir, 'originals_png');

const TARGETS = [
  {
    dir: path.join(rootDir, 'public', 'card-images', 'agents'),
    backup: path.join(backupRoot, 'card-images', 'agents'),
    // Le carte sono renderizzate a ~230x330: 512px basta anche per zoom/retina
    resize: { width: 512, height: 512, fit: 'inside', withoutEnlargement: true },
    quality: 80,
  },
  {
    dir: path.join(rootDir, 'public', 'campi_bg'),
    backup: path.join(backupRoot, 'campi_bg'),
    resize: null, // gia' 1680x720, adatti allo schermo
    quality: 75,
  },
];

async function processDir({ dir, backup, resize, quality }) {
  if (!fs.existsSync(dir)) {
    console.warn(`Cartella non trovata, salto: ${dir}`);
    return { count: 0, before: 0, after: 0 };
  }
  fs.mkdirSync(backup, { recursive: true });

  const files = fs.readdirSync(dir).filter((f) => /\.png$/i.test(f));
  let before = 0;
  let after = 0;
  let count = 0;

  for (const file of files) {
    const src = path.join(dir, file);
    const out = path.join(dir, file.replace(/\.png$/i, '.webp'));
    const srcSize = fs.statSync(src).size;

    let pipeline = sharp(src);
    if (resize) pipeline = pipeline.resize(resize);
    await pipeline.webp({ quality }).toFile(out);

    const outSize = fs.statSync(out).size;
    before += srcSize;
    after += outSize;
    count++;

    // Sposta l'originale nel backup
    fs.renameSync(src, path.join(backup, file));

    if (count % 25 === 0) console.log(`  ${path.basename(dir)}: ${count}/${files.length}...`);
  }

  return { count, before, after };
}

const mb = (n) => (n / 1024 / 1024).toFixed(1);

let totBefore = 0;
let totAfter = 0;
for (const target of TARGETS) {
  console.log(`\nElaboro ${target.dir}`);
  const { count, before, after } = await processDir(target);
  totBefore += before;
  totAfter += after;
  console.log(`  ${count} file: ${mb(before)} MB -> ${mb(after)} MB`);
}

console.log(`\nTotale: ${mb(totBefore)} MB -> ${mb(totAfter)} MB (risparmio ${mb(totBefore - totAfter)} MB)`);
console.log(`Originali spostati in: ${backupRoot}`);

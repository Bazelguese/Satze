/**
 * Converte in WebP le immagini UI residue di public/:
 *  - public/icons/*.png        -> .webp (max 256px, q85 — icone armata)
 *  - public/Immagini_bg/*.png  -> .webp (max 1920px, q78 — sfondi mani/pannelli)
 *
 * I PNG originali vengono spostati in originals_png/ (backup fuori da public/).
 * Run: node scripts/optimize-ui-images.mjs
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
    dir: path.join(rootDir, 'public', 'icons'),
    backup: path.join(backupRoot, 'icons'),
    resize: { width: 256, height: 256, fit: 'inside', withoutEnlargement: true },
    quality: 85,
  },
  {
    dir: path.join(rootDir, 'public', 'Immagini_bg'),
    backup: path.join(backupRoot, 'Immagini_bg'),
    resize: { width: 1920, height: 1920, fit: 'inside', withoutEnlargement: true },
    quality: 78,
  },
];

const mb = (n) => (n / 1024 / 1024).toFixed(1);
let totBefore = 0;
let totAfter = 0;

for (const { dir, backup, resize, quality } of TARGETS) {
  fs.mkdirSync(backup, { recursive: true });
  const files = fs.readdirSync(dir).filter((f) => /\.png$/i.test(f));
  let before = 0;
  let after = 0;

  for (const file of files) {
    const src = path.join(dir, file);
    const out = path.join(dir, file.replace(/\.png$/i, '.webp'));
    before += fs.statSync(src).size;
    await sharp(src).resize(resize).webp({ quality }).toFile(out);
    after += fs.statSync(out).size;
    fs.renameSync(src, path.join(backup, file));
  }

  totBefore += before;
  totAfter += after;
  console.log(`${path.basename(dir)}: ${files.length} file, ${mb(before)} MB -> ${mb(after)} MB`);
}

console.log(`Totale: ${mb(totBefore)} MB -> ${mb(totAfter)} MB`);

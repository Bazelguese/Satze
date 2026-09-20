/**
 * Importa kit da Documentazione/_eldritch_serie_23_33_extract → public/.../layers/
 * e converte PNG → WebP. Uso: node scripts/import-eldritch-serie-23-33.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'Documentazione', '_eldritch_serie_23_33_extract');
const DEST = path.join(ROOT, 'public', 'card-images', 'eldritch', 'layers');

const WEBP_OPTS = {
  quality: 90,
  alphaQuality: 100,
  effort: 6,
  smartSubsample: true,
};

/** Cartella zip → slug public */
const KITS = [
  { folder: 'Sorethai-Livelli', slug: 'sorethai', prefix: 'Sorethai' },
  { folder: 'Glauson-Livelli', slug: 'glauson', prefix: 'Glauson' },
  { folder: 'Phimesto-Livelli', slug: 'phimesto', prefix: 'Phimesto' },
  { folder: 'Nucleo-Comando-Nord-Livelli', slug: 'nucleo-comando-nord', prefix: 'Nucleo-Comando-Nord' },
  { folder: 'Sylwajuck-Livelli', slug: 'sylwajuck', prefix: 'Sylwajuck' },
  { folder: 'Evoluzione-Finale-Livelli', slug: 'evoluzione-finale', prefix: 'Evoluzione-Finale' },
  { folder: 'Cyber-May-Punk-Livelli', slug: 'cyber-may-punk', prefix: 'Cyber-May-Punk' },
  { folder: 'Predatore-Alato-Livelli', slug: 'predatore-alato', prefix: 'Predatore-Alato' },
  { folder: 'Quarto-Marito-Livelli', slug: 'quarto-marito', prefix: 'Quarto-Marito' },
];

const MAP = [
  ['Soggetto.png', 'soggetto.webp'],
  ['Sfondo.png', 'sfondo.webp'],
  ['Cornice.png', 'cornice.webp'],
  ['Eldritch.png', 'composita.webp'],
  ['Eldritch.json', 'card.json'],
];

async function toWebp(srcPath, destPath) {
  const buf = await sharp(fs.readFileSync(srcPath))
    .ensureAlpha()
    .webp(WEBP_OPTS)
    .toBuffer();
  fs.writeFileSync(destPath, buf);
  return buf.length;
}

async function main() {
  if (!fs.existsSync(SRC)) {
    throw new Error('Extract missing: ' + SRC);
  }
  for (const kit of KITS) {
    const from = path.join(SRC, kit.folder);
    if (!fs.existsSync(from)) {
      console.warn('skip missing', kit.folder);
      continue;
    }
    const to = path.join(DEST, kit.slug);
    fs.mkdirSync(to, { recursive: true });
    console.log('\n' + kit.slug);
    for (const [suffix, outName] of MAP) {
      const srcName = `${kit.prefix}-${suffix}`;
      const srcPath = path.join(from, srcName);
      if (!fs.existsSync(srcPath)) {
        // Cyber May Punk può non avere Cornice
        console.log('  · missing', srcName);
        continue;
      }
      const destPath = path.join(to, outName);
      if (outName.endsWith('.json')) {
        fs.copyFileSync(srcPath, destPath);
        console.log('  ·', outName);
      } else {
        const n = await toWebp(srcPath, destPath);
        const meta = await sharp(destPath).metadata();
        console.log(`  · ${outName} ${meta.width}×${meta.height} ${(n / 1024).toFixed(0)}KB`);
      }
    }
    const leggi = path.join(from, 'LEGGIMI.md');
    const readme = path.join(from, 'README.md');
    if (fs.existsSync(leggi)) fs.copyFileSync(leggi, path.join(to, 'LEGGIMI.md'));
    else if (fs.existsSync(readme)) fs.copyFileSync(readme, path.join(to, 'LEGGIMI.md'));
  }
  console.log('\nDone.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

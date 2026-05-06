/**
 * Crea COPIE delle icone senza sfondo. Le icone originali in public/icons
 * restano intatte: lo script aggiunge solo nuovi file *-nobg.png.
 *
 * Uso: npm run icons-nobg
 */

import { Jimp } from 'jimp';
import { readdir } from 'fs/promises';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ICONS_DIR = join(__dirname, '..', 'public', 'icons');

const BG_COLOR_TOLERANCE = 95;
const BG_BRIGHTNESS_THRESHOLD = 200;
const BG_SATURATION_MAX = 50;
const SAMPLE_RADIUS = 8;

function getPixelIndex(x, y, w) {
  return (y * w + x) * 4;
}

function sampleArea(data, w, h, cx, cy, r) {
  let rsum = 0, gsum = 0, bsum = 0, n = 0;
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      const x = Math.max(0, Math.min(w - 1, cx + dx));
      const y = Math.max(0, Math.min(h - 1, cy + dy));
      const i = getPixelIndex(x, y, w);
      rsum += data[i];
      gsum += data[i + 1];
      bsum += data[i + 2];
      n++;
    }
  }
  if (n === 0) return { r: 255, g: 255, b: 255 };
  return { r: rsum / n, g: gsum / n, b: bsum / n };
}

function colorDistance(r1, g1, b1, r2, g2, b2) {
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}

async function createCopyWithoutBackground(inputPath, outputPath) {
  const image = await Jimp.read(inputPath);
  const w = image.bitmap.width;
  const h = image.bitmap.height;
  const data = image.bitmap.data;
  const r = Math.min(SAMPLE_RADIUS, Math.floor(w / 4), Math.floor(h / 4));

  const c1 = sampleArea(data, w, h, 0, 0, r);
  const c2 = sampleArea(data, w, h, w - 1, 0, r);
  const c3 = sampleArea(data, w, h, 0, h - 1, r);
  const c4 = sampleArea(data, w, h, w - 1, h - 1, r);
  const bgR = (c1.r + c2.r + c3.r + c4.r) / 4;
  const bgG = (c1.g + c2.g + c3.g + c4.g) / 4;
  const bgB = (c1.b + c2.b + c3.b + c4.b) / 4;

  image.scan(0, 0, w, h, function (x, y, idx) {
    const rp = this.bitmap.data[idx];
    const gp = this.bitmap.data[idx + 1];
    const bp = this.bitmap.data[idx + 2];
    const dist = colorDistance(rp, gp, bp, bgR, bgG, bgB);
    const max = Math.max(rp, gp, bp);
    const min = Math.min(rp, gp, bp);
    const saturation = max - min;
    const isLightAndFlat = max >= BG_BRIGHTNESS_THRESHOLD && saturation <= BG_SATURATION_MAX;
    if (dist <= BG_COLOR_TOLERANCE || isLightAndFlat) {
      this.bitmap.data[idx + 3] = 0;
    }
  });

  await image.write(outputPath);
}

async function main() {
  const files = await readdir(ICONS_DIR);
  const pngs = files.filter(
    (f) => extname(f).toLowerCase() === '.png' && !f.endsWith('-nobg.png')
  );

  if (pngs.length === 0) {
    console.log('Nessun PNG trovato in public/icons (le icone già presenti non vengono modificate).');
    return;
  }

  console.log('Creazione copie senza sfondo (originali restano invariate):');
  for (const file of pngs) {
    const base = file.replace(/\.png$/i, '');
    const inputPath = join(ICONS_DIR, file);
    const outputPath = join(ICONS_DIR, `${base}-nobg.png`);
    console.log(' ', file, '->', `${base}-nobg.png`);
    await createCopyWithoutBackground(inputPath, outputPath);
  }
  console.log('Fatto. Le icone originali sono state lasciate così come sono.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

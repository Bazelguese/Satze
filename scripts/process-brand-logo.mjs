/**
 * Sincronizza il logo in src/assets/logo-satze.png e public/logo-satze.png (splash / Vite).
 *
 * Sorgente (primo file esistente):
 *   1) public/Immagini_bg/logo-satze.png
 *   2) public/Immagini_bg/ChatGPT Image 30 apr 2026, 23_11_26.png
 *   3) public/logo-satze-master.png
 *   4) public/logo-satze.png
 *
 * Se la sorgente ha già molta trasparenza → copia PNG senza alterare i pixel (alpha intatta).
 * Altrimenti → solo flood dai bordi per nero / quasi nero (export senza alpha).
 * Uso: npm run logo:transparent
 */

import sharp from 'sharp';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { writeFile, copyFile } from 'fs/promises';
import { existsSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const IMM = resolve(ROOT, 'public', 'Immagini_bg');

const CANDIDATES = [
  resolve(IMM, 'logo-satze.png'),
  resolve(IMM, 'ChatGPT Image 30 apr 2026, 23_11_26.png'),
  resolve(ROOT, 'public', 'logo-satze-master.png'),
  resolve(ROOT, 'public', 'logo-satze.png'),
];

const INPUT = CANDIDATES.find((p) => existsSync(p));
const OUTPUT = resolve(ROOT, 'src', 'assets', 'logo-satze.png');
const PUBLIC_COPY = resolve(ROOT, 'public', 'logo-satze.png');

const ALPHA_CUT = 8;

function isNearBlack(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lum = (r + g + b) / 3;
  const spread = max - min;
  if (max <= 14 && lum < 18) return true;
  if (lum <= 12 && spread < 28) return true;
  return false;
}

function isExpandBlack(r, g, b) {
  const max = Math.max(r, g, b);
  const lum = (r + g + b) / 3;
  const spread = max - Math.min(r, g, b);
  if (max <= 22 && lum < 28 && spread < 42) return true;
  return false;
}

function neighbors4(x, y, w, h) {
  const o = [];
  if (x > 0) o.push([x - 1, y]);
  if (x < w - 1) o.push([x + 1, y]);
  if (y > 0) o.push([x, y - 1]);
  if (y < h - 1) o.push([x, y + 1]);
  return o;
}

function removeBlackBackground(data, w, h) {
  const out = Buffer.from(data);
  const seen = new Uint8Array(w * h);
  const q = [];
  const idx = (x, y) => (y * w + x) * 4;

  const pushEdge = (x, y) => {
    const i = idx(x, y);
    if (out[i + 3] < ALPHA_CUT) return;
    const r = out[i],
      g = out[i + 1],
      b = out[i + 2];
    if (!isNearBlack(r, g, b)) return;
    const k = y * w + x;
    if (seen[k]) return;
    seen[k] = 1;
    q.push(k);
  };

  for (let x = 0; x < w; x++) {
    pushEdge(x, 0);
    pushEdge(x, h - 1);
  }
  for (let y = 0; y < h; y++) {
    pushEdge(0, y);
    pushEdge(w - 1, y);
  }

  let qi = 0;
  while (qi < q.length) {
    const k = q[qi++];
    const i = k * 4;
    out[i + 3] = 0;
    const x = k % w;
    const y = (k / w) | 0;
    for (const [nx, ny] of neighbors4(x, y, w, h)) {
      const j = idx(nx, ny);
      if (out[j + 3] < ALPHA_CUT) continue;
      const r = out[j],
        g = out[j + 1],
        b = out[j + 2];
      if (!isExpandBlack(r, g, b)) continue;
      const nk = ny * w + nx;
      if (!seen[nk]) {
        seen[nk] = 1;
        q.push(nk);
      }
    }
  }

  for (let i = 0; i < w * h; i++) {
    const p = i * 4;
    if (out[p + 3] > 0) out[p + 3] = 255;
  }
  return out;
}

function countTransparentRatio(data) {
  let a0 = 0;
  const n = data.length / 4;
  for (let i = 3, k = 0; k < n; i += 4, k++) {
    if (data[i] < ALPHA_CUT) a0++;
  }
  return a0 / n;
}

async function main() {
  if (!INPUT) {
    throw new Error(
      'Nessun file sorgente trovato. Aggiungi uno tra:\n' +
        CANDIDATES.map((p) => '  - ' + p).join('\n'),
    );
  }

  console.log('Sorgente:', INPUT);

  const img = sharp(INPUT);
  const { data, info } = await img.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  if (info.channels !== 4) throw new Error('Expected RGBA');

  const alreadyTransparent = countTransparentRatio(data) > 0.05;
  let pngBuf;
  if (alreadyTransparent) {
    pngBuf = await sharp(INPUT).ensureAlpha().png({ compressionLevel: 9, effort: 10 }).toBuffer();
    console.log('Copia senza flood (trasparenza originale preservata).');
  } else {
    const processed = removeBlackBackground(data, info.width, info.height);
    pngBuf = await sharp(processed, {
      raw: { width: info.width, height: info.height, channels: 4 },
    })
      .png({ compressionLevel: 9, effort: 10 })
      .toBuffer();
    console.log('Rimosso sfondo nero dai bordi (sorgente senza alpha).');
  }

  const meta = await sharp(pngBuf).metadata();
  await writeFile(OUTPUT, pngBuf);
  console.log('OK:', OUTPUT, `${meta.width}×${meta.height}`);
  try {
    await copyFile(OUTPUT, PUBLIC_COPY);
    console.log('OK:', PUBLIC_COPY);
  } catch (e) {
    console.warn('Copia in public/logo-satze.png saltata:', e.message);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

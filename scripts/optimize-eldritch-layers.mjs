/**
 * Converte i PNG dei livelli Eldritch in WebP ad alta qualità (con alpha).
 * Uso: node scripts/optimize-eldritch-layers.mjs
 */
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve('public/card-images/eldritch/layers');
const WEBP_OPTS = {
  quality: 90,
  alphaQuality: 100,
  effort: 6,
  smartSubsample: true,
};

async function convertFile(pngPath) {
  const webpPath = pngPath.replace(/\.png$/i, '.webp');
  const src = fs.readFileSync(pngPath);
  const out = await sharp(src).webp(WEBP_OPTS).toBuffer();
  fs.writeFileSync(webpPath, out);
  return { png: src.length, webp: out.length, webpPath };
}

async function main() {
  const pngs = [];
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (/\.png$/i.test(e.name)) pngs.push(p);
    }
  };
  walk(ROOT);

  let sumPng = 0;
  let sumWebp = 0;
  for (const png of pngs) {
    const r = await convertFile(png);
    sumPng += r.png;
    sumWebp += r.webp;
    const rel = path.relative(ROOT, png);
    console.log(
      `${rel}: ${(r.png / 1024).toFixed(0)}KB → ${(r.webp / 1024).toFixed(0)}KB (${Math.round((100 * r.webp) / r.png)}%)`
    );
    fs.unlinkSync(png);
  }
  console.log(
    `\nTotale: ${(sumPng / 1024 / 1024).toFixed(1)}MB → ${(sumWebp / 1024 / 1024).toFixed(1)}MB (${Math.round((100 * sumWebp) / sumPng)}%)`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

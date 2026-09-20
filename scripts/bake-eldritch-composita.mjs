/**
 * Rigenera composita.webp per ogni kit Eldritch dal pipeline lab
 * (livelli + layout SVG + testi attuali).
 *
 * Uso: node scripts/bake-eldritch-composita.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer';
import sharp from 'sharp';
import { createServer } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const LAYERS = path.join(ROOT, 'public', 'card-images', 'eldritch', 'layers');
const IDS = [101, 103, 104, 115, 206, 211, 221, 226, 301, 302, 315, 323, 402, 407, 419, 430, 524, 611, 705, 830, 910, 1004, 1122, 1215];

async function main() {
  console.log('Kits:', IDS.join(', '));

  const vite = await createServer({
    root: ROOT,
    configFile: path.join(ROOT, 'vite.config.js'),
    server: { port: 5199, strictPort: true },
  });
  await vite.listen();
  const port = 5199;

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--force-color-profile=srgb', '--disable-gpu-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1104, height: 1584, deviceScaleFactor: 1 });
    // Fondamentale: niente nero dietro la carta
    await page.setBypassCSP(true);
    await page.evaluateOnNewDocument(() => {
      document.documentElement.style.background = 'transparent';
    });

    // Serve bake page via Vite (risolve gli import del lab)
    await page.goto(`http://127.0.0.1:${port}/scripts/eldritch-bake-page.html`, {
      waitUntil: 'networkidle0',
      timeout: 180000,
    });
    await page.waitForFunction(() => typeof window.__ELD_BAKE__ === 'function', {
      timeout: 120000,
    });

    for (const id of IDS) {
      process.stdout.write(`bake ${id}… `);
      const result = await page.evaluate(async (cardId) => window.__ELD_BAKE__(cardId), id);
      if (!result?.slug) throw new Error('bake failed ' + id + ' ' + JSON.stringify(result));

      const png = await page.screenshot({
        type: 'png',
        clip: { x: 0, y: 0, width: 1104, height: 1584 },
        omitBackground: true,
      });

      const outPath = path.join(LAYERS, result.slug, 'composita.webp');
      // Assicura alpha: se resta nero opaco fuori cornice, fallisce il look in gioco
      await sharp(png)
        .ensureAlpha()
        .webp({ quality: 90, alphaQuality: 100, effort: 6, lossless: false })
        .toFile(outPath);
      console.log(`ok → ${result.slug}/composita.webp (${Math.round(fs.statSync(outPath).size / 1024)}KB)`);
    }
  } finally {
    await browser.close();
    await vite.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

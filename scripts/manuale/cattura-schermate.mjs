// ============================================================
// Rifà le schermate "fisse" del manuale in public/manuale/img.
//
//   npm run manuale:schermate            tutte
//   npm run manuale:schermate -- opzioni solo quelle indicate
//
// Avvia il gioco in un browser senza finestra, apre ogni schermata dal
// menu principale e la salva in JPEG (nel PDF resta compresso; il WebP verrebbe
// ricodificato senza perdita e il file peserebbe dieci volte tanto). Le schermate di partita (tavolo,
// campo, investimento, esito, eminenza, glossario, fine) NON sono qui:
// dipendono da una partita vera e si rifanno a mano, vedi README.md.
//
// Se Playwright non trova il suo browser: CHROMIUM_PATH=/percorso/di/chrome.
// ============================================================
import { createServer } from 'vite';
import { chromium } from 'playwright';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { mkdirSync, readFileSync } from 'node:fs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const outDir = resolve(root, 'public/manuale/img');
const only = process.argv.slice(2);
mkdirSync(outDir, { recursive: true });

/** Larghezza delle immagini salvate: abbastanza per la stampa A5, leggere da caricare. */
const OUT_WIDTH = 1400;
/** Nasconde il contatore FPS, che nelle schermate del manuale non deve comparire. */
const HIDE_FPS = 'body > div[aria-hidden][style*="position: fixed"][style*="top: 10px"]{display:none!important}';

/** nome file → voce del menu da aprire (null = il menu stesso) e passi successivi. */
const SCREENS = [
  { name: 'menu', label: null },
  { name: 'armata', label: 'PARTITA LOCALE', wait: 7000 },
  { name: 'imposta', label: 'PARTITA LOCALE', wait: 7000, keys: [['Enter', 7000], ['Enter', 5000]] },
  { name: 'campagna', label: 'CAMPAGNA', wait: 7000 },
  { name: 'multiplayer', label: 'MULTIPLAYER', wait: 7000 },
  { name: 'eserciti', label: 'GESTIONE ESERCITI', wait: 10000 },
  { name: 'opzioni', label: 'OPZIONI', wait: 7000 },
  { name: 'galleria', label: 'GALLERIA', wait: 14000 },
  // la carta della pagina "La carta Agente": ritaglio della Galleria a doppia densità
  { name: 'carta', label: 'GALLERIA', wait: 14000, scale: 2, crop: { left: 1593, top: 573, width: 773, height: 1053 }, width: 640 },
];

// Stendardi delle pagine "Le armate" e copertina: ritagli degli sfondi d'armata del gioco.
if (!only.length || only.includes('stendardi')) {
  // armies.js importa moduli JSX che Node non legge: gli sfondi si ricavano dal testo del file
  const armiesSrc = readFileSync(resolve(root, 'src/data/armies.js'), 'utf8');
  const gifsBlock = armiesSrc.slice(armiesSrc.indexOf('ARMY_GIFS = {'), armiesSrc.indexOf('ARMY_BONUSES = {'));
  const ARMY_GIFS = Object.fromEntries([...gifsBlock.matchAll(/^\s*(["'])(.+?)\1:\s*'(\.\/Immagini_bg\/[^']+)'/gm)].map((m) => [m[2].replace(/\\'/g, "'"), m[3]]));
  const { ARMY_LORE } = await import('../../src/components/menu/cosmic/armyLore.js');
  const slug = (name) => name.normalize('NFD').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase();
  for (const name of Object.keys(ARMY_LORE)) {
    if (!ARMY_GIFS[name]) continue;
    const src = resolve(root, 'public', ARMY_GIFS[name]);
    await sharp(src).resize(1256, 256, { fit: 'cover' }).jpeg({ quality: 80, mozjpeg: true }).toFile(resolve(outDir, `stendardo-${slug(name)}.jpg`));
  }
  await sharp(resolve(root, 'public/Immagini_bg/Orizzonte_bg1.webp')).resize(888, 1260, { fit: 'cover' }).jpeg({ quality: 84, mozjpeg: true }).toFile(resolve(outDir, 'copertina.jpg'));
  console.log('✓ stendardi e copertina');
}

const server = await createServer({ root, logLevel: 'error', server: { port: 5198, strictPort: false, host: '127.0.0.1' } });
await server.listen();
const { port } = server.httpServer.address();
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });

try {
  for (const s of SCREENS) {
    if (only.length && !only.includes(s.name)) continue;
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: s.scale || 1 });
    await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'load', timeout: 120000 });
    await page.addStyleTag({ content: HIDE_FPS });
    await page.getByText('PARTITA LOCALE', { exact: true }).first().waitFor({ timeout: 120000 });
    await page.waitForTimeout(4000);
    if (s.label) {
      // PARTITA LOCALE è già la voce selezionata all'avvio: basta Invio
      if (s.label !== 'PARTITA LOCALE') {
        await page.getByText(s.label, { exact: true }).first().click();
        await page.waitForTimeout(600);
      }
      await page.keyboard.press('Enter');
      await page.waitForTimeout(s.wait || 6000);
    }
    for (const [key, wait] of s.keys || []) {
      await page.keyboard.press(key);
      await page.waitForTimeout(wait);
    }
    let img = sharp(await page.screenshot());
    if (s.crop) img = img.extract(s.crop);
    await img.resize({ width: s.width || OUT_WIDTH }).jpeg({ quality: 84, mozjpeg: true }).toFile(resolve(outDir, `${s.name}.jpg`));
    console.log(`✓ ${s.name}.jpg`);
    await page.close();
  }
} finally {
  await browser.close();
  await server.close();
}

// ============================================================
// Genera public/manuale/SATZE-Manuale.pdf dalle pagine del libretto.
//
//   npm run manuale:pdf
//
// Avvia Vite, apre ?manuale=stampa (le stesse pagine mostrate in gioco,
// una per foglio A5) e le stampa con Chromium. Da rilanciare ogni volta
// che cambiano i testi del manuale, le schermate o i dati che il manuale
// legge dal gioco (glossario, bonus, Eminenze).
//
// Se Playwright non trova il suo browser: CHROMIUM_PATH=/percorso/di/chrome.
// ============================================================
import { createServer } from 'vite';
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { mkdirSync, statSync } from 'node:fs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const out = resolve(root, 'public/manuale/SATZE-Manuale.pdf');

const server = await createServer({
  root,
  logLevel: 'error',
  server: { port: 5199, strictPort: false, host: '127.0.0.1' },
});
await server.listen();
const { port } = server.httpServer.address();

let browser;
try {
  browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
  const page = await browser.newPage();
  const missing = [];
  page.on('response', (r) => { if (r.status() >= 400) missing.push(`${r.status()} ${r.url()}`); });
  await page.goto(`http://127.0.0.1:${port}/?manuale=stampa`, { waitUntil: 'networkidle', timeout: 120000 });
  await page.waitForSelector('.mn-sheet', { timeout: 60000 });
  // font e immagini devono essere pronti prima della stampa
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].map((img) => (img.complete ? null : new Promise((res) => { img.onload = res; img.onerror = res; }))));
  });
  const broken = await page.evaluate(() => [...document.images].filter((i) => !i.naturalWidth).map((i) => i.getAttribute('src')));
  if (broken.length || missing.length) {
    throw new Error(`Risorse mancanti nel manuale:\n${[...new Set([...broken, ...missing])].join('\n')}`);
  }
  // una pagina che straborda verrebbe tagliata in stampa: meglio fermarsi qui
  const overflow = await page.evaluate(() => [...document.querySelectorAll('.mn-page')]
    .filter((p) => !p.classList.contains('is-cover') && !p.classList.contains('is-back'))
    .map((p) => {
      const foot = p.querySelector('.mn-foot');
      const limit = foot ? foot.getBoundingClientRect().top : p.getBoundingClientRect().bottom;
      const bottoms = [...p.children].filter((c) => c !== foot && !c.classList.contains('mn-head')).map((c) => c.getBoundingClientRect().bottom);
      return { id: p.dataset.page, over: Math.round(Math.max(0, ...bottoms) - limit) };
    })
    .filter((r) => r.over > 0));
  if (overflow.length) {
    throw new Error(`Pagine troppo piene (px oltre il piede):\n${overflow.map((o) => `  ${o.id}: +${o.over}`).join('\n')}`);
  }
  const sheets = await page.locator('.mn-sheet').count();
  mkdirSync(dirname(out), { recursive: true });
  await page.pdf({ path: out, width: '148mm', height: '210mm', printBackground: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
  console.log(`Manuale: ${sheets} pagine → ${out} (${(statSync(out).size / 1024 / 1024).toFixed(1)} MB)`);
} finally {
  await browser?.close();
  await server.close();
}

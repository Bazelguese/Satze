// Smoke test del loop campagna Atto I: menu → slot → hub → missione → duello.
// Uso: node scripts/campaign-smoke.mjs [baseUrl]
import puppeteer from 'puppeteer';

const BASE = process.argv[2] || 'http://localhost:5173';
// Viewport configurabile: SMOKE_W/SMOKE_H (default 1920×1080; usare 1366×768 per la verifica compact)
const VW = Number(process.env.SMOKE_W) || 1920;
const VH = Number(process.env.SMOKE_H) || 1080;
const OUT = 'scripts/_smoke';
import fs from 'node:fs';
fs.mkdirSync(OUT, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function clickByText(page, text, { tag = '*', timeout = 15000 } = {}) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const clicked = await page.evaluate(
      (t, tg) => {
        const els = [...document.querySelectorAll(tg)];
        const el = els.find(
          (e) =>
            e.childElementCount >= 0 &&
            (e.textContent || '').replace(/\s+/g, ' ').trim().toUpperCase().includes(t.toUpperCase()) &&
            e.closest('button, [role="button"], a, [onclick]')
        );
        const target = el ? el.closest('button, [role="button"], a, [onclick]') : null;
        if (target) {
          target.click();
          return true;
        }
        // fallback: clickable elements whose own text matches
        const btns = [...document.querySelectorAll('button, [role="button"]')];
        const btn = btns.find((b) => (b.textContent || '').toUpperCase().includes(t.toUpperCase()));
        if (btn) {
          btn.click();
          return true;
        }
        return false;
      },
      text,
      tag
    );
    if (clicked) return true;
    await sleep(400);
  }
  throw new Error(`Elemento con testo "${text}" non trovato/cliccabile`);
}

async function waitForText(page, text, timeout = 20000) {
  await page.waitForFunction(
    (t) => (document.body.textContent || '').toUpperCase().includes(t.toUpperCase()),
    { timeout },
    text
  );
}

const browser = await puppeteer.launch({ headless: 'new', args: [`--window-size=${VW},${VH}`] });
const page = await browser.newPage();
await page.setViewport({ width: VW, height: VH });
page.on('pageerror', (e) => console.error('[pageerror]', e.message));
page.on('console', (m) => {
  if (m.type() === 'error') console.error('[console.error]', m.text());
});

try {
  await page.goto(BASE, { waitUntil: 'networkidle2', timeout: 60000 });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle2' });
  await sleep(2500);
  await page.screenshot({ path: `${OUT}/01-menu.png` });

  // Menu → Campagna
  await clickByText(page, 'CAMPAGNA');
  await waitForText(page, 'salvataggi');
  await page.screenshot({ path: `${OUT}/02-slots.png` });

  // Slot 1 → Nuova campagna → schieramento iniziale (Nascente + 2 compagni)
  await clickByText(page, 'Nuova campagna');
  await waitForText(page, 'Esercito Iniziale');
  await page.screenshot({ path: `${OUT}/02b-army.png` });
  await clickByText(page, 'Eco Svanente');
  await clickByText(page, 'Leggero Richiamato');
  await clickByText(page, 'Conferma schieramento');
  await waitForText(page, 'GIORNO 1/14');
  await page.screenshot({ path: `${OUT}/03-hub.png` });

  // Nodo prologo → pannello missione
  await clickByText(page, 'Il Richiamo');
  await waitForText(page, 'Affronta missione');
  await page.screenshot({ path: `${OUT}/04-mission.png` });

  // Avvio missione → duello (shuffle & deal)
  await clickByText(page, 'Affronta missione');
  await sleep(6000);
  await page.screenshot({ path: `${OUT}/05-duel.png` });

  // Verifica: siamo usciti dall'hub (fase duello) e la run è salvata con currentNode
  const runRaw = await page.evaluate(() => localStorage.getItem('satze_campaign_slot_0'));
  const run = JSON.parse(runRaw);
  console.log('RUN day:', run.day, '| currentNode:', run.currentNode, '| deck:', JSON.stringify(run.deck));
  if (run.currentNode !== 'n_prologo') throw new Error('currentNode atteso n_prologo');

  const bodyText = await page.evaluate(() => document.body.textContent || '');
  if (bodyText.includes('GIORNO 1/14')) throw new Error('Sembra di essere ancora nell\'hub');

  console.log('SMOKE OK — loop menu → hub → missione → duello avviato');
} catch (e) {
  await page.screenshot({ path: `${OUT}/99-error.png` });
  console.error('SMOKE FAIL:', e.message);
  process.exitCode = 1;
} finally {
  await browser.close();
}

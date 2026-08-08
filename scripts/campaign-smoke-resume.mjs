// Smoke test ripresa: run salvata → reload → Continua → hub con stato identico.
// Simula anche un esito vittoria del Prologo scritto dal reducer (come farebbe useCampaignGameOutcome).
import puppeteer from 'puppeteer';
import fs from 'node:fs';

const BASE = process.argv[2] || 'http://localhost:5173';
const OUT = 'scripts/_smoke';
fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function clickByText(page, text, timeout = 15000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const ok = await page.evaluate((t) => {
      const btns = [...document.querySelectorAll('button, [role="button"], a')];
      const btn = btns.find((b) => (b.textContent || '').toUpperCase().includes(t.toUpperCase()));
      if (btn) { btn.click(); return true; }
      return false;
    }, text);
    if (ok) return;
    await sleep(400);
  }
  throw new Error(`"${text}" non trovato`);
}

async function waitForText(page, text, timeout = 20000) {
  await page.waitForFunction(
    (t) => (document.body.textContent || '').toUpperCase().includes(t.toUpperCase()),
    { timeout },
    text
  );
}

const browser = await puppeteer.launch({ headless: 'new' });
const page = await browser.newPage();
await page.setViewport({ width: 1920, height: 1080 });
page.on('pageerror', (e) => console.error('[pageerror]', e.message));

try {
  await page.goto(BASE, { waitUntil: 'networkidle2', timeout: 60000 });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle2' });
  await sleep(2500);

  // Crea la run dallo slot (come farebbe il giocatore)
  await clickByText(page, 'CAMPAGNA');
  await waitForText(page, 'salvataggi');
  await clickByText(page, 'Nuova campagna');
  await waitForText(page, 'Esercito Iniziale');
  await clickByText(page, 'Eco Svanente');
  await clickByText(page, 'Leggero Richiamato');
  await clickByText(page, 'Conferma schieramento');
  await waitForText(page, 'GIORNO 1/14');

  // Simula la vittoria del Prologo come la scriverebbe useCampaignGameOutcome
  // → run al giorno 2 con evento Impronta pendente.
  const prepared = await page.evaluate(() => {
    const raw = localStorage.getItem('satze_campaign_slot_0');
    if (!raw) return null;
    const run = JSON.parse(raw);
    run.currentNode = null;
    run.history = [{ day: 1, missionId: 'A1-00', result: 'player' }];
    run.nodes.n_prologo = 'completed';
    run.nodes.n_enclave_a = 'available';
    run.nodes.n_enclave_b = 'available';
    run.nodes.n_enclave_c = 'available';
    run.day = 2;
    run.pendingEvents = ['EV_impronta'];
    run.eventsSeen = ['EV_impronta'];
    localStorage.setItem('satze_campaign_slot_0', JSON.stringify(run));
    return run.day;
  });
  if (prepared == null) throw new Error('Nessuna run salvata dallo smoke precedente');

  await page.reload({ waitUntil: 'networkidle2' });
  await sleep(2500);

  await clickByText(page, 'CAMPAGNA');
  await waitForText(page, 'Giorno');
  await page.screenshot({ path: `${OUT}/06-slots-resume.png` });

  await clickByText(page, 'Continua');
  await waitForText(page, 'GIORNO 2/14');
  await sleep(600);
  await page.screenshot({ path: `${OUT}/07-hub-resume.png` });

  // L'evento Impronta deve presentarsi al rientro (pannello Evoluzione: scegli + conferma)
  await waitForText(page, "L'Impronta");
  await clickByText(page, "L'istinto del primo colpo");
  await sleep(400);
  await page.screenshot({ path: `${OUT}/08-evolution-choice.png` });
  await clickByText(page, "Incidi l'evoluzione");
  await sleep(600);
  await page.screenshot({ path: `${OUT}/08-after-event.png` });

  const after = await page.evaluate(() => JSON.parse(localStorage.getItem('satze_campaign_slot_0')));
  console.log('nascente:', JSON.stringify(after.nascente), '| pending:', JSON.stringify(after.pendingEvents));
  if (after.nascente.trigger !== 'turbo' || after.nascente.effect !== 'power') {
    throw new Error('Scelta Impronta non applicata');
  }

  // Enclave disponibili e selezionabili
  await clickByText(page, 'Enclave delle Ceneri');
  await waitForText(page, 'Affronta missione');
  await page.screenshot({ path: `${OUT}/09-enclave-mission.png` });

  console.log('RESUME OK — salva/riprendi + evento Impronta + enclave selezionabile');
} catch (e) {
  await page.screenshot({ path: `${OUT}/99-resume-error.png` });
  console.error('RESUME FAIL:', e.message);
  process.exitCode = 1;
} finally {
  await browser.close();
}

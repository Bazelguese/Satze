// Prova end-to-end: Offerta della Corte Rossa lasciata senza risposta con l'IA all'iniziativa.
//
// Il difetto coperto: chiuso l'annuncio, l'IA sceglieva il Campo mentre l'Offerta era ancora
// in sospeso; il gate successivo cancellava l'Offerta, la fase tornava a `selectField`, l'IA
// fissava il Campo una seconda volta e si apriva GENERAL: fase `battle` senza Agenti, partita
// bloccata. Qui si verifica che il tavolo resti fermo finché il giocatore non risponde, anche
// sotto input dati fuori turno, e che poi il round arrivi allo scontro con entrambi gli Agenti.
//
// Uso:  node scripts/smoke-offerta-iniziativa-ia.mjs            (avvia Vite da sé)
//       node scripts/smoke-offerta-iniziativa-ia.mjs --url http://127.0.0.1:5173/
// L'iniziativa dipende dalle carte distribuite: la partita viene riavviata finché tocca all'IA.

import { chromium } from 'playwright';
import { createServer } from 'vite';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const urlArg = process.argv.indexOf('--url');
const MAX_AVVII = 14;
const FERMO_MS = 9000;

const stato = (page) => page.evaluate(() => window.__satzeTest?.stato?.() ?? null);
const riga = (s) => s && `${s.gamePhase} r${s.roundNumber} iniziativa=${s.isPlayerFirst ? 'giocatore' : 'IA'} campo=${s.currentFieldIndex} eroe=${s.selectedAgent} nemico=${s.enemyAgent} gate=${s.eminenze?.gate} annunci=${s.annunci} affari=${s.affari?.length} blocco=${s.bloccoEminenze}`;

/** Osserva lo stato finché `fine(stato)` è vero; ogni lettura passa da `controlla`. */
async function osserva(page, fine, { timeout, controlla, etichetta }) {
  const t0 = Date.now();
  let ultima = '';
  while (Date.now() - t0 < timeout) {
    const s = await stato(page);
    const r = riga(s);
    if (r !== ultima) { console.log(`  [${etichetta} +${((Date.now() - t0) / 1000).toFixed(1)}s] ${r}`); ultima = r; }
    if (s) {
      controlla?.(s);
      if (fine(s)) return s;
    }
    await page.waitForTimeout(150);
  }
  return null;
}

function mai(condizione, messaggio, s) {
  if (condizione) throw new Error(`${messaggio} — ${riga(s)}`);
}
const maiBattleSenzaAgenti = (s) => mai(
  s.gamePhase === 'battle' && (s.selectedAgent == null || s.enemyAgent == null),
  'fase battle senza entrambi gli Agenti', s,
);

/** Menù → Patto degli Indocili → Standard con Eminenze contro la Corte Rossa. */
async function avviaPartita(browser, url) {
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  page.on('pageerror', (e) => { throw new Error(`errore di pagina: ${e.message}`); });
  await page.goto(url, { waitUntil: 'load', timeout: 120000 });
  await page.getByText('PARTITA LOCALE', { exact: true }).first().waitFor({ timeout: 120000 });
  await page.waitForTimeout(3000);
  await page.keyboard.press('Enter'); // PARTITA LOCALE è la voce già selezionata
  await page.waitForTimeout(3000);
  for (let i = 0; i < 8; i += 1) { await page.keyboard.press('ArrowDown'); await page.waitForTimeout(300); } // 10 · Patto degli Indocili
  await page.keyboard.press('Enter'); await page.waitForTimeout(3000); // armata
  await page.keyboard.press('Enter'); await page.waitForTimeout(2500); // esercito → «Imposta la partita»
  await page.keyboard.press('ArrowDown'); await page.waitForTimeout(300);
  await page.keyboard.press('ArrowDown'); await page.waitForTimeout(300); // voce NEMICO
  await page.keyboard.press('ArrowRight'); await page.waitForTimeout(600); // ARMATA SCELTA
  await page.locator('text="Corte Rossa" >> visible=true').first().click({ force: true });
  await page.waitForTimeout(600);
  await page.locator('text="INIZIA" >> visible=true').first().click({ force: true });
  return page;
}

async function prova(browser, url) {
  let page = null;
  for (let avvio = 1; avvio <= MAX_AVVII; avvio += 1) {
    page = await avviaPartita(browser, url);
    const s = await osserva(page, (st) => st.sceltaEminenza?.attesa && st.gamePhase === 'selectField', { timeout: 150000, etichetta: `avvio ${avvio}` });
    if (!s) throw new Error('la partita non è arrivata alla fase Comando');
    if (s.isPlayerFirst) { console.log('  iniziativa al giocatore: riavvio'); await page.close(); page = null; continue; }

    // Comando: seleziona e conferma la prima abilità dell'Eminenza (due clic sulla fascia).
    const fascia = page.locator('.em-zone-player .em-rail-item .em-rail-hit').first();
    for (let i = 0; i < 6; i += 1) {
      await fascia.click({ force: true }).catch(() => {});
      await page.waitForTimeout(1200);
      if ((await stato(page)).eminenze?.player?.selectedAbilityId) break;
    }
    // L'Offerta della Corte nasce al gate pre-Campo; si aspetta che il suo annuncio si chiuda.
    const offerta = await osserva(page, (st) => st.affari.length > 0 && st.annunci === 0, { timeout: 20000, etichetta: 'offerta', controlla: maiBattleSenzaAgenti });
    if (offerta) break;
    console.log('  la Corte non ha aperto con un\'Offerta: riavvio');
    await page.close(); page = null;
  }
  if (!page) throw new Error(`nessuna partita con iniziativa IA e Offerta in ${MAX_AVVII} avvii`);

  // 1. Offerta senza risposta: il tavolo resta fermo, anche con input dati fuori turno.
  const fermo = (s) => {
    maiBattleSenzaAgenti(s);
    mai(s.affari.length === 0, "l'Offerta è sparita senza risposta del giocatore", s);
    mai(s.currentFieldIndex != null, "l'IA ha scelto il Campo con l'Offerta in sospeso", s);
    mai(s.gamePhase !== 'selectField', "la fase è avanzata con l'Offerta in sospeso", s);
    mai(!s.bloccoEminenze, "il tavolo non è fermo con l'Offerta in sospeso", s);
  };
  const inputFuoriTurno = [
    ['clic sui Campi', () => page.mouse.click(1400, 195)],
    ['Invio', () => page.keyboard.press('Enter')],
    ['clic su una carta in mano', () => page.mouse.click(1118, 760)],
    ['secondo clic sulla carta', () => page.mouse.click(1118, 760)],
  ];
  for (const [nome, azione] of inputFuoriTurno) {
    await azione();
    console.log(`  input fuori turno: ${nome}`);
    await osserva(page, () => false, { timeout: FERMO_MS / inputFuoriTurno.length, etichetta: 'fermo', controlla: fermo });
  }

  // 2. Risposta all'Offerta (rifiuto): l'IA sceglie il Campo e schiera il suo Agente.
  await page.evaluate(() => window.__satzeTest.affare({ dealAccepted: false, dealResponse: 'refuse' }));
  console.log('  Offerta rifiutata');
  const turno = await osserva(page, (s) => s.gamePhase === 'selectAgent' && s.enemyAgent != null && !s.bloccoEminenze, { timeout: 60000, etichetta: 'turno IA', controlla: maiBattleSenzaAgenti });
  if (!turno) throw new Error("dopo la risposta l'IA non ha scelto Campo e Agente");
  mai(turno.currentFieldIndex == null, 'Agente nemico schierato senza Campo', turno);

  // 3. Il giocatore schiera: si arriva allo scontro con entrambi gli Agenti e al risultato.
  await page.evaluate((id) => { window.__satzeTest.agente(id); window.__satzeTest.fc(1); }, turno.mano[0]);
  await page.waitForTimeout(1500);
  await page.evaluate(() => window.__satzeTest.conferma());
  const esito = await osserva(page, (s) => s.gamePhase === 'result' || s.gamePhase === 'gameOver', { timeout: 90000, etichetta: 'scontro', controlla: maiBattleSenzaAgenti });
  if (!esito) throw new Error('lo scontro non è arrivato al risultato');
  await page.close();
}

const server = urlArg > 0 ? null : await createServer({ root, logLevel: 'error', server: { port: 5199, strictPort: false, host: '127.0.0.1' } });
if (server) await server.listen();
const url = urlArg > 0 ? process.argv[urlArg + 1] : `http://127.0.0.1:${server.httpServer.address().port}/`;
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
let codice = 0;
try {
  await prova(browser, url);
  console.log('✓ Offerta senza risposta: tavolo fermo, nessuna fase battle senza Agenti, round concluso');
} catch (err) {
  console.error(`✗ ${err.message}`);
  codice = 1;
} finally {
  await browser.close();
  if (server) await server.close();
}
process.exit(codice);

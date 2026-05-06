/**
 * Genera la GIF del menu in automatico (server + Puppeteer).
 * Usa la versione "solo immagine animata" (nessun overlay torce/foschia).
 * Uso: node scripts/generate-menu-gif-runner.cjs
 * Richiede: menu-bg-source.png (o .jpg) in public/
 * Output: public/menu-bg-war.gif
 */

const path = require('path');
const fs = require('fs');
const http = require('http');
const url = require('url');

const PORT = 37542;
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const GIF_PATH = path.join(PUBLIC_DIR, 'menu-bg-war.gif');

function startStaticServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const p = url.parse(req.url).pathname === '/' ? '/generate-menu-gif-image-only.html' : url.parse(req.url).pathname;
      const file = path.join(PUBLIC_DIR, p.replace(/^\//, '').replace(/\.\./g, ''));
      const stream = fs.createReadStream(file);
      stream.on('error', () => { res.writeHead(404); res.end(); });
      stream.on('open', () => {
        const ext = path.extname(file);
        const ct = ext === '.html' ? 'text/html' : ext === '.png' ? 'image/png' : ext === '.jpg' ? 'image/jpeg' : 'application/octet-stream';
        res.setHeader('Content-Type', ct);
        stream.pipe(res);
      });
    });
    server.listen(PORT, '127.0.0.1', () => resolve(server));
  });
}

async function main() {
  let puppeteer;
  try {
    puppeteer = (await import('puppeteer')).default;
  } catch {
    console.log('Installo puppeteer…');
    const { execSync } = require('child_process');
    execSync('npm install puppeteer --save-dev', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
    puppeteer = (await import('puppeteer')).default;
  }
  return mainWithPuppeteer(puppeteer);
}

async function mainWithPuppeteer(puppeteer) {
  if (!fs.existsSync(path.join(PUBLIC_DIR, 'menu-bg-source.png')) && !fs.existsSync(path.join(PUBLIC_DIR, 'menu-bg-source.jpg'))) {
    console.error('Metti menu-bg-source.png (o .jpg) in public/ e riprova.');
    process.exit(1);
  }
  const server = await startStaticServer();
  const baseUrl = `http://127.0.0.1:${PORT}`;

  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  await page.setRequestInterception(true);
  page.on('request', (r) => r.continue());

  const client = await page.createCDPSession();
  await client.send('Page.setDownloadBehavior', {
    behavior: 'allow',
    downloadPath: PUBLIC_DIR,
  });

  await page.goto(`${baseUrl}/generate-menu-gif-image-only.html`, {
    waitUntil: 'networkidle0',
    timeout: 20000,
  });

  await page.waitForSelector('#btn:not([disabled])', { timeout: 10000 }).catch(() => null);
  const btn = await page.$('#btn');
  if (!btn) {
    console.error('Immagine non caricata. Metti menu-bg-source.png in public/');
    await browser.close();
    server.close();
    process.exit(1);
  }

  await btn.click();
  await new Promise((r) => setTimeout(r, 25000));

  await browser.close();
  server.close();

  if (fs.existsSync(GIF_PATH)) {
    console.log('GIF creata (solo immagine animata):', GIF_PATH);
  } else {
    console.error('Download non trovato. Apri nel browser: ' + baseUrl + '/generate-menu-gif-image-only.html');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

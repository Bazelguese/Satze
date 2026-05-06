/**
 * Genera le 7 GIF bandiere per i pulsanti modalità (server + Puppeteer).
 * Uso: node scripts/generate-flag-gifs-runner.cjs
 * Output: public/flag-mode-1.gif … public/flag-mode-7.gif
 */

const path = require('path');
const fs = require('fs');
const http = require('http');
const url = require('url');

const PORT = 37543;
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

function startStaticServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const p = url.parse(req.url).pathname === '/' ? '/generate-flag-gifs.html' : url.parse(req.url).pathname;
      const file = path.join(PUBLIC_DIR, p.replace(/^\//, '').replace(/\.\./g, ''));
      const stream = fs.createReadStream(file);
      stream.on('error', () => { res.writeHead(404); res.end(); });
      stream.on('open', () => {
        const ext = path.extname(file);
        const ct = ext === '.html' ? 'text/html' : 'application/octet-stream';
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
  const server = await startStaticServer();
  const baseUrl = `http://127.0.0.1:${PORT}`;
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  const client = await page.createCDPSession();
  await client.send('Page.setDownloadBehavior', {
    behavior: 'allow',
    downloadPath: PUBLIC_DIR,
  });
  await page.goto(`${baseUrl}/generate-flag-gifs.html`, { waitUntil: 'networkidle0', timeout: 15000 });
  await page.waitForSelector('#btnAll', { timeout: 5000 });
  await page.click('#btnAll');
  await new Promise((r) => setTimeout(r, 12000));
  await browser.close();
  server.close();
  const expected = [1, 2, 3, 4, 5, 6, 7].map((i) => path.join(PUBLIC_DIR, `flag-mode-${i}.gif`));
  const ok = expected.filter((p) => fs.existsSync(p)).length;
  if (ok === 7) {
    console.log('GIF bandiere create in public/: flag-mode-1.gif … flag-mode-7.gif');
  } else {
    console.log(`Create ${ok}/7. Se mancano, apri nel browser: ${baseUrl}/generate-flag-gifs.html e clicca "Genera tutte".`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

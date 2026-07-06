/**
 * Scarica i font Google usati dal gioco (subset latin + latin-ext) in
 * public/fonts/ e genera public/fonts/fonts.css con i @font-face locali
 * (URL relativi al css stesso: funziona sia su web sia in Electron).
 * Run: node scripts/selfhost-fonts.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const fontsDir = path.join(rootDir, 'public', 'fonts');
fs.mkdirSync(fontsDir, { recursive: true });

const CSS_URL =
  'https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@300;400;500;600;700&family=Cinzel:wght@400..900&family=Share+Tech+Mono&display=swap';
// User-Agent moderno => Google serve woff2 con unicode-range
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

const res = await fetch(CSS_URL, { headers: { 'User-Agent': UA } });
if (!res.ok) throw new Error(`CSS fetch failed: ${res.status}`);
const css = await res.text();

// Estrai i blocchi @font-face con il commento del subset che li precede
const blocks = [...css.matchAll(/\/\*\s*([\w-]+)\s*\*\/\s*(@font-face\s*\{[^}]*\})/g)];
const KEEP_SUBSETS = new Set(['latin', 'latin-ext']);

let outCss = `/* Font self-hosted (Google Fonts, subset latin + latin-ext)\n * Generato da scripts/selfhost-fonts.mjs — non modificare a mano.\n */\n`;
let count = 0;

for (const [, subset, block] of blocks) {
  if (!KEEP_SUBSETS.has(subset)) continue;
  const urlMatch = block.match(/url\((https:[^)]+\.woff2)\)/);
  if (!urlMatch) continue;
  const url = urlMatch[1];
  const family = block.match(/font-family:\s*'([^']+)'/)?.[1] ?? 'font';
  const weight = block.match(/font-weight:\s*([\d ]+);/)?.[1]?.trim().replace(' ', '-') ?? '400';
  const fileName = `${family.replace(/\s+/g, '')}-${weight}-${subset}.woff2`;

  const fontRes = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!fontRes.ok) throw new Error(`Font fetch failed: ${url}`);
  fs.writeFileSync(path.join(fontsDir, fileName), Buffer.from(await fontRes.arrayBuffer()));

  outCss += `\n/* ${subset} */\n` + block.replace(urlMatch[1], `./${fileName}`) + '\n';
  count++;
}

fs.writeFileSync(path.join(fontsDir, 'fonts.css'), outCss);
console.log(`Scaricati ${count} file woff2 in public/fonts/, generato public/fonts/fonts.css`);

/**
 * Importa kit Arcana → public/card-images/arcana/layers/<slug>/
 * Uso: node scripts/import-arcana-kit.mjs [slug...]
 * Senza args: importa tutti i kit in KITS.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const EXTRACT = path.join(ROOT, 'Documentazione', '_arcana_kit_extract');
const DEST_ROOT = path.join(ROOT, 'public', 'card-images', 'arcana', 'layers');
const FONT_DEST = path.join(ROOT, 'public', 'card-images', 'arcana', 'fonts');

const WEBP_OPTS = {
  quality: 90,
  alphaQuality: 100,
  effort: 6,
  smartSubsample: true,
};

/** Cartella extract → slug public */
const KITS = [
  {
    folder: path.join(EXTRACT, 'Leggero-Richiamato'),
    slug: 'leggero-richiamato',
    map: [
      ['Soggetto.png', 'soggetto.webp'],
      ['Sfondo.png', 'sfondo.webp'],
      ['Sfondo-inquadrato.png', 'sfondo-inquadrato.webp'],
      ['Cornice.png', 'cornice.webp'],
      ['Layout.png', 'layout.webp'],
      ['Maschera.png', 'maschera.webp'],
      ['Leggero-Richiamato-ARCANA.png', 'composita.webp'],
    ],
    jsonSrc: 'Leggero-Richiamato-ARCANA.json',
    layoutSvg: 'Layout.svg',
  },
  {
    folder: path.join(EXTRACT, 'Mezzanotte', 'Mezzanotte'),
    slug: 'mezzanotte',
    map: [
      ['Soggetto.png', 'soggetto.webp'],
      ['Sfondo.png', 'sfondo.webp'],
      ['Sfondo-inquadrato.png', 'sfondo-inquadrato.webp'],
      ['Cornice.png', 'cornice.webp'],
      ['Layout.png', 'layout.webp'],
      ['Maschera.png', 'maschera.webp'],
      ['Mezzanotte-ARCANA.png', 'composita.webp'],
    ],
    jsonSrc: 'Mezzanotte-ARCANA.json',
    layoutSvg: 'Layout.svg',
  },
  {
    folder: path.join(EXTRACT, 'Bombardiere-Ali-Argentee', 'Bombardiere-Ali-Argentee'),
    slug: 'bombardiere-ali-argentee',
    map: [
      ['Soggetto.png', 'soggetto.webp'],
      ['Sfondo.png', 'sfondo.webp'],
      ['Sfondo-inquadrato.png', 'sfondo-inquadrato.webp'],
      ['Cornice.png', 'cornice.webp'],
      ['Layout.png', 'layout.webp'],
      ['Maschera.png', 'maschera.webp'],
      ['Bombardiere-Ali-Argentee-ARCANA.png', 'composita.webp'],
    ],
    jsonSrc: 'Bombardiere-Ali-Argentee-ARCANA.json',
    layoutSvg: 'Layout.svg',
  },
  {
    folder: path.join(EXTRACT, 'Intrattenitore-di-Corte', 'Intrattenitore-di-Corte'),
    slug: 'intrattenitore-di-corte',
    map: [
      ['Soggetto.png', 'soggetto.webp'],
      ['Sfondo.png', 'sfondo.webp'],
      ['Sfondo-inquadrato.png', 'sfondo-inquadrato.webp'],
      ['Cornice.png', 'cornice.webp'],
      ['Layout.png', 'layout.webp'],
      ['Maschera.png', 'maschera.webp'],
      ['Intrattenitore-di-Corte-ARCANA.png', 'composita.webp'],
    ],
    jsonSrc: 'Intrattenitore-di-Corte-ARCANA.json',
    layoutSvg: 'Layout.svg',
  },
  {
    folder: path.join(EXTRACT, 'Protettore-dei-Protettori', 'Protettore-dei-Protettori'),
    slug: 'protettore-dei-protettori',
    map: [
      ['Soggetto.png', 'soggetto.webp'],
      ['Sfondo.png', 'sfondo.webp'],
      ['Sfondo-inquadrato.png', 'sfondo-inquadrato.webp'],
      ['Cornice.png', 'cornice.webp'],
      ['Layout.png', 'layout.webp'],
      ['Maschera.png', 'maschera.webp'],
      ['Protettore-dei-Protettori-ARCANA.png', 'composita.webp'],
    ],
    jsonSrc: 'Protettore-dei-Protettori-ARCANA.json',
    layoutSvg: 'Layout.svg',
  },
  {
    folder: path.join(EXTRACT, 'Dracoltoio', 'Dracoltoio'),
    slug: 'dracoltoio',
    map: [
      ['Soggetto.png', 'soggetto.webp'],
      ['Sfondo.png', 'sfondo.webp'],
      ['Sfondo-inquadrato.png', 'sfondo-inquadrato.webp'],
      ['Cornice.png', 'cornice.webp'],
      ['Layout.png', 'layout.webp'],
      ['Maschera.png', 'maschera.webp'],
      ['Dracoltoio-ARCANA.png', 'composita.webp'],
    ],
    jsonSrc: 'Dracoltoio-ARCANA.json',
    layoutSvg: 'Layout.svg',
  },
  {
    folder: path.join(EXTRACT, 'Matriarca-Gentile', 'Matriarca-Gentile'),
    slug: 'matriarca-gentile',
    map: [
      ['Soggetto.png', 'soggetto.webp'],
      ['Sfondo.png', 'sfondo.webp'],
      ['Sfondo-inquadrato.png', 'sfondo-inquadrato.webp'],
      ['Cornice.png', 'cornice.webp'],
      ['Layout.png', 'layout.webp'],
      ['Maschera.png', 'maschera.webp'],
      ['Matriarca-Gentile-ARCANA.png', 'composita.webp'],
    ],
    jsonSrc: 'Matriarca-Gentile-ARCANA.json',
    layoutSvg: 'Layout.svg',
  },
  {
    folder: path.join(EXTRACT, 'Hekwa-sew', 'Hekwa-sew'),
    slug: 'hekwa-sew',
    map: [
      ['Soggetto.png', 'soggetto.webp'],
      ['Sfondo.png', 'sfondo.webp'],
      ['Sfondo-inquadrato.png', 'sfondo-inquadrato.webp'],
      ['Cornice.png', 'cornice.webp'],
      ['Layout.png', 'layout.webp'],
      ['Maschera.png', 'maschera.webp'],
      ['Hekwa-sew-ARCANA.png', 'composita.webp'],
    ],
    jsonSrc: 'Hekwa-sew-ARCANA.json',
    layoutSvg: 'Layout.svg',
  },
  {
    folder: path.join(EXTRACT, 'Artista-dell-Ultrastrada', 'Artista-dell-Ultrastrada'),
    slug: 'artista-dell-ultrastrada',
    map: [
      ['Soggetto.png', 'soggetto.webp'],
      ['Sfondo.png', 'sfondo.webp'],
      ['Sfondo-inquadrato.png', 'sfondo-inquadrato.webp'],
      ['Cornice.png', 'cornice.webp'],
      ['Layout.png', 'layout.webp'],
      ['Maschera.png', 'maschera.webp'],
      ['Artista-dell-Ultrastrada-ARCANA.png', 'composita.webp'],
    ],
    jsonSrc: 'Artista-dell-Ultrastrada-ARCANA.json',
    layoutSvg: 'Layout.svg',
  },
  {
    folder: path.join(EXTRACT, 'Strega-del-Crepuscolo', 'Strega-del-Crepuscolo'),
    slug: 'strega-del-crepuscolo',
    map: [
      ['Soggetto.png', 'soggetto.webp'],
      ['Sfondo.png', 'sfondo.webp'],
      ['Sfondo-inquadrato.png', 'sfondo-inquadrato.webp'],
      ['Cornice.png', 'cornice.webp'],
      ['Layout.png', 'layout.webp'],
      ['Maschera.png', 'maschera.webp'],
      ['Strega-del-Crepuscolo-ARCANA.png', 'composita.webp'],
    ],
    jsonSrc: 'Strega-del-Crepuscolo-ARCANA.json',
    layoutSvg: 'Layout.svg',
  },
];

async function toWebp(srcPath, destPath) {
  const buf = await sharp(fs.readFileSync(srcPath))
    .ensureAlpha()
    .webp(WEBP_OPTS)
    .toBuffer();
  fs.writeFileSync(destPath, buf);
  return buf.length;
}

async function importKit(kit) {
  const from = kit.folder;
  if (!fs.existsSync(from)) {
    throw new Error('Extract missing: ' + from);
  }
  const to = path.join(DEST_ROOT, kit.slug);
  fs.mkdirSync(to, { recursive: true });
  console.log('\n' + kit.slug);
  for (const [srcName, outName] of kit.map) {
    const srcPath = path.join(from, srcName);
    if (!fs.existsSync(srcPath)) {
      console.log('  · missing', srcName);
      continue;
    }
    const destPath = path.join(to, outName);
    const n = await toWebp(srcPath, destPath);
    const meta = await sharp(destPath).metadata();
    console.log(`  · ${outName} ${meta.width}×${meta.height} ${(n / 1024).toFixed(0)}KB`);
  }
  const jsonPath = path.join(from, kit.jsonSrc);
  if (fs.existsSync(jsonPath)) {
    fs.copyFileSync(jsonPath, path.join(to, 'card.json'));
    console.log('  · card.json');
  }
  const svgPath = path.join(from, kit.layoutSvg);
  if (fs.existsSync(svgPath)) {
    fs.copyFileSync(svgPath, path.join(to, 'layout.svg'));
    console.log('  · layout.svg');
  }
  const leggi = path.join(from, 'LEGGIMI.txt');
  if (fs.existsSync(leggi)) {
    fs.copyFileSync(leggi, path.join(to, 'LEGGIMI.md'));
    console.log('  · LEGGIMI.md');
  }

  const fontSrc = path.join(from, 'assets', 'Arcana-Roman-Bold.woff');
  if (fs.existsSync(fontSrc)) {
    fs.mkdirSync(FONT_DEST, { recursive: true });
    fs.copyFileSync(fontSrc, path.join(FONT_DEST, 'Arcana-Roman-Bold.woff'));
    console.log('  · font Arcana-Roman-Bold.woff');
  }
  const lic = path.join(from, 'assets', 'LICENZA-FONT.txt');
  if (fs.existsSync(lic)) {
    fs.mkdirSync(FONT_DEST, { recursive: true });
    fs.copyFileSync(lic, path.join(FONT_DEST, 'LICENZA-FONT.txt'));
  }
}

async function main() {
  const want = process.argv.slice(2).map((s) => s.toLowerCase());
  const kits = want.length
    ? KITS.filter((k) => want.includes(k.slug) || want.some((w) => k.folder.toLowerCase().includes(w)))
    : KITS;
  if (!kits.length) {
    throw new Error('Nessun kit da importare. Slug noti: ' + KITS.map((k) => k.slug).join(', '));
  }
  fs.mkdirSync(DEST_ROOT, { recursive: true });
  for (const kit of kits) {
    await importKit(kit);
  }
  console.log('\nDone.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

/**
 * Genera le varianti leggere degli asset mostrati piccoli a schermo.
 *
 * Il costo di un'immagine a runtime non dipende dal peso del file ma dai pixel
 * decodificati: un campo 3376×1440 occupa ~18,5 MB di memoria GPU anche quando
 * viene disegnato alto 30 px nel tabellone. Qui produciamo varianti dimensionate
 * sull'uso reale, lasciando intatti gli originali per le viste a piena pagina.
 *
 * Uso: npm run thumbs
 */

import sharp from 'sharp';
import { mkdir, readdir, stat } from 'fs/promises';
import { existsSync } from 'fs';
import { basename, dirname, extname, join } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = join(ROOT, 'public');
/** I PNG sorgente vivono fuori da public/ per non finire nel build. */
const ORIGINALS = join(ROOT, 'originals_png');

/** Chip del tabellone: ~300×40 CSS px sul canvas 1920, 480 copre anche il DPR alto. */
const FIELD_THUMB_WIDTH = 480;
/** Dorsi carta: mostrati a ~230×330 CSS px, 660 copre zoom e animazioni shuffle. */
const CARD_BACK_WIDTH = 660;
/** Sfondi armata: allineati alle altre armate già in webp. */
const ARMY_BG_WIDTH = 1680;

const jobs = [];

function addJob(job) {
  jobs.push(job);
}

async function collectFieldThumbs() {
  const srcDir = join(PUBLIC, 'campi_bg');
  if (!existsSync(srcDir)) return;
  const outDir = join(srcDir, 'thumbs');
  await mkdir(outDir, { recursive: true });

  const entries = await readdir(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    if (extname(entry.name).toLowerCase() !== '.webp') continue;
    addJob({
      label: `campi_bg/thumbs/${entry.name}`,
      src: join(srcDir, entry.name),
      out: join(outDir, entry.name),
      width: FIELD_THUMB_WIDTH,
      quality: 72,
    });
  }
}

async function collectCardBacks() {
  const srcDir = join(ORIGINALS, 'card-images', 'back');
  const outDir = join(PUBLIC, 'card-images', 'back');
  if (!existsSync(srcDir)) return;
  await mkdir(outDir, { recursive: true });

  const entries = await readdir(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    if (extname(entry.name).toLowerCase() !== '.png') continue;
    const name = `${basename(entry.name, extname(entry.name))}.webp`;
    addJob({
      label: `card-images/back/${name}`,
      src: join(srcDir, entry.name),
      out: join(outDir, name),
      width: CARD_BACK_WIDTH,
      quality: 86,
    });
  }
}

async function collectArmyBackgrounds() {
  const srcDir = join(ORIGINALS, 'Immagini_bg');
  const outDir = join(PUBLIC, 'Immagini_bg');
  if (!existsSync(srcDir) || !existsSync(outDir)) return;

  for (const png of ['Apex_bg1.png', 'Mascarada_bg1.png']) {
    const src = join(srcDir, png);
    if (!existsSync(src)) continue;
    const name = `${basename(png, '.png')}.webp`;
    addJob({
      label: `Immagini_bg/${name}`,
      src,
      out: join(outDir, name),
      width: ARMY_BG_WIDTH,
      quality: 82,
    });
  }
}

async function run() {
  await collectFieldThumbs();
  await collectCardBacks();
  await collectArmyBackgrounds();

  if (jobs.length === 0) {
    console.log('Nessun asset da elaborare.');
    return;
  }

  let srcBytes = 0;
  let outBytes = 0;
  let done = 0;

  for (const job of jobs) {
    const meta = await sharp(job.src).metadata();
    const width = Math.min(job.width, meta.width || job.width);

    await sharp(job.src)
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: job.quality })
      .toFile(job.out);

    const [srcStat, outStat] = await Promise.all([stat(job.src), stat(job.out)]);
    srcBytes += srcStat.size;
    outBytes += outStat.size;
    done++;

    console.log(
      `${job.label}  ${meta.width}×${meta.height} -> ${width}px  ` +
        `${(srcStat.size / 1024).toFixed(0)} kB -> ${(outStat.size / 1024).toFixed(0)} kB`
    );
  }

  const mb = (b) => (b / 1024 / 1024).toFixed(2);
  console.log(
    `\n${done} file generati. Sorgenti ${mb(srcBytes)} MB -> varianti ${mb(outBytes)} MB.`
  );
}

run().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

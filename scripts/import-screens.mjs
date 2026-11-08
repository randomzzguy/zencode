/*
 * Imports real app screenshots into assets/projects/screens/<slug>/.
 *
 *   node scripts/import-screens.mjs "C:/path/to/ZencodeAppsScrrenshots"
 *
 * The source folder has one sub-folder per app. SCREENS picks which files to
 * publish, in order, with a caption each. `blur` boxes (in source pixels) hide
 * personal details such as account emails or addresses before anything is written.
 * The build reads screens.json from each folder.
 */
import sharp from 'sharp';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const source = process.argv[2];
if (!source) throw new Error('Pass the screenshots folder as the first argument.');

// Account email (bottom-left) and workspace address line (top) in TapRepute.
const tapreputeBlur = [{ left: 20, top: 860, width: 260, height: 70 }, { left: 350, top: 30, width: 900, height: 36 }];

const SCREENS = {
  pcms: { folder: 'PCMS', files: [
    ['1.png', 'Dashboard: shortcuts, upcoming work and what needs attention'],
    ['2.png', 'Email intelligence: inbox triage and drafted replies for review'],
  ] },
  'ancora-ai': { folder: 'Ancora AI', files: [
    ['10.png', 'Portfolio command center with the Ask Ancora assistant'],
    ['3.png', 'Project controls: budgets, progress and delivery status'],
    ['5.png', 'Fleet: vessel status, assignments and readiness'],
    ['7.png', 'Finance & P&L: forecasts, margin and working capital'],
    ['1.png', 'Secure, role-based sign-in'],
  ] },
  musaed: { folder: 'Musaed', files: [
    ['1.png', 'English workspace: understand a report, get help with school or insurance'],
    ['2.png', 'The same workspace in Arabic, right to left'],
  ] },
  taprepute: { folder: 'TapRepute', files: [
    ['3.png', 'Owner overview: experience score, visits and newest feedback', tapreputeBlur],
    ['5.png', 'The customer’s quick check-in'],
    ['4.png', 'Share & QR: links, printable QR and follow-up messages', tapreputeBlur],
    ['1.png', 'TapRepute landing page'],
  ] },
  aegis: { folder: 'Aegis', files: [
    ['1.png', 'Research status: current experiment and market universe'],
    ['3.png', 'Research pipeline, risk guardrails and strategy settings'],
  ] },
};

for (const [slug, { folder, files }] of Object.entries(SCREENS)) {
  const outDir = path.join(root, 'assets', 'projects', 'screens', slug);
  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });
  const manifest = [];
  for (const [i, [file, caption, blur = []]] of files.entries()) {
    const input = path.join(source, folder, file);
    let image = sharp(input);
    if (blur.length) {
      const base = await image.toBuffer();
      const patches = await Promise.all(blur.map(async box => ({
        input: await sharp(base).extract(box).blur(14).toBuffer(), left: box.left, top: box.top,
      })));
      image = sharp(base).composite(patches);
    }
    const name = `${String(i + 1).padStart(2, '0')}.webp`;
    const { width, height } = await sharp(await image.toBuffer())
      .resize({ width: 1600, withoutEnlargement: true })
      .webp({ quality: 82, effort: 5 })
      .toFile(path.join(outDir, name));
    manifest.push({ src: `/assets/projects/screens/${slug}/${name}`, width, height, caption });
  }
  await writeFile(path.join(outDir, 'screens.json'), JSON.stringify(manifest, null, 2) + '\n');
  console.log(`${slug}: ${manifest.length} screens`);
}

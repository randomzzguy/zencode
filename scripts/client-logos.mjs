/*
 * Client logo pipeline.
 *
 * Every image in assets/ClientLogos becomes a die-cut "sticker":
 *   1. trim transparent/empty space around the artwork,
 *   2. scale it to the same visual area as every other logo (so wide wordmarks
 *      don't dwarf square marks),
 *   3. trace an outline that follows the logo's own shape, plus a soft shadow,
 *   4. pick the outline colour from the artwork itself: light artwork gets a
 *      dark outline, dark or colourful artwork gets a cream one.
 *
 * The display name comes from the file name, so renaming a file to the
 * company's full name is all that's needed. CLIENT_OVERRIDES handles the few
 * names or outline colours that can't be inferred.
 */
import sharp from 'sharp';
import { readdir, mkdir } from 'node:fs/promises';
import path from 'node:path';

// Keyed by file name without extension. `name` keeps camel-case brand names intact;
// `tone` forces the outline: 'dark', 'light' (cream) or 'mid' (for mixed black + white artwork).
const CLIENT_OVERRIDES = {
  'Ancora-AI': { tone: 'dark' },
  DinkFrame: { name: 'DinkFrame' },
  'Kelab Belia Progresif Logo': { name: 'Kelab Belia Progresif' },
  TapRepute: { name: 'TapRepute' },
  ZeyadDesign: { tone: 'mid' },
  ZShield: { name: 'ZShield' },
};

const SMALL_WORDS = new Set(['of', 'and', 'the', 'for', 'in', 'on', 'at', 'by', 'to', 'a']);
const OUTLINES = {
  light: { r: 0xff, g: 0xfd, b: 0xf5 },
  mid: { r: 0x8c, g: 0x7f, b: 0x80 },
  dark: { r: 0x2d, g: 0x26, b: 0x27 },
};
const DARK = OUTLINES.dark;

// "MinistryOfPickleball" -> "Ministry of Pickleball", "Ancora-AI" -> "Ancora AI".
// Names that already contain spaces are used exactly as written.
export function nameFromFile(file) {
  const base = file.replace(/\.[^.]+$/, '');
  if (CLIENT_OVERRIDES[base]?.name) return CLIENT_OVERRIDES[base].name;
  if (/\s/.test(base)) return base.replace(/\s+logo$/i, '').trim();
  return base
    .replace(/[-_]+/g, ' ')
    .replace(/([a-z\d])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/\s+logo$/i, '')
    .split(/\s+/)
    .map((word, i) => (i > 0 && SMALL_WORDS.has(word.toLowerCase()) ? word.toLowerCase() : word))
    .join(' ');
}

const slug = name => name.normalize('NFKD').replace(/[^\w\s-]/g, '').trim().toLowerCase().replace(/[\s_-]+/g, '-');

/** Area-normalised size: every logo covers roughly SIZE x SIZE pixels. */
function targetBox(width, height, SIZE) {
  const spread = Math.min(2.1, Math.max(0.62, Math.sqrt(width / height)));
  return [Math.round(SIZE * spread), Math.round(SIZE / spread)];
}

/** Share of visible pixels that are near-white or near-black. */
function toneOf(data) {
  let visible = 0, light = 0, dark = 0;
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    if (a < 140) continue;
    const l = (0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]) / 255;
    visible++;
    if (l > 0.82) light++;
    else if (l < 0.22) dark++;
  }
  if (!visible) return 'light';
  // Light artwork disappears on a cream outline, so it gets the dark one.
  return light / visible > 0.18 && light >= dark ? 'dark' : 'light';
}

async function sticker(file, outFile, { tone: forcedTone, SIZE = 200, RADIUS = 11, SHADOW = 8 } = {}) {
  const isSvg = /\.svg$/i.test(file);
  // 1. trim
  const trimmed = await sharp(file, { density: isSvg ? 400 : 72, limitInputPixels: false })
    .ensureAlpha().trim({ threshold: 4 }).png().toBuffer({ resolveWithObject: true });
  // 2. normalise visual area
  const [tw, th] = targetBox(trimmed.info.width, trimmed.info.height, SIZE);
  const logo = await sharp(trimmed.data).resize(tw, th, { fit: 'inside', kernel: 'lanczos3' })
    .raw().toBuffer({ resolveWithObject: true });
  const { width: lw, height: lh } = logo.info;
  const tone = forcedTone || toneOf(logo.data);
  // 3. trace the outline: dilate the alpha mask, then smooth its edge.
  const pad = RADIUS + SHADOW * 2;
  const W = lw + pad * 2, H = lh + pad * 2;
  const mask = Buffer.alloc(W * H);
  for (let y = 0; y < lh; y++) for (let x = 0; x < lw; x++) mask[(y + pad) * W + x + pad] = logo.data[(y * lw + x) * 4 + 3] > 24 ? 255 : 0;
  const outlineAlpha = await sharp(mask, { raw: { width: W, height: H, channels: 1 } })
    // sharp's morphology treats dark pixels as foreground, so erode() grows this white mask.
    .erode(RADIUS).blur(1.2).linear(1.6, -60).extractChannel(0).raw().toBuffer();
  const color = OUTLINES[tone] || OUTLINES.light;
  const layer = (alpha, c, k = 1) => {
    const out = Buffer.alloc(W * H * 4);
    for (let i = 0; i < W * H; i++) { out[i * 4] = c.r; out[i * 4 + 1] = c.g; out[i * 4 + 2] = c.b; out[i * 4 + 3] = Math.round(alpha[i] * k); }
    return sharp(out, { raw: { width: W, height: H, channels: 4 } });
  };
  const outline = await layer(outlineAlpha, color).png().toBuffer();
  const shadowAlpha = await sharp(outlineAlpha, { raw: { width: W, height: H, channels: 1 } }).blur(SHADOW / 1.6).extractChannel(0).raw().toBuffer();
  const shadow = await layer(shadowAlpha, DARK, 0.26).png().toBuffer();
  const art = await sharp(logo.data, { raw: logo.info }).png().toBuffer();
  await sharp({ create: { width: W, height: H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([
      { input: shadow, left: 0, top: Math.round(SHADOW * 0.6) },
      { input: outline, left: 0, top: 0 },
      { input: art, left: pad, top: pad },
    ])
    .webp({ quality: 88, alphaQuality: 92, effort: 5 })
    .toFile(outFile);
  return { width: W, height: H, tone, pad };
}

/**
 * Builds stickers into `<outRoot>/assets/clients/` and returns one entry per logo,
 * sorted by display name.
 */
export async function buildClientLogos(root, outRoot) {
  const srcDir = path.join(root, 'assets', 'ClientLogos');
  const outDir = path.join(outRoot, 'assets', 'clients');
  await mkdir(outDir, { recursive: true });
  const files = (await readdir(srcDir, { withFileTypes: true }))
    .filter(entry => entry.isFile() && /\.(svg|png|jpe?g|webp)$/i.test(entry.name))
    .map(entry => entry.name);
  const used = new Set();
  const logos = await Promise.all(files.map(async file => {
    const name = nameFromFile(file);
    let id = slug(name) || 'client';
    while (used.has(id)) id += '-x';
    used.add(id);
    const tone = CLIENT_OVERRIDES[file.replace(/\.[^.]+$/, '')]?.tone;
    const meta = await sticker(path.join(srcDir, file), path.join(outDir, `${id}.webp`), { tone });
    return { file, name, src: `/assets/clients/${id}.webp`, ...meta };
  }));
  return logos.sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base', numeric: true }));
}

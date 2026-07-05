// One-off/repeatable image optimization for src/assets.
// Re-run after replacing a source PNG: `node scripts/optimize-images.mjs`
import sharp from 'sharp'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const assetsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../src/assets')

const jobs = [
  // Logo is displayed at ~80-300px wide; 640px covers retina at the largest size.
  { input: 'hbbc_logo.png', output: 'hbbc_logo.webp', width: 640, quality: 90 },
  // Scarf is a low-opacity (opacity-10) decorative background, so a lower
  // quality is visually indistinguishable but much smaller.
  { input: 'vfb_schal.png', output: 'vfb_schal.webp', width: 1920, quality: 70 },
]

for (const job of jobs) {
  const inputPath = path.join(assetsDir, job.input)
  const outputPath = path.join(assetsDir, job.output)
  await sharp(inputPath)
    .resize({ width: job.width, withoutEnlargement: true })
    .webp({ quality: job.quality })
    .toFile(outputPath)
  console.log(`${job.input} -> ${job.output}`)
}

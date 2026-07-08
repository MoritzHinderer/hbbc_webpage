// Generates a small PNG copy of the logo for embedding in newsletter emails
// via a CID attachment. Email clients can't reliably fetch relative/localhost
// image URLs and many render WebP poorly, so this is a dedicated PNG copy —
// separate from src/assets/hbbc_logo.webp used on the site itself.
// Re-run after replacing the source logo: `node scripts/generate-email-logo.mjs`
import sharp from 'sharp'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const input = path.join(root, 'src/assets/hbbc_logo.webp')
const outputDir = path.join(root, 'server/assets')
const output = path.join(outputDir, 'hbbc-logo-email.png')

await sharp(input).resize({ width: 160, withoutEnlargement: true }).png().toFile(output)
console.log(`${input} -> ${output}`)

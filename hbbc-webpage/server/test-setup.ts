import { mkdirSync } from 'node:fs'

// writeCollection()/multer's diskStorage don't create parent directories
// themselves — this ensures the isolated CONTENT_DIR/PUBLIC_DIR (see
// vitest.server.config.ts) actually exist as real, empty, writable
// directories before any test runs.
if (process.env.CONTENT_DIR) {
  for (const sub of ['', 'member_pictures', 'gallery-photos', 'news-photos', 'downloads']) {
    mkdirSync(`${process.env.CONTENT_DIR}/${sub}`, { recursive: true })
  }
}
if (process.env.PUBLIC_DIR) {
  mkdirSync(`${process.env.PUBLIC_DIR}/downloads`, { recursive: true })
}

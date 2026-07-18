import path from 'node:path'
import { defineConfig } from 'vitest/config'

// A real, writable, isolated directory — not a nonexistent path — since
// admin CRUD tests need to actually create/update/delete content JSON
// files (server/content-store.ts's writeCollection doesn't create parent
// directories). Lives under server/data/, already gitignored.
const TEST_CONTENT_DIR = path.join(process.cwd(), 'server', 'data', 'test-content')

// Backend route/unit tests (real Node, no DOM). Mirrors tsconfig.server.json's
// scope — see vitest.config.ts for the frontend counterpart.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['server/**/*.test.ts'],
    setupFiles: ['./server/test-setup.ts'],
    // Test files share one real, on-disk CONTENT_DIR/PUBLIC_DIR (unlike
    // the DB, which is a true per-file :memory: instance) — running them
    // in parallel would let two files race writes to the same directory.
    fileParallelism: false,
    env: {
      // Every test file gets its own isolated in-memory DB (see
      // server/db.ts's DB_PATH support) — never the real server/data/app.db.
      // Also relaxes the auth rate limiters (server/routes/auth.ts checks
      // for DB_PATH being set, not NODE_ENV, specifically so this one env
      // var can mean both "isolated DB" and "this is a test run" without
      // needing to juggle two separate signals) so a test file making many
      // register/login/forgot-password calls in a row doesn't get silently
      // 429'd partway through.
      DB_PATH: ':memory:',
      // Isolates every content file/upload path (members, events, news,
      // gallery, downloads — see server/content-store.ts's CONTENT_DIR)
      // from the real server/content/. Without this, admin CRUD tests for
      // those routes would read and write the actual live site content.
      CONTENT_DIR: TEST_CONTENT_DIR,
      // Same idea for the one thing that lives under public/ instead —
      // the downloads manifest is git-tracked, real, committed content.
      PUBLIC_DIR: path.join(TEST_CONTENT_DIR, 'public'),
      // app.ts does `import 'dotenv/config'`, which loads the real local
      // .env if one exists — but dotenv never overrides a variable that's
      // already set in process.env, so setting these blank here (applied
      // before any test file/import runs) guarantees mailerConfigured is
      // always false during tests, locally or in CI, even with real SMTP
      // credentials sitting in a developer's local .env. Without this, a
      // local `npm run test:server` run would send real emails through
      // real Gmail SMTP on every register/forgot-password test.
      SMTP_HOST: '',
      SMTP_PORT: '',
      SMTP_USER: '',
      SMTP_PASS: '',
      CONTACT_TO_EMAIL: '',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['server/**/*.ts'],
      exclude: ['server/**/*.test.ts', 'server/scripts/**'],
      reportsDirectory: 'coverage/server',
    },
  },
})

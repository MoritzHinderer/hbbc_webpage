import { defineConfig } from 'vitest/config'

// Backend route/unit tests (real Node, no DOM). Mirrors tsconfig.server.json's
// scope — see vitest.config.ts for the frontend counterpart.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['server/**/*.test.ts'],
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
      // Points at a path that doesn't exist, so readCollection() resolves it
      // to an empty list (server/content-store.ts) — keeps a fresh in-memory
      // fanclub_members row from ever colliding with a real card's
      // fanclub_member_id in the actual server/content/members.json. Tests
      // never call the member-card mutation endpoints, so nothing is ever
      // written to this path either.
      MEMBERS_FILE: '/tmp/hbbc-test-members-does-not-exist.json',
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

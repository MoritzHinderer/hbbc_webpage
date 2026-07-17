import path from 'node:path'
import { defineConfig, devices } from '@playwright/test'

// A real (file-based) isolated SQLite DB, not `:memory:` — e2e specs need
// to open this same file directly (see e2e/db-helper.ts) to approve
// throwaway accounts, since an in-memory DB only exists inside the server's
// own child process and can't be reached from the Playwright test process.
//
// Lives under server/data/ (already gitignored, already the app's own
// real writable data directory — see server/db.ts). The actual cleanup
// (deleting any stale file from a previous run) happens inside
// server/db.ts itself when it sees this env var, not here — a separate
// globalSetup hook was tried first and reproducibly raced with the
// server's own startup in a different process, occasionally deleting the
// file out from under an already-running connection and leaving SQLite
// refusing all further writes. Doing it inside the server's own
// synchronous startup makes that race impossible by construction.
export const E2E_DB_PATH = path.join(process.cwd(), 'server', 'data', 'e2e-test.db')

// Small, representative e2e suite (unit/integration tests above cover the
// bulk of the logic) — proves the whole app actually works end-to-end in
// a real browser, same flows already manually verified with Playwright
// throughout this project's development, now committed as permanent
// regression checks instead of one-off ad-hoc runs.
export default defineConfig({
  testDir: './e2e',
  // Login/forgot-password specs approve/promote accounts by writing
  // directly to E2E_DB_PATH mid-test — concurrent workers touching the
  // same file would race each other.
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:3001',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  // Builds and runs the real production server (one process serving the
  // built static frontend + /api/* together, same as deploy/README.md) —
  // deliberately NOT the Vite dev server. An early attempt using `npm run
  // dev:all` was flaky: Vite's dev-mode dependency pre-bundling can still
  // be re-optimizing on a cold start when this config's own readiness
  // check and the very first test navigation land, occasionally hanging a
  // page load. The production build has no such race, and is also a more
  // faithful test of what's actually deployed.
  //
  // reuseExistingServer is deliberately NOT enabled, even locally: this
  // suite registers/logs in real accounts through the real UI, and if it
  // reused a developer's already-running dev server, DB_PATH below would
  // be silently ignored (no new process = no new env) and the tests would
  // run against that developer's real local database. Always spinning up
  // a dedicated, isolated instance is slightly slower but the only way to
  // guarantee this suite never touches real data.
  webServer: {
    command: 'npm run build && npm start',
    url: 'http://localhost:3001/api/health',
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      DB_PATH: E2E_DB_PATH,
    },
  },
})

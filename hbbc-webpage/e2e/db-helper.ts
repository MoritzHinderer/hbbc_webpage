import { DatabaseSync } from 'node:sqlite'
import { E2E_DB_PATH } from '../playwright.config'

// Opens the same isolated file the running server was started against
// (see playwright.config.ts's webServer.env.DB_PATH) — the only way to
// approve/promote an account from the test process, since the server
// runs as its own child process and an in-memory DB can't be reached
// from outside it.
export function openE2eDb(): DatabaseSync {
  return new DatabaseSync(E2E_DB_PATH)
}

export function approveUser(email: string, role: 'member' | 'admin' = 'member'): void {
  const db = openE2eDb()
  try {
    db.prepare("UPDATE users SET status = 'approved', role = ? WHERE email = ?").run(role, email.toLowerCase())
  } finally {
    db.close()
  }
}

export function getLatestResetToken(email: string): string {
  const db = openE2eDb()
  try {
    const row = db
      .prepare(
        `SELECT prt.token FROM password_reset_tokens prt
         JOIN users u ON u.id = prt.user_id
         WHERE u.email = ? ORDER BY prt.created_at DESC LIMIT 1`,
      )
      .get(email.toLowerCase()) as { token: string } | undefined
    if (!row) throw new Error(`No reset token found for ${email}`)
    return row.token
  } finally {
    db.close()
  }
}

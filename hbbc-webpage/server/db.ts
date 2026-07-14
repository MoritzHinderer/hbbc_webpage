import { DatabaseSync } from 'node:sqlite'
import fs from 'node:fs'
import path from 'node:path'

const dataDir = path.join(process.cwd(), 'server', 'data')
fs.mkdirSync(dataDir, { recursive: true })

export const db = new DatabaseSync(path.join(dataDir, 'app.db'))

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'member' CHECK(role IN ('member','admin')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
    message TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`)

db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    expires_at TEXT NOT NULL
  )
`)

// Single-use, short-lived tokens for the "forgot password" flow — mirrors
// sessions above, but with a much shorter expiry (set by the route, not
// here) since this only needs to survive the trip to the inbox.
db.exec(`
  CREATE TABLE IF NOT EXISTS password_reset_tokens (
    token TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    expires_at TEXT NOT NULL
  )
`)

// users predates this column — ALTER TABLE ... ADD COLUMN fails if it
// already exists, so this is a guarded one-time migration, safe to run on
// every startup.
try {
  db.exec(`ALTER TABLE users ADD COLUMN newsletter_subscribed INTEGER NOT NULL DEFAULT 0`)
} catch {
  // column already present
}

db.exec(`
  CREATE TABLE IF NOT EXISTS newsletters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subject TEXT NOT NULL,
    body_html TEXT NOT NULL,
    recipient_count INTEGER NOT NULL,
    sent_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`)

db.exec(`
  CREATE TABLE IF NOT EXISTS page_views (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    path TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`)
db.exec(`CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON page_views(created_at)`)

// The authoritative club-roster entity — a fanclub member can exist with
// no account and no public card. Accounts and cards each optionally
// reference one (see the fanclub_member_id column/field added below),
// and no longer link directly to each other.
db.exec(`
  CREATE TABLE IF NOT EXISTS fanclub_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT,
    joined_date TEXT NOT NULL DEFAULT (date('now')),
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`)

// Nullable in the schema (SQLite can't cheaply add a NOT NULL column to
// an existing table) — "an approved account must have one" is enforced
// at the application layer, in the approval endpoint. Guarded/idempotent
// like newsletter_subscribed above.
try {
  db.exec(`ALTER TABLE users ADD COLUMN fanclub_member_id INTEGER REFERENCES fanclub_members(id)`)
} catch {
  // column already present
}

export type Role = 'member' | 'admin'
export type AccountStatus = 'pending' | 'approved' | 'rejected'

export interface UserRow {
  id: number
  name: string
  email: string
  password_hash: string
  role: Role
  status: AccountStatus
  message: string | null
  created_at: string
  newsletter_subscribed: number
  fanclub_member_id: number | null
}

// Never send password_hash to the client — this is what request handlers
// and JSON responses should use instead of the raw row.
export interface PublicUser {
  id: number
  name: string
  email: string
  role: Role
  status: AccountStatus
  created_at: string
  newsletterSubscribed: boolean
  fanclubMemberId: number | null
}

export function toPublicUser(row: UserRow): PublicUser {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    status: row.status,
    created_at: row.created_at,
    newsletterSubscribed: Boolean(row.newsletter_subscribed),
    fanclubMemberId: row.fanclub_member_id,
  }
}

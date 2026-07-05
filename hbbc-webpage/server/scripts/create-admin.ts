// One-off bootstrap: creates the first admin account (or promotes an
// existing one), since there's no other way to create an admin without
// already being one. Run with: npm run create-admin -- "Name" email password
import { db, type UserRow } from '../db.js'
import { hashPassword } from '../auth/password.js'

const [name, email, password] = process.argv.slice(2)

if (!name || !email || !password) {
  console.error('Usage: npm run create-admin -- "<name>" <email> <password>')
  process.exit(1)
}

const normalizedEmail = email.toLowerCase()
const existing = db.prepare('SELECT * FROM users WHERE email = ?').get(normalizedEmail) as
  | UserRow
  | undefined

if (existing) {
  db.prepare(`UPDATE users SET role = 'admin', status = 'approved' WHERE email = ?`).run(
    normalizedEmail,
  )
  console.log(`Existing account for ${normalizedEmail} promoted to admin and approved.`)
} else {
  db.prepare(
    `INSERT INTO users (name, email, password_hash, role, status)
     VALUES (?, ?, ?, 'admin', 'approved')`,
  ).run(name, normalizedEmail, hashPassword(password))
  console.log(`Admin account created for ${normalizedEmail}.`)
}

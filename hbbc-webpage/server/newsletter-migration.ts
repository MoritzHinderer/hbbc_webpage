import { promises as fs } from 'node:fs'
import path from 'node:path'
import { db } from './db.js'

const dataDir = path.join(process.cwd(), 'server', 'data')
const legacyFile = path.join(dataDir, 'newsletter-subscribers.json')
const migratedFile = path.join(dataDir, 'newsletter-subscribers.migrated.json')

// One-time migration from the old anonymous email-list subscription
// mechanism to the new users.newsletter_subscribed column. Safe to call on
// every startup — it only does anything the first time (while the old
// file still exists at its original name).
export async function migrateLegacyNewsletterSubscribers(): Promise<void> {
  let emails: string[]
  try {
    emails = JSON.parse(await fs.readFile(legacyFile, 'utf-8'))
  } catch {
    return // nothing to migrate
  }

  let matched = 0
  for (const email of emails) {
    const result = db
      .prepare('UPDATE users SET newsletter_subscribed = 1 WHERE email = ?')
      .run(email.trim().toLowerCase())
    if (result.changes > 0) matched++
  }

  console.log(
    `[newsletter-migration] matched ${matched}/${emails.length} legacy subscriber(s) to accounts`,
  )
  await fs.rename(legacyFile, migratedFile).catch(() => {})
}

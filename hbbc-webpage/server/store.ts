import { promises as fs } from 'node:fs'
import path from 'node:path'

const dataDir = path.join(process.cwd(), 'server', 'data')
const subscribersFile = path.join(dataDir, 'newsletter-subscribers.json')

async function readSubscribers(): Promise<string[]> {
  try {
    const raw = await fs.readFile(subscribersFile, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return []
  }
}

// Small-scale, single-process file store — fine for a club-sized mailing list.
// Not safe for concurrent writers; if this ever needs to scale, swap for a real DB.
export async function addSubscriber(email: string): Promise<{ alreadySubscribed: boolean }> {
  await fs.mkdir(dataDir, { recursive: true })
  const subscribers = await readSubscribers()
  const normalized = email.trim().toLowerCase()

  if (subscribers.includes(normalized)) {
    return { alreadySubscribed: true }
  }

  subscribers.push(normalized)
  await fs.writeFile(subscribersFile, JSON.stringify(subscribers, null, 2))
  return { alreadySubscribed: false }
}

import { promises as fs } from 'node:fs'
import path from 'node:path'

// CONTENT_DIR lets tests point every content file/upload path (members,
// events, news, gallery, downloads) at an isolated, nonexistent directory
// in one place — readCollection() below already treats a missing file as
// an empty collection, and writeCollection() would create it fresh if a
// test ever needed to. Unset in normal dev/production use, where it falls
// back to the real on-disk server/content/ directory. Without this, admin
// CRUD tests for these routes would read and write the actual live
// content JSON files used by the running site.
export const contentDir = process.env.CONTENT_DIR || path.join(process.cwd(), 'server', 'content')

// Same idea as CONTENT_DIR, for the one piece of admin-editable content
// that lives under public/ instead: the downloads manifest
// (public/downloads/downloads.json) is deliberately git-tracked (so the
// list of documents is visible without hitting the API), unlike
// everything under server/content/ — but that means it's just as real
// and just as important not to overwrite from a test run.
export const publicDir = process.env.PUBLIC_DIR || path.join(process.cwd(), 'public')

export interface WithId {
  id: number
}

async function readJson<T>(filePath: string): Promise<T | null> {
  try {
    const raw = await fs.readFile(filePath, 'utf-8')
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

async function writeJson(filePath: string, data: unknown): Promise<void> {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2))
}

// Reads a `{ [key]: T[] }` shaped JSON file (the pattern already used by
// members.json/events.json), backfilling a numeric `id` onto any entry that
// doesn't have one yet — a transparent one-time migration for hand-authored
// data, persisted immediately so it only happens once.
export async function readCollection<T extends Partial<WithId>>(
  filePath: string,
  key: string,
): Promise<(T & WithId)[]> {
  const data = (await readJson<Record<string, T[]>>(filePath)) ?? { [key]: [] }
  const items = data[key] ?? []

  let nextId = Math.max(0, ...items.map((item) => item.id ?? 0)) + 1
  let changed = false

  const withIds = items.map((item) => {
    if (item.id != null) return item as T & WithId
    changed = true
    return { ...item, id: nextId++ } as T & WithId
  })

  if (changed) {
    await writeJson(filePath, { [key]: withIds })
  }

  return withIds
}

export async function writeCollection<T>(filePath: string, key: string, items: T[]): Promise<void> {
  await writeJson(filePath, { [key]: items })
}

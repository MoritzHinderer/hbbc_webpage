import { promises as fs } from 'node:fs'

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

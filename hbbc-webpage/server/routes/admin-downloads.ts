import { Router } from 'express'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { readCollection, writeCollection, type WithId } from '../content-store.js'
import { downloadFileUpload } from '../uploads.js'
import { isNonEmptyString } from '../validation.js'

const router = Router()
const downloadsFile = path.join(process.cwd(), 'public', 'downloads', 'downloads.json')
const downloadsDir = path.join(process.cwd(), 'server', 'content', 'downloads')

export interface Download extends WithId {
  name: string
  description: string
  href: string
  requiresAuth: boolean
}

export const hrefToFilename = (href: string) => href.replace(/^\/api\/downloads\//, '')

async function deleteFileForHref(href: string): Promise<void> {
  await fs.unlink(path.join(downloadsDir, hrefToFilename(href))).catch(() => {})
}

// FormData sends every field as a string, including the checkbox.
const parseRequiresAuth = (value: unknown) => value === 'true' || value === 'on'

router.get('/', async (_req, res) => {
  const downloads = await readCollection<Download>(downloadsFile, 'downloads')
  res.json({ downloads })
})

router.post('/', downloadFileUpload.single('file'), async (req, res) => {
  const { name, description, requiresAuth } = req.body ?? {}

  if (!isNonEmptyString(name, 150) || !isNonEmptyString(description, 300)) {
    res.status(400).json({ error: 'Bitte Name und Beschreibung angeben.' })
    return
  }
  if (!req.file) {
    res.status(400).json({ error: 'Bitte eine PDF-Datei auswählen.' })
    return
  }

  const downloads = await readCollection<Download>(downloadsFile, 'downloads')
  const nextId = Math.max(0, ...downloads.map((d) => d.id)) + 1

  const download: Download = {
    id: nextId,
    name,
    description,
    href: `/api/downloads/${req.file.filename}`,
    requiresAuth: parseRequiresAuth(requiresAuth),
  }

  downloads.push(download)
  await writeCollection(downloadsFile, 'downloads', downloads)
  res.json({ ok: true, download })
})

router.put('/:id', downloadFileUpload.single('file'), async (req, res) => {
  const id = Number(req.params.id)
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: 'Ungültige Download-ID.' })
    return
  }

  const { name, description, requiresAuth } = req.body ?? {}
  if (!isNonEmptyString(name, 150) || !isNonEmptyString(description, 300)) {
    res.status(400).json({ error: 'Bitte Name und Beschreibung angeben.' })
    return
  }

  const downloads = await readCollection<Download>(downloadsFile, 'downloads')
  const index = downloads.findIndex((d) => d.id === id)
  if (index === -1) {
    res.status(404).json({ error: 'Dokument nicht gefunden.' })
    return
  }

  const existing = downloads[index]
  let href = existing.href

  if (req.file) {
    await deleteFileForHref(existing.href)
    href = `/api/downloads/${req.file.filename}`
  }

  const updated: Download = { id, name, description, href, requiresAuth: parseRequiresAuth(requiresAuth) }
  downloads[index] = updated

  await writeCollection(downloadsFile, 'downloads', downloads)
  res.json({ ok: true, download: updated })
})

router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id)
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: 'Ungültige Download-ID.' })
    return
  }

  const downloads = await readCollection<Download>(downloadsFile, 'downloads')
  const index = downloads.findIndex((d) => d.id === id)
  if (index === -1) {
    res.status(404).json({ error: 'Dokument nicht gefunden.' })
    return
  }

  const [removed] = downloads.splice(index, 1)
  await deleteFileForHref(removed.href)
  await writeCollection(downloadsFile, 'downloads', downloads)
  res.json({ ok: true })
})

export default router

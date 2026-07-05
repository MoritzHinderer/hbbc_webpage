import { Router } from 'express'
import path from 'node:path'
import { readCollection } from '../content-store.js'
import { hrefToFilename, type Download } from './admin-downloads.js'

const router = Router()
const downloadsFile = path.join(process.cwd(), 'public', 'downloads', 'downloads.json')
const downloadsDir = path.join(process.cwd(), 'server', 'content', 'downloads')

const isSafeFilename = (file: string) => /^[\w.-]+$/.test(file)

// Public route, but gating is per-file (not blanket requireAuth) — each
// download's `requiresAuth` flag, set by the admin, decides whether
// req.user (populated by the global attachUser middleware, if any) is
// required for that specific file.
router.get('/:file', async (req, res) => {
  const { file } = req.params
  if (!isSafeFilename(file)) {
    res.status(400).json({ error: 'Ungültiger Dateiname.' })
    return
  }

  const downloads = await readCollection<Download>(downloadsFile, 'downloads')
  const entry = downloads.find((d) => hrefToFilename(d.href) === file)

  if (!entry) {
    res.status(404).json({ error: 'Datei nicht gefunden.' })
    return
  }

  if (entry.requiresAuth && !req.user) {
    res.status(401).json({ error: 'Bitte melde dich an, um diese Datei herunterzuladen.' })
    return
  }

  res.sendFile(path.join(downloadsDir, file), (error) => {
    if (error) res.status(404).end()
  })
})

export default router

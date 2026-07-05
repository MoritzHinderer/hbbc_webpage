import { Router } from 'express'
import fs from 'node:fs/promises'
import path from 'node:path'

const router = Router()
const contentDir = path.join(process.cwd(), 'server', 'content')
const galleryFile = path.join(contentDir, 'gallery.json')
const photosDir = path.join(contentDir, 'gallery-photos')

router.get('/', async (_req, res) => {
  try {
    const raw = await fs.readFile(galleryFile, 'utf-8')
    res.type('application/json').send(raw)
  } catch (error) {
    console.error('[gallery] failed to read gallery.json:', error)
    res.status(500).json({ error: 'Galerie konnte nicht geladen werden.' })
  }
})

router.get('/photos/:file', (req, res) => {
  const file = req.params.file

  // No slashes allowed, so there's no way to traverse out of photosDir.
  if (!/^[\w.-]+$/.test(file)) {
    res.status(400).json({ error: 'Ungültiger Dateiname.' })
    return
  }

  res.sendFile(path.join(photosDir, file), (error) => {
    if (error) res.status(404).end()
  })
})

export default router

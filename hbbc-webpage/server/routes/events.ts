import { Router } from 'express'
import fs from 'node:fs/promises'
import path from 'node:path'
import { contentDir } from '../content-store.js'

const router = Router()
const eventsFile = path.join(contentDir, 'events.json')

router.get('/', async (_req, res) => {
  try {
    const raw = await fs.readFile(eventsFile, 'utf-8')
    res.type('application/json').send(raw)
  } catch (error) {
    console.error('[events] failed to read events.json:', error)
    res.status(500).json({ error: 'Termine konnten nicht geladen werden.' })
  }
})

export default router

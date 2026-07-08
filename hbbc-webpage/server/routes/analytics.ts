import { Router } from 'express'
import { db } from '../db.js'

const router = Router()

const isTrackablePath = (value: unknown): value is string =>
  typeof value === 'string' && value.length > 0 && value.length <= 200 && value.startsWith('/')

router.post('/pageview', (req, res) => {
  const { path } = req.body ?? {}
  if (!isTrackablePath(path)) {
    res.status(400).json({ error: 'Ungültiger Pfad.' })
    return
  }

  db.prepare('INSERT INTO page_views (path) VALUES (?)').run(path)
  res.status(204).end()
})

export default router

import { Router } from 'express'
import path from 'node:path'
import { readCollection } from '../content-store.js'
import type { NewsArticle } from './admin-news.js'

const router = Router()
const newsFile = path.join(process.cwd(), 'server', 'content', 'news.json')
const newsPhotosDir = path.join(process.cwd(), 'server', 'content', 'news-photos')

const isSafeFilename = (file: string): boolean => /^[\w.-]+$/.test(file)

router.get('/', async (_req, res) => {
  const news = await readCollection<NewsArticle>(newsFile, 'news')
  news.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  res.json({ news })
})

router.get('/photos/:file', (req, res) => {
  const file = req.params.file

  if (!isSafeFilename(file)) {
    res.status(400).json({ error: 'Ungültiger Dateiname.' })
    return
  }

  res.sendFile(path.join(newsPhotosDir, file), (error) => {
    if (error) res.status(404).end()
  })
})

export default router

import { Router } from 'express'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { contentDir, readCollection, writeCollection, type WithId } from '../content-store.js'
import { isNonEmptyString } from '../validation.js'
import { newsImageUpload } from '../uploads.js'

const router = Router()
const newsFile = path.join(contentDir, 'news.json')
const newsPhotosDir = path.join(contentDir, 'news-photos')

export interface NewsArticle extends WithId {
  title: string
  // Rich HTML from the admin's Tiptap editor — same trust model as the
  // newsletter's body_html (admin-authored only, rendered via v-html).
  body: string
  createdAt: string
  coverImage?: string
}

function validateArticleInput(body: Record<string, unknown>): string | null {
  const { title, body: articleBody } = body
  if (!isNonEmptyString(title, 150)) return 'Bitte einen Titel angeben.'
  if (!isNonEmptyString(articleBody, 20000)) return 'Bitte einen Inhalt angeben.'
  return null
}

async function deleteCoverImage(file: string | undefined): Promise<void> {
  if (!file) return
  await fs.unlink(path.join(newsPhotosDir, file)).catch(() => {})
}

router.get('/', async (_req, res) => {
  const news = await readCollection<NewsArticle>(newsFile, 'news')
  res.json({ news })
})

router.post('/', newsImageUpload.single('coverImage'), async (req, res) => {
  const error = validateArticleInput(req.body ?? {})
  if (error) {
    if (req.file) await fs.unlink(req.file.path).catch(() => {})
    res.status(400).json({ error })
    return
  }

  const { title, body } = req.body

  const news = await readCollection<NewsArticle>(newsFile, 'news')
  const nextId = Math.max(0, ...news.map((a) => a.id)) + 1

  const article: NewsArticle = {
    id: nextId,
    title,
    body,
    createdAt: new Date().toISOString(),
    ...(req.file ? { coverImage: req.file.filename } : {}),
  }
  news.push(article)
  await writeCollection(newsFile, 'news', news)
  res.json({ ok: true, article })
})

router.put('/:id', newsImageUpload.single('coverImage'), async (req, res) => {
  const id = Number(req.params.id)
  if (!Number.isInteger(id)) {
    if (req.file) await fs.unlink(req.file.path).catch(() => {})
    res.status(400).json({ error: 'Ungültige Artikel-ID.' })
    return
  }

  const error = validateArticleInput(req.body ?? {})
  if (error) {
    if (req.file) await fs.unlink(req.file.path).catch(() => {})
    res.status(400).json({ error })
    return
  }

  const news = await readCollection<NewsArticle>(newsFile, 'news')
  const index = news.findIndex((a) => a.id === id)
  if (index === -1) {
    if (req.file) await fs.unlink(req.file.path).catch(() => {})
    res.status(404).json({ error: 'Artikel nicht gefunden.' })
    return
  }

  const existing = news[index]
  const { title, body, removeCoverImage } = req.body

  let coverImage = existing.coverImage
  if (req.file) {
    await deleteCoverImage(existing.coverImage)
    coverImage = req.file.filename
  } else if (removeCoverImage === 'true') {
    await deleteCoverImage(existing.coverImage)
    coverImage = undefined
  }

  // The publish date is fixed at creation, not touched by later edits —
  // same convention as a blog post's original publish date.
  const updated: NewsArticle = {
    id,
    title,
    body,
    createdAt: existing.createdAt,
    ...(coverImage ? { coverImage } : {}),
  }
  news[index] = updated

  await writeCollection(newsFile, 'news', news)
  res.json({ ok: true, article: updated })
})

router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id)
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: 'Ungültige Artikel-ID.' })
    return
  }

  const news = await readCollection<NewsArticle>(newsFile, 'news')
  const index = news.findIndex((a) => a.id === id)
  if (index === -1) {
    res.status(404).json({ error: 'Artikel nicht gefunden.' })
    return
  }

  const [removed] = news.splice(index, 1)
  await deleteCoverImage(removed.coverImage)
  await writeCollection(newsFile, 'news', news)
  res.json({ ok: true })
})

export default router

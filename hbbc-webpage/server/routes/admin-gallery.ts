import { Router } from 'express'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { galleryPhotoUpload } from '../uploads.js'

const router = Router()
const contentDir = path.join(process.cwd(), 'server', 'content')
const galleryFile = path.join(contentDir, 'gallery.json')
const photosDir = path.join(contentDir, 'gallery-photos')

interface Photo {
  file: string
  caption?: string
}

async function readPhotos(): Promise<Photo[]> {
  try {
    const raw = await fs.readFile(galleryFile, 'utf-8')
    return (JSON.parse(raw).photos as Photo[]) ?? []
  } catch {
    return []
  }
}

async function writePhotos(photos: Photo[]): Promise<void> {
  await fs.writeFile(galleryFile, JSON.stringify({ photos }, null, 2))
}

// Filenames only ever come from our own multer-generated UUIDs, but the
// :file route param is user-supplied, so it still needs the same
// no-slashes check as the public download route before touching the disk.
const isSafeFilename = (file: string) => /^[\w.-]+$/.test(file)

router.get('/', async (_req, res) => {
  res.json({ photos: await readPhotos() })
})

router.post('/', galleryPhotoUpload.single('photo'), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'Bitte ein Bild auswählen.' })
    return
  }

  const caption = typeof req.body?.caption === 'string' ? req.body.caption.slice(0, 300) : undefined

  const photos = await readPhotos()
  const photo: Photo = { file: req.file.filename, ...(caption ? { caption } : {}) }
  photos.push(photo)
  await writePhotos(photos)

  res.json({ ok: true, photo })
})

router.put('/:file', async (req, res) => {
  const { file } = req.params
  if (!isSafeFilename(file)) {
    res.status(400).json({ error: 'Ungültiger Dateiname.' })
    return
  }

  const photos = await readPhotos()
  const index = photos.findIndex((p) => p.file === file)
  if (index === -1) {
    res.status(404).json({ error: 'Bild nicht gefunden.' })
    return
  }

  const caption = typeof req.body?.caption === 'string' ? req.body.caption.slice(0, 300) : undefined
  photos[index] = { file, ...(caption ? { caption } : {}) }

  await writePhotos(photos)
  res.json({ ok: true, photo: photos[index] })
})

router.delete('/:file', async (req, res) => {
  const { file } = req.params
  if (!isSafeFilename(file)) {
    res.status(400).json({ error: 'Ungültiger Dateiname.' })
    return
  }

  const photos = await readPhotos()
  const index = photos.findIndex((p) => p.file === file)
  if (index === -1) {
    res.status(404).json({ error: 'Bild nicht gefunden.' })
    return
  }

  photos.splice(index, 1)
  await writePhotos(photos)
  await fs.unlink(path.join(photosDir, file)).catch(() => {})

  res.json({ ok: true })
})

export default router

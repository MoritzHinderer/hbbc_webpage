import { Router } from 'express'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { galleryPhotoUpload } from '../uploads.js'
import { db } from '../db.js'
import {
  photosDir,
  isSafeFilename,
  readAlbums,
  readPhotos,
  writeAlbums,
  writePhotos,
} from '../gallery-shared.js'

const router = Router()

router.get('/', async (_req, res) => {
  const photos = await readPhotos()

  // Resolve uploader names for the moderation queue — most photos have no
  // uploadedBy at all (pre-existing/admin-uploaded), so only look up the
  // handful of distinct ids actually present rather than joining per-row.
  const uploaderIds = [...new Set(photos.map((p) => p.uploadedBy).filter((id): id is number => id != null))]
  const uploaderNames = new Map<number, string>()
  if (uploaderIds.length) {
    const placeholders = uploaderIds.map(() => '?').join(',')
    const rows = db.prepare(`SELECT id, name FROM users WHERE id IN (${placeholders})`).all(...uploaderIds) as {
      id: number
      name: string
    }[]
    for (const row of rows) uploaderNames.set(row.id, row.name)
  }

  const photosWithUploader = photos.map((photo) => ({
    ...photo,
    uploaderName: photo.uploadedBy != null ? (uploaderNames.get(photo.uploadedBy) ?? null) : null,
  }))

  res.json({ photos: photosWithUploader, albums: await readAlbums() })
})

router.post('/', galleryPhotoUpload.single('photo'), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'Bitte ein Bild auswählen.' })
    return
  }

  const caption = typeof req.body?.caption === 'string' ? req.body.caption.slice(0, 300) : undefined
  const albumIdRaw = req.body?.albumId
  const albumId = typeof albumIdRaw === 'string' && albumIdRaw.trim() !== '' ? Number(albumIdRaw) : null

  const photos = await readPhotos()
  // Admin uploads don't need admin approval — they're already the approver.
  const photo = {
    file: req.file.filename,
    ...(caption ? { caption } : {}),
    albumId: Number.isInteger(albumId) ? albumId : null,
    uploadedBy: req.user!.id,
    status: 'approved' as const,
    uploadedAt: new Date().toISOString(),
  }
  photos.push(photo)
  await writePhotos(photos)

  res.json({ ok: true, photo })
})

router.post('/:file/approve', async (req, res) => {
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

  photos[index] = { ...photos[index], status: 'approved' }
  await writePhotos(photos)
  res.json({ ok: true, photo: photos[index] })
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
  const albumIdRaw = req.body?.albumId
  const albumId =
    albumIdRaw === null || albumIdRaw === '' ? null : typeof albumIdRaw === 'string' ? Number(albumIdRaw) : undefined

  photos[index] = {
    ...photos[index],
    ...(caption !== undefined ? { caption } : {}),
    ...(albumId !== undefined ? { albumId: Number.isInteger(albumId) ? albumId : null } : {}),
  }

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

  // Also how a pending photo gets rejected — there's no separate
  // "rejected" state, it's just removed.
  photos.splice(index, 1)
  await writePhotos(photos)
  await fs.unlink(path.join(photosDir, file)).catch(() => {})

  res.json({ ok: true })
})

router.get('/albums', async (_req, res) => {
  res.json({ albums: await readAlbums() })
})

router.delete('/albums/:id', async (req, res) => {
  const id = Number(req.params.id)
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: 'Ungültige Album-ID.' })
    return
  }

  const albums = await readAlbums()
  const index = albums.findIndex((a) => a.id === id)
  if (index === -1) {
    res.status(404).json({ error: 'Album nicht gefunden.' })
    return
  }
  albums.splice(index, 1)
  await writeAlbums(albums)

  // Photos in a deleted album become ungrouped rather than orphaned.
  const photos = await readPhotos()
  let changed = false
  const updated = photos.map((p) => {
    if (p.albumId !== id) return p
    changed = true
    return { ...p, albumId: null }
  })
  if (changed) await writePhotos(updated)

  res.json({ ok: true })
})

export default router

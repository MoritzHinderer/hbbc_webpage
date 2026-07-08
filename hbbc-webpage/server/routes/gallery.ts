import { Router } from 'express'
import path from 'node:path'
import { promises as fs } from 'node:fs'
import { galleryPhotoUpload } from '../uploads.js'
import { isNonEmptyString } from '../validation.js'
import {
  photosDir,
  isApproved,
  isSafeFilename,
  readAlbums,
  readPhotos,
  writeAlbums,
  writePhotos,
  type Album,
} from '../gallery-shared.js'

const router = Router()

router.get('/', async (_req, res) => {
  const [photos, albums] = await Promise.all([readPhotos(), readAlbums()])
  // Pending photos (awaiting admin approval) aren't shown to regular
  // members — only the uploader/admin need to see those, in /admin.
  res.json({ photos: photos.filter(isApproved), albums })
})

router.get('/photos/:file', (req, res) => {
  const file = req.params.file

  if (!isSafeFilename(file)) {
    res.status(400).json({ error: 'Ungültiger Dateiname.' })
    return
  }

  res.sendFile(path.join(photosDir, file), (error) => {
    if (error) res.status(404).end()
  })
})

router.post('/photos', galleryPhotoUpload.single('photo'), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'Bitte ein Bild auswählen.' })
    return
  }

  const caption = typeof req.body?.caption === 'string' ? req.body.caption.slice(0, 300) : undefined
  const albumIdRaw = req.body?.albumId
  let albumId: number | null = null
  if (typeof albumIdRaw === 'string' && albumIdRaw.trim() !== '') {
    const parsed = Number(albumIdRaw)
    if (!Number.isInteger(parsed)) {
      await fs.unlink(path.join(photosDir, req.file.filename)).catch(() => {})
      res.status(400).json({ error: 'Ungültiges Album.' })
      return
    }
    albumId = parsed
  }

  const photos = await readPhotos()
  const photo = {
    file: req.file.filename,
    ...(caption ? { caption } : {}),
    albumId,
    uploadedBy: req.user!.id,
    status: 'pending' as const,
    uploadedAt: new Date().toISOString(),
  }
  photos.push(photo)
  await writePhotos(photos)

  res.json({ ok: true, photo })
})

router.post('/albums', async (req, res) => {
  const { name, eventType, eventLabel } = req.body ?? {}
  if (!isNonEmptyString(name, 80)) {
    res.status(400).json({ error: 'Bitte einen Albumnamen angeben.' })
    return
  }

  // Both optional, but if either is set they must both be set and valid —
  // the label is trusted freeform text from the picker (same trust level
  // as the album name itself), not cross-checked against live event data.
  const hasEventRef = eventType !== undefined && eventType !== null && eventType !== ''
  if (hasEventRef) {
    if (eventType !== 'club-event' && eventType !== 'vfb-match') {
      res.status(400).json({ error: 'Ungültiger Bezugstyp.' })
      return
    }
    if (!isNonEmptyString(eventLabel, 150)) {
      res.status(400).json({ error: 'Ungültige Bezugsbeschreibung.' })
      return
    }
  }

  const albums = await readAlbums()
  const nextId = Math.max(0, ...albums.map((a) => a.id)) + 1
  const album: Album = {
    id: nextId,
    name,
    createdBy: req.user!.id,
    createdAt: new Date().toISOString(),
    ...(hasEventRef ? { eventType, eventLabel } : {}),
  }
  albums.push(album)
  await writeAlbums(albums)

  res.json({ ok: true, album })
})

export default router

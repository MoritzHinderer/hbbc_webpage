import { promises as fs } from 'node:fs'
import path from 'node:path'

const contentDir = path.join(process.cwd(), 'server', 'content')
export const galleryFile = path.join(contentDir, 'gallery.json')
export const albumsFile = path.join(contentDir, 'albums.json')
export const photosDir = path.join(contentDir, 'gallery-photos')

export interface Photo {
  file: string
  caption?: string
  albumId?: number | null
  uploadedBy?: number | null
  status?: 'pending' | 'approved'
  uploadedAt?: string
}

export interface Album {
  id: number
  name: string
  createdBy: number
  createdAt: string
  // A snapshot label, not a live reference — captured once at creation so
  // the badge stays meaningful even if the source event is later deleted
  // (club events) or ages out of the "recent" match window (VfB matches).
  eventType?: 'club-event' | 'vfb-match'
  eventLabel?: string
}

export async function readPhotos(): Promise<Photo[]> {
  try {
    const raw = await fs.readFile(galleryFile, 'utf-8')
    return (JSON.parse(raw).photos as Photo[]) ?? []
  } catch {
    return []
  }
}

export async function writePhotos(photos: Photo[]): Promise<void> {
  await fs.writeFile(galleryFile, JSON.stringify({ photos }, null, 2))
}

export async function readAlbums(): Promise<Album[]> {
  try {
    const raw = await fs.readFile(albumsFile, 'utf-8')
    return (JSON.parse(raw).albums as Album[]) ?? []
  } catch {
    return []
  }
}

export async function writeAlbums(albums: Album[]): Promise<void> {
  await fs.writeFile(albumsFile, JSON.stringify({ albums }, null, 2))
}

// Filenames only ever come from our own multer-generated UUIDs, but the
// :file route param is user-supplied, so it still needs this check before
// touching the disk.
export const isSafeFilename = (file: string): boolean => /^[\w.-]+$/.test(file)

// Photos uploaded before member self-service existed (or by admins, who
// don't need to approve their own uploads) have no `status` at all —
// treat that as already-approved rather than requiring a data migration.
export const isApproved = (photo: Photo): boolean => (photo.status ?? 'approved') === 'approved'

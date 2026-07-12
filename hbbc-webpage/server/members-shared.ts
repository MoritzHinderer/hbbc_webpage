import { promises as fs } from 'node:fs'
import path from 'node:path'
import type { WithId } from './content-store.js'
import { extForImageMime } from './uploads.js'

export const membersFile = path.join(process.cwd(), 'server', 'content', 'members.json')
export const picturesDir = path.join(process.cwd(), 'server', 'content', 'member_pictures')
const PICTURE_EXTS = ['png', 'jpeg', 'jpg', 'webp']

export interface Member extends WithId {
  name: string
  role: string
  joined: string
  location?: string
  about_me: string
  // References fanclub_members.id (SQLite) — every card represents a real
  // fanclub member, set at creation time. Whether that same fanclub member
  // also has a login account is a separate question, resolved by checking
  // users.fanclub_member_id rather than any direct link on the card.
  fanclub_member_id: number
}

export const snakeCaseName = (name: string) => name.replace(/\s+/g, '_')

export async function findExistingPicture(name: string): Promise<string | null> {
  const base = snakeCaseName(name)
  for (const ext of PICTURE_EXTS) {
    const candidate = path.join(picturesDir, `${base}.${ext}`)
    try {
      await fs.access(candidate)
      return candidate
    } catch {
      // try next extension
    }
  }
  return null
}

export async function deleteExistingPicture(name: string): Promise<void> {
  const existing = await findExistingPicture(name)
  if (existing) await fs.unlink(existing).catch(() => {})
}

// Shared by both the admin CRUD routes and the self-service profile routes,
// so "upload a new picture" / "remove it" / "carry it over on rename"
// behave identically regardless of who's making the change.
export async function applyPictureChange(params: {
  newName: string
  existingName?: string
  uploadedFile?: Express.Multer.File
  removePicture?: boolean
}): Promise<void> {
  const { newName, existingName, uploadedFile, removePicture } = params
  const nameChanged = existingName !== undefined && newName !== existingName

  if (uploadedFile) {
    if (existingName) await deleteExistingPicture(existingName)
    if (nameChanged) await deleteExistingPicture(newName)
    const ext = extForImageMime(uploadedFile.mimetype) ?? 'bin'
    await fs.rename(uploadedFile.path, path.join(picturesDir, `${snakeCaseName(newName)}.${ext}`))
  } else if (removePicture && existingName) {
    await deleteExistingPicture(existingName)
  } else if (nameChanged && existingName) {
    const existingPicture = await findExistingPicture(existingName)
    if (existingPicture) {
      const ext = path.extname(existingPicture)
      await fs.rename(existingPicture, path.join(picturesDir, `${snakeCaseName(newName)}${ext}`))
    }
  }
}

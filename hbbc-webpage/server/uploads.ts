import multer from 'multer'
import path from 'node:path'
import { randomUUID } from 'node:crypto'

const MAX_IMAGE_SIZE = 8 * 1024 * 1024 // 8MB
const MAX_PDF_SIZE = 20 * 1024 * 1024 // 20MB

const IMAGE_MIME_TO_EXT: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
}

export function extForImageMime(mimetype: string): string | null {
  return IMAGE_MIME_TO_EXT[mimetype] ?? null
}

function imageFileFilter(_req: unknown, file: Express.Multer.File, cb: multer.FileFilterCallback) {
  if (!IMAGE_MIME_TO_EXT[file.mimetype]) {
    cb(new Error('Nur PNG-, JPEG- oder WebP-Bilder sind erlaubt.'))
    return
  }
  cb(null, true)
}

// Files always land under a random UUID name first — multer's filename
// callback only sees the file part, and multipart text fields (like a
// member's name) aren't guaranteed to have already arrived depending on
// field order in the form. Anything that needs a *meaningful* filename
// (member pictures) renames the file after upload, once req.body is
// fully populated — see server/routes/admin-members.ts.
function imageStorage(destDir: string) {
  return multer.diskStorage({
    destination: destDir,
    filename: (_req, file, cb) => {
      const ext = IMAGE_MIME_TO_EXT[file.mimetype] ?? 'bin'
      cb(null, `${randomUUID()}.${ext}`)
    },
  })
}

export const memberPictureUpload = multer({
  storage: imageStorage(path.join(process.cwd(), 'public', 'member_pictures')),
  limits: { fileSize: MAX_IMAGE_SIZE },
  fileFilter: imageFileFilter,
})

export const galleryPhotoUpload = multer({
  storage: imageStorage(path.join(process.cwd(), 'server', 'content', 'gallery-photos')),
  limits: { fileSize: MAX_IMAGE_SIZE },
  fileFilter: imageFileFilter,
})

export const newsImageUpload = multer({
  storage: imageStorage(path.join(process.cwd(), 'server', 'content', 'news-photos')),
  limits: { fileSize: MAX_IMAGE_SIZE },
  fileFilter: imageFileFilter,
})

export const downloadFileUpload = multer({
  storage: multer.diskStorage({
    // Not public/ — some downloads require login, so the file itself must
    // only be reachable through the gated GET /api/downloads/:file route,
    // not a direct static URL. See server/routes/downloads.ts.
    destination: path.join(process.cwd(), 'server', 'content', 'downloads'),
    filename: (_req, _file, cb) => cb(null, `${randomUUID()}.pdf`),
  }),
  limits: { fileSize: MAX_PDF_SIZE },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      cb(new Error('Nur PDF-Dateien sind erlaubt.'))
      return
    }
    cb(null, true)
  },
})

import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import path from 'node:path'
import contactRouter from './routes/contact.js'
import newsletterRouter from './routes/newsletter.js'
import authRouter from './routes/auth.js'
import adminRouter from './routes/admin.js'
import adminMembersRouter from './routes/admin-members.js'
import adminEventsRouter from './routes/admin-events.js'
import adminGalleryRouter from './routes/admin-gallery.js'
import adminDownloadsRouter from './routes/admin-downloads.js'
import adminUsersRouter from './routes/admin-users.js'
import eventsRouter from './routes/events.js'
import galleryRouter from './routes/gallery.js'
import downloadsRouter from './routes/downloads.js'
import profileRouter from './routes/profile.js'
import { attachUser, requireAdmin, requireAuth } from './auth/middleware.js'

const app = express()
const port = Number(process.env.PORT) || 3001

app.use(cors())
app.use(express.json({ limit: '20kb' }))
app.use(attachUser)

// Public forms (and login/register) are a common spam/brute-force target —
// cap submissions per IP.
const formLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
})

app.use('/api/contact', formLimiter, contactRouter)
app.use('/api/newsletter', formLimiter, newsletterRouter)
app.use('/api/auth', authRouter)
app.use('/api/admin', requireAdmin, adminRouter)
app.use('/api/admin/members', requireAdmin, adminMembersRouter)
app.use('/api/admin/events', requireAdmin, adminEventsRouter)
app.use('/api/admin/gallery', requireAdmin, adminGalleryRouter)
app.use('/api/admin/downloads', requireAdmin, adminDownloadsRouter)
app.use('/api/admin/users', requireAdmin, adminUsersRouter)
app.use('/api/profile', requireAuth, profileRouter)
app.use('/api/events', requireAuth, eventsRouter)
app.use('/api/gallery', requireAuth, galleryRouter)
// Not blanket-gated — each file's requiresAuth flag decides individually.
app.use('/api/downloads', downloadsRouter)

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

if (process.env.NODE_ENV === 'production') {
  const distDir = path.join(process.cwd(), 'dist')
  app.use(express.static(distDir))
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distDir, 'index.html'))
  })
}

app.listen(port, () => {
  console.log(`[server] listening on http://localhost:${port}`)
})

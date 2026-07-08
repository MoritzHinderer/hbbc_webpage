import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import path from 'node:path'
import contactRouter from './routes/contact.js'
import authRouter from './routes/auth.js'
import adminRouter from './routes/admin.js'
import adminMembersRouter from './routes/admin-members.js'
import adminEventsRouter from './routes/admin-events.js'
import adminGalleryRouter from './routes/admin-gallery.js'
import adminDownloadsRouter from './routes/admin-downloads.js'
import adminUsersRouter from './routes/admin-users.js'
import adminNewsletterRouter from './routes/admin-newsletter.js'
import adminAnalyticsRouter from './routes/admin-analytics.js'
import analyticsRouter from './routes/analytics.js'
import adminNewsRouter from './routes/admin-news.js'
import newsRouter from './routes/news.js'
import eventsRouter from './routes/events.js'
import vfbMatchesRouter from './routes/vfb-matches.js'
import galleryRouter from './routes/gallery.js'
import downloadsRouter from './routes/downloads.js'
import profileRouter from './routes/profile.js'
import { attachUser, requireAdmin, requireAuth } from './auth/middleware.js'
import { migrateLegacyNewsletterSubscribers } from './newsletter-migration.js'

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

// Every page navigation fires one of these, so it needs a much more
// generous cap than form submissions — just enough to blunt abuse.
const pageviewLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
})

app.use('/api/contact', formLimiter, contactRouter)
app.use('/api/auth', authRouter)
app.use('/api/admin', requireAdmin, adminRouter)
app.use('/api/admin/members', requireAdmin, adminMembersRouter)
app.use('/api/admin/events', requireAdmin, adminEventsRouter)
app.use('/api/admin/gallery', requireAdmin, adminGalleryRouter)
app.use('/api/admin/downloads', requireAdmin, adminDownloadsRouter)
app.use('/api/admin/users', requireAdmin, adminUsersRouter)
app.use('/api/admin/newsletter', requireAdmin, adminNewsletterRouter)
app.use('/api/admin/analytics', requireAdmin, adminAnalyticsRouter)
app.use('/api/admin/news', requireAdmin, adminNewsRouter)
// Public on purpose — anonymous visitors get counted too, not just logged-in members.
app.use('/api/analytics', pageviewLimiter, analyticsRouter)
// Public on purpose — news articles are announcements meant for all visitors, not just members.
app.use('/api/news', newsRouter)
app.use('/api/profile', requireAuth, profileRouter)
app.use('/api/events', requireAuth, eventsRouter)
// Public on purpose — VfB's match schedule/scores are public sports data,
// unlike the fanclub's own Termine (still requireAuth above).
app.use('/api/vfb-matches', vfbMatchesRouter)
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

await migrateLegacyNewsletterSubscribers()

app.listen(port, () => {
  console.log(`[server] listening on http://localhost:${port}`)
})

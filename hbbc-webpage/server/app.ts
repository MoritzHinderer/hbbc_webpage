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
import membersRouter from './routes/members.js'
import adminFanclubMembersRouter from './routes/admin-fanclub-members.js'
import fanclubMembersRouter from './routes/fanclub-members.js'
import eventsRouter from './routes/events.js'
import vfbMatchesRouter from './routes/vfb-matches.js'
import galleryRouter from './routes/gallery.js'
import downloadsRouter from './routes/downloads.js'
import profileRouter from './routes/profile.js'
import impressumRouter from './routes/impressum.js'
import { attachUser, requireAdmin, requireAuth } from './auth/middleware.js'

// Pure app construction/route-mounting, no `listen()` and no startup
// migrations — so tests can import this and drive it in-process with
// supertest, without opening a real port or triggering legacy-data
// migrations that only matter for a real, pre-existing deployment. See
// index.ts for the actual entrypoint (listen + migrations).
export const app = express()

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
app.use('/api/admin/fanclub-members', requireAdmin, adminFanclubMembersRouter)
// Public on purpose — just a count, no personal data (see the route itself).
app.use('/api/fanclub-members', fanclubMembersRouter)
// Public on purpose — anonymous visitors get counted too, not just logged-in members.
app.use('/api/analytics', pageviewLimiter, analyticsRouter)
// Public on purpose — news articles are announcements meant for all visitors, not just members.
app.use('/api/news', newsRouter)
// Public on purpose — club membership isn't sensitive, and the /members
// page itself is public. Replaces the old static-file fetch, which in
// production never reflected admin edits/deletes until the next rebuild.
app.use('/api/members', membersRouter)
app.use('/api/profile', requireAuth, profileRouter)
app.use('/api/events', requireAuth, eventsRouter)
// Public on purpose — VfB's match schedule/scores are public sports data,
// unlike the fanclub's own Termine (still requireAuth above).
app.use('/api/vfb-matches', vfbMatchesRouter)
app.use('/api/gallery', requireAuth, galleryRouter)
// Not blanket-gated — each file's requiresAuth flag decides individually.
app.use('/api/downloads', downloadsRouter)
// Public on purpose — an Impressum has to be publicly visible by law. Only
// the identity/address data itself is kept out of git (see .env.example).
app.use('/api/impressum', impressumRouter)

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

if (process.env.NODE_ENV === 'production') {
  const distDir = path.join(process.cwd(), 'dist')
  // redirect: false — a couple of SPA routes (/members, /downloads) share
  // a name with a real static subfolder (member/download data JSON), and
  // serve-static's default behavior 301-redirects directory-like request
  // paths to add a trailing slash. Disabling that lets those routes fall
  // through to the SPA catch-all below like any other client-side route,
  // instead of an unnecessary extra redirect hop.
  app.use(express.static(distDir, { redirect: false }))
  // Express 5's routing (path-to-regexp v8) requires a named wildcard —
  // a bare '*' throws "Missing parameter name" at startup.
  app.get('/*splat', (_req, res) => {
    res.sendFile(path.join(distDir, 'index.html'))
  })
}

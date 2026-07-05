import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { db, toPublicUser, type UserRow } from '../db.js'
import { hashPassword, verifyPassword } from '../auth/password.js'
import { clearSessionCookie, createSession, destroySession, readSessionToken, setSessionCookie } from '../auth/session.js'
import { sendHtmlMail } from '../mailer.js'
import { escapeHtml, renderBrandedEmail } from '../newsletter-template.js'
import { isNonEmptyString, isValidEmail, isValidPassword } from '../validation.js'

const router = Router()

// Only register/login are rate-limited — /me is polled on every page
// load/navigation by the frontend, so it must not share this budget.
// Login and register get separate budgets: mistyped passwords are normal
// and shouldn't lock someone out, but registration spam is worth capping
// harder since each one emails the admin.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
})

const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
})

router.post('/register', registerLimiter, async (req, res) => {
  const { name, email, password, message } = req.body ?? {}

  if (
    !isNonEmptyString(name, 100) ||
    !isValidEmail(email) ||
    !isValidPassword(password) ||
    (message !== undefined && !isNonEmptyString(message, 1000))
  ) {
    res.status(400).json({
      error: 'Bitte Name, eine gültige E-Mail-Adresse und ein Passwort mit mindestens 8 Zeichen angeben.',
    })
    return
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase())
  if (existing) {
    res.status(409).json({ error: 'Für diese E-Mail-Adresse existiert bereits ein Konto.' })
    return
  }

  db.prepare(
    'INSERT INTO users (name, email, password_hash, message) VALUES (?, ?, ?, ?)',
  ).run(name, email.toLowerCase(), hashPassword(password), message || null)

  try {
    const bodyHtml = `<p>${escapeHtml(name)} (${escapeHtml(email)}) hat ein Konto beantragt.</p><p><strong>Nachricht:</strong> ${message ? escapeHtml(message) : '(keine)'}</p><p>Bitte im Adminbereich (/admin) prüfen.</p>`
    const { html, attachments } = renderBrandedEmail(
      `Neue Kontoanfrage von ${name}`,
      bodyHtml,
      'Diese Benachrichtigung wurde automatisch von der HBBC-Webseite gesendet.',
    )
    await sendHtmlMail({
      to: process.env.CONTACT_TO_EMAIL!,
      subject: `Neue Kontoanfrage von ${name}`,
      html,
      attachments,
    })
  } catch (error) {
    console.error('[auth] failed to send registration notification:', error)
  }

  res.json({ ok: true })
})

router.post('/login', loginLimiter, (req, res) => {
  const { email, password } = req.body ?? {}

  if (!isValidEmail(email) || !isValidPassword(password)) {
    res.status(400).json({ error: 'E-Mail oder Passwort ist falsch.' })
    return
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase()) as
    | UserRow
    | undefined

  if (!user || !verifyPassword(password, user.password_hash)) {
    res.status(401).json({ error: 'E-Mail oder Passwort ist falsch.' })
    return
  }

  if (user.status === 'pending') {
    res.status(403).json({ error: 'Dein Konto wartet noch auf Freischaltung durch einen Admin.' })
    return
  }

  if (user.status === 'rejected') {
    res.status(403).json({ error: 'Dein Konto wurde nicht freigeschaltet.' })
    return
  }

  const token = createSession(user.id)
  setSessionCookie(res, token)
  res.json({ ok: true, user: toPublicUser(user) })
})

router.post('/logout', (req, res) => {
  const token = readSessionToken(req)
  if (token) destroySession(token)
  clearSessionCookie(res)
  res.json({ ok: true })
})

router.get('/me', (req, res) => {
  res.json({ user: req.user ?? null })
})

export default router

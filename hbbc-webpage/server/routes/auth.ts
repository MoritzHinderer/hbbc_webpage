import { randomBytes } from 'node:crypto'
import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { db, toPublicUser, type UserRow } from '../db.js'
import { hashPassword, verifyPassword } from '../auth/password.js'
import { clearSessionCookie, createSession, destroySession, readSessionToken, setSessionCookie } from '../auth/session.js'
import { sendHtmlMail } from '../mailer.js'
import { escapeHtml, renderBrandedEmail } from '../newsletter-template.js'
import { isNonEmptyString, isValidEmail, isValidPassword } from '../validation.js'

const router = Router()

// The automated test suite legitimately makes far more requests per run
// than any real user would in 15 minutes (many register/login/forgot-
// password calls across many test cases, all from the same in-process
// "IP") — without this, later tests in a file get silently 429'd instead
// of exercising the actual route logic. Keyed off DB_PATH rather than
// NODE_ENV since the e2e suite runs against a real production build
// (NODE_ENV=production, for a real static bundle with none of the dev
// server's dependency-pre-bundling races) but still needs an isolated
// test database — DB_PATH is set in exactly those isolated-DB cases
// (vitest.server.config.ts, playwright.config.ts) and never in a real
// deployment, so it's the one signal that actually means "this is a test
// run" regardless of which server mode is active.
const isTestEnv = Boolean(process.env.DB_PATH)

// Only register/login are rate-limited — /me is polled on every page
// load/navigation by the frontend, so it must not share this budget.
// Login and register get separate budgets: mistyped passwords are normal
// and shouldn't lock someone out, but registration spam is worth capping
// harder since each one emails the admin.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: isTestEnv ? 100000 : 30,
  standardHeaders: true,
  legacyHeaders: false,
})

const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: isTestEnv ? 100000 : 5,
  standardHeaders: true,
  legacyHeaders: false,
})

// Every request either sends a real email or is a silent no-op (never an
// error, to avoid leaking whether an account exists) — worth capping hard,
// same budget class as registration.
const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: isTestEnv ? 100000 : 5,
  standardHeaders: true,
  legacyHeaders: false,
})

const RESET_TOKEN_DURATION_MS = 30 * 60 * 1000 // 30 minutes — short-lived on purpose

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

router.post('/forgot-password', forgotPasswordLimiter, async (req, res) => {
  const { email } = req.body ?? {}

  // Always the same response at the end, regardless of whether the email
  // matched an account or anything below failed — this is what prevents
  // the endpoint being used to check who has an account.
  if (isValidEmail(email)) {
    try {
      const user = db.prepare('SELECT id, name, email FROM users WHERE email = ?').get(email.toLowerCase()) as
        | { id: number; name: string; email: string }
        | undefined

      if (user) {
        // Only the most recently requested link should ever work.
        db.prepare('DELETE FROM password_reset_tokens WHERE user_id = ?').run(user.id)

        const token = randomBytes(32).toString('hex')
        const expiresAt = new Date(Date.now() + RESET_TOKEN_DURATION_MS).toISOString()
        db.prepare(
          'INSERT INTO password_reset_tokens (token, user_id, expires_at) VALUES (?, ?, ?)',
        ).run(token, user.id, expiresAt)

        const resetUrl = `${process.env.PUBLIC_SITE_URL || 'http://localhost:5173'}/reset-password?token=${token}`
        const bodyHtml = `<p>Hallo ${escapeHtml(user.name)},</p><p>Du hast eine Passwort-Zurücksetzung für dein HBBC-Konto angefordert. Klicke auf den folgenden Link, um ein neues Passwort zu vergeben. Der Link ist 30 Minuten gültig:</p><p><a href="${resetUrl}">Passwort zurücksetzen</a></p><p>Falls du das nicht warst, kannst du diese E-Mail einfach ignorieren.</p>`
        const { html, attachments } = renderBrandedEmail(
          'Passwort zurücksetzen',
          bodyHtml,
          'Diese E-Mail wurde automatisch von der HBBC-Webseite gesendet.',
        )
        await sendHtmlMail({ to: user.email, subject: 'Passwort zurücksetzen', html, attachments })
      }
    } catch (error) {
      console.error('[auth] failed to process forgot-password request:', error)
    }
  }

  res.json({ ok: true })
})

router.post('/reset-password', loginLimiter, async (req, res) => {
  const { token, password } = req.body ?? {}

  if (!isNonEmptyString(token, 200) || !isValidPassword(password)) {
    res.status(400).json({ error: 'Link ungültig oder abgelaufen.' })
    return
  }

  const resetToken = db
    .prepare('SELECT user_id, expires_at FROM password_reset_tokens WHERE token = ?')
    .get(token) as { user_id: number; expires_at: string } | undefined

  if (!resetToken || new Date(resetToken.expires_at) < new Date()) {
    // Clean up an expired-but-still-present token so it can't be reused
    // right up until this exact check next time either.
    if (resetToken) db.prepare('DELETE FROM password_reset_tokens WHERE token = ?').run(token)
    res.status(400).json({ error: 'Link ungültig oder abgelaufen.' })
    return
  }

  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hashPassword(password), resetToken.user_id)
  db.prepare('DELETE FROM password_reset_tokens WHERE token = ?').run(token)
  // A reset is often prompted by a suspected compromise — force re-login
  // everywhere, including on whatever device triggered the leak.
  db.prepare('DELETE FROM sessions WHERE user_id = ?').run(resetToken.user_id)

  try {
    const user = db.prepare('SELECT name, email FROM users WHERE id = ?').get(resetToken.user_id) as
      | { name: string; email: string }
      | undefined
    if (user) {
      const bodyHtml = `<p>Hallo ${escapeHtml(user.name)},</p><p>Das Passwort für dein HBBC-Konto wurde soeben geändert. Falls du das nicht warst, melde dich bitte umgehend bei uns.</p>`
      const { html, attachments } = renderBrandedEmail(
        'Dein Passwort wurde geändert',
        bodyHtml,
        'Diese E-Mail wurde automatisch von der HBBC-Webseite gesendet.',
      )
      await sendHtmlMail({ to: user.email, subject: 'Dein Passwort wurde geändert', html, attachments })
    }
  } catch (error) {
    console.error('[auth] failed to send password-changed notification:', error)
  }

  res.json({ ok: true })
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

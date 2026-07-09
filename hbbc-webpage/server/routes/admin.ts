import { Router } from 'express'
import { db, type UserRow } from '../db.js'
import { sendHtmlMail } from '../mailer.js'
import { escapeHtml, renderBrandedEmail } from '../newsletter-template.js'

const router = Router()

router.get('/requests', (_req, res) => {
  const requests = db
    .prepare(
      `SELECT id, name, email, message, created_at FROM users
       WHERE status = 'pending' ORDER BY created_at ASC`,
    )
    .all()

  res.json({ requests })
})

router.post('/requests/:id/approve', async (req, res) => {
  const id = Number(req.params.id)
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: 'Ungültige Anfrage-ID.' })
    return
  }

  const result = db
    .prepare(`UPDATE users SET status = 'approved' WHERE id = ? AND status = 'pending'`)
    .run(id)

  if (result.changes === 0) {
    res.status(404).json({ error: 'Anfrage nicht gefunden oder bereits bearbeitet.' })
    return
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow | undefined
  if (user) {
    try {
      const bodyHtml = `<p>Hallo ${escapeHtml(user.name)},</p><p>dein Konto wurde freigeschaltet. Du kannst dich jetzt einloggen und die Mitgliederbereiche (Termine, Galerie) nutzen.</p>`
      const { html, attachments } = renderBrandedEmail(
        'Dein HBBC-Konto wurde freigeschaltet',
        bodyHtml,
        'Diese Nachricht wurde automatisch von der HBBC-Webseite gesendet.',
      )
      await sendHtmlMail({
        to: user.email,
        subject: 'Dein HBBC-Konto wurde freigeschaltet',
        html,
        attachments,
      })
    } catch (error) {
      console.error('[admin] failed to send approval notification:', error)
    }
  }

  res.json({ ok: true })
})

router.post('/requests/:id/reject', (req, res) => {
  const id = Number(req.params.id)
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: 'Ungültige Anfrage-ID.' })
    return
  }

  const result = db
    .prepare(`UPDATE users SET status = 'rejected' WHERE id = ? AND status = 'pending'`)
    .run(id)

  if (result.changes === 0) {
    res.status(404).json({ error: 'Anfrage nicht gefunden oder bereits bearbeitet.' })
    return
  }

  res.json({ ok: true })
})

export default router

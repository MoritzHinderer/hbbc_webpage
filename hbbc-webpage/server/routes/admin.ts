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

  const pending = db.prepare(`SELECT * FROM users WHERE id = ? AND status = 'pending'`).get(id) as
    | UserRow
    | undefined
  if (!pending) {
    res.status(404).json({ error: 'Anfrage nicht gefunden oder bereits bearbeitet.' })
    return
  }

  // Every approved account must reference a fanclub member — either an
  // existing one the admin picked, or a new one auto-created from the
  // request's own name/email.
  const { fanclub_member_id: providedId } = req.body ?? {}
  let fanclubMemberId: number

  if (providedId !== undefined && providedId !== null) {
    if (!Number.isInteger(providedId)) {
      res.status(400).json({ error: 'Ungültige Fanclub-Mitglieds-ID.' })
      return
    }
    const fanclubMember = db.prepare('SELECT id FROM fanclub_members WHERE id = ?').get(providedId)
    if (!fanclubMember) {
      res.status(404).json({ error: 'Fanclub-Mitglied nicht gefunden.' })
      return
    }
    const alreadyLinked = db
      .prepare('SELECT id FROM users WHERE fanclub_member_id = ? AND id != ?')
      .get(providedId, id)
    if (alreadyLinked) {
      res.status(409).json({ error: 'Dieses Fanclub-Mitglied ist bereits mit einem anderen Konto verknüpft.' })
      return
    }
    fanclubMemberId = providedId
  } else if (pending.fanclub_member_id != null) {
    // Already has one — e.g. backfilled by the fanclub-member migration
    // for accounts that predate it, pending or not. Reuse it rather than
    // creating a duplicate and orphaning the original.
    fanclubMemberId = pending.fanclub_member_id
  } else {
    const created = db
      .prepare('INSERT INTO fanclub_members (name, email) VALUES (?, ?)')
      .run(pending.name, pending.email)
    fanclubMemberId = Number(created.lastInsertRowid)
  }

  const result = db
    .prepare(`UPDATE users SET status = 'approved', fanclub_member_id = ? WHERE id = ? AND status = 'pending'`)
    .run(fanclubMemberId, id)

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

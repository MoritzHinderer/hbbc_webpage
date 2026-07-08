import { Router } from 'express'
import { db } from '../db.js'
import { sendHtmlMail } from '../mailer.js'
import { renderNewsletterEmail } from '../newsletter-template.js'
import { isNonEmptyString } from '../validation.js'

const router = Router()

function getSubscribers() {
  return db
    .prepare(
      `SELECT id, name, email FROM users WHERE newsletter_subscribed = 1 AND status = 'approved'`,
    )
    .all() as { id: number; name: string; email: string }[]
}

router.get('/subscribers', (_req, res) => {
  res.json({ subscribers: getSubscribers() })
})

router.get('/history', (_req, res) => {
  const history = db
    .prepare('SELECT id, subject, body_html, recipient_count, sent_at FROM newsletters ORDER BY sent_at DESC')
    .all()
  res.json({ history })
})

router.post('/send', async (req, res) => {
  const { subject, bodyHtml, testOnly } = req.body ?? {}

  if (!isNonEmptyString(subject, 200) || !isNonEmptyString(bodyHtml, 50000)) {
    res.status(400).json({ error: 'Bitte Betreff und Inhalt angeben.' })
    return
  }

  const { html, attachments } = renderNewsletterEmail(subject, bodyHtml)

  if (testOnly) {
    try {
      await sendHtmlMail({ to: req.user!.email, subject: `[Test] ${subject}`, html, attachments })
      res.json({ ok: true, sent: 1, failed: 0 })
    } catch (error) {
      console.error('[admin-newsletter] test send failed:', error)
      res.status(502).json({ error: 'Test-Mail konnte nicht gesendet werden.' })
    }
    return
  }

  const recipients = getSubscribers()
  let sent = 0
  const failed: string[] = []

  for (const recipient of recipients) {
    try {
      await sendHtmlMail({ to: recipient.email, subject, html, attachments })
      sent++
    } catch (error) {
      console.error(`[admin-newsletter] failed to send to ${recipient.email}:`, error)
      failed.push(recipient.email)
    }
  }

  db.prepare('INSERT INTO newsletters (subject, body_html, recipient_count) VALUES (?, ?, ?)').run(
    subject,
    bodyHtml,
    sent,
  )

  res.json({ ok: true, sent, failed: failed.length })
})

export default router

import { Router } from 'express'
import { sendHtmlMail } from '../mailer.js'
import { escapeHtml, renderBrandedEmail } from '../newsletter-template.js'
import { isNonEmptyString, isValidEmail } from '../validation.js'

const router = Router()

router.post('/', async (req, res) => {
  const { name, email, message } = req.body ?? {}

  if (!isNonEmptyString(name, 100) || !isValidEmail(email) || !isNonEmptyString(message, 5000)) {
    res.status(400).json({ error: 'Bitte Name, eine gültige E-Mail-Adresse und eine Nachricht angeben.' })
    return
  }

  try {
    const bodyHtml = `<p><strong>Name:</strong> ${escapeHtml(name)}</p><p><strong>E-Mail:</strong> ${escapeHtml(email)}</p><p>${escapeHtml(message).replace(/\n/g, '<br>')}</p>`
    const { html, attachments } = renderBrandedEmail(
      `Neue Kontaktanfrage von ${name}`,
      bodyHtml,
      'Diese Nachricht wurde über das Kontaktformular auf der HBBC-Webseite gesendet.',
    )
    await sendHtmlMail({
      to: process.env.CONTACT_TO_EMAIL!,
      subject: `Neue Kontaktanfrage von ${name}`,
      html,
      attachments,
      replyTo: email,
    })
    res.json({ ok: true })
  } catch (error) {
    console.error('[contact] failed to send mail:', error)
    res.status(502).json({ error: 'Nachricht konnte nicht gesendet werden. Bitte später erneut versuchen.' })
  }
})

export default router

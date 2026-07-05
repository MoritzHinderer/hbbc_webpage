import { Router } from 'express'
import { sendMail } from '../mailer.js'
import { isNonEmptyString, isValidEmail } from '../validation.js'

const router = Router()

router.post('/', async (req, res) => {
  const { name, email, message } = req.body ?? {}

  if (!isNonEmptyString(name, 100) || !isValidEmail(email) || !isNonEmptyString(message, 5000)) {
    res.status(400).json({ error: 'Bitte Name, eine gültige E-Mail-Adresse und eine Nachricht angeben.' })
    return
  }

  try {
    await sendMail({
      subject: `Neue Kontaktanfrage von ${name}`,
      text: `Name: ${name}\nE-Mail: ${email}\n\n${message}`,
      replyTo: email,
    })
    res.json({ ok: true })
  } catch (error) {
    console.error('[contact] failed to send mail:', error)
    res.status(502).json({ error: 'Nachricht konnte nicht gesendet werden. Bitte später erneut versuchen.' })
  }
})

export default router

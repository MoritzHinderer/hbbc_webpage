import { Router } from 'express'
import { sendMail } from '../mailer.js'
import { addSubscriber } from '../store.js'
import { isValidEmail } from '../validation.js'

const router = Router()

router.post('/', async (req, res) => {
  const { email } = req.body ?? {}

  if (!isValidEmail(email)) {
    res.status(400).json({ error: 'Bitte eine gültige E-Mail-Adresse angeben.' })
    return
  }

  try {
    const { alreadySubscribed } = await addSubscriber(email)

    if (!alreadySubscribed) {
      // Best-effort admin notification — signup should still succeed if this fails.
      sendMail({
        subject: 'Neue Newsletter-Anmeldung',
        text: `Neue Anmeldung: ${email}`,
      }).catch((error) => console.error('[newsletter] notification email failed:', error))
    }

    res.json({ ok: true, alreadySubscribed })
  } catch (error) {
    console.error('[newsletter] failed to store subscriber:', error)
    res.status(500).json({ error: 'Anmeldung ist gerade nicht möglich. Bitte später erneut versuchen.' })
  }
})

export default router

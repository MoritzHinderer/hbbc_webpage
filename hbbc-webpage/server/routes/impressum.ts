import { Router } from 'express'

const router = Router()

// Real identity/address data (legally required on the Impressum page)
// lives only in .env, never in git — see .env.example. Public route since
// an Impressum has to be publicly visible anyway; this just keeps the PII
// itself out of the repo/commit history rather than out of the page.
router.get('/', (_req, res) => {
  const name = process.env.IMPRESSUM_NAME || null
  const addressLines = [process.env.IMPRESSUM_ADDRESS_LINE1, process.env.IMPRESSUM_ADDRESS_LINE2].filter(
    (line): line is string => Boolean(line),
  )
  const phone = process.env.IMPRESSUM_PHONE || null
  const phoneHref = phone ? `tel:+49${phone.replace(/^0/, '').replace(/\s+/g, '')}` : null

  res.json({
    configured: Boolean(name && addressLines.length > 0),
    name,
    addressLines,
    phone,
    phoneHref,
  })
})

export default router

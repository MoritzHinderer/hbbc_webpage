import nodemailer from 'nodemailer'

const requiredEnv = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'CONTACT_TO_EMAIL'] as const

export const mailerConfigured = requiredEnv.every((key) => Boolean(process.env[key]))

if (!mailerConfigured) {
  console.warn(
    `[mailer] Missing env vars (${requiredEnv.filter((k) => !process.env[k]).join(', ')}) — ` +
      'emails will be logged to the console instead of sent. See .env.example.',
  )
}

const transporter = mailerConfigured
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  : null

export interface MailMessage {
  subject: string
  text: string
  replyTo?: string
}

export async function sendMail(message: MailMessage): Promise<void> {
  const to = process.env.CONTACT_TO_EMAIL
  const from = process.env.CONTACT_FROM_EMAIL || process.env.SMTP_USER || 'no-reply@hbbc-fanclub.de'

  if (!transporter || !to) {
    console.log('[mailer] (dev fallback, no SMTP configured) would send:', { to, from, ...message })
    return
  }

  await transporter.sendMail({
    to,
    from,
    replyTo: message.replyTo,
    subject: message.subject,
    text: message.text,
  })
}

export interface HtmlMailMessage {
  to: string
  subject: string
  html: string
  attachments?: { filename: string; path: string; cid: string }[]
}

// Sibling to sendMail — used for the newsletter (arbitrary recipient, HTML
// body, an embedded logo). Kept separate so the simple contact/notification
// callers above are untouched.
export async function sendHtmlMail(message: HtmlMailMessage): Promise<void> {
  const from = process.env.CONTACT_FROM_EMAIL || process.env.SMTP_USER || 'no-reply@hbbc-fanclub.de'

  if (!transporter) {
    console.log('[mailer] (dev fallback, no SMTP configured) would send HTML mail:', {
      to: message.to,
      from,
      subject: message.subject,
    })
    return
  }

  await transporter.sendMail({
    to: message.to,
    from,
    subject: message.subject,
    html: message.html,
    attachments: message.attachments,
  })
}

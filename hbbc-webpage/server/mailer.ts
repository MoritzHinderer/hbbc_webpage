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

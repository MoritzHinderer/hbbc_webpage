import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { app } from '../app.js'

// SMTP_HOST/PORT/USER/PASS/CONTACT_TO_EMAIL are blanked for the whole test
// run (see vitest.server.config.ts) — sendHtmlMail() takes the "no
// transporter configured" fallback (logs to console, resolves) instead of
// attempting a real send, so a successful submission here never risks a
// real email the way an unguarded e2e run once did.
//
// /api/contact sits behind formLimiter (10 requests / 15 min per IP, see
// app.ts) with no test-env relaxation — keep this file's total request
// count well under that budget.
describe('POST /api/contact', () => {
  it('rejects a missing name', async () => {
    const res = await request(app).post('/api/contact').send({ email: 'a@example.test', message: 'Hallo' })
    expect(res.status).toBe(400)
  })

  it('rejects an invalid email', async () => {
    const res = await request(app).post('/api/contact').send({ name: 'A', email: 'not-an-email', message: 'Hallo' })
    expect(res.status).toBe(400)
  })

  it('rejects a missing message', async () => {
    const res = await request(app).post('/api/contact').send({ name: 'A', email: 'a@example.test' })
    expect(res.status).toBe(400)
  })

  it('accepts a valid submission', async () => {
    const res = await request(app)
      .post('/api/contact')
      .send({ name: 'Contact Test', email: 'contact-test@example.test', message: 'Test message' })
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ ok: true })
  })
})

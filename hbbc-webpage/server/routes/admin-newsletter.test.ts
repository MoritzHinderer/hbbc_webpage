import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { app } from '../app.js'
import { db } from '../db.js'

// SMTP is unconfigured for the whole test run (see vitest.server.config.ts)
// — sendHtmlMail logs instead of sending, so "send" tests below never fire
// a real email, matching the pattern already used for auth.test.ts.

async function createApprovedAdmin() {
  const email = `admin-newsletter-test-${Date.now()}-${Math.random().toString(36).slice(2)}@example.test`
  await request(app).post('/api/auth/register').send({ name: 'Admin', email, password: 'AdminPassword123!' })
  db.prepare("UPDATE users SET status = 'approved', role = 'admin' WHERE email = ?").run(email)
  const loginRes = await request(app).post('/api/auth/login').send({ email, password: 'AdminPassword123!' })
  return loginRes.headers['set-cookie'][0].split(';')[0]
}

async function createSubscribedMember() {
  const email = `subscriber-${Date.now()}-${Math.random().toString(36).slice(2)}@example.test`
  await request(app).post('/api/auth/register').send({ name: 'Subscriber', email, password: 'MemberPassword123!' })
  db.prepare("UPDATE users SET status = 'approved', newsletter_subscribed = 1 WHERE email = ?").run(email)
  return email
}

describe('admin auth guard', () => {
  it('rejects an unauthenticated request', async () => {
    const res = await request(app).get('/api/admin/newsletter/subscribers')
    expect(res.status).toBe(403)
  })
})

describe('GET /api/admin/newsletter/subscribers', () => {
  it('lists only subscribed + approved users', async () => {
    const cookie = await createApprovedAdmin()
    const subscriberEmail = await createSubscribedMember()

    const res = await request(app).get('/api/admin/newsletter/subscribers').set('Cookie', cookie)
    expect(res.status).toBe(200)
    expect(res.body.subscribers.some((s: { email: string }) => s.email === subscriberEmail)).toBe(true)
  })
})

describe('POST /api/admin/newsletter/send', () => {
  it('rejects missing subject or body', async () => {
    const cookie = await createApprovedAdmin()
    const res = await request(app)
      .post('/api/admin/newsletter/send')
      .set('Cookie', cookie)
      .send({ subject: '', bodyHtml: '<p>x</p>' })
    expect(res.status).toBe(400)
  })

  it('a test send does not record history or touch subscriber count', async () => {
    const cookie = await createApprovedAdmin()
    const before = (db.prepare('SELECT COUNT(*) as c FROM newsletters').get() as { c: number }).c

    const res = await request(app)
      .post('/api/admin/newsletter/send')
      .set('Cookie', cookie)
      .send({ subject: 'Test Subject', bodyHtml: '<p>Test body</p>', testOnly: true })
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ ok: true, sent: 1, failed: 0 })

    const after = (db.prepare('SELECT COUNT(*) as c FROM newsletters').get() as { c: number }).c
    expect(after).toBe(before)
  })

  it('a real send records one history row with the subscriber count', async () => {
    const cookie = await createApprovedAdmin()
    await createSubscribedMember()
    await createSubscribedMember()
    const before = (db.prepare('SELECT COUNT(*) as c FROM newsletters').get() as { c: number }).c
    const subscriberCount = db
      .prepare(`SELECT COUNT(*) as c FROM users WHERE newsletter_subscribed = 1 AND status = 'approved'`)
      .get() as { c: number }

    const res = await request(app)
      .post('/api/admin/newsletter/send')
      .set('Cookie', cookie)
      .send({ subject: 'Real Subject', bodyHtml: '<p>Real body</p>' })
    expect(res.status).toBe(200)
    expect(res.body.sent).toBe(subscriberCount.c)

    const after = (db.prepare('SELECT COUNT(*) as c FROM newsletters').get() as { c: number }).c
    expect(after).toBe(before + 1)

    const historyRes = await request(app).get('/api/admin/newsletter/history').set('Cookie', cookie)
    expect(historyRes.body.history[0].subject).toBe('Real Subject')
    expect(historyRes.body.history[0].body_html).toBe('<p>Real body</p>')
  })
})

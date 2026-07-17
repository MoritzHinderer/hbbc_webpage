import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { app } from '../app.js'
import { db } from '../db.js'

// SMTP is intentionally unconfigured for the whole test run (see
// vitest.server.config.ts) — mail-sending routes below still succeed,
// they just log instead of sending, exactly like local dev without a
// .env configured.

describe('POST /api/auth/register + /api/auth/login', () => {
  it('registers a pending account that cannot log in yet', async () => {
    const email = `register-test-${Date.now()}@example.test`

    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Register Test', email, password: 'ValidPassword123!' })
    expect(registerRes.status).toBe(200)
    expect(registerRes.body).toEqual({ ok: true })

    const loginRes = await request(app).post('/api/auth/login').send({ email, password: 'ValidPassword123!' })
    expect(loginRes.status).toBe(403)
    expect(loginRes.body.error).toMatch(/Freischaltung/)
  })

  it('rejects registering the same email twice', async () => {
    const email = `register-dup-${Date.now()}@example.test`
    await request(app).post('/api/auth/register').send({ name: 'A', email, password: 'ValidPassword123!' })

    const dup = await request(app).post('/api/auth/register').send({ name: 'B', email, password: 'AnotherPass123!' })
    expect(dup.status).toBe(409)
  })

  it('logs in an approved user with correct credentials', async () => {
    const email = `login-test-${Date.now()}@example.test`
    await request(app).post('/api/auth/register').send({ name: 'Login Test', email, password: 'ValidPassword123!' })
    db.prepare("UPDATE users SET status = 'approved' WHERE email = ?").run(email)

    const res = await request(app).post('/api/auth/login').send({ email, password: 'ValidPassword123!' })
    expect(res.status).toBe(200)
    expect(res.body.user.email).toBe(email)
    expect(res.headers['set-cookie']?.[0]).toMatch(/^session=/)
  })

  it('rejects an approved user with the wrong password', async () => {
    const email = `login-wrong-${Date.now()}@example.test`
    await request(app).post('/api/auth/register').send({ name: 'X', email, password: 'ValidPassword123!' })
    db.prepare("UPDATE users SET status = 'approved' WHERE email = ?").run(email)

    const res = await request(app).post('/api/auth/login').send({ email, password: 'TotallyWrongPassword!' })
    expect(res.status).toBe(401)
  })

  it('rejects a rejected account', async () => {
    const email = `login-rejected-${Date.now()}@example.test`
    await request(app).post('/api/auth/register').send({ name: 'X', email, password: 'ValidPassword123!' })
    db.prepare("UPDATE users SET status = 'rejected' WHERE email = ?").run(email)

    const res = await request(app).post('/api/auth/login').send({ email, password: 'ValidPassword123!' })
    expect(res.status).toBe(403)
    expect(res.body.error).toMatch(/nicht freigeschaltet/)
  })
})

describe('POST /api/auth/forgot-password + /api/auth/reset-password', () => {
  async function createApprovedUser(password = 'OriginalPassword123!') {
    const email = `forgot-test-${Date.now()}-${Math.random().toString(36).slice(2)}@example.test`
    await request(app).post('/api/auth/register').send({ name: 'Forgot Test', email, password })
    db.prepare("UPDATE users SET status = 'approved' WHERE email = ?").run(email)
    return email
  }

  it('always responds ok:true, whether or not the email exists (no enumeration)', async () => {
    const email = await createApprovedUser()

    const realRes = await request(app).post('/api/auth/forgot-password').send({ email })
    const fakeRes = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'definitely-not-registered@example.test' })

    expect(realRes.status).toBe(200)
    expect(fakeRes.status).toBe(200)
    expect(realRes.body).toEqual({ ok: true })
    expect(fakeRes.body).toEqual({ ok: true })
  })

  it('only creates a reset token for a real account', async () => {
    const email = await createApprovedUser()
    const before = db.prepare('SELECT COUNT(*) as c FROM password_reset_tokens').get() as { c: number }

    await request(app).post('/api/auth/forgot-password').send({ email: 'nobody-here@example.test' })
    const afterFake = db.prepare('SELECT COUNT(*) as c FROM password_reset_tokens').get() as { c: number }
    expect(afterFake.c).toBe(before.c)

    await request(app).post('/api/auth/forgot-password').send({ email })
    const afterReal = db.prepare('SELECT COUNT(*) as c FROM password_reset_tokens').get() as { c: number }
    expect(afterReal.c).toBe(before.c + 1)
  })

  it('resets the password, invalidates the token, and kills existing sessions', async () => {
    const email = await createApprovedUser('OldPassword123!')
    await request(app).post('/api/auth/forgot-password').send({ email })

    const userId = (db.prepare('SELECT id FROM users WHERE email = ?').get(email) as { id: number }).id
    const token = (
      db.prepare('SELECT token FROM password_reset_tokens WHERE user_id = ?').get(userId) as { token: string }
    ).token

    // Log in first so there's a real session to confirm gets destroyed.
    const loginRes = await request(app).post('/api/auth/login').send({ email, password: 'OldPassword123!' })
    expect(loginRes.status).toBe(200)
    const sessionsBefore = db.prepare('SELECT COUNT(*) as c FROM sessions WHERE user_id = ?').get(userId) as {
      c: number
    }
    expect(sessionsBefore.c).toBe(1)

    const resetRes = await request(app).post('/api/auth/reset-password').send({ token, password: 'NewPassword456!' })
    expect(resetRes.status).toBe(200)

    const sessionsAfter = db.prepare('SELECT COUNT(*) as c FROM sessions WHERE user_id = ?').get(userId) as {
      c: number
    }
    expect(sessionsAfter.c).toBe(0)

    const oldLogin = await request(app).post('/api/auth/login').send({ email, password: 'OldPassword123!' })
    expect(oldLogin.status).toBe(401)
    const newLogin = await request(app).post('/api/auth/login').send({ email, password: 'NewPassword456!' })
    expect(newLogin.status).toBe(200)
  })

  it('rejects reusing an already-used token', async () => {
    const email = await createApprovedUser()
    await request(app).post('/api/auth/forgot-password').send({ email })
    const userId = (db.prepare('SELECT id FROM users WHERE email = ?').get(email) as { id: number }).id
    const token = (
      db.prepare('SELECT token FROM password_reset_tokens WHERE user_id = ?').get(userId) as { token: string }
    ).token

    const first = await request(app).post('/api/auth/reset-password').send({ token, password: 'FirstNew123!' })
    expect(first.status).toBe(200)

    const second = await request(app).post('/api/auth/reset-password').send({ token, password: 'SecondNew123!' })
    expect(second.status).toBe(400)
    expect(second.body.error).toMatch(/ungültig oder abgelaufen/)
  })

  it('rejects a garbage token', async () => {
    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: 'totally-made-up-token', password: 'SomePassword123!' })
    expect(res.status).toBe(400)
  })

  it('rejects an expired token', async () => {
    const email = await createApprovedUser()
    const userId = (db.prepare('SELECT id FROM users WHERE email = ?').get(email) as { id: number }).id
    const expiredToken = 'manually-inserted-expired-reset-token'
    db.prepare(
      "INSERT INTO password_reset_tokens (token, user_id, expires_at) VALUES (?, ?, datetime('now', '-1 second'))",
    ).run(expiredToken, userId)

    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: expiredToken, password: 'SomePassword123!' })
    expect(res.status).toBe(400)
  })
})

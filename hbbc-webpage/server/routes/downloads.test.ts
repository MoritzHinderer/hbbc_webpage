import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { app } from '../app.js'
import { db } from '../db.js'

// CONTENT_DIR/PUBLIC_DIR are isolated per-run (see vitest.server.config.ts)
// — files created via the real admin upload endpoint below never touch the
// actual public/downloads/ used by the running site.

async function createApprovedAdmin() {
  const email = `downloads-test-${Date.now()}-${Math.random().toString(36).slice(2)}@example.test`
  await request(app).post('/api/auth/register').send({ name: 'Admin', email, password: 'AdminPassword123!' })
  db.prepare("UPDATE users SET status = 'approved', role = 'admin' WHERE email = ?").run(email)
  const loginRes = await request(app).post('/api/auth/login').send({ email, password: 'AdminPassword123!' })
  return loginRes.headers['set-cookie'][0].split(';')[0]
}

const fakePdf = Buffer.from('%PDF-1.4 fake test content')

async function uploadDownload(cookie: string, requiresAuth: boolean, filename: string) {
  const res = await request(app)
    .post('/api/admin/downloads')
    .set('Cookie', cookie)
    .field('name', filename)
    .field('description', 'Test document')
    .field('requiresAuth', String(requiresAuth))
    .attach('file', fakePdf, filename)
  const href = res.body.download.href as string
  return href.replace(/^\/api\/downloads\//, '')
}

describe('GET /api/downloads', () => {
  it('lists downloads, including requiresAuth ones, unauthenticated', async () => {
    const cookie = await createApprovedAdmin()
    await uploadDownload(cookie, false, 'list-public.pdf')
    await uploadDownload(cookie, true, 'list-gated.pdf')

    const res = await request(app).get('/api/downloads')
    expect(res.status).toBe(200)
    const names = res.body.downloads.map((d: { name: string }) => d.name)
    expect(names).toContain('list-public.pdf')
    expect(names).toContain('list-gated.pdf')
  })
})

describe('GET /api/downloads/:file', () => {
  it('rejects a filename containing unsafe characters', async () => {
    const res = await request(app).get('/api/downloads/foo;bar.pdf')
    expect(res.status).toBe(400)
  })

  it('404s for a safe-but-nonexistent filename', async () => {
    const res = await request(app).get('/api/downloads/does-not-exist.pdf')
    expect(res.status).toBe(404)
  })

  it('serves a file that does not require auth, unauthenticated', async () => {
    const cookie = await createApprovedAdmin()
    const file = await uploadDownload(cookie, false, 'public.pdf')

    const res = await request(app).get(`/api/downloads/${file}`)
    expect(res.status).toBe(200)
  })

  it('rejects an unauthenticated request for a file that requires auth', async () => {
    const cookie = await createApprovedAdmin()
    const file = await uploadDownload(cookie, true, 'gated.pdf')

    const res = await request(app).get(`/api/downloads/${file}`)
    expect(res.status).toBe(401)
  })

  it('serves a file that requires auth when logged in', async () => {
    const cookie = await createApprovedAdmin()
    const file = await uploadDownload(cookie, true, 'gated2.pdf')

    const res = await request(app).get(`/api/downloads/${file}`).set('Cookie', cookie)
    expect(res.status).toBe(200)
  })
})

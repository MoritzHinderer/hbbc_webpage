import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { app } from '../app.js'
import { db } from '../db.js'

// CONTENT_DIR/PUBLIC_DIR point at isolated, real (but empty) directories
// during tests (see vitest.server.config.ts) — this suite's writes never
// touch the actual public/downloads/downloads.json or server/content/
// downloads/ used by the running site.

async function createApprovedAdmin() {
  const email = `admin-downloads-test-${Date.now()}-${Math.random().toString(36).slice(2)}@example.test`
  await request(app).post('/api/auth/register').send({ name: 'Admin', email, password: 'AdminPassword123!' })
  db.prepare("UPDATE users SET status = 'approved', role = 'admin' WHERE email = ?").run(email)
  const loginRes = await request(app).post('/api/auth/login').send({ email, password: 'AdminPassword123!' })
  return loginRes.headers['set-cookie'][0].split(';')[0]
}

const fakePdf = Buffer.from('%PDF-1.4 fake test content')

describe('admin auth guard', () => {
  it('rejects an unauthenticated request', async () => {
    const res = await request(app).get('/api/admin/downloads')
    expect(res.status).toBe(403)
  })
})

describe('download CRUD', () => {
  it('creates (with a real PDF upload), lists, updates, and deletes a download', async () => {
    const cookie = await createApprovedAdmin()

    const createRes = await request(app)
      .post('/api/admin/downloads')
      .set('Cookie', cookie)
      .field('name', 'Test Doc')
      .field('description', 'A test document')
      .field('requiresAuth', 'false')
      .attach('file', fakePdf, 'test.pdf')
    expect(createRes.status).toBe(200)
    expect(createRes.body.download.href).toMatch(/^\/api\/downloads\//)
    const id = createRes.body.download.id as number

    const listRes = await request(app).get('/api/admin/downloads').set('Cookie', cookie)
    expect(listRes.body.downloads.some((d: { id: number }) => d.id === id)).toBe(true)

    const updateRes = await request(app)
      .put(`/api/admin/downloads/${id}`)
      .set('Cookie', cookie)
      .field('name', 'Updated Doc')
      .field('description', 'Updated description')
      .field('requiresAuth', 'true')
    expect(updateRes.status).toBe(200)
    expect(updateRes.body.download.name).toBe('Updated Doc')
    expect(updateRes.body.download.requiresAuth).toBe(true)

    const deleteRes = await request(app).delete(`/api/admin/downloads/${id}`).set('Cookie', cookie)
    expect(deleteRes.status).toBe(200)

    const listAfter = await request(app).get('/api/admin/downloads').set('Cookie', cookie)
    expect(listAfter.body.downloads.some((d: { id: number }) => d.id === id)).toBe(false)
  })

  it('rejects a create request with no file', async () => {
    const cookie = await createApprovedAdmin()
    const res = await request(app)
      .post('/api/admin/downloads')
      .set('Cookie', cookie)
      .field('name', 'No File')
      .field('description', 'Missing the PDF')
    expect(res.status).toBe(400)
  })

  it('rejects a non-PDF file', async () => {
    const cookie = await createApprovedAdmin()
    const res = await request(app)
      .post('/api/admin/downloads')
      .set('Cookie', cookie)
      .field('name', 'Wrong Type')
      .field('description', 'Not a PDF')
      .attach('file', Buffer.from('not a pdf'), { filename: 'test.txt', contentType: 'text/plain' })
    expect(res.status).toBe(500)
  })

  it('404s updating/deleting a nonexistent download', async () => {
    const cookie = await createApprovedAdmin()
    const updateRes = await request(app)
      .put('/api/admin/downloads/999999')
      .set('Cookie', cookie)
      .field('name', 'X')
      .field('description', 'Y')
    expect(updateRes.status).toBe(404)

    const deleteRes = await request(app).delete('/api/admin/downloads/999999').set('Cookie', cookie)
    expect(deleteRes.status).toBe(404)
  })
})

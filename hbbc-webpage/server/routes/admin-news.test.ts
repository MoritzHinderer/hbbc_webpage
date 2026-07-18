import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { app } from '../app.js'
import { db } from '../db.js'

async function createApprovedAdmin() {
  const email = `admin-news-test-${Date.now()}-${Math.random().toString(36).slice(2)}@example.test`
  await request(app).post('/api/auth/register').send({ name: 'Admin', email, password: 'AdminPassword123!' })
  db.prepare("UPDATE users SET status = 'approved', role = 'admin' WHERE email = ?").run(email)
  const loginRes = await request(app).post('/api/auth/login').send({ email, password: 'AdminPassword123!' })
  return loginRes.headers['set-cookie'][0].split(';')[0]
}

describe('admin auth guard', () => {
  it('rejects an unauthenticated request', async () => {
    const res = await request(app).get('/api/admin/news')
    expect(res.status).toBe(403)
  })
})

describe('news article CRUD', () => {
  it('creates, lists, updates (preserving createdAt), and deletes an article', async () => {
    const cookie = await createApprovedAdmin()

    const createRes = await request(app)
      .post('/api/admin/news')
      .set('Cookie', cookie)
      .field('title', 'Test Article')
      .field('body', '<p>Hello</p>')
    expect(createRes.status).toBe(200)
    const id = createRes.body.article.id as number
    const originalCreatedAt = createRes.body.article.createdAt as string

    const listRes = await request(app).get('/api/admin/news').set('Cookie', cookie)
    expect(listRes.body.news.some((a: { id: number }) => a.id === id)).toBe(true)

    const updateRes = await request(app)
      .put(`/api/admin/news/${id}`)
      .set('Cookie', cookie)
      .field('title', 'Updated Article')
      .field('body', '<p>Updated</p>')
    expect(updateRes.status).toBe(200)
    expect(updateRes.body.article.title).toBe('Updated Article')
    // Publish date is fixed at creation — an edit must not change it.
    expect(updateRes.body.article.createdAt).toBe(originalCreatedAt)

    const deleteRes = await request(app).delete(`/api/admin/news/${id}`).set('Cookie', cookie)
    expect(deleteRes.status).toBe(200)

    const listAfter = await request(app).get('/api/admin/news').set('Cookie', cookie)
    expect(listAfter.body.news.some((a: { id: number }) => a.id === id)).toBe(false)
  })

  it('rejects missing title or body', async () => {
    const cookie = await createApprovedAdmin()

    const noTitle = await request(app).post('/api/admin/news').set('Cookie', cookie).field('body', '<p>x</p>')
    expect(noTitle.status).toBe(400)

    const noBody = await request(app).post('/api/admin/news').set('Cookie', cookie).field('title', 'X')
    expect(noBody.status).toBe(400)
  })

  it('404s updating/deleting a nonexistent article', async () => {
    const cookie = await createApprovedAdmin()
    const updateRes = await request(app)
      .put('/api/admin/news/999999')
      .set('Cookie', cookie)
      .field('title', 'X')
      .field('body', '<p>y</p>')
    expect(updateRes.status).toBe(404)

    const deleteRes = await request(app).delete('/api/admin/news/999999').set('Cookie', cookie)
    expect(deleteRes.status).toBe(404)
  })
})

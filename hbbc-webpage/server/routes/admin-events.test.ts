import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { app } from '../app.js'
import { db } from '../db.js'

// CONTENT_DIR points at an isolated, real (but empty) directory during
// tests (see vitest.server.config.ts) — this suite's writes never touch
// the actual server/content/events.json used by the running site.

async function createApprovedAdmin() {
  const email = `admin-events-test-${Date.now()}-${Math.random().toString(36).slice(2)}@example.test`
  await request(app).post('/api/auth/register').send({ name: 'Admin', email, password: 'AdminPassword123!' })
  db.prepare("UPDATE users SET status = 'approved', role = 'admin' WHERE email = ?").run(email)
  const loginRes = await request(app).post('/api/auth/login').send({ email, password: 'AdminPassword123!' })
  return loginRes.headers['set-cookie'][0].split(';')[0]
}

describe('admin auth guard', () => {
  it('rejects an unauthenticated request', async () => {
    const res = await request(app).get('/api/admin/events')
    expect(res.status).toBe(403)
  })
})

describe('event CRUD', () => {
  it('creates, lists, updates, and deletes an event', async () => {
    const cookie = await createApprovedAdmin()

    const createRes = await request(app)
      .post('/api/admin/events')
      .set('Cookie', cookie)
      .send({ title: 'Test Match', date: '2026-08-01', time: '15:30', type: 'match', location: 'Stadion' })
    expect(createRes.status).toBe(200)
    const id = createRes.body.event.id as number

    const listRes = await request(app).get('/api/admin/events').set('Cookie', cookie)
    expect(listRes.body.events.some((e: { id: number }) => e.id === id)).toBe(true)

    const updateRes = await request(app)
      .put(`/api/admin/events/${id}`)
      .set('Cookie', cookie)
      .send({ title: 'Updated Match', date: '2026-08-02', type: 'meetup' })
    expect(updateRes.status).toBe(200)
    expect(updateRes.body.event.title).toBe('Updated Match')
    expect(updateRes.body.event.type).toBe('meetup')

    const deleteRes = await request(app).delete(`/api/admin/events/${id}`).set('Cookie', cookie)
    expect(deleteRes.status).toBe(200)

    const listAfter = await request(app).get('/api/admin/events').set('Cookie', cookie)
    expect(listAfter.body.events.some((e: { id: number }) => e.id === id)).toBe(false)
  })

  it('rejects invalid input', async () => {
    const cookie = await createApprovedAdmin()

    const noTitle = await request(app)
      .post('/api/admin/events')
      .set('Cookie', cookie)
      .send({ date: '2026-08-01', type: 'match' })
    expect(noTitle.status).toBe(400)

    const badDate = await request(app)
      .post('/api/admin/events')
      .set('Cookie', cookie)
      .send({ title: 'X', date: 'not-a-date', type: 'match' })
    expect(badDate.status).toBe(400)

    const badType = await request(app)
      .post('/api/admin/events')
      .set('Cookie', cookie)
      .send({ title: 'X', date: '2026-08-01', type: 'party' })
    expect(badType.status).toBe(400)
  })

  it('404s updating/deleting a nonexistent event', async () => {
    const cookie = await createApprovedAdmin()

    const updateRes = await request(app)
      .put('/api/admin/events/999999')
      .set('Cookie', cookie)
      .send({ title: 'X', date: '2026-08-01', type: 'match' })
    expect(updateRes.status).toBe(404)

    const deleteRes = await request(app).delete('/api/admin/events/999999').set('Cookie', cookie)
    expect(deleteRes.status).toBe(404)
  })
})

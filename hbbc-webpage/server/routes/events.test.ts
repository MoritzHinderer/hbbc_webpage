import { describe, expect, it } from 'vitest'
import path from 'node:path'
import request from 'supertest'
import { app } from '../app.js'
import { db } from '../db.js'
import { contentDir, writeCollection } from '../content-store.js'

// Members-only "Fanclub-Termine" — mounted with requireAuth in app.ts,
// unlike the public /api/vfb-matches schedule.
const eventsFile = path.join(contentDir, 'events.json')

async function createApprovedMember() {
  const email = `events-test-${Date.now()}-${Math.random().toString(36).slice(2)}@example.test`
  await request(app).post('/api/auth/register').send({ name: 'Member', email, password: 'MemberPassword123!' })
  db.prepare("UPDATE users SET status = 'approved' WHERE email = ?").run(email)
  const loginRes = await request(app).post('/api/auth/login').send({ email, password: 'MemberPassword123!' })
  return loginRes.headers['set-cookie'][0].split(';')[0]
}

describe('GET /api/events', () => {
  it('rejects an unauthenticated request', async () => {
    const res = await request(app).get('/api/events')
    expect(res.status).toBe(401)
  })

  it('returns the seeded events list for a logged-in member', async () => {
    await writeCollection(eventsFile, 'events', [
      { id: 1, title: 'Seed Event', date: '2026-08-01', type: 'match' },
    ])
    const cookie = await createApprovedMember()

    const res = await request(app).get('/api/events').set('Cookie', cookie)
    expect(res.status).toBe(200)
    expect(res.body.events).toHaveLength(1)
    expect(res.body.events[0]).toMatchObject({ id: 1, title: 'Seed Event' })
  })
})

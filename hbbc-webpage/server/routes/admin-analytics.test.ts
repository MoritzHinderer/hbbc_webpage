import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { app } from '../app.js'
import { db } from '../db.js'

async function createApprovedAdmin() {
  const email = `admin-analytics-test-${Date.now()}-${Math.random().toString(36).slice(2)}@example.test`
  await request(app).post('/api/auth/register').send({ name: 'Admin', email, password: 'AdminPassword123!' })
  db.prepare("UPDATE users SET status = 'approved', role = 'admin' WHERE email = ?").run(email)
  const loginRes = await request(app).post('/api/auth/login').send({ email, password: 'AdminPassword123!' })
  return loginRes.headers['set-cookie'][0].split(';')[0]
}

describe('admin auth guard', () => {
  it('rejects an unauthenticated request', async () => {
    const res = await request(app).get('/api/admin/analytics')
    expect(res.status).toBe(403)
  })
})

describe('GET /api/admin/analytics', () => {
  it('reflects recorded page views in totals and top paths', async () => {
    const cookie = await createApprovedAdmin()
    db.prepare('DELETE FROM page_views').run()
    db.prepare("INSERT INTO page_views (path) VALUES ('/__analytics-test'), ('/__analytics-test'), ('/other')").run()

    const res = await request(app).get('/api/admin/analytics').set('Cookie', cookie)
    expect(res.status).toBe(200)
    expect(res.body.totalPageViews).toBe(3)
    expect(res.body.last7Days).toHaveLength(7)
    expect(res.body.topPaths[0]).toEqual({ path: '/__analytics-test', count: 2 })
    expect(typeof res.body.totalUsers).toBe('number')
    expect(typeof res.body.newUsersLast7Days).toBe('number')
  })

  it('handles zero page views without error', async () => {
    const cookie = await createApprovedAdmin()
    db.prepare('DELETE FROM page_views').run()

    const res = await request(app).get('/api/admin/analytics').set('Cookie', cookie)
    expect(res.status).toBe(200)
    expect(res.body.totalPageViews).toBe(0)
    expect(res.body.topPaths).toEqual([])
    expect(res.body.last7Days.every((d: { count: number }) => d.count === 0)).toBe(true)
  })
})

import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { app } from '../app.js'
import { db } from '../db.js'

async function createApprovedAdmin() {
  const email = `admin-requests-test-${Date.now()}-${Math.random().toString(36).slice(2)}@example.test`
  await request(app).post('/api/auth/register').send({ name: 'Admin', email, password: 'AdminPassword123!' })
  db.prepare("UPDATE users SET status = 'approved', role = 'admin' WHERE email = ?").run(email)
  const loginRes = await request(app).post('/api/auth/login').send({ email, password: 'AdminPassword123!' })
  return loginRes.headers['set-cookie'][0].split(';')[0]
}

async function createPendingRequest(name = 'Pending Person') {
  const email = `pending-${Date.now()}-${Math.random().toString(36).slice(2)}@example.test`
  await request(app).post('/api/auth/register').send({ name, email, password: 'SomePassword123!' })
  return (db.prepare('SELECT id FROM users WHERE email = ?').get(email) as { id: number }).id
}

describe('admin auth guard', () => {
  it('rejects an unauthenticated request', async () => {
    const res = await request(app).get('/api/admin/requests')
    expect(res.status).toBe(403)
  })
})

describe('GET /api/admin/requests', () => {
  it('lists only pending requests', async () => {
    const cookie = await createApprovedAdmin()
    const id = await createPendingRequest()

    const res = await request(app).get('/api/admin/requests').set('Cookie', cookie)
    expect(res.status).toBe(200)
    expect(res.body.requests.some((r: { id: number }) => r.id === id)).toBe(true)
  })
})

describe('POST /api/admin/requests/:id/approve', () => {
  it('auto-creates a fanclub member when none is provided', async () => {
    const cookie = await createApprovedAdmin()
    const id = await createPendingRequest('Auto Create Person')

    const res = await request(app).post(`/api/admin/requests/${id}/approve`).set('Cookie', cookie).send({})
    expect(res.status).toBe(200)

    const user = db.prepare('SELECT status, fanclub_member_id FROM users WHERE id = ?').get(id) as {
      status: string
      fanclub_member_id: number | null
    }
    expect(user.status).toBe('approved')
    expect(user.fanclub_member_id).not.toBeNull()

    const fanclubMember = db
      .prepare('SELECT name FROM fanclub_members WHERE id = ?')
      .get(user.fanclub_member_id) as { name: string }
    expect(fanclubMember.name).toBe('Auto Create Person')
  })

  it('links to an existing fanclub member when one is provided', async () => {
    const cookie = await createApprovedAdmin()
    const id = await createPendingRequest()
    const fanclubMemberId = Number(
      db.prepare('INSERT INTO fanclub_members (name) VALUES (?)').run('Existing FM').lastInsertRowid,
    )

    const res = await request(app)
      .post(`/api/admin/requests/${id}/approve`)
      .set('Cookie', cookie)
      .send({ fanclub_member_id: fanclubMemberId })
    expect(res.status).toBe(200)

    const user = db.prepare('SELECT fanclub_member_id FROM users WHERE id = ?').get(id) as {
      fanclub_member_id: number
    }
    expect(user.fanclub_member_id).toBe(fanclubMemberId)
  })

  it('rejects linking a fanclub member already linked to another account', async () => {
    const cookie = await createApprovedAdmin()
    const firstId = await createPendingRequest()
    const secondId = await createPendingRequest()
    const fanclubMemberId = Number(
      db.prepare('INSERT INTO fanclub_members (name) VALUES (?)').run('Contested FM').lastInsertRowid,
    )

    const first = await request(app)
      .post(`/api/admin/requests/${firstId}/approve`)
      .set('Cookie', cookie)
      .send({ fanclub_member_id: fanclubMemberId })
    expect(first.status).toBe(200)

    const second = await request(app)
      .post(`/api/admin/requests/${secondId}/approve`)
      .set('Cookie', cookie)
      .send({ fanclub_member_id: fanclubMemberId })
    expect(second.status).toBe(409)
  })

  it('404s approving an already-approved (non-pending) request', async () => {
    const cookie = await createApprovedAdmin()
    const id = await createPendingRequest()
    await request(app).post(`/api/admin/requests/${id}/approve`).set('Cookie', cookie).send({})

    const second = await request(app).post(`/api/admin/requests/${id}/approve`).set('Cookie', cookie).send({})
    expect(second.status).toBe(404)
  })
})

describe('POST /api/admin/requests/:id/reject', () => {
  it('rejects a pending request', async () => {
    const cookie = await createApprovedAdmin()
    const id = await createPendingRequest()

    const res = await request(app).post(`/api/admin/requests/${id}/reject`).set('Cookie', cookie)
    expect(res.status).toBe(200)
    const user = db.prepare('SELECT status FROM users WHERE id = ?').get(id) as { status: string }
    expect(user.status).toBe('rejected')
  })

  it('404s rejecting an already-processed request', async () => {
    const cookie = await createApprovedAdmin()
    const id = await createPendingRequest()
    await request(app).post(`/api/admin/requests/${id}/reject`).set('Cookie', cookie)

    const second = await request(app).post(`/api/admin/requests/${id}/reject`).set('Cookie', cookie)
    expect(second.status).toBe(404)
  })
})

import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { app } from '../app.js'
import { db } from '../db.js'

async function createApprovedAdmin() {
  const email = `admin-users-test-${Date.now()}-${Math.random().toString(36).slice(2)}@example.test`
  await request(app).post('/api/auth/register').send({ name: 'Admin', email, password: 'AdminPassword123!' })
  db.prepare("UPDATE users SET status = 'approved', role = 'admin' WHERE email = ?").run(email)
  const loginRes = await request(app).post('/api/auth/login').send({ email, password: 'AdminPassword123!' })
  const id = (db.prepare('SELECT id FROM users WHERE email = ?').get(email) as { id: number }).id
  return { cookie: loginRes.headers['set-cookie'][0].split(';')[0] as string, id, email }
}

async function createApprovedMember() {
  const email = `member-test-${Date.now()}-${Math.random().toString(36).slice(2)}@example.test`
  await request(app).post('/api/auth/register').send({ name: 'Member', email, password: 'MemberPassword123!' })
  db.prepare("UPDATE users SET status = 'approved' WHERE email = ?").run(email)
  return (db.prepare('SELECT id FROM users WHERE email = ?').get(email) as { id: number }).id
}

describe('admin auth guard', () => {
  it('rejects an unauthenticated request', async () => {
    const res = await request(app).get('/api/admin/users')
    expect(res.status).toBe(403)
  })
})

describe('GET /api/admin/users', () => {
  it('lists users including the admin itself', async () => {
    const { cookie, id } = await createApprovedAdmin()
    const res = await request(app).get('/api/admin/users').set('Cookie', cookie)
    expect(res.status).toBe(200)
    expect(res.body.users.some((u: { id: number }) => u.id === id)).toBe(true)
  })
})

describe('PUT /api/admin/users/:id', () => {
  it('changes a member to admin', async () => {
    const { cookie } = await createApprovedAdmin()
    const memberId = await createApprovedMember()

    const res = await request(app).put(`/api/admin/users/${memberId}`).set('Cookie', cookie).send({ role: 'admin' })
    expect(res.status).toBe(200)

    const row = db.prepare('SELECT role FROM users WHERE id = ?').get(memberId) as { role: string }
    expect(row.role).toBe('admin')
  })

  it('rejects an invalid role', async () => {
    const { cookie } = await createApprovedAdmin()
    const memberId = await createApprovedMember()
    const res = await request(app)
      .put(`/api/admin/users/${memberId}`)
      .set('Cookie', cookie)
      .send({ role: 'superadmin' })
    expect(res.status).toBe(400)
  })

  it('blocks an admin from editing their own account', async () => {
    const { cookie, id } = await createApprovedAdmin()
    const res = await request(app).put(`/api/admin/users/${id}`).set('Cookie', cookie).send({ role: 'member' })
    expect(res.status).toBe(400)
  })

  it('404s for a nonexistent user', async () => {
    const { cookie } = await createApprovedAdmin()
    const res = await request(app).put('/api/admin/users/999999').set('Cookie', cookie).send({ role: 'admin' })
    expect(res.status).toBe(404)
  })
})

describe('DELETE /api/admin/users/:id', () => {
  it('deletes a user and their session', async () => {
    const { cookie } = await createApprovedAdmin()
    const memberId = await createApprovedMember()

    const res = await request(app).delete(`/api/admin/users/${memberId}`).set('Cookie', cookie)
    expect(res.status).toBe(200)
    expect(db.prepare('SELECT id FROM users WHERE id = ?').get(memberId)).toBeUndefined()
  })

  it('cascades: deletes the linked fanclub member along with the account', async () => {
    const { cookie } = await createApprovedAdmin()
    const memberId = await createApprovedMember()
    const fanclubMemberId = Number(
      db.prepare('INSERT INTO fanclub_members (name) VALUES (?)').run('Cascade Test').lastInsertRowid,
    )
    db.prepare('UPDATE users SET fanclub_member_id = ? WHERE id = ?').run(fanclubMemberId, memberId)

    const res = await request(app).delete(`/api/admin/users/${memberId}`).set('Cookie', cookie)
    expect(res.status).toBe(200)
    expect(db.prepare('SELECT id FROM fanclub_members WHERE id = ?').get(fanclubMemberId)).toBeUndefined()
  })

  it('blocks an admin from deleting their own account', async () => {
    const { cookie, id } = await createApprovedAdmin()
    const res = await request(app).delete(`/api/admin/users/${id}`).set('Cookie', cookie)
    expect(res.status).toBe(400)
  })

  it('404s for a nonexistent user', async () => {
    const { cookie } = await createApprovedAdmin()
    const res = await request(app).delete('/api/admin/users/999999').set('Cookie', cookie)
    expect(res.status).toBe(404)
  })
})

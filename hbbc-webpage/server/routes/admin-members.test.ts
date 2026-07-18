import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { app } from '../app.js'
import { db } from '../db.js'

async function createApprovedAdmin() {
  const email = `admin-members-test-${Date.now()}-${Math.random().toString(36).slice(2)}@example.test`
  await request(app).post('/api/auth/register').send({ name: 'Admin', email, password: 'AdminPassword123!' })
  db.prepare("UPDATE users SET status = 'approved', role = 'admin' WHERE email = ?").run(email)
  const loginRes = await request(app).post('/api/auth/login').send({ email, password: 'AdminPassword123!' })
  return loginRes.headers['set-cookie'][0].split(';')[0]
}

function createFanclubMember(name: string) {
  return Number(db.prepare('INSERT INTO fanclub_members (name) VALUES (?)').run(name).lastInsertRowid)
}

describe('admin auth guard', () => {
  it('rejects an unauthenticated request', async () => {
    const res = await request(app).get('/api/admin/members')
    expect(res.status).toBe(403)
  })
})

describe('member card CRUD', () => {
  it('creates (linked to a fanclub member), lists, updates, and deletes a card', async () => {
    const cookie = await createApprovedAdmin()
    const fanclubMemberId = createFanclubMember('Card Test FM')

    const createRes = await request(app)
      .post('/api/admin/members')
      .set('Cookie', cookie)
      .field('name', 'Card Test FM')
      .field('role', 'Mitglied')
      .field('joined', '2026-01-01')
      .field('about_me', 'Test bio')
      .field('fanclub_member_id', String(fanclubMemberId))
    expect(createRes.status).toBe(200)
    const id = createRes.body.member.id as number
    expect(createRes.body.member.fanclub_member_id).toBe(fanclubMemberId)

    const listRes = await request(app).get('/api/admin/members').set('Cookie', cookie)
    expect(listRes.body.members.some((m: { id: number }) => m.id === id)).toBe(true)

    const updateRes = await request(app)
      .put(`/api/admin/members/${id}`)
      .set('Cookie', cookie)
      .field('name', 'Updated Name')
      .field('role', 'Updated Role')
      .field('joined', '2026-01-01')
      .field('about_me', 'Updated bio')
    expect(updateRes.status).toBe(200)
    expect(updateRes.body.member.name).toBe('Updated Name')
    // The fanclub member link is set at creation and never editable.
    expect(updateRes.body.member.fanclub_member_id).toBe(fanclubMemberId)

    const deleteRes = await request(app).delete(`/api/admin/members/${id}`).set('Cookie', cookie)
    expect(deleteRes.status).toBe(200)

    const listAfter = await request(app).get('/api/admin/members').set('Cookie', cookie)
    expect(listAfter.body.members.some((m: { id: number }) => m.id === id)).toBe(false)
  })

  it('rejects creating a card for a nonexistent fanclub member', async () => {
    const cookie = await createApprovedAdmin()
    const res = await request(app)
      .post('/api/admin/members')
      .set('Cookie', cookie)
      .field('name', 'X')
      .field('role', 'Y')
      .field('joined', '2026-01-01')
      .field('about_me', 'Z')
      .field('fanclub_member_id', '999999')
    expect(res.status).toBe(404)
  })

  it('rejects a second card for a fanclub member that already has one', async () => {
    const cookie = await createApprovedAdmin()
    const fanclubMemberId = createFanclubMember('Duplicate Card FM')

    const first = await request(app)
      .post('/api/admin/members')
      .set('Cookie', cookie)
      .field('name', 'First Card')
      .field('role', 'Y')
      .field('joined', '2026-01-01')
      .field('about_me', 'Z')
      .field('fanclub_member_id', String(fanclubMemberId))
    expect(first.status).toBe(200)

    const second = await request(app)
      .post('/api/admin/members')
      .set('Cookie', cookie)
      .field('name', 'Second Card')
      .field('role', 'Y')
      .field('joined', '2026-01-01')
      .field('about_me', 'Z')
      .field('fanclub_member_id', String(fanclubMemberId))
    expect(second.status).toBe(409)
  })

  it('rejects missing required fields', async () => {
    const cookie = await createApprovedAdmin()
    const res = await request(app).post('/api/admin/members').set('Cookie', cookie).field('name', 'Incomplete')
    expect(res.status).toBe(400)
  })

  it('404s updating/deleting a nonexistent card', async () => {
    const cookie = await createApprovedAdmin()
    const updateRes = await request(app)
      .put('/api/admin/members/999999')
      .set('Cookie', cookie)
      .field('name', 'X')
      .field('role', 'Y')
      .field('joined', '2026-01-01')
      .field('about_me', 'Z')
    expect(updateRes.status).toBe(404)

    const deleteRes = await request(app).delete('/api/admin/members/999999').set('Cookie', cookie)
    expect(deleteRes.status).toBe(404)
  })
})

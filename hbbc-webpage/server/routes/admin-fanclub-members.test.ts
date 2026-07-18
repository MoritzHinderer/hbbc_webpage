import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { app } from '../app.js'
import { db } from '../db.js'

// Deliberately only exercises the fanclub_members SQLite CRUD (create/
// update/delete/export), never the member-card endpoints — those write to
// the real server/content/members.json on disk, which isn't isolated by
// DB_PATH and must never be touched by an automated test run.

async function createApprovedAdmin() {
  const email = `admin-test-${Date.now()}-${Math.random().toString(36).slice(2)}@example.test`
  await request(app).post('/api/auth/register').send({ name: 'Admin Test', email, password: 'AdminPassword123!' })
  db.prepare("UPDATE users SET status = 'approved', role = 'admin' WHERE email = ?").run(email)
  const loginRes = await request(app).post('/api/auth/login').send({ email, password: 'AdminPassword123!' })
  const cookie = loginRes.headers['set-cookie'][0].split(';')[0]
  return { email, cookie }
}

describe('admin auth guard', () => {
  it('rejects an unauthenticated request', async () => {
    const res = await request(app).get('/api/admin/fanclub-members')
    expect(res.status).toBe(403)
  })

  it('rejects a non-admin (member) request', async () => {
    const email = `member-test-${Date.now()}@example.test`
    await request(app).post('/api/auth/register').send({ name: 'Member', email, password: 'MemberPassword123!' })
    db.prepare("UPDATE users SET status = 'approved' WHERE email = ?").run(email)
    const loginRes = await request(app).post('/api/auth/login').send({ email, password: 'MemberPassword123!' })
    const cookie = loginRes.headers['set-cookie'][0].split(';')[0]

    const res = await request(app).get('/api/admin/fanclub-members').set('Cookie', cookie)
    expect(res.status).toBe(403)
  })
})

describe('fanclub member CRUD', () => {
  it('creates, lists, updates, and deletes a fanclub member', async () => {
    const { cookie } = await createApprovedAdmin()
    const name = `CRUD Test Member ${Date.now()}`

    const createRes = await request(app)
      .post('/api/admin/fanclub-members')
      .set('Cookie', cookie)
      .send({ name, email: 'crud-test@example.test', joined_date: '2026-01-01', notes: 'created by test' })
    expect(createRes.status).toBe(200)
    const id = createRes.body.fanclubMember.id as number

    const listRes = await request(app).get('/api/admin/fanclub-members').set('Cookie', cookie)
    expect(listRes.status).toBe(200)
    expect(listRes.body.fanclubMembers.some((m: { id: number }) => m.id === id)).toBe(true)

    const updateRes = await request(app)
      .put(`/api/admin/fanclub-members/${id}`)
      .set('Cookie', cookie)
      .send({ name: `${name} (updated)`, joined_date: '2026-01-01' })
    expect(updateRes.status).toBe(200)
    expect(updateRes.body.fanclubMember.name).toBe(`${name} (updated)`)

    const deleteRes = await request(app).delete(`/api/admin/fanclub-members/${id}`).set('Cookie', cookie)
    expect(deleteRes.status).toBe(200)

    const listAfter = await request(app).get('/api/admin/fanclub-members').set('Cookie', cookie)
    expect(listAfter.body.fanclubMembers.some((m: { id: number }) => m.id === id)).toBe(false)
  })

  it('rejects creating without a name', async () => {
    const { cookie } = await createApprovedAdmin()
    const res = await request(app).post('/api/admin/fanclub-members').set('Cookie', cookie).send({})
    expect(res.status).toBe(400)
  })

  it('blocks deleting a fanclub member with a linked account (409)', async () => {
    const { cookie, email } = await createApprovedAdmin()
    const userId = (db.prepare('SELECT id FROM users WHERE email = ?').get(email) as { id: number }).id

    // Registration alone doesn't create/link a fanclub member (only the
    // account-approval endpoint or the startup migration does, neither of
    // which runs in this test) — set up the link directly to exercise the
    // delete guard in isolation.
    const fanclubMemberId = Number(
      db.prepare('INSERT INTO fanclub_members (name) VALUES (?)').run('Linked Account Test').lastInsertRowid,
    )
    db.prepare('UPDATE users SET fanclub_member_id = ? WHERE id = ?').run(fanclubMemberId, userId)

    const res = await request(app).delete(`/api/admin/fanclub-members/${fanclubMemberId}`).set('Cookie', cookie)
    expect(res.status).toBe(409)
  })
})

describe('GET /api/admin/fanclub-members/export.csv', () => {
  it('rejects a non-admin request', async () => {
    const res = await request(app).get('/api/admin/fanclub-members/export.csv')
    expect(res.status).toBe(403)
  })

  it('returns a CSV with the right headers and a banner line', async () => {
    const { cookie } = await createApprovedAdmin()
    const name = `Export Test Member ${Date.now()}`
    await request(app)
      .post('/api/admin/fanclub-members')
      .set('Cookie', cookie)
      .send({ name, joined_date: '2026-01-01' })

    const res = await request(app).get('/api/admin/fanclub-members/export.csv').set('Cookie', cookie)
    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toContain('text/csv')
    expect(res.headers['content-disposition']).toContain('attachment')
    expect(res.text).toContain('HBBC Fanclub-Mitglieder')
    expect(res.text).toContain('Name,E-Mail,Mitglied seit,Notizen')
    expect(res.text).toContain(name)
  })
})

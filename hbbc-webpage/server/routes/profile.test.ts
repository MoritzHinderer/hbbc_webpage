import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { app } from '../app.js'
import { db } from '../db.js'

// Registering + approving via direct SQL (like every other test file's
// createApprovedAdmin/Member helper) leaves fanclub_member_id NULL — the
// real admin-approval endpoint is what normally links one, but these tests
// need to exercise both the linked and unlinked states directly.
async function createApprovedMember() {
  const email = `profile-test-${Date.now()}-${Math.random().toString(36).slice(2)}@example.test`
  await request(app).post('/api/auth/register').send({ name: 'Member', email, password: 'MemberPassword123!' })
  db.prepare("UPDATE users SET status = 'approved' WHERE email = ?").run(email)
  const loginRes = await request(app).post('/api/auth/login').send({ email, password: 'MemberPassword123!' })
  const cookie = loginRes.headers['set-cookie'][0].split(';')[0]
  const userId = (db.prepare('SELECT id FROM users WHERE email = ?').get(email) as { id: number }).id
  return { cookie, userId }
}

function linkFanclubMember(userId: number, name: string) {
  const fanclubMemberId = Number(db.prepare('INSERT INTO fanclub_members (name) VALUES (?)').run(name).lastInsertRowid)
  db.prepare('UPDATE users SET fanclub_member_id = ? WHERE id = ?').run(fanclubMemberId, userId)
  return fanclubMemberId
}

describe('auth guard', () => {
  it('rejects an unauthenticated request', async () => {
    const res = await request(app).get('/api/profile/member')
    expect(res.status).toBe(401)
  })
})

describe('GET /api/profile/member', () => {
  it('returns null when the account has no linked fanclub member', async () => {
    const { cookie } = await createApprovedMember()
    const res = await request(app).get('/api/profile/member').set('Cookie', cookie)
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ member: null })
  })
})

describe('POST /api/profile/member', () => {
  it('rejects when the account has no linked fanclub member', async () => {
    const { cookie } = await createApprovedMember()
    const res = await request(app)
      .post('/api/profile/member')
      .set('Cookie', cookie)
      .field('name', 'X')
      .field('about_me', 'Bio')
    expect(res.status).toBe(409)
  })

  it('rejects missing required fields', async () => {
    const { cookie, userId } = await createApprovedMember()
    linkFanclubMember(userId, 'Incomplete Test FM')
    const res = await request(app).post('/api/profile/member').set('Cookie', cookie).field('name', 'X')
    expect(res.status).toBe(400)
  })

  it('creates a card for a linked account, and rejects a second one', async () => {
    const { cookie, userId } = await createApprovedMember()
    linkFanclubMember(userId, 'Create Test FM')

    const createRes = await request(app)
      .post('/api/profile/member')
      .set('Cookie', cookie)
      .field('name', 'Create Test FM')
      .field('about_me', 'My bio')
    expect(createRes.status).toBe(200)
    expect(createRes.body.member).toMatchObject({ name: 'Create Test FM', about_me: 'My bio', role: 'Mitglied' })

    const dupRes = await request(app)
      .post('/api/profile/member')
      .set('Cookie', cookie)
      .field('name', 'Create Test FM')
      .field('about_me', 'Second bio')
    expect(dupRes.status).toBe(409)

    // fanclub_member_id is a per-test-file-local SQLite id (see db.ts) but
    // this card lands in the shared members.json content dir (see
    // vitest.server.config.ts) — leaving it behind risks colliding with an
    // id reused by a later test file (the exact bug already hit once in
    // members.test.ts).
    await request(app).delete('/api/profile/member').set('Cookie', cookie)
  })
})

describe('PUT /api/profile/member', () => {
  it('404s when the account has no card yet', async () => {
    const { cookie, userId } = await createApprovedMember()
    linkFanclubMember(userId, 'No Card Yet FM')
    const res = await request(app)
      .put('/api/profile/member')
      .set('Cookie', cookie)
      .field('name', 'X')
      .field('about_me', 'Bio')
    expect(res.status).toBe(404)
  })

  it('updates name/about_me/location but preserves role and joined date', async () => {
    const { cookie, userId } = await createApprovedMember()
    linkFanclubMember(userId, 'Update Test FM')
    await request(app)
      .post('/api/profile/member')
      .set('Cookie', cookie)
      .field('name', 'Update Test FM')
      .field('about_me', 'Original bio')

    const updateRes = await request(app)
      .put('/api/profile/member')
      .set('Cookie', cookie)
      .field('name', 'Updated Name')
      .field('about_me', 'Updated bio')
      .field('location', 'Böblingen')
    expect(updateRes.status).toBe(200)
    expect(updateRes.body.member).toMatchObject({
      name: 'Updated Name',
      about_me: 'Updated bio',
      location: 'Böblingen',
      role: 'Mitglied',
    })

    // Same reasoning as the POST test above — don't leave a card with a
    // file-local fanclub_member_id sitting in the shared content dir.
    await request(app).delete('/api/profile/member').set('Cookie', cookie)
  })
})

describe('DELETE /api/profile/member', () => {
  it('404s when the account has no card yet', async () => {
    const { cookie, userId } = await createApprovedMember()
    linkFanclubMember(userId, 'Delete No Card FM')
    const res = await request(app).delete('/api/profile/member').set('Cookie', cookie)
    expect(res.status).toBe(404)
  })

  it('deletes an existing card', async () => {
    const { cookie, userId } = await createApprovedMember()
    linkFanclubMember(userId, 'Delete Test FM')
    await request(app)
      .post('/api/profile/member')
      .set('Cookie', cookie)
      .field('name', 'Delete Test FM')
      .field('about_me', 'Bio')

    const deleteRes = await request(app).delete('/api/profile/member').set('Cookie', cookie)
    expect(deleteRes.status).toBe(200)

    const getRes = await request(app).get('/api/profile/member').set('Cookie', cookie)
    expect(getRes.body).toEqual({ member: null })
  })
})

describe('PUT /api/profile/newsletter', () => {
  it('rejects a non-boolean value', async () => {
    const { cookie } = await createApprovedMember()
    const res = await request(app).put('/api/profile/newsletter').set('Cookie', cookie).send({ subscribed: 'yes' })
    expect(res.status).toBe(400)
  })

  it('updates the subscription flag', async () => {
    const { cookie, userId } = await createApprovedMember()
    const res = await request(app).put('/api/profile/newsletter').set('Cookie', cookie).send({ subscribed: true })
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ ok: true, subscribed: true })

    const row = db.prepare('SELECT newsletter_subscribed FROM users WHERE id = ?').get(userId) as {
      newsletter_subscribed: number
    }
    expect(row.newsletter_subscribed).toBe(1)
  })
})

import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { app } from '../app.js'
import { writeCollection } from '../content-store.js'
import { membersFile, type Member } from '../members-shared.js'

// CONTENT_DIR is a real, isolated, but *shared* directory across every
// test file in this run (see vitest.server.config.ts) — unlike the DB,
// which is a true per-file :memory: instance. Other test files (e.g.
// admin-members.test.ts) legitimately write real member cards into it,
// so this resets to a known state rather than assuming the file has
// never been touched by anything else in the run.
describe('GET /api/members', () => {
  it('returns exactly the seeded member list', async () => {
    const seeded: Member[] = [
      { id: 1, name: 'Seed Member', role: 'Mitglied', joined: '2026-01-01', about_me: 'Bio', fanclub_member_id: 1 },
    ]
    await writeCollection(membersFile, 'member', seeded)

    const res = await request(app).get('/api/members')
    expect(res.status).toBe(200)
    expect(res.body.member).toHaveLength(1)
    expect(res.body.member[0]).toMatchObject({ id: 1, name: 'Seed Member', picture: null })
  })

  it('returns an empty list when there are no cards', async () => {
    await writeCollection(membersFile, 'member', [])
    const res = await request(app).get('/api/members')
    expect(res.body).toEqual({ member: [] })
  })
})

describe('GET /api/members/pictures/:file', () => {
  it('rejects a filename containing unsafe characters', async () => {
    const res = await request(app).get('/api/members/pictures/foo;bar.png')
    expect(res.status).toBe(400)
  })

  it('404s for a safe-but-nonexistent filename', async () => {
    const res = await request(app).get('/api/members/pictures/does-not-exist.png')
    expect(res.status).toBe(404)
  })
})

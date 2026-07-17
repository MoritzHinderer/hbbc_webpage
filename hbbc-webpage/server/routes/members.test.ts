import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { app } from '../app.js'

// MEMBERS_FILE points at a nonexistent path during tests (see
// vitest.server.config.ts), so this always sees an empty list — real
// member card data (server/content/members.json) is never read or
// touched by this test file.
describe('GET /api/members', () => {
  it('returns an empty member list in the isolated test environment', async () => {
    const res = await request(app).get('/api/members')
    expect(res.status).toBe(200)
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

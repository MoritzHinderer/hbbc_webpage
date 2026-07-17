import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { app } from '../app.js'

// news.ts reads server/content/news.json directly (no test-isolation env
// override, unlike members.ts) — this only ever GETs it, never writes, so
// real content is safe to read but not something to assert exact values
// against.
describe('GET /api/news', () => {
  it('returns an array of articles, newest first', async () => {
    const res = await request(app).get('/api/news')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.news)).toBe(true)

    const dates = res.body.news.map((a: { createdAt: string }) => new Date(a.createdAt).getTime())
    const sorted = [...dates].sort((a, b) => b - a)
    expect(dates).toEqual(sorted)
  })
})

describe('GET /api/news/photos/:file', () => {
  it('rejects a filename containing unsafe characters', async () => {
    const res = await request(app).get('/api/news/photos/foo;bar.png')
    expect(res.status).toBe(400)
  })

  it('404s for a safe-but-nonexistent filename', async () => {
    const res = await request(app).get('/api/news/photos/does-not-exist.png')
    expect(res.status).toBe(404)
  })
})

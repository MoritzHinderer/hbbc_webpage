import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { app } from '../app.js'
import { db } from '../db.js'

describe('POST /api/analytics/pageview', () => {
  it('records a valid path and returns 204', async () => {
    db.prepare("DELETE FROM page_views WHERE path = '/__test-path'").run()

    const res = await request(app).post('/api/analytics/pageview').send({ path: '/__test-path' })
    expect(res.status).toBe(204)

    const row = db.prepare("SELECT COUNT(*) as c FROM page_views WHERE path = '/__test-path'").get() as {
      c: number
    }
    expect(row.c).toBe(1)
  })

  it('rejects a path that does not start with /', async () => {
    const res = await request(app).post('/api/analytics/pageview').send({ path: 'not-a-path' })
    expect(res.status).toBe(400)
  })

  it('rejects a missing path', async () => {
    const res = await request(app).post('/api/analytics/pageview').send({})
    expect(res.status).toBe(400)
  })

  it('rejects an overly long path', async () => {
    const res = await request(app)
      .post('/api/analytics/pageview')
      .send({ path: '/' + 'a'.repeat(200) })
    expect(res.status).toBe(400)
  })
})

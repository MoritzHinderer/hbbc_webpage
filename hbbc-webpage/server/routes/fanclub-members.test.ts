import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { app } from '../app.js'
import { db } from '../db.js'

describe('GET /api/fanclub-members/count', () => {
  it('returns the exact row count, no PII', async () => {
    db.prepare('DELETE FROM fanclub_members').run()
    db.prepare('INSERT INTO fanclub_members (name) VALUES (?), (?), (?)').run('A', 'B', 'C')

    const res = await request(app).get('/api/fanclub-members/count')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ count: 3 })
    expect(res.text).not.toContain('A')
  })
})

describe('GET /api/fanclub-members/growth', () => {
  it('returns 6 cumulative monthly counts, most recent month last', async () => {
    db.prepare('DELETE FROM fanclub_members').run()

    const today = new Date()
    const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 5, 15)
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1)

    db.prepare('INSERT INTO fanclub_members (name, joined_date) VALUES (?, ?)').run(
      'Old Member',
      sixMonthsAgo.toISOString().slice(0, 10),
    )
    db.prepare('INSERT INTO fanclub_members (name, joined_date) VALUES (?, ?)').run(
      'New Member',
      thisMonth.toISOString().slice(0, 10),
    )

    const res = await request(app).get('/api/fanclub-members/growth')
    expect(res.status).toBe(200)
    expect(res.body.counts).toHaveLength(6)
    // Cumulative: the oldest member counts from month 0 onward, so every
    // bucket is >= 1; the newest only counts in the final (current) bucket.
    expect(res.body.counts[0]).toBe(1)
    expect(res.body.counts[5]).toBe(2)
    // Monotonically non-decreasing, since it's a cumulative count.
    for (let i = 1; i < 6; i++) {
      expect(res.body.counts[i]).toBeGreaterThanOrEqual(res.body.counts[i - 1])
    }
  })

  it('returns all zeros when there are no fanclub members', async () => {
    db.prepare('DELETE FROM fanclub_members').run()
    const res = await request(app).get('/api/fanclub-members/growth')
    expect(res.body.counts).toEqual([0, 0, 0, 0, 0, 0])
  })
})

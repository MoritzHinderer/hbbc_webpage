import { Router } from 'express'
import { db } from '../db.js'

const router = Router()

// Public, count only — no names/emails exposed. Used by the home page's
// Mitglieder counter, replacing a static-file fetch that both leaked full
// member card data just to read its length and had the same production
// staleness bug already fixed for /api/members.
router.get('/count', (_req, res) => {
  const { count } = db.prepare('SELECT COUNT(*) as count FROM fanclub_members').get() as { count: number }
  res.json({ count })
})

// Public, aggregate-only — six cumulative monthly counts, no join dates or
// any other per-member data exposed. Used by the Members page growth
// chart (previously plotted member *card* growth, which drifted from
// "how many fanclub members are there" once that became its own concept).
router.get('/growth', (_req, res) => {
  const rows = db.prepare('SELECT joined_date FROM fanclub_members').all() as { joined_date: string }[]
  const joinDates = rows.map((r) => new Date(r.joined_date))

  const counts: number[] = []
  const today = new Date()
  for (let i = 5; i >= 0; i--) {
    const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1)
    const monthEndDate = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0, 23, 59, 59)
    counts.push(joinDates.filter((d) => d <= monthEndDate).length)
  }

  res.json({ counts })
})

export default router

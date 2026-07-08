import { Router } from 'express'
import { db } from '../db.js'

const router = Router()

router.get('/', (_req, res) => {
  const totalPageViews = (db.prepare('SELECT COUNT(*) as count FROM page_views').get() as { count: number }).count

  const dailyRows = db
    .prepare(
      `SELECT date(created_at) as day, COUNT(*) as count
       FROM page_views
       WHERE created_at >= datetime('now', '-6 days', 'start of day')
       GROUP BY day`,
    )
    .all() as { day: string; count: number }[]
  const countByDay = new Map(dailyRows.map((row) => [row.day, row.count]))

  const last7Days: { date: string; count: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    last7Days.push({ date: key, count: countByDay.get(key) ?? 0 })
  }

  const topPaths = db
    .prepare('SELECT path, COUNT(*) as count FROM page_views GROUP BY path ORDER BY count DESC LIMIT 8')
    .all() as { path: string; count: number }[]

  const totalUsers = (db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }).count
  const newUsersLast7Days = (
    db.prepare(`SELECT COUNT(*) as count FROM users WHERE created_at >= datetime('now', '-7 days')`).get() as {
      count: number
    }
  ).count

  res.json({ totalPageViews, last7Days, topPaths, totalUsers, newUsersLast7Days })
})

export default router

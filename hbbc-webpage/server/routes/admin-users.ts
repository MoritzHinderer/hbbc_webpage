import { Router } from 'express'
import { db } from '../db.js'
import { readCollection, writeCollection } from '../content-store.js'
import { membersFile, type Member } from '../members-shared.js'

const router = Router()

const VALID_ROLES = ['member', 'admin']
const VALID_STATUSES = ['pending', 'approved', 'rejected']

router.get('/', async (_req, res) => {
  const users = db
    .prepare(
      'SELECT id, name, email, role, status, created_at, newsletter_subscribed FROM users ORDER BY created_at DESC',
    )
    .all() as { id: number; newsletter_subscribed: number }[]

  const members = await readCollection<Member>(membersFile, 'member')
  const memberIdByUserId = new Map(members.filter((m) => m.user_id != null).map((m) => [m.user_id, m.id]))

  res.json({
    users: users.map((user) => ({
      ...user,
      newsletter_subscribed: Boolean(user.newsletter_subscribed),
      memberCardId: memberIdByUserId.get(user.id) ?? null,
    })),
  })
})

router.put('/:id', (req, res) => {
  const id = Number(req.params.id)
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: 'Ungültige Nutzer-ID.' })
    return
  }

  // An admin editing their own role/status here could lock themselves out
  // with no easy way back in (short of the create-admin CLI) — block it.
  if (req.user?.id === id) {
    res.status(400).json({ error: 'Du kannst dein eigenes Konto hier nicht bearbeiten.' })
    return
  }

  const { role, status } = req.body ?? {}
  if (!VALID_ROLES.includes(role)) {
    res.status(400).json({ error: 'Ungültige Rolle.' })
    return
  }
  if (!VALID_STATUSES.includes(status)) {
    res.status(400).json({ error: 'Ungültiger Status.' })
    return
  }

  const result = db.prepare('UPDATE users SET role = ?, status = ? WHERE id = ?').run(role, status, id)
  if (result.changes === 0) {
    res.status(404).json({ error: 'Nutzer nicht gefunden.' })
    return
  }

  res.json({ ok: true })
})

router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id)
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: 'Ungültige Nutzer-ID.' })
    return
  }

  if (req.user?.id === id) {
    res.status(400).json({ error: 'Du kannst dein eigenes Konto hier nicht löschen.' })
    return
  }

  // A member card belonging to this user survives — it's public content,
  // it shouldn't vanish just because the login was removed. Only the link
  // is cleared; the admin can separately delete the card if that's wanted.
  const members = await readCollection<Member>(membersFile, 'member')
  const linkedIndex = members.findIndex((m) => m.user_id === id)
  if (linkedIndex !== -1) {
    members[linkedIndex] = { ...members[linkedIndex], user_id: null }
    await writeCollection(membersFile, 'member', members)
  }

  db.prepare('DELETE FROM sessions WHERE user_id = ?').run(id)
  const result = db.prepare('DELETE FROM users WHERE id = ?').run(id)
  if (result.changes === 0) {
    res.status(404).json({ error: 'Nutzer nicht gefunden.' })
    return
  }

  res.json({ ok: true })
})

export default router

import { Router } from 'express'
import { db } from '../db.js'
import { readCollection, writeCollection } from '../content-store.js'
import { membersFile, deleteExistingPicture, type Member } from '../members-shared.js'

const router = Router()

const VALID_ROLES = ['member', 'admin']

router.get('/', async (_req, res) => {
  const users = db
    .prepare(
      'SELECT id, name, email, role, status, created_at, newsletter_subscribed, fanclub_member_id FROM users ORDER BY created_at DESC',
    )
    .all() as { id: number; newsletter_subscribed: number; fanclub_member_id: number | null }[]

  const members = await readCollection<Member>(membersFile, 'member')
  const cardIdByFanclubMemberId = new Map(members.map((m) => [m.fanclub_member_id, m.id]))

  res.json({
    users: users.map((user) => ({
      ...user,
      newsletter_subscribed: Boolean(user.newsletter_subscribed),
      memberCardId: user.fanclub_member_id != null ? (cardIdByFanclubMemberId.get(user.fanclub_member_id) ?? null) : null,
    })),
  })
})

router.put('/:id', (req, res) => {
  const id = Number(req.params.id)
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: 'Ungültige Nutzer-ID.' })
    return
  }

  // An admin editing their own role here could lock themselves out with no
  // easy way back in (short of the create-admin CLI) — block it.
  if (req.user?.id === id) {
    res.status(400).json({ error: 'Du kannst dein eigenes Konto hier nicht bearbeiten.' })
    return
  }

  // Status isn't editable through this route — it's set by /requests/:id/approve|reject
  // (pending → approved/rejected) and is otherwise final; removing the account
  // entirely (DELETE below) is the only way to undo an approval.
  const { role } = req.body ?? {}
  if (!VALID_ROLES.includes(role)) {
    res.status(400).json({ error: 'Ungültige Rolle.' })
    return
  }

  const result = db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, id)
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

  const user = db.prepare('SELECT fanclub_member_id FROM users WHERE id = ?').get(id) as
    | { fanclub_member_id: number | null }
    | undefined
  if (!user) {
    res.status(404).json({ error: 'Nutzer nicht gefunden.' })
    return
  }

  // Deleting an account cascades: the linked fanclub member (and its
  // card, if any) go with it, so the admin doesn't have to clean up
  // orphaned references by hand afterward. The frontend warns about this
  // before calling here.
  if (user.fanclub_member_id != null) {
    const members = await readCollection<Member>(membersFile, 'member')
    const cardIndex = members.findIndex((m) => m.fanclub_member_id === user.fanclub_member_id)
    if (cardIndex !== -1) {
      const [removedCard] = members.splice(cardIndex, 1)
      await deleteExistingPicture(removedCard.name)
      await writeCollection(membersFile, 'member', members)
    }
  }

  // The user row must go before its fanclub member — users.fanclub_member_id
  // references fanclub_members(id), so deleting that row first trips the FK
  // constraint while the account still points at it.
  db.prepare('DELETE FROM sessions WHERE user_id = ?').run(id)
  db.prepare('DELETE FROM users WHERE id = ?').run(id)

  if (user.fanclub_member_id != null) {
    db.prepare('DELETE FROM fanclub_members WHERE id = ?').run(user.fanclub_member_id)
  }

  res.json({ ok: true })
})

export default router

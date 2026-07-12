import { Router } from 'express'
import { db } from '../db.js'
import { readCollection } from '../content-store.js'
import { membersFile, type Member } from '../members-shared.js'
import { isNonEmptyString, isValidEmail } from '../validation.js'

const router = Router()

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

interface FanclubMemberRow {
  id: number
  name: string
  email: string | null
  joined_date: string
  notes: string | null
  created_at: string
}

function validateInput(body: Record<string, unknown>): string | null {
  const { name, email, joined_date, notes } = body
  if (!isNonEmptyString(name, 100)) return 'Bitte einen Namen angeben.'
  if (email !== undefined && email !== null && email !== '' && !isValidEmail(email)) {
    return 'Ungültige E-Mail-Adresse.'
  }
  if (joined_date !== undefined && joined_date !== null && joined_date !== '' && (typeof joined_date !== 'string' || !DATE_RE.test(joined_date))) {
    return 'Ungültiges Datum (YYYY-MM-DD).'
  }
  if (notes !== undefined && notes !== null && notes !== '' && !isNonEmptyString(notes, 1000)) {
    return 'Ungültige Notiz.'
  }
  return null
}

router.get('/', async (_req, res) => {
  const fanclubMembers = db.prepare('SELECT * FROM fanclub_members ORDER BY name').all() as unknown as FanclubMemberRow[]

  const accountRows = db
    .prepare('SELECT id, fanclub_member_id FROM users WHERE fanclub_member_id IS NOT NULL')
    .all() as { id: number; fanclub_member_id: number }[]
  const accountIdByFanclubMemberId = new Map(accountRows.map((r) => [r.fanclub_member_id, r.id]))

  const cards = await readCollection<Member>(membersFile, 'member')
  const cardIdByFanclubMemberId = new Map(cards.map((c) => [c.fanclub_member_id, c.id]))

  res.json({
    fanclubMembers: fanclubMembers.map((m) => ({
      ...m,
      linkedAccountId: accountIdByFanclubMemberId.get(m.id) ?? null,
      linkedCardId: cardIdByFanclubMemberId.get(m.id) ?? null,
    })),
  })
})

router.post('/', (req, res) => {
  const error = validateInput(req.body ?? {})
  if (error) {
    res.status(400).json({ error })
    return
  }

  const { name, email, joined_date, notes } = req.body

  const result = db
    .prepare('INSERT INTO fanclub_members (name, email, joined_date, notes) VALUES (?, ?, COALESCE(?, date(\'now\')), ?)')
    .run(name, email || null, joined_date || null, notes || null)

  const fanclubMember = db.prepare('SELECT * FROM fanclub_members WHERE id = ?').get(result.lastInsertRowid)
  res.json({ ok: true, fanclubMember })
})

router.put('/:id', (req, res) => {
  const id = Number(req.params.id)
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: 'Ungültige ID.' })
    return
  }

  const error = validateInput(req.body ?? {})
  if (error) {
    res.status(400).json({ error })
    return
  }

  const { name, email, joined_date, notes } = req.body

  const result = db
    .prepare('UPDATE fanclub_members SET name = ?, email = ?, joined_date = COALESCE(?, joined_date), notes = ? WHERE id = ?')
    .run(name, email || null, joined_date || null, notes || null, id)

  if (result.changes === 0) {
    res.status(404).json({ error: 'Fanclub-Mitglied nicht gefunden.' })
    return
  }

  const fanclubMember = db.prepare('SELECT * FROM fanclub_members WHERE id = ?').get(id)
  res.json({ ok: true, fanclubMember })
})

router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id)
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: 'Ungültige ID.' })
    return
  }

  const linkedAccount = db.prepare('SELECT id FROM users WHERE fanclub_member_id = ?').get(id)
  if (linkedAccount) {
    res.status(409).json({ error: 'Diesem Fanclub-Mitglied ist noch ein Nutzerkonto zugeordnet. Bitte zuerst entkoppeln.' })
    return
  }

  const cards = await readCollection<Member>(membersFile, 'member')
  const linkedCard = cards.find((c) => c.fanclub_member_id === id)
  if (linkedCard) {
    res.status(409).json({ error: 'Diesem Fanclub-Mitglied ist noch eine Mitgliederkarte zugeordnet. Bitte zuerst löschen.' })
    return
  }

  const result = db.prepare('DELETE FROM fanclub_members WHERE id = ?').run(id)
  if (result.changes === 0) {
    res.status(404).json({ error: 'Fanclub-Mitglied nicht gefunden.' })
    return
  }

  res.json({ ok: true })
})

export default router

import { db, type UserRow } from './db.js'
import { readCollection, writeCollection, type WithId } from './content-store.js'
import { membersFile } from './members-shared.js'

// The shape cards were in before this migration (still has the old
// user_id link) — kept local rather than imported from members-shared.ts,
// since that file's Member type has already moved on to fanclub_member_id.
interface LegacyMemberCard extends WithId {
  name: string
  user_id?: number | null
  fanclub_member_id?: number | null
  [key: string]: unknown
}

// One-time backfill for the new fanclub_members hub — idempotent (skips
// any user/card that already has a fanclub_member_id), so it's safe to
// call on every startup, local or on the VPS, and self-heals if a data
// restore ever reintroduces an unlinked row. Preserves every existing
// account<->card relationship exactly, just re-expressed through the new
// shared entity instead of the old direct user_id link on the card.
export async function migrateFanclubMembers(): Promise<void> {
  const usersNeedingFanclubMember = db
    .prepare('SELECT * FROM users WHERE fanclub_member_id IS NULL')
    .all() as unknown as UserRow[]

  const userIdToFanclubMemberId = new Map<number, number>()

  for (const user of usersNeedingFanclubMember) {
    const result = db
      .prepare('INSERT INTO fanclub_members (name, email, joined_date) VALUES (?, ?, date(?))')
      .run(user.name, user.email, user.created_at)
    const fanclubMemberId = Number(result.lastInsertRowid)
    db.prepare('UPDATE users SET fanclub_member_id = ? WHERE id = ?').run(fanclubMemberId, user.id)
    userIdToFanclubMemberId.set(user.id, fanclubMemberId)
  }

  if (usersNeedingFanclubMember.length > 0) {
    console.log(`[fanclub-member-migration] created ${usersNeedingFanclubMember.length} fanclub member(s) for existing accounts`)
  }

  const cards = await readCollection<LegacyMemberCard>(membersFile, 'member')
  let cardsChanged = false

  const migratedCards = cards.map((card) => {
    if (card.fanclub_member_id != null) return card // already migrated

    if (card.user_id != null) {
      // Reuse the fanclub member created (or already existing) for that
      // linked user, so the card and account converge on the same hub.
      let fanclubMemberId = userIdToFanclubMemberId.get(card.user_id)
      if (fanclubMemberId == null) {
        const user = db.prepare('SELECT fanclub_member_id FROM users WHERE id = ?').get(card.user_id) as
          | { fanclub_member_id: number | null }
          | undefined
        fanclubMemberId = user?.fanclub_member_id ?? undefined
      }
      if (fanclubMemberId == null) {
        // Linked user_id doesn't actually exist (stale reference) — fall
        // through to treating this card as standalone below.
      } else {
        cardsChanged = true
        const { user_id: _drop, ...rest } = card
        return { ...rest, fanclub_member_id: fanclubMemberId }
      }
    }

    // Standalone card — no linked account, create its own fanclub member.
    const result = db.prepare('INSERT INTO fanclub_members (name) VALUES (?)').run(card.name)
    cardsChanged = true
    const { user_id: _drop, ...rest } = card
    return { ...rest, fanclub_member_id: Number(result.lastInsertRowid) }
  })

  if (cardsChanged) {
    await writeCollection(membersFile, 'member', migratedCards)
    console.log(`[fanclub-member-migration] migrated ${migratedCards.length} member card(s) to fanclub_member_id`)
  }
}

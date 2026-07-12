import { Router } from 'express'
import { db } from '../db.js'
import { readCollection, writeCollection } from '../content-store.js'
import { memberPictureUpload } from '../uploads.js'
import { isNonEmptyString } from '../validation.js'
import { membersFile, applyPictureChange, deleteExistingPicture, findExistingPicture, type Member } from '../members-shared.js'

const router = Router()

const todayIso = () => new Date().toISOString().slice(0, 10)

router.get('/member', async (req, res) => {
  const fanclubMemberId = req.user!.fanclubMemberId
  const members = await readCollection<Member>(membersFile, 'member')
  const mine = fanclubMemberId != null ? members.find((m) => m.fanclub_member_id === fanclubMemberId) : undefined
  if (!mine) {
    res.json({ member: null })
    return
  }

  const picturePath = await findExistingPicture(mine.name)
  res.json({
    member: { ...mine, picture: picturePath ? `/api/members/pictures/${picturePath.split('/').pop()}` : null },
  })
})

router.post('/member', memberPictureUpload.single('picture'), async (req, res) => {
  const fanclubMemberId = req.user!.fanclubMemberId
  if (fanclubMemberId == null) {
    // Shouldn't happen for an approved account (every approve path sets
    // this), but guard rather than silently create an orphaned card.
    res.status(409).json({ error: 'Deinem Konto ist kein Fanclub-Mitglied zugeordnet. Bitte einen Admin kontaktieren.' })
    return
  }

  const { name, location, about_me } = req.body ?? {}

  if (!isNonEmptyString(name, 100) || !isNonEmptyString(about_me, 2000)) {
    res.status(400).json({ error: 'Bitte Name und Beschreibung angeben.' })
    return
  }

  const members = await readCollection<Member>(membersFile, 'member')
  if (members.some((m) => m.fanclub_member_id === fanclubMemberId)) {
    res.status(409).json({ error: 'Du hast bereits eine Mitgliederkarte.' })
    return
  }

  const nextId = Math.max(0, ...members.map((m) => m.id)) + 1
  const member: Member = {
    id: nextId,
    name,
    role: 'Mitglied',
    joined: todayIso(),
    about_me,
    ...(location ? { location } : {}),
    fanclub_member_id: fanclubMemberId,
  }

  await applyPictureChange({ newName: name, uploadedFile: req.file })

  members.push(member)
  await writeCollection(membersFile, 'member', members)
  res.json({ ok: true, member })
})

router.put('/member', memberPictureUpload.single('picture'), async (req, res) => {
  const fanclubMemberId = req.user!.fanclubMemberId
  const members = await readCollection<Member>(membersFile, 'member')
  const index = fanclubMemberId != null ? members.findIndex((m) => m.fanclub_member_id === fanclubMemberId) : -1
  if (index === -1) {
    res.status(404).json({ error: 'Du hast noch keine Mitgliederkarte.' })
    return
  }

  const existing = members[index]
  const { name, location, about_me, removePicture } = req.body ?? {}

  if (!isNonEmptyString(name, 100) || !isNonEmptyString(about_me, 2000)) {
    res.status(400).json({ error: 'Bitte Name und Beschreibung angeben.' })
    return
  }

  await applyPictureChange({
    newName: name,
    existingName: existing.name,
    uploadedFile: req.file,
    removePicture: removePicture === 'true' || removePicture === 'on',
  })

  // role/joined are admin-assigned — preserved regardless of what's posted.
  const updated: Member = { ...existing, name, about_me }
  if (location) {
    updated.location = location
  } else {
    delete updated.location
  }

  members[index] = updated
  await writeCollection(membersFile, 'member', members)
  res.json({ ok: true, member: updated })
})

router.delete('/member', async (req, res) => {
  const fanclubMemberId = req.user!.fanclubMemberId
  const members = await readCollection<Member>(membersFile, 'member')
  const index = fanclubMemberId != null ? members.findIndex((m) => m.fanclub_member_id === fanclubMemberId) : -1
  if (index === -1) {
    res.status(404).json({ error: 'Du hast noch keine Mitgliederkarte.' })
    return
  }

  const [removed] = members.splice(index, 1)
  await deleteExistingPicture(removed.name)
  await writeCollection(membersFile, 'member', members)
  res.json({ ok: true })
})

router.put('/newsletter', (req, res) => {
  const { subscribed } = req.body ?? {}
  if (typeof subscribed !== 'boolean') {
    res.status(400).json({ error: 'Ungültiger Wert.' })
    return
  }

  db.prepare('UPDATE users SET newsletter_subscribed = ? WHERE id = ?').run(subscribed ? 1 : 0, req.user!.id)
  res.json({ ok: true, subscribed })
})

export default router

import { Router } from 'express'
import { db } from '../db.js'
import { readCollection, writeCollection } from '../content-store.js'
import { memberPictureUpload } from '../uploads.js'
import { isNonEmptyString } from '../validation.js'
import {
  membersFile,
  applyPictureChange,
  findExistingPicture,
  deleteExistingPicture,
  type Member,
} from '../members-shared.js'

const router = Router()

router.get('/', async (_req, res) => {
  const members = await readCollection<Member>(membersFile, 'member')
  const withPictures = await Promise.all(
    members.map(async (member) => {
      const picturePath = await findExistingPicture(member.name)
      return {
        ...member,
        picture: picturePath ? `/api/members/pictures/${picturePath.split('/').pop()}` : null,
      }
    }),
  )
  res.json({ members: withPictures })
})

router.post('/', memberPictureUpload.single('picture'), async (req, res) => {
  const { name, role, joined, location, about_me } = req.body ?? {}

  if (!isNonEmptyString(name, 100) || !isNonEmptyString(role, 100) || !isNonEmptyString(joined, 20) || !isNonEmptyString(about_me, 2000)) {
    res.status(400).json({ error: 'Bitte Name, Rolle, Beitrittsdatum und Beschreibung angeben.' })
    return
  }

  const members = await readCollection<Member>(membersFile, 'member')
  const nextId = Math.max(0, ...members.map((m) => m.id)) + 1

  const member: Member = {
    id: nextId,
    name,
    role,
    joined,
    about_me,
    ...(location ? { location } : {}),
  }

  await applyPictureChange({ newName: name, uploadedFile: req.file })

  members.push(member)
  await writeCollection(membersFile, 'member', members)
  res.json({ ok: true, member })
})

router.put('/:id', memberPictureUpload.single('picture'), async (req, res) => {
  const id = Number(req.params.id)
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: 'Ungültige Mitglieds-ID.' })
    return
  }

  const members = await readCollection<Member>(membersFile, 'member')
  const index = members.findIndex((m) => m.id === id)
  if (index === -1) {
    res.status(404).json({ error: 'Mitglied nicht gefunden.' })
    return
  }

  const existing = members[index]
  const { name, role, joined, location, about_me, removePicture } = req.body ?? {}

  if (!isNonEmptyString(name, 100) || !isNonEmptyString(role, 100) || !isNonEmptyString(joined, 20) || !isNonEmptyString(about_me, 2000)) {
    res.status(400).json({ error: 'Bitte Name, Rolle, Beitrittsdatum und Beschreibung angeben.' })
    return
  }

  await applyPictureChange({
    newName: name,
    existingName: existing.name,
    uploadedFile: req.file,
    removePicture: removePicture === 'true' || removePicture === 'on',
  })

  const updated: Member = {
    id,
    name,
    role,
    joined,
    about_me,
    ...(location ? { location } : {}),
    ...(existing.user_id != null ? { user_id: existing.user_id } : {}),
  }
  members[index] = updated

  await writeCollection(membersFile, 'member', members)
  res.json({ ok: true, member: updated })
})

router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id)
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: 'Ungültige Mitglieds-ID.' })
    return
  }

  const members = await readCollection<Member>(membersFile, 'member')
  const index = members.findIndex((m) => m.id === id)
  if (index === -1) {
    res.status(404).json({ error: 'Mitglied nicht gefunden.' })
    return
  }

  const [removed] = members.splice(index, 1)
  await deleteExistingPicture(removed.name)
  await writeCollection(membersFile, 'member', members)
  res.json({ ok: true })
})

// Admin-only: attach or detach a card to/from a user account.
router.put('/:id/link', async (req, res) => {
  const id = Number(req.params.id)
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: 'Ungültige Mitglieds-ID.' })
    return
  }

  const { user_id: userId } = req.body ?? {}
  if (userId !== null && !Number.isInteger(userId)) {
    res.status(400).json({ error: 'Ungültige Nutzer-ID.' })
    return
  }

  const members = await readCollection<Member>(membersFile, 'member')
  const index = members.findIndex((m) => m.id === id)
  if (index === -1) {
    res.status(404).json({ error: 'Mitglied nicht gefunden.' })
    return
  }

  if (userId !== null) {
    const userExists = db.prepare('SELECT id FROM users WHERE id = ?').get(userId)
    if (!userExists) {
      res.status(404).json({ error: 'Nutzer nicht gefunden.' })
      return
    }
    const alreadyLinked = members.some((m) => m.id !== id && m.user_id === userId)
    if (alreadyLinked) {
      res.status(409).json({ error: 'Dieser Nutzer ist bereits mit einer anderen Karte verknüpft.' })
      return
    }
  }

  members[index] = { ...members[index], user_id: userId }
  await writeCollection(membersFile, 'member', members)
  res.json({ ok: true, member: members[index] })
})

export default router

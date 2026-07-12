import { Router } from 'express'
import path from 'node:path'
import { readCollection } from '../content-store.js'
import { membersFile, picturesDir, findExistingPicture, type Member } from '../members-shared.js'

const router = Router()

const isSafeFilename = (file: string): boolean => /^[\w.-]+$/.test(file)

// Public — the /members page and its Chart.js graph both need this, and
// club membership is not sensitive information. Reads membersFile live on
// every request (unlike the old `/members/members.json` static-file fetch
// this replaces, which in production only ever reflected whatever was in
// the last build — admin edits/deletes never showed up until a redeploy).
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
  res.json({ member: withPictures })
})

router.get('/pictures/:file', (req, res) => {
  const file = req.params.file

  if (!isSafeFilename(file)) {
    res.status(400).json({ error: 'Ungültiger Dateiname.' })
    return
  }

  res.sendFile(path.join(picturesDir, file), (error) => {
    if (error) res.status(404).end()
  })
})

export default router

import { Router } from 'express'
import path from 'node:path'
import { readCollection, writeCollection, type WithId } from '../content-store.js'
import { isNonEmptyString } from '../validation.js'

const router = Router()
const eventsFile = path.join(process.cwd(), 'server', 'content', 'events.json')

interface ClubEvent extends WithId {
  title: string
  date: string
  time?: string
  location?: string
  type: 'match' | 'meetup'
  description?: string
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const TIME_RE = /^\d{2}:\d{2}$/

function validateEventInput(body: Record<string, unknown>): string | null {
  const { title, date, time, type, location, description } = body
  if (!isNonEmptyString(title, 150)) return 'Bitte einen Titel angeben.'
  if (typeof date !== 'string' || !DATE_RE.test(date)) return 'Bitte ein gültiges Datum (YYYY-MM-DD) angeben.'
  if (time !== undefined && time !== '' && (typeof time !== 'string' || !TIME_RE.test(time))) {
    return 'Bitte eine gültige Uhrzeit (HH:MM) angeben.'
  }
  if (type !== 'match' && type !== 'meetup') return 'Typ muss "match" oder "meetup" sein.'
  if (location !== undefined && !isNonEmptyString(location, 150) && location !== '') return 'Ungültiger Ort.'
  if (description !== undefined && !isNonEmptyString(description, 1000) && description !== '') return 'Ungültige Beschreibung.'
  return null
}

router.get('/', async (_req, res) => {
  const events = await readCollection<ClubEvent>(eventsFile, 'events')
  res.json({ events })
})

router.post('/', async (req, res) => {
  const error = validateEventInput(req.body ?? {})
  if (error) {
    res.status(400).json({ error })
    return
  }

  const { title, date, time, location, type, description } = req.body

  const events = await readCollection<ClubEvent>(eventsFile, 'events')
  const nextId = Math.max(0, ...events.map((e) => e.id)) + 1

  const event: ClubEvent = {
    id: nextId,
    title,
    date,
    type,
    ...(time ? { time } : {}),
    ...(location ? { location } : {}),
    ...(description ? { description } : {}),
  }

  events.push(event)
  await writeCollection(eventsFile, 'events', events)
  res.json({ ok: true, event })
})

router.put('/:id', async (req, res) => {
  const id = Number(req.params.id)
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: 'Ungültige Termin-ID.' })
    return
  }

  const error = validateEventInput(req.body ?? {})
  if (error) {
    res.status(400).json({ error })
    return
  }

  const events = await readCollection<ClubEvent>(eventsFile, 'events')
  const index = events.findIndex((e) => e.id === id)
  if (index === -1) {
    res.status(404).json({ error: 'Termin nicht gefunden.' })
    return
  }

  const { title, date, time, location, type, description } = req.body

  const updated: ClubEvent = {
    id,
    title,
    date,
    type,
    ...(time ? { time } : {}),
    ...(location ? { location } : {}),
    ...(description ? { description } : {}),
  }
  events[index] = updated

  await writeCollection(eventsFile, 'events', events)
  res.json({ ok: true, event: updated })
})

router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id)
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: 'Ungültige Termin-ID.' })
    return
  }

  const events = await readCollection<ClubEvent>(eventsFile, 'events')
  const index = events.findIndex((e) => e.id === id)
  if (index === -1) {
    res.status(404).json({ error: 'Termin nicht gefunden.' })
    return
  }

  events.splice(index, 1)
  await writeCollection(eventsFile, 'events', events)
  res.json({ ok: true })
})

export default router

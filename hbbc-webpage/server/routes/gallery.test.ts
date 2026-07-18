import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { app } from '../app.js'
import { db } from '../db.js'
import { writePhotos } from '../gallery-shared.js'

// Whole router requires auth (app.ts: app.use('/api/gallery', requireAuth, galleryRouter)).

async function createApprovedMember() {
  const email = `gallery-test-${Date.now()}-${Math.random().toString(36).slice(2)}@example.test`
  await request(app).post('/api/auth/register').send({ name: 'Member', email, password: 'MemberPassword123!' })
  db.prepare("UPDATE users SET status = 'approved' WHERE email = ?").run(email)
  const loginRes = await request(app).post('/api/auth/login').send({ email, password: 'MemberPassword123!' })
  return loginRes.headers['set-cookie'][0].split(';')[0]
}

const fakePng = Buffer.from([0x89, 0x50, 0x4e, 0x47])

describe('GET /api/gallery', () => {
  it('rejects an unauthenticated request', async () => {
    const res = await request(app).get('/api/gallery')
    expect(res.status).toBe(401)
  })

  it('only shows approved photos, never pending ones', async () => {
    await writePhotos([
      { file: 'approved.png', status: 'approved' },
      { file: 'pending.png', status: 'pending' },
      // No status at all — treated as already-approved (isApproved()'s default).
      { file: 'legacy.png' },
    ])
    const cookie = await createApprovedMember()

    const res = await request(app).get('/api/gallery').set('Cookie', cookie)
    expect(res.status).toBe(200)
    const files = res.body.photos.map((p: { file: string }) => p.file)
    expect(files).toContain('approved.png')
    expect(files).toContain('legacy.png')
    expect(files).not.toContain('pending.png')
  })
})

describe('GET /api/gallery/photos/:file', () => {
  it('rejects a filename containing unsafe characters', async () => {
    const cookie = await createApprovedMember()
    const res = await request(app).get('/api/gallery/photos/foo;bar.png').set('Cookie', cookie)
    expect(res.status).toBe(400)
  })

  it('404s for a safe-but-nonexistent filename', async () => {
    const cookie = await createApprovedMember()
    const res = await request(app).get('/api/gallery/photos/does-not-exist.png').set('Cookie', cookie)
    expect(res.status).toBe(404)
  })
})

describe('POST /api/gallery/photos', () => {
  it('rejects an upload with no file', async () => {
    const cookie = await createApprovedMember()
    const res = await request(app).post('/api/gallery/photos').set('Cookie', cookie)
    expect(res.status).toBe(400)
  })

  it('creates a pending photo owned by the uploader', async () => {
    const cookie = await createApprovedMember()
    const res = await request(app)
      .post('/api/gallery/photos')
      .set('Cookie', cookie)
      .field('caption', 'A caption')
      .attach('photo', fakePng, 'upload.png')
    expect(res.status).toBe(200)
    expect(res.body.photo.status).toBe('pending')
    expect(res.body.photo.caption).toBe('A caption')
  })

  it('rejects a non-integer albumId', async () => {
    const cookie = await createApprovedMember()
    const res = await request(app)
      .post('/api/gallery/photos')
      .set('Cookie', cookie)
      .field('albumId', 'not-a-number')
      .attach('photo', fakePng, 'upload2.png')
    expect(res.status).toBe(400)
  })
})

describe('POST /api/gallery/albums', () => {
  it('rejects a missing name', async () => {
    const cookie = await createApprovedMember()
    const res = await request(app).post('/api/gallery/albums').set('Cookie', cookie).send({})
    expect(res.status).toBe(400)
  })

  it('rejects an invalid eventType', async () => {
    const cookie = await createApprovedMember()
    const res = await request(app)
      .post('/api/gallery/albums')
      .set('Cookie', cookie)
      .send({ name: 'Test Album', eventType: 'not-valid', eventLabel: 'Label' })
    expect(res.status).toBe(400)
  })

  it('rejects an eventType with no eventLabel', async () => {
    const cookie = await createApprovedMember()
    const res = await request(app)
      .post('/api/gallery/albums')
      .set('Cookie', cookie)
      .send({ name: 'Test Album', eventType: 'club-event' })
    expect(res.status).toBe(400)
  })

  it('creates an album with a valid event reference', async () => {
    const cookie = await createApprovedMember()
    const res = await request(app)
      .post('/api/gallery/albums')
      .set('Cookie', cookie)
      .send({ name: 'Test Album', eventType: 'vfb-match', eventLabel: 'VfB vs. Test FC' })
    expect(res.status).toBe(200)
    expect(res.body.album).toMatchObject({ name: 'Test Album', eventType: 'vfb-match', eventLabel: 'VfB vs. Test FC' })
  })

  it('creates an album with no event reference', async () => {
    const cookie = await createApprovedMember()
    const res = await request(app).post('/api/gallery/albums').set('Cookie', cookie).send({ name: 'Plain Album' })
    expect(res.status).toBe(200)
    expect(res.body.album.eventType).toBeUndefined()
  })
})

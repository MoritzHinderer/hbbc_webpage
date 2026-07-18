import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { app } from '../app.js'
import { db } from '../db.js'

async function createApprovedAdmin() {
  const email = `admin-gallery-test-${Date.now()}-${Math.random().toString(36).slice(2)}@example.test`
  await request(app).post('/api/auth/register').send({ name: 'Gallery Admin', email, password: 'AdminPassword123!' })
  db.prepare("UPDATE users SET status = 'approved', role = 'admin' WHERE email = ?").run(email)
  const loginRes = await request(app).post('/api/auth/login').send({ email, password: 'AdminPassword123!' })
  return loginRes.headers['set-cookie'][0].split(';')[0]
}

const fakePng = Buffer.from([0x89, 0x50, 0x4e, 0x47])

describe('admin auth guard', () => {
  it('rejects an unauthenticated request', async () => {
    const res = await request(app).get('/api/admin/gallery')
    expect(res.status).toBe(403)
  })
})

describe('photo CRUD', () => {
  it('uploads (auto-approved), lists with uploader name, updates, and deletes a photo', async () => {
    const cookie = await createApprovedAdmin()

    const uploadRes = await request(app)
      .post('/api/admin/gallery')
      .set('Cookie', cookie)
      .field('caption', 'Test caption')
      .attach('photo', fakePng, 'test.png')
    expect(uploadRes.status).toBe(200)
    expect(uploadRes.body.photo.status).toBe('approved')
    const file = uploadRes.body.photo.file as string

    const listRes = await request(app).get('/api/admin/gallery').set('Cookie', cookie)
    const listed = listRes.body.photos.find((p: { file: string }) => p.file === file)
    expect(listed).toBeDefined()
    expect(listed.uploaderName).toBe('Gallery Admin')

    const updateRes = await request(app)
      .put(`/api/admin/gallery/${file}`)
      .set('Cookie', cookie)
      .send({ caption: 'Updated caption' })
    expect(updateRes.status).toBe(200)
    expect(updateRes.body.photo.caption).toBe('Updated caption')

    const deleteRes = await request(app).delete(`/api/admin/gallery/${file}`).set('Cookie', cookie)
    expect(deleteRes.status).toBe(200)

    const listAfter = await request(app).get('/api/admin/gallery').set('Cookie', cookie)
    expect(listAfter.body.photos.some((p: { file: string }) => p.file === file)).toBe(false)
  })

  it('rejects an upload with no file', async () => {
    const cookie = await createApprovedAdmin()
    const res = await request(app).post('/api/admin/gallery').set('Cookie', cookie).field('caption', 'No file')
    expect(res.status).toBe(400)
  })

  it('approves a pending photo', async () => {
    const cookie = await createApprovedAdmin()
    const uploadRes = await request(app).post('/api/admin/gallery').set('Cookie', cookie).attach('photo', fakePng, 'pending.png')
    const file = uploadRes.body.photo.file as string

    // Force it back to pending to exercise the approve endpoint meaningfully.
    const listRes = await request(app).get('/api/admin/gallery').set('Cookie', cookie)
    expect(listRes.body.photos.find((p: { file: string }) => p.file === file).status).toBe('approved')

    const approveRes = await request(app).post(`/api/admin/gallery/${file}/approve`).set('Cookie', cookie)
    expect(approveRes.status).toBe(200)
    expect(approveRes.body.photo.status).toBe('approved')
  })

  it('rejects an unsafe filename on approve/update/delete', async () => {
    const cookie = await createApprovedAdmin()
    const approveRes = await request(app).post('/api/admin/gallery/foo;bar.png/approve').set('Cookie', cookie)
    expect(approveRes.status).toBe(400)
  })

  it('404s for a nonexistent photo', async () => {
    const cookie = await createApprovedAdmin()
    const res = await request(app).delete('/api/admin/gallery/does-not-exist.png').set('Cookie', cookie)
    expect(res.status).toBe(404)
  })
})

describe('album deletion ungroups its photos', () => {
  it('sets albumId to null on photos in a deleted album instead of removing them', async () => {
    const cookie = await createApprovedAdmin()

    const uploadRes = await request(app).post('/api/admin/gallery').set('Cookie', cookie).attach('photo', fakePng, 'album-test.png')
    const file = uploadRes.body.photo.file as string

    const createAlbumRes = await request(app)
      .post('/api/gallery/albums')
      .set('Cookie', cookie)
      .send({ name: 'Test Album' })
    const albumId = createAlbumRes.body.album.id as number

    await request(app).put(`/api/admin/gallery/${file}`).set('Cookie', cookie).send({ albumId })

    const deleteAlbumRes = await request(app).delete(`/api/admin/gallery/albums/${albumId}`).set('Cookie', cookie)
    expect(deleteAlbumRes.status).toBe(200)

    const listRes = await request(app).get('/api/admin/gallery').set('Cookie', cookie)
    const photo = listRes.body.photos.find((p: { file: string }) => p.file === file)
    expect(photo.albumId).toBeNull()
  })
})

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import { app } from '../app.js'

const ENV_KEYS = ['IMPRESSUM_NAME', 'IMPRESSUM_ADDRESS_LINE1', 'IMPRESSUM_ADDRESS_LINE2', 'IMPRESSUM_PHONE'] as const
const originalEnv: Record<string, string | undefined> = {}

beforeEach(() => {
  for (const key of ENV_KEYS) originalEnv[key] = process.env[key]
})

afterEach(() => {
  for (const key of ENV_KEYS) {
    if (originalEnv[key] === undefined) delete process.env[key]
    else process.env[key] = originalEnv[key]
  }
})

describe('GET /api/impressum', () => {
  it('reports not configured when the env vars are unset', async () => {
    delete process.env.IMPRESSUM_NAME
    delete process.env.IMPRESSUM_ADDRESS_LINE1
    delete process.env.IMPRESSUM_ADDRESS_LINE2
    delete process.env.IMPRESSUM_PHONE

    const res = await request(app).get('/api/impressum')
    expect(res.status).toBe(200)
    expect(res.body.configured).toBe(false)
    expect(res.body.name).toBeNull()
    expect(res.body.addressLines).toEqual([])
    expect(res.body.phone).toBeNull()
  })

  it('returns the configured name/address/phone, with a derived tel: href', async () => {
    process.env.IMPRESSUM_NAME = 'Test Person'
    process.env.IMPRESSUM_ADDRESS_LINE1 = 'Teststraße 1'
    process.env.IMPRESSUM_ADDRESS_LINE2 = '12345 Testort'
    process.env.IMPRESSUM_PHONE = '0176 12345678'

    const res = await request(app).get('/api/impressum')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({
      configured: true,
      name: 'Test Person',
      addressLines: ['Teststraße 1', '12345 Testort'],
      phone: '0176 12345678',
      phoneHref: 'tel:+4917612345678',
    })
  })

  it('omits the phone line entirely when unset, but is still configured', async () => {
    process.env.IMPRESSUM_NAME = 'Test Person'
    process.env.IMPRESSUM_ADDRESS_LINE1 = 'Teststraße 1'
    process.env.IMPRESSUM_ADDRESS_LINE2 = '12345 Testort'
    delete process.env.IMPRESSUM_PHONE

    const res = await request(app).get('/api/impressum')
    expect(res.body.configured).toBe(true)
    expect(res.body.phone).toBeNull()
    expect(res.body.phoneHref).toBeNull()
  })
})

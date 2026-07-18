import { describe, expect, it } from 'vitest'
import { hashPassword, verifyPassword } from './password.js'

describe('hashPassword / verifyPassword', () => {
  it('never stores the raw password', () => {
    const stored = hashPassword('correct horse battery staple')
    expect(stored).not.toContain('correct horse battery staple')
  })

  it('is stored as "salt:derivedKey"', () => {
    const stored = hashPassword('some-password')
    const parts = stored.split(':')
    expect(parts).toHaveLength(2)
    expect(parts[0]).toMatch(/^[0-9a-f]+$/)
    expect(parts[1]).toMatch(/^[0-9a-f]+$/)
  })

  it('verifies the correct password', () => {
    const stored = hashPassword('my-real-password')
    expect(verifyPassword('my-real-password', stored)).toBe(true)
  })

  it('rejects a wrong password', () => {
    const stored = hashPassword('my-real-password')
    expect(verifyPassword('a-wrong-password', stored)).toBe(false)
  })

  it('produces a different hash each time (random salt)', () => {
    const a = hashPassword('same-password')
    const b = hashPassword('same-password')
    expect(a).not.toBe(b)
    expect(verifyPassword('same-password', a)).toBe(true)
    expect(verifyPassword('same-password', b)).toBe(true)
  })

  it('rejects a malformed stored hash instead of throwing', () => {
    expect(verifyPassword('anything', 'not-a-valid-stored-hash')).toBe(false)
    expect(verifyPassword('anything', '')).toBe(false)
  })
})

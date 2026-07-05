import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

const KEY_LENGTH = 64

// Stored as "salt:derivedKey" (both hex) — never the raw password. scrypt is
// intentionally slow/memory-hard, which is what makes brute-forcing a leaked
// hash impractical.
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const derivedKey = scryptSync(password, salt, KEY_LENGTH).toString('hex')
  return `${salt}:${derivedKey}`
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, derivedKey] = stored.split(':')
  if (!salt || !derivedKey) return false

  const candidate = scryptSync(password, salt, KEY_LENGTH)
  const expected = Buffer.from(derivedKey, 'hex')

  // timingSafeEqual requires equal-length buffers, so mismatched lengths
  // (which shouldn't normally happen) must be checked separately first.
  if (candidate.length !== expected.length) return false
  return timingSafeEqual(candidate, expected)
}

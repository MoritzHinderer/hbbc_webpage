import { describe, expect, it } from 'vitest'
import { isNonEmptyString, isValidEmail, isValidPassword } from './validation.js'

describe('isValidEmail', () => {
  it('accepts well-formed emails', () => {
    expect(isValidEmail('person@example.com')).toBe(true)
    expect(isValidEmail('a.b+c@sub.example.co')).toBe(true)
  })

  it('rejects malformed emails', () => {
    expect(isValidEmail('not-an-email')).toBe(false)
    expect(isValidEmail('missing-domain@')).toBe(false)
    expect(isValidEmail('@missing-local.com')).toBe(false)
    expect(isValidEmail('has spaces@example.com')).toBe(false)
  })

  it('rejects non-strings and overly long values', () => {
    expect(isValidEmail(undefined)).toBe(false)
    expect(isValidEmail(42)).toBe(false)
    expect(isValidEmail(`${'a'.repeat(250)}@example.com`)).toBe(false)
  })
})

describe('isNonEmptyString', () => {
  it('accepts non-empty strings within the length limit', () => {
    expect(isNonEmptyString('hello', 10)).toBe(true)
  })

  it('rejects empty or whitespace-only strings', () => {
    expect(isNonEmptyString('', 10)).toBe(false)
    expect(isNonEmptyString('   ', 10)).toBe(false)
  })

  it('rejects strings over the max length', () => {
    expect(isNonEmptyString('a'.repeat(11), 10)).toBe(false)
  })

  it('rejects non-strings', () => {
    expect(isNonEmptyString(123, 10)).toBe(false)
    expect(isNonEmptyString(null, 10)).toBe(false)
  })
})

describe('isValidPassword', () => {
  it('accepts passwords between 8 and 200 characters', () => {
    expect(isValidPassword('12345678')).toBe(true)
    expect(isValidPassword('a'.repeat(200))).toBe(true)
  })

  it('rejects passwords under 8 characters', () => {
    expect(isValidPassword('1234567')).toBe(false)
  })

  it('rejects passwords over 200 characters', () => {
    expect(isValidPassword('a'.repeat(201))).toBe(false)
  })

  it('rejects non-strings', () => {
    expect(isValidPassword(12345678)).toBe(false)
  })
})

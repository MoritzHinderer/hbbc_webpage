import type { Request, Response } from 'express'
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '../db.js'
import {
  clearSessionCookie,
  createSession,
  destroySession,
  getUserForToken,
  readSessionToken,
  setSessionCookie,
} from './session.js'

// A user row to attach sessions to — getUserForToken joins against `users`,
// so a session token alone isn't enough to exercise it realistically.
function insertTestUser(email: string): number {
  const result = db
    .prepare("INSERT INTO users (name, email, password_hash, status) VALUES (?, ?, 'x', 'approved')")
    .run('Test User', email)
  return Number(result.lastInsertRowid)
}

describe('createSession / getUserForToken / destroySession', () => {
  it('creates a session that resolves back to the right user', () => {
    const userId = insertTestUser('session-test-1@example.test')
    const token = createSession(userId)

    const user = getUserForToken(token)
    expect(user).not.toBeNull()
    expect(user?.id).toBe(userId)
    expect(user?.email).toBe('session-test-1@example.test')
  })

  it('returns null for an unknown token', () => {
    expect(getUserForToken('does-not-exist')).toBeNull()
  })

  it('returns null for an expired session', () => {
    const userId = insertTestUser('session-test-2@example.test')
    const token = 'manually-inserted-expired-token'
    // One second in the past — always expired regardless of clock skew.
    db.prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, datetime(\'now\', \'-1 second\'))').run(
      token,
      userId,
    )

    expect(getUserForToken(token)).toBeNull()
  })

  it('destroySession removes the token so it no longer resolves', () => {
    const userId = insertTestUser('session-test-3@example.test')
    const token = createSession(userId)
    expect(getUserForToken(token)).not.toBeNull()

    destroySession(token)

    expect(getUserForToken(token)).toBeNull()
  })

  it('generates a different token each time', () => {
    const userId = insertTestUser('session-test-4@example.test')
    const a = createSession(userId)
    const b = createSession(userId)
    expect(a).not.toBe(b)
  })
})

describe('cookie helpers', () => {
  const makeRes = () => {
    const headers: Record<string, string> = {}
    return {
      res: { setHeader: (name: string, value: string) => { headers[name] = value } } as unknown as Response,
      headers,
    }
  }

  beforeEach(() => {
    delete process.env.NODE_ENV
  })

  it('setSessionCookie sets an HttpOnly cookie without Secure outside production', () => {
    const { res, headers } = makeRes()
    setSessionCookie(res, 'abc123')
    expect(headers['Set-Cookie']).toContain('session=abc123')
    expect(headers['Set-Cookie']).toContain('HttpOnly')
    expect(headers['Set-Cookie']).not.toContain('Secure')
  })

  it('setSessionCookie adds Secure in production', () => {
    process.env.NODE_ENV = 'production'
    const { res, headers } = makeRes()
    setSessionCookie(res, 'abc123')
    expect(headers['Set-Cookie']).toContain('Secure')
  })

  it('clearSessionCookie expires the cookie immediately', () => {
    const { res, headers } = makeRes()
    clearSessionCookie(res)
    expect(headers['Set-Cookie']).toContain('Max-Age=0')
  })

  it('readSessionToken extracts the token from a real cookie header', () => {
    const req = { headers: { cookie: 'session=abc123; other=xyz' } } as Request
    expect(readSessionToken(req)).toBe('abc123')
  })

  it('readSessionToken returns null when there is no session cookie', () => {
    const req = { headers: { cookie: 'other=xyz' } } as Request
    expect(readSessionToken(req)).toBeNull()

    const reqNoCookie = { headers: {} } as Request
    expect(readSessionToken(reqNoCookie)).toBeNull()
  })
})

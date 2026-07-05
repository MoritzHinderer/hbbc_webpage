import { randomBytes } from 'node:crypto'
import type { Request, Response } from 'express'
import { db, type UserRow } from '../db.js'

const COOKIE_NAME = 'session'
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000 // 30 days

export function createSession(userId: number): string {
  const token = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString()

  db.prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)').run(
    token,
    userId,
    expiresAt,
  )

  return token
}

export function destroySession(token: string): void {
  db.prepare('DELETE FROM sessions WHERE token = ?').run(token)
}

export function getUserForToken(token: string): UserRow | null {
  const row = db
    .prepare(
      `SELECT users.* FROM sessions
       JOIN users ON users.id = sessions.user_id
       WHERE sessions.token = ? AND sessions.expires_at > datetime('now')`,
    )
    .get(token) as UserRow | undefined

  return row ?? null
}

// Only one cookie is ever set by this app, so a full cookie-parsing
// dependency isn't needed — this is a few lines of manual parsing.
export function readSessionToken(req: Request): string | null {
  const header = req.headers.cookie
  if (!header) return null

  const match = header.split('; ').find((entry) => entry.startsWith(`${COOKIE_NAME}=`))
  if (!match) return null

  return decodeURIComponent(match.slice(COOKIE_NAME.length + 1))
}

export function setSessionCookie(res: Response, token: string): void {
  const parts = [
    `${COOKIE_NAME}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${Math.floor(SESSION_DURATION_MS / 1000)}`,
  ]
  if (process.env.NODE_ENV === 'production') parts.push('Secure')

  res.setHeader('Set-Cookie', parts.join('; '))
}

export function clearSessionCookie(res: Response): void {
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=; Path=/; HttpOnly; Max-Age=0`)
}

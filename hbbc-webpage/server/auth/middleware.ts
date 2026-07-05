import type { NextFunction, Request, Response } from 'express'
import { toPublicUser, type PublicUser } from '../db.js'
import { getUserForToken, readSessionToken } from './session.js'

declare global {
  namespace Express {
    interface Request {
      user?: PublicUser
    }
  }
}

// Runs on every request: attaches req.user if a valid session cookie is
// present, but never blocks the request itself — routes decide what to
// require via requireAuth/requireAdmin below.
export function attachUser(req: Request, _res: Response, next: NextFunction): void {
  const token = readSessionToken(req)
  if (token) {
    const user = getUserForToken(token)
    if (user) req.user = toPublicUser(user)
  }
  next()
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Bitte melde dich an.' })
    return
  }
  next()
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ error: 'Kein Zugriff.' })
    return
  }
  next()
}

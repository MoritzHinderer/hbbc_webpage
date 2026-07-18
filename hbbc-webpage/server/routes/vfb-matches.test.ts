import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import request from 'supertest'
import { app } from '../app.js'

// loadAllVfbMatches() keeps an in-memory cache (10 min TTL, keyed off
// Date.now()) shared across every test in this file (one module instance
// per test file). Faking only Date (not timers) lets us force cache
// hits/misses deterministically without messing with Express/supertest's
// real setTimeout-based internals.
const FIRST_CALL = new Date('2026-08-15T12:00:00.000Z')
// 11 minutes later — past the 10-minute cache TTL, forces a fresh fetch.
const SECOND_CALL = new Date('2026-08-15T12:11:00.000Z')

function match(overrides: Record<string, unknown>) {
  return {
    matchID: 1,
    matchDateTimeUTC: '2026-08-20T18:30:00Z',
    leagueName: 'Bundesliga',
    group: { groupName: '2. Spieltag' },
    team1: { teamId: 16, teamName: 'VfB Stuttgart', teamIconUrl: 'vfb.png' },
    team2: { teamId: 99, teamName: 'Opponent FC', teamIconUrl: 'opp.png' },
    matchIsFinished: false,
    matchResults: [],
    goals: [],
    ...overrides,
  }
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('external API resilience', () => {
  it('returns an empty list from both routes instead of erroring when OpenLigaDB is unreachable', async () => {
    vi.setSystemTime(FIRST_CALL)
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('network down')
      }),
    )

    const upcoming = await request(app).get('/api/vfb-matches')
    expect(upcoming.status).toBe(200)
    expect(upcoming.body).toEqual({ matches: [] })

    const recent = await request(app).get('/api/vfb-matches/recent')
    expect(recent.status).toBe(200)
    expect(recent.body).toEqual({ matches: [] })
  })
})

describe('GET /api/vfb-matches and /recent', () => {
  it('maps, filters, and separates upcoming vs. finished VfB matches', async () => {
    // Past the first test's cached (empty) result's TTL — forces a fresh fetch.
    vi.setSystemTime(SECOND_CALL)

    const upcomingMatch = match({
      matchID: 2001,
      matchDateTimeUTC: '2026-08-20T18:30:00Z', // after SECOND_CALL — upcoming
      team1: { teamId: 16, teamName: 'VfB Stuttgart', teamIconUrl: 'vfb.png' },
      team2: { teamId: 77, teamName: 'Upcoming Opponent', teamIconUrl: 'opp.png' },
      matchIsFinished: false,
    })
    const finishedMatch = match({
      matchID: 2002,
      matchDateTimeUTC: '2026-08-10T18:30:00Z', // before SECOND_CALL, and finished
      team1: { teamId: 50, teamName: 'Finished Opponent', teamIconUrl: null },
      team2: { teamId: 16, teamName: 'VfB Stuttgart', teamIconUrl: 'vfb.png' },
      matchIsFinished: true,
      matchResults: [{ resultTypeID: 2, pointsTeam1: 1, pointsTeam2: 3 }],
    })

    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        const isCurrentBl1 = url === 'https://api.openligadb.de/getmatchdata/bl1/2026'
        return {
          ok: true,
          json: async () => (isCurrentBl1 ? [upcomingMatch, finishedMatch] : []),
        }
      }),
    )

    const upcomingRes = await request(app).get('/api/vfb-matches')
    expect(upcomingRes.status).toBe(200)
    expect(upcomingRes.body.matches).toHaveLength(1)
    expect(upcomingRes.body.matches[0]).toMatchObject({
      id: 2001,
      opponent: 'Upcoming Opponent',
      isHome: true,
      status: 'upcoming',
      score: null,
    })

    const recentRes = await request(app).get('/api/vfb-matches/recent')
    expect(recentRes.status).toBe(200)
    expect(recentRes.body.matches).toHaveLength(1)
    expect(recentRes.body.matches[0]).toMatchObject({
      id: 2002,
      opponent: 'Finished Opponent',
      isHome: false,
      status: 'finished',
      score: { home: 1, away: 3 },
    })
  })
})

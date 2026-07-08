import { Router } from 'express'

const router = Router()

// VfB Stuttgart's teamId is stable across seasons on OpenLigaDB (a free,
// keyless public API for German football — openligadb.de); only the
// league they play in can change between seasons (relegation/promotion),
// so both top divisions are checked rather than assuming bl1.
const VFB_TEAM_ID = 16
const LEAGUES = ['bl1', 'bl2'] as const

interface OpenLigaTeam {
  teamId: number
  teamName: string
  teamIconUrl: string | null
}

interface OpenLigaResult {
  resultTypeID: number
  pointsTeam1: number
  pointsTeam2: number
}

interface OpenLigaGoal {
  scoreTeam1: number
  scoreTeam2: number
}

interface OpenLigaMatch {
  matchID: number
  matchDateTimeUTC: string
  leagueName: string
  group: { groupName: string } | null
  team1: OpenLigaTeam
  team2: OpenLigaTeam
  matchIsFinished: boolean
  matchResults: OpenLigaResult[]
  goals: OpenLigaGoal[]
}

export interface VfbMatch {
  id: number
  kickoff: string
  competition: string
  matchday: string | null
  opponent: string
  opponentIcon: string | null
  vfbIcon: string | null
  isHome: boolean
  status: 'upcoming' | 'live' | 'finished'
  score: { home: number; away: number } | null
}

// Bundesliga fixtures for the season starting in a given August are
// usually published on OpenLigaDB by early summer — from July onward we're
// already looking at the upcoming season's schedule, not the one that just
// finished in May.
const currentSeasonYear = (): number => {
  const now = new Date()
  return now.getUTCMonth() >= 6 ? now.getUTCFullYear() : now.getUTCFullYear() - 1
}

const matchStatus = (match: OpenLigaMatch): VfbMatch['status'] => {
  if (match.matchIsFinished) return 'finished'
  return Date.now() >= new Date(match.matchDateTimeUTC).getTime() ? 'live' : 'upcoming'
}

const currentScore = (match: OpenLigaMatch): VfbMatch['score'] => {
  const final = match.matchResults.find((r) => r.resultTypeID === 2)
  if (final) return { home: final.pointsTeam1, away: final.pointsTeam2 }
  const halftime = match.matchResults.find((r) => r.resultTypeID === 1)
  if (halftime) return { home: halftime.pointsTeam1, away: halftime.pointsTeam2 }
  const lastGoal = match.goals.at(-1)
  return lastGoal ? { home: lastGoal.scoreTeam1, away: lastGoal.scoreTeam2 } : null
}

const toVfbMatch = (match: OpenLigaMatch): VfbMatch => {
  const isHome = match.team1.teamId === VFB_TEAM_ID
  const vfbTeam = isHome ? match.team1 : match.team2
  const opponentTeam = isHome ? match.team2 : match.team1
  return {
    id: match.matchID,
    kickoff: match.matchDateTimeUTC,
    competition: match.leagueName,
    matchday: match.group?.groupName ?? null,
    opponent: opponentTeam.teamName,
    opponentIcon: opponentTeam.teamIconUrl,
    vfbIcon: vfbTeam.teamIconUrl,
    isHome,
    status: matchStatus(match),
    score: currentScore(match),
  }
}

async function fetchSeasonMatches(league: string, season: number): Promise<OpenLigaMatch[]> {
  const response = await fetch(`https://api.openligadb.de/getmatchdata/${league}/${season}`)
  if (!response.ok) throw new Error(`OpenLigaDB request failed (${league}/${season}): ${response.status}`)
  return (await response.json()) as OpenLigaMatch[]
}

// Hobby-project scale, single instance — an in-memory cache is enough to
// avoid hitting OpenLigaDB on every page load without adding a dependency.
// Caches every match (upcoming and finished) so both routes below can
// derive their own view from one shared fetch instead of doubling requests.
let cache: { fetchedAt: number; matches: VfbMatch[] } | null = null
const CACHE_TTL_MS = 10 * 60 * 1000

async function loadAllVfbMatches(): Promise<VfbMatch[]> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.matches
  }

  const season = currentSeasonYear()
  // Also check last season alongside the current one — right at a season
  // boundary (e.g. a delayed final matchday in June), "current" fixtures
  // can still be sitting under last year's season number.
  const requests = LEAGUES.flatMap((league) => [
    fetchSeasonMatches(league, season),
    fetchSeasonMatches(league, season - 1),
  ])

  const results = await Promise.allSettled(requests)
  const allMatches: OpenLigaMatch[] = []
  for (const result of results) {
    if (result.status === 'fulfilled') allMatches.push(...result.value)
    else console.error('[vfb-matches] a season fetch failed:', result.reason)
  }

  const seen = new Set<number>()
  const vfbMatches = allMatches
    .filter((m) => m.team1.teamId === VFB_TEAM_ID || m.team2.teamId === VFB_TEAM_ID)
    .filter((m) => (seen.has(m.matchID) ? false : (seen.add(m.matchID), true)))
    .map(toVfbMatch)

  cache = { fetchedAt: Date.now(), matches: vfbMatches }
  return vfbMatches
}

router.get('/', async (_req, res) => {
  try {
    const matches = (await loadAllVfbMatches())
      .filter((m) => m.status !== 'finished')
      .sort((a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime())
    res.json({ matches })
  } catch (error) {
    console.error('[vfb-matches] failed to load matches:', error)
    // Best-effort feature — the rest of the Termine page (fanclub events)
    // should still work even if the external API is unreachable.
    res.json({ matches: [] })
  }
})

// Additive and separate from the upcoming-only list above (which /events
// relies on for its "next match" card, unaffected by this route) — used by
// the gallery's album-linking picker, so an album about a game already
// played can reference it too.
router.get('/recent', async (_req, res) => {
  try {
    const matches = (await loadAllVfbMatches())
      .filter((m) => m.status === 'finished')
      .sort((a, b) => new Date(b.kickoff).getTime() - new Date(a.kickoff).getTime())
      .slice(0, 15)
    res.json({ matches })
  } catch (error) {
    console.error('[vfb-matches] failed to load recent matches:', error)
    res.json({ matches: [] })
  }
})

export default router

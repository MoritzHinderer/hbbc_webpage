<template>
  <div class="min-h-screen" style="background: linear-gradient(to bottom, rgb(31, 41, 55) 0%, rgb(80, 7, 7) 100%);">
    <div class="max-w-4xl mx-auto px-6 py-16 text-center space-y-12">
      <div class="space-y-4">
        <h1 class="text-4xl md:text-5xl font-bold text-white">Termine</h1>
        <p class="text-xl text-gray-200">Anstehende VfB-Spiele und Fanclub-Treffen.</p>
      </div>

      <div class="text-left space-y-4">
        <h2 class="text-2xl font-bold text-white">Alle VfB-Spiele</h2>
        <div v-if="vfbMatches.length" class="grid gap-3">
          <div
            v-for="match in vfbMatches"
            :key="match.id"
            class="bg-gray-800/50 backdrop-blur rounded-lg p-4 border border-gray-500 flex flex-wrap items-center justify-between gap-3"
          >
            <div class="flex items-center gap-3">
              <img v-if="match.opponentIcon" :src="match.opponentIcon" alt="" class="w-8 h-8 object-contain" />
              <div>
                <p class="text-white font-medium">
                  {{ match.isHome ? 'VfB Stuttgart' : match.opponent }}
                  <span class="text-gray-500">vs</span>
                  {{ match.isHome ? match.opponent : 'VfB Stuttgart' }}
                </p>
                <p class="text-sm text-gray-400">{{ formatKickoff(match.kickoff) }} · {{ match.competition }}</p>
              </div>
            </div>
            <span
              v-if="match.score"
              :class="[
                'text-sm font-semibold px-3 py-1 rounded-full',
                match.status === 'live' ? 'bg-red-700/40 text-red-300' : 'bg-gray-700/60 text-gray-200',
              ]"
            >
              {{ match.score.home }}:{{ match.score.away }}
              <span v-if="match.status === 'live'">· live</span>
            </span>
          </div>
        </div>
        <div v-else class="bg-gray-800/50 backdrop-blur rounded-lg p-6 border border-gray-500 text-gray-400 text-sm">
          Aktuell konnten keine VfB-Spieldaten geladen werden.
        </div>
      </div>

      <div v-if="upcoming.length" class="grid gap-6 text-left">
        <div
          v-for="event in upcoming"
          :key="event.title + event.date"
          class="bg-gray-800/50 backdrop-blur rounded-lg p-6 border border-gray-500 hover:scale-100 md:hover:scale-[1.02] transition-all duration-300"
        >
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div>
              <span
                :class="[
                  'inline-block text-xs font-semibold px-2 py-1 rounded-full mb-2',
                  event.type === 'match' ? 'bg-red-700/40 text-red-300' : 'bg-green-700/40 text-green-300',
                ]"
              >
                {{ event.type === 'match' ? 'VfB-Spiel' : 'Fanclub-Treffen' }}
              </span>
              <h2 class="text-lg font-semibold text-white">{{ event.title }}</h2>
              <p class="text-sm text-gray-300 mt-1">{{ formatDateTime(event) }}</p>
              <p v-if="event.location" class="text-sm text-gray-400">{{ event.location }}</p>
              <p v-if="event.description" class="text-sm text-gray-300 mt-2">{{ event.description }}</p>
            </div>
            <button
              class="shrink-0 text-sm text-red-400 hover:text-red-300 border border-red-700 hover:border-red-500 rounded-md px-3 py-2 transition-colors"
              @click="downloadIcs(event)"
            >
              + Kalender
            </button>
          </div>
        </div>
      </div>

      <div v-else class="bg-gray-800/50 backdrop-blur rounded-lg p-10 border border-gray-500 text-gray-300">
        Aktuell sind keine Termine geplant. Schau bald wieder vorbei!
      </div>

      <div v-if="past.length" class="text-left">
        <h2 class="text-2xl font-bold text-white mb-4">Vergangene Termine</h2>
        <ul class="space-y-2">
          <li
            v-for="event in past"
            :key="event.title + event.date"
            class="text-gray-400 text-sm border-b border-gray-800 pb-2"
          >
            {{ formatDateTime(event) }} — {{ event.title }}
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

interface ClubEvent {
  title: string
  date: string
  time?: string
  location?: string
  type: 'match' | 'meetup'
  description?: string
}

interface VfbMatch {
  id: number
  kickoff: string
  competition: string
  opponent: string
  opponentIcon: string | null
  isHome: boolean
  status: 'upcoming' | 'live' | 'finished'
  score: { home: number; away: number } | null
}

const events = ref<ClubEvent[]>([])
const vfbMatches = ref<VfbMatch[]>([])

const eventTimestamp = (event: ClubEvent) => new Date(`${event.date}T${event.time || '00:00'}`).getTime()

const upcoming = computed(() =>
  events.value
    .filter((event) => eventTimestamp(event) >= Date.now())
    .sort((a, b) => eventTimestamp(a) - eventTimestamp(b)),
)

const past = computed(() =>
  events.value
    .filter((event) => eventTimestamp(event) < Date.now())
    .sort((a, b) => eventTimestamp(b) - eventTimestamp(a)),
)

const formatKickoff = (kickoffIso: string) => {
  const date = new Date(kickoffIso)
  const datePart = date.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'long' })
  const timePart = date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
  return `${datePart}, ${timePart} Uhr`
}

const formatDateTime = (event: ClubEvent) => {
  const date = new Date(`${event.date}T${event.time || '00:00'}`)
  const datePart = date.toLocaleDateString('de-DE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  return event.time ? `${datePart}, ${event.time} Uhr` : datePart
}

const toIcsDate = (event: ClubEvent) => {
  const date = new Date(`${event.date}T${event.time || '00:00'}`)
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
}

const downloadIcs = (event: ClubEvent) => {
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//HBBC//Termine//DE',
    'BEGIN:VEVENT',
    `UID:${event.date}-${event.title.replace(/\s+/g, '-')}@hbbc-fanclub.de`,
    `DTSTAMP:${toIcsDate(event)}`,
    `DTSTART:${toIcsDate(event)}`,
    `SUMMARY:${event.title}`,
    event.location ? `LOCATION:${event.location}` : '',
    event.description ? `DESCRIPTION:${event.description}` : '',
    'END:VEVENT',
    'END:VCALENDAR',
  ]
    .filter(Boolean)
    .join('\r\n')

  const blob = new Blob([ics], { type: 'text/calendar' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${event.title.replace(/\s+/g, '_')}.ics`
  a.click()
  URL.revokeObjectURL(url)
}

onMounted(async () => {
  try {
    const response = await fetch('/api/events', { credentials: 'include' })
    if (response.status === 401) {
      router.push({ path: '/login', query: { redirect: '/events' } })
      return
    }
    if (!response.ok) throw new Error(`request failed with ${response.status}`)
    const data: { events: ClubEvent[] } = await response.json()
    events.value = data.events || []
  } catch (error) {
    console.error('Failed to load events:', error)
  }

  // Best-effort — the manually-curated Termine above still work even if
  // this (external-API-backed) section fails to load.
  try {
    const response = await fetch('/api/vfb-matches', { credentials: 'include' })
    if (!response.ok) throw new Error(`request failed with ${response.status}`)
    const data: { matches: VfbMatch[] } = await response.json()
    vfbMatches.value = data.matches || []
  } catch (error) {
    console.error('Failed to load VfB matches:', error)
  }
})
</script>

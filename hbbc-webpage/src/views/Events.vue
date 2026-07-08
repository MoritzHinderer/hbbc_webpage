<template>
  <div class="min-h-screen" style="background: linear-gradient(to bottom, rgb(31, 41, 55) 0%, rgb(80, 7, 7) 100%);">
    <div class="max-w-4xl mx-auto px-6 py-16 text-center space-y-10">
      <div class="space-y-4">
        <h1 class="text-4xl md:text-5xl font-bold text-white">VfB-Spiele</h1>
        <p class="text-xl text-gray-200">Der komplette Spielplan des VfB Stuttgart mit Live-Ergebnissen.</p>
      </div>

      <div class="text-left space-y-6">
        <!-- Featured: the next game -->
        <div
          v-if="nextMatch"
          class="bg-gradient-to-br from-red-950/60 to-gray-800/60 backdrop-blur rounded-2xl border-2 border-red-600 p-6 sm:p-8 text-center cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-red-950/50"
          @click="toggleMatch(nextMatch.id)"
        >
          <p class="text-red-400 text-xs font-bold uppercase tracking-widest mb-5">Nächstes Spiel</p>
          <div class="flex items-center justify-center gap-6 sm:gap-10">
            <div class="flex flex-col items-center gap-2 w-24 sm:w-32">
              <img
                :src="nextMatch.isHome ? nextMatch.vfbIcon ?? undefined : nextMatch.opponentIcon ?? undefined"
                alt=""
                class="w-16 h-16 sm:w-20 sm:h-20 object-contain"
                @error="hideOnError"
              />
              <p class="text-white font-semibold text-sm sm:text-base">{{ nextMatch.isHome ? 'VfB Stuttgart' : nextMatch.opponent }}</p>
            </div>
            <span class="text-gray-400 text-lg font-bold shrink-0">vs</span>
            <div class="flex flex-col items-center gap-2 w-24 sm:w-32">
              <img
                :src="nextMatch.isHome ? nextMatch.opponentIcon ?? undefined : nextMatch.vfbIcon ?? undefined"
                alt=""
                class="w-16 h-16 sm:w-20 sm:h-20 object-contain"
                @error="hideOnError"
              />
              <p class="text-white font-semibold text-sm sm:text-base">{{ nextMatch.isHome ? nextMatch.opponent : 'VfB Stuttgart' }}</p>
            </div>
          </div>
          <p class="text-gray-300 mt-6">
            {{ formatKickoff(nextMatch.kickoff) }}
            <span v-if="nextMatch.matchday"> · {{ nextMatch.matchday }}</span>
          </p>
          <span
            v-if="nextMatch.score"
            :class="[
              'inline-block mt-3 text-sm font-semibold px-3 py-1 rounded-full',
              nextMatch.status === 'live' ? 'bg-red-700/40 text-red-300' : 'bg-gray-700/60 text-gray-200',
            ]"
          >
            {{ nextMatch.score.home }}:{{ nextMatch.score.away }}
            <span v-if="nextMatch.status === 'live'">· live</span>
          </span>

          <div v-if="expandedMatchId === nextMatch.id" class="mt-5 pt-5 border-t border-red-800/40 flex justify-center">
            <button
              class="text-sm text-red-400 hover:text-red-300 border border-red-700 hover:border-red-500 rounded-md px-4 py-2 transition-colors"
              @click.stop="downloadMatchIcs(nextMatch)"
            >
              + Kalender
            </button>
          </div>
        </div>

        <div v-if="remainingMatches.length" class="grid gap-3">
          <div
            v-for="match in remainingMatches"
            :key="match.id"
            class="group bg-gray-800/50 backdrop-blur rounded-xl border border-gray-600 overflow-hidden cursor-pointer transition-all duration-300 hover:border-red-500 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-red-950/40"
            @click="toggleMatch(match.id)"
          >
            <div class="p-4 flex flex-wrap items-center justify-between gap-3">
              <div class="flex items-center gap-3">
                <div class="flex items-center gap-1.5 sm:gap-2 shrink-0">
                  <img
                    :src="match.isHome ? match.vfbIcon ?? undefined : match.opponentIcon ?? undefined"
                    alt=""
                    loading="lazy"
                    class="w-6 h-6 sm:w-9 sm:h-9 object-contain"
                    @error="hideOnError"
                  />
                  <span class="text-gray-500 text-xs font-semibold uppercase">vs</span>
                  <img
                    :src="match.isHome ? match.opponentIcon ?? undefined : match.vfbIcon ?? undefined"
                    alt=""
                    loading="lazy"
                    class="w-6 h-6 sm:w-9 sm:h-9 object-contain"
                    @error="hideOnError"
                  />
                </div>
                <div>
                  <p class="text-white font-medium">
                    {{ match.isHome ? 'VfB Stuttgart' : match.opponent }}
                    <span class="text-gray-500 font-normal">–</span>
                    {{ match.isHome ? match.opponent : 'VfB Stuttgart' }}
                  </p>
                  <p class="text-sm text-gray-400">
                    {{ formatKickoff(match.kickoff) }}
                    <span v-if="match.matchday"> · {{ match.matchday }}</span>
                  </p>
                </div>
              </div>
              <div class="flex items-center gap-3">
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
                <ChevronDownIcon
                  class="w-4 h-4 text-gray-500 transition-transform group-hover:text-gray-300"
                  :class="{ 'rotate-180': expandedMatchId === match.id }"
                />
              </div>
            </div>

            <div v-if="expandedMatchId === match.id" class="border-t border-gray-700 px-4 py-3 flex items-center justify-between gap-3">
              <p class="text-sm text-gray-400">{{ match.competition }}</p>
              <button
                class="text-sm text-red-400 hover:text-red-300 border border-red-700 hover:border-red-500 rounded-md px-3 py-1.5 transition-colors"
                @click.stop="downloadMatchIcs(match)"
              >
                + Kalender
              </button>
            </div>
          </div>
        </div>
        <div v-if="!vfbMatches.length" class="bg-gray-800/50 backdrop-blur rounded-lg p-10 border border-gray-500 text-gray-400 text-center">
          Aktuell konnten keine VfB-Spieldaten geladen werden.
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ChevronDownIcon } from '@heroicons/vue/24/outline'
import { downloadIcsEvent } from '../composables/useIcsDownload'

interface VfbMatch {
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

const vfbMatches = ref<VfbMatch[]>([])
const expandedMatchId = ref<number | null>(null)

// vfbMatches is already sorted ascending by kickoff (server-side), so the
// first entry is literally the next game — featured with its own bigger,
// standout layout above the compact list of everything after it.
const nextMatch = computed(() => vfbMatches.value[0] ?? null)
const remainingMatches = computed(() => vfbMatches.value.slice(1))

const toggleMatch = (id: number) => {
  expandedMatchId.value = expandedMatchId.value === id ? null : id
}

// Team icons are externally hosted (Wikipedia/imgur, via OpenLigaDB) — hide
// a broken image rather than showing the browser's default broken-image
// glyph if one fails to load.
const hideOnError = (event: Event) => {
  ;(event.target as HTMLImageElement).style.visibility = 'hidden'
}

const formatKickoff = (kickoffIso: string) => {
  const date = new Date(kickoffIso)
  const datePart = date.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'long' })
  const timePart = date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
  return `${datePart}, ${timePart} Uhr`
}

const downloadMatchIcs = (match: VfbMatch) => {
  const title = match.isHome ? `VfB Stuttgart vs. ${match.opponent}` : `${match.opponent} vs. VfB Stuttgart`
  downloadIcsEvent({
    uid: `vfb-${match.id}`,
    title,
    start: new Date(match.kickoff),
    description: `${match.competition}${match.matchday ? ' - ' + match.matchday : ''}`,
  })
}

onMounted(async () => {
  try {
    const response = await fetch('/api/vfb-matches')
    if (!response.ok) throw new Error(`request failed with ${response.status}`)
    const data: { matches: VfbMatch[] } = await response.json()
    vfbMatches.value = data.matches || []
  } catch (error) {
    console.error('Failed to load VfB matches:', error)
  }
})
</script>

<template>
  <div class="min-h-screen" style="background: linear-gradient(to bottom, rgb(31, 41, 55) 0%, rgb(80, 7, 7) 100%);">
    <div class="max-w-6xl mx-auto px-6 py-16 text-center space-y-12">
      <h1 class="text-4xl md:text-5xl font-bold text-white">Unsere Mitglieder</h1>
      <p class="text-xl text-gray-200">
        Lerne die Mitglieder des HBBC kennen.
      </p>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="member in members"
          :key="member.name"
          class="bg-gray-800/50 backdrop-blur rounded-lg p-6 border border-gray-500 hover:scale-100 md:hover:scale-[1.05] transition-all duration-300 flex flex-col"
        >
          <!-- Member Picture -->
          <div :class="['mb-4 w-full h-48 rounded-lg flex items-center justify-center', { 'bg-gray-700/50': !member.picture }]">
            <template v-if="member.picture">
              <img
                :src="member.picture"
                :alt="member.name"
                loading="lazy"
                class="max-w-full max-h-full object-contain rounded-lg"
                @error="handleImageError(member)"
              />
            </template>
            <svg v-else class="w-20 h-20 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="8" r="4" stroke-width="2" />
              <path d="M 4 20 Q 4 14 12 14 Q 20 14 20 20" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </div>

          <!-- Member Info -->
          <h2 class="text-xl font-semibold text-white mb-1">{{ member.name }}</h2>
          <p class="text-red-500 font-medium text-sm mb-3">{{ member.role }}</p>
          <p class="text-gray-300 text-sm leading-relaxed flex-grow">{{ member.about_me }}</p>
          <p class="text-gray-400 text-xs mt-4 pt-4 border-t border-gray-600/50">Mitglied seit: {{ formatDate(member.joined) }}</p>
        </div>

        <!-- Join Form Card -->
        <a
          href="/api/downloads/Antragsformular_2025.pdf"
          download="Antragsformular_2025.pdf"
          class="bg-gradient-to-br from-white-900/40 to-green-800/20 backdrop-blur rounded-lg p-6 border-2 border-green-500 hover:border-green-400 hover:scale-100 md:hover:scale-[1.08] transition-all duration-300 flex flex-col items-center justify-center cursor-pointer group shadow-lg hover:shadow-green-500/20"
        >
          <div class="mb-4 w-20 h-20 rounded-lg flex items-center justify-center bg-green-500/30 group-hover:bg-green-500/50 transition-all group-hover:scale-110 shadow-lg">
            <svg class="w-12 h-12 text-green-400 group-hover:text-green-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M12 4v16m8-8H4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              <path d="M9 20h6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </div>
          <h2 class="text-xl font-semibold text-green-300 mb-2 group-hover:text-green-200 transition-colors">Beitreten</h2>
          <p class="text-gray-300 text-sm leading-relaxed text-center group-hover:text-white transition-colors">Laden Sie das Antragsformular herunter und werden Sie Mitglied des HBBC</p>
          <p class="text-green-400 font-medium text-sm mt-4 group-hover:text-green-300 transition-colors">Formular herunterladen</p>
        </a>
      </div>
      <MembersChart />
      <MembersMap :members="members" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import MembersChart from '../components/MembersChart.vue'
import MembersMap from '../components/MembersMap.vue'

interface RawMember {
  name: string
  role: string
  joined: string
  about_me: string
  location?: string
}

interface Member extends RawMember {
  picture: string | null
  pictureAttempt: number
}

const pictureExtensions = ['png', 'jpeg', 'jpg']

const members = ref<Member[]>([])

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('de-DE', { year: 'numeric', month: 'long', day: 'numeric' })
}

const buildPicturePath = (name: string, attempt: number): string | null => {
  const ext = pictureExtensions[attempt]
  if (!ext) return null
  return `/member_pictures/${name.replace(/\s+/g, '_')}.${ext}`
}

// Pictures are looked up by naming convention; if a file for the current
// extension 404s, fall back to the next extension, then to the placeholder icon.
const handleImageError = (member: Member) => {
  member.pictureAttempt += 1
  member.picture = buildPicturePath(member.name, member.pictureAttempt)
}

onMounted(async () => {
  try {
    const response = await fetch('/members/members.json')
    const data: { member: RawMember[] } = await response.json()

    members.value = data.member.map((member) => ({
      ...member,
      pictureAttempt: 0,
      picture: buildPicturePath(member.name, 0),
    }))
  } catch (error) {
    console.error('Failed to load members:', error)
  }
})
</script>

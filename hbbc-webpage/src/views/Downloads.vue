<template>
  <div class="min-h-screen" style="background: linear-gradient(to bottom, rgb(31, 41, 55) 0%, rgb(80, 7, 7) 100%);">
    <div class="max-w-4xl mx-auto px-6 py-16 text-center space-y-12">
      <h1 class="text-4xl md:text-5xl font-bold text-white">Downloads</h1>
      <p class="text-xl text-gray-200">
        Hier findest du alle wichtigen Dokumente und Ressourcen des HBBC zum Download.
      </p>

      <div class="grid gap-6 text-left">
        <component
          :is="isLocked(file) ? 'router-link' : 'a'"
          v-for="file in downloads"
          :key="file.id"
          v-bind="isLocked(file) ? { to: `/login?redirect=/downloads` } : { href: file.href, download: `${file.name}.pdf` }"
          class="flex items-center justify-between bg-gray-800/50 backdrop-blur rounded-lg p-6 border border-gray-500 hover:scale-100 md:hover:scale-[1.05] transition-all duration-300"
        >
          <div>
            <div class="flex items-center gap-2">
              <h2 class="text-lg font-semibold text-white">{{ file.name }}</h2>
              <span v-if="file.requiresAuth" class="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-red-700/40 text-red-300">
                <LockClosedIcon v-if="isLocked(file)" class="size-3" aria-hidden="true" />
                <LockOpenIcon v-else class="size-3" aria-hidden="true" />
                Nur Mitglieder
              </span>
            </div>
            <p class="text-sm text-gray-300">{{ file.description }}</p>
          </div>

          <svg class="w-6 h-6 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
          </svg>
        </component>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { LockClosedIcon, LockOpenIcon } from '@heroicons/vue/24/outline'
import { currentUser } from '../auth'

interface Download {
  id: number
  name: string
  description: string
  href: string
  requiresAuth: boolean
}

const downloads = ref<Download[]>([])

const isLocked = (file: Download) => file.requiresAuth && !currentUser.value

onMounted(async () => {
  try {
    const response = await fetch('/api/downloads')
    const data: { downloads: Download[] } = await response.json()
    downloads.value = data.downloads || []
  } catch (error) {
    console.error('Failed to load downloads:', error)
  }
})
</script>

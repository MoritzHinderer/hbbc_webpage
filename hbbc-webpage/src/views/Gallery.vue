<template>
  <div class="min-h-screen" style="background: linear-gradient(to bottom, rgb(31, 41, 55) 0%, rgb(80, 7, 7) 100%);">
    <div class="max-w-6xl mx-auto px-6 py-16 text-center space-y-12">
      <div class="space-y-4">
        <h1 class="text-4xl md:text-5xl font-bold text-white">Galerie</h1>
        <p class="text-xl text-gray-200">Impressionen von Fanclub-Treffen und VfB-Spielen.</p>
      </div>

      <div v-if="photos.length" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <button
          v-for="(photo, index) in photos"
          :key="photo.file"
          class="group relative aspect-square rounded-lg overflow-hidden border border-gray-700"
          @click="openLightbox(index)"
        >
          <img
            :src="`/api/gallery/photos/${photo.file}`"
            :alt="photo.caption || 'HBBC Galeriebild'"
            loading="lazy"
            class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
        </button>
      </div>

      <div v-else class="bg-gray-800/50 backdrop-blur rounded-lg p-10 border border-gray-500 text-gray-300">
        Noch keine Bilder hochgeladen. Schau bald wieder vorbei!
      </div>
    </div>

    <!-- Lightbox -->
    <div
      v-if="activeIndex !== null"
      class="fixed inset-0 z-50 bg-black/90 flex items-center justify-center px-4"
      @click.self="closeLightbox"
    >
      <button class="absolute top-6 right-6 text-white text-3xl hover:text-red-400" aria-label="Schließen" @click="closeLightbox">
        &times;
      </button>
      <button class="absolute left-4 md:left-8 text-white text-4xl hover:text-red-400" aria-label="Vorheriges Bild" @click="previous">
        ‹
      </button>

      <figure class="max-w-4xl max-h-[80vh] text-center">
        <img
          :src="`/api/gallery/photos/${activePhoto?.file}`"
          :alt="activePhoto?.caption || 'HBBC Galeriebild'"
          class="max-h-[70vh] mx-auto rounded-lg"
        />
        <figcaption v-if="activePhoto?.caption" class="text-gray-300 mt-4">{{ activePhoto.caption }}</figcaption>
      </figure>

      <button class="absolute right-4 md:right-8 text-white text-4xl hover:text-red-400" aria-label="Nächstes Bild" @click="next">
        ›
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

interface Photo {
  file: string
  caption?: string
}

const photos = ref<Photo[]>([])
const activeIndex = ref<number | null>(null)
const activePhoto = computed(() => (activeIndex.value !== null ? photos.value[activeIndex.value] : null))

const openLightbox = (index: number) => {
  activeIndex.value = index
}

const closeLightbox = () => {
  activeIndex.value = null
}

const next = () => {
  if (activeIndex.value === null) return
  activeIndex.value = (activeIndex.value + 1) % photos.value.length
}

const previous = () => {
  if (activeIndex.value === null) return
  activeIndex.value = (activeIndex.value - 1 + photos.value.length) % photos.value.length
}

const handleKeydown = (event: KeyboardEvent) => {
  if (activeIndex.value === null) return
  if (event.key === 'Escape') closeLightbox()
  if (event.key === 'ArrowRight') next()
  if (event.key === 'ArrowLeft') previous()
}

onMounted(async () => {
  window.addEventListener('keydown', handleKeydown)
  try {
    const response = await fetch('/api/gallery', { credentials: 'include' })
    if (response.status === 401) {
      router.push({ path: '/login', query: { redirect: '/gallery' } })
      return
    }
    if (!response.ok) throw new Error(`request failed with ${response.status}`)
    const data: { photos: Photo[] } = await response.json()
    photos.value = data.photos || []
  } catch (error) {
    console.error('Failed to load gallery:', error)
  }
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

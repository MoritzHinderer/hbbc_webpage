<template>
  <div class="min-h-screen" style="background: linear-gradient(to bottom, rgb(31, 41, 55) 0%, rgb(80, 7, 7) 100%);">
    <div class="max-w-6xl mx-auto px-6 py-16 text-center space-y-12">
      <div class="space-y-4">
        <h1 class="text-4xl md:text-5xl font-bold text-white">Galerie</h1>
        <p class="text-xl text-gray-200">Impressionen von Fanclub-Treffen und VfB-Spielen.</p>
      </div>

      <!-- Upload trigger -->
      <button
        type="button"
        class="btn-animated inline-flex items-center justify-center w-14 h-14 rounded-full bg-red-700 hover:bg-red-600 text-white text-3xl leading-none shadow-lg shadow-red-950/40 transition-colors"
        title="Foto hochladen"
        aria-label="Foto hochladen"
        @click="openUploadModal"
      >
        +
      </button>

      <!-- Ambient, always-moving album carousels -->
      <div v-if="groups.length" class="space-y-20 text-left">
        <div
          v-for="(group, index) in groups"
          :key="group.id ?? 'none'"
          class="gallery-section"
          :style="{ animationDelay: `${index * 120}ms` }"
        >
          <!-- Album header -->
          <div class="mb-4">
            <h2 class="text-base font-medium text-gray-300 tracking-tight">{{ group.name }}</h2>
            <p class="text-xs text-gray-500">
              {{ group.photos.length }} {{ group.photos.length === 1 ? 'Foto' : 'Fotos' }}
              <span v-if="group.eventLabel"> · {{ group.eventLabel }}</span>
            </p>
          </div>

          <Swiper
            :modules="[EffectCoverflow, Autoplay, Pagination]"
            effect="coverflow"
            :grab-cursor="true"
            :centered-slides="true"
            :slides-per-view="1.15"
            :space-between="24"
            :speed="900"
            :rewind="true"
            :breakpoints="{
              640: { slidesPerView: 1.6 },
              768: { slidesPerView: 2.2 },
              1024: { slidesPerView: 3.2 },
            }"
            :coverflow-effect="{ rotate: 18, stretch: 0, depth: 140, modifier: 1.2, slideShadows: true }"
            :autoplay="group.photos.length > 1 ? { delay: 2600 + index * 350, disableOnInteraction: false, pauseOnMouseEnter: true, reverseDirection: index % 2 === 1 } : false"
            :pagination="{ clickable: true }"
            class="gallery-swiper pb-10"
          >
            <SwiperSlide v-for="photo in group.photos" :key="photo.file">
              <button
                type="button"
                class="group block w-full aspect-square rounded-xl overflow-hidden border border-gray-700 shadow-xl shadow-black/40"
                @click="openLightbox(photo)"
              >
                <img
                  :src="`/api/gallery/photos/${photo.file}`"
                  :alt="photo.caption || 'HBBC Galeriebild'"
                  loading="lazy"
                  class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </button>
            </SwiperSlide>
          </Swiper>
        </div>
      </div>

      <div v-else class="bg-gray-800/50 backdrop-blur rounded-lg p-10 border border-gray-500 text-gray-300">
        Noch keine Bilder hochgeladen. Schau bald wieder vorbei!
      </div>
    </div>

    <!-- Upload modal -->
    <div v-if="uploadModalOpen" class="fixed inset-0 z-50 bg-black/80 flex items-center justify-center px-4" @click.self="closeUploadModal">
      <form
        class="bg-gray-800 backdrop-blur rounded-lg p-6 border border-gray-500 text-left space-y-4 max-w-xl w-full relative"
        @submit.prevent="handleUpload"
      >
        <button type="button" class="absolute top-4 right-4 text-gray-400 hover:text-red-400 text-2xl leading-none" aria-label="Schließen" @click="closeUploadModal">&times;</button>
        <h2 class="text-lg font-semibold text-white">Foto hochladen</h2>
        <p v-if="uploadMessage" class="text-green-400 text-sm">{{ uploadMessage }}</p>
        <p v-if="uploadError" class="text-red-400 text-sm">{{ uploadError }}</p>

        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1">Bild <span class="text-gray-500">(PNG/JPEG/WebP)</span></label>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            required
            class="w-full text-sm text-gray-300 cursor-pointer file:mr-4 file:cursor-pointer file:rounded-md file:border-0 file:bg-red-700 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white file:transition-colors hover:file:bg-red-600"
            @change="onFileChange"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1">Bildunterschrift <span class="text-gray-500">(optional)</span></label>
          <input v-model="caption" type="text" maxlength="300"
            class="w-full rounded-md bg-gray-900/60 border border-gray-600 px-3 py-2 text-white focus:outline-none focus:border-red-500" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1">Album <span class="text-gray-500">(optional)</span></label>
          <div class="flex gap-2">
            <select v-model="selectedAlbumId" class="flex-1 rounded-md bg-gray-900/60 border border-gray-600 px-3 py-2 text-white focus:outline-none focus:border-red-500">
              <option value="">Kein Album</option>
              <option v-for="album in albums" :key="album.id" :value="String(album.id)">{{ album.name }}</option>
            </select>
            <button type="button" class="text-sm text-red-400 hover:text-red-300 border border-red-700 hover:border-red-500 rounded-md px-3 whitespace-nowrap transition-colors" @click="showNewAlbumInput = !showNewAlbumInput">
              + Neues Album
            </button>
          </div>
          <div v-if="showNewAlbumInput" class="space-y-2 mt-2">
            <input v-model="newAlbumName" type="text" maxlength="80" placeholder="Albumname"
              class="w-full rounded-md bg-gray-900/60 border border-gray-600 px-3 py-2 text-white focus:outline-none focus:border-red-500" />
            <select v-model="newAlbumEventRef" class="w-full text-sm rounded-md bg-gray-900/60 border border-gray-600 px-3 py-2 text-white focus:outline-none focus:border-red-500">
              <option value="">Kein Bezug zu einem Termin/Spiel</option>
              <optgroup v-if="clubEventOptions.length" label="Fanclub-Termine">
                <option v-for="opt in clubEventOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
              </optgroup>
              <optgroup v-if="vfbUpcomingOptions.length" label="VfB-Spiele (kommend)">
                <option v-for="opt in vfbUpcomingOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
              </optgroup>
              <optgroup v-if="vfbRecentOptions.length" label="VfB-Spiele (gespielt)">
                <option v-for="opt in vfbRecentOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
              </optgroup>
            </select>
            <button type="button" :disabled="!newAlbumName.trim()" class="text-sm text-green-400 hover:text-green-300 border border-green-700 hover:border-green-500 disabled:opacity-50 rounded-md px-3 py-1.5 transition-colors" @click="handleCreateAlbum">
              Anlegen
            </button>
          </div>
        </div>

        <button type="submit" :disabled="uploadStatus === 'sending' || !file"
          class="btn-animated bg-red-700 hover:bg-red-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium px-5 py-2 rounded-lg transition-colors">
          {{ uploadStatus === 'sending' ? 'Wird hochgeladen…' : 'Hochladen' }}
        </button>
      </form>
    </div>

    <!-- Fullscreen viewer (opened by clicking a photo) -->
    <div v-if="lightboxOpen" class="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center px-4" @click.self="closeLightbox">
      <button class="absolute top-6 right-6 text-white text-3xl hover:text-red-400 z-10" aria-label="Schließen" @click="closeLightbox">&times;</button>

      <Swiper
        :modules="[EffectCoverflow, Navigation, Keyboard]"
        effect="coverflow"
        :centered-slides="true"
        :slides-per-view="1.15"
        :coverflow-effect="{ rotate: 30, stretch: 0, depth: 120, modifier: 1, slideShadows: false }"
        :navigation="true"
        :keyboard="{ enabled: true }"
        :initial-slide="initialSlideIndex"
        class="w-full max-w-4xl"
      >
        <SwiperSlide v-for="photo in allApprovedPhotos" :key="photo.file" class="flex flex-col items-center justify-center">
          <img :src="`/api/gallery/photos/${photo.file}`" :alt="photo.caption || 'HBBC Galeriebild'" class="max-h-[65vh] mx-auto rounded-lg" />
          <p v-if="photo.caption" class="text-gray-300 mt-4 text-center">{{ photo.caption }}</p>
        </SwiperSlide>
      </Swiper>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Swiper, SwiperSlide } from 'swiper/vue'
import { EffectCoverflow, Navigation, Keyboard, Autoplay, Pagination } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/effect-coverflow'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

interface Photo {
  file: string
  caption?: string
  albumId?: number | null
}

interface Album {
  id: number
  name: string
  eventType?: 'club-event' | 'vfb-match'
  eventLabel?: string
}

interface ClubEvent {
  id: number
  title: string
  date: string
}

interface VfbMatchOption {
  id: number
  kickoff: string
  opponent: string
  isHome: boolean
}

const photos = ref<Photo[]>([])
const albums = ref<Album[]>([])

const file = ref<File | null>(null)
const caption = ref('')
const selectedAlbumId = ref('')
const showNewAlbumInput = ref(false)
const newAlbumName = ref('')
const newAlbumEventRef = ref('')
const uploadStatus = ref<'idle' | 'sending'>('idle')
const uploadMessage = ref('')
const uploadError = ref('')

// Link options for the "new album" event/match picker — loaded lazily
// (first time the upload modal opens) since most visits never touch it.
const clubEvents = ref<ClubEvent[]>([])
const vfbUpcoming = ref<VfbMatchOption[]>([])
const vfbRecent = ref<VfbMatchOption[]>([])
const linkOptionsLoaded = ref(false)

const formatShortDate = (iso: string) =>
  new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })

const clubEventOptions = computed(() =>
  clubEvents.value
    .slice()
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .map((e) => ({ value: `club-event:${e.id}`, label: `${e.title} · ${formatShortDate(e.date)}` })),
)

const vfbUpcomingOptions = computed(() =>
  vfbUpcoming.value.map((m) => ({
    value: `vfb-match:${m.id}`,
    label: `${m.isHome ? 'vs.' : 'bei'} ${m.opponent} · ${formatShortDate(m.kickoff)}`,
  })),
)

const vfbRecentOptions = computed(() =>
  vfbRecent.value.map((m) => ({
    value: `vfb-match:${m.id}`,
    label: `${m.isHome ? 'vs.' : 'bei'} ${m.opponent} · ${formatShortDate(m.kickoff)}`,
  })),
)

const allEventOptions = computed(() => [...clubEventOptions.value, ...vfbUpcomingOptions.value, ...vfbRecentOptions.value])

const loadLinkOptions = async () => {
  const [eventsRes, upcomingRes, recentRes] = await Promise.allSettled([
    fetch('/api/events', { credentials: 'include' }),
    fetch('/api/vfb-matches'),
    fetch('/api/vfb-matches/recent'),
  ])
  if (eventsRes.status === 'fulfilled' && eventsRes.value.ok) {
    const data = await eventsRes.value.json()
    clubEvents.value = data.events ?? []
  }
  if (upcomingRes.status === 'fulfilled' && upcomingRes.value.ok) {
    const data = await upcomingRes.value.json()
    vfbUpcoming.value = data.matches ?? []
  }
  if (recentRes.status === 'fulfilled' && recentRes.value.ok) {
    const data = await recentRes.value.json()
    vfbRecent.value = data.matches ?? []
  }
}

// Flat, stable order (album-then-ungrouped-last, matching the visual
// grouping below) — the fullscreen viewer browses through everything
// regardless of which thumbnail was clicked, same as before groups existed.
const allApprovedPhotos = computed(() => groups.value.flatMap((g) => g.photos))

const groups = computed(() => {
  const byAlbum = new Map<number, Photo[]>()
  const ungrouped: Photo[] = []
  for (const photo of photos.value) {
    if (photo.albumId != null) {
      const list = byAlbum.get(photo.albumId) ?? []
      list.push(photo)
      byAlbum.set(photo.albumId, list)
    } else {
      ungrouped.push(photo)
    }
  }

  const result: { id: number | null; name: string; photos: Photo[]; eventLabel?: string }[] = []
  for (const album of albums.value) {
    const albumPhotos = byAlbum.get(album.id)
    if (albumPhotos?.length) {
      result.push({ id: album.id, name: album.name, photos: albumPhotos, eventLabel: album.eventLabel })
    }
  }
  if (ungrouped.length) result.push({ id: null, name: 'Ohne Album', photos: ungrouped })
  return result
})

const uploadModalOpen = ref(false)

const openUploadModal = async () => {
  uploadMessage.value = ''
  uploadError.value = ''
  uploadModalOpen.value = true
  if (!linkOptionsLoaded.value) {
    linkOptionsLoaded.value = true
    try {
      await loadLinkOptions()
    } catch (error) {
      console.error('Failed to load event/match link options:', error)
    }
  }
}

const closeUploadModal = () => {
  uploadModalOpen.value = false
}

const lightboxOpen = ref(false)
const initialSlideIndex = ref(0)

const openLightbox = (photo: Photo) => {
  const index = allApprovedPhotos.value.findIndex((p) => p.file === photo.file)
  initialSlideIndex.value = index === -1 ? 0 : index
  lightboxOpen.value = true
}

const closeLightbox = () => {
  lightboxOpen.value = false
}

const onFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  file.value = target.files?.[0] ?? null
}

const loadGallery = async () => {
  const response = await fetch('/api/gallery', { credentials: 'include' })
  if (!response.ok) throw new Error(`request failed with ${response.status}`)
  const data: { photos: Photo[]; albums: Album[] } = await response.json()
  photos.value = data.photos || []
  albums.value = data.albums || []
}

const handleCreateAlbum = async () => {
  if (!newAlbumName.value.trim()) return
  uploadError.value = ''
  try {
    const selectedOption = allEventOptions.value.find((opt) => opt.value === newAlbumEventRef.value)
    const [eventType] = newAlbumEventRef.value ? newAlbumEventRef.value.split(':') : []

    const response = await fetch('/api/gallery/albums', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        name: newAlbumName.value,
        ...(selectedOption ? { eventType, eventLabel: selectedOption.label } : {}),
      }),
    })
    const data = await response.json().catch(() => null)
    if (!response.ok) throw new Error(data?.error || 'Album konnte nicht angelegt werden.')
    albums.value.push(data.album)
    selectedAlbumId.value = String(data.album.id)
    newAlbumName.value = ''
    newAlbumEventRef.value = ''
    showNewAlbumInput.value = false
  } catch (error) {
    uploadError.value = error instanceof Error ? error.message : 'Etwas ist schiefgelaufen.'
  }
}

const handleUpload = async () => {
  if (!file.value) return
  uploadStatus.value = 'sending'
  uploadError.value = ''
  uploadMessage.value = ''

  const body = new FormData()
  body.append('photo', file.value)
  if (caption.value) body.append('caption', caption.value)
  if (selectedAlbumId.value) body.append('albumId', selectedAlbumId.value)

  try {
    const response = await fetch('/api/gallery/photos', { method: 'POST', credentials: 'include', body })
    const data = await response.json().catch(() => null)
    if (!response.ok) throw new Error(data?.error || 'Upload fehlgeschlagen.')

    file.value = null
    caption.value = ''
    uploadMessage.value = 'Danke! Dein Foto wird nach Prüfung durch einen Admin sichtbar.'
  } catch (error) {
    uploadError.value = error instanceof Error ? error.message : 'Etwas ist schiefgelaufen.'
  } finally {
    uploadStatus.value = 'idle'
  }
}

onMounted(async () => {
  try {
    await loadGallery()
  } catch (error) {
    console.error('Failed to load gallery:', error)
  }
})
</script>

<style scoped>
@keyframes gallery-fade-in {
  from {
    opacity: 0;
    transform: translateY(24px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.gallery-section {
  animation: gallery-fade-in 0.7s ease-out both;
}

.gallery-swiper :deep(.swiper-pagination-bullet) {
  background: #f87171;
  opacity: 0.5;
}

.gallery-swiper :deep(.swiper-pagination-bullet-active) {
  opacity: 1;
}
</style>

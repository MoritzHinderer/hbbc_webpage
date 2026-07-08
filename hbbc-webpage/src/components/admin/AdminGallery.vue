<template>
  <div class="space-y-10">
    <p v-if="errorMessage" class="text-red-400 text-sm text-center">{{ errorMessage }}</p>

    <!-- Pending photos awaiting approval -->
    <section v-if="pendingPhotos.length" class="space-y-4">
      <h2 class="text-xl font-bold text-white">Ausstehende Fotos ({{ pendingPhotos.length }})</h2>
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <div v-for="photo in pendingPhotos" :key="photo.file" class="bg-gray-800/50 rounded-lg border border-yellow-600/60 overflow-hidden text-left">
          <img :src="`/api/gallery/photos/${photo.file}`" :alt="photo.caption || 'Galeriebild'" class="w-full aspect-square object-cover" />
          <div class="p-3 space-y-2">
            <p v-if="photo.caption" class="text-sm text-gray-300">{{ photo.caption }}</p>
            <p class="text-xs text-gray-500">von {{ photo.uploaderName || 'unbekannt' }}</p>
            <div class="flex justify-between">
              <button class="text-xs text-green-400 hover:text-green-300 border border-green-700 hover:border-green-500 rounded-md px-2 py-1 transition-colors" @click="handleApprove(photo.file)">
                Freigeben
              </button>
              <button class="text-xs text-red-400 hover:text-red-300 border border-red-700 hover:border-red-500 rounded-md px-2 py-1 transition-colors" @click="handleDelete(photo.file)">
                Ablehnen
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Albums -->
    <section class="space-y-4">
      <h2 class="text-xl font-bold text-white">Alben</h2>
      <div v-if="albums.length" class="flex flex-wrap gap-2">
        <span v-for="album in albums" :key="album.id" class="inline-flex items-center gap-2 bg-gray-800/50 border border-gray-600 rounded-full pl-3 pr-1 py-1 text-sm text-gray-200">
          {{ album.name }}
          <span v-if="album.eventLabel" class="text-gray-500">· {{ album.eventLabel }}</span>
          <button class="text-gray-500 hover:text-red-400 rounded-full w-5 h-5 flex items-center justify-center" title="Album löschen" @click="handleDeleteAlbum(album)">&times;</button>
        </span>
      </div>
      <p v-else class="text-sm text-gray-400">Noch keine Alben — Mitglieder oder Admins können beim Hochladen eines legen.</p>
    </section>

    <!-- Approved photos -->
    <section class="space-y-4">
      <h2 class="text-xl font-bold text-white">Freigegebene Fotos</h2>
      <div v-if="approvedPhotos.length" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <div v-for="photo in approvedPhotos" :key="photo.file" class="bg-gray-800/50 rounded-lg border border-gray-500 overflow-hidden text-left">
          <img :src="`/api/gallery/photos/${photo.file}`" :alt="photo.caption || 'Galeriebild'" class="w-full aspect-square object-cover" />
          <div class="p-3 space-y-2">
            <input v-model="captionDrafts[photo.file]" type="text" maxlength="300" placeholder="Bildunterschrift"
              class="w-full text-sm rounded-md bg-gray-900/60 border border-gray-600 px-2 py-1 text-white focus:outline-none focus:border-red-500" />
            <select v-model="albumDrafts[photo.file]" class="w-full text-sm rounded-md bg-gray-900/60 border border-gray-600 px-2 py-1 text-white focus:outline-none focus:border-red-500">
              <option value="">Kein Album</option>
              <option v-for="album in albums" :key="album.id" :value="String(album.id)">{{ album.name }}</option>
            </select>
            <div class="flex justify-between">
              <button class="text-xs text-gray-300 hover:text-white" @click="saveEdits(photo.file)">Speichern</button>
              <button class="text-xs text-red-400 hover:text-red-300" @click="handleDelete(photo.file)">Löschen</button>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="bg-gray-800/50 backdrop-blur rounded-lg p-10 border border-gray-500 text-gray-300 text-center">
        Noch keine Bilder hochgeladen.
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted } from 'vue'

interface Photo {
  file: string
  caption?: string
  albumId?: number | null
  status?: 'pending' | 'approved'
  uploaderName?: string | null
}

interface Album {
  id: number
  name: string
  eventLabel?: string
}

const photos = ref<Photo[]>([])
const albums = ref<Album[]>([])
const captionDrafts = reactive<Record<string, string>>({})
const albumDrafts = reactive<Record<string, string>>({})
const errorMessage = ref('')

const pendingPhotos = computed(() => photos.value.filter((p) => p.status === 'pending'))
const approvedPhotos = computed(() => photos.value.filter((p) => p.status !== 'pending'))

const loadPhotos = async () => {
  try {
    const [photosRes, albumsRes] = await Promise.all([
      fetch('/api/admin/gallery', { credentials: 'include' }),
      fetch('/api/admin/gallery/albums', { credentials: 'include' }),
    ])
    if (!photosRes.ok || !albumsRes.ok) throw new Error('Galerie konnte nicht geladen werden.')
    const photosData = await photosRes.json()
    const albumsData = await albumsRes.json()
    photos.value = photosData.photos
    albums.value = albumsData.albums
    for (const photo of photosData.photos as Photo[]) {
      captionDrafts[photo.file] = photo.caption ?? ''
      albumDrafts[photo.file] = photo.albumId != null ? String(photo.albumId) : ''
    }
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Etwas ist schiefgelaufen.'
  }
}

const saveEdits = async (filename: string) => {
  errorMessage.value = ''
  try {
    const response = await fetch(`/api/admin/gallery/${encodeURIComponent(filename)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ caption: captionDrafts[filename], albumId: albumDrafts[filename] || null }),
    })
    if (!response.ok) {
      const data = await response.json().catch(() => null)
      throw new Error(data?.error || 'Speichern fehlgeschlagen.')
    }
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Etwas ist schiefgelaufen.'
  }
}

const handleApprove = async (filename: string) => {
  errorMessage.value = ''
  try {
    const response = await fetch(`/api/admin/gallery/${encodeURIComponent(filename)}/approve`, {
      method: 'POST',
      credentials: 'include',
    })
    if (!response.ok) {
      const data = await response.json().catch(() => null)
      throw new Error(data?.error || 'Freigabe fehlgeschlagen.')
    }
    await loadPhotos()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Etwas ist schiefgelaufen.'
  }
}

const handleDelete = async (filename: string) => {
  if (!confirm('Dieses Bild wirklich löschen?')) return
  errorMessage.value = ''
  try {
    const response = await fetch(`/api/admin/gallery/${encodeURIComponent(filename)}`, {
      method: 'DELETE',
      credentials: 'include',
    })
    if (!response.ok) {
      const data = await response.json().catch(() => null)
      throw new Error(data?.error || 'Löschen fehlgeschlagen.')
    }
    photos.value = photos.value.filter((p) => p.file !== filename)
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Etwas ist schiefgelaufen.'
  }
}

const handleDeleteAlbum = async (album: Album) => {
  if (!confirm(`Album "${album.name}" wirklich löschen? Enthaltene Fotos werden zu "Ohne Album".`)) return
  errorMessage.value = ''
  try {
    const response = await fetch(`/api/admin/gallery/albums/${album.id}`, { method: 'DELETE', credentials: 'include' })
    if (!response.ok) {
      const data = await response.json().catch(() => null)
      throw new Error(data?.error || 'Album konnte nicht gelöscht werden.')
    }
    await loadPhotos()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Etwas ist schiefgelaufen.'
  }
}

onMounted(loadPhotos)
</script>

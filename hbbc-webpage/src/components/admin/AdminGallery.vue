<template>
  <div class="space-y-8">
    <p v-if="errorMessage" class="text-red-400 text-sm text-center">{{ errorMessage }}</p>

    <form
      class="bg-gray-800/50 backdrop-blur rounded-lg p-6 border border-gray-500 text-left space-y-4 max-w-xl mx-auto"
      @submit.prevent="handleUpload"
    >
      <h2 class="text-lg font-semibold text-white">Foto hochladen</h2>

      <div>
        <label class="block text-sm font-medium text-gray-300 mb-1">Bild <span class="text-gray-500">(PNG/JPEG/WebP)</span></label>
        <input type="file" accept="image/png,image/jpeg,image/webp" required
          class="w-full text-sm text-gray-300 cursor-pointer file:mr-4 file:cursor-pointer file:rounded-md file:border-0 file:bg-red-700 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white file:transition-colors hover:file:bg-red-600"
          @change="onFileChange" />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-300 mb-1">Bildunterschrift <span class="text-gray-500">(optional)</span></label>
        <input v-model="caption" type="text" maxlength="300"
          class="w-full rounded-md bg-gray-900/60 border border-gray-600 px-3 py-2 text-white focus:outline-none focus:border-red-500" />
      </div>

      <button type="submit" :disabled="status === 'sending' || !file"
        class="btn-animated bg-red-700 hover:bg-red-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium px-5 py-2 rounded-lg transition-colors">
        {{ status === 'sending' ? 'Wird hochgeladen…' : 'Hochladen' }}
      </button>
    </form>

    <div v-if="photos.length" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      <div v-for="photo in photos" :key="photo.file" class="bg-gray-800/50 rounded-lg border border-gray-500 overflow-hidden text-left">
        <img :src="`/api/gallery/photos/${photo.file}`" :alt="photo.caption || 'Galeriebild'" class="w-full aspect-square object-cover" />
        <div class="p-3 space-y-2">
          <input v-model="captionDrafts[photo.file]" type="text" maxlength="300" placeholder="Bildunterschrift"
            class="w-full text-sm rounded-md bg-gray-900/60 border border-gray-600 px-2 py-1 text-white focus:outline-none focus:border-red-500" />
          <div class="flex justify-between">
            <button class="text-xs text-gray-300 hover:text-white" @click="saveCaption(photo.file)">Speichern</button>
            <button class="text-xs text-red-400 hover:text-red-300" @click="handleDelete(photo.file)">Löschen</button>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="bg-gray-800/50 backdrop-blur rounded-lg p-10 border border-gray-500 text-gray-300 text-center">
      Noch keine Bilder hochgeladen.
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'

interface Photo {
  file: string
  caption?: string
}

const photos = ref<Photo[]>([])
const captionDrafts = reactive<Record<string, string>>({})
const errorMessage = ref('')
const status = ref<'idle' | 'sending'>('idle')
const file = ref<File | null>(null)
const caption = ref('')

const loadPhotos = async () => {
  try {
    const response = await fetch('/api/admin/gallery', { credentials: 'include' })
    if (!response.ok) throw new Error('Galerie konnte nicht geladen werden.')
    const data = await response.json()
    photos.value = data.photos
    for (const photo of data.photos as Photo[]) {
      captionDrafts[photo.file] = photo.caption ?? ''
    }
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Etwas ist schiefgelaufen.'
  }
}

const onFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  file.value = target.files?.[0] ?? null
}

const handleUpload = async () => {
  if (!file.value) return
  status.value = 'sending'
  errorMessage.value = ''

  const body = new FormData()
  body.append('photo', file.value)
  if (caption.value) body.append('caption', caption.value)

  try {
    const response = await fetch('/api/admin/gallery', { method: 'POST', credentials: 'include', body })
    const data = await response.json().catch(() => null)
    if (!response.ok) throw new Error(data?.error || 'Upload fehlgeschlagen.')

    file.value = null
    caption.value = ''
    await loadPhotos()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Etwas ist schiefgelaufen.'
  } finally {
    status.value = 'idle'
  }
}

const saveCaption = async (filename: string) => {
  errorMessage.value = ''
  try {
    const response = await fetch(`/api/admin/gallery/${encodeURIComponent(filename)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ caption: captionDrafts[filename] }),
    })
    if (!response.ok) {
      const data = await response.json().catch(() => null)
      throw new Error(data?.error || 'Speichern fehlgeschlagen.')
    }
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

onMounted(loadPhotos)
</script>

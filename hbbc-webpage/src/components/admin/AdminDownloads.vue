<template>
  <div class="space-y-8">
    <p v-if="errorMessage" class="text-red-400 text-sm text-center">{{ errorMessage }}</p>

    <div class="flex justify-center">
      <button
        v-if="!showForm"
        type="button"
        class="btn-animated bg-red-700 hover:bg-red-600 text-white font-medium px-6 py-2.5 rounded-lg transition-colors"
        @click="startCreate"
      >
        + Dokument hinzufügen
      </button>
    </div>

    <form
      v-if="showForm"
      class="bg-gray-800/50 backdrop-blur rounded-lg p-6 border border-gray-500 text-left space-y-4 max-w-xl mx-auto"
      @submit.prevent="handleSubmit"
    >
      <h2 class="text-lg font-semibold text-white">{{ editingId ? 'Dokument bearbeiten' : 'Neues Dokument' }}</h2>

      <div>
        <label class="block text-sm font-medium text-gray-300 mb-1">Name</label>
        <input v-model="form.name" type="text" required maxlength="150"
          class="w-full rounded-md bg-gray-900/60 border border-gray-600 px-3 py-2 text-white focus:outline-none focus:border-red-500" />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-300 mb-1">Beschreibung</label>
        <input v-model="form.description" type="text" required maxlength="300"
          class="w-full rounded-md bg-gray-900/60 border border-gray-600 px-3 py-2 text-white focus:outline-none focus:border-red-500" />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-300 mb-1">
          PDF-Datei <span class="text-gray-500">{{ editingId ? '(optional, ersetzt die aktuelle Datei)' : '' }}</span>
        </label>
        <input type="file" accept="application/pdf" :required="!editingId"
          class="w-full text-sm text-gray-300 cursor-pointer file:mr-4 file:cursor-pointer file:rounded-md file:border-0 file:bg-red-700 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white file:transition-colors hover:file:bg-red-600"
          @change="onFileChange" />
      </div>

      <label class="flex items-center gap-2 text-sm text-gray-300">
        <input v-model="form.requiresAuth" type="checkbox" class="rounded border-gray-600 bg-gray-900/60 text-red-600 focus:ring-red-500" />
        Nur für angemeldete Mitglieder
      </label>

      <div class="flex gap-3 pt-2">
        <button type="submit" :disabled="status === 'sending'"
          class="btn-animated bg-red-700 hover:bg-red-600 disabled:bg-gray-600 text-white font-medium px-5 py-2 rounded-lg transition-colors">
          {{ status === 'sending' ? 'Wird gespeichert…' : 'Speichern' }}
        </button>
        <button type="button" class="text-gray-300 hover:text-white px-5 py-2" @click="cancelForm">Abbrechen</button>
      </div>
    </form>

    <div v-if="downloads.length" class="grid gap-3">
      <div v-for="item in downloads" :key="item.id"
        class="bg-gray-800/50 backdrop-blur rounded-lg p-5 border border-gray-500 text-left flex items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2">
            <h3 class="text-white font-semibold">{{ item.name }}</h3>
            <span v-if="item.requiresAuth" class="inline-block text-xs font-semibold px-2 py-0.5 rounded-full bg-red-700/40 text-red-300">
              Nur Mitglieder
            </span>
          </div>
          <p class="text-gray-400 text-sm">{{ item.description }}</p>
          <a :href="item.href" target="_blank" class="text-red-400 hover:text-red-300 text-xs">{{ item.href }}</a>
        </div>
        <div class="flex gap-2 shrink-0">
          <button class="text-sm text-gray-300 hover:text-white" @click="startEdit(item)">Bearbeiten</button>
          <button class="text-sm text-red-400 hover:text-red-300" @click="handleDelete(item.id)">Löschen</button>
        </div>
      </div>
    </div>
    <div v-else-if="!showForm" class="bg-gray-800/50 backdrop-blur rounded-lg p-10 border border-gray-500 text-gray-300 text-center">
      Noch keine Dokumente hochgeladen.
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'

interface Download {
  id: number
  name: string
  description: string
  href: string
  requiresAuth: boolean
}

const downloads = ref<Download[]>([])
const errorMessage = ref('')
const status = ref<'idle' | 'sending'>('idle')
const showForm = ref(false)
const editingId = ref<number | null>(null)
const file = ref<File | null>(null)

const emptyForm = () => ({ name: '', description: '', requiresAuth: false })
const form = reactive(emptyForm())

const loadDownloads = async () => {
  try {
    const response = await fetch('/api/admin/downloads', { credentials: 'include' })
    if (!response.ok) throw new Error('Downloads konnten nicht geladen werden.')
    const data = await response.json()
    downloads.value = data.downloads
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Etwas ist schiefgelaufen.'
  }
}

const startCreate = () => {
  editingId.value = null
  Object.assign(form, emptyForm())
  file.value = null
  showForm.value = true
}

const startEdit = (item: Download) => {
  editingId.value = item.id
  Object.assign(form, { name: item.name, description: item.description, requiresAuth: item.requiresAuth })
  file.value = null
  showForm.value = true
}

const cancelForm = () => {
  showForm.value = false
  editingId.value = null
}

const onFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  file.value = target.files?.[0] ?? null
}

const handleSubmit = async () => {
  status.value = 'sending'
  errorMessage.value = ''

  const body = new FormData()
  body.append('name', form.name)
  body.append('description', form.description)
  body.append('requiresAuth', String(form.requiresAuth))
  if (file.value) body.append('file', file.value)

  try {
    const url = editingId.value ? `/api/admin/downloads/${editingId.value}` : '/api/admin/downloads'
    const response = await fetch(url, { method: editingId.value ? 'PUT' : 'POST', credentials: 'include', body })
    const data = await response.json().catch(() => null)
    if (!response.ok) throw new Error(data?.error || 'Speichern fehlgeschlagen.')

    showForm.value = false
    editingId.value = null
    await loadDownloads()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Etwas ist schiefgelaufen.'
  } finally {
    status.value = 'idle'
  }
}

const handleDelete = async (id: number) => {
  if (!confirm('Dieses Dokument wirklich löschen?')) return
  errorMessage.value = ''
  try {
    const response = await fetch(`/api/admin/downloads/${id}`, { method: 'DELETE', credentials: 'include' })
    if (!response.ok) {
      const data = await response.json().catch(() => null)
      throw new Error(data?.error || 'Löschen fehlgeschlagen.')
    }
    downloads.value = downloads.value.filter((d) => d.id !== id)
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Etwas ist schiefgelaufen.'
  }
}

onMounted(loadDownloads)
</script>

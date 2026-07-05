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
        + Termin hinzufügen
      </button>
    </div>

    <form
      v-if="showForm"
      class="bg-gray-800/50 backdrop-blur rounded-lg p-6 border border-gray-500 text-left space-y-4 max-w-xl mx-auto"
      @submit.prevent="handleSubmit"
    >
      <h2 class="text-lg font-semibold text-white">{{ editingId ? 'Termin bearbeiten' : 'Neuer Termin' }}</h2>

      <div>
        <label class="block text-sm font-medium text-gray-300 mb-1">Titel</label>
        <input v-model="form.title" type="text" required maxlength="150"
          class="w-full rounded-md bg-gray-900/60 border border-gray-600 px-3 py-2 text-white focus:outline-none focus:border-red-500" />
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1">Datum</label>
          <input v-model="form.date" type="date" required
            class="w-full rounded-md bg-gray-900/60 border border-gray-600 px-3 py-2 text-white focus:outline-none focus:border-red-500" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1">Uhrzeit <span class="text-gray-500">(optional)</span></label>
          <input v-model="form.time" type="time"
            class="w-full rounded-md bg-gray-900/60 border border-gray-600 px-3 py-2 text-white focus:outline-none focus:border-red-500" />
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-300 mb-1">Typ</label>
        <select v-model="form.type"
          class="w-full rounded-md bg-gray-900/60 border border-gray-600 px-3 py-2 text-white focus:outline-none focus:border-red-500">
          <option value="match">VfB-Spiel</option>
          <option value="meetup">Fanclub-Treffen</option>
        </select>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-300 mb-1">Ort <span class="text-gray-500">(optional)</span></label>
        <input v-model="form.location" type="text" maxlength="150"
          class="w-full rounded-md bg-gray-900/60 border border-gray-600 px-3 py-2 text-white focus:outline-none focus:border-red-500" />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-300 mb-1">Beschreibung <span class="text-gray-500">(optional)</span></label>
        <textarea v-model="form.description" maxlength="1000" rows="3"
          class="w-full rounded-md bg-gray-900/60 border border-gray-600 px-3 py-2 text-white focus:outline-none focus:border-red-500"></textarea>
      </div>

      <div class="flex gap-3 pt-2">
        <button type="submit" :disabled="status === 'sending'"
          class="btn-animated bg-red-700 hover:bg-red-600 disabled:bg-gray-600 text-white font-medium px-5 py-2 rounded-lg transition-colors">
          {{ status === 'sending' ? 'Wird gespeichert…' : 'Speichern' }}
        </button>
        <button type="button" class="text-gray-300 hover:text-white px-5 py-2" @click="cancelForm">Abbrechen</button>
      </div>
    </form>

    <div v-if="events.length" class="grid gap-3">
      <div v-for="event in sortedEvents" :key="event.id"
        class="bg-gray-800/50 backdrop-blur rounded-lg p-5 border border-gray-500 text-left flex items-start justify-between gap-4">
        <div>
          <span :class="['inline-block text-xs font-semibold px-2 py-0.5 rounded-full mb-1', event.type === 'match' ? 'bg-red-700/40 text-red-300' : 'bg-green-700/40 text-green-300']">
            {{ event.type === 'match' ? 'VfB-Spiel' : 'Fanclub-Treffen' }}
          </span>
          <h3 class="text-white font-semibold">{{ event.title }}</h3>
          <p class="text-gray-400 text-sm">{{ event.date }}<span v-if="event.time"> · {{ event.time }}</span><span v-if="event.location"> · {{ event.location }}</span></p>
        </div>
        <div class="flex gap-2 shrink-0">
          <button class="text-sm text-gray-300 hover:text-white" @click="startEdit(event)">Bearbeiten</button>
          <button class="text-sm text-red-400 hover:text-red-300" @click="handleDelete(event.id)">Löschen</button>
        </div>
      </div>
    </div>
    <div v-else-if="!showForm" class="bg-gray-800/50 backdrop-blur rounded-lg p-10 border border-gray-500 text-gray-300 text-center">
      Noch keine Termine angelegt.
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, onMounted } from 'vue'

interface ClubEvent {
  id: number
  title: string
  date: string
  time?: string
  location?: string
  type: 'match' | 'meetup'
  description?: string
}

const events = ref<ClubEvent[]>([])
const errorMessage = ref('')
const status = ref<'idle' | 'sending'>('idle')
const showForm = ref(false)
const editingId = ref<number | null>(null)

const emptyForm = () => ({ title: '', date: '', time: '', location: '', type: 'match' as const, description: '' })
const form = reactive(emptyForm())

const sortedEvents = computed(() =>
  [...events.value].sort((a, b) => `${b.date}${b.time || ''}`.localeCompare(`${a.date}${a.time || ''}`)),
)

const loadEvents = async () => {
  try {
    const response = await fetch('/api/admin/events', { credentials: 'include' })
    if (!response.ok) throw new Error('Termine konnten nicht geladen werden.')
    const data = await response.json()
    events.value = data.events
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Etwas ist schiefgelaufen.'
  }
}

const startCreate = () => {
  editingId.value = null
  Object.assign(form, emptyForm())
  showForm.value = true
}

const startEdit = (event: ClubEvent) => {
  editingId.value = event.id
  Object.assign(form, { ...emptyForm(), ...event })
  showForm.value = true
}

const cancelForm = () => {
  showForm.value = false
  editingId.value = null
}

const handleSubmit = async () => {
  status.value = 'sending'
  errorMessage.value = ''

  try {
    const url = editingId.value ? `/api/admin/events/${editingId.value}` : '/api/admin/events'
    const response = await fetch(url, {
      method: editingId.value ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(form),
    })
    const data = await response.json().catch(() => null)
    if (!response.ok) throw new Error(data?.error || 'Speichern fehlgeschlagen.')

    showForm.value = false
    editingId.value = null
    await loadEvents()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Etwas ist schiefgelaufen.'
  } finally {
    status.value = 'idle'
  }
}

const handleDelete = async (id: number) => {
  if (!confirm('Diesen Termin wirklich löschen?')) return
  errorMessage.value = ''
  try {
    const response = await fetch(`/api/admin/events/${id}`, { method: 'DELETE', credentials: 'include' })
    if (!response.ok) {
      const data = await response.json().catch(() => null)
      throw new Error(data?.error || 'Löschen fehlgeschlagen.')
    }
    events.value = events.value.filter((e) => e.id !== id)
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Etwas ist schiefgelaufen.'
  }
}

onMounted(loadEvents)
</script>

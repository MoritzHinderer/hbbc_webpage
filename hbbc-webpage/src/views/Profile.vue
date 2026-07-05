<template>
  <div class="min-h-screen" style="background: linear-gradient(to bottom, rgb(31, 41, 55) 0%, rgb(80, 7, 7) 100%);">
    <div class="max-w-xl mx-auto px-6 py-16 space-y-8">
      <div class="text-center space-y-4">
        <h1 class="text-4xl md:text-5xl font-bold text-white">Mein Profil</h1>
        <p class="text-xl text-gray-200">Verwalte deine öffentliche Mitgliederkarte.</p>
      </div>

      <p v-if="errorMessage" class="text-red-400 text-sm text-center">{{ errorMessage }}</p>
      <p v-if="successMessage" class="text-green-400 text-sm text-center">{{ successMessage }}</p>

      <div v-if="loading" class="text-center text-gray-400">Lädt…</div>

      <template v-else>
        <div v-if="member" class="bg-gray-800/50 backdrop-blur rounded-lg p-4 border border-gray-600 text-sm text-gray-300 text-center">
          Titel: <span class="text-white font-medium">{{ member.role }}</span>
          · Mitglied seit: <span class="text-white font-medium">{{ member.joined }}</span>
          <br />
          <span class="text-gray-500">Titel und Beitrittsdatum werden vom Vorstand vergeben.</span>
        </div>
        <p v-else class="text-gray-400 text-sm text-center">
          Du hast noch keine Mitgliederkarte. Titel und Beitrittsdatum vergibt der Vorstand, sobald deine Karte angelegt ist.
        </p>

        <form
          class="bg-gray-800/50 backdrop-blur rounded-lg p-6 border border-gray-500 text-left space-y-4"
          @submit.prevent="handleSubmit"
        >
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">Name</label>
            <input v-model="form.name" type="text" required maxlength="100"
              class="w-full rounded-md bg-gray-900/60 border border-gray-600 px-3 py-2 text-white focus:outline-none focus:border-red-500" />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">Standort <span class="text-gray-500">(optional, für die Karte)</span></label>
            <input v-model="form.location" type="text" maxlength="100"
              class="w-full rounded-md bg-gray-900/60 border border-gray-600 px-3 py-2 text-white focus:outline-none focus:border-red-500" />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">Über mich</label>
            <textarea v-model="form.about_me" required maxlength="2000" rows="4"
              class="w-full rounded-md bg-gray-900/60 border border-gray-600 px-3 py-2 text-white focus:outline-none focus:border-red-500"></textarea>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">Foto <span class="text-gray-500">(optional, PNG/JPEG/WebP)</span></label>

            <div v-if="member?.picture && !removePicture" class="flex items-center gap-3 mb-2">
              <img :src="member.picture" alt="Aktuelles Foto" class="w-16 h-16 rounded-md object-cover border border-gray-600" />
              <button type="button" class="text-sm text-red-400 hover:text-red-300" @click="removePicture = true">Foto entfernen</button>
            </div>
            <p v-else-if="member?.picture && removePicture" class="text-sm text-gray-400 mb-2">
              Foto wird beim Speichern entfernt.
              <button type="button" class="text-red-400 hover:text-red-300 underline" @click="removePicture = false">Rückgängig</button>
            </p>

            <input type="file" accept="image/png,image/jpeg,image/webp"
              class="w-full text-sm text-gray-300 cursor-pointer file:mr-4 file:cursor-pointer file:rounded-md file:border-0 file:bg-red-700 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white file:transition-colors hover:file:bg-red-600"
              @change="onFileChange" />
          </div>

          <div class="flex gap-3 pt-2">
            <button type="submit" :disabled="status === 'sending'"
              class="btn-animated bg-red-700 hover:bg-red-600 disabled:bg-gray-600 text-white font-medium px-5 py-2 rounded-lg transition-colors">
              {{ status === 'sending' ? 'Wird gespeichert…' : (member ? 'Speichern' : 'Karte erstellen') }}
            </button>
            <button v-if="member" type="button" class="text-red-400 hover:text-red-300 px-5 py-2" @click="handleDelete">
              Karte löschen
            </button>
          </div>
        </form>

        <div class="bg-gray-800/50 backdrop-blur rounded-lg p-6 border border-gray-500 flex items-center justify-between gap-4">
          <div>
            <h3 class="text-white font-semibold">Newsletter</h3>
            <p class="text-gray-400 text-sm">Erhalte Neuigkeiten und Ankündigungen des HBBC per E-Mail.</p>
          </div>
          <button
            type="button"
            :disabled="newsletterStatus === 'sending'"
            class="btn-animated shrink-0 font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-60"
            :class="currentUser?.newsletterSubscribed ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-red-700 hover:bg-red-600 text-white'"
            @click="toggleNewsletter"
          >
            {{ currentUser?.newsletterSubscribed ? 'Abbestellen' : 'Abonnieren' }}
          </button>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { currentUser } from '../auth'

interface Member {
  id: number
  name: string
  role: string
  joined: string
  location?: string
  about_me: string
  picture?: string | null
}

const member = ref<Member | null>(null)
const loading = ref(true)
const errorMessage = ref('')
const successMessage = ref('')
const status = ref<'idle' | 'sending'>('idle')
const pictureFile = ref<File | null>(null)
const removePicture = ref(false)

const form = reactive({ name: '', location: '', about_me: '' })

const loadMember = async () => {
  loading.value = true
  try {
    const response = await fetch('/api/profile/member', { credentials: 'include' })
    if (!response.ok) throw new Error('Profil konnte nicht geladen werden.')
    const data = await response.json()
    member.value = data.member
    if (data.member) {
      form.name = data.member.name
      form.location = data.member.location ?? ''
      form.about_me = data.member.about_me
    }
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Etwas ist schiefgelaufen.'
  } finally {
    loading.value = false
  }
}

const onFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  pictureFile.value = target.files?.[0] ?? null
  if (pictureFile.value) removePicture.value = false
}

const handleSubmit = async () => {
  status.value = 'sending'
  errorMessage.value = ''
  successMessage.value = ''

  const body = new FormData()
  body.append('name', form.name)
  body.append('location', form.location)
  body.append('about_me', form.about_me)
  if (pictureFile.value) body.append('picture', pictureFile.value)
  if (removePicture.value) body.append('removePicture', 'true')

  try {
    const response = await fetch('/api/profile/member', {
      method: member.value ? 'PUT' : 'POST',
      credentials: 'include',
      body,
    })
    const data = await response.json().catch(() => null)
    if (!response.ok) throw new Error(data?.error || 'Speichern fehlgeschlagen.')

    successMessage.value = member.value ? 'Karte aktualisiert.' : 'Karte erstellt.'
    pictureFile.value = null
    removePicture.value = false
    await loadMember()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Etwas ist schiefgelaufen.'
  } finally {
    status.value = 'idle'
  }
}

const handleDelete = async () => {
  if (!confirm('Deine Mitgliederkarte wirklich löschen?')) return
  errorMessage.value = ''
  successMessage.value = ''
  try {
    const response = await fetch('/api/profile/member', { method: 'DELETE', credentials: 'include' })
    if (!response.ok) {
      const data = await response.json().catch(() => null)
      throw new Error(data?.error || 'Löschen fehlgeschlagen.')
    }
    member.value = null
    form.name = ''
    form.location = ''
    form.about_me = ''
    successMessage.value = 'Karte gelöscht.'
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Etwas ist schiefgelaufen.'
  }
}

const newsletterStatus = ref<'idle' | 'sending'>('idle')

const toggleNewsletter = async () => {
  if (!currentUser.value) return
  newsletterStatus.value = 'sending'
  errorMessage.value = ''
  successMessage.value = ''
  const nextSubscribed = !currentUser.value.newsletterSubscribed
  try {
    const response = await fetch('/api/profile/newsletter', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ subscribed: nextSubscribed }),
    })
    const data = await response.json().catch(() => null)
    if (!response.ok) throw new Error(data?.error || 'Speichern fehlgeschlagen.')
    currentUser.value = { ...currentUser.value, newsletterSubscribed: nextSubscribed }
    successMessage.value = nextSubscribed ? 'Newsletter abonniert.' : 'Newsletter abbestellt.'
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Etwas ist schiefgelaufen.'
  } finally {
    newsletterStatus.value = 'idle'
  }
}

onMounted(loadMember)
</script>

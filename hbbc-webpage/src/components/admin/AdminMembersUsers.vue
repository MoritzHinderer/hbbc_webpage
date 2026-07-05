<template>
  <div class="space-y-12">
    <p v-if="errorMessage" class="text-red-400 text-sm text-center">{{ errorMessage }}</p>

    <!-- All user accounts -->
    <section class="space-y-4">
      <h2 class="text-xl font-bold text-white">Alle Nutzer</h2>

      <div v-if="users.length" class="grid gap-3">
        <div v-for="user in users" :key="user.id" class="bg-gray-800/50 backdrop-blur rounded-lg p-5 border border-gray-500 text-left">
          <div class="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div class="flex items-center gap-2">
                <h3 class="text-white font-semibold">{{ user.name }}</h3>
                <span v-if="user.id === currentUser?.id" class="text-xs text-gray-500">(Du)</span>
                <span
                  class="text-xs font-medium px-2 py-0.5 rounded-full"
                  :class="user.newsletter_subscribed ? 'bg-green-700/40 text-green-300' : 'bg-gray-700/40 text-gray-400'"
                >
                  {{ user.newsletter_subscribed ? 'Newsletter abonniert' : 'Kein Newsletter' }}
                </span>
              </div>
              <p class="text-gray-400 text-sm">{{ user.email }}</p>
              <p class="text-gray-500 text-xs mt-1">Registriert am {{ formatDate(user.created_at) }}</p>
            </div>

            <div v-if="user.id === currentUser?.id" class="flex items-center gap-2">
              <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-700/40 text-red-300">Admin</span>
              <span class="text-xs text-gray-500">Bearbeite dein eigenes Konto über die CLI</span>
            </div>
            <div v-else class="flex flex-wrap items-center gap-2">
              <select v-model="edits[user.id]!.role" class="rounded-md bg-gray-900/60 border border-gray-600 px-2 py-1.5 text-sm text-white focus:outline-none focus:border-red-500">
                <option value="member">Mitglied</option>
                <option value="admin">Admin</option>
              </select>
              <select v-model="edits[user.id]!.status" class="rounded-md bg-gray-900/60 border border-gray-600 px-2 py-1.5 text-sm text-white focus:outline-none focus:border-red-500">
                <option value="pending">Ausstehend</option>
                <option value="approved">Freigeschaltet</option>
                <option value="rejected">Abgelehnt</option>
              </select>
              <button class="text-sm text-green-400 hover:text-green-300 border border-green-700 hover:border-green-500 rounded-md px-3 py-1.5 transition-colors" @click="saveUser(user.id)">Speichern</button>
              <button class="text-sm text-red-400 hover:text-red-300 border border-red-700 hover:border-red-500 rounded-md px-3 py-1.5 transition-colors" @click="handleDeleteUser(user.id)">Löschen</button>
            </div>
          </div>

          <!-- Linked member card -->
          <div class="mt-3 pt-3 border-t border-gray-700">
            <template v-if="memberForUser(user.id)">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <p class="text-sm text-gray-300">
                  Mitgliederkarte: <span class="text-white font-medium">{{ memberForUser(user.id)!.name }}</span>
                  <span class="text-gray-500"> · {{ memberForUser(user.id)!.role }}</span>
                </p>
                <div class="flex gap-2">
                  <button class="text-sm text-gray-300 hover:text-white" @click="startEditMember(memberForUser(user.id)!)">Karte bearbeiten</button>
                  <button class="text-sm text-red-400 hover:text-red-300" @click="unlinkMember(memberForUser(user.id)!.id)">Verknüpfung aufheben</button>
                </div>
              </div>
            </template>
            <button v-else class="text-sm text-green-400 hover:text-green-300" @click="startCreateForUser(user.id)">
              + Mitgliederkarte für diesen Nutzer anlegen
            </button>
          </div>
        </div>
      </div>
      <div v-else class="bg-gray-800/50 backdrop-blur rounded-lg p-10 border border-gray-500 text-gray-300 text-center">
        Keine Nutzer vorhanden.
      </div>
    </section>

    <!-- Shared create/edit form for a member card -->
    <form v-if="showMemberForm" class="bg-gray-800/50 backdrop-blur rounded-lg p-6 border border-gray-500 text-left space-y-4 max-w-xl mx-auto" @submit.prevent="handleMemberSubmit">
      <h2 class="text-lg font-semibold text-white">{{ editingMemberId ? 'Mitgliederkarte bearbeiten' : 'Neue Mitgliederkarte' }}</h2>

      <div>
        <label class="block text-sm font-medium text-gray-300 mb-1">Name</label>
        <input v-model="memberForm.name" type="text" required maxlength="100"
          class="w-full rounded-md bg-gray-900/60 border border-gray-600 px-3 py-2 text-white focus:outline-none focus:border-red-500" />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-300 mb-1">Rolle</label>
        <input v-model="memberForm.role" type="text" required maxlength="100"
          class="w-full rounded-md bg-gray-900/60 border border-gray-600 px-3 py-2 text-white focus:outline-none focus:border-red-500" />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-300 mb-1">Mitglied seit</label>
        <input v-model="memberForm.joined" type="date" required
          class="w-full rounded-md bg-gray-900/60 border border-gray-600 px-3 py-2 text-white focus:outline-none focus:border-red-500" />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-300 mb-1">Standort <span class="text-gray-500">(optional, für die Karte)</span></label>
        <input v-model="memberForm.location" type="text" maxlength="100"
          class="w-full rounded-md bg-gray-900/60 border border-gray-600 px-3 py-2 text-white focus:outline-none focus:border-red-500" />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-300 mb-1">Über mich</label>
        <textarea v-model="memberForm.about_me" required maxlength="2000" rows="4"
          class="w-full rounded-md bg-gray-900/60 border border-gray-600 px-3 py-2 text-white focus:outline-none focus:border-red-500"></textarea>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-300 mb-1">Foto <span class="text-gray-500">(optional, PNG/JPEG/WebP)</span></label>

        <div v-if="currentPicture && !removePicture" class="flex items-center gap-3 mb-2">
          <img :src="currentPicture" alt="Aktuelles Foto" class="w-16 h-16 rounded-md object-cover border border-gray-600" />
          <button type="button" class="text-sm text-red-400 hover:text-red-300" @click="removePicture = true">Foto entfernen</button>
        </div>
        <p v-else-if="currentPicture && removePicture" class="text-sm text-gray-400 mb-2">
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
          {{ status === 'sending' ? 'Wird gespeichert…' : 'Speichern' }}
        </button>
        <button type="button" class="text-gray-300 hover:text-white px-5 py-2" @click="cancelMemberForm">Abbrechen</button>
      </div>
    </form>

    <!-- Member cards with no linked user account -->
    <section class="space-y-4">
      <h2 class="text-xl font-bold text-white">Mitgliederkarten ohne Nutzerkonto</h2>

      <div class="flex justify-center">
        <button v-if="!showMemberForm" type="button" class="btn-animated bg-red-700 hover:bg-red-600 text-white font-medium px-6 py-2.5 rounded-lg transition-colors" @click="startCreateStandalone">
          + Mitglied hinzufügen
        </button>
      </div>

      <div v-if="unlinkedMembers.length" class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div v-for="member in unlinkedMembers" :key="member.id" class="bg-gray-800/50 backdrop-blur rounded-lg p-5 border border-gray-500 text-left">
          <div class="flex items-start justify-between gap-3">
            <div>
              <h3 class="text-white font-semibold">{{ member.name }}</h3>
              <p class="text-red-400 text-sm">{{ member.role }}</p>
              <p class="text-gray-400 text-xs mt-1">Seit {{ member.joined }}<span v-if="member.location"> · {{ member.location }}</span></p>
            </div>
            <div class="flex gap-2 shrink-0">
              <button class="text-sm text-gray-300 hover:text-white" @click="startEditMember(member)">Bearbeiten</button>
              <button class="text-sm text-red-400 hover:text-red-300" @click="handleDeleteMember(member.id)">Löschen</button>
            </div>
          </div>

          <div v-if="unlinkedUsers.length" class="mt-3 pt-3 border-t border-gray-700 flex flex-wrap items-center gap-2">
            <select v-model="linkSelections[member.id]" class="rounded-md bg-gray-900/60 border border-gray-600 px-2 py-1.5 text-sm text-white focus:outline-none focus:border-red-500">
              <option value="">Nutzerkonto verknüpfen…</option>
              <option v-for="user in unlinkedUsers" :key="user.id" :value="String(user.id)">{{ user.name }} ({{ user.email }})</option>
            </select>
            <button class="text-sm text-green-400 hover:text-green-300 border border-green-700 hover:border-green-500 rounded-md px-3 py-1.5 transition-colors" @click="linkExistingMember(member.id)">
              Verknüpfen
            </button>
          </div>
        </div>
      </div>
      <div v-else-if="!showMemberForm" class="bg-gray-800/50 backdrop-blur rounded-lg p-10 border border-gray-500 text-gray-300 text-center">
        Keine unverknüpften Mitgliederkarten.
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted } from 'vue'
import { currentUser } from '../../auth'

interface User {
  id: number
  name: string
  email: string
  role: 'member' | 'admin'
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  memberCardId: number | null
  newsletter_subscribed: boolean
}

interface Member {
  id: number
  name: string
  role: string
  joined: string
  location?: string
  about_me: string
  picture?: string | null
  user_id?: number | null
}

const users = ref<User[]>([])
const members = ref<Member[]>([])
const edits = reactive<Record<number, { role: string; status: string }>>({})
const linkSelections = reactive<Record<number, string>>({})
const errorMessage = ref('')

const showMemberForm = ref(false)
const editingMemberId = ref<number | null>(null)
const targetUserId = ref<number | null>(null)
const pictureFile = ref<File | null>(null)
const currentPicture = ref<string | null>(null)
const removePicture = ref(false)
const status = ref<'idle' | 'sending'>('idle')

const emptyMemberForm = () => ({ name: '', role: '', joined: '', location: '', about_me: '' })
const memberForm = reactive(emptyMemberForm())

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('de-DE', { year: 'numeric', month: 'long', day: 'numeric' })

const memberForUser = (userId: number) => members.value.find((m) => m.user_id === userId)

const unlinkedMembers = computed(() => members.value.filter((m) => m.user_id == null))
const unlinkedUsers = computed(() => users.value.filter((u) => !u.memberCardId))

const loadAll = async () => {
  try {
    const [usersRes, membersRes] = await Promise.all([
      fetch('/api/admin/users', { credentials: 'include' }),
      fetch('/api/admin/members', { credentials: 'include' }),
    ])
    if (!usersRes.ok || !membersRes.ok) throw new Error('Daten konnten nicht geladen werden.')

    const usersData = await usersRes.json()
    const membersData = await membersRes.json()
    users.value = usersData.users
    members.value = membersData.members

    for (const user of usersData.users as User[]) {
      edits[user.id] = { role: user.role, status: user.status }
    }
    for (const member of membersData.members as Member[]) {
      if (linkSelections[member.id] === undefined) linkSelections[member.id] = ''
    }
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Etwas ist schiefgelaufen.'
  }
}

const saveUser = async (id: number) => {
  errorMessage.value = ''
  try {
    const response = await fetch(`/api/admin/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(edits[id]),
    })
    const data = await response.json().catch(() => null)
    if (!response.ok) throw new Error(data?.error || 'Speichern fehlgeschlagen.')
    await loadAll()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Etwas ist schiefgelaufen.'
  }
}

const handleDeleteUser = async (id: number) => {
  if (!confirm('Dieses Konto wirklich löschen? Eine verknüpfte Mitgliederkarte bleibt erhalten, wird aber entkoppelt.')) return
  errorMessage.value = ''
  try {
    const response = await fetch(`/api/admin/users/${id}`, { method: 'DELETE', credentials: 'include' })
    if (!response.ok) {
      const data = await response.json().catch(() => null)
      throw new Error(data?.error || 'Löschen fehlgeschlagen.')
    }
    await loadAll()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Etwas ist schiefgelaufen.'
  }
}

const startCreateStandalone = () => {
  editingMemberId.value = null
  targetUserId.value = null
  Object.assign(memberForm, emptyMemberForm())
  pictureFile.value = null
  currentPicture.value = null
  removePicture.value = false
  showMemberForm.value = true
}

const startCreateForUser = (userId: number) => {
  startCreateStandalone()
  targetUserId.value = userId
}

const startEditMember = (member: Member) => {
  editingMemberId.value = member.id
  targetUserId.value = null
  Object.assign(memberForm, { ...emptyMemberForm(), ...member })
  pictureFile.value = null
  currentPicture.value = member.picture ?? null
  removePicture.value = false
  showMemberForm.value = true
}

const cancelMemberForm = () => {
  showMemberForm.value = false
  editingMemberId.value = null
  targetUserId.value = null
}

const onFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  pictureFile.value = target.files?.[0] ?? null
  if (pictureFile.value) removePicture.value = false
}

const handleMemberSubmit = async () => {
  status.value = 'sending'
  errorMessage.value = ''

  const body = new FormData()
  body.append('name', memberForm.name)
  body.append('role', memberForm.role)
  body.append('joined', memberForm.joined)
  body.append('location', memberForm.location)
  body.append('about_me', memberForm.about_me)
  if (pictureFile.value) body.append('picture', pictureFile.value)
  if (removePicture.value) body.append('removePicture', 'true')

  try {
    if (editingMemberId.value) {
      const response = await fetch(`/api/admin/members/${editingMemberId.value}`, { method: 'PUT', credentials: 'include', body })
      const data = await response.json().catch(() => null)
      if (!response.ok) throw new Error(data?.error || 'Speichern fehlgeschlagen.')
    } else {
      const response = await fetch('/api/admin/members', { method: 'POST', credentials: 'include', body })
      const data = await response.json().catch(() => null)
      if (!response.ok) throw new Error(data?.error || 'Speichern fehlgeschlagen.')

      if (targetUserId.value) {
        const linkResponse = await fetch(`/api/admin/members/${data.member.id}/link`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ user_id: targetUserId.value }),
        })
        const linkData = await linkResponse.json().catch(() => null)
        if (!linkResponse.ok) throw new Error(linkData?.error || 'Verknüpfung fehlgeschlagen.')
      }
    }

    cancelMemberForm()
    await loadAll()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Etwas ist schiefgelaufen.'
  } finally {
    status.value = 'idle'
  }
}

const handleDeleteMember = async (id: number) => {
  if (!confirm('Diese Mitgliederkarte wirklich löschen?')) return
  errorMessage.value = ''
  try {
    const response = await fetch(`/api/admin/members/${id}`, { method: 'DELETE', credentials: 'include' })
    if (!response.ok) {
      const data = await response.json().catch(() => null)
      throw new Error(data?.error || 'Löschen fehlgeschlagen.')
    }
    await loadAll()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Etwas ist schiefgelaufen.'
  }
}

const setMemberLink = async (memberId: number, userId: number | null) => {
  errorMessage.value = ''
  try {
    const response = await fetch(`/api/admin/members/${memberId}/link`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ user_id: userId }),
    })
    const data = await response.json().catch(() => null)
    if (!response.ok) throw new Error(data?.error || 'Verknüpfung fehlgeschlagen.')
    await loadAll()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Etwas ist schiefgelaufen.'
  }
}

const linkExistingMember = (memberId: number) => {
  const selected = linkSelections[memberId]
  if (!selected) return
  setMemberLink(memberId, Number(selected))
}

const unlinkMember = (memberId: number) => setMemberLink(memberId, null)

onMounted(loadAll)
</script>

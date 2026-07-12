<template>
  <div class="space-y-8">
    <p v-if="errorMessage" class="text-red-400 text-sm text-center">{{ errorMessage }}</p>

    <!-- Sub-tabs -->
    <div class="flex gap-2 justify-center border-b border-gray-700 pb-3">
      <button
        v-for="tab in subTabs"
        :key="tab.id"
        type="button"
        :class="[
          activeSubTab === tab.id ? 'bg-red-700 text-white' : 'text-gray-300 hover:text-white hover:bg-white/10',
          'px-4 py-1.5 rounded-md text-sm font-medium transition-colors',
        ]"
        @click="activeSubTab = tab.id"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Fanclub members: the primary hub -->
    <section v-if="activeSubTab === 'fanclub'" class="space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-bold text-white">Fanclub-Mitglieder</h2>
        <button v-if="!showFanclubMemberForm" type="button" class="btn-animated bg-red-700 hover:bg-red-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors" @click="startCreateFanclubMember">
          + Fanclub-Mitglied hinzufügen
        </button>
      </div>

      <form v-if="showFanclubMemberForm" class="bg-gray-800/50 backdrop-blur rounded-lg p-6 border border-gray-500 text-left space-y-4 max-w-xl mx-auto" @submit.prevent="handleFanclubMemberSubmit">
        <h3 class="text-lg font-semibold text-white">{{ editingFanclubMemberId ? 'Fanclub-Mitglied bearbeiten' : 'Neues Fanclub-Mitglied' }}</h3>
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1">Name</label>
          <input v-model="fanclubMemberForm.name" type="text" required maxlength="100"
            class="w-full rounded-md bg-gray-900/60 border border-gray-600 px-3 py-2 text-white focus:outline-none focus:border-red-500" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1">E-Mail <span class="text-gray-500">(optional)</span></label>
          <input v-model="fanclubMemberForm.email" type="email" maxlength="254"
            class="w-full rounded-md bg-gray-900/60 border border-gray-600 px-3 py-2 text-white focus:outline-none focus:border-red-500" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1">Mitglied seit</label>
          <input v-model="fanclubMemberForm.joined_date" type="date"
            class="w-full rounded-md bg-gray-900/60 border border-gray-600 px-3 py-2 text-white focus:outline-none focus:border-red-500" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1">Notizen <span class="text-gray-500">(optional, intern)</span></label>
          <textarea v-model="fanclubMemberForm.notes" maxlength="1000" rows="3"
            class="w-full rounded-md bg-gray-900/60 border border-gray-600 px-3 py-2 text-white focus:outline-none focus:border-red-500"></textarea>
        </div>
        <div class="flex gap-3 pt-2">
          <button type="submit" class="btn-animated bg-red-700 hover:bg-red-600 text-white font-medium px-5 py-2 rounded-lg transition-colors">Speichern</button>
          <button type="button" class="text-gray-300 hover:text-white px-5 py-2" @click="cancelFanclubMemberForm">Abbrechen</button>
        </div>
      </form>

      <!-- Card create/edit form, shown inline when triggered from a fanclub member row -->
      <form v-if="showMemberForm" class="bg-gray-800/50 backdrop-blur rounded-lg p-6 border border-gray-500 text-left space-y-4 max-w-xl mx-auto" @submit.prevent="handleMemberSubmit">
        <h3 class="text-lg font-semibold text-white">{{ editingMemberId ? 'Mitgliederkarte bearbeiten' : 'Neue Mitgliederkarte' }}</h3>

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

      <div v-if="fanclubMembers.length" class="grid gap-2.5">
        <div v-for="fm in fanclubMembers" :key="fm.id" class="bg-gray-800/50 backdrop-blur rounded-lg px-5 py-4 border border-gray-500 text-left">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div class="min-w-0">
              <h3 class="text-white font-semibold truncate">{{ fm.name }}</h3>
              <p class="text-gray-500 text-xs mt-0.5">
                <span v-if="fm.email">{{ fm.email }} · </span>Mitglied seit {{ formatShortDate(fm.joined_date) }}
              </p>
            </div>
            <div class="flex items-center gap-4 shrink-0 text-sm">
              <button class="text-gray-300 hover:text-white" @click="startEditFanclubMember(fm)">Bearbeiten</button>
              <button class="text-red-400 hover:text-red-300" @click="handleDeleteFanclubMember(fm.id)">Löschen</button>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-2 mt-3">
            <span v-if="linkedUser(fm.linkedAccountId)" class="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-700/30 text-blue-300">
              Konto: {{ linkedUser(fm.linkedAccountId)!.name }}
            </span>
            <span v-else class="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-700/40 text-gray-500">Kein Konto</span>

            <template v-if="fm.linkedCardId">
              <span class="text-xs font-medium px-2.5 py-1 rounded-full bg-green-700/30 text-green-300">Mitgliederkarte</span>
              <button class="text-xs text-gray-400 hover:text-white" @click="startEditMember(cardById(fm.linkedCardId)!)">Bearbeiten</button>
              <button class="text-xs text-red-400 hover:text-red-300" @click="handleDeleteMember(fm.linkedCardId)">Löschen</button>
            </template>
            <button
              v-else
              type="button"
              class="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-700/40 text-gray-400 hover:text-green-300 hover:bg-green-700/20 transition-colors"
              @click="startCreateCardFor(fm)"
            >
              + Karte anlegen
            </button>
          </div>
        </div>
      </div>
      <div v-else-if="!showFanclubMemberForm" class="bg-gray-800/50 backdrop-blur rounded-lg p-10 border border-gray-500 text-gray-300 text-center">
        Noch keine Fanclub-Mitglieder.
      </div>
    </section>

    <!-- HBBC accounts -->
    <section v-else class="space-y-4">
      <h2 class="text-xl font-bold text-white">HBBC Accounts</h2>

      <div v-if="users.length" class="grid gap-3">
        <div v-for="user in users" :key="user.id" class="bg-gray-800/50 backdrop-blur rounded-lg p-5 border border-gray-500 text-left">
          <div class="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div class="flex items-center gap-2">
                <h3 class="text-white font-semibold">{{ user.name }}</h3>
                <span v-if="user.id === currentUser?.id" class="text-xs text-gray-500">(Du)</span>
                <span class="text-xs font-medium px-2 py-0.5 rounded-full" :class="statusBadgeClass(user.status)">
                  {{ statusLabel(user.status) }}
                </span>
                <span
                  class="text-xs font-medium px-2 py-0.5 rounded-full"
                  :class="user.newsletter_subscribed ? 'bg-green-700/40 text-green-300' : 'bg-gray-700/40 text-gray-400'"
                >
                  {{ user.newsletter_subscribed ? 'Newsletter abonniert' : 'Kein Newsletter' }}
                </span>
              </div>
              <p class="text-gray-400 text-sm">{{ user.email }}</p>
              <p class="text-gray-500 text-xs mt-1">Registriert am {{ formatDate(user.created_at) }}</p>
              <p class="text-gray-500 text-xs mt-1">
                Fanclub-Mitglied: <span class="text-gray-300">{{ fanclubMemberById(user.fanclub_member_id)?.name ?? '—' }}</span>
              </p>
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
              <button class="text-sm text-green-400 hover:text-green-300 border border-green-700 hover:border-green-500 rounded-md px-3 py-1.5 transition-colors" @click="saveUser(user.id)">Speichern</button>
              <button class="text-sm text-red-400 hover:text-red-300 border border-red-700 hover:border-red-500 rounded-md px-3 py-1.5 transition-colors" @click="handleDeleteUser(user.id)">Löschen</button>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="bg-gray-800/50 backdrop-blur rounded-lg p-10 border border-gray-500 text-gray-300 text-center">
        Keine Nutzer vorhanden.
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { currentUser } from '../../auth'

interface User {
  id: number
  name: string
  email: string
  role: 'member' | 'admin'
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  fanclub_member_id: number | null
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
  fanclub_member_id: number
}

interface FanclubMember {
  id: number
  name: string
  email: string | null
  joined_date: string
  notes: string | null
  linkedAccountId: number | null
  linkedCardId: number | null
}

const subTabs = [
  { id: 'fanclub', label: 'Fanclub-Mitglieder' },
  { id: 'accounts', label: 'HBBC Accounts' },
] as const
const activeSubTab = ref<(typeof subTabs)[number]['id']>('fanclub')

const users = ref<User[]>([])
const members = ref<Member[]>([])
const fanclubMembers = ref<FanclubMember[]>([])
const edits = reactive<Record<number, { role: string }>>({})

const STATUS_LABELS: Record<User['status'], string> = {
  pending: 'Ausstehend',
  approved: 'Freigeschaltet',
  rejected: 'Abgelehnt',
}
const STATUS_BADGE_CLASSES: Record<User['status'], string> = {
  pending: 'bg-yellow-700/40 text-yellow-300',
  approved: 'bg-green-700/40 text-green-300',
  rejected: 'bg-red-700/40 text-red-300',
}
const statusLabel = (status: User['status']) => STATUS_LABELS[status]
const statusBadgeClass = (status: User['status']) => STATUS_BADGE_CLASSES[status]
const errorMessage = ref('')

const showMemberForm = ref(false)
const editingMemberId = ref<number | null>(null)
const targetFanclubMemberId = ref<number | null>(null)
const pictureFile = ref<File | null>(null)
const currentPicture = ref<string | null>(null)
const removePicture = ref(false)
const status = ref<'idle' | 'sending'>('idle')

const emptyMemberForm = () => ({ name: '', role: '', joined: '', location: '', about_me: '' })
const memberForm = reactive(emptyMemberForm())

const showFanclubMemberForm = ref(false)
const editingFanclubMemberId = ref<number | null>(null)
const emptyFanclubMemberForm = () => ({ name: '', email: '', joined_date: '', notes: '' })
const fanclubMemberForm = reactive(emptyFanclubMemberForm())

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('de-DE', { year: 'numeric', month: 'long', day: 'numeric' })
const formatShortDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('de-DE', { year: 'numeric', month: 'short', day: 'numeric' })

const linkedUser = (userId: number | null) => (userId == null ? undefined : users.value.find((u) => u.id === userId))
const cardById = (cardId: number | null) => (cardId == null ? undefined : members.value.find((m) => m.id === cardId))
const fanclubMemberById = (id: number | null) => (id == null ? undefined : fanclubMembers.value.find((fm) => fm.id === id))

const loadAll = async () => {
  try {
    const [usersRes, membersRes, fanclubMembersRes] = await Promise.all([
      fetch('/api/admin/users', { credentials: 'include' }),
      fetch('/api/admin/members', { credentials: 'include' }),
      fetch('/api/admin/fanclub-members', { credentials: 'include' }),
    ])
    if (!usersRes.ok || !membersRes.ok || !fanclubMembersRes.ok) throw new Error('Daten konnten nicht geladen werden.')

    const usersData = await usersRes.json()
    const membersData = await membersRes.json()
    const fanclubMembersData = await fanclubMembersRes.json()
    users.value = usersData.users
    members.value = membersData.members
    fanclubMembers.value = fanclubMembersData.fanclubMembers

    for (const user of usersData.users as User[]) {
      edits[user.id] = { role: user.role }
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
  if (!confirm('Dieses Konto wirklich löschen? Das verknüpfte Fanclub-Mitglied und eine eventuell vorhandene Mitgliederkarte werden dabei ebenfalls gelöscht.')) return
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

// --- Fanclub member CRUD ---

const startCreateFanclubMember = () => {
  editingFanclubMemberId.value = null
  Object.assign(fanclubMemberForm, emptyFanclubMemberForm())
  showFanclubMemberForm.value = true
}

const startEditFanclubMember = (fm: FanclubMember) => {
  editingFanclubMemberId.value = fm.id
  Object.assign(fanclubMemberForm, {
    name: fm.name,
    email: fm.email ?? '',
    joined_date: fm.joined_date,
    notes: fm.notes ?? '',
  })
  showFanclubMemberForm.value = true
}

const cancelFanclubMemberForm = () => {
  showFanclubMemberForm.value = false
  editingFanclubMemberId.value = null
}

const handleFanclubMemberSubmit = async () => {
  errorMessage.value = ''
  try {
    const url = editingFanclubMemberId.value ? `/api/admin/fanclub-members/${editingFanclubMemberId.value}` : '/api/admin/fanclub-members'
    const response = await fetch(url, {
      method: editingFanclubMemberId.value ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(fanclubMemberForm),
    })
    const data = await response.json().catch(() => null)
    if (!response.ok) throw new Error(data?.error || 'Speichern fehlgeschlagen.')
    cancelFanclubMemberForm()
    await loadAll()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Etwas ist schiefgelaufen.'
  }
}

const handleDeleteFanclubMember = async (id: number) => {
  if (!confirm('Dieses Fanclub-Mitglied wirklich löschen?')) return
  errorMessage.value = ''
  try {
    const response = await fetch(`/api/admin/fanclub-members/${id}`, { method: 'DELETE', credentials: 'include' })
    if (!response.ok) {
      const data = await response.json().catch(() => null)
      throw new Error(data?.error || 'Löschen fehlgeschlagen.')
    }
    await loadAll()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Etwas ist schiefgelaufen.'
  }
}

// --- Member card CRUD ---

const startCreateCardFor = (fm: FanclubMember) => {
  editingMemberId.value = null
  targetFanclubMemberId.value = fm.id
  // Prefill what's already known about this fanclub member, so the admin
  // isn't retyping a name/date that's already on file.
  Object.assign(memberForm, emptyMemberForm(), { name: fm.name, joined: fm.joined_date })
  pictureFile.value = null
  currentPicture.value = null
  removePicture.value = false
  showMemberForm.value = true
}

const startEditMember = (member: Member) => {
  editingMemberId.value = member.id
  targetFanclubMemberId.value = null
  Object.assign(memberForm, { ...emptyMemberForm(), ...member })
  pictureFile.value = null
  currentPicture.value = member.picture ?? null
  removePicture.value = false
  showMemberForm.value = true
}

const cancelMemberForm = () => {
  showMemberForm.value = false
  editingMemberId.value = null
  targetFanclubMemberId.value = null
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
  if (targetFanclubMemberId.value) body.append('fanclub_member_id', String(targetFanclubMemberId.value))
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

onMounted(loadAll)
</script>

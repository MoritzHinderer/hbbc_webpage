<template>
  <div class="space-y-8">
    <p v-if="errorMessage" class="text-red-400 text-sm text-center">{{ errorMessage }}</p>

    <div v-if="requests.length" class="grid gap-4">
      <div
        v-for="request in requests"
        :key="request.id"
        class="bg-gray-800/50 backdrop-blur rounded-lg p-6 border border-gray-500 text-left"
      >
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 class="text-lg font-semibold text-white">{{ request.name }}</h2>
            <p class="text-sm text-gray-300">{{ request.email }}</p>
            <p class="text-xs text-gray-500 mt-1">Beantragt am {{ formatDate(request.created_at) }}</p>
            <p v-if="request.message" class="text-sm text-gray-300 mt-3 italic">"{{ request.message }}"</p>
          </div>
          <div class="flex flex-col items-end gap-2 shrink-0">
            <select
              v-model="linkSelections[request.id]"
              class="rounded-md bg-gray-900/60 border border-gray-600 px-2 py-1.5 text-sm text-white focus:outline-none focus:border-red-500"
            >
              <option value="">Neues Fanclub-Mitglied anlegen</option>
              <option v-for="fm in unlinkedFanclubMembers" :key="fm.id" :value="String(fm.id)">
                Mit „{{ fm.name }}" verknüpfen
              </option>
            </select>
            <div class="flex gap-2">
              <button
                class="text-sm text-green-400 hover:text-green-300 border border-green-700 hover:border-green-500 rounded-md px-3 py-2 transition-colors"
                @click="handleDecision(request.id, 'approve')"
              >
                Freischalten
              </button>
              <button
                class="text-sm text-red-400 hover:text-red-300 border border-red-700 hover:border-red-500 rounded-md px-3 py-2 transition-colors"
                @click="handleDecision(request.id, 'reject')"
              >
                Ablehnen
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="bg-gray-800/50 backdrop-blur rounded-lg p-10 border border-gray-500 text-gray-300 text-center">
      Keine offenen Anfragen.
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted } from 'vue'

interface AccountRequest {
  id: number
  name: string
  email: string
  message: string | null
  created_at: string
}

interface FanclubMember {
  id: number
  name: string
  linkedAccountId: number | null
}

const requests = ref<AccountRequest[]>([])
const fanclubMembers = ref<FanclubMember[]>([])
const linkSelections = reactive<Record<number, string>>({})
const errorMessage = ref('')

const unlinkedFanclubMembers = computed(() => fanclubMembers.value.filter((fm) => fm.linkedAccountId == null))

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('de-DE', { year: 'numeric', month: 'long', day: 'numeric' })

const loadRequests = async () => {
  try {
    const [requestsRes, fanclubMembersRes] = await Promise.all([
      fetch('/api/admin/requests', { credentials: 'include' }),
      fetch('/api/admin/fanclub-members', { credentials: 'include' }),
    ])
    if (!requestsRes.ok || !fanclubMembersRes.ok) throw new Error('Anfragen konnten nicht geladen werden.')
    const data = await requestsRes.json()
    const fanclubMembersData = await fanclubMembersRes.json()
    requests.value = data.requests
    fanclubMembers.value = fanclubMembersData.fanclubMembers
    for (const request of data.requests as AccountRequest[]) {
      if (linkSelections[request.id] === undefined) linkSelections[request.id] = ''
    }
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Etwas ist schiefgelaufen.'
  }
}

const handleDecision = async (id: number, action: 'approve' | 'reject') => {
  errorMessage.value = ''
  try {
    const selected = action === 'approve' ? linkSelections[id] : ''
    const response = await fetch(`/api/admin/requests/${id}/${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(selected ? { fanclub_member_id: Number(selected) } : {}),
    })
    if (!response.ok) {
      const data = await response.json().catch(() => null)
      throw new Error(data?.error || 'Aktion fehlgeschlagen.')
    }
    requests.value = requests.value.filter((request) => request.id !== id)
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Etwas ist schiefgelaufen.'
  }
}

onMounted(loadRequests)
</script>

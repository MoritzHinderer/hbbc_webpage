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
          <div class="flex gap-2 shrink-0">
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

    <div v-else class="bg-gray-800/50 backdrop-blur rounded-lg p-10 border border-gray-500 text-gray-300 text-center">
      Keine offenen Anfragen.
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface AccountRequest {
  id: number
  name: string
  email: string
  message: string | null
  created_at: string
}

const requests = ref<AccountRequest[]>([])
const errorMessage = ref('')

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('de-DE', { year: 'numeric', month: 'long', day: 'numeric' })

const loadRequests = async () => {
  try {
    const response = await fetch('/api/admin/requests', { credentials: 'include' })
    if (!response.ok) throw new Error('Anfragen konnten nicht geladen werden.')
    const data = await response.json()
    requests.value = data.requests
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Etwas ist schiefgelaufen.'
  }
}

const handleDecision = async (id: number, action: 'approve' | 'reject') => {
  errorMessage.value = ''
  try {
    const response = await fetch(`/api/admin/requests/${id}/${action}`, {
      method: 'POST',
      credentials: 'include',
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

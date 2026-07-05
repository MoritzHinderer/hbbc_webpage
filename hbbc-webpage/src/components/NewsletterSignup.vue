<template>
  <div>
    <h4 class="text-white font-semibold mb-4">Newsletter</h4>
    <p class="text-gray-400 text-sm leading-relaxed mb-3">
      Bleib auf dem Laufenden über Termine und News.
    </p>
    <form class="flex gap-2" @submit.prevent="handleSubmit">
      <input
        v-model="email"
        type="email"
        required
        maxlength="254"
        placeholder="deine@email.de"
        class="min-w-0 flex-1 rounded-md bg-gray-900/60 border border-gray-700 px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
      />
      <button
        type="submit"
        :disabled="status === 'sending'"
        class="shrink-0 bg-red-700 hover:bg-red-600 disabled:bg-gray-700 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
      >
        {{ status === 'sending' ? '…' : 'Anmelden' }}
      </button>
    </form>
    <p v-if="status === 'success'" class="text-green-400 text-xs mt-2">
      {{ alreadySubscribed ? 'Du bist bereits angemeldet.' : 'Danke für deine Anmeldung!' }}
    </p>
    <p v-if="status === 'error'" class="text-red-400 text-xs mt-2">{{ errorMessage }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

type Status = 'idle' | 'sending' | 'success' | 'error'

const email = ref('')
const status = ref<Status>('idle')
const errorMessage = ref('')
const alreadySubscribed = ref(false)

const handleSubmit = async () => {
  status.value = 'sending'
  errorMessage.value = ''

  try {
    const response = await fetch('/api/newsletter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.value }),
    })

    const data = await response.json().catch(() => null)
    if (!response.ok) {
      throw new Error(data?.error || 'Anmeldung fehlgeschlagen.')
    }

    alreadySubscribed.value = Boolean(data?.alreadySubscribed)
    status.value = 'success'
    email.value = ''
  } catch (error) {
    status.value = 'error'
    errorMessage.value = error instanceof Error ? error.message : 'Etwas ist schiefgelaufen.'
  }
}
</script>

<template>
  <div class="min-h-screen" style="background: linear-gradient(to bottom, rgb(31, 41, 55) 0%, rgb(80, 7, 7) 100%);">
    <div class="max-w-2xl mx-auto px-6 py-16 text-center space-y-12">
      <div class="space-y-4">
        <h1 class="text-4xl md:text-5xl font-bold text-white">Kontakt</h1>
        <p class="text-xl text-gray-200">
          Fragen zum HBBC oder zur Mitgliedschaft? Schreib uns eine Nachricht.
        </p>
      </div>

      <form
        class="bg-gray-800/50 backdrop-blur rounded-lg p-8 border border-gray-500 text-left space-y-6"
        @submit.prevent="handleSubmit"
      >
        <div>
          <label for="name" class="block text-sm font-medium text-gray-300 mb-2">Name</label>
          <input
            id="name"
            v-model="form.name"
            type="text"
            required
            maxlength="100"
            class="w-full rounded-md bg-gray-900/60 border border-gray-600 px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
            placeholder="Dein Name"
          />
        </div>

        <div>
          <label for="email" class="block text-sm font-medium text-gray-300 mb-2">E-Mail</label>
          <input
            id="email"
            v-model="form.email"
            type="email"
            required
            maxlength="254"
            class="w-full rounded-md bg-gray-900/60 border border-gray-600 px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
            placeholder="du@beispiel.de"
          />
        </div>

        <div>
          <label for="message" class="block text-sm font-medium text-gray-300 mb-2">Nachricht</label>
          <textarea
            id="message"
            v-model="form.message"
            required
            maxlength="5000"
            rows="5"
            class="w-full rounded-md bg-gray-900/60 border border-gray-600 px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
            placeholder="Deine Nachricht an uns"
          ></textarea>
        </div>

        <button
          type="submit"
          :disabled="status === 'sending'"
          class="w-full bg-red-700 hover:bg-red-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium px-6 py-3 rounded-lg transition-colors"
        >
          {{ status === 'sending' ? 'Wird gesendet…' : 'Nachricht senden' }}
        </button>

        <p v-if="status === 'success'" class="text-green-400 text-sm text-center">
          Danke! Wir melden uns so schnell wie möglich bei dir.
        </p>
        <p v-if="status === 'error'" class="text-red-400 text-sm text-center">
          {{ errorMessage }}
        </p>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'

type Status = 'idle' | 'sending' | 'success' | 'error'

const form = reactive({
  name: '',
  email: '',
  message: '',
})

const status = ref<Status>('idle')
const errorMessage = ref('')

const handleSubmit = async () => {
  status.value = 'sending'
  errorMessage.value = ''

  try {
    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    if (!response.ok) {
      const data = await response.json().catch(() => null)
      throw new Error(data?.error || 'Nachricht konnte nicht gesendet werden.')
    }

    status.value = 'success'
    form.name = ''
    form.email = ''
    form.message = ''
  } catch (error) {
    status.value = 'error'
    errorMessage.value = error instanceof Error ? error.message : 'Etwas ist schiefgelaufen.'
  }
}
</script>

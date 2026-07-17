<template>
  <div class="min-h-screen" style="background: linear-gradient(to bottom, rgb(31, 41, 55) 0%, rgb(80, 7, 7) 100%);">
    <div class="max-w-md mx-auto px-6 py-16 text-center space-y-12">
      <div class="space-y-4">
        <h1 class="text-4xl md:text-5xl font-bold text-white">Neues Passwort</h1>
        <p class="text-xl text-gray-200">Vergib ein neues Passwort für dein Konto.</p>
      </div>

      <div v-if="status === 'success'" class="bg-gray-800/50 backdrop-blur rounded-lg p-8 border border-gray-500 space-y-4">
        <p class="text-gray-200">Dein Passwort wurde geändert. Du wurdest überall abgemeldet — melde dich mit deinem neuen Passwort wieder an.</p>
        <router-link
          to="/login"
          class="btn-animated inline-block w-full bg-red-700 hover:bg-red-600 text-white font-medium px-6 py-3 rounded-lg transition-colors"
        >
          Zur Anmeldung
        </router-link>
      </div>

      <p v-else-if="!token" class="bg-gray-800/50 backdrop-blur rounded-lg p-8 border border-gray-500 text-red-400">
        Link ungültig oder abgelaufen. Fordere einen neuen Link an.
      </p>

      <form
        v-else
        class="bg-gray-800/50 backdrop-blur rounded-lg p-8 border border-gray-500 text-left space-y-6"
        @submit.prevent="handleSubmit"
      >
        <div>
          <label for="password" class="block text-sm font-medium text-gray-300 mb-2">Neues Passwort</label>
          <input
            id="password"
            v-model="password"
            type="password"
            required
            minlength="8"
            class="w-full rounded-md bg-gray-900/60 border border-gray-600 px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
          />
        </div>

        <div>
          <label for="confirmPassword" class="block text-sm font-medium text-gray-300 mb-2">Passwort bestätigen</label>
          <input
            id="confirmPassword"
            v-model="confirmPassword"
            type="password"
            required
            minlength="8"
            class="w-full rounded-md bg-gray-900/60 border border-gray-600 px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
          />
        </div>

        <button
          type="submit"
          :disabled="status === 'sending'"
          class="btn-animated w-full bg-red-700 hover:bg-red-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium px-6 py-3 rounded-lg transition-colors"
        >
          {{ status === 'sending' ? 'Wird gespeichert…' : 'Passwort speichern' }}
        </button>

        <p v-if="status === 'error'" class="text-red-400 text-sm text-center">{{ errorMessage }}</p>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { resetPassword } from '../auth'

type Status = 'idle' | 'sending' | 'success' | 'error'

const route = useRoute()
const token = computed(() => (typeof route.query.token === 'string' ? route.query.token : ''))

const password = ref('')
const confirmPassword = ref('')
const status = ref<Status>('idle')
const errorMessage = ref('')

const handleSubmit = async () => {
  errorMessage.value = ''

  if (password.value !== confirmPassword.value) {
    status.value = 'error'
    errorMessage.value = 'Die Passwörter stimmen nicht überein.'
    return
  }

  status.value = 'sending'
  try {
    await resetPassword(token.value, password.value)
    status.value = 'success'
  } catch (error) {
    status.value = 'error'
    errorMessage.value = error instanceof Error ? error.message : 'Etwas ist schiefgelaufen.'
  }
}
</script>

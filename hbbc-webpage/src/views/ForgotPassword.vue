<template>
  <div class="min-h-screen" style="background: linear-gradient(to bottom, rgb(31, 41, 55) 0%, rgb(80, 7, 7) 100%);">
    <div class="max-w-md mx-auto px-6 py-16 text-center space-y-12">
      <div class="space-y-4">
        <h1 class="text-4xl md:text-5xl font-bold text-white">Passwort vergessen</h1>
        <p class="text-xl text-gray-200">Wir senden dir einen Link zum Zurücksetzen.</p>
      </div>

      <p v-if="status === 'sent'" class="bg-gray-800/50 backdrop-blur rounded-lg p-8 border border-gray-500 text-gray-200">
        Falls ein Konto mit dieser E-Mail existiert, haben wir einen Link zum Zurücksetzen gesendet. Bitte prüfe dein
        Postfach — der Link ist 30 Minuten gültig.
      </p>

      <form
        v-else
        class="bg-gray-800/50 backdrop-blur rounded-lg p-8 border border-gray-500 text-left space-y-6"
        @submit.prevent="handleSubmit"
      >
        <div>
          <label for="email" class="block text-sm font-medium text-gray-300 mb-2">E-Mail</label>
          <input
            id="email"
            v-model="email"
            type="email"
            required
            maxlength="254"
            class="w-full rounded-md bg-gray-900/60 border border-gray-600 px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
            placeholder="du@beispiel.de"
          />
        </div>

        <button
          type="submit"
          :disabled="status === 'sending'"
          class="btn-animated w-full bg-red-700 hover:bg-red-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium px-6 py-3 rounded-lg transition-colors"
        >
          {{ status === 'sending' ? 'Wird gesendet…' : 'Link senden' }}
        </button>

        <p class="text-gray-400 text-sm text-center">
          <router-link to="/login" class="text-red-400 hover:text-red-300">Zurück zur Anmeldung</router-link>
        </p>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { forgotPassword } from '../auth'

type Status = 'idle' | 'sending' | 'sent'

const email = ref('')
const status = ref<Status>('idle')

const handleSubmit = async () => {
  status.value = 'sending'
  try {
    await forgotPassword(email.value)
  } catch {
    // Intentionally ignored: the backend always responds { ok: true } for
    // this endpoint, so a thrown error here would only ever be a network
    // failure, not a "this email doesn't exist" signal to surface.
  } finally {
    // Always show the same confirmation, regardless of outcome — never
    // reveal whether the email matched an account.
    status.value = 'sent'
  }
}
</script>

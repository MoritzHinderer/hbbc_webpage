<template>
  <div class="min-h-screen" style="background: linear-gradient(to bottom, rgb(31, 41, 55) 0%, rgb(80, 7, 7) 100%);">
    <div class="max-w-md mx-auto px-6 py-16 text-center space-y-12">
      <div class="space-y-4">
        <h1 class="text-4xl md:text-5xl font-bold text-white">Konto beantragen</h1>
        <p class="text-xl text-gray-200">
          Nach dem Absenden prüft der Vorstand deine Anfrage manuell.
        </p>
      </div>

      <form
        v-if="status !== 'success'"
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
          <label for="password" class="block text-sm font-medium text-gray-300 mb-2">Passwort</label>
          <input
            id="password"
            v-model="form.password"
            type="password"
            required
            minlength="8"
            class="w-full rounded-md bg-gray-900/60 border border-gray-600 px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
            placeholder="Mindestens 8 Zeichen"
          />
        </div>

        <div>
          <label for="message" class="block text-sm font-medium text-gray-300 mb-2">
            Nachricht <span class="text-gray-500">(optional)</span>
          </label>
          <textarea
            id="message"
            v-model="form.message"
            maxlength="1000"
            rows="3"
            class="w-full rounded-md bg-gray-900/60 border border-gray-600 px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
            placeholder="Wie kennst du den HBBC?"
          ></textarea>
        </div>

        <button
          type="submit"
          :disabled="status === 'sending'"
          class="w-full bg-red-700 hover:bg-red-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium px-6 py-3 rounded-lg transition-colors"
        >
          {{ status === 'sending' ? 'Wird gesendet…' : 'Anfrage senden' }}
        </button>

        <p v-if="status === 'error'" class="text-red-400 text-sm text-center">{{ errorMessage }}</p>

        <p class="text-gray-400 text-sm text-center">
          Schon ein Konto?
          <router-link to="/login" class="text-red-400 hover:text-red-300">Anmelden</router-link>
        </p>
      </form>

      <div v-else class="bg-gray-800/50 backdrop-blur rounded-lg p-8 border border-green-700 text-green-300">
        Danke! Deine Anfrage wurde gesendet und wird geprüft. Du bekommst Zugriff, sobald sie freigeschaltet wurde.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { register } from '../auth'

type Status = 'idle' | 'sending' | 'success' | 'error'

const form = reactive({
  name: '',
  email: '',
  password: '',
  message: '',
})

const status = ref<Status>('idle')
const errorMessage = ref('')

const handleSubmit = async () => {
  status.value = 'sending'
  errorMessage.value = ''

  try {
    await register({ ...form, message: form.message || undefined })
    status.value = 'success'
  } catch (error) {
    status.value = 'error'
    errorMessage.value = error instanceof Error ? error.message : 'Etwas ist schiefgelaufen.'
  }
}
</script>

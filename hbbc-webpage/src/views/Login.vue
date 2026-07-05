<template>
  <div class="min-h-screen" style="background: linear-gradient(to bottom, rgb(31, 41, 55) 0%, rgb(80, 7, 7) 100%);">
    <div class="max-w-md mx-auto px-6 py-16 text-center space-y-12">
      <div class="space-y-4">
        <h1 class="text-4xl md:text-5xl font-bold text-white">Anmelden</h1>
        <p class="text-xl text-gray-200">Melde dich mit deinem HBBC-Konto an.</p>
      </div>

      <form
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

        <div>
          <label for="password" class="block text-sm font-medium text-gray-300 mb-2">Passwort</label>
          <input
            id="password"
            v-model="password"
            type="password"
            required
            class="w-full rounded-md bg-gray-900/60 border border-gray-600 px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
          />
        </div>

        <button
          type="submit"
          :disabled="status === 'sending'"
          class="btn-animated w-full bg-red-700 hover:bg-red-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium px-6 py-3 rounded-lg transition-colors"
        >
          {{ status === 'sending' ? 'Wird geprüft…' : 'Anmelden' }}
        </button>

        <p v-if="status === 'error'" class="text-red-400 text-sm text-center">{{ errorMessage }}</p>

        <p class="text-gray-400 text-sm text-center">
          Noch kein Konto?
          <router-link to="/register" class="text-red-400 hover:text-red-300">Konto beantragen</router-link>
        </p>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { login } from '../auth'

type Status = 'idle' | 'sending' | 'error'

const route = useRoute()
const router = useRouter()

const email = ref('')
const password = ref('')
const status = ref<Status>('idle')
const errorMessage = ref('')

const handleSubmit = async () => {
  status.value = 'sending'
  errorMessage.value = ''

  try {
    await login(email.value, password.value)
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
    router.push(redirect)
  } catch (error) {
    status.value = 'error'
    errorMessage.value = error instanceof Error ? error.message : 'Etwas ist schiefgelaufen.'
  }
}
</script>

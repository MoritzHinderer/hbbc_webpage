<template>
  <div class="min-h-screen flex items-center justify-center" style="background: linear-gradient(to bottom, rgb(31, 41, 55) 0%, rgb(80, 7, 7) 100%);">
    <div class="max-w-xl mx-auto px-6 py-24 text-center space-y-6">
      <h1 class="text-6xl font-bold text-red-600">404</h1>
      <h2 class="text-2xl font-semibold text-white">Seite nicht gefunden</h2>
      <p class="text-gray-300">
        Die gesuchte Seite existiert nicht oder wurde verschoben.
      </p>
      <router-link
        to="/"
        class="btn-animated inline-block bg-red-700 hover:bg-red-600 text-white font-medium px-6 py-3 rounded-lg transition-colors"
      >
        Zurück zur Startseite
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
</script>

<template>
  <div class="min-h-screen" style="background: linear-gradient(to bottom, rgb(31, 41, 55) 0%, rgb(80, 7, 7) 100%);">
    <div class="max-w-4xl mx-auto px-6 py-16 text-center space-y-12">
      <h1 class="text-4xl md:text-5xl font-bold text-white">Downloads</h1>
      <p class="text-xl text-gray-200">
        Hier findest du alle wichtigen Dokumente und Ressourcen des HBBC zum Download.
      </p>

      <div class="grid gap-6 text-left">
        <a
          v-for="file in downloads"
          :key="file.name"
          :href="file.href"
          download
          class="flex items-center justify-between bg-gray-800/50 backdrop-blur rounded-lg p-6 border border-gray-500 hover:scale-100 md:hover:scale-[1.05] transition-all duration-300"
        >
          <div>
            <h2 class="text-lg font-semibold text-white">{{ file.name }}</h2>
            <p class="text-sm text-gray-300">{{ file.description }}</p>
          </div>

          <svg class="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
          </svg>
        </a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const downloads = [
  {
    name: 'About Us 2025',
    description: 'About Us (PDF)',
    href: '/downloads/About_us_2025.pdf',
  },
  {
    name: 'Antragsformular 2025',
    description: 'Join the club (PDF)',
    href: '/downloads/Antragsformular_2025.pdf',
  },
  {
    name: 'Satzung 2025',
    description: 'Club Constitution (PDF)',
    href: '/downloads/Satzung_HBBC.pdf',
  }
]
</script>

<template>
  <div class="min-h-screen" style="background: linear-gradient(to bottom, rgb(31, 41, 55) 0%, rgb(80, 7, 7) 100%);">
    <div class="max-w-5xl mx-auto px-6 py-16 space-y-8">
      <div class="text-center space-y-4">
        <h1 class="text-4xl md:text-5xl font-bold text-white">Admin</h1>
        <p class="text-xl text-gray-200">Inhalte und Kontoanfragen verwalten.</p>
      </div>

      <div class="flex flex-wrap gap-2 justify-center border-b border-gray-700 pb-4">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          type="button"
          :class="[
            activeTab === tab.id ? 'bg-red-700 text-white' : 'text-gray-300 hover:text-white hover:bg-white/10',
            'px-4 py-2 rounded-md text-sm font-medium transition-colors',
          ]"
          @click="activeTab = tab.id"
        >
          {{ tab.label }}
        </button>
      </div>

      <AdminRequests v-if="activeTab === 'requests'" />
      <AdminMembersUsers v-else-if="activeTab === 'members'" />
      <AdminEvents v-else-if="activeTab === 'events'" />
      <AdminGallery v-else-if="activeTab === 'gallery'" />
      <AdminDownloads v-else-if="activeTab === 'downloads'" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import AdminRequests from '../components/admin/AdminRequests.vue'
import AdminMembersUsers from '../components/admin/AdminMembersUsers.vue'
import AdminEvents from '../components/admin/AdminEvents.vue'
import AdminGallery from '../components/admin/AdminGallery.vue'
import AdminDownloads from '../components/admin/AdminDownloads.vue'

const tabs = [
  { id: 'requests', label: 'Kontoanfragen' },
  { id: 'members', label: 'Mitglieder & Nutzer' },
  { id: 'events', label: 'Termine' },
  { id: 'gallery', label: 'Galerie' },
  { id: 'downloads', label: 'Downloads' },
] as const

const activeTab = ref<(typeof tabs)[number]['id']>('requests')
</script>

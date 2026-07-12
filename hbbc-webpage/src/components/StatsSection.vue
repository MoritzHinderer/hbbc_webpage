<template>
  <section class="grid grid-cols-2 md:grid-cols-4 gap-6 mx-auto max-w-3xl">
    <div
      v-for="stat in stats"
      :key="stat.label"
      class="bg-gray-800/50 rounded-lg p-6 backdrop-blur border border-gray-700 text-center"
    >
      <div class="text-3xl md:text-4xl font-bold text-red-500">
        <AnimatedCounter :target="stat.value" :suffix="stat.suffix" />
      </div>
      <p class="text-gray-300 text-sm mt-2">{{ stat.label }}</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import AnimatedCounter from './AnimatedCounter.vue'

const FOUNDING_YEAR = 2024
const FOUNDING_MEMBER_COUNT = 12

const memberCount = ref(FOUNDING_MEMBER_COUNT)

const stats = computed(() => [
  { label: 'Mitglieder', value: memberCount.value, suffix: '' },
  { label: 'Gründungsmitglieder', value: FOUNDING_MEMBER_COUNT, suffix: '' },
  { label: 'Gegründet', value: FOUNDING_YEAR, suffix: '' },
  { label: 'Jahre Leidenschaft', value: new Date().getFullYear() - FOUNDING_YEAR || 1, suffix: '+' },
])

onMounted(async () => {
  try {
    const response = await fetch('/api/fanclub-members/count')
    const data: { count: number } = await response.json()
    if (data.count) {
      memberCount.value = data.count
    }
  } catch (error) {
    console.error('Failed to load member count:', error)
  }
})
</script>

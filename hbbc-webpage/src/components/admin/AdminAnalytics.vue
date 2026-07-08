<template>
  <div class="space-y-8">
    <p v-if="errorMessage" class="text-red-400 text-sm text-center">{{ errorMessage }}</p>

    <div v-if="stats" class="space-y-8">
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="bg-gray-800/50 backdrop-blur rounded-lg p-6 border border-gray-500 text-center">
          <p class="text-3xl font-bold text-white">{{ stats.totalPageViews }}</p>
          <p class="text-sm text-gray-400 mt-1">Seitenaufrufe gesamt</p>
        </div>
        <div class="bg-gray-800/50 backdrop-blur rounded-lg p-6 border border-gray-500 text-center">
          <p class="text-3xl font-bold text-white">{{ stats.totalUsers }}</p>
          <p class="text-sm text-gray-400 mt-1">Registrierte Nutzer</p>
        </div>
        <div class="bg-gray-800/50 backdrop-blur rounded-lg p-6 border border-gray-500 text-center">
          <p class="text-3xl font-bold text-white">{{ stats.newUsersLast7Days }}</p>
          <p class="text-sm text-gray-400 mt-1">Neue Nutzer (7 Tage)</p>
        </div>
      </div>

      <div class="bg-gray-800/50 backdrop-blur rounded-lg p-6 border border-gray-500">
        <h2 class="text-lg font-semibold text-white mb-4">Seitenaufrufe der letzten 7 Tage</h2>
        <canvas ref="chartCanvas"></canvas>
      </div>

      <div class="bg-gray-800/50 backdrop-blur rounded-lg p-6 border border-gray-500">
        <h2 class="text-lg font-semibold text-white mb-4">Meistbesuchte Seiten</h2>
        <div v-if="stats.topPaths.length" class="space-y-2">
          <div v-for="entry in stats.topPaths" :key="entry.path" class="flex items-center gap-3">
            <span class="text-sm text-gray-300 w-40 truncate">{{ entry.path }}</span>
            <div class="flex-1 bg-gray-700/50 rounded-full h-2.5 overflow-hidden">
              <div class="bg-red-600 h-full rounded-full" :style="{ width: `${(entry.count / maxTopCount) * 100}%` }" />
            </div>
            <span class="text-sm text-gray-400 w-10 text-right">{{ entry.count }}</span>
          </div>
        </div>
        <p v-else class="text-sm text-gray-400">Noch keine Seitenaufrufe erfasst.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import Chart from 'chart.js/auto'

interface AnalyticsStats {
  totalPageViews: number
  last7Days: { date: string; count: number }[]
  topPaths: { path: string; count: number }[]
  totalUsers: number
  newUsersLast7Days: number
}

const stats = ref<AnalyticsStats | null>(null)
const errorMessage = ref('')
const chartCanvas = ref<HTMLCanvasElement | null>(null)
let chart: Chart | null = null

const maxTopCount = computed(() => Math.max(1, ...(stats.value?.topPaths.map((p) => p.count) ?? [1])))

const renderChart = () => {
  if (!chartCanvas.value || !stats.value) return
  const ctx = chartCanvas.value.getContext('2d')
  if (!ctx) return

  chart?.destroy()
  chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: stats.value.last7Days.map((d) =>
        new Date(d.date).toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' }),
      ),
      datasets: [
        {
          label: 'Seitenaufrufe',
          data: stats.value.last7Days.map((d) => d.count),
          backgroundColor: 'rgba(200, 102, 100, 0.6)',
          borderColor: 'rgb(200, 102, 100)',
          borderWidth: 2,
          borderRadius: 4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: false },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { color: 'rgb(209, 213, 219)', precision: 0 },
          grid: { color: 'rgba(107, 114, 128, 0.3)' },
        },
        x: {
          ticks: { color: 'rgb(209, 213, 219)' },
          grid: { color: 'rgba(107, 114, 128, 0.2)' },
        },
      },
    },
  })
}

const loadStats = async () => {
  try {
    const response = await fetch('/api/admin/analytics', { credentials: 'include' })
    if (!response.ok) throw new Error('Statistiken konnten nicht geladen werden.')
    stats.value = await response.json()
    await nextTick()
    renderChart()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Etwas ist schiefgelaufen.'
  }
}

onMounted(loadStats)
onUnmounted(() => chart?.destroy())
</script>

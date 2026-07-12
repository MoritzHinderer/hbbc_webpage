<template>
  <div class="w-full bg-gray-800/50 backdrop-blur rounded-lg p-8 border border-gray-500">
    <h2 class="text-2xl font-bold text-white mb-6">Mitgliederzahl in den letzten 6 Monaten</h2>
    <canvas ref="chartCanvas"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import Chart from 'chart.js/auto'

const chartCanvas = ref<HTMLCanvasElement | null>(null)
let chart: Chart | null = null

const generateMembershipData = async () => {
  // Six cumulative fanclub-member counts (oldest to newest) — the server
  // does the date bucketing so no per-member join dates are exposed.
  let counts: number[] = [0, 0, 0, 0, 0, 0]
  try {
    const response = await fetch('/api/fanclub-members/growth')
    const data = await response.json()
    if (Array.isArray(data.counts)) counts = data.counts
  } catch (error) {
    console.error('Failed to load fanclub member growth:', error)
  }

  const months: string[] = []
  const today = new Date()
  for (let i = 5; i >= 0; i--) {
    const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1)
    months.push(monthDate.toLocaleDateString('de-DE', { month: 'short', year: '2-digit' }))
  }

  return { months, data: counts }
}

onMounted(async () => {
  if (!chartCanvas.value) return
  
  const { months, data } = await generateMembershipData()
  
  const ctx = chartCanvas.value.getContext('2d')
  if (!ctx) return
  
  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: months,
      datasets: [
        {
          label: 'Anzahl Mitglieder',
          data: data,
          borderColor: 'rgb(200, 102, 100)',
          backgroundColor: 'rgba(200, 102, 100, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0,
          pointRadius: 6,
          pointBackgroundColor: 'rgb(200, 102, 100)',
          pointBorderColor: 'rgb(255, 255, 255)',
          pointBorderWidth: 2,
          pointHoverRadius: 8,
          pointHoverBackgroundColor: 'rgb(22, 163, 74)'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: true,
          labels: {
            color: 'rgb(255, 255, 255)',
            font: {
              size: 14,
              weight: 'bold'
            }
          }
        },
        title: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            color: 'rgb(209, 213, 219)',
            font: {
              size: 12
            }
          },
          grid: {
            color: 'rgba(107, 114, 128, 0.3)'
          }
        },
        x: {
          ticks: {
            color: 'rgb(209, 213, 219)',
            font: {
              size: 12
            }
          },
          grid: {
            color: 'rgba(107, 114, 128, 0.2)'
          }
        }
      }
    }
  })
})

onUnmounted(() => {
  chart?.destroy()
})
</script>

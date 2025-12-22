<template>
  <div class="w-full bg-gray-800/50 backdrop-blur rounded-lg p-8 border border-gray-500">
    <h2 class="text-2xl font-bold text-white mb-6">Mitgliederzahl in den letzten 6 Monaten</h2>
    <canvas ref="chartCanvas"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Chart from 'chart.js/auto'

interface Member {
  joined: string
}

const chartCanvas = ref<HTMLCanvasElement | null>(null)
let chart: Chart | null = null

const generateMembershipData = async () => {
  // Fetch actual member data
  let members: Member[] = []
  try {
    const response = await fetch('/members/members.json')
    const data = await response.json()
    members = data.member || []
  } catch (error) {
    console.error('Failed to load members:', error)
  }

  // Get last 6 months
  const months: string[] = []
  const data: number[] = []
  const today = new Date()

  for (let i = 5; i >= 0; i--) {
    const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1)
    const monthLabel = monthDate.toLocaleDateString('de-DE', { month: 'short', year: '2-digit' })
    months.push(monthLabel)

    // Count members who joined by the end of this month
    const monthEndDate = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0, 23, 59, 59)
    const memberCount = members.filter(member => {
      const joinDate = new Date(member.joined)
      return joinDate <= monthEndDate
    }).length

    data.push(memberCount)
  }

  return { months, data }
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
</script>

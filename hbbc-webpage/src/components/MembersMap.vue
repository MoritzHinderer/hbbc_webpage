<template>
  <div class="w-full bg-gray-800/50 backdrop-blur rounded-lg p-8 border border-gray-500 text-left">
    <h2 class="text-2xl font-bold text-white mb-6 text-center">Wo unsere Mitglieder wohnen</h2>
    <div v-if="hasLocatedMembers" ref="mapEl" class="w-full h-96 rounded-lg overflow-hidden"></div>
    <p v-else class="text-gray-300 text-center">Noch keine Standortdaten hinterlegt.</p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface MemberWithLocation {
  name: string
  location?: string
}

const props = defineProps<{ members: MemberWithLocation[] }>()

// Known-city lookup, since we don't have (or want to collect) precise member
// addresses — city-level is enough to show HBBC's geographic spread.
const CITY_COORDS: Record<string, [number, number]> = {
  hamburg: [53.5511, 9.9937],
  böblingen: [48.6852, 9.0113],
  boeblingen: [48.6852, 9.0113],
  stuttgart: [48.7758, 9.1829],
  sindelfingen: [48.7123, 9.0016],
  berlin: [52.52, 13.405],
  münchen: [48.1351, 11.582],
  muenchen: [48.1351, 11.582],
  köln: [50.9375, 6.9603],
  koeln: [50.9375, 6.9603],
  frankfurt: [50.1109, 8.6821],
}

const mapEl = ref<HTMLElement | null>(null)
let map: L.Map | null = null
let markers: L.Marker[] = []

const locatedGroups = computed(() => {
  const groups = new Map<string, { coords: [number, number]; city: string; members: string[] }>()

  for (const member of props.members) {
    if (!member.location) continue
    const key = member.location.trim().toLowerCase()
    const coords = CITY_COORDS[key]
    if (!coords) continue

    const existing = groups.get(key)
    if (existing) {
      existing.members.push(member.name)
    } else {
      groups.set(key, { coords, city: member.location, members: [member.name] })
    }
  }

  return [...groups.values()]
})

const hasLocatedMembers = computed(() => locatedGroups.value.length > 0)

const renderMarkers = () => {
  if (!map) return
  markers.forEach((marker) => marker.remove())
  markers = locatedGroups.value.map((group) =>
    L.marker(group.coords)
      .addTo(map!)
      .bindPopup(`<strong>${group.city}</strong><br>${group.members.join(', ')}`),
  )
}

// members arrive asynchronously (parent fetches members.json), so the map
// div may not exist yet at mount time — lazily init once it does.
const initMap = async () => {
  if (map || !hasLocatedMembers.value) return
  await nextTick()
  if (!mapEl.value) return

  map = L.map(mapEl.value, { scrollWheelZoom: false }).setView([50.5, 9.5], 6)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map)

  renderMarkers()
}

onMounted(initMap)

watch(hasLocatedMembers, (value) => {
  if (value) initMap()
})

watch(locatedGroups, () => {
  if (map) renderMarkers()
})

onUnmounted(() => {
  map?.remove()
  map = null
})
</script>

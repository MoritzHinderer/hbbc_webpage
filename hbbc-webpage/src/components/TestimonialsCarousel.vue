<template>
  <section v-if="testimonials.length" class="bg-gray-800/50 rounded-lg p-8 backdrop-blur mx-auto max-w-3xl border border-gray-700">
    <h2 class="text-2xl font-bold text-white mb-6">Stimmen aus dem Fanclub</h2>

    <div class="relative min-h-[180px] flex items-center">
      <button
        class="absolute left-0 text-gray-400 hover:text-white text-2xl px-2 z-10"
        aria-label="Vorheriges Zitat"
        @click="previous"
      >
        ‹
      </button>

      <transition name="fade" mode="out-in">
        <blockquote :key="activeIndex" class="mx-10 text-center">
          <p class="text-gray-200 leading-relaxed italic">&ldquo;{{ active.about_me }}&rdquo;</p>
          <footer class="mt-4 text-red-400 font-medium">
            {{ active.name }}<span class="text-gray-400 font-normal"> — {{ active.role }}</span>
          </footer>
        </blockquote>
      </transition>

      <button
        class="absolute right-0 text-gray-400 hover:text-white text-2xl px-2 z-10"
        aria-label="Nächstes Zitat"
        @click="next"
      >
        ›
      </button>
    </div>

    <div class="flex justify-center gap-2 mt-6">
      <button
        v-for="(_, index) in testimonials"
        :key="index"
        :class="['w-2 h-2 rounded-full transition-colors', index === activeIndex ? 'bg-red-500' : 'bg-gray-600']"
        :aria-label="`Zitat ${index + 1}`"
        @click="goTo(index)"
      ></button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

interface Testimonial {
  name: string
  role: string
  about_me: string
}

const testimonials = ref<Testimonial[]>([])
const activeIndex = ref(0)
const active = computed<Testimonial>(
  () => testimonials.value[activeIndex.value] ?? { name: '', role: '', about_me: '' },
)

let intervalId: ReturnType<typeof setInterval> | null = null
const AUTO_ROTATE_MS = 8000

const next = () => {
  activeIndex.value = (activeIndex.value + 1) % testimonials.value.length
}

const previous = () => {
  activeIndex.value = (activeIndex.value - 1 + testimonials.value.length) % testimonials.value.length
}

const goTo = (index: number) => {
  activeIndex.value = index
}

onMounted(async () => {
  try {
    const response = await fetch('/members/members.json')
    const data: { member: Testimonial[] } = await response.json()
    testimonials.value = data.member || []
  } catch (error) {
    console.error('Failed to load testimonials:', error)
  }

  intervalId = setInterval(() => {
    if (testimonials.value.length > 1) next()
  }, AUTO_ROTATE_MS)
})

onUnmounted(() => {
  if (intervalId) clearInterval(intervalId)
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

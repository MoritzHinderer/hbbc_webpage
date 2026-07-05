<template>
  <span ref="el">{{ displayValue }}{{ suffix }}</span>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    target: number
    duration?: number
    suffix?: string
  }>(),
  {
    duration: 1500,
    suffix: '',
  },
)

const el = ref<HTMLElement | null>(null)
const displayValue = ref(0)
let observer: IntersectionObserver | null = null
let animationFrame: number | null = null

const animate = () => {
  const start = performance.now()
  const from = 0
  const to = props.target

  const step = (now: number) => {
    const progress = Math.min((now - start) / props.duration, 1)
    // ease-out cubic
    const eased = 1 - Math.pow(1 - progress, 3)
    displayValue.value = Math.round(from + (to - from) * eased)

    if (progress < 1) {
      animationFrame = requestAnimationFrame(step)
    }
  }

  animationFrame = requestAnimationFrame(step)
}

onMounted(() => {
  if (!el.value) return

  observer = new IntersectionObserver(
    (entries) => {
      if (entries[0]?.isIntersecting) {
        animate()
        observer?.disconnect()
      }
    },
    { threshold: 0.4 },
  )
  observer.observe(el.value)
})

onUnmounted(() => {
  observer?.disconnect()
  if (animationFrame !== null) cancelAnimationFrame(animationFrame)
})

watch(
  () => props.target,
  () => {
    displayValue.value = 0
  },
)
</script>

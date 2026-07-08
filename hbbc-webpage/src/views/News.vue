<template>
  <div class="min-h-screen" style="background: linear-gradient(to bottom, rgb(31, 41, 55) 0%, rgb(80, 7, 7) 100%);">
    <div class="max-w-4xl mx-auto px-6 py-16 space-y-12">
      <div class="text-center space-y-4">
        <h1 class="text-4xl md:text-5xl font-bold text-white">News</h1>
        <p class="text-xl text-gray-200">Neuigkeiten rund um den Fanclub.</p>
      </div>

      <p v-if="errorMessage" class="text-red-400 text-sm text-center">{{ errorMessage }}</p>

      <div v-if="news.length" class="space-y-6">
        <article
          v-for="item in news"
          :key="item.id"
          class="bg-gray-800/50 backdrop-blur rounded-2xl border border-gray-500 overflow-hidden"
        >
          <img
            v-if="item.coverImage"
            :src="`/api/news/photos/${item.coverImage}`"
            :alt="item.title"
            class="w-full max-h-96 object-cover"
          />
          <div class="px-7 pt-6 pb-2 flex items-start gap-4">
            <img :src="logo" alt="" aria-hidden="true" class="w-9 h-9 object-contain opacity-80 shrink-0 mt-1" />
            <div>
              <h2 class="text-2xl font-bold text-white">{{ item.title }}</h2>
              <p class="text-sm text-gray-400 mt-1">{{ formatDate(item.createdAt) }}</p>
            </div>
          </div>
          <div class="article-body px-7 pb-7 pt-2 leading-relaxed text-gray-200" v-html="item.body"></div>
        </article>
      </div>

      <div v-else-if="!loading" class="bg-gray-800/50 backdrop-blur rounded-lg p-10 border border-gray-500 text-gray-300 text-center">
        Noch keine News. Schau bald wieder vorbei!
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import logo from '../assets/hbbc_logo.webp'

interface NewsArticle {
  id: number
  title: string
  body: string
  createdAt: string
  coverImage?: string
}

const news = ref<NewsArticle[]>([])
const errorMessage = ref('')
const loading = ref(true)

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('de-DE', { year: 'numeric', month: 'long', day: 'numeric' })

onMounted(async () => {
  try {
    const response = await fetch('/api/news')
    if (!response.ok) throw new Error('News konnten nicht geladen werden.')
    const data = await response.json()
    news.value = data.news ?? []
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Etwas ist schiefgelaufen.'
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.article-body :deep(h2) {
  font-size: 1.1875rem;
  font-weight: 700;
  margin: 1.25rem 0 0.625rem;
  padding-left: 0.75rem;
  border-left: 3px solid #ef4444;
  color: white;
}

.article-body :deep(p) {
  margin: 0 0 0.875rem;
}

.article-body :deep(ul) {
  list-style: disc;
  padding-left: 1.375rem;
  margin: 0 0 0.875rem;
}

.article-body :deep(ol) {
  list-style: decimal;
  padding-left: 1.375rem;
  margin: 0 0 0.875rem;
}

.article-body :deep(li) {
  margin: 0.25rem 0;
}

.article-body :deep(a) {
  color: #f87171;
  text-decoration: underline;
}

.article-body :deep(strong) {
  color: white;
}

.article-body :deep(em) {
  color: #d1d5db;
}
</style>

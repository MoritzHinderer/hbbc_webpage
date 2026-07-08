<template>
  <div class="space-y-10">
    <p v-if="errorMessage" class="text-red-400 text-sm text-center">{{ errorMessage }}</p>
    <p v-if="successMessage" class="text-green-400 text-sm text-center">{{ successMessage }}</p>

    <section class="bg-gray-800/50 backdrop-blur rounded-lg p-6 border border-gray-500 space-y-4 max-w-2xl mx-auto">
      <h2 class="text-xl font-bold text-white">{{ editingId ? 'Artikel bearbeiten' : 'Neuer Artikel' }}</h2>

      <div>
        <label class="block text-sm font-medium text-gray-300 mb-1">Titel</label>
        <input
          v-model="title"
          type="text"
          maxlength="150"
          placeholder="z. B. Neuer Vorstand gewählt"
          class="w-full rounded-md bg-gray-900/60 border border-gray-600 px-3 py-2 text-white focus:outline-none focus:border-red-500"
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-300 mb-1">Titelbild <span class="text-gray-500">(optional)</span></label>
        <div v-if="coverImagePreviewUrl" class="mb-2 relative inline-block">
          <img :src="coverImagePreviewUrl" alt="Titelbild-Vorschau" class="max-h-40 rounded-md border border-gray-600" />
          <button
            type="button"
            class="absolute -top-2 -right-2 bg-gray-900 border border-gray-600 hover:border-red-400 text-gray-300 hover:text-red-400 rounded-full w-6 h-6 flex items-center justify-center text-sm"
            title="Titelbild entfernen"
            @click="clearCoverImage"
          >
            &times;
          </button>
        </div>
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          class="w-full text-sm text-gray-300 cursor-pointer file:mr-4 file:cursor-pointer file:rounded-md file:border-0 file:bg-red-700 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white file:transition-colors hover:file:bg-red-600"
          @change="onCoverImageChange"
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-300 mb-1">Inhalt</label>
        <div class="flex flex-wrap gap-1 bg-gray-900/60 border border-gray-600 border-b-0 rounded-t-md p-2">
          <button
            v-for="btn in toolbarButtons"
            :key="btn.label"
            type="button"
            :class="[
              'px-2.5 py-1 rounded text-sm font-medium transition-colors',
              btn.isActive() ? 'bg-red-700 text-white' : 'text-gray-300 hover:bg-white/10',
            ]"
            @click="btn.action"
          >
            {{ btn.label }}
          </button>
        </div>
        <editor-content :editor="editor" class="tiptap-content bg-gray-900/60 border border-gray-600 rounded-b-md text-white" />
      </div>

      <div class="flex flex-wrap gap-3 pt-2">
        <button
          type="button"
          :disabled="saveStatus === 'saving' || !title.trim() || !editorHtml.trim()"
          class="btn-animated bg-red-700 hover:bg-red-600 disabled:bg-gray-600 disabled:opacity-60 text-white font-medium px-5 py-2 rounded-lg transition-colors"
          @click="handleSave"
        >
          {{ saveStatus === 'saving' ? 'Wird gespeichert…' : editingId ? 'Änderungen speichern' : 'Veröffentlichen' }}
        </button>
        <button
          v-if="editingId"
          type="button"
          class="text-sm text-gray-300 hover:text-white border border-gray-600 hover:border-gray-400 rounded-lg px-4 py-2 transition-colors"
          @click="resetForm"
        >
          Abbrechen
        </button>
      </div>
    </section>

    <section class="space-y-4">
      <h2 class="text-xl font-bold text-white">Veröffentlichte Artikel</h2>
      <div v-if="news.length" class="grid gap-3">
        <div v-for="item in news" :key="item.id" class="bg-gray-800/50 backdrop-blur rounded-lg border border-gray-500 p-4 flex items-center justify-between gap-4">
          <div class="min-w-0 flex items-center gap-3">
            <img v-if="item.coverImage" :src="`/api/news/photos/${item.coverImage}`" alt="" class="w-12 h-12 rounded-md object-cover border border-gray-600 shrink-0" />
            <div class="min-w-0">
              <p class="text-white font-medium truncate">{{ item.title }}</p>
              <p class="text-gray-500 text-xs">{{ formatDate(item.createdAt) }}</p>
            </div>
          </div>
          <div class="flex gap-3 shrink-0">
            <button class="text-sm text-gray-300 hover:text-white" @click="startEdit(item)">Bearbeiten</button>
            <button class="text-sm text-red-400 hover:text-red-300" @click="handleDelete(item.id)">Löschen</button>
          </div>
        </div>
      </div>
      <div v-else class="bg-gray-800/50 backdrop-blur rounded-lg p-10 border border-gray-500 text-gray-300 text-center">
        Noch keine Artikel veröffentlicht.
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'

interface NewsArticle {
  id: number
  title: string
  body: string
  createdAt: string
  coverImage?: string
}

const news = ref<NewsArticle[]>([])
const errorMessage = ref('')
const successMessage = ref('')
const saveStatus = ref<'idle' | 'saving'>('idle')
const title = ref('')
const editorHtml = ref('')
const editingId = ref<number | null>(null)

// Three-state cover image handling: no file picked + no existing image
// (undefined/undefined), an existing image kept as-is (null file, url set
// from the server), a newly picked file (file set, local object-URL
// preview), or explicitly cleared (both null) — removeCoverImage below
// distinguishes "kept" from "cleared" when neither picks a new file.
const coverImageFile = ref<File | null>(null)
const existingCoverImageUrl = ref<string | null>(null)
const coverImageCleared = ref(false)

const coverImagePreviewUrl = computed(() => {
  if (coverImageFile.value) return URL.createObjectURL(coverImageFile.value)
  if (coverImageCleared.value) return null
  return existingCoverImageUrl.value
})

const onCoverImageChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  coverImageFile.value = target.files?.[0] ?? null
  coverImageCleared.value = false
}

const clearCoverImage = () => {
  coverImageFile.value = null
  existingCoverImageUrl.value = null
  coverImageCleared.value = true
}

const editor = useEditor({
  content: '',
  extensions: [StarterKit, Link.configure({ openOnClick: false, autolink: true })],
  onUpdate: ({ editor }) => {
    editorHtml.value = editor.getHTML()
  },
})

const setLink = () => {
  if (!editor.value) return
  const previousUrl = editor.value.getAttributes('link').href as string | undefined
  const url = window.prompt('Link-URL', previousUrl || 'https://')
  if (url === null) return
  if (url === '') {
    editor.value.chain().focus().extendMarkRange('link').unsetLink().run()
    return
  }
  editor.value.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
}

const toolbarButtons = computed(() => {
  const instance = editor.value
  if (!instance) return []
  return [
    { label: 'Fett', action: () => instance.chain().focus().toggleBold().run(), isActive: () => instance.isActive('bold') },
    { label: 'Kursiv', action: () => instance.chain().focus().toggleItalic().run(), isActive: () => instance.isActive('italic') },
    {
      label: 'Überschrift',
      action: () => instance.chain().focus().toggleHeading({ level: 2 }).run(),
      isActive: () => instance.isActive('heading', { level: 2 }),
    },
    {
      label: 'Liste',
      action: () => instance.chain().focus().toggleBulletList().run(),
      isActive: () => instance.isActive('bulletList'),
    },
    {
      label: 'Nummerierung',
      action: () => instance.chain().focus().toggleOrderedList().run(),
      isActive: () => instance.isActive('orderedList'),
    },
    { label: 'Link', action: setLink, isActive: () => instance.isActive('link') },
  ]
})

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('de-DE', { year: 'numeric', month: 'long', day: 'numeric' })

const loadNews = async () => {
  try {
    const response = await fetch('/api/admin/news', { credentials: 'include' })
    if (!response.ok) throw new Error('Artikel konnten nicht geladen werden.')
    const data = await response.json()
    news.value = data.news ?? []
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Etwas ist schiefgelaufen.'
  }
}

const resetForm = () => {
  editingId.value = null
  title.value = ''
  editorHtml.value = ''
  editor.value?.commands.setContent('')
  coverImageFile.value = null
  existingCoverImageUrl.value = null
  coverImageCleared.value = false
}

const startEdit = (item: NewsArticle) => {
  editingId.value = item.id
  title.value = item.title
  editorHtml.value = item.body
  editor.value?.commands.setContent(item.body)
  coverImageFile.value = null
  existingCoverImageUrl.value = item.coverImage ? `/api/news/photos/${item.coverImage}` : null
  coverImageCleared.value = false
  successMessage.value = ''
}

const handleSave = async () => {
  errorMessage.value = ''
  successMessage.value = ''
  saveStatus.value = 'saving'
  try {
    const url = editingId.value ? `/api/admin/news/${editingId.value}` : '/api/admin/news'
    const formData = new FormData()
    formData.append('title', title.value)
    formData.append('body', editorHtml.value)
    if (coverImageFile.value) formData.append('coverImage', coverImageFile.value)
    if (coverImageCleared.value) formData.append('removeCoverImage', 'true')

    const response = await fetch(url, {
      method: editingId.value ? 'PUT' : 'POST',
      credentials: 'include',
      body: formData,
    })
    const data = await response.json().catch(() => null)
    if (!response.ok) throw new Error(data?.error || 'Speichern fehlgeschlagen.')

    successMessage.value = editingId.value ? 'Artikel aktualisiert.' : 'Artikel veröffentlicht.'
    resetForm()
    await loadNews()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Etwas ist schiefgelaufen.'
  } finally {
    saveStatus.value = 'idle'
  }
}

const handleDelete = async (id: number) => {
  if (!confirm('Diesen Artikel wirklich löschen?')) return
  errorMessage.value = ''
  try {
    const response = await fetch(`/api/admin/news/${id}`, { method: 'DELETE', credentials: 'include' })
    if (!response.ok) {
      const data = await response.json().catch(() => null)
      throw new Error(data?.error || 'Löschen fehlgeschlagen.')
    }
    news.value = news.value.filter((n) => n.id !== id)
    if (editingId.value === id) resetForm()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Etwas ist schiefgelaufen.'
  }
}

onMounted(loadNews)
</script>

<style scoped>
.tiptap-content :deep(.ProseMirror) {
  min-height: 200px;
  padding: 0.75rem;
  outline: none;
}

.tiptap-content :deep(.ProseMirror h2) {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0.5rem 0;
}

.tiptap-content :deep(.ProseMirror ul),
.tiptap-content :deep(.ProseMirror ol) {
  padding-left: 1.5rem;
  margin: 0.5rem 0;
}

.tiptap-content :deep(.ProseMirror ul) {
  list-style: disc;
}

.tiptap-content :deep(.ProseMirror ol) {
  list-style: decimal;
}

.tiptap-content :deep(.ProseMirror a) {
  color: #f87171;
  text-decoration: underline;
}

.tiptap-content :deep(.ProseMirror p) {
  margin: 0.5rem 0;
}
</style>

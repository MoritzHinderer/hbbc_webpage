<template>
  <div class="space-y-10">
    <p v-if="errorMessage" class="text-red-400 text-sm text-center">{{ errorMessage }}</p>
    <p v-if="successMessage" class="text-green-400 text-sm text-center">{{ successMessage }}</p>

    <section class="grid lg:grid-cols-2 gap-8">
      <!-- Composer -->
      <div class="bg-gray-800/50 backdrop-blur rounded-lg p-6 border border-gray-500 space-y-4">
        <h2 class="text-xl font-bold text-white">Newsletter verfassen</h2>

        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1">Betreff</label>
          <input
            v-model="subject"
            type="text"
            maxlength="200"
            placeholder="z. B. Einladung zum nächsten Vereinsabend"
            class="w-full rounded-md bg-gray-900/60 border border-gray-600 px-3 py-2 text-white focus:outline-none focus:border-red-500"
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
            :disabled="sendStatus !== 'idle' || !subject.trim()"
            class="btn-animated bg-gray-700 hover:bg-gray-600 disabled:bg-gray-600 disabled:opacity-60 text-white font-medium px-5 py-2 rounded-lg transition-colors"
            @click="sendTest"
          >
            {{ sendStatus === 'test' ? 'Wird gesendet…' : 'Test-Mail an mich senden' }}
          </button>
          <button
            type="button"
            :disabled="sendStatus !== 'idle' || !subject.trim()"
            class="btn-animated bg-red-700 hover:bg-red-600 disabled:bg-gray-600 disabled:opacity-60 text-white font-medium px-5 py-2 rounded-lg transition-colors"
            @click="sendToAll"
          >
            {{ sendStatus === 'all' ? 'Wird gesendet…' : `An alle Abonnenten senden (${subscriberCount})` }}
          </button>
        </div>
      </div>

      <!-- Preview -->
      <div class="space-y-3">
        <h2 class="text-xl font-bold text-white">Vorschau</h2>
        <div class="rounded-2xl overflow-hidden border" style="border-color: #262f42;">
          <div
            class="flex flex-col items-center px-6"
            style="padding-top: 36px; padding-bottom: 28px; background-color: #3f0a0a; background-image: linear-gradient(135deg, #4a0d0d 0%, #2a0606 100%);"
          >
            <img :src="logo" alt="HBBC Logo" class="w-14 h-14 object-contain rounded-lg" />
            <p class="mt-4 text-[11px] font-bold tracking-widest uppercase" style="color: #fca5a5;">HBBC Newsletter</p>
            <p class="text-white font-semibold mt-1.5 text-center px-4">
              Hamburger Böblinger Banausenchor und VFB Fanclub
            </p>
          </div>
          <div style="height: 3px; background-color: #ef4444;"></div>
          <div class="px-7 py-8 leading-relaxed" style="background-color: #161d2b; color: #d1d5db;">
            <h1 class="text-white text-2xl font-bold mb-5">{{ subject || 'Betreff' }}</h1>
            <div v-if="editorHtml" class="preview-body" v-html="editorHtml"></div>
            <p v-else class="text-gray-500">Der Inhalt erscheint hier, sobald du zu schreiben beginnst…</p>
          </div>
          <div
            class="text-gray-500 text-xs text-center px-7 py-5 leading-relaxed border-t"
            style="background-color: #0f1420; border-color: #262f42;"
          >
            Du erhältst diese E-Mail, weil du den HBBC-Newsletter abonniert hast.<br />
            Abmelden kannst du dich jederzeit in deinem Profil.
          </div>
        </div>
      </div>
    </section>

    <section class="space-y-4">
      <h2 class="text-xl font-bold text-white">Bisherige Newsletter</h2>

      <div v-if="history.length" class="grid gap-3">
        <div v-for="item in history" :key="item.id" class="bg-gray-800/50 backdrop-blur rounded-lg border border-gray-500 overflow-hidden">
          <button
            type="button"
            class="w-full flex flex-wrap items-center justify-between gap-2 p-4 text-left"
            @click="toggleExpanded(item.id)"
          >
            <div>
              <p class="text-white font-medium">{{ item.subject }}</p>
              <p class="text-gray-500 text-xs">{{ formatDate(item.sent_at) }}</p>
            </div>
            <div class="flex items-center gap-3">
              <span class="text-sm text-gray-300">{{ item.recipient_count }} Empfänger</span>
              <ChevronDownIcon
                class="w-4 h-4 text-gray-400 transition-transform"
                :class="{ 'rotate-180': expandedId === item.id }"
              />
            </div>
          </button>

          <div v-if="expandedId === item.id" class="border-t border-gray-700 px-4 py-4">
            <div class="preview-body" v-html="item.body_html"></div>
          </div>
        </div>
      </div>
      <div v-else class="bg-gray-800/50 backdrop-blur rounded-lg p-10 border border-gray-500 text-gray-300 text-center">
        Noch keine Newsletter versendet.
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import { ChevronDownIcon } from '@heroicons/vue/24/outline'
import logo from '../../assets/hbbc_logo.webp'

interface HistoryItem {
  id: number
  subject: string
  body_html: string
  recipient_count: number
  sent_at: string
}

const subject = ref('')
const errorMessage = ref('')
const successMessage = ref('')
const sendStatus = ref<'idle' | 'test' | 'all'>('idle')
const subscriberCount = ref(0)
const history = ref<HistoryItem[]>([])
const editorHtml = ref('')
const expandedId = ref<number | null>(null)

const toggleExpanded = (id: number) => {
  expandedId.value = expandedId.value === id ? null : id
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

// Recomputed on every toolbarButtons access — cheap, and keeps isActive()
// reflecting the editor's current selection without a separate reactive copy.
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
  new Date(dateString).toLocaleDateString('de-DE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

const loadData = async () => {
  try {
    const [subsRes, historyRes] = await Promise.all([
      fetch('/api/admin/newsletter/subscribers', { credentials: 'include' }),
      fetch('/api/admin/newsletter/history', { credentials: 'include' }),
    ])
    if (!subsRes.ok || !historyRes.ok) throw new Error('Daten konnten nicht geladen werden.')
    const subsData = await subsRes.json()
    const historyData = await historyRes.json()
    subscriberCount.value = subsData.subscribers.length
    history.value = historyData.history
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Etwas ist schiefgelaufen.'
  }
}

const send = async (testOnly: boolean) => {
  errorMessage.value = ''
  successMessage.value = ''
  sendStatus.value = testOnly ? 'test' : 'all'
  try {
    const response = await fetch('/api/admin/newsletter/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ subject: subject.value, bodyHtml: editorHtml.value, testOnly }),
    })
    const data = await response.json().catch(() => null)
    if (!response.ok) throw new Error(data?.error || 'Senden fehlgeschlagen.')

    if (testOnly) {
      successMessage.value = 'Test-Mail wurde an dich gesendet.'
    } else {
      successMessage.value = `Newsletter an ${data.sent} Abonnent(en) gesendet.${data.failed ? ` (${data.failed} fehlgeschlagen)` : ''}`
      await loadData()
    }
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Etwas ist schiefgelaufen.'
  } finally {
    sendStatus.value = 'idle'
  }
}

const sendTest = () => send(true)
const sendToAll = () => {
  if (!confirm(`Newsletter wirklich an ${subscriberCount.value} Abonnent(en) senden?`)) return
  send(false)
}

onMounted(loadData)
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

.preview-body :deep(h2) {
  font-size: 1.1875rem;
  font-weight: 700;
  margin: 1.5rem 0 0.625rem;
  padding-left: 0.75rem;
  border-left: 3px solid #ef4444;
  color: white;
}

.preview-body :deep(p) {
  margin: 0 0 0.875rem;
}

.preview-body :deep(ul) {
  list-style: disc;
  padding-left: 1.375rem;
  margin: 0 0 0.875rem;
}

.preview-body :deep(ol) {
  list-style: decimal;
  padding-left: 1.375rem;
  margin: 0 0 0.875rem;
}

.preview-body :deep(li) {
  margin: 0.25rem 0;
}

.preview-body :deep(a) {
  color: #f87171;
  text-decoration: underline;
}

.preview-body :deep(strong) {
  color: white;
}

.preview-body :deep(em) {
  color: #d1d5db;
}
</style>

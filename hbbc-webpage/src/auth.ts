import { ref } from 'vue'

export interface CurrentUser {
  id: number
  name: string
  email: string
  role: 'member' | 'admin'
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  newsletterSubscribed: boolean
}

export const currentUser = ref<CurrentUser | null>(null)

// Cached so the router guard can `await checkAuth()` on every navigation
// without re-hitting the network each time — only the first call (app
// startup / hard refresh) actually fetches; login()/logout() update
// currentUser directly afterwards.
let authCheckPromise: Promise<void> | null = null

export function checkAuth(): Promise<void> {
  if (!authCheckPromise) {
    authCheckPromise = fetch('/api/auth/me', { credentials: 'include' })
      .then((response) => response.json())
      .then((data) => {
        currentUser.value = data.user ?? null
      })
      .catch(() => {
        currentUser.value = null
      })
  }
  return authCheckPromise
}

async function postJson<T>(url: string, payload: unknown): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  })

  const data = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(data?.error || 'Etwas ist schiefgelaufen.')
  }
  return data as T
}

export async function login(email: string, password: string): Promise<void> {
  const data = await postJson<{ user: CurrentUser }>('/api/auth/login', { email, password })
  currentUser.value = data.user
}

export async function register(payload: {
  name: string
  email: string
  password: string
  message?: string
}): Promise<void> {
  await postJson('/api/auth/register', payload)
}

export async function logout(): Promise<void> {
  await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
  currentUser.value = null
}

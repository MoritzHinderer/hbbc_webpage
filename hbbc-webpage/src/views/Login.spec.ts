import { describe, expect, it, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'
import Login from './Login.vue'

const { loginMock } = vi.hoisted(() => ({ loginMock: vi.fn() }))
vi.mock('../auth', () => ({ login: loginMock }))

async function mountLogin(initialPath = '/login'): Promise<{ router: Router; wrapper: ReturnType<typeof mount> }> {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: { template: '<div>home</div>' } },
      { path: '/login', name: 'login', component: Login },
      { path: '/register', name: 'register', component: { template: '<div>register</div>' } },
      { path: '/forgot-password', name: 'forgot-password', component: { template: '<div>forgot</div>' } },
    ],
  })
  router.push(initialPath)
  await router.isReady()
  const wrapper = mount(Login, { global: { plugins: [router] } })
  return { router, wrapper }
}

describe('Login.vue', () => {
  beforeEach(() => {
    loginMock.mockReset()
  })

  it('renders the email/password form and the forgot-password link', async () => {
    const { wrapper } = await mountLogin()
    expect(wrapper.find('#email').exists()).toBe(true)
    expect(wrapper.find('#password').exists()).toBe(true)
    expect(wrapper.text()).toContain('Passwort vergessen?')
  })

  it('shows the redirect-reason banner for a known protected route', async () => {
    const { wrapper } = await mountLogin('/login?redirect=%2Fadmin')
    expect(wrapper.text()).toContain('den Admin-Bereich')
  })

  it('shows no banner when there is no redirect param', async () => {
    const { wrapper } = await mountLogin('/login')
    expect(wrapper.text()).not.toContain('ist ein HBBC-Konto erforderlich')
  })

  it('calls login() with the entered credentials on submit', async () => {
    loginMock.mockResolvedValueOnce(undefined)
    const { wrapper } = await mountLogin()

    await wrapper.find('#email').setValue('person@example.test')
    await wrapper.find('#password').setValue('SomePassword123!')
    await wrapper.find('form').trigger('submit.prevent')
    await wrapper.vm.$nextTick()

    expect(loginMock).toHaveBeenCalledWith('person@example.test', 'SomePassword123!')
  })

  it('shows the server error message when login() rejects', async () => {
    loginMock.mockRejectedValueOnce(new Error('E-Mail oder Passwort ist falsch.'))
    const { wrapper } = await mountLogin()

    await wrapper.find('#email').setValue('person@example.test')
    await wrapper.find('#password').setValue('WrongPassword')
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(wrapper.text()).toContain('E-Mail oder Passwort ist falsch.')
  })
})

function flushPromises() {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

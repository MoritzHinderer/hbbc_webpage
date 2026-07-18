import { describe, expect, it, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import ForgotPassword from './ForgotPassword.vue'

const { forgotPasswordMock } = vi.hoisted(() => ({ forgotPasswordMock: vi.fn() }))
vi.mock('../auth', () => ({ forgotPassword: forgotPasswordMock }))

function flushPromises() {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

async function mountForgotPassword() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/login', name: 'login', component: { template: '<div>login</div>' } },
      { path: '/forgot-password', name: 'forgot-password', component: ForgotPassword },
    ],
  })
  router.push('/forgot-password')
  await router.isReady()
  return mount(ForgotPassword, { global: { plugins: [router] } })
}

describe('ForgotPassword.vue', () => {
  beforeEach(() => {
    forgotPasswordMock.mockReset()
  })

  const CONFIRMATION_TEXT = 'Falls ein Konto mit dieser E-Mail existiert'

  it('shows the generic confirmation when the API call succeeds', async () => {
    forgotPasswordMock.mockResolvedValueOnce(undefined)
    const wrapper = await mountForgotPassword()

    await wrapper.find('#email').setValue('real-account@example.test')
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(forgotPasswordMock).toHaveBeenCalledWith('real-account@example.test')
    expect(wrapper.text()).toContain(CONFIRMATION_TEXT)
  })

  it('shows the exact same generic confirmation even when the API call fails', async () => {
    forgotPasswordMock.mockRejectedValueOnce(new Error('network error'))
    const wrapper = await mountForgotPassword()

    await wrapper.find('#email').setValue('whatever@example.test')
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    // No-enumeration UX contract: never a different message based on outcome.
    expect(wrapper.text()).toContain(CONFIRMATION_TEXT)
    expect(wrapper.text()).not.toContain('Fehler')
  })

  it('disables the submit button while sending', async () => {
    let resolveCall: () => void = () => {}
    forgotPasswordMock.mockImplementationOnce(() => new Promise<void>((resolve) => { resolveCall = resolve }))
    const wrapper = await mountForgotPassword()

    await wrapper.find('#email').setValue('someone@example.test')
    await wrapper.find('form').trigger('submit.prevent')
    await wrapper.vm.$nextTick()

    const button = wrapper.find('button[type="submit"]')
    expect(button.attributes('disabled')).toBeDefined()

    resolveCall()
    await flushPromises()
  })
})

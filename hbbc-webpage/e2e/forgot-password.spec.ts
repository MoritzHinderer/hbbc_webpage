import { test, expect } from '@playwright/test'
import { approveUser, getLatestResetToken } from './db-helper'

test('full forgot-password flow: request link, reset, log in with new password', async ({ page }) => {
  const email = `e2e-forgot-${Date.now()}@example.test`
  const oldPassword = 'OldPassword123!'
  const newPassword = 'BrandNewPassword456!'

  await page.goto('/register')
  await page.fill('#name', 'E2E Forgot Password Test')
  await page.fill('#email', email)
  await page.fill('#password', oldPassword)
  await page.click('button[type="submit"]')
  await expect(page.locator('text=Danke! Deine Anfrage wurde gesendet')).toBeVisible({ timeout: 10000 })
  approveUser(email)

  await page.goto('/login')
  await expect(page.locator('a:has-text("Passwort vergessen?")')).toBeVisible()
  await page.click('a:has-text("Passwort vergessen?")')
  await expect(page).toHaveURL('/forgot-password')

  await page.fill('#email', email)
  await page.click('button[type="submit"]')
  await expect(page.locator('text=Falls ein Konto mit dieser E-Mail existiert')).toBeVisible({ timeout: 10000 })

  const token = getLatestResetToken(email)
  await page.goto(`/reset-password?token=${token}`)
  await page.fill('#password', newPassword)
  await page.fill('#confirmPassword', newPassword)
  await page.click('button[type="submit"]')
  await expect(page.locator('text=Dein Passwort wurde geändert')).toBeVisible({ timeout: 10000 })

  await page.click('a:has-text("Zur Anmeldung")')
  await expect(page).toHaveURL('/login')

  // Old password no longer works.
  await page.fill('#email', email)
  await page.fill('#password', oldPassword)
  await page.click('button[type="submit"]')
  await expect(page.locator('text=E-Mail oder Passwort ist falsch')).toBeVisible()

  // New password does.
  await page.fill('#email', email)
  await page.fill('#password', newPassword)
  await page.click('button[type="submit"]')
  await expect(page).toHaveURL('/')
  await expect(page.locator('button', { hasText: 'E2E Forgot Password Test' })).toBeVisible()
})

test('an invalid/expired token shows the generic error, not a crash', async ({ page }) => {
  await page.goto('/reset-password?token=totally-made-up-token')
  await page.fill('#password', 'SomeNewPassword123!')
  await page.fill('#confirmPassword', 'SomeNewPassword123!')
  await page.click('button[type="submit"]')
  await expect(page.locator('text=Link ungültig oder abgelaufen')).toBeVisible({ timeout: 10000 })
})

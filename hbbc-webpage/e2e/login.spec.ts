import { test, expect } from '@playwright/test'
import { approveUser } from './db-helper'

test('register, approve, log in, and log out', async ({ page }) => {
  const email = `e2e-login-${Date.now()}@example.test`
  const password = 'E2ePassword123!'

  await page.goto('/register')
  await page.fill('#name', 'E2E Login Test')
  await page.fill('#email', email)
  await page.fill('#password', password)
  await page.click('button[type="submit"]')
  await expect(page.locator('text=Danke! Deine Anfrage wurde gesendet')).toBeVisible({ timeout: 10000 })

  approveUser(email)

  await page.goto('/login')
  await page.fill('#email', email)
  await page.fill('#password', password)
  await page.click('button[type="submit"]')

  await expect(page).toHaveURL('/')
  // The account-menu trigger button (desktop navbar) — a <button>, unlike
  // the read-only name display in the mobile menu panel, so this can't
  // ambiguously match both.
  const accountMenuButton = page.locator('button', { hasText: 'E2E Login Test' })
  await expect(accountMenuButton).toBeVisible()

  await accountMenuButton.click()
  await page.click('button:has-text("Logout")')
  await expect(page.locator('a:has-text("Anmelden")')).toBeVisible()
})

test('rejects a login with the wrong password', async ({ page }) => {
  const email = `e2e-login-wrong-${Date.now()}@example.test`
  const password = 'E2ePassword123!'

  await page.goto('/register')
  await page.fill('#name', 'E2E Wrong Password Test')
  await page.fill('#email', email)
  await page.fill('#password', password)
  await page.click('button[type="submit"]')
  await expect(page.locator('text=Danke! Deine Anfrage wurde gesendet')).toBeVisible({ timeout: 10000 })
  approveUser(email)

  await page.goto('/login')
  await page.fill('#email', email)
  await page.fill('#password', 'DefinitelyTheWrongPassword')
  await page.click('button[type="submit"]')

  await expect(page.locator('text=E-Mail oder Passwort ist falsch')).toBeVisible()
  await expect(page).toHaveURL('/login')
})

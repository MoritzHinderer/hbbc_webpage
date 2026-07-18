import { test, expect } from '@playwright/test'

test('unknown URL shows the 404 page instead of an error', async ({ page }) => {
  const response = await page.goto('/this-route-does-not-exist')
  expect(response?.status()).toBeLessThan(400)
  await expect(page.locator('text=404')).toBeVisible()
})

test('navbar links use client-side routing, not a full page reload', async ({ page }) => {
  await page.goto('/')

  // A marker only a fresh document load would clear — survives a client-
  // side route change, gets wiped by an actual full navigation/reload.
  await page.evaluate(() => {
    ;(window as unknown as { __e2eMarker: string }).__e2eMarker = 'still-here'
  })

  await page.click('a:has-text("Mitglieder")')
  await expect(page).toHaveURL('/members')

  const marker = await page.evaluate(() => (window as unknown as { __e2eMarker?: string }).__e2eMarker)
  expect(marker).toBe('still-here')
})

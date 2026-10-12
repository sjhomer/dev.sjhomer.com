import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

/** Seed a resolved sound preference so the first-load gate is skipped. */
async function seedSound(page: Page, level: string) {
  await page.addInitScript((lvl) => {
    try {
      localStorage.setItem('mu-sound', lvl)
    } catch {
      /* ignore */
    }
  }, level)
}

test('first visit shows the sound gate and bypass dismisses it silently', async ({
  page,
}) => {
  // Fresh context → no stored preference → the gate must appear and halt boot.
  await page.goto('/')
  const dialog = page.getByRole('dialog', { name: /ENABLE INTERFACE AUDIO/i })
  await expect(dialog).toBeVisible()

  await page.getByRole('button', { name: /BYPASS/i }).click()

  await expect(dialog).toBeHidden()
  await expect(
    page.getByRole('heading', { name: /MU\/TH\/UR 6000/ }),
  ).toBeVisible()
  expect(await page.evaluate(() => localStorage.getItem('mu-sound'))).toBe(
    'off',
  )
})

test('pressing Escape on the gate bypasses it silently', async ({ page }) => {
  await page.goto('/')
  const dialog = page.getByRole('dialog', { name: /ENABLE INTERFACE AUDIO/i })
  await expect(dialog).toBeVisible()

  await page.keyboard.press('Escape')

  await expect(dialog).toBeHidden()
  expect(await page.evaluate(() => localStorage.getItem('mu-sound'))).toBe(
    'off',
  )
})

test('choosing the authentic experience records a sound level', async ({
  page,
}) => {
  await page.goto('/')
  await expect(
    page.getByRole('dialog', { name: /ENABLE INTERFACE AUDIO/i }),
  ).toBeVisible()
  await page.getByRole('button', { name: /AUTHENTIC EXPERIENCE/i }).click()
  expect(await page.evaluate(() => localStorage.getItem('mu-sound'))).toBe('on')
})

/** The ship clock only ticks after client hydration — a reliable interactive signal. */
async function waitForHydration(page: Page) {
  await expect(page.locator('.mu-clock')).not.toContainText('--:--:--')
}

test('volume button toggles off <-> on and persists', async ({ page }) => {
  await seedSound(page, 'off')
  await page.goto('/')
  await waitForHydration(page)

  const vol = page.getByRole('button', { name: /^Volume / })
  await expect(vol).toHaveAttribute('aria-label', /Volume off/)

  await vol.click()
  await expect(vol).toHaveAttribute('aria-label', /Volume on/)
  expect(await page.evaluate(() => localStorage.getItem('mu-sound'))).toBe('on')

  await vol.click()
  await expect(vol).toHaveAttribute('aria-label', /Volume off/)
  expect(await page.evaluate(() => localStorage.getItem('mu-sound'))).toBe(
    'off',
  )
})

test('sound stays on after a full-load /cv round-trip', async ({ page }) => {
  // Reproduces the bug: landing on /cv via a full page load skipped the audio
  // sync, so returning to the terminal showed sound off despite the preference.
  await seedSound(page, 'on')
  await page.goto('/cv')
  await expect(page.locator('html')).toHaveAttribute('data-palette', 'hardcopy')

  await page.getByRole('button', { name: /BACK TO TRANSMIT/i }).click()
  await expect(page).toHaveURL(/\/transmit$/)

  const vol = page.getByRole('button', { name: /^Volume / })
  await expect(vol).toHaveAttribute('aria-label', /Volume on/)
})

test('palette button now cycles through hardcopy in place (no /cv nav)', async ({
  page,
}) => {
  await seedSound(page, 'off')
  await page.goto('/')
  await waitForHydration(page)

  const pal = page.getByRole('button', { name: /Change palette/ })
  await expect(pal).toHaveAttribute('aria-label', /Theme: green/)

  await pal.click()
  await expect(pal).toHaveAttribute('aria-label', /Theme: amber/)
  await pal.click()
  await expect(pal).toHaveAttribute('aria-label', /Theme: hardcopy/)

  // Restyle happened in place — still on the terminal, not the /cv route.
  await expect(page).toHaveURL(/\/$/)
  await expect(page.locator('html')).toHaveAttribute('data-palette', 'hardcopy')
})

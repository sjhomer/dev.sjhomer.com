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

/** The ship clock only ticks after client hydration — a reliable signal. */
async function waitForHydration(page: Page) {
  await expect(page.locator('.mu-clock')).not.toContainText('--:--:--')
}

test('each query route exposes a single top-level h1', async ({ page }) => {
  await seedSound(page, 'off')
  await page.goto('/dossier')
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
  await expect(
    page.getByRole('heading', { level: 1, name: /DOSSIER/ }),
  ).toBeVisible()
})

test('the printable CV route has an h1 for its name', async ({ page }) => {
  await seedSound(page, 'off')
  await page.goto('/cv')
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
})

test('the CV route shows only a back button, no console controls', async ({
  page,
}) => {
  await seedSound(page, 'off')
  await page.goto('/cv')
  // Client effect forces the hardcopy palette — a reliable "hydrated" signal.
  await expect(page.locator('html')).toHaveAttribute('data-palette', 'hardcopy')

  await expect(page.getByRole('button', { name: /^Theme:/ })).toHaveCount(0)
  await expect(page.getByRole('button', { name: /^CRT effects/ })).toHaveCount(
    0,
  )
  await expect(page.getByRole('button', { name: /^Volume / })).toHaveCount(0)

  const back = page.getByRole('button', { name: /BACK TO TRANSMIT/i })
  await expect(back).toBeVisible()
  await back.click()
  await expect(page).toHaveURL(/\/transmit$/)
})

test('a skip link targets the main landmark', async ({ page }) => {
  await seedSound(page, 'off')
  await page.goto('/')
  const skip = page.getByRole('link', { name: /skip to content/i })
  await expect(skip).toHaveAttribute('href', '#mu-main')
  await expect(page.locator('#mu-main')).toHaveAttribute('role', 'main')
})

test('command suggestions are keyboard-operable (Enter activates)', async ({
  page,
}) => {
  await seedSound(page, 'off')
  await page.goto('/')
  await waitForHydration(page)

  const input = page.getByRole('textbox', { name: /Query MOTHER/i })
  await input.click()
  await input.fill('DOS')

  const item = page.locator('.mu-suggest-item').first()
  await expect(item).toBeVisible()
  // Focus the button and activate with the keyboard — the regression was that
  // the item only responded to onMouseDown, never a keyboard Enter/Space.
  await item.focus()
  await page.keyboard.press('Enter')

  await expect(page).toHaveURL(/\/dossier$/)
})

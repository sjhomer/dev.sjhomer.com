import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

/** Seed a resolved sound preference so the first-visit gate is skipped. */
async function seedSound(page: Page, level: string) {
  await page.addInitScript((lvl) => {
    try {
      localStorage.setItem('mu-sound', lvl)
    } catch {
      /* ignore */
    }
  }, level)
}

/** The ship clock only ticks after client hydration — a reliable ready signal. */
async function waitForHydration(page: Page) {
  await expect(page.locator('.mu-clock')).not.toContainText('--:--:--')
}

const active = (page: Page) => page.locator('.mu-suggest-item[data-active]')

test('arrow keys walk the suggestion listing and mirror it into the input', async ({
  page,
}) => {
  await seedSound(page, 'off')
  await page.goto('/')
  await waitForHydration(page)

  const input = page.locator('.mu-prompt-input')
  await input.click() // focus → the command listing appears
  await expect(page.locator('.mu-suggest-panel')).toBeVisible()
  // Nothing is highlighted until the visitor steps into the listing.
  await expect(active(page)).toHaveCount(0)

  // First ArrowDown enters the listing at the top (DOSSIER) and mirrors it.
  await input.press('ArrowDown')
  await expect(active(page)).toHaveCount(1)
  await expect(active(page).locator('.mu-suggest-name')).toHaveText('DOSSIER')
  await expect(input).toHaveValue('DOSSIER')

  // Further ArrowDown advances the highlight.
  await input.press('ArrowDown')
  await expect(active(page).locator('.mu-suggest-name')).toHaveText(
    'SERVICE LOG',
  )
  await expect(input).toHaveValue('SERVICE LOG')

  // ArrowUp walks back...
  await input.press('ArrowUp')
  await expect(active(page).locator('.mu-suggest-name')).toHaveText('DOSSIER')

  // ...and ArrowUp past the top leaves the listing, restoring the (empty) query.
  await input.press('ArrowUp')
  await expect(active(page)).toHaveCount(0)
  await expect(input).toHaveValue('')
})

test('Enter runs the highlighted suggestion', async ({ page }) => {
  await seedSound(page, 'off')
  await page.goto('/')
  await waitForHydration(page)

  const input = page.locator('.mu-prompt-input')
  await input.click()
  await input.fill('MI') // filters to MISSIONS
  await input.press('ArrowDown')
  await expect(input).toHaveValue('MISSIONS')

  await input.press('Enter')
  await expect(page).toHaveURL(/\/missions$/)
})

test('Escape leaves the listing and restores the typed query', async ({
  page,
}) => {
  await seedSound(page, 'off')
  await page.goto('/')
  await waitForHydration(page)

  const input = page.locator('.mu-prompt-input')
  await input.click()
  await input.fill('MI')
  await input.press('ArrowDown')
  await expect(input).toHaveValue('MISSIONS')

  await input.press('Escape')
  await expect(input).toHaveValue('MI')
  await expect(active(page)).toHaveCount(0)
  // Still on the terminal — nothing was run.
  await expect(page).toHaveURL(/\/$/)
})

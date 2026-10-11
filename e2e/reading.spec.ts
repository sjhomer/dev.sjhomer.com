import { expect, test } from '@playwright/test'
import type { Locator } from '@playwright/test'

// Auto-scroll is motion, so seed sound off (skip the gate) and enable motion.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    try {
      localStorage.setItem('mu-sound', 'off')
    } catch {
      /* ignore */
    }
  })
  await page.emulateMedia({ reducedMotion: 'no-preference' })
})

const scrollTop = (out: Locator) => out.evaluate((el) => el.scrollTop)

test('a content page auto-scrolls, shows the badge, and pauses on user scroll', async ({
  page,
}) => {
  await page.goto('/dossier')
  const out = page.locator('#mu-main')

  // Wait until the content overflows the fold (there is something to scroll to).
  await expect
    .poll(() => out.evaluate((el) => el.scrollHeight - el.clientHeight > 4), {
      timeout: 10000,
    })
    .toBe(true)

  // After the start delay it eases downward on its own.
  const before = await scrollTop(out)
  await expect
    .poll(() => scrollTop(out), { timeout: 6000 })
    .toBeGreaterThan(before)

  // The AUTO-READ badge signals it is active.
  await expect(page.getByText('AUTO-READ')).toBeVisible()

  // A user scroll gesture pauses it permanently for this page.
  await out.dispatchEvent('wheel', { deltaY: 60 })
  await expect(page.getByText('AUTO-READ')).toBeHidden()
  const paused = await scrollTop(out)
  await page.waitForTimeout(1200)
  expect(await scrollTop(out)).toBe(paused)
})

test('navigating to a new page restarts auto-scroll', async ({ page }) => {
  await page.goto('/dossier')
  const out = page.locator('#mu-main')
  await out.dispatchEvent('wheel', { deltaY: 60 }) // pause on the first page
  await expect(page.getByText('AUTO-READ')).toBeHidden()

  await page
    .getByRole('link', { name: /Service log/i })
    .first()
    .click()
  await expect(page).toHaveURL(/\/log$/)

  // Fresh page → auto-scroll is active again.
  await expect(page.getByText('AUTO-READ')).toBeVisible({ timeout: 8000 })
})

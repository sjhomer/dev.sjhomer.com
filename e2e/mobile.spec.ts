import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

// Phone viewport for the whole file — the ≤640px media query drives the mobile
// layout (menu hidden, pager shown, datarows stacked).
test.use({ viewport: { width: 390, height: 844 } })

async function seedSound(page: Page, level: string) {
  await page.addInitScript((lvl) => {
    try {
      localStorage.setItem('mu-sound', lvl)
    } catch {
      /* ignore */
    }
  }, level)
}

async function waitForHydration(page: Page) {
  await expect(page.locator('.mu-clock')).not.toContainText('--:--:--')
}

test('landing pager points back to Transmit and forward to Dossier', async ({
  page,
}) => {
  await seedSound(page, 'off')
  await page.goto('/')
  await waitForHydration(page)

  const prev = page.getByRole('button', { name: /Previous page: TRANSMIT/i })
  const next = page.getByRole('button', { name: /Next page: DOSSIER/i })
  await expect(prev).toBeVisible()
  await expect(next).toBeVisible()
})

test('pager next/prev walk the page order', async ({ page }) => {
  await seedSound(page, 'off')
  await page.goto('/')
  await waitForHydration(page)

  await page.getByRole('button', { name: /Next page: DOSSIER/i }).click()
  await expect(page).toHaveURL(/\/dossier$/)

  await page.getByRole('button', { name: /Previous page: TRANSMIT/i }).click()
  await expect(page).toHaveURL(/\/transmit$/)
})

test('the numbered menu is hidden on mobile (pager replaces it)', async ({
  page,
}) => {
  await seedSound(page, 'off')
  await page.goto('/')
  await waitForHydration(page)
  await expect(page.locator('nav[aria-label="Queries"]')).toBeHidden()
})

test('Transmit does not scroll sideways on a phone', async ({ page }) => {
  await seedSound(page, 'off')
  await page.goto('/transmit')
  await waitForHydration(page)

  const out = page.locator('#mu-main')
  const overflow = await out.evaluate((el) => el.scrollWidth - el.clientWidth)
  expect(overflow).toBeLessThanOrEqual(0)
})

test('the text prompt is replaced by a tap-to-pick button on mobile', async ({
  page,
}) => {
  await seedSound(page, 'off')
  await page.goto('/')
  await waitForHydration(page)

  await expect(
    page.getByRole('textbox', { name: /Query MOTHER/i }),
  ).toBeHidden()
  await expect(
    page.getByRole('button', { name: /Select a command/i }),
  ).toBeVisible()
})

test('tapping the picker opens the list and a command navigates', async ({
  page,
}) => {
  await seedSound(page, 'off')
  await page.goto('/')
  await waitForHydration(page)

  await page.getByRole('button', { name: /Select a command/i }).click()
  const missions = page.locator('.mu-suggest-item', { hasText: 'MISSIONS' })
  await expect(missions).toBeVisible()
  await missions.click()
  await expect(page).toHaveURL(/\/missions$/)
})

test('the picker omits CV / ASK / DOWNLOAD and the log filters', async ({
  page,
}) => {
  await seedSound(page, 'off')
  await page.goto('/')
  await waitForHydration(page)

  await page.getByRole('button', { name: /Select a command/i }).click()
  await expect(
    page.locator('.mu-suggest-item[data-group="log"]:visible'),
  ).toHaveCount(0)
  const names = await page
    .locator('.mu-suggest-item:visible .mu-suggest-name')
    .allInnerTexts()
  expect(names).not.toContain('CV')
  expect(names).not.toContain('ASK')
  expect(names).not.toContain('DOWNLOAD')
})

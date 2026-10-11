import { expect, test } from '@playwright/test'

test('dossier landing renders with the terminal chrome', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /DOSSIER/ })).toBeVisible()
  await expect(page.getByText(/Head of Engineering/).first()).toBeVisible()
  // MU/TH/UR status strip + numbered menu
  await expect(page.getByText('MU/TH/UR 6000').first()).toBeVisible()
  await expect(
    page.getByRole('link', { name: /Missions/i }).first(),
  ).toBeVisible()
})

test('menu navigation reaches a query page with its own URL', async ({
  page,
}) => {
  await page.goto('/')
  await page
    .getByRole('link', { name: /Missions/i })
    .first()
    .click()
  await expect(page).toHaveURL(/\/missions$/)
  await expect(page.getByText(/Recovery GPT/).first()).toBeVisible()
})

test('works without JavaScript (SSR + progressive enhancement)', async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false })
  const page = await context.newPage()
  await page.goto('/')
  // Full dossier prose is in the server-rendered HTML
  await expect(
    page.getByText(/seasoned leader in digital solutions/).first(),
  ).toBeVisible()
  // Menu options are real links that work without JS
  await expect(
    page.getByRole('link', { name: /Transmit/i }).first(),
  ).toBeVisible()
  await context.close()
})

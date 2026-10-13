import { expect, test } from '@playwright/test'

// The first-load sound gate (client-only) would otherwise overlay these flows;
// seed a resolved preference so these tests stay focused on boot/navigation.
// (The no-JS test below makes its own context and needs no seed — the gate never
// runs without JavaScript.)
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    try {
      localStorage.setItem('mu-sound', 'off')
    } catch {
      /* ignore */
    }
  })
})

test('boot landing renders with banner, menu and prompt', async ({ page }) => {
  await page.goto('/')
  await expect(
    page.getByRole('heading', { name: /MU\/TH\/UR 6000/ }),
  ).toBeVisible()
  await expect(
    page.getByRole('link', { name: /Dossier/i }).first(),
  ).toBeVisible()
  await expect(
    page.getByRole('link', { name: /Missions/i }).first(),
  ).toBeVisible()
  await expect(
    page.getByRole('textbox', { name: /Query MOTHER/i }),
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
  // The mission log now leads with the portfolio case study.
  await expect(
    page.getByText(/MU\/TH\/UR 6000 Portfolio/).first(),
  ).toBeVisible()
})

test('a bare number key selects a menu page but Cmd/Ctrl+number does not', async ({
  page,
}) => {
  await page.goto('/')
  // The number-key handler binds after hydration (the ship clock ticking is a
  // reliable signal), and the input must be unfocused for the shortcut to fire.
  await expect(page.locator('.mu-clock')).not.toContainText('--:--:--')
  await page.locator('body').click({ position: { x: 2, y: 2 } })

  // A plain "3" jumps to the third query page (MISSIONS).
  await page.keyboard.press('3')
  await expect(page).toHaveURL(/\/missions$/)

  // Back home, the browser's own tab-switch chord (Cmd/Ctrl+number) must pass
  // through: the app does not hijack it, so the URL stays put.
  await page.goto('/')
  await expect(page.locator('.mu-clock')).not.toContainText('--:--:--')
  await page.locator('body').click({ position: { x: 2, y: 2 } })
  await page.keyboard.press('ControlOrMeta+1')
  await page.keyboard.press('Control+1')
  await page.keyboard.press('Meta+1')
  await expect(page).toHaveURL(/\/$/)
})

test('query pages work without JavaScript (SSR + progressive enhancement)', async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false })
  const page = await context.newPage()
  await page.goto('/dossier')
  await expect(
    page.getByText(/seasoned leader in digital solutions/).first(),
  ).toBeVisible()
  // Menu options are real links that work without JS
  await expect(
    page.getByRole('link', { name: /Transmit/i }).first(),
  ).toBeVisible()
  await context.close()
})

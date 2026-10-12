import { expect, test } from '@playwright/test'

test('design manual renders complete without JavaScript (SSR)', async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false })
  const page = await context.newPage()
  await page.goto('/guide')
  // Masthead + a real token value prove the full document is server-rendered.
  // (The title uses a non-breaking space, so match loosely.)
  await expect(page.getByText(/DESIGN\s+MANUAL/)).toBeVisible()
  await expect(page.getByText(/#4dff88/).first()).toBeVisible()
  await expect(page.getByText(/Palettes/i).first()).toBeVisible()
  await context.close()
})

test('design manual shows live component demos and inherits the palette', async ({
  page,
}) => {
  await page.goto('/guide')
  await expect(page.locator('html')).toHaveAttribute('data-palette', 'mother')
  // A live component from the gallery, and the methodology link back to /cv.
  await expect(page.getByText('UNAUTHORISED SUBSYSTEM')).toBeVisible()
  await expect(page.getByRole('link', { name: '/cv' })).toBeVisible()
})

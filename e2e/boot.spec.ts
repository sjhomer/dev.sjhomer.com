import { expect, test } from '@playwright/test'

test('boot banner renders on the index route', async ({ page }) => {
  await page.goto('/')
  await expect(
    page.getByRole('heading', { name: /MU\/TH\/UR 6000/i }),
  ).toBeVisible()
  await expect(page.getByText(/PERSONNEL FILE: HOMER, S\.J\./i)).toBeVisible()
})

test('serves full text without JavaScript (progressive enhancement)', async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false })
  const page = await context.newPage()
  await page.goto('/')
  await expect(
    page.getByText(/INTERFACE 2037 READY FOR INQUIRY/i),
  ).toBeVisible()
  await context.close()
})

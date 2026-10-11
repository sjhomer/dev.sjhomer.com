import { expect, test } from '@playwright/test'

// Seed a resolved sound preference so the first-load gate never overlays these
// flows. Audio itself is covered by unit tests; here we assert the visuals.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    try {
      localStorage.setItem('mu-sound', 'off')
    } catch {
      /* ignore */
    }
  })
  // The 937 morph is an animation, so these tests need motion enabled.
  await page.emulateMedia({ reducedMotion: 'no-preference' })
})

/** The ship clock only ticks once the client has hydrated — a reliable signal
 * that the prompt's React submit handler is attached (before it, Enter would do
 * a native form submit and reload the page). */
async function waitForHydration(
  page: import('@playwright/test').Page,
): Promise<void> {
  await expect(page.locator('.mu-clock')).not.toContainText('--:--:--')
}

async function runCommand(
  page: import('@playwright/test').Page,
  cmd: string,
): Promise<void> {
  const input = page.getByRole('textbox', { name: /Query MOTHER/i })
  await input.click()
  await input.fill(cmd)
  await expect(input).toHaveValue(cmd)
  await input.press('Enter')
}

test('SPECIAL ORDER 937 amends CREW EXPENDABLE to the officer label', async ({
  page,
}) => {
  await page.goto('/')
  await waitForHydration(page)
  await runCommand(page, 'SPECIAL ORDER 937')

  const egg = page.locator('.mu-egg')
  await expect(egg).toBeVisible()

  // "EXPENDABLE" exists only in the transient visible layer — the accessible
  // text is always the final amended label — so its appearance proves act one...
  await expect(egg).toContainText('EXPENDABLE', { timeout: 8000 })
  // ...and its removal proves the backspace-delete happened...
  await expect(egg).not.toContainText('EXPENDABLE', { timeout: 15000 })
  // ...leaving the amended label typed in its place.
  await expect(egg).toContainText(
    'CREW ESSENTIAL. AMENDED BY HEAD OF ENGINEERING',
  )
})

test('self-destruct arms a countdown and OVERRIDE aborts it', async ({
  page,
}) => {
  await page.goto('/')
  await waitForHydration(page)
  await runCommand(page, "WHAT'S THE STORY MOTHER")

  const egg = page.locator('.mu-egg')
  await expect(egg).toContainText('EMERGENCY DESTRUCT SEQUENCE ARMED', {
    timeout: 8000,
  })
  await expect(egg).toContainText('T-MINUS 00:')

  await runCommand(page, 'OVERRIDE')
  await expect(egg).toContainText('DESTRUCT SEQUENCE ABORTED', {
    timeout: 8000,
  })
  // The countdown box is gone once aborted.
  await expect(egg).not.toContainText('T-MINUS 00:')
})

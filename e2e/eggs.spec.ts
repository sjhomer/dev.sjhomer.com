import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

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
async function waitForHydration(page: Page): Promise<void> {
  await expect(page.locator('.mu-clock')).not.toContainText('--:--:--')
}

async function runCommand(page: Page, cmd: string): Promise<void> {
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

test('the egg view follows its typing output and rules separate eggs', async ({
  page,
}) => {
  // A short (but still desktop-width, so the text prompt stays) viewport, so
  // the egg output reliably overflows the fold.
  await page.setViewportSize({ width: 1280, height: 420 })
  await page.goto('/')
  await waitForHydration(page)

  const out = page.locator('#mu-main')
  await runCommand(page, 'SPECIAL ORDER 937')
  await expect(page.locator('.mu-egg')).toBeVisible()

  // The lines type in until the content grows past the fold...
  await expect
    .poll(() => out.evaluate((el) => el.scrollHeight - el.clientHeight > 4), {
      timeout: 10000,
    })
    .toBe(true)

  // ...and the view stays pinned to the bottom, keeping the active line visible.
  await expect
    .poll(
      () =>
        out.evaluate((el) => el.scrollHeight - el.clientHeight - el.scrollTop),
      { timeout: 10000 },
    )
    .toBeLessThanOrEqual(8)

  // A second egg appends beneath a stylised divider.
  await runCommand(page, 'JONESY')
  await expect(page.locator('.mu-egg-rule')).toHaveCount(1)
})

test('DEBUG prints a MOTHER self-diagnostic', async ({ page }) => {
  await page.goto('/')
  await waitForHydration(page)
  await runCommand(page, 'DEBUG')

  const egg = page.locator('.mu-egg')
  await expect(egg).toContainText('SELF-DIAGNOSTIC', { timeout: 8000 })
  await expect(egg).toContainText('WATCHING', { timeout: 10000 })
})

test('SOUND BOARD shows the pads, respects mute, and the menu becomes egg controls', async ({
  page,
}) => {
  await page.goto('/')
  await waitForHydration(page)
  await runCommand(page, 'SOUND BOARD')

  // The interactive pad grid appears.
  const board = page.getByRole('group', { name: /sound board/i })
  await expect(board).toBeVisible()
  const klaxon = board.getByRole('button', { name: /Danger klaxon/i })
  await expect(klaxon).toBeVisible()
  // Sound is seeded off (beforeEach), so the pads are disabled with a note.
  await expect(klaxon).toBeDisabled()
  await expect(page.locator('.mu-egg')).toContainText('Audio subsystem offline')

  // The desktop numbered menu has become the six egg controls...
  const eggNav = page.getByRole('navigation', { name: /easter eggs/i })
  await expect(eggNav).toBeVisible()
  const debugControl = eggNav.getByRole('button', { name: /Debug/i })
  await expect(debugControl).toBeVisible()

  // ...and activating one runs that egg.
  await debugControl.click()
  await expect(page.locator('.mu-egg')).toContainText('SELF-DIAGNOSTIC', {
    timeout: 8000,
  })
})

test('self-destruct arms a countdown; the abort control stands it down', async ({
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

  // The abort control escalates through re-confirmations before it stands down.
  const abort = page.locator('.mu-destruct-abort')
  await expect(abort).toHaveText('ABORT')
  await abort.click()
  await expect(abort).toHaveText(/ARE YOU SURE/)
  await abort.click()
  await expect(abort).toHaveText(/REALLY REALLY SURE/)
  await abort.click()
  await expect(abort).toHaveText(/LAST CHANCE/)
  await abort.click()

  // Stood down: the live countdown widget is cleared (no frozen timer, no abort
  // control) and the all-clear resolves into the log, like a detonation does.
  await expect(egg).toContainText('DETONATION PREVENTED')
  await expect(page.locator('.mu-destruct-abort')).toHaveCount(0)
  await expect(page.locator('.mu-countdown')).toHaveCount(0)
})

test('an aborted self-destruct stays in order when a later egg runs', async ({
  page,
}) => {
  await page.goto('/')
  await waitForHydration(page)
  await runCommand(page, "WHAT'S THE STORY MOTHER")

  const egg = page.locator('.mu-egg')
  await expect(egg).toContainText('EMERGENCY DESTRUCT SEQUENCE ARMED', {
    timeout: 8000,
  })
  const abort = page.locator('.mu-destruct-abort')
  for (let i = 0; i < 4; i++) await abort.click()
  await expect(egg).toContainText('DETONATION PREVENTED')

  // Run another egg afterwards.
  await runCommand(page, 'DEBUG')
  await expect(egg).toContainText('SELF-DIAGNOSTIC', { timeout: 8000 })

  // The aborted result must stay in chronological order (above the newer egg's
  // output), not pinned to the bottom of the egg view below it.
  const prevented = egg.getByText('DETONATION PREVENTED')
  const laterEgg = egg.getByText('SELF-DIAGNOSTIC').first()
  const py = (await prevented.boundingBox())!.y
  const ly = (await laterEgg.boundingBox())!.y
  expect(py).toBeLessThan(ly)
})

test('HELP lists the available queries, including the design manual', async ({
  page,
}) => {
  await page.goto('/')
  await waitForHydration(page)
  await runCommand(page, 'HELP')

  const egg = page.locator('.mu-egg')
  await expect(egg).toContainText('AVAILABLE QUERIES', { timeout: 8000 })
  await expect(egg).toContainText('GUIDE')
  await expect(egg).toContainText('SOME DIRECTIVES ARE CLASSIFIED')
})

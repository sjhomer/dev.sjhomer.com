/*
 * Build-time asset generation (Playwright):
 *   - the /cv resume as public/sjhomer-resume.pdf (print styles)
 *   - per-route Open Graph images (1200x630) under public/og/
 *
 * Self-contained: spawns `vite dev`, renders, writes, and shuts down.
 * Run with `pnpm generate:assets` whenever the content changes.
 */
import { spawn } from 'node:child_process'
import { mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { chromium } from '@playwright/test'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const PORT = 9372
const BASE = `http://localhost:${PORT}`

const OG_ROUTES = [
  { path: '/', name: 'default' },
  { path: '/dossier', name: 'dossier' },
  { path: '/log', name: 'log' },
  { path: '/missions', name: 'missions' },
  { path: '/systems', name: 'systems' },
  { path: '/quarters', name: 'quarters' },
  { path: '/transmit', name: 'transmit' },
]

function waitForServer(url, tries = 60) {
  return new Promise((res, rej) => {
    const tick = async (n) => {
      try {
        const r = await fetch(url)
        if (r.ok) return res()
      } catch {
        /* not up yet */
      }
      if (n <= 0) return rej(new Error('server did not start'))
      setTimeout(() => tick(n - 1), 500)
    }
    tick(tries)
  })
}

const server = spawn(
  'pnpm',
  ['exec', 'vite', 'dev', '--port', String(PORT), '--strictPort'],
  {
    cwd: root,
    stdio: 'ignore',
  },
)

try {
  await waitForServer(BASE + '/')
  await mkdir(resolve(root, 'public/og'), { recursive: true })

  const browser = await chromium.launch()

  // OG images: reduced motion so typed text renders in full, dark terminal look.
  const ogCtx = await browser.newContext({
    viewport: { width: 1200, height: 630 },
    reducedMotion: 'reduce',
    deviceScaleFactor: 1,
  })
  const ogPage = await ogCtx.newPage()
  for (const r of OG_ROUTES) {
    await ogPage.goto(BASE + r.path, { waitUntil: 'networkidle' })
    await ogPage.waitForTimeout(600)
    await ogPage.screenshot({ path: resolve(root, `public/og/${r.name}.png`) })
    console.log('og  ', r.name)
  }
  await ogCtx.close()

  // Resume PDF from /cv (print styles hide the console chrome).
  const pdfCtx = await browser.newContext({ reducedMotion: 'reduce' })
  const pdfPage = await pdfCtx.newPage()
  await pdfPage.goto(BASE + '/cv', { waitUntil: 'networkidle' })
  await pdfPage.waitForTimeout(600)
  await pdfPage.emulateMedia({ media: 'print' })
  await pdfPage.pdf({
    path: resolve(root, 'public/sjhomer-resume.pdf'),
    format: 'A4',
    printBackground: true,
    margin: { top: '14mm', bottom: '14mm', left: '14mm', right: '14mm' },
  })
  console.log('pdf  sjhomer-resume.pdf')
  await pdfCtx.close()

  await browser.close()
} finally {
  server.kill()
}

/*
 * Favicon rasters from the one SVG source (public/favicon.svg):
 *   - public/favicon.ico          16 + 32 px (PNG-in-ICO)
 *   - public/apple-touch-icon.png 180 px
 *   - public/icon-192.png         192 px (web manifest)
 *   - public/icon-512.png         512 px (web manifest)
 *
 * Rendered with Playwright's Chromium so the SVG filter (the phosphor bloom)
 * rasterises exactly as a browser draws it. No image library needed.
 * Run with `pnpm generate:favicon` whenever favicon.svg changes.
 */
import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { chromium } from '@playwright/test'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const svg = await readFile(resolve(root, 'public/favicon.svg'), 'utf8')

// CHROMIUM_PATH points at a system Chromium when Playwright's own download is
// unavailable (CI images, locked-down sandboxes); otherwise the bundled one.
const browser = await chromium.launch(
  process.env.CHROMIUM_PATH
    ? { executablePath: process.env.CHROMIUM_PATH }
    : {},
)
try {
  /** Rasterise the SVG at `size` px, square, with the void as the page ground. */
  async function render(size) {
    const page = await browser.newPage({
      viewport: { width: size, height: size },
      deviceScaleFactor: 1,
    })
    await page.setContent(
      `<!doctype html><html><head><style>
         html,body{margin:0;background:#020a04}
         svg{display:block;width:${size}px;height:${size}px}
       </style></head><body>${svg}</body></html>`,
    )
    const png = await page.screenshot({ type: 'png', omitBackground: false })
    await page.close()
    return png
  }

  /** Pack PNG images into an ICO container (PNG entries, as browsers expect). */
  function ico(entries) {
    const header = Buffer.alloc(6)
    header.writeUInt16LE(0, 0) // reserved
    header.writeUInt16LE(1, 2) // type: icon
    header.writeUInt16LE(entries.length, 4)
    const dir = Buffer.alloc(16 * entries.length)
    let offset = header.length + dir.length
    entries.forEach(({ size, png }, i) => {
      const o = i * 16
      dir.writeUInt8(size >= 256 ? 0 : size, o) // width (0 = 256)
      dir.writeUInt8(size >= 256 ? 0 : size, o + 1) // height
      dir.writeUInt8(0, o + 2) // palette
      dir.writeUInt8(0, o + 3) // reserved
      dir.writeUInt16LE(1, o + 4) // colour planes
      dir.writeUInt16LE(32, o + 6) // bits per pixel
      dir.writeUInt32LE(png.length, o + 8)
      dir.writeUInt32LE(offset, o + 12)
      offset += png.length
    })
    return Buffer.concat([header, dir, ...entries.map((e) => e.png)])
  }

  const [p16, p32, p180, p192, p512] = await Promise.all(
    [16, 32, 180, 192, 512].map(render),
  )

  await writeFile(
    resolve(root, 'public/favicon.ico'),
    ico([
      { size: 16, png: p16 },
      { size: 32, png: p32 },
    ]),
  )
  await writeFile(resolve(root, 'public/apple-touch-icon.png'), p180)
  await writeFile(resolve(root, 'public/icon-192.png'), p192)
  await writeFile(resolve(root, 'public/icon-512.png'), p512)
  console.log(
    'favicon.ico (16, 32), apple-touch-icon (180), icon-192, icon-512',
  )
} finally {
  await browser.close()
}

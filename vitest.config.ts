import { defineConfig } from 'vitest/config'
import viteReact from '@vitejs/plugin-react'

/*
 * Vitest runs with a lean plugin set (just React) rather than the full app
 * vite.config, which carries the Cloudflare and TanStack Start SSR plugins
 * that a jsdom unit run does not need. End-to-end coverage lives in Playwright.
 */
export default defineConfig({
  plugins: [viteReact()],
  resolve: {
    alias: {
      '#': new URL('./src/', import.meta.url).pathname,
      '@': new URL('./src/', import.meta.url).pathname,
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    css: false,
  },
})

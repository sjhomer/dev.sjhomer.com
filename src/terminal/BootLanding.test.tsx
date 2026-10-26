import { afterEach, describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import { renderToStaticMarkup } from 'react-dom/server'
import { BootLanding } from './BootLanding'

// jsdom ships no matchMedia, so each test installs a double that answers the
// media queries BootLanding asks: prefers-reduced-motion (so the bars fill
// instantly) and the phone-width query under test.
function mockMatchMedia(matches: (query: string) => boolean): void {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: vi.fn((query: string) => ({
      matches: matches(query),
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
}

afterEach(() => {
  // @ts-expect-error removing the per-test double
  delete window.matchMedia
})

// The cells track renders one █/░ glyph per cell, so its text length is the
// cell count.
function cellCounts(container: HTMLElement): number[] {
  return Array.from(container.querySelectorAll('.mu-progress-cells')).map(
    (el) => el.textContent.length,
  )
}

describe('BootLanding progress bars', () => {
  it('renders full 14-cell bars on desktop widths', () => {
    mockMatchMedia((q) => q.includes('prefers-reduced-motion'))
    const { container } = render(<BootLanding />)
    const counts = cellCounts(container)
    expect(counts).toHaveLength(3)
    expect(counts.every((c) => c === 14)).toBe(true)
  })

  it('renders shorter 10-cell bars on phone widths (25% shorter)', () => {
    mockMatchMedia(
      (q) =>
        q.includes('prefers-reduced-motion') || q.includes('max-width: 640px'),
    )
    const { container } = render(<BootLanding />)
    const counts = cellCounts(container)
    expect(counts).toHaveLength(3)
    expect(counts.every((c) => c === 10)).toBe(true)
  })

  // The app is SSR'd, so the *initial* render must not depend on matchMedia or
  // the server HTML (always 14) won't match client hydration on a phone. The
  // phone trim must come from an effect, after mount.
  it('server-renders 14-cell bars even on a phone (no hydration mismatch)', () => {
    mockMatchMedia(
      (q) =>
        q.includes('prefers-reduced-motion') || q.includes('max-width: 640px'),
    )
    const html = renderToStaticMarkup(<BootLanding />)
    // 3 bars at full value render one █ per cell; 3 × 14 = 42, never 3 × 10.
    const filled = (html.match(/█/g) ?? []).length
    expect(filled).toBe(42)
  })
})

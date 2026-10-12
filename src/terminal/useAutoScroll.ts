import { useEffect, useState } from 'react'
import type { RefObject } from 'react'

/** Honor the OS "reduce motion" setting; auto-scroll is motion the user opts out of. */
function reducedMotion(): boolean {
  try {
    if (
      typeof window === 'undefined' ||
      typeof window.matchMedia !== 'function'
    )
      return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}

export interface AutoScrollOptions {
  /** Whether auto-scroll should run for the current view (off for eggs / hardcopy). */
  active: boolean
  /** Changing this restarts auto-scroll from the top — pass the pathname. */
  resetKey: unknown
  /** Reading pace in pixels per second (gentle by default). */
  pxPerSec?: number
  /** Delay before the first move, so the top of the page settles. */
  startDelayMs?: number
}

const TICK_MS = 40 // ~25 steps/sec on a timer, decoupled from the typing rAF

/**
 * Reading-paced auto-scroll for a scroll container. Once there is content below
 * the fold it eases the viewport downward slowly enough to read, keeping pace as
 * more text types in below. The first real scroll gesture (wheel, touch, scroll
 * keys, or a scrollbar drag) pauses it permanently for the current `resetKey`;
 * changing `resetKey` (navigating to a new page) restarts it. It is off entirely
 * under "reduce motion", and reads layout on its own timer so it never couples to
 * the per-character typing animation. Returns whether it is actively moving, for
 * a UI indicator.
 */
export function useAutoScroll(
  ref: RefObject<HTMLElement | null>,
  opts: AutoScrollOptions,
): boolean {
  const { active, resetKey } = opts
  const pxPerSec = opts.pxPerSec ?? 26
  const startDelay = opts.startDelayMs ?? 1200
  const [scrolling, setScrolling] = useState(false)

  useEffect(() => {
    const current = ref.current
    if (!current || !active || reducedMotion()) {
      setScrolling(false)
      return undefined
    }
    // Non-null alias: TS keeps this declared type inside the timer closures.
    const el: HTMLElement = current

    let paused = false
    let acc = 0 // sub-pixel accumulator
    let expectedTop = el.scrollTop // our own programmatic position (scroll backstop)
    let interval: ReturnType<typeof setInterval> | null = null
    const startTimer: ReturnType<typeof setTimeout> = setTimeout(
      beginMotion,
      startDelay,
    )

    const hasOverflow = () => el.scrollHeight - el.clientHeight > 4
    const atBottom = () => el.scrollTop + el.clientHeight >= el.scrollHeight - 2

    function stopMotion(): void {
      if (interval) clearInterval(interval)
      interval = null
    }

    function pause(): void {
      if (paused) return
      paused = true
      stopMotion()
      setScrolling(false)
    }

    function tick(): void {
      if (paused) return
      if (!hasOverflow() || atBottom()) {
        // Nothing to read below yet (or all read). Idle without moving; if more
        // text types in below, a later tick resumes motion on its own.
        acc = 0
        setScrolling(false)
        return
      }
      acc += pxPerSec * (TICK_MS / 1000)
      const dy = Math.floor(acc)
      if (dy >= 1) {
        acc -= dy
        const max = el.scrollHeight - el.clientHeight
        expectedTop = Math.min(el.scrollTop + dy, max)
        el.scrollTop = expectedTop
        expectedTop = el.scrollTop // clamp to the actual applied value
      }
      setScrolling(true)
    }

    function beginMotion(): void {
      if (paused || interval) return
      interval = setInterval(tick, TICK_MS)
    }

    const onUser = () => pause()
    const onScroll = () => {
      // Before auto-read has begun moving, a scroll is environmental (the view
      // transition / reflow / the router restoring the previous offset), not a
      // user takeover — absorb it so it doesn't falsely pause a fresh view.
      // Once we're moving, a scroll we did not cause (scrollbar drag, etc.) is
      // the user taking over, so we stop.
      if (!interval) {
        expectedTop = el.scrollTop
        return
      }
      if (Math.abs(el.scrollTop - expectedTop) > 3) pause()
    }
    const SCROLL_KEYS = new Set([
      'ArrowUp',
      'ArrowDown',
      'PageUp',
      'PageDown',
      'Home',
      'End',
      ' ',
      'Spacebar',
    ])
    const onKey = (e: KeyboardEvent) => {
      if (!SCROLL_KEYS.has(e.key)) return
      const tag = (e.target as HTMLElement | null)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return // typing in the prompt
      pause()
    }

    el.addEventListener('wheel', onUser, { passive: true })
    el.addEventListener('touchmove', onUser, { passive: true })
    el.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('keydown', onKey)

    return () => {
      clearTimeout(startTimer)
      stopMotion()
      el.removeEventListener('wheel', onUser)
      el.removeEventListener('touchmove', onUser)
      el.removeEventListener('scroll', onScroll)
      window.removeEventListener('keydown', onKey)
      setScrolling(false)
    }
  }, [ref, active, resetKey, pxPerSec, startDelay])

  return scrolling
}

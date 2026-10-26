import * as React from 'react'
import { useEffect, useRef, useState } from 'react'
import {
  ProgressBar,
  Staged,
  Typewriter,
  TypingGain,
} from '../components/muthur'
import { KEY_GAIN } from './audio'
import { profile } from '../content'

function prefersReduced(): boolean {
  try {
    if (
      typeof window === 'undefined' ||
      typeof window.matchMedia !== 'function'
    )
      return true
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return true
  }
}

// The phone breakpoint used elsewhere in the console ("on phones", console.css).
const PHONE_QUERY = '(max-width: 640px)'

/**
 * True on phone-width viewports, kept in sync with the media query. Starts
 * false so the first render matches the server HTML (SSR has no window) — the
 * phone trim is applied in the effect after mount, avoiding a hydration
 * mismatch. Same reason prefersReduced()/reducedMotion() read matchMedia only
 * inside effects.
 */
function usePhone(): boolean {
  const [phone, setPhone] = useState(false)
  useEffect(() => {
    try {
      if (
        typeof window === 'undefined' ||
        typeof window.matchMedia !== 'function'
      )
        return undefined
      const mql = window.matchMedia(PHONE_QUERY)
      const onChange = () => setPhone(mql.matches)
      setPhone(mql.matches)
      mql.addEventListener('change', onChange)
      return () => mql.removeEventListener('change', onChange)
    } catch {
      return undefined
    }
  }, [])
  return phone
}

/**
 * A boot check bar that fills itself, then reports done so the next bar (or
 * line) can print. Marked as a Staged block so the sequencer waits for it.
 */
function BootBar({
  label,
  cells,
  onDone,
}: {
  label: string
  cells: number
  onDone?: () => void
}): React.ReactElement {
  const [v, setV] = useState(1)
  const doneRef = useRef(onDone)
  doneRef.current = onDone
  useEffect(() => {
    if (prefersReduced()) {
      setV(1)
      doneRef.current?.()
      return undefined
    }
    setV(0)
    const start = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 380)
      setV(t)
      if (t < 1) raf = requestAnimationFrame(tick)
      else doneRef.current?.()
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])
  // A shorter bar than the default 20 so the labelled checks don't run the full
  // width of the screen; the caller trims it further on phones (see BootLanding).
  return <ProgressBar label={label} value={v} cells={cells} />
}
;(BootBar as unknown as { __staged?: boolean }).__staged = true

export function BootLanding(): React.ReactElement {
  // The landing boot keeps the louder typing level; typing on every other view
  // runs at the quieter default carried by TypingGain.
  // Phones get ~25% shorter bars (10 cells vs 14) so the labelled checks fit the
  // narrow viewport.
  const cells = usePhone() ? 10 : 14
  return (
    <TypingGain.Provider value={KEY_GAIN}>
      <Staged className="mu-boot" gap={240}>
        <Typewriter
          text="INTERFACE 2037 READY FOR INQUIRY"
          tone="dim"
          cps={240}
        />
        <Typewriter
          as="h1"
          variant="display"
          text="DEV/SJHOMER/COM"
          className="mu-boot-banner"
        />
        <Staged className="mu-boot-bars" gap={0}>
          <BootBar label="CORE SYSTEMS" cells={cells} />
          <BootBar label="CREW MANIFEST" cells={cells} />
          <BootBar label="PERSONNEL FILE" cells={cells} />
        </Staged>
        <Typewriter
          text={`PERSONNEL FILE: HOMER, S.J.  CLEARANCE: ${profile.clearance}`}
          tone="caution"
          cps={60}
        />
        <Typewriter
          text="SELECT A QUERY BELOW, OR TYPE A COMMAND."
          tone="dim"
          cps={240}
        />
      </Staged>
    </TypingGain.Provider>
  )
}

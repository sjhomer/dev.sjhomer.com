import * as React from 'react'
import { useEffect, useRef, useState } from 'react'
import { ProgressBar, Staged, Typewriter } from '../components/muthur'
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

/**
 * A boot check bar that fills itself, then reports done so the next bar (or
 * line) can print. Marked as a Staged block so the sequencer waits for it.
 */
function BootBar({
  label,
  onDone,
}: {
  label: string
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
  // A shorter bar (14 cells, not the default 20) so the labelled checks don't
  // run the full width of the screen — especially tight on phones.
  return <ProgressBar label={label} value={v} cells={14} />
}
;(BootBar as unknown as { __staged?: boolean }).__staged = true

export function BootLanding(): React.ReactElement {
  return (
    <Staged className="mu-boot" gap={240}>
      <Typewriter
        text="INTERFACE 2037 READY FOR INQUIRY"
        tone="dim"
        cps={240}
      />
      <Typewriter
        as="h1"
        variant="display"
        text="MU/TH/UR 6000"
        className="mu-boot-banner"
      />
      <Staged className="mu-boot-bars" gap={0}>
        <BootBar label="CORE SYSTEMS" />
        <BootBar label="CREW MANIFEST" />
        <BootBar label="PERSONNEL FILE" />
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
  )
}

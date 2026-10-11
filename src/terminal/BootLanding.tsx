import * as React from 'react'
import { useEffect, useState } from 'react'
import { ProgressBar, Staged, Typewriter } from '../components/muthur'
import { profile } from '../content'

/** Boot check bars: full on SSR / no-JS, then re-fill on the client. */
function BootBars(): React.ReactElement {
  const [v, setV] = useState(1)
  useEffect(() => {
    let reduced = false
    try {
      reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    } catch {
      reduced = false
    }
    if (reduced) return undefined
    setV(0)
    const start = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 550)
      setV(t)
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])
  return (
    <div className="mu-boot-bars">
      <ProgressBar label="CORE SYSTEMS" value={v} />
      <ProgressBar label="CREW MANIFEST" value={v} />
      <ProgressBar label="PERSONNEL FILE" value={v} />
    </div>
  )
}

export function BootLanding(): React.ReactElement {
  return (
    <Staged className="mu-boot" gap={620}>
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
      <BootBars />
      <Typewriter
        text={`PERSONNEL FILE: HOMER, S.J.  CLEARANCE: ${profile.clearance}`}
        tone="caution"
        cps={60}
      />
      <Typewriter
        text="SELECT A QUERY BELOW, PRESS 1 TO 6, OR TYPE HELP."
        tone="dim"
        cps={240}
      />
      <Typewriter
        text="PRESS SPACE OR CLICK TO SKIP ANY TYPING."
        tone="dim"
        cps={240}
      />
    </Staged>
  )
}

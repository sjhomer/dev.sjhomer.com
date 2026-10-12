import * as React from 'react'
import { useEffect, useState } from 'react'
import { audio } from './audio'
import type { SoundLevel } from './audio'

/** Honour the OS reduced-motion setting (fail safe = reduced). */
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
 * An interactive pad grid for the SOUND BOARD easter egg: one cell per original
 * MU/TH/UR sound bit, each playing it through the shared audio manager. The
 * manager gates on the Volume toggle, so when sound is off the pads are disabled
 * and a note invites the visitor to enable it (the whole board stays silent,
 * consistent with the rest of the terminal).
 */

interface Pad {
  key: string
  label: string
  hint: string
  glyph: string
  play: () => void
}

/** Arm the player (idempotent, a no-op once loaded) then run the cue. */
function armed(fn: () => void): void {
  void audio.arm().then(fn)
}

const PADS: Array<Pad> = [
  {
    key: 'boot',
    label: 'Boot cue',
    hint: 'system online',
    glyph: '⏻',
    play: () => void audio.playBoot(),
  },
  {
    key: 'key',
    label: 'Key clack',
    hint: 'text render',
    glyph: '⌨',
    play: () =>
      armed(() => [0, 1, 2, 3].forEach((i) => setTimeout(audio.click, i * 70))),
  },
  {
    key: 'countdown',
    label: 'Countdown',
    hint: 'rising tick',
    glyph: '◴',
    play: () =>
      armed(() =>
        [0, 0.3, 0.6, 0.85, 1].forEach((r, i) =>
          setTimeout(() => audio.countdown(r), i * 170),
        ),
      ),
  },
  {
    key: 'allclear',
    label: 'All-clear',
    hint: 'safe resolve',
    glyph: '✓',
    play: () => armed(audio.allClear),
  },
  {
    key: 'warning',
    label: 'Danger klaxon',
    hint: 'order 937',
    glyph: '⚠',
    play: () => armed(audio.warning),
  },
]

export function SoundBoard({
  soundLevel,
}: {
  soundLevel: SoundLevel
}): React.ReactElement {
  const muted = soundLevel === 'off'
  // Reveal the pads one at a time, top to bottom, like the rest of the terminal
  // prints — rather than dropping the whole grid in at once. The board only
  // mounts after its title has typed (the parent gates it), so starting from
  // zero here gives a clean cascade with no flash of the full grid.
  const [shown, setShown] = useState(prefersReduced() ? PADS.length : 0)
  useEffect(() => {
    if (prefersReduced()) {
      setShown(PADS.length)
      return undefined
    }
    setShown(0)
    let i = 0
    const id = setInterval(() => {
      i += 1
      setShown(i)
      if (i >= PADS.length) clearInterval(id)
    }, 110)
    return () => clearInterval(id)
  }, [])
  return (
    <div className="mu-soundboard">
      <div
        className="mu-sb-grid"
        role="group"
        aria-label="MU/TH/UR sound board"
      >
        {PADS.slice(0, shown).map((p) => (
          <button
            key={p.key}
            type="button"
            className="mu-sb-pad"
            onClick={p.play}
            disabled={muted}
            aria-label={`Play ${p.label} — ${p.hint}`}
          >
            <span className="mu-sb-glyph" aria-hidden="true">
              {p.glyph}
            </span>
            <span className="mu-sb-label">{p.label}</span>
            <span className="mu-sb-hint">{p.hint}</span>
          </button>
        ))}
      </div>
      {muted ? (
        <p className="mu-sb-note" role="status">
          ⚠ Audio subsystem offline — set Volume to ON to play these bits.
        </p>
      ) : null}
    </div>
  )
}

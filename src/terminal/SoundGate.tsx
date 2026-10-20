import * as React from 'react'

export interface SoundGateProps {
  mode: 'choose' | 'resume'
  /** choose mode: visitor opts in (true) or bypasses (false). */
  onChoose?: (enable: boolean) => void
  /** resume mode: re-attempt audio after the browser blocked autoplay. */
  onResume?: () => void
  onDismissResume?: () => void
}

/**
 * The first-visit welcome gate. In `choose` mode it is a modal overlay that
 * halts the boot until the visitor enters: the single "ENTER TERMINAL" button
 * enters with audio enabled (the click doubles as the browser's autoplay-unlock
 * gesture), while Escape enters silently. Audio can be muted afterwards from the
 * Vol. knob. In `resume` mode it is a small one-click prompt shown to returning
 * visitors when the browser blocks an audible boot.
 */
export function SoundGate({
  mode,
  onChoose,
  onResume,
  onDismissResume,
}: SoundGateProps): React.ReactElement {
  const panelRef = React.useRef<HTMLDivElement>(null)

  // Modal keyboard contract for `choose` mode: Escape bypasses (silent), and
  // Tab is trapped within the dialog's controls so focus never reaches the
  // (also inert) terminal behind the overlay.
  React.useEffect(() => {
    if (mode !== 'choose') return undefined
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onChoose?.(false)
        return
      }
      if (e.key !== 'Tab') return
      const panel = panelRef.current
      if (!panel) return
      const els = Array.from(panel.querySelectorAll<HTMLElement>('button'))
      if (!els.length) return
      const first = els[0]
      const last = els[els.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey, true)
    return () => document.removeEventListener('keydown', onKey, true)
  }, [mode, onChoose])

  if (mode === 'resume') {
    return (
      <div className="mu-sound-resume" role="status">
        <button type="button" className="mu-toggle" onClick={onResume}>
          <span aria-hidden="true">⏉ </span>RESUME SOUND
        </button>
        <button
          type="button"
          className="mu-sound-resume-x"
          aria-label="Dismiss"
          onClick={onDismissResume}
        >
          ×
        </button>
      </div>
    )
  }

  return (
    <div
      className="mu-sound-gate"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mu-sound-gate-title"
    >
      <div className="mu-sound-gate-panel" ref={panelRef}>
        <p className="mu-sound-gate-kicker">DEV/SJHOMER/COM · WELCOME</p>
        <h2 id="mu-sound-gate-title" className="mu-sound-gate-title">
          WELCOME ABOARD, OPERATOR
        </h2>
        <p className="mu-sound-gate-body">
          Interface audio is <strong>enabled</strong> — boot tones and keystroke
          feedback for the full experience. You can mute it anytime from the{' '}
          <strong>Vol.</strong> knob in the top navigation.
        </p>
        <div className="mu-sound-gate-actions">
          <button
            type="button"
            className="mu-toggle mu-sound-gate-primary"
            onClick={() => onChoose?.(true)}
            autoFocus
          >
            ▸ ENTER TERMINAL
          </button>
        </div>
      </div>
    </div>
  )
}

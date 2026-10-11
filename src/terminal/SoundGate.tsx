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
 * The first-load audio gate. In `choose` mode it is a modal overlay that halts
 * the boot until the visitor opts in or out (the click doubles as the browser's
 * autoplay-unlock gesture). In `resume` mode it is a small one-click prompt
 * shown to returning visitors when the browser blocks an audible boot.
 */
export function SoundGate({
  mode,
  onChoose,
  onResume,
  onDismissResume,
}: SoundGateProps): React.ReactElement {
  if (mode === 'resume') {
    return (
      <div className="mu-sound-resume" role="status">
        <button type="button" className="mu-toggle" onClick={onResume}>
          ⏉ RESUME SOUND
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
      <div className="mu-sound-gate-panel">
        <p className="mu-sound-gate-kicker">MU/TH/UR 6000 · AUDIO SUBSYSTEM</p>
        <h2 id="mu-sound-gate-title" className="mu-sound-gate-title">
          ENABLE INTERFACE AUDIO?
        </h2>
        <p className="mu-sound-gate-body">
          This terminal can play its boot sequence and keystroke feedback.
          Engage the authentic experience, or continue in silence. You can
          change this anytime with the VOLUME control.
        </p>
        <div className="mu-sound-gate-actions">
          <button
            type="button"
            className="mu-toggle mu-sound-gate-primary"
            onClick={() => onChoose?.(true)}
            autoFocus
          >
            ▸ AUTHENTIC EXPERIENCE
          </button>
          <button
            type="button"
            className="mu-toggle"
            onClick={() => onChoose?.(false)}
          >
            BYPASS · SILENT
          </button>
        </div>
      </div>
    </div>
  )
}

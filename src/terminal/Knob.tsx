import * as React from 'react'

/**
 * An analog-style control knob for the console header. It is a real <button> —
 * clicking advances the setting exactly as the old text toggles did — dressed as
 * a rotary dial: N notches around the top arc and a pointer that rotates to the
 * active one. The pointer transition is disabled under reduced motion (CSS).
 *
 * - `positions` notches, `index` is the active one (0-based).
 * - `label` sits on the dial face (e.g. "Thm.", "CRT", "Vol.").
 * - `endLabels` names the two detents of an on/off knob (["off","on"]).
 * - `colorTab` renders a filled name tab that bleeds into the dial (palette).
 * - `on` lights the dial (phosphor glow) for an active/engaged setting.
 */
export interface KnobProps {
  label: string
  positions: number
  index: number
  ariaLabel: string
  onClick: () => void
  endLabels?: [string, string]
  colorTab?: string
  on?: boolean
}

/** Notch angles (degrees from vertical, clockwise) spread across a 100° arc. */
function notchAngles(n: number): Array<number> {
  const arc = 100
  if (n <= 1) return [0]
  return Array.from({ length: n }, (_, i) => -arc / 2 + (i * arc) / (n - 1))
}

function polar(angleDeg: number, r: number): [number, number] {
  const a = (angleDeg * Math.PI) / 180
  return [20 + r * Math.sin(a), 20 - r * Math.cos(a)]
}

export function Knob({
  label,
  positions,
  index,
  ariaLabel,
  onClick,
  endLabels,
  colorTab,
  on,
}: KnobProps): React.ReactElement {
  const angles = notchAngles(positions)
  const active = angles[Math.max(0, Math.min(index, angles.length - 1))]
  return (
    <button
      type="button"
      className="mu-knob"
      data-on={on ? 'true' : undefined}
      onClick={onClick}
      aria-label={ariaLabel}
      title={ariaLabel}
    >
      {colorTab ? <span className="mu-knob-tab">{colorTab}</span> : null}
      <span className="mu-knob-body">
        <span className="mu-knob-dial">
          <svg viewBox="0 0 40 40" aria-hidden="true" focusable="false">
            <circle className="mu-knob-face" cx="20" cy="20" r="16" />
            {angles.map((a, i) => {
              const [x1, y1] = polar(a, 16)
              const [x2, y2] = polar(a, 12.5)
              return (
                <line
                  key={i}
                  className="mu-knob-tick"
                  data-active={a === active ? 'true' : undefined}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                />
              )
            })}
            <g
              className="mu-knob-pointer"
              style={{ transform: `rotate(${active}deg)` }}
            >
              <line x1="20" y1="20" x2="20" y2="6.5" />
            </g>
            <circle className="mu-knob-hub" cx="20" cy="20" r="2.4" />
          </svg>
          <span className="mu-knob-label">{label}</span>
        </span>
        {endLabels ? (
          <span className="mu-knob-ends" aria-hidden="true">
            <span data-active={index === 0 ? 'true' : undefined}>
              {endLabels[0]}
            </span>
            <span data-active={index === positions - 1 ? 'true' : undefined}>
              {endLabels[1]}
            </span>
          </span>
        ) : null}
      </span>
    </button>
  )
}

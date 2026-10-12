import * as React from 'react'

/**
 * An analog-style control knob for the console header. It is a real <button> —
 * clicking advances the setting exactly as the old text toggles did — dressed as
 * a rotary dial: N notches around the top arc and a pointer that rotates to the
 * active one. The pointer transition is disabled under reduced motion (CSS).
 *
 * The dial is a pure gauge; the control `name` and current `value` are read as a
 * caption outside the dial (legibility), while the accessible name still carries
 * the full state. The SVG is decorative (aria-hidden); a binary knob exposes
 * `aria-pressed`.
 */
export interface KnobProps {
  name: string
  value: string
  positions: number
  index: number
  ariaLabel: string
  onClick: () => void
  on?: boolean
  /** Binary (on/off) knobs expose aria-pressed; the 3-way palette knob omits it. */
  pressed?: boolean
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

function KnobImpl({
  name,
  value,
  positions,
  index,
  ariaLabel,
  onClick,
  on,
  pressed,
}: KnobProps): React.ReactElement {
  const angles = notchAngles(positions)
  const active = angles[Math.max(0, Math.min(index, angles.length - 1))]
  return (
    <button
      type="button"
      className="mu-knob"
      data-on={on ? 'true' : undefined}
      aria-pressed={pressed}
      onClick={onClick}
      aria-label={ariaLabel}
      title={ariaLabel}
    >
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
      </span>
      <span className="mu-knob-cap">
        <span className="mu-knob-name">{name}</span>
        <span className="mu-knob-val">{value}</span>
      </span>
    </button>
  )
}

/** Memoized: the three header knobs re-render only when their own state flips,
 * not on every command-line keystroke (which re-renders the Console). */
export const Knob = React.memo(KnobImpl)

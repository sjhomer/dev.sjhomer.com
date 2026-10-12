import * as React from 'react'
import { useEffect, useRef, useState } from 'react'
import { audio } from '../../terminal/audio'
import './muthur.css'

/**
 * MU/TH/UR Interface — React 19 port of the design system's component bundle.
 * Behaviour matches the design-system contract (index.d.ts); the one change is
 * that typed text renders in full on the server and first paint (SSR / no-JS /
 * crawlers see everything) and the typing animation only enhances on the client.
 */

export type Tone = 'normal' | 'dim' | 'alert' | 'caution'
export interface Line {
  text: string
  tone?: Tone
  variant?: 'display'
  cps?: number
  pause?: number
  /**
   * When set, the line animates in two acts: it types `text`, the cursor hangs
   * for `hold` ms, then the text is backspace-deleted character by character and
   * `morphTo` is typed in its place (in `morphTone`). Used for the SPECIAL ORDER
   * 937 reveal, where "CREW EXPENDABLE." is deleted and amended to the officer's
   * alternate label.
   */
  morphTo?: string
  morphTone?: Tone
  hold?: number
}

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

function reducedMotion(): boolean {
  try {
    // No matchMedia (SSR, jsdom tests): treat as reduced so content shows in full.
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
 * Reads a cadence token from tokens.css, falling back to the documented default.
 * The token values are static, so the first successful read is memoised — this
 * keeps the typing hot path (every Typewriter mount / line completion) from
 * triggering a fresh getComputedStyle forced style-recalc each time.
 */
const cadenceCache = new Map<string, number>()
export function cadence(name: string, fallback: number): number {
  const cached = cadenceCache.get(name)
  if (cached !== undefined) return cached
  try {
    const v = getComputedStyle(document.documentElement)
      .getPropertyValue('--' + name)
      .trim()
    const n = parseFloat(v)
    const result = isNaN(n) ? fallback : n
    cadenceCache.set(name, result)
    return result
  } catch {
    return fallback
  }
}

/**
 * Reveals `total` characters over time. Full text is always in the DOM. Starts
 * fully revealed (so SSR and no-JS show everything), then re-animates on mount.
 */
export function useReveal(
  total: number,
  cps: number,
  delay: number,
  runKey: React.Key | undefined,
  onDone?: () => void,
): [number, () => void] {
  const instant = !isFinite(cps) || cps <= 0
  const [count, setCount] = useState(total)
  const doneRef = useRef(onDone)
  doneRef.current = onDone
  useEffect(() => {
    if (instant || reducedMotion()) {
      setCount(total)
      doneRef.current?.()
      return undefined
    }
    setCount(0)
    let raf = 0
    const start = performance.now() + (delay || 0)
    let finished = false
    let emitted = 0 // last count that emitted a key clack
    const tick = (now: number) => {
      const n = Math.floor((Math.max(0, now - start) * cps) / 1000)
      if (n >= total) {
        if (total > emitted) audio.click() // final character
        setCount(total)
        finished = true
        doneRef.current?.()
        return
      }
      if (n > emitted) {
        emitted = n
        audio.click() // one clack per revealed frame (manager throttles)
      }
      setCount(n)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      if (!finished) cancelAnimationFrame(raf)
    }
  }, [total, cps, delay, runKey, instant])
  return [
    count,
    () => {
      setCount(total)
      doneRef.current?.()
    },
  ]
}

export interface CursorProps {
  blink?: boolean
  tone?: Tone
  className?: string
}
export function Cursor(props: CursorProps): React.ReactElement {
  return (
    <span
      className={cx(
        'mu-cursor',
        props.blink === false && 'mu-cursor-still',
        props.tone && 'mu-tone-' + props.tone,
        props.className,
      )}
      aria-hidden="true"
    />
  )
}

export interface TypewriterProps {
  text: string
  cps?: number
  delay?: number
  tone?: Tone
  variant?: 'display'
  cursor?: boolean | 'always'
  as?: keyof React.JSX.IntrinsicElements
  onDone?: () => void
  runKey?: React.Key
  className?: string
}
export function Typewriter(props: TypewriterProps): React.ReactElement {
  const text = String(props.text)
  const [cps, setCps] = useState(props.cps ?? 90)
  useEffect(() => {
    if (props.cps == null) setCps(cadence('cps-prose', 90))
  }, [props.cps])
  const [count, skip] = useReveal(
    text.length,
    cps,
    props.delay || 0,
    props.runKey,
    props.onDone,
  )
  const typing = count < text.length
  const showCursor =
    props.cursor === 'always' || (props.cursor !== false && typing)
  const El = (props.as || 'p') as React.ElementType
  return (
    <El
      className={cx(
        'mu-type',
        props.variant === 'display' && 'mu-type-display',
        'mu-tone-' + (props.tone || 'normal'),
        props.className,
      )}
      onClick={typing ? skip : undefined}
    >
      <span className="mu-sr">{text}</span>
      <span aria-hidden="true">{text.slice(0, count)}</span>
      {showCursor ? <Cursor /> : null}
    </El>
  )
}

export interface MorphLineProps {
  text: string
  morphTo: string
  tone?: Tone
  morphTone?: Tone
  variant?: 'display'
  hold?: number
  runKey?: React.Key
  onDone?: () => void
}
/**
 * A two-act line: type `text`, hold, backspace-delete it, then type `morphTo`.
 * The accessible name is the final `morphTo` (the amended, true value); the
 * transient first act is visual only. Honors reduced motion by showing `morphTo`
 * at once. Emits key clacks through the shared audio manager (throttled there).
 */
export function MorphLine(props: MorphLineProps): React.ReactElement {
  const { text, morphTo } = props
  const TYPE_CPS = 30
  const DEL_CPS = 22
  const hold = props.hold ?? 2200
  const [shown, setShown] = useState(text)
  const [morphed, setMorphed] = useState(false)
  const [typing, setTyping] = useState(false)
  const doneRef = useRef(props.onDone)
  doneRef.current = props.onDone
  useEffect(() => {
    if (reducedMotion()) {
      setShown(morphTo)
      setMorphed(true)
      setTyping(false)
      doneRef.current?.()
      return undefined
    }
    let cancelled = false
    const timers: Array<ReturnType<typeof setTimeout>> = []
    const wait = (dms: number) =>
      new Promise<void>((r) => {
        timers.push(setTimeout(r, dms))
      })
    async function run(): Promise<void> {
      setTyping(true)
      setMorphed(false)
      setShown('')
      // The ominous klaxon rises as the damning verdict begins to appear, and
      // carries through the hang while the cursor rests on it.
      audio.warning()
      for (let i = 1; i <= text.length; i++) {
        if (cancelled) return
        setShown(text.slice(0, i))
        audio.click()
        await wait(1000 / TYPE_CPS)
      }
      await wait(hold) // cursor hangs at the end of "CREW EXPENDABLE."
      for (let i = text.length - 1; i >= 0; i--) {
        if (cancelled) return
        setShown(text.slice(0, i))
        audio.click()
        await wait(1000 / DEL_CPS)
      }
      setMorphed(true) // from here the line carries the amended tone
      for (let i = 1; i <= morphTo.length; i++) {
        if (cancelled) return
        setShown(morphTo.slice(0, i))
        audio.click()
        await wait(1000 / TYPE_CPS)
      }
      if (cancelled) return
      setTyping(false)
      // The verdict is amended to safety: the same pleasant all-clear the
      // self-destruct egg plays when it resolves without detonating.
      audio.allClear()
      doneRef.current?.()
    }
    void run()
    return () => {
      cancelled = true
      timers.forEach(clearTimeout)
    }
  }, [text, morphTo, hold, props.runKey])
  const tone = morphed ? props.morphTone : props.tone
  return (
    <p
      className={cx(
        'mu-type',
        props.variant === 'display' && 'mu-type-display',
        'mu-tone-' + (tone || 'normal'),
      )}
    >
      <span className="mu-sr">{morphTo}</span>
      <span aria-hidden="true">{shown}</span>
      {typing ? <Cursor /> : null}
    </p>
  )
}

export interface TypeSequenceProps {
  lines: Array<string | Line>
  cps?: number
  cursor?: boolean
  onDone?: () => void
  runKey?: React.Key
  className?: string
}
export function TypeSequence(props: TypeSequenceProps): React.ReactElement {
  const lines = props.lines
  const [idx, setIdx] = useState(0)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    setIdx(0)
  }, [props.runKey, lines.length])
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current)
    },
    [],
  )
  useEffect(() => {
    if (idx >= lines.length && lines.length && props.onDone) props.onDone()
  }, [idx, lines.length])
  return (
    <div className={cx('mu-seq', props.className)}>
      {lines.map((line, i) => {
        const l: Line = typeof line === 'string' ? { text: line } : line
        if (i > idx) return null
        const advance = () => {
          const pause = l.pause ?? cadence('pause-line', 120)
          if (timer.current) clearTimeout(timer.current)
          timer.current = setTimeout(
            () => setIdx((n) => (n === i ? n + 1 : n)),
            reducedMotion() ? 0 : pause,
          )
        }
        // A completed morph line rests on its amended final text/tone.
        if (i < idx)
          return l.morphTo != null ? (
            <Typewriter
              key={i}
              text={l.morphTo}
              tone={l.morphTone}
              variant={l.variant}
              cps={Infinity}
              cursor={false}
            />
          ) : (
            <Typewriter
              key={i}
              text={l.text}
              tone={l.tone}
              variant={l.variant}
              cps={Infinity}
              cursor={false}
            />
          )
        if (l.morphTo != null)
          return (
            <MorphLine
              key={i + '-' + String(props.runKey ?? 0)}
              text={l.text}
              morphTo={l.morphTo}
              tone={l.tone}
              morphTone={l.morphTone}
              variant={l.variant}
              hold={l.hold}
              runKey={props.runKey}
              onDone={advance}
            />
          )
        return (
          <Typewriter
            key={i + '-' + String(props.runKey ?? 0)}
            text={l.text}
            tone={l.tone}
            variant={l.variant}
            cps={l.cps ?? props.cps}
            cursor
            onDone={advance}
          />
        )
      })}
      {idx >= lines.length && props.cursor ? (
        <p className="mu-type">
          <Cursor />
        </p>
      ) : null}
    </div>
  )
}

export interface StagedProps {
  children: React.ReactNode
  /** Pause after a non-typing block before revealing the next (ms). */
  gap?: number
  className?: string
  /** Called once the whole sequence has printed (lets Staged nest and chain). */
  onDone?: () => void
}

type StagedMarker = { __staged?: boolean }

/** A block that reports its own completion: Typewriter, TypeSequence, or Staged. */
function isSequenced(
  child: React.ReactNode,
): child is React.ReactElement<{ onDone?: () => void }> {
  return (
    React.isValidElement(child) &&
    Boolean((child.type as unknown as StagedMarker).__staged)
  )
}

/**
 * Prints its children one block at a time, top to bottom, like a line printer:
 * a self-timing block (Typewriter / TypeSequence / nested Staged) must finish
 * before the next appears (so text never prints ahead); any other block is
 * followed by a short pause. Full on SSR / no-JS / reduced motion. On restart
 * (children change, e.g. a filter) it remounts so typed blocks replay.
 */
export function Staged(
  props: StagedProps & { runKey?: React.Key },
): React.ReactElement {
  const items = React.Children.toArray(props.children)
  const total = items.length
  const [n, setN] = useState(total)
  const [gen, setGen] = useState(0)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const started = useRef(false)
  const prevN = useRef(n)
  const doneRef = useRef(props.onDone)
  doneRef.current = props.onDone
  const gap = props.gap ?? 120

  const advance = () => setN((x) => Math.min(x + 1, total))

  // Start (or restart) the sequence; remount via `gen` so typed blocks replay.
  useEffect(() => {
    started.current = true
    setGen((g) => g + 1)
    setN(reducedMotion() ? total : total > 0 ? 1 : 0)
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [total, props.runKey])

  // A non-self-timing active block advances after `gap`.
  useEffect(() => {
    if (reducedMotion() || n <= 0 || n >= total) return undefined
    if (isSequenced(items[n - 1])) return undefined
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(advance, gap)
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [n, total, gap, gen])

  // Whether the final block self-times (Typewriter / TypeSequence / Staged). If
  // so the sequence isn't finished when that block merely *appears* — it must
  // finish printing — so completion is driven by its own onDone below, not by
  // the reveal. (Reporting done on reveal is what let sibling records, e.g. the
  // service-log roles, start printing before the previous one had finished.)
  const lastSelfTiming = total > 0 && isSequenced(items[total - 1])

  // Report completion when the sequence actually finishes, never on the initial
  // full render. For a non-self-timing final block that's when it is revealed
  // (n crosses to total); for a self-timing final block it's that block's own
  // onDone (wired below), so this effect stands down.
  useEffect(() => {
    const was = prevN.current
    prevN.current = n
    if (
      started.current &&
      total > 0 &&
      n >= total &&
      was < total &&
      !lastSelfTiming
    )
      doneRef.current?.()
  }, [n, total, lastSelfTiming])

  const shown = items.slice(0, n).map((child, i) => {
    if (i !== n - 1 || !isSequenced(child)) return child
    const prev = child.props.onDone
    const isFinal = i >= total - 1
    return React.cloneElement(child, {
      onDone: () => {
        prev?.()
        // The active block finished printing: advance to the next, or — if it
        // was the final block — report the whole sequence complete.
        if (isFinal) doneRef.current?.()
        else advance()
      },
    })
  })

  return (
    <div key={gen} className={props.className}>
      {shown}
    </div>
  )
}

;(Typewriter as unknown as StagedMarker).__staged = true
;(TypeSequence as unknown as StagedMarker).__staged = true
;(Staged as unknown as StagedMarker).__staged = true

export interface TagProps {
  tone?: Tone
  variant?: 'filled' | 'outline'
  children?: React.ReactNode
  className?: string
}
export function Tag(props: TagProps): React.ReactElement {
  const tone = props.tone || 'normal'
  return (
    <span
      className={cx(
        'mu-tag',
        tone !== 'normal' && 'mu-tag-' + tone,
        props.variant === 'outline' && 'mu-tag-outline',
        props.className,
      )}
    >
      {props.children}
    </span>
  )
}

export interface KeyCapProps {
  children?: React.ReactNode
  className?: string
}
export function KeyCap(props: KeyCapProps): React.ReactElement {
  return <kbd className={cx('mu-key', props.className)}>{props.children}</kbd>
}

export interface DividerProps {
  label?: string
  className?: string
}
export function Divider(props: DividerProps): React.ReactElement {
  return (
    <div
      className={cx('mu-rule', props.className)}
      role="separator"
      aria-label={props.label || undefined}
    >
      {props.label || null}
    </div>
  )
}

export interface DataRowProps {
  label: React.ReactNode
  value: React.ReactNode
  tone?: Tone
  className?: string
}
export function DataRow(props: DataRowProps): React.ReactElement {
  return (
    <div
      className={cx(
        'mu-datarow',
        'mu-tone-' + (props.tone || 'normal'),
        props.className,
      )}
    >
      <span className="mu-datarow-label">{props.label}</span>
      <span className="mu-datarow-lead" aria-hidden="true" />
      <span className="mu-datarow-value">{props.value}</span>
    </div>
  )
}

export interface MenuOptionProps {
  index: string
  label: string
  hint?: string
  href?: string
  onSelect?: (e: React.MouseEvent) => void
  active?: boolean
  className?: string
}
export function MenuOption(props: MenuOptionProps): React.ReactElement {
  const inner = (
    <>
      <span className="mu-option-index">{props.index}</span>
      <span className="mu-option-label">{props.label}</span>
      <span className="mu-option-hint">{props.hint}</span>
    </>
  )
  const common = {
    className: cx('mu-option', props.className),
    'aria-current': props.active ? ('true' as const) : undefined,
  }
  if (props.href)
    return (
      <a href={props.href} onClick={props.onSelect} {...common}>
        {inner}
      </a>
    )
  return (
    <button type="button" onClick={props.onSelect} {...common}>
      {inner}
    </button>
  )
}

export interface PromptProps {
  onSubmit?: (value: string) => void
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  label?: string
  prefix?: string
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>
  onFocus?: () => void
  onBlur?: () => void
  inputRef?: React.Ref<HTMLInputElement>
  autoFocus?: boolean
  className?: string
}
export function Prompt(props: PromptProps): React.ReactElement {
  const [own, setOwn] = useState('')
  const [focused, setFocused] = useState(false)
  const controlled = props.value != null
  const value = controlled ? props.value! : own
  // useId gives a stable id across SSR and hydration (Math.random did not).
  const id = React.useId()
  function change(e: React.ChangeEvent<HTMLInputElement>) {
    if (!controlled) setOwn(e.target.value)
    props.onChange?.(e.target.value)
  }
  function submit(e: React.FormEvent) {
    e.preventDefault()
    const v = value.trim()
    if (!v) return
    props.onSubmit?.(v.toUpperCase())
    if (!controlled) setOwn('')
  }
  return (
    <form className={cx('mu-prompt', props.className)} onSubmit={submit}>
      <label className="mu-sr" htmlFor={id}>
        {props.label || 'Command'}
      </label>
      <span className="mu-prompt-prefix" aria-hidden="true">
        {props.prefix || '>'}
      </span>
      <span className="mu-prompt-field">
        <span className="mu-prompt-mirror" aria-hidden="true">
          {value ? (
            <>
              {value}
              <Cursor />
            </>
          ) : focused ? (
            <Cursor />
          ) : props.placeholder ? (
            <span className="mu-prompt-placeholder">{props.placeholder}</span>
          ) : null}
        </span>
        <input
          id={id}
          className="mu-prompt-input"
          value={value}
          onChange={change}
          onKeyDown={props.onKeyDown}
          onFocus={() => {
            setFocused(true)
            props.onFocus?.()
          }}
          onBlur={() => {
            setFocused(false)
            props.onBlur?.()
          }}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          autoFocus={props.autoFocus}
          ref={props.inputRef}
        />
      </span>
    </form>
  )
}

export interface MetricProps {
  value: string
  label: string
  className?: string
}
export function Metric(props: MetricProps): React.ReactElement {
  return (
    <div className={cx('mu-metric', props.className)}>
      <span className="mu-metric-value">{props.value}</span>
      <span className="mu-metric-label">{props.label}</span>
    </div>
  )
}

export interface ProgressBarProps {
  value: number
  label?: string
  cells?: number
  className?: string
}
export function ProgressBar(props: ProgressBarProps): React.ReactElement {
  const cells = props.cells || 20
  const v = Math.max(0, Math.min(1, props.value || 0))
  const on = Math.round(v * cells)
  const pct = Math.round(v * 100)
  return (
    <div
      className={cx('mu-progress', props.className)}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      aria-label={props.label}
    >
      {props.label ? (
        <span className="mu-progress-label" aria-hidden="true">
          {props.label}
        </span>
      ) : null}
      <span className="mu-progress-cells" aria-hidden="true">
        {new Array(on + 1).join('█')}
        <span className="mu-progress-empty">
          {new Array(cells - on + 1).join('░')}
        </span>
      </span>
      <span className="mu-progress-pct" aria-hidden="true">
        {(pct < 10 ? '  ' : pct < 100 ? ' ' : '') + pct + '%'}
      </span>
    </div>
  )
}

export interface AlertProps {
  title: string
  level?: 'alert' | 'caution'
  children?: React.ReactNode
  className?: string
}
export function Alert(props: AlertProps): React.ReactElement {
  const level = props.level || 'alert'
  return (
    <div
      className={cx(
        'mu-alert',
        level === 'caution' && 'mu-alert-caution',
        props.className,
      )}
      role={level === 'alert' ? 'alert' : 'status'}
    >
      <p className="mu-alert-title">{props.title}</p>
      {props.children}
    </div>
  )
}

export interface Role {
  title: string
  company: string
  start: string
  end?: string | null
  remote?: boolean
  clearance?: 'COMMAND' | 'ACTIVE' | 'ARCHIVED'
  highlights?: Array<{ metric?: string; text: string }>
}
export interface LogEntryProps {
  role: Role
  className?: string
}
export function LogEntry(props: LogEntryProps): React.ReactElement {
  const r = props.role
  const dates = r.start + ' → ' + (r.end || 'PRESENT')
  return (
    <article className={cx('mu-log', props.className)}>
      <div className="mu-log-meta">
        <span>{dates}</span>
        {r.remote ? <span>REMOTE</span> : null}
        {r.clearance ? (
          <Tag
            tone={
              r.clearance === 'COMMAND'
                ? 'caution'
                : r.clearance === 'ARCHIVED'
                  ? 'dim'
                  : 'normal'
            }
          >
            {r.clearance}
          </Tag>
        ) : null}
      </div>
      <h3 className="mu-log-title">{r.title}</h3>
      <p className="mu-log-company">{r.company}</p>
      {r.highlights && r.highlights.length ? (
        <ul className="mu-log-list">
          {r.highlights.map((x, i) => (
            <li key={i} className="mu-log-item">
              {x.metric ? (
                <span className="mu-log-metric">{x.metric}</span>
              ) : (
                <span className="mu-log-bullet" aria-hidden="true">
                  ■
                </span>
              )}
              <span>{x.text}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  )
}

export interface ScreenProps {
  title?: string
  status?: string
  label?: string
  flicker?: boolean
  children?: React.ReactNode
  className?: string
}
export function Screen(props: ScreenProps): React.ReactElement {
  return (
    <section
      className={cx(
        'mu-screen',
        props.flicker !== false && 'mu-screen-flicker',
        props.className,
      )}
      aria-label={props.label || undefined}
    >
      {props.title || props.status ? (
        <header className="mu-screen-head">
          <span>{props.title}</span>
          <span>{props.status}</span>
        </header>
      ) : null}
      <div className="mu-screen-body">{props.children}</div>
    </section>
  )
}

import * as React from 'react'
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import {
  Alert,
  KeyCap,
  MenuOption,
  Prompt,
  TypeSequence,
} from '../components/muthur'
import type { Line } from '../components/muthur'
import { MENU, complete, resolvePath, suggest } from './queries'
import {
  askLines,
  helpLines,
  jonesyLines,
  rollLines,
  specialOrderLines,
} from './eggs'
import './console.css'

/** Query order for mobile swipe navigation. */
const SWIPE_ORDER = [
  '/dossier',
  '/log',
  '/missions',
  '/systems',
  '/quarters',
  '/transmit',
]

const PALETTES = ['mother', 'sevastopol', 'hardcopy'] as const
const PALETTE_NAMES: Record<string, string> = {
  mother: 'green',
  sevastopol: 'amber',
  hardcopy: 'hardcopy',
}

interface Block {
  id: number
  echo?: string
  lines: Array<Line>
}

function store(key: string, value?: string): string | null {
  try {
    if (value === undefined) return localStorage.getItem(key)
    localStorage.setItem(key, value)
    return value
  } catch {
    return null
  }
}

export function Console({
  children,
}: {
  children: React.ReactNode
}): React.ReactElement {
  const navigate = useNavigate()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const isHardcopy = pathname === '/cv'

  const [value, setValue] = useState('')
  const [log, setLog] = useState<Array<Block>>([])
  const [clock, setClock] = useState('--:--:--')
  const [shipDate, setShipDate] = useState('----.--.--')
  const [palette, setPalette] = useState('mother')
  const [fxOff, setFxOff] = useState(false)
  const [destruct, setDestruct] = useState<number | null>(null)
  const [focused, setFocused] = useState(false)
  const [cmdKey, setCmdKey] = useState('⌘ K')
  const [error, setError] = useState('')

  const nextId = useRef(1)
  const hist = useRef<Array<string>>([])
  const histPos = useRef(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const outRef = useRef<HTMLDivElement>(null)
  const touch = useRef<{ x: number; y: number } | null>(null)

  // Apply saved palette / effects imperatively (outside React, no hydration clash).
  useEffect(() => {
    const p = store('mu-palette') || 'mother'
    const fx = store('mu-fx') === 'off'
    applyPalette(p)
    applyFx(fx)
    setPalette(p)
    setFxOff(fx)
  }, [])

  // The hardcopy route forces the print palette; restore on leave.
  useEffect(() => {
    if (isHardcopy) {
      document.documentElement.dataset.palette = 'hardcopy'
    } else {
      document.documentElement.dataset.palette = palette
    }
  }, [isHardcopy, palette])

  // Ship clock + date (client only; rolls over at midnight).
  useEffect(() => {
    const pad = (n: number) => String(n).padStart(2, '0')
    const tick = () => {
      const d = new Date()
      setClock(
        [d.getHours(), d.getMinutes(), d.getSeconds()].map(pad).join(':'),
      )
      setShipDate(
        `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`,
      )
    }
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [])

  // Each query page starts scrolled to its top (no retained scroll, no jump).
  useEffect(() => {
    outRef.current?.scrollTo({ top: 0 })
  }, [pathname])

  // Self-destruct countdown.
  useEffect(() => {
    if (destruct == null) return undefined
    if (destruct <= 0) {
      delete document.body.dataset.alarm
      print(undefined, [
        {
          text: 'DETONATION SIMULATED. THIS IS A PORTFOLIO, NOT A STARSHIP.',
          tone: 'caution',
          cps: 60,
        },
        { text: 'TYPE DOSSIER TO CONTINUE.', tone: 'dim', cps: 240 },
      ])
      setDestruct(null)
      return undefined
    }
    const t = setTimeout(
      () => setDestruct((n) => (n == null ? null : n - 1)),
      1000,
    )
    return () => clearTimeout(t)
  }, [destruct])

  // Konami → Sevastopol; number keys select; Escape returns home.
  useEffect(() => {
    const konami = [
      'ArrowUp',
      'ArrowUp',
      'ArrowDown',
      'ArrowDown',
      'ArrowLeft',
      'ArrowRight',
      'ArrowLeft',
      'ArrowRight',
      'b',
      'a',
    ]
    let kpos = 0
    const onKey = (e: KeyboardEvent) => {
      kpos =
        e.key.toLowerCase() === konami[kpos].toLowerCase()
          ? kpos + 1
          : e.key === konami[0]
            ? 1
            : 0
      if (kpos === konami.length) {
        kpos = 0
        changePalette('sevastopol')
        print(undefined, [
          {
            text: 'PALETTE OVERRIDE ACCEPTED. WELCOME TO SEVASTOPOL STATION.',
            tone: 'caution',
          },
        ])
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
        return
      }
      const inPrompt = document.activeElement === inputRef.current
      if (!inPrompt && /^[1-6]$/.test(e.key)) {
        const q = MENU[Number(e.key) - 1]
        if (q.path) {
          e.preventDefault()
          navigate({ to: q.path })
        }
      }
      if (!inPrompt && e.key === 'Escape') navigate({ to: '/' })
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [navigate])

  // Label the focus shortcut for the platform.
  useEffect(() => {
    try {
      const mac = /Mac|iPhone|iPad/.test(
        navigator.platform || navigator.userAgent,
      )
      if (!mac) setCmdKey('Ctrl K')
    } catch {
      /* no navigator */
    }
  }, [])

  function applyPalette(p: string) {
    if (!isHardcopy) document.documentElement.dataset.palette = p
  }
  function applyFx(off: boolean) {
    if (off) document.documentElement.dataset.fx = 'off'
    else delete document.documentElement.dataset.fx
  }
  function changePalette(p: string) {
    setPalette(p)
    store('mu-palette', p)
    applyPalette(p)
  }
  function cyclePalette() {
    const order = PALETTES.filter((p) => p !== 'hardcopy')
    changePalette(
      order[
        (order.indexOf(palette as 'mother' | 'sevastopol') + 1) % order.length
      ],
    )
  }
  function toggleFx() {
    const off = !fxOff
    setFxOff(off)
    store('mu-fx', off ? 'off' : 'on')
    applyFx(off)
  }

  function print(echo: string | undefined, lines: Array<Line>) {
    setLog((b) => b.concat([{ id: nextId.current++, echo, lines }]).slice(-16))
  }

  /** Runs a command. Returns true when recognised (valid), false otherwise. */
  function run(raw: string): boolean {
    const cmd = raw.trim().toUpperCase().replace(/\s+/g, ' ')
    if (!cmd) return false
    hist.current.unshift(cmd)
    histPos.current = -1
    setError('')

    if (cmd === 'CLEAR') {
      setLog([])
      return true
    }

    const logm = /^(?:SERVICE )?LOG\s+(.+)$/.exec(cmd)
    if (logm) {
      navigate({ to: '/log', search: { f: logm[1] } })
      return true
    }

    if (cmd === 'DOWNLOAD') {
      window.open('/sjhomer-resume.pdf', '_blank', 'noopener')
      print(cmd, [
        { text: 'TRANSMITTING RESUME.PDF...', tone: 'dim', cps: 240 },
      ])
      return true
    }

    const path = resolvePath(cmd)
    if (path) {
      navigate({ to: path })
      return true
    }

    if (cmd === 'HELP' || cmd === 'MENU') {
      print(cmd, helpLines())
      return true
    }
    if (cmd === 'JONESY') {
      print(cmd, jonesyLines())
      return true
    }
    if (cmd.startsWith('ROLL')) {
      print(cmd, rollLines(cmd.slice(4).trim()))
      return true
    }
    if (cmd.startsWith('ASK')) {
      print(cmd, askLines(cmd.slice(3).trim()))
      return true
    }
    if (cmd === 'SPECIAL ORDER 937') {
      print(cmd, specialOrderLines())
      return true
    }
    if (cmd === "WHAT'S THE STORY MOTHER" || cmd === 'WHATS THE STORY MOTHER') {
      document.body.dataset.alarm = ''
      setDestruct(10)
      print(cmd, [
        {
          text: 'EMERGENCY DESTRUCT SEQUENCE ARMED. TYPE OVERRIDE TO ABORT.',
          tone: 'alert',
        },
      ])
      return true
    }
    if (cmd === 'OVERRIDE') {
      if (destruct != null) {
        delete document.body.dataset.alarm
        setDestruct(null)
        print(cmd, [
          {
            text: 'DESTRUCT SEQUENCE ABORTED. CREW ESSENTIAL.',
            tone: 'caution',
            cps: 60,
          },
        ])
      } else {
        print(cmd, [
          { text: 'NO SEQUENCE TO OVERRIDE.', tone: 'dim', cps: 240 },
        ])
      }
      return true
    }

    setError(`UNABLE TO COMPUTE. QUERY "${cmd}" NOT RECOGNISED — TYPE HELP.`)
    return false
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowUp' && hist.current.length) {
      e.preventDefault()
      histPos.current = Math.min(histPos.current + 1, hist.current.length - 1)
      setValue(hist.current[histPos.current])
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      histPos.current = Math.max(histPos.current - 1, -1)
      setValue(histPos.current < 0 ? '' : hist.current[histPos.current])
    } else if (e.key === 'Tab') {
      const m = complete(value)
      if (m) {
        e.preventDefault()
        setValue(m)
      }
    }
  }

  function onTouchStart(e: React.TouchEvent) {
    const t = e.touches[0]
    touch.current = { x: t.clientX, y: t.clientY }
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (!touch.current) return
    const t = e.changedTouches[0]
    const dx = t.clientX - touch.current.x
    const dy = t.clientY - touch.current.y
    touch.current = null
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return
    const idx = SWIPE_ORDER.indexOf(pathname)
    const len = SWIPE_ORDER.length
    let next: number
    if (idx === -1) next = dx < 0 ? 0 : len - 1
    else next = dx < 0 ? (idx + 1) % len : (idx - 1 + len) % len
    navigate({ to: SWIPE_ORDER[next] })
  }

  const suggestions = focused || value.trim() ? suggest(value) : []

  return (
    <section
      className={'mu-console' + (focused ? ' mu-console--focus' : '')}
      aria-label="MU/TH/UR terminal"
    >
      <div className="mu-console-strip">
        <div className="mu-console-id">
          <Link to="/" className="mu-console-home">
            MU/TH/UR 6000
          </Link>
          <span>Nostromo · {shipDate}</span>
          <span className="mu-clock">SHIP TIME {clock}</span>
        </div>
        <div className="mu-console-ctl">
          <button
            type="button"
            className="mu-toggle"
            onClick={cyclePalette}
            disabled={isHardcopy}
          >
            Palette: {PALETTE_NAMES[isHardcopy ? 'hardcopy' : palette]}
          </button>
          <button
            type="button"
            className="mu-toggle"
            aria-pressed={fxOff}
            onClick={toggleFx}
          >
            Effects {fxOff ? 'off' : 'on'}
          </button>
          <button
            type="button"
            className="mu-toggle"
            aria-pressed={isHardcopy}
            onClick={() => navigate({ to: isHardcopy ? '/' : '/cv' })}
          >
            {isHardcopy ? 'Terminal' : 'Plain CV'}
          </button>
        </div>
      </div>

      <div
        className="mu-screen mu-screen-flicker mu-console-screen"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div className="mu-screen-body mu-console-out" ref={outRef}>
          {children}

          {log.map((b) => (
            <div key={b.id} className="mu-console-block">
              {b.echo ? (
                <p className="mu-type mu-term-echo">&gt; {b.echo}</p>
              ) : null}
              <TypeSequence lines={b.lines} />
            </div>
          ))}

          {destruct != null ? (
            <Alert title="Emergency destruct">
              <p>THE OPTION TO OVERRIDE AUTOMATIC DESTRUCT EXPIRES IN</p>
              <p className="mu-countdown">
                T-MINUS 00:{String(Math.max(0, destruct)).padStart(2, '0')}
              </p>
              <p>TYPE OVERRIDE TO ABORT.</p>
            </Alert>
          ) : null}
        </div>

        {!isHardcopy ? (
          <div className="mu-console-dock">
            <div className="mu-dock-nav">
              <nav aria-label="Queries">
                <ul className="mu-menu">
                  {MENU.map((q) => (
                    <li key={q.name}>
                      <MenuOption
                        index={q.index!}
                        label={q.label}
                        hint={q.hint}
                        href={q.path}
                        active={pathname === q.path}
                        onSelect={(e) => {
                          e.preventDefault()
                          if (q.path) navigate({ to: q.path })
                        }}
                      />
                    </li>
                  ))}
                </ul>
              </nav>

              {suggestions.length ? (
                <div className="mu-suggest-panel" aria-label="Commands">
                  <p className="mu-suggest-head">COMMANDS — TYPE TO FILTER</p>
                  <ul className="mu-suggest">
                    {suggestions.map((q) => (
                      <li key={q.name}>
                        <button
                          type="button"
                          className="mu-suggest-item"
                          data-group={q.group}
                          onMouseDown={(e) => {
                            e.preventDefault()
                            run(q.name)
                            setValue('')
                            inputRef.current?.blur()
                          }}
                        >
                          <span className="mu-suggest-name">{q.name}</span>
                          <span className="mu-suggest-hint">{q.hint}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>

            <Prompt
              value={value}
              onChange={(v) => {
                setValue(v)
                if (error) setError('')
              }}
              onSubmit={(v) => {
                // Valid command (or selection): run, clear, and close the palette.
                // Invalid: keep focus open with the error showing.
                if (run(v)) {
                  setValue('')
                  inputRef.current?.blur()
                }
              }}
              onKeyDown={onKeyDown}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              inputRef={inputRef}
              placeholder="Type a query, or HELP"
              label="Query MOTHER"
            />
            {error ? (
              <p className="mu-prompt-error" role="alert">
                {error}
              </p>
            ) : null}
            <div className="mu-term-hints mu-hints-desktop" aria-hidden="true">
              <KeyCap>
                <span suppressHydrationWarning>{cmdKey}</span>
              </KeyCap>{' '}
              focus
              <KeyCap>1</KeyCap>–<KeyCap>6</KeyCap> select
              <KeyCap>Tab</KeyCap> complete
              <KeyCap>↑</KeyCap> history
              <KeyCap>Esc</KeyCap> home
            </div>
            <p className="mu-term-hints mu-hints-mobile" aria-hidden="true">
              <span className="mu-swipe">⇠ swipe ⇢</span> to move between
              queries · tap the line to type a command
            </p>
          </div>
        ) : null}
      </div>
    </section>
  )
}

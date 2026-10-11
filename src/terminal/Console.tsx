import * as React from 'react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useRouterState } from '@tanstack/react-router'
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

const BOOT: Array<Line> = [
  { text: 'INTERFACE 2037 READY FOR INQUIRY', tone: 'dim', cps: 240 },
  { text: '> MU/TH/UR 6000 .......... ONLINE', cps: 240 },
  { text: '> CREW MANIFEST ......... LOADED', cps: 240 },
  {
    text: '> PERSONNEL FILE: HOMER, S.J.  CLEARANCE: COMMAND',
    cps: 240,
    pause: 300,
  },
  { text: 'SELECT QUERY, OR TYPE A COMMAND.', tone: 'dim', cps: 240 },
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
  const [booted, setBooted] = useState(true) // SSR + first paint: no boot block
  const [clock, setClock] = useState('--:--:--')
  const [palette, setPalette] = useState('mother')
  const [fxOff, setFxOff] = useState(false)
  const [destruct, setDestruct] = useState<number | null>(null)

  const nextId = useRef(1)
  const hist = useRef<Array<string>>([])
  const histPos = useRef(-1)
  const inputRef = useRef<HTMLInputElement>(null)

  // Boot once per session, only when landing on the root.
  useEffect(() => {
    const seen = sessionStorage.getItem('mu-booted') === '1'
    if (!seen && pathname === '/') setBooted(false)
  }, [])

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

  // Ship clock (client only).
  useEffect(() => {
    const tick = () => {
      const d = new Date()
      setClock(
        [d.getHours(), d.getMinutes(), d.getSeconds()]
          .map((n) => String(n).padStart(2, '0'))
          .join(':'),
      )
    }
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [])

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

  function run(raw: string) {
    const cmd = raw.trim().toUpperCase().replace(/\s+/g, ' ')
    if (!cmd) return
    hist.current.unshift(cmd)
    histPos.current = -1

    if (cmd === 'CLEAR') {
      setLog([])
      return
    }

    const logm = /^(?:SERVICE )?LOG\s+(.+)$/.exec(cmd)
    if (logm) {
      navigate({ to: '/log', search: { f: logm[1] } })
      return
    }

    const path = resolvePath(cmd)
    if (path) {
      navigate({ to: path })
      return
    }

    if (cmd === 'HELP' || cmd === 'MENU') {
      print(cmd, helpLines())
      return
    }
    if (cmd === 'JONESY') {
      print(cmd, jonesyLines())
      return
    }
    if (cmd.startsWith('ROLL')) {
      print(cmd, rollLines(cmd.slice(4).trim()))
      return
    }
    if (cmd.startsWith('ASK')) {
      print(cmd, askLines(cmd.slice(3).trim()))
      return
    }
    if (cmd === 'SPECIAL ORDER 937') {
      print(cmd, specialOrderLines())
      return
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
      return
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
      return
    }

    print(cmd, [
      {
        text: `UNABLE TO COMPUTE. QUERY "${cmd}" NOT RECOGNISED.`,
        tone: 'alert',
      },
      { text: 'TYPE HELP FOR AVAILABLE QUERIES.', tone: 'dim', cps: 240 },
    ])
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

  const suggestions = value.trim() ? suggest(value) : []

  return (
    <section className="mu-console" aria-label="MU/TH/UR terminal">
      <div className="mu-console-strip">
        <div className="mu-console-id">
          <span>MU/TH/UR 6000</span>
          <span>Nostromo · 180924609</span>
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

      <div className="mu-screen mu-screen-flicker mu-console-screen">
        <div className="mu-screen-body mu-console-out">
          {!booted ? (
            <TypeSequence
              lines={BOOT}
              onDone={() => {
                try {
                  sessionStorage.setItem('mu-booted', '1')
                } catch {
                  /* private mode */
                }
                setBooted(true)
              }}
            />
          ) : null}

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
              <ul className="mu-suggest" aria-label="Suggestions">
                {suggestions.map((q) => (
                  <li key={q.name}>
                    <button
                      type="button"
                      className="mu-suggest-item"
                      onMouseDown={(e) => {
                        e.preventDefault()
                        run(q.name)
                        setValue('')
                      }}
                    >
                      <span>{q.name}</span>
                      <span className="mu-suggest-hint">{q.hint}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}

            <Prompt
              value={value}
              onChange={setValue}
              onSubmit={(v) => {
                run(v)
                setValue('')
              }}
              onKeyDown={onKeyDown}
              inputRef={inputRef}
              placeholder="Type a query, or HELP"
              label="Query MOTHER"
            />
            <div className="mu-term-hints" aria-hidden="true">
              <KeyCap>1</KeyCap>–<KeyCap>6</KeyCap> select
              <KeyCap>Tab</KeyCap> complete
              <KeyCap>↑</KeyCap> history
              <KeyCap>Esc</KeyCap> home
            </div>
          </div>
        ) : null}
      </div>
    </section>
  )
}

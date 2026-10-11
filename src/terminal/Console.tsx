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
import { MENU, complete, pageNav, resolvePath, suggest } from './queries'
import { askLines, jonesyLines, rollLines, specialOrderLines } from './eggs'
import { audio, autoplayLikely, nextLevel } from './audio'
import type { SoundLevel } from './audio'
import { SoundGate } from './SoundGate'
import './console.css'

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

/**
 * Ship clock + date. Isolated in its own component so its per-second state
 * update re-renders only these two spans, not the whole Console shell (menu,
 * prompt, suggestions). Values are placeholders until the client ticks.
 */
function ShipClock(): React.ReactElement {
  const [clock, setClock] = useState('--:--:--')
  const [shipDate, setShipDate] = useState('----.--.--')
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
  return (
    <>
      <span>Nostromo · {shipDate}</span>
      <span className="mu-clock">SHIP TIME {clock}</span>
    </>
  )
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
  const [palette, setPalette] = useState('mother')
  const [fxOff, setFxOff] = useState(false)
  const [soundLevel, setSoundLevel] = useState<SoundLevel>('off')
  const [showGate, setShowGate] = useState(false)
  const [showResume, setShowResume] = useState(false)
  const [bootKey, setBootKey] = useState(0)
  const [routeAnnounce, setRouteAnnounce] = useState('')
  const [destruct, setDestruct] = useState<number | null>(null)
  const [focused, setFocused] = useState(false)
  // Mobile: the prompt is a button that opens the command picker (no typing).
  const [pickerOpen, setPickerOpen] = useState(false)
  const [cmdKey, setCmdKey] = useState('⌘ K')
  const [error, setError] = useState('')
  const [eggMode, setEggMode] = useState(false)
  const [moreUp, setMoreUp] = useState(false)
  const [moreDown, setMoreDown] = useState(false)

  const nextId = useRef(1)
  const firstRoute = useRef(true)
  const hist = useRef<Array<string>>([])
  const histPos = useRef(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const outRef = useRef<HTMLDivElement>(null)

  // Apply saved palette / effects imperatively (outside React, no hydration clash).
  useEffect(() => {
    const p = store('mu-palette') || 'mother'
    const fx = store('mu-fx') === 'off'
    applyPalette(p)
    applyFx(fx)
    setPalette(p)
    setFxOff(fx)
  }, [])

  // Sound gate (client, once). First visit → the modal halts the boot until the
  // visitor opts in or out; the choice (the click) is the autoplay-unlock gesture.
  // Return visit with a remembered choice → no modal; if sound was on, try an
  // audible boot and fall back to a one-click resume prompt when the browser blocks it.
  useEffect(() => {
    if (window.location.pathname === '/cv') return // printable route: no audio
    const lvl = audio.getLevel()
    setSoundLevel(lvl)
    if (!audio.hasPreference()) {
      setShowGate(true)
    } else if (lvl !== 'off') {
      // Return visit with sound on: only reach for Howler when the browser's
      // autoplay policy says an audible start can succeed; otherwise skip the
      // load and offer a one-click resume. Where no policy API exists we stay
      // optimistic and let playBoot's playerror fallback catch a real block.
      if (autoplayLikely()) {
        audio
          .arm()
          .then(() => audio.playBoot({ onBlocked: () => setShowResume(true) }))
          .catch(() => setShowResume(true))
      } else {
        setShowResume(true)
      }
    }
  }, [])

  // The hardcopy route forces the print palette; restore on leave.
  useEffect(() => {
    if (isHardcopy) {
      document.documentElement.dataset.palette = 'hardcopy'
    } else {
      document.documentElement.dataset.palette = palette
    }
  }, [isHardcopy, palette])

  // Navigating anywhere exits easter-egg mode and reloads the static content
  // fresh (with its animations), scrolled to the top.
  useEffect(() => {
    setEggMode(false)
    setLog([])
    setDestruct(null)
    setPickerOpen(false)
    outRef.current?.scrollTo({ top: 0 })
    // Announce the new view to assistive tech (SPA nav is otherwise silent).
    // Skip the initial mount so first load isn't announced.
    if (firstRoute.current) {
      firstRoute.current = false
    } else {
      const name =
        pathname === '/'
          ? 'Terminal home'
          : pathname.slice(1).replace(/[-/]/g, ' ')
      setRouteAnnounce(name.toUpperCase() + ' LOADED')
    }
  }, [pathname])

  function resetTerminal() {
    setEggMode(false)
    setLog([])
    setDestruct(null)
    setError('')
  }

  // Indicate when there's more content above/below the fold (overlay scrollbars
  // can hide on macOS), throttled to one check per frame.
  useEffect(() => {
    const el = outRef.current
    if (!el) return undefined
    let scheduled = false
    const check = () => {
      setMoreUp(el.scrollTop > 4)
      setMoreDown(el.scrollTop + el.clientHeight < el.scrollHeight - 4)
    }
    const schedule = () => {
      if (scheduled) return
      scheduled = true
      requestAnimationFrame(() => {
        scheduled = false
        check()
      })
    }
    check()
    // Watch structural changes (blocks/lines mounting) but NOT characterData:
    // the typing animation mutates a text node every frame, and reading scroll
    // metrics in check() forces a layout reflow — doing that per character is
    // continuous thrash on the animation path. Line-by-line growth still fires
    // via childList, and scroll/resize cover the rest.
    const obs = new MutationObserver(schedule)
    obs.observe(el, { childList: true, subtree: true })
    el.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      obs.disconnect()
      el.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [])

  // Self-destruct countdown.
  useEffect(() => {
    if (destruct == null) return undefined
    if (destruct <= 0) {
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
    // Three options now: mother → sevastopol → hardcopy. Hardcopy restyles the
    // terminal in place (the printable /cv route is a separate command).
    const i = PALETTES.indexOf(palette as (typeof PALETTES)[number])
    changePalette(PALETTES[(i + 1) % PALETTES.length])
  }
  function toggleFx() {
    const off = !fxOff
    setFxOff(off)
    store('mu-fx', off ? 'off' : 'on')
    applyFx(off)
  }
  // --- Sound -----------------------------------------------------------------
  function chooseSound(enable: boolean) {
    const lvl: SoundLevel = enable ? 'full' : 'off'
    audio.setLevel(lvl)
    setSoundLevel(lvl)
    setShowGate(false)
    setBootKey((k) => k + 1) // replay the boot now the gate is resolved
    if (enable) void audio.arm().then(() => audio.playBoot())
  }
  function resumeSound() {
    setShowResume(false)
    void audio.arm().then(() => audio.playBoot())
  }
  function cycleVolume() {
    const lvl = nextLevel(soundLevel)
    setSoundLevel(lvl)
    audio.setLevel(lvl)
    if (lvl !== 'off') void audio.arm().then(() => audio.click()) // audible feedback
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
      resetTerminal()
      return true
    }

    const logm = /^(?:SERVICE )?LOG\s+(.+)$/.exec(cmd)
    if (logm) {
      navigate({ to: '/log', search: { f: logm[1] } })
      return true
    }

    if (cmd === 'DOWNLOAD') {
      window.open('/sjhomer-resume.pdf', '_blank', 'noopener')
      return true
    }

    const path = resolvePath(cmd)
    if (path) {
      navigate({ to: path })
      return true
    }

    // Easter eggs take over the terminal (clearing the static page); any combo
    // can run, and navigating or RESET TERMINAL restores the page.
    if (cmd === 'JONESY') {
      setEggMode(true)
      print(cmd, jonesyLines())
      return true
    }
    if (cmd.startsWith('ROLL')) {
      setEggMode(true)
      print(cmd, rollLines(cmd.slice(4).trim()))
      return true
    }
    if (cmd.startsWith('ASK')) {
      setEggMode(true)
      print(cmd, askLines(cmd.slice(3).trim()))
      return true
    }
    if (cmd === 'SPECIAL ORDER 937') {
      setEggMode(true)
      print(cmd, specialOrderLines())
      return true
    }
    if (cmd === "WHAT'S THE STORY MOTHER" || cmd === 'WHATS THE STORY MOTHER') {
      setEggMode(true)
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
      setEggMode(true)
      if (destruct != null) {
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

    setError(`UNABLE TO COMPUTE. QUERY "${cmd}" NOT RECOGNISED.`)
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

  // Show the command list when the desktop input is focused/filtering, or when
  // the mobile picker button has been tapped (mobile has no text input).
  const suggestions =
    focused || value.trim() || pickerOpen ? suggest(value) : []
  // Mobile pager targets (the numbered menu is hidden on phones). Landing sits
  // before the first page: prev → Transmit, next → Dossier.
  const pager = pageNav(pathname)

  return (
    <section
      className={'mu-console' + (focused ? ' mu-console--focus' : '')}
      aria-label="MU/TH/UR terminal"
    >
      <a className="mu-skip-link" href="#mu-main">
        Skip to content
      </a>
      <p className="mu-sr" role="status" aria-live="polite">
        {routeAnnounce}
      </p>
      <div className="mu-console-strip" inert={showGate}>
        <div className="mu-console-id">
          <Link to="/" className="mu-console-home">
            MU/TH/UR 6000
          </Link>
          <ShipClock />
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
          {isHardcopy ? (
            <button
              type="button"
              className="mu-toggle"
              onClick={() => navigate({ to: '/' })}
            >
              Terminal
            </button>
          ) : (
            <button type="button" className="mu-toggle" onClick={cycleVolume}>
              Volume: {soundLevel}
            </button>
          )}
        </div>
      </div>

      <div
        className="mu-screen mu-screen-flicker mu-console-screen"
        inert={showGate}
      >
        <div
          className={
            'mu-out-wrap' +
            (moreUp ? ' more-up' : '') +
            (moreDown ? ' more-down' : '')
          }
        >
          <div
            className="mu-screen-body mu-console-out"
            id="mu-main"
            role="main"
            tabIndex={-1}
            ref={outRef}
          >
            {eggMode ? (
              <div className="mu-egg">
                <button
                  type="button"
                  className="mu-reset"
                  onClick={resetTerminal}
                >
                  ↺ Reset terminal
                </button>
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
                    {/* aria-hidden: the per-second tick must not re-fire the
                        assertive role=alert announcement on every change. */}
                    <p className="mu-countdown" aria-hidden="true">
                      T-MINUS 00:
                      {String(Math.max(0, destruct)).padStart(2, '0')}
                    </p>
                    <p>TYPE OVERRIDE TO ABORT.</p>
                  </Alert>
                ) : null}
              </div>
            ) : (
              // Keyed so resolving the sound gate remounts and replays the boot.
              <React.Fragment key={bootKey}>{children}</React.Fragment>
            )}
          </div>
          <span className="mu-scroll-cue" aria-hidden="true">
            ▾ more below
          </span>
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
                  <p className="mu-suggest-head">
                    COMMANDS
                    <span className="mu-suggest-head-filter">
                      {' '}
                      — TYPE TO FILTER
                    </span>
                  </p>
                  <ul className="mu-suggest">
                    {suggestions.map((q) => (
                      <li key={q.name}>
                        <button
                          type="button"
                          className="mu-suggest-item"
                          data-group={q.group}
                          // preventDefault on mousedown keeps the input focused
                          // (so the panel doesn't close before activation);
                          // onClick fires for both pointer and keyboard
                          // (Enter/Space), so the item is keyboard-operable.
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            run(q.name)
                            setValue('')
                            setPickerOpen(false)
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
              placeholder="Type a query, or a command"
              label="Query MOTHER"
            />
            <button
              type="button"
              className="mu-prompt-mobile"
              onClick={() => setPickerOpen((o) => !o)}
              aria-expanded={pickerOpen}
            >
              <span className="mu-prompt-mobile-prefix" aria-hidden="true">
                &gt;
              </span>
              <span className="mu-prompt-mobile-label">
                Tap to Select a Command
              </span>
              <span className="mu-prompt-mobile-caret" aria-hidden="true">
                {pickerOpen ? '▴' : '▾'}
              </span>
            </button>
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
            <nav className="mu-pager" aria-label="Page navigation">
              <button
                type="button"
                className="mu-pager-btn mu-pager-prev"
                onClick={() => navigate({ to: pager.prev.path })}
                aria-label={`Previous page: ${pager.prev.name}`}
              >
                <span aria-hidden="true">◂ </span>
                {pager.prev.name}
              </button>
              <button
                type="button"
                className="mu-pager-btn mu-pager-next"
                onClick={() => navigate({ to: pager.next.path })}
                aria-label={`Next page: ${pager.next.name}`}
              >
                {pager.next.name}
                <span aria-hidden="true"> ▸</span>
              </button>
            </nav>
          </div>
        ) : null}
      </div>

      {showGate ? <SoundGate mode="choose" onChoose={chooseSound} /> : null}
      {showResume ? (
        <SoundGate
          mode="resume"
          onResume={resumeSound}
          onDismissResume={() => setShowResume(false)}
        />
      ) : null}
    </section>
  )
}

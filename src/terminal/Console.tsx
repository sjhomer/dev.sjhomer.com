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
import type { Suggestion } from './queries'
import {
  askLines,
  debugLines,
  helpLines,
  jonesyLines,
  rollDice,
  rollLines,
  specialOrderLines,
} from './eggs'
import { audio, autoplayLikely, nextLevel } from './audio'
import type { SoundLevel } from './audio'
import { useAutoScroll } from './useAutoScroll'
import { SoundBoard } from './SoundBoard'
import { SoundGate } from './SoundGate'
import { Knob } from './Knob'
import './console.css'

/**
 * The six easter-egg controls that replace the numbered query menu on desktop
 * once any egg is active, so the console turns into a little playground. Each
 * runs its command; `label`/`hint` are display only (note "Ask MOTHER" fronts
 * the self-destruct). Keep this at six to mirror the 1–6 menu it stands in for.
 */
const EGG_CONTROLS: Array<{ cmd: string; label: string; hint: string }> = [
  { cmd: 'SPECIAL ORDER 937', label: 'Special order 937', hint: 'eyes only' },
  {
    cmd: "WHAT'S THE STORY MOTHER",
    label: 'Ask MOTHER',
    hint: "what's the story?",
  },
  { cmd: 'DEBUG', label: 'Debug', hint: 'run diagnostics' },
  { cmd: 'JONESY', label: 'Jonesy', hint: "the ship's cat" },
  { cmd: 'SOUND BOARD', label: 'Sound board', hint: 'play the bits' },
  { cmd: 'ROLL D20', label: 'Roll D20', hint: 'roll the dice' },
]

const PALETTES = ['mother', 'sevastopol', 'hardcopy'] as const
/** Self-destruct starts here; the countdown tick rises in pitch toward zero. */
const DESTRUCT_FROM = 10
const PALETTE_NAMES: Record<string, string> = {
  mother: 'green',
  sevastopol: 'amber',
  hardcopy: 'hardcopy',
}
/** Short colour name shown on the palette knob's tab. */
const PALETTE_TAB: Record<string, string> = {
  mother: 'GREEN',
  sevastopol: 'AMBER',
  hardcopy: 'PAPER',
}

interface Block {
  id: number
  echo?: string
  lines: Array<Line>
  /** An interactive widget rendered after the lines (SOUND BOARD egg). */
  widget?: 'soundboard'
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

/** One row in the command palette. `data-group` drives the per-group styling. */
function SuggestItem({
  suggestion,
  onPick,
}: {
  suggestion: Suggestion
  onPick: (name: string) => void
}): React.ReactElement {
  return (
    <li>
      <button
        type="button"
        className="mu-suggest-item"
        data-group={suggestion.group}
        // preventDefault on mousedown keeps the input focused (so the panel
        // doesn't close before activation); onClick fires for both pointer and
        // keyboard (Enter/Space), so the item is keyboard-operable.
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => onPick(suggestion.name)}
      >
        <span className="mu-suggest-name">{suggestion.name}</span>
        <span className="mu-suggest-hint">{suggestion.hint}</span>
      </button>
    </li>
  )
}

export function Console({
  children,
}: {
  children: React.ReactNode
}): React.ReactElement {
  const navigate = useNavigate()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  // The search too, so changing a page's filter (e.g. /log?f=…, which re-runs
  // the typing animations) counts as a fresh view for auto-read. Serialized to
  // a stable string so the selector returns a primitive (no re-render churn).
  const searchStr = useRouterState({
    select: (s) => JSON.stringify(s.location.search),
  })
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
  // Egg blocks whose typed lines have finished printing, so a trailing widget
  // (the SOUND BOARD pad grid) holds off until its title has typed out.
  const [widgetReady, setWidgetReady] = useState<ReadonlySet<number>>(
    () => new Set(),
  )
  const markWidgetReady = (id: number) =>
    setWidgetReady((s) => (s.has(id) ? s : new Set(s).add(id)))

  const nextId = useRef(1)
  const firstRoute = useRef(true)
  const hist = useRef<Array<string>>([])
  const histPos = useRef(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const outRef = useRef<HTMLDivElement>(null)
  // Live mirrors for the once-bound global key handler (which must not re-bind
  // every render — that would reset the Konami progress each keystroke).
  const eggModeRef = useRef(eggMode)
  eggModeRef.current = eggMode
  const runRef = useRef<(raw: string) => boolean>(() => false)

  // Reveal the output once the client has mounted and the sections have
  // collapsed to begin their typing (see the pre-animation gate in styles.css).
  // Deferred two frames so the collapse has painted first — otherwise the full
  // server-rendered content would flash the instant it un-hides.
  useEffect(() => {
    let raf2 = 0
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        document.documentElement.classList.add('mu-ready')
      })
    })
    return () => {
      cancelAnimationFrame(raf1)
      cancelAnimationFrame(raf2)
    }
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

  // Sound gate (client, once). First visit → the modal halts the boot until the
  // visitor opts in or out; the choice (the click) is the autoplay-unlock gesture.
  // Return visit with a remembered choice → no modal; if sound was on, try an
  // audible boot and fall back to a one-click resume prompt when the browser blocks it.
  useEffect(() => {
    // Sync the Volume state with the persisted preference on ANY route — so a
    // full page load that lands on /cv (via the VIEW CV link) still knows sound
    // is on when the visitor returns to the terminal.
    const lvl = audio.getLevel()
    setSoundLevel(lvl)
    if (window.location.pathname === '/cv') return // no gate/boot on the printable route
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

  // Keep the player armed on sounded routes so key clacks survive a /cv
  // round-trip: a full load that lands on /cv skips the boot gate above, so the
  // player would otherwise stay null until a boot that never comes. arm() is
  // idempotent; we never replay the boot here.
  useEffect(() => {
    if (pathname === '/cv') return
    if (audio.getLevel() !== 'off') void audio.arm()
  }, [pathname])

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
    setWidgetReady(new Set())
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
    setWidgetReady(new Set())
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

  // Self-destruct countdown, with a rising tick each second and a pleasant
  // all-clear chime when the sequence resolves safely (it was never real).
  useEffect(() => {
    if (destruct == null) return undefined
    if (destruct <= 0) {
      audio.allClear()
      print(undefined, [
        {
          text: 'DETONATION SIMULATED. THIS IS A PORTFOLIO, NOT A STARSHIP.',
          tone: 'caution',
          cps: 60,
        },
      ])
      setDestruct(null)
      return undefined
    }
    // rise: 0 at the top of the count (DESTRUCT_FROM) → ~0.9 on the last tick.
    audio.countdown((DESTRUCT_FROM - destruct) / DESTRUCT_FROM)
    const t = setTimeout(
      () => setDestruct((n) => (n == null ? null : n - 1)),
      1000,
    )
    return () => clearTimeout(t)
  }, [destruct])

  // Easter-egg view follows its own output to the bottom (terminal-style) —
  // distinct from the reading-paced auto-scroll on the content routes, which is
  // suppressed in egg mode. Unlike the fold-cue observer above, this one DOES
  // watch characterData: egg lines type in character by character (no block
  // mounts, so `log`/`destruct` don't change), and the view must keep that
  // actively-typing line in sight as it grows and wraps. rAF-throttled, so the
  // layout read happens at most once per frame, not once per character.
  useEffect(() => {
    if (!eggMode) return undefined
    const el = outRef.current
    if (!el) return undefined
    let scheduled = false
    const toBottom = () => el.scrollTo({ top: el.scrollHeight })
    const schedule = () => {
      if (scheduled) return
      scheduled = true
      requestAnimationFrame(() => {
        scheduled = false
        toBottom()
      })
    }
    toBottom()
    const obs = new MutationObserver(schedule)
    obs.observe(el, { childList: true, subtree: true, characterData: true })
    return () => obs.disconnect()
  }, [eggMode])

  // Reset the scroll to the top when the view changes — not just on a route
  // change (handled above) but also when a page's filter changes (same route,
  // new ?search), which re-runs the typing. Declared before useAutoScroll so it
  // runs first on commit: a view that starts at the top means auto-read's scroll
  // backstop won't mistake the old offset being clamped for a user scroll.
  useEffect(() => {
    outRef.current?.scrollTo({ top: 0 })
  }, [pathname, searchStr])

  // Reading-paced auto-scroll on the content routes (not eggs, not the printable
  // /cv, not the browse-at-your-own-pace /guide). It restarts per view (route or
  // filter) and pauses on the first scroll.
  const autoScrolling = useAutoScroll(outRef, {
    active: !eggMode && !isHardcopy && pathname !== '/guide',
    resetKey: pathname + searchStr,
  })

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
        // In egg mode the 1–6 keys drive the egg controls that now stand in for
        // the numbered menu; otherwise they select the matching query page.
        if (eggModeRef.current) {
          e.preventDefault()
          runRef.current(EGG_CONTROLS[Number(e.key) - 1].cmd)
        } else {
          const q = MENU[Number(e.key) - 1]
          if (q.path) {
            e.preventDefault()
            navigate({ to: q.path })
          }
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
    const lvl: SoundLevel = enable ? 'on' : 'off'
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

  function print(
    echo: string | undefined,
    lines: Array<Line>,
    widget?: Block['widget'],
  ) {
    setLog((b) =>
      b.concat([{ id: nextId.current++, echo, lines, widget }]).slice(-16),
    )
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

    if (cmd === 'HELP') {
      setEggMode(true)
      print(cmd, helpLines())
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
      const roll = rollDice(cmd.slice(4).trim())
      // The reveal is near-instant (fast cps), so cue the sting now: a natural
      // 20 gets the pleasant all-clear, a natural 1 trips the danger klaxon.
      if (roll.sides === 20 && roll.value === 20) {
        void audio.arm().then(() => audio.allClear())
      } else if (roll.sides === 20 && roll.value === 1) {
        void audio.arm().then(() => audio.warning())
      }
      print(cmd, rollLines(roll))
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
    if (cmd === 'DEBUG') {
      setEggMode(true)
      print(cmd, debugLines())
      return true
    }
    if (cmd === 'SOUND BOARD' || cmd === 'SOUNDBOARD') {
      setEggMode(true)
      print(
        cmd,
        [
          // A display title like the other eggs (DEBUG, 937), then the dim hint.
          { text: 'SOUND BOARD', variant: 'display', cps: 30 },
          { text: 'TAP A CELL TO PLAY.', tone: 'dim', cps: 240 },
        ],
        'soundboard',
      )
      return true
    }
    if (cmd === "WHAT'S THE STORY MOTHER" || cmd === 'WHATS THE STORY MOTHER') {
      setEggMode(true)
      setDestruct(DESTRUCT_FROM)
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
        audio.allClear()
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
  // Keep the global key handler's view of run() current without re-binding it.
  runRef.current = run

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
  // Run a picked suggestion, then clear and close the palette. Shared by both
  // suggestion groups (commands + the restricted easter eggs).
  const pickSuggestion = (name: string) => {
    run(name)
    setValue('')
    setPickerOpen(false)
    inputRef.current?.blur()
  }
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
      {isHardcopy ? (
        // The printable CV drops the console chrome entirely — just a way back.
        <div className="mu-cv-bar">
          <button
            type="button"
            className="mu-toggle mu-cv-back"
            onClick={() => navigate({ to: '/transmit' })}
          >
            ◂ BACK TO TRANSMIT
          </button>
        </div>
      ) : (
        <div className="mu-console-strip" inert={showGate}>
          <div className="mu-console-id">
            <Link to="/" className="mu-console-home">
              MU/TH/UR 6000
            </Link>
            <ShipClock />
          </div>
          <div className="mu-console-ctl">
            <Knob
              label="Thm."
              positions={PALETTES.length}
              index={PALETTES.indexOf(palette as (typeof PALETTES)[number])}
              colorTab={PALETTE_TAB[palette]}
              on
              onClick={cyclePalette}
              ariaLabel={`Theme: ${PALETTE_NAMES[palette]}. Change palette.`}
            />
            <Knob
              label="CRT"
              positions={2}
              index={fxOff ? 0 : 1}
              endLabels={['off', 'on']}
              on={!fxOff}
              onClick={toggleFx}
              ariaLabel={`CRT effects ${fxOff ? 'off' : 'on'}. Toggle.`}
            />
            <Knob
              label="Vol."
              positions={2}
              index={soundLevel === 'on' ? 1 : 0}
              endLabels={['off', 'on']}
              on={soundLevel === 'on'}
              onClick={cycleVolume}
              ariaLabel={`Volume ${soundLevel}. Toggle.`}
            />
          </div>
        </div>
      )}

      <div
        className="mu-screen mu-screen-flicker mu-console-screen"
        inert={showGate}
      >
        <div
          className={
            'mu-out-wrap' +
            (moreUp ? ' more-up' : '') +
            (moreDown ? ' more-down' : '') +
            (autoScrolling ? ' auto-reading' : '')
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
                <div className="mu-egg-bar">
                  <button
                    type="button"
                    className="mu-reset"
                    onClick={resetTerminal}
                  >
                    ↺ Reset terminal
                  </button>
                  <p className="mu-egg-warn">
                    <span className="mu-egg-warn-dot" aria-hidden="true" />
                    Unauthorised subsystem — you have strayed from the crew
                    interface into restricted diagnostics. MOTHER sees this, and
                    MOTHER does not care for the curious.
                  </p>
                </div>
                {log.map((b, i) => (
                  <React.Fragment key={b.id}>
                    {/* A rule only between distinct eggs — i.e. before a block
                        that echoes a new command. Continuation blocks printed by
                        the same egg (no echo, e.g. the destruct DETONATION
                        follow-up) stay attached to it. */}
                    {i > 0 && b.echo ? (
                      <hr className="mu-egg-rule" aria-hidden="true" />
                    ) : null}
                    <div className="mu-console-block">
                      {b.echo ? (
                        <p className="mu-type mu-term-echo">&gt; {b.echo}</p>
                      ) : null}
                      <TypeSequence
                        lines={b.lines}
                        onDone={
                          b.widget ? () => markWidgetReady(b.id) : undefined
                        }
                      />
                      {/* The widget waits for the block's title/hint to finish
                          typing, then reveals itself (and cascades its pads). */}
                      {b.widget === 'soundboard' && widgetReady.has(b.id) ? (
                        <SoundBoard soundLevel={soundLevel} />
                      ) : null}
                    </div>
                  </React.Fragment>
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
          {autoScrolling ? (
            <span className="mu-autoread" aria-hidden="true">
              ▾ AUTO-READ
            </span>
          ) : null}
        </div>

        {!isHardcopy ? (
          <div className="mu-console-dock">
            <div className="mu-dock-nav">
              {eggMode ? (
                // Once an egg is active the numbered menu becomes an egg-control
                // panel of the six classified directives — set apart from the
                // sanctioned nav with a caution frame + a jittering header so it
                // reads as an off-book subsystem. Unlike the Queries menu this
                // one is kept visible on mobile too (handy for tapping eggs).
                <nav aria-label="Easter eggs" className="mu-egg-nav">
                  <p
                    className="mu-egg-nav-head"
                    data-text="◈ Restricted — eyes only"
                  >
                    ◈ Restricted — eyes only
                  </p>
                  <ul className="mu-menu mu-menu-eggs">
                    {EGG_CONTROLS.map((egg, i) => (
                      <li key={egg.cmd}>
                        <MenuOption
                          index={String(i + 1)}
                          label={egg.label}
                          hint={egg.hint}
                          onSelect={(e) => {
                            e.preventDefault()
                            run(egg.cmd)
                            inputRef.current?.blur()
                          }}
                        />
                      </li>
                    ))}
                  </ul>
                </nav>
              ) : (
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
              )}

              {suggestions.length ? (
                <div className="mu-suggest-panel" aria-label="Commands">
                  {suggestions.some((q) => q.group !== 'easter') ? (
                    <>
                      <p className="mu-suggest-head">
                        COMMANDS
                        <span className="mu-suggest-head-filter">
                          {' '}
                          — TYPE TO FILTER
                        </span>
                      </p>
                      <ul className="mu-suggest">
                        {suggestions
                          .filter((q) => q.group !== 'easter')
                          .map((q) => (
                            <SuggestItem
                              key={q.name}
                              suggestion={q}
                              onPick={pickSuggestion}
                            />
                          ))}
                      </ul>
                    </>
                  ) : null}
                  {/* The easter eggs get their own group so they read as the
                      off-book, classified transmissions they are — set apart in
                      caution amber under a RESTRICTED heading. */}
                  {suggestions.some((q) => q.group === 'easter') ? (
                    <>
                      <p className="mu-suggest-head mu-suggest-head-easter">
                        ◈ Restricted — eyes only
                      </p>
                      <ul className="mu-suggest">
                        {suggestions
                          .filter((q) => q.group === 'easter')
                          .map((q) => (
                            <SuggestItem
                              key={q.name}
                              suggestion={q}
                              onPick={pickSuggestion}
                            />
                          ))}
                      </ul>
                    </>
                  ) : null}
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
            {/* The mobile prev/next pager is suppressed in egg mode: the egg
                controls take that row instead, and Reset terminal / the command
                input are enough to get back to a page. */}
            {!eggMode ? (
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
            ) : null}
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

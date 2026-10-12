/*
 * MU/TH/UR audio manager — a thin, testable layer over one Howler sprite.
 *
 * All original SFX live in a single file (public/audio/mu-sfx.wav) described by
 * sfx-sprite.json. Howler is loaded lazily (dynamic import) the first time the
 * visitor arms sound, so it never touches the SSR / first-paint path.
 *
 * The manager is built from injectable deps (clock, storage, player loader) so
 * its gating/throttle/persistence logic is unit-testable under jsdom without
 * real Web Audio. The browser singleton `audio` wires the real deps.
 */
import spriteData from './sfx-sprite.json'

export type SoundLevel = 'off' | 'on'
export const SOUND_LEVELS = ['off', 'on'] as const

const KEYS = ['key1', 'key2', 'key3'] as const
const CLICK_THROTTLE_MS = 40
const STORE_KEY = 'mu-sound'

/**
 * Per-sprite gain for the typing clacks, relative to the base level. The boot
 * cue and the "system online" chime play at the full level; the per-character
 * text-rendering clack is deliberately softer so continuous typing stays gentle.
 */
export const KEY_GAIN = 0.5

/** Level → Howler volume (0..1). 'on' is deliberately gentle (full was too loud). */
export function levelToVolume(level: SoundLevel): number {
  return level === 'on' ? 0.35 : 0
}

/** The volume button toggles off ↔ on. */
export function nextLevel(level: SoundLevel): SoundLevel {
  const i = SOUND_LEVELS.indexOf(level)
  return SOUND_LEVELS[(i + 1) % SOUND_LEVELS.length]
}

/**
 * Normalise a stored value, migrating the retired 'low'/'full' levels to 'on'.
 * Returns null when nothing valid is stored (i.e. no preference recorded yet).
 */
function normalizeLevel(v: unknown): SoundLevel | null {
  if (v === 'off') return 'off'
  if (v === 'on' || v === 'low' || v === 'full') return 'on'
  return null
}

/** The slice of Howl's surface we depend on (keeps howler types off the edges). */
export interface Player {
  play: (sprite?: string) => number
  stop: () => void
  /** Group volume, or a single sound's volume when an id is given. */
  volume: (v: number, id?: number) => void
  /** Playback rate for a single sound (pitch + speed), given its id. */
  rate: (r: number, id?: number) => void
  once: (event: string, fn: () => void) => void
  off: (event: string, fn?: () => void) => void
}

export interface AudioDeps {
  now: () => number
  read: () => string | null
  write: (v: string) => void
  loadPlayer: () => Promise<Player>
}

export interface BootHandlers {
  onPlaying?: () => void
  onBlocked?: () => void
}

export interface AudioManager {
  /** True once the visitor has made an explicit sound choice (persisted). */
  hasPreference: () => boolean
  getLevel: () => SoundLevel
  setLevel: (level: SoundLevel) => void
  /** Lazily load + unlock the player (idempotent). Call on a user gesture. */
  arm: () => Promise<void>
  /** Play the boot cue if audible; handlers report autoplay success/block. */
  playBoot: (handlers?: BootHandlers) => Promise<boolean>
  /** Play a throttled key clack if armed + audible. Safe to call anytime. */
  click: () => void
  /**
   * Play one self-destruct countdown tick if armed + audible. `rise` in [0,1]
   * (0 at the top of the count, →1 near zero) raises the pitch as it climbs.
   */
  countdown: (rise: number) => void
  /** Play the pleasant all-clear chime if armed + audible (safe resolution). */
  allClear: () => void
  /** Play the tense danger klaxon if armed + audible (the 937 "expendable" beat). */
  warning: () => void
}

export function createAudioManager(deps: AudioDeps): AudioManager {
  const stored = normalizeLevel(deps.read())
  let level: SoundLevel = stored ?? 'off'
  let preference = stored !== null
  let player: Player | null = null
  let loading: Promise<Player> | null = null
  let lastClick = -Infinity

  async function arm(): Promise<void> {
    if (player) return
    if (!loading) loading = deps.loadPlayer()
    player = await loading
    player.volume(levelToVolume(level))
  }

  return {
    hasPreference: () => preference,
    getLevel: () => level,
    setLevel(l: SoundLevel) {
      level = l
      preference = true
      deps.write(l)
      if (player) player.volume(levelToVolume(l))
    },
    arm,
    async playBoot(handlers?: BootHandlers): Promise<boolean> {
      if (level === 'off') return false
      await arm()
      if (!player) return false
      // Wire play/playerror as a mutually-cancelling pair: exactly one fires,
      // and its handler drops the other so no listener lingers on the
      // long-lived Howl singleton across repeated boots.
      if (handlers && (handlers.onBlocked || handlers.onPlaying)) {
        const p = player
        function onErr(): void {
          p.off('play', onPlay)
          handlers?.onBlocked?.()
        }
        function onPlay(): void {
          p.off('playerror', onErr)
          handlers?.onPlaying?.()
        }
        p.once('playerror', onErr)
        p.once('play', onPlay)
      }
      player.play('boot')
      return true
    },
    click() {
      if (!player || level === 'off') return
      const t = deps.now()
      if (t - lastClick < CLICK_THROTTLE_MS) return
      lastClick = t
      const id = player.play(KEYS[Math.floor(Math.random() * KEYS.length)])
      // Turn this clack's own sound id down so typing stays soft while the boot
      // cue and chime keep the full level.
      player.volume(levelToVolume(level) * KEY_GAIN, id)
    },
    countdown(rise: number) {
      if (!player || level === 'off') return
      const id = player.play('countdown')
      player.volume(levelToVolume(level), id)
      // rise 0→1 maps to playback rate 1.0→1.9, so the pitch climbs toward zero.
      const r = 1 + Math.max(0, Math.min(1, rise)) * 0.9
      player.rate(r, id)
    },
    allClear() {
      if (!player || level === 'off') return
      const id = player.play('allclear')
      player.volume(levelToVolume(level), id)
    },
    warning() {
      if (!player || level === 'off') return
      const id = player.play('warning')
      player.volume(levelToVolume(level), id)
    },
  }
}

// ---- Browser singleton ------------------------------------------------------

const hasWindow = typeof window !== 'undefined'

async function defaultLoadPlayer(): Promise<Player> {
  const { Howl } = await import('howler')
  const howl = new Howl({
    src: [spriteData.src],
    sprite: spriteData.sprite as unknown as Record<string, [number, number]>,
    volume: 0,
    preload: true,
  })
  return howl
}

export const audio: AudioManager = createAudioManager({
  now: () =>
    hasWindow && typeof performance !== 'undefined'
      ? performance.now()
      : Date.now(),
  read: () => {
    try {
      return hasWindow ? localStorage.getItem(STORE_KEY) : null
    } catch {
      return null
    }
  },
  write: (v: string) => {
    try {
      if (hasWindow) localStorage.setItem(STORE_KEY, v)
    } catch {
      /* storage unavailable (private mode) — session-only is fine */
    }
  },
  loadPlayer: defaultLoadPlayer,
})

/**
 * Autoplay feasibility hint for return visits: may we attempt an *audible* boot?
 * Where the browser exposes getAutoplayPolicy we trust it (only 'allowed' means
 * audible media may start). Where it doesn't, we stay optimistic and attempt —
 * the playBoot `onBlocked` (playerror) fallback still catches a real block.
 */
export function autoplayLikely(): boolean {
  try {
    const nav = navigator as Navigator & {
      getAutoplayPolicy?: (type: string) => string
    }
    if (typeof nav.getAutoplayPolicy === 'function') {
      return nav.getAutoplayPolicy('mediaelement') === 'allowed'
    }
  } catch {
    /* API unavailable — fall through to the optimistic default */
  }
  return true
}

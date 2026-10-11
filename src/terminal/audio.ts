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

export type SoundLevel = 'off' | 'low' | 'full'
export const SOUND_LEVELS = ['off', 'low', 'full'] as const

const KEYS = ['key1', 'key2', 'key3'] as const
const CLICK_THROTTLE_MS = 40
const STORE_KEY = 'mu-sound'

/** Level → Howler volume (0..1). */
export function levelToVolume(level: SoundLevel): number {
  if (level === 'full') return 1
  if (level === 'low') return 0.35
  return 0
}

/** The volume button cycles off → low → full → off. */
export function nextLevel(level: SoundLevel): SoundLevel {
  const i = SOUND_LEVELS.indexOf(level)
  return SOUND_LEVELS[(i + 1) % SOUND_LEVELS.length]
}

function isLevel(v: unknown): v is SoundLevel {
  return v === 'off' || v === 'low' || v === 'full'
}

/** The slice of Howl's surface we depend on (keeps howler types off the edges). */
export interface Player {
  play: (sprite?: string) => number
  stop: () => void
  volume: (v: number) => void
  once: (event: string, fn: () => void) => void
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
}

export function createAudioManager(deps: AudioDeps): AudioManager {
  const initial = deps.read()
  let level: SoundLevel = isLevel(initial) ? initial : 'off'
  let preference = isLevel(initial)
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
      if (handlers?.onBlocked) player.once('playerror', handlers.onBlocked)
      if (handlers?.onPlaying) player.once('play', handlers.onPlaying)
      player.play('boot')
      return true
    },
    click() {
      if (!player || level === 'off') return
      const t = deps.now()
      if (t - lastClick < CLICK_THROTTLE_MS) return
      lastClick = t
      player.play(KEYS[Math.floor(Math.random() * KEYS.length)])
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
 * Autoplay feasibility hint for return visits. Uses getAutoplayPolicy where the
 * browser supports it; 'unknown' elsewhere (caller still relies on playerror).
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
    /* not supported */
  }
  return false
}

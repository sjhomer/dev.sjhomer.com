import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  autoplayLikely,
  createAudioManager,
  KEY_GAIN,
  levelToVolume,
  nextLevel,
} from './audio'
import type { Player } from './audio'

function fakePlayer() {
  const handlers: Record<string, Array<() => void> | undefined> = {}
  return {
    play: vi.fn<(sprite?: string) => number>(() => 1),
    stop: vi.fn(),
    volume: vi.fn(),
    rate: vi.fn(),
    once: vi.fn((event: string, fn: () => void) => {
      ;(handlers[event] ??= []).push(fn)
    }),
    off: vi.fn((event: string, fn?: () => void) => {
      if (!handlers[event]) return
      handlers[event] = fn ? handlers[event].filter((h) => h !== fn) : []
    }),
    /** Fire every listener registered for an event (test helper). */
    fire: (event: string) => (handlers[event] ?? []).forEach((h) => h()),
    /** How many listeners are still attached for an event (test helper). */
    pending: (event: string) => (handlers[event] ?? []).length,
  } satisfies Player & {
    play: ReturnType<typeof vi.fn>
    fire: (event: string) => void
    pending: (event: string) => number
  }
}

function setup(opts: { stored?: string | null; nowSeq?: Array<number> } = {}) {
  let stored: string | null = opts.stored ?? null
  const player = fakePlayer()
  const nowSeq = opts.nowSeq ?? [0]
  let i = 0
  const mgr = createAudioManager({
    now: () => nowSeq[Math.min(i++, nowSeq.length - 1)],
    read: () => stored,
    write: (v: string) => {
      stored = v
    },
    loadPlayer: async () => player,
  })
  return { mgr, player, getStored: () => stored }
}

describe('levelToVolume', () => {
  it('maps off to silence and on to a gentle level', () => {
    expect(levelToVolume('off')).toBe(0)
    expect(levelToVolume('on')).toBeCloseTo(0.35)
  })
})

describe('nextLevel', () => {
  it('toggles off <-> on', () => {
    expect(nextLevel('off')).toBe('on')
    expect(nextLevel('on')).toBe('off')
  })
})

describe('audio manager', () => {
  let m: ReturnType<typeof setup>
  beforeEach(() => {
    m = setup()
  })

  it('reports no stored preference until a level is set', () => {
    expect(m.mgr.hasPreference()).toBe(false)
    expect(m.mgr.getLevel()).toBe('off')
  })

  it('persists a chosen level', () => {
    m.mgr.setLevel('on')
    expect(m.getStored()).toBe('on')
    expect(m.mgr.hasPreference()).toBe(true)
    expect(m.mgr.getLevel()).toBe('on')
  })

  it('reads a stored level on construction', () => {
    const s = setup({ stored: 'on' })
    expect(s.mgr.hasPreference()).toBe(true)
    expect(s.mgr.getLevel()).toBe('on')
  })

  it('migrates the retired low/full levels to on', () => {
    expect(setup({ stored: 'low' }).mgr.getLevel()).toBe('on')
    const full = setup({ stored: 'full' })
    expect(full.mgr.getLevel()).toBe('on')
    expect(full.mgr.hasPreference()).toBe(true)
  })

  it('applies volume to the player once armed and level changes', async () => {
    await m.mgr.arm()
    m.mgr.setLevel('on')
    expect(m.player.volume).toHaveBeenCalledWith(0.35)
  })

  it('does not play key clacks while muted', async () => {
    await m.mgr.arm()
    m.mgr.setLevel('off')
    m.mgr.click()
    expect(m.player.play).not.toHaveBeenCalled()
  })

  it('plays a key clack when armed and audible', async () => {
    const s = setup({ nowSeq: [0] })
    await s.mgr.arm()
    s.mgr.setLevel('on')
    s.mgr.click()
    expect(s.player.play).toHaveBeenCalledTimes(1)
    const sprite = s.player.play.mock.calls[0][0]
    expect(['key1', 'key2', 'key3']).toContain(sprite)
  })

  it('plays the typing clack softer than the base level (per-sprite gain)', async () => {
    const s = setup({ nowSeq: [0] })
    await s.mgr.arm()
    s.mgr.setLevel('on')
    s.mgr.click()
    // The clack's own sound id is turned down relative to boot/chime so typing
    // stays soft; play() returns id 1 from the fake player.
    expect(s.player.volume).toHaveBeenCalledWith(0.35 * KEY_GAIN, 1)
  })

  it('plays the countdown tick at a rising rate and stays silent when off', async () => {
    const s = setup()
    await s.mgr.arm()
    s.mgr.setLevel('off')
    s.mgr.countdown(0.5)
    expect(s.player.play).not.toHaveBeenCalled()

    s.mgr.setLevel('on')
    s.mgr.countdown(0) // top of the count → base pitch
    s.mgr.countdown(1) // near zero → highest pitch
    expect(s.player.play).toHaveBeenCalledWith('countdown')
    const rates = s.player.rate.mock.calls.map((c) => c[0] as number)
    expect(rates[0]).toBeCloseTo(1)
    expect(rates[1]).toBeCloseTo(1.9)
    expect(rates[1]).toBeGreaterThan(rates[0])
  })

  it('plays the all-clear chime only when audible', async () => {
    const s = setup()
    await s.mgr.arm()
    s.mgr.setLevel('off')
    s.mgr.allClear()
    expect(s.player.play).not.toHaveBeenCalled()
    s.mgr.setLevel('on')
    s.mgr.allClear()
    expect(s.player.play).toHaveBeenCalledWith('allclear')
  })

  it('plays the danger klaxon only when audible', async () => {
    const s = setup()
    await s.mgr.arm()
    s.mgr.setLevel('off')
    s.mgr.warning()
    expect(s.player.play).not.toHaveBeenCalled()
    s.mgr.setLevel('on')
    s.mgr.warning()
    expect(s.player.play).toHaveBeenCalledWith('warning')
  })

  it('throttles rapid clacks', async () => {
    // now advances 0, 10, 50 → second click (10ms) throttled, third (50ms) ok
    const s = setup({ nowSeq: [0, 10, 50] })
    await s.mgr.arm()
    s.mgr.setLevel('on')
    s.mgr.click() // t=0  -> plays
    s.mgr.click() // t=10 -> throttled
    s.mgr.click() // t=50 -> plays
    expect(s.player.play).toHaveBeenCalledTimes(2)
  })

  it('plays the boot cue only when audible', async () => {
    const s = setup()
    await s.mgr.arm()
    s.mgr.setLevel('off')
    await s.mgr.playBoot()
    expect(s.player.play).not.toHaveBeenCalled()
    s.mgr.setLevel('on')
    await s.mgr.playBoot()
    expect(s.player.play).toHaveBeenCalledWith('boot')
  })

  it('click is a no-op before arming (no player loaded)', () => {
    const s = setup()
    s.mgr.setLevel('on')
    // not armed → nothing to play, must not throw
    expect(() => s.mgr.click()).not.toThrow()
    expect(s.player.play).not.toHaveBeenCalled()
  })

  it('drops the pending playerror listener once the boot plays', async () => {
    const s = setup()
    s.mgr.setLevel('on')
    await s.mgr.playBoot({ onBlocked: vi.fn() })
    expect(s.player.pending('playerror')).toBe(1)
    s.player.fire('play') // success → the stale error listener is removed
    expect(s.player.pending('playerror')).toBe(0)
    // Repeated boots must not accumulate listeners on the singleton.
    await s.mgr.playBoot({ onBlocked: vi.fn() })
    s.player.fire('play')
    expect(s.player.pending('playerror')).toBe(0)
  })

  it('invokes onBlocked and drops the play listener when the boot is blocked', async () => {
    const s = setup()
    s.mgr.setLevel('on')
    const onBlocked = vi.fn()
    await s.mgr.playBoot({ onBlocked })
    s.player.fire('playerror')
    expect(onBlocked).toHaveBeenCalledTimes(1)
    expect(s.player.pending('play')).toBe(0)
  })
})

describe('autoplayLikely', () => {
  const nav = navigator as Navigator & { getAutoplayPolicy?: unknown }
  afterEach(() => {
    delete nav.getAutoplayPolicy
  })

  it('is optimistic when the policy API is unavailable', () => {
    expect(autoplayLikely()).toBe(true)
  })

  it('reflects an explicit autoplay policy when available', () => {
    nav.getAutoplayPolicy = () => 'allowed'
    expect(autoplayLikely()).toBe(true)
    nav.getAutoplayPolicy = () => 'disallowed'
    expect(autoplayLikely()).toBe(false)
  })
})

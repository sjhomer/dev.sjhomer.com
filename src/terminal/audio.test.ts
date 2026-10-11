import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createAudioManager, levelToVolume, nextLevel } from './audio'
import type { Player } from './audio'

function fakePlayer() {
  return {
    play: vi.fn<(sprite?: string) => number>(() => 1),
    stop: vi.fn(),
    volume: vi.fn(),
    once: vi.fn(),
  } satisfies Player & { play: ReturnType<typeof vi.fn> }
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
  it('maps levels to volumes', () => {
    expect(levelToVolume('off')).toBe(0)
    expect(levelToVolume('low')).toBeCloseTo(0.35)
    expect(levelToVolume('full')).toBe(1)
  })
})

describe('nextLevel', () => {
  it('cycles off -> low -> full -> off', () => {
    expect(nextLevel('off')).toBe('low')
    expect(nextLevel('low')).toBe('full')
    expect(nextLevel('full')).toBe('off')
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
    m.mgr.setLevel('full')
    expect(m.getStored()).toBe('full')
    expect(m.mgr.hasPreference()).toBe(true)
    expect(m.mgr.getLevel()).toBe('full')
  })

  it('reads a stored level on construction', () => {
    const s = setup({ stored: 'low' })
    expect(s.mgr.hasPreference()).toBe(true)
    expect(s.mgr.getLevel()).toBe('low')
  })

  it('applies volume to the player once armed and level changes', async () => {
    await m.mgr.arm()
    m.mgr.setLevel('low')
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
    s.mgr.setLevel('full')
    s.mgr.click()
    expect(s.player.play).toHaveBeenCalledTimes(1)
    const sprite = s.player.play.mock.calls[0][0]
    expect(['key1', 'key2', 'key3']).toContain(sprite)
  })

  it('throttles rapid clacks', async () => {
    // now advances 0, 10, 50 → second click (10ms) throttled, third (50ms) ok
    const s = setup({ nowSeq: [0, 10, 50] })
    await s.mgr.arm()
    s.mgr.setLevel('full')
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
    s.mgr.setLevel('full')
    await s.mgr.playBoot()
    expect(s.player.play).toHaveBeenCalledWith('boot')
  })

  it('click is a no-op before arming (no player loaded)', () => {
    const s = setup()
    s.mgr.setLevel('full')
    // not armed → nothing to play, must not throw
    expect(() => s.mgr.click()).not.toThrow()
    expect(s.player.play).not.toHaveBeenCalled()
  })
})

import { describe, expect, it } from 'vitest'
import { debugLines, rollDice, rollLines } from './eggs'

describe('debugLines (DEBUG egg)', () => {
  it('prints a MOTHER self-diagnostic with live-ish readouts', () => {
    const text = debugLines()
      .map((l) => l.text)
      .join('\n')
    expect(text).toContain('SELF-DIAGNOSTIC')
    // A subsystem scan with the classified lab nod...
    expect(text).toContain('ORDER 937')
    // ...the live readout rows...
    expect(text).toMatch(/VIEWPORT\.+/)
    expect(text).toMatch(/UPTIME\.+/)
    // ...and the ominous sign-off.
    expect(text).toContain('WATCHING')
  })
})

describe('rollDice / rollLines (ROLL egg)', () => {
  it('clamps sides and stays within range', () => {
    const { sides, value } = rollDice('D20')
    expect(sides).toBe(20)
    expect(value).toBeGreaterThanOrEqual(1)
    expect(value).toBeLessThanOrEqual(20)
    // Defaults to D20 for a bare ROLL, and floors odd sizes to >= 2.
    expect(rollDice('').sides).toBe(20)
    expect(rollDice('D1').sides).toBe(2)
  })

  it('flags a natural 20 and a natural 1 on a d20 (for the audio cue)', () => {
    const crit = rollLines({ sides: 20, value: 20 })
      .map((l) => l.text)
      .join(' ')
    expect(crit).toContain('CRITICAL SUCCESS')
    const fail = rollLines({ sides: 20, value: 1 })
      .map((l) => l.text)
      .join(' ')
    expect(fail).toContain('CRITICAL FAILURE')
    // No flourish on other dice / other rolls.
    expect(
      rollLines({ sides: 6, value: 1 })
        .map((l) => l.text)
        .join(' '),
    ).not.toContain('CRITICAL')
  })
})

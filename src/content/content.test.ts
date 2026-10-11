import { describe, expect, it } from 'vitest'
import {
  missions,
  personal,
  profile,
  roles,
  skills,
  transmissions,
} from './index'

describe('content model', () => {
  it('parses every collection at import (Zod did not throw)', () => {
    expect(profile.name).toBeTruthy()
    expect(roles.length).toBeGreaterThan(0)
    expect(missions.length).toBeGreaterThan(0)
    expect(skills.length).toBeGreaterThan(0)
    expect(personal.items.length).toBeGreaterThan(0)
    expect(transmissions.channels.length).toBeGreaterThan(0)
  })

  it('has the full service record incl. the Battlefy years', () => {
    expect(roles.length).toBe(9)
    const battlefy = roles.filter((r) => r.company === 'Battlefy')
    expect(battlefy.length).toBe(3)
  })

  it('has exactly one current role (end === null) and it is Head of Engineering', () => {
    const current = roles.filter((r) => r.end === null)
    expect(current.length).toBe(1)
    expect(current[0].title).toBe('Head of Engineering')
    expect(current[0].clearance).toBe('COMMAND')
  })

  it('orders roles newest first with valid YYYY-MM dates', () => {
    const starts = roles.map((r) => r.start)
    const sorted = [...starts].sort().reverse()
    expect(starts).toEqual(sorted)
    for (const r of roles) expect(r.start).toMatch(/^\d{4}-\d{2}$/)
  })

  it('surfaces the headline Battlefy metrics', () => {
    const head = roles.find((r) => r.id === 'battlefy-head')!
    const metrics = head.highlights.map((h) => h.metric).filter(Boolean)
    expect(metrics).toContain('-40%')
    expect(metrics).toContain('+50%')
  })

  it('exposes exactly the chosen contact channels: LinkedIn + GitHub, no email', () => {
    const labels = transmissions.channels.map((c) => c.label).sort()
    expect(labels).toEqual(['GitHub', 'LinkedIn'])
    for (const c of transmissions.channels) {
      expect(c.href).toMatch(/^https:\/\//)
      expect(c.href).not.toMatch(/^mailto:/)
    }
  })

  it('keeps real case studies with briefs', () => {
    expect(missions.length).toBeGreaterThanOrEqual(6)
    for (const m of missions) expect(m.brief.length).toBeGreaterThan(20)
  })
})

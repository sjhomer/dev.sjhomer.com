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

  it('leads the mission log with the portfolio, then Battlefy Player Hub', () => {
    expect(missions[0].id).toBe('dev-sjhomer-portfolio')
    expect(missions[1].id).toBe('battlefy-player-hub')
  })

  it('gives the portfolio entry named links', () => {
    const site = missions.find((m) => m.id === 'dev-sjhomer-portfolio')!
    expect(site.links?.map((l) => l.href)).toContain('https://dev.sjhomer.com')
  })

  it('allows a mission link to be a {label, href} (archived case studies)', () => {
    // ASTTBC/Bitbuy/Longos point to the Internet Archive while still showing
    // their original therefore.ca URL as the label.
    const asttbc = missions.find((m) => m.id === 'etc-certification')!
    expect(typeof asttbc.link).toBe('object')
    const link = asttbc.link as { label: string; href: string }
    expect(link.label).toBe('www.therefore.ca/case-studies/asttbc')
    expect(link.href).toContain('web.archive.org')
    expect(link.href).toContain('therefore.ca/case-studies/asttbc')
  })

  it('references both Battlefy Player Hub live hubs', () => {
    const hub = missions.find((m) => m.id === 'battlefy-player-hub')!
    const hrefs = hub.links?.map((l) => l.href) ?? []
    expect(hrefs).toContain('https://battlefy.com/nintendovs')
    expect(hrefs).toContain('https://battlefy.com/battlefield')
  })
})

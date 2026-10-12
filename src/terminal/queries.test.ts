import { describe, expect, it } from 'vitest'
import {
  PAGE_ORDER,
  complete,
  pageNav,
  resolvePath,
  suggest,
} from './queries'

describe('suggest (visible command menu)', () => {
  it('omits CV, ASK, DOWNLOAD and the per-employer LOG filters', () => {
    const names = suggest('').map((s) => s.name)
    expect(names).not.toContain('CV')
    expect(names).not.toContain('ASK')
    expect(names).not.toContain('DOWNLOAD')
    // The Service Log page carries its own employer tabs, so the LOG shortcuts
    // were dropped from the palette (typing `LOG BATTLEFY` still routes).
    expect(names.some((n) => n.startsWith('LOG '))).toBe(false)
  })

  it('surfaces the DEBUG and SOUND BOARD eggs for discovery', () => {
    const names = suggest('').map((s) => s.name)
    expect(names).toContain('DEBUG')
    expect(names).toContain('SOUND BOARD')
    // ...and they complete from a prefix (so Tab works in the prompt).
    expect(complete('DEBUG')).toBe('DEBUG')
    expect(complete('SOUND')).toBe('SOUND BOARD')
  })

  it('surfaces the design manual (GUIDE): off-menu but routable + discoverable', () => {
    // Off the numbered menu, but reachable by command and its aliases.
    expect(resolvePath('GUIDE')).toBe('/guide')
    expect(resolvePath('STYLE GUIDE')).toBe('/guide')
    expect(resolvePath('MANUAL')).toBe('/guide')
    // Surfaced in the command palette and Tab-completes.
    expect(suggest('').map((s) => s.name)).toContain('GUIDE')
    expect(complete('GUI')).toBe('GUIDE')
    // ...but not on the six-query numbered menu.
    expect(PAGE_ORDER.map((p) => p.path)).not.toContain('/guide')
  })

  it('still lists the six primary queries', () => {
    const names = suggest('').map((s) => s.name)
    for (const q of [
      'DOSSIER',
      'SERVICE LOG',
      'MISSIONS',
      'SYSTEMS',
      'CREW QUARTERS',
      'TRANSMIT',
    ]) {
      expect(names).toContain(q)
    }
  })
})

describe('pageNav (mobile pager order)', () => {
  it('points the landing back to Transmit and forward to Dossier', () => {
    const { prev, next } = pageNav('/')
    expect(prev.path).toBe('/transmit')
    expect(prev.name).toBe('TRANSMIT')
    expect(next.path).toBe('/dossier')
    expect(next.name).toBe('DOSSIER')
  })

  it('walks forward through the menu order', () => {
    expect(pageNav('/dossier').next.path).toBe('/log')
    expect(pageNav('/log').next.path).toBe('/missions')
    expect(pageNav('/missions').next.path).toBe('/systems')
  })

  it('wraps at both ends', () => {
    expect(pageNav('/transmit').next.path).toBe('/dossier')
    expect(pageNav('/dossier').prev.path).toBe('/transmit')
  })

  it('treats an off-menu route (e.g. /cv) like the landing', () => {
    expect(pageNav('/cv').next.path).toBe('/dossier')
    expect(pageNav('/cv').prev.path).toBe('/transmit')
  })

  it('covers the six pages in menu order', () => {
    expect(PAGE_ORDER.map((p) => p.path)).toEqual([
      '/dossier',
      '/log',
      '/missions',
      '/systems',
      '/quarters',
      '/transmit',
    ])
  })
})

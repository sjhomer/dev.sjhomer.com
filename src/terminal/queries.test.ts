import { describe, expect, it } from 'vitest'
import { PAGE_ORDER, pageNav, suggest } from './queries'

describe('suggest (visible command menu)', () => {
  it('omits CV, ASK and DOWNLOAD from the list', () => {
    const names = suggest('').map((s) => s.name)
    expect(names).not.toContain('CV')
    expect(names).not.toContain('ASK')
    expect(names).not.toContain('DOWNLOAD')
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

import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  DossierSection,
  MissionsSection,
  QuartersSection,
  ServiceLogSection,
  TransmitSection,
} from './sections'

describe('terminal sections', () => {
  it('Dossier shows the officer summary', () => {
    render(<DossierSection />)
    expect(screen.getByRole('heading', { name: /DOSSIER/ })).toBeInTheDocument()
    expect(screen.getAllByText(/S\.J\. Homer/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Head of Engineering/).length).toBeGreaterThan(0)
  })

  it('Service Log lists the full record with the fixed wording', () => {
    render(<ServiceLogSection />)
    expect(screen.getAllByText(/Battlefy/).length).toBeGreaterThan(0)
    expect(
      screen.getAllByText(/Cultivated a high-performance/).length,
    ).toBeGreaterThan(0)
    // The highlights now stream through Typewriter, whose dual sr/aria-hidden
    // spans mean a single-occurrence highlight appears exactly twice in the DOM
    // (so this still guards against the wording duplicating across records).
    expect(
      screen.getAllByText(/componentization of various marketing sites/).length,
    ).toBe(2)
  })

  it('Missions surfaces the real case studies', () => {
    render(<MissionsSection />)
    expect(screen.getAllByText(/Recovery GPT/).length).toBeGreaterThan(0)
    expect(
      screen.getAllByText(/Trudel Medical International/).length,
    ).toBeGreaterThan(0)
  })

  it('Quarters renders Creative Works through the line renderer', () => {
    render(<QuartersSection />)
    expect(
      screen.getByRole('heading', { name: /Homer on Olympus/ }),
    ).toBeInTheDocument()
    // Both the title AND the description go through Typewriter, whose signature
    // is the text appearing in the sr span and the aria-hidden span (two
    // matches), rather than a plain <h3>/<p> that would render it once. This
    // holds for every creative work, not just the first.
    for (const text of [
      /Homer on Olympus/,
      /A fun audio drama which I wrote/,
      /Evergrowth Mastermind/,
      /A leadership and personal development mastermind/,
    ]) {
      expect(screen.getAllByText(text)).toHaveLength(2)
    }
  })

  it('Transmit exposes LinkedIn + GitHub only', () => {
    render(<TransmitSection />)
    expect(
      screen.getByText(/linkedin\.com\/in\/seanjhomer/),
    ).toBeInTheDocument()
    expect(screen.getByText(/github\.com\/sjhomer/)).toBeInTheDocument()
  })
})

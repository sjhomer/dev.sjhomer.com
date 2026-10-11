import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  DossierSection,
  MissionsSection,
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
    expect(
      screen.getAllByText(/componentization of various marketing sites/).length,
    ).toBe(1)
  })

  it('Missions surfaces the real case studies', () => {
    render(<MissionsSection />)
    expect(screen.getAllByText(/Recovery GPT/).length).toBeGreaterThan(0)
    expect(
      screen.getAllByText(/Trudel Medical International/).length,
    ).toBeGreaterThan(0)
  })

  it('Transmit exposes LinkedIn + GitHub only', () => {
    render(<TransmitSection />)
    expect(
      screen.getByText(/linkedin\.com\/in\/seanjhomer/),
    ).toBeInTheDocument()
    expect(screen.getByText(/github\.com\/sjhomer/)).toBeInTheDocument()
  })
})

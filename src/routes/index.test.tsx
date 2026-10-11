import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Home } from './index'

describe('Home boot banner (scaffold)', () => {
  it('renders the MU/TH/UR banner heading', () => {
    render(<Home />)
    expect(
      screen.getByRole('heading', { name: /MU\/TH\/UR 6000/i }),
    ).toBeInTheDocument()
  })

  it('prints the crew-file identification line', () => {
    render(<Home />)
    expect(
      screen.getByText(/PERSONNEL FILE: HOMER, S\.J\./i),
    ).toBeInTheDocument()
  })
})

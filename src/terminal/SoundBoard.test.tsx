import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { SoundBoard } from './SoundBoard'
import { audio } from './audio'

// A fake audio manager so the board's wiring is testable without Web Audio.
// (vi.mock is hoisted above these imports by Vitest, so the mock still applies.)
vi.mock('./audio', () => ({
  audio: {
    arm: vi.fn(() => Promise.resolve()),
    playBoot: vi.fn(() => Promise.resolve(true)),
    click: vi.fn(),
    countdown: vi.fn(),
    allClear: vi.fn(),
    warning: vi.fn(),
  },
}))

describe('SoundBoard', () => {
  it('renders a pad per sound bit and plays one when clicked', async () => {
    render(<SoundBoard soundLevel="on" />)
    const pads = screen.getAllByRole('button')
    expect(pads).toHaveLength(5)

    fireEvent.click(screen.getByRole('button', { name: /Danger klaxon/i }))
    await waitFor(() => expect(audio.warning).toHaveBeenCalled())
  })

  it('disables the pads and shows a note when sound is off', () => {
    render(<SoundBoard soundLevel="off" />)
    for (const pad of screen.getAllByRole('button')) {
      expect(pad).toBeDisabled()
    }
    expect(screen.getByText(/Audio subsystem offline/i)).toBeInTheDocument()
  })
})

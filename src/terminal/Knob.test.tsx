import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { Knob } from './Knob'

describe('Knob', () => {
  it('is a button carrying the accessible label, and fires onClick', () => {
    const onClick = vi.fn()
    render(
      <Knob
        label="CRT"
        positions={2}
        index={1}
        on
        ariaLabel="CRT effects on. Toggle."
        onClick={onClick}
      />,
    )
    const btn = screen.getByRole('button', { name: 'CRT effects on. Toggle.' })
    fireEvent.click(btn)
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('draws one notch per position', () => {
    const { container } = render(
      <Knob
        label="Thm."
        positions={3}
        index={1}
        ariaLabel="Theme: green. Change palette."
        onClick={() => {}}
      />,
    )
    expect(container.querySelectorAll('.mu-knob-tick')).toHaveLength(3)
  })

  it('rotates the pointer to the active notch (left / centre / right)', () => {
    const rot = (positions: number, index: number) => {
      const { container } = render(
        <Knob
          label="x"
          positions={positions}
          index={index}
          ariaLabel="x"
          onClick={() => {}}
        />,
      )
      return container
        .querySelector('.mu-knob-pointer')!
        .getAttribute('style')
    }
    expect(rot(3, 0)).toContain('rotate(-50deg)') // first → left
    expect(rot(3, 1)).toContain('rotate(0deg)') // middle → up
    expect(rot(2, 1)).toContain('rotate(50deg)') // on → right
  })

  it('renders the colour tab and the on/off end labels when given', () => {
    const { container, rerender } = render(
      <Knob
        label="Thm."
        positions={3}
        index={2}
        colorTab="PAPER"
        ariaLabel="Theme: hardcopy. Change palette."
        onClick={() => {}}
      />,
    )
    expect(container.querySelector('.mu-knob-tab')?.textContent).toBe('PAPER')

    rerender(
      <Knob
        label="Vol."
        positions={2}
        index={0}
        endLabels={['off', 'on']}
        ariaLabel="Volume off. Toggle."
        onClick={() => {}}
      />,
    )
    expect(container.querySelector('.mu-knob-ends')?.textContent).toBe('offon')
  })
})

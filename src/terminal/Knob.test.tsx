import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { Knob } from './Knob'

describe('Knob', () => {
  it('is a button carrying the accessible label + pressed state, and fires onClick', () => {
    const onClick = vi.fn()
    render(
      <Knob
        name="CRT"
        value="ON"
        positions={2}
        index={1}
        on
        pressed
        ariaLabel="CRT effects on. Toggle."
        onClick={onClick}
      />,
    )
    const btn = screen.getByRole('button', { name: 'CRT effects on. Toggle.' })
    expect(btn).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(btn)
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('draws one notch per position', () => {
    const { container } = render(
      <Knob
        name="Theme"
        value="GREEN"
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
          name="x"
          value="x"
          positions={positions}
          index={index}
          ariaLabel="x"
          onClick={() => {}}
        />,
      )
      return container.querySelector('.mu-knob-pointer')!.getAttribute('style')
    }
    expect(rot(3, 0)).toContain('rotate(-50deg)') // first → left
    expect(rot(3, 1)).toContain('rotate(0deg)') // middle → up
    expect(rot(2, 1)).toContain('rotate(50deg)') // on → right
  })

  it('reads the name and current value as a caption; a 3-way knob omits aria-pressed', () => {
    const { container } = render(
      <Knob
        name="Theme"
        value="PAPER"
        positions={3}
        index={2}
        on
        ariaLabel="Theme: hardcopy. Change palette."
        onClick={() => {}}
      />,
    )
    expect(container.querySelector('.mu-knob-name')?.textContent).toBe('Theme')
    expect(container.querySelector('.mu-knob-val')?.textContent).toBe('PAPER')
    expect(container.querySelector('.mu-knob')).not.toHaveAttribute(
      'aria-pressed',
    )
  })
})

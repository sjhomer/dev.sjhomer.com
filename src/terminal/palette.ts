import { createContext, useContext } from 'react'

/** The three palettes, in cycle order (the Theme knob steps through these). */
export const PALETTES = ['mother', 'sevastopol', 'hardcopy'] as const
export type Palette = (typeof PALETTES)[number]

/** Spoken palette name (accessible labels). */
export const PALETTE_NAMES: Record<string, string> = {
  mother: 'green',
  sevastopol: 'amber',
  hardcopy: 'hardcopy',
}

/** Short colour name shown on the palette knob. */
export const PALETTE_TAB: Record<string, string> = {
  mother: 'GREEN',
  sevastopol: 'AMBER',
  hardcopy: 'PAPER',
}

/**
 * Lets a descendant of the Console (e.g. the standalone /guide page, which has
 * no header knobs) read the live palette and cycle it through the same handler,
 * so there is a single source of truth.
 */
export interface PaletteControl {
  palette: string
  cycle: () => void
}
export const PaletteContext = createContext<PaletteControl | null>(null)
export function usePalette(): PaletteControl | null {
  return useContext(PaletteContext)
}

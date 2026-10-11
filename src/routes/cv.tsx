import { createFileRoute } from '@tanstack/react-router'
import { CvSection } from '../terminal/sections'

export const Route = createFileRoute('/cv')({
  head: () => ({
    meta: [{ title: 'S.J. Homer — Resume' }],
  }),
  component: CvSection,
})

import { createFileRoute } from '@tanstack/react-router'
import { CvSection } from '../terminal/sections'
import { pageHead } from '../seo'

export const Route = createFileRoute('/cv')({
  head: () =>
    pageHead({
      title: 'Resume',
      description:
        'S.J. Homer — Head of Engineering. Printable resume (download as PDF).',
      og: 'default',
      path: '/cv',
    }),
  component: CvSection,
})

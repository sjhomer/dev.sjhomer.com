import { createFileRoute } from '@tanstack/react-router'
import { SystemsSection } from '../terminal/sections'
import { pageHead } from '../seo'

export const Route = createFileRoute('/systems')({
  head: () =>
    pageHead({
      title: 'Systems',
      description:
        'Capabilities on record: leadership, architecture, frontend, AI tooling, quality.',
      og: 'systems',
      path: '/systems',
    }),
  component: SystemsSection,
})

import { createFileRoute } from '@tanstack/react-router'
import { GuideSection } from '../terminal/GuideSection'
import { pageHead } from '../seo'

export const Route = createFileRoute('/guide')({
  head: () =>
    pageHead({
      title: 'Design manual',
      description:
        'The MU/TH/UR Interface design system behind dev.sjhomer.com — palettes, type, motion, components and methodology.',
      og: 'default',
      path: '/guide',
    }),
  component: GuideSection,
})

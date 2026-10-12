import { createFileRoute } from '@tanstack/react-router'
import { MissionsSection } from '../terminal/sections'
import { pageHead } from '../seo'

export const Route = createFileRoute('/missions')({
  head: () =>
    pageHead({
      title: 'Missions',
      description:
        'Case studies: Angular→React migration, decoupled e-commerce, Gatsby/Drupal builds, and more.',
      og: 'missions',
      path: '/missions',
    }),
  component: MissionsSection,
})

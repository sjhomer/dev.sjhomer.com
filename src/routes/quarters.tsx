import { createFileRoute } from '@tanstack/react-router'
import { QuartersSection } from '../terminal/sections'
import { pageHead } from '../seo'

export const Route = createFileRoute('/quarters')({
  head: () =>
    pageHead({
      title: 'Crew quarters',
      description:
        'Off-duty: meditation, voice acting, writing, music, sci-fi and RPGs — and the audio drama Homer on Olympus.',
      og: 'quarters',
      path: '/quarters',
    }),
  component: QuartersSection,
})

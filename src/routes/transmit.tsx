import { createFileRoute } from '@tanstack/react-router'
import { TransmitSection } from '../terminal/sections'
import { pageHead } from '../seo'

export const Route = createFileRoute('/transmit')({
  head: () =>
    pageHead({
      title: 'Transmit',
      description:
        'Open a channel to S.J. Homer — LinkedIn and GitHub are on file.',
      og: 'transmit',
      path: '/transmit',
    }),
  component: TransmitSection,
})

import { createFileRoute } from '@tanstack/react-router'
import { BootLanding } from '../terminal/BootLanding'
import { pageHead } from '../seo'

export const Route = createFileRoute('/')({
  head: () =>
    pageHead({
      title: 'Crew file',
      description:
        "Boot the Nostromo's MU/TH/UR 6000 and query the crew file of S.J. Homer, Head of Engineering.",
      og: 'default',
      path: '/',
    }),
  component: BootLanding,
})

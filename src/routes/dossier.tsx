import { createFileRoute } from '@tanstack/react-router'
import { DossierSection } from '../terminal/sections'
import { pageHead } from '../seo'

export const Route = createFileRoute('/dossier')({
  head: () =>
    pageHead({
      title: 'Dossier',
      description:
        'Officer dossier: S.J. Homer, Head of Engineering — two decades in digital, now leading with AI.',
      og: 'dossier',
      path: '/dossier',
    }),
  component: DossierSection,
})

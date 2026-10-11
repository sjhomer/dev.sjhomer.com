import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ServiceLogSection } from '../terminal/sections'
import { pageHead } from '../seo'

export const Route = createFileRoute('/log')({
  validateSearch: (s: Record<string, unknown>): { f?: string } => ({
    f: typeof s.f === 'string' ? s.f : undefined,
  }),
  head: () =>
    pageHead({
      title: 'Service log',
      description:
        'Service log, 2005 → present: Battlefy, Therefore Interactive, RC Design, SteelSeries.',
      og: 'log',
      path: '/log',
    }),
  component: LogRoute,
})

function LogRoute() {
  const { f } = Route.useSearch()
  const navigate = useNavigate()
  return (
    <ServiceLogSection
      filter={f}
      onFilter={(k) => navigate({ to: '/log', search: k ? { f: k } : {} })}
    />
  )
}

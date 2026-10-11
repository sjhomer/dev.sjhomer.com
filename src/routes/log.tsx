import { createFileRoute } from '@tanstack/react-router'
import { ServiceLogSection } from '../terminal/sections'

export const Route = createFileRoute('/log')({
  validateSearch: (s: Record<string, unknown>): { f?: string } => ({
    f: typeof s.f === 'string' ? s.f : undefined,
  }),
  component: LogRoute,
})

function LogRoute() {
  const { f } = Route.useSearch()
  return <ServiceLogSection filter={f} />
}

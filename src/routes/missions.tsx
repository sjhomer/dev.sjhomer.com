import { createFileRoute } from '@tanstack/react-router'
import { MissionsSection } from '../terminal/sections'

export const Route = createFileRoute('/missions')({
  component: MissionsSection,
})

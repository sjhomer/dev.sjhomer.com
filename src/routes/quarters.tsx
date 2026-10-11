import { createFileRoute } from '@tanstack/react-router'
import { QuartersSection } from '../terminal/sections'

export const Route = createFileRoute('/quarters')({
  component: QuartersSection,
})

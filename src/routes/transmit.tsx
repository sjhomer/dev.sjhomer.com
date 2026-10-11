import { createFileRoute } from '@tanstack/react-router'
import { TransmitSection } from '../terminal/sections'

export const Route = createFileRoute('/transmit')({
  component: TransmitSection,
})

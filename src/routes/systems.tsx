import { createFileRoute } from '@tanstack/react-router'
import { SystemsSection } from '../terminal/sections'

export const Route = createFileRoute('/systems')({ component: SystemsSection })

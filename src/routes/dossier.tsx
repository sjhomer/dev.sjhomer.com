import { createFileRoute } from '@tanstack/react-router'
import { DossierSection } from '../terminal/sections'

export const Route = createFileRoute('/dossier')({ component: DossierSection })

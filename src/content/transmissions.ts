import { transmissionsSchema } from './schema'
import type { Transmissions } from './schema'
import { profile } from './profile'

/**
 * Contact channels for the TRANSMIT query and the Person JSON-LD `sameAs`.
 * LinkedIn + GitHub only, by choice — no email on the public page. Derived from
 * the profile links so there is one source of truth.
 */
export const transmissions: Transmissions = transmissionsSchema.parse({
  channels: profile.links,
  signoff:
    'Channel open. Reach the officer through the links above — MOTHER relays all transmissions.',
})

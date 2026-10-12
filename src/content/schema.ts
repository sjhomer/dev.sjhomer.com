import { z } from 'zod'

/**
 * Content schemas. Every collection parses its data at module load, so malformed
 * content fails the build/test rather than reaching the page. Types are inferred
 * from the schemas — one source of truth for the terminal, /cv, JSON-LD and PDF.
 *
 * Role carries one service-record entry, rendered 1:1 by the terminal Service
 * Log and the printable /cv.
 */

const yearMonth = z.string().regex(/^\d{4}-\d{2}$/, 'dates are YYYY-MM')

export const linkSchema = z.object({
  label: z.string().min(1),
  href: z.string().url(),
})
export type Link = z.infer<typeof linkSchema>

export const clearanceSchema = z.enum(['COMMAND', 'ACTIVE', 'ARCHIVED'])
export type Clearance = z.infer<typeof clearanceSchema>

export const profileSchema = z.object({
  name: z.string().min(1),
  displayName: z.string().min(1),
  title: z.string().min(1),
  station: z.string().min(1),
  remote: z.boolean(),
  clearance: clearanceSchema,
  inServiceSince: z.string().regex(/^\d{4}$/),
  /** The About pitch, verbatim, one entry per paragraph. */
  summary: z.array(z.string().min(1)).min(1),
  mission: z.string().min(1),
  links: z.array(linkSchema).min(1),
})
export type Profile = z.infer<typeof profileSchema>

export const highlightSchema = z.object({
  metric: z.string().optional(),
  text: z.string().min(1),
})
export type Highlight = z.infer<typeof highlightSchema>

export const roleSchema = z.object({
  id: z.string().min(1),
  company: z.string().min(1),
  location: z.string().optional(),
  title: z.string().min(1),
  start: yearMonth,
  end: yearMonth.nullable(),
  remote: z.boolean(),
  clearance: clearanceSchema,
  highlights: z.array(highlightSchema).min(1),
  tags: z.array(z.string()).default([]),
})
export type Role = z.infer<typeof roleSchema>

export const missionSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  metric: z.string().optional(),
  brief: z.string().min(1),
  tech: z.array(z.string()).default([]),
  services: z.array(z.string()).default([]),
  /** A single primary link: a bare URL (shown stripped), or a `{label, href}`
   * when the display text and the target differ (e.g. an Internet Archive href
   * shown under its original URL). Use `links` for several named references. */
  link: z.union([z.string().url(), linkSchema]).optional(),
  links: z.array(linkSchema).optional(),
  era: z.string().optional(),
})
export type Mission = z.infer<typeof missionSchema>

export const skillGroupSchema = z.object({
  group: z.string().min(1),
  items: z.array(z.string().min(1)).min(1),
})
export type SkillGroup = z.infer<typeof skillGroupSchema>

export const creativeWorkSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  link: z.string().url().optional(),
})
export type CreativeWork = z.infer<typeof creativeWorkSchema>

export const personalSchema = z.object({
  intro: z.string().min(1),
  items: z.array(z.string().min(1)).min(1),
  creative: z.array(creativeWorkSchema).default([]),
})
export type Personal = z.infer<typeof personalSchema>

export const transmissionsSchema = z.object({
  channels: z.array(linkSchema).min(1),
  signoff: z.string().min(1),
})
export type Transmissions = z.infer<typeof transmissionsSchema>

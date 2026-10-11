import { skillGroupSchema } from './schema'
import type { SkillGroup } from './schema'

/**
 * Capabilities on record, grouped (per the solution plan: leadership,
 * architecture, frontend, AI tooling, QA). These are the high-level, current
 * positioning; the prior site's granular tech-stack lists (languages, CMSs,
 * cloud, tooling) can be added as further groups if wanted.
 */
const data: Array<SkillGroup> = [
  {
    group: 'Leadership',
    items: [
      'Engineering leadership',
      'Technology roadmap',
      'Mentoring',
      'Cross-functional alignment',
      'Remote teams',
    ],
  },
  {
    group: 'Architecture',
    items: [
      'Solution architecture',
      'Scaling and caching',
      'Incremental migration',
      'Componentization',
      'Cost optimization',
    ],
  },
  {
    group: 'Frontend',
    items: [
      'React',
      'TypeScript',
      'Angular',
      'Accessible component systems',
      'Web components',
      'Decoupled e-commerce',
    ],
  },
  {
    group: 'AI',
    items: [
      'AI-assisted development',
      'AI translation pipelines',
      'Workflow automation',
    ],
  },
  {
    group: 'Quality',
    items: [
      'Multi-user end-to-end testing',
      'Behaviour-driven development',
      'Code review standards',
    ],
  },
]

export const skills: Array<SkillGroup> = data.map((s) =>
  skillGroupSchema.parse(s),
)

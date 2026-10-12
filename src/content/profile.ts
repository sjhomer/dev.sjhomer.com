import { profileSchema } from './schema'
import type { Profile } from './schema'

/**
 * The officer dossier. `summary` and `mission` are the LinkedIn "About" pitch,
 * verbatim and in the first person — ideal for /cv. The terminal DOSSIER may
 * present them in MOTHER's third-person voice at render time (phase 2).
 */
export const profile: Profile = profileSchema.parse({
  name: 'SJ Homer',
  displayName: 'S.J. Homer',
  title: 'Head of Engineering',
  station: 'Remote',
  remote: true,
  clearance: 'COMMAND',
  inServiceSince: '2005',
  summary: [
    'As a seasoned leader in digital solutions, my passion for AI and its transformative potential drives everything I do. With two decades in the digital space, I’ve honed expertise in Developer Management, Solution Architecture, and Product Management.',
    'My journey began in development, and over the years, I’ve grown into a strategic leader, bridging the gap between technology and creativity to deliver innovative, high-quality digital products.',
    'With the capabilities of AI for productivity expanding, my goal is to lead teams in redefining digital development through AI-driven workflows, automating processes, and creating scalable solutions that enhance productivity, user experience, and business outcomes.',
  ],
  mission:
    'As I continue this career evolution, my mission is to empower teams to harness AI and creativity, driving extraordinary results while maintaining the integrity of both technology and human ingenuity.',
  links: [
    {
      label: 'LinkedIn',
      href: 'https://www.linkedin.com/in/seanjhomer/',
    },
    {
      label: 'GitHub',
      href: 'https://github.com/sjhomer',
    },
  ],
})

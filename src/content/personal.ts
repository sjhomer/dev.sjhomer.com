import { personalSchema } from './schema'
import type { Personal } from './schema'

/**
 * Crew quarters — off-duty record. `items` are verbatim from the About pitch;
 * `creative` are real projects from the prior site (kept verbatim, including
 * minor source typos — easy to tidy on request).
 */
export const personal: Personal = personalSchema.parse({
  intro: 'In my personal time, I enjoy a wide range of hobbies and interests.',
  items: [
    'I use meditation to help stay balanced and focus on my goals.',
    'I pursue creative endeavours through voice acting, writing, and music.',
    'I’m an avid fan of science fiction and fantasy, as well as roleplaying games.',
    'Working remotely has afforded my wife and I to live in a region we only dreamed of retiring in, and our next journey is building a tiny home with a homestead to live more sustainably.',
  ],
  creative: [
    {
      title: 'Homer on Olympus',
      description:
        'A fun audio drama which I wrote, performed, and produced over the course of 2021, voicing a total of 9 unique characters across 23 episodes.',
      link: 'https://anchor.fm/homer-on-olympus',
    },
    {
      title: 'Evergrowth Mastermind',
      description:
        'A leadership and personal development mastermind I co-founded and lead form 2017-2021, with over a year’s worth of recorded sessions.',
      link: 'https://anchor.fm/evergrowth-mastermind',
    },
  ],
})

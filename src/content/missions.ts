import { missionSchema } from './schema'
import type { Mission } from './schema'

/**
 * Case studies, verbatim from the prior site's "Noteworthy Projects". Titles are
 * stripped of decorative emoji (the design system draws with characters only).
 * Battlefy-era achievements (the Angular→React migration, −40% infra, +50% AI
 * productivity) live as role highlights until written up as full briefs.
 */
const data: Array<Mission> = [
  {
    id: 'dev-sjhomer-portfolio',
    title: 'dev.sjhomer.com — MU/TH/UR 6000 Portfolio',
    era: 'Personal',
    brief:
      'A developer portfolio disguised as the MU/TH/UR 6000, the ship’s computer from Alien. Inspired by a lifelong love of science fiction and the retro-futurist terminals of the Alien franchise, you boot the mainframe and query the crew file — and every answer types back in cold green phosphor. The terminal is the navigation, with synced original sound effects, line-by-line type rendering, three palettes, and a trove of easter eggs. A fun, expressive experiment in showing a career as something you interrogate rather than scroll.',
    approach: [
      'Designed up front as three linked concept artifacts — a solution plan, a “MU/TH/UR Interface” design system, and an interactive mockup — then built to match.',
      'Hand-rolled terminal engine: self-timing primitives type content line by line, with holds, pauses and mid-line “morphs”.',
      'One typed, Zod-validated content model feeds the terminal, the printable /cv, JSON-LD and the generated PDF/OG images.',
      'Progressive enhancement on TanStack Start — server-rendered complete, then enhanced on the client; deployed to Cloudflare Workers.',
      'Every sound is original Web Audio synthesis (no sampled film audio); easter eggs run from SPECIAL ORDER 937 to a full emergency-destruct sequence.',
    ],
    tech: [
      'React 19',
      'TanStack Start',
      'TypeScript',
      'Vite',
      'Tailwind v4',
      'Zod',
      'Howler',
      'Cloudflare Workers',
      'Playwright',
    ],
    services: ['Concept', 'Design', 'Lead Development', 'DevOps'],
    links: [
      { label: 'dev.sjhomer.com', href: 'https://dev.sjhomer.com' },
      {
        label: 'github.com/sjhomer/dev.sjhomer.com',
        href: 'https://github.com/sjhomer/dev.sjhomer.com',
      },
    ],
  },
  {
    id: 'battlefy-player-hub',
    title: 'Battlefy Player Hub',
    era: 'Battlefy',
    brief:
      'A bespoke CMS suite built to modernize and integrate with Battlefy’s tournament and esports team-management controls through a highly customized content-block system. React and react-query on the front end, an Express-to-Lambda backend, and specialized cache / cache-invalidation controls that give editors a smooth preview-ahead-of-publication workflow.',
    tech: [
      'React',
      'react-query',
      'Express',
      'AWS Lambda',
      'Headless CMS',
      'Caching',
    ],
    services: ['Technical Strategy Lead', 'Development Lead'],
    links: [
      { label: 'battlefy.com/nintendovs', href: 'https://battlefy.com/nintendovs' },
      {
        label: 'battlefy.com/battlefield',
        href: 'https://battlefy.com/battlefield',
      },
    ],
  },
  {
    id: 'recovery-gpt',
    title: 'Recovery GPT',
    era: 'Personal',
    brief:
      'I build this tool to revitalize the user experience on your exported ChatGPT conversations with a focus on elegance and privacy. It’s a tool designed for intuitive navigation of your past chats, featuring a ChatGPT-inspired UI that operates offline with complete user privacy. With RecoveryGPT, users gain seamless access to their conversations, organized and formatted for easy review, and can effortlessly recover text or code with a single click.',
    tech: [
      'React',
      'TypeScript',
      'NextJS',
      'Tailwind',
      'File API',
      'ChatGPT Data Model',
    ],
    services: ['Lead Development & UX', 'Vercel'],
    link: 'https://recovery-gpt.vercel.app',
  },
  {
    id: 'trudel-medical',
    title: 'Trudel Medical International',
    era: 'Therefore Interactive',
    brief:
      'Through extensive planning and architecting, we’ve been working to establish a global ready decoupled ecommerce solution for Trudel. By empowering them to with flexible content controls, they can adapt content to store/languages while associating to the commerce layer separately, simplifying the editing vs product management experience immensely. Running a sleek UI, solid UX, and i18n ingrained, it offers a pleasant global commerce experience.',
    tech: [
      'React',
      'Redux',
      'Gatsby',
      'Sass',
      'Storybook',
      'NodeJs',
      'Serverless',
      'Drupal',
      'Graphql',
      'REST APIs',
      'Jest',
    ],
    services: [
      'Product Strategy Lead',
      'UX Lead',
      'Project Management Lead',
      'Technical Strategy Lead',
      'DevOps Lead',
      'Development Lead',
      'Gatsby Cloud',
      'Netlify',
      'Locize',
      'Sentry',
      'CommerceLayer',
      'Paypal',
      'Stripe',
    ],
    link: 'https://www.trudellmed.com/',
  },
  {
    id: 'etc-certification',
    title: 'ETC Certification Application',
    era: 'Therefore Interactive',
    brief:
      'Engineering Technology Canada needed help to reimagine a lengthy and complex form wizard supporting applications for certifications. Through deliberation and consensus, we consolidated the application to one that present simply, while offering a stellar UX for seamless use.',
    tech: [
      'React',
      'Gatsby',
      'Sass',
      'Cypress',
      'Drupal',
      'Graphql',
      'JSONAPI',
      'REST APIs',
    ],
    services: [
      'Product Strategy',
      'UX',
      'Project Management',
      'Technical Strategy Lead',
      'DevOps Lead',
      'Development Lead',
      'Gatsby Cloud',
      'Netlify',
    ],
    link: 'https://www.therefore.ca/case-studies/asttbc',
  },
  {
    id: 'bitbuy',
    title: 'Bitbuy.ca Crypto Exchange',
    era: 'Therefore Interactive',
    brief:
      'Bitbuy is a leading Canadian cryptocurrency exchange. We helped grow their web presence into a modern stack with Gatsby powered by Drupal and WordPress for content, and their internal exchange APIs requiring resiliency.',
    tech: [
      'React',
      'Gatsby',
      'Sass',
      'NodeJs',
      'Drupal',
      'WordPress',
      'Graphql',
      'JSONAPI',
      'REST APIs',
    ],
    services: [
      'Product Strategy Lead',
      'UX Lead',
      'Project Management Lead',
      'Technical Strategy Lead',
      'API integrations',
      'DevOps Lead',
      'Development Lead',
      'AWS Amplify',
    ],
    link: 'https://www.therefore.ca/case-studies/bitbuy',
  },
  {
    id: 'longos',
    title: 'Longos Website & Ecommerce',
    era: 'Therefore Interactive',
    brief:
      'Longos is a renowned grocery chain through the Greater Toronto Area. As we guided their digital web transformation, we set a precedent for a site architecture that could be relied upon, while introducing support for their booking system for their in-person classes.',
    tech: [
      'React',
      'Redux',
      'React Native',
      'Gatsby',
      'Sass',
      'Cypress',
      'Drupal',
      'Graphql',
      'JSONAPI',
      'REST APIs',
    ],
    services: [
      'Product strategy',
      'UX workflows',
      'Project Management',
      'Technical Strategy Lead',
      'Lead API integrations',
      'DevOps Lead',
      'Development Lead',
      'Mobile App Lead',
      'Netlify',
    ],
    link: 'https://www.therefore.ca/case-studies/longos',
  },
  {
    id: 'drupal-react-portals',
    title: 'Drupal + React Portals Theme',
    era: 'Therefore Interactive',
    brief:
      'Support the team in architecting and guiding them on alternative ways to leverage React within Drupal’s more ridged theme system.',
    tech: [
      'Twig',
      'React',
      'Redux',
      'NodeJs',
      'Drupal',
      'Storybook',
      'JSONAPI',
    ],
    services: ['Technical Architecture', 'Mentorship'],
  },
]

export const missions: Array<Mission> = data.map((m) => missionSchema.parse(m))

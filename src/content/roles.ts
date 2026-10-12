import { roleSchema } from './schema'
import type { Role } from './schema'

/**
 * Service record, newest first. Bullets are the officer's own résumé wording,
 * verbatim, with three corrections agreed during the port:
 *   "Cultivate" -> "Cultivated", "compontentization" -> "componentization",
 *   "audtis" -> "audits" (and a stray space before a comma tidied).
 * `clearance` drives the terminal/CV styling: COMMAND (current era), ACTIVE,
 * ARCHIVED. `metric` surfaces the headline numbers.
 */
const data: Array<Role> = [
  {
    id: 'battlefy-head',
    company: 'Battlefy',
    title: 'Head of Engineering',
    start: '2024-01',
    end: null,
    remote: true,
    clearance: 'COMMAND',
    highlights: [
      {
        text: 'Lead all engineering functions following the CTO’s departure, acting as the primary technical and strategic leader for the company’s technology roadmap.',
      },
      {
        text: 'Drive cross-functional collaboration with Product, Design, and Business teams to align engineering initiatives with company growth and customer needs.',
      },
      {
        text: 'Reduced infrastructure costs by 40% through targeted optimizations in scaling, caching, and resource allocation.',
      },
      {
        text: 'Spearheaded AI-assisted development workflows, improving engineering productivity by 50% and reducing operational bottlenecks.',
      },
      {
        text: 'Designed and led the incremental migration of a legacy Angular application, introducing a React-based, accessible-first component system while ensuring a safe, scalable transition.',
      },
      {
        text: 'Automated content translations using AI, streamlining localization efforts and improving global accessibility.',
      },
      {
        text: 'Developed and integrated multi-user end-to-end testing framework, ensuring robust test coverage for complex scenarios.',
      },
    ],
    tags: ['leadership', 'ai', 'react', 'architecture', 'migration'],
  },
  {
    id: 'battlefy-engineering-manager',
    company: 'Battlefy',
    title: 'Engineering Manager',
    start: '2023-04',
    end: '2023-12',
    remote: true,
    clearance: 'ACTIVE',
    highlights: [
      {
        text: 'Led large-scale engineering initiatives, ensuring alignment with company objectives and industry standards.',
      },
      {
        text: 'Cultivated a high-performance culture, mentoring engineering and fostering innovation and agility within teams to drive excellence and efficient project delivery.',
      },
      {
        text: 'Acted as the bridge between engineering and executive leadership, driving technical strategy and business alignment.',
      },
    ],
    tags: ['leadership', 'mentorship'],
  },
  {
    id: 'battlefy-senior-staff-engineer',
    company: 'Battlefy',
    title: 'Senior Staff Engineer',
    start: '2022-06',
    end: '2023-04',
    remote: true,
    clearance: 'ACTIVE',
    highlights: [
      {
        text: 'Set the technical direction for competitive gaming platforms, balancing cutting-edge solutions with practical implementation strategies.',
      },
      {
        text: 'Led key engineering projects, ensuring technical excellence, best practices, and scalability.',
      },
      {
        text: 'Fostered a culture of collaboration and continuous learning, mentoring engineers to elevate team performance.',
      },
    ],
    tags: ['leadership', 'architecture', 'gaming'],
  },
  {
    id: 'therefore-frontend-lead',
    company: 'Therefore Interactive',
    title: 'Frontend Development Lead',
    start: '2019-04',
    end: '2022-05',
    remote: true,
    clearance: 'ARCHIVED',
    highlights: [
      {
        text: 'Spearheaded multiple projects including a Decoupled E-commerce, and Cryptocurrency Solutions, leading all aspects from product strategy to technical execution.',
      },
      {
        text: 'Drove UX design, project management, technical strategy, and development, resulting in highly successful, user-centric applications.',
      },
      {
        text: 'Managed cross-functional remote teams, ensuring timely delivery of projects while maintaining high-quality standards.',
      },
    ],
    tags: ['leadership', 'frontend', 'ecommerce', 'ux'],
  },
  {
    id: 'therefore-technical-architect',
    company: 'Therefore Interactive',
    title: 'Technical Architect',
    start: '2018-05',
    end: '2019-04',
    remote: true,
    clearance: 'ARCHIVED',
    highlights: [
      {
        text: 'Working to transform the strategic processes, methods, and technical standards around front-end development and componentization within the company.',
      },
      {
        text: 'Leading various projects from conception to completion, leveraging pull requests and code reviews to adhere to better standards.',
      },
      {
        text: 'Enhancing the tooling and build processes to bring efficiencies to the team while working to decrease project complexity.',
      },
      {
        text: 'Mentoring remote team members to enhance their hands-on skills for projects and development.',
      },
    ],
    tags: ['architecture', 'frontend', 'mentorship', 'devops'],
  },
  {
    id: 'therefore-senior-web-developer',
    company: 'Therefore Interactive',
    title: 'Senior Web Developer',
    start: '2014-12',
    end: '2018-05',
    remote: true,
    clearance: 'ARCHIVED',
    highlights: [
      {
        text: 'Assisted in delivering an ecommerce SPA, making impactful contributions and improvements for a successful launch.',
      },
      {
        text: 'Assisted and lead in the construction, agile management, UX, and componentization of various marketing sites.',
      },
      {
        text: 'Assisted in audits to provide a solid UX for all devices, working with the designers to conceptualize mock ups, assist in user feedback testing, and applying the resulting changes to projects.',
      },
      {
        text: 'Building and enhancing an automated testing suite for behaviour driven development.',
      },
      {
        text: 'Leading research and development into tooling and libraries leveraging modern web components, testing, and work flow to bring the organization cutting edge solutions for new projects.',
      },
    ],
    tags: ['frontend', 'ecommerce', 'qa', 'web-components'],
  },
  {
    id: 'rc-design-web-developer',
    company: 'RC Design',
    location: 'Newmarket, Ontario',
    title: 'Web Developer',
    start: '2009-10',
    end: '2014-12',
    remote: false,
    clearance: 'ARCHIVED',
    highlights: [
      {
        text: 'Led website conception, design, and development, delivering tailor-made solutions to clients.',
      },
      {
        text: 'Developed and iterated an in-house CMS framework, significantly enhancing project efficiency and client satisfaction.',
      },
      {
        text: 'Collaborated with multiple departments to ensure project alignment with client specifications and deadlines.',
      },
    ],
    tags: ['fullstack', 'cms', 'client-work'],
  },
  {
    id: 'steelseries-web-developer',
    company: 'SteelSeries (formerly Ideazon)',
    location: 'Greater Toronto Area',
    title: 'Web Developer',
    start: '2007-11',
    end: '2009-09',
    remote: false,
    clearance: 'ARCHIVED',
    highlights: [
      {
        text: 'Assisted in installing and configuring a revised webstore using the Magento framework, which included a customized layout and formatting to branding generated reports.',
      },
      {
        text: 'Guided web initiatives from all aspects by executing and leading projects from creation through deployment.',
      },
      {
        text: 'Administered and maintained web servers, which allowed consistent performance for the company’s websites.',
      },
    ],
    tags: ['web', 'magento', 'devops'],
  },
  {
    id: 'steelseries-intranet-qa',
    company: 'SteelSeries (formerly Ideazon)',
    location: 'Greater Toronto Area',
    title: 'Intranet Web Developer / QA Engineer',
    start: '2005-04',
    end: '2007-11',
    remote: false,
    clearance: 'ARCHIVED',
    highlights: [
      {
        text: 'Administered and developed the company’s ERP system, ensuring uninterrupted management productivity during critical transitions.',
      },
      {
        text: 'Conducted in-depth research and quality assurance for gaming hardware, contributing to product development and competitive strategy.',
      },
    ],
    tags: ['qa', 'erp'],
  },
]

export const roles: Array<Role> = data.map((r) => roleSchema.parse(r))

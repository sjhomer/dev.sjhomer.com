/**
 * The query registry: the single source for the numbered menu, command parsing,
 * auto-complete and the route each query maps to. Section queries navigate to a
 * real URL (shareable, SSR); transient commands (HELP, eggs, ASK) print to the
 * console's output log instead (see eggs.tsx).
 */
export interface Query {
  /** Canonical command, uppercase. */
  name: string
  /** Menu number, 1–6, for the six primary queries. */
  index?: string
  label: string
  hint: string
  /** Route to navigate to, if this query is a page. */
  path?: string
  /** Extra spellings that resolve to this query. */
  aliases?: Array<string>
  /** Hide from the numbered menu (still routable / completable). */
  offMenu?: boolean
}

export const QUERIES: Array<Query> = [
  {
    name: 'DOSSIER',
    index: '1',
    label: 'Dossier',
    hint: 'officer summary',
    path: '/dossier',
  },
  {
    name: 'SERVICE LOG',
    index: '2',
    label: 'Service log',
    hint: 'career, 2005 → present',
    path: '/log',
    aliases: ['LOG'],
  },
  {
    name: 'MISSIONS',
    index: '3',
    label: 'Missions',
    hint: 'case studies',
    path: '/missions',
  },
  {
    name: 'SYSTEMS',
    index: '4',
    label: 'Systems',
    hint: 'skills and tooling',
    path: '/systems',
  },
  {
    name: 'CREW QUARTERS',
    index: '5',
    label: 'Crew quarters',
    hint: 'life off-duty',
    path: '/quarters',
    aliases: ['QUARTERS'],
  },
  {
    name: 'TRANSMIT',
    index: '6',
    label: 'Transmit',
    hint: 'open a channel',
    path: '/transmit',
  },
  {
    name: 'CV',
    label: 'Plain CV',
    hint: 'printable resume',
    path: '/cv',
    aliases: ['PRINT CV', 'RESUME'],
    offMenu: true,
  },
]

/** Transient commands that print to the log rather than routing. */
export const BUILTINS = [
  'HELP',
  'CLEAR',
  'ASK',
  'JONESY',
  'ROLL',
  'OVERRIDE',
  'DOWNLOAD',
] as const

/** Everything a Tab/visible auto-complete can offer, uppercase. */
export const COMPLETIONS: Array<string> = [
  ...QUERIES.map((q) => q.name),
  ...QUERIES.flatMap((q) => q.aliases ?? []),
  ...BUILTINS,
  'ASK ',
]

export const MENU = QUERIES.filter((q) => q.index && !q.offMenu)

/** Resolve a raw command to a routable query (by name or alias), else undefined. */
export function resolvePath(raw: string): string | undefined {
  const c = raw.trim().toUpperCase().replace(/\s+/g, ' ')
  for (const q of QUERIES) {
    if (c === q.name || (q.aliases ?? []).includes(c)) return q.path
  }
  return undefined
}

export interface Suggestion {
  name: string
  hint: string
}

/** Everything the visible auto-complete offers, in discovery order. */
const SUGGESTABLE: Array<Suggestion> = [
  ...QUERIES.map((q) => ({ name: q.name, hint: q.hint })),
  { name: 'HELP', hint: 'list all commands' },
  { name: 'ASK', hint: 'ask MOTHER a question' },
]

function queryMatches(q: Query, c: string): boolean {
  return q.name.startsWith(c) || (q.aliases ?? []).some((a) => a.startsWith(c))
}

/**
 * Suggestions for the visible auto-complete. Empty input shows the full set
 * (so commands are discoverable, not hidden); typing filters by name or alias.
 */
export function suggest(input: string, limit = 8): Array<Suggestion> {
  const c = input.trim().toUpperCase()
  if (!c) return SUGGESTABLE.slice(0, limit)
  const aliasHits = new Set(
    QUERIES.filter((q) => queryMatches(q, c)).map((q) => q.name),
  )
  return SUGGESTABLE.filter(
    (s) => s.name.startsWith(c) || aliasHits.has(s.name),
  ).slice(0, limit)
}

/** Longest common command completion for Tab. */
export function complete(input: string): string | undefined {
  const c = input.trim().toUpperCase()
  if (!c) return undefined
  return COMPLETIONS.map((n) => n.trim()).find((n) => n.startsWith(c))
}

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
  group: 'query' | 'log' | 'command' | 'easter'
}

/** Service-log sub-queries, one per employer. */
const EMPLOYERS: Array<{ key: string; label: string }> = [
  { key: 'BATTLEFY', label: 'Battlefy' },
  { key: 'THEREFORE', label: 'Therefore Interactive' },
  { key: 'RC', label: 'RC Design' },
  { key: 'STEELSERIES', label: 'SteelSeries' },
]

/** Every command the visible auto-complete offers, grouped for discovery. */
const SUGGESTABLE: Array<Suggestion> = [
  ...QUERIES.map((q) => ({
    name: q.name,
    hint: q.hint,
    group: 'query' as const,
  })),
  ...EMPLOYERS.map((e) => ({
    name: `LOG ${e.key}`,
    hint: `service log — ${e.label}`,
    group: 'log' as const,
  })),
  { name: 'HELP', hint: 'list all commands', group: 'command' },
  { name: 'ASK', hint: 'ask MOTHER a question', group: 'command' },
  { name: 'CLEAR', hint: 'clear the output log', group: 'command' },
  { name: 'DOWNLOAD', hint: 'download the resume PDF', group: 'command' },
  {
    name: 'SPECIAL ORDER 937',
    hint: 'science officer eyes only',
    group: 'easter',
  },
  { name: 'JONESY', hint: "the ship's cat", group: 'easter' },
  { name: 'ROLL D20', hint: 'roll the dice', group: 'easter' },
  {
    name: "WHAT'S THE STORY MOTHER",
    hint: 'emergency destruct',
    group: 'easter',
  },
]

function aliasesFor(name: string): Array<string> {
  return QUERIES.find((q) => q.name === name)?.aliases ?? []
}

function matchesInput(s: Suggestion, c: string): boolean {
  if (s.name.startsWith(c)) return true
  if (s.name.split(' ').some((w) => w.startsWith(c))) return true
  return aliasesFor(s.name).some((a) => a.startsWith(c))
}

/**
 * Suggestions for the visible auto-complete. Empty input shows the full set
 * (so commands are discoverable, not hidden); typing filters by name, word or alias.
 */
export function suggest(input: string, limit = 40): Array<Suggestion> {
  const c = input.trim().toUpperCase()
  if (!c) return SUGGESTABLE.slice(0, limit)
  return SUGGESTABLE.filter((s) => matchesInput(s, c)).slice(0, limit)
}

/** First matching command for Tab completion. */
export function complete(input: string): string | undefined {
  const c = input.trim().toUpperCase()
  if (!c) return undefined
  const names = [
    ...SUGGESTABLE.map((s) => s.name),
    ...QUERIES.flatMap((q) => q.aliases ?? []),
  ]
  return names.find((n) => n.startsWith(c))
}

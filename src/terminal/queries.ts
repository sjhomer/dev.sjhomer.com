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
  {
    name: 'GUIDE',
    label: 'Design manual',
    hint: 'interface style guide',
    path: '/guide',
    aliases: ['STYLE GUIDE', 'DESIGN GUIDE', 'MANUAL'],
    offMenu: true,
  },
]

export const MENU = QUERIES.filter((q) => q.index && !q.offMenu)

export interface PageLink {
  path: string
  name: string
}

/** The six primary pages in menu order — the sequence the mobile pager walks. */
export const PAGE_ORDER: Array<PageLink> = MENU.map((q) => ({
  path: q.path as string,
  name: q.name,
}))

/**
 * Previous/next page for the mobile pager, wrapping at both ends. The landing
 * ('/') and any off-menu route sit before the first page: next → the first
 * page (Dossier), prev → the last (Transmit).
 */
export function pageNav(pathname: string): { prev: PageLink; next: PageLink } {
  const n = PAGE_ORDER.length
  const i = PAGE_ORDER.findIndex((p) => p.path === pathname)
  if (i === -1) return { prev: PAGE_ORDER[n - 1], next: PAGE_ORDER[0] }
  return {
    prev: PAGE_ORDER[(i - 1 + n) % n],
    next: PAGE_ORDER[(i + 1) % n],
  }
}

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
  group: 'query' | 'command' | 'easter'
}

/**
 * Every command the visible auto-complete offers, grouped for discovery.
 * CV, ASK and DOWNLOAD are intentionally left out of the visible list (CV is
 * off-menu; ASK/DOWNLOAD stay runnable by typing) to keep the menu focused.
 * The per-employer `LOG <X>` filters are deliberately absent too — the Service
 * Log page carries its own employer tabs, so listing them here was redundant
 * clutter; typing `LOG BATTLEFY` et al. still routes (see Console.run()).
 */
const SUGGESTABLE: Array<Suggestion> = [
  ...QUERIES.filter((q) => !q.offMenu).map((q) => ({
    name: q.name,
    hint: q.hint,
    group: 'query' as const,
  })),
  { name: 'HELP', hint: 'list available queries', group: 'command' },
  // GUIDE is off the numbered menu but surfaced here so the design manual is
  // discoverable from the command palette (and Tab-completes).
  { name: 'GUIDE', hint: 'interface design manual', group: 'command' },
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
  { name: 'DEBUG', hint: 'run diagnostics', group: 'easter' },
  { name: 'SOUND BOARD', hint: 'play the sound bits', group: 'easter' },
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

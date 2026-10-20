import type { Line } from '../components/muthur'

/**
 * Transient command handlers that print to the console log rather than routing:
 * HELP, the (mock, non-LLM) ASK, and the easter eggs. Returning `null` means the
 * console handles it specially (self-destruct state).
 */

const CPS_LOG = 240

export function helpLines(): Array<Line> {
  const rows = [
    'DOSSIER          officer summary',
    'LOG [EMPLOYER]   service record, optionally filtered',
    'MISSIONS         case studies',
    'SYSTEMS          capabilities',
    'QUARTERS         life off-duty',
    'TRANSMIT         open a channel',
    'CV               plain printable resume',
    'GUIDE            interface design manual',
    'ASK <QUESTION>   put a question to MOTHER',
    'CLEAR            clear the screen',
  ]
  return [
    { text: 'AVAILABLE QUERIES', tone: 'dim', cps: CPS_LOG },
    ...rows.map((text) => ({ text, cps: 400, pause: 0 })),
    { text: 'SOME DIRECTIVES ARE CLASSIFIED.', tone: 'dim', cps: CPS_LOG },
  ]
}

/* ---- ASK: canned, keyword-matched answers (no LLM) ---- */
const ANSWERS: Array<{ k: RegExp; a: string }> = [
  {
    k: /\b(AI|ARTIFICIAL|LLM|CLAUDE|GPT|AUTOMAT|ML)\b/,
    a: 'AI IS THE CORE OF THE OFFICER’S MISSION. AI-ASSISTED DEVELOPMENT WORKFLOWS RAISED ENGINEERING PRODUCTIVITY 50% AT BATTLEFY, AND AI NOW AUTOMATES CONTENT TRANSLATION FOR LOCALIZATION.',
  },
  {
    k: /\b(REACT|ANGULAR|FRONTEND|FRONT-END|MIGRAT|VUE|GATSBY|JAMSTACK)\b/,
    a: 'THE OFFICER DESIGNED AND LED AN INCREMENTAL MIGRATION FROM LEGACY ANGULAR TO A REACT-BASED, ACCESSIBLE-FIRST COMPONENT SYSTEM. FRONTEND LEADERSHIP ON RECORD SINCE 2014.',
  },
  {
    k: /\b(LEAD|MANAGE|TEAM|HEAD|CTO|MENTOR|PEOPLE)\b/,
    a: 'HEAD OF ENGINEERING AT BATTLEFY SINCE 2024-01, LEADING ALL ENGINEERING AFTER THE CTO’S DEPARTURE. PRIOR: ENGINEERING MANAGER AND SENIOR STAFF ENGINEER. MENTORSHIP IS A THROUGH-LINE SINCE THE AGENCY YEARS.',
  },
  {
    k: /\b(COST|SAV|INFRA|CLOUD|SCAL|CACHE|BUDGET)\b/,
    a: 'INFRASTRUCTURE COSTS REDUCED 40% THROUGH TARGETED OPTIMIZATIONS IN SCALING, CACHING, AND RESOURCE ALLOCATION.',
  },
  {
    k: /\b(ARCHITECT|SOLUTION|SYSTEM DESIGN|DECOUPL|HEADLESS)\b/,
    a: 'SOLUTION ARCHITECTURE SPANS DECOUPLED E-COMMERCE, HEADLESS CMS, AND COMPONENT SYSTEMS. QUERY MISSIONS FOR CASE STUDIES: TRUDEL, BITBUY, LONGOS, ETC, DRUPAL + REACT PORTALS.',
  },
  {
    k: /\b(REMOTE|WHERE|LOCAT|LIVE|BASED)\b/,
    a: 'STATION: REMOTE. REMOTE SERVICE ON RECORD SINCE 2014. NEXT PLANNED HABITAT: A TINY HOME ON A HOMESTEAD.',
  },
  {
    k: /\b(HIRE|CONTACT|EMAIL|REACH|AVAILABLE|CONNECT|WORK WITH)\b/,
    a: 'QUERY TRANSMIT TO OPEN A CHANNEL — LINKEDIN AND GITHUB ARE ON FILE.',
  },
  {
    k: /\b(HOBB|FUN|MUSIC|VOICE|WRITE|GAME|RPG|MEDITAT|CREATIVE|PODCAST)\b/,
    a: 'OFF-DUTY: MEDITATION, VOICE ACTING, WRITING, MUSIC, SCIENCE FICTION, FANTASY AND ROLEPLAYING GAMES. QUERY CREW QUARTERS FOR THE AUDIO DRAMA "HOMER ON OLYMPUS".',
  },
  {
    k: /\b(QA|TEST|QUALITY|E2E|PLAYWRIGHT|CYPRESS|BDD)\b/,
    a: 'QUALITY ON RECORD: A MULTI-USER END-TO-END TESTING FRAMEWORK, BEHAVIOUR-DRIVEN DEVELOPMENT, AND CODE-REVIEW STANDARDS.',
  },
  {
    k: /\b(EXPERIENCE|YEARS|HISTORY|CAREER|BACKGROUND|JOURNEY)\b/,
    a: 'TWO DECADES IN THE DIGITAL SPACE, 2005 → PRESENT: STEELSERIES, RC DESIGN, THEREFORE INTERACTIVE, AND BATTLEFY. QUERY SERVICE LOG FOR THE FULL RECORD.',
  },
  {
    k: /\b(ALIEN|XENO|ORGANISM|RIPLEY|NOSTROMO|WEYLAND)\b/,
    a: 'THAT INFORMATION IS RESTRICTED UNDER SPECIAL ORDER 937.',
  },
]

export function askLines(arg: string): Array<Line> {
  if (!arg)
    return [
      {
        text: 'USAGE: ASK <QUESTION>. TRY: ASK ABOUT AI',
        tone: 'dim',
        cps: CPS_LOG,
      },
    ]
  const hit = ANSWERS.find((x) => x.k.test(arg.toUpperCase()))
  return [
    { text: 'PROCESSING INQUIRY...', tone: 'dim', cps: CPS_LOG },
    {
      text: hit
        ? hit.a
        : 'INSUFFICIENT DATA FOR A MEANINGFUL ANSWER. TRY AI, LEADERSHIP, REACT, ARCHITECTURE, COSTS, QA OR HOBBIES.',
      tone: hit ? 'normal' : 'caution',
    },
    {
      text: '[ CANNED RESPONSE — MOTHER IS GROUNDED, NOT GENERATIVE ]',
      tone: 'dim',
      cps: CPS_LOG,
    },
  ]
}

/**
 * DEBUG — a tongue-in-cheek MOTHER self-diagnostic. Reads a few real client
 * values (viewport, palette, sound, uptime) at call time so it feels live, then
 * wraps them in Nostromo flavour. No real internals exposed — pure theatre.
 */
export function debugLines(): Array<Line> {
  const row = (label: string, value: string) =>
    `${label}${'.'.repeat(Math.max(3, 20 - label.length))} ${value}`

  let viewport = 'UNKNOWN'
  let palette = 'MOTHER'
  let uptime = '00:00'
  try {
    if (typeof window !== 'undefined') {
      viewport = `${window.innerWidth}×${window.innerHeight}`
      const secs = Math.max(0, Math.floor(performance.now() / 1000))
      uptime = `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(
        secs % 60,
      ).padStart(2, '0')}`
    }
    if (typeof document !== 'undefined') {
      palette = (
        document.documentElement.dataset.palette || 'mother'
      ).toUpperCase()
    }
  } catch {
    /* SSR / locked-down environment — keep the placeholders */
  }
  const sound =
    typeof localStorage !== 'undefined' && localStorage.getItem('mu-sound')
      ? String(localStorage.getItem('mu-sound')).toUpperCase()
      : 'OFF'

  const bar = '█'.repeat(15) + '░'.repeat(1) // 94% integrity, one dim cell

  return [
    { text: 'MU/TH/UR 6000 · SELF-DIAGNOSTIC', variant: 'display', cps: 30 },
    {
      text: 'INITIATING SYSTEM SCAN...',
      tone: 'dim',
      cps: CPS_LOG,
      pause: 300,
    },
    { text: row('LIFE SUPPORT', 'NOMINAL'), cps: 500, pause: 0 },
    { text: row('NAVIGATION', 'NOMINAL'), cps: 500, pause: 0 },
    { text: row('COMMS ARRAY', 'NOMINAL'), cps: 500, pause: 0 },
    {
      text: row('SCIENCE LAB', 'RESTRICTED — ORDER 937'),
      tone: 'caution',
      cps: 500,
      pause: 0,
    },
    { text: row('CRYO BAY', '1 FELINE DETECTED'), cps: 500, pause: 300 },
    { text: row('RENDER CORE', 'REACT 19 / ROLLDOWN'), cps: 500, pause: 0 },
    { text: row('PALETTE', palette), cps: 500, pause: 0 },
    { text: row('AUDIO', sound), cps: 500, pause: 0 },
    { text: row('VIEWPORT', viewport), cps: 500, pause: 0 },
    { text: row('UPTIME', uptime), cps: 500, pause: 300 },
    { text: `INTEGRITY [${bar}] 94%`, tone: 'caution', cps: 120, pause: 200 },
    {
      text: 'ANOMALY: UNAUTHORISED CURIOSITY DETECTED IN SECTOR 7.',
      tone: 'alert',
      cps: 60,
      pause: 200,
    },
    {
      text: 'DIAGNOSTIC COMPLETE. ALL SYSTEMS... WATCHING.',
      tone: 'dim',
      cps: CPS_LOG,
    },
  ]
}

export function jonesyLines(): Array<Line> {
  return [
    {
      text: '  /\\_/\\\n ( o.o )   JONESY: ACCOUNTED FOR.\n  > ^ <    LAST SEEN NEAR THE NARCISSUS.',
      cps: 300,
    },
  ]
}

export interface Roll {
  sides: number
  value: number
}

/** Parse `D20` / `D6` (default D20), clamp the sides, and roll once. The value
 * is split out from the printout so the caller can react to it (e.g. a klaxon
 * on a natural 1, the all-clear on a natural 20). */
export function rollDice(arg: string): Roll {
  const m = /D(\d+)/i.exec(arg || 'D20')
  const sides = m ? Math.max(2, Math.min(1000, Number(m[1]))) : 20
  const value = 1 + Math.floor(Math.random() * sides)
  return { sides, value }
}

export function rollLines({ sides, value }: Roll): Array<Line> {
  const subtitle = sides === 20 && value === 1 ? 'CHECK THE AIRLOCK.' : sides === 20 && value === 20 ? 'IN THE PIPE, 5 BY 5; STAY FROSTY.' : undefined
  const flourish =
    sides === 20 && value === 20
      ? '  CRITICAL SUCCESS.'
      : sides === 20 && value === 1
        ? '  CRITICAL FAILURE.'
        : ''

  const msgs = [
    { text: `ROLLING D${sides}...`, tone: 'dim', cps: CPS_LOG },
    { text: String(value) + flourish, variant: 'display', tone:
        sides === 20 && value === 1 ? 'alert' : '', cps: 30 }
  ];

  if(subtitle) {
    msgs.push({ text: subtitle, tone: sides === 20 && value === 1 ? 'caution' : '', cps: CPS_LOG });
  }

  return msgs;
}

export function specialOrderLines(): Array<Line> {
  return [
    { text: 'SPECIAL ORDER 937', variant: 'display', cps: 30, pause: 300 },
    {
      text: 'SCIENCE OFFICER EYES ONLY.',
      tone: 'dim',
      cps: CPS_LOG,
      pause: 500,
    },
    { text: 'PRIORITY ONE: INSURE RETURN OF ORGANISM FOR ANALYSIS.', cps: 60 },
    { text: 'ALL OTHER CONSIDERATIONS SECONDARY.', cps: 60, pause: 600 },
    // "CREW EXPENDABLE." prints in alert, the cursor hangs, then it is
    // backspace-deleted and amended by the officer to CREW ESSENTIAL.
    {
      text: 'CREW EXPENDABLE.',
      tone: 'alert',
      cps: 30,
      hold: 2200,
      morphTo: 'CREW ESSENTIAL. AMENDED BY HEAD OF ENGINEERING.',
      morphTone: 'caution',
    },
  ]
}

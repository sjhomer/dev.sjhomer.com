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

export function jonesyLines(): Array<Line> {
  return [
    {
      text: '  /\\_/\\\n ( o.o )   JONESY: ACCOUNTED FOR.\n  > ^ <    LAST SEEN NEAR THE NARCISSUS.',
      cps: 300,
    },
  ]
}

export function rollLines(arg: string): Array<Line> {
  const m = /D(\d+)/i.exec(arg || 'D20')
  const sides = m ? Math.max(2, Math.min(1000, Number(m[1]))) : 20
  const v = 1 + Math.floor(Math.random() * sides)
  const flourish =
    sides === 20 && v === 20
      ? '  CRITICAL SUCCESS.'
      : sides === 20 && v === 1
        ? '  CRITICAL FAILURE. CHECK THE AIRLOCK.'
        : ''
  return [
    { text: `ROLLING D${sides}...`, tone: 'dim', cps: CPS_LOG },
    { text: String(v) + flourish, variant: 'display', cps: 30 },
  ]
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

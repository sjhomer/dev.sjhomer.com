# dev.sjhomer.com — a career you boot like the Nostromo

> **PERSONNEL FILE: HOMER, S.J. — CLEARANCE: COMMAND**

[dev.sjhomer.com](https://dev.sjhomer.com) is a developer portfolio in the shape
of the **MU/TH/UR 6000**, the ship's computer from _Alien_. You don't scroll a
résumé. You boot the mainframe, query the crew file, and the answers type back
at you line by line in cold green phosphor. The terminal _is_ the navigation,
not a chrome wrapped around a normal site.

This is the case study: where the idea came from, the three documents that
existed before any product code did, the four days it took to turn them into a
live ship, what the plan got right, what it got wrong, and the craft underneath
the theatre.

![The MU/TH/UR 6000 boot sequence](docs/media/boot.png)

**SELECT A SECTION:**

- [I. THE SPARK](#i-the-spark) — why a ship's computer
- [II. THREE ARTIFACTS](#ii-three-artifacts-before-a-line-of-code) — the plan,
  the design system, the prototype
- [III. THE SERVICE LOG](#iii-the-service-log-four-days-in-order) — four days,
  in order
- [IV. PLAN VS. SHIP](#iv-plan-versus-ship-what-survived-what-changed) — what
  survived, what changed
- [V. ANATOMY OF A LINE](#v-anatomy-of-a-typed-line) — the craft under the
  theatre
- [VI. CLASSIFIED](#vi-classified-directives) — the easter eggs
- [VII. VERIFICATION](#vii-verification) — how it is kept honest

---

## I. The spark

I grew up on science fiction, and nothing in it has aged better than the
_computers_. The _Alien_ franchise treated its interfaces as characters: the
chunky readouts, the unhurried cursors, MOTHER answering in clipped capitals
while the Nostromo's crew argued around her. Those screens are some of the most
atmospheric machines ever put on film precisely because they are slow,
deliberate, and a little ominous. They make you wait, and the waiting is the
point.

I wanted to build one. I also wanted a way to talk about two decades of
engineering work without reaching for another card grid, another hero image,
another "About me" with a headshot. A portfolio is a document someone else
reads under time pressure, and the honest version of that experience is not a
brochure. It is an interrogation. You sit down at a console, you ask the
machine about the officer, and it tells you what is on file.

So the frame wrote itself before the stack did. _The visitor plays a Nostromo
crew member at the interface-room console. They boot the ship's computer and
query it for crew file `SJHOMER`._ Everything else in this document is a
consequence of that one sentence.

> `INTERFACE 2037 READY FOR INQUIRY`

---

## II. Three artifacts before a line of code

The site was designed on paper first, as three linked documents that I could
argue with before I had to argue with a compiler. They were drafted around 10
October, before the terminal existed in code, and the repository was created
the same day. Each one answers a different question, and together they are the
specification the build was measured against.

| Artifact                               | What it is                                                                                                      | What it settled                                                                           |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| **MU/TH/UR Portfolio: Solution Plan**  | A written plan: concept, stack, content model, interaction design, effects, accessibility, deployment, roadmap. | _What_ gets built and _why_; the four pillars; the four-phase roadmap.                    |
| **MU/TH/UR Interface** (design system) | A token set and fifteen component contracts, with a brand book on voice, colour, type, motion and a11y.         | _How_ it looks and speaks; the three palettes; the cadence numbers; the rule of no icons. |
| **MU/TH/UR Crew File** (prototype)     | One self-contained HTML file: a working terminal with the real résumé content and most of the eggs.             | _Whether it feels right_ before React, routing, SSR or audio existed.                     |

### The solution plan

The plan opens with a sentence that did most of the work: _the site is a
MU/TH/UR 6000 terminal session; the visitor boots the ship's computer, then
queries it for crew file SJHOMER, and every answer is typed back line by line._
Underneath it, four pillars, written to keep the thing a portfolio first and a
toy second:

1. **Diegetic, not decorative.** Every section is a terminal query and
   response, so the theme is the navigation, not a skin over a normal site.
2. **Readable in ten seconds.** A recruiter who never types still gets a menu
   of numbered options and a way to print the full crew file instantly.
3. **Content separate from presentation.** Career data lives in typed files;
   the terminal only renders it. A plain `/cv` reuses the same data as a
   printable résumé.
4. **Restraint in effects.** Green-on-black phosphor, scanlines and a slight
   bloom, tuned low so long reading stays comfortable.

The plan chose the stack and defended each choice in a sentence. TanStack Start
on React 19, because file routes give every query a real, shareable URL and
server rendering gives crawlers and no-JS readers the full text while the
terminal animates on top. A hand-rolled terminal engine rather than `xterm.js`,
because xterm is built for real shells and a custom renderer keeps text in the
DOM, selectable and accessible. Tailwind v4 over CSS custom properties for the
phosphor palette. Howler for sound, which the plan wanted off by default.
TypeScript data files validated with Zod, so that one source feeds the
terminal, `/cv`, structured data and a PDF. Cloudflare Workers at the edge.
Vitest for the engine and Playwright for the boot and command flows. The plan
also reserved room for an optional "Ask MOTHER", a server function calling a
language model and answering only from the content files. It was never built,
and the ledger in section IV says why.

It specified the content model as six collections, each mapped to a query:

| Collection         | Holds                                                                  | Query                 |
| ------------------ | ---------------------------------------------------------------------- | --------------------- |
| `profile.ts`       | Name, title, station, links, the About pitch as summary and mission    | `DOSSIER`             |
| `roles.ts`         | One entry per position: company, title, dates, remote flag, highlights | `LOG`, `LOG BATTLEFY` |
| `missions.ts`      | Case studies                                                           | `MISSIONS`            |
| `skills.ts`        | Grouped capabilities                                                   | `SYSTEMS`             |
| `personal.ts`      | Life off-duty                                                          | `CREW QUARTERS`       |
| `transmissions.ts` | Contact channels and a sign-off line                                   | `TRANSMIT`            |

Each role carries a `clearance` field, and the plan gave it a job: older roles
print as archived logs, the current post as a COMMAND-level record. It also
noted, drily, that the four Battlefy years missing from the legacy site "arrive
simply by adding these three entries", along with two typos in the old résumé
worth fixing on the way through.

The interaction design is where the plan earned its keep. Three input modes run
side by side, so typing is a delight but never a requirement: a command line,
numbered options you can click or key, and ordinary links for screen readers
and crawlers. The boot sequence was scripted to the line, about four seconds,
skippable with any key:

```
INTERFACE 2037 READY FOR INQUIRY
> MU/TH/UR 6000 .......... ONLINE
> CREW MANIFEST ......... LOADED
> PERSONNEL FILE: HOMER, S.J.  CLEARANCE: COMMAND

SELECT QUERY:
  1  DOSSIER        officer summary
  2  SERVICE LOG    career, 2005 to present
  3  MISSIONS       case studies
  4  SYSTEMS        skills and tooling
  5  CREW QUARTERS  life off-duty
  6  TRANSMIT       open a channel
```

The easter eggs were in the plan from the first draft, because once a command
registry exists they are nearly free: `SPECIAL ORDER 937` printing a directive
that glitches from CREW EXPENDABLE to CREW ESSENTIAL, `WHAT'S THE STORY MOTHER`
arming a self-destruct countdown, `ROLL D20` for the tabletop habit, `JONESY`
for the cat, and the Konami code flipping the palette to the amber of
Sevastopol Station.

It closed with a budget and a roadmap. The budget: text in the DOM from the
first paint, `prefers-reduced-motion` honoured, a labelled `<input>`, every menu
option a real link, a `role="log"` region that announces finished blocks rather
than individual characters, and the heavy flourishes loaded only on demand. The
roadmap: four phases, Foundation, Terminal, Atmosphere, Ask MOTHER, with one
gate drawn on the line between phases two and three, labelled **Domain
cutover**, with the criterion _"/cv and terminal match the résumé"_.

### The design system: MU/TH/UR Interface

The design system is the plan's visual constitution, and it is opinionated in a
way that saved hours of later dithering. Its brand book opens with the same
sentence as the plan, then sets four principles: diegetic (nothing on screen
that the ship's computer could not print: no cards, hero images, gradients or
icons); readable in ten seconds; **one glowing thing at a time** (one Typewriter
types at once, one Metric or caution Tag is the brightest element in view); and
effects stay low.

The **voice** section is the one I reread most. MOTHER speaks; the crew
queries. System lines are uppercase, clipped, with the articles stripped out
where they can be. Body copy about the career is sentence case, third person,
as MOTHER's summary of the officer. Errors say what failed and what to do next:
`UNABLE TO COMPUTE. QUERY "HIRE" NOT RECOGNISED. TYPE HELP FOR AVAILABLE QUERIES.`
No emoji, no exclamation marks, no jokes in system lines; the humour lives in
the eggs. Queries are nouns. Dates are `YYYY-MM` in logs and `2024 → NOW` in
summaries, and the arrow is `→`, never `->`.

**Colour** is three palettes sharing one set of token names: `mother` green as
the default, `sevastopol` amber as the alternate, and `hardcopy`, a paper-white
print look where every effect is `none`. Each token has a single job. Text is
`phosphor`; secondary text is `phosphor-dim`, and both clear 5.6:1 on both
grounds in every theme. `caution` marks the one value that matters most and
doubles as the focus ring. `alert` is reserved for self-destruct, errors and
access denied, and always comes with a word. `phosphor-faint` is decoration
only, deliberately under 3:1, and never carries text or meaning.

**Type** is two faces: VT323 for anything shouted, IBM Plex Mono for everything
read. Typed text never runs wider than 72 characters. **Motion** is typing, and
the cadence is written down as tokens the engine reads: prose at 90 characters a
second, logs and boot checks at 240, a 120 ms pause between lines and 400 ms
after a heading, a cursor that blinks once every 1060 ms, a boot that runs at
most four seconds, a flicker that dips to 97% twice every seven seconds.

The section I quote to people is **Iconography**. It reads, in full: _None.
The system draws with characters only._ `>` for the prompt, `█` and `░` for
bars, `■` for bullets, `→` for ranges, dashed rules for dividers, ASCII art for
the cat. The system's own cover art is a single phosphor block, with the note
_"the cursor is the brand"_. That one line is why the site's favicon is a
prompt chevron and a lit block cursor, and nothing else.

### The crew file prototype

The third artifact is the one you could touch. **MU/TH/UR Crew File** is a
single HTML file with no build step: the design system's tokens inlined, the
real résumé content as plain JavaScript objects, and a small engine that types
lines with `requestAnimationFrame`. It had a status strip with the ship clock,
a palette button that cycled green, amber and hardcopy, an effects-off toggle, a
"Plain CV" button, a six-item menu, a prompt with history and Tab completion,
and hash routes so `#log` would resume a session straight into the service
record.

It also had the eggs. `SPECIAL ORDER 937` already amended itself on screen.
`WHAT'S THE STORY MOTHER` already armed a ten-second countdown with `OVERRIDE`
to abort. `ROLL D20` already knew about critical failures and the airlock. A
mocked `ASK` returned canned answers, with a note that a live model was still
only an idea.

What the prototype proved was pacing. Ninety characters a second for prose
turned out to be right. A blinking cursor that trails the reveal turned out to
be essential. The prototype skipped the boot on return with a session flag; the
site replays it every time you come home, because the boot is the best part.
None of that is visible in a plan; it is only visible when you sit in front of
the thing and wait for it. The prototype's hash routes became real routes, and
its `mock` notes became the to-do list for the first day of the build.

---

## III. The service log: four days, in order

The repository's own history is the most honest account of the build, so here
it is, compressed. The plan imagined four tidy phases shipped one at a time. The
log shows what actually happened: the whole ship was built in one go, over a
weekend, and then refined under its own weight.

| Ship date | Entry                                                                                                                                                                                                                                                                                                                                |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **10-10** | Baseline and scaffold: TanStack Start on Cloudflare Workers. The **domain cut over** to the new Worker the same evening, before any terminal existed, so every later change shipped to the real address.                                                                                                                             |
| 10-10     | The typed, Zod-validated content model lands: six collections, the three missing Battlefy years, the typos fixed.                                                                                                                                                                                                                    |
| 10-10     | The full MU/TH/UR terminal in one change: the component library ported from the design system, the engine, six query pages, the CRT atmosphere, the easter eggs and `/cv`. The shell is then realigned to the prototype: boot landing, a three-column docked menu, a fixed screen.                                                   |
| 10-10     | Build-time assets: the résumé PDF and a per-route Open Graph image rendered by Playwright. The command palette gets `⌘K`.                                                                                                                                                                                                            |
| **10-11** | Review refinements: a staged boot animation, a grouped service log, the first mobile pass. The easter eggs get their own playground mode.                                                                                                                                                                                            |
| 10-11     | The printing engine is rewritten twice in a day: first so a line never prints ahead of the one before it, then as a chainable stager so whole sections print top to bottom like a line printer.                                                                                                                                      |
| 10-11     | Sound arrives: original, offline-synthesised effects in one sprite, Howler loaded lazily, a control row to arm it. Then an accessibility and lifecycle hardening pass from code review.                                                                                                                                              |
| 10-11     | Mobile gets a pager and a tap-to-pick command button instead of a text prompt. `/cv` drops the console chrome for one back button. Sound survives a `/cv` round trip. The effects are reworked closer to the film's interface.                                                                                                       |
| 10-11     | Softer typing, a reading-paced auto-scroll, egg sounds, and the two-act animation for SPECIAL ORDER 937.                                                                                                                                                                                                                             |
| **10-12** | Release polish merged as **v0.1, the go-live**: the whole MU/TH/UR, verified end to end, in one consolidated change.                                                                                                                                                                                                                 |
| 10-12     | Post-launch refit (v0.2): this README as a case study, the portfolio and Battlefy Player Hub missions, the analog **control knobs** in the header, the **design manual** at `/guide`, a dead-code pass that wires the advertised `HELP`, a palette context, and a button-driven self-destruct abort with escalating re-confirmation. |
| 10-12     | Patches (v0.3): archived links for a defunct agency site, a first-visit **Welcome** modal in place of a bare sound gate, arrow-key navigation of the suggestion list, a larger wordmark with a power-glyph affordance.                                                                                                               |
| **10-13** | The landing boot replays when you return home; typing elsewhere is softened and its key clacks dropped to five percent; `⌘`/`Ctrl`+number is handed back to the browser. The site mark lands as the favicon, and the leftover `HELP` and mocked `ASK` commands are removed as dead code, tests included.                             |

Nothing here was generated once and shipped. It was tuned: the cadence of the
typing, the exact green, the weight of the bloom, the way a line _holds_ before
it morphs, until it felt like the screens I remembered.

![Querying the crew file](docs/media/dossier.png)
_Querying the crew file. Every answer types back line by line, with a
reading-paced auto-scroll that stops the moment you touch the wheel._

---

## IV. Plan versus ship: what survived, what changed

The honest part of any build is the distance between the plan and the thing
that ships. Much of the plan survived intact: the four pillars, the six
collections, the three input modes, the phosphor tokens, the progressive
enhancement spine, the hand-rolled engine, Cloudflare, the test split. The
character of the site came from the places it changed.

| The plan said                                                                | What shipped                                                                                                                                                                                                                                                                                                                                    | Why                                                                                                                                                                                               |
| ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| An optional **Ask MOTHER** backed by a live model, phase four.               | Dropped before launch. Nothing on the site calls a model; MOTHER only ever prints what is on file.                                                                                                                                                                                                                                              | A terminal that hallucinates its own crew's history is a worse terminal. MOTHER is grounded, not generative.                                                                                      |
| Four phases, shipped one feature at a time.                                  | The whole experience in one go-live, then three refit releases in two days.                                                                                                                                                                                                                                                                     | The terminal, atmosphere, audio and eggs only make sense as one piece. You cannot evaluate a boot sequence without the thing it boots into.                                                       |
| Domain cutover **after** parity with the legacy page.                        | Cutover on day one, before the terminal existed.                                                                                                                                                                                                                                                                                                | Shipping to the real address from the first commit meant every review happened on production, and there was never a "launch day" to be afraid of.                                                 |
| `SPECIAL ORDER 937` becomes `SPECIAL ORDER 2005`, the year the career began. | 937 stays 937. The directive prints as written, then CREW EXPENDABLE is backspaced and amended, on screen, to CREW ESSENTIAL. The year 2005 lives in `IN SERVICE SINCE`.                                                                                                                                                                        | The joke is better when the order is the real one. The amendment is the portfolio's whole thesis in one line.                                                                                     |
| A **decode effect** for headings, characters scrambling before they settle.  | No scramble anywhere. Instead, one `MorphLine` primitive that types a line, holds, deletes it character by character and types a replacement.                                                                                                                                                                                                   | Scrambling is a trope from other terminals. Backspacing is what a person at a keyboard actually does, and it is used exactly once, where it counts.                                               |
| An optional **WebGL** pass for barrel curvature and chromatic offset.        | Never built. The CRT layer is entirely CSS: scanlines, a `text-shadow` bloom, a flicker under three percent, a vignette, an inner bezel shadow.                                                                                                                                                                                                 | The plan's own fourth pillar. Curvature makes a wall of text harder to read, and people have to read this.                                                                                        |
| Nested routes like `/log/battlefy` and `/missions/angular-migration`.        | Six flat routes. The service log filters by employer through a search parameter, and the filter re-runs the typing.                                                                                                                                                                                                                             | Fewer routes, same shareability, and a filter change feels like a new query rather than a new page.                                                                                               |
| MDX for long-form content.                                                   | Plain TypeScript objects only.                                                                                                                                                                                                                                                                                                                  | Nothing on the site is long-form prose. The content model is a résumé, and a résumé is data.                                                                                                      |
| Howler with "keyclick, boot hum and alarm cues", **off by default**.         | **On by default, but unobtrusive.** Howler, lazily imported, plays one sprite that is **synthesised offline** by a script with a seeded random generator, so the file is reproducible and contains no sampled audio. The level is kept gentle and the typing clacks run at two gains: louder on the landing boot, five percent everywhere else. | A first-visit Welcome modal says audio is on before anything plays. Enter keeps it, Escape enters silently, the Vol. knob mutes, and the choice persists. A silent ship's computer is a dead one. |
| Fonts from Google Fonts.                                                     | VT323 and IBM Plex Mono **self-hosted** under the SIL Open Font License.                                                                                                                                                                                                                                                                        | No third-party request on first paint.                                                                                                                                                            |
| `Person` JSON-LD from the content files.                                     | Still on the plan. The content module is shaped for it, but no structured data is emitted yet.                                                                                                                                                                                                                                                  | The PDF and the per-route Open Graph images took its place in the build-time asset pass.                                                                                                          |
| Not in the plan at all.                                                      | The analog **control knobs**, the **design manual** at `/guide`, the mobile **pager** and **command picker**, the egg **playground mode**, the **Welcome** modal, `DEBUG`, `SOUND BOARD`.                                                                                                                                                       | You only think to build an instrument panel once the machine is running and you start treating it like an instrument.                                                                             |

---

## V. Anatomy of a typed line

Under the theatre, the craft is ordinary and deliberate. This is what happens
when MOTHER answers a query.

**The content is data, and it is checked.** Every collection under
`src/content/` is parsed by its Zod schema at module load, so a malformed entry
fails the build and the tests rather than reaching the page. Dates must be
`YYYY-MM`. A role must have at least one highlight. The same objects render the
terminal's service log, the printable `/cv`, and the PDF that `DOWNLOAD` opens,
so none of them can drift. Adding the next role is a one-file change.

**The page is complete before the animation starts.** Each route server-renders
its full text with its own title, description and Open Graph image. A typed
line is two spans: a visually hidden one that holds the full text from the
first byte, for screen readers, crawlers, find-in-page and copy, and an
`aria-hidden` one that reveals the same text character by character. A
two-line script in `<head>` adds a class before first paint so a JavaScript
client hides the output until the console mounts and the typing takes over.
No-JS clients never get that class and see everything at once, and a four
second failsafe reveals the page even if the app never mounts. Turn JavaScript
off and you still get the entire crew file; the end-to-end suite checks that
you do.

**The engine is a sequencer, not a library.** `Typewriter` reveals one line.
`TypeSequence` reveals a list of lines with per-line tone, speed and pause.
`Staged` prints its children one block at a time, top to bottom, like a line
printer: a self-timing block must finish before the next one appears, so text
never prints ahead of itself. The cadence numbers come from CSS. The engine
reads `--cps-prose` and the other tokens from the stylesheet at runtime, which
means the design manual, the tokens file and the typing you see are one source.
Under `prefers-reduced-motion`, every block starts fully revealed.

**Reading pace is a feature.** On content pages, once there is text below the
fold, the screen eases downward slowly enough to read, keeping up as more lines
type in below. The first real scroll gesture pauses it for that page.
Navigating restarts it. It runs on its own timer, decoupled from the typing
loop, and it is off entirely under reduced motion.

**Sound is original, and on by default without being loud.** Every effect,
the boot drone, the three key clicks, the countdown tick, the all-clear chime,
the danger klaxon, is written by a script that synthesises waveforms into a
single sprite file, deterministic from a seed, with no encoder and no sampled
audio anywhere. A first-visit Welcome modal says audio is enabled before
anything plays; Enter keeps it, Escape enters silently, and the Vol. knob mutes
it at any time. Howler is imported only on that first gesture, so it never
touches the first-paint path, and the volume sits well below full because full
was too loud.
The audio manager is built from injectable dependencies (clock, storage, player
loader) so its gating, throttling and persistence are unit-tested under jsdom
without real Web Audio.

**Three palettes, one set of names.** `mother`, `sevastopol` and `hardcopy`
share every token name, so a component never knows which palette it is in. The
palette is an attribute on `<html>`, set by the Theme knob, the Konami code, or
the `/cv` route, which forces hardcopy. The knobs are real buttons dressed as
rotary dials; the dial is decorative and the state is read from a caption.

**The phone gets its own instrument.** Below the desktop breakpoint, the
numbered menu becomes a previous/next pager that walks the six queries in
order, and the text prompt becomes a tap-to-pick button that opens the command
list, with the typing-only commands left out.

**And the atmosphere can be switched off.** The scanlines, bloom, flicker,
vignette and bezel are a handful of CSS rules over the design tokens. The CRT
knob drops the glow, scanlines and vignette in place, and the operating
system's reduce-motion setting goes further: it also stops the typing, the
flicker, the blink and the auto-scroll, leaving instant, calm text.

---

## VI. Classified directives

Half the fun is what's _not_ on the menu. Once any egg is running, the six
numbered options on desktop become six egg controls, and the console turns
into a small playground.

| Command                   | What happens                                                                                                                                                                                                                                                                                   |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SPECIAL ORDER 937`       | The directive prints, _science officer eyes only_, _ensure return of organism_, _all other considerations secondary_, then **CREW EXPENDABLE** in alert red. The cursor hangs. The line is backspaced and retyped, in caution yellow: **CREW ESSENTIAL. AMENDED BY HEAD OF ENGINEERING.**      |
| `WHAT'S THE STORY MOTHER` | Arms the **emergency destruct sequence**: a ten-second countdown with a tick that climbs in pitch and a klaxon if sound is on. One **Abort** control stands it down, but it escalates: _ARE YOU SURE? RECONFIRM_, _ARE YOU REALLY REALLY SURE?_, _LAST CHANCE TO ABORT_. Or let it reach zero. |
| `ROLL D20`                | Rolls the dice, a nod to a lifelong love of tabletop RPGs. A natural 1 trips the **danger klaxon** (_CHECK THE AIRLOCK_); a natural 20 sounds the **all-clear**.                                                                                                                               |
| `JONESY`                  | The ship's cat is accounted for, in ASCII.                                                                                                                                                                                                                                                     |
| `DEBUG`                   | A tongue-in-cheek self-diagnostic that reads real live values, viewport, palette, sound, uptime, and wraps them in Nostromo flavour. Integrity holds at 94%.                                                                                                                                   |
| `SOUND BOARD`             | A playable board of every sound effect, revealed one pad at a time. It respects the mute.                                                                                                                                                                                                      |
| `↑ ↑ ↓ ↓ ← → ← → B A`     | The Konami code flips the palette to **Sevastopol** amber: _PALETTE OVERRIDE ACCEPTED. WELCOME TO SEVASTOPOL STATION._                                                                                                                                                                         |

![SPECIAL ORDER 937 amended on screen](docs/media/special-order-937.png)

---

## VII. Verification

A site this theatrical needs to be boring underneath, so every change goes
through the same gate before it reaches the Worker.

- **Unit tests** (Vitest, jsdom) cover the content schemas, the query registry
  and auto-complete, the easter-egg handlers, the audio manager's gating and
  persistence, the knob, the sound board and the section renderers.
- **End-to-end tests** (Playwright, Chromium) run thirty-six scenarios across
  eight specs: the boot landing and menu, keyboard operability and a single
  `h1` per route, no-JS rendering, the welcome gate and volume persistence, the
  reading-paced auto-scroll, mobile pager and picker, the suggestion list's
  arrow keys, the design manual, and the eggs, including that 937 really does
  amend itself and that an aborted self-destruct stays in order under later
  eggs.
- **CI** runs route generation, typecheck, lint, a Prettier check, the unit
  tests, the production build and the end-to-end suite on every push and pull
  request. Same-repo pull requests get a non-production Worker version with a
  preview URL commented on the thread. Merging to `main` deploys to
  dev.sjhomer.com.
- **Build-time assets** are regenerated from the live content by scripts: the
  résumé PDF and the seven Open Graph images by rendering the site itself, the
  sound sprite by synthesis, and the favicon rasters from the one SVG mark.

It rides on TanStack Start (React 19) at the edge on Cloudflare Workers, and it
was built to a budget: full text and function with the animation turned off,
and the heavy flourishes loaded only when a device can afford them.

---

## Colophon

A personal project, and a love letter. Fonts **VT323** and **IBM Plex Mono**
under the SIL Open Font License. _Alien_, the Nostromo, MU/TH/UR and Sevastopol
Station are the creations of their respective rights holders; this is an
unaffiliated fan tribute and personal portfolio, and every sound in it is
original. The site mark is MOTHER's prompt and a lit block cursor, because the
cursor is the brand.

— built by [S.J. Homer](https://dev.sjhomer.com). Query `TRANSMIT` to open a
channel.

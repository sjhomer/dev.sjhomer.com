# dev.sjhomer.com — a portfolio that boots like the Nostromo

> **PERSONNEL FILE: HOMER, S.J. — CLEARANCE: COMMAND**

[dev.sjhomer.com](https://dev.sjhomer.com) is a developer portfolio disguised as
the **MU/TH/UR 6000**, the ship's computer from *Alien*. You don't scroll a
résumé — you boot the mainframe, query the crew file, and the answers type back
at you line by line in cold green phosphor. The terminal _is_ the navigation,
not a chrome wrapped around a normal site.

It's also a love letter. I grew up on science fiction, and the retro-futurist
interfaces of the *Alien* franchise — the chunky amber readouts, the blinking
cursors, MOTHER's clipped omniscient tone — are the most atmospheric computers
ever put on film. This was an excuse to build one, and to showcase two decades
of engineering work through it.

![The MU/TH/UR 6000 boot sequence](docs/media/boot.png)

## The concept

Everything is diegetic. The visitor is a crew member interrogating the ship's
computer about officer **SJHOMER**:

- The **career** is a _service log_. **Case studies** are _missions_. **Skills**
  are _systems_. **Life off-duty** is the _crew quarters_. **Contact** is a
  _transmission channel_.
- Six numbered queries (`1`–`6`) drive the whole site. Type a command, press a
  number, or let MOTHER auto-complete — every route is real, shareable and
  server-rendered underneath the theatre.
- Three palettes ship: **`mother`** (Nostromo green), **`sevastopol`** (the
  amber of *Alien: Isolation*'s doomed station) and **`hardcopy`** (a paper-white
  print mode that powers the plain `/cv`).
- A printable résumé lives at [`/cv`](https://dev.sjhomer.com/cv) for recruiters
  who'd rather not play along — same typed content model, effects off.

## From three artifacts to a live ship

The site was designed before a line of product code was written, as three
linked concept artifacts — and those ideas largely survived to launch:

1. **A solution plan** — stack, a typed content model, interaction design, and a
   phased roadmap (Foundation → Terminal → Atmosphere → Ask MOTHER).
2. **A design system, "MU/TH/UR Interface"** — a token set (the three palettes,
   type scale, glow and scanline treatments) and ~15 component contracts.
3. **An interactive mockup** — the full terminal UX to build against: boot,
   menu, palette switching, the hardcopy `/cv`, and the easter eggs.

Getting from those to a live `v1` took a stacked series of changes — scaffold,
content model, the component library, the terminal engine, atmosphere (CRT
grain, scanlines, flicker), original audio, easter eggs, then a long tail of
mobile and accessibility polish — each built, verified and reviewed in sequence
before a consolidated go-live. The roadmap's later "Ask MOTHER" phase was
deliberately re-scoped: rather than wire up an LLM, MOTHER stays **grounded, not
generative** — `ASK` returns hand-authored, keyword-matched answers and is
honest about it (`[ CANNED RESPONSE — MOTHER IS GROUNDED, NOT GENERATIVE ]`).

![Querying the crew file](docs/media/dossier.png)
*Querying the crew file — every answer types back line by line, with a reading-paced auto-scroll.*

## Easter eggs

Half the fun is what's _not_ on the menu. A few of the classified directives:

| Command | What happens |
| --- | --- |
| `SPECIAL ORDER 937` | The infamous order prints — "ensure return of organism… crew expendable" — then the cursor hangs and the line is amended, on-screen, to **CREW ESSENTIAL**. |
| `WHAT'S THE STORY MOTHER` | Arms the **emergency destruct sequence**: a full-screen countdown with a tick that rises in pitch. Type `OVERRIDE` to abort before it reaches zero. |
| `ROLL D20` | Rolls the dice. A natural 1 trips the **danger klaxon**; a natural 20 sounds the **all-clear**. |
| `JONESY` | The ship's cat is accounted for. |
| `DEBUG` | A tongue-in-cheek self-diagnostic that reads real live values (viewport, palette, uptime) and wraps them in Nostromo flavour. |
| `SOUND BOARD` | A playable board of every sound effect, revealed one pad at a time. |
| `↑ ↑ ↓ ↓ …` | The Konami code flips the palette to **Sevastopol**: *"PALETTE OVERRIDE ACCEPTED. WELCOME TO SEVASTOPOL STATION."* |

Every sound is **original synthesis** — boot drones, key clicks, the klaxon, the
countdown tick — authored with the Web Audio API via Howler. No sampled or
copyrighted film audio is used.

![SPECIAL ORDER 937 amended on screen](docs/media/special-order-937.png)

## Under the hood

- **[TanStack Start](https://tanstack.com/start)** (React 19, Vite) — file-based
  routes, SSR + prerender, server functions. The terminal is
  progressively-enhanced: it renders complete on the server, then comes alive on
  the client.
- A **hand-rolled terminal engine** — a small set of self-timing primitives
  (`Typewriter` / `TypeSequence` / `Staged`) that type content line by line at
  per-line speeds, with holds, pauses and mid-line "morphs".
- A **typed content model** (`src/content/*`, Zod-validated): one source of truth
  feeds the terminal, `/cv`, JSON-LD and the generated PDF/OG images.
- **CSS custom-property design tokens** (Tailwind v4) for the three palettes —
  phosphor colour, glow, scanlines, caution amber, alert red.
- Self-hosted **VT323** and **IBM Plex Mono** (both OFL).
- **Cloudflare Workers** via GitHub Actions; **Vitest** (unit) + **Playwright**
  (end-to-end) gate every change.

## Run it locally

```sh
pnpm install        # Node >= 22 (see .nvmrc)
pnpm dev            # http://localhost:9370
```

Ports nod to **Special Order 937**: dev on `9370`, Playwright on `9371`
(override with `E2E_PORT`).

| Command | What it does |
| --- | --- |
| `pnpm dev` | Dev server (SSR) on port 9370 |
| `pnpm build` | Production build |
| `pnpm preview` | Preview the production build |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm lint` | ESLint |
| `pnpm check` / `pnpm format` | Prettier check / write + `eslint --fix` |
| `pnpm test` | Vitest (unit) |
| `pnpm test:e2e` | Playwright (boots the dev server) |
| `pnpm generate:assets` | Regenerate the PDF résumé + per-route OG images |

### Project layout

```
src/
  routes/           file-based routes (__root.tsx shell, the six queries, /cv)
  terminal/         the terminal engine, console, queries, easter eggs, audio
  components/muthur/ the MU/TH/UR Interface component library
  content/          typed, Zod-validated content collections
  styles/           fonts + the MU/TH/UR design tokens
e2e/                Playwright specs
.github/workflows/  CI (verify + deploy)
```

## Deploy

CI (`.github/workflows/ci.yml`) runs lint, typecheck, format, unit and e2e tests
and the build on every PR. On merge to `main` it runs `pnpm run deploy`
(`vite build` + `wrangler deploy`) to Cloudflare Workers. The deploy job is
gated on two repository secrets (`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`);
the `verify` job runs without them. **Production is
[`https://dev.sjhomer.com`](https://dev.sjhomer.com)** — a Cloudflare Workers
custom domain; PRs get their own per-version preview URL.

## Colophon

Fonts **VT323** and **IBM Plex Mono** under the SIL Open Font License. *Alien*,
the Nostromo, MU/TH/UR and Sevastopol Station are the creations of their
respective rights holders; this is an unaffiliated fan tribute and personal
portfolio. All sound effects are original.

— built by [S.J. Homer](https://dev.sjhomer.com). Query `TRANSMIT` to open a channel.

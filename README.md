# dev.sjhomer.com — MU/TH/UR 6000 crew file

A diegetic portfolio for **S.J. Homer, Head of Engineering**. The visitor boots
the Nostromo's MU/TH/UR 6000 and queries it for crew file `SJHOMER`; every
answer types back line by line. The terminal _is_ the navigation, not a skin
over a normal site.

> **Status: Foundation (release `v0-1`).** This scaffold stands up the app,
> design tokens, fonts, tests and the Cloudflare deploy pipeline, with a
> placeholder boot banner. The terminal engine, content model, `/cv` and the
> rest follow in later changes. See the solution plan and roadmap for the full
> picture.

## Stack

- **[TanStack Start](https://tanstack.com/start)** (React 19, Vite 8) — file
  based routes, SSR + prerender, server functions.
- **TypeScript** (strict). **Tailwind CSS v4** + CSS custom-property design
  tokens (the `MU/TH/UR Interface` system: three palettes — `mother`,
  `sevastopol`, `hardcopy`).
- Self-hosted **VT323** and **IBM Plex Mono** (both OFL) via `@fontsource`.
- **Vitest** (unit, jsdom) + **Playwright** (end-to-end).
- Deployed to **Cloudflare Workers** via GitHub Actions.

## Develop

```sh
pnpm install        # Node >= 22 (see .nvmrc), pnpm (see packageManager)
pnpm dev            # http://localhost:9370
```

Ports nod to **Special Order 937**: dev on `9370`, Playwright on `9371`
(override with `E2E_PORT`). Both stay clear of the usual `3000`.

| Command                | What it does                                  |
| ---------------------- | --------------------------------------------- |
| `pnpm dev`             | Dev server (SSR) on port 9370                 |
| `pnpm build`           | Production build                              |
| `pnpm preview`         | Preview the production build                  |
| `pnpm typecheck`       | `tsc --noEmit`                                |
| `pnpm lint`            | ESLint                                        |
| `pnpm check`           | Prettier format check                         |
| `pnpm format`          | Prettier write + `eslint --fix`               |
| `pnpm test`            | Vitest (unit)                                 |
| `pnpm test:e2e`        | Playwright (end-to-end; boots the dev server) |
| `pnpm generate-routes` | Regenerate `src/routeTree.gen.ts`             |

## Project layout

```
src/
  routes/           file-based routes (__root.tsx shell, index.tsx)
  styles.css        fonts + tokens + Tailwind + token-driven base
  styles/tokens.css the MU/TH/UR design tokens (generated from tokens.json)
  test/setup.ts     Vitest + jest-dom setup
e2e/                Playwright specs
.github/workflows/  CI (verify + deploy)
```

## Deploy

CI (`.github/workflows/ci.yml`) runs lint, typecheck, format, unit and e2e tests
and the build on every PR. On merge to `main` it runs `pnpm run deploy`
(`vite build` + `wrangler deploy`) to Cloudflare Workers.

The deploy step is **gated on two GitHub Actions secrets** you add once:

1. In the Cloudflare dashboard, create an **API token** with the
   _Edit Cloudflare Workers_ template (and note your **Account ID**).
2. In GitHub → **Settings → Secrets and variables → Actions**, add:
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`

Until those exist the `verify` job still runs; only the `deploy` job needs them.
The Worker is named `dev-sjhomer-com` (see `wrangler.jsonc`) and serves at its
`*.workers.dev` URL. The `dev.sjhomer.com` custom domain is pointed at the
Worker **after phase 2**, once the terminal and `/cv` reach parity with the
legacy page (the roadmap's "domain cutover").

## Design sources

- **Architecture / solution plan** and **roadmap** — the living plan doc.
- **Design system** — `MU/TH/UR Interface` (tokens + 15 component contracts).
- **Mockup** — the interactive terminal reference.

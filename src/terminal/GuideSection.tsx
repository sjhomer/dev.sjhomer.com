import * as React from 'react'
import { Link } from '@tanstack/react-router'
import {
  Alert,
  Divider,
  KeyCap,
  Metric,
  ProgressBar,
  Tag,
} from '../components/muthur'
import { Knob } from './Knob'
import './guide.css'

/**
 * /guide — the MU/TH/UR Interface design manual. A static reference page (not a
 * typed terminal view) documenting the design system *as the final site uses
 * it*, with live swatches and real components. It inherits the active palette,
 * so the Thm. knob in the header restyles the whole manual in place.
 */

interface Swatch {
  token: string
  hex: string
  note: string
}
interface PaletteSpec {
  id: string
  name: string
  note: string
  swatches: Array<Swatch>
}

const PALETTES: Array<PaletteSpec> = [
  {
    id: 'mother',
    name: 'GREEN',
    note: 'Default · the Nostromo',
    swatches: [
      { token: '--phosphor', hex: '#4dff88', note: 'primary' },
      { token: '--phosphor-dim', hex: '#2fb35a', note: 'secondary' },
      { token: '--phosphor-faint', hex: '#124d26', note: 'hairlines' },
      { token: '--caution', hex: '#ffd23f', note: 'metrics' },
      { token: '--alert', hex: '#ff4f3f', note: 'danger' },
      { token: '--crt-void', hex: '#020a04', note: 'ground' },
    ],
  },
  {
    id: 'sevastopol',
    name: 'AMBER',
    note: 'Konami · Sevastopol Station',
    swatches: [
      { token: '--phosphor', hex: '#ffb43a', note: 'primary' },
      { token: '--phosphor-dim', hex: '#c27f12', note: 'secondary' },
      { token: '--phosphor-faint', hex: '#54360a', note: 'hairlines' },
      { token: '--caution', hex: '#fff1a8', note: 'metrics' },
      { token: '--alert', hex: '#ff5a3c', note: 'danger' },
      { token: '--crt-void', hex: '#0b0702', note: 'ground' },
    ],
  },
  {
    id: 'hardcopy',
    name: 'PAPER',
    note: '/cv · print, effects off',
    swatches: [
      { token: '--phosphor', hex: '#14251a', note: 'ink' },
      { token: '--phosphor-dim', hex: '#4c5e51', note: 'secondary' },
      { token: '--phosphor-faint', hex: '#cfcabb', note: 'hairlines' },
      { token: '--caution', hex: '#7d5800', note: 'metrics' },
      { token: '--alert', hex: '#b3261e', note: 'danger' },
      { token: '--crt-void', hex: '#f1eee4', note: 'paper' },
    ],
  },
]

const TYPE_SPECS: Array<{ cls: string; label: string; sample: string }> = [
  { cls: 'mu-g-t-dxl', label: 'Display XL · VT323 · 88/0.95', sample: 'MU/TH/UR' },
  { cls: 'mu-g-t-dl', label: 'Display L · VT323 · 56/1', sample: 'SPECIAL ORDER 937' },
  { cls: 'mu-g-t-h', label: 'Heading · VT323 · 32/1.1 · .04em', sample: 'Service Log' },
  { cls: 'mu-g-t-body', label: 'Body · IBM Plex Mono · 16/26', sample: 'Every answer types back line by line.' },
  { cls: 'mu-g-t-log', label: 'Log · IBM Plex Mono · 15/24', sample: 'HEAD OF ENGINEERING · 2024 → PRESENT' },
  { cls: 'mu-g-t-label', label: 'Label · IBM Plex Mono · 12 · .12em · 500', sample: 'PALETTE · EFFECTS · VOLUME' },
]

const SPACES: Array<[string, number]> = [
  ['--space-1', 4],
  ['--space-2', 8],
  ['--space-3', 12],
  ['--space-4', 16],
  ['--space-6', 24],
  ['--space-8', 32],
  ['--space-12', 48],
]

const CADENCE: Array<[string, string]> = [
  ['--cps-prose', '90 cps · prose typing'],
  ['--cps-log', '240 cps · log / system lines'],
  ['--pause-line', '120ms · between lines'],
  ['--pause-block', '400ms · between blocks'],
  ['--cursor-blink', '1060ms · cursor'],
  ['--boot-length', '4000ms · boot sequence'],
]

function GuideHead({
  n,
  title,
  lead,
}: {
  n: string
  title: string
  lead: string
}): React.ReactElement {
  return (
    <div className="mu-g-head">
      <h2 id={`guide-s${n}`} className="mu-g-h">
        <span className="mu-g-h-n" aria-hidden="true">
          §{n}
        </span>{' '}
        {title}
      </h2>
      <p className="mu-g-lead">{lead}</p>
    </div>
  )
}

export function GuideSection(): React.ReactElement {
  return (
    <article className="mu-guide" aria-label="MU/TH/UR Interface design manual">
      <header className="mu-g-masthead">
        <p className="mu-g-kicker">MU/TH/UR INTERFACE · TECHNICAL MANUAL</p>
        <h1 className="mu-g-title">DESIGN&nbsp;MANUAL</h1>
        <p className="mu-g-sub">
          The design system behind <strong>dev.sjhomer.com</strong>, documented
          against the shipped site. It began as a concept artifact — a token set
          and ~15 component contracts — and much of it survived to launch; this
          page is the living record of what the site actually runs, rendered in
          whatever palette is active across the site.
        </p>
      </header>

      <section aria-labelledby="guide-s1">
        <GuideHead
          n="1"
          title="Palettes"
          lead="One set of token names, three palettes. Colour is selected with [data-palette] on the root; non-colour tokens are palette-invariant."
        />
        <div className="mu-g-palettes">
          {PALETTES.map((p) => (
            <div key={p.id} className="mu-g-palette" data-palette={p.id}>
              <div className="mu-g-palette-card">
                <div className="mu-g-palette-name">{p.name}</div>
                <div className="mu-g-palette-note">{p.note}</div>
                <ul className="mu-g-swatches">
                  {p.swatches.map((s) => (
                    <li key={s.token} className="mu-g-swatch">
                      <span
                        className="mu-g-chip"
                        style={{ background: `var(${s.token})` }}
                        aria-hidden="true"
                      />
                      <span className="mu-g-chip-meta">
                        <code>{s.token}</code>
                        <span className="mu-g-chip-hex">
                          {s.hex} · {s.note}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="guide-s2">
        <GuideHead
          n="2"
          title="Typography"
          lead="Two families: VT323 for display (the chunky phosphor headers) and IBM Plex Mono for everything read closely."
        />
        <div className="mu-g-type">
          {TYPE_SPECS.map((t) => (
            <div key={t.cls} className="mu-g-type-row">
              <span className={'mu-g-specimen ' + t.cls}>{t.sample}</span>
              <span className="mu-g-type-label">{t.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="guide-s3">
        <GuideHead
          n="3"
          title="Spacing"
          lead="A 4px grid. Layout holds to a 72ch measure and an 880px screen max."
        />
        <ul className="mu-g-spaces">
          {SPACES.map(([token, px]) => (
            <li key={token} className="mu-g-space-row">
              <span
                className="mu-g-space-bar"
                style={{ width: `var(${token})` }}
                aria-hidden="true"
              />
              <code>{token}</code>
              <span className="mu-g-space-px">{px}px</span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="guide-s4">
        <GuideHead
          n="4"
          title="Motion & cadence"
          lead="Content types line by line at per-line speeds read by the engine from tokens. Effects-off and prefers-reduced-motion both collapse motion to instant and drop the glow, scanline and vignette."
        />
        <ul className="mu-g-cadence">
          {CADENCE.map(([token, note]) => (
            <li key={token}>
              <code>{token}</code>
              <span>{note}</span>
            </li>
          ))}
        </ul>
        <p className="mu-g-lead">
          Content types in line by line on the terminal and the reading pages;
          it is instant here on the manual, and instant everywhere under
          reduced motion.
        </p>
      </section>

      <section aria-labelledby="guide-s5">
        <GuideHead
          n="5"
          title="Components"
          lead="The MU/TH/UR Interface library — self-timing type primitives (Typewriter, TypeSequence, Staged) plus the static parts shown here, all live below."
        />
        <div className="mu-g-gallery">
          <div className="mu-g-cell">
            <div className="mu-g-cell-demo">
              <Tag>normal</Tag> <Tag tone="caution">caution</Tag>{' '}
              <Tag tone="alert">alert</Tag>{' '}
              <Tag variant="outline">outline</Tag>
            </div>
            <span className="mu-g-cell-name">Tag</span>
          </div>
          <div className="mu-g-cell">
            <div className="mu-g-cell-demo">
              <Divider label="Section rule" />
            </div>
            <span className="mu-g-cell-name">Divider</span>
          </div>
          <div className="mu-g-cell">
            <div className="mu-g-cell-demo">
              <ProgressBar value={0.94} label="INTEGRITY" cells={14} />
            </div>
            <span className="mu-g-cell-name">ProgressBar</span>
          </div>
          <div className="mu-g-cell">
            <div className="mu-g-cell-demo">
              <Metric value="+50%" label="AI productivity" />
            </div>
            <span className="mu-g-cell-name">Metric</span>
          </div>
          <div className="mu-g-cell">
            <div className="mu-g-cell-demo mu-g-cell-knobs">
              <Knob
                name="Thm."
                value="GREEN"
                positions={3}
                index={0}
                on
                onClick={() => {}}
                ariaLabel="Sample theme knob (demo)"
              />
              <Knob
                name="CRT"
                value="ON"
                positions={2}
                index={1}
                on
                pressed
                onClick={() => {}}
                ariaLabel="Sample CRT knob (demo)"
              />
            </div>
            <span className="mu-g-cell-name">Knob</span>
          </div>
          <div className="mu-g-cell">
            <div className="mu-g-cell-demo mu-g-cell-keys">
              <KeyCap>⌘K</KeyCap> <KeyCap>1</KeyCap> <KeyCap>TAB</KeyCap>{' '}
              <KeyCap>ESC</KeyCap>
            </div>
            <span className="mu-g-cell-name">KeyCap</span>
          </div>
          <div className="mu-g-cell mu-g-cell-wide">
            <div className="mu-g-cell-demo">
              <Alert title="UNAUTHORISED SUBSYSTEM" level="caution">
                <p>Used only with a word — never colour alone.</p>
              </Alert>
            </div>
            <span className="mu-g-cell-name">Alert</span>
          </div>
        </div>
      </section>

      <section aria-labelledby="guide-s6">
        <GuideHead
          n="6"
          title="Sound"
          lead="Every effect is original Web Audio synthesis — no sampled or copyrighted film audio."
        />
        <ul className="mu-g-list">
          <li>
            One sprite of synthesised tones: boot drone, key clicks, the danger
            klaxon, the all-clear, and the self-destruct tick that rises in pitch.
          </li>
          <li>
            Two levels — <code>off</code> / <code>on</code> (gentle at 0.35) — set
            by the <strong>Vol.</strong> knob and remembered across visits.
          </li>
          <li>
            Audio needs a gesture, so a gate asks once on boot; it never plays
            uninvited.
          </li>
        </ul>
      </section>

      <section aria-labelledby="guide-s7">
        <GuideHead
          n="7"
          title="Methodology"
          lead="How the system holds together, and what changed from the concept."
        />
        <ul className="mu-g-list">
          <li>
            <strong>Content-model-driven.</strong> One typed, Zod-validated source
            (<code>src/content</code>) feeds the terminal, the printable{' '}
            <Link className="mu-link" to="/cv">
              /cv
            </Link>
            , JSON-LD and the generated PDF/OG images.
          </li>
          <li>
            <strong>Progressive enhancement.</strong> Every page renders complete
            on the server and works with no JavaScript; typing, audio and the
            knobs enhance on the client.
          </li>
          <li>
            <strong>Accessibility first.</strong> Colour never carries meaning
            alone; motion honours <code>prefers-reduced-motion</code>; controls
            are real buttons with honest labels; focus rings use a distinct hue.
          </li>
          <li>
            <strong>Evolved from the concept.</strong> The three palettes, the
            token names and most component contracts survived. The planned
            "Ask MOTHER" LLM was re-scoped to grounded, canned answers; the
            terminal engine was hand-rolled rather than taken from the bundle;
            and the header gained the analog <strong>knobs</strong>.
          </li>
        </ul>
      </section>

      <footer className="mu-g-foot">
        <Divider label="End of manual" />
        <p>
          A living document — it tracks the shipped site, not a fixed spec.{' '}
          <Link className="mu-link" to="/">
            ◂ Return to MU/TH/UR
          </Link>
        </p>
      </footer>
    </article>
  )
}

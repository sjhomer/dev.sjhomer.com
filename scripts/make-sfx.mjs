/*
 * Offline SFX synthesis — ORIGINAL sounds, no sampled/third-party audio.
 *
 * Writes a single Howler audio sprite:
 *   public/audio/mu-sfx.wav         — one mono 16-bit PCM file, all regions
 *   src/terminal/sfx-sprite.json    — { name: [offsetMs, durationMs] } map
 *
 * The map is consumed by src/terminal/audio.ts, so regenerating here keeps the
 * runtime offsets in sync. Deterministic (seeded noise) → stable output.
 *
 * Run with `pnpm generate:sfx`. No external encoder/ffmpeg required.
 */
import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SR = 22050 // sample rate (Hz); Nyquist 11 kHz is plenty for terminal SFX
const PAD_MS = 120 // silence between sprite regions so playback never bleeds

/** Deterministic PRNG (mulberry32) so the generated file is reproducible. */
function rng(seed) {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const ms = (n) => Math.round((n / 1000) * SR) // ms → samples
/** Exponential decay envelope, 1 → ~0 over `tau` seconds. */
const decay = (t, tau) => Math.exp(-t / tau)

/**
 * Boot cue: a low CRT hum bed, a rising beep sweep, and a relay clunk at the
 * end. ~1.8 s. Original synthesis — evokes a waking mainframe, copies nothing.
 */
function boot() {
  const dur = 1.85
  const n = ms(dur * 1000)
  const out = new Float32Array(n)
  const rand = rng(0x4d555448) // "MUTH"
  for (let i = 0; i < n; i++) {
    const t = i / SR
    // CRT mains hum: 60 Hz + 120 Hz, gentle wobble, soft fade in/out.
    const bed =
      (Math.sin(2 * Math.PI * 60 * t) * 0.55 +
        Math.sin(2 * Math.PI * 120 * t) * 0.3) *
      (0.9 + 0.1 * Math.sin(2 * Math.PI * 1.7 * t))
    const fade = Math.min(1, t / 0.25) * Math.min(1, (dur - t) / 0.4)
    let s = bed * 0.16 * fade
    // Rising beep sweep, ~0.35 s → ~0.95 s: 420 Hz → 1180 Hz.
    if (t > 0.35 && t < 0.95) {
      const u = (t - 0.35) / 0.6
      const freq = 420 + (1180 - 420) * u
      const env = Math.sin(Math.PI * u) // soft in/out
      s += Math.sin(2 * Math.PI * freq * t) * 0.22 * env
    }
    // Relay clunk near the end (~1.45 s): low thud + a short noise transient.
    const rc = t - 1.45
    if (rc > 0 && rc < 0.22) {
      const env = decay(rc, 0.05)
      const thud = Math.sin(2 * Math.PI * 85 * rc) * env
      const click = (rand() * 2 - 1) * decay(rc, 0.012)
      s += thud * 0.3 + click * 0.18
    }
    out[i] = s
  }
  return out
}

/**
 * One mechanical key clack: a sharp noise transient shaped by a fast-decaying
 * low "key" body. `seed`/`center` jitter pitch & brightness between variants.
 */
function clack(seed, bodyHz) {
  const dur = 0.06
  const n = ms(dur * 1000)
  const out = new Float32Array(n)
  const rand = rng(seed)
  let lp = 0
  for (let i = 0; i < n; i++) {
    const t = i / SR
    // Low-passed noise transient (the "tick" of the keycap hitting bottom).
    const white = rand() * 2 - 1
    lp += (white - lp) * 0.45 // simple one-pole LP
    const tick = lp * decay(t, 0.006)
    // Short resonant body (the keycap/plate thunk).
    const body = Math.sin(2 * Math.PI * bodyHz * t) * decay(t, 0.018)
    out[i] = tick * 0.6 + body * 0.35
  }
  return out
}

/** Normalise to a safe peak so nothing clips after summing. */
function normalise(buf, peak = 0.92) {
  let max = 0
  for (const v of buf) max = Math.max(max, Math.abs(v))
  if (max === 0) return
  const g = peak / max
  for (let i = 0; i < buf.length; i++) buf[i] *= g
}

/** Pack regions into one buffer (with silence padding) + a Howler sprite map. */
function pack(regions) {
  const pad = ms(PAD_MS)
  let total = 0
  for (const r of regions) total += r.samples.length + pad
  const buf = new Float32Array(total)
  const sprite = {}
  let cur = 0
  for (const r of regions) {
    normalise(r.samples)
    buf.set(r.samples, cur)
    const offsetMs = Math.round((cur / SR) * 1000)
    const durMs = Math.round((r.samples.length / SR) * 1000)
    sprite[r.name] = [offsetMs, durMs]
    cur += r.samples.length + pad
  }
  return { buf, sprite }
}

/** Float32 [-1,1] → 16-bit PCM WAV (RIFF). */
function toWav(buf) {
  const n = buf.length
  const dataBytes = n * 2
  const out = Buffer.alloc(44 + dataBytes)
  out.write('RIFF', 0)
  out.writeUInt32LE(36 + dataBytes, 4)
  out.write('WAVE', 8)
  out.write('fmt ', 12)
  out.writeUInt32LE(16, 16) // fmt chunk size
  out.writeUInt16LE(1, 20) // PCM
  out.writeUInt16LE(1, 22) // mono
  out.writeUInt32LE(SR, 24)
  out.writeUInt32LE(SR * 2, 28) // byte rate
  out.writeUInt16LE(2, 32) // block align
  out.writeUInt16LE(16, 34) // bits per sample
  out.write('data', 36)
  out.writeUInt32LE(dataBytes, 40)
  for (let i = 0; i < n; i++) {
    const s = Math.max(-1, Math.min(1, buf[i]))
    out.writeInt16LE((s < 0 ? s * 0x8000 : s * 0x7fff) | 0, 44 + i * 2)
  }
  return out
}

const { buf, sprite } = pack([
  { name: 'boot', samples: boot() },
  { name: 'key1', samples: clack(0x1111, 320) },
  { name: 'key2', samples: clack(0x2222, 260) },
  { name: 'key3', samples: clack(0x3333, 390) },
])

await mkdir(resolve(root, 'public/audio'), { recursive: true })
await writeFile(resolve(root, 'public/audio/mu-sfx.wav'), toWav(buf))
// Emit prettier-stable JSON (inline [offset, duration] tuples) so the committed,
// source-imported sprite map stays format-clean across regenerations.
const spriteLines = Object.entries(sprite)
  .map(([k, v]) => `    "${k}": [${v[0]}, ${v[1]}]`)
  .join(',\n')
await writeFile(
  resolve(root, 'src/terminal/sfx-sprite.json'),
  `{\n  "src": "/audio/mu-sfx.wav",\n  "sprite": {\n${spriteLines}\n  }\n}\n`,
)

const kb = (toWav(buf).length / 1024).toFixed(1)
console.log(`mu-sfx.wav written (${kb} KB); sprite:`, sprite)

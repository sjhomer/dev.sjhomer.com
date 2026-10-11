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

/** A bright "digital" tone: fundamental + odd harmonics ≈ a soft square wave. */
function square(phase) {
  return Math.sin(phase) + Math.sin(3 * phase) / 3 + Math.sin(5 * phase) / 5
}

/**
 * MU/TH/UR power-up, ~2.25 s. Layers evoking the Nostromo computer coming
 * online: a low computer-room hum bed, a burst of rapid data-processing blips
 * (the interface "thinking"/streaming), and an ascending three-tone "system
 * online" chime. All original synthesis — copies no sampled audio.
 */
function boot() {
  const dur = 2.25
  const n = ms(dur * 1000)
  const out = new Float32Array(n)
  const rand = rng(0x4d555448) // "MUTH"

  // 1) Computer-room hum bed: 60/120/180 Hz with a slow wobble, soft fades.
  for (let i = 0; i < n; i++) {
    const t = i / SR
    const hum =
      Math.sin(2 * Math.PI * 60 * t) * 0.5 +
      Math.sin(2 * Math.PI * 120 * t) * 0.28 +
      Math.sin(2 * Math.PI * 180 * t) * 0.12
    const wob = 0.9 + 0.1 * Math.sin(2 * Math.PI * 2.3 * t)
    const fade = Math.min(1, t / 0.2) * Math.min(1, (dur - t) / 0.4)
    out[i] += hum * wob * 0.12 * fade
  }

  // 2) Data-processing chatter: rapid bright blips, ~0.15 s → ~1.25 s.
  const blipFreqs = [1180, 1480, 1650, 980, 1850, 1320, 1550]
  let tb = 0.15
  let k = 0
  while (tb < 1.25) {
    const f = blipFreqs[k % blipFreqs.length] * (0.98 + rand() * 0.06)
    const start = ms(tb * 1000)
    const bn = ms(32)
    for (let i = 0; i < bn && start + i < n; i++) {
      const t = i / SR
      const env = Math.min(1, t / 0.001) * decay(t, 0.008)
      out[start + i] += square(2 * Math.PI * f * t) * 0.16 * env
    }
    tb += 0.05 + rand() * 0.035 // ~50–85 ms spacing, slightly irregular
    k++
  }

  // 3) Ascending "system online" chime (C5 → E5 → A5), soft swell per note.
  const chime = [523.25, 659.25, 880.0]
  chime.forEach((f, idx) => {
    const start = ms((1.35 + idx * 0.22) * 1000)
    const cn = ms(380)
    for (let i = 0; i < cn && start + i < n; i++) {
      const t = i / SR
      const ph = 2 * Math.PI * f * t
      const tone = Math.sin(ph) + Math.sin(2 * ph) * 0.22
      const swell = Math.sin(Math.PI * Math.min(1, t / 0.38))
      const atk = Math.min(1, t / 0.008)
      out[start + i] += tone * 0.2 * swell * atk
    }
  })

  return out
}

/**
 * One terminal key "beep" — the Nostromo interface chirps a short bright tone
 * as each character prints, rather than a mechanical clack. A soft square tone
 * with a fast attack and quick decay, plus a tiny contact fizz. `seed`/`freq`
 * give each of the three variants its own pitch so typing chatters.
 */
function keyBeep(seed, freq) {
  const dur = 0.05
  const n = ms(dur * 1000)
  const out = new Float32Array(n)
  const rand = rng(seed)
  for (let i = 0; i < n; i++) {
    const t = i / SR
    const env = Math.min(1, t / 0.001) * decay(t, 0.012)
    const tone = square(2 * Math.PI * freq * t) * 0.5
    const fizz = (rand() * 2 - 1) * decay(t, 0.003) * 0.08
    out[i] = (tone + fizz) * env
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
  { name: 'key1', samples: keyBeep(0x1111, 1180) },
  { name: 'key2', samples: keyBeep(0x2222, 1480) },
  { name: 'key3', samples: keyBeep(0x3333, 1650) },
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

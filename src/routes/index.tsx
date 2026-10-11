import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({ component: Home })

/**
 * Scaffold placeholder. Renders the MU/TH/UR boot banner from the design
 * tokens so the whole path — SSR, fonts, palette, glow — is proven end to end.
 * The real boot sequence, numbered menu and crew-file queries arrive in the
 * Terminal release; the content model and /cv route in their own changes.
 */
export function Home() {
  const boot = [
    'INTERFACE 2037 READY FOR INQUIRY',
    '> MU/TH/UR 6000 .......... ONLINE',
    '> CREW MANIFEST ......... LOADED',
    '> PERSONNEL FILE: HOMER, S.J.  CLEARANCE: COMMAND',
  ]

  return (
    <main
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 'var(--space-6)',
        maxWidth: 'var(--screen-max)',
        margin: '0 auto',
        padding: 'var(--space-6) var(--space-4)',
      }}
    >
      <h1
        style={{
          margin: 0,
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--display-xl-size)',
          lineHeight: 'var(--display-xl-line)',
          fontWeight: 'var(--display-xl-weight)',
          letterSpacing: 'var(--display-xl-track)',
          textTransform: 'uppercase',
          textShadow: 'var(--glow-lg)',
          textWrap: 'balance',
        }}
      >
        MU/TH/UR 6000
      </h1>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-1)',
          maxWidth: 'var(--measure)',
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--body-size)',
          lineHeight: 'var(--body-line)',
        }}
      >
        {boot.map((line) => (
          <p key={line} style={{ margin: 0 }}>
            {line}
          </p>
        ))}
      </div>

      <p
        style={{
          margin: 0,
          maxWidth: 'var(--measure)',
          color: 'var(--phosphor-dim)',
          fontSize: 'var(--caption-size)',
          lineHeight: 'var(--caption-line)',
          letterSpacing: 'var(--label-track)',
          textTransform: 'uppercase',
          textShadow: 'none',
        }}
      >
        Scaffold online. Terminal, menu and crew file pending.
      </p>
    </main>
  )
}

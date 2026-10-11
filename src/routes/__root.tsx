import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'

import appCss from '../styles.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'MU/TH/UR 6000 — S.J. Homer, Head of Engineering' },
      {
        name: 'description',
        content:
          "Query the Nostromo's MU/TH/UR 6000 for the crew file of S.J. Homer: " +
          'two decades of engineering leadership, printed line by line.',
      },
    ],
    links: [{ rel: 'stylesheet', href: appCss }],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    // mother (green) is the default palette; the alternate palettes and the
    // effects toggle are wired in the Atmosphere release.
    <html lang="en" data-palette="mother">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        {import.meta.env.DEV ? <DevTools /> : null}
        <Scripts />
      </body>
    </html>
  )
}

function DevTools() {
  // Router devtools are dev-only so they never ship in the Cloudflare build.
  return null
}

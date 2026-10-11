import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
} from '@tanstack/react-router'

import appCss from '../styles.css?url'
import { Console } from '../terminal/Console'

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
      { property: 'og:type', content: 'website' },
      { property: 'og:site_name', content: 'MU/TH/UR 6000 · S.J. Homer' },
      {
        property: 'og:image',
        content: 'https://dev.sjhomer.com/og/default.png',
      },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'theme-color', content: '#020a04' },
    ],
    links: [{ rel: 'stylesheet', href: appCss }],
  }),
  shellComponent: RootDocument,
})

function RootDocument() {
  return (
    // mother (green) is the default palette; alternates + the effects toggle are
    // applied imperatively by the console (and a boot-time script, later).
    <html lang="en" data-palette="mother">
      <head>
        <HeadContent />
      </head>
      <body>
        <Console>
          <Outlet />
        </Console>
        <Scripts />
      </body>
    </html>
  )
}

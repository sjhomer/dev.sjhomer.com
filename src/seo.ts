/** Per-page metadata: title, description, Open Graph and Twitter tags. */

const SITE = 'https://dev.sjhomer.com'
const TITLE_SUFFIX = 'DEV/SJHOMER/COM'

interface PageMeta {
  title: string
  description: string
  /** OG image basename under /og (e.g. "missions"); defaults to "default". */
  og?: string
  /** Canonical path for og:url (e.g. "/missions"). */
  path?: string
}

export function pageHead(m: PageMeta) {
  const image = `${SITE}/og/${m.og ?? 'default'}.png`
  const url = `${SITE}${m.path ?? ''}`
  const title = `${m.title} — ${TITLE_SUFFIX}`
  return {
    meta: [
      { title },
      { name: 'description', content: m.description },
      { property: 'og:title', content: title },
      { property: 'og:description', content: m.description },
      { property: 'og:image', content: image },
      { property: 'og:url', content: url },
    ],
  }
}

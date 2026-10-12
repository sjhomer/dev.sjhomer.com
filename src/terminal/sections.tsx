import * as React from 'react'
import {
  DataRow,
  Divider,
  Metric,
  Staged,
  Tag,
  Typewriter,
  TypeSequence,
} from '../components/muthur'
import {
  missions,
  personal,
  profile,
  roles,
  skills,
  transmissions,
} from '../content'

const YEARS = String(
  new Date().getUTCFullYear() - Number(profile.inServiceSince),
)

export function DossierSection(): React.ReactElement {
  const head = roles[0]
  return (
    <Staged className="mu-section">
      <Typewriter as="h1" variant="display" text="DOSSIER" />
      <DataRow label="OFFICER" value={profile.displayName} />
      <DataRow label="POST" value={profile.title} />
      <DataRow label="EMPLOYER" value={head.company} />
      <DataRow label="IN SERVICE SINCE" value={profile.inServiceSince} />
      <DataRow label="STATION" value={profile.station} />
      <DataRow
        label="CLEARANCE"
        value={<Tag tone="caution">{profile.clearance}</Tag>}
      />
      <Divider />
      {profile.summary.map((p, i) => (
        <Typewriter key={i} text={p} />
      ))}
      <div className="mu-metrics">
        <Metric value="-40%" label="Infrastructure cost" />
        <Metric value="+50%" label="Engineering productivity with AI" />
        <Metric value={`${YEARS}+`} label="Years in the digital space" />
      </div>
      <Typewriter text={profile.mission} tone="caution" />
      <Typewriter
        text="QUERY SERVICE LOG FOR THE FULL RECORD."
        tone="dim"
        cps={240}
      />
    </Staged>
  )
}

interface Employer {
  company: string
  key: string
  location?: string
  roles: typeof roles
}

function employerKey(company: string): string {
  return company.split(/[\s(]/)[0].toUpperCase()
}

function groupByEmployer(): Array<Employer> {
  const out: Array<Employer> = []
  for (const r of roles) {
    let g = out.find((e) => e.company === r.company)
    if (!g) {
      g = {
        company: r.company,
        key: employerKey(r.company),
        location: r.location,
        roles: [],
      }
      out.push(g)
    }
    g.roles.push(r)
  }
  return out
}

export function ServiceLogSection({
  filter,
  onFilter,
}: {
  filter?: string
  onFilter?: (key: string) => void
}): React.ReactElement {
  const key = (filter || '').replace(/\s+/g, '').toUpperCase()
  const employers = groupByEmployer()
  const shown = key
    ? employers.filter(
        (e) =>
          e.key.startsWith(key) ||
          e.company.toUpperCase().replace(/\s+/g, '').startsWith(key),
      )
    : employers

  const tab = (tabKey: string, label: string, active: boolean) => (
    <a
      key={tabKey || 'all'}
      href={tabKey ? `/log?f=${tabKey}` : '/log'}
      className="mu-emp-tab"
      data-active={active ? 'true' : undefined}
      onClick={(e) => {
        if (onFilter) {
          e.preventDefault()
          onFilter(tabKey)
        }
      }}
    >
      {label}
    </a>
  )

  const subtitle = key
    ? `FILTER: ${key}`
    : `2005 → PRESENT · ${roles.length} RECORDS ACROSS ${employers.length} POSTINGS`

  return (
    <div className="mu-section">
      {/* The header animates once and then stays put: it is NOT re-keyed by the
          filter, so switching filters updates the subtitle text and the active
          tab in place rather than rebuilding (which was jarring). The subtitle
          is a plain line (not typed) so a filter change swaps it silently. On
          desktop the subtitle + filters sit right of the title. */}
      <Staged className="mu-log-head">
        <Typewriter as="h1" variant="display" text="SERVICE LOG" />
        <div className="mu-log-head-aside">
          <p className="mu-type mu-tone-dim">{subtitle}</p>
          <nav className="mu-emp-tabs" aria-label="Filter by employer">
            {tab('', 'ALL', !key)}
            {employers.map((e) =>
              tab(e.key, e.key, Boolean(key) && e.key.startsWith(key)),
            )}
          </nav>
        </div>
      </Staged>

      {/* Only the records re-run on a filter change (runKey = the filter), so
          the typing restarts for the new view while the header holds steady. */}
      <Staged className="mu-log-records" runKey={key || 'all'}>
        {shown.length ? (
          shown.map((e) => {
            const oldest = e.roles[e.roles.length - 1]
            const newest = e.roles[0]
            const span = `${monthYear(oldest.start)} → ${newest.end ? monthYear(newest.end) : 'PRESENT'}`
            return (
              <Staged key={e.key} className="mu-employer">
                {/* Every heading is its own staged step too — so the record
                    truly prints one line at a time (company, then its dates,
                    then the first role's title, then each highlight …) instead
                    of the headings appearing in a burst ahead of the lines.
                    Each nested Staged starts fully shown, so SSR / no-JS still
                    get the whole record. */}
                <Staged className="mu-employer-head">
                  <Typewriter
                    as="h3"
                    className="mu-employer-name"
                    text={e.company}
                  />
                  <Typewriter
                    className="mu-employer-meta"
                    tone="dim"
                    cps={240}
                    text={`${span}${e.location ? ` · ${e.location}` : ''}${
                      newest.remote ? ' · REMOTE' : ''
                    }`}
                  />
                </Staged>
                {e.roles.map((r) => (
                  <Staged key={r.id} className="mu-pos">
                    <Staged className="mu-pos-head">
                      <Typewriter
                        as="h4"
                        className="mu-pos-title"
                        text={r.title}
                      />
                      <span className="mu-pos-dates">
                        {monthYear(r.start)} –{' '}
                        {r.end ? monthYear(r.end) : 'Present'}
                      </span>
                      <Tag
                        tone={
                          r.clearance === 'COMMAND'
                            ? 'caution'
                            : r.clearance === 'ARCHIVED'
                              ? 'dim'
                              : 'normal'
                        }
                      >
                        {r.clearance}
                      </Tag>
                    </Staged>
                    <Staged className="mu-log-list">
                      {r.highlights.map((h, i) => (
                        <Typewriter
                          key={i}
                          text={`${h.metric ?? '■'} ${h.text}`}
                          cps={400}
                        />
                      ))}
                    </Staged>
                  </Staged>
                ))}
              </Staged>
            )
          })
        ) : (
          <Typewriter
            text={`NO RECORD FOR "${key}". TRY LOG BATTLEFY, LOG THEREFORE, LOG RC OR LOG STEELSERIES.`}
            tone="alert"
          />
        )}
        <Divider label="End of file" />
      </Staged>
    </div>
  )
}

export function MissionsSection(): React.ReactElement {
  return (
    <Staged className="mu-section">
      <Typewriter as="h1" variant="display" text="MISSIONS" />
      <Typewriter text="CASE STUDIES ON RECORD" tone="dim" cps={240} />
      {missions.map((m) => (
        <Staged key={m.id} className="mu-mission">
          <div className="mu-log-meta">
            <span>MISSION · {m.era ?? 'FIELD'}</span>
            {m.metric ? <Tag tone="caution">{m.metric}</Tag> : null}
          </div>
          <h3 className="mu-log-title">{m.title}</h3>
          <Typewriter text={m.brief} />
          {m.tech.length ? (
            <div className="mu-row">
              {m.tech.map((t) => (
                <Tag key={t} variant="outline">
                  {t}
                </Tag>
              ))}
            </div>
          ) : null}
          {m.link || m.links?.length ? (
            <p className="mu-type mu-mission-links">
              {[
                ...(m.link
                  ? [
                      {
                        label: m.link
                          .replace(/^https?:\/\//, '')
                          .replace(/\/$/, ''),
                        href: m.link,
                      },
                    ]
                  : []),
                ...(m.links ?? []),
              ].map((l, i) => (
                <React.Fragment key={l.href}>
                  {i > 0 ? <span aria-hidden="true"> · </span> : null}
                  <a
                    className="mu-link"
                    href={l.href}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {l.label}
                    <span className="mu-sr"> (opens in new tab)</span>
                  </a>
                </React.Fragment>
              ))}
            </p>
          ) : null}
        </Staged>
      ))}
      <Divider label="End of file" />
    </Staged>
  )
}

export function SystemsSection(): React.ReactElement {
  return (
    <Staged className="mu-section">
      <Typewriter as="h1" variant="display" text="SYSTEMS" />
      <Typewriter text="CAPABILITIES ON RECORD" tone="dim" cps={240} />
      {skills.map((g) => (
        <div key={g.group} style={{ display: 'grid', gap: 'var(--space-2)' }}>
          <Divider label={g.group} />
          <div className="mu-row">
            {g.items.map((item) => (
              <Tag key={item} variant="outline">
                {item}
              </Tag>
            ))}
          </div>
        </div>
      ))}
    </Staged>
  )
}

export function QuartersSection(): React.ReactElement {
  return (
    <Staged className="mu-section">
      <Typewriter as="h1" variant="display" text="CREW QUARTERS" />
      <Typewriter text="OFF-DUTY RECORD" tone="dim" cps={240} />
      <Typewriter text={personal.intro} />
      <TypeSequence
        lines={personal.items.map((text) => ({ text: '■ ' + text }))}
      />
      {personal.creative.length ? <Divider label="Creative works" /> : null}
      {personal.creative.map((c) => (
        // A nested Staged per work (like the missions) so the block reveals in
        // sequence and its description types in through the line renderer,
        // rather than appearing all at once as static text.
        <Staged key={c.title} className="mu-log">
          <Typewriter as="h3" className="mu-log-title" text={c.title} />
          <Typewriter text={c.description} />
          {c.link ? (
            <p className="mu-type">
              <a
                className="mu-link"
                href={c.link}
                target="_blank"
                rel="noopener noreferrer"
              >
                {c.link.replace(/^https?:\/\//, '')}
              </a>
            </p>
          ) : null}
        </Staged>
      ))}
    </Staged>
  )
}

export function TransmitSection(): React.ReactElement {
  return (
    <Staged className="mu-section">
      <Typewriter as="h1" variant="display" text="TRANSMIT" />
      <Typewriter text="OPENING CHANNEL..." tone="dim" cps={240} />
      {transmissions.channels.map((c) => (
        <DataRow
          key={c.label}
          label={c.label.toUpperCase()}
          value={
            <a
              className="mu-link"
              href={c.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              {c.href.replace(/^https?:\/\//, '').replace(/\/$/, '')}
            </a>
          }
        />
      ))}
      <div className="mu-cta-row">
        <a className="mu-cta" href="/cv">
          ▸ VIEW CV
        </a>
        <a className="mu-cta" href="/sjhomer-resume.pdf" download>
          ↓ DOWNLOAD RESUME
        </a>
      </div>
      <Typewriter text={transmissions.signoff} tone="caution" />
    </Staged>
  )
}

function monthYear(ym: string): string {
  const [y, m] = ym.split('-').map(Number)
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ]
  return `${months[(m || 1) - 1]} ${y}`
}

export function CvSection(): React.ReactElement {
  const employers = groupByEmployer()
  return (
    <article className="mu-cv">
      <header className="mu-cv-head">
        <h1>{profile.name}</h1>
        <p className="mu-cv-sub">
          {profile.title} · {profile.station}
        </p>
        <p className="mu-cv-links">
          {transmissions.channels.map((c, i) => (
            <React.Fragment key={c.label}>
              {i > 0 ? '  ·  ' : ''}
              <a href={c.href}>
                {c.href.replace(/^https?:\/\//, '').replace(/\/$/, '')}
              </a>
            </React.Fragment>
          ))}
        </p>
        <p className="mu-cv-download">
          <a className="mu-cta" href="/sjhomer-resume.pdf" download>
            ↓ Download PDF
          </a>
        </p>
      </header>

      <section className="mu-cv-summary">
        {profile.summary.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </section>

      <h3>Experience</h3>
      {employers.map((e) => {
        const oldest = e.roles[e.roles.length - 1]
        const newest = e.roles[0]
        return (
          <section key={e.key} className="mu-cv-emp">
            <div className="mu-cv-emp-head">
              <span className="mu-cv-emp-name">
                {e.company}
                {e.location ? ` · ${e.location}` : ''}
              </span>
              <span className="mu-cv-role-dates">
                {monthYear(oldest.start)} –{' '}
                {newest.end ? monthYear(newest.end) : 'Present'}
              </span>
            </div>
            {e.roles.map((r) => (
              <div key={r.id} className="mu-cv-role">
                <div className="mu-cv-role-head">
                  <span className="mu-cv-role-title">{r.title}</span>
                  <span className="mu-cv-role-dates">
                    {monthYear(r.start)} –{' '}
                    {r.end ? monthYear(r.end) : 'Present'}
                  </span>
                </div>
                <ul>
                  {r.highlights.map((h, i) => (
                    <li key={i}>{(h.metric ? `${h.metric} ` : '') + h.text}</li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        )
      })}

      <h3>Skills</h3>
      <ul className="mu-cv-skills">
        {skills.map((g) => (
          <li key={g.group}>
            <strong>{g.group}:</strong> {g.items.join(', ')}
          </li>
        ))}
      </ul>

      <h3>Interests</h3>
      <p>{personal.items.join(' ')}</p>
    </article>
  )
}

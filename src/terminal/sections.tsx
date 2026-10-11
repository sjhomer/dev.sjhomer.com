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
      <Typewriter as="h2" variant="display" text="DOSSIER" />
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
      <TypeSequence lines={profile.summary.map((text) => ({ text }))} />
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

  return (
    <Staged className="mu-section">
      <Typewriter as="h2" variant="display" text="SERVICE LOG" />
      <Typewriter
        text={
          key
            ? `FILTER: ${key}`
            : `2005 → PRESENT · ${roles.length} RECORDS ACROSS ${employers.length} POSTINGS`
        }
        tone="dim"
        cps={240}
      />
      <nav className="mu-emp-tabs" aria-label="Filter by employer">
        {tab('', 'ALL', !key)}
        {employers.map((e) =>
          tab(e.key, e.key, Boolean(key) && e.key.startsWith(key)),
        )}
      </nav>

      {shown.length ? (
        shown.map((e) => {
          const oldest = e.roles[e.roles.length - 1]
          const newest = e.roles[0]
          const span = `${monthYear(oldest.start)} → ${newest.end ? monthYear(newest.end) : 'PRESENT'}`
          return (
            <section key={e.key} className="mu-employer">
              <header className="mu-employer-head">
                <h3 className="mu-employer-name">{e.company}</h3>
                <p className="mu-employer-meta">
                  {span}
                  {e.location ? ` · ${e.location}` : ''}
                  {newest.remote ? ' · REMOTE' : ''}
                </p>
              </header>
              {e.roles.map((r) => (
                <article key={r.id} className="mu-pos">
                  <div className="mu-pos-head">
                    <h4 className="mu-pos-title">{r.title}</h4>
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
                  </div>
                  <ul className="mu-log-list">
                    {r.highlights.map((h, i) => (
                      <li key={i} className="mu-log-item">
                        {h.metric ? (
                          <span className="mu-log-metric">{h.metric}</span>
                        ) : (
                          <span className="mu-log-bullet" aria-hidden="true">
                            ■
                          </span>
                        )}
                        <span>{h.text}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </section>
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
  )
}

export function MissionsSection(): React.ReactElement {
  return (
    <Staged className="mu-section">
      <Typewriter as="h2" variant="display" text="MISSIONS" />
      <Typewriter text="CASE STUDIES ON RECORD" tone="dim" cps={240} />
      {missions.map((m) => (
        <section
          key={m.id}
          className="mu-log"
          style={{ borderTopStyle: 'dashed' }}
        >
          <div className="mu-log-meta">
            <span>MISSION · {m.era ?? 'FIELD'}</span>
            {m.metric ? <Tag tone="caution">{m.metric}</Tag> : null}
          </div>
          <h3 className="mu-log-title">{m.title}</h3>
          <p className="mu-type">{m.brief}</p>
          {m.tech.length ? (
            <div className="mu-row">
              {m.tech.map((t) => (
                <Tag key={t} variant="outline">
                  {t}
                </Tag>
              ))}
            </div>
          ) : null}
          {m.link ? (
            <p className="mu-type">
              <a
                className="mu-link"
                href={m.link}
                target="_blank"
                rel="noopener noreferrer"
              >
                {m.link.replace(/^https?:\/\//, '').replace(/\/$/, '')}
              </a>
            </p>
          ) : null}
        </section>
      ))}
      <Divider label="End of file" />
    </Staged>
  )
}

export function SystemsSection(): React.ReactElement {
  return (
    <Staged className="mu-section">
      <Typewriter as="h2" variant="display" text="SYSTEMS" />
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
      <Typewriter as="h2" variant="display" text="CREW QUARTERS" />
      <Typewriter text="OFF-DUTY RECORD" tone="dim" cps={240} />
      <Typewriter text={personal.intro} />
      <TypeSequence
        lines={personal.items.map((text) => ({ text: '■ ' + text }))}
      />
      {personal.creative.length ? (
        <>
          <Divider label="Creative works" />
          {personal.creative.map((c) => (
            <section
              key={c.title}
              className="mu-log"
              style={{ borderTopStyle: 'dashed' }}
            >
              <h3 className="mu-log-title">{c.title}</h3>
              <p className="mu-type">{c.description}</p>
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
            </section>
          ))}
        </>
      ) : null}
    </Staged>
  )
}

export function TransmitSection(): React.ReactElement {
  return (
    <Staged className="mu-section">
      <Typewriter as="h2" variant="display" text="TRANSMIT" />
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
  return (
    <article className="mu-cv">
      <header className="mu-cv-head">
        <h2>{profile.name}</h2>
        <p>
          {profile.title} · {profile.station}
        </p>
        <p className="mu-cv-links">
          {transmissions.channels.map((c, i) => (
            <React.Fragment key={c.label}>
              {i > 0 ? ' · ' : ''}
              <a href={c.href}>
                {c.href.replace(/^https?:\/\//, '').replace(/\/$/, '')}
              </a>
            </React.Fragment>
          ))}
        </p>
        <p className="mu-cv-links">
          <a href="/sjhomer-resume.pdf" download>
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
      {roles.map((r) => (
        <section key={r.id} className="mu-cv-role">
          <div className="mu-cv-role-head">
            <span className="mu-cv-role-title">
              {r.title}, {r.company}
              {r.location ? ` · ${r.location}` : ''}
            </span>
            <span className="mu-cv-role-dates">
              {monthYear(r.start)} – {r.end ? monthYear(r.end) : 'Present'}
            </span>
          </div>
          <ul>
            {r.highlights.map((h, i) => (
              <li key={i}>{(h.metric ? `${h.metric} ` : '') + h.text}</li>
            ))}
          </ul>
        </section>
      ))}

      <h3>Interests</h3>
      <p>
        {personal.items
          .map((s) => s.replace(/^I\s/, '').replace(/^I’m\s/, ''))
          .join(' ')}
      </p>
    </article>
  )
}

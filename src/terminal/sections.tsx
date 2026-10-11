import * as React from 'react'
import {
  DataRow,
  Divider,
  LogEntry,
  Metric,
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

function Title({ children }: { children: string }) {
  return <Typewriter as="h2" variant="display" text={children} />
}

export function DossierSection(): React.ReactElement {
  const head = roles[0]
  return (
    <div className="mu-pad" style={{ padding: 0 }}>
      <Title>DOSSIER</Title>
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
    </div>
  )
}

export function ServiceLogSection({
  filter,
}: {
  filter?: string
}): React.ReactElement {
  const key = (filter || '').replace(/\s+/g, '').toUpperCase()
  const list = key
    ? roles.filter(
        (r) =>
          r.company.toUpperCase().replace(/\s+/g, '').startsWith(key) ||
          r.id
            .toUpperCase()
            .replace(/[^A-Z]/g, '')
            .startsWith(key),
      )
    : roles
  return (
    <div className="mu-pad" style={{ padding: 0 }}>
      <Title>SERVICE LOG</Title>
      <Typewriter
        text={
          key
            ? `FILTER: ${key} · ${list.length} RECORD(S)`
            : `2005 → PRESENT · ${list.length} RECORDS · FILTER WITH LOG <EMPLOYER>`
        }
        tone="dim"
        cps={240}
      />
      {list.length ? (
        list.map((r) => (
          <LogEntry
            key={r.id}
            role={{
              title: r.title,
              company: r.location ? `${r.company} · ${r.location}` : r.company,
              start: r.start,
              end: r.end,
              remote: r.remote,
              clearance: r.clearance,
              highlights: r.highlights,
            }}
          />
        ))
      ) : (
        <Typewriter
          text={`NO RECORD FOR "${key}". TRY LOG BATTLEFY, LOG THEREFORE, LOG RC OR LOG STEELSERIES.`}
          tone="alert"
        />
      )}
      <Divider label="End of file" />
    </div>
  )
}

export function MissionsSection(): React.ReactElement {
  return (
    <div className="mu-pad" style={{ padding: 0 }}>
      <Title>MISSIONS</Title>
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
    </div>
  )
}

export function SystemsSection(): React.ReactElement {
  return (
    <div className="mu-pad" style={{ padding: 0 }}>
      <Title>SYSTEMS</Title>
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
    </div>
  )
}

export function QuartersSection(): React.ReactElement {
  return (
    <div className="mu-pad" style={{ padding: 0 }}>
      <Title>CREW QUARTERS</Title>
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
    </div>
  )
}

export function TransmitSection(): React.ReactElement {
  return (
    <div className="mu-pad" style={{ padding: 0 }}>
      <Title>TRANSMIT</Title>
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
    </div>
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

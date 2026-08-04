import { useState, useEffect } from 'react'
import { Icon, IconPaths } from './icons'

export function NoteBanner({ children }) {
  return (
    <div className="note-banner">
      <Icon size={20}>
        <path d="M12 9v4M12 17h.01" />
        <path d="M10.3 3.9L2.5 17a1.5 1.5 0 001.3 2.2h16.4a1.5 1.5 0 001.3-2.2L13.7 3.9a1.5 1.5 0 00-2.6 0z" />
      </Icon>
      <p>{children}</p>
    </div>
  )
}

export function StatCard({ icon, flagText, flagType = 'ok', value, label, onClick }) {
  const clickable = typeof onClick === 'function'
  return (
    <div 
     className={`stat-card${clickable ? ' clickable' : ''}`}
     onClick={onClick}
     role={clickable ? 'button' : undefined}
     tabIndex={clickable ? 0 : undefined}
     onKeyDown={clickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(e) } } : undefined}
     style={clickable ? { cursor: 'pointer' } : undefined}
    >
      <div className="top-row">
        <div className="icon-wrap">
          <Icon>{icon}</Icon>
        </div>
        <span className={`flag flag-${flagType}`}>{flagText}</span>
      </div>
      <div className="value">{value}</div>
      <div className="label">{label}</div>
    </div>
  )
}

export function Panel({ title, action, children }) {
  return (
    <div className="panel">
      {title && (
        <div className="panel-head">
          <h3>{title}</h3>
          {action}
        </div>
      )}
      {children}
    </div>
  )
}

// status: 'overdue' | 'soon' | 'ok' — controls the pill color.
// label: optional custom text (e.g. "Pending", "Ready", "Unassigned"); otherwise a default per status is used.
// onClick: optional — when present, the row becomes tappable (e.g. to open delivery details).
export function CareRow({ id, type, due, status = 'soon', label, onClick }) {
  const defaults = { overdue: 'Overdue', soon: 'Due soon', ok: 'Up to date' }
  const clickable = typeof onClick === 'function'
  return (
    <div
      className={`care-row${clickable ? ' clickable' : ''}`}
      onClick={onClick}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={clickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(e) } } : undefined}
      style={clickable ? { cursor: 'pointer' } : undefined}
    >
      <span className="care-id mono">{id}</span>
      <div className="care-info">
        <div className="type">{type}</div>
        <div className="due">{due}</div>
      </div>
      <span className={`status-pill status-${status}`}>{label ?? defaults[status] ?? status}</span>
    </div>
  )
}

export function ActivityItem({ text, time }) {
  return (
    <div className="activity-item">
      <span className="activity-dot"></span>
      <div>
        <div className="activity-text">{text}</div>
        <div className="activity-time">{time}</div>
      </div>
    </div>
  )
}

export function InventoryRow({ icon, name, sub, count }) {
  return (
    <div className="farm-item">
      <div className="farm-thumb">
        <Icon>{icon}</Icon>
      </div>
      <div className="farm-detail">
        <div className="fname">{name}</div>
        <div className="floc">{sub}</div>
      </div>
      <span className="farm-count mono">{count}</span>
    </div>
  )
}

export function DashboardPagePlaceholder({ title, description }) {
  return (
    <div className="panel">
      <div className="panel-head">
        <h3>{title}</h3>
      </div>
      <p style={{ fontSize: 13.5, color: 'var(--ink-600)', margin: 0 }}>
        {description ?? `The ${title} page is coming soon.`}
      </p>
    </div>
  )
}

export function TraceabilityLookup({ 
  placeholder = 'e.g. BT-2026-001', 
  helper, 
  buttonLabel = 'Look up animal',
  value,
  onChange,
  onSubmit,
  onLookup
}) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('idle') // idle | loading | ready | error
  const [result, setResult] = useState(null)

  const controlled = value !== undefined && typeof onChange === 'function'

  async function handleSearch() {
    if (onSubmit) {
      onSubmit()
      return
    }
    
    const q = (controlled ? value : query).trim()
    if (!q || status === 'loading') return
    if (!onLookup) {
      setStatus('error')
      setResult(null)
      return
    }
    
    setStatus('loading')
    setResult(null)
    try {
      const data = await onLookup(q)
      setResult(data)
      setStatus('ready')
    } catch {
      setStatus('error')
      setResult(null)
    }
  }

  return (
    <>
      {helper && <p style={{ fontSize: 13, color: 'var(--ink-600)', margin: '0 0 14px' }}>{helper}</p>}
      <div className="field" style={{ marginBottom: 12 }}>
        <input
          type="text"
          placeholder={placeholder}
          {...(controlled
            ? { value, onChange: (e) => onChange(e.target.value) }
            : { value: query, onChange: (e) => setQuery(e.target.value) })}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSearch()
          }}
          style={{
            width: '100%',
            padding: '11px 14px',
            borderRadius: 10,
            border: '1.5px solid var(--border-soft)',
            background: 'var(--page-bg)',
            color: 'var(--ink-900)',
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 13.5,
          }}
        />
      </div>
      <button
        type="button"
        className="btn btn-primary"
        style={{ width: '100%' }}
        onClick={handleSearch}
        disabled={status === 'loading' || !(controlled ? value : query)?.trim()}
      >
        {status === 'loading' ? 'Looking up…' : buttonLabel}
      </button>

      {status === 'loading' && <LoadingState label="Looking up animal…" />}
      {status === 'error' && (
        <ErrorState message="Couldn't find that animal. Check the tag ID and try again." onRetry={handleSearch} />
      )}
      {status === 'ready' && !result && (
        <EmptyState
          icon={IconPaths.search}
          title="No animal found"
          subtitle={`Nothing matched "${controlled ? value : query}". Check the tag ID and try again.`}
        />
      )}
      {status === 'ready' && result && (
        <Panel title={`Animal — ${result.tagId || (controlled ? value : query)}`}>
          <DetailRow label="Farmer" value={result.farmer} />
          <DetailRow label="Breed" value={result.breed} />
          <DetailRow label="Sex" value={result.sex} />
          <DetailRow label="Weight" value={result.weight ? `${result.weight} kg` : '—'} />
          <DetailRow label="Batch" value={result.batch} />
          <DetailRow label="Health" value={result.health} />
          <DetailRow label="Status" value={result.status} />
          <DetailRow label="Last seen" value={result.lastSeen} />
          <DetailRow label="Destination" value={result.destination} />
        </Panel>
      )}
    </>
  )
}

// Thin animated progress bar — pulled out of TransporterDashboard's inline
// version so trip/delivery screens can all share it.
export function ProgressBar({ percent = 0, note }) {
  const clamped = Math.max(0, Math.min(100, percent))
  return (
    <>
      <div style={{ height: 8, borderRadius: 999, background: 'var(--cream-100)', overflow: 'hidden', marginBottom: 8 }}>
        <div style={{ height: '100%', width: `${clamped}%`, background: 'var(--gold-600)', transition: 'width 0.3s ease' }}></div>
      </div>
      {note && <p style={{ fontSize: 11.5, color: 'var(--ink-600)', margin: 0 }}>{note}</p>}
    </>
  )
}

export function DetailRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, padding: '10px 0', borderBottom: '1px solid var(--border-soft)' }}>
      <span style={{ fontSize: 12.5, color: 'var(--ink-600)' }}>{label}</span>
      <span style={{ fontSize: 13.5, color: 'var(--ink-900)', fontWeight: 500, textAlign: 'right' }}>{value || '—'}</span>
    </div>
  )
}

const notificationDotColor = {
  assigned: 'var(--gold-600)',
  reminder: 'var(--rust-600)',
  route_updated: 'var(--gold-600)',
  completed: 'var(--ink-600)',
}

export function NotificationItem({ type = 'assigned', text, time, unread }) {
  return (
    <div className="activity-item">
      <span
        className="activity-dot"
        style={{ background: notificationDotColor[type] || 'var(--gold-600)', opacity: unread ? 1 : 0.4 }}
      ></span>
      <div>
        <div className="activity-text" style={unread ? { fontWeight: 600 } : undefined}>{text}</div>
        <div className="activity-time">{time}</div>
      </div>
    </div>
  )
}

export function LoadingState({ label = 'Loading…' }) {
  return (
    <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--ink-600)', fontSize: 13.5 }}>
      {label}
    </div>
  )
}

export function ErrorState({ message = 'Something went wrong.', onRetry }) {
  return (
    <div style={{ padding: '24px 0', textAlign: 'center' }}>
      <p style={{ color: 'var(--rust-600)', fontSize: 13.5, marginBottom: onRetry ? 10 : 0 }}>{message}</p>
      {onRetry && <button className="btn btn-outline" onClick={onRetry}>Try again</button>}
    </div>
  )
}

export function StepField({ label, placeholder, value, stepNumber, totalSteps, onNext, onBack, onCancel, saving, isLast }) {
  const [inputValue, setInputValue] = useState(value || '')

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setInputValue(value || '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepNumber])

  return (
    <div className="panel">
      <div style={{ fontSize: 11.5, color: 'var(--ink-600)', marginBottom: 6 }}>
        Step {stepNumber} of {totalSteps}
      </div>
      <div style={{ height: 4, borderRadius: 999, background: 'var(--cream-100)', overflow: 'hidden', marginBottom: 22 }}>
        <div style={{ height: '100%', width: `${(stepNumber / totalSteps) * 100}%`, background: 'var(--gold-600)', transition: 'width 0.3s ease' }}></div>
      </div>

      <label style={{ display: 'block', marginBottom: 20 }}>
        <span style={{ display: 'block', fontSize: 14.5, fontWeight: 600, color: 'var(--ink-900)', marginBottom: 10 }}>{label}</span>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={placeholder}
          autoFocus
          onKeyDown={(e) => { if (e.key === 'Enter' && inputValue.trim() && !saving) onNext(inputValue.trim()) }}
          style={{
            width: '100%',
            padding: '13px 14px',
            borderRadius: 10,
            border: '1.5px solid var(--border-soft)',
            background: 'var(--page-bg)',
            color: 'var(--ink-900)',
            fontFamily: 'inherit',
            fontSize: 15,
          }}
        />
      </label>

      <div style={{ display: 'flex', gap: 10 }}>
        {onBack && <button className="btn btn-outline" onClick={onBack} disabled={saving}>Back</button>}
        <button
          className="btn btn-primary"
          disabled={!inputValue.trim() || saving}
          onClick={() => onNext(inputValue.trim())}
          style={{ flex: 1 }}
        >
          {saving ? 'Saving…' : isLast ? 'Save' : 'Next'}
        </button>
        {onCancel && <button className="btn btn-outline" onClick={onCancel} disabled={saving}>Cancel</button>}
      </div>
    </div>
  )
}

export function EmptyState({ icon, title, subtitle }) {
  return (
    <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--ink-600)' }}>
      {icon && (
        <div style={{ marginBottom: 8, opacity: 0.5, display: 'flex', justifyContent: 'center' }}>
          <Icon size={28}>{icon}</Icon>
        </div>
      )}
      <div style={{ fontSize: 14, color: 'var(--ink-900)', fontWeight: 600, marginBottom: 4 }}>{title}</div>
      {subtitle && <div style={{ fontSize: 12.5 }}>{subtitle}</div>}
    </div>
  )
}
//TraceabilityLookupPage.jsx code
import { useState } from 'react'
import { DashboardShell } from './DashboardShell'
import { Icon, IconPaths } from './icons'

// Shared, role-agnostic traceability lookup page — used identically by
// Farmer, Agent, and Veterinary. Each role passes its own identity
// (roleLabel/actorId/name) and its own navItems (built via that role's
// getXNavItems helper), so the drawer nav still shows the right role's menu.
export function TraceabilityLookupPage({ roleLabel, actorId, name, navItems, onGoHome, onLookup, onSeeHistory }) {
  const [value, setValue] = useState('')

  const handleSearch = (e) => {
    e.preventDefault()
    const query = value.trim()
    if (query) onLookup?.(query)
  }

  return (
    <DashboardShell
      roleLabel={roleLabel}
      actorId={actorId}
      name={name}
      navItems={navItems}
      variant="secondary"
      onGoHome={onGoHome}
    >
      <div className="dash-head" style={{ textAlign: 'center', position: 'relative' }}>
        <div>
          <p className="setup-title">Traceability lookup</p>
          <p className="setup-subtitle">
            Want to see the full farm-to-present history?
            Enter the animal BeefTrace ID/RFID number or
            scan the QR code of your product to view.
          </p>
        </div>
        <button className="btn btn-outline" onClick={onSeeHistory} style={{ whiteSpace: 'nowrap' }}>
          See Traceability History
        </button>
      </div>

      <div style={{ maxWidth: 620, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div className="panel">
          <form onSubmit={handleSearch}>
            <label htmlFor="lookup-id" style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--ink-600)', marginBottom: 7 }}>
              Enter animal RFID number or BeefTrace ID
            </label>
            <div style={{ display: 'flex', gap: 10 }}>
              <input
                id="lookup-id"
                type="text"
                placeholder="e.g. BT-000245 or RFID-000245"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                style={{
                  flex: 1, padding: '11px 14px', borderRadius: 10, border: '1.5px solid var(--border-soft)',
                  background: 'var(--page-bg)', color: 'var(--ink-900)', fontFamily: "'IBM Plex Mono', monospace", fontSize: 13.5,
                }}
              />
              <button type="submit" className="icon-btn" style={{ width: 44, height: 44 }} aria-label="Search">
                <Icon size={18}>{IconPaths.search}</Icon>
              </button>
            </div>
          </form>
        </div>

        <div
          className="panel"
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 12 }}
        >
          <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--ink-600)', alignSelf: 'flex-start' }}>
            Scan the QR code
          </label>
          <div
            style={{
              width: 160, height: 160, borderRadius: 16, border: '2px dashed var(--border-soft)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold-600)',
            }}
          >
            <Icon size={54}>{IconPaths.qr}</Icon>
          </div>
          <p style={{ fontSize: 12.5, color: 'var(--ink-600)', margin: 0 }}>Point your camera at a QR code to scan it.</p>
          <button className="btn btn-primary">
            <Icon size={15} style={{ marginRight: 4 }}>{IconPaths.qr}</Icon>Scan QR code
          </button>
        </div>
      </div>
    </DashboardShell>
  )
}

export function TraceabilityHistoryPage({ roleLabel, actorId, name, navItems, onGoHome, history = [], onBack }) {
  return (
    <DashboardShell
      roleLabel={roleLabel}
      actorId={actorId}
      name={name}
      navItems={navItems}
      variant="secondary"
      onGoHome={onGoHome}
    >
      <div className="dash-head">
        <div>
          <p className="setup-title">Traceability history</p>
          <p className="setup-subtitle">Review the BeefTrace IDs and RFID numbers you have looked up.</p>
        </div>
        <button className="btn btn-outline" onClick={onBack}>Back to lookup</button>
      </div>

      <div className="panel" style={{ maxWidth: 760, margin: '0 auto' }}>
        {history.length === 0 ? (
          <p style={{ color: 'var(--ink-600)', fontSize: 13.5, margin: 0 }}>You haven't recorded any traceability lookups yet.</p>
        ) : (
          [...history].reverse().map((entry, index) => (
            <div key={`${entry.value}-${entry.timestamp}-${index}`} className="activity-item">
              <span className="activity-dot"></span>
              <div>
                <div className="activity-text"><b className="mono">{entry.value}</b></div>
                <div className="activity-time">{entry.timestamp}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </DashboardShell>
  )
}

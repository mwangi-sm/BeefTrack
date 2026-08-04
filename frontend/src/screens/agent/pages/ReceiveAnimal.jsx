//ReceiveAnimal.jsx code
import { useState } from 'react'
import { DashboardShell } from '../../../components/DashboardShell'
import { Icon, IconPaths } from '../../../components/icons'
import { getAgentNavItems } from '../data/agentNav'

export function ReceiveAnimal({ onGoHome }) {
  const [value, setValue] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const navItems = getAgentNavItems('', { onGoHome })

  const handleConfirm = (e) => {
    e.preventDefault()
    setConfirmed(true)
  }

  return (
    <DashboardShell
      roleLabel="AGENT"
      actorId="AG-000123"
      name="Samuel Otieno"
      navItems={navItems}
      variant="secondary"
      onGoHome={onGoHome}
    >
      <div className="dash-head">
        <div>
          <p className="eyebrow" style={{ color: 'var(--gold-600)' }}>Agent</p>
          <h1>Receive Animal</h1>
          <p className="sub">Scan or enter the animal's tag to confirm it's arrived at your yard.</p>
        </div>
      </div>

      <div className="panel" style={{ maxWidth: 520 }}>
        <form onSubmit={handleConfirm}>
          <div className="setup-field">
            <label htmlFor="receive-id">Animal RFID number or BeefTrace ID</label>
            <input
              id="receive-id"
              type="text"
              placeholder="e.g. BT-000198 or RFID-000198"
              value={value}
              onChange={(e) => { setValue(e.target.value); setConfirmed(false) }}
              style={{
                width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid var(--border-soft)',
                background: 'var(--page-bg)', color: 'var(--ink-900)', fontFamily: "'IBM Plex Mono', monospace", fontSize: 13.5,
              }}
            />
          </div>
          <button className="btn btn-primary" type="submit" style={{ width: '100%' }}>
            <Icon size={15} style={{ marginRight: 4 }}>{IconPaths.check}</Icon>Confirm receipt
          </button>
        </form>

        {confirmed && value && (
          <div className="onboard-complete" style={{ marginTop: 20 }}>
            <span>{value} marked as received into your yard.</span>
          </div>
        )}
      </div>
    </DashboardShell>
  )
}

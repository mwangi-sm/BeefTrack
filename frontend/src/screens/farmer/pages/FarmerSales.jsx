import { useState } from 'react'
import { DashboardShell } from '../../../components/DashboardShell'
import { Icon, IconPaths } from '../../../components/icons'
import { getFarmerNavItems } from '../data/farmerNav'

const TRANSFERS = [
  { id: 'TR-2026-001', buyer: 'Greenview Butchery', destination: 'Nairobi', animals: 0, date: 'No active transfer', status: 'Ready' },
]

export function FarmerSales({ fullname = 'there', onToggleTheme, onLogout, onGoDashboard, ...navHandlers }) {
  const [showStartForm, setShowStartForm] = useState(false)
  const [status, setStatus] = useState('')
  const navItems = getFarmerNavItems('sales', navHandlers)

  function handleSubmit(event) {
    event.preventDefault()
    setShowStartForm(false)
    setStatus('Transfer request saved. Add animals from My Animals to continue.')
  }

  return (
    <DashboardShell roleLabel="FARMER" actorId="F-2026-0001" name={fullname} navItems={navItems} onLogout={onLogout} onToggleTheme={onToggleTheme} onProfileClick={navHandlers.onGoProfile} onNotificationsToggle={navHandlers.onGoNotifications}>
      <div className="dash-head">
        <div>
          <p className="eyebrow" style={{ color: 'var(--gold-600)' }}>Farmer workspace</p>
          <h1>Sales & transfers</h1>
          <p className="sub">Prepare animal movements and keep every handoff traceable.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowStartForm((current) => !current)}><Icon size={15}>{IconPaths.plus}</Icon>Start a transfer</button>
      </div>

      {status && <div className="note-banner"><Icon size={20}>{IconPaths.check}</Icon><p>{status}</p></div>}

      {showStartForm && (
        <div className="panel">
          <div className="panel-head"><h3>Start a transfer</h3></div>
          <form onSubmit={handleSubmit}>
            <div className="setup-field-row">
              <div className="field"><label>Buyer or receiving business</label><input required placeholder="e.g. Greenview Butchery" /></div>
              <div className="field"><label>Destination</label><input required placeholder="e.g. Nairobi" /></div>
            </div>
            <div className="field"><label>Transfer notes</label><textarea rows="3" placeholder="Add collection, timing, or handling notes" /></div>
            <div className="setup-actions"><button type="button" className="btn btn-outline" onClick={() => setShowStartForm(false)}>Cancel</button><button type="submit" className="btn btn-primary">Save transfer request</button></div>
          </form>
        </div>
      )}

      <div className="panel">
        <div className="panel-head"><h3>Transfer timeline</h3><span className="flag flag-ok">Traceable</span></div>
        {TRANSFERS.map((transfer) => (
          <div className="transfer-row" key={transfer.id}>
            <div className="transfer-status"><span className="transfer-dot" /><span>{transfer.status}</span></div>
            <div className="transfer-copy"><strong>{transfer.id}</strong><span>{transfer.buyer} · {transfer.destination}</span><small>{transfer.animals} animals · {transfer.date}</small></div>
            <span className="mono">Draft</span>
          </div>
        ))}
      </div>

      <button className="btn btn-outline" onClick={onGoDashboard}>Back to dashboard</button>
    </DashboardShell>
  )
}

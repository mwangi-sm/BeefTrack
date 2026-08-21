import { useState } from 'react'
import { DashboardShell } from '../../../components/DashboardShell'
import { getFarmerNavItems } from '../data/farmerNav'

export function FarmerSettings({ user, fullname = 'there', onToggleTheme, onLogout, onGoDashboard, ...navHandlers }) {
  const [saved, setSaved] = useState(false)
  const [preferences, setPreferences] = useState({ health: true, transfers: true, account: true, reducedMotion: false })
  const toggle = (key) => setPreferences((current) => ({ ...current, [key]: !current[key] }))
  const navItems = getFarmerNavItems('settings', navHandlers)

  function handleSubmit(event) {
    event.preventDefault()
    setSaved(true)
    window.setTimeout(() => setSaved(false), 2600)
  }

  return (
    <DashboardShell roleLabel="FARMER" actorId="F-2026-0001" name={fullname} navItems={navItems} onLogout={onLogout} onToggleTheme={onToggleTheme} onProfileClick={navHandlers.onGoProfile} onNotificationsToggle={navHandlers.onGoNotifications}>
      <div className="dash-head">
        <div><p className="eyebrow" style={{ color: 'var(--gold-600)' }}>Farmer workspace</p><h1>Settings</h1><p className="sub">Control how BeefTrace keeps you informed.</p></div>
      </div>

      <form onSubmit={handleSubmit} className="settings-grid">
        <div className="panel">
          <div className="panel-head"><h3>Notifications</h3></div>
          <label className="settings-toggle"><span><strong>Health reminders</strong><small>Vaccination and veterinary visit updates.</small></span><input type="checkbox" checked={preferences.health} onChange={() => toggle('health')} /></label>
          <label className="settings-toggle"><span><strong>Transfer updates</strong><small>Alerts when an animal movement changes status.</small></span><input type="checkbox" checked={preferences.transfers} onChange={() => toggle('transfers')} /></label>
          <label className="settings-toggle"><span><strong>Account updates</strong><small>Important profile and security notifications.</small></span><input type="checkbox" checked={preferences.account} onChange={() => toggle('account')} /></label>
        </div>
        <div className="panel">
          <div className="panel-head"><h3>Accessibility</h3></div>
          <label className="settings-toggle"><span><strong>Reduce motion</strong><small>Limit decorative movement across the workspace.</small></span><input type="checkbox" checked={preferences.reducedMotion} onChange={() => toggle('reducedMotion')} /></label>
          <div className="settings-detail"><span>Signed in as</span><strong>{user?.email || fullname}</strong></div>
          <div className="settings-detail"><span>Role</span><strong>Farmer</strong></div>
        </div>
        <div className="settings-actions"><button type="button" className="btn btn-outline" onClick={onGoDashboard}>Back to dashboard</button><button type="submit" className="btn btn-primary">Save settings</button>{saved && <span className="settings-saved">Settings saved.</span>}</div>
      </form>
    </DashboardShell>
  )
}

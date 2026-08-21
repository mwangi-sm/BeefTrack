import { DashboardShell } from '../../../components/DashboardShell'
import { Panel } from '../../../components/DashboardBits'
import { Icon, IconPaths } from '../../../components/icons'
import { getFarmerNavItems } from '../data/farmerNav'

const NOTIFICATIONS = [
  { title: 'Keep your animal records current', text: 'Add vaccination and veterinary visit records whenever an animal receives care.', time: 'Today' },
  { title: 'Profile details saved', text: 'Your farmer account is active. You can update your phone number and farm details from Profile.', time: 'Today' },
  { title: 'Welcome to BeefTrace', text: 'Your farm traceability workspace is ready for your first records.', time: 'Recently' },
]

export function FarmerNotifications({ fullname = 'there', onGoDashboard, onToggleTheme, onLogout, ...navHandlers }) {
  const navItems = getFarmerNavItems('notifications', navHandlers)

  return (
    <DashboardShell
      roleLabel="FARMER"
      actorId="F-2026-0001"
      name={fullname}
      navItems={navItems}
      onLogout={onLogout}
      onToggleTheme={onToggleTheme}
      notificationsActive
      onNotificationsToggle={onGoDashboard}
      onProfileClick={navHandlers.onGoProfile}
    >
      <div className="setup-wrap">
        <div className="setup-card">
          <p className="setup-title">Notifications</p>
          <p className="setup-subtitle">Updates and reminders for your farm workspace.</p>
          <div style={{ display: 'grid', gap: 12, marginTop: 24 }}>
            {NOTIFICATIONS.map((notification) => (
              <Panel key={notification.title}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <span style={{ color: 'var(--gold-600)', paddingTop: 2 }}><Icon size={18}>{IconPaths.bell}</Icon></span>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                      <strong>{notification.title}</strong>
                      <span style={{ color: 'var(--ink-500)', fontSize: 12 }}>{notification.time}</span>
                    </div>
                    <p style={{ color: 'var(--ink-600)', fontSize: 13.5, margin: '6px 0 0' }}>{notification.text}</p>
                  </div>
                </div>
              </Panel>
            ))}
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}

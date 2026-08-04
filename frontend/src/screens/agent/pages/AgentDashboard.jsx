//AgentDashboard.jsx code
import { DashboardShell } from '../../../components/DashboardShell'
import { DashHead } from '../../../components/DashHead'
import { StatCard, Panel } from '../../../components/DashboardBits'
import { Icon, IconPaths } from '../../../components/icons'
import { getAgentNavItems } from '../data/agentNav'

export function AgentDashboard({ onLogout, onToggleTheme, onGoTraceabilityLookup, onGoBuyAnimal, onGoReceiveAnimal }) {
  const navItems = getAgentNavItems('dashboard', { onGoHome: () => {} })

  return (
    <DashboardShell
      roleLabel="AGENT"
      actorId="AG-000123"
      name="Samuel Otieno"
      navItems={navItems}
      onLogout={onLogout}
      onToggleTheme={onToggleTheme}
      variant="home"
    >
      <DashHead
        greeting="Good morning, Samuel"
        title="Dashboard"
        subtitle="Your stock, purchases and dispatches at a glance."
        actions={
          <>
            <button className="btn btn-outline" onClick={onGoTraceabilityLookup}>
              <Icon size={15} style={{ marginRight: 2 }}>{IconPaths.qr}</Icon>Traceability lookup
            </button>
            <button className="btn btn-outline" onClick={onGoBuyAnimal}>
              <Icon size={15} style={{ marginRight: 2 }}>{IconPaths.cart}</Icon>Buy animal
            </button>
            <button className="btn btn-primary" onClick={onGoReceiveAnimal}>
              <Icon size={15} style={{ marginRight: 2 }}>{IconPaths.animal}</Icon>Receive animal
            </button>
          </>
        }
      />

      <div className="stat-grid">
        <StatCard icon={IconPaths.animal} flagText="In stock" value={0} label="Animals in inventory" />
        <StatCard icon={IconPaths.sales} flagText="Awaiting farmer" value={0} label="Pending purchases" />
        <StatCard icon={IconPaths.truck} flagText="Needs transporter" value={0} label="Pending dispatch" />
        <StatCard icon={IconPaths.sales} flagText="This month" value={0} label="Completed transactions" />
      </div>

      <div className="grid-2col">
        <div>
          <Panel title="Pending purchases" action={<a href="#" className="link">View all</a>}>
            <p style={{ color: 'var(--ink-600)', fontSize: 13.5 }}>No pending purchases.</p>
          </Panel>

          <Panel title="Recent activity" action={<a href="#" className="link">View all</a>}>
            <p style={{ color: 'var(--ink-600)', fontSize: 13.5 }}>No recent activity yet.</p>
          </Panel>
        </div>

        <div>
          <Panel title="Ready for dispatch" action={<a href="#" className="link">Assign transporter</a>}>
            <p style={{ color: 'var(--ink-600)', fontSize: 13.5 }}>No animals waiting on dispatch.</p>
          </Panel>
        </div>
      </div>
    </DashboardShell>
  )
}

//FarmerDashboard.jsx code
import { DashboardShell } from '../../../components/DashboardShell'
import { DashHead } from '../../../components/DashHead'
import { StatCard, Panel, InventoryRow } from '../../../components/DashboardBits'
import { OnboardingSteps } from '../components/OnboardingSteps'
import { Icon, IconPaths } from '../../../components/icons'
import { getFarmerNavItems } from '../data/farmerNav'
export function FarmerDashboard({
  onLogout,
  onToggleTheme,
  farms,
  animalsCount,
  setup,
  onGoProfileSetup,
  onGoFarmSetup,
  onGoTraceabilityLookup,
  onGoAnimalSetup,
  onGoHealthRecords,
  onGoMyFarms,
  onGoMyAnimals,
  onGoSales,
  onGoNotBuilt,
}) {
  const navItems = getFarmerNavItems('home', {
    onGoHome: () => {},
    onGoFarmSetup,
    onGoTraceabilityLookup,
    onGoAnimalSetup,
    onGoMyFarms,
    onGoMyAnimals,
    onGoHealthRecords,
    onGoSales,
    onGoNotBuilt,
  })

  const steps = [
    { label: 'Setup farmer profile', done: setup.profile, onClick: onGoProfileSetup },
    { label: 'Enroll new farm', done: setup.farm, onClick: onGoFarmSetup },
    { label: 'Enroll new animal', done: setup.animal, onClick: onGoAnimalSetup },
  ]

  return (
    <DashboardShell
      roleLabel="FARMER"
      actorId="F-2026-0001"
      name="Wanjiku Mwangi"
      navItems={navItems}
      onLogout={onLogout}
      onToggleTheme={onToggleTheme}
      variant="home"
    >
      <DashHead
        greeting="Good morning, Wanjiku"
        title="Dashboard"
        subtitle="Here's where things stand across your farms today."
        actions={
          <>
            <button className="btn btn-outline" onClick={onGoTraceabilityLookup}>
              <Icon size={15} style={{ marginRight: 2 }}>{IconPaths.qr}</Icon>Traceability lookup
            </button>
            <button className="btn btn-outline" onClick={onGoFarmSetup}>
              <Icon size={15} style={{ marginRight: 2 }}>{IconPaths.plus}</Icon>Enroll new farm
            </button>
            <button className="btn btn-primary" onClick={onGoAnimalSetup}>
              <Icon size={15} style={{ marginRight: 2 }}>{IconPaths.plus}</Icon>Enroll new animal
            </button>
          </>
        }
      />

      <OnboardingSteps steps={steps} />

      <div className="stat-grid">
        <StatCard icon={IconPaths.farm} flagText="Active" value={farms.length} label="Current farms" />
        <StatCard icon={IconPaths.animal} flagText="RFID-tagged" value={animalsCount} label="Animals enrolled" />
        <StatCard icon={IconPaths.sales} flagText="Awaiting buyer" value={0} label="Pending sales" />
        <StatCard icon={IconPaths.health} flagText="Scheduled" value={0} label="Upcoming vaccinations / vet visits" />
      </div>

      <div className="grid-2col">
        <div>
          <Panel title="Upcoming care" action={<a href="#" className="link">View all records</a>}>
            <p style={{ color: 'var(--ink-600)', fontSize: 13.5 }}>No upcoming vaccinations or vet visits scheduled.</p>
          </Panel>

          <Panel title="Recent activity" action={<a href="#" className="link">View all</a>}>
            <p style={{ color: 'var(--ink-600)', fontSize: 13.5 }}>No recent activity yet.</p>
          </Panel>
        </div>

        <div>
          <Panel title="My farms" action={<a href="#" className="link" onClick={(e) => { e.preventDefault(); onGoMyFarms() }}>Manage</a>}>
            {farms.length === 0 ? (
              <p style={{ color: 'var(--ink-600)', fontSize: 13.5 }}>You haven't registered any farms yet.</p>
            ) : (
              farms.map((f) => (
                <InventoryRow
                  key={f.id}
                  icon={IconPaths.farm}
                  name={f.name}
                  sub={f.county ? `${f.county} · ${f.id}` : f.id}
                  count={f.animalCount != null ? `${f.animalCount} head` : ''}
                />
              ))
            )}
          </Panel>

          <Panel title="Pending sales" action={<a href="#" className="link">View all</a>}>
            <p style={{ color: 'var(--ink-600)', fontSize: 13.5 }}>No pending sales.</p>
          </Panel>
        </div>
      </div>
    </DashboardShell>
  )
}

//FarmerDashboard.jsx code
import { DashboardShell } from '../../../components/DashboardShell'
import { DashHead } from '../../../components/DashHead'
import { StatCard, Panel, InventoryRow } from '../../../components/DashboardBits'
import { OnboardingSteps } from '../components/OnboardingSteps'
import { FarmerLoadingStrip } from '../components/FarmerLoadingStrip'
import { FarmerDashboardSkeleton } from '../components/FarmerDashboardSkeleton'
import { Icon, IconPaths } from '../../../components/icons'
import { getFarmerNavItems } from '../data/farmerNav'
import { StrokeText, TextType, SplitText, ScrollFloat } from '../../../components/reactbits'

const FARM_STATUS_MESSAGES = [
  "Here's where things stand across your farms today.",
  'Your animal records are up to date.',
  'Tracking every animal from farm to trace.',
]

export function FarmerDashboard({
  onLogout,
  onToggleTheme,
  fullname = 'there',
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
  onGoNotBuilt,
  onGoNotifications,
  onGoProfile,
  isLoading = false,
  onGoSales,
  onGoSettings,
}) {
  const navItems = getFarmerNavItems('home', {
    onGoHome: () => {},
    onGoFarmSetup,
    onGoTraceabilityLookup,
    onGoAnimalSetup,
    onGoMyFarms,
    onGoMyAnimals,
    onGoHealthRecords,
    onGoNotBuilt,
    onGoSales,
    onGoSettings,
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
      name={fullname}
      navItems={navItems}
      onLogout={onLogout}
      onToggleTheme={onToggleTheme}
      onNotificationsToggle={onGoNotifications}
      onProfileClick={onGoProfile}
      variant="home"
    >
      <DashHead
        greeting={`Good morning, ${fullname}`}
        title={
          <StrokeText
            as="span"
            text="Your Farm. Your Livestock. Your Trace."
            strokeColor="var(--gold-600)"
            fillColor="var(--ink-900)"
            strokeWidth={1.1}
            drawDuration={1}
            fillDelay={0.12}
            stagger={0.02}
            fontSize={38}
            fontWeight={700}
            letterSpacing={-1}
          />
        }
        subtitle={<TextType text={FARM_STATUS_MESSAGES} typingSpeed={35} pauseDuration={2600} />}
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

      {isLoading && <FarmerLoadingStrip />}

      {isLoading ? <FarmerDashboardSkeleton /> : <>
        <OnboardingSteps steps={steps} />

        <div className="stat-grid">
          <StatCard icon={IconPaths.farm} flagText="Active" value={farms.length} label="Current farms" />
          <StatCard icon={IconPaths.animal} flagText="RFID-tagged" value={animalsCount} label="Animals enrolled" />
          <StatCard icon={IconPaths.sales} flagText="Awaiting buyer" value={0} label="Pending sales" />
          <StatCard icon={IconPaths.health} flagText="Scheduled" value={0} label="Upcoming vaccinations / vet visits" />
        </div>

        <div className="grid-2col">
        <div>
          <Panel title={<SplitText tag="span" text="Upcoming care" splitType="words" duration={0.4} />} action={<a href="#" className="link">View all records</a>}>
            <p style={{ color: 'var(--ink-600)', fontSize: 13.5 }}>No upcoming vaccinations or vet visits scheduled.</p>
          </Panel>

          <Panel title={<SplitText tag="span" text="Recent activity" splitType="words" duration={0.4} />} action={<a href="#" className="link">View all</a>}>
            <p style={{ color: 'var(--ink-600)', fontSize: 13.5 }}>No recent activity yet.</p>
          </Panel>
        </div>

        <div>
          <Panel
            title={<ScrollFloat tag="span" text="My farms" animationDuration={0.5} stagger={0.02} />}
            action={<a href="#" className="link" onClick={(e) => { e.preventDefault(); onGoMyFarms() }}>Manage</a>}
          >
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
                  onClick={onGoMyFarms}
                />
              ))
            )}
          </Panel>

          <Panel title={<SplitText tag="span" text="Pending sales" splitType="words" duration={0.4} />} action={<a href="#" className="link">View all</a>}>
            <p style={{ color: 'var(--ink-600)', fontSize: 13.5 }}>No pending sales.</p>
          </Panel>
        </div>
        </div>
      </>}
    </DashboardShell>
  )
}